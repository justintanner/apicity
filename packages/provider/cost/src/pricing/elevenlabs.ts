import type { ModelPricing } from "./types";
import { asString } from "./helpers";

const source = { url: "https://elevenlabs.io/pricing/api" };

// ElevenLabs TTS bills per character of `payload.text`. Both `model_id` (the
// canonical upstream field) and `model` (some callers' shorthand) are used to
// look up the entry; the units function reads payload.text directly.
function characters(p: Record<string, unknown>): number | undefined {
  const t = asString(p.text);
  return t ? t.length : undefined;
}

const flat = (perUnit: number): ModelPricing => ({
  kind: "perUnit",
  unit: "characters",
  units: characters,
  select: [],
  rates: { "": perUnit },
  source,
});

export const elevenlabs: Record<string, ModelPricing> = {
  eleven_flash_v2_5: flat(0.00006),
  eleven_turbo_v2_5: flat(0.00006),
  eleven_multilingual_v2: flat(0.00012),
  eleven_multilingual_v3: flat(0.00012),
};
