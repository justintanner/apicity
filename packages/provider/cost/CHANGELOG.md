# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- KIE HappyHorse 1.1 bundled per-second pricing for text-to-video,
  image-to-video, and reference-to-video modes.
- `CostHints.durationSeconds`, a pricing-only channel for media requests whose
  wire schema does not carry the output duration.
- Static Fal pricing for video plus the remaining supported edit/image
  endpoints.
- Alibaba `wan2.7-image` and KIE `nano-banana` per-image pricing.

### Changed

- **Breaking:** `dispatchWithPaidGate` and `withPaidGate` make the pay gate
  opt-in. With no config (a provider built without `paygate`), a paid endpoint
  now dispatches. A config with a non-empty `secret` arms the OTP gate, whose
  behavior is unchanged. An OTP presented to an unarmed gate throws
  `PayGateError` `paygate-not-configured` without dispatching, and a config
  whose `secret` is empty still fails closed with that code. `PayGateError`
  keeps its seven codes, and `PAID_ENDPOINTS` does not change. Migration: if
  you relied on paid endpoints failing closed when no config was passed, pass
  `{ secret }`.

### Fixed

- KIE `qwen/image-to-image` estimates $0.02 per call from its live per-image
  rate (4 credits) instead of returning $0 with a "could not derive units"
  warning. KIE moved the model from per-megapixel to per-image billing after
  the 2026-09-11 pricing pull, and its schema has no size field.
- Fal per-megapixel estimates count a megapixel as 1024 x 1024 = 1,048,576
  pixels, the unit fal bills, instead of 1,000,000, so a 1024x1024 image is 1
  megapixel, not 2. `fal-ai/flux/dev`, `fal-ai/flux/schnell` and
  `fal-ai/qwen-image` still round each image up to a whole megapixel.
  `fal-ai/hunyuan-image/v3/instruct/edit` and `fal-ai/qwen-image-edit` publish
  no rounding rule, so they price only sizes that are a whole number of
  megapixels and warn for any other size.
- Fal per-megapixel estimates now resolve documented endpoint defaults
  explicitly and warn when no fixed default is published.
- Kling 3.0 video estimates select the sound rate when `multi_shots: true`
  promotes an omitted `sound` field.

## [0.1.0] - 2026-05-16

### Added

- Initial release.
