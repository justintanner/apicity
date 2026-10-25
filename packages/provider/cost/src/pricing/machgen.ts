import type { CostHints } from "../types";
import type { ModelPricing, PerUnitPricing } from "./types";
import { asNumber, asObject, hintSeconds, hintInputSeconds } from "./helpers";

// MachGen pricebook snapshot, 2026-10-25. Gross USD, before Generation Credit.
// tests/fixtures/machgen-evidence/machgen-pricing-2026-10-25.json maps each
// pricebook row to the request shapes priced here, and
// machgen-pricebook-2026-10-25.json holds the exact micro-USD rates. Each
// machgen replay test asserts its recorded billing receipt equals the estimate.
const source = { url: "https://www.machgen.ai/pricing", asOf: "2026-10-25" };
const config = (p: Record<string, unknown>) => asObject(p.video_config) ?? {};
const has = (p: Record<string, unknown>, key: string) =>
  Array.isArray(p[key]) && (p[key] as unknown[]).length > 0;
// R2V bills the seconds read from each reference video on top of the output:
// what remains after reference_video_start_secs "is what is billed" (docs).
// Receipts confirm it on Seedance 2.5, 2.0 Fast and 2.0 Mini, MiniMax-H3 and
// H3-Turbo, and Wan 3.0, whose single rate covers both (ac-ks4no2).
const inputVideo = (p: Record<string, unknown>) =>
  has(p, "src_video_urls") && p.task_type === "R2V";

// Task types priced per model.
const ALL = ["T2V", "I2V", "R2V"];
const T2V_I2V = ["T2V", "I2V"];
const PRICED_TASKS: Record<string, readonly string[]> = {
  "MiniMax-H3": [...ALL, "UPSCALE"],
  "Seedance-2.5": ALL,
  "Seedance-2.0": ALL,
  "Alibaba-Wan-3.0": ALL,
  "HappyHorse-1.1": ALL,
  "Grok-Imagine-Video-1.5": ["I2V"],
  "Wan2.2-A14B": T2V_I2V,
  "LTX-2.3-Pro": T2V_I2V,
  "Vidu-Q3-Turbo": ALL,
  "Vidu-Q3-Pro": ALL,
  "MiniMax-H3-Turbo": ALL,
  "Seedance-2.0-Fast": ALL,
  "Seedance-2.0-Mini": ALL,
  "Kling-v3": T2V_I2V,
  "Kling-o3": ["T2V", "R2V"],
  "Vidu-Q3": ["R2V"],
  "Veo-3.1": ["T2V"],
  "Veo-3.1-Fast": ["T2V"],
  "Grok-Imagine-Video": ["T2V"],
  "Vidu-Q4-Preview": ["I2V", "R2V"],
  "Vidu-Q3-Pro-Fast": ["I2V"],
  "Pixverse-V6": ALL,
  "Pixverse-C1": ALL,
  "HappyHorse-1.0": ALL,
};
const pricedTask = (p: Record<string, unknown>) =>
  PRICED_TASKS[String(p.model)]?.includes(String(p.task_type)) === true;
// Models with separate audio-on and audio-off rates and no published default.
const AUDIO_PRICED = new Set([
  "Kling-v3",
  "Kling-o3",
  "Pixverse-V6",
  "Pixverse-C1",
]);
const videoCount = (p: Record<string, unknown>) =>
  Array.isArray(p.src_video_urls) ? p.src_video_urls.length : 0;
// An edit renders the primary reference clip's length: a 4 s source billed
// (4 + 4) x 0.06 USD on Seedance-2.5 480p (ac-ks4no2 receipt).
const editSeconds = (p: Record<string, unknown>, hints?: CostHints) =>
  hintSeconds(hints) ??
  (videoCount(p) === 1 ? hintInputSeconds(hints) : undefined);
const audioUnset = (p: Record<string, unknown>) =>
  AUDIO_PRICED.has(String(p.model)) && typeof config(p).audio !== "boolean";

