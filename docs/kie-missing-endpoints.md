# kie.ai Endpoint Gap Report for `@apicity/kie`

Tracking bead: `jt-hp9k`

This report diffs the endpoint surface kie.ai documents at `docs.kie.ai`
against the surface `@apicity/kie` implements. It is a handoff document only;
each gap should still land through its own implementation bead.

Snapshot taken `2026-07-29`. Package state audited at commit `aa9f6805`
(`fix(kie): label all refined exempt models refinementNotYetEnforced`).

## Sources checked

Documentation side:

- Index: https://docs.kie.ai/llms.txt
- Sitemap: https://docs.kie.ai/sitemap.xml — 472 URLs, of which 243 are English
  (the remaining 229 are `/cn/` translations of the same pages and were
  excluded).
- Every one of those 243 English pages was fetched in its `.md` form
  (`https://docs.kie.ai/<path>.md`), which returns the page's full OpenAPI 3.0.1
  fragment rather than rendered HTML. Endpoint method and path were parsed from
  the `paths:` block of each fragment, so every documented endpoint below comes
  from upstream's own spec, not from prose.

Implementation side:

- `packages/provider/kie/README.md` — generated API reference, "44 endpoints
  across 24 groups".
- `packages/provider/kie/src/` — `kie.ts`, `veo.ts`, `suno.ts`, `chat.ts`,
  `claude.ts`, `gemini.ts`, `gemini-31-pro.ts`, `responses.ts`,
  `model-schemas.ts`, `zod.ts`, `paid-endpoints.ts`, `paygate.ts`.

Method note: the README's generated list is not complete on its own.
`kie.chat.completions` (`chat.ts:67-91`) is absent from it because the
generator keys off dot-path-shaped exports and that method is not one. The
implemented set below is the union of the README list and the source, which is
why it is 46 paths rather than 44.

## Summary

| Measure                                         | Count |
| ----------------------------------------------- | ----- |
| Distinct documented endpoints (method + path)   | 70    |
| Distinct implemented endpoints (method + path)  | 46    |
| Documented **and** implemented                  | 43    |
| **MISSING** — documented, not implemented       | 27    |
| Implemented but not currently documented        | 3     |
| **PARTIAL** — implemented with a documented gap | 4     |

Model catalogue, counted separately because 123 of the 243 doc pages describe
the _same_ endpoint (`POST /api/v1/jobs/createTask`) with a different `model`
value:

| Measure                                   | Count |
| ----------------------------------------- | ----- |
| Distinct documented `createTask` models   | 120   |
| Models with a `@apicity/kie` schema entry | 52    |
| Documented **and** implemented            | 50    |
| **Documented, not implemented**           | 70    |
| Implemented, not currently documented     | 2     |

## Common contract

Base URLs:

- `https://api.kie.ai` — everything except file upload. Set via
  `KieOptions.baseURL`, default at `kie.ts:259`.
- `https://kieai.redpandaai.co` — the three file-upload routes only. Set via
  `KieOptions.uploadBaseURL`, default at `kie.ts:260`.

Authentication is `Authorization: Bearer {API key}` on every endpoint, applied
centrally in `request.ts` / `transport.ts`.

Response envelope: nearly every endpoint returns `{ code, msg, data }`, with
`code: 200` for success. Task-creating endpoints return `data.taskId`; the
caller then polls the matching `record-info` route or receives a callback at
`callBackUrl`. The asymmetry that drives most of the MISSING list below is that
`@apicity/kie` implements many _create_ routes without their paired _query_
route.

Content types are JSON everywhere except `POST /api/file-stream-upload`, which
is `multipart/form-data` (`kie.ts:329-340`).

## Endpoint inventory

Classification key:

- **IMPLEMENTED** — documented, and a method exists that calls the same method
  and path.
- **PARTIAL** — implemented, but the request contract, model list, or exported
  type is narrower than the docs.
- **MISSING** — documented, no method calls it. Every MISSING row was confirmed
  by `grep` over all of `packages/provider/kie/src/*.ts` returning zero hits for
  the path fragment; the fragment checked is named in the row.

### Jobs / market (unified task API)

| Method and path                | Class       | Docs URL                                          | Params                                                                | Implementation / evidence                                                 |
| ------------------------------ | ----------- | ------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `POST /api/v1/jobs/createTask` | PARTIAL     | https://docs.kie.ai/market/quickstart             | `model` (required), `input` (required, model-specific), `callBackUrl` | `kie.ts:285-296`. 70 of 120 documented models have no schema — see below. |
| `GET /api/v1/jobs/recordInfo`  | IMPLEMENTED | https://docs.kie.ai/market/common/get-task-detail | `taskId` (query, required)                                            | `kie.ts:298-304`                                                          |

### Veo 3.1

