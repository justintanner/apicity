# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `ltx/2-5-pro-text-to-video` (LTX 2.5 Pro text-to-video) on createTask, from the docs as re-read on 2026-11-20: `prompt`, `fps`, `aspect_ratio` and `seed` as on `ltx/2-5-fast-text-to-video`, with `resolution` `720p` or `1080p` (default) and `duration` 6, 8 or 10 (default 10) at any frame rate. The Pro tier schemas `Ltx25ProResolutionSchema` and `Ltx25ProDurationSchema` are exported, with `Ltx25ProTextToVideoInputSchema` and `Ltx25ProTextToVideoRequestSchema` (ac-dwmekr).

- `ltx/2-5-fast-audio-to-video` (LTX 2.5 Fast audio-to-video) on createTask, from the docs as re-read on 2026-11-20: a required `audio_url` (kept as the soundtrack), an optional first-frame `image_url`, a required `prompt` (1-5000 characters), `resolution` and `fps` as on the other Fast models, an optional `seed`, and an optional `duration`: a number from 2 to 20, cut from the start of the audio, with at most 10 at 1440p or at 48 or 50 fps (refused otherwise). `Ltx25FastAudioToVideoInputSchema` and `Ltx25FastAudioToVideoRequestSchema` are exported (ac-ium3f4).

- `ltx/2-5-fast-image-to-video` (LTX 2.5 Fast image-to-video) on createTask, from the docs as re-read on 2026-11-20: a required `image_url` (the first frame; it sets the aspect ratio, so there is no `aspect_ratio` field), a required `prompt` (1-5000 characters), and `resolution`, `fps`, `duration` and `seed` as on `ltx/2-5-fast-text-to-video`, including the 6, 8 or 10 second limit at 1440p or at 48 or 50 fps. `Ltx25FastImageToVideoInputSchema` and `Ltx25FastImageToVideoRequestSchema` are exported (ac-ey3b9p).

- `ltx/2-5-fast-text-to-video` (LTX 2.5 Fast text-to-video) on createTask, from the docs as re-read on 2026-11-20: `prompt` (1-5000 characters, required), `resolution` (`720p`, `1080p` by default, `1440p`), `fps` (24 by default, 25, 48, 50), `duration` (6-20 seconds in steps of 2, 10 by default), `aspect_ratio` (`16:9` by default, `9:16`, `1:1`, `3:2`, `2:3`) and an optional `seed` (0-2147483647). A `duration` past 10 seconds at 1440p or at 48 or 50 fps is refused, as the docs allow only 6, 8 or 10 there. The LTX 2.5 family schemas `Ltx25FpsSchema`, `Ltx25AspectRatioSchema` and `Ltx25SeedSchema` are exported, with `Ltx25FastResolutionSchema`, `Ltx25FastDurationSchema`, `Ltx25FastTextToVideoInputSchema` and `Ltx25FastTextToVideoRequestSchema` (ac-ujmlmh).

- `grok-imagine/upscale` takes `resolution`, the upscale target: `720p` (default) or `1080p`, as the docs list it on 2026-11-19. The source is the resolution of the referenced `grok-imagine/text-to-video` or `image-to-video` task, which the request does not carry. `GrokVideoUpscaleResolutionSchema` is exported, and the descriptor lists the field (ac-xnzcl4).

