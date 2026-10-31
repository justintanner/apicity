# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Added xAI rates for `grok-imagine-image-2.0` ($0.04 per image) and `grok-imagine-video-1.5-lite` ($0.02 per second) from docs.x.ai/developers/pricing, with the slugs `grokimgi2p0` and `grok15lt`. The $0.04 is the published low-quality rate; a request served at medium quality (`quality: "medium"`, or an edit at the default `auto`) keeps it and warns that the estimate is a floor, since xAI publishes no medium rate. All xAI Imagine rates now cite the pricing page as of 2026-10-31. The xAI row of the `t2i` Grok Imagine Image 2.0 frontier entry drops its `"unpriced"` pricingKey and prices at 0.04 USD/generation (ac-bf3zo7).

- Added `alibaba/happy-horse/reference-to-video` pricing: $0.14/s at 720p and $0.28/s at 1080p on the requested seconds. The recorded 3 s 720p call with one reference billed 3 units, $0.42 (ac-qy2sr1).

- Added `alibaba/happy-horse/image-to-video` pricing: $0.14/s at 720p and $0.28/s at 1080p on the requested seconds. The recorded 3 s 720p call billed 3 units, $0.42 (ac-leydts).

- Added `alibaba/happy-horse/text-to-video` pricing: $0.14/s at 720p and $0.28/s at 1080p on the requested seconds. The recorded 3 s 720p call billed 3 units, $0.42 (ac-4eryzy).

- Added `alibaba/happy-horse/video-edit` pricing: $0.14 per input second plus $0.14 per output second at 720p ($0.28 each at 1080p), on the source length passed as `costHints.durationSeconds`. The recorded 3 s 720p edit billed 6 units, $0.84. A source over 15 s fails closed, since fal truncates it and does not say whether the rest bills. `frontier("v2v")` lists it on HappyHorse-1.0 beside KIE's `happyhorse/video-edit` (ac-5zdfnw).

- Added `minimax/h3-max-turbo/reference-to-video` to `FAL_DYNAMIC_PRICING_ENDPOINTS` with the display name "H3 Max Turbo Reference To Video": it bills output seconds plus reference tokens beyond the 4,096 included, which no request field determines, like H3 Max reference-to-video. The recorded 2 s 480P call billed 2 units, $0.10. `frontier("r2v")` lists it on MiniMax H3 Max beside H3 Max reference-to-video (ac-88n2cz).

- Added Seedance 2.5 US draft completion pricing from the draft's `durationSeconds` and `aspectRatio` hints, at the 2.5 completion's billed $0.0234116 per 1K 1080p tokens: the US card repeats the 2.5 card, and no US completion is billed yet (ac-jjngde).

- Added MachGen SHARPEN pricing for MiniMax-H3: the pricebook's 0.015 USD/s at 480p and 0.066 USD/s at 768p on the source's seconds (`costHints.inputDurationSeconds`); MachGen's quote bills the source's height and length whatever the request says. The `video_config.sharpen` warning now names those rates, and MachGen's MiniMax-H3 frontier price range starts at 0.015 USD/s (ac-xug9gr).

- Added MachGen T2I/I2I schemas for five frontier image models and size/quality-aware public-pricebook estimates (ac-qu8m4t).

- Added Kling O3 Pro video-to-video reference with output duration/aspect controls and per-second pricing (ac-hpnzx5).

- Added Kling O3 Pro video editing with reference images/elements and duration-hinted pricing (ac-uxyuke).

- Added Kling O3 Pro reference-to-video with reference images, elements, and audio-dependent pricing (ac-r2l24g).

- Added Kling O3 Pro image-to-video with optional end frames, multi-shot prompts, and audio-dependent pricing (ac-cg2abc).

- Added Kling O3 Pro text-to-video with three-to-fifteen-second durations and audio-dependent pricing (ac-yjtof3).

- Added fal GPT Image 2 editing as a child of the existing callable, with reference images, optional mask, and dynamic token-pricing metadata (ac-613okl).

- Added fal GPT Image 2 text-to-image with image size validation and explicit dynamic token-pricing metadata (ac-5mij8c).

- Added FLUX 3 draft enhancement from a reusable cache, with $0.29/second pricing based on a duration cost hint (ac-9secmm).

- Added FLUX 3 extend-video draft with source-video input, optional draft cache, and $0.12/second pricing. Automatic duration requires a cost hint (ac-uct816).

