/**
 * Family-specific rules for the Kie pricing reconciliation.
 *
 * The reconciliation engine owns inventory discovery, validation, and
 * rendering. This module owns the intentionally uneven upstream vocabulary
 * and the representative payloads needed to exercise it.
 */

export const MODEL_FAMILY_REGISTRATIONS = Object.freeze([
  {
    family: "explicit-operation",
    mapping: "EXPLICIT_OPERATION_MAPPINGS",
    payloadStrategy: "generic-create-task-or-endpoint",
    exceptionDisposition: "none",
  },
  {
    family: "marketplace-family",
    mapping: "FAMILY_MAPPING_RULES",
    payloadStrategy: "generic-create-task-or-endpoint",
    exceptionDisposition: "known-false-mapping",
  },
  {
    family: "seedance",
    mapping: "marketplace-family",
    payloadStrategy: "seedance-2-5-override",
    exceptionDisposition: "rate-conflict",
  },
  {
    family: "resolution-and-duration",
    mapping: "marketplace-family",
    payloadStrategy: "generic-create-task-or-endpoint",
    exceptionDisposition: "pricing-only",
  },
  {
    family: "selector-vocabulary",
    mapping: "marketplace-family",
    payloadStrategy: "selector-aware",
    exceptionDisposition: "known-false-mapping",
  },
  {
    family: "audio-and-reference-inputs",
    mapping: "marketplace-family",
    payloadStrategy: "reference-aware",
    exceptionDisposition: "known-false-mapping",
  },
  {
    family: "suno-operations",
    mapping: "explicit-or-marketplace-family",
    payloadStrategy: "operation-aware",
    exceptionDisposition: "known-false-mapping",
  },
  {
    family: "image-and-video-inputs",
    mapping: "marketplace-family",
    payloadStrategy: "media-input-aware",
    exceptionDisposition: "known-false-mapping",
  },
]);

export function validateFamilyRegistrations() {
  const requiredFields = [
    "family",
    "mapping",
    "payloadStrategy",
    "exceptionDisposition",
  ];
  const seen = new Set();
  for (const registration of MODEL_FAMILY_REGISTRATIONS) {
    for (const field of requiredFields) {
      if (
        typeof registration[field] !== "string" ||
        registration[field].length === 0
      ) {
        throw new Error(
          `Kie family registration ${registration.family ?? "unknown"} lacks ${field}`
        );
      }
    }
    if (seen.has(registration.family)) {
      throw new Error(
        `duplicate Kie family registration: ${registration.family}`
      );
    }
    seen.add(registration.family);
  }
  return MODEL_FAMILY_REGISTRATIONS;
}

