# Google Flow API v1 Endpoint Inventory

Tracking bead: `ac-ht41`

This inventory maps the useapi.net Google Flow API v1 surface into Apicity
implementation work. It is a handoff document only; each endpoint should still
land through its own implementation bead.

Sources checked:

- Overview: https://useapi.net/docs/api-google-flow-v1
- Snapshot: https://useapi.net/assets/aibot/api-google-flow-v1.txt

Snapshot generated time was `2026-06-25 05:55 UTC`. The snapshot contains 26
endpoint sections for Google Flow API v1, which matches the endpoint set below.

## Common Contract

Base URL: `https://api.useapi.net/v1/google-flow`

Authentication applies to every endpoint:

- Header: `Authorization: Bearer {API token}`.
- The token is the full useapi.net token, including the `user:` prefix and the
  alphanumeric suffix. Do not truncate or URL-encode it.
- One token authorizes every useapi.net API under the caller's subscription.
- Google Flow account selection is separate from token auth. Some endpoints
  take `email`; when omitted on eligible routes, useapi.net selects an account
  through its load balancer.

Headers and body conventions:

- JSON endpoints use `Content-Type: application/json`; the docs also allow
  `multipart/form-data` for several POST endpoints.
- `POST /assets/{email}` uses raw request bytes and requires an image/video
  content type instead of JSON.
- Path values containing email addresses or encoded `user:...` refs must be
  URL-encoded by the implementation.

Captcha and rotation semantics:

- Image generation, image upscale, video generation, video upscale, video
  extend, and voice creation require captcha. Voice docs call this out
  explicitly; captcha provider docs list the generation endpoints that accept
  captcha fields.
- Shared captcha request fields are `captchaToken`, `captchaRetry`, and
  `captchaOrder`. They are mutually exclusive.
- `captchaRetry` is 1-10, default `3`.
- `captchaOrder` is a comma-separated provider sequence with at most 10
  entries. Providers must already be configured.
- Default provider order is `CapSolver`, `AntiCaptcha`, `YesCaptcha`,
  `CapMonster`, `SolveCaptcha`, `2Captcha`, `EzCaptcha`.
- Captcha-quality failures can appear as `403`, `429` with
  `PUBLIC_ERROR_UNUSUAL_ACTIVITY_TOO_MUCH_TRAFFIC`, or `503` when the captcha
  service itself fails.

Error handling implementation guidance:

- Add a provider-specific `GoogleFlowError` that extends `Error` and includes
  `status`, parsed response `body`, and optional `retryAfter`.
- Most errors are JSON with either `{ "error": string }` or
  `{ "error": { code, message, status, details? } }`.
- `429` responses include both a `Retry-After` header and `retryAfter` body
  timestamp. Preserve both when present.
- `596` is a documented session-refresh error. Treat it as a nonstandard HTTP
  status from upstream and surface the parsed body; account reconfiguration is
  required.
- `403` on reusable refs means the encoded ref belongs to another useapi.net
  user.
- `404` means the selected account, asset, job, voice, character, or ref was not
  found, depending on endpoint.
- `410` on job lookup means the job has expired from the in-memory registry.

Pagination and list behavior:

- No endpoint documents cursor or page-based pagination.
- `GET /accounts`, `GET /voices`, and `GET /characters` return complete lists
  for the selected subscription/account.
- `GET /jobs?options=history` includes the top 10 recent completed jobs from
  the last 15 minutes, not a pageable history API.
- `GET /accounts/captcha-stats` uses filters, not pagination. `limit` returns
  the last N records, max 50000; `date` is ignored when `limit` is present.

## Endpoint Inventory

