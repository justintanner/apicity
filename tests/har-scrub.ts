export const REDACTED_HAR_VALUE = "***";

export interface HarHeaderLike {
  name?: string;
  value?: string;
}

export interface HarCookieLike {
  value?: string;
  [key: string]: unknown;
}

export interface HarRequestLike {
  url?: string;
  bodySize?: number;
  headers?: HarHeaderLike[];
  cookies?: HarCookieLike[];
  postData?: {
    text?: string;
    mimeType?: string;
    params?: unknown[];
  };
}

export interface HarResponseLike {
  bodySize?: number;
  headers?: HarHeaderLike[];
  cookies?: HarCookieLike[];
  content?: {
    text?: string;
    size?: number;
    mimeType?: string;
    encoding?: string;
  };
}

export interface HarRecordingLike {
  request?: HarRequestLike;
  response?: HarResponseLike;
}

const SENSITIVE_REQUEST_HEADER_NAMES = new Set([
  "authorization",
  "x-api-key",
  "xi-api-key",
  "x-goog-api-key",
  "x-amz-security-token",
  "poly-api-key",
  "poly-passphrase",
  "poly-signature",
  "poly-address",
  "poly-timestamp",
  "poly-nonce",
]);

const SENSITIVE_RESPONSE_HEADER_NAMES = new Set([
  "anthropic-organization-id",
  "cf-ray",
  "cookie",
  "openai-organization",
  "openai-project",
  "origin-cf-ray",
  "request-id",
  "set-cookie",
  "traceresponse",
  "x-amz-id-2",
  "x-amz-request-id",
  "x-amzn-requestid",
  "x-amzn-trace-id",
  "x-dashscope-inner-user-group",
  "x-dashscope-inner-user-meta",
  "x-mbx-uuid",
  "x-request-id",
]);

function normalizedHeaderName(name: string | undefined): string {
  return (name ?? "").toLowerCase().replace(/_/g, "-");
}

function isBuilderOrRelayerSecretHeader(name: string | undefined): boolean {
  const normalized = normalizedHeaderName(name);
  if (
    !normalized.includes("builder") &&
    !normalized.includes("relayer") &&
    !normalized.includes("relay")
  ) {
    return false;
  }

  return (
    normalized.includes("api-key") ||
    normalized.includes("apikey") ||
    normalized.includes("key") ||
    normalized.includes("passphrase") ||
    normalized.includes("secret") ||
    normalized.includes("signature") ||
    normalized.includes("token") ||
    normalized.includes("address") ||
    normalized.includes("timestamp") ||
    normalized.includes("nonce")
  );
}

export function isSensitiveRequestHeaderName(
  name: string | undefined
): boolean {
  const normalized = normalizedHeaderName(name);
  if (!normalized) return false;
  return (
    SENSITIVE_REQUEST_HEADER_NAMES.has(normalized) ||
    isBuilderOrRelayerSecretHeader(name)
  );
}

export function isSensitiveResponseHeaderName(
  name: string | undefined
): boolean {
  if (!name) return false;
  const lower = name.toLowerCase();
  return (
    SENSITIVE_RESPONSE_HEADER_NAMES.has(lower) ||
    lower.includes("organization") ||
    lower.includes("project") ||
    lower.startsWith("ratelimit-") ||
    lower.startsWith("x-rate-limit-") ||
    lower.startsWith("x-ratelimit-") ||
    lower.endsWith("cf-ray") ||
    /(^|-)request-id$/.test(lower) ||
    lower.endsWith("requestid") ||
    lower.includes("trace")
  );
}

function isRequestCookieHeaderName(name: string | undefined): boolean {
  return normalizedHeaderName(name) === "cookie";
}

function redactHeaderValue(name: string | undefined): string {
  return normalizedHeaderName(name) === "authorization" ? "Bearer ***" : "***";
}

export function scrubSensitiveRequestHeaders(
  headers: HarHeaderLike[] | undefined
): void {
  if (!headers) return;

  const retainedHeaders = headers.filter(
    (header) => !isRequestCookieHeaderName(header.name)
  );
  for (const header of retainedHeaders) {
    if (isSensitiveRequestHeaderName(header.name)) {
      header.value = redactHeaderValue(header.name);
    }
  }
  headers.splice(0, headers.length, ...retainedHeaders);
}

export function scrubSensitiveResponseHeaders(
  headers: HarHeaderLike[] | undefined
): void {
  if (!headers) return;

  const retainedHeaders = headers.filter(
    (header) => !isSensitiveResponseHeaderName(header.name)
  );
  headers.splice(0, headers.length, ...retainedHeaders);
}

export function scrubResponseCookies(
  cookies: HarCookieLike[] | undefined
): void {
  cookies?.splice(0, cookies.length);
}

export function scrubRequestCookies(
  cookies: HarCookieLike[] | undefined
): void {
  cookies?.splice(0, cookies.length);
}

export function scrubSensitiveResponse(recording: HarRecordingLike): void {
  scrubSensitiveResponseHeaders(recording.response?.headers);
  scrubResponseCookies(recording.response?.cookies);
}

