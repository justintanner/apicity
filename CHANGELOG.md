# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- An unknown flag on an endpoint that already takes parameter flags now tells you to pass any other request field in `--data`. The agent skill's simplefunctions candles example passes the required `--ticker` and puts `limit` in `--data`, instead of a `marketId` that endpoint does not take (ac-7xgdzh).

- `@apicity/free-media-upload`'s README no longer asks for an API key: its Quick Start and Middleware samples passed `process.env.FREE-MEDIA-UPLOAD_API_KEY`, which the keyless provider does not take, because doc-gen's settings for it sat under its old name, `free`. The Middleware sample now wraps `uguu.upload` instead of a `get.v1.models` the provider does not have (ac-37sz5l).

- Generated READMEs no longer name a hyphenated provider's client with an invalid variable: `@apicity/free-media-upload`'s samples declared `const free-media-upload = …` and called `free-media-upload.catbox.upload(…)`; they now use `freeMediaUpload` (ac-qiac9z).

- The CLI no longer saves web pages as media. A JSON result's `url` (or other media key) that answers with `text/html`, such as an OpenAI web-search citation or a docs link in an ElevenLabs answer, is left as sent with no `_savedTo` sibling, and its body is not read; it used to be saved as a `.bin` file. Downloads from one result also no longer overwrite each other: they run at once and were named to the millisecond, so a result with 40 URLs left 36 files and four `_savedTo` siblings that named another URL's file. When a result yields several files, each name now ends in its number (`-1`, `-2`, …); a single download keeps its old name (ac-ht9p12).

- `apicity har report` no longer lists every successful fal `v1.queue.submit` under schema too strict. The submit sends the request's `input` member as its whole body, and that body was validated against the whole request schema (`endpoint_id`, `input`, `priority`, …), so `endpoint_id` and `input` always looked missing. The schema sections now check the annotated call input, factory defaults compare the body with `input.input`, and a legacy submit, which has no input, reports `no annotated input`. Error samples still show the wire body (ac-dvsxwf).

- `apicity har report` now matches fal queue exchanges whose endpoint id spans path segments (`POST https://queue.fal.run/fal-ai/flux/dev`) to their catalog rows. A `v1.queue.submit` capture with more than one exchange, such as a retried submit, used to leave every exchange auxiliary, because only the sole-entry fallback could attribute a submit; it now resolves through the row's URL, and queue submit, status and result exchanges count as `strict` in `matchedBy`. `@apicity/har` `findMatchingRow` gains a third pass, after the provider-scoped path match, in which fal's `{endpoint_id}` covers one or more whole segments (`matchHarEntrySpanning`), so a fal model row keeps a queue submit to its own path. Other providers match as before (ac-bynay5).

- Six fal endpoints written as method shorthand were invisible to the endpoint walker, so their URL comments went unchecked and the catalog and README left them out. `v1.serverless.files.list`, `v1.serverless.apps.queue`, `v1.serverless.metrics` and `v1.workflows.get` now have catalog rows, with call shapes for the `{owner}`/`{name}` and `{username}`/`{workflow_name}` path fields, and `v1.models.usage` and `v1.models.analytics` now appear in the fal README. Call behavior is unchanged (ac-3ba9xb).

- fal queue polls are now in the endpoint catalog: `v1.queue.status` (`GET https://queue.fal.run/{endpoint_id}/requests/{request_id}/status`) and `v1.queue.result` (`GET https://queue.fal.run/{endpoint_id}/requests/{request_id}`) have rows and call shapes, so `apicity har report` resolves polling captures instead of listing them as not-in-catalog, and a failed poll counts as a provider error. The `v1.queue.submit` row now names the URL the factory sends, `POST https://queue.fal.run/{endpoint_id}`, instead of `https://api.fal.ai/v1/POST` (ac-8zeblu).

- Two provider rules seen only in recorded rejections now apply locally. KIE `pixverse-v6/image-to-video` createTask rejects two `image_urls` without a `template_id` before the request leaves (KIE's 422 "template_id cannot be empty when multiple image_urls are provided"), and the xAI chat completions schema rejects an empty `messages` list (xAI's 400 "Messages cannot be empty") (ac-tsul8r).

- `har:promote` accepts repeated and valueless query keys, reserved or escaped characters, and fragments now that capture identities match Polly; malformed percent or UTF-8 query escapes remain refused (ac-eulnmf).

- Fixed 31 unreachable CLI catalog rows: 29 KIE Suno routes now resolve through an unambiguous sub-provider fallback, ambiguous roots are named and refused, and fal logs-stream and simplefunctions panel-run rows name their real leaves. HAR promotion follows the same Suno accessor (ac-chttrw).

- `@apicity/har` `pollyEntryId` now normalizes a request URL the way Polly does, through a dependency-free port of the qs parse and RFC 3986 stringify behind Polly's url-parse URL: escaped reserved characters and spaces, repeated keys, valueless keys such as S3's `?cors`, bracket arrays and fragments now hash to Polly's id. It reproduces 2,759 of 3,098 committed entry `_id`s with default options (was 2,720); the rest differ by request body (ac-9e2ha7).

- xAI video edit and extension examples now use a freely verified, reachable 5-second MP4 sample instead of the old URL that returns 404; examples are explicitly static, and original recordings remain unchanged (ac-fevz1c).

