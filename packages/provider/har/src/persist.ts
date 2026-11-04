import { createHash } from "node:crypto";
import { types } from "node:util";
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
// Each `;` has one way to match: `[^,]` here made a run of them exponential.
const DATA_URL_BASE64_RE = /^data:([^;,]+)?(?:;[^;,]*)*;base64,([\s\S]*)$/i;
const LONG_BASE64_CHARS = 1024;
const MIN_BASE64_WRAP = 60;
const OCTET_STREAM = "application/octet-stream";
const BASE64ISH_RE = /^[A-Za-z0-9+/_-]+={0,2}$/;
const BASE64ISH_BYTES = new Uint8Array(256);
for (const byte of Buffer.from(
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/_-"
)) {
  BASE64ISH_BYTES[byte] = 1;
}
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

function isFormEncoded(mimeType: string | undefined): boolean {
  return /^application\/x-www-form-urlencoded\b/i.test(mimeType ?? "");
}

// Text a form could have written, whatever its content type says: a field name first,
// and no white space, which a form encodes. JSON, SSE, URLs and prose all fail this.
function looksLikeForm(text: string): boolean {
  return /^[\w.%+-]+=/.test(text) && !/\s/.test(text);
}

// Only a value under a credential name changes, so a clean form stays byte for byte.
function redactFormCredentials(text: string): string {
  return text
    .split("&")
    .map((field) => {
      const equals = field.indexOf("=");
      if (equals < 0) return field;
      const name = field.slice(0, equals);
      let decoded = name;
      try {
        decoded = decodeURIComponent(name);
      } catch {
        // A malformed escape: read the name as written.
      }
      // A nested form spells a key `user[password]`.
      return decoded.split(/[[\]]/).some(isCredentialKey)
        ? `${name}=***`
        : field;
    })
    .join("&");
}

function redactFormParams(params: unknown[] | undefined): void {
  for (const param of params ?? []) {
    const { name, value } = (param ?? {}) as {
      name?: unknown;
      value?: unknown;
    };
    if (
      typeof name === "string" &&
      value !== undefined &&
      isCredentialKey(name)
    ) {
      (param as { value: unknown }).value = "***";
    }
  }
}

// The index of the quote closing the string opened at `open`. A quote with an odd run
// of backslashes before it is escaped.
function closingQuote(text: string, open: number): number {
  let quote = text.indexOf('"', open + 1);
  while (quote >= 0) {
    let backslashes = 0;
    while (text[quote - 1 - backslashes] === "\\") backslashes += 1;
    if (backslashes % 2 === 0) return quote;
    quote = text.indexOf('"', quote + 1);
  }
  return text.length;
}

function afterJsonSpace(text: string, from: number): number {
  let at = from;
  while (
    text[at] === " " ||
    text[at] === "\n" ||
    text[at] === "\r" ||
    text[at] === "\t"
  ) {
    at += 1;
  }
  return at;
}

// How many keys a valid document's text holds: every string followed by a colon.
// Walking its strings in order cannot lose its place, and a loop has no regex
// backtrack stack for millions of escapes to overflow.
function keysInJsonText(text: string): number {
  let keys = 0;
  let open = text.indexOf('"');
  while (open >= 0) {
    const close = closingQuote(text, open);
    if (text[afterJsonSpace(text, close + 1)] === ":") keys += 1;
    open = text.indexOf('"', close + 1);
  }
  return keys;
}