- Added `gpt-image-2-6/economy-image-to-image` (GPT Image 2.6 image-to-image through KIE's economy channel, 1K only) with typed inputs: a 1-20000 character `prompt`, up to 16 optional `input_urls`, eight `aspect_ratio` values, `background`, and `output_format` `png` only. `aspect_ratio` is required, as on economy text-to-image, because KIE fails a task sent without it with a refunded failCode 500. A recorded edit of the cat fixture is included. `GptImage26EconomyImageToImageOutputFormatSchema` and `GptImage26EconomyImageToImageRequestSchema` are exported (ac-cqko9r).

- Added `gpt-image-2-6/economy-text-to-image` (GPT Image 2.6 through KIE's economy channel, 1K only) with typed inputs: a 1-20000 character `prompt`, eight `aspect_ratio` values, `background`, `output_format` `png` or `gif`, and the GIF-only `frame_count` and `frame_duration_ms` (`auto`, or an explicit value with gif). `aspect_ratio` is required, although KIE documents an `auto` default: a prompt-only task fails upstream with failCode 500 and a refund (three tasks on 2026-11-12 and one on 2026-11-19), while `prompt` plus `aspect_ratio` alone succeeded. The other fields keep their documented defaults. Two recordings are included, one with `aspect_ratio` alone and one with every default set. `GptImage26EconomyAspectRatioSchema`, `GptImage26EconomyOutputFormatSchema`, `GptImage26EconomyFrameCountSchema`, `GptImage26EconomyFrameDurationSchema` and `GptImage26EconomyTextToImageRequestSchema` are exported (ac-cqko9r).

- `seedream/5-lite-text-to-image` and `seedream/5-lite-image-to-image` take `quality` `ultra` (4K) and an optional `output_format` (`png`, `jpeg`), as the docs list them on 2026-11-19; `quality` stays required. The descriptors' `high` now reads 3K and their aspect-ratio default 16:9, matching the docs and the schemas (ac-bxpbil).

- `seedream/5-pro-text-to-image` and `seedream/5-pro-image-to-image` accept the aspect ratio `21:9`, as both docs pages list it on 2026-11-19; the default stays `1:1` (ac-51w0vl).

- Added `kling-4-0/long-image` (Kling 4.0 Long Image) with typed inputs: a required `prompt` and `skill`. `ecommerce` takes 1-3 required `image_urls` and a `length` (`short`, `medium`, `long`). `webpage` takes an optional `style_image` and `subject_image`. A field of the other skill is refused, as KIE answers it with 422. `resolution` is `1k` or `2k`. The input is strict, a recorded page is included, and the id is enum-only. `Kling40LongImageSkillSchema`, `Kling40LongImageLengthSchema`, `Kling40LongImageResolutionSchema`, `Kling40LongImageInputSchema` and `Kling40LongImageRequestSchema` are exported (ac-zakqnf).

- Added `google/gemini-omni-flash-1-2-extend` (Gemini Omni Flash 1.2 Extend) with typed inputs: a required `task_id` (a completed 1.2 or extend task, 360p or 720p, at most 15 s), a 1-20000 character `prompt`, a required integer `duration` of 3-10 added seconds, and up to 3 `image_urls`, plus a recorded extend. The id is enum-only like the other Omni ids. `GoogleGeminiOmniFlash12ExtendRequestSchema` is exported (ac-20k2yx).

- Added `kling-4-0/image` (Kling 4.0 Image, text-to-image and image-to-image) with typed inputs: a 1-20000 character `prompt`, up to 10 `image_urls` and `elements` together (each element with 2-4 `image_urls`, an optional `tag` and `description`, and a name that is not `image_N` or `object_N`), `resolution` `2k`/`4k`/`8k` (default `2k`), `aspect_ratio` (default `auto`), and `mode`: `default` takes `count` 1-9, while `series` requires `count` 2-10. The input is strict, and a recorded image is included. The id's dashed version keeps it enum-only, outside the Kling alias. `Kling40ImageModeSchema`, `Kling40ImageResolutionSchema`, `Kling40ImageAspectRatioSchema`, `Kling40ImageElementSchema`, `Kling40ImageInputSchema` and `Kling40ImageRequestSchema` are exported (ac-i4vebc).

- `bytedance/seedance-2-mini` takes `first_frame_url` and `last_frame_url` (an image URL or `asset://{assetId}`), per KIE's docs of 2026-11-19. A frame cannot be combined with a non-empty `reference_image_urls`, `reference_video_urls` or `reference_audio_urls` (ac-7cp4o7).

- `gpt-image-2-text-to-image` and `gpt-image-2-image-to-image` take an optional `background` (`transparent`, `opaque`, `auto`), which the docs of 2026-11-19 support at 1K only; a 2K or 4K request with `background` is refused. `gpt-image-2-image-to-image` gains the aspect ratios `2:1`, `1:2`, `3:1`, `1:3` and `9:21`, the sixteen text-to-image has. `GptImage2BackgroundSchema` and the `GptImage2Background` type are exported (ac-ftdouc).

- `grok-imagine-image-2-0/segment-map` takes a direct http(s) `image_url` in place of `task_id`, per KIE's docs of 2026-11-19 (`input` is oneOf the two): exactly one of them is required, and a recorded run on an uploaded photo billed 0 credits. `GrokImagineImage2SegmentMapInputSchema` is exported (ac-mtdgxe).

- `bytedance/seedance-2-5` accepts `resolution: "4k"` (3840x2160 at 16:9, H.265 (HEVC) 10-bit, per KIE's docs of 2026-11-19) and `omni_reference_task_type` (`auto`, `reference`, `edit`, `extend`) with the rules Seedance 2.5 Flash has: reference materials only, `edit` and `extend` need `reference_video_urls` and the `adaptive` aspect ratio, and `edit` needs `duration: -1`. Both models share the exported `Seedance25OmniReferenceTaskTypeSchema` (ac-vggwxn).

- Added `bytedance/seedance-2-5-flash` (Seedance 2.5 Flash) with typed inputs: the Seedance 2.5 fields at the Flash limits (a 20480-character prompt, 10 reference images, 5 videos, 5 audio clips, 480p or 720p, no draft, no `duration` default), `omni_reference_task_type` with its edit and extend rules, a prompt required for text-to-video, and a recorded clip. `Seedance25FlashInputSchema` and `Seedance25FlashRequestSchema` are exported.

- Added `video/upscale` (KIE Video Upscale, KIE's own video upscaler) with typed inputs: one required http(s) `video_url` and a `resolution` output box (`"1080P"`, `"2K"`, `"4K"`, uppercase, default `"2K"`), and a recorded upscale. `KieVideoUpscaleResolutionSchema` and `KieVideoUpscaleRequestSchema` are exported.

- Added `kie/image-upscale` (KIE Image Upscale, KIE's own upscaler) with typed inputs: one required http(s) `image_url` and an `upscale_factor` string enum (`"1"`, `"2"`, `"4"`, `"8"`, default `"2"`), and a recorded upscale. `KieImageUpscaleFactorSchema` and `KieImageUpscaleRequestSchema` are exported.

- Added `kling-4.0/flash-reference-to-video` (Kling 4.0 Flash reference-to-video) with typed inputs: Kling 4.0 reference materials under the Flash limits, an element `type` that must match its media, no standalone voices (strict input), and a recorded clip. `Kling40FlashElementSchema` and `Kling40FlashReferenceToVideoRequestSchema` are exported.

- Added `kling-4.0/flash-keyframe-to-video` (Kling 4.0 Flash keyframe-to-video) with typed inputs: a 1-8,000 character prompt, `duration` 3-20 (default 5), `resolution` 720p only, an optional `first_frame_url`, and `aspect_ratio` without auto; a strict input that rejects middle and last frames, and a recorded clip. `Kling40FlashDurationSchema`, `Kling40FlashResolutionSchema` and `Kling40FlashKeyframeToVideoRequestSchema` are exported.

- Added `minimax-h3/image-edit` (MiniMax H3 Image edit) with typed inputs: 1-16 required `image_urls` beside text-to-image's prompt, sizing, `seed`, `expand_prompt` and `output_format` fields and rules, and a recorded edit. It reuses the shared MiniMax H3 Image schemas, and `MiniMaxH3ImageEditRequestSchema` is exported.

- Added `minimax-h3/text-to-image` (MiniMax H3 Image text-to-image) with typed inputs: a 1-5,000 character prompt, the documented `resolution` tier and `aspect_ratio` or a custom `width` and `height` (never both, with the documented pixel and ratio bounds), `seed`, `expand_prompt` and `output_format`, and a recorded generation. The shared `MiniMaxH3ImagePromptSchema`, `MiniMaxH3ImageAspectRatioSchema`, `MiniMaxH3ImageResolutionSchema`, `MiniMaxH3ImageOutputFormatSchema`, `MiniMaxH3ImageSeedSchema`, `MiniMaxH3ImageDimensionSchema`, `MiniMaxH3TextToImageRequestSchema` and `MiniMaxH3ImageTaskResultJsonSchema` are exported.

- Added `seedream/5-5-layer-decomposition` (Seedream 5.5 layer decomposition) with typed inputs: one `image_url`, an optional `prompt` of up to 2,000 characters, the documented `size` (auto by default), `output_format`, `max_images` (2-100, default 30), `text_recognition` and `nsfw_checker` defaults, and a recorded decomposition. `Seedream55LayerDecompositionRequestSchema` is exported.

- Added `seedream/5-5-text-to-image` (Seedream 5.5 text-to-image) with typed inputs: a required `aspect_ratio` (eight ratios, no auto), the documented `size`, `output_format`, `background` and `nsfw_checker` defaults, a transparent background only with png, and a recorded generation. It reuses the shared Seedream 5.5 schemas, and `Seedream55TextToImageRequestSchema` is exported.

- Added `seedream/5-5-image-to-image` (Seedream 5.5 image-to-image) with typed inputs: 1-10 `image_urls`, the documented `aspect_ratio`, `size`, `output_format`, `background` and `nsfw_checker` defaults, a transparent background only with png, and a recorded edit. The shared `Seedream55SizeSchema`, `Seedream55OutputFormatSchema` and `Seedream55BackgroundSchema` are exported, and the Seedream model alias accepts kie's dashed minor version (`seedream/5-5-*`).

- Added `google/gemini-omni-flash-1-2` (Gemini Omni Flash 1.2) with typed inputs for its four modes: text with up to 6 reference images and 2 characters, first frame, first and last frame, and a video edit; an integer `duration` required except in a video edit, the documented `aspect_ratio` and `resolution` defaults, `seeds`, the frame exclusions and the 7-slot quota; and a recorded text-to-video. `GoogleGeminiOmniFlash12AspectRatioSchema` is exported for its `aspect_ratio` values.

- Added `gpt-image-2-6/flare-text-to-image` (GPT Image 2.6 Flare) with the Sunburst text-to-image model's typed inputs, defaults and format rules, since KIE documents the two identically, with a recorded generation.

- Added `gpt-image-2-6/flare-image-to-image` (GPT Image 2.6 Flare image-to-image) with the Sunburst image-to-image model's typed inputs, defaults and rules, since KIE documents the two identically, with a recorded edit.

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

- Widened input limits to the docs as re-read on 2026-11-19: `google/nano-banana` and `google/nano-banana-edit` `prompt` up to 20000 characters (was 5000); `kling-2.6/text-to-video` and `kling-2.6/image-to-video` `prompt` up to 2500 (was 1000); `kling/v2-5-turbo-image-to-video-pro` `negative_prompt` up to 2496 (was 500); `qwen2/text-to-image` `prompt` up to 5000 (was 800); `seedream/5-pro-text-to-image` and `seedream/5-pro-image-to-image` `prompt` up to 5000 (was 3000; minimum stays 3); `grok-imagine/image-to-image` `image_urls` takes 1-5 URLs (was exactly 1), so `GrokImageToImageRequestSchema`'s `image_urls` is now a `string[]` rather than a one-element tuple. The descriptors follow (ac-r04q6v).

- `bytedance/seedance-2-mini` `duration` takes -1 (automatic length; KIE bills the generated length) next to 4-15, as the docs define it on 2026-11-20. The default stays 5, and the descriptor lists `-1, 4-15` as its enum (ac-6n1pli).

- **Breaking:** `GrokImagineImage2ImageEditRequestSchema` (`grok-imagine-image-2-0/image-edit`) takes the contract KIE documents since 2026-11-19: a `prompt` (1-8,000 characters), a required `aspect_ratio` (`1:1`, `2:3`, `3:2`, `16:9`, `9:16`, `auto`) and 1-5 required `image_urls`. It no longer takes `task_id` or `mask_indexs`. KIE moved that form to `grok-imagine-image-2-0/segment-edit` and now answers it with 422 "image_urls is required". Migration: send the old body with `model: "grok-imagine-image-2-0/segment-edit"` (`mask_indexs` unchanged: the segment-map indexes, counted from 0), or pass image URLs to image-edit. `GrokImagineImage2ImageEditAspectRatioSchema` is exported (ac-sb6m5h).

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

- **Breaking:** `post.api.v1.mj.generate` and `get.api.v1.mj.recordInfo`,
  because KIE withdrew Midjourney. On 2026-11-12 both docs pages
  (`mj-api/generate-mj-image` and `mj-api/get-mj-task-details`) and their
  `/old-model/` copies served the same soft 404 as a made-up page, Midjourney
  was absent from the 251 models of `GET /api/v1/models`, and the public price
  feed had no Midjourney row (none since at least 2026-09-11). KIE offers no
  replacement. Every `Mj*` schema and type goes with them:
  `MjGenerateRequestSchema`, `MjTaskTypeSchema`, `MjSpeedSchema`,
  `MjVersionSchema`, `MjAspectRatioSchema`, `MjMotionSchema`,
  `MjRecordInfoRequestSchema`, `MjRecordInfoResponseSchema`,
  `MjRecordInfoDataSchema`, `MjRecordInfoResultInfoSchema`,
  `MjRecordInfoSuccessFlagSchema`, and the `MjGenerateRequest`,
  `MjGenerateRequestInput`, `MjGenerateParsedRequest`, `MjTaskType`,
  `MjSpeed`, `MjVersion`, `MjAspectRatio` and `MjMotion` types. No call was
  billed to confirm it. This removal ships in 0.28.0 (ac-3b4swu).

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

- `GrokImagineImage2SegmentEditRequestSchema` (`grok-imagine-image-2-0/segment-edit`) accepts mask index 0: `mask_indexs` items take a minimum of 0, as the docs read on 2026-11-19 say ("0-based"), so the segment-map `index` values pass unchanged. A recorded edit sent `[0]` (the "white cat") and KIE applied it. The descriptor and README now count the indexes from 0 (ac-4asuok).

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
