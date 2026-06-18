import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

interface HarEntry {
  request?: {
    postData?: {
      text?: string;
    };
  };
}

interface HarRecording {
  log?: {
    entries?: HarEntry[];
  };
}

function collectHarFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectHarFiles(fullPath));
      continue;
    }
    if (entry.name === "recording.har") {
      results.push(fullPath);
    }
  }
  return results;
}

function hasFileSummary(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some(hasFileSummary);
  }
  if (value === null || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  if (record._file === true) {
    return (
      typeof record.filename === "string" &&
      (typeof record.contentType === "string" || record.contentType === null) &&
      typeof record.size === "number"
    );
  }

  return Object.values(record).some(hasFileSummary);
}

describe("free-media-upload HAR multipart summaries", () => {
  it("keeps sanitized request summaries for FormData upload fixtures", () => {
    const recordingsDir = path.resolve(
      import.meta.dirname,
      "../recordings/free-media-upload_1393460724"
    );
    const harFiles = collectHarFiles(recordingsDir).filter((filePath) => {
      const recordingDir = path.basename(path.dirname(filePath));
      return !recordingDir.startsWith("filebin-upload");
    });

    expect(harFiles.length).toBeGreaterThan(0);

    for (const filePath of harFiles) {
      const raw = fs.readFileSync(filePath, "utf8");
      const har = JSON.parse(raw) as HarRecording;
      const entry = har.log?.entries?.[0];
      const text = entry?.request?.postData?.text;

      expect(text, filePath).toEqual(expect.any(String));

      const summary = JSON.parse(text as string) as Record<string, unknown>;
      expect(summary._multipart, filePath).toBe(true);
      expect(hasFileSummary(summary), filePath).toBe(true);
    }
  });
});
