import { providerHosts } from "./provider-hosts.js";
import type { HarEntry } from "./types.js";

// Structurally @apicity/cost's ProviderExchange. Declared here so neither
// package imports the other.
export interface ProviderExchange {
  provider: string;
  dotPath?: string;
  method: string;
  url: string;
  status: number;
  requestBody: Record<string, unknown> | null;
  responseHeaders: Record<string, string>;
  responseBody: unknown;
  bodyTruncated?: boolean;
  responseCut?: boolean;
  /** Incomplete stream framing/final usage, or an unparseable JSON response. */
  streamIncomplete?: boolean;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function requestBodyOf(entry: HarEntry): Record<string, unknown> | null {
  const text = entry.request.postData?.text;
  if (!text) return null;
  const parsed = parseJson(text);
  // A placeholder keeps only the size and hash of a body the capture dropped.
  if (!isObject(parsed) || "_apicity_placeholder" in parsed) return null;
  return parsed;
}

function responseText(entry: HarEntry): string | undefined {
  const { text, encoding } = entry.response.content ?? {};
  if (!text) return undefined;
  return encoding === "base64"
    ? Buffer.from(text, "base64").toString("utf8")
    : text;
}

function sseFrames(text: string): unknown[] {
  const frames: unknown[] = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.startsWith("data:")) continue;
    const frame = parseJson(line.slice("data:".length).trim());
    if (frame !== undefined) frames.push(frame);
  }
  return frames;
}

function responseBodyOf(entry: HarEntry): unknown {
  const text = responseText(entry);
  const mime = (entry.response.content?.mimeType ?? "").toLowerCase();
  if (text === undefined) {
    // A stream cut before its first byte is still a stream that stopped short.
    return mime.includes("event-stream") && entry._apicity?.bodyTruncated
      ? []
      : null;
  }
  const leading = text.trimStart();
  if (
    mime.includes("event-stream") ||
    leading.startsWith("event:") ||
    leading.startsWith("data:")
  ) {
    return sseFrames(text);
  }
  const parsed = parseJson(text);
  if (parsed === undefined) return null;
  return isObject(parsed) && "_apicity_placeholder" in parsed ? null : parsed;
}

function providerFromUrl(url: string): string {
  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    return "";
  }
  for (const [provider, hosts] of Object.entries(providerHosts)) {
    if (hosts.some((h) => host === h || host.endsWith(`.${h}`))) {
      return provider;
    }
  }
  return "";
}

/**
 * Turns one HAR entry into the exchange shape @apicity/cost's extractActual
 * reads: lower-cased header names, parsed JSON or SSE frames, and a null request
 * body for a captured placeholder. `meta.provider` wins over the provider this
 * infers from the host.
 */
export function entryToProviderExchange(
  entry: HarEntry,
  meta?: { provider?: string; dotPath?: string }
): ProviderExchange {
  const responseHeaders: Record<string, string> = {};
  for (const header of entry.response.headers ?? []) {
    responseHeaders[header.name.toLowerCase()] = header.value;
  }
  return {
    provider: meta?.provider ?? providerFromUrl(entry.request.url),
    ...(meta?.dotPath !== undefined ? { dotPath: meta.dotPath } : {}),
    method: entry.request.method,
    url: entry.request.url,
    status: entry.response.status,
    requestBody: requestBodyOf(entry),
    responseHeaders,
    responseBody: responseBodyOf(entry),
    ...(entry._apicity?.bodyTruncated ? { bodyTruncated: true } : {}),
    ...(entry._apicity?.responseCut ? { responseCut: true } : {}),
    ...(entry._apicity?.streamIncomplete ? { streamIncomplete: true } : {}),
  };
}
