import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

export interface HarEntry {
  request: {
    method: string;
    url: string;
    headers: Array<{ name: string; value: string }>;
    postData?: { text: string };
  };
  response: {
    status: number;
    statusText: string;
    headers: Array<{ name: string; value: string }>;
    content: { text?: string };
  };
}

export interface HarRecording {
  name: string;
  source: string;
  gitStatus?: "new" | "modified" | "clean";
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