- `gen:examples` no longer ships payloads whose own recorded exchange failed: removed 45 examples (dolthub 5, elevenlabs 16, fireworks 2, google 1, kie 20 including five GET status reads, quo 1), replaced ten KIE Gemini and `/api/v1/responses` invalid-key examples with static minimal payloads, and re-sourced fal `bytedance.seedance2p5.draft.complete` and kimicoding `coding.v1.messages` from successful recordings. The report lists demoted sources; a corpus guard checks exact-payload provenance and static schemas (ac-ygpjmh).

- HAR capture now scrubs generic credential body fields such as `api_key`, `apiKey`, access tokens and client secrets in requests, responses and call input, including local failures (ac-5ljiib).

### Added

- Added `feed.explore.categories` to `@apicity/omkar` (`GET https://tiktok-scraper.omkar.cloud/feed/explore/categories`): the Explore tabs `feed.explore` accepts, each an `id` (the `category` value) and a display `name`. The recorded list is the same 21 tabs as the `category` enum, which the replay test checks (ac-4ev2i7).

- Added `feed.explore` to `@apicity/omkar` (`GET https://tiktok-scraper.omkar.cloud/feed/explore`): one tab of TikTok's Explore page for a country, up to 30 videos and a fresh batch on every call, in the same video shape as `feed.trending`. `category` is one of Omkar's 21 Explore tabs (`all`, `singing-dancing`, `comedy`, `sports`, ...; Omkar defaults to `all`) and `country` an ISO 3166-1 alpha-2 code (default `US`). Recorded for Thailand's `all` tab (ac-4ev2i7).

- Added the Omkar Cloud TikTok Scraper provider (`@apicity/omkar`) with `feed.trending` (`GET https://tiktok-scraper.omkar.cloud/feed/trending`): the For You feed TikTok shows in a country right now, up to 30 videos with stats, author, sound, media qualities and subtitles, and a fresh batch on every call. `country` takes an ISO 3166-1 alpha-2 code (Omkar defaults to `US`). The key, `OMKAR_API_KEY`, is sent as the `API-Key` header; the free plan allows 1,000 successful requests a month. Gateway errors reject with `OmkarError`, whose `code` carries Omkar's stable error code (`invalid_api_key`, `quota_exceeded`, `rate_limited`, ...). Recorded for Thailand (ac-4ev2i7).

- Added FLUX 3 Klein edit-image at `run.blackforestlabs.flux3.klein.editImage`, now callable with its LoRA variant still at `.lora`; its input is the LoRA endpoint's without `loras`. Pricing is dynamic: an edit of our cat photo at 256x256 billed 0.8889 megapixels at $0.009 while the card prices images per resolution tier (ac-eahf2q).

- Added FLUX 3 Klein text-to-image at `run.blackforestlabs.flux3.klein.textToImage`, now callable with its LoRA variant still at `.lora`; its input is the LoRA endpoint's without `loras`. Pricing is dynamic: a 256x256 image billed 0.8889 megapixels at $0.009 while the card prices images per resolution tier (ac-eahf2q).

- Added TikTok Creative Center `ads.creativeOne.report.getTopContentsOverview` (`GET https://ads.tiktok.com/CreativeOne/Report/GetTopContentsOverview`): the Unix seconds that end the latest daily, weekly and monthly top-video lists, the values `creativeCenterGetTopContentsList` takes as `periodEndTimestamp`. Unofficial and keyless like the list. Recorded on 2026-10-28 (ac-qiac9z).

- Added the TikTok Creative Center provider (`@apicity/tiktok-creative-center`), keyless and free, with `ads.creativeOne.report.creativeCenterGetTopContentsList` (`GET https://ads.tiktok.com/CreativeOne/Report/CreativeCenterGetTopContentsList`): a country's top trending videos for a week or month, with views, engagement and author data. These are unofficial, undocumented endpoints behind Creative Center's Trending videos page that TikTok can change; without a TikTok One session each list is the top 4 rows whatever `page` and `limit` ask, and session cookies are not supported. `itemID`, `authorID` and `creatorID` come back as strings because TikTok sends them as JSON numbers above 2^53, and a nonzero `BaseResp.StatusCode` (which Creative Center sends with HTTP 200) rejects with `TiktokCreativeCenterError`. Recorded for Thailand's weekly list, with and without sponsored posts (ac-qiac9z).

- Added FLUX 3 Klein edit-image LoRA at `run.blackforestlabs.flux3.klein.editImage.lora`, reusing the shared edit schema and recording our trained edit LoRA with the owned cat photo (ac-6dfs70).

- Added FLUX 3 Klein base edit-image LoRA at `run.blackforestlabs.flux3.klein.base.editImage.lora`, with the shared edit schema and a recording using our trained edit LoRA and owned cat photo (ac-1rn8vm).

- Added Endless `social.trends.public` (`GET https://api.endless.app/social/trends/public/{region}`): what is trending on X in a region, with each trend's search link and tweet volume (`null` when X reports none), the last 24 hours of snapshots in `timeline`, and the longest-trending names. `region` is one of 63 slugs, `worldwide` and 62 countries, checked by the request schema. The CLI calls it as `apicity endless social.trends.public --region worldwide`. Recorded for worldwide (ac-cle0z4).