export const RUNTIME_VARIANT_EXCEPTIONS = Object.freeze([
  {
    key: "grok-imagine/image-to-video",
    variant: "1080p",
    status: "pricing-only",
    provenance:
      "frozen Grok image-to-video 1080p cell publishes $0.004/s; live Kie 1080p tier is $0.04/s",
    rationale:
      "No exact official USD evidence matches the reachable runtime tier; the malformed official row is upstream-unmappable.",
  },
  {
    key: "grok-imagine/text-to-image",
    variant: "",
    status: "pricing-only",
    provenance:
      "frozen snapshot contains a $0.02 default row whose URL query names text-to-video, plus a separate $0.025 quality bundle row",
    rationale:
      "The live non-pro default bundle has no conflict-free official cell; the query-conflicted row remains upstream-unmappable and the quality bundle is audited separately.",
  },
  {
    key: "grok-imagine-image-2-0/segment-map",
    variant: "",
    status: "pricing-only",
    provenance:
      "tests/recordings/kie_2079838932/grok-imagine-image-2-lifecycle_1692809741/recording.har terminal recordInfo reports " +
      "0.0 credits",
    rationale:
      "The reachable $0.00 per generation variant is supported by live billing evidence but remains absent from the 2026-08-22 pricing catalog.",
  },
  {
    key: "hailuo/02-image-to-video-standard",
    variant: "6|768P",
    status: "pricing-only",
    provenance:
      "frozen snapshot contains 6s/512p and 10s/768p, but no 6s/768p cell",
    rationale:
      "WI6 records the live variant as pricing-only because the frozen source has no exact cell for this selector combination.",
  },
  {
    key: "bytedance/seedance-2",
    variant: "480p|video",
    status: "pricing-only",
    provenance:
      "frozen Seedance 2 480p reference-video cell publishes $0.057; live runtime rate is $0.0575",
    rationale:
      "The official/runtime USD conflict is explicit in WI6 and is not rounded or treated as exact evidence.",
  },
  ...[
    ["kling-3.0-omni/image-to-video", "720p"],
    ["kling-3.0-omni/image-to-video", "720p|audio"],
    ["kling-3.0-omni/image-to-video", "1080p"],
    ["kling-3.0-omni/image-to-video", "1080p|audio"],
    ["kling-3.0-omni/image-to-video", "4k"],
    ["kling-3.0-omni/image-to-video", "4k|audio"],
    ["kling-3.0-omni/reference-to-video", "720p"],
    ["kling-3.0-omni/reference-to-video", "720p|audio"],
    ["kling-3.0-omni/reference-to-video", "720p|video"],
    ["kling-3.0-omni/reference-to-video", "1080p"],
    ["kling-3.0-omni/reference-to-video", "1080p|audio"],
    ["kling-3.0-omni/reference-to-video", "1080p|video"],
    ["kling-3.0-omni/reference-to-video", "4k"],
    ["kling-3.0-omni/reference-to-video", "4k|audio"],
    ["kling-3.0-omni/reference-to-video", "4k|video"],
    ["kling-3.0-omni/text-to-video", "720p"],
    ["kling-3.0-omni/text-to-video", "720p|audio"],
    ["kling-3.0-omni/text-to-video", "1080p"],
    ["kling-3.0-omni/text-to-video", "1080p|audio"],
    ["kling-3.0-omni/text-to-video", "4k"],
    ["kling-3.0-omni/text-to-video", "4k|audio"],
    ["kling-3.0-omni/transformation", "720p"],
    ["kling-3.0-omni/transformation", "1080p"],
    ["kling-3.0-omni/transformation", "4k"],
  ].map(([key, variant]) => ({
    key,
    variant,
    status: "pricing-only",
    provenance:
      "plans/ac-qq2ykq/build/kling-omni-pricing-capture-2026-08-20.json records the official 2026-08-20 pricing verification",
    rationale:
      "This runtime variant is a post-snapshot addition verified against official pricing on 2026-08-20.",
  })),
  {
    key: "grok-imagine/upscale",
    variant: "",
    status: "unreachable",
    provenance:
      "live PRICING.kie contains a zero-rate fail-closed sentinel; the frozen source has no callable selector for Grok upscale",
    rationale:
      "The zero entry is an unreachable sentinel, never a free estimate, because source and target resolution selectors are absent from the task request.",
  },
  {
    key: "topaz/image-upscale",
    variant: "",
    status: "unreachable",
    provenance:
      "live PRICING.kie contains a zero-rate fail-closed sentinel; the frozen Topaz image rows are not expressible by the callable request",
    rationale:
      "The zero entry is an unreachable sentinel, never a free estimate, because output-resolution billing cannot be derived from the request schema.",
  },
  ...[
    ["runway/extend", "720p"],
    ["runway/extend", "1080p"],
    ["sora-watermark-remover", ""],
  ].map(([key, variant]) => ({
    key,
    variant,
    status: "pricing-only",
    provenance:
      "no matching official occurrence in the frozen 408-row Kie snapshot",
    rationale:
      "WI6 records the live runtime option as pricing-only because no exact official cell identifies this variant.",
  })),
  {
    key: "nano-banana",
    variant: "",
    status: "legacy",
    provenance:
      "frozen snapshot contains nano-banana family rows, but they identify google/nano-banana, nano-banana-2, nano-banana-pro, or google/nano-banana-edit rather than the legacy nano-banana runtime key",
    rationale:
      "The legacy family key is retained as legacy; family-name collapse must not substitute it for a concrete official model operation.",
  },
  {
    key: "qwen/image-to-image",
    variant: "",
    status: "unreachable",
    provenance:
      "frozen Qwen Image image-to-image cell is nonzero, but no output-area or megapixel selector exists in the callable schema",
    rationale:
      "The live rate is units-unreachable; it must fail closed rather than injecting undeclared image_size or claiming a free/default area.",
  },
]);