| Block | Method and path                    | Docs URL                                                                               | Params and request body                                                                                                                                                                                                                                                                                                                                                                                  | Response shape                                                                                                                                                                                                                                                                                                                                                           | Status behavior                                                                                                                                                           |
| ----- | ---------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | `GET /accounts`                    | https://useapi.net/docs/api-google-flow-v1/get-google-flow-accounts                    | No path/query/body. Auth header required.                                                                                                                                                                                                                                                                                                                                                                | Object map keyed by masked email. Each value has `health`, optional `error`, `created`, `sessionData.expires`, `project`, and `nextRefresh`. Empty object means no accounts.                                                                                                                                                                                             | `200`, `401`.                                                                                                                                                             |
| 1     | `POST /accounts`                   | https://useapi.net/docs/api-google-flow-v1/post-google-flow-accounts                   | JSON or multipart body with required `cookies`, copied from Google account cookies in table format. Auth header required.                                                                                                                                                                                                                                                                                | Account configuration with `created`, `accountCookies`, `sessionCookies`, `sessionData`, `project`, and `nextRefresh`. `201` for new account, `200` for update. Sensitive values are returned redacted in docs.                                                                                                                                                          | `201`, `200`, `400` validation/cookie failure, `401`, `402` subscription/payment required.                                                                                |
| 1     | `GET /accounts/captcha-providers`  | https://useapi.net/docs/api-google-flow-v1/get-google-flow-accounts-captcha-providers  | No path/query/body. Auth header required.                                                                                                                                                                                                                                                                                                                                                                | Optional provider keys masked by provider name: `CapSolver`, `AntiCaptcha`, `YesCaptcha`, `CapMonster`, `SolveCaptcha`, `2Captcha`, `EzCaptcha`. May include `freeCaptchaCredits` only when no providers are configured and free credits remain.                                                                                                                         | `200`, `401`.                                                                                                                                                             |
| 1     | `POST /accounts/captcha-providers` | https://useapi.net/docs/api-google-flow-v1/post-google-flow-accounts-captcha-providers | JSON or multipart body with optional provider API-key fields: `CapSolver`, `AntiCaptcha`, `YesCaptcha`, `SolveCaptcha`, `2Captcha`, `EzCaptcha`; docs model also includes `CapMonster`. Empty string removes a provider.                                                                                                                                                                                 | Same masked-provider/free-credit shape as `GET /accounts/captcha-providers`.                                                                                                                                                                                                                                                                                             | `200`, `400` invalid provider, `401`.                                                                                                                                     |
| 1     | `GET /accounts/captcha-stats`      | https://useapi.net/docs/api-google-flow-v1/get-google-flow-accounts-captcha-stats      | Optional query: `date` (`YYYY-MM-DD`, defaults to today when `limit` omitted), `limit` max 50000, `provider` enum, `anonymized=true` for cross-user summary. Auth header required.                                                                                                                                                                                                                       | `{ date?, limit?, provider?, total, summary?, data }`. `summary` has provider/tier/sku sample sizes and success rates, image/video status buckets, average captcha/API timing, attempt average, and lookup maps. `data[]` has timestamp, jobId, provider, taskId, route, status, pageAction, error/reason, tier/sku, statusCode, durations, attemptNumber.               | `200`, `400`, `401`. 429 buckets are data values inside stats, not this endpoint's own status.                                                                            |
| 1     | `GET /accounts/{email}`            | https://useapi.net/docs/api-google-flow-v1/get-google-flow-accounts-email              | Required path `email`, URL-encoded. Auth header required.                                                                                                                                                                                                                                                                                                                                                | Full account configuration with redacted cookies/session data, `project`, `nextRefresh`, `health`, optional `credits`, optional `models.videoModels`, optional `recommendations`. `credits` and `models` appear only when `health` is `OK`.                                                                                                                              | `200`, `401`, `404`.                                                                                                                                                      |
| 1     | `DELETE /accounts/{email}`         | https://useapi.net/docs/api-google-flow-v1/delete-google-flow-accounts-email           | Required path `email`, URL-encoded. Auth header required.                                                                                                                                                                                                                                                                                                                                                | `{ message }` confirming deletion. Cancels scheduled refresh; cannot be undone except by re-adding account.                                                                                                                                                                                                                                                              | `200`, `401`, `404`.                                                                                                                                                      |
| 3     | `POST /assets/{email}`             | https://useapi.net/docs/api-google-flow-v1/post-google-flow-assets-email               | Optional path `email`, URL-encoded; route can also be called as `POST /assets` without email. Raw binary body. Required content type: `image/png`, `image/jpeg`, `image/webp` max 20 MB, or `video/mp4` max 100 MB.                                                                                                                                                                                      | Image uploads return `media`, optional `workflow`, nested `mediaGenerationId.mediaGenerationId`, `width`, `height`, `email`. Video uploads return `media`, nested `mediaGenerationId.mediaGenerationId`, `durationSeconds`, `width`, `height`, `email`. Image refs feed `reference_*`, `imageReference_*`, `startImage`, `endImage`; video refs feed `referenceVideo_1`. | `200`, `400` invalid type/size/content policy, `401`, `404`, `429` account quota/throttle with retry metadata, `503` Google upload outage, `596` session refresh failure. |
| 3     | `GET /assets/{mediaGenerationId}`  | https://useapi.net/docs/api-google-flow-v1/get-google-flow-assets-mediagenerationid    | Required path `mediaGenerationId`, URL-encoded. Use `mediaGenerationId.mediaGenerationId` from `POST /assets`. Auth header required.                                                                                                                                                                                                                                                                     | `{ url, mediaGenerationId, error? }`. URL is a signed GCS download URL valid for about 6 hours.                                                                                                                                                                                                                                                                          | `200`, `400`, `401`, `403`, `404`, `502`, `596`.                                                                                                                          |
| 2     | `GET /characters`                  | https://useapi.net/docs/api-google-flow-v1/get-google-flow-characters                  | Required query `email`. Auth header required.                                                                                                                                                                                                                                                                                                                                                            | `{ characters: [...] }`. Fast list without signed media URLs. Character rows include `character`, `entityId`, `displayName`, optional `personalityNotes`, `imageReferences`, optional thumbnail/create/update fields, and optional `voice` union for live user voice, system voice, or deleted orphan voice.                                                             | `200`, `400` missing email, `404` account not found.                                                                                                                      |
| 2     | `POST /characters`                 | https://useapi.net/docs/api-google-flow-v1/post-google-flow-characters                 | JSON body: required `displayName` 1-200 chars; required `imageReference_1`; optional `imageReference_2`, `personalityNotes` 0-2000 chars, `voice` system name or user voice ref. Auth header required.                                                                                                                                                                                                   | `{ entityId, character, displayName, personalityNotes?, imageReferences, voice? }`. The `character` field is the ref for `character_1..7` on image/video generation.                                                                                                                                                                                                     | `200`, `400`, `401`, `404`.                                                                                                                                               |
| 2     | `GET /characters/{ref}`            | https://useapi.net/docs/api-google-flow-v1/get-google-flow-characters-ref              | Required path `ref`, URL-encoded. Ref comes from `POST /characters` or `GET /characters`. Auth header required.                                                                                                                                                                                                                                                                                          | Full character with signed `imageReferences[].previewUrl`, optional `thumbnailUrl`, and optional `voice.audioUrl`. Signed URLs are valid for about 6 hours. Voice may be live user, system, or deleted orphan.                                                                                                                                                           | `200`, `400` bad ref format, `403` ref belongs to another user, `404`.                                                                                                    |
| 2     | `DELETE /characters/{ref}`         | https://useapi.net/docs/api-google-flow-v1/delete-google-flow-characters-ref           | Required path `ref`, URL-encoded. Auth header required.                                                                                                                                                                                                                                                                                                                                                  | `{ deleted: true, entityId, character }`. Attached voice is not deleted.                                                                                                                                                                                                                                                                                                 | `200`, `400` bad format, `403`, `404`.                                                                                                                                    |
| 4     | `GET /jobs?options=options`        | https://useapi.net/docs/api-google-flow-v1/get-google-flow-jobs                        | Optional query `options`: `summary` default, `executing`, or `history`. Auth header required.                                                                                                                                                                                                                                                                                                            | Load-balancing telemetry. Includes `emails`, `videos.summary`, `images.summary`, and depending on `options`, currently executing jobs and top 10 recent completed jobs from last 15 minutes.                                                                                                                                                                             | `200`, `400`, `401`. Documents quarantine scoring and `no_eligible_account` behavior used by generation routes.                                                           |
| 4     | `GET /jobs/{jobId}`                | https://useapi.net/docs/api-google-flow-v1/get-google-flow-jobs-jobid                  | Required path `jobId` returned by image/video async generation. Auth header required.                                                                                                                                                                                                                                                                                                                    | Job status union for image and video work. Common fields include job id, type, status (`created`, `started`, `completed`, `failed`), timestamps, request echo, reply metadata, and completed media/error details.                                                                                                                                                        | `200`, `400`, `401`, `403`, `404`, `410` expired.                                                                                                                         |
| 2     | `GET /voices`                      | https://useapi.net/docs/api-google-flow-v1/get-google-flow-voices                      | Required query `email`; optional `source=system\|user`. Auth header required.                                                                                                                                                                                                                                                                                                                            | `{ voices: [...] }`. System voices include `voice`, `source: "system"`, `displayName`, static `sampleUrl`; user voices include ref, source, displayName, workflowId, mediaId, baseVoice, optional dialog/performance/createTime. No `audioUrl` on list.                                                                                                                  | `200`, `400` missing email, `404` account not found.                                                                                                                      |
| 2     | `POST /voices`                     | https://useapi.net/docs/api-google-flow-v1/post-google-flow-voices                     | JSON body: required `email`, `voice` one of 30 system presets, `displayName` 1-200 chars, `dialog` 1-120 chars, `voicePerformance` 1-120 chars. Optional mutually exclusive captcha fields. Auth header required.                                                                                                                                                                                        | User voice with `voice` ref, `source: "user"`, `workflowId`, `mediaId`, `displayName`, `baseVoice`, `dialog`, `voicePerformance`, optional signed `audioUrl` valid about 6 hours.                                                                                                                                                                                        | `200`, `400`, `401`, `403` captcha rejected, `404`, `429` quota/throttle/captcha-quality with retry metadata, `503` Google or captcha-provider failure.                   |
| 2     | `GET /voices/{ref}`                | https://useapi.net/docs/api-google-flow-v1/get-google-flow-voices-ref                  | Required path `ref`, URL-encoded. Ref can be system voice name or user voice ref. Auth header required.                                                                                                                                                                                                                                                                                                  | System voice returns `voice`, `source: "system"`, `displayName`, static `sampleUrl`. User voice returns ref, source, displayName, workflowId, mediaId, baseVoice, optional dialog/performance/createTime, optional signed `audioUrl`.                                                                                                                                    | `200`, `400` unknown ref, `403`, `404`.                                                                                                                                   |
| 2     | `DELETE /voices/{ref}`             | https://useapi.net/docs/api-google-flow-v1/delete-google-flow-voices-ref               | Required path `ref`, URL-encoded. Must be a user voice ref; system voices are immutable. Auth header required.                                                                                                                                                                                                                                                                                           | `{ deleted: true, workflowId, voice }`. Characters that referenced the deleted voice become orphan-voice records.                                                                                                                                                                                                                                                        | `200`, `400` system voice or bad ref, `403`, `404`.                                                                                                                       |
| 4     | `POST /images`                     | https://useapi.net/docs/api-google-flow-v1/post-google-flow-images                     | JSON body: required `prompt`; optional `email`, `model` (`imagen-4`, `nano-banana-2`, `nano-banana-pro`; legacy `nano-banana` accepted), `aspectRatio`, `count` 1-4 default 4, `seed`, `reference_1..10`, `character_1..7`, `replyUrl`, `replyRef`, and captcha fields. Auto-selects `nano-banana-2` when references exist and no model is specified; otherwise defaults to `imagen-4`.                  | Sync response includes `jobId` and generated image `media[]`; each image has direct signed `fifeUrl`, seed, and `mediaGenerationId` for reuse. Callback payloads match `GET /jobs/{jobId}`.                                                                                                                                                                              | `200`, `400`, `401`, `402`, `403`, `404`, `429`, `500`, `503`, `596`.                                                                                                     |
| 4     | `POST /images/upscale`             | https://useapi.net/docs/api-google-flow-v1/post-google-flow-images-upscale             | JSON body: required `mediaGenerationId` from generated image; optional `resolution` (`2k` default or `4k`) and captcha fields. Auth header required.                                                                                                                                                                                                                                                     | `{ encodedImage, captcha? }`; `encodedImage` is base64 JPEG. Captcha metadata may include service, taskId, durationMs, and attempt records.                                                                                                                                                                                                                              | `200`, `400`, `401`, `403`, `404`, `429`, `503`.                                                                                                                          |
| 4     | `POST /videos`                     | https://useapi.net/docs/api-google-flow-v1/post-google-flow-videos                     | JSON body: required `prompt`; optional `model` (`veo-3.1-quality`, `veo-3.1-fast`, `veo-3.1-lite`, `veo-3.1-lite-low-priority`, `omni-flash`), `aspectRatio`, `duration`, `count` 1-4, `seed`, `email`, image refs (`startImage`, `endImage`, `referenceImage_1..7`), `character_1..7`, `referenceAudio_1..5`, `referenceVideo_1`, V2V trim fields, `async`, `replyUrl`, `replyRef`, and captcha fields. | `200` sync returns `jobId` and `media[]` video objects with signed URLs. `201` async returns job metadata for polling. Media includes IDs, workflow fields, dimensions, seed, URLs, and possible captcha metadata.                                                                                                                                                       | `200`, `201`, `400`, `401`, `402`, `403`, `404`, `408`, `429`, `503`, `596`.                                                                                              |
| 4     | `POST /videos/concatenate`         | https://useapi.net/docs/api-google-flow-v1/post-google-flow-videos-concatenate         | JSON body: required `media` array of video refs; each item has required `mediaGenerationId` and optional `trimStart`/`trimEnd`. Auth header required.                                                                                                                                                                                                                                                    | `{ jobId, status, inputsCount, encodedVideo, error? }`; `encodedVideo` is base64 MP4.                                                                                                                                                                                                                                                                                    | `200`, `400`, `401`, `404`, `408`.                                                                                                                                        |
| 4     | `POST /videos/extend`              | https://useapi.net/docs/api-google-flow-v1/post-google-flow-videos-extend              | JSON body: required `mediaGenerationId` from a Veo-generated or extended video and required `prompt`; optional Veo `model`, `count` 1-4, `seed`, `async`, `replyUrl`, `replyRef`, and captcha fields. `omni-flash` videos cannot be extended with this endpoint.                                                                                                                                         | `200` sync returns extended video data with `jobId` and preferred `media[]`; `201` async returns job metadata.                                                                                                                                                                                                                                                           | `200`, `201`, `400`, `401`, `403`, `404`, `408`, `429`, `503`.                                                                                                            |
| 4     | `POST /videos/gif`                 | https://useapi.net/docs/api-google-flow-v1/post-google-flow-videos-gif                 | JSON body: required `mediaGenerationId` from a generated video. Auth header required. No captcha required.                                                                                                                                                                                                                                                                                               | `{ encodedGif, error? }`; `encodedGif` is base64 GIF data.                                                                                                                                                                                                                                                                                                               | `200`, `400`, `401`, `404`.                                                                                                                                               |
| 4     | `POST /videos/upscale`             | https://useapi.net/docs/api-google-flow-v1/post-google-flow-videos-upscale             | JSON body: required `mediaGenerationId`; optional `resolution` (`1080p` default or `4K`), `async`, `replyUrl`, `replyRef`, and captcha fields. Auth header required.                                                                                                                                                                                                                                     | `200` sync returns upscaled video data with `jobId`, legacy `operations[]`, and media/video URL or raw bytes on repeated upscale; `201` async returns job metadata.                                                                                                                                                                                                      | `200`, `201`, `400`, `401`, `403`, `404`, `408`, `429`, `503`.                                                                                                            |

