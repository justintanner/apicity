# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `v1.videos.generations` takes the `21:9` and `5:2` aspect ratios (so does
  the `imageToVideo` leaf) and the optional `generate_audio` (boolean),
  `output: { upload_url }` and `user` fields. The REST reference and the
  video overview list the nine ratios for all three video models, and a free
  422 probe on 2026-11-01 had xAI's request parser list the same nine.
  `generate_audio: false` requests a silent clip, per the video generation
  guide's Audio section; the REST reference lists `output` and `user`. The
  three fields are docs-only (no probe), and `@apicity/cost` rates are
  unchanged (ac-zjpet9).

- `v1.videos.generations` takes grok-imagine-video-1.5's pinned frames:
  `last_frame` (a URL, data URI or `{ file_id }`), its
  `last_frame_file_id` alias (sent as `last_frame: { file_id }`), and up to
  4 `keyframes` of `{ image, timestamp_s }` (type `XaiVideoKeyframe`). Each
  `timestamp_s` must be greater than 0 and less than `duration` (8 when
  omitted), and two keyframes in the same 1/3-second slot are refused.
  Reference images go up to 14 per request on the 1.5 family. xAI's
  reference-to-video doc (read 2026-11-01) documents all of it. The schema
  and the pre-fetch guard check every rule through the same helper
  (ac-dlb6li).

- `v1.videos.generations` (and the 1.5 `imageToVideo` leaf) take
  `resolution: "1080p"`. xAI documents it for grok-imagine-video-1.5 text
  and image to video and for 1.5-lite, and a free 422 probe on 2026-10-31
  had the request parser list exactly `480p`, `720p` and `1080p`. The
  server applies the per-model limits: grok-imagine-video and
  reference-to-video go up to 720p (ac-nw0cw3).

- `v1.images.generations` and `v1.images.edits` take
  grok-imagine-image-2.0's request fields:
  - `quality` (`low`, `medium` or `auto`, 2.0 only);
  - `resolution: "1.5k"`;
  - the `21:9` and `5:2` aspect ratios;
  - up to five edit sources in `images` or `image_file_ids` (was three).

  Free 422 probes on 2026-10-31 listed each value from xAI's request
  parser. The parser also takes `quality: "high"`, which the docs do not
  list, so the schema leaves it out (ac-k9mqsp).

- Added `get.v1.images(requestId)`, `GET https://api.x.ai/v1/images/{request_id}`,
  which polls a deferred image generation: HTTP 202 while pending, 200 with
  `data` when done or with an `error` body when it failed
  (`XaiImageDeferredResult`). `post.v1.images.generations` takes the matching
  `deferred` flag, and `XaiImageResponse` carries the `request_id` a deferred
  request returns. An unknown id is an `XaiError` 404 (ac-y399sf).

- Added the `@apicity/xai/realtime` subpath export with `connectXaiRealtime`,
  an authenticated server-side Realtime WebSocket transport built on `ws`, now
  a runtime dependency (ac-j3d6ki.11). It sends the API key as an
  `Authorization: Bearer` header, connects by `model` or SIP `callId`, bounds
  the handshake with `timeout`, aborts on `signal`, and closes on malformed
  server events. A rejected handshake rejects with `XaiError` carrying the
  HTTP status and parsed body.

- Typed the `force_message` conversation item as
  `XaiRealtimeForceMessageItem` (an assistant line synthesized via TTS without
  a `response.create` round trip, with optional `interruptible`). It joins the
  new `XaiRealtimeConversationItem` union, which both the main entry's
  `XaiRealtimeConversationItemCreate` and the transport's
  `conversation.item.create` event use. `XaiRealtimeSession` now types
  `audio.output.speed` (0.7-1.5, default 1.0) and `reasoning.effort`.

### Changed

