# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `MODEL_DISPLAY.fal` names every dynamically priced fal endpoint, all 67 ids
  in `FAL_DYNAMIC_PRICING_ENDPOINTS`; for example `google/nano-banana-2.1` is
  "Nano Banana 2.1" and `fal-ai/kandinsky6-pro/text-to-video` is "Kandinsky 6.0
  Pro". These rows are display-only: a dynamic id still has no `MODEL_SLUGS`
  entry and no `PRICING.fal` rate. `modelDisplay` accepts them, because its
  `model` parameter is now `SlugModelId<P> | DisplayModelId<P>`, and
  `DisplayModelId` is exported; `modelSlug` still rejects them. Every
  `FAL_ENDPOINT_REQUEST_SCHEMAS` key now has a display name (ac-j3d6ki.6).
- `costHints.googleFlowPlan` accepts `"plus"` (Google AI Plus, $7.99/mo for
  200 credits, $0.04 per credit) and `"ultra-99"` (Google AI Ultra $99,
  $99.99/mo for 10,000 credits, $0.01 per credit), beside `"pro"` and
  `"ultra"` (Ultra $199), which keep their meaning. Plus pays the non-Ultra
  credit costs and Ultra $99 the halved Ultra Veo Lite and Fast costs, so
  `veo-3.1-fast` is $0.80 on Plus and $0.10 on Ultra $99. Both used to fall
  back to the Pro basis with an unknown-tier warning. An omitted plan still
  prices on Pro, which under-estimates a Plus account by half (ac-1zjd41).
- `CostHints.aspectRatio`, an optional cost-only hint carrying a fal
  Seedance 2.5 draft's fixed aspect ratio (`"21:9"`, `"16:9"`, `"4:3"`,
  `"1:1"`, `"3:4"` or `"9:16"`) for `bytedance/seedance-2.5/draft/complete`,
  whose request carries only the `draft_id`. `"auto"` or any other value
  counts as absent (ac-j3d6ki.3).
- Google Flow image pricing for the `POST /images` models `nano-banana-2-lite`,
  `nano-banana-2`, `nano-banana-pro` and the deprecated aliases `nano-banana`
  and `imagen-4`. Flow includes image generation in every plan, so each image
  is 0 credits on both the `pro` and `ultra` tiers and `computeEstimate`
  returns `usd: 0` with no warning, where it used to warn that the model was
  not in the pricing table. `count` (1-4) defaults to 4 images.
  `MODEL_SLUGS.googleflow` and `MODEL_DISPLAY.googleflow` add the five ids,
  named for the model each one runs: `nano-banana-2` and its `nano-banana`
  alias run Nano Banana 2.1 (`nb21`), and `imagen-4` runs Nano Banana 2 Lite
  (`nb2l`) (ac-j3d6ki.5).
- KIE HappyHorse 1.1 bundled per-second pricing for text-to-video,
  image-to-video, and reference-to-video modes.
- `CostHints.durationSeconds`, a pricing-only channel for media requests whose
  wire schema does not carry the output duration.
- Static Fal pricing for video plus the remaining supported edit/image
  endpoints.
- Alibaba `wan2.7-image` and KIE `nano-banana` per-image pricing.

### Changed

- `computeEstimate`'s warning for ten dynamically priced fal endpoints names
  the billed unit and why the request cannot fix it, instead of the generic
  "compute seconds, delivered output metadata, or tokens" list. The endpoints
  are `google/nano-banana-2.1` and its edit (token-billed units of $1),
  `fal-ai/flux-2-flex` (processed megapixels), the four
  `fal-ai/kandinsky6-{lite,pro}/{text,image}-to-video` endpoints (compute
  units), `fal-ai/kandinsky6-vsr` and its lite (output megapixel-frames) and
  `mirelo-ai/sfx2.0/video-to-video` (output seconds with an unpublished
  rounding). Their cards, OpenAPIs and pricing-API rows were re-read on
  2026-10-17 and are unchanged, and each recorded bill shows the request
  cannot fix the quantity, so all ten stay dynamic (ac-j3d6ki.4).
- The five `minimax/h3-max/styles/*` fal endpoints display their own style
  instead of the shared "H3 Max Styles": "H3 Max 16-bit Pixel", "H3 Max Hand
  Drawn", "H3 Max Low Poly", "H3 Max Retro Toon 70s" and "H3 Max VHS". They
  keep the shared slug `h3mstyle`, since all five bill $0.08 per second
  (ac-j3d6ki.6).
