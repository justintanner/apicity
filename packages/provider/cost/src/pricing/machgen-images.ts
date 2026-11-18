import type { ModelPricing, PerUnitPricing } from "./types";
import {
  asNumber,
  asObject,
  gptImageDimensions,
  gptImageOutputTokens,
} from "./helpers";

// Gross USD before Generation Credit. Exact public pricebook rows are saved
// in tests/fixtures/machgen-evidence/machgen-image-pricebook-2026-10-30.json.
const source = {
  url: "https://api.machgen.ai/api/v0/billing/pricebook/public",
  asOf: "2026-10-30",
};
function imagePricing(
  rates: Record<string, number>,
  heightOnly = false,
  quality = false
): PerUnitPricing {
  return {
    kind: "perUnit",
    unit: "images",
    units: (p) =>
      p.task_type === "T2I" || p.task_type === "I2I" ? 1 : undefined,
    select: [
      {
        name: "size",
        required: true,
        pick: (p) => {
          const c = asObject(p.image_config) ?? {};
          const height = asNumber(c.height);
          if (!height || height <= 0) return undefined;
          if (heightOnly) return String(height);
          // Require explicit dimensions for the fixed-size partner models;
          // do not guess rounding or snap an unsupported size to a cheap row.
          const width = asNumber(c.width);
          return width && width > 0 ? `${width}x${height}` : undefined;
        },
      },
      ...(quality
        ? [
            {
              name: "quality",
              required: true,
              pick: (p: Record<string, unknown>) =>
                typeof p.optimization_level === "string"
                  ? p.optimization_level
                  : "STANDARD",
            },
          ]
        : []),
    ],
    rates,
    source,
  };
}

// Both 2.6 models use 30 micro-USD per token, discounted by 30% through
// 2027-03-01T16:00Z. An edit source is billed as a 1024x1024 max image.
const tokenRate = 21 / 1e6;
const referenceTokens = 7024;
const qualityFactors = new Map<string, readonly [number, number]>([
  ["low", [16, 42]],
  ["medium", [24, 33]],
  ["high", [48, 10]],
  ["xhigh", [64, 10]],
  ["max", [96, 10]],
]);

function gptImage2p6Output(payload: Record<string, unknown>): number | string {
  const config = asObject(payload.image_config);
  const output = asObject(payload.image_output);
  const size = gptImageDimensions(config?.width, config?.height);
  if (!size || config?.size_mode === "auto")
    return "image_config requires explicit supported width and height";
  const factors =
    typeof output?.quality === "string" && qualityFactors.get(output.quality);
  if (!factors)
    return "image_output.quality must be low, medium, high, xhigh or max";
  if (output?.output_format === "gif")
    return "GIF pricing depends on the delivered frame count";
  if (output?.partial_images !== undefined && output.partial_images !== 0)
    return "partial_images pricing depends on the delivered preview count";
  if (payload.continuation_task_id !== undefined)
    return "continuation_task_id carries an unknown reference charge";
  if (
    payload.src_task_ids !== undefined &&
    !(Array.isArray(payload.src_task_ids) && payload.src_task_ids.length === 0)
  )
    return "src_task_ids carry an unknown reference charge";
  const sources = payload.src_image_urls ?? [];
  if (!Array.isArray(sources)) return "src_image_urls must be an array";
  if (payload.task_type === "I2I") {
    if (!sources.length) return "I2I requires a source in src_image_urls";
  } else if (payload.task_type === "T2I") {
    if (sources.length) return "T2I cannot price src_image_urls";
  } else {
    return "task_type must be T2I or I2I";
  }
  const [patches, tenths] = factors;
  const base = gptImageOutputTokens(patches, size.width, size.height);
  return Math.floor((base * tenths + 5) / 10);
}

const gptImage2p6: PerUnitPricing = {
  kind: "perUnit",
  unit: "tokens",
  units: (payload) => {
    const value = gptImage2p6Output(payload);
    return typeof value === "number" ? value : undefined;
  },
  select: [],
  rates: { "": tokenRate },
  extra: (payload) =>
    Array.isArray(payload.src_image_urls)
      ? payload.src_image_urls.length * referenceTokens * tokenRate
      : 0,
  warn: (payload) => {
    const value = gptImage2p6Output(payload);
    return typeof value === "string" ? [value] : [];
  },
  source: { ...source, asOf: "2026-11-18" },
};