- `v1.videos.generations` follows xAI's current reference-to-video rules.
  On the grok-imagine-video-1.5 family and with no model, `image` or
  `image_file_id` beside references, voices, `last_frame` or `keyframes` is
  the pinned first frame, where it used to be refused as a second mode.
  grok-imagine-video and other named models outside the 1.5 family still
  refuse an image beside references, and refuse `last_frame`,
  `last_frame_file_id` and `keyframes` with "<field> requires the
  grok-imagine-video-1.5 model family". `video` or `video_file_id` still
  excludes every other mode on every model (ac-dlb6li).
- `prompt` is optional on `v1.videos.generations` whenever a frame is
  pinned (`image`, `image_file_id`, `last_frame`, `last_frame_file_id` or
  `keyframes`), and always on the `imageToVideo` leaf, which then sends no
  `prompt` key. The request types widen to `prompt?: string`; the schema
  and the pre-fetch guard still require a prompt for text-to-video and
  reference-only requests (ac-dlb6li).
- The 7-reference-image cap and the 10-second reference duration cap now
  apply to the grok-imagine-video family, the bare id and its dated
  snapshots (`isXaiGrokImagineVideoLegacyModel`), instead of the bare id
  only. A model-less request with references, `last_frame` or `keyframes`
  defaults to grok-imagine-video-1.5; other model-less requests keep the
  -preview default (ac-dlb6li).
- **Breaking:** the six paid image and video rows (`v1.images.generations`,
  `v1.images.edits`, `v1.videos.generations`,
  `v1.videos.generations.imageToVideo`, `v1.videos.edits` and
  `v1.videos.extensions`) now dispatch when `createXai` is built without
  `paygate`. `paygate: { secret }` arms the OTP gate, whose behavior is
  unchanged. An OTP passed to a provider built without `paygate` throws
  `PayGateError` `paygate-not-configured`, and an empty secret still fails
  closed. Migration: if you relied on paid calls failing closed by default,
  pass `paygate: { secret }`.

### Deprecated

- `XAI_GROK_IMAGINE_IMAGE_QUALITY` (from `@apicity/xai/zod`). xAI retired
  the `grok-imagine-image-quality` slug on 2026-11-02. The slug still
  resolves: `grok-imagine-image-2.0` serves it with `quality: "low"` and
  bills it at the 2.0 low rate, so the constant stays exported. Name
  `grok-imagine-image-2.0` and pass `quality` instead. The README's Imagine
  Files example now does that (ac-3h5kfe).

### Fixed

- `v1.videos.generations` refuses `reference_images` and
  `reference_image_file_ids` on `grok-imagine-video-1.5-lite` and its
  snapshots. `collectXaiVideoReferenceIssues` reports an `"image-model"`
  issue on path `["model"]`, so both the schema and the pre-fetch guard
  fail the request before any billing. The lite model page lists text and
  image to video only. `isXaiGrokImagineVideo15LiteModel` names the lite
  family, so a future docs change is a one-line reversal. No probe was sent
  (ac-p5g552).

- `reference_audios` on `v1.videos.generations` refuses
  `grok-imagine-video-1.5-lite`. `isXaiGrokImagineVideo15Model` matched it
  by its `grok-imagine-video-1.5-` prefix, so the schema guard and the
  pre-fetch check let a lite request carry voices. xAI documents
  `reference_audios` on grok-imagine-video-1.5 only, and the lite model
  page lists text and image to video. The predicate now leaves lite and its
  snapshots out of the 1.5 family; 1.5, its `-preview` alias and its dated
  snapshots still pass. No probe was sent: a lite request that parses can
  generate and bill (ac-kfekq8).

- Published `.d.ts` files give every relative import an explicit `.js`
  extension, including the 2 inline `import("./x")` types, so a
  `moduleResolution: node16` or `nodenext` consumer with `skipLibCheck: false`
  no longer gets TS2835 from them (ac-0su9ax).

## [0.1.0] - 2026-05-16

### Added

- Initial release.
