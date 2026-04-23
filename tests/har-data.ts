import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

export interface HarPostDataParam {
  name: string;
  value?: string;
  fileName?: string;
  contentType?: string;
}

export interface HarPostData {
  text?: string;
  mimeType?: string;
  params?: HarPostDataParam[];
}

export interface HarEntry {
  request: {
    method: string;
    url: string;
    headers: Array<{ name: string; value: string }>;
    postData?: HarPostData;
  };
  response: {
    status: number;
    statusText: string;
    headers: Array<{ name: string; value: string }>;
    content: { text?: string; mimeType?: string };
  };
}

export interface HarCommitInfo {
  sha: string;
  shortSha: string;
  date: number;
  subject: string;
}

export interface HarRecording {
  name: string;
  source: string;
  gitStatus?: "new" | "modified" | "clean";
  commit?: HarCommitInfo | null;
  entries: HarEntry[];
}

export function getGitStatus(filePath: string): "new" | "modified" | "clean" {
  try {
    const out = execSync(`git status --porcelain "${filePath}"`, {
      encoding: "utf-8",
    }).trim();
    if (!out) return "clean";
    if (out.startsWith("??") || out.startsWith("A ")) return "new";
    return "modified";
  } catch {
    return "new";
  }
}

export function getHarCommits(
  filePaths: string[]
): Map<string, HarCommitInfo | null> {
  const result = new Map<string, HarCommitInfo | null>();
  for (const p of filePaths) result.set(p, null);

  let repoRoot: string;
  try {
    repoRoot = execSync("git rev-parse --show-toplevel", {
      encoding: "utf-8",
    }).trim();
  } catch {
    return result;
  }

  const relToAbs = new Map<string, string>();
  for (const abs of filePaths) {
    relToAbs.set(path.relative(repoRoot, abs), abs);
  }

  let log: string;
  try {
    log = execSync(
      "git log --name-only --format=COMMIT%x09%H%x09%at%x09%s -- tests/recordings/",
      { cwd: repoRoot, encoding: "utf-8", maxBuffer: 128 * 1024 * 1024 }
    );
  } catch {
    return result;
  }

  let current: HarCommitInfo | null = null;
  for (const line of log.split("\n")) {
    if (!line) continue;
    if (line.startsWith("COMMIT\t")) {
      const parts = line.split("\t");
      const sha = parts[1];
      const at = parts[2];
      const subject = parts.slice(3).join("\t");
      current = {
        sha,
        shortSha: sha.slice(0, 7),
        date: parseInt(at, 10),
        subject,
      };
    } else if (current) {
      const abs = relToAbs.get(line);
      if (abs && result.get(abs) === null) {
        result.set(abs, current);
      }
    }
  }

  return result;
}

export function extractProvider(filePath: string): string {
  const parts = filePath.split("/");
  const recordingsIdx = parts.indexOf("recordings");
  if (recordingsIdx < 0 || recordingsIdx + 1 >= parts.length) return "unknown";
  const providerDir = parts[recordingsIdx + 1];
  return providerDir.replace(/_\d+$/, "");
}

export function parseHarFile(filePath: string): HarRecording {
  const raw = fs.readFileSync(filePath, "utf-8");
  const har = JSON.parse(raw);
  return {
    name: har.log?._recordingName ?? path.basename(path.dirname(filePath)),
    source: filePath,
    entries: har.log?.entries ?? [],
  };
}

export function parseHarDir(dirPath: string): HarRecording[] {
  const results: HarRecording[] = [];
  if (!fs.existsSync(dirPath)) return results;

  function walk(dir: string, prefix: string): void {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        walk(
          path.join(dir, entry.name),
          prefix ? `${prefix}/${entry.name}` : entry.name
        );
      } else if (entry.name === "recording.har") {
        const fullPath = path.join(dir, entry.name);
        try {
          const har = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
          results.push({
            name: har.log?._recordingName ?? prefix,
            source: fullPath,
            entries: har.log?.entries ?? [],
          });
        } catch {
          // skip malformed HAR files
        }
      }
    }
  }

  walk(dirPath, "");
  return results;
}

function appendRequestField(
  body: Record<string, unknown>,
  name: string,
  value: unknown
): void {
  const current = body[name];
  if (current === undefined) {
    body[name] = value;
    return;
  }
  if (Array.isArray(current)) {
    current.push(value);
    return;
  }
  body[name] = [current, value];
}

