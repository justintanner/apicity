import { Polly, Timing } from "@pollyjs/core";
import FetchAdapter from "@pollyjs/adapter-fetch";
import FSPersister from "@pollyjs/persister-fs";
import { createHash } from "node:crypto";
import path from "path";
import fs from "fs";
import { scrubSensitiveResponse, type HarCookieLike } from "./har-scrub.js";

Polly.register(FetchAdapter);
Polly.register(FSPersister);

export interface PollyContext {
  polly: Polly;
  mode: string;
}

interface PersistedHarHeader {
  name?: string;
  value?: string;
}

export interface PersistedHarRecording {
  _id?: string;
  request?: {
    url?: string;
    headers?: PersistedHarHeader[];
    postData?: {
      mimeType?: string;
      params?: unknown[];
      text?: string;
    };
  };
  response?: {
    bodySize?: number;
    headers?: PersistedHarHeader[];
    cookies?: HarCookieLike[];
    content?: {
      mimeType?: string;
      size?: number;
      text?: string;
    };
  };
}

interface MultipartFileSummary {
  _file: true;
  filename?: string;
  contentType: string | null;
  size: number;
}

type MultipartSummaryValue = string | MultipartFileSummary;

const REDACTED_GUEST_TOKEN = "***";

function appendMultipartField(
  summary: Record<string, unknown>,
  name: string,
  value: MultipartSummaryValue
): void {
  const current = summary[name];
  if (current === undefined) {
    summary[name] = value;
    return;
  }
  if (Array.isArray(current)) {
    current.push(value);
    return;
  }
  summary[name] = [current, value];
}

function summarizeMultipartValue(
  value: FormDataEntryValue
): MultipartSummaryValue {
  if (typeof value === "string") {
    return value;
  }

  const maybeNamed = value as Blob & { name?: string };
  return {
    _file: true,
    filename: typeof maybeNamed.name === "string" ? maybeNamed.name : undefined,
    contentType: value.type || null,
    size: value.size,
  };
}

function findHeaderValue(
  headers: Array<{ name?: string; value?: string }> | undefined,
  name: string
): string | undefined {
  const lower = name.toLowerCase();
  return headers?.find((header) => header.name?.toLowerCase() === lower)?.value;
}