- Added FLUX 3 keyframes-to-video draft with keyframe position validation, a five-second default, optional draft cache, and $0.06/second pricing (ac-dma2rd).

- Added FLUX 3 first/last-frame draft with required boundary images, a five-second default, optional draft cache, and $0.06/second pricing (ac-46jtsg).

- Added FLUX 3 image-to-video draft at `run.blackforestlabs.flux3.imageToVideo.draft`, with an opening-image request schema, optional draft cache, and $0.06/second pricing. Automatic duration requires a cost hint (ac-bgxlr1).

- Added FLUX 3 text-to-video draft at `run.blackforestlabs.flux3.textToVideo.draft`, with a request schema, optional draft-cache response, and $0.06/second pricing. Automatic duration requires a cost hint (ac-81wixr).

- Added MiniMax H3 reference-to-video LoRA at `run.minimax.h3.referenceToVideo.lora`, with request schema, reference limits, and per-second pricing by resolution ($0.0625/s at 480P; five seconds costs $0.3125) (ac-o2h6c6).

- MiniMax H3 image-to-video LoRA (`minimax/h3/image-to-video/lora`, slug `h3i2vl`) pricing from the 2026-10-29 llms card. Same per-second rates as the text-to-video LoRA: $0.0625 at 480P, $0.075 at 768P, $0.1625 at 2K (the default), and $0.20 at 4K. Duration defaults to 5 seconds. The recording uses duration 5 and resolution 480P. The usage API billed 5 seconds ($0.3125) (ac-jhn0kn).

- MiniMax H3 text-to-video LoRA (`minimax/h3/text-to-video/lora`, slug `h3t2vl`) pricing from the 2026-10-29 llms card. $0.0625 per second at 480P, $0.075 at 768P, $0.1625 at 2K (the default), and $0.20 at 4K. Duration defaults to 5 seconds. The recording uses duration 5 and resolution 480P. The usage API billed 5 seconds ($0.3125) (ac-wulsa2).

- MiniMax H3 reference-to-video-audio trainer (`minimax/h3/ref2va/trainer`, slug `h3ref2vt`) pricing from the 2026-10-29 pricing API. $0.015 per `number_of_steps` (range 1–15000, default 2000). The estimator floors at 100 steps. The steps=1 recording billed 100 steps ($1.50). Each billed step counts as one generation (ac-tarrln).

- MiniMax H3 first-last-frame trainer (`minimax/h3/flf2v/trainer`, slug `h3flf2vt`) pricing from the 2026-10-29 pricing API. $0.01 per `number_of_steps` (range 1–15000, default 2000). The estimator floors at 100 steps. The steps=1 recording billed 100 steps ($1.00). Each billed step counts as one generation (ac-npoa6h).

- MiniMax H3 image-to-video trainer (`minimax/h3/i2v/trainer`, slug `h3i2vt`) pricing from the 2026-10-29 pricing API. $0.01 per `number_of_steps` (range 1–15000, default 2000). The estimator floors at 100 steps. The steps=1 recording billed 100 steps ($1.00). Each billed step counts as one generation (ac-emdulx).

- MiniMax H3 text-to-video trainer (`minimax/h3/t2v/trainer`, slug `h3t2vt`) pricing from the 2026-10-29 pricing API. $0.005 per `number_of_steps` (range 1–15000, default 2000). Each requested step counts as one generation. The steps=1 recording billed 100 steps ($0.50) (ac-h8q5j7).

- Krea 3 text-to-image (`krea/v3/text-to-image`, slug `krea3`) pricing from the 2026-10-29 queue OpenAPI. low and medium are $0.025 per output megapixel. There is no reference input. The 1024x1024 recording billed 1.0 megapixels ($0.025). auto or an omitted size stays unpriced (ac-uy20rg).

- Krea 3 edit (`krea/v3/edit`, slug `krea3`) pricing from the 2026-10-29
  queue OpenAPI. low and medium are $0.025 per megapixel of the output plus
  each reference. References are counted at the output size, the card's
  maximum when their pixels are absent, and the estimate warns that a
  smaller reference bills less. high adds $0.125. ultra is flat by
  reference count ($0.27 / $0.30 / $0.32 / $0.35 for 1–4, then $0.0275
  each) and ignores `image_size`. auto or an omitted size stays unpriced
  on the non-ultra tiers (ac-t85sor).

