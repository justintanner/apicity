/**
 * Failure envelopes observed in committed 2xx recordings. KIE also proxies
 * vendor-native responses: absence of a numeric code is not a failure.
 * Other providers use HTTP status alone until corpus evidence warrants a rule.
 */
const FAILURE_ENVELOPES = {
  kie: (body) =>
    (typeof body.code === "number" && body.code !== 200) || body.error != null,
  xai: (body) => body.error != null,
};

/** Read only JSON-object envelopes, including HAR base64-encoded content. */
/** @param {{response?: {content?: {text?: string, encoding?: string}}}} entry
 * @returns {Record<string, unknown> | null} */
export function responseObject(entry) {
  const content = entry?.response?.content;
  if (typeof content?.text !== "string") return null;
  try {
    const text =
      content.encoding === "base64"
        ? Buffer.from(content.text, "base64").toString("utf8")
        : content.text;
    const body = JSON.parse(text);
    return body !== null && typeof body === "object" && !Array.isArray(body)
      ? body
      : null;
  } catch {
    return null;
  }
}

/** Whether this exchange is evidence for a working request payload. */
/** @param {string} provider
 * @param {{response?: {status?: unknown, content?: {text?: string, encoding?: string}}}} entry
 * @returns {boolean} */
export function exchangeSucceeded(provider, entry) {
  const status = Number(entry?.response?.status);
  if (!Number.isFinite(status) || status < 200 || status >= 300) return false;
  const rule = Object.hasOwn(FAILURE_ENVELOPES, provider)
    ? FAILURE_ENVELOPES[provider]
    : null;
  const body = rule ? responseObject(entry) : null;
  return !body || !rule(body);
}
