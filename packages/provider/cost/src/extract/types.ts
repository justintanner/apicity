export type ExtractResult<T> =
  | { ok: true; data: T }
  | { ok: false; warnings: string[] };

export interface TextExtract {
  model: string;
  text: string;
  maxOutputTokens?: number;
}

export interface KieRateExtract {
  rateKey: string;
  units: number;
}

export interface ElevenLabsExtract {
  model: string;
  characters: number;
}
