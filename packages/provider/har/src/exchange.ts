import { createHash } from "node:crypto";
import {
  longBase64Bytes,
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
  /** An oversized JSON request up to this size is held to summarize its media. */
  maxSummarizeBytes?: number;
  /** A stream over maxBodyBytes keeps this many final bytes past its head. */
  sseTailBytes?: number;
  streamed?: boolean;
  role?: ApicityEntryMetadata["role"];
}
interface SerializedBody {
  text: string;
  bytes: number;
  truncated: boolean;
  sha256: string;
}
interface BodyLimits {
  max: number;
  holdUpTo: number;
  tail: number;
}
const DEFAULT_MAX_BODY_BYTES = 262144;
const DEFAULT_MAX_SUMMARIZE_BYTES = 16 * 1024 * 1024;
const DEFAULT_SSE_TAIL_BYTES = 64 * 1024;

function headers(value: Headers): HarNameValue[] {
  return Array.from(value, ([name, value]) => ({ name, value }));
}

// The text of an oversized JSON body once its media is summarized, when that
// brings it under the cap: a video analysis request is mostly its data URLs, and
// the model and limits beside them are what a cost report needs. Parsing is the
// whole cost of holding a body, and what remains after the media must fit the cap,
// so a body that cannot fit skips it and at most the cap of JSON reaches the parser.
function summarizedJsonWithin(body: Buffer, max: number): string | undefined {
  if (body.byteLength - longBase64Bytes(body) > max) return undefined;
  try {
    const result = summarizeJsonMediaStrings(
      JSON.parse(new TextDecoder().decode(body))
    );
    if (!result.summarized) return undefined;
    const text = JSON.stringify(result.value);
    return Buffer.byteLength(text) <= max ? text : undefined;
  } catch {
    return undefined;
  }
}

// The last bytes of a stream, in memory bounded by the limit however it is chunked.
// It holds one byte more than asked, which shows whether the tail opens on a line.
function rollingTail(limit: number) {
  const hold = limit + 1;
  let chunks: Uint8Array[] = [];
  let held = 0;
  let dropped = 0;
  const compact = (): Buffer => {
    const all = Buffer.concat(chunks);
    const start = Math.max(0, all.byteLength - hold);
    const kept = Buffer.from(all.subarray(start));
    dropped += start;
    chunks = [kept];
    held = kept.byteLength;
    return kept;
  };
  return {
    push(bytes: Uint8Array): void {
      chunks.push(bytes);
      held += bytes.byteLength;
      // Waiting until it has doubled keeps this linear in the stream's length.
      if (held >= 2 * hold) compact();
    },
    finish(): { tail: Buffer; dropped: number } {
      const tail = compact();
      return { tail, dropped };
    },
  };
}

// A stream's head and tail, joined by an SSE comment no parser reads as a frame.
// Both keep whole lines: a raw newline never falls inside a JSON string, and the
// scrubber matches fields across line ends, so a string left open at the join
// would swallow the marker and hide the tail's first field from it.
function joinStream(head: Buffer, tail: Buffer, dropped: number): string {
  const decode = (bytes: Uint8Array) => new TextDecoder().decode(bytes);
  if (dropped === 0) return decode(Buffer.concat([head, tail]));
  const headEnd = head.lastIndexOf(0x0a) + 1;
  const lineEnd = tail.indexOf(0x0a);
  // With no line ends at all nothing here is framed, so the head stands alone.
  if (headEnd === 0 && lineEnd < 0) {
    return new TextDecoder().decode(head, { stream: true });
  }
  let tailStart = lineEnd < 0 ? tail.length : lineEnd + 1;
  while (tail[tailStart] === 0x0a || tail[tailStart] === 0x0d) tailStart += 1;
  const gap = dropped + head.length - headEnd + tailStart;
  return `${decode(head.subarray(0, headEnd))}\n\n: apicity-gap ${gap} bytes dropped\n\n${decode(tail.subarray(tailStart))}`;
}

