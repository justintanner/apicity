# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Deprecated

- `inference.v1.audio.transcriptions` and its `.streaming`,
  `inference.v1.audio.translations`, and `inference.v1.audio.batch.transcriptions`,
  `.translations` and `.get`, with the same methods under `post`, `get` and `ws`.
  Fireworks deprecated audio inference on 2026-06-10, gave no shutdown date, and
  no longer publishes a rate for it. On 2026-11-05 `audio-prod` answered 401 to a
  valid key on real and made-up paths alike, `audio-turbo` and the streaming host
  answered 503 with no healthy upstream, and `audio-batch` answered `submitted` to
  an empty request while the status endpoint answered 404 for the ids it issued.
  Whether a real submission runs is unproven, because proving it needs a paid
  call. The methods send requests unchanged, but Fireworks may stop answering them
  without notice. Migration: Fireworks names no replacement (ac-8l1x3z).

### Removed

- **Breaking:** `inference.v1.workflows.textToImage`,
  `inference.v1.workflows.kontext` and `inference.v1.workflows.getResult`, with
  the `post` aliases, because Fireworks retired them. On 2026-11-05 a valid-key
  request with an empty body answered 404 "Model not found, inaccessible, and/or
  not deployed" on `flux-1-dev-fp8`, `flux-1-schnell-fp8`, `flux-1-schnell`,
  `flux-1-dev-controlnet-union`, `flux-kontext-pro` and `flux-kontext-max`, the
  same answer a made-up model gets. `flux-kontext-pro` answered 200 on 2026-04-16.
  Fireworks deprecated image generation on 2026-06-10. The
  `FireworksTextToImage*`, `FireworksKontext*` and `FireworksGetResult*` schemas
  and types go with them. Migration: Fireworks names no replacement. This removal
  ships in 0.27.0 (ac-8l1x3z).

## [0.1.0] - 2026-05-16

### Added

- Initial release.