function outputSeconds(
  p: Record<string, unknown>,
  hints?: CostHints
): number | undefined {
  if (p.reference_video_operation === "edit") return editSeconds(p, hints);
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

// An upscale renders its source's length, and MiniMax-H3, the one upscaler
// priced here, bills it on input plus output seconds.
function upscaleSeconds(hints?: CostHints): number | undefined {
  const source = hintInputSeconds(hints);
  return source === undefined ? undefined : 2 * source;
}

function seconds(
  p: Record<string, unknown>,
  hints?: CostHints
): number | undefined {
  if (!pricedTask(p)) return undefined;
  if (p.task_type === "UPSCALE") return upscaleSeconds(hints);
  if (has(p, "src_task_ids")) return undefined;
  if (p.model === "MiniMax-H3" && config(p).sharpen === true) return undefined;
  if (audioUnset(p)) return undefined;
  const out = outputSeconds(p, hints);
  if (out === undefined) return undefined;
  if (!inputVideo(p)) return out;
  const input = hintInputSeconds(hints);
  return input === undefined ? undefined : out + input;
}
function warn(p: Record<string, unknown>, hints?: CostHints): string[] {
  const tasks = PRICED_TASKS[String(p.model)];
  if (tasks && !pricedTask(p))
    return [
      `@apicity/cost prices MachGen ${String(p.model)} for ${tasks.join(", ")} only.`,
    ];
  if (p.task_type === "UPSCALE")
    return hintInputSeconds(hints) === undefined
      ? [
          "MachGen bills an upscale by its source's length; pass costHints.inputDurationSeconds.",
        ]
      : [];
  if (has(p, "src_task_ids"))
    return [
      "MachGen src_task_ids hides the input type and billed seconds; an exact estimate is unavailable.",
    ];
  if (
    p.reference_video_operation === "edit" &&
    editSeconds(p, hints) === undefined
  )
    return [
      "MachGen renders an edit at its source's length; pass costHints.inputDurationSeconds for one reference video, or costHints.durationSeconds.",
    ];
  if (p.model === "MiniMax-H3" && config(p).sharpen === true)
    return ["MachGen has not published the sharpen surcharge."];
  if (audioUnset(p))
    return [
      `MachGen prices ${String(p.model)} with audio on and off at different rates; set video_config.audio.`,
    ];
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
const audio: PerUnitPricing["select"][number] = {
  name: "audio",
  required: true,
  pick: (p) => {
    const on = config(p).audio;
    return on === true ? "audio" : on === false ? "no-audio" : undefined;
  },
};
const flat = (
  rates: Record<string, number>,
  select: PerUnitPricing["select"] = [height]
): PerUnitPricing => ({
  kind: "perUnit",
  unit: "seconds",
  units: seconds,
  select,
  rates,
  warn,
  source,
});
// Each band's rate bills the seconds inside it: Vidu Q3 Turbo 540p is
// 0.075 USD for 5 s and 0.165 for 10 s (5 x 0.015 + 5 x 0.018).
const graduated = (
  bands: Record<string, readonly (readonly [number, number])[]>
): PerUnitPricing => {
  const pick = (p: Record<string, unknown>) => bands[height.pick(p) ?? ""];
  return {
    kind: "perUnit",
    unit: "seconds",
    units: (p, hints) => {
      const s = seconds(p, hints);
      const first = pick(p)?.[0];
      return s === undefined || !first ? s : Math.min(s, first[0]);
    },
    select: [height],
    rates: Object.fromEntries(
      Object.entries(bands).map(([h, [[, rate]]]) => [h, rate!])
    ),
    extra: (p, hints) => {
      const s = seconds(p, hints);
      const band = pick(p);
      if (s === undefined || !band) return undefined;
      let usd = 0;
      let from = band[0]![0];
      for (const [to, rate] of band.slice(1)) {
        if (s > from) usd += (Math.min(s, to) - from) * rate;
        from = to;
      }
      return s > from ? undefined : usd;
    },
    warn,
    source,
  };
};

// An I2V request with an end frame bills the Image to Video rate, not the
// Frame to Frame one: 2 s at 480p billed 70000 micros (ac-fs70lj receipt).
const h3Mode = (p: Record<string, unknown>): string | undefined => {
  if (p.task_type === "UPSCALE") return "upscale";
  if (p.task_type === "R2V")
    return has(p, "src_video_urls") ? "r2v-video" : "r2v-f2f";
  if (p.task_type === "I2V" || p.task_type === "T2V") return "t2v-i2v";
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
// 2K regeneration of the model's own 768p outputs, on input plus output seconds.
h3Rates["upscale|1440"] = 0.05;
const h3Flat = (p: Record<string, unknown>) =>
  h3Mode(p) === "r2v-video" || h3Mode(p) === "upscale";
export const machgen: Record<string, ModelPricing> = {
  "MiniMax-H3": {
    kind: "perUnit",
    unit: "seconds",
    units: (p, hints) => {
      const s = seconds(p, hints);
      return s === undefined ? undefined : h3Flat(p) ? s : Math.min(s, 15);
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
      if (h3Flat(p) || s <= 15) return 0;
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
    [videoInput, height]
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
    [videoInput, height]
  ),
  "Alibaba-Wan-3.0": flat({ "480": 0.049, "720": 0.096, "1080": 0.191 }),
  "HappyHorse-1.1": flat({ "720": 0.132, "1080": 0.17 }),
  "Grok-Imagine-Video-1.5": flat({ "480": 0.095, "720": 0.165, "1080": 0.295 }),
  "Wan2.2-A14B": flat({ "480": 0.018, "720": 0.036 }),
  // The pricebook's 540p and 720p rows are not requestable: MachGen's API
  // takes LTX-2.3-Pro only at 1080p, 1440p and 2160p.
  "LTX-2.3-Pro": flat({ "1080": 0.03, "1440": 0.06, "2160": 0.1 }),
  "Vidu-Q3-Turbo": graduated({
    "540": [
      [5, 0.015],
      [10, 0.018],
      [16, 0.02],
    ],
    "720": [
      [5, 0.03],
      [10, 0.04],
      [16, 0.045],
    ],
  }),
  "Vidu-Q3-Pro": flat({ "540": 0.053, "720": 0.118, "1080": 0.142 }),
  // Promotional rate until 2026-11-01T06:59Z (the pricebook's
  // discount_ends_at); the list price is 0.02 USD/s.
  "MiniMax-H3-Turbo": flat(
    {
      "no-video|480": 0.01,
      "no-video|768": 0.01,
      "video|480": 0.01,
      "video|768": 0.01,
    },
    [videoInput, height]
  ),
  "Seedance-2.0-Fast": flat(
    {
      "no-video|480": 0.05,
      "no-video|720": 0.12,
      "video|480": 0.03,
      "video|720": 0.07,
    },
    [videoInput, height]
  ),
  "Seedance-2.0-Mini": flat(
    {
      "no-video|480": 0.033,
      "no-video|720": 0.08,
      "video|480": 0.02,
      "video|720": 0.045,
    },
    [videoInput, height]
  ),
  "Kling-v3": flat(
    {
      "audio|720": 0.119,
      "audio|1080": 0.159,
      "audio|2160": 0.396,
      "no-audio|720": 0.08,
      "no-audio|1080": 0.106,
      "no-audio|2160": 0.396,
    },
    [audio, height]
  ),
  "Vidu-Q4-Preview": flat({
    "540": 0.045,
    "720": 0.095,
    "1080": 0.12,
    "1440": 0.19,
    "2160": 0.39,
  }),
  "Vidu-Q3-Pro-Fast": flat({ "720": 0.118, "1080": 0.148 }),
  "Pixverse-V6": flat(
    {
      "audio|360": 0.033,
      "audio|540": 0.043,
      "audio|720": 0.057,
      "audio|1080": 0.109,
      "no-audio|360": 0.024,
      "no-audio|540": 0.033,
      "no-audio|720": 0.043,
      "no-audio|1080": 0.085,
    },
    [audio, height]
  ),
  "Pixverse-C1": flat(
    {
      "audio|360": 0.038,
      "audio|540": 0.048,
      "audio|720": 0.062,
      "audio|1080": 0.113,
      "no-audio|360": 0.029,
      "no-audio|540": 0.038,
      "no-audio|720": 0.048,
      "no-audio|1080": 0.09,
    },
    [audio, height]
  ),
  "HappyHorse-1.0": flat({ "720": 0.132, "1080": 0.264 }),
  "Kling-o3": flat(
    {
      "audio|720": 0.106,
      "audio|1080": 0.132,
      "audio|2160": 0.396,
      "no-audio|720": 0.08,
      "no-audio|1080": 0.106,
      "no-audio|2160": 0.396,
    },
    [audio, height]
  ),
  "Vidu-Q3": flat({ "540": 0.042, "720": 0.071, "1080": 0.089 }),
  // Veo 3.1 audio is always on (docs); the pricebook has one rate per height.
  "Veo-3.1": flat({ "720": 0.471, "1080": 0.471, "2160": 0.706 }),
  "Veo-3.1-Fast": flat({ "720": 0.118, "1080": 0.142, "2160": 0.353 }),
  "Grok-Imagine-Video": flat({ "480": 0.059, "720": 0.083 }),
};