- Added the Endless provider (`@apicity/endless`), keyless and free, with `social.tiktokTrends.public` (`GET https://api.endless.app/social/tiktok-trends/public/{region}`): a country's most played trending TikTok videos of the last 24 hours, with the longest-trending videos, sounds and hashtags. `region` is one of 20 country slugs, checked by the request schema; calls send `Endless-Api-Version: 1` unless `apiVersion` says otherwise, and failures raise `EndlessError` with Endless's reason in `code`. The CLI calls it as `apicity endless social.tiktokTrends.public --region thailand`, its cost tier is `cheap`, and `@apicity/har` maps `api.endless.app` to it. Recorded for thailand (ac-cle0z4).

- Added FLUX 3 Klein text-to-image LoRA at `run.blackforestlabs.flux3.klein.textToImage.lora`, reusing the shared LoRA schema and our trained cat LoRA (ac-1a7zs9).

- Added FLUX 3 Klein base text-to-image LoRA at `run.blackforestlabs.flux3.klein.base.textToImage.lora`, with shared LoRA schemas and a recorded image using our trained cat LoRA (ac-uhklr9).

- Added FLUX 3 Klein base edit trainer at `run.blackforestlabs.flux3.klein.base.trainer.edit`, preserving the callable base trainer. Pricing is dynamic because the reference-image multiplier depends on the dataset ZIP contents (ac-9uj0pi).

- Added FLUX 3 Klein base trainer at `run.blackforestlabs.flux3.klein.base.trainer`, with its shared trainer schema and a recorded 100-step training run on the owned cat photo (ac-tra7ie).

- Added shared FLUX 3 Klein trainer and LoRA request schemas, response types and callable types (ac-v8q1o7). The six endpoints follow separately in ac-tra7ie, ac-9uj0pi, ac-uhklr9, ac-1a7zs9, ac-1rn8vm and ac-6dfs70.

