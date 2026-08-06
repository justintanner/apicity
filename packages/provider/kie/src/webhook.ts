/**
 * Kie.ai callback webhook HMAC-SHA256 verification.
 *
 * Docs: https://docs.kie.ai/common-api/webhook-verification
 *
 * Signature material: `taskId + "." + timestampSeconds`
 * Algorithm: Base64(HMAC-SHA256(dataToSign, webhookHmacKey))
 *
 * This is independent of paygate.ts (OTP pay-gate HMAC). Do not reuse
 * pay-gate secrets or signing input here.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export interface VerifyKieWebhookSignatureInput {
  /** Shared webhook HMAC key from the Kie AI settings page. */
  secret: string;
  /** Task id used when the signature was minted. */
  taskId: string;
  /**
   * Unix timestamp in seconds from the `X-Webhook-Timestamp` header
   * (string or number accepted).
   */
  timestamp: string | number;
  /** Value of the `X-Webhook-Signature` header (Base64). */
  signature: string;
}

/**
 * Compute the Base64 HMAC-SHA256 signature for a kie webhook callback.
 */
export function signKieWebhook(
  taskId: string,
  timestampSeconds: string | number,
  secret: string
): string {
  const dataToSign = `${taskId}.${timestampSeconds}`;
  return createHmac("sha256", secret)
    .update(dataToSign, "utf8")
    .digest("base64");
}

/**
 * Verify a kie.ai webhook signature with constant-time comparison.
 * Returns true only when the received signature matches the expected value.
 */
export function verifyKieWebhookSignature(
  input: VerifyKieWebhookSignatureInput
): boolean {
  const { secret, taskId, timestamp, signature } = input;
  if (
    typeof secret !== "string" ||
    secret.length === 0 ||
    typeof taskId !== "string" ||
    taskId.length === 0 ||
    typeof signature !== "string" ||
    signature.length === 0
  ) {
    return false;
  }

  const expected = signKieWebhook(taskId, timestamp, secret);
  if (expected.length !== signature.length) {
    return false;
  }

  try {
    return timingSafeEqual(
      Buffer.from(expected, "utf8"),
      Buffer.from(signature, "utf8")
    );
  } catch {
    return false;
  }
}

function headerValue(
  headers: Headers | Record<string, string | string[] | undefined>,
  name: string
): string | undefined {
  const lower = name.toLowerCase();
  if (typeof Headers !== "undefined" && headers instanceof Headers) {
    return headers.get(name) ?? headers.get(lower) ?? undefined;
  }
  const record = headers as Record<string, string | string[] | undefined>;
  for (const [key, value] of Object.entries(record)) {
    if (key.toLowerCase() === lower) {
      if (Array.isArray(value)) return value[0];
      return value;
    }
  }
  return undefined;
}

/**
 * Extract taskId from a typical kie callback body.
 * Prefer top-level `taskId`, then `data.taskId`, then `data.task_id`
 * (docs examples use both shapes).
 */
export function extractKieWebhookTaskId(body: unknown): string | undefined {
  if (typeof body !== "object" || body === null) return undefined;
  const record = body as Record<string, unknown>;
  if (typeof record.taskId === "string" && record.taskId.length > 0) {
    return record.taskId;
  }
  const data = record.data;
  if (typeof data === "object" && data !== null) {
    const nested = data as Record<string, unknown>;
    if (typeof nested.taskId === "string" && nested.taskId.length > 0) {
      return nested.taskId;
    }
    if (typeof nested.task_id === "string" && nested.task_id.length > 0) {
      return nested.task_id;
    }
  }
  return undefined;
}

export interface VerifyKieWebhookRequestInput {
  secret: string;
  headers: Headers | Record<string, string | string[] | undefined>;
  /** Parsed JSON body of the callback POST. */
  body: unknown;
}

/**
 * High-level helper: pull timestamp/signature headers and taskId from a
 * callback request, then verify the HMAC signature.
 */
export function verifyKieWebhookRequest(
  input: VerifyKieWebhookRequestInput
): boolean {
  const timestamp = headerValue(input.headers, "x-webhook-timestamp");
  const signature = headerValue(input.headers, "x-webhook-signature");
  const taskId = extractKieWebhookTaskId(input.body);
  if (!timestamp || !signature || !taskId) {
    return false;
  }
  return verifyKieWebhookSignature({
    secret: input.secret,
    taskId,
    timestamp,
    signature,
  });
}
