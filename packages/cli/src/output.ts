import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const URL_KEYS = new Set([
  "url",
  "downloadUrl",
  "download_url",
  "audio_url",
  "audioUrl",
  "video_url",
  "videoUrl",
  "image_url",
  "imageUrl",
  "fileUrl",
  "file_url",
]);

/**
 * The keys that mark an upload ticket. fal's `storage.upload.initiate`
 * answers `{ file_url, upload_url }`, and nothing exists at that `file_url`
 * until the caller PUTs the bytes to `upload_url` — fal's CDN holds a GET on
 * it open without answering. So an object carrying one of these is returned
 * as sent, and none of its URLs is fetched.
 */
const UPLOAD_TARGET_KEYS = ["upload_url", "uploadUrl"];

/**
 * Content types that mark a web page, not a file. A `url` can be a link to
 * read: an OpenAI web-search citation, a docs link in an ElevenLabs answer, a
 * TikTok video or an X search. Its download stops once the headers arrive and
 * the URL comes back as sent. Every other type is saved, because fal returns
 * captions, configs and 3D models under `url` as `text/plain`,
 * `application/json` and `model/*`.
 */
const PAGE_CONTENT_TYPES = new Set(["text/html", "application/xhtml+xml"]);

/**
 * How long one download may go without progress — no response headers yet,
 * or no body bytes since the last chunk — before it is abandoned and reported
 * in its `_savedTo` sibling. It measures silence, not total time, so a large
 * file that keeps arriving is never cut off.
 */
export const DOWNLOAD_STALL_TIMEOUT_MS = 60_000;

export interface DownloadOptions {
  /** Overrides {@link DOWNLOAD_STALL_TIMEOUT_MS}. */
  stallTimeoutMs?: number;
}

const EXT_BY_HINT: Array<[RegExp, string]> = [
  [/(speech|tts|audio|voice|sound|stt|transcrib|translat)/i, "mp3"],
  [/video/i, "mp4"],
  [/image/i, "png"],
];

export function guessExtension(dotPath: string): string {
  for (const [re, ext] of EXT_BY_HINT) if (re.test(dotPath)) return ext;
  return "bin";
}

export async function writeBinary(
  buf: ArrayBuffer | Uint8Array | Buffer,
  baseName: string,
  outDir: string
): Promise<{ savedTo: string; bytes: number }> {
  const absDir = resolve(outDir);
  await mkdir(absDir, { recursive: true });
  const safeName = baseName.replace(/[^A-Za-z0-9._-]/g, "_");
  const file = join(absDir, safeName);
  const bytes = toBuffer(buf);
  await writeFile(file, bytes);
  return { savedTo: file, bytes: bytes.byteLength };
}

function toBuffer(buf: ArrayBuffer | Uint8Array | Buffer): Buffer {
  if (Buffer.isBuffer(buf)) return buf;
  if (buf instanceof Uint8Array) return Buffer.from(buf);
  return Buffer.from(new Uint8Array(buf as ArrayBuffer));
}

export function isBinary(value: unknown): value is ArrayBuffer | Uint8Array {
  return value instanceof ArrayBuffer || value instanceof Uint8Array;
}

/**
 * Walk a JSON-shaped result, find URL strings under known keys, and download
 * each into outDir. Returns a deep-cloned result with sibling `_savedTo` keys
 * inserted next to the original URL fields. Best-effort — network failures
 * and stalls leave the URL untouched and don't throw. An upload ticket's URLs
 * are never fetched (see `UPLOAD_TARGET_KEYS`), and a web page is not saved
 * (see `PAGE_CONTENT_TYPES`).
 */
