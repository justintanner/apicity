# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

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

## [0.1.0] - 2026-05-16

### Added

- Initial release.
