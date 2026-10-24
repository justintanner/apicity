import { createHash } from "node:crypto";
import {
  summarizeJsonMediaStrings,
  summarizeMultipartFormData,
} from "./persist.js";
import { scrubEntry } from "./scrub.js";
import type {
  HarEntry,
  HarNameValue,
  HarTimings,
  ApicityEntryMetadata,
} from "./types.js";

export interface ExchangeTiming {
  startedAt: string | Date;
  durationMs: number;
  timings?: Partial<HarTimings>;
}
export interface ExchangeOptions {
  maxBodyBytes?: number;
  streamed?: boolean;
  role?: ApicityEntryMetadata["role"];
}
interface SerializedBody {
  text: string;
  bytes: number;
  truncated: boolean;
}
const DEFAULT_MAX_BODY_BYTES = 262144;

function headers(value: Headers): HarNameValue[] {
  return Array.from(value, ([name, value]) => ({ name, value }));
}

async function serializeBody(
  message: Request | Response,
  max: number,
  streamed: boolean
): Promise<SerializedBody> {
  const contentType =
    message.headers.get("content-type") ?? "application/octet-stream";
  if (/^multipart\/form-data\b/i.test(contentType)) {
    const form = await message.formData();
    const text = JSON.stringify(summarizeMultipartFormData(form));
    return { text, bytes: Buffer.byteLength(text), truncated: false };
  }
  const hash = createHash("sha256");
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  let retained = 0;
  if (message.body) {
    const reader = message.body.getReader();
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        hash.update(value);
        bytes += value.byteLength;
        if (retained < max) {
          const chunk = value.slice(0, max - retained);
          chunks.push(chunk);
          retained += chunk.byteLength;
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
  const textual =
    /(?:json|^text\/|xml|application\/x-www-form-urlencoded)/i.test(
      contentType
    );
  if ((!textual || bytes > max) && !streamed) {
    return {
      text: JSON.stringify({
        _apicity_placeholder: {
          sha256: hash.digest("hex"),
          bytes,
          contentType,
        },
      }),
      bytes,
      truncated: bytes > max,
    };
  }
  if (!textual) {
    return {
      text: JSON.stringify({
        _apicity_placeholder: {
          sha256: hash.digest("hex"),
          bytes,
          contentType,
        },
      }),
      bytes,
      truncated: bytes > max,
    };
  }
  let text = new TextDecoder().decode(Buffer.concat(chunks), {
    stream: bytes > max,
  });
  try {
    const result = summarizeJsonMediaStrings(JSON.parse(text));
    if (result.summarized) text = JSON.stringify(result.value);
  } catch {
    /* Plain text or SSE. */
  }
  return { text, bytes, truncated: bytes > max };
}

/** Serializes clones: the caller's request and response bodies remain readable. */
export async function exchangeToEntry(
  request: Request,
  responseOrError: Response | Error,
  timing: ExchangeTiming,
  opts: ExchangeOptions = {}
): Promise<HarEntry> {
  const max = opts.maxBodyBytes ?? DEFAULT_MAX_BODY_BYTES;
  if (!Number.isSafeInteger(max) || max < 0)
    throw new RangeError("maxBodyBytes must be a non-negative safe integer");
  const response =
    responseOrError instanceof Response ? responseOrError : undefined;
  const streamed =
    opts.streamed ??
    response?.headers.get("content-type")?.includes("text/event-stream") ??
    false;
  const req = await serializeBody(request.clone(), max, false);
  const res = response
    ? await serializeBody(response.clone(), max, streamed)
    : { text: "", bytes: 0, truncated: false };
  const entry: HarEntry = {
    startedDateTime: new Date(timing.startedAt).toISOString(),
    time: timing.durationMs,
    request: {
      method: request.method,
      url: request.url,
      httpVersion: "HTTP/1.1",
      cookies: [],
      headers: headers(request.headers),
      queryString: Array.from(
        new URL(request.url).searchParams,
        ([name, value]) => ({ name, value })
      ),
      headersSize: -1,
      bodySize: req.bytes,
      ...(request.body
        ? {
            postData: {
              mimeType:
                request.headers.get("content-type") ??
                "application/octet-stream",
              text: req.text,
            },
          }
        : {}),
    },
    response: {
      status: response?.status ?? 0,
      statusText: response?.statusText ?? "",
      httpVersion: "HTTP/1.1",
      cookies: [],
      headers: response ? headers(response.headers) : [],
      content: {
        size: res.bytes,
        mimeType: response?.headers.get("content-type") ?? "",
        text: res.text,
      },
      redirectURL: response?.headers.get("location") ?? "",
      headersSize: -1,
      bodySize: res.bytes,
    },
    cache: {},
    timings: {
      send: 0,
      wait: timing.durationMs,
      receive: 0,
      ...timing.timings,
    },
    _apicity: {
      kind: "http",
      ...(opts.role ? { role: opts.role } : {}),
      ...(streamed ? { streamed: true } : {}),
      ...(req.truncated || res.truncated ? { bodyTruncated: true } : {}),
    },
  };
  scrubEntry(entry);
  // Query arrays must agree with the scrubbed URL, never retain signed credentials.
  entry.request.queryString = Array.from(
    new URL(entry.request.url).searchParams,
    ([name, value]) => ({ name, value })
  );
  return entry;
}
