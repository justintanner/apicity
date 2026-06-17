import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { REDACTED_HAR_VALUE } from "../har-scrub";

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

describe("Kie HAR response cookies", () => {
  it("keeps committed response cookie values redacted", () => {
    const recordingsRoot = path.join(
      process.cwd(),
      "tests",
      "recordings",
      "kie_2079838932"
    );
    const leaks: string[] = [];

    for (const file of listRecordingFiles(recordingsRoot)) {
      const har = JSON.parse(readFileSync(file, "utf8")) as HarRecording;

      for (const [entryIndex, entry] of (har.log?.entries ?? []).entries()) {
        for (const [cookieIndex, cookie] of (
          entry.response?.cookies ?? []
        ).entries()) {
          if (
            typeof cookie.value === "string" &&
            cookie.value !== REDACTED_HAR_VALUE
          ) {
            leaks.push(
              `${file}: entry ${entryIndex} response cookie ` +
                `${cookieIndex} (${cookie.name ?? "unnamed"})`
            );
          }
        }

        for (const [headerIndex, header] of (
          entry.response?.headers ?? []
        ).entries()) {
          if (
            header.name?.toLowerCase() === "set-cookie" &&
            header.value !== REDACTED_HAR_VALUE
          ) {
            leaks.push(
              `${file}: entry ${entryIndex} response set-cookie header ` +
                `${headerIndex}`
            );
          }
        }
      }
    }

    expect(leaks).toEqual([]);
  });
});
