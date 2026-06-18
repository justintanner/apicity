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
    content?: {
      text?: string;
    };
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
          { name: "cookie", value: "__cf_bm=real-cookie-value" },
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

  it("keeps committed OpenAI fixtures free of sensitive response metadata", () => {
    const recordingsDir = path.resolve(
      import.meta.dirname,
      "../recordings/openai_3991279299"
    );
    const sensitiveHeaders = new Set([
      "cookie",
      "openai-organization",
      "openai-project",
      "set-cookie",
    ]);
    const leaks: string[] = [];

    for (const file of collectRecordingHars(recordingsDir)) {
      const har = JSON.parse(readFileSync(file, "utf8")) as FixtureHar;
      for (const [entryIndex, entry] of (har.log?.entries ?? []).entries()) {
        for (const cookie of entry.response?.cookies ?? []) {
          leaks.push(
            `${path.relative(process.cwd(), file)} entry ${entryIndex} ` +
              `response cookie ${cookie.name ?? "<unnamed>"}`
          );
        }

        for (const header of entry.response?.headers ?? []) {
          const headerName = header.name?.toLowerCase();
          if (headerName && sensitiveHeaders.has(headerName)) {
            leaks.push(
              `${path.relative(process.cwd(), file)} entry ${entryIndex} ` +
                `response header ${header.name}`
            );
          }
        }
      }
    }

    expect(leaks).toEqual([]);
  });

  it("keeps committed Alibaba fixtures free of raw DashScope IDs", () => {
    const recordingsDir = path.resolve(
      import.meta.dirname,
      "../recordings/alibaba_1329897167"
    );
    const redactedHeaders = new Map([
      ["x-dashscope-apikeyid", REDACTED_HAR_VALUE],
      ["x-dashscope-bwid", "ws-***"],
      ["x-dashscope-uid", REDACTED_HAR_VALUE],
      ["x-dashscope-workspace", "ws-***"],
    ]);
    const leaks: string[] = [];

    for (const file of collectRecordingHars(recordingsDir)) {
      const har = JSON.parse(readFileSync(file, "utf8")) as FixtureHar;
      for (const [entryIndex, entry] of (har.log?.entries ?? []).entries()) {
        for (const header of entry.response?.headers ?? []) {
          const headerName = header.name?.toLowerCase();
          const expected = headerName
            ? redactedHeaders.get(headerName)
            : undefined;

          if (expected && header.value !== expected) {
            leaks.push(
              `${path.relative(process.cwd(), file)} entry ${entryIndex} ` +
                `response header ${header.name}`
            );
          }

          if (headerName !== "x-dashscope-inner-flow-control-meta") {
            continue;
          }

          try {
            const meta = JSON.parse(header.value ?? "{}") as Record<
              string,
              unknown
            >;
            if (
              ("user_id" in meta && meta.user_id !== REDACTED_HAR_VALUE) ||
              ("user_spec" in meta && meta.user_spec !== REDACTED_HAR_VALUE)
            ) {
              leaks.push(
                `${path.relative(process.cwd(), file)} entry ${entryIndex} ` +
                  `response header ${header.name}`
              );
            }
          } catch {
            leaks.push(
              `${path.relative(process.cwd(), file)} entry ${entryIndex} ` +
                `response header ${header.name} malformed JSON`
            );
          }
        }
      }
    }

    expect(leaks).toEqual([]);
  });

  it("keeps committed Fireworks API key fixtures redacted", () => {
    const file = path.resolve(
      import.meta.dirname,
      "../recordings/fireworks_626462085/apikeys-list_1724751226/recording.har"
    );
    const sensitiveFields = ["displayName", "email", "keyId", "prefix"];
    const har = JSON.parse(readFileSync(file, "utf8")) as FixtureHar;
    const leaks: string[] = [];

    for (const [entryIndex, entry] of (har.log?.entries ?? []).entries()) {
      const text = entry.response?.content?.text;
      if (!text) continue;

      const body = JSON.parse(text) as unknown;
      if (body === null || typeof body !== "object" || Array.isArray(body)) {
        continue;
      }

      const apiKeys = (body as Record<string, unknown>).apiKeys;
      if (!Array.isArray(apiKeys)) continue;

      for (const [apiKeyIndex, apiKey] of apiKeys.entries()) {
        if (
          apiKey === null ||
          typeof apiKey !== "object" ||
          Array.isArray(apiKey)
        ) {
          continue;
        }

        const apiKeyRecord = apiKey as Record<string, unknown>;
        for (const field of sensitiveFields) {
          const value = apiKeyRecord[field];
          if (typeof value === "string" && value !== REDACTED_HAR_VALUE) {
            leaks.push(
              `${path.relative(process.cwd(), file)} entry ${entryIndex} ` +
                `apiKeys[${apiKeyIndex}].${field}`
            );
          }
        }

        const key = apiKeyRecord.key;
        if (
          typeof key === "string" &&
          key.length > 0 &&
          key !== REDACTED_HAR_VALUE
        ) {
          leaks.push(
            `${path.relative(process.cwd(), file)} entry ${entryIndex} ` +
              `apiKeys[${apiKeyIndex}].key`
          );
        }
      }
    }

    expect(leaks).toEqual([]);
  });

  it("keeps committed HAR response cookies removed", () => {
    const recordingsDir = path.resolve(import.meta.dirname, "../recordings");
    const leaks: string[] = [];

    for (const file of collectRecordingHars(recordingsDir)) {
      const har = JSON.parse(readFileSync(file, "utf8")) as FixtureHar;
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
          if (header.name?.toLowerCase() === "set-cookie") {
            leaks.push(
              `${path.relative(process.cwd(), file)} entry ${entryIndex} ` +
                `response set-cookie header ${headerIndex}`
            );
          }
        }
      }
    }

    expect(leaks).toEqual([]);
  });
});
