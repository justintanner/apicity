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

- **Breaking:** fal Seedance 2.0, 2.0 Fast and 2.5
  (`bytedance/seedance-2.0/{text,image,reference}-to-video`,
  `bytedance/seedance-2.0/fast/{text,image,reference}-to-video` and
  `bytedance/seedance-2.5/{text,image,reference}-to-video`) are priced
  dynamically, like their US twins. fal bills 1000-token units of the output
  file (width x height x frames / 1024 in every committed recording), whose
  dimensions no request field fixes under the default `aspect_ratio: "auto"`,
  and reference-to-video with video inputs also bills the input clips. The
  static per-second rates assumed 16:9 output and 24 frames per requested
  second: they put a recorded 38.8-unit call at 38.88 units and a 46.32-unit
  reference-to-video call at 23.328. `computeEstimate` now returns `usd: 0`
  with the warning that names `POST /v1/models/pricing/estimate`, and
  `resolveFalDynamicEstimate` asks fal for these ids. The nine ids leave
  `PRICING.fal`, `MODEL_SLUGS.fal` and `MODEL_DISPLAY.fal`, so
  `modelSlug("fal", id)` and `modelDisplay("fal", id)` no longer accept them;
  the kie ids keep the `sd2`, `sd2f` and `sd2p5` slugs. Migration: pass
  `fal.v1.models.pricing.estimate` (with `FAL_ADMIN_API_KEY`) to
  `resolveFalDynamicEstimate`, or read the billed units from the
  `x-fal-billable-units` response header.
- KIE `qwen/text-to-image` and `qwen/image-edit` are priced per image from a
  table keyed by `input.image_size`, not per megapixel. KIE charges a fixed
  credit amount per preset at submission: text-to-image costs 1, 5, 3, 2, 3
  and 2 credits for `square`, `square_hd`, `portrait_4_3`, `portrait_16_9`,
  `landscape_4_3` and `landscape_16_9`, and image-edit costs 2, 7, 5, 4, 5 and
  4 ($0.005 per credit). Each cell comes from a billed recording. Estimates
  fall at every preset; for example, text-to-image `square_hd` drops from
  $0.04 to $0.025. A text-to-image payload without `image_size` now warns
  "missing required selector(s): image_size". Image-edit still defaults to
  `landscape_4_3` and multiplies by `num_images`.
- KIE `qwen/text-to-image` no longer prices an absent `input.image_size` as
  `square_hd` ($0.04). KIE dropped that documented default, so such a payload
  now returns $0 with a "could not derive units" warning. An explicit preset
  prices as before.
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