export const EXPLICIT_OPERATION_MAPPINGS = Object.freeze([
  {
    key: "seedream/5-pro-image-to-image",
    patterns: [/seedream 5 pro,\s*input image/i],
  },
  {
    key: "elevenlabs/text-to-dialogue-v3",
    patterns: [/elevenlabs.*text to dialogue/i],
  },
  {
    key: "wan/2-2-animate-move",
    patterns: [/wan 2\.2.*animate.*move/i],
  },
  {
    key: "wan/2-2-animate-replace",
    patterns: [/wan 2\.2.*animate.*replace/i],
  },
  {
    key: "wan/2-2-a14b-image-to-video-turbo",
    patterns: [/wan 2\.2,\s*image-to-video/i],
  },
  {
    key: "veo3_fast",
    patterns: [/google veo 3\.1.*(?:text-to-video|image-to-video).*fast-/i],
  },
  {
    key: "veo3_lite",
    patterns: [/google veo 3\.1.*(?:text-to-video|image-to-video).*lite-/i],
  },
  {
    key: "nano-banana-2",
    patterns: [/google nano banana 2\b/i],
  },
  {
    key: "nano-banana-pro",
    patterns: [/google nano banana pro\b/i],
  },
  {
    key: "suno/lyrics",
    patterns: [/suno,\s*generate lyrics\b/i],
  },
  {
    key: "suno/upload-extend",
    patterns: [/suno,\s*upload-and-extend-audio/i],
  },
  {
    key: "suno/vocal-removal-generate",
    patterns: [/suno,\s*vocal\s+separate/i],
  },
  {
    key: "wan/2-2-a14b-speech-to-video-turbo",
    patterns: [/wan 2\.2.*speech to video/i],
  },
  {
    key: "veo/extend",
    patterns: [/google veo 3\.1,\s*extend\b/i],
  },
  {
    key: "veo/get-1080p-video",
    patterns: [/google veo 3\.1,\s*get 1080p video/i],
  },
  {
    key: "veo/get-4k-video",
    patterns: [/google veo 3\.1,\s*get 4k video/i],
  },
  {
    key: "veo3_lite",
    patterns: [/google veo 3\.1.*reference-to-video.*lite/i],
  },
  {
    key: "veo3_fast",
    patterns: [/google veo 3\.1.*reference-to-video.*fast/i],
  },
  {
    key: "veo3",
    patterns: [/google veo 3\.1.*reference-to-video.*quality/i],
  },
  {
    key: "google/imagen4-fast",
    patterns: [/google imagen4.*\bfast\b/i],
  },
  {
    key: "google/imagen4-ultra",
    patterns: [/google imagen4.*\bultra\b/i],
  },
  {
    key: "google/imagen4",
    patterns: [/google imagen4.*\bdefault\b/i],
  },
  {
    key: "suno/persona-generate",
    patterns: [/suno,\s*generate persona/i],
  },
  {
    key: "suno/midi-generate",
    patterns: [/suno,\s*generate midi/i],
  },
  {
    key: "suno/sounds-generate",
    patterns: [/suno,\s*generate sounds?/i],
  },
]);