function redactUrlSecrets(url: string): string {
  return url
    .replace(/(https:\/\/api\.telegram\.org\/bot)[^/]+/g, "$1***")
    .replace(/([?&](?:OSSAccessKeyId|Signature)=)[^"&\\]+/g, "$1***");
}

function redactResponseTextSecrets(text: string): string {
  const redacted = redactUrlSecrets(text);
  if (
    !/"upload_host"\s*:/.test(redacted) ||
    !/"oss_access_key_id"\s*:/.test(redacted)
  ) {
    return redacted;
  }

  return redacted
    .replace(/("oss_access_key_id"\s*:\s*")[^"]*(")/g, "$1***$2")
    .replace(/("signature"\s*:\s*")[^"]*(")/g, "$1***$2");
}

function redactDashScopeFlowControlMeta(value: string | undefined): string {
  if (!value) return "***";

  try {
    const parsed = JSON.parse(value) as unknown;
    if (
      parsed !== null &&
      typeof parsed === "object" &&
      !Array.isArray(parsed)
    ) {
      const meta = parsed as Record<string, unknown>;
      if ("user_id" in meta) meta.user_id = "***";
      if ("user_spec" in meta) meta.user_spec = "***";
      return JSON.stringify(meta);
    }
  } catch {
    // Fall back to string-level redaction for malformed service metadata.
  }

  return value
    .replace(/("user_id"\s*:\s*")[^"]*(")/g, "$1***$2")
    .replace(/("user_spec"\s*:\s*)(?:\{[^}]*\}|"[^"]*"|[^,}]+)/g, '$1"***"');
}

function redactDashScopeResponseHeaders(
  headers: PersistedHarHeader[] | undefined
): void {
  for (const header of headers ?? []) {
    switch (header.name?.toLowerCase()) {
      case "x-dashscope-apikeyid":
      case "x-dashscope-uid":
        header.value = "***";
        break;
      case "x-dashscope-bwid":
      case "x-dashscope-workspace":
        header.value = "ws-***";
        break;
      case "x-dashscope-inner-flow-control-meta":
        header.value = redactDashScopeFlowControlMeta(header.value);
        break;
    }
  }
}

export function redactPersistedHarSecrets(
  recording: PersistedHarRecording
): void {
  if (recording.request?.url) {
    recording.request.url = redactUrlSecrets(recording.request.url);
  }

  for (const header of recording.request?.headers ?? []) {
    if (header.name?.toLowerCase() === "authorization") {
      header.value = "Bearer ***";
    }
    if (header.name?.toLowerCase() === "x-api-key") {
      header.value = "***";
    }
    if (header.name?.toLowerCase() === "xi-api-key") {
      header.value = "***";
    }
    if (header.name?.toLowerCase() === "x-goog-api-key") {
      header.value = "***";
    }
    if (header.name?.toLowerCase() === "x-amz-security-token") {
      header.value = "***";
    }
  }

  redactDashScopeResponseHeaders(recording.response?.headers);

  const responseText = recording.response?.content?.text;
  if (typeof responseText === "string") {
    recording.response.content.text = redactResponseTextSecrets(responseText);
  }
  redactGuestTokenResponseBody(recording);
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

function redactGuestTokens(value: unknown): {
  value: unknown;
  redacted: boolean;
} {
  if (Array.isArray(value)) {
    let redacted = false;
    const redactedValues = value.map((item) => {
      const result = redactGuestTokens(item);
      redacted ||= result.redacted;
      return result.value;
    });
    return { value: redactedValues, redacted };
  }
  if (value === null || typeof value !== "object") {
    return { value, redacted: false };
  }

  let redacted = false;
  const redactedObject: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    if (key === "guestToken" && typeof item === "string") {
      redactedObject[key] = REDACTED_GUEST_TOKEN;
      redacted = true;
      continue;
    }
    const result = redactGuestTokens(item);
    redacted ||= result.redacted;
    redactedObject[key] = result.value;
  }
  return { value: redactedObject, redacted };
}

function redactGuestTokenResponseBody(recording: PersistedHarRecording): void {
  const content = recording.response?.content;
  const text = content?.text;
  if (typeof text !== "string" || text.length === 0) return;

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return;
  }

  const result = redactGuestTokens(parsed);
  if (!result.redacted) return;

  const nextText =
    JSON.stringify(result.value) + (text.endsWith("\n") ? "\n" : "");
  content.text = nextText;
  content.size = byteLength(nextText);
  if (recording.response) {
    recording.response.bodySize = byteLength(nextText);
  }
}

function stableStringify(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item) ?? "null").join(",")}]`;
  }

  const objectValue = value as Record<string, unknown>;
  const entries = Object.keys(objectValue)
    .sort()
    .flatMap((key) => {
      const item = stableStringify(objectValue[key]);
      return item === undefined ? [] : [`${JSON.stringify(key)}:${item}`];
    });

  return `{${entries.join(",")}}`;
}

function redactIdentifierSecrets(value: unknown): {
  value: unknown;
  redacted: boolean;
} {
  if (typeof value === "string") {
    const redactedValue = redactUrlSecrets(value);
    return { value: redactedValue, redacted: redactedValue !== value };
  }
  if (Array.isArray(value)) {
    let redacted = false;
    const redactedValues = value.map((item) => {
      const result = redactIdentifierSecrets(item);
      redacted ||= result.redacted;
      return result.value;
    });
    return { value: redactedValues, redacted };
  }
  if (value === null || typeof value !== "object") {
    return { value, redacted: false };
  }

  let redacted = false;
  const redactedObject: Record<string, unknown> = {};
  for (const key of Object.keys(value as Record<string, unknown>)) {
    const result = redactIdentifierSecrets(
      (value as Record<string, unknown>)[key]
    );
    redacted ||= result.redacted;
    redactedObject[key] = result.value;
  }
  return { value: redactedObject, redacted };
}

function redactedRequestId(req: { identifiers?: unknown }): string | undefined {
  if (!req.identifiers) return undefined;
  const result = redactIdentifierSecrets(req.identifiers);
  if (!result.redacted) return undefined;
  const serialized = stableStringify(result.value);
  if (!serialized) return undefined;
  return createHash("md5").update(serialized).digest("hex");
}

export function summarizeMultipartFormData(
  form: FormData
): Record<string, unknown> {
  const summary: Record<string, unknown> = { _multipart: true };
  for (const [name, value] of form.entries()) {
    appendMultipartField(summary, name, summarizeMultipartValue(value));
  }
  return summary;
}

export function setupPolly(recordingName: string): PollyContext {
  return setupPollyWithOptions(recordingName, {});
}

export function setupPollyWithPersistScrubber(
  recordingName: string,
  beforePersist: (recording: PersistedHarRecording) => void
): PollyContext {
  return setupPollyWithOptions(recordingName, { beforePersist });
}

export function setupPollyForFileUploads(recordingName: string): PollyContext {
  // Disable body matching for FormData compatibility
  return setupPollyWithOptions(recordingName, {
    matchRequestsBy: {
      headers: {
        exclude: [
          "authorization",
          "user-agent",
          "x-api-key",
          "xi-api-key",
          "x-dashscope-ossresourceresolve",
          "x-goog-api-key",
          "x-amz-date",
          "x-amz-security-token",
        ],
      },
      body: false,
    },
  });
}

export function setupPollyIgnoringBody(recordingName: string): PollyContext {
  // Disable body matching when the factory injects defaults that weren't in
  // the original HAR (e.g. NSFW/safety permissive defaults). Headers are
  // still matched so requests can't collide across endpoints.
  return setupPollyWithOptions(recordingName, {
    matchRequestsBy: {
      headers: {
        exclude: [
          "authorization",
          "user-agent",
          "x-api-key",
          "xi-api-key",
          "x-dashscope-ossresourceresolve",
          "x-goog-api-key",
          "x-amz-date",
          "x-amz-security-token",
        ],
      },
      body: false,
    },
  });
}

type RawPollyMode = "record" | "replay" | "passthrough" | "record-missing";
type PollyAdapterMode = "record" | "replay" | "passthrough";

function resolvePollyMode(): {
  raw: RawPollyMode;
  adapter: PollyAdapterMode;
  recordIfMissing: boolean;
} {
  const raw = (process.env.POLLY_MODE ?? "replay") as RawPollyMode;
  if (raw === "record-missing") {
    return { raw, adapter: "replay", recordIfMissing: true };
  }
  return { raw, adapter: raw, recordIfMissing: false };
}

function setupPollyWithOptions(
  recordingName: string,
  options: {
    matchRequestsBy?: Record<string, unknown>;
    beforePersist?: (recording: PersistedHarRecording) => void;
  }
): PollyContext {
  const { raw, adapter, recordIfMissing } = resolvePollyMode();
  const recordingsDir = path.resolve(import.meta.dirname, "recordings");

  const defaultMatchRequestsBy = {
    headers: {
      exclude: [
        "authorization",
        "user-agent",
        "x-api-key",
        "xi-api-key",
        "x-dashscope-ossresourceresolve",
        "x-goog-api-key",
        "x-amz-date",
        "x-amz-security-token",
      ],
    },
  };

  const polly = new Polly(recordingName, {
    mode: adapter,
    adapters: [FetchAdapter],
    persister: FSPersister,
    persisterOptions: {
      fs: { recordingsDir },
    },
    recordIfMissing,
    recordFailedRequests: true,
    timing: Timing.fixed(0),
    matchRequestsBy: options.matchRequestsBy ?? defaultMatchRequestsBy,
  });

  // Redact sensitive values before persisting to disk and keep a scrubbed
  // multipart summary so prompts remain visible in the harness viewer.
  polly.server.any().on("beforePersist", (req, recording) => {
    if (recording.request?.url) {
      const requestId = redactedRequestId(req);
      if (requestId) recording._id = requestId;
    }

    if (
      typeof FormData !== "undefined" &&
      req.body instanceof FormData &&
      recording.request
    ) {
      const contentType =
        findHeaderValue(recording.request.headers, "content-type") ??
        "multipart/form-data";
      recording.request.postData ??= { mimeType: contentType, params: [] };
      recording.request.postData.mimeType = contentType;
      recording.request.postData.text = JSON.stringify(
        summarizeMultipartFormData(req.body)
      );
    }

    options.beforePersist?.(recording as PersistedHarRecording);
    redactPersistedHarSecrets(recording as PersistedHarRecording);
    scrubSensitiveResponse(recording);
  });

  return { polly, mode: raw };
}

export async function teardownPolly(ctx: PollyContext): Promise<void> {
  await ctx.polly.stop();
}

export function recordingExists(recordingName: string): boolean {
  const recordingsDir = path.resolve(import.meta.dirname, "recordings");
  // Polly normalizes dots to hyphens when creating directory names
  const parts = recordingName.split("/").map((p) => p.replace(/\./g, "-"));
  function walk(dir: string, depth: number): boolean {
    if (depth === parts.length) {
      return fs.existsSync(path.join(dir, "recording.har"));
    }
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.startsWith(parts[depth] + "_")) {
        if (walk(path.join(dir, entry.name), depth + 1)) {
          return true;
        }
      }
    }
    return false;
  }
  try {
    return walk(recordingsDir, 0);
  } catch {
    return false;
  }
}

export function getPollyMode(): RawPollyMode {
  return (process.env.POLLY_MODE ?? "replay") as RawPollyMode;
}

// ---------------------------------------------------------------------------
// OTP helpers for paid-endpoint tests
// ---------------------------------------------------------------------------
import { mintOtp } from "../packages/provider/cost/src/paygate";

/**
 * Fixed shared HMAC secret used across paid-endpoint tests. Construct gated
 * providers with `{ paygate: { secret: TEST_PAYGATE_SECRET } }` and mint OTPs
 * with the same secret.
 */
export const TEST_PAYGATE_SECRET = "apicity-test-paygate-secret";

/**
 * Generate a valid OTP for a KIE createTask request, signed with the test
 * secret and bound to the exact request payload.
 */
export function mintKieCreateTaskOtp(request: Record<string, unknown>): {
  otp: string;
} {
  return {
    otp: mintOtp(TEST_PAYGATE_SECRET, {
      dotPath: "api.v1.jobs.createTask",
      request,
    }),
  };
}

export function mintKieVeoOtp(
  dotPath: "api.v1.veo.generate" | "api.v1.veo.extend",
  request: Record<string, unknown>
): { otp: string } {
  return {
    otp: mintOtp(TEST_PAYGATE_SECRET, {
      dotPath,
      request,
    }),
  };
}

export function mintXaiOtp(
  dotPath: string,
  request: Record<string, unknown>
): { otp: string } {
  return {
    otp: mintOtp(TEST_PAYGATE_SECRET, {
      dotPath,
      request,
    }),
  };
}