- Added MachGen `api.v0.upscale.quote` (`POST https://api.machgen.ai/api/v0/upscale/quote`), MachGen's free upscale price check. It takes an UPSCALE task input, creates no task and answers `{ cost_micros }`, the micro-USD the upscale would bill. MachGen's REST docs do not list it (read 2026-10-26), so MachGen may change it without notice: its catalog row has no docs link, and the README, the schema description and the factory comment mark it undocumented. MachGen's web app calls it, and the MCP server's `quote_video_upscale` tool is its documented form (https://www.machgen.ai/docs/mcp#tools). Its schema, `MachGenUpscaleQuoteRequestSchema`, is the generate schema with `task_type` fixed to `UPSCALE` and the five upscale models listed, so it keeps generate's UPSCALE checks. A quote recorded on 2026-10-26 priced a 2160p Topaz Video Generative Fast upscale of a 4 s 480p task at 596000 micros, and the Topaz upscale replay now reads its quote through the endpoint (ac-23mccw).

- `@apicity/cost` adds `resolveMachGenUpscaleEstimate(payload, quote, { hints })`, which prices the MachGen upscales its table cannot, such as the four Topaz upscalers, with MachGen's quote: pass `machgen.api.v0.upscale.quote`, and the estimate is its `cost_micros` in USD. Every other request, MiniMax-H3's upscale included, falls through to `computeEstimate` with no network call, and a failed or malformed quote degrades to the local `usd: 0` with a warning. `isMachGenQuotePriced` tells which requests ask the quote. The recorded Topaz upscale billed exactly its quote (ac-23mccw).

- MachGen `api.v0.generate` now checks the T2V aspect ratio of the four T2V-only models, which went unchecked: Veo-3.1 and Veo-3.1-Fast take 16:9 and 9:16, Grok-Imagine-Video takes 16:9, 9:16, 1:1 and 4:3, and Kling-o3 takes 16:9, 9:16 and 1:1. The lists come from MachGen's own 400s to four free probes on 2026-10-25, now in `tests/fixtures/machgen-evidence/machgen-grids-2026-10-25.json` (ac-5qfga3).

- `@apicity/cost` prices MachGen's T2V-only models from the 2026-10-25 pricebook, per output second by height: Veo 3.1 at 0.471 USD at 720p and 1080p and 0.706 at 2160p (its audio is always on), Veo 3.1 Fast at 0.118, 0.142 and 0.353, and Grok Imagine Video at 0.059 at 480p and 0.083 at 720p. Every MachGen video model is now priced for each task it takes except the Topaz upscalers. Three recorded T2V clips billed exactly their estimates, 2.415 USD gross: Veo 3.1 at 720p for 4 s (1.884), Veo 3.1 Fast at 720p for 4 s (0.472) and Grok Imagine Video at 480p for 1 s (0.059) (ac-5qfga3).

- MachGen `api.v0.generate` now validates video-to-video requests. `task_type: "UPSCALE"` joins the schema, for MiniMax-H3 and the four Topaz models in MachGen's models table: Topaz Video Precision, Precision Animation, Generative and Generative Fast. A new `MACHGEN_VIDEO_UPSCALE` export holds each upscale model's target heights and the Topaz engines MachGen checks in `upscale_config.engine`; other `upscale_config` knobs pass through. `MACHGEN_VIDEO_GRIDS` gains the R2V grid of all 16 R2V models: heights, `duration_secs` values and aspect ratios, reference caps (images, videos, audio clips and their total), whether audio needs an image or video beside it, whether a reference video may start at an offset, and the `reference_video_operation` values the model takes. The schema rejects locally, with MachGen's own wording, what MachGen answers with a 400 before accepting the task: an off-grid R2V height or duration, references over a cap, audio alone where a visual reference is required, an unsupported or misaligned `reference_video_start_secs`, an edit or extend the model lacks, a `src_video_urls` entry that is not a public http(s) URL, an UPSCALE without a source, and an off-tier target height or engine. An edit renders at its source's length, so its `duration_secs` is not checked. Two documented rules apply too: exactly one of `duration_secs` and `num_frames`, and each subject name in only one `subject_to_*_ids` map, pointing at references that exist. `reference_order` gains its `{ type, index }` item shape. The grids and rules come from free 400 probes on 2026-10-25, the UPSCALE ones through MachGen's upscale price check; 15 of the 400s are in `tests/failures/machgen` (ac-ks4no2).

- `@apicity/cost` prices MachGen video-to-video. R2V is priced on all 16 models that take it, 11 of them new: Vidu Q3 Turbo, Vidu Q3 Pro, MiniMax H3 Turbo, Seedance 2.0 Fast and Mini, Vidu Q4 Preview, PixVerse V6 and C1, HappyHorse 1.0, Kling 3.0 Omni (also T2V, with audio on and off priced apart) and Vidu Q3. A reference video now bills the seconds MachGen reads from it on top of the output on every model that takes one, as MachGen's docs say, not only on Seedance 2.5 and 2.0 and MiniMax H3; receipts confirm it on Seedance 2.0 Fast and Mini, MiniMax H3 Turbo and Wan 3.0. Pass `costHints.inputDurationSeconds` with those seconds, after any start offset. A Seedance 2.5 edit renders, and bills, its source's length. UPSCALE is priced on MiniMax H3, which bills the source's seconds in and out at 0.05 USD/s and takes the source's length from `costHints.inputDurationSeconds`. The Topaz upscalers bill vendor credits that depend on the source, so they fail closed, as does Vidu Upscale Pro: it is on the pricebook, but MachGen answered HTTP 500 to every request for it. 22 recorded tasks billed 4.662 USD gross, each exactly its estimate, or for the Topaz upscale exactly MachGen's quote; the Wan 3.0 one, a 4 s reference with 2 s out at 480p (294000 micros), showed that Wan's single rate bills the reference too. Three probes MachGen accepted by mistake billed another 0.60 USD (ac-ks4no2).

- MachGen `api.v0.generate` now validates every video model in MachGen's models table (24 models; 19 take I2V), up from six. A per-model grid (`MACHGEN_VIDEO_GRIDS`) holds the heights, `duration_secs` values and aspect ratios each model accepts for T2V and I2V, whether its I2V takes an end frame (`src_image_urls` entry 1, on 11 models) and whether it renders toward a lone end frame (`keyframe_indices: [-1]`, on MiniMax-H3 and MiniMax-H3-Turbo). The schema rejects locally, with MachGen's own wording, what MachGen answers with a 400 before accepting a task: an unsupported task type, an off-grid height, duration or aspect ratio, an aspect ratio on a model that takes it from the image, a second image or a lone end frame where the model has none, misaligned `keyframe_indices`, and an I2V request with no image or more than two. Model ids outside the table pass unchecked. The grids come from 227 rejected (unbilled) probes on 2026-10-25; ten of the 400s are in `tests/failures/machgen`. Kling's `negative_prompt`, multi-shot and element fields are now in the video config (ac-fs70lj).

- Added MachGen `api.v0.tasks.billing` (`GET https://api.machgen.ai/api/v0/tasks/{taskId}/billing`), which reads a finished task's `generation_cost_micros`, `generation_credit_micros` and `net_cost_micros`, so an actual charge can be reconciled with the estimate. `api.v0.tasks` stays callable. The MachGen replays now read their receipts through it (ac-fs70lj).

- `@apicity/cost` prices every MachGen image-to-video model for T2V and I2V, adding 13 models: Wan 2.2 A14B, LTX 2.3 Pro, Vidu Q3 Turbo, Vidu Q3 Pro, MiniMax H3 Turbo, Seedance 2.0 Fast and Mini, Kling 3.0, Vidu Q4 Preview, Vidu Q3 Pro Fast, PixVerse V6 and C1, and HappyHorse 1.0. Rates are per second by height, read from the pricebook on 2026-10-25. Vidu Q3 Turbo bills its 1-5, 6-10 and 11-16 s bands one band at a time; Kling 3.0 and PixVerse price audio on and off apart; MiniMax H3 Turbo is at its promotional 0.01 USD/s. The MachGen endpoints now classify as `expensive` instead of `prohibitive`. Each newly priced model has a recorded I2V generation (Wan 2.2 also T2V), as do Kling 3.0 and PixVerse with audio on, a 6 s Vidu Q3 Turbo clip, and MiniMax H3 and H3 Turbo with an end frame and with a lone end frame: all 22 tasks billed exactly their estimate, 2.793 USD in total. One of those receipts corrects an earlier MachGen rate: an H3 I2V request with an end frame bills the Image to Video rate (0.035 USD/s at 480p), not the Frame to Frame rate (0.05), which is now priced for R2V only (ac-fs70lj).

- KIE `grok-imagine-video-1-5-preview` accepts `resolution: "1080p"`, which KIE's docs and live model schema now list. At 1080p it takes exactly one `image_urls` entry, as the docs say; 480p and 720p still accept more, because a two-image request succeeded. `@apicity/cost` prices 1080p at $0.04/s (8 credits). The pricing feed has no 1080p row for this model yet, and the product page prints the tier as a second "720p" entry at 8 credits/s, so the rate is a pricing-only reconciliation exception. A recorded 1 s 1080p generation billed 8 credits and returned a 1920x1088 video (ac-0039hv).

- KIE `grok-imagine-video-1-5-preview` now accepts the frame controls KIE added on 2026-10-22: `first_frame_url`, `last_frame_url`, `loop_url` (one image as both the first and the last frame, which cannot be combined with a different first or last frame), up to four `keyframes` of `{ url, timestamp_s }`, and `enable_audio`, which defaults to `true`. The createTask guard checks the documented keyframe timing before the request leaves: each `timestamp_s` greater than 0 and less than `duration`, keyframes at least 1/3 second apart. KIE's OpenAPI types `timestamp_s` as an integer, but the API accepted and stored `1.5`, so the schema takes any number in range. Two recorded 480p generations cover the new fields: a 3 s clip pinned at its first frame, a keyframe at 1.5 s and its last frame (7.2 credits), and a 2 s loop with `enable_audio: false`, which returned a video with no audio track (4.8 credits) (ac-2knv18).

- Added the KIE OmniHuman 2.0 `omnihuman-2-0` createTask model. Its request schema follows the docs: exactly one source image in `image_urls`, a required `audio_url` (WAV or MP3, 4-300 s), an optional `prompt` of up to 300 characters and `enable_watermark`, which defaults to `true`. It also comes with `Omnihuman20TaskResultJsonSchema`, a `modelInputSchemas` descriptor and pricing of $0.07 per output second. The request has no duration, so the estimate reads the audio length from `costHints.durationSeconds` and rounds it up to a whole second, as the render does. OmniHuman 1.5's human-identification and subject-detection sub-tasks have no 2.0 counterpart. The model has a recorded generation: a 6.008 s clip rendered 7 s and billed 98 credits (ac-bdsciv).

- Added KIE PixVerse V6 Max `pixverse-v6-max/text-to-video` and `pixverse-v6-max/image-to-video` createTask models. Their request schemas follow the docs: a 1-5000 character prompt, the documented quality and aspect-ratio enums, an integer 1-15 s duration, and one first-frame image for image-to-video, which rejects `aspect_ratio` because the output follows the image. They also come with `PixverseV6MaxTaskResultJsonSchema`, `modelInputSchemas` descriptors and per-second pricing by quality and audio, from $0.024/s (360p without audio) to $0.112/s (1080p with audio). The KIE PixVerse model alias now accepts a tier after the version, such as `pixverse-v6-max/...`. Each model has a recorded 1 s 360p generation (ac-hp0emr).

- Added KIE Kling 4.0 `kling-4.0/reference-to-video` and `kling-4.0/keyframe-to-video` createTask models. Their request schemas check the documented limits: material quotas, element and voice names, and the keyframe frame cap. They also come with `Kling40TaskResultJsonSchema`, `modelInputSchemas` descriptors and per-second pricing: $0.1425/s at 720p and $0.2125/s at 1080p. With video input, reference-to-video bills $0.085/s or $0.1275/s on output + max(output, input) seconds, the input read from `costHints.inputDurationSeconds`. Each model has a recorded 3 s generation (ac-0t56dd).

- `@apicity/har` capture calls accept their own `context` (`HarCallMeta.context`), merged shallowly over the capture's `context` for that call only, so one capture instance can attribute concurrent books, runs or attempts. The construction-time context stays the default; recording identity and scrubbing are unchanged (ac-g0ani3).

- Documented the first offline video/image learning pass in `docs/har-learning-pass-1.md`: triaged committed HAR findings and videobook overrides, retained newer provider constraints over historical successes, and filed six provider-family follow-ups for unproven constraints and product-dependent defaults. No schemas, defaults or recordings changed (ac-07gwrq).

- Added the failing-payload regression suite: `tests/failures/<provider>/<name>.har` with `.expect.json` sidecars and `tests/failures/passthrough.json`, held by `tests/integration/captured-failures.test.ts` (a cross-cutting guard) and `lint:recordings`. Every provider rejection there is either caught locally with its rule phrase or listed with a reason. It is seeded from the triage of the committed corpus's 139 failed exchanges (130 are not payload failures) and from two plan-evidence captures: 6 caught, 5 pass-throughs (ac-tsul8r).

- Added offline `har:promote` to turn successful captures into checked Polly recordings and integration tests, replay-only `POLLY_RECORDINGS_DIR`, and orphan-check `--recordings`/`--tests` roots (ac-3uda2b).

- `apicity har report` analyzes capture directories and legacy recordings offline: grouped provider errors, schema acceptance gaps, defaults, response drift, and local failures, with deterministic Markdown and versioned JSON. Shared exchange-success and endpoint-matching helpers now ship in `@apicity/har` (ac-45uanr).

- Added CLI `--capture-har`, `APICITY_HAR_CAPTURE` and `APICITY_HAR_DIR` (default `$HOME/.config/apicity/har`), capture paths in envelopes, `har list|show|scrub` commands and a doctor capture row (ac-7m8lw4).

- Added opt-in `createHarCapture` with call scopes, failures mode, scrubbed HAR files and an index; Alibaba OSS and fal storage uploads now honor the factory’s injected fetch (ac-s3b2gq).

- Added `@apicity/har` with HAR serialization, secret scrubbing and Polly identity helpers.

- Added fal HeyGen Video Agent 3 (`fal-ai/heygen/v3/video-agent`) as `run.heygen.v3.videoAgent`, with `"auto"` plus the stock avatar and voice catalogs; dynamically priced, since the agent chooses the billed output length (ac-egreqg).

- Added fal HeyGen Video Agent 2 (`fal-ai/heygen/v2/video-agent`) as `run.heygen.v2.videoAgent`, reusing the stock avatar catalog; dynamically priced, since the agent chooses the billed output length and `config.duration` is only approximate (ac-8eqafo).

- Added fal Kling 4 video edit (`kling/v4/video-to-video/edit`) as `run.kling.v4.videoToVideo.edit`, owning the new `videoToVideo` object; dynamically priced, since fal bills the source video's length plus the output's ($0.094/s at 720p, $0.141/s at 1080p, counted in $0.157 units) (ac-j3wid6).

- Added fal Kling 4 reference-to-video (`kling/v4/reference-to-video`) as `run.kling.v4.referenceToVideo`, with its element rule restated from fal's validator; text and image references are priced per requested second by resolution ($0.157/s at 720p, $0.235/s at 1080p), while reference videos and video elements, which the card bills on input plus output length, warn instead of pricing (ac-jn033c).

- Added fal Kling 4 image-to-video (`kling/v4/image-to-video`) as `run.kling.v4.imageToVideo`, priced per requested second by resolution like text-to-video ($0.157/s at 720p, $0.235/s at 1080p), with the shared Kling 4 media URL rule restated from fal's validator (ac-7e9ecr).

- Added fal Kling 4 text-to-video (`kling/v4/text-to-video`) as `run.kling.v4.textToVideo`, the first member of a new `run.kling` namespace (separate from `run.klingVideo`), priced per requested second by resolution ($0.157/s at 720p, $0.235/s at 1080p; a multi-shot video bills the sum of its shot durations) (ac-dhxn43).

- Added fal HeyGen Filler Word Removal (`fal-ai/heygen/v3/filler-word-removal`) as `run.heygen.v3.fillerWordRemoval`; dynamically priced, since the input video's length and whether any cut is made set the charge (ac-zx7lj9).

- Added fal HeyGen Translate Precision (`fal-ai/heygen/v2/translate/precision`) as `run.heygen.v2.translate.precision`, sharing the speed tier's input schema; dynamically priced, billing two $0.05 units per whole output second (the card's $0.10 a second) (ac-2dfgvj).