## Model and Parameter Notes

Image generation:

- `reference_1..10` accept image `mediaGenerationId` values from assets or prior
  image generations.
- `imagen-4` supports at most three references.
- `nano-banana-2` and `nano-banana-pro` support at most 10 references.
- `character_1..7` values come from `POST /characters` and share the same
  effective image-reference budget.
- Inline markers in `prompt` can refer to `@character_1..7` and
  `@reference_1..10`. Each marker must have a matching body slot.

Video generation:

- Veo models support `landscape`, `portrait`, `1:1`, `4:3`, and `3:4`.
- `omni-flash` supports `landscape` and `portrait`.
- Veo T2V/I2V supports 4, 6, and 8 seconds, with 4/6 documented as Ultra-only.
- `veo-3.1-quality` is 8 seconds only and does not support characters or
  Ingredients-style references.
- `omni-flash` supports 4, 6, 8, and 10 seconds for T2V/R2V. In V2V edit mode,
  `duration` is not accepted because output length follows the input trim.
- `referenceVideo_1` is `omni-flash` only and comes from `POST /assets` video
  upload. `startFrameIndex_1` range is 0-239, `endFrameIndex_1` range is 1-240
  and must be greater than start.
- `referenceAudio_1..5` accept either system voice names or user voice refs.