export const machgenImages: Record<string, ModelPricing> = {
  "GPT-Image-2": imagePricing(
    {
      "3840x2160|EXPRESS": 0.007062,
      "3840x1648|EXPRESS": 0.004187,
      "2160x3840|EXPRESS": 0.007062,
      "2048x2048|EXPRESS": 0.007062,
      "2048x1536|EXPRESS": 0.004442,
      "2048x1360|EXPRESS": 0.003772,
      "2048x1152|EXPRESS": 0.002832,
      "2048x880|EXPRESS": 0.001939,
      "1920x1088|EXPRESS": 0.00266,
      "1920x816|EXPRESS": 0.001766,
      "1536x2048|EXPRESS": 0.004442,
      "1360x2048|EXPRESS": 0.003772,
      "1280x1280|EXPRESS": 0.004119,
      "1280x960|EXPRESS": 0.00278,
      "1280x848|EXPRESS": 0.002422,
      "1280x720|EXPRESS": 0.001914,
      "1280x544|EXPRESS": 0.001385,
      "1152x2048|EXPRESS": 0.002832,
      "1088x1920|EXPRESS": 0.00266,
      "960x1280|EXPRESS": 0.00278,
      "848x1280|EXPRESS": 0.002422,
      "720x1280|EXPRESS": 0.001914,
      "3840x2160|STANDARD": 0.236,
      "3840x1648|STANDARD": 0.145,
      "2160x3840|STANDARD": 0.236,
      "2048x2048|STANDARD": 0.252,
      "2048x1536|STANDARD": 0.158,
      "2048x1360|STANDARD": 0.13,
      "2048x1152|STANDARD": 0.1,
      "2048x880|STANDARD": 0.066,
      "1920x1088|STANDARD": 0.094,
      "1920x816|STANDARD": 0.062,
      "1536x2048|STANDARD": 0.158,
      "1360x2048|STANDARD": 0.13,
      "1280x1280|STANDARD": 0.148,
      "1280x960|STANDARD": 0.099,
      "1280x848|STANDARD": 0.084,
      "1280x720|STANDARD": 0.068,
      "1280x544|STANDARD": 0.048,
      "1152x2048|STANDARD": 0.1,
      "1088x1920|STANDARD": 0.094,
      "960x1280|STANDARD": 0.099,
      "848x1280|STANDARD": 0.084,
      "720x1280|STANDARD": 0.068,
    },
    false,
    true
  ),
  "GPT-Image-2.5-Sunburst": imagePricing(
    {
      "3840x2160": 0.33,
      "3840x1648": 0.203,
      "2160x3840": 0.33,
      "2048x2048": 0.353,
      "2048x1536": 0.22,
      "2048x1360": 0.182,
      "2048x1152": 0.14,
      "2048x880": 0.093,
      "1920x1088": 0.131,
      "1920x816": 0.087,
      "1536x2048": 0.22,
      "1360x2048": 0.182,
      "1280x1280": 0.208,
      "1280x960": 0.138,
      "1280x848": 0.118,
      "1280x720": 0.094,
      "1280x544": 0.066,
      "1152x2048": 0.14,
      "1088x1920": 0.131,
      "960x1280": 0.138,
      "848x1280": 0.118,
      "720x1280": 0.094,
    },
    false,
    false
  ),
  "GPT-Image-2.5-Flare": imagePricing(
    {
      "3840x2160": 0.33,
      "3840x1648": 0.203,
      "2160x3840": 0.33,
      "2048x2048": 0.353,
      "2048x1536": 0.22,
      "2048x1360": 0.182,
      "2048x1152": 0.14,
      "2048x880": 0.093,
      "1920x1088": 0.131,
      "1920x816": 0.087,
      "1536x2048": 0.22,
      "1360x2048": 0.182,
      "1280x1280": 0.208,
      "1280x960": 0.138,
      "1280x848": 0.118,
      "1280x720": 0.094,
      "1280x544": 0.066,
      "1152x2048": 0.14,
      "1088x1920": 0.131,
      "960x1280": 0.138,
      "848x1280": 0.118,
      "720x1280": 0.094,
    },
    false,
    false
  ),
  "GPT-Image-2.6-Sunburst": gptImage2p6,
  "Nano-Banana-2": imagePricing(
    {
      "4096": 0.089,
      "2048": 0.048,
      "1024": 0.04,
    },
    true,
    false
  ),
  "Nano-Banana-2.1": imagePricing(
    {
      "4096": 0.089,
      "2048": 0.048,
      "1024": 0.04,
    },
    true,
    false
  ),
};