- Added fal HeyGen Translate Speed (`fal-ai/heygen/v2/translate/speed`) as `run.heygen.v2.translate.speed`, with its 178 output languages; dynamically priced, since the translation sets the billed output seconds (ac-hzil38).

- Added fal HeyGen Lipsync Precision (`fal-ai/heygen/v3/lipsync/precision`) as `run.heygen.v3.lipsync.precision`, sharing the speed tier's input schema; dynamically priced (ac-k8hxp1).

- Added fal HeyGen Lipsync Speed (`fal-ai/heygen/v3/lipsync/speed`) as `run.heygen.v3.lipsync.speed`; dynamically priced, since the source media set the billed output seconds (ac-cjtbhw).

- Added fal HeyGen Avatar 5 digital twin (`fal-ai/heygen/avatar5/digital-twin`) as `run.heygen.avatar5.digitalTwin`, with its background, watermark and transparent webm options; dynamically priced (whole output seconds set by the script) (ac-tsxf3o).

- Added fal HeyGen Avatar 4 image-to-video (`fal-ai/heygen/avatar4/image-to-video`) as `run.heygen.avatar4.imageToVideo`, restating fal's rule that a prompt without `audio_url` needs a `voice`; dynamically priced (ac-fh66p2).

- Added fal HeyGen Avatar 4 digital twin (`fal-ai/heygen/avatar4/digital-twin`) as `run.heygen.avatar4.digitalTwin`, reusing the stock catalogs; dynamically priced (whole output seconds set by the script) (ac-0y2ni6).