Voice and character management:

- System voices are immutable built-ins. User voices are created with
  `POST /voices`, previewed with `GET /voices/{ref}`, and removed with
  `DELETE /voices/{ref}`.
- Characters bundle one or two image refs and an optional voice. Deleting a
  character does not delete its voice. Deleting a user voice leaves characters
  with an orphan-voice marker.

## Implementation Mapping

Recommended package boundary:

- Implement Google Flow as a separate `@apicity/google-flow` provider package,
  or an equivalently isolated factory, because it uses the `api.useapi.net`
  host, Bearer `user:` auth, captcha/provider rotation, raw asset uploads, and
  nonstandard statuses. It should not share the current `@apicity/google`
  Vertex AI `x-goog-api-key` transport.
- Preserve upstream path shape in the public namespace. If the package is named
  `google-flow`, expose the URL path literally, for example
  `googleFlow.v1.googleFlow.accounts()` for
  `https://api.useapi.net/v1/google-flow/accounts`, unless a local convention is
  intentionally added and documented before endpoint beads are cooked.
- Follow endpoint-comment requirements in implementation beads: each endpoint
  needs the two URL/doc comments and a row in `scripts/endpoint-docs.tsv`.
  Ensure `useapi.net` is allowed for the selected provider in
  `scripts/check-endpoint-comments.mjs`.
