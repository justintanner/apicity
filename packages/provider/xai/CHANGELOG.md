# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

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

- **Breaking:** the six paid image and video rows (`v1.images.generations`,
  `v1.images.edits`, `v1.videos.generations`,
  `v1.videos.generations.imageToVideo`, `v1.videos.edits` and
  `v1.videos.extensions`) now dispatch when `createXai` is built without
  `paygate`. `paygate: { secret }` arms the OTP gate, whose behavior is
  unchanged. An OTP passed to a provider built without `paygate` throws
  `PayGateError` `paygate-not-configured`, and an empty secret still fails
  closed. Migration: if you relied on paid calls failing closed by default,
  pass `paygate: { secret }`.

### Fixed

- Published `.d.ts` files give every relative import an explicit `.js`
  extension, including the 2 inline `import("./x")` types, so a
  `moduleResolution: node16` or `nodenext` consumer with `skipLibCheck: false`
  no longer gets TS2835 from them (ac-0su9ax).

## [0.1.0] - 2026-05-16

### Added

- Initial release.
