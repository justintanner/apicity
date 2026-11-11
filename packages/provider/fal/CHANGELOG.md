# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `run.geminiOmniFlash.v1p2.imageToVideo`
  (`POST https://fal.run/google/gemini-omni-flash/v1.2/image-to-video`) adds
  Gemini Omni Flash 1.2 image-to-video, a leaf on the `geminiOmniFlash.v1p2`
  object. The schema follows fal's queue OpenAPI (read 2026-11-11): `prompt`
  and `image_url` (required), an optional `end_image_url`, 3 to 15 seconds
  (default 8), 360p to 4k, 16:9 or 9:16. The descriptions cap an end-frame
  interpolation at 10 seconds; unbilled 422 probes found no field-level check
  of that cap, so the schema leaves it to upstream. A recorded 3 s, 360p call
  billed `x-fal-billable-units` 3.277456 seconds (ac-4xoxb6).

- `run.bytedance.seedance2p0.mini.textToVideo`
  (`POST https://fal.run/bytedance/seedance-2.0/mini/text-to-video`) adds
  Seedance 2.0 Mini text-to-video, the last leaf on the
  `bytedance.seedance2p0.mini` object. The schema follows fal's queue OpenAPI
  (read 2026-11-11): 2.0 Fast text-to-video's request without `bitrate_mode`,
  at 480p or 720p (default 720p) and 4 to 15 seconds or `auto`. A recorded
  4 s, 480p, square call billed `x-fal-billable-units` 38.8 (ac-e1ujc0).

- `run.bytedance.seedance2p0.mini.referenceToVideo`
  (`POST https://fal.run/bytedance/seedance-2.0/mini/reference-to-video`)
  adds Seedance 2.0 Mini reference-to-video, a leaf on the
  `bytedance.seedance2p0.mini` object. The schema follows fal's queue OpenAPI
  (read 2026-11-11): 2.0 Fast reference-to-video's request without
  `bitrate_mode`, with up to 9 images, 3 videos and 3 audio files (12 files at
  most, and audio only beside an image or video). A recorded 4 s, 480p,
  square call with the owned cat photo as its reference billed
  `x-fal-billable-units` 38.8 (ac-5qsajb).

- `run.geminiOmniFlash.v1p2.textToVideo`
  (`POST https://fal.run/google/gemini-omni-flash/v1.2/text-to-video`) adds
  Gemini Omni Flash 1.2 text-to-video, #6 on the 2026-11-11 text-to-video
  board, as a leaf on the `geminiOmniFlash.v1p2` object. The schema follows
  fal's queue OpenAPI (read 2026-11-11): `prompt` (required), 3 to 15 seconds
  (default 8), 360p to 4k, 16:9 or 9:16. A recorded 3 s, 360p call billed
  `x-fal-billable-units` 3.252469 seconds (ac-c9b83v).

- `run.geminiOmniFlash.v1p2.referenceToVideo`
  (`POST https://fal.run/google/gemini-omni-flash/v1.2/reference-to-video`)
  adds Gemini Omni Flash 1.2 reference-to-video, a leaf on the
  `geminiOmniFlash.v1p2` object. The schema follows fal's queue OpenAPI (read
  2026-11-11): `prompt` (required), up to ten `image_urls` and three
  `reference_video_urls` (each up to 15 s), and 3 to 15 seconds of output
  (default 8) at 360p, 720p, 1080p or 4k in 16:9 or 9:16. A recorded 3 s,
  360p call with the owned cat photo as its reference billed
  `x-fal-billable-units` 3.401161 seconds (ac-7tfowj).

- `run.bytedance.seedance2p0.mini.imageToVideo`
  (`POST https://fal.run/bytedance/seedance-2.0/mini/image-to-video`) adds
  Seedance 2.0 Mini image-to-video. It declares the
  `bytedance.seedance2p0.mini` object beside `fast` and `us`; the Mini
  reference-to-video and text-to-video leaves join it. The schema follows
  fal's queue OpenAPI (read 2026-11-11): 2.0 Fast image-to-video's request
  without `bitrate_mode`, at 480p or 720p (default 720p) and 4 to 15 seconds
  or `auto`. A recorded 4 s, 480p, square call from the owned cat photo
  billed `x-fal-billable-units` 38.8 (ac-1b5mco).