function redactGenericCredentialText(text: string): string {
  let changed = false;
  let keys = 0;
  function visit(value: unknown, key?: string): unknown {
    if (key && isCredentialKey(key) && value !== null) {
      changed ||= value !== "***";
      return "***";
    }
    if (Array.isArray(value)) return value.map((item) => visit(item));
    if (value === null || typeof value !== "object") return value;
    const result: Record<string, unknown> = Object.create(null);
    for (const [name, item] of Object.entries(value)) {
      keys += 1;
      result[name] = visit(item, name);
    }
    return result;
  }
  try {
    const clean = visit(JSON.parse(text) as unknown);
    // A parse keeps only a duplicate key's last value, so an earlier one is in the text
    // where no rule reading the parse can see it. Write what was parsed instead.
    if (changed || keys !== keysInJsonText(text)) return JSON.stringify(clean);
    // Keep formatting and ordinary provider payloads byte-for-byte.
    return text;
  } catch {
    // SSE and truncated JSON cannot be parsed as one document. Match JSON
    // string fields (including escaped quotes) without rewriting other text. An
    // escaped quote opens nothing, and trying each one made long strings quadratic.
    return text.replace(
      /(?<!\\)("([^"\\]*(?:\\.[^"\\]*)*)"\s*:\s*")((?:\\.|[^"\\])*)("|$)/g,
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

// An SSE body never parses as one document, so the rules that read a whole document
// run on each frame here. Reading a frame alone also keeps valid JSON such as
// `{"a":[":"],"api_key":"…"}` from putting the text match out of phase.
function redactStreamFrames(text: string): string {
  if (!text.includes("data:")) return text;
  return text
    .split("\n")
    .map((line) => {
      if (!line.startsWith("data:")) return line;
      const payload = line.slice("data:".length).trim();
      if (payload[0] !== "{" && payload[0] !== "[") return line;
      const frame: PersistedHarRecording = {
        response: { content: { text: redactGenericCredentialText(payload) } },
      };
      redactFalCheckpointResponseBody(frame);
      redactGuestTokenResponseBody(frame);
      redactFireworksApiKeyResponseBody(frame);
      redactResponseAccountMetadataBody(frame);
      const clean = frame.response!.content!.text!;
      if (clean === payload) return line;
      return `data: ${clean}${line.endsWith("\r") ? "\r" : ""}`;
    })
    .join("\n");
}

function redactResponseTextSecrets(text: string): string {
  const redacted = redactUrlSecrets(
    redactGenericCredentialText(
      redactStreamFrames(
        looksLikeForm(text) ? redactFormCredentials(text) : text
      )
    )
  );
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
    const result = redactUrlSecrets(
      looksLikeForm(value) ? redactFormCredentials(value) : value
    );
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
  redactFormParams(postData?.params);
  const raw = postData?.text;
  if (!postData || typeof raw !== "string") return;
  const text = redactGenericCredentialText(
    isFormEncoded(postData.mimeType) || looksLikeForm(raw)
      ? redactFormCredentials(raw)
      : raw
  );
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

// Base64 wraps on line ends, at one width. A string with spaces in it is text, and so
// is a list of words, paths or ids with one to a line.
function longBase64(value: string): string | undefined {
  if (value.length <= LONG_BASE64_CHARS) return undefined;
  const lines = value.trim().split(/\r?\n/);
  const last = lines.length - 1;
  const width = lines[0]!.length;
  if (
    last > 0 &&
    (width < MIN_BASE64_WRAP ||
      lines[last]!.length > width ||
      lines.slice(0, last).some((line) => line.length !== width))
  ) {
    return undefined;
  }
  const compact = lines.join("");
  if (compact.length <= LONG_BASE64_CHARS) return undefined;
  if (compact.length % 4 === 1) return undefined;
  return BASE64ISH_RE.test(compact) ? compact : undefined;
}

function summarizeLongBase64(value: string): string | undefined {
  const compact = longBase64(value);
  return compact === undefined
    ? undefined
    : `<inline base64 data; ${base64ByteLength(compact)} bytes>`;
}

function mediaPlaceholder(bytes: Uint8Array, contentType: string): object {
  return {
    _apicity_placeholder: {
      sha256: createHash("sha256").update(bytes).digest("hex"),
      bytes: bytes.byteLength,
      contentType,
    },
  };
}

// `data:[<media type>][;<parameter>...][;base64],<payload>`, read without a regex: a long
// run of `;` overflows one's stack. Only base64 or a media type makes it a URL, since
// `data:note, some words` and `data: a/b, more` are prose.
function parseDataUrl(value: string) {
  const comma = value.indexOf(",");
  if (comma < 0 || value.slice(0, 5).toLowerCase() !== "data:")
    return undefined;
  const header = value.slice(5, comma);
  const end = header.indexOf(";");
  const mime = end < 0 ? header : header.slice(0, end);
  const flag = header.slice(header.lastIndexOf(";") + 1);
  const base64 = flag.trim().toLowerCase() === "base64";
  if (!base64 && mime && (!mime.includes("/") || /\s/.test(mime))) {
    return undefined;
  }
  return { mime: mime.trim(), base64, payload: value.slice(comma + 1) };
}

// A data URL's bytes are what it decodes to. One that is not base64 stays as written.
function inputStringPlaceholder(value: string): object | undefined {
  if (value.length <= LONG_BASE64_CHARS) return undefined;
  const url = parseDataUrl(value.trimStart());
  if (url) {
    return mediaPlaceholder(
      Buffer.from(url.payload, url.base64 ? "base64" : "utf8"),
      url.mime || OCTET_STREAM
    );
  }
  const compact = longBase64(value);
  return compact === undefined
    ? undefined
    : mediaPlaceholder(Buffer.from(compact, "base64"), OCTET_STREAM);
}

// The bytes a value holds. A buffer transferred away reads as empty, and a view of it
// throws. A Buffer has already gone through toJSON by the time a replacer sees it.
function inputBytes(value: unknown): Uint8Array | undefined {
  if (types.isAnyArrayBuffer(value)) {
    return value.byteLength ? new Uint8Array(value) : undefined;
  }
  if (ArrayBuffer.isView(value)) {
    return value.buffer.byteLength
      ? new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
      : undefined;
  }
  const json = value as { type?: unknown; data?: unknown } | null | undefined;
  return json?.type === "Buffer" && Array.isArray(json.data)
    ? Buffer.from(json.data)
    : undefined;
}

/**
 * Call input as JSON, with each long data URL, base64 field and byte array replaced
 * by the placeholder a dropped body leaves: cost evidence needs the model, parameters
 * and sizes, never the bytes. Short strings and long prose stay.
 */
export function summarizeInputMedia(input: unknown): unknown {
  const copies = new WeakMap<object, unknown>();
  function prepare(value: unknown, key: string, useToJSON = true): unknown {
    const bytes = inputBytes(value);
    if (bytes) return mediaPlaceholder(bytes, OCTET_STREAM);
    if (typeof value === "string")
      return inputStringPlaceholder(value) ?? value;
    if (value === null || typeof value !== "object") return value;
    // Buffer must be handled before toJSON expands every byte to a number.
    const object = value as Record<string, unknown>;
    if (useToJSON && typeof object.toJSON === "function") {
      return prepare(object.toJSON(key), key, false);
    }
    if (types.isBoxedPrimitive(value)) return value;
    if (copies.has(value)) return copies.get(value);
    const result: Record<string, unknown> | unknown[] = Array.isArray(value)
      ? new Array(value.length)
      : Object.create(null);
    copies.set(value, result);
    for (const name of Object.keys(value)) {
      const child = object[name];
      // JSON already invoked this hook once; do not copy an executable hook.
      if (name === "toJSON" && typeof child === "function") continue;
      (result as Record<string, unknown>)[name] = prepare(child, name);
    }
    return result;
  }
  const text = JSON.stringify(prepare(input, ""));
  return text === undefined ? input : JSON.parse(text);
}

// The bytes summarizing could remove from a JSON body, counted without parsing it.
// Base64 wrapped across lines goes uncounted, and such a body stays a placeholder.
export function longBase64Bytes(body: Uint8Array): number {
  let total = 0;
  let run = 0;
  for (let i = 0; i < body.length; i += 1) {
    if (BASE64ISH_BYTES[body[i]!] === 1) {
      run += 1;
      continue;
    }
    if (run > LONG_BASE64_CHARS) total += run;
    run = 0;
  }
  return run > LONG_BASE64_CHARS ? total + run : total;
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
