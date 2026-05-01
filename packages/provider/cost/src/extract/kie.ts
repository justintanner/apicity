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
    return { ok: true, data: { rateKey: "kling-3.0", units: seconds } };
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

  return {
    ok: false,
    warnings: [`kie model '${model}' not supported by extractor`],
  };
}
