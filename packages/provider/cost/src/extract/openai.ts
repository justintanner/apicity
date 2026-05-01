import type { ExtractResult, TextExtract } from "./types";
import { asString, flattenMessages, pickMaxOutputTokens } from "./messages";

// Accepts either a chat completions payload (`{model, messages}`) or a
// responses payload (`{model, input}`). For responses the `input` may be a
// flat string or an array of message-like objects.
export function extractOpenAi(
  payload: Record<string, unknown>
): ExtractResult<TextExtract> {
  const model = asString(payload.model);
  if (!model) {
    return { ok: false, warnings: ["openai: payload.model is required"] };
  }

  let text = "";
  if (typeof payload.input === "string") {
    text = payload.input;
  } else if (Array.isArray(payload.input)) {
    text = flattenMessages(payload.input);
  } else if (Array.isArray(payload.messages)) {
    text = flattenMessages(payload.messages);
  } else if (typeof payload.prompt === "string") {
    text = payload.prompt;
  }

  const instructions = asString(payload.instructions);
  if (instructions) text = instructions + "\n" + text;

  return {
    ok: true,
    data: { model, text, maxOutputTokens: pickMaxOutputTokens(payload) },
  };
}
