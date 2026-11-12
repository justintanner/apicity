# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Added `gpt-image-2-6/sunburst-image-to-image` (GPT Image 2.6 Sunburst image-to-image) with typed inputs: 1-16 `input_urls`, an inpaint `mask_url` or a `markup` overlay (exclusive; no mask with gif or svg output), and the text-to-image model's enums, defaults and format rules, with a recorded edit.

- Added `gpt-image-2-6/sunburst-text-to-image` (GPT Image 2.6 Sunburst) with typed inputs: the documented enums and defaults for aspect ratio, resolution, quality, background, output format, planning complexity and moderation; the format rules for `output_compression` (jpeg, webp), the GIF fields `size`, `frame_count` and `frame_duration_ms`, and the `svg` object; an open `svg.model` author id; and a recorded generation. The GPT Image model alias accepts the 2.6 spelling (`gpt-image-2-6/<tier>-<task>`).

- `grok-imagine-video-1-5-preview` accepts `resolution: "1080p"` with exactly one `image_urls` entry, as KIE's docs now list it, with a recorded 1 s 1080p generation (8 credits). 480p and 720p still accept more than one image.

- `grok-imagine-video-1-5-preview` accepts `first_frame_url`, `last_frame_url`, `loop_url`, up to four `keyframes` (`url` plus `timestamp_s`, checked against `duration` and at least 1/3 s apart) and `enable_audio` (default `true`), with recorded generations for the frames and the loop. The keyframe and input shapes are exported as `GrokVideo15Keyframe` and `GrokVideo15PreviewInput`.

- Added `omnihuman-2-0` (OmniHuman 2.0) with typed inputs: one image in `image_urls`, `audio_url`, an optional `prompt` of up to 300 characters, and `enable_watermark`, which defaults to `true`. It also comes with `Omnihuman20TaskResultJsonSchema`, per-second pricing in whole output seconds, and a recorded generation.

- Added `pixverse-v6-max/text-to-video` and `pixverse-v6-max/image-to-video` (PixVerse V6 Max) with typed inputs, the documented enums and bounds, a one-image first frame for image-to-video that rejects `aspect_ratio`, `PixverseV6MaxTaskResultJsonSchema`, per-second pricing, and a recorded 1 s generation each. The PixVerse model alias accepts a tier after the version, such as `pixverse-v6-max/...`.

- Added `kling-4.0/reference-to-video` and `kling-4.0/keyframe-to-video` (Kling 4.0) with typed inputs, the documented material and frame limits, `Kling40TaskResultJsonSchema`, per-second pricing, and a recorded 3 s generation each.

- `codex.v1.responses` now enumerates `gpt-6-1-sol`. The id already validated
  through the versioned GPT alias. Responses report the model as
  `gpt-6.1-sol`. A recorded low-effort completion covers the id.
- `claude.v1.messages` now enumerates `claude-haiku-5-5`. The id already
  validated through the versioned Claude alias. A recorded short completion
  covers the id.

- Added `flux-3/klein-text-to-image` with typed inputs, resolution pricing, and a recorded image generation test.
- Added `flux-3/klein-edit-image` with reference images, resolution pricing, and a recorded cat fixture edit test.

- Added `MiniMaxH3ReferenceClipDurationMs`, the `minimax-h3/reference-to-video`
  reference media duration windows in milliseconds, exported from
  `@apicity/kie` and `@apicity/kie/zod` (ac-j3d6ki.2). Videos and audio each
  allow 2000-15000 ms per file and 15000 ms combined. Kie rejects a reference
  video outside the per-file window at submission, and a URL cannot be checked
  locally, so compare local media durations against it before submitting. The
  `reference_video_urls` and `reference_audio_urls` schema descriptions and
  `modelInputSchemas` metadata now state both windows; the audio window and
  the combined caps are documented upstream but not yet observed at runtime.

- Added `vidu-q4/reference-to-video` with image/audio references, aspect-ratio
  controls, per-second pricing, and an owned-assets recording.

- Added `vidu-q4/image-to-video` with duration, resolution and audio controls,
  per-second pricing, and an owned-image recording.

- Added `nano-banana-2-1` for text and reference image generation, with up
  to ten reference images, 1K/2K/4K pricing, and a recorded successful task.

