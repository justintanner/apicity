import type { ExtractResult, TextExtract } from "./types";
import { asString, flattenMessages, pickMaxOutputTokens } from "./messages";

// Accepts an anthropic /v1/messages payload (`{model, messages, system?}`).
// `system` may be a string or an array of content blocks.
export function extractAnthropic(
  payload: Record<string, unknown>
): ExtractResult<TextExtract> {
  const model = asString(payload.model);
  if (!model) {
    return { ok: false, warnings: ["anthropic: payload.model is required"] };
  }

  let systemText = "";
  if (typeof payload.system === "string") {
    systemText = payload.system;
  } else if (Array.isArray(payload.system)) {
    const blocks = payload.system.filter(
      (b): b is { text: string } =>
        b !== null &&
        typeof b === "object" &&
        typeof (b as { text?: unknown }).text === "string"
    );
    systemText = blocks.map((b) => b.text).join("\n");
  }

  const messageText = flattenMessages(payload.messages);
  const text = [systemText, messageText].filter(Boolean).join("\n");

  return {
    ok: true,
    data: { model, text, maxOutputTokens: pickMaxOutputTokens(payload) },
  };
}
