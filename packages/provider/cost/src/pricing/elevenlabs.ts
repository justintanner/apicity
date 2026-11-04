import type { ModelPricing, PerUnitPricing } from "./types";
import type { CostHints } from "../types";
import { asString, asNumber, asObject, hintSeconds } from "./helpers";

const source = { url: "https://elevenlabs.io/pricing/api", asOf: "2026-11-04" };
export const ELEVENLABS_LIST_NOTE =
  "ElevenLabs bills API usage at the list rate in USD; a plan's included credits may cost less";
const positive = (n: unknown): number | undefined => {
  const value = asNumber(n);
  return value !== undefined && value > 0 ? value : undefined;
};
function characters(
  p: Record<string, unknown>,
  hints?: CostHints
): number | undefined {
  const text = asString(p.text);
  return text !== undefined
    ? positive(text.length)
    : positive(hints?.characters);
}
const flat = (perUnit: number): PerUnitPricing => ({
  kind: "perUnit",
  unit: "characters",
  units: characters,
  select: [],
  rates: { "": perUnit },
  source,
});
const seconds = (
  perUnit: number,
  units: (p: Record<string, unknown>, h?: CostHints) => number | undefined = (
    _p,
    h
  ) => hintSeconds(h)
): PerUnitPricing => ({
  kind: "perUnit",
  unit: "seconds",
  units,
  select: [],
  rates: { "": perUnit },
  source,
});
export const elevenlabs: Record<string, ModelPricing> = {
  eleven_flash_v2_5: flat(0.00004),
  eleven_turbo_v2_5: flat(0.00004),
  eleven_multilingual_v2: flat(0.00008),
  // Historical alias retained for callers; the catalog calls it eleven_v3.
  eleven_multilingual_v3: flat(0.00008),
  eleven_v3: flat(0.00008),
  eleven_v4: flat(0.00008),
  eleven_v4_turbo: flat(0.00004),
  eleven_v3_conversational: flat(0.00004),
  eleven_flash_v2: flat(0.00004),
  eleven_turbo_v2: flat(0.00004),
  // Keyterm prompting and transcript editing are separate, excluded add-ons.
  scribe_v2: seconds(0.22 / 3600),
  scribe_v2_medical: seconds(0.22 / 3600),
  scribe_v2_realtime: seconds(0.39 / 3600),
  music: seconds(0.15 / 60, (p, h) => {
    const ms = positive(p.music_length_ms);
    return ms === undefined ? hintSeconds(h) : ms / 1000;
  }),
  "video-to-music": seconds(0.15 / 60),
  "sound-generation": seconds(
    0.12 / 60,
    (p, h) => positive(p.duration_seconds) ?? hintSeconds(h)
  ),
  "voice-changer": seconds(0.12 / 60),
  "voice-isolator": seconds(0.12 / 60),
  "forced-alignment": seconds(0.22 / 3600),
  dubbing: {
    ...seconds(0),
    select: [
      {
        name: "dubbing_model/watermark",
        required: true,
        pick: (p) => {
          const model = asString(p.dubbing_model) ?? "dubbing_v1";
          if (model === "dubbing_v2") return "v2";
          if (model !== "dubbing_v1") return undefined;
          return p.watermark === true ? "v1-watermark" : "v1";
        },
      },
    ],
    rates: { "v1-watermark": 0.33 / 60, v1: 0.5 / 60, v2: 2.2 / 60 },
  },
  dialogue: {
    ...flat(0.00008),
    units: (p) => {
      if (!Array.isArray(p.inputs) || p.inputs.length === 0) return undefined;
      const texts = p.inputs.map((v) => asString(asObject(v)?.text));
      return texts.every((t) => t !== undefined)
        ? positive(texts.reduce((n, t) => n + (t?.length ?? 0), 0))
        : undefined;
    },
  },
};