- Added fal HeyGen Avatar 3 digital twin (`fal-ai/heygen/avatar3/digital-twin`) as `run.heygen.avatar3.digitalTwin`, with HeyGen's published stock avatar (1286) and voice (102) catalogs; dynamically priced, since the spoken script sets the billed output seconds (ac-5jmpds).

- Added fal HeyGen Video reference-to-video (`heygen/heygen-video/reference-to-video`) as `run.heygen.heygenVideo.referenceToVideo`, priced per requested second by resolution, and added HeyGen Video (ultraquality) to the derived reference-to-video frontier list at rank 2 (ac-habde4).

- Added fal HeyGen Video image-to-video (`heygen/heygen-video/image-to-video`) as `run.heygen.heygenVideo.imageToVideo`, priced per requested second by resolution like text-to-video (ac-3bshuk).

- Added fal HeyGen Video text-to-video (`heygen/heygen-video/text-to-video`) as `run.heygen.heygenVideo.textToVideo`, priced per requested second by resolution ($0.02/s at 480p and 768p, $0.06/s at 1080p and 2K; fal billed the recorded call at half the card rate), and mapped the frontier text-to-video board's HeyGen Video (ultraquality) to it (ac-djhegp).

- Added fal Ideogram Vector text-to-vector (`ideogram/vector/text-to-vector`) as `run.ideogram.vector.textToVector`, priced per generated SVG by quality ($0.13 low, $0.16 medium, $0.20 high, $0.32 high with reference images) (ac-h61hu4).

- Added fal Ideogram Vector image-to-vector (`ideogram/vector/image-to-vector`) as `run.ideogram.vector.imageToVector`, priced at $0.10 per generated SVG (ac-hsbaox).

