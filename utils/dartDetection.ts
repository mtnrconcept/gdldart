import Constants from 'expo-constants';
import { DartDetectionResult, RawDartDetection } from '@/types/dartDetection';

export class DartDetectionError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = 'DartDetectionError';
  }
}

const DEFAULT_ENDPOINT = 'https://deep-darts.fly.dev/api/detect';
const REQUEST_TIMEOUT_MS = 30000;
const MAX_RETRIES = 2;

type ExtraConfig = Record<string, unknown> | undefined | null;

const extraProviders: Array<() => ExtraConfig> = [
  () => (Constants?.expoConfig?.extra as ExtraConfig) ?? null,
  () => (Constants as any)?.expoGoConfig?.extra ?? null,
  () => (Constants as any)?.manifest?.extra ?? null,
  () => (Constants as any)?.manifest2?.extraParams ?? null,
];

const isValidUrl = (value?: string | null): value is string =>
  typeof value === 'string' && /^https?:\/\/.+/i.test(value);

let cachedDetectUrl: string | null = null;

function resolveDetectUrl(): string {
  if (cachedDetectUrl) {
    console.log('[URL] Utilisation de l\'URL en cache:', cachedDetectUrl);
    return cachedDetectUrl;
  }

  const fromExtras = extraProviders
    .map((provider) => {
      const extra = provider();
      if (!extra) return undefined;
      const extraRecord = extra as Record<string, unknown>;
      const direct = extraRecord.dartDetectionUrl as string | undefined;
      const nested = (extraRecord.dartDetection as { endpoint?: string } | undefined)?.endpoint;
      const expoPublic = extraRecord.EXPO_PUBLIC_DART_DETECTION_URL as string | undefined;
      return direct ?? nested ?? expoPublic;
    })
    .find((candidate) => isValidUrl(candidate));

  const envUrl = process.env.EXPO_PUBLIC_DART_DETECTION_URL;

  const resolved =
    fromExtras ??
    (isValidUrl(envUrl) ? envUrl : null) ??
    (isValidUrl(DEFAULT_ENDPOINT) ? DEFAULT_ENDPOINT : null);

  if (!resolved) {
    const errorMsg = `URL de détection invalide. Configure EXPO_PUBLIC_DART_DETECTION_URL (ex: http://192.168.1.10:8000/api/detect).\n\nPour trouver l'IP de votre serveur:\n- Sur le serveur, exécutez: ipconfig (Windows) ou ifconfig (Mac/Linux)\n- Utilisez l'adresse IPv4 du réseau local\n- Assurez-vous que le serveur Python est démarré sur le port 8000`;
    throw new DartDetectionError(errorMsg);
  }

  console.log('[URL] URL de détection résolue:', resolved);
  cachedDetectUrl = resolved;
  return resolved;
}

async function fetchWithTimeout(
  input: RequestInfo,
  init: RequestInit & { timeoutMs?: number } = {}
) {
  const { timeoutMs = REQUEST_TIMEOUT_MS, ...rest } = init;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(input, { ...rest, signal: ctrl.signal });
    return res;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('timeout');
    }
    throw error;
  } finally {
    clearTimeout(t);
  }
}

function buildJsonHeaders(token?: string): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

const normalizeMultiplier = (value?: string) => {
  if (!value) return 'simple';
  const lower = value.toLowerCase();
  if (lower.startsWith('d')) return 'double';
  if (lower.startsWith('t')) return 'triple';
  if (lower.includes('bull') && lower.includes('double')) return 'bull-double';
  if (lower.includes('bull')) return 'bull';
  return lower;
};

const computeScore = (baseScore: number, multiplier: string, providedScore?: number) => {
  if (Number.isFinite(providedScore) && (providedScore as number) > 0) {
    return providedScore as number;
  }

  if (baseScore === 25 && multiplier.includes('double')) {
    return 50;
  }
  if (baseScore === 25 || multiplier.startsWith('bull')) {
    return multiplier.includes('double') ? 50 : 25;
  }

  const factor = multiplier === 'double' ? 2 : multiplier === 'triple' ? 3 : 1;
  return baseScore * factor;
};