| Method and path                   | Class       | Docs URL                                             | Params                                                                                                                                                        | Implementation / evidence                                                                                             |
| --------------------------------- | ----------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `POST /api/v1/veo/generate`       | PARTIAL     | https://docs.kie.ai/veo3-api/generate-veo-3-video    | `prompt`, `imageUrls`, `model`, `generationType`, `aspect_ratio`, `callBackUrl`, `enableFallback`, `enableTranslation`, `watermark`, `resolution`, `duration` | `veo.ts:171-181`, schema `zod.ts:2121-2136`. Four documented fields absent; field-name mismatch — see PARTIAL detail. |
| `POST /api/v1/veo/extend`         | PARTIAL     | https://docs.kie.ai/veo3-api/extend-video            | `taskId`, `prompt`, `seeds`, `model`, `watermark`, `callBackUrl`                                                                                              | `veo.ts:183-193`, schema `zod.ts:2138-2149`. `callBackUrl` absent.                                                    |
| `GET /api/v1/veo/record-info`     | IMPLEMENTED | https://docs.kie.ai/veo3-api/get-veo-3-video-details | `taskId` (query, required)                                                                                                                                    | `veo.ts:195-202`                                                                                                      |
| `GET /api/v1/veo/get-1080p-video` | IMPLEMENTED | https://docs.kie.ai/veo3-api/get-veo-3-1080-p-video  | `taskId` (query, required), `index` (query, optional)                                                                                                         | `veo.ts:204-216`                                                                                                      |
| `POST /api/v1/veo/get-4k-video`   | **MISSING** | https://docs.kie.ai/veo3-api/get-veo-3-4k-video      | JSON body: `taskId` (required), `index`, `callBackUrl`                                                                                                        | `grep -rF "get-4k-video" src/*.ts` → 0 hits                                                                           |

### Runway

| Method and path                    | Class       | Docs URL                                               | Params                                                                                                                      | Implementation / evidence                         |
| ---------------------------------- | ----------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `POST /api/v1/runway/generate`     | IMPLEMENTED | https://docs.kie.ai/runway-api/generate-ai-video       | `prompt`, `imageUrl`, `duration`, `quality`, `aspectRatio`, `waterMark`, `callBackUrl`                                      | `kie.ts:482-492`. Field set matches docs exactly. |
| `POST /api/v1/runway/extend`       | IMPLEMENTED | https://docs.kie.ai/runway-api/extend-ai-video         | `taskId`, `prompt`, `quality`, `waterMark`, `callBackUrl`                                                                   | `kie.ts:494-502`. Field set matches docs exactly. |
| `GET /api/v1/runway/record-detail` | IMPLEMENTED | https://docs.kie.ai/runway-api/get-ai-video-details    | `taskId` (query, required)                                                                                                  | `kie.ts:504-512`                                  |
| `POST /api/v1/aleph/generate`      | **MISSING** | https://docs.kie.ai/runway-api/generate-aleph-video    | `prompt` (required), `videoUrl` (required), `callBackUrl`, `waterMark`, `uploadCn`, `aspectRatio`, `seed`, `referenceImage` | `grep -rF "aleph" src/*.ts` → 0 hits              |
| `GET /api/v1/aleph/record-info`    | **MISSING** | https://docs.kie.ai/runway-api/get-aleph-video-details | `taskId` (query, required)                                                                                                  | `grep -rF "aleph" src/*.ts` → 0 hits              |

### 4o Image

| Method and path                         | Class       | Docs URL                                                    | Params                                                              | Implementation / evidence                                                                                        |
| --------------------------------------- | ----------- | ----------------------------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `POST /api/v1/gpt4o-image/generate`     | IMPLEMENTED | https://docs.kie.ai/4o-image-api/generate-4-o-image         | `prompt`, `filesUrl`, `size`, `callBackUrl`, `fileUrl` (deprecated) | `kie.ts:446-456`, schema `zod.ts:2373-2390`. Implementation is a superset; correctly omits deprecated `fileUrl`. |
| `GET /api/v1/gpt4o-image/record-info`   | IMPLEMENTED | https://docs.kie.ai/4o-image-api/get-4-o-image-details      | `taskId` (query, required)                                          | `kie.ts:306-314`                                                                                                 |
| `POST /api/v1/gpt4o-image/download-url` | **MISSING** | https://docs.kie.ai/4o-image-api/get-4-o-image-download-url | JSON body: `taskId` (required), `url` (required)                    | `grep -rF "gpt4o-image/download-url" src/*.ts` → 0 hits                                                          |

### Flux Kontext