- ElevenLabs Scribe speech-to-text pricing, verified 2026-10-29 against
  https://elevenlabs.io/pricing/api. `scribe_v2` and `scribe_v2_medical` are
  $0.22/hour and `scribe_v2_realtime` is $0.39/hour, stored per second as
  the hourly list price / 3600. The audio length is not in the request;
  pass `costHints.durationSeconds`. An omitted or non-positive hint stays
  unpriced with the missing-units warning. Keyterm prompting and transcript
  editing are separate add-ons and are not included. `scribe_v1` is not on
  this card. `MODEL_SLUGS.elevenlabs` adds `scribe2` (shared with fal's
  Scribe v2), `scribe2m` and `scribe2rt` (ac-yurrdi).

- `resolveMachGenUpscaleEstimate(payload, quote, { hints })` prices the MachGen upscales the bundled table cannot, such as the four Topaz upscalers, whose vendor credits depend on the source. It asks MachGen's free quote, passed in as `machgen.api.v0.upscale.quote`, so the package still imports no provider and does no I/O of its own, and returns the quote's `cost_micros` in USD with `rateAsOf: null`. Every other request, MiniMax-H3's upscale included, falls through to `computeEstimate` with no network call, and a failed or malformed quote degrades to the local `usd: 0` with a warning. `isMachGenQuotePriced` tells which requests ask the quote. MachGen's REST docs do not list the quote endpoint (read 2026-10-26), so MachGen may change it without notice. The recorded Topaz upscale billed exactly its quote (ac-23mccw).

- MachGen pricing for the T2V-only models Veo 3.1 (0.471 USD/s at 720p and 1080p, 0.706 at 2160p), Veo 3.1 Fast (0.118, 0.142 and 0.353) and Grok Imagine Video (0.059 at 480p, 0.083 at 720p), verified 2026-10-25 against the public pricebook. Veo 3.1's audio is always on, and each model has one rate per height. `MODEL_SLUGS.machgen` reuses `veo3p1` (fal), `veo3p1f` (googleflow) and `grokimgv` (xai). Three recorded T2V clips billed exactly their estimates, 2.415 USD gross: Veo 3.1 at 720p for 4 s (1.884), Veo 3.1 Fast at 720p for 4 s (0.472) and Grok Imagine Video at 480p for 1 s (0.059) (ac-5qfga3).