const FAMILY_MAPPING_RULES = Object.freeze([
  [/kling 3\.0 turbo.*image-to-video/i, "kling/v3-turbo-image-to-video"],
  [/kling 3\.0 turbo.*text-to-video/i, "kling/v3-turbo-text-to-video"],
  [/kling 3\.0, video/i, "kling-3.0/video"],
  [/kling 3\.0 motion/i, "kling-3.0/motion-control"],
  [/mini.?max h3.*image to video/i, "minimax-h3/image-to-video"],
  [/mini.?max h3.*reference to video/i, "minimax-h3/reference-to-video"],
  [/mini.?max h3.*text to video/i, "minimax-h3/text-to-video"],
  [/mini.?max h3.*video input/i, "minimax-h3/text-to-video"],
  [/mini.?max h3.*image input/i, "minimax-h3/image-to-video"],
  [/happyhorse-1\.1.*image-to-video/i, "happyhorse-1-1/image-to-video"],
  [/happyhorse-1\.1.*reference-to-video/i, "happyhorse-1-1/reference-to-video"],
  [/happyhorse-1\.1.*text-to-video/i, "happyhorse-1-1/text-to-video"],
  [/happyhorse-1\.0.*image-to-video/i, "happyhorse/image-to-video"],
  [/happyhorse-1\.0.*reference-to-video/i, "happyhorse/reference-to-video"],
  [/happyhorse-1\.0.*text-to-video/i, "happyhorse/text-to-video"],
  [/happyhorse-1\.0.*video-edit/i, "happyhorse/video-edit"],
  [/google veo 3\.1.*extend/i, "veo/extend"],
  [/google veo 3\.1.*get 1080/i, "veo/get-1080p-video"],
  [/google veo 3\.1.*get 4k/i, "veo/get-4k-video"],
  [/google veo 3\.1.*lite/i, "veo3_lite"],
  [/google veo 3\.1.*fast/i, "veo3_fast"],
  [/google veo 3\.1.*quality/i, "veo3"],
  [/gemini-omni-video/i, "gemini-omni-video"],
  [/runway aleph/i, "aleph/generate"],
  [/^runway,/i, "runway/generate"],
  [/4o image/i, "gpt4o-image/generate"],
  [/flux1-kontext.*pro/i, "flux-kontext-pro"],
  [/flux1-kontext.*max/i, "flux-kontext-max"],
  [/kling ai avtar.*standard/i, "kling/ai-avatar-standard"],
  [/kling ai avtar.*pro/i, "kling/ai-avatar-pro"],
  [/mei.?gen-ai infinitetalk/i, "infinitalk/from-audio"],
  [/volcengine.*lip sync/i, "volcengine/video-to-video-lip-sync"],
  [/topaz image upscaler/i, "topaz/image-upscale"],
  [/topaz video upscaler/i, "topaz/video-upscale"],
  [/recraft crisp upscale/i, "recraft/crisp-upscale"],
  [/recraft remove background/i, "recraft/remove-background"],
  [/qwen image.*text-to-image/i, "qwen/text-to-image"],
  [/qwen image.*image-to-image/i, "qwen/image-to-image"],
  [/qwen image-edit/i, "qwen/image-edit"],
  [/google nano banana edit/i, "google/nano-banana-edit"],
  [/google nano banana,/i, "google/nano-banana"],
  [/gpt image 1\.5.*image-to-image/i, "gpt-image/1.5-image-to-image"],
  [/gpt image 1\.5.*text-to-image/i, "gpt-image/1.5-text-to-image"],
  [/ideogram character-remix/i, "ideogram/character-remix"],
  [/ideogram character-edit/i, "ideogram/character-edit"],
  [/ideogram character,/i, "ideogram/character"],
  [/ideogram v3-remix/i, "ideogram/v3-remix"],
  [/ideogram v3-edit/i, "ideogram/v3-edit"],
  [/ideogram v3,.*text-to-image/i, "ideogram/v3-text-to-image"],
  [/wan 2\.7 video.*videoedit/i, "wan/2-7-videoedit"],
  [/wan 2\.7 video.*r2v/i, "wan/2-7-r2v"],
  [/wan 2\.7 video.*image-to-video/i, "wan/2-7-image-to-video"],
  [/wan 2\.7 video.*text-to-video/i, "wan/2-7-text-to-video"],
  [/wan 2\.7 image pro/i, "wan/2-7-image-pro"],
  [/wan 2\.7 image/i, "wan/2-7-image"],
  [/suno,.*boost music style/i, "suno/style-generate"],
  [
    /suno,.*advanced split|suno,.*vocal separate|suno,.*multi-stem/i,
    "suno/vocal-removal-generate",
  ],
  [/suno,.*timestamped lyrics/i, "suno/timestamped-lyrics"],
  [/suno,.*cover generate/i, "suno/cover-generate"],
  [/suno,.*generate persona/i, "suno/persona-generate"],
  [/suno,.*generate midi/i, "suno/midi-generate"],
  [/suno,.*generate sounds/i, "suno/sounds-generate"],
  [/suno,.*mashup/i, "suno/mashup-generate"],
  [/suno,.*replace music section/i, "suno/replace-music-section-generate"],
  [/suno,.*convert-to-wav/i, "suno/wav-generate"],
  [/suno,.*generate lyrics/i, "suno/lyrics"],
  [/suno,.*upload-and-cover/i, "suno/upload-cover"],
  [/suno,.*create-music-video/i, "suno/mp4-generate"],
  [/suno,.*upload-and-extend|suno,.*extend music/i, "suno/extend"],
  [/suno,.*add-instrumental/i, "suno/add-instrumental-generate"],
  [/suno,.*add-vocals/i, "suno/add-vocals-generate"],
  [/suno,.*generate\s*$/i, "suno/generate"],
]);

export function explicitOperationKey(description, pricing) {
  for (const mapping of EXPLICIT_OPERATION_MAPPINGS) {
    if (
      pricing.has(mapping.key) &&
      mapping.patterns.some((pattern) => pattern.test(description))
    ) {
      return mapping.key;
    }
  }
  return undefined;
}

export function familyMappingCandidates({ description, anchor, pricing }) {
  const candidates = [];
  const add = (key) => {
    if (pricing.has(key) && !candidates.includes(key)) candidates.push(key);
  };
  for (const [pattern, key] of FAMILY_MAPPING_RULES) {
    if (pattern.test(description)) add(key);
  }
  const lower = description.toLowerCase();
  if (anchor.includes("/suno-api") && lower.includes("extend")) {
    add("suno/extend");
  }
  if (anchor.includes("/suno-api") && lower.includes("add-vocals")) {
    add("suno/add-vocals-generate");
  }
  return candidates;
}

