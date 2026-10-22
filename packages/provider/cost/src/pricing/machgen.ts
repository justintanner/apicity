import type { CostHints } from "../types";
import type { ModelPricing, PerUnitPricing } from "./types";
import { asNumber, asObject, hintSeconds, hintInputSeconds } from "./helpers";

// MachGen pricebook snapshot, 2026-10-22. Gross USD, before Generation Credit.
// Each machgen replay test asserts its recorded billing receipt equals the estimate.
const source = { url: "https://www.machgen.ai/pricing", asOf: "2026-10-22" };
const config = (p: Record<string, unknown>) => asObject(p.video_config) ?? {};
const has = (p: Record<string, unknown>, key: string) =>
  Array.isArray(p[key]) && (p[key] as unknown[]).length > 0;
const inputVideo = (p: Record<string, unknown>) =>
  has(p, "src_video_urls") &&
  (p.model === "Seedance-2.5" ||
    p.model === "Seedance-2.0" ||
    (p.model === "MiniMax-H3" && p.task_type === "R2V"));

function outputSeconds(
  p: Record<string, unknown>,
  hints?: CostHints
): number | undefined {
  const c = config(p);
  const duration = asNumber(c.duration_secs);
  if (duration === -1) return hintSeconds(hints);
  if (duration !== undefined) return duration >= 1 ? duration : undefined;
  const frames = asNumber(c.num_frames);
  if (
    p.model !== "MiniMax-H3" ||
    frames === undefined ||
    frames < 22 ||
    frames > 362
  )
    return undefined;
  // Supported counts are 17n+5. Exact ties snap down, as does billing /24.
  const snapped = 5 + 17 * Math.ceil((frames - 5) / 17 - 0.5);
  return Math.ceil(snapped / 24 - 0.5);
}

function seconds(
  p: Record<string, unknown>,
  hints?: CostHints
): number | undefined {
  if (has(p, "src_task_ids")) return undefined;
  if (!["T2V", "I2V", "R2V"].includes(String(p.task_type))) return undefined;
  if (p.model === "Grok-Imagine-Video-1.5" && p.task_type !== "I2V")
    return undefined;
  if (p.model === "MiniMax-H3" && config(p).sharpen === true) return undefined;
  const out = outputSeconds(p, hints);
  if (out === undefined) return undefined;
  if (!inputVideo(p)) return out;
  const input = hintInputSeconds(hints);
  return input === undefined ? undefined : out + input;
}
function warn(p: Record<string, unknown>, hints?: CostHints): string[] {
  if (has(p, "src_task_ids"))
    return [
      "MachGen src_task_ids hides the input type and billed seconds; an exact estimate is unavailable.",
    ];
  if (p.model === "MiniMax-H3" && config(p).sharpen === true)
    return ["MachGen has not published the sharpen surcharge."];
  if (config(p).duration_secs === -1 && hintSeconds(hints) === undefined)
    return [
      "MachGen bills the generated length for duration_secs -1; pass costHints.durationSeconds.",
    ];
  if (inputVideo(p) && hintInputSeconds(hints) === undefined)
    return [
      "MachGen bills input plus output seconds; pass costHints.inputDurationSeconds.",
    ];
  return [];
}
const height: PerUnitPricing["select"][number] = {
  name: "height",
  required: true,
  pick: (p) => {
    if (p.model === "Seedance-2.5" && p.draft_source_task_id) return "1080";
    if (p.model === "Seedance-2.5" && p.draft === true) return "480";
    const h = asNumber(config(p).height);
    return h === undefined ? undefined : String(h);
  },
};
const videoInput: PerUnitPricing["select"][number] = {
  name: "videoInput",
  required: true,
  pick: (p) => (has(p, "src_video_urls") ? "video" : "no-video"),
};
const flat = (
  rates: Record<string, number>,
  video = false
): PerUnitPricing => ({
  kind: "perUnit",
  unit: "seconds",
  units: seconds,
  select: video ? [videoInput, height] : [height],
  rates,
  warn,
  source,
});

const h3Mode = (p: Record<string, unknown>): string | undefined => {
  if (p.task_type === "R2V")
    return has(p, "src_video_urls") ? "r2v-video" : "r2v-f2f";
  if (p.task_type === "I2V")
    return Array.isArray(p.src_image_urls) && p.src_image_urls.length > 1
      ? "r2v-f2f"
      : "t2v-i2v";
  if (p.task_type === "T2V") return "t2v-i2v";
  return undefined;
};
const h3Rates: Record<string, number> = {};
const h3ExtraRates: Record<string, number> = {};
for (const [mode, normal, adapter, extra, adapterExtra] of [
  [
    "t2v-i2v",
    [0.035, 0.04, 0.1],
    [0.044, 0.05, 0.125],
    [0.0175, 0.02],
    [0.022, 0.025],
  ],
  [
    "r2v-f2f",
    [0.05, 0.06, 0.12],
    [0.063, 0.075, 0.15],
    [0.025, 0.03],
    [0.032, 0.038],
  ],
  ["r2v-video", [0.05, 0.06, 0.12], [0.063, 0.075, 0.15], [], []],
] as const) {
  for (const [i, h] of [480, 768, 1440].entries()) {
    h3Rates[`${mode}|${h}`] = normal[i]!;
    h3Rates[`${mode}|adapter|${h}`] = adapter[i]!;
    if (extra[i] !== undefined) h3ExtraRates[`${mode}|${h}`] = extra[i]!;
    if (adapterExtra[i] !== undefined)
      h3ExtraRates[`${mode}|adapter|${h}`] = adapterExtra[i]!;
  }
}
export const machgen: Record<string, ModelPricing> = {
  "MiniMax-H3": {
    kind: "perUnit",
    unit: "seconds",
    units: (p, hints) => {
      const s = seconds(p, hints);
      return s === undefined
        ? undefined
        : h3Mode(p) === "r2v-video"
          ? s
          : Math.min(s, 15);
    },
    select: [
      { name: "mode", pick: h3Mode, required: true },
      { name: "adapter", pick: (p) => (p.adapter ? "adapter" : undefined) },
      height,
    ],
    rates: h3Rates,
    extra: (p, hints) => {
      const s = seconds(p, hints);
      if (s === undefined) return undefined;
      if (h3Mode(p) === "r2v-video" || s <= 15) return 0;
      const key = [h3Mode(p), p.adapter ? "adapter" : undefined, height.pick(p)]
        .filter(Boolean)
        .join("|");
      const rate = h3ExtraRates[key];
      return rate === undefined || s > 30 ? undefined : (s - 15) * rate;
    },
    warn,
    source,
  },
  "Seedance-2.5": flat(
    {
      "no-video|480": 0.1,
      "no-video|720": 0.23,
      "no-video|1080": 0.59,
      "video|480": 0.06,
      "video|720": 0.14,
      "video|1080": 0.32,
    },
    true
  ),
  "Seedance-2.0": flat(
    {
      "no-video|480": 0.07,
      "no-video|720": 0.15,
      "no-video|1080": 0.37,
      "no-video|2160": 0.78,
      "video|480": 0.04,
      "video|720": 0.085,
      "video|1080": 0.23,
      "video|2160": 0.465,
    },
    true
  ),
  "Alibaba-Wan-3.0": flat({ "480": 0.049, "720": 0.096, "1080": 0.191 }),
  "HappyHorse-1.1": flat({ "720": 0.132, "1080": 0.17 }),
  "Grok-Imagine-Video-1.5": flat({ "480": 0.095, "720": 0.165, "1080": 0.295 }),
};