async function serializeBody(
  message: Request | Response,
  limits: BodyLimits,
  streamed: boolean
): Promise<SerializedBody> {
  const { max } = limits;
  const contentType =
    message.headers.get("content-type") ?? "application/octet-stream";
  if (/^multipart\/form-data\b/i.test(contentType)) {
    const form = await message.formData();
    const text = JSON.stringify(summarizeMultipartFormData(form));
    return {
      text,
      bytes: Buffer.byteLength(text),
      truncated: false,
      sha256: createHash("sha256").update(text).digest("hex"),
    };
  }
  const summarizable = !streamed && /json/i.test(contentType);
  const headLimit = summarizable ? Math.max(max, limits.holdUpTo) : max;
  const tail =
    streamed && limits.tail > 0 ? rollingTail(limits.tail) : undefined;
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
        const taken = Math.min(headLimit - retained, value.byteLength);
        if (taken > 0) {
          chunks.push(value.slice(0, taken));
          retained += taken;
        }
        if (taken < value.byteLength) tail?.push(value.slice(taken));
        // Past the hold limit this body can only become a placeholder.
        if (summarizable && bytes > headLimit) chunks.length = 0;
      }
    } finally {
      reader.releaseLock();
    }
  }
  const sha256 = hash.digest("hex");
  const textual =
    /(?:json|^text\/|xml|application\/x-www-form-urlencoded)/i.test(
      contentType
    );
  if (summarizable && bytes > max && bytes <= headLimit) {
    const text = summarizedJsonWithin(Buffer.concat(chunks), max);
    if (text !== undefined) return { text, bytes, truncated: false, sha256 };
  }
  if ((!textual || bytes > max) && !streamed) {
    return {
      text: JSON.stringify({
        _apicity_placeholder: {
          sha256,
          bytes,
          contentType,
        },
      }),
      bytes,
      sha256,
      truncated: bytes > max,
    };
  }
  if (!textual) {
    return {
      text: JSON.stringify({
        _apicity_placeholder: {
          sha256,
          bytes,
          contentType,
        },
      }),
      bytes,
      sha256,
      truncated: bytes > max,
    };
  }
  const stream = tail && bytes > max ? tail.finish() : undefined;
  let text = stream
    ? joinStream(Buffer.concat(chunks), stream.tail, stream.dropped)
    : new TextDecoder().decode(Buffer.concat(chunks), {
        stream: bytes > max,
      });
  try {
    const result = summarizeJsonMediaStrings(JSON.parse(text));
    if (result.summarized) text = JSON.stringify(result.value);
  } catch {
    /* Plain text or SSE. */
  }
  return { text, bytes, truncated: bytes > max, sha256 };
}

/** Serializes clones: the caller's request and response bodies remain readable. */
export async function exchangeToEntry(
  request: Request,
  responseOrError: Response | Error,
  timing: ExchangeTiming,
  opts: ExchangeOptions = {}
): Promise<HarEntry> {
  return (await serializeExchange(request, responseOrError, timing, opts))
    .entry;
}

/** Internal capture adapter; the wire hash is never persisted as metadata. */
export async function serializeExchange(
  request: Request,
  responseOrError: Response | Error,
  timing: ExchangeTiming,
  opts: ExchangeOptions = {}
): Promise<{ entry: HarEntry; responseBodySha256: string }> {
  const max = opts.maxBodyBytes ?? DEFAULT_MAX_BODY_BYTES;
  const holdUpTo = opts.maxSummarizeBytes ?? DEFAULT_MAX_SUMMARIZE_BYTES;
  const tail = opts.sseTailBytes ?? DEFAULT_SSE_TAIL_BYTES;
  for (const [name, value] of [
    ["maxBodyBytes", max],
    ["maxSummarizeBytes", holdUpTo],
    ["sseTailBytes", tail],
  ] as const) {
    if (!Number.isSafeInteger(value) || value < 0)
      throw new RangeError(`${name} must be a non-negative safe integer`);
  }
  const response =
    responseOrError instanceof Response ? responseOrError : undefined;
  const streamed =
    opts.streamed ??
    /text\/event-stream/i.test(response?.headers.get("content-type") ?? "");
  // Tee both bodies before the first await, while the caller can still read them.
  const requestCopy = request.clone();
  const responseCopy = response?.clone();
  const req = await serializeBody(
    requestCopy,
    { max, holdUpTo, tail: 0 },
    false
  );
  const res = responseCopy
    ? // Only a request is held to summarize: a response's usage is what a stream
      // tail keeps, and its media can run far past any cap.
      await serializeBody(responseCopy, { max, holdUpTo: 0, tail }, streamed)
    : { text: "", bytes: 0, truncated: false, sha256: "" };
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
  // Some scrub rules rewrite the text and its size; this stays the wire count.
  entry.request.bodySize = req.bytes;
  // Query arrays must agree with the scrubbed URL, never retain signed credentials.
  entry.request.queryString = Array.from(
    new URL(entry.request.url).searchParams,
    ([name, value]) => ({ name, value })
  );
  return { entry, responseBodySha256: res.sha256 };
}