const SELECTOR_RULES = Object.freeze([
  {
    family: "seedream-quality",
    matches: (key) =>
      key === "seedream/5-pro-text-to-image" ||
      key === "seedream/5-pro-image-to-image",
    apply: (key, text, candidates) => {
      candidates.quality = /(?:^|[-,\s])2k(?:$|[-,\s])/i.test(text)
        ? "high"
        : /(?:^|[-,\s])(?:1k|1\.5k)(?:$|[-,\s])/i.test(text)
          ? "basic"
          : undefined;
      if (
        key === "seedream/5-pro-image-to-image" &&
        /input image/i.test(text)
      ) {
        candidates.quality = "basic";
      }
    },
  },
  {
    family: "grok-extend",
    matches: (key) => key === "grok-imagine/extend",
    apply: (_key, _text, candidates, context) => {
      if (context.duration) {
        candidates.extend_times = context.duration[1];
        delete candidates.duration;
      }
    },
  },
  {
    family: "kling-video",
    matches: (key) => key === "kling-3.0/video",
    apply: (_key, text, candidates, context) => {
      if (!context.resolution) return;
      candidates.mode =
        context.resolution[1].toLowerCase() === "4k"
          ? "4K"
          : context.resolution[1].toLowerCase() === "1080p"
            ? "pro"
            : "std";
      if (/with audio/i.test(text)) candidates.sound = true;
    },
  },
  {
    family: "kling-motion-control",
    matches: (key) =>
      key === "kling-3.0/motion-control" || key === "kling-2.6/motion-control",
    apply: (_key, _text, candidates, context) => {
      if (context.resolution)
        candidates.mode = context.resolution[1].toLowerCase();
    },
  },
  {
    family: "veo-extend",
    matches: (key) => key === "veo/extend",
    apply: (_key, text, candidates) => {
      if (/quality/i.test(text)) candidates.model = "quality";
      else if (/fast/i.test(text)) candidates.model = "fast";
    },
  },
  {
    family: "topaz-video-upscale",
    matches: (key) => key === "topaz/video-upscale",
    apply: (_key, text, candidates) => {
      const factor = text.match(/(?:^|[-/\s])([124])x(?:$|[-/\s])/i);
      if (factor) candidates.upscale_factor = factor[1];
    },
  },
  {
    family: "runway-quality",
    matches: (key) => key === "runway/generate" || key === "runway/extend",
    apply: (_key, text, candidates) => {
      if (/1080p/i.test(text)) candidates.quality = "1080p";
      else if (/720p/i.test(text)) candidates.quality = "720p";
    },
  },
  {
    family: "ideogram-rendering-speed",
    matches: (key) => key.startsWith("ideogram/"),
    apply: (_key, text, candidates) => {
      if (/\b(?:TURBO|BALANCED|QUALITY)\b/.test(text)) {
        candidates.rendering_speed = text.match(
          /\b(TURBO|BALANCED|QUALITY)\b/
        )[1];
      }
    },
  },
  {
    family: "grok-pro-bundle",
    matches: (key) => key === "grok-imagine/text-to-image",
    apply: (_key, text, candidates) => {
      if (/quality/i.test(text)) candidates.enable_pro = true;
    },
  },
  {
    family: "nano-banana-resolution",
    matches: (key) => key === "nano-banana-pro",
    apply: (_key, text, candidates) => {
      if (/1\/2k/i.test(text)) candidates.resolution = "1K";
    },
  },
  {
    family: "gpt-image-quality",
    matches: (key) =>
      key === "gpt-image/1.5-text-to-image" ||
      key === "gpt-image/1.5-image-to-image",
    apply: (_key, text, candidates) => {
      if (/\bhigh\b/i.test(text)) candidates.quality = "high";
    },
  },
  {
    family: "audio-variant",
    matches: (key) =>
      key === "kling-2.6/text-to-video" || key === "kling-2.6/image-to-video",
    apply: (_key, text, candidates) => {
      candidates.sound = /with audio/i.test(text);
    },
  },
  {
    family: "seedance-audio",
    matches: (key) => key === "bytedance/seedance-1.5-pro",
    apply: (_key, text, candidates) => {
      candidates.generate_audio = /with audio/i.test(text);
    },
  },
  {
    family: "suno-vocal-type",
    matches: (key) => key === "suno/vocal-removal-generate",
    apply: (_key, text, candidates) => {
      if (/multi-stem/i.test(text)) candidates.type = "split_stem";
      if (/vocal\s+separate/i.test(text)) candidates.type = "separate_vocal";
    },
  },
]);

export function applySelectorRules({ key, text, candidates, context }) {
  for (const rule of SELECTOR_RULES) {
    if (rule.matches(key, text)) rule.apply(key, text, candidates, context);
  }
  return candidates;
}