- MachGen video-to-video pricing, verified 2026-10-25 against MachGen's public pricebook (`GET https://api.machgen.ai/api/v0/billing/pricebook/public`, the exact-micros feed behind https://www.machgen.ai/pricing). R2V is priced on all 16 R2V models, 11 of them new: Vidu Q3 Turbo, Vidu Q3 Pro, MiniMax H3 Turbo, Seedance 2.0 Fast and Mini, Vidu Q4 Preview, PixVerse V6 and C1, HappyHorse 1.0, Kling 3.0 Omni (also T2V; audio on and off apart, so it needs `video_config.audio`) and Vidu Q3. A reference video's seconds now bill on top of the output on every model that takes one, not only on Seedance 2.5 and 2.0 and MiniMax H3: MachGen's docs say what remains after `reference_video_start_secs` "is what is billed", and receipts confirm it on Seedance 2.0 Fast and Mini, MiniMax H3 Turbo and Wan 3.0. Pass `costHints.inputDurationSeconds` with those seconds. Reference audio is not billed. A Seedance 2.5 edit renders, and bills, its source's length, which it takes from the same hint. UPSCALE is priced on MiniMax H3 (the source's seconds in and out at 0.05 USD/s, from `costHints.inputDurationSeconds`). The Topaz upscalers bill vendor credits that depend on the source and fail closed, as does Vidu Upscale Pro, which is on the pricebook but answered HTTP 500 to every upscale and quote on 2026-10-25. `MODEL_SLUGS.machgen` adds `klingo3` (the kie slug) and `viduq3`. 22 recorded tasks billed 4.662 USD gross, each exactly its estimate, or for the Topaz upscale exactly MachGen's quote; the Wan 3.0 one, a 4 s reference with 2 s out at 480p (294000 micros), showed that Wan's single rate bills the reference too. Three probes MachGen accepted by mistake billed another 0.60 USD (ac-ks4no2).

- MachGen pricing for every image-to-video model in MachGen's models table, verified 2026-10-25 against https://www.machgen.ai/pricing. Adds Wan 2.2 A14B, LTX 2.3 Pro, Vidu Q3 Turbo, Vidu Q3 Pro, MiniMax H3 Turbo, Seedance 2.0 Fast and Mini, Kling 3.0, Vidu Q4 Preview, Vidu Q3 Pro Fast, PixVerse V6 and C1, and HappyHorse 1.0, each priced for T2V and I2V. Vidu Q3 Turbo bills its duration bands one band at a time. Kling 3.0 and PixVerse take an audio selector and fail closed without `video_config.audio`. The new models' R2V and input-video tiers fail closed. The MachGen cost-tier policy is now `expensive`. `MODEL_SLUGS.machgen` reuses the kie slug of each model kie also sells and adds `ltx2p3p`, `viduq3t`, `viduq3p`, `mmh3t`, `viduq3pf` and `pixc1`. 22 recorded tasks billed exactly their estimate. One receipt corrects an existing rate: MiniMax H3 I2V with an end frame now prices at the Image to Video rate it billed (0.035 USD/s at 480p), not the Frame to Frame rate (0.05), which applies to R2V only. Other existing MachGen rates are unchanged; their `source.asOf` is now 2026-10-25 (ac-fs70lj).

- KIE `grok-imagine-video-1-5-preview` 1080p pricing at $0.04/s (8
  credits). The pricing feed lists only 480p and 720p for this model. The
  rate is the third tier of the https://kie.ai/grok-imagine-video-1.5
  pricingDesc, printed as a second "720p" entry, and a recorded 1 s 1080p
  generation billed 8 credits. A 1080p estimate used to return $0 with a
  warning. The entry's `source.asOf` is now 2026-10-25 (ac-0039hv).

- `frontier()` rows carry `price`: the min and max of a bundled per-unit rate (`{ unit, min, max, asOf, url }`), `{ unit: "dynamic" }` for a fal endpoint priced from billed units, or `null` when the row is unpriced or token-priced. No rate changed.

- MachGen video pricing for six frontier models, per-second gross rates, graduated H3 pricing and input-video duration hints. Rates verified 2026-10-22 against https://www.machgen.ai/pricing; shared model slugs and display names.

- KIE `gpt-6-1-sol` token pricing, verified 2026-10-22 against
  https://kie.ai/gpt-6-1-sol: $0.60 input, $0.03 cached input, $0.75 cache
  writes and $3.00 output per million tokens. Counts are declared.
  `inputTokens` is the total; the cache counts are subsets and are required.
  `MODEL_SLUGS.kie` adds `gpt6p1sol` and `MODEL_DISPLAY.kie` "GPT-6.1 Sol"
  (ac-08tkob).
- KIE `claude-haiku-5-5` token pricing, verified 2026-10-22 against
  https://kie.ai/claude-haiku-5-5: $0.06 input and $0.30 output per million
  tokens, from declared counts. The card publishes no cache rate.
  `MODEL_SLUGS.kie` adds `haiku5p5` and `MODEL_DISPLAY.kie`
  "Claude Haiku 5.5" (ac-08tkob).

- Added FLUX 3 Max text-to-video pricing (ac-h9hyir).
- Added FLUX 3 Max image-to-video pricing (ac-h9hyir).
- Added FLUX 3 Max keyframes-to-video pricing (ac-h9hyir).

- `gpt-realtime-2.1` pricing per token modality, verified 2026-10-19 against
  OpenAI's pricing page: text $4 input, $0.40 cached input and $24 output;
  audio $32, $0.40 and $64; image $5 and $0.50, input only, per million
  tokens. The model is priced only from a declared Realtime usage, never at
  one flat rate. `MODEL_SLUGS.openai` adds `gptrt2p1` and
  `MODEL_DISPLAY.openai` "GPT Realtime 2.1" (ac-ow167y).
- Declared per-modality usage: `costHints.audioInputTokens`,
  `imageInputTokens`, `cacheReadAudioInputTokens`,
  `cacheReadImageInputTokens` and `audioOutputTokens`, which are subsets of
  the declared totals, with text as the remainder. A missing modality count
  or an inconsistent partition fails closed. `TokenPricing.modalityRates`
  and the exported `ModalityRate` carry the audio and image rates, and
  `CostBreakdown.modalities` (`CostModalityBreakdown`) reports each
  modality's counts and rates (ac-ow167y).

- `gpt-5.6-sol` pricing, verified 2026-10-19 against OpenAI's pricing page:
  Standard processing at $4 input, $0.40 cached input, $5 cache writes and
  $20 output per million tokens, and $8 / $0.80 / $10 / $30 for the whole
  request above 272,000 input tokens. These are OpenAI's promotional prices,
  available at least through November 21, 2026. The model is priced only
  from declared usage. `MODEL_SLUGS.openai` adds `gpt5p6sol` and
  `MODEL_DISPLAY.openai` "GPT-5.6 Sol" (ac-0y875w).
- Declared OpenAI usage: `costHints.cacheReadInputTokens` and
  `cacheWriteInputTokens`, the cached and cache-write subsets of
  `inputTokens`; `costHints.serviceTier`, the response's `service_tier`; and
  `costHints.regionalProcessing`. Only Standard processing on global
  endpoints is priced. Any other tier, regional processing, a missing or
  non-integer count, or cache subsets larger than `inputTokens` return
  `usd: 0` with a warning and no rate. `CostBreakdown` reports the cache
  counts and rates and a `contextTier`, and `TokenPricing` gains an exported
  `TokenRate`, a retention-agnostic `rate.cacheWrite` and an optional
  `longContext` tier (ac-0y875w).

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
- An offline test and a README note pin xAI `grok-voice-think-fast-2.0` as
  deliberately unpriced. xAI's primary pages list no rate for that id, and
  the voice rates they do list ($0.08 per minute plus $0.004 per text input)
  name no clock, rounding or text-input unit. A reported
  `cost_in_usd_ticks` is the actual charge and is never added to an
  estimate (ac-kvmsvg).

### Changed

- Frontier video list prices re-read 2026-10-29 from fal.ai cards and
  MachGen's public pricebook. MachGen Seedance 2.5 is now
  0.1028/0.23112/0.56862 USD/s (video input 0.061488/0.13824/0.3402) and
  Seedance 2.0 is 0.070308/0.1512/0.37422/0.7776 (video input
  0.043189/0.09288/0.22842/0.46656); their `source` is the pricebook URL
  dated 2026-10-29. fal Wan 3.0 base is 0.05/0.10/0.20 USD/s, Wan 3.0 Prime
  is 0.068/0.14/0.28, Wan 2.7 edit-video is 0.10 at 720p and 0.15 at 1080p,
  and FLUX 3 text-to-video and image-to-video add 0.32 at 1440p and 0.47 at
  2160p. HeyGen video, MiniMax H3 Max and H3 Max Turbo text-to-video and
  image-to-video use the promo rates through 2026-10-31. MiniMax H3 and
  Grok Imagine Video 1.5 reference-to-video are now static card rates.
  Recorded MachGen Seedance receipts stay the 2026-10-25 bills (ac-tk5037).
- `computeEstimate`'s openai route reads `costHints.inputTokens` and
  `outputTokens`, which it used to ignore. Declaring any token count prices
  the declared usage (`source: "declared-tokens+table"`) instead of the
  chars/4 heuristic, and a missing or invalid count now fails closed. Without
  declared counts every existing openai estimate is unchanged (ac-0y875w).
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

- xAI Grok Imagine estimates match what xAI bills, from the `usage.cost_in_usd_ticks` of nine recorded calls (0.62 USD in total) in `tests/integration/xai-imagine-billing.test.ts`, which pins each bill to its estimate. An image edit adds each input image through the `extra` hook, once per request, whatever `n`, quality, output resolution or input size: 0.002 USD on `grok-imagine-image` and 0.01 USD on `grok-imagine-image-2.0`. `image_file_id` and `image_file_ids` count as `image` and `images`. `grok-imagine-image-2.0` selects on the served quality and on the resolution (default 1k), from the `pricing` grid of `GET /v1/image-generation-models`, read 2026-10-31: low 0.04, 0.05 and 0.06 USD and medium 0.06, 0.07 and 0.08 USD at 1k, 1.5k and 2k. `auto` serves low for a generation and medium for an edit. The medium floor warning is gone, and `quality: "high"`, which has no listed price, fails closed. The video entries select on `resolution` (default 480p). The page's figure is the 480p rate, and `grok-imagine-video-1.5` (and its preview id) bills 0.14 USD/s at 720p. No 720p rate is known for `grok-imagine-video` or `grok-imagine-video-1.5-lite`, so 720p keeps the 480p rate and warns that it is a floor. A request with a source video (an edit or extension keeps the source's resolution) warns the same way, and 1080p fails closed (ac-k7qv4n).

