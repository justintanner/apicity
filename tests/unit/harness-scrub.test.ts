import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  REDACTED_HAR_VALUE,
  scrubSensitiveResponse,
  type HarRecordingLike,
} from "../har-scrub";

interface FixtureHarHeader {
  name?: string;
  value?: string;
}

interface FixtureHarCookie {
  name?: string;
  value?: string;
}

interface FixtureHarEntry {
  response?: {
    headers?: FixtureHarHeader[];
    cookies?: FixtureHarCookie[];
  };
}

interface FixtureHar {
  log?: {
    entries?: FixtureHarEntry[];
  };
}

function collectRecordingHars(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectRecordingHars(fullPath));
    } else if (entry.name === "recording.har") {
      files.push(fullPath);
    }
  }
  return files;
}

describe("HAR response scrubber", () => {
  it("drops response cookies and sensitive response headers", () => {
    const recording: HarRecordingLike = {
      response: {
        cookies: [
          { name: "_cfuvid", value: "real-cookie-value" },
          { name: "JSESSIONID", value: "real-session-id" },
          { name: "empty" },
        ],
        headers: [
          { name: "anthropic-organization-id", value: "org-real" },
          { name: "openai-organization", value: "org-openai" },
          { name: "openai-project", value: "proj-real" },
          { name: "origin-cf-ray", value: "ray-real" },
          { name: "request-id", value: "req-real" },
          { name: "x-request-id", value: "req-x-real" },
          { name: "x-mbx-uuid", value: "uuid-real" },
          { name: "traceresponse", value: "trace-real" },
          { name: "x-dashscope-inner-user-meta", value: "user-real" },
          { name: "set-cookie", value: "_cfuvid=real-cookie-value" },
          { name: "Set-Cookie", value: "JSESSIONID=real-session-id; Path=/" },
          { name: "content-type", value: "application/json" },
        ],
      },
    };

    scrubSensitiveResponse(recording);

    expect(recording.response?.cookies).toEqual([]);
    expect(recording.response?.headers).toEqual([
      { name: "content-type", value: "application/json" },
    ]);
  });

  it("drops Kie JSESSIONID response cookies", () => {
    const recording: HarRecordingLike = {
      response: {
        cookies: [{ name: "JSESSIONID", value: "kie-session-id" }],
        headers: [
          {
            name: "set-cookie",
            value: "JSESSIONID=kie-session-id; Path=/; HttpOnly",
          },
        ],
      },
    };

    scrubSensitiveResponse(recording);

    expect(recording.response?.cookies).toEqual([]);
    expect(recording.response?.headers).toEqual([]);
  });

  it("keeps committed Kie session cookie fixtures redacted", () => {
    const recordingsDir = path.resolve(
      import.meta.dirname,
      "../recordings/kie_2079838932"
    );
    const leaks: string[] = [];

    for (const file of collectRecordingHars(recordingsDir)) {
      const har = JSON.parse(readFileSync(file, "utf8")) as FixtureHar;
      for (const [entryIndex, entry] of (har.log?.entries ?? []).entries()) {
        for (const cookie of entry.response?.cookies ?? []) {
          if (
            cookie.name?.toLowerCase() === "jsessionid" &&
            cookie.value !== REDACTED_HAR_VALUE
          ) {
            leaks.push(
              `${path.relative(process.cwd(), file)} entry ${entryIndex} ` +
                "response cookie JSESSIONID"
            );
          }
        }

        for (const header of entry.response?.headers ?? []) {
          if (
            header.name?.toLowerCase() === "set-cookie" &&
            header.value !== REDACTED_HAR_VALUE
          ) {
            leaks.push(
              `${path.relative(process.cwd(), file)} entry ${entryIndex} ` +
                "response header set-cookie"
            );
          }
        }
      }
    }

    expect(leaks).toEqual([]);
  });
});
