/**
 * Whether this exchange is evidence for a working request payload.
 * Keep business-envelope rules provider-scoped: arbitrary response fields are
 * not a universal success protocol. Surveyed against the committed HAR corpus.
 */
const ENVELOPE_RULES = {
  kie: (body) => body?.code === 200,
  // Telegram's Bot API always wraps its JSON results in { ok, result }.
  telegram: (body) => body?.ok === true,
  // Uguu uses success; Catbox returns plain text. Google Flow returns several
  // resource shapes, so only an explicit negative envelope rejects those.
  "free-media-upload": (body) => body?.success !== false,
  googleflow: (body) => body?.ok !== false,
  zaicoding: (body) =>
    body?.success !== false && (body?.code === undefined || body.code === 200),
  // Async status/read endpoints can carry a provider error with HTTP 200.
  openai: (body) => body?.error == null,
  xai: (body) => body?.error == null,
  elevenlabs: (body) => body?.error == null,
};

export function exchangeSucceeded(provider, entry) {
  const status = Number(entry?.response?.status);
  if (!Number.isFinite(status) || status < 200 || status >= 300) return false;
  const rule = ENVELOPE_RULES[provider];
  if (!rule) return true;
  let body;
  try {
    body = JSON.parse(entry?.response?.content?.text ?? "");
  } catch {
    // Binary/plain-text responses have no JSON business envelope.
  }
  return rule(body);
}
