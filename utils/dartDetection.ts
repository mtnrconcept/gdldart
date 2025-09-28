import Constants from 'expo-constants';
import { DartDetectionResult, RawDartDetection } from '@/types/dartDetection';

const DEFAULT_ENDPOINT = 'https://deep-darts.fly.dev/api/detect';

export class DartDetectionError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = 'DartDetectionError';
  }
}

const toDataUri = (image: string) => (image.startsWith('data:') ? image : 'data:image/jpeg;base64,' + image);

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

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value);

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1']);

const isLocalHostname = (value?: string) => {
  if (!value) return false;
  const lower = value.toLowerCase();
  return LOCAL_HOSTNAMES.has(lower) || lower.endsWith('.localhost');
};

const getExpoDevHost = () => {
  const expoGo = Constants.expoGoConfig as { debuggerHost?: string; hostUri?: string } | undefined;
  const expoConfig = Constants.expoConfig as { hostUri?: string } | undefined;
  const manifest = (Constants as unknown as { manifest?: { debuggerHost?: string; hostUri?: string } }).manifest;
  const candidates = [
    expoGo?.debuggerHost,
    expoGo?.hostUri,
    expoConfig?.hostUri,
    manifest?.debuggerHost,
    manifest?.hostUri,
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    const host = candidate.split('://').pop() ?? candidate;
    const [hostname] = host.split(':');
    if (hostname && !isLocalHostname(hostname)) {
      return hostname;
    }
  }

  return undefined;
};

const isLikelyIpAddress = (value: string) => {
  if (!value) return false;
  const ipv4 = /^(?:\d{1,3}\.){3}\d{1,3}$/;
  const ipv6 = /^(?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}$/i;
  return ipv4.test(value) || ipv6.test(value);
};

const isLikelyLanHostname = (value: string) => {
  if (!value) return false;
  return isLikelyIpAddress(value) || value.endsWith('.local');
};

const rewriteLocalhostUrl = (url: URL) => {
  if (!isLocalHostname(url.hostname)) {
    return url;
  }

  const expoHost = getExpoDevHost();
  if (!expoHost || !isLikelyLanHostname(expoHost)) {
    if (expoHost && !isLikelyLanHostname(expoHost)) {
      console.warn(
        "L'hôte Expo détecté ne ressemble pas à une IP locale. Conservation de 'localhost' pour éviter une requête tunnel impossible.",
        {
          original: url.hostname,
          detectedHost: expoHost,
        }
      );
    }
    return url;
  }

  console.warn('Remplacement de l\'hôte "localhost" par l\'IP Expo détectée pour la détection.', {
    original: url.hostname,
    replacement: expoHost,
  });

  url.hostname = expoHost;
  return url;
};

const resolveEndpoint = (endpoint: string) => {
  if (!endpoint) {
    return endpoint;
  }

  if (isAbsoluteUrl(endpoint)) {
    try {
      const url = rewriteLocalhostUrl(new URL(endpoint));
      return url.toString();
    } catch (error) {
      console.warn("Impossible d'analyser l'URL absolue fournie pour la détection.", {
        endpoint,
        error,
      });
      return endpoint;
    }
  }

  if (typeof window !== 'undefined' && window.location) {
    try {
      return new URL(endpoint, window.location.origin).toString();
    } catch (error) {
      console.warn('Impossible de résoudre l\'URL de détection à partir de la fenêtre courante.', {
        endpoint,
        origin: window.location.origin,
        error,
      });
    }
  }

  const expoHost = getExpoDevHost();
  if (expoHost) {
    const base = `http://${expoHost}`;
    try {
      return new URL(endpoint, base).toString();
    } catch (error) {
      console.warn("Impossible de résoudre l'URL de détection à partir de l'IP Expo détectée.", {
        endpoint,
        expoHost,
        error,
      });
    }
  }

  return endpoint;
};

const getConfiguredEndpoint = () => {
  const extra = Constants.expoConfig?.extra as { dartDetection?: { endpoint?: string } } | undefined;
  const fromExtra = extra?.dartDetection?.endpoint;
  const fromEnv = process.env.EXPO_PUBLIC_DART_DETECTION_URL;
  return fromEnv ?? fromExtra ?? DEFAULT_ENDPOINT;
};

export const detectDarts = async (
  base64Image: string,
  options?: { signal?: AbortSignal }
): Promise<DartDetectionResult[]> => {
  const endpoint = getConfiguredEndpoint();
  if (!endpoint) {
    throw new DartDetectionError('Aucun endpoint de d\u00E9tection de fl\u00E9chettes n\'est configur\u00E9.');
  }

  const resolvedEndpoint = resolveEndpoint(endpoint);

  console.log('Envoi de l\'image pour détection...', {
    endpoint,
    resolvedEndpoint,
    imageSize: base64Image.length,
  });

  try {
    const response = await fetch(resolvedEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ image: toDataUri(base64Image) }),
      signal: options?.signal,
      cache: 'no-store',
    });

    console.log('Réponse du serveur:', response.status, response.statusText);

    if (!response.ok) {
      const text = await response.text();
      console.error('Erreur serveur:', text);
      throw new DartDetectionError('\u00C9chec de la d\u00E9tection (HTTP ' + response.status + ')', text);
    }

    const payload = await response.json();
    console.log('Payload reçu:', payload);
    const detections: unknown = payload?.detections ?? payload?.darts ?? payload?.results ?? payload;

    if (!Array.isArray(detections)) {
      console.log('Aucune détection trouvée');
      return [];
    }

    const results = detections
      .map((item) => toDetectionResult(item as RawDartDetection))
      .filter((item): item is DartDetectionResult => Boolean(item));
    
    console.log('Détections traitées:', results.length);
    return results;
  } catch (error) {
    console.error('Erreur lors de la détection:', error);
    if (error instanceof DartDetectionError) {
      throw error;
    }
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    const networkErrors = new Set(['Failed to fetch', 'Network request failed']);
    const reason =
      error instanceof TypeError && networkErrors.has(error.message)
        ? "Impossible de contacter le service de détection à l'URL " +
          resolvedEndpoint +
          ". Vérifiez votre connexion réseau ou mettez à jour la variable EXPO_PUBLIC_DART_DETECTION_URL pour pointer vers un service accessible."
        : 'Impossible de contacter le service de détection.';

    throw new DartDetectionError(reason, error);
  }
};
