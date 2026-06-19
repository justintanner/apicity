import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

interface HarHeader {
  name?: string;
  value?: string;
}

interface HarCookie {
  name?: string;
  value?: string;
}

interface HarEntry {
  response?: {
    cookies?: HarCookie[];
    headers?: HarHeader[];
  };
}

interface HarRecording {
  log?: {
    entries?: HarEntry[];
  };
}

function listRecordingFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listRecordingFiles(fullPath);
    return entry.name === "recording.har" ? [fullPath] : [];
  });
}

describe("Polymarket HAR Cloudflare cookies", () => {
  it("keeps committed Cloudflare cookies removed", () => {
    const recordingsRoot = path.join(
      process.cwd(),
      "tests",
      "recordings",
      "polymarket_3782428595"
    );
    const leaks: string[] = [];

    for (const file of listRecordingFiles(recordingsRoot)) {
      const raw = readFileSync(file, "utf8");
      const har = JSON.parse(raw) as HarRecording;

      if (/__cf_bm/i.test(raw)) {
        leaks.push(`${path.relative(process.cwd(), file)} contains __cf_bm`);
      }

      for (const [entryIndex, entry] of (har.log?.entries ?? []).entries()) {
        for (const [cookieIndex, cookie] of (
          entry.response?.cookies ?? []
        ).entries()) {
          leaks.push(
            `${path.relative(process.cwd(), file)} entry ${entryIndex} ` +
              `response cookie ${cookieIndex} (${cookie.name ?? "unnamed"})`
          );
        }

        for (const [headerIndex, header] of (
          entry.response?.headers ?? []
        ).entries()) {
          const headerName = header.name?.toLowerCase();
          if (headerName === "set-cookie") {
            leaks.push(
              `${path.relative(process.cwd(), file)} entry ${entryIndex} ` +
                `response set-cookie header ${headerIndex}`
            );
          }
          if (/__cf_bm/i.test(header.value ?? "")) {
            leaks.push(
              `${path.relative(process.cwd(), file)} entry ${entryIndex} ` +
                `response header ${headerIndex} contains __cf_bm`
            );
          }
        }
      }
    }

    expect(leaks).toEqual([]);
  });
});