function summarizePostDataParams(
  params: HarPostDataParam[] | undefined
): Record<string, unknown> | null {
  if (!params?.length) return null;

  const body: Record<string, unknown> = { _multipart: true };
  let hasFields = false;
  for (const param of params) {
    if (!param.name) continue;

    if (typeof param.value === "string") {
      appendRequestField(body, param.name, param.value);
      hasFields = true;
      continue;
    }

    if (param.fileName || param.contentType) {
      appendRequestField(body, param.name, {
        _file: true,
        filename: param.fileName,
        contentType: param.contentType ?? null,
      });
      hasFields = true;
    }
  }

  return hasFields ? body : null;
}

export function parseRequestBody(
  entry: HarEntry
): Record<string, unknown> | null {
  const raw = entry.request.postData?.text;
  if (raw) {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  return summarizePostDataParams(entry.request.postData?.params);
}

export function getRequestBodyText(entry: HarEntry): string | null {
  const raw = entry.request.postData?.text;
  if (raw) return raw;

  const body = summarizePostDataParams(entry.request.postData?.params);
  return body ? JSON.stringify(body) : null;
}

const BASE64_MEDIA_MARKERS = [
  "data:image/",
  "data:video/",
  "data:audio/",
  "iVBOR",
  "/9j/",
  "R0lGOD",
  "UklGR",
];

// Require a full http(s) URL — a substring like `"filename": "upload.jpg"`
// in a file-listing response should NOT flag the recording as media-bearing.
const MEDIA_URL_EXT =
  /https?:\/\/[^\s"]+\.(mp4|webm|mov|png|jpe?g|gif|webp|wav|mp3|ogg|flac|m4a)(\?|")/i;

export function entryHasMedia(entry: HarEntry): boolean {
  const mime = (entry.response.content?.mimeType ?? "").toLowerCase();
  if (
    mime.startsWith("image/") ||
    mime.startsWith("video/") ||
    mime.startsWith("audio/")
  ) {
    return true;
  }

  const respBody = entry.response.content?.text ?? "";
  if (BASE64_MEDIA_MARKERS.some((m) => respBody.includes(m))) return true;
  if (MEDIA_URL_EXT.test(respBody)) return true;

  const reqBody = getRequestBodyText(entry) ?? "";
  if (BASE64_MEDIA_MARKERS.some((m) => reqBody.includes(m))) return true;
  if (MEDIA_URL_EXT.test(reqBody)) return true;

  return false;
}

export function recordingHasMedia(rec: { entries: HarEntry[] }): boolean {
  return rec.entries.some(entryHasMedia);
}

export function parseHarPaths(paths: string[]): HarRecording[] {
  const results: HarRecording[] = [];
  for (const p of paths) {
    const resolved = path.resolve(p);
    if (!fs.existsSync(resolved)) continue;
    const stat = fs.statSync(resolved);
    if (stat.isDirectory()) {
      results.push(...parseHarDir(resolved));
    } else if (resolved.endsWith(".har")) {
      results.push(parseHarFile(resolved));
    }
  }
  return results;
}

// --- CI diff helpers (used by harness-report.ts and harness-summary.ts) ---

export interface ChangedRecording {
  filePath: string;
  changeType: "new" | "modified";
  provider: string;
  recordingName: string;
  entries: HarEntry[];
}

export function getBaseBranch(): string {
  const base = process.env.GITHUB_BASE_REF;
  return base ? `origin/${base}` : "origin/main";
}

export function getChangedRecordings(baseBranch: string): ChangedRecording[] {
  let diff: string;
  try {
    diff = execSync(
      `git diff --name-status --diff-filter=ACMR ${baseBranch}...HEAD -- tests/recordings/`,
      { encoding: "utf-8" }
    ).trim();
  } catch {
    return [];
  }

  if (!diff) return [];

  const recordings: ChangedRecording[] = [];

  for (const line of diff.split("\n")) {
    const [status, filePath] = line.split("\t");
    if (!filePath || !filePath.endsWith("recording.har")) continue;

    const fullPath = path.resolve(filePath);
    if (!fs.existsSync(fullPath)) continue;

    let har: { log?: { _recordingName?: string; entries?: HarEntry[] } };
    try {
      har = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
    } catch {
      continue;
    }

    const provider = extractProvider(filePath);
    const recordingName =
      har.log?._recordingName ?? path.basename(path.dirname(filePath));

    recordings.push({
      filePath,
      changeType: status === "A" ? "new" : "modified",
      provider,
      recordingName,
      entries: har.log?.entries ?? [],
    });
  }

  return recordings;
}
