export type ExtractResult<T> =
  | { ok: true; data: T }
  | { ok: false; warnings: string[] };

export interface TextExtract {
  model: string;
  text: string;
  maxOutputTokens?: number;
}
