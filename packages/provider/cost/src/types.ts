// "tokens-heuristic+table" — token counts estimated from text (chars/4).
// "declared-tokens+table" — token counts supplied by the caller through
//   CostHints. Used where an upstream publishes a per-token rate but the
//   request body carries no billable token count and no defensible conversion
//   exists (KIE's Gemini TTS models), so the caller must declare them or the
//   estimate fails closed.
// "per-unit-table" — units derived from the payload (seconds, images, ...).
// "free" — no charge.
export type CostSource =
  | "tokens-heuristic+table"
  | "declared-tokens+table"
  | "per-unit-table"
  | "free";

export type CostUnit =
  | "tokens"
  | "characters"
  | "seconds"
  | "images"
  | "songs"
  | "generations"
  | "megapixels";

export interface CostBreakdown {
  inputTokens?: number;
  outputTokens?: number;
  units?: number;
  unit?: CostUnit;
  inputUsdPerMillion?: number;
  outputUsdPerMillion?: number;
  perUnitUsd?: number;
  extraUsd?: number;
}

export interface CostEstimate {
  usd: number;
  currency: "USD";
  source: CostSource;
  breakdown: CostBreakdown;
  rateAsOf: string | null;
  warnings: string[];
}

// Cost-only inputs that are NOT part of the upstream request body.
//
// Some upstream endpoints bill per second while their request schema carries
// no duration at all -- the output length follows a source or driving asset
// (kie's omnihuman-1-5, volcengine/video-to-video-lip-sync, ...). The caller
// knows that length; upstream infers it. `costHints` is how the caller tells
// the estimator, without contaminating the body it POSTs or the bytes
// canonicalHash/mintOtp sign.
//
// Additive by design: new hint fields are optional, so adding one is never a
// breaking change.
export interface CostHints {
  // Billable output images for requests whose result count cannot be known
  // from the input, such as KIE Seedream 5 Flash layer decomposition.
  // Cost-only: never merged into the generation request.
  outputImages?: number;
  durationSeconds?: number;
  // Declared total length, in seconds, of the request's video INPUTS, for the
  // kie entries that bill (input video duration + output video duration) x
  // unit price: the Wan 3.0, Seedance 2 / 2 Fast / 2 Mini / 2.5 and MiniMax
  // H3 reference-to-video entries, whose `reference_video_urls` clips are
  // URLs and carry no duration in the request, and happyhorse/video-edit,
  // whose required source `video_url` is billed beside the output and
  // defaults to the declared `durationSeconds` when this field is absent.
  // The fal Seedance 2.0 US, 2.5 and 2.5 US reference-to-video entries read
  // it as the summed length of their `video_urls` clips, billed at the
  // output size, and fail closed below 4 s. For fal
  // `bytedance/seedance-2.5/draft/complete`, whose request carries no media,
  // a valid value means the draft had video inputs, and prices the
  // completion with them.
  // Ignored when the payload has no video input; a zero, negative, non-finite
  // or non-numeric value counts as absent, and a reference-video request with
  // no valid value fails closed with a warning that names this field.
  // Cost-only, like the rest of CostHints: never merged into payload, never
  // canonicalHash'd, never signed.
  inputDurationSeconds?: number;
  // The fixed aspect ratio of a fal Seedance 2.5 draft, for
  // `bytedance/seedance-2.5/draft/complete`. A completed draft keeps the
  // draft's duration (`durationSeconds`), aspect ratio and inputs, and its
  // request carries only the `draft_id`, so the output size is not in the
  // request. "auto" or any value outside the six fixed ratios counts as
  // absent, and the estimate fails closed with a warning that names this
  // field. The (string & {}) member keeps autocomplete for the known ratios
  // while still accepting a runtime-sourced value. Cost-only, like the rest
  // of CostHints: never merged into payload, never canonicalHash'd, never
  // signed.
  aspectRatio?:
    | "21:9"
    | "16:9"
    | "4:3"
    | "1:1"
    | "3:4"
    | "9:16"
    | (string & {});
  // Google Flow plan tier that sets the googleflow credit->USD basis: "plus"
  // (Google AI Plus, $0.04/credit), "pro" (Google AI Pro, $0.02), "ultra-99"
  // (Google AI Ultra $99, $0.01) or "ultra" (Google AI Ultra $199, $0.008).
  // Omitted => "pro", byte-for-byte the pre-selector output; it under-estimates
  // a Plus account by half, so a Plus caller passes "plus". The (string & {})
  // member keeps autocomplete for the four known literals while still accepting
  // a runtime-sourced value: an unrecognized tier warns and falls back to
  // "plus", the highest credit value, rather than being a compile error.
  // Cost-only, like the rest of CostHints: never merged into payload, never
  // canonicalHash'd, never signed. A future Gemini list-rate USD source
  // (REQ-004) would land as a second additive field (e.g.
  // googleFlowRateSource) here, non-breaking.
  googleFlowPlan?: "plus" | "pro" | "ultra-99" | "ultra" | (string & {});
  // Billable token counts for models an upstream prices per token while the
  // request body carries neither count. KIE's `google/gemini-2-5-pro-tts` and
  // `google/gemini-3-1-flash-tts` publish exact rates ($0.70 per million input
  // tokens, $14 per million audio-output tokens) but the payload holds only
  // the text and the voice settings. Characters are not tokens and KIE
  // publishes no conversion, so an estimate that guessed one would be
  // invented; both fields are required together for those models and their
  // absence fails closed with a warning rather than quoting a number.
  //
  // Cost-only, like the rest of CostHints: never merged into payload, never
  // canonicalHash'd, never signed.
  inputTokens?: number;
  outputTokens?: number;
}

// All provider routes are pure-table lookups. Token-billed providers
// approximate input tokens via chars/4 (no upstream tokenizer call).
//
// `endpoint` is an optional discriminator for per-unit providers whose
// pricing is keyed by endpoint rather than by `payload.model` (e.g. Suno,
// where the model field is the audio model version V3_5/.../V5_5 but
// pricing varies per endpoint). When set, it takes precedence over
// payload.model in the pricing lookup. Ignored for token-billed providers.
//
// For `fal` it is optional in the type but required in practice: fal payloads
// carry no model field at all, so the endpoint id ("fal-ai/nano-banana") is the
// only pricing key. Omitting it is not a compile error — it resolves to a zero
// estimate carrying the warning "fal: endpoint or payload.model is required".
export type EstimateRequest =
  | {
      provider:
        | "openai"
        | "anthropic"
        | "xai"
        | "kimicoding"
        | "fireworks"
        | "alibaba"
        | "kie"
        | "elevenlabs"
        | "fal"
        | "googleflow";
      payload: Record<string, unknown>;
      endpoint?: string;
      costHints?: CostHints;
    }
  | { provider: "free-media-upload" };

export interface CostProvider {
  estimate: (req: EstimateRequest) => CostEstimate;
}
