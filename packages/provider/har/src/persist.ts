import { createHash } from "node:crypto";
import {
  PERSISTED_REQUEST_HEADER_PLACEHOLDERS,
  redactUrlSecrets,
  redactFalCheckpoints,
} from "./har-secrets.mjs";
import { scrubSensitiveRecording, type HarCookieLike } from "./har-scrub.js";
interface PersistedHarHeader {
  name?: string;
  value?: string;
}

export interface PersistedHarRecording {
  _id?: string;
  request?: {
    url?: string;
    bodySize?: number;
    headers?: PersistedHarHeader[];
    cookies?: HarCookieLike[];
    postData?: {
      mimeType?: string;
      params?: unknown[];
      text?: string;
    };
  };
  response?: {
    redirectURL?: string;
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

interface MultipartFormDataLike {
  entries(): Iterable<[string, FormDataEntryValue]>;
}

const REDACTED_GUEST_TOKEN = "***";
const REQUEST_POST_DATA_SECRET_KEYS = new Set([
  "ossaccesskeyid",
  "policy",
  "signature",
]);
const RESPONSE_ACCOUNT_METADATA_KEYS = new Set(["create_api_key_id"]);
const DATA_URL_BASE64_RE = /^data:([^;,]+)?(?:;[^,]*)*;base64,([\s\S]*)$/i;
const LONG_BASE64_CHARS = 1024;
const BASE64ISH_RE = /^[A-Za-z0-9+/_-]+={0,2}$/;
function appendMultipartField(
  summary: Record<string, unknown>,
  name: string,
  value: MultipartSummaryValue
): void {
  const current = Object.hasOwn(summary, name) ? summary[name] : undefined;
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

// Explicit credential names only: generic `key`, `token` and `signature`
// also describe model data, so their existing provider-specific rules stay.
const GENERIC_CREDENTIAL_KEYS = new Set([
  "apikey",
  "accesstoken",
  "refreshtoken",
  "authtoken",
  "clientsecret",
  "secretaccesskey",
  "privatekey",
  "password",
]);

function isCredentialKey(key: string): boolean {
  return GENERIC_CREDENTIAL_KEYS.has(key.replace(/[_-]/g, "").toLowerCase());
}

function redactGenericCredentialText(text: string): string {
  let changed = false;
  function visit(value: unknown, key?: string): unknown {
    if (key && isCredentialKey(key) && value !== null) {
      changed ||= value !== "***";
      return "***";
    }
    if (Array.isArray(value)) return value.map((item) => visit(item));
    if (value === null || typeof value !== "object") return value;
    const result: Record<string, unknown> = Object.create(null);
    for (const [name, item] of Object.entries(value)) {
      result[name] = visit(item, name);
    }
    return result;
  }
  try {
    const clean = visit(JSON.parse(text) as unknown);
    // Keep formatting and ordinary provider payloads byte-for-byte.
    return changed ? JSON.stringify(clean) : text;
  } catch {
    // SSE and truncated JSON cannot be parsed as one document. Match JSON
    // string fields (including escaped quotes) without rewriting other text.
    return text.replace(
      /("([^"\\]*(?:\\.[^"\\]*)*)"\s*:\s*")((?:\\.|[^"\\])*)("|$)/g,
      (match, prefix: string, key: string, _value: string, end: string) => {
        try {
          return isCredentialKey(JSON.parse(`"${key}"`) as string)
            ? `${prefix}***${end}`
            : match;
        } catch {
          return match;
        }
      }
    );
  }
}

function redactResponseTextSecrets(text: string): string {
  const redacted = redactUrlSecrets(redactGenericCredentialText(text));
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

function redactRequestPostDataValueSecrets(
  value: unknown,
  key?: string,
  secretKeys: Set<string> = REQUEST_POST_DATA_SECRET_KEYS
): { value: unknown; redacted: boolean } {
  if (key && secretKeys.has(key.toLowerCase()) && typeof value === "string") {
    return { value: "***", redacted: value !== "***" };
  }

  if (typeof value === "string") {
    const result = redactUrlSecrets(value);
    return { value: result, redacted: result !== value };
  }
  if (Array.isArray(value)) {
    let redacted = false;
    const next = value.map((item) => {
      const result = redactRequestPostDataValueSecrets(
        item,
        undefined,
        secretKeys
      );
      redacted ||= result.redacted;
      return result.value;
    });
    return { value: next, redacted };
  }

  if (value === null || typeof value !== "object") {
    return { value, redacted: false };
  }

  let redacted = false;
  const next: Record<string, unknown> = Object.create(null);
  for (const [childKey, childValue] of Object.entries(
    value as Record<string, unknown>
  )) {
    const result = redactRequestPostDataValueSecrets(
      childValue,
      childKey,
      secretKeys
    );
    redacted ||= result.redacted;
    next[childKey] = result.value;
  }
  return { value: next, redacted };
}

function redactRequestPostDataTextSecrets(
  recording: PersistedHarRecording
): void {
  const postData = recording.request?.postData;
  const raw = postData?.text;
  if (!postData || typeof raw !== "string") return;
  const text = redactGenericCredentialText(raw);
  postData.text = text;
  const secretKeys = new Set(REQUEST_POST_DATA_SECRET_KEYS);

  try {
    const parsed = JSON.parse(text) as unknown;
    const result = redactRequestPostDataValueSecrets(
      parsed,
      undefined,
      secretKeys
    );
    if (result.redacted) {
      postData.text = JSON.stringify(result.value);
    }
  } catch {
    postData.text = redactUrlSecrets(text)
      .replace(/("OSSAccessKeyId"\s*:\s*")[^"]*(")/g, "$1***$2")
      .replace(/("Signature"\s*:\s*")[^"]*(")/g, "$1***$2")
      .replace(/("policy"\s*:\s*")[^"]*(")/g, "$1***$2");
  }
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

function scrubRequestCookieHeaders(
  headers: PersistedHarHeader[] | undefined
): void {
  if (!headers) return;

  const retainedHeaders = headers.filter(
    (header) => header.name?.toLowerCase() !== "cookie"
  );
  headers.splice(0, headers.length, ...retainedHeaders);
}

function scrubRequestCookies(cookies: HarCookieLike[] | undefined): void {
  cookies?.splice(0, cookies.length);
}

// The request headers redactPersistedHarSecrets redacts, each mapped to the
// placeholder it writes. The table lives in the package har-secrets.mjs so that
// node scripts can read it without loading Polly; it is re-exported here as
// this harness's redaction contract, which
// tests/unit/har-request-secrets.test.ts holds every committed recording to.
export { PERSISTED_REQUEST_HEADER_PLACEHOLDERS };

export function redactPersistedHarSecrets(
  recording: PersistedHarRecording
): void {
  if (recording.request?.url) {
    recording.request.url = redactUrlSecrets(recording.request.url);
  }

  scrubRequestCookieHeaders(recording.request?.headers);

  scrubRequestCookies(recording.request?.cookies);
  redactRequestPostDataTextSecrets(recording);
  redactDashScopeResponseHeaders(recording.response?.headers);
  for (const header of [
    ...(recording.request?.headers ?? []),
    ...(recording.response?.headers ?? []),
  ]) {
    if (header.value) header.value = redactUrlSecrets(header.value);
  }
  if (recording.response?.redirectURL) {
    recording.response.redirectURL = redactUrlSecrets(
      recording.response.redirectURL
    );
  }

  const responseContent = recording.response?.content;
  if (responseContent && typeof responseContent.text === "string") {
    responseContent.text = redactResponseTextSecrets(responseContent.text);
  }
  redactFalCheckpointResponseBody(recording);
  redactGuestTokenResponseBody(recording);
  redactFireworksApiKeyResponseBody(recording);
  redactResponseAccountMetadataBody(recording);
  scrubSensitiveRecording(recording);
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

function normalizedBase64(value: string): string {
  return value.replace(/\s/g, "").replace(/-/g, "+").replace(/_/g, "/");
}

function base64ByteLength(value: string): number {
  const base64 = normalizedBase64(value);
  if (base64.length === 0) return 0;

  const paddingLength = (4 - (base64.length % 4)) % 4;
  return Buffer.from(`${base64}${"=".repeat(paddingLength)}`, "base64").length;
}

function summarizeInlineDataUrl(value: string): string | undefined {
  const match = value.match(DATA_URL_BASE64_RE);
  if (!match) return undefined;

  const mime = match[1] || "binary";
  return `<inline ${mime} data URL — replace with a real URL or upload>`;
}

function summarizeLongBase64(value: string): string | undefined {
  const compact = value.replace(/\s/g, "");
  if (compact.length <= LONG_BASE64_CHARS) return undefined;
  if (compact.length % 4 === 1) return undefined;
  if (!BASE64ISH_RE.test(compact)) return undefined;

  return `<inline base64 data; ${base64ByteLength(compact)} bytes>`;
}

export function summarizeJsonMediaStrings(value: unknown): {
  value: unknown;
  summarized: boolean;
} {
  if (typeof value === "string") {
    const summary = summarizeInlineDataUrl(value) ?? summarizeLongBase64(value);
    return { value: summary ?? value, summarized: summary !== undefined };
  }

  if (Array.isArray(value)) {
    let summarized = false;
    const values = value.map((item) => {
      const result = summarizeJsonMediaStrings(item);
      summarized ||= result.summarized;
      return result.value;
    });
    return { value: values, summarized };
  }

  if (value === null || typeof value !== "object") {
    return { value, summarized: false };
  }

  let summarized = false;
  const out: Record<string, unknown> = Object.create(null);
  for (const [key, item] of Object.entries(value)) {
    const result = summarizeJsonMediaStrings(item);
    summarized ||= result.summarized;
    out[key] = result.value;
  }
  return { value: out, summarized };
}

function isJsonMimeType(mimeType: string | undefined): boolean {
  const lower = mimeType?.toLowerCase() ?? "";
  return lower.includes("application/json") || lower.includes("+json");
}

function baseMimeType(mimeType: string | undefined): string {
  return (mimeType ?? "").split(";")[0].trim().toLowerCase();
}

function isPersistableTextMimeType(mimeType: string | undefined): boolean {
  const mime = baseMimeType(mimeType);
  return (
    mime.startsWith("text/") ||
    mime === "application/xml" ||
    mime.endsWith("+xml")
  );
}

function decodeUtf8(bytes: Uint8Array): string | null {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

function requestBodyText(body: unknown): string | null {
  if (typeof body === "string") return body;
  if (body instanceof ArrayBuffer) return decodeUtf8(new Uint8Array(body));
  if (ArrayBuffer.isView(body)) {
    return decodeUtf8(
      new Uint8Array(body.buffer, body.byteOffset, body.byteLength)
    );
  }
  return null;
}

export function persistSafeTextRequestBody(
  recording: PersistedHarRecording,
  body: unknown
): void {
  const request = recording.request;
  if (!request) return;
  if (typeof request.postData?.text === "string") return;

  const mimeType =
    request.postData?.mimeType ??
    findHeaderValue(request.headers, "content-type");
  if (!isPersistableTextMimeType(mimeType)) return;

  const text = requestBodyText(body);
  if (!text) return;

  request.postData ??= { mimeType, params: [] };
  request.postData.mimeType = request.postData.mimeType ?? mimeType;
  request.postData.text = text;
  request.bodySize = byteLength(text);
}

export function summarizeJsonRequestBodyMedia(
  recording: PersistedHarRecording
): void {
  const postData = recording.request?.postData;
  const text = postData?.text;
  if (
    !postData ||
    !isJsonMimeType(postData.mimeType) ||
    typeof text !== "string"
  )
    return;

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return;
  }

  const result = summarizeJsonMediaStrings(parsed);
  if (!result.summarized) return;

  const nextText =
    JSON.stringify(result.value) + (text.endsWith("\n") ? "\n" : "");
  postData.text = nextText;
  if (recording.request) {
    recording.request.bodySize = byteLength(nextText);
  }
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
  const redactedObject: Record<string, unknown> = Object.create(null);
  for (const [key, item] of Object.entries(value)) {
    if (key === "guestToken" && typeof item === "string") {
      redactedObject[key] = REDACTED_GUEST_TOKEN;
      redacted ||= item !== REDACTED_GUEST_TOKEN;
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

  writeJsonResponseBody(recording, result.value, text);
}

function writeJsonResponseBody(
  recording: PersistedHarRecording,
  value: unknown,
  originalText: string
): void {
  const content = recording.response?.content;
  if (!content) return;

  const nextText =
    JSON.stringify(value) + (originalText.endsWith("\n") ? "\n" : "");
  const size = byteLength(nextText);
  content.text = nextText;
  content.size = size;
  if (recording.response) {
    recording.response.bodySize = size;
  }
}

// A fal response can carry a `checkpoint`: a `.safetensors` URL and the
// `signature` fal issues for it, valid for a day, bound for a public
// repository. The rule lives in the package har-secrets.mjs, whose finder
// check-recording-secrets.mjs runs over every recording, and is scoped to that
// object the way redactResponseTextSecrets scopes its `signature` rule to an
// OSS upload policy: kimicoding thinking blocks carry a `signature` that the
// next recorded request echoes.
function redactFalCheckpointResponseBody(
  recording: PersistedHarRecording
): void {
  const content = recording.response?.content;
  const text = content?.text;
  if (typeof text !== "string" || text.length === 0) return;

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return;
  }

  const result = redactFalCheckpoints(parsed);
  if (!result.redacted) return;

  writeJsonResponseBody(recording, result.value, text);
}

function redactResponseAccountMetadata(value: unknown): {
  value: unknown;
  redacted: boolean;
} {
  if (Array.isArray(value)) {
    let redacted = false;
    const redactedValues = value.map((item) => {
      const result = redactResponseAccountMetadata(item);
      redacted ||= result.redacted;
      return result.value;
    });
    return { value: redactedValues, redacted };
  }
  if (value === null || typeof value !== "object") {
    return { value, redacted: false };
  }

  let redacted = false;
  const redactedObject: Record<string, unknown> = Object.create(null);
  for (const [key, item] of Object.entries(value)) {
    if (
      RESPONSE_ACCOUNT_METADATA_KEYS.has(key.toLowerCase()) &&
      typeof item === "string"
    ) {
      redactedObject[key] = "***";
      redacted ||= item !== "***";
      continue;
    }

    const result = redactResponseAccountMetadata(item);
    redacted ||= result.redacted;
    redactedObject[key] = result.value;
  }
  return { value: redactedObject, redacted };
}

function redactResponseAccountMetadataBody(
  recording: PersistedHarRecording
): void {
  const content = recording.response?.content;
  const text = content?.text;
  if (typeof text !== "string" || text.length === 0) return;

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return;
  }

  const result = redactResponseAccountMetadata(parsed);
  if (!result.redacted) return;

  writeJsonResponseBody(recording, result.value, text);
}

function redactFireworksApiKeyEntry(value: unknown): {
  value: unknown;
  redacted: boolean;
} {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return { value, redacted: false };
  }

  let redacted = false;
  const redactedObject: Record<string, unknown> = Object.create(null);
  for (const [key, item] of Object.entries(value)) {
    if (
      ["displayName", "email", "keyId", "prefix"].includes(key) &&
      typeof item === "string"
    ) {
      redactedObject[key] = "***";
      redacted ||= item !== "***";
      continue;
    }
    if (key === "key" && typeof item === "string" && item.length > 0) {
      redactedObject[key] = "***";
      redacted ||= item !== "***";
      continue;
    }
    redactedObject[key] = item;
  }
  return { value: redactedObject, redacted };
}

function redactFireworksApiKeys(value: unknown): {
  value: unknown;
  redacted: boolean;
} {
  if (Array.isArray(value)) {
    let redacted = false;
    const redactedValues = value.map((item) => {
      const result = redactFireworksApiKeys(item);
      redacted ||= result.redacted;
      return result.value;
    });
    return { value: redactedValues, redacted };
  }
  if (value === null || typeof value !== "object") {
    return { value, redacted: false };
  }

  let redacted = false;
  const redactedObject: Record<string, unknown> = Object.create(null);
  for (const [key, item] of Object.entries(value)) {
    if (key === "apiKeys" && Array.isArray(item)) {
      const redactedApiKeys = item.map((apiKey) => {
        const result = redactFireworksApiKeyEntry(apiKey);
        redacted ||= result.redacted;
        return result.value;
      });
      redactedObject[key] = redactedApiKeys;
      continue;
    }

    const result = redactFireworksApiKeys(item);
    redacted ||= result.redacted;
    redactedObject[key] = result.value;
  }
  return { value: redactedObject, redacted };
}

function redactFireworksApiKeyResponseBody(
  recording: PersistedHarRecording
): void {
  const content = recording.response?.content;
  const text = content?.text;
  if (typeof text !== "string" || text.length === 0) return;

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return;
  }

  const result = redactFireworksApiKeys(parsed);
  if (!result.redacted) return;

  writeJsonResponseBody(recording, result.value, text);
}

export function stableStringify(value: unknown): string | undefined {
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
  const redactedObject: Record<string, unknown> = Object.create(null);
  for (const key of Object.keys(value as Record<string, unknown>)) {
    const result = redactIdentifierSecrets(
      (value as Record<string, unknown>)[key]
    );
    redacted ||= result.redacted;
    redactedObject[key] = result.value;
  }
  return { value: redactedObject, redacted };
}

export function redactedRequestId(req: unknown): string | undefined {
  const identifiers = (req as { identifiers?: unknown }).identifiers;
  if (!identifiers) return undefined;
  const result = redactIdentifierSecrets(identifiers);
  if (!result.redacted) return undefined;
  const serialized = stableStringify(result.value);
  if (!serialized) return undefined;
  return createHash("md5").update(serialized).digest("hex");
}

export function summarizeMultipartFormData(
  form: MultipartFormDataLike
): Record<string, unknown> {
  const summary: Record<string, unknown> = Object.assign(Object.create(null), {
    _multipart: true,
  });
  for (const [name, value] of form.entries()) {
    appendMultipartField(summary, name, summarizeMultipartValue(value));
  }
  return summary;
}

function isMultipartFormDataBody(
  value: unknown
): value is MultipartFormDataLike {
  if (typeof FormData !== "undefined" && value instanceof FormData) {
    return true;
  }

  if (value === null || typeof value !== "object") {
    return false;
  }

  if (Object.prototype.toString.call(value) !== "[object FormData]") {
    return false;
  }

  const candidate = value as { entries?: unknown };
  return typeof candidate.entries === "function";
}

export function summarizeMultipartRequestBody(
  body: unknown
): Record<string, unknown> | null {
  if (!isMultipartFormDataBody(body)) return null;
  return summarizeMultipartFormData(body);
}