- Added `google/gemini-3-8-flash-lite-tts` with the shared 3.8 voice and
  per-turn style inputs, local validation, and dedicated token pricing.

- Added `google/gemini-3-8-flash-tts` with 70 voices, per-turn style,
  typed validation, CLI metadata, and input/audio-output token pricing.

- Added `seedream/5-flash-layer-decomposition` with typed request metadata,
  local validation, and pricing for the three published output sizes.

- Added `seedream/5-flash-image-to-image` for editing with up to ten reference
  images, typed request metadata, local validation, and 1K/1.5K/2K pricing.

- Added `seedream/5-flash-text-to-image` with typed request metadata, local
  validation, and size-based pricing for 1K, 1.5K, and 2K images.

- `codex.v1.responses` now enumerates `gpt-6-astra`, `gpt-6-luna` and
  `gpt-6-sol` in its `model` enum, so `apicity describe` and the
  `KieResponsesModel` type autocomplete them. All three already validated
  through the versioned GPT alias, so no request that parsed before is
  rejected now. The endpoint's `apicity describe` output also carries a
  recorded `gpt-6-astra` example. Nothing needs migrating.

### Changed

- **Breaking:** `Seedance25RequestSchema` and `Seedance25InputSchema` now
  default `input.generate_audio` to `false`, not `true`, and the
  `modelInputSchemas["bytedance/seedance-2-5"]` descriptor says so. KIE's
  documented default is still `true`; every recorded seedance-2-5 run sent
  `false`, so the schema now follows them. Parsing now adds
  `generate_audio: false`, and `apicity describe` shows the new default.
  createTask still sends the request as written, so an omitted field still
  gets KIE's `true`: send `generate_audio: false` for a silent clip.
- **Breaking:** `GrokVideo15PreviewRequestSchema` and
  `GrokVideo15PreviewInputSchema` now default `input.nsfw_checker` to
  `false`, not `true`, and the
  `modelInputSchemas["grok-imagine-video-1-5-preview"]` description says so.
  KIE's docs and live model schema now say "Defaults to false" (read
  2026-10-25). Parsing now adds `nsfw_checker: false`, and `apicity describe`
  shows the new default. createTask still sends the request as written, so
  an omitted field gets KIE's own default. Pass `nsfw_checker: true` to keep
  KIE's content filter on.
- **Breaking:** `QwenTextToImageRequestSchema` and
  `modelInputSchemas["qwen/text-to-image"]` no longer default
  `input.image_size` to `square_hd`. KIE's docs and live model schema dropped
  that default ("Set this field explicitly", read 2026-10-16). The field stays
  optional with the same six presets, so parsing no longer adds it; set it
  explicitly.
- **Breaking:** The `gemini31Pro`, `gemini3Pro`, `gemini36FlashOpenai`,
  `gemini37FlashOpenai`, and `gemini38FlashOpenai` chat request schemas now
  follow KIE's current docs: `stream` defaults to `false`, and the
  undocumented `model` field is no longer declared. For `gemini31Pro` and
  `gemini3Pro`, `include_thoughts` defaults to `false` and `reasoning_effort`
  still defaults to `"high"`. For `gemini36FlashOpenai`,
  `gemini37FlashOpenai`, and `gemini38FlashOpenai`, `include_thoughts` and
  `reasoning_effort` have no default and are optional in the
  `...ChatCompletionsParsedRequest` types; treat them as possibly `undefined`.
  The provider still sends your payload unchanged. This changes
  `.schema.parse()` output, parsed types, and `apicity describe`. Migration:
  pass `stream: true` explicitly if you send parsed output and want
  server-sent events. Parsed types no longer type `model`.

- **Breaking:** paid endpoints (`post.api.v1.jobs.createTask`, the direct VEO
  and Suno rows, and the other `PAID_ENDPOINTS` rows) now dispatch when
  `createKie` is built without `paygate`. `paygate: { secret }` arms the OTP
  gate, whose behavior is unchanged. An OTP passed to a provider built without
  `paygate` throws `PayGateError` `paygate-not-configured`, and
  `paygate: { secret: "" }` still fails closed. Migration: if you relied on
  paid calls failing closed by default, pass `paygate: { secret }`.