- `run.geminiOmniFlash.v1p2.edit`
  (`POST https://fal.run/google/gemini-omni-flash/v1.2/edit`) adds Gemini Omni
  Flash 1.2 video editing, #2 on the 2026-11-11 video-editing board. It
  declares the `geminiOmniFlash.v1p2` object on the existing `geminiOmniFlash`
  callable, as `v1p1` sits; the other 1.2 leaves join it. The schema follows
  fal's queue OpenAPI (read 2026-11-11): `prompt` (up to 20,000 characters)
  and `video_url` (a source of at most 15 s) are required, and `resolution` is
  360p, 720p, 1080p or 4k (default 720p). A recorded 360p edit of fal's 5 s
  example clip billed `x-fal-billable-units` 7.137917 seconds (ac-0k5eqv).

- `run.openai.gptImage2p6.flare.textToImage`
  (`POST https://fal.run/openai/gpt-image-2.6/flare/text-to-image`) adds GPT
  Image 2.6 Flare, #3 on the 2026-11-11 text-to-image board, as a leaf on the
  `openai.gptImage2p6.flare` object. The request matches Sunburst
  text-to-image's (fal's queue OpenAPI, read 2026-11-11): `reasoning_effort`,
  `gif` and `svg` output, `frame_count` and `frame_duration_ms` for GIFs, and
  `svg_model` for SVGs, open to `gpt-<version>[-<name>]` ids. A recorded call
  at quality low, reasoning_effort low, one square JPEG billed
  `x-fal-billable-units` 0.0217 (ac-na2744).

- `run.openai.gptImage2p6.flare.edit`
  (`POST https://fal.run/openai/gpt-image-2.6/flare/edit`) adds GPT Image 2.6
  Flare editing, #2 on the 2026-11-11 image-editing board. It declares the
  `openai.gptImage2p6.flare` object, which the Flare text-to-image leaf joins
  next. The request matches Sunburst edit's (fal's queue OpenAPI, read
  2026-11-11): up to 16 `image_urls`, `mask_url`, `markup_image_url`,
  `reasoning_effort`, and `gif` output with `frame_count` and
  `frame_duration_ms` (no `svg` here). A recorded edit of the owned cat photo at
  quality low, reasoning_effort low, one image billed `x-fal-billable-units`
  0.0232 (ac-0fkzgx).

- `run.openai.gptImage2p6.sunburst.edit`
  (`POST https://fal.run/openai/gpt-image-2.6/sunburst/edit`) adds GPT Image 2.6
  Sunburst editing, #1 on the 2026-11-11 image-editing board, as a leaf on the
  `openai.gptImage2p6.sunburst` object. The schema follows fal's queue OpenAPI
  (read 2026-11-11): up to 16 `image_urls`, `mask_url`, `markup_image_url`,
  `reasoning_effort`, and `gif` output with `frame_count` and
  `frame_duration_ms` (no `svg` here). A recorded edit of the owned cat photo at
  quality low, reasoning_effort low, one image billed `x-fal-billable-units`
  0.0232 (ac-qd2l6z).

- `run.openai.gptImage2p6.sunburst.textToImage`
  (`POST https://fal.run/openai/gpt-image-2.6/sunburst/text-to-image`) adds GPT
  Image 2.6 Sunburst, #1 on the 2026-11-11 text-to-image board. The schema
  follows fal's queue OpenAPI (read 2026-11-11). Against 2.5 it adds
  `reasoning_effort` (low, medium or high; default high), `gif` and `svg`
  output, `frame_count` and `frame_duration_ms` for GIFs, and `svg_model` for
  SVGs; `svg_model` stays open to `gpt-<version>[-<name>]` ids. This child
  declares the new `openai.gptImage2p6` namespace with its `sunburst` object. A
  recorded call at quality low, reasoning_effort low, one square JPEG billed
  `x-fal-billable-units` 0.0217 (ac-pns6xz).

