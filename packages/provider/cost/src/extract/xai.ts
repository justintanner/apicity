import type { ExtractResult, TextExtract } from "./types";
import { asString, flattenMessages, pickMaxOutputTokens } from "./messages";

// Accepts xai chat completions (`{model, messages}`), tokenize-text
// (`{model, text}`), or responses (`{model, input}`).
export function extractXai(
  payload: Record<string, unknown>
): ExtractResult<TextExtract> {
  const model = asString(payload.model);
  if (!model) {
    return { ok: false, warnings: ["xai: payload.model is required"] };
  }

  let text = "";
  if (typeof payload.text === "string") {
    text = payload.text;
  } else if (Array.isArray(payload.messages)) {
    text = flattenMessages(payload.messages);
  } else if (typeof payload.input === "string") {
    text = payload.input;
  } else if (Array.isArray(payload.input)) {
    text = flattenMessages(payload.input);
  } else if (typeof payload.prompt === "string") {
    text = payload.prompt;
  }

  return {
    ok: true,
    data: { model, text, maxOutputTokens: pickMaxOutputTokens(payload) },
  };
}