const PAYLOAD_RULES = Object.freeze([
  {
    family: "wan-speech-frames",
    matches: (key) => key === "wan/2-2-a14b-speech-to-video-turbo",
    apply: (input) =>
      Object.assign(input, { num_frames: 80, frames_per_second: 16 }),
  },
  {
    family: "seedream-image-inputs",
    matches: (key) => key === "seedream/5-pro-image-to-image",
    apply: (input, text) => {
      input.image_urls = /input image/i.test(text)
        ? ["https://example.com/a.png", "https://example.com/b.png"]
        : ["https://example.com/a.png"];
    },
  },
  {
    family: "seedance-reference-video",
    matches: (key, text) =>
      key.startsWith("bytedance/seedance-2") &&
      key !== "bytedance/seedance-2-5" &&
      /with video(?: input)?/i.test(text),
    apply: (input) => {
      input.reference_video_urls = ["https://example.com/a.mp4"];
    },
  },
  {
    family: "kling-image-video",
    matches: (key) => key === "kling-2.6/image-to-video",
    apply: (input) => {
      input.image_urls = ["https://example.com/a.png"];
    },
  },
  {
    family: "gemini-video-input",
    matches: (key, text) =>
      key === "gemini-omni-video" && /with video input/i.test(text),
    apply: (input) => {
      input.video_list = [
        { url: "https://example.com/a.mp4", start: 0, ends: 5 },
      ];
    },
  },
  {
    family: "kling-motion-input",
    matches: (key) => key === "kling-3.0/motion-control",
    apply: (input) => {
      input.input_urls = ["https://example.com/a.png"];
      input.video_urls = ["https://example.com/a.mp4"];
    },
  },
  {
    family: "wan-animate-input",
    matches: (key) =>
      key === "wan/2-2-animate-move" || key === "wan/2-2-animate-replace",
    apply: (input) => {
      input.video_url = "https://example.com/a.mp4";
      input.image_url = "https://example.com/a.png";
    },
  },
  {
    family: "topaz-video-input",
    matches: (key) => key === "topaz/video-upscale",
    apply: (input) => {
      input.video_url = "https://example.com/a.mp4";
    },
  },
  {
    family: "minimax-inputs",
    matches: (key) => key.startsWith("minimax-h3/"),
    apply: (input, text, key) => {
      if (!key.endsWith("image-to-video")) input.aspect_ratio = "16:9";
      if (key.endsWith("reference-to-video")) {
        input.reference_image_urls = ["https://example.com/a.png"];
      }
      if (key.endsWith("image-to-video")) {
        input.first_frame_url = "https://example.com/a.png";
        if (/image input/i.test(text)) input.duration = 5;
      }
    },
  },
  {
    family: "seedream-layer-input",
    matches: (key) => key === "seedream/5-pro-layer-decomposition",
    apply: (input) => {
      input.image_url = "https://example.com/a.png";
    },
  },
  {
    family: "happyhorse-inputs",
    matches: (key) => key.includes("happyhorse"),
    apply: (input, _text, key) => {
      if (key.includes("image-to-video")) {
        input.image_urls = ["https://example.com/a.png"];
      }
      if (key.includes("reference-to-video")) {
        input.reference_image = ["https://example.com/a.png"];
      }
      if (key.endsWith("video-edit")) {
        input.video_url = "https://example.com/a.mp4";
      }
    },
  },
  {
    family: "kling-v3-input",
    matches: (key) => key.startsWith("kling/v3-turbo-image-to-video"),
    apply: (input) => {
      input.image_urls = ["https://example.com/a.png"];
      input.duration = "5";
    },
  },
  {
    family: "volcengine-lip-sync-input",
    matches: (key) => key === "volcengine/video-to-video-lip-sync",
    apply: (input) => {
      input.mode = "basic";
      input.video_url = "https://example.com/a.mp4";
      input.audio_url = "https://example.com/a.mp3";
    },
  },
  {
    family: "human-avatar-inputs",
    matches: (key) =>
      key === "omnihuman-1-5" ||
      key === "kling/ai-avatar-standard" ||
      key === "kling/ai-avatar-pro" ||
      key === "infinitalk/from-audio",
    apply: (input) => {
      input.image_url = "https://example.com/a.png";
      input.audio_url = "https://example.com/a.mp3";
    },
  },
  {
    family: "seedance-aspect-ratio",
    matches: (key) => key === "bytedance/seedance-1.5-pro",
    apply: (input) => {
      input.aspect_ratio = "1:1";
    },
  },
  {
    family: "kling-multi-shot",
    matches: (key) => key === "kling-3.0/video",
    apply: (input) => {
      input.multi_shots = false;
    },
  },
  {
    family: "grok-video-preview-input",
    matches: (key) => key === "grok-imagine-video-1-5-preview",
    apply: (input) => {
      input.image_urls = ["https://example.com/a.png"];
    },
  },
  {
    family: "grok-video-inputs",
    matches: (key) =>
      key === "grok-imagine/text-to-video" ||
      key === "grok-imagine/image-to-video",
    apply: (input, _text, key) => {
      input.duration = 6;
      if (key === "grok-imagine/image-to-video") {
        input.image_urls = ["https://example.com/a.png"];
      }
    },
  },
  {
    family: "grok-image-inputs",
    matches: (key) =>
      key === "grok-imagine/text-to-image" ||
      key === "grok-imagine/image-to-image",
    apply: (input, _text, key) => {
      input.prompt = "audit";
      if (key === "grok-imagine/image-to-image") {
        input.image_urls = ["https://example.com/a.png"];
      }
    },
  },
  {
    family: "grok-extend-input",
    matches: (key) => key === "grok-imagine/extend",
    apply: (input) => {
      input.task_id = "audit-task";
      input.prompt = "audit";
      input.extend_at = 0;
      delete input.resolution;
    },
  },
  {
    family: "gemini-default-duration",
    matches: (key) => key === "gemini-omni-video",
    apply: (input) => {
      if (!Object.hasOwn(input, "duration")) input.duration = "4";
    },
  },
  {
    family: "hailuo-image-input",
    matches: (key) => key.includes("hailuo") && key.includes("image-to-video"),
    apply: (input) => {
      input.image_url = "https://example.com/a.png";
    },
  },
  {
    family: "kling-v2-5-image-input",
    matches: (key) => key.includes("kling/v2-5-turbo-image-to-video"),
    apply: (input) => {
      input.image_url = "https://example.com/a.png";
    },
  },
  {
    family: "wan-image-input",
    matches: (key) => key.includes("wan/2-2-a14b-image-to-video"),
    apply: (input) => {
      input.image_url = "https://example.com/a.png";
    },
  },
  {
    family: "wan-duration-inputs",
    matches: (key) =>
      key.includes("wan/2-5-image-to-video") ||
      key.includes("wan/2-5-text-to-video"),
    apply: (input, text, key) => {
      if (key.includes("image-to-video")) {
        input.image_url = "https://example.com/a.png";
      }
      input.duration = /10(?:\.0)?s/i.test(text) ? "10" : "5";
    },
  },
  {
    family: "wan-v2-7-image-input",
    matches: (key) => key === "wan/2-7-image-to-video",
    apply: (input) => {
      input.first_frame_url = "https://example.com/a.png";
    },
  },
  {
    family: "wan-speech-media-inputs",
    matches: (key) => key.includes("wan/2-2-a14b-speech"),
    apply: (input) => {
      input.image_url = "https://example.com/a.png";
      input.audio_url = "https://example.com/a.mp3";
    },
  },
  {
    family: "recraft-image-input",
    matches: (key) => key.includes("recraft/"),
    apply: (input) => {
      input.image = "https://example.com/a.png";
    },
  },
  {
    family: "ideogram-image-inputs",
    matches: (key) => key.startsWith("ideogram/"),
    apply: (input, _text, key) => {
      if (key.includes("edit") || key.includes("remix")) {
        input.image_url = "https://example.com/a.png";
        if (key.includes("edit")) input.mask_url = "https://example.com/m.png";
      }
      if (key.includes("character")) {
        input.reference_image_urls = ["https://example.com/a.png"];
      }
    },
  },
  {
    family: "gpt-image-input",
    matches: (key) => key === "gpt-image-2-image-to-image",
    apply: (input) => {
      input.input_urls = ["https://example.com/a.png"];
    },
  },
  {
    family: "qwen-image-input",
    matches: (key) => key === "qwen/image-edit" || key === "qwen2/image-edit",
    apply: (input) => {
      input.image_url = "https://example.com/a.png";
    },
  },
  {
    family: "google-image-input",
    matches: (key) => key === "google/nano-banana-edit",
    apply: (input) => {
      input.image_urls = ["https://example.com/a.png"];
    },
  },
  {
    family: "flux-inputs",
    matches: (key) => key.includes("flux-2/"),
    apply: (input, _text, key) => {
      input.aspect_ratio = "1:1";
      if (key.includes("image-to-image")) {
        input.input_urls = ["https://example.com/a.png"];
      }
    },
  },
  {
    family: "z-image-aspect-ratio",
    matches: (key) => key === "z-image",
    apply: (input) => {
      input.aspect_ratio = "1:1";
    },
  },
  {
    family: "seedream-4-5-inputs",
    matches: (key) => key.includes("seedream/4.5"),
    apply: (input, _text, key) => {
      input.quality = "basic";
      if (key.includes("image-to-image")) {
        input.image_urls = ["https://example.com/a.png"];
      }
    },
  },
  {
    family: "seedream-5-lite-inputs",
    matches: (key) => key.includes("seedream/5-lite"),
    apply: (input, _text, key) => {
      input.quality = "basic";
      if (key.includes("image-to-image")) {
        input.image_urls = ["https://example.com/a.png"];
      }
    },
  },
]);

