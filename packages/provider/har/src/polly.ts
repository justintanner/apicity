import { createHash } from "node:crypto";
import { stableStringify } from "./persist.js";
import type { HarEntry } from "./types.js";

export interface PollyIdentityOptions {
  /** Match the recording's matchRequestsBy configuration. */
  excludeHeaders?: string[];
  headers?: boolean;
  body?: boolean;
}
const DEFAULT_EXCLUDED_HEADERS = [
  "authorization",
  "user-agent",
  "x-api-key",
  "xi-api-key",
  "x-dashscope-ossresourceresolve",
  "x-goog-api-key",
  "x-amz-date",
  "x-amz-security-token",
];

/** Polly's default harness identity; custom matchRequestsBy needs matching options. */
export function pollyEntryId(
  entry: Pick<HarEntry, "request">,
  options: PollyIdentityOptions = {}
): string {
  const request = entry.request;
  const url = new URL(request.url);
  const query = Object.fromEntries(url.searchParams);
  url.search = "";
  for (const key of Object.keys(query).sort())
    url.searchParams.set(key, query[key]);
  const identifiers: Record<string, unknown> = {
    method: request.method.toUpperCase(),
    url: url.href,
  };
  if (options.headers !== false) {
    const excluded = new Set(
      options.excludeHeaders ?? DEFAULT_EXCLUDED_HEADERS
    );
    identifiers.headers = Object.fromEntries(
      request.headers
        .filter((h) => !excluded.has(h.name.toLowerCase()))
        .map((h) => [h.name.toLowerCase(), h.value])
    );
  }
  if (options.body !== false && request.postData?.text)
    identifiers.body = request.postData.text;
  return createHash("md5").update(stableStringify(identifiers)!).digest("hex");
}

/** Polly guid-for-recording: FNV-1a over UTF-8, sanitized slug capped at 100 chars. */
export function pollyRecordingDir(name: string): string {
  return name
    .split("/")
    .map((segment) => {
      let hash = 2166136261;
      for (const byte of new TextEncoder().encode(segment))
        hash = Math.imul(hash ^ byte, 16777619) >>> 0;
      const suffix = String(hash);
      const slug = segment.replace(/\W/g, "-").slice(0, 99 - suffix.length);
      return `${slug}_${suffix}`;
    })
    .join("/");
}