- `run.bytedance.seedance2p5.us.textToVideo`, `.imageToVideo` and
  `.referenceToVideo` take `draft` (boolean, default `false`), as fal's queue
  OpenAPI documents for all three (read 2026-10-31): it renders a 480p preview
  whatever `resolution` says and returns the `draft_id` that
  `run.bytedance.seedance2p5.us.draft.complete` finishes at 1080p within 14
  days. Free 422 probes confirmed fal's validator takes a boolean `draft` on
  each and refuses a string (ac-8wmej3).

- Added Happy Horse 1.0 reference-to-video (`alibaba/happy-horse/reference-to-video`) as `run.alibaba.happyHorse.referenceToVideo`: a prompt and 1 to 9 reference `image_urls` (each an http(s) URL or a data URI, as fal's validator requires, at most 10 MB), five aspect ratios, 720p or 1080p (the default), and 3 to 15 s (ac-qy2sr1).

- Added Happy Horse 1.0 image-to-video (`alibaba/happy-horse/image-to-video`) as `run.alibaba.happyHorse.imageToVideo`: a first-frame `image_url` (an http(s) URL or a data URI, as fal's validator requires, at most 10 MB), an optional prompt, 720p or 1080p (the default), and 3 to 15 s (ac-leydts).

- Added Happy Horse 1.0 text-to-video (`alibaba/happy-horse/text-to-video`) as `run.alibaba.happyHorse.textToVideo`: v1.1's text-to-video fields with five aspect ratios (16:9, 9:16, 1:1, 4:3, 3:4), 720p or 1080p (the default), and 3 to 15 s (ac-4eryzy).

- Added Happy Horse video edit (`alibaba/happy-horse/video-edit`) as `run.alibaba.happyHorse.videoEdit`: a 3-60 s source video and an edit prompt, up to 5 reference images, 720p or 1080p (the default), and `audio_setting` `auto` or `origin`. The output keeps the source's length, capped at 15 s. Media URLs must be http(s) URLs or data URIs, as fal's validator requires (ac-5zdfnw).

- Added MiniMax H3 Max Turbo reference-to-video (`minimax/h3-max-turbo/reference-to-video`) as `run.minimax.h3MaxTurbo.referenceToVideo`: up to 9 image, 3 video and 3 audio references (12 in all) or an ordered `reference_conditions` list, 480P to 1080P, 0.92 to 15 s, without H3 Max's frame fields. The response reports `reference_tokens` (ac-88n2cz).

- Added Seedance 2.5 US draft completion (`bytedance/seedance-2.5/us/draft/complete`) as `run.bytedance.seedance2p5.us.draft.complete`, the US twin of the 2.5 completion: a `draft_id`, 1080p only, and three codecs. It is recorded on fal's free validator 422 only (ac-jjngde).

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

- Added MiniMax H3 image-to-video LoRA at `run.minimax.h3.imageToVideo.lora` (`POST https://fal.run/minimax/h3/image-to-video/lora`). Promotes the existing `imageToVideo` callable and adds `.lora`. Price is $0.0625 per second at 480P ($0.075 at 768P, $0.1625 at 2K, $0.20 at 4K). The recording uses `tests/fixtures/cat1.jpg`, duration 5, and resolution 480P. fal billed 5 seconds ($0.3125) (ac-jhn0kn).

- Added MiniMax H3 text-to-video LoRA at `run.minimax.h3.textToVideo.lora` (`POST https://fal.run/minimax/h3/text-to-video/lora`). Promotes the existing `textToVideo` callable and adds `.lora`. Price is $0.0625 per second at 480P ($0.075 at 768P, $0.1625 at 2K, $0.20 at 4K). The recording uses duration 5 and resolution 480P. fal billed 5 seconds ($0.3125) (ac-wulsa2).

- Added MiniMax H3 reference-to-video-audio LoRA trainer at `run.minimax.h3.ref2va.trainer` (`POST https://fal.run/minimax/h3/ref2va/trainer`). New `ref2va` key on the existing `minimax.h3` object. Price is $0.015 per training step (default 2000), with a 100-step floor. The recording uses `number_of_steps` 1 and fal billed 100 steps ($1.50) (ac-tarrln).

- Added MiniMax H3 first-last-frame LoRA trainer at `run.minimax.h3.flf2v.trainer` (`POST https://fal.run/minimax/h3/flf2v/trainer`). New `flf2v` key on the existing `minimax.h3` object. Price is $0.01 per training step (default 2000), with a 100-step floor. The recording uses `number_of_steps` 1 and fal billed 100 steps ($1.00) (ac-npoa6h).

- Added MiniMax H3 image-to-video LoRA trainer at `run.minimax.h3.i2v.trainer` (`POST https://fal.run/minimax/h3/i2v/trainer`). New `i2v` key on the existing `minimax.h3` object. Price is $0.01 per training step (default 2000), with a 100-step floor. The recording uses `number_of_steps` 1 and fal billed 100 steps ($1.00) (ac-emdulx).

- Added MiniMax H3 text-to-video LoRA trainer at `run.minimax.h3.t2v.trainer` (`POST https://fal.run/minimax/h3/t2v/trainer`). New `t2v` key on the existing `minimax.h3` object. Price is $0.005 per training step (default 2000). The recording uses `number_of_steps` 1 and fal billed 100 steps ($0.50) (ac-h8q5j7).

- Added Krea 3 text-to-image at `run.krea.v3.textToImage` (`POST https://fal.run/krea/v3/text-to-image`), a leaf under the `krea.v3` scaffold owned by the edit endpoint. low and medium both bill $0.025 per output megapixel. The recording uses reasoning_level low and a 1024x1024 output, with no reference images, and billed 1.0 megapixels ($0.025) (ac-uy20rg).

- Added Krea 3 edit at `run.krea.v3.edit` (`POST https://fal.run/krea/v3/edit`). This bead owns the new `krea.v3` scaffold. low and medium bill $0.025 per megapixel of the output plus each reference, counted at the output size when the reference pixels are not in the payload; high adds $0.125; ultra is a flat price by reference count. The recording uses reasoning_level low, a 1024x1024 output, and one `cat1.jpg` reference, and billed 1.75 megapixels ($0.04375) because the reference is smaller than the output (ac-t85sor).

- Added FLUX 3 Klein edit-image at `run.blackforestlabs.flux3.klein.editImage`, now callable with its LoRA variant still at `.lora`; its input is the LoRA endpoint's without `loras`. Pricing is dynamic: an edit of our cat photo at 256x256 billed 0.8889 megapixels at $0.009 while the card prices images per resolution tier (ac-eahf2q).

- Added FLUX 3 Klein text-to-image at `run.blackforestlabs.flux3.klein.textToImage`, now callable with its LoRA variant still at `.lora`; its input is the LoRA endpoint's without `loras`. Pricing is dynamic: a 256x256 image billed 0.8889 megapixels at $0.009 while the card prices images per resolution tier (ac-eahf2q).

- Added FLUX 3 Klein edit-image LoRA at `run.blackforestlabs.flux3.klein.editImage.lora`, reusing the shared edit schema and recording our trained edit LoRA with the owned cat photo (ac-6dfs70).

- Added FLUX 3 Klein base edit-image LoRA at `run.blackforestlabs.flux3.klein.base.editImage.lora`, with the shared edit schema and a recording using our trained edit LoRA and owned cat photo (ac-1rn8vm).

- Added FLUX 3 Klein text-to-image LoRA at `run.blackforestlabs.flux3.klein.textToImage.lora`, reusing the shared LoRA schema and our trained cat LoRA (ac-1a7zs9).

- Added FLUX 3 Klein base text-to-image LoRA at `run.blackforestlabs.flux3.klein.base.textToImage.lora`, with shared LoRA schemas and a recorded image using our trained cat LoRA (ac-uhklr9).

- Added FLUX 3 Klein base edit trainer at `run.blackforestlabs.flux3.klein.base.trainer.edit`, preserving the callable base trainer. Pricing is dynamic because the reference-image multiplier depends on the dataset ZIP contents (ac-9uj0pi).

- Added FLUX 3 Klein base trainer at `run.blackforestlabs.flux3.klein.base.trainer`, with its shared trainer schema and a recorded 100-step training run on the owned cat photo (ac-tra7ie).

- Added shared FLUX 3 Klein trainer and LoRA request schemas, response types and callable types (ac-v8q1o7). The six endpoints follow separately in ac-tra7ie, ac-9uj0pi, ac-uhklr9, ac-1a7zs9, ac-1rn8vm and ac-6dfs70.

- Added HeyGen Video Agent 3, dynamically priced (ac-egreqg).

- Added HeyGen Video Agent 2, dynamically priced (ac-8eqafo).

- Added Kling 4 video edit, dynamically priced (ac-j3wid6).

- Added Kling 4 reference-to-video, statically priced per requested second by resolution; video references warn (ac-jn033c).

- Added Kling 4 image-to-video, statically priced per requested second by resolution (ac-7e9ecr).

- Added Kling 4 text-to-video under a new `run.kling` namespace, statically priced per requested second by resolution (ac-dhxn43).

- Added HeyGen Filler Word Removal, dynamically priced (ac-zx7lj9).

- Added HeyGen Translate Precision, dynamically priced (ac-2dfgvj).

- Added HeyGen Translate Speed, dynamically priced (ac-hzil38).

- Added HeyGen Lipsync Precision, dynamically priced (ac-k8hxp1).

- Added HeyGen Lipsync Speed, dynamically priced (ac-cjtbhw).

- Added HeyGen Avatar 5 digital twin, dynamically priced (ac-tsxf3o).

- Added HeyGen Avatar 4 image-to-video, dynamically priced (ac-fh66p2).

- Added HeyGen Avatar 4 digital twin, dynamically priced (ac-0y2ni6).

- Added HeyGen Avatar 3 digital twin, dynamically priced (ac-5jmpds).

- Added HeyGen Video reference-to-video, statically priced per requested second by resolution (ac-habde4).

- Added HeyGen Video image-to-video, statically priced per requested second by resolution (ac-3bshuk).

- Added HeyGen Video text-to-video, statically priced per requested second by resolution (ac-djhegp).

- Added Ideogram Vector text-to-vector, statically priced per SVG by quality (ac-h61hu4).

- Added Ideogram Vector image-to-vector, statically priced per SVG (ac-hsbaox).

- Added HeyGen Voice Turbo text-to-speech, statically priced per input character (ac-52hhep).

- Added HeyGen Voice text-to-speech, statically priced per input character (ac-7wb7u7).

- Added FLUX 3 Max text-to-video (ac-h9hyir).
- Added FLUX 3 Max image-to-video (ac-h9hyir).
- Added FLUX 3 Max keyframes-to-video (ac-h9hyir).

- Added Bria Fibo 2 edit with up to four reference images and structured VGL.

- Added Bria Fibo 2 generate with structured VGL prompts and image pricing.

- Added Meshy 6 Lite retexture (ac-ikf3fv).

- Added Seedance 2.5 draft completion, dynamically priced (ac-z0ypw0).

- Added Seedance 2.5 US reference-to-video, dynamically priced (ac-w1gw28).

- Added Seedance 2.5 US image-to-video, dynamically priced (ac-xlcv74).

- Added Seedance 2.5 US text-to-video, dynamically priced (ac-x3uiho).

- Added Seedance 2.0 US reference-to-video, dynamically priced (ac-1c62os).

- Added Seedance 2.0 US image-to-video, dynamically priced (ac-1ld8kd).

- Added Seedance 2.0 US text-to-video, dynamically priced (ac-likism).

- Added MiniMax H3 Max 16-bit Pixel styled text-to-video (ac-pw3eda).

- Added MiniMax H3 Max Hand Drawn styled text-to-video (ac-11zsm1).

- Added MiniMax H3 Max Low Poly styled text-to-video (ac-56zvuw).

- Added MiniMax H3 Max Retro Toon 70s styled text-to-video (ac-tq3j9l).

- Added MiniMax H3 Max VHS styled text-to-video (ac-nt16hd).

- Added PixVerse VibeMV music video (ac-bk3129).

- Added Pixelcut Looping Video image-to-video (ac-wmv97x).

- Added Grok Voice voice reply, dynamically priced (ac-zput7x).

- Added FLUX 3 Action SO-101 robot action, dynamically priced (ac-l079w5).
- Added OpenRouter Router decisions, dynamically priced (ac-gohbne).
- Added Creatify Boreal text-to-video (ac-7dbhic).
- Added VEED Clean Audio audio clean-up (ac-asjuop).
- Added Kling O3 Standard image-to-video (ac-7emr38).

- Added FLUX.2 Flex text-to-image, dynamically priced (ac-ip1jtk).

- Added Kandinsky 6.0 Pro image-to-video, dynamically priced (ac-ty4ptz).

- Added Kandinsky 6.0 Pro text-to-video, dynamically priced (ac-1d4azs).

- Added Kandinsky 6.0 Lite image-to-video, dynamically priced (ac-joik9a).

- Added Kandinsky 6.0 Lite text-to-video, dynamically priced (ac-hz8o8g).

- Added Kandinsky 6.0 VSR Lite video upscaling, dynamically priced (ac-bx8k98).

- Added Kandinsky 6.0 VSR video upscaling, dynamically priced (ac-tajy82).

- Added MiniMax H3 Max relight (ac-chupol).

- Added Vidu Q4 reference-to-video (ac-qpennr).

- Added Vidu Q4 image-to-video (ac-wz3s2z).

- Added Nano Banana 2.1 edit, dynamically priced (ac-tw5y06).

- Added Nano Banana 2.1 text-to-image, dynamically priced (ac-ntkbit).

- Added Mureka podcast generation, dynamically priced (ac-0v1x2x).

- Added Mureka song generation (ac-6pa6if).

- Added Mureka instrumental generation, dynamically priced (ac-4xhisw).

- Added Mureka lyrics generation (ac-e9on10).

- Added Mirelo SFX 2.0 video-to-video, dynamically priced (ac-ltve83).

- Added Mirelo SFX 2.0 video-to-audio, dynamically priced (ac-qwv5yi).

- Added Mirelo SFX 2.0 text-to-audio, dynamically priced (ac-ity0w3).

- Added Marigold V2 depth (ac-7r67ib).

- Added Bria Guided Remove Background background removal (ac-qhznxn).

- Added Bria Fibo Edit 1.5 expand (ac-p98k0z).

- Added Ray 3.2 text-to-video, dynamically priced (ac-mkruvv).

- Added Ray 3.2 image-to-video (ac-fst1vy).

- Added Ray 3.2 video-to-video (ac-um1cp6).

- Added Ray 3.2 reframe, dynamically priced (ac-yvzwpr).

- Added Cosmos 3 Super text-to-image (ac-gih33k).

- Added Cosmos 3 Super image-to-video (ac-1eow45).

- Added MAI Image 2.5 Pro edit, dynamically priced (ac-97k3vy).

- Added MAI Image 2.5 Pro, dynamically priced (ac-51rxwv).

- Added GPT Image 2.5 Flare text-to-image, dynamically priced (ac-8g3qfn).

- Added GPT Image 2.5 Flare edit, dynamically priced (ac-rnheo2).

- Added GPT Image 2.5 Sunburst text-to-image, dynamically priced (ac-1ylhf6).

- Added GPT Image 2.5 Sunburst edit, dynamically priced (ac-pgig3k).

- Added Muse Image edit (ac-nk9nff).

- Added Muse Image text-to-image (ac-4h1r8i).

- Added ElevenLabs Music v2.5 (ac-rrv8xf).

- Added Bria Fibo Gen 1.5 text-to-image (ac-0i2xq1).

- Added Bria Fibo Edit 1.5 edit (ac-we6juy).

- Added FLUX 3 edit-video (ac-6r7fak).

- Added Happy Horse 1.1 text-to-video (ac-crtskn).

- Added Happy Horse 1.1 image-to-video (ac-wadecc).

- Added Happy Horse 1.1 reference-to-video (ac-rh4pwl).

- Added Qwen Audio 3 text-to-speech (ac-n2pi30).

- Added Kling v3 Turbo Pro image-to-video (ac-o17c19).

- Added Kling v3 Turbo Pro text-to-video (ac-i5inny).

- Added Kling v3 Turbo Standard image-to-video (ac-bo14y6).

- Added Kling v3 Turbo Standard text-to-video (ac-rjmitu).

- Added Lightricks LTX-2.5 Fast audio-to-video (ac-oudg7o).

- Added Lightricks LTX-2.5 Pro audio-to-video (ac-l1lqa4).

- Added Lightricks LTX-2.5 Pro text-to-video (ac-ep4zx8).

- Added Lightricks LTX-2.5 Fast text-to-video (ac-jhmwuh).

- Added Gemini Omni Flash 1.1 text-to-video, dynamically priced (ac-o4pjug).

- Added Gemini Omni Flash 1.1 image-to-video, dynamically priced (ac-qkzpsi).

- Added Gemini Omni Flash 1.1 reference-to-video, dynamically priced (ac-vvcfyg).

- Added Gemini Omni Flash 1.1 edit, dynamically priced (ac-5lwz1w).

- Added Grok Imagine Video 1.5 image-to-video (ac-x3few1).

- Added Grok Imagine Video 1.5 text-to-video (ac-ym2457).

- Added MiniMax H3 Max Turbo text-to-video (ac-5rjh2s).

- Added MiniMax H3 Max Turbo image-to-video (ac-hsfjn8).

- Added MiniMax H3 Max lip-sync image-to-video, dynamically priced (ac-sgp4mn).

- Added MiniMax H3 Max 3D-to-video, dynamically priced (ac-vwqc0l).

- Added MiniMax H3 Max reference-to-video, dynamically priced (ac-ibp1q7).

- Added MiniMax H3 Max camera controls (ac-7xfptq).

- Added MiniMax H3 Max text-to-video (ac-jg4hws).

- Added MiniMax H3 Max image-to-video (ac-k83o5s).

- Added MiniMax H3 Max video extension, dynamically priced (ac-b5tt8y).

- Added Bria Fibo Edit 1.5 Product Holding (ac-6d3gzy).

- Added Bria Fibo Edit 1.5 Virtual Try On (ac-lkly44).

- Added Google Lyria 3.5 (ac-1kvnsa).

- Added Meshy 7.1 Multi Image To 3d (ac-aeqvyg).

- Added Meshy 7.1 Image To 3d (ac-gnq3x2).

- Added Meshy 7.1 Text To 3d (ac-jtpt24).

- Added Recraft 4.1 Flash Text To Image (ac-eq9oma).

- Added Tripo3d P2 Image To 3d (ac-4wypts).

- Added Tripo3d P2 Text To 3d (ac-p2s677).

- Added Bytedance Seedream V5 Flash Text To Image (ac-iodwot).

- Added Bytedance Seedream V5 Flash Edit (ac-a25hdg).

- Added Bytedance Seedream V5 Flash Layerize (ac-ent0d5).

- Added Google Gemini 3.8 Flash Lite TTS (ac-grh4og).

- Added Google Gemini 3.8 Flash TTS (ac-zoogdb).

- Added Elevenlabs TTS Eleven V4 (ac-5zfk2j).

- Added Elevenlabs TTS Eleven V4 Turbo (ac-y9s1h4).

- Added Minimax H3 Max Insert Video (ac-od99em).

- Added Ideogram 4.5 (ac-c93rsx).

- Added Ideogram 4.5 editing with masks, reference images, precision and size
  constraints, queue schema metadata, and quality-based per-image pricing.

- Added Grok Imagine Video 1.5 Lite image-to-video with typed schema metadata,
  queue registry support, and pricing including the input-image charge.

- Added FLUX 3 text-to-image with the documented output controls, typed
  response, queue registration, and dynamic pricing discovery.

- Added FLUX 3 image editing with 1–10 references, complete output controls,
  typed schema/response, queue registration, and dynamic pricing discovery.

- Added MiniMax H3 Max Recast with strict request metadata, typed response,
  queue registry support, and output-duration pricing using cost hints.

- Added Grok Imagine Video 1.5 Lite text-to-video with typed schema metadata,
  queue registry support, and pricing for all three resolutions.

- Added MiniMax H3 Max Turbo video extension with typed request/response,
  queue schema registration, and continuation-duration pricing by resolution.

- Separate `z.input` and `z.output` request aliases for every model schema.
- A typed endpoint-to-input map for generic queue submissions.

### Changed

- **Breaking:** `bria/guided-remove-background` requires `image_url`
  (ac-j3d6ki.1). fal's live queue OpenAPI Input defaults it to Bria's own
  sample photo, and the schema mirrored that default, so a request without a
  source image passed validation and fal processed and billed the sample.
  `.schema.parse()` now rejects a payload without `image_url`, and typed
  payloads that omit it no longer compile. Migration: pass the source image
  as `image_url`.
- **Breaking:** the nine non-US Seedance 2.0, 2.0 Fast and 2.5 request
  schemas follow fal's live queue OpenAPI Inputs (read 2026-10-17, ac-f6nytq).
  `seed` is no longer declared on
  `bytedance/seedance-2.0/{text,image,reference}-to-video`,
  `bytedance/seedance-2.0/fast/{text,image,reference}-to-video` and
  `bytedance/seedance-2.5/{text,image}-to-video`, whose live Inputs dropped
  it, so `.schema.parse()` strips it there.
  `bytedance/seedance-2.5/reference-to-video` keeps `seed` as an integer or
  `null`. `bytedance/seedance-2.5/image-to-video` narrows `aspect_ratio` to
  the live const `"auto"`, since the output follows the input image. Typed
  payloads that set either field no longer compile. In the parsed types,
  `end_user_id` and `end_image_url` may now be `null`, and so may the 2.5
  image- and reference-to-video `prompt`, which may also be `undefined`.
  Migration: drop `seed` from those eight payloads, and omit `aspect_ratio`
  or pass `"auto"` on 2.5 image-to-video.
- The same nine schemas gain the rest of the live Inputs:
  - All nine take `bitrate_mode` (`standard` or `high`) and `codec` (`auto`,
    `H264` or `H265`).
  - 2.0 `resolution` adds `1080p` and `4k`.
  - The three 2.5 schemas take `draft`, and their response types gain
    `draft_id`. 2.5 reference-to-video also takes `task` (`reference`,
    `editing` or `extension`).
  - `end_user_id` and `end_image_url` accept `null`.
  - 2.5 image-to-video requires only `image_url`, and 2.5 reference-to-video
    requires nothing.
  - 2.0 and 2.0 Fast reference-to-video now enforce two rules documented in
    their field descriptions: at most 12 files across all modalities, and
    audio references only beside an image or video. `.schema.parse()`
    rejects payloads that break them.
  - 2.5 reference-to-video drops its audio rule, which its live Input does
    not document.

### Removed

- **Breaking:** `run.sora2.textToVideo` and `run.sora2.imageToVideo`, with their
  `post.run` twins, `FAL_ENDPOINT_REQUEST_SCHEMAS` entries, the `FalSora2*`
  schemas and types, and `FalRunSora2Namespace`. Sora 2 is retired, so a call
  could only fail. OpenAI removed it from its API on 2026-09-24 and names no
  replacement. On 2026-11-04 `fal.run/fal-ai/sora-2/*` answered 404 `Application
"sora-2" not found` to a request with no key, as a made-up app does, where a
  live app answers 401. fal's model pages, queue OpenAPI and price list answer
  404 too (ac-jgqanj).

### Fixed

- `xai.grokImagineImage` and `qwenImage` name the URLs they post to. Their
  URL comments and `scripts/endpoint-docs.tsv` rows said
  `POST https://api.fal.ai/v1/xai/grok-imagine-image` and
  `POST https://api.fal.ai/v1/fal-ai/qwen-image`, but the leaves post to
  `https://fal.run/xai/grok-imagine-image` and
  `https://fal.run/fal-ai/qwen-image`, so the README and the CLI catalog
  named the wrong URLs. Their docs links now point at each model's API page
  on fal.ai instead of the generic https://docs.fal.ai. No fal leaf comment
  names api.fal.ai/v1 for a model endpoint any more (ac-nacco3).

- `gptImage1p5` names the URL it posts to. Its URL comment and its
  `scripts/endpoint-docs.tsv` row said
  `POST https://api.fal.ai/v1/fal-ai/gpt-image-1.5`, but the leaf posts to
  `https://fal.run/fal-ai/gpt-image-1.5`, so the README and the CLI catalog
  named the wrong URL. The docs link of `gptImage1p5` and
  `gptImage1p5.edit` now points at the model's API page on fal.ai instead
  of the generic https://docs.fal.ai (ac-annrf9).

## [0.1.0] - 2026-05-16

### Added

- Initial release.
