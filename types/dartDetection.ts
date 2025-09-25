export interface DartDetectionResult {
  x: number;
  y: number;
  score: number;
  sector: string;
  confidence: number;
  raw?: unknown;
}

export interface RawDartDetection {
  x?: number;
  y?: number;
  score?: number;
  baseScore?: number;
  multiplier?: string;
  sector?: string;
  confidence?: number;
  probability?: number;
  position?: { x?: number; y?: number };
  point?: { x?: number; y?: number };
  ring?: string;
  normalized?: boolean;
  [key: string]: unknown;
}