export function applyPayloadRules({ key, text, input }) {
  for (const rule of PAYLOAD_RULES) {
    if (rule.matches(key, text)) rule.apply(input, text, key);
  }
  return input;
}

export function representativePayloadOverride(key, selectors) {
  if (key !== "bytedance/seedance-2-5") return undefined;
  return {
    model: key,
    input: {
      prompt: "audit",
      resolution: selectors.resolution,
      generate_audio: selectors.generate_audio,
      duration: 5,
    },
  };
}

export function endpointPayloadOverrides(key, selectors) {
  if (key === "runway/generate") return { prompt: "audit" };
  if (key === "grok-imagine/extend") {
    return {
      task_id: "audit-task",
      prompt: "audit",
      extend_at: 0,
      input: { extend_times: selectors.extend_times },
    };
  }
  return {};
}

const KNOWN_FALSE_MAPPING_RULES = Object.freeze([
  {
    family: "veo-extend-lite",
    matches: (description) =>
      /Google veo 3\.1,\s*Extend,\s*Lite/i.test(description),
    message:
      "Veo Extend Lite is published upstream but is unreachable because the callable Veo Extend schema only accepts fast|quality; it must not be treated as a callable rate.",
  },
  {
    family: "topaz-image-upscale",
    matches: (description) => /Topaz Image Upscaler/i.test(description),
    message:
      "Topaz image pricing is keyed by output resolution, but the callable request only carries an unmapped upscale factor; the estimator must fail closed.",
  },
  {
    family: "grok-upscale",
    matches: (description) => /grok-imagine,\s*upscale/i.test(description),
    message:
      "Grok upscale pricing is keyed by source and target resolutions that are absent from the task_id-only request; the estimator must fail closed.",
  },
  {
    family: "suno-advanced-split",
    matches: (description) => /Suno,\s*Advanced Split/i.test(description),
    message:
      "Suno Advanced Split is a distinct billed operation whose stem-name selector is absent from the current request schema.",
  },
  {
    family: "wan-580p",
    matches: (description, key) =>
      /^wan 2\.2,\s*(?:image-to-video|text-to-video).*580p/i.test(
        description
      ) &&
      key?.startsWith("wan/2-2-a14b-") &&
      !key.includes("speech"),
    message:
      "The official 580p Wan 2.2 cell is not reachable because the standard request schema enum is only 480p|720p.",
  },
  {
    family: "minimax-video-input",
    matches: (description) => /MiniMax H3,\s*video input/i.test(description),
    message:
      "MiniMax H3 video-input billing is duration-based, but the reference video duration is not present in the callable request payload.",
  },
  {
    family: "seedance-2-rate-conflict",
    matches: (description, _key, official) =>
      /bytedance\/seedance-2,\s*480p with video/i.test(description) &&
      String(official.usdPrice) === "0.057",
    message:
      "The official Seedance 2 480p reference-video cell publishes $0.057 while the callable runtime rate is $0.0575; retain it as an explicit upstream rate conflict rather than rounding the evidence.",
  },
  {
    family: "wan-2-6-duration",
    matches: (description) =>
      /wan 2\.6,\s*video-to-video,\s*15\.0s/i.test(description),
    message:
      "The official Wan 2.6 15-second video-to-video rows have no callable runtime 15-second variant; the live estimator publishes only 5s and 10s tiers.",
  },
  {
    family: "grok-image-video-rate-conflict",
    matches: (description, _key, official) =>
      /grok-imagine,\s*image-to-video,\s*1080p/i.test(description) &&
      String(official.usdPrice) === "0.004",
    message:
      "The official Grok image-to-video cell publishes $0.004/s while the callable 1080p runtime tier is $0.04/s; retain the upstream rate conflict explicitly.",
  },
  {
    family: "qwen-image-area",
    matches: (description) => /Qwen Image,\s*image-to-image/i.test(description),
    message:
      "Qwen image-to-image is nonzero in the table, but the callable schema has no output-area field that can derive the per-megapixel units; the estimator must fail closed.",
  },
]);

export function knownFalseMapping({ description, key, official }) {
  const rule = KNOWN_FALSE_MAPPING_RULES.find((candidate) =>
    candidate.matches(description, key, official)
  );
  return rule?.message;
}
