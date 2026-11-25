# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Accept `OpenAiResponseReasoningItem` (`type: "reasoning"`, carrying `encrypted_content`) in `v1.responses`, `v1.responses.compact`, and `v1.responses.inputTokens` `input` arrays, and export `OpenAiResponseReasoningItemSchema`, `OpenAiResponseReasoningSummaryTextSchema`, and `OpenAiResponseReasoningTextSchema` from `@apicity/openai/zod`, widening `OpenAiResponseInputItemSchema` while keeping a single unified `type: "reasoning"` shape on `OpenAiResponseInputItemsResponse.data` and `OpenAiResponseCompactResponse.output`. Includes a recorded stateless (`store: false`) two-turn `gpt-5.6-luna` round trip sending Turn 1's reasoning item back with `encrypted_content` (ac-05m30h).
- Type the `v1.responses` response fields that gpt-5.6-sol and gpt-6-astra return and the closed `OpenAiResponseResponse` hid: `access_programs` (`OpenAiResponseAccessPrograms`), `image` (`OpenAiResponseImageOptions`), `input_transformations` (`OpenAiResponseInputTransformation[]`), `moderation` (`OpenAiResponseModeration`), `tool_usage` (`OpenAiResponseToolUsage`), `prompt_cache_retention`, the echoed `reasoning.context` and `reasoning.mode` (`OpenAiResponseResponseReasoning`), and the message `phase`; `OpenAiTranscribeResponse` gains `languages` (`OpenAiTranscriptionLanguage[]`). Shapes follow the API reference (read 2026-11-25); every key appeared on the 210 `v1.responses` calls (204 gpt-5.6-sol, 6 gpt-6-astra) or the 12 gpt-transcribe calls of the videobook capture corpus (HAR learning pass 2). All are optional and additive (ac-14k4jm).
- Type the transcription `usage` (`v1.audio.transcriptions`): `OpenAiTranscribeResponse.usage` is `OpenAiTranscriptionUsage`, either `OpenAiTranscriptionTokenUsage` (`type: "tokens"`, as the committed `gpt-4o-mini-transcribe` recordings return) or `OpenAiTranscriptionDurationUsage` (`type: "duration"`, `seconds`), which all 12 `gpt-transcribe` calls in the videobook capture corpus returned (capture `2026-10-29T16-18-19.604Z-86300472-7129-4adf-ba7e-c30f74e3a26c`, HAR learning pass 2, ac-11lqw3).
- `v1.images.generations` and `v1.images.edits` support GPT Image 2.6 (`gpt-image-2.6-sunburst` and `gpt-image-2.6-flare`): exported `OpenAiImageComplexitySchema` / `OpenAiImageComplexity` (`"low" | "medium" | "high"`, default `"high"` upstream), optional `frame_count`, `frame_duration_ms`, `safety_identifier`, `"gif"` output format (`"svg"` on `generations` too), and `markup` / `moderation` forwarding on `v1.images.edits`, plus extended image usage/response metadata fields and a recorded `gpt-image-2.6-flare` generation (824 output tokens, ~$0.0248 USD) alongside a free unknown-model 404 read (ac-xbnboo).

### Changed

- **Breaking:** `OpenAiResponseCompactResponse.output` can contain an `OpenAiResponseCompactionItem`. Callers that exhaustively handle compact output must add a `"compaction"` case. Narrow on `item.type` to read its opaque `encrypted_content` (ac-3o32zx).
- **Breaking:** `OpenAiResponseOutputItem` gains `OpenAiResponseReasoningItem` (`type: "reasoning"`: `id`, `summary`, and optional `content`, `encrypted_content` and `status`), so `v1.responses` output, the input-items list `data` and the compact `output` type the reasoning items the API already returns. There is no runtime change. The committed o4-mini recording holds one, and 205 of the 210 `v1.responses` calls in the videobook capture corpus held 230 (204 of 204 on gpt-5.6-sol), each with `encrypted_content` and none with `status`. Code that treated the union as four kinds stops compiling: a `switch (item.type)` that ends in a `never` check, a final `else` that assumes `file_search_call`, a table keyed by `OpenAiResponseOutputItem["type"]`, an assignment to your own union of the four item types, and `item.status` read before narrowing (now possibly `undefined`). Each of those already mishandled a reasoning item at runtime. Migration: add a `"reasoning"` case or a `default` branch, and narrow on `item.type` before reading `status`. The API documents more item kinds than apicity models, so keep the `default` branch (ac-puf914).

### Fixed

- `v1.images.edits` accepts `quality` `xhigh` and `max`, which
  gpt-image-2.5-sunburst and gpt-image-2.5-flare add, and any `WIDTHxHEIGHT`
  size, which gpt-image-2 and the 2.5 models take (for example `2048x2048`,
  `2048x1152` or `3840x2160`). `OpenAiImageEditRequestSchema` closed both
  fields, so `apicity describe` and `.schema.safeParse` refused documented
  edit requests. The known sizes stay listed beside the `WIDTHxHEIGHT`
  grammar; OpenAI applies the per-model size rules (ac-r8riqc).

## [0.1.0] - 2026-05-16

### Added

- Initial release.
