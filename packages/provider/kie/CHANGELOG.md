# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

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

- **Breaking:** `QwenTextToImageRequestSchema` and
  `modelInputSchemas["qwen/text-to-image"]` no longer default
  `input.image_size` to `square_hd`. KIE's docs and live model schema dropped
  that default ("Set this field explicitly", read 2026-10-16). The field stays
  optional with the same six presets, so parsing no longer adds it; set it
  explicitly.
- **Breaking:** The `gemini31Pro`, `gemini3Pro`, `gemini25Pro`,
  `gemini35FlashOpenai`, `gemini36FlashOpenai`, `gemini37FlashOpenai`, and
  `gemini38FlashOpenai` chat request schemas now follow KIE's current docs:
  `stream` defaults to `false`, and the undocumented `model` field is no longer
  declared. For `gemini31Pro`, `gemini3Pro`, and `gemini25Pro`,
  `include_thoughts` defaults to `false` and `reasoning_effort` still defaults
  to `"high"`. For `gemini35FlashOpenai`, `gemini36FlashOpenai`,
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
