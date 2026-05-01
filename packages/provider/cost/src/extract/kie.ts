import type { ExtractResult, KieRateExtract } from "./types";
import { asNumber, asObject, asString } from "./messages";

// Coerces durations published by kie schemas. Most use a number of seconds,
// kling uses "5s"/"10s" strings, grok-imagine/image-to-video uses bare
// "6"-"30" digit strings.
function coerceSeconds(d: unknown): number | undefined {
  const n = asNumber(d);
  if (n !== undefined) return n;
  const s = asString(d);
  if (s) {
    const m = s.match(/^(\d+(?:\.\d+)?)/);
    if (m) {
      const v = Number(m[1]);
      if (Number.isFinite(v)) return v;
    }
  }
  return undefined;
}

function missing(
  model: string,
  field: string
): { ok: false; warnings: string[] } {
  return {
    ok: false,
    warnings: [`kie '${model}': payload.input.${field} is required`],
  };
}

// Maps a kie createTask payload to a rate-table key. The rate table in
// pricing.ts splits some kie models by resolution and direction (i2v/t2v)
// because kie marketplace publishes separate rates per tier; the extractor
// rebuilds those keys from the payload's input fields.
//
// Direction (i2v vs t2v) is derived from the presence of an image input —
// `first_frame_url` for seedance, since both seedance models accept either
// a frame for image-to-video or a prompt-only request for text-to-video.
//
// The veo / suno sub-providers don't use the marketplace `{model, input}`
// shape — they live under separate `/api/v1/veo` and `/api/v1/suno`
// endpoints with flatter payloads. veo is supported here as a courtesy
// (read `payload.duration` from the top level since the veo schema has no
// duration field — server picks a default — callers needing an estimate
// supply their own duration as a hint).
//
// Image models price per image (no duration). Resolution-tiered families
// (nano-banana-2, gpt-image-2) require `input.resolution`; flat-rate
// families (qwen2, seedream/5-lite) only need the model string.
// wan/2-7-image accepts an `n` field for batch generation — units = n.
export function extractKie(
  payload: Record<string, unknown>
): ExtractResult<KieRateExtract> {
  const model = asString(payload.model);
  if (!model) {
    return { ok: false, warnings: ["kie: payload.model is required"] };
  }
  const input = asObject(payload.input) ?? {};
  const seconds =
    coerceSeconds(input.duration) ?? coerceSeconds(payload.duration);

  if (model === "veo3" || model === "veo3_fast") {
    if (seconds === undefined) return missing(model, "duration");
    return { ok: true, data: { rateKey: model, units: seconds } };
  }

  if (model === "kling-3.0/video") {
    if (seconds === undefined) return missing(model, "duration");
    const mode = asString(input.mode);
    if (!mode) return missing(model, "mode");
    // kie schema: mode ∈ {"std", "pro", "4K"} maps to resolution
    // {"720p", "1080p", "4k"} respectively for the rate-table key.
    const resolution =
      mode === "std"
        ? "720p"
        : mode === "pro"
          ? "1080p"
          : mode === "4K"
            ? "4k"
            : undefined;
    if (!resolution) {
      return {
        ok: false,
        warnings: [
          `kie '${model}': input.mode '${mode}' must be one of std/pro/4K`,
        ],
      };
    }
    const audio = input.sound === true ? "-audio" : "";
    return {
      ok: true,
      data: { rateKey: `kling-3.0-${resolution}${audio}`, units: seconds },
    };
  }

  if (model === "kling-3.0/motion-control") {
    if (seconds === undefined) return missing(model, "duration");
    const mode = asString(input.mode);
    if (!mode) return missing(model, "mode");
    if (mode !== "720p" && mode !== "1080p") {
      return {
        ok: false,
        warnings: [
          `kie '${model}': input.mode '${mode}' must be one of 720p/1080p`,
        ],
      };
    }
    return {
      ok: true,
      data: {
        rateKey: `kling-3.0-motion-control-${mode}`,
        units: seconds,
      },
    };
  }

  if (
    model === "wan/2-7-text-to-video" ||
    model === "wan/2-7-image-to-video" ||
    model === "wan/2-7-r2v" ||
    model === "wan/2-7-videoedit"
  ) {
    if (seconds === undefined) return missing(model, "duration");
    return { ok: true, data: { rateKey: "wan-2.7", units: seconds } };
  }

  if (
    model === "grok-imagine/text-to-video" ||
    model === "grok-imagine/image-to-video"
  ) {
    const resolution = asString(input.resolution);
    if (!resolution) return missing(model, "resolution");
    if (seconds === undefined) return missing(model, "duration");
    return {
      ok: true,
      data: { rateKey: `grok-imagine-${resolution}`, units: seconds },
    };
  }

  if (
    model === "happyhorse/text-to-video" ||
    model === "happyhorse/image-to-video" ||
    model === "happyhorse/reference-to-video"
  ) {
    const resolution = asString(input.resolution);
    if (!resolution) return missing(model, "resolution");
    if (seconds === undefined) return missing(model, "duration");
    return {
      ok: true,
      data: { rateKey: `happyhorse-${resolution}`, units: seconds },
    };
  }

  if (
    model === "bytedance/seedance-2" ||
    model === "bytedance/seedance-2-fast"
  ) {
    const resolution = asString(input.resolution);
    if (!resolution) return missing(model, "resolution");
    if (seconds === undefined) return missing(model, "duration");
    const direction = input.first_frame_url ? "i2v" : "t2v";
    const slug =
      model === "bytedance/seedance-2-fast" ? "seedance-2-fast" : "seedance-2";
    return {
      ok: true,
      data: { rateKey: `${slug}-${resolution}-${direction}`, units: seconds },
    };
  }

  // Image models. The kie marketplace prices per generated image; nano-banana-2
  // and gpt-image-2 expose 1K/2K/4K resolution tiers. wan/2-7-image accepts an
  // `n` field to request multiple images per call; the rate is per image, so
  // multiply by n.
  if (model === "nano-banana-2") {
    const resolution = asString(input.resolution);
    if (!resolution) return missing(model, "resolution");
    return {
      ok: true,
      data: { rateKey: `nano-banana-2-${resolution}`, units: 1 },
    };
  }

  if (
    model === "gpt-image-2-text-to-image" ||
    model === "gpt-image-2-image-to-image"
  ) {
    const resolution = asString(input.resolution);
    if (!resolution) return missing(model, "resolution");
    return {
      ok: true,
      data: { rateKey: `${model}-${resolution}`, units: 1 },
    };
  }

  if (model === "wan/2-7-image" || model === "wan/2-7-image-pro") {
    const n = asNumber(input.n) ?? 1;
    const slug =
      model === "wan/2-7-image-pro" ? "wan-2.7-image-pro" : "wan-2.7-image";
    return { ok: true, data: { rateKey: slug, units: n } };
  }

  if (model === "qwen2/text-to-image") {
    return { ok: true, data: { rateKey: "qwen2-text-to-image", units: 1 } };
  }
  if (model === "qwen2/image-edit") {
    return { ok: true, data: { rateKey: "qwen2-image-edit", units: 1 } };
  }

  if (model === "seedream/5-lite-text-to-image") {
    return {
      ok: true,
      data: { rateKey: "seedream-5-lite-text-to-image", units: 1 },
    };
  }
  if (model === "seedream/5-lite-image-to-image") {
    return {
      ok: true,
      data: { rateKey: "seedream-5-lite-image-to-image", units: 1 },
    };
  }

  return {
    ok: false,
    warnings: [`kie model '${model}' not supported by extractor`],
  };
}