- An unrecognized `costHints.googleFlowPlan` prices on the Plus basis
  ($0.04 per credit, the highest of the four tiers) instead of Pro, so it
  never under-charges now that Plus is modelled; the warning reads
  `googleflow: unknown plan tier '<value>', using Plus basis`. For example,
  `veo-3.1-fast` with `googleFlowPlan: "platinum"` estimates $0.80 instead of
  $0.40. An omitted plan is unchanged (ac-1zjd41).
- fal Seedance 2.0, 2.0 Fast and 2.5 are priced locally again for requests
  that fix their output: `bytedance/seedance-2.0/{text,image}-to-video`,
  `bytedance/seedance-2.0/fast/{text,image}-to-video`,
  `bytedance/seedance-2.0/us/{text,image,reference}-to-video`,
  `bytedance/seedance-2.5/{text,reference}-to-video`,
  `bytedance/seedance-2.5/us/{text,reference}-to-video` and
  `bytedance/seedance-2.5/draft/complete`. Each bills tokens of the delivered
  video, `width x height x frames / 1024` at its card's rate per 1000
  tokens. Width and height are ByteDance's published output size for the
  resolution and aspect ratio, and frames are `24 x duration + 1`. That
  formula reproduces every recorded bill (38.8, 46.32 and, on 2.0 US
  reference-to-video, which divides by 1000, 47.43168 units). A request
  needs an explicit resolution (default `720p`), a fixed `aspect_ratio` and
  a digit duration, or `costHints.durationSeconds` for duration `"auto"`.
  Reference clips need `costHints.inputDurationSeconds` (at least 4 s), and
  a completed draft needs `durationSeconds` and `aspectRatio`. Every other
  request fails closed with a warning naming the cause. The twelve ids
  return to `PRICING.fal`, `MODEL_SLUGS.fal` (`sd2`, `sd2f`, `sd2p5`, as on
  kie) and `MODEL_DISPLAY.fal`. `isFalDynamicPricingEndpoint` is now false
  for them, so `resolveFalDynamicEstimate` prices them locally without
  calling fal. This supersedes, for these twelve, the 0.15.0 change below
  that priced the family dynamically. Four ids stay dynamic:
  `bytedance/seedance-2.0/reference-to-video` and
  `bytedance/seedance-2.0/fast/reference-to-video`, which have no recording
  (and the 2.0 US twin divides by 1000 where its card says 1024), and
  `bytedance/seedance-2.5/image-to-video` and
  `bytedance/seedance-2.5/us/image-to-video`, whose output follows the input
  image's aspect (ac-j3d6ki.3).
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
  the kie ids keep the `sd2`, `sd2f` and `sd2p5` slugs. Migration: read the
  billed units from the `x-fal-billable-units` response header, and price them
  by passing them as `unitQuantity` to `resolveFalDynamicEstimate` with
  `fal.v1.models.pricing.estimate` (and `FAL_ADMIN_API_KEY`).
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

- `resolveFalDynamicEstimate` sends fal's documented estimate body, one
  quantity per endpoint, instead of the request payload. fal answered the
  payload body with HTTP 400, so the resolver had never returned a number.
  `options.unitQuantity` prices billed units (for example a finished call's
  `x-fal-billable-units`) at fal's unit price with no warning, and
  `options.callQuantity` asks for fal's historical average per call, with a
  warning that it ignores the payload. With neither, the resolver makes no
  remote call and returns the local `usd: 0` with a warning naming both
  options. The cache key is now the endpoint, the estimate type and the
  quantity, and a `keyFor` result gets the estimate type and quantity
  appended. `FalEstimator` takes fal's documented request shape, which
  `fal.v1.models.pricing.estimate` still satisfies. The `computeEstimate`
  warning for a dynamic fal id now points at `x-fal-billable-units` and
  `unitQuantity` (ac-ytg1l1).
- Google Flow `omni-flash` estimates use the credits useapi.net lists as of
  2026-10-17, about half the earlier figures. At 720p, 4 / 6 / 8 / 10 s cost
  7 / 10 / 12 / 15 credits, down from 15 / 20 / 25 / 30, and a
  video-to-video edit (`referenceVideo_1`) costs 20, down from 40. An 8 s
  request on the default `pro` tier is now $0.24 instead of $0.50. A payload
  with `resolution: "360p"` uses the 360p credits: 4 / 5 / 6 / 7, and 10 for
  an edit. 720p stays the default; any other resolution fails the estimate
  with a "no rate for variant" warning, because upstream rejects it
  (ac-yvnmf4).
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