export async function downloadUrlsInResult(
  result: unknown,
  outDir: string,
  baseHint: string,
  options: DownloadOptions = {}
): Promise<unknown> {
  const stallTimeoutMs = options.stallTimeoutMs ?? DOWNLOAD_STALL_TIMEOUT_MS;
  const cloned = deepClone(result);
  const found: { parent: Record<string, unknown>; key: string; url: string }[] =
    [];
  walk(cloned, (parent, key, value) => {
    if (!URL_KEYS.has(key) || !isHttpUrl(value)) return;
    if (isUploadTicket(parent)) return;
    found.push({ parent: parent as Record<string, unknown>, key, url: value });
  });
  // The downloads run at once, so their millisecond timestamps can match:
  // when there are several, each name also carries the download's number.
  await Promise.all(
    found.map(({ parent, key, url }, index) =>
      downloadOne(
        url,
        baseHint,
        found.length > 1 ? `-${index + 1}` : "",
        outDir,
        stallTimeoutMs
      )
        .then((path) => {
          if (path !== null) parent[`${key}_savedTo`] = path;
        })
        .catch((err) => {
          parent[`${key}_savedTo`] = `error: ${(err as Error).message}`;
        })
    )
  );
  return cloned;
}

function isHttpUrl(value: unknown): value is string {
  return typeof value === "string" && /^https?:\/\//.test(value);
}

function isUploadTicket(node: object): boolean {
  const record = node as Record<string, unknown>;
  return UPLOAD_TARGET_KEYS.some((key) => isHttpUrl(record[key]));
}

/** Resolves to the saved path, or `null` when the URL answered a web page. */
async function downloadOne(
  url: string,
  baseHint: string,
  suffix: string,
  outDir: string,
  stallTimeoutMs: number
): Promise<string | null> {
  const body = await fetchBody(url, stallTimeoutMs);
  if (body === null) return null;
  const { bytes, contentType } = body;
  const ext = extFromContentType(contentType) ?? extFromUrl(url) ?? "bin";
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const baseName = `${baseHint}__${ts}${suffix}.${ext}`;
  const out = await writeBinary(bytes, baseName, outDir);
  return out.savedTo;
}

/**
 * GET `url` and buffer its body, abandoning the transfer once it has gone
 * `stallTimeoutMs` without progress. The timer restarts when the headers
 * arrive and after every chunk. The stall message names no URL, so a signed
 * query string never reaches it. A web page resolves to `null` with its body
 * cancelled unread.
 */
async function fetchBody(
  url: string,
  stallTimeoutMs: number
): Promise<{ bytes: Buffer; contentType: string } | null> {
  const controller = new AbortController();
  let stalled = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const restartStallTimer = (): void => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      stalled = true;
      controller.abort();
    }, stallTimeoutMs);
  };

  restartStallTimer();
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
    const contentType = res.headers.get("content-type") ?? "";
    if (isPage(contentType)) {
      await res.body?.cancel();
      return null;
    }
    const chunks: Uint8Array[] = [];
    if (res.body) {
      const reader = res.body.getReader();
      for (;;) {
        restartStallTimer();
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
    }
    return { bytes: Buffer.concat(chunks), contentType };
  } catch (err) {
    if (stalled) {
      throw new Error(`download stalled: no data for ${stallTimeoutMs} ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function isPage(contentType: string): boolean {
  return PAGE_CONTENT_TYPES.has(contentType.split(";")[0].trim().toLowerCase());
}

function extFromContentType(ct: string): string | null {
  if (ct.startsWith("image/")) return ct.split("/")[1].split(";")[0];
  if (ct.startsWith("video/")) return ct.split("/")[1].split(";")[0];
  if (ct.startsWith("audio/")) return ct.split("/")[1].split(";")[0];
  if (ct.startsWith("application/pdf")) return "pdf";
  return null;
}

function extFromUrl(url: string): string | null {
  try {
    const path = new URL(url).pathname;
    const dot = path.lastIndexOf(".");
    if (dot < 0) return null;
    const ext = path.slice(dot + 1).toLowerCase();
    if (/^[a-z0-9]{2,5}$/.test(ext)) return ext;
    return null;
  } catch {
    return null;
  }
}

function deepClone<T>(value: T): T {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value))
    return value.map((v) => deepClone(v)) as unknown as T;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = deepClone(v);
  }
  return out as unknown as T;
}

function walk(
  node: unknown,
  visit: (parent: object, key: string, value: unknown) => void
): void {
  if (node === null || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const item of node) walk(item, visit);
    return;
  }
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    visit(node as object, key, value);
    walk(value, visit);
  }
}