function isPolymarketUrl(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.hostname === "clob.polymarket.com";
  } catch {
    return /clob\.polymarket\.com/i.test(url);
  }
}

function normalizedObjectKey(key: string): string {
  return key.toLowerCase().replace(/[-_]/g, "");
}

function objectLooksLikeApiCredentials(
  value: Record<string, unknown>
): boolean {
  const keys = new Set(Object.keys(value).map(normalizedObjectKey));
  return keys.has("apikey") || keys.has("secret") || keys.has("passphrase");
}

function shouldRedactPolymarketJsonKey(
  key: string | undefined,
  parent: Record<string, unknown> | null,
  redactSignatures: boolean
): boolean {
  if (!key) return false;
  const normalized = normalizedObjectKey(key);

  if (
    normalized === "apikey" ||
    normalized.endsWith("apikey") ||
    normalized === "secret" ||
    normalized.endsWith("secret") ||
    normalized === "passphrase" ||
    normalized.endsWith("passphrase") ||
    normalized === "privatekey" ||
    normalized.endsWith("privatekey") ||
    (redactSignatures && normalized === "signature")
  ) {
    return true;
  }

  if (normalized === "key" && parent && objectLooksLikeApiCredentials(parent)) {
    return true;
  }

  return (
    (normalized.includes("builder") || normalized.includes("relayer")) &&
    (normalized.includes("key") ||
      normalized.includes("secret") ||
      normalized.includes("signature") ||
      normalized.includes("token") ||
      normalized.includes("passphrase"))
  );
}

function redactPolymarketJsonValue(
  value: unknown,
  options: { redactSignatures: boolean },
  key?: string,
  parent: Record<string, unknown> | null = null
): { value: unknown; redacted: boolean } {
  if (
    typeof value === "string" &&
    shouldRedactPolymarketJsonKey(key, parent, options.redactSignatures)
  ) {
    return { value: "***", redacted: value !== "***" };
  }

  if (Array.isArray(value)) {
    let redacted = false;
    const values = value.map((item) => {
      const result = redactPolymarketJsonValue(item, options);
      redacted ||= result.redacted;
      return result.value;
    });
    return { value: values, redacted };
  }

  if (value === null || typeof value !== "object") {
    return { value, redacted: false };
  }

  const objectValue = value as Record<string, unknown>;
  let redacted = false;
  const out: Record<string, unknown> = {};
  for (const [childKey, childValue] of Object.entries(objectValue)) {
    const result = redactPolymarketJsonValue(
      childValue,
      options,
      childKey,
      objectValue
    );
    redacted ||= result.redacted;
    out[childKey] = result.value;
  }
  return { value: out, redacted };
}

function redactPolymarketJsonText(
  text: string,
  options: { redactSignatures: boolean }
): string {
  try {
    const parsed = JSON.parse(text) as unknown;
    const result = redactPolymarketJsonValue(parsed, options);
    if (!result.redacted) return text;
    return JSON.stringify(result.value) + (text.endsWith("\n") ? "\n" : "");
  } catch {
    let redacted = text
      .replace(
        /("(?:apiKey|api_key|secret|passphrase|privateKey|private_key)"\s*:\s*")[^"]*(")/gi,
        "$1***$2"
      )
      .replace(
        /("(?:builder|relayer|relay)[^"]*(?:key|secret|signature|token|passphrase)"\s*:\s*")[^"]*(")/gi,
        "$1***$2"
      );
    if (options.redactSignatures) {
      redacted = redacted.replace(/("signature"\s*:\s*")[^"]*(")/gi, "$1***$2");
    }
    return redacted;
  }
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

function writeRequestPostDataText(
  recording: HarRecordingLike,
  text: string
): void {
  if (!recording.request?.postData) return;
  recording.request.postData.text = text;
  recording.request.bodySize = byteLength(text);
}

function writeResponseContentText(
  recording: HarRecordingLike,
  text: string
): void {
  if (!recording.response?.content) return;
  recording.response.content.text = text;
  recording.response.content.size = byteLength(text);
  recording.response.bodySize = recording.response.content.size;
}

export function scrubPolymarketAuthArtifacts(
  recording: HarRecordingLike
): void {
  if (!isPolymarketUrl(recording.request?.url)) return;

  const requestText = recording.request?.postData?.text;
  if (typeof requestText === "string" && requestText.length > 0) {
    writeRequestPostDataText(
      recording,
      redactPolymarketJsonText(requestText, { redactSignatures: true })
    );
  }

  const responseText = recording.response?.content?.text;
  if (typeof responseText === "string" && responseText.length > 0) {
    writeResponseContentText(
      recording,
      redactPolymarketJsonText(responseText, { redactSignatures: true })
    );
  }
}

export function scrubSensitiveRecording(recording: HarRecordingLike): void {
  scrubSensitiveRequestHeaders(recording.request?.headers);
  scrubRequestCookies(recording.request?.cookies);
  scrubSensitiveResponse(recording);
  scrubPolymarketAuthArtifacts(recording);
}
