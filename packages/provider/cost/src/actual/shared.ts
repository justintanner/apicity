import type { ActualUsage, ProviderExchange } from "../types";

// What a family extractor reads from one exchange. extractActual adds the
// rate-derived figure and the basis.
export interface Extracted {
  usage: ActualUsage;
  evidence: string[];
  statedUsd?: number;
  statedListUsd?: number;
  // Defaults to true: a response with no later read has nothing more to say.
  settled?: boolean;
  model?: string;
  warnings?: string[];
  // Billed on a tier the bundled rates do not cover.
  serviceTier?: string;
  // A 1-hour cache write is billed at a rate no bundled row has.
  unpricedCacheWrite?: boolean;
}

export type Extractor = (exchange: ProviderExchange) => Extracted;

export const SUBMIT_PENDING =
  "this response reports no final usage; read the terminal response";

export const NOTHING_REPORTED = "this response reports no usage or charge";

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function asFiniteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

export function get(value: unknown, path: string): unknown {
  let current = value;
  for (const key of path.split(".")) {
    if (!isObject(current)) return undefined;
    current = current[key];
  }
  return current;
}

export function numberAt(value: unknown, path: string): number | undefined {
  return asFiniteNumber(get(value, path));
}

// One JSON body, or the SSE data frames in order.
export function framesOf(body: unknown): unknown[] {
  return Array.isArray(body) ? body : body === undefined ? [] : [body];
}

export function headerNumber(
  exchange: ProviderExchange,
  name: string
): number | undefined {
  const raw = exchange.responseHeaders[name];
  if (raw === undefined || raw.trim() === "") return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

export function modelFrom(exchange: ProviderExchange): string | undefined {
  const fromRequest =
    exchange.requestBody?.model ?? exchange.requestBody?.model_id;
  if (typeof fromRequest === "string") return fromRequest;
  for (const frame of [...framesOf(exchange.responseBody)].reverse()) {
    for (const path of ["model", "response.model", "message.model"]) {
      const value = get(frame, path);
      if (typeof value === "string") return value;
    }
  }
  return undefined;
}

export function pathOf(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url.split("?")[0] ?? url;
  }
}

export function setNumber(
  out: Extracted,
  key: keyof ActualUsage,
  value: number | undefined,
  evidence: string
): void {
  if (value === undefined) return;
  out.usage[key] = value;
  out.evidence.push(evidence);
}