### Removed

- **Breaking:** `gemini25Pro.post.v1.chat.completions`,
  `gemini35FlashOpenai.post.v1.chat.completions`, and
  `gemini.post.v1.models.gemini35Flash.streamGenerateContent`, because KIE
  retired Gemini 2.5 Pro and Gemini 3.5 Flash. On 2026-11-05 a valid-key
  request with an empty `messages` or `contents` array answered HTTP 410
  "no longer available on Kie.ai" on all three. Each docs page says
  `deprecated: true`, the models are gone from the catalog and the pricing
  feed, and the product pages redirect. Nothing was billed. The
  `createGemini25ProProvider` and `createGemini35FlashOpenaiProvider`
  factories and every `KieGemini25Pro*` and `KieGemini35Flash*` schema and
  type go with them. Migration: use `gemini3Pro.post.v1.chat.completions`
  or `gemini38FlashOpenai.post.v1.chat.completions` for chat, and
  `gemini.post.v1.models.gemini36Flash.streamGenerateContent` (or 3.7 / 3.8)
  for the native stream. This removal ships in 0.27.0 (ac-62hbwl).

- **Breaking:** the `bytedance/seedance-1.5-pro` `createTask` model, because KIE
  retired Seedance 1.5 Pro. On 2026-11-05 a valid-key `createTask` with an empty
  prompt answered `code: 410` "has been retired upstream and is no longer
  available on Kie.ai", where live `bytedance/seedance-2` answered 422 for the
  missing prompt and a made-up model 422 "not supported". Nothing was billed. The
  feed rows and docs page are gone, and the product page redirects to Seedance
  2.5. ByteDance deprecated the model on 2026-09-15 and shuts it down on
  2026-11-11. Its `CREATE_TASK_GUARDS` and `modelInputSchemas` entries and every
  `Seedance15Pro*` schema and type go with it. The id still parses through the
  open Seedance alias, as any future Seedance id would, so a call reaches KIE and
  gets that 410. Migration: KIE suggests `bytedance/seedance-2-5`, and ByteDance
  names Seedance 2.0 Mini (`bytedance/seedance-2-mini`). Neither takes
  `input_urls`: 2.5 takes first and last frames or references, and Mini takes
  references. This removal ships in 0.27.0 (ac-x0qlnu).

- **Breaking:** `gemini25Flash.post.v1.chat.completions`,
  `gemini3Flash.post.v1.chat.completions` and
  `gemini.post.v1.models.gemini3FlashV1betamodels.streamGenerateContent`,
  because KIE retired Gemini 2.5 Flash and Gemini 3 Flash. On 2026-10-15 KIE
  answered a valid-key call to each with HTTP 200 and
  `{"code":422,"msg":"The channel is not supported","data":null}`, which the
  methods threw as `KieError` with status 422, and KIE no longer documents or
  prices the models. The `createGemini25FlashProvider` and
  `createGemini3FlashProvider` factories and every `KieGemini25Flash*` and
  `KieGemini3Flash*` schema and type, the `KieGemini3FlashV1betamodels*` ones
  included, go with them. Migration: move to a documented Gemini Flash
  endpoint, such as `gemini38FlashOpenai.post.v1.chat.completions` or
  `gemini.post.v1.models.gemini38Flash.streamGenerateContent`.

### Fixed

- Published `.d.ts` files give every relative import an explicit `.js`
  extension, including the 36 inline `import("./x")` types, so a
  `moduleResolution: node16` or `nodenext` consumer with `skipLibCheck: false`
  no longer gets TS2835 from them (ac-0su9ax).

- Qwen2 image-edit seed validation and discovery metadata now follow KIE's
  published integer contract. This narrows caller-visible validation: replace
  fractional seed values with an integer or omit `seed` before upgrading.
- Seedance 2 Mini reference media and Qwen2 image-edit media fields accept
  pre-upload asset identifiers as plain strings.
- Generated documentation clarifies that pre-upload identifiers must be
  replaced with publicly reachable URLs before creating a KIE task.

## [0.1.0] - 2026-05-16

### Added

- Initial release.