- `frontier("t2i")` and `frontier("i2i")` list OpenAI on every GPT Image
  row: `v1.images.generations` (t2i) and `v1.images.edits` (i2i) with model
  ids `gpt-image-2.5-sunburst`, `gpt-image-2.5-flare` and `gpt-image-2`, plus
  `gpt-image-1.5` on t2i. Each model page on developers.openai.com marks
  both calls supported (read 2026-10-31). The rows are `"unpriced"`, because
  `PRICING.openai` has no image rate yet (ac-57h4kb).
- `bytedance/seedance-2.5/us/text-to-video` and
  `bytedance/seedance-2.5/us/reference-to-video` price `draft: true` at
  480p, like the non-US 2.5 leaves, instead of at the requested resolution
  (`draftFlag`). `bytedance/seedance-2.5/us/image-to-video` stays dynamic
  (ac-8wmej3).
- `frontier("t2i")` maps GPT Image 1.5 (high), rank 9, to fal
  `gptImage1p5` with pricingKey `fal-ai/gpt-image-1.5`, beside the KIE
  `gpt-image/1.5-text-to-image` id. The fal leaf's endpoint-docs row named
  `api.fal.ai/v1`, whose path did not match the pricing key; it now names
  `fal.run` (ac-annrf9).
- `frontier()` lists the endpoints shipped since the 2026-10-22 capture.
  `i2i` maps Krea 3 (Ultra) to fal `krea.v3.edit`, so 8 of its 10 models are
  mapped (was 7). GPT Image 2 (high) adds fal `openai.gptImage2` on `t2i` and
  `openai.gptImage2.edit` on `i2i`, and Kling 3.0 Omni 1080p (Pro) on `v2v`
  adds fal `klingVideo.o3.pro.videoToVideo.edit` and
  `klingVideo.o3.pro.videoToVideo.reference`. MachGen `api.v0.generate` joins
  the GPT Image 2.5 Sunburst, GPT Image 2.5 Flare, GPT Image 2 and Nano Banana
  2.1 rows of both image types and the Nano Banana 2 row of `t2i`. `t2i` also
  lists xAI `v1.images.generations` (`grok-imagine-image-2.0`) and Google
  `v1.publishers.google.models.generateContent` (`gemini-3.1-flash-image`),
  both with pricingKey `"unpriced"` until the bundled tables have a rate
  (ac-0hjfmt).
