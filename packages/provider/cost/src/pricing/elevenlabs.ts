import type { ModelPricing } from "./types";
import { asString, hintSeconds } from "./helpers";

// TTS rates predate the 2026-10-29 speech-to-text refresh and keep the
// global PRICING_AS_OF stamp. Do not reuse this source for Scribe.
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

// Speech to text is billed by audio duration. The API price card
// (https://elevenlabs.io/pricing/api, read 2026-10-29) lists an hourly
// price: Scribe v2 and Scribe v2 Medical $0.22/hour, Scribe v2 Realtime
// $0.39/hour. The request carries audio as a file or URL and has no
// duration, so units are costHints.durationSeconds. The stored rate is
// that hourly list price divided by 3600. Keyterm prompting and transcript
// editing are separate add-ons on the same card and are not included.
// scribe_v1 is not on this card.
const speechToTextAsOf = "2026-10-29";

function perAudioHour(perHour: number): ModelPricing {
  return {
    kind: "perUnit",
    unit: "seconds",
    units: (_p, hints) => hintSeconds(hints),
    select: [],
    rates: { "": perHour / 3600 },
    source: { url: source.url, asOf: speechToTextAsOf },
  };
}

export const elevenlabs: Record<string, ModelPricing> = {
  eleven_flash_v2_5: flat(0.00006),
  eleven_turbo_v2_5: flat(0.00006),
  eleven_multilingual_v2: flat(0.00012),
  eleven_multilingual_v3: flat(0.00012),
  scribe_v2: perAudioHour(0.22),
  scribe_v2_medical: perAudioHour(0.22),
  scribe_v2_realtime: perAudioHour(0.39),
};