- Added fal HeyGen Voice Turbo text-to-speech (`heygen/heygen-voice/turbo`) as `run.heygen.heygenVoice.turbo`, priced per input character from its card; fal billed the recorded call at half the card rate (ac-52hhep).

- Added fal HeyGen Voice text-to-speech (`heygen/heygen-voice`), priced per input character from its card; fal billed the recorded call at half the card rate (ac-7wb7u7).

- Added a `price` to each `frontier()` row and to `apicity frontier <type>`, taken from the bundled `@apicity/cost` rates (`0.04-0.16 USD/s`, `0.08 USD/image`, `dynamic`, or `-`). `docs/frontier.md` has the same column. A missing rate stays `unpriced`; no rate table changed.

- Added MachGen provider (`@apicity/machgen`) for MiniMax H3, Seedance 2.5/2.0, Wan 3.0, HappyHorse 1.1 and Grok Imagine Video 1.5, with task status, authenticated asset download, per-second pricing and recorded replays. At recording time (2026-10-22) MachGen rejected Wan 3.0 requests that omitted its documented `video_config` (`aspect_ratio: "adaptive"`, `fps: 30`, `audio: true`), at zero charge; the Wan replays use the documented config.

- Added `apicity frontier <type>` and the `frontier()` registry in `@apicity/cost`, keyed by task type, with the ranking moved to `docs/frontier.md`.
- Added frontier text-to-image (`t2i`) and image-to-image (`i2i`) snapshots.
- Added frontier text-to-video (`t2v`) and video-to-video (`v2v`) snapshots, and a reference-to-video (`r2v`) list derived from the `t2v` and `i2v` top 10.
- Added MachGen to the frontier registry for `t2v`, `i2v` and `r2v`, through `api.v0.generate` with the MachGen model id.
- Added KIE `gpt-6-1-sol` on `POST /codex/v1/responses`, with per-token pricing and a recorded completion.
- Added KIE `claude-haiku-5-5` on `POST /claude/v1/messages`, with per-token pricing and a recorded completion.
- Added KIE Seedance 2.5 draft generation and 1080p rendering with recorded replay and current pricing.

- Added MiniMax H3 Max reframe-video with queue replay and dynamic billed-unit pricing guidance.

- Added Bria Fibo 2 edit with up to four reference images and structured VGL.

- Added Bria Fibo 2 generate with structured VGL prompts and image pricing.

- First-class `costHints.durationSeconds` metadata for pricing media whose wire
  request does not contain its billable duration.
- Static pricing coverage for Fal video and edit/image endpoints, Alibaba Wan
  2.7 Image, and KIE Nano Banana.
- Fal request input/output aliases and an endpoint-to-input type map.
- `@apicity/cli`: `apicity setup 1password` saves the 1Password vault and
  service-account token given by `--op-vault` and `--op-token` to the CLI's
  env file (`APICITY_OP_VAULT` and `APICITY_OP_SERVICE_TOKEN`, the token as
  given, so `env:VAR` keeps it off disk) and checks the pair once with
  `op item list`. `--no-verify` skips the check, and `--remove` deletes the
  two lines. A new directory is created `0700` and a new file `0600`.
- `@apicity/cli`: `op://vault/item/field` references in the env file or the
  environment resolve for the provider a call addresses, all of them in one
  `op inject`, with the configured token or `op`'s own sign-in.

### Changed

- The `api-key` request header no longer enters a Polly recording's match identity, like the other credential headers, in the test harness and in `@apicity/har` `pollyEntryId`. The header was already scrubbed to `***` on disk, but a recording made with the real key matched only that key, so it could not replay without it. No committed recording sent the header before `@apicity/omkar` (ac-4ev2i7).
- **Breaking:** MachGen `reference_video_start_secs` is now a list (`number[]`) with one start second per `src_video_urls` entry, as MachGen requires. The schema typed it as a single number, which MachGen rejects with HTTP 400 "Input should be a valid list", so no request that set it could succeed (ac-ks4no2).
- **Breaking:** KIE `Seedance25RequestSchema` and `Seedance25InputSchema`
  (`bytedance/seedance-2-5`) now default `input.generate_audio` to `false`,
  not `true`, and the `modelInputSchemas["bytedance/seedance-2-5"]`
  descriptor says so. `.schema.parse()` output and `apicity describe`
  change. KIE's documented default is still `true`; every recorded
  seedance-2-5 run sent `false` (3 of 3 in the 2026-10-24 HAR learning
  pass), so the schema now follows them. createTask still sends the request
  as written, so an omitted field still gets KIE's `true`: send
  `generate_audio: false` for a silent clip. The price does not depend on it
  (ac-lsk3d7).
- **Breaking:** KIE `GrokVideo15PreviewRequestSchema` and
  `GrokVideo15PreviewInputSchema` now default `input.nsfw_checker` to
  `false`, not `true`, as KIE's docs and live model schema say (read
  2026-10-25). `.schema.parse()` output and `apicity describe` change.
  createTask still sends the request as written, so an omitted field gets
  KIE's own default. Pass `nsfw_checker: true` to keep KIE's content filter
  on (ac-lsk3d7, folded from ac-xgp38d).
- The 29 provider packages that ship zod schemas now depend on `zod@^4.6.6`,
  up from `^4.4.3`. 4.6.6 is the first zod release patched for
  GHSA-mrhx-c7xc-m3w5, so an install can no longer resolve a vulnerable zod.
  4.6.6 also rejects an array over its `max` before parsing its elements, so a
  union schema such as `AlibabaMultimodalGenerationRequestSchema` reports an
  oversized `content` as one root `invalid_union` (ac-eix0vh).