const computeSector = (score: number, baseScore: number, multiplier: string, providedSector?: string) => {
  if (providedSector) return providedSector;

  if (score === 50) return 'Bull double';
  if (score === 25) return 'Bull simple';

  const value = baseScore || score;
  switch (multiplier) {
    case 'double':
      return 'Double ' + value;
    case 'triple':
      return 'Triple ' + value;
    default:
      return 'Simple ' + value;
  }
};

const toDetectionResult = (detection: RawDartDetection): DartDetectionResult | null => {
  const position = detection.position ?? detection.point ?? {};
  const x = detection.x ?? position.x;
  const y = detection.y ?? position.y;

  if (typeof x !== 'number' || typeof y !== 'number') {
    return null;
  }

  const baseScore = detection.baseScore ?? detection.score ?? detection.value ?? 0;
  const multiplier = normalizeMultiplier(detection.multiplier ?? (detection.ring as string | undefined));
  const score = computeScore(Number(baseScore), multiplier, detection.score);
  const sector = computeSector(score, Number(baseScore), multiplier, detection.sector as string | undefined);
  const confidence = Math.max(0, Math.min(1, Number(detection.confidence ?? detection.probability ?? 0)));

  return {
    x,
    y,
    score,
    sector,
    confidence,
    raw: detection,
  };
};

export type DetectPayload = {
  image: string;
  width?: number;
  height?: number;
  mode?: '501' | '301';
};

export async function detectDarts(payload: DetectPayload, token?: string) {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const image = payload.image.replace(/^data:image\/\w+;base64,/, '');
      const detectUrl = resolveDetectUrl();

      if (attempt === 0) {
        console.log('[API] Tentative de connexion au service:', detectUrl);
      } else {
        console.log(`[API] Nouvelle tentative ${attempt}/${MAX_RETRIES}...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }

      const res = await fetchWithTimeout(detectUrl, {
        method: 'POST',
        headers: buildJsonHeaders(token),
        body: JSON.stringify({ ...payload, image }),
        timeoutMs: REQUEST_TIMEOUT_MS,
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        const errorMsg = `Le service a répondu ${res.status}. ${txt?.slice(0, 200) || ''}`.trim();
        console.error('[API] Erreur HTTP:', errorMsg);
        throw new DartDetectionError(errorMsg);
      }

      console.log('[API] Réponse reçue avec succès');
      const body = await res.json();
      const detections: unknown = body?.detections ?? body?.darts ?? body?.results ?? body;

      if (!Array.isArray(detections)) {
        console.log('[API] Aucune détection dans la réponse');
        return [];
      }

      console.log(`[API] ${detections.length} détection(s) trouvée(s)`);
      return detections
        .map((item) => toDetectionResult(item as RawDartDetection))
        .filter((item): item is DartDetectionResult => Boolean(item));
    } catch (err: any) {
      lastError = err;

      if (err instanceof DartDetectionError) {
        if (attempt === MAX_RETRIES) {
          throw err;
        }
        continue;
      }

      if (err?.message === 'timeout') {
        console.error(`[API] Timeout tentative ${attempt + 1}/${MAX_RETRIES + 1}`);
        if (attempt === MAX_RETRIES) {
          throw new DartDetectionError(
            `Délai dépassé après ${MAX_RETRIES + 1} tentatives. Le service met trop de temps à répondre. Vérifiez votre connexion réseau.`,
            err
          );
        }
        continue;
      }

      if (err?.message?.includes('Network request failed')) {
        console.error(`[API] Erreur réseau tentative ${attempt + 1}/${MAX_RETRIES + 1}`);
        if (attempt === MAX_RETRIES) {
          let endpoint = 'inconnue';
          try {
            endpoint = resolveDetectUrl();
          } catch (resolutionError) {
            if (resolutionError instanceof DartDetectionError) {
              throw resolutionError;
            }
          }
          throw new DartDetectionError(
            `Impossible de contacter le service à ${endpoint}.\n\nVérifications:\n1. Le serveur Python est-il démarré ?\n2. Votre téléphone est-il sur le même réseau WiFi ?\n3. L'URL est-elle correcte ?`,
            err
          );
        }
        continue;
      }

      if (attempt === MAX_RETRIES) {
        throw new DartDetectionError(
          `Erreur inattendue: ${err?.message || 'Erreur inconnue'}`,
          err
        );
      }
    }
  }

  throw lastError || new DartDetectionError('Erreur inconnue lors de la détection');
}