- `frontier("i2v")` names the model on the xAI Grok Imagine Video 1.5 row:
  it is the shared `v1.videos.generations` call with `modelId`
  `grok-imagine-video-1.5`, as on `r2v`, instead of the
  `v1.videos.generations.imageToVideo` leaf with no model id. A
  `provider:modelId` id is now `xai:grok-imagine-video-1.5`. xAI lists the
  leaf's `grok-imagine-video-1.5-preview` as an alias of that id, and the
  price is unchanged at 0.08 USD/s (ac-dp27py).
- KIE declared-token estimates (`google/gemini-2-5-pro-tts` and
  `google/gemini-3-1-flash-tts`) reject NaN, negative, fractional and
  non-number `costHints` token counts. An invalid count fails closed with
  `usd: 0`, no rate in the breakdown, and a warning that the field must be a
  non-negative integer. A count of `0` still prices at the published rates
  (ac-wunvff).
- Published `.d.ts` files give every relative import an explicit `.js`
  extension, including the 10 inline `import("./x")` types and the two
  `pricing/` `from "../types"` clauses, so a `moduleResolution: node16` or
  `nodenext` consumer with `skipLibCheck: false` no longer gets TS2835 from
  them (ac-0su9ax).

- fal Seedance 2.5 prices 1080p at the billed $0.0234116 per 1000 tokens
  (0.0214 x 1.094) instead of the card's rounded "roughly $0.0234", for
  `bytedance/seedance-2.5/text-to-video`,
  `bytedance/seedance-2.5/reference-to-video` and
  `bytedance/seedance-2.5/draft/complete`. The first billed 1080p call, a 1:1
  4 s draft completion, billed 214.88895 units = 196.425 formula units x
  1.094 ($4.59862353); the old rate put it at $4.596345, 0.05% low. The US
  twins keep their card rate, since no US 1080p call is recorded
  (ac-i5zo6h).
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