- Add a shared request helper for JSON, multipart, and raw bytes. The raw asset
  route should not force JSON serialization.
- Add shared response parsing that handles empty/non-JSON bodies defensively but
  preserves parsed JSON when present.
- Add shared types for captcha fields, retry metadata, signed media URLs,
  account selection, account summary, job status, and Google RPC-style error
  bodies.
- Tests must use Polly recordings. Generation endpoints need stable account and
  captcha setup before recording, so record bootstrap/management endpoints
  first.

## Dependency Graph

Block 1: token/accounts bootstrap endpoints

- `POST /accounts`
- `GET /accounts`
- `GET /accounts/{email}`
- `DELETE /accounts/{email}`
- `POST /accounts/captcha-providers`
- `GET /accounts/captcha-providers`
- `GET /accounts/captcha-stats`

Blocker criteria: Bearer auth, account cookie submission, account health,
captcha provider config, `Retry-After` handling, and account/session error
typing are in place. This block must come first because all media and
generation flows depend on configured Google Flow accounts, and generation
quality depends on captcha provider availability.

Block 2: content identity and management

- `POST /voices`
- `GET /voices`
- `GET /voices/{ref}`
- `DELETE /voices/{ref}`
- `POST /characters`
- `GET /characters`
- `GET /characters/{ref}`
- `DELETE /characters/{ref}`

