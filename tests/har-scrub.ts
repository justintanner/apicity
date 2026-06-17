export const REDACTED_HAR_VALUE = "***";

export interface HarHeaderLike {
  name?: string;
  value?: string;
}

export interface HarCookieLike {
  value?: string;
  [key: string]: unknown;
}

export interface HarResponseLike {
  headers?: HarHeaderLike[];
  cookies?: HarCookieLike[];
}

export interface HarRecordingLike {
  response?: HarResponseLike;
}

const SENSITIVE_RESPONSE_HEADER_NAMES = new Set([
  "anthropic-organization-id",
  "cf-ray",
  "openai-organization",
  "request-id",
  "set-cookie",
  "traceresponse",
  "x-amz-id-2",
  "x-amz-request-id",
  "x-amzn-requestid",
  "x-amzn-trace-id",
  "x-dashscope-inner-user-group",
  "x-dashscope-inner-user-meta",
  "x-request-id",
]);

export function isSensitiveResponseHeaderName(
  name: string | undefined
): boolean {
  if (!name) return false;
  const lower = name.toLowerCase();
  return (
    SENSITIVE_RESPONSE_HEADER_NAMES.has(lower) ||
    lower.includes("organization") ||
    /(^|-)request-id$/.test(lower) ||
    lower.endsWith("requestid") ||
    lower.includes("trace")
  );
}

export function scrubSensitiveResponseHeaders(
  headers: HarHeaderLike[] | undefined
): void {
  for (const header of headers ?? []) {
    if (isSensitiveResponseHeaderName(header.name)) {
      header.value = REDACTED_HAR_VALUE;
    }
  }
}

export function scrubResponseCookies(
  cookies: HarCookieLike[] | undefined
): void {
  for (const cookie of cookies ?? []) {
    if (typeof cookie.value === "string") {
      cookie.value = REDACTED_HAR_VALUE;
    }
  }
}

export function scrubSensitiveResponse(recording: HarRecordingLike): void {
  scrubSensitiveResponseHeaders(recording.response?.headers);
  scrubResponseCookies(recording.response?.cookies);
}
