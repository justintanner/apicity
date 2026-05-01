import type { ExtractResult, TextExtract } from "./types";
import { asString, flattenMessages, pickMaxOutputTokens } from "./messages";

// Generic chat-completions extractor used for kimicoding / fireworks /
// alibaba — providers that share the OpenAI-compatible chat shape but have
// no upstream count-tokens endpoint, so they always run through the
// chars/4 heuristic. `provider` is only used for the missing-model warning.
export function extractChat(
  provider: "kimicoding" | "fireworks" | "alibaba",
  payload: Record<string, unknown>
): ExtractResult<TextExtract> {
  const model = asString(payload.model);
  if (!model) {
    return { ok: false, warnings: [`${provider}: payload.model is required`] };
  }

  let text = "";
  if (Array.isArray(payload.messages)) {
    text = flattenMessages(payload.messages);
  } else if (typeof payload.prompt === "string") {
    text = payload.prompt;
  } else if (typeof payload.text === "string") {
    text = payload.text;
  } else if (typeof payload.input === "string") {
    text = payload.input;
  }

  return {
    ok: true,
    data: { model, text, maxOutputTokens: pickMaxOutputTokens(payload) },
  };
}
