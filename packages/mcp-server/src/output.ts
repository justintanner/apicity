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
 * leave the URL untouched and don't throw.
 */
export async function downloadUrlsInResult(
  result: unknown,
  outDir: string,
  baseHint: string
): Promise<unknown> {
  const cloned = deepClone(result);
  const downloads: Promise<void>[] = [];
  walk(cloned, (parent, key, value) => {
    if (typeof value !== "string" || !URL_KEYS.has(key)) return;
    if (!/^https?:\/\//.test(value)) return;
    downloads.push(
      downloadOne(value, baseHint, outDir)
        .then((path) => {
          (parent as Record<string, unknown>)[`${key}_savedTo`] = path;
        })
        .catch((err) => {
          (parent as Record<string, unknown>)[`${key}_savedTo`] = `error: ${
            (err as Error).message
          }`;
        })
    );
  });
  await Promise.all(downloads);
  return cloned;
}

async function downloadOne(
  url: string,
  baseHint: string,
  outDir: string
): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  const contentType = res.headers.get("content-type") ?? "";
  const ext = extFromContentType(contentType) ?? extFromUrl(url) ?? "bin";
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const baseName = `${baseHint}__${ts}.${ext}`;
  const buf = Buffer.from(await res.arrayBuffer());
  const out = await writeBinary(buf, baseName, outDir);
  return out.savedTo;
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