| Method and path                        | Class       | Docs URL                                                    | Params                                                                                                                                                             | Implementation / evidence                                                                                                                                 |
| -------------------------------------- | ----------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/v1/flux/kontext/generate`   | IMPLEMENTED | https://docs.kie.ai/flux-kontext-api/generate-or-edit-image | `prompt`, `enableTranslation`, `uploadCn`, `inputImage`, `aspectRatio`, `outputFormat`, `promptUpsampling`, `model`, `callBackUrl`, `safetyTolerance`, `watermark` | `kie.ts:434-444`, schema `zod.ts:2276+`. Field set matches docs exactly; both documented models (`flux-kontext-pro`, `flux-kontext-max`) are in the enum. |
| `GET /api/v1/flux/kontext/record-info` | IMPLEMENTED | https://docs.kie.ai/flux-kontext-api/get-image-details      | `taskId` (query, required)                                                                                                                                         | `kie.ts:514-522`                                                                                                                                          |

### Suno — music generation

| Method and path                                | Class       | Docs URL                                             | Params                                                                        | Implementation / evidence                                |
| ---------------------------------------------- | ----------- | ---------------------------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------- |
| `POST /api/v1/generate`                        | IMPLEMENTED | https://docs.kie.ai/suno-api/generate-music          | `prompt`, `model`, `instrumental`, …                                          | `suno.ts:713-723`                                        |
| `POST /api/v1/generate/extend`                 | IMPLEMENTED | https://docs.kie.ai/suno-api/extend-music            | —                                                                             | `suno.ts:725-735`                                        |
| `GET /api/v1/generate/record-info`             | IMPLEMENTED | https://docs.kie.ai/suno-api/get-music-details       | `taskId` (query, required)                                                    | `suno.ts:737-744`                                        |
| `POST /api/v1/generate/upload-cover`           | IMPLEMENTED | https://docs.kie.ai/suno-api/upload-and-cover-audio  | —                                                                             | `suno.ts:813-823`                                        |
| `POST /api/v1/generate/upload-extend`          | IMPLEMENTED | https://docs.kie.ai/suno-api/upload-and-extend-audio | —                                                                             | `suno.ts:825-835`                                        |
| `POST /api/v1/generate/add-instrumental`       | IMPLEMENTED | https://docs.kie.ai/suno-api/add-instrumental        | —                                                                             | `suno.ts:885-895`                                        |
| `POST /api/v1/generate/add-vocals`             | IMPLEMENTED | https://docs.kie.ai/suno-api/add-vocals              | —                                                                             | `suno.ts:897-907`                                        |
| `POST /api/v1/generate/replace-section`        | IMPLEMENTED | https://docs.kie.ai/suno-api/replace-section         | —                                                                             | `suno.ts:861-871`                                        |
| `POST /api/v1/generate/mashup`                 | IMPLEMENTED | https://docs.kie.ai/suno-api/generate-mashup         | —                                                                             | `suno.ts:849-859`                                        |
| `POST /api/v1/generate/sounds`                 | IMPLEMENTED | https://docs.kie.ai/suno-api/generate-sounds         | —                                                                             | `suno.ts:873-883`                                        |
| `POST /api/v1/style/generate`                  | IMPLEMENTED | https://docs.kie.ai/suno-api/boost-music-style       | —                                                                             | `suno.ts:801-811`                                        |
| `POST /api/v1/generate/get-timestamped-lyrics` | **MISSING** | https://docs.kie.ai/suno-api/get-timestamped-lyrics  | JSON body: `taskId` (required), `audioId` (required)                          | `grep -rF "get-timestamped-lyrics" src/*.ts` → 0 hits    |
| `POST /api/v1/generate/generate-persona`       | **MISSING** | https://docs.kie.ai/suno-api/generate-persona        | JSON body: `taskId`, `audioId`, `name`, `description` (all required), `style` | `grep -rF "generate/generate-persona" src/*.ts` → 0 hits |
| `POST /api/v1/suno/cover/generate`             | **MISSING** | https://docs.kie.ai/suno-api/cover-suno              | JSON body: `taskId` (required), `callBackUrl`                                 | `grep -rF "suno/cover" src/*.ts` → 0 hits                |
| `GET /api/v1/suno/cover/record-info`           | **MISSING** | https://docs.kie.ai/suno-api/get-cover-suno-details  | `taskId` (query, required)                                                    | `grep -rF "suno/cover" src/*.ts` → 0 hits                |

### Suno — lyrics, WAV, stems, MIDI, video

| Method and path                         | Class       | Docs URL                                                  | Params                     | Implementation / evidence                                |
| --------------------------------------- | ----------- | --------------------------------------------------------- | -------------------------- | -------------------------------------------------------- |
| `POST /api/v1/lyrics`                   | IMPLEMENTED | https://docs.kie.ai/suno-api/generate-lyrics              | —                          | `suno.ts:778-788`                                        |
| `GET /api/v1/lyrics/record-info`        | IMPLEMENTED | https://docs.kie.ai/suno-api/get-lyrics-details           | `taskId` (query, required) | `suno.ts:790-799`                                        |
| `POST /api/v1/wav/generate`             | IMPLEMENTED | https://docs.kie.ai/suno-api/convert-to-wav               | —                          | `suno.ts:746-754`                                        |
| `GET /api/v1/wav/record-info`           | **MISSING** | https://docs.kie.ai/suno-api/get-wav-details              | `taskId` (query, required) | `grep -rF "wav/record-info" src/*.ts` → 0 hits           |
| `POST /api/v1/vocal-removal/generate`   | IMPLEMENTED | https://docs.kie.ai/suno-api/separate-vocals              | —                          | `suno.ts:756-766`                                        |
| `GET /api/v1/vocal-removal/record-info` | **MISSING** | https://docs.kie.ai/suno-api/get-vocal-separation-details | `taskId` (query, required) | `grep -rF "vocal-removal/record-info" src/*.ts` → 0 hits |
| `POST /api/v1/midi/generate`            | IMPLEMENTED | https://docs.kie.ai/suno-api/generate-midi                | —                          | `suno.ts:837-847`                                        |
| `GET /api/v1/midi/record-info`          | **MISSING** | https://docs.kie.ai/suno-api/get-midi-details             | `taskId` (query, required) | `grep -rF "midi/record-info" src/*.ts` → 0 hits          |
| `POST /api/v1/mp4/generate`             | IMPLEMENTED | https://docs.kie.ai/suno-api/create-music-video           | —                          | `suno.ts:768-776`                                        |
| `GET /api/v1/mp4/record-info`           | **MISSING** | https://docs.kie.ai/suno-api/get-music-video-details      | `taskId` (query, required) | `grep -rF "mp4/record-info" src/*.ts` → 0 hits           |

### Suno — custom voice (entire block missing)

None of the six documented custom-voice endpoints exist in the package.
`grep -rF "voice/" src/*.ts` returns 0 hits for every path below.

| Method and path                   | Class       | Docs URL                                              | Params                                                                                                              |
| --------------------------------- | ----------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `POST /api/v1/voice/validate`     | **MISSING** | https://docs.kie.ai/suno-api/suno-voice-validate      | JSON body: `voiceUrl`, `vocalStartS`, `vocalEndS` (all required), `language`, `callBackUrl`                         |
| `GET /api/v1/voice/validate-info` | **MISSING** | https://docs.kie.ai/suno-api/suno-voice-validate-info | `taskId` (query, optional)                                                                                          |
| `POST /api/v1/voice/regenerate`   | **MISSING** | https://docs.kie.ai/suno-api/suno-voice-regenerate    | JSON body: `taskId` (required), `calBackUrl` (required — upstream spelling, see Ambiguities)                        |
| `POST /api/v1/voice/generate`     | **MISSING** | https://docs.kie.ai/suno-api/suno-voice-generate      | JSON body: `taskId`, `verifyUrl` (required), `voiceName`, `description`, `style`, `callBackUrl`, `singerSkillLevel` |
| `GET /api/v1/voice/record-info`   | **MISSING** | https://docs.kie.ai/suno-api/suno-voice-record-info   | `taskId` (query, optional)                                                                                          |
| `POST /api/v1/voice/check-voice`  | **MISSING** | https://docs.kie.ai/suno-api/suno-voice-check-voice   | JSON body: `task_id` (required — upstream snake_case, see Ambiguities)                                              |

### Chat, Claude, Codex, Grok

| Method and path                     | Class       | Docs URL                                                                    | Notes                                                                                                                                                       | Implementation / evidence                       |
| ----------------------------------- | ----------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `POST /gpt-5-2/v1/chat/completions` | IMPLEMENTED | https://docs.kie.ai/market/chat/gpt-5-2                                     | OpenAI-compatible chat completions.                                                                                                                         | `chat.ts:67` (`PATH_PREFIXES`)                  |
| `POST /claude/v1/messages`          | IMPLEMENTED | https://docs.kie.ai/market/claude/claude-sonnet-4-6 (+ 9 sibling pages)     | 10 documented model ids; enum lists 2 and `KieClaudeModelAliasSchema` (`zod.ts:2933-2938`) accepts the rest.                                                | `claude.ts:137`                                 |
| `POST /codex/v1/responses`          | IMPLEMENTED | https://docs.kie.ai/market/chat/gpt-5-5 (+ gpt-5-4, gpt-5-6-luna/terra/sol) | 5 documented model ids; enum lists `gpt-5-5` and `KieOpenAiModelAliasSchema` (`zod.ts:2719-2724`) accepts the rest.                                         | `responses.ts:324-336`                          |
| `POST /grok/v1/responses`           | IMPLEMENTED | https://docs.kie.ai/market/grok/grok-4-5, .../grok-4-3                      | Both documented ids accepted (`grok-4-5` in enum, `grok-4-3` via alias `zod.ts:2864-2869`).                                                                 | `responses.ts:338+`                             |
| `POST /api/v1/responses`            | **MISSING** | https://docs.kie.ai/market/codex/gpt-codex                                  | Unified Responses endpoint, distinct from `/codex/v1/responses`. Models: `gpt-5-codex`, `gpt-5.1-codex`, `gpt-5.2-codex`, `gpt-5.3-codex`, `gpt-5.4-codex`. | `grep -rF "api/v1/responses" src/*.ts` → 0 hits |

### Gemini

Gemini is the largest single-family gap: kie.ai gives each Gemini model its own
URL path, and the package implements 2 of the 10.

| Method and path                                                            | Class       | Docs URL                                                  | Implementation / evidence                              |
| -------------------------------------------------------------------------- | ----------- | --------------------------------------------------------- | ------------------------------------------------------ |
| `POST /gemini/v1/models/gemini-3-5-flash:streamGenerateContent`            | IMPLEMENTED | https://docs.kie.ai/market/gemini/gemini-3-5-flash        | `gemini.ts:173`                                        |
| `POST /gemini-3.1-pro/v1/chat/completions`                                 | IMPLEMENTED | https://docs.kie.ai/market/gemini/gemini-3-1-pro          | `gemini-31-pro.ts:195`                                 |
| `POST /gemini-2.5-flash/v1/chat/completions`                               | **MISSING** | https://docs.kie.ai/market/gemini/gemini-2-5-flash        | `grep -rF "gemini-2.5-flash" src/*.ts` → 0 hits        |
| `POST /gemini-2.5-pro/v1/chat/completions`                                 | **MISSING** | https://docs.kie.ai/market/gemini/gemini-2-5-pro          | `grep -rF "gemini-2.5-pro" src/*.ts` → 0 hits          |
| `POST /gemini-3-pro/v1/chat/completions`                                   | **MISSING** | https://docs.kie.ai/market/gemini/gemini-3-pro            | `grep -rF "gemini-3-pro" src/*.ts` → 0 hits            |
| `POST /gemini-3-flash/v1/chat/completions`                                 | **MISSING** | https://docs.kie.ai/market/gemini/gemini-3-flash          | `grep -rF "gemini-3-flash" src/*.ts` → 0 hits          |
| `POST /gemini-3-5-flash-openai/v1/chat/completions`                        | **MISSING** | https://docs.kie.ai/market/gemini/gemini-3-5-flash-openai | `grep -rF "gemini-3-5-flash-openai" src/*.ts` → 0 hits |
| `POST /gemini-3-6-flash-openai/v1/chat/completions`                        | **MISSING** | https://docs.kie.ai/market/gemini/gemini-3-6-flash-openai | `grep -rF "gemini-3-6-flash" src/*.ts` → 0 hits        |
| `POST /gemini/v1/models/gemini-3-6-flash:streamGenerateContent`            | IMPLEMENTED | https://docs.kie.ai/market/gemini/gemini-3-6-flash        | `gemini.ts` gemini36Flash.streamGenerateContent        |
| `POST /gemini/v1/models/gemini-3-flash-v1betamodels:streamGenerateContent` | **MISSING** | https://docs.kie.ai/market/gemini/gemini-3-flash-v1beta   | `grep -rF "gemini-3-flash" src/*.ts` → 0 hits          |

### Omni / media helpers

| Method and path                      | Class       | Docs URL                                         | Implementation / evidence |
| ------------------------------------ | ----------- | ------------------------------------------------ | ------------------------- |
| `POST /api/v1/omni/audio/create`     | IMPLEMENTED | https://docs.kie.ai/market/gemini-omni-audio     | `kie.ts:385-420`          |
| `POST /api/v1/omni/character/create` | IMPLEMENTED | https://docs.kie.ai/market/gemini-omni-character | `kie.ts:422-432`          |

### File upload and common

| Method and path                    | Class       | Docs URL                                                | Implementation / evidence                                 |
| ---------------------------------- | ----------- | ------------------------------------------------------- | --------------------------------------------------------- |
| `POST /api/file-stream-upload`     | IMPLEMENTED | https://docs.kie.ai/file-upload-api/upload-file-stream  | `kie.ts:316-341`                                          |
| `POST /api/file-url-upload`        | IMPLEMENTED | https://docs.kie.ai/file-upload-api/upload-file-url     | `kie.ts:343-356`                                          |
| `POST /api/file-base64-upload`     | IMPLEMENTED | https://docs.kie.ai/file-upload-api/upload-file-base-64 | `kie.ts:358-372`                                          |
| `POST /api/v1/common/download-url` | IMPLEMENTED | https://docs.kie.ai/common-api/download-url             | `kie.ts:374-383`. Field set matches docs exactly (`url`). |
| `GET /api/v1/chat/credit`          | IMPLEMENTED | https://docs.kie.ai/common-api/get-account-credits      | `kie.ts:524-540`                                          |

## MISSING endpoints — effort and marginal cost

Marginal cost is assessed against `src/paid-endpoints.ts`, whose matching is
exact on `provider + method + dotPath` with no prefix or wildcard fallback
(stated at `paid-endpoints.ts:8-11`). Any new paid route therefore needs its own
explicit entry or it will be treated as free.

Ranked by value.

| #   | Endpoint                                                                           | Effort | Marginal cost                                                      | Notes                                                                                                                                                                                                                                                                                          |
| --- | ---------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 8 Gemini chat paths (see Gemini table)                                             | M      | Token-billed                                                       | Highest count in one family. `gemini.ts` and `gemini-31-pro.ts` already establish both shapes (`:streamGenerateContent` and `/v1/chat/completions`), so each addition is largely a path + model-id change. Not currently paygated — consistent with the existing Gemini/Claude/chat treatment. |
| 2   | 6 Suno custom-voice paths                                                          | L      | **Yes** for `voice/generate`, `voice/regenerate`, `voice/validate` | An entire documented product area with no coverage. Needs new request/response types plus 2 callback payload shapes. Requires review of whether these belong in `PAID_ENDPOINTS`.                                                                                                              |
| 3   | 5 `record-info` query routes (`wav`, `midi`, `mp4`, `vocal-removal`, `suno/cover`) | S      | No                                                                 | Each is `GET …?taskId=`, identical in shape to the five already implemented in `suno.ts`. Cheapest real win: the package can start these jobs but cannot poll four of them.                                                                                                                    |
| 4   | `POST /api/v1/aleph/generate` + `GET /api/v1/aleph/record-info`                    | M      | **Yes** (generate)                                                 | Runway Aleph video-to-video. `aleph` appears nowhere in the package. Needs a `PAID_ENDPOINTS` entry alongside the existing `runway.generate` / `runway.extend` rows.                                                                                                                           |
| 5   | `POST /api/v1/veo/get-4k-video`                                                    | S      | **Yes**                                                            | The 1080p sibling is already listed paid (`paid-endpoints.ts`, `api.v1.veo.get1080pVideo`), so 4K almost certainly needs the same. Note the method differs from its sibling: 4K is **POST with a JSON body**, 1080p is **GET with query params**.                                              |
| 6   | `POST /api/v1/suno/cover/generate` + `GET /api/v1/suno/cover/record-info`          | M      | **Yes** (generate)                                                 | Distinct from the implemented `generate/upload-cover`; different path family (`/api/v1/suno/cover/…`).                                                                                                                                                                                         |
| 7   | `POST /api/v1/responses`                                                           | M      | Token-billed                                                       | Unified Responses endpoint with a codex model family. `responses.ts` already implements the same request/stream handling for two other paths, so this is mostly a third `sendResponsesRequest` call site.                                                                                      |
| 8   | `POST /api/v1/generate/generate-persona`                                           | S      | **Yes**                                                            | 4 required fields, task-creating.                                                                                                                                                                                                                                                              |
| 9   | `POST /api/v1/generate/get-timestamped-lyrics`                                     | S      | No                                                                 | Retrieval only; 2 required fields.                                                                                                                                                                                                                                                             |
| 10  | `POST /api/v1/gpt4o-image/download-url`                                            | S      | No                                                                 | Retrieval only; 2 required fields.                                                                                                                                                                                                                                                             |

Effort key: S = one method plus one request type; M = new types and response
shapes; L = multi-endpoint area with callbacks.

## PARTIAL detail

**1. `POST /api/v1/jobs/createTask` — 70 of 120 documented models uncovered.**
This is the single largest gap in the package. See the next section.

**2. `POST /api/v1/veo/generate` — four documented fields absent, and one
field-name mismatch.**
`VeoGenerateRequestSchema` (`zod.ts:2121-2136`) omits `callBackUrl`,
`enableFallback`, `resolution`, and `duration`, all four of which are documented
properties at https://docs.kie.ai/veo3-api/generate-veo-3-video. `resolution`
and `duration` are the notable ones — without them a caller cannot select
output quality or length on the package's most-used video endpoint.

Separately, the OpenAPI docs name the field **`aspect_ratio`** (snake_case)
while the package schema/type use **`aspectRatio`** (camelCase) with no key
mapping. **Resolved 2026-08-06 (bead ac-kd11of):** live probes of
`POST /api/v1/veo/generate` with both spellings (recorded under
`kie/veo/aspect-ratio-probe`) show upstream accepts **both**, stores
`aspectRatio` (camelCase) in `paramJson`, and preserves the requested value
(`9:16`). Package camelCase is correct; no wire-format fix required.

**3. `POST /api/v1/veo/extend` — `callBackUrl` absent.**
Documented at https://docs.kie.ai/veo3-api/extend-video; not present in
`VeoExtendRequestSchema` (`zod.ts:2138-2149`). Callers cannot register a completion
webhook for an extend job.

**4. `VeoModel` exported type is narrower than the documented model list.**
The docs list `veo3`, `veo3_fast`, and `veo3_lite`. The runtime schema accepts
all three — the enum is `["veo3", "veo3_fast"]` unioned with
`KieVeoModelAliasSchema` (`zod.ts:2123`), whose underscored grammar matches
`veo3_lite`. But the exported type is hard-coded
`export type VeoModel = "veo3" | "veo3_fast"` (`zod.ts:2235`), so TypeScript
consumers do not see `veo3_lite` in completions and get an error if they
annotate with it. Low effort, type-only fix.

## `createTask` model catalogue — the 70-model gap

`KIE_MEDIA_MODELS` (`zod.ts:167-220`) lists 52 ids. `docs.kie.ai` documents 120
distinct `createTask` models across 123 market pages. 50 overlap.

Two things make this gap smaller in practice than 70/120 suggests, and both are
worth understanding before scoping the work:

- `createTask()` does **not** run `CreateTaskRequestSchema` at call time. It
  calls `validateCreateTaskRequest` (`kie.ts:230-251`), which looks the model up
  in `CREATE_TASK_GUARDS` (8 models) and returns early on a miss. An unlisted
  model is therefore still transmitted; what is lost is local validation,
  the `modelInputSchemas` entry, and TypeScript completion — not the ability to
  call it at all.
- `KieMediaModelSchema` (`zod.ts:222-234`) is an open enum: the literal list
  unioned with 11 family alias regexes. 28 of the 70 already satisfy an alias,
  so they pass the envelope stage and need only a per-model request schema —
  no alias design decision. The other 42 match no alias and need an explicit
  `KIE_MEDIA_MODELS` addition as well.

Note that `CreateTaskRequestSchema` = `CreateTaskEnvelopeSchema.pipe(
MediaGenerationRequestSchema)` (`zod.ts:3028`), and the piped union has no
member for any of the 70. So callers who _do_ validate explicitly against
`kie.post.api.v1.jobs.createTask.schema` will see all 70 rejected, alias match
or not.

### Alias-accepted (28) — needs a per-model schema only

`bytedance/seedance-1.5-pro`, `gpt-image/1.5-text-to-image`,
`kling-2.6/image-to-video`, `kling-2.6/motion-control`,
`kling-2.6/text-to-video`, `kling/ai-avatar-pro`, `kling/ai-avatar-standard`,
`kling/v2-1-master-image-to-video`, `kling/v2-1-master-text-to-video`,
`kling/v2-1-pro`, `kling/v2-1-standard`, `kling/v2-5-turbo-image-to-video-pro`,
`kling/v2-5-turbo-text-to-video-pro`, `nano-banana-2-lite`, `seedream/4.5-edit`,
`seedream/4.5-text-to-image`, `wan/2-2-a14b-image-to-video-turbo`,
`wan/2-2-a14b-speech-to-video-turbo`, `wan/2-2-a14b-text-to-video-turbo`,
`wan/2-2-animate-move`, `wan/2-2-animate-replace`, `wan/2-5-image-to-video`,
`wan/2-5-text-to-video`, `wan/2-6-flash-image-to-video`,
`wan/2-6-flash-video-to-video`, `wan/2-6-image-to-video`,
`wan/2-6-text-to-video`, `wan/2-6-video-to-video`.

### Alias-rejected (42) — needs an enum addition too

Whole vendors with **zero** coverage, which are the highest-value entries here:

| Vendor / family                          | Documented models with no coverage                                                                                                                                                                                                                                            | Docs                                                                                                  |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Google Imagen + Nano Banana (namespaced) | `google/imagen4`, `google/imagen4-fast`, `google/imagen4-ultra`, `google/nano-banana`, `google/nano-banana-edit`                                                                                                                                                              | https://docs.kie.ai/market/google/imagen4 etc.                                                        |
| Ideogram                                 | `ideogram/character`, `ideogram/character-edit`, `ideogram/character-remix`, `ideogram/v3-edit`, `ideogram/v3-remix`, `ideogram/v3-text-to-image`                                                                                                                             | https://docs.kie.ai/market/ideogram/v3-text-to-image etc.                                             |
| Hailuo                                   | `hailuo/02-image-to-video-pro`, `hailuo/02-image-to-video-standard`, `hailuo/02-text-to-video-pro`, `hailuo/02-text-to-video-standard`, `hailuo/2-3-image-to-video-pro`, `hailuo/2-3-image-to-video-standard`                                                                 | https://docs.kie.ai/market/hailuo/02-text-to-video-pro etc.                                           |
| ByteDance (non-Seedance)                 | `bytedance/seedream`, `bytedance/seedream-v4-edit`, `bytedance/seedream-v4-text-to-image`, `bytedance/v1-lite-image-to-video`, `bytedance/v1-lite-text-to-video`, `bytedance/v1-pro-fast-image-to-video`, `bytedance/v1-pro-image-to-video`, `bytedance/v1-pro-text-to-video` | https://docs.kie.ai/market/bytedance/v1-pro-text-to-video etc.                                        |
| Flux 2                                   | `flux-2/flex-image-to-image`, `flux-2/flex-text-to-image`, `flux-2/pro-image-to-image`, `flux-2/pro-text-to-image`                                                                                                                                                            | https://docs.kie.ai/market/flux2/pro-text-to-image etc.                                               |
| Qwen v1 (unversioned namespace)          | `qwen/image-edit`, `qwen/image-to-image`, `qwen/text-to-image`                                                                                                                                                                                                                | https://docs.kie.ai/market/qwen/text-to-image etc.                                                    |
| Topaz                                    | `topaz/image-upscale`, `topaz/video-upscale`                                                                                                                                                                                                                                  | https://docs.kie.ai/market/topaz/image-upscale                                                        |
| Recraft                                  | `recraft/crisp-upscale`, `recraft/remove-background`                                                                                                                                                                                                                          | https://docs.kie.ai/market/recraft/remove-background                                                  |
| Google TTS                               | `google/gemini-2-5-pro-tts`, `google/gemini-3-1-flash-tts`                                                                                                                                                                                                                    | https://docs.kie.ai/google/gemini-2-5-pro-tts, https://docs.kie.ai/market/google/gemini-3-1-flash-tts |
| Omnihuman sub-tasks                      | `omnihuman-1-5/human-identification`, `omnihuman-1-5/subject-detection`                                                                                                                                                                                                       | https://docs.kie.ai/market/omnihuman-1-5/human-identification                                         |
| Singletons                               | `infinitalk/from-audio`, `z-image`                                                                                                                                                                                                                                            | https://docs.kie.ai/market/infinitalk/from-audio, https://docs.kie.ai/market/z-image/z-image          |

Note the `qwen/…` case specifically: `KieMediaQwenModelAliasSchema`
(`zod.ts:86-91`) requires a digit before the `/` (`qwen\d+/…`), which is why the
implemented `qwen2/*` ids pass and the documented unversioned `qwen/*` ids do
not. That is a deliberate grammar decision in the existing code, not an
oversight — adding the v1 ids means either three enum entries or a reviewed
widening of that alias.

Similarly `omnihuman-1-5` is in the enum as a bare id with no alias
(`zod.ts` comment at lines 155-166 explains single-sample vendors deliberately
get no regex), so its two sub-task ids need explicit entries.

## Implemented but not currently documented

Three implemented paths have no corresponding page in the current sitemap.
These are not gaps to fill — they are drift to confirm before anyone relies on
them.

| Method and path                     | Implementation   | Note                                                                                                                                                                                                                                                                                           |
| ----------------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/v1/mj/generate`          | `kie.ts:458-466` | Source comments cite `https://docs.kie.ai/mj-api/generate-mj-image`, which is **not** in the current sitemap. Midjourney appears nowhere in the 243 English pages. It is also an active `PAID_ENDPOINTS` entry (`api.v1.mj.generate`).                                                         |
| `GET /api/v1/mj/record-info`        | `kie.ts:468-480` | Same; cited docs URL `https://docs.kie.ai/mj-api/get-mj-task-details` is absent from the sitemap.                                                                                                                                                                                              |
| `POST /gpt-5.5/v1/chat/completions` | `chat.ts:67`     | `PATH_PREFIXES = ["gpt-5.5", "gpt-5-2"]`. Only `gpt-5-2` is documented as a chat-completions path; the docs route `gpt-5-5` to `/codex/v1/responses` instead (https://docs.kie.ai/market/chat/gpt-5-5). `chat.ts` uses `withFallback`, so a dead first prefix degrades silently to the second. |

Two implemented `createTask` models are likewise undocumented:
`elevenlabs/sound-effect-v2` and `sora-watermark-remover`. Both are in
`KIE_MEDIA_MODELS`; neither has a market page in the current sitemap.

## Callbacks and webhooks

kie.ai documents **22** callback payload schemas — the bodies it POSTs to a
caller's `callBackUrl`. `@apicity/kie` exports **no** callback payload types
for any of them. `grep -rin "callback\|webhook" src/*.ts` (excluding the
`callBackUrl` request field) matches only the `"CALLBACK_EXCEPTION"` Suno error
string at `suno.ts:61`, `suno.ts:138`, and `suno.ts:515`.

Documented callback pages: 4o Image (1), Flux Kontext (1), Runway (3, including
Aleph), Suno (15, including the two custom-voice callbacks), Veo (2).

kie.ai also documents HMAC signature verification for these webhooks at
https://docs.kie.ai/common-api/webhook-verification. The package has no
verification helper — `paygate.ts` does use HMAC, but for the Apicity paygate,
which is an unrelated mechanism.

This is a genuine surface gap but a different _kind_ from the endpoint rows
above: nothing here is a route the SDK calls. Treated as a separate work item
rather than counted in the 27.

## Paygate coverage observation

Not part of the requested diff, but it surfaced while classifying marginal cost
and affects how any new paid endpoint should be scoped.

`PAID_ENDPOINTS` (`paid-endpoints.ts`) lists 9 `kie` entries:
`api.v1.jobs.createTask`, `api.v1.veo.generate`, `api.v1.veo.extend`,
`api.v1.veo.get1080pVideo`, `api.v1.flux.kontext.generate`,
`api.v1.gpt4oImage.generate`, `api.v1.mj.generate`, `api.v1.runway.generate`,
`api.v1.runway.extend`.

No Suno endpoint appears, and neither `omni` endpoint appears — yet
`POST /api/v1/generate` (music generation), `POST /api/v1/mp4/generate`,
`POST /api/v1/omni/audio/create` and the rest are all task-creating routes that
bill credits upstream. Because matching is exact with no fallback, these are
currently treated as free by the gate. Flagged for review; whether that is
deliberate is not determinable from the code, and I have not assumed either way.

## Ambiguities and things deliberately not asserted

1. **Veo `aspect_ratio` vs `aspectRatio`.** **RESOLVED (ac-kd11of, 2026-08-06).**
   Live calls with both spellings succeed; `paramJson` always stores camelCase
   `aspectRatio` with the requested value. See
   `tests/integration/kie-veo-aspect-ratio-probe.test.ts` + HAR
   `kie/veo/aspect-ratio-probe`. No package change required.

2. **Upstream field-name inconsistencies in the custom-voice block.** The specs
   themselves are irregular: `POST /api/v1/voice/regenerate` requires
   **`calBackUrl`** (one `l`) where every other endpoint uses `callBackUrl`, and
   `POST /api/v1/voice/check-voice` requires **`task_id`** where every other
   endpoint uses `taskId`. Both are reproduced here as documented. They look
   like upstream typos, but an implementation must match the wire format, not
   the convention — verify against a live call before normalizing.

3. **`market/quickstart` model catalogue completeness.** The 120 models counted
   here are those with a dedicated market page in the sitemap. kie.ai's
   `/market` browser may expose ids that have no doc page; those would not
   appear in this count. The 120 is a floor, not a ceiling.

4. **Model ids on 6 pages** (`market/pixverse/{text-to-video,
reference-to-video, transition}`, `market/seedream/seedream`,
   `market/wan/2-7-image`, `market/wan/2-7-image-pro`) carry no `"model": "…"`
   JSON example and were read from the `examples:` enum on the `model` property
   instead. Values used: `pixverse-v6/text-to-video`,
   `pixverse-v6/reference-to-video`, `pixverse-v6/transition`,
   `bytedance/seedream`, `wan/2-7-image`, `wan/2-7-image-pro`. Five of the six
   are already implemented; only `bytedance/seedream` lands in the gap list.

5. **Doc-page duplicates.** Seven sitemap URLs are numeric-id duplicates of
   named pages (`38308980e0`, `38309290e0`, `38309489e0` → HappyHorse 1.1;
   `39041537e0` → Claude Sonnet 5; `40573326e0`, `40573330e0` → Gemini 3.6
   Flash; `2151374m0` → the Chinese Claude Code guide). They were de-duplicated
   by method+path and contribute no distinct endpoints.

6. **Suno request-field depth.** For the implemented Suno routes the table
   records the path and source line but not a full field-by-field diff; only the
   endpoints flagged PARTIAL had their request bodies compared property by
   property against the spec. A field-level Suno audit is a reasonable
   follow-up but was not in scope for the endpoint diff.

## Reproducing this report

```bash
# Documented surface
curl -s https://docs.kie.ai/sitemap.xml \
  | grep -o '<loc>[^<]*</loc>' | sed 's|</\?loc>||g' | grep -v 'docs.kie.ai/cn' \
  > en-urls.txt                                   # 243 URLs
# fetch each as "$url.md" (serially or with low concurrency — parallel
# fetching is rate-limited and silently returns the SPA shell instead of
# markdown; verify each file starts with '#')
# then parse the `paths:` block of each OpenAPI fragment for method + path.

# Implemented surface
grep -oE '<code>(GET|POST) https://[^<]*</code>' packages/provider/kie/README.md
grep -n 'PATH_PREFIXES' packages/provider/kie/src/chat.ts   # the 2 not in README
```
