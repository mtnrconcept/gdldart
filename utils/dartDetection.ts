import Constants from 'expo-constants';
import { DartDetectionResult, RawDartDetection } from '@/types/dartDetection';

export class DartDetectionError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = 'DartDetectionError';
  }
}

const DEFAULT_ENDPOINT = 'https://deep-darts.fly.dev/api/detect';

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
    throw new DartDetectionError(
      `URL de détection invalide. Configure EXPO_PUBLIC_DART_DETECTION_URL (ex: http://192.168.0.18:8000/api/detect).`
    );
  }

  cachedDetectUrl = resolved;
  return resolved;
}

async function fetchWithTimeout(
  input: RequestInfo,
  init: RequestInit & { timeoutMs?: number } = {}
) {
  const { timeoutMs = 25000, ...rest } = init;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(input, { ...rest, signal: ctrl.signal });
    return res;
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
  try {
    const image = payload.image.replace(/^data:image\/\w+;base64,/, '');

    const detectUrl = resolveDetectUrl();

    const res = await fetchWithTimeout(detectUrl, {
      method: 'POST',
      headers: buildJsonHeaders(token),
      body: JSON.stringify({ ...payload, image }),
      timeoutMs: 25000,
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new DartDetectionError(
        `Le service a répondu ${res.status}. ${txt?.slice(0, 200) || ''}`.trim()
      );
    }

    const body = await res.json();
    const detections: unknown = body?.detections ?? body?.darts ?? body?.results ?? body;

    if (!Array.isArray(detections)) {
      return [];
    }

    return detections
      .map((item) => toDetectionResult(item as RawDartDetection))
      .filter((item): item is DartDetectionResult => Boolean(item));
  } catch (err: any) {
    if (err instanceof DartDetectionError) {
      throw err;
    }
    if (err?.name === 'AbortError') {
      throw new DartDetectionError('Délai dépassé (timeout) lors de la détection.', err);
    }
    let endpoint = 'inconnue';
    try {
      endpoint = resolveDetectUrl();
    } catch (resolutionError) {
      if (resolutionError instanceof DartDetectionError) {
        throw resolutionError;
      }
    }
    throw new DartDetectionError(
      `Impossible de contacter le service de détection à l'URL ${endpoint}. Vérifiez le réseau / l’URL.`,
      err
    );
  }
}
