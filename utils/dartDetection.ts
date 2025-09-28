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

  console.log('Envoi de l\'image pour détection...', { endpoint, imageSize: base64Image.length });

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: toDataUri(base64Image) }),
      signal: options?.signal,
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
    throw new DartDetectionError('Impossible de contacter le service de d\u00E9tection.', error);
  }
};