Blocker criteria: reusable refs are URL-encoded correctly, user-vs-system voice
unions are typed, orphan voice states are represented, and character image/voice
dependencies reference Block 3 and voice outputs correctly.

Block 3: asset/media ingestion and retrieval

- `POST /assets/{email}`
- `GET /assets/{mediaGenerationId}`

Blocker criteria: raw binary uploads support image/video content types and size
limits, optional email selection is modeled, signed download URLs are typed, and
image/video upload response unions expose reusable `mediaGenerationId` values.

Block 4: generation and job endpoints

- `POST /images`
- `POST /images/upscale`
- `POST /videos`
- `POST /videos/concatenate`
- `POST /videos/extend`
- `POST /videos/gif`
- `POST /videos/upscale`
- `GET /jobs?options=options`
- `GET /jobs/{jobId}`

Blocker criteria: Blocks 1-3 are stable, captcha parameters are shared, async
job polling and callback payloads match `GET /jobs/{jobId}`, media refs from
assets/images/videos are reusable, and model-specific validation covers the
documented image/video limits.

Priority note: every generation endpoint in Block 4 should be treated as
higher-priority follow-on work because it depends on a stable upstream auth
session, Google Flow account health, and captcha-provider setup. Recording those
tests will be fragile until Blocks 1-3 are available and verified.

## Verification Checklist

- Endpoint count verified against the snapshot: 26 Google Flow endpoint
  sections, excluding the overview and setup guide.
- Path set verified:
  `GET /accounts`, `POST /accounts`, `GET /accounts/captcha-providers`,
  `POST /accounts/captcha-providers`, `GET /accounts/captcha-stats`,
  `GET /accounts/{email}`, `DELETE /accounts/{email}`,
  `POST /assets/{email}`, `GET /assets/{mediaGenerationId}`,
  `GET /characters`, `POST /characters`, `GET /characters/{ref}`,
  `DELETE /characters/{ref}`, `GET /jobs?options=options`,
  `GET /jobs/{jobId}`, `GET /voices`, `POST /voices`, `GET /voices/{ref}`,
  `DELETE /voices/{ref}`, `POST /images`, `POST /images/upscale`,
  `POST /videos`, `POST /videos/concatenate`, `POST /videos/extend`,
  `POST /videos/gif`, `POST /videos/upscale`.
- No cursor/page pagination was found in the source text.
- Recommended implementation order is Block 1, Block 2, Block 3, then Block 4.
- The inventory is intended to be actionable without reopening the original
  bead request; each endpoint row includes its upstream docs URL.