- Root README rewritten; detail moved to docs/paygate.md, docs/middleware.md,
  docs/providers.md, CONTRIBUTING.md and MCP.md.
- `apicity commands`, `apicity providers` and `apicity describe`, and the
  `apicity <provider>` and endpoint `--help` forms that reuse them, now answer
  the success envelope `{"ok": true, "data": …}` with `--json` or a
  non-terminal stdout, like every other command, instead of printing their
  result at the top level. Read the result under `.data`: `jq length` on that
  output now counts the envelope's keys. They also accept `--quiet` for the
  data alone.
- **Breaking:** the OTP pay gate is opt-in in `@apicity/cost`, `@apicity/kie`,
  `@apicity/xai` and `@apicity/cli`. A paid endpoint now dispatches when no
  pay-gate secret is configured. Configuring one (`paygate: { secret }`, or
  the CLI's `--paygate-secret-file` / `APICITY_PAYGATE_SECRET_FILE`) arms the
  OTP gate, whose behavior is unchanged. An OTP passed to an unarmed provider
  or CLI is an error (`paygate-not-configured`), and a supplied but empty
  secret still fails closed. What counts as paid does not change. The CLI's
  doctor reports an unset secret file as the gate being off, at `ok`, and an
  empty secret file is a `usage` error. Migration: if you relied on paid
  endpoints failing closed by default, configure the secret.
- `@apicity/cli`: env-file `op://` lines now resolve, for the addressed
  provider's variables, instead of being skipped. References outside a
  provider's credential variables (`S3_REGION`, `B2_ENDPOINT`, …) are still
  neither resolved nor exported, and a reference that cannot be resolved is exit
  3 `auth`, naming the variable and the reference.
- A 1Password token without a vault is accepted: it authenticates `op://`
  references, and only the vault convention needs both. A vault without a
  token is still exit 1 `usage`.
- `configured` in `apicity providers`, `commands` and `describe`, and doctor's
  Providers row, now counts an env-file literal, an `op://` reference and the
  vault convention (vault and token both configured), including a pair saved
  in the env file. Those commands still never run `op`.
- `apicity doctor`'s 1Password CLI row reads the vault and token from flags,
  the environment and the env file. It reports a token alone as `ok`, a vault
  alone as an `error`, and with both lists the vault once and warns, by name,
  about provider variables it lacks. It names where the token came from and
  never prints a literal one.
- `SETUP_FORMS` gains `"1password"`; `apicity setup --remove` and the other
  forms' `--remove` never open the env file.
- The Claude Code plugin's SessionStart hook reads `apicity providers --json`
  instead of `apicity doctor --json`, so it never reaches 1Password. The line
  it prints is unchanged.
- `isProviderConfigured(name, env, sources?)`: with `sources` from the new
  `readCredentialSources`, it applies the meaning above; without, it answers
  exactly as before.
- `resolveCredentials` resolves `op://` references ahead of the vault
  convention, accepts a token without a vault, and takes two more seams,
  `listItemTitles` and `injectSecrets`, which `EndpointOptions` passes through.
- `OpInject` takes an optional second parameter, the token the `op` child
  receives as `OP_SERVICE_ACCOUNT_TOKEN`.
- `SubprocessOptions` gains an optional `env`, the variables layered over the
  child's inherited environment, and `SubprocessResult` an optional
  `notFound`, set when the binary is missing.

### Removed

- **Breaking:** retired KIE `sora-watermark-remover`, its
  `SoraWatermarkRequestSchema`, and the `SoraWatermarkRequest`,
  `SoraWatermarkRequestInput`, and `SoraWatermarkParsedRequest` exports.
  Its cost pricing, slug, and display entries are removed as well.

- The MCP server: the CLI's `mcp` subcommand and its compatibility bin. MCP support ended with `@apicity/mcp-server` 0.11.2; use the `apicity` CLI and agent skill (see MCP.md).
- The MCP-era eager registry surface of `@apicity/cli`: the `makeToolName` and `toSnakeCase` exports and the `Endpoint` fields `toolName`, `fn`, `jsonSchema`, `example` and `pathParams`. `buildRegistry()` stays as the bulk resolver behind the registry tests and `scripts/diag.mjs`.

### Fixed

- Seedance 1.0 Lite/Pro estimates now use the wire duration or its billed
  five-second default; cost-only hints and legacy top-level durations cannot
  underquote an omitted duration.

- Fal area-billed models now use only documented fixed defaults and warn when
  an omitted image size cannot be priced safely.
- Kling 3.0 pricing applies the sound tier when `multi_shots` promotes an
  omitted sound setting.
- ElevenLabs text-to-speech descriptions shown by `apicity describe` now
  disclose the 10000-character limit that applies when `model_id` is omitted.
- Provider-scoped lint and preflight support endpoint-less packages such as
  `@apicity/cost` and `@apicity/mcp-server` without accepting misspelled names.
- The local dependency audit can inventory the full workspace without
  overflowing Node's default subprocess buffer.
- Generated KIE documentation retains the media URL upload guidance added for
  pre-upload asset identifiers.
- The dependency graph pins `body-parser` to the patched 1.20.6 and 2.3.0
  release lines for CVE-2026-12590.

## [0.1.0] - 2026-05-16

### Added

- First stable release of the @apicity/\* monorepo.
