import type { ElevenLabsExtract, ExtractResult } from "./types";
import { asString } from "./messages";

// ElevenLabs TTS payload: `{model_id, text, voice_settings, ...}`. Some
// callers use `model` instead of `model_id`; both are accepted. Characters
// are derived from `text.length` — the upstream meter counts characters.
export function extractElevenLabs(
  payload: Record<string, unknown>
): ExtractResult<ElevenLabsExtract> {
  const model = asString(payload.model_id) ?? asString(payload.model);
  if (!model) {
    return {
      ok: false,
      warnings: ["elevenlabs: payload.model_id (or model) is required"],
    };
  }
  const text = asString(payload.text) ?? "";
  if (!text) {
    return {
      ok: false,
      warnings: ["elevenlabs: payload.text is required"],
    };
  }
  return { ok: true, data: { model, characters: text.length } };
}
