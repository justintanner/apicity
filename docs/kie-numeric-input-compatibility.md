# KIE numeric input compatibility audit

Retrieved and observed on 2026-07-31. This audit covers numeric-valued input
properties reachable from every current `KIE_MEDIA_MODELS` entry through its
`CREATE_TASK_GUARDS` schema. It is an evidence and decision record, not a claim
that fields with similar names share an upstream contract.

## Method

The companion test converts each catalogue-linked request schema with the
repository's `zodToJsonSchema` helper and walks `properties.input` through
objects, arrays and tuples, `anyOf`, and `oneOf`. It collects number and integer
leaves, all-numeric string enums, and string patterns that accept numeric text.
Rows are deduplicated by model and input path. Unsupported schema branches,
duplicate rows, missing rows, extra rows, and stale local-contract cells all
fail with the affected model and path.

At this revision the derived inventory has 66 unique paths across 37 of the 52
catalogue models: 44 integer branches, 16 general-number branches, five
numeric-string enums, and one numeric-string pattern. These are measured facts,
not permanent expected counts; the model/path set is derived on every test run.

For upstream evidence, the sweep resolved English Markdown OpenAPI exports
from `llms.txt` before considering alternate pages. The current index matched
50 of 52 catalogue ids. It has no model-specific export for
`elevenlabs/sound-effect-v2` or `sora-watermark-remover`; only the former has a
numeric inventory row. A missing page, an absent example, or a conflict between
a declaration and example remains explicit rather than being treated as proof
of rejection or coercion.

The evidence hierarchy used here is:

1. a bounded current live observation;
2. a current official OpenAPI declaration and request example, kept as
   separate facts;
3. a historical committed HAR observation;
4. unknown when the current sources are absent or contradictory.

`number-only` and `numeric-string-only` describe the evidenced upstream JSON
representation, not whether a local schema matches every bound, default, or
integer rule. Such discrepancies are called out and tracked separately.

## Grok duration evidence

The current text-to-video OpenAPI (`DOC-04`) declares `duration` as a number
with 6–30 step-1 semantics in its description, but its request example sends
the JSON string `"6"`. The committed text-to-video HAR sent the same string at
`2026-04-16T07:18:50.680Z` and received HTTP 200. Its SHA-256 is
`2ed65430c2968ce64cbcc38a3b0c91c31e27464f00cbed1bd2f436e04d66ef74`.

The current image-to-video OpenAPI (`DOC-05`) declares `duration` as a string,
describes the same 6–30 step-1 semantics, and sends `"6"` in its request
example. The committed image-to-video HAR sent string `"6"` at
`2026-04-30T08:33:19.571Z` and received HTTP 200. Its SHA-256 is
`bcce0f7f4063885679acc734a8c4ee2745692f22c1684dcf878900fce686a984`.

The one allowed live probe established the missing numeric image-to-video fact:

- Credential preflight: `pnpm run check:op` passed.
- Start/end: `2026-07-31T18:49:11Z` / `2026-07-31T18:49:12Z`.
- Model and value: `grok-imagine/image-to-video`, JSON number `6`.
- Minimum payload: one public `image_urls` entry and `duration`; no callback,
  polling, retry, generated-media download, or committed recording.
- Redacted command:

  ```bash
  op run --env-file=.env -- curl \
    -X POST https://api.kie.ai/api/v1/jobs/createTask \
    -H 'Authorization: Bearer [redacted]' \
    -H 'Content-Type: application/json' \
    --data-raw '{"model":"grok-imagine/image-to-video","input":{"image_urls":["https://raw.githubusercontent.com/justintanner/apicity/main/tests/fixtures/cat1.jpg"],"duration":6}}'
  ```

- Result: HTTP 200; envelope `code: 200`, `msg: "success"`, and a task id was
  present. The task id is deliberately not retained here.

## Decision

Both `grok-imagine/text-to-video.input.duration` and
`grok-imagine/image-to-video.input.duration` are classified `both`. The next
dependency-ordered implementation item may widen only those two local schemas
to accept bounded integer numbers or canonical decimal integer strings from 6
through 30. It must preserve the supplied representation, retain the numeric
image-to-video default `6`, and reject coercive or noncanonical forms.

Every other row retains its current local behavior in this item. A current
declaration alone does not authorize a speculative numeric-string widening.
Unknown rows stay unknown, and documented discrepancies remain unchanged until
their linked Beads work establishes a deliberate contract.

## Follow-up discrepancies

The audit found five unrelated evidence groups that are concrete enough for
separate work but outside this item's two-field decision:

- `ac-4up9pn` — reconcile Grok Extend types, optionality, default, and lower
  bound against current docs and historical traffic.
- `ac-6uehjf` — decide whether Qwen2 image-edit `seed` is integer-only; the
  current local schema accepts fractions while `DOC-09` declares integer.
- `ac-07mm6l` — reconcile the Seedance 2 Mini duration default (`15` locally,
  `5` in `DOC-12`).
- `ac-kxdmvm` — decide whether Wan 2.7 image bounding-box coordinates are
  integer-only; both local schemas currently accept fractions.
- `ac-elwd7r` — reconcile ElevenLabs media stability, similarity, style, and
  speed bounds/defaults with the current OpenAPI exports.

## Official source registry

All hashes cover the exact UTF-8 Markdown response retrieved on 2026-07-31.

| ID     | URL                                                                     | SHA-256                                                            |
| ------ | ----------------------------------------------------------------------- | ------------------------------------------------------------------ |
| DOC-00 | https://docs.kie.ai/llms.txt                                            | `28d0bbd00f86c2cea957414a3b3b2250c36c6de97ea32ec119cbd05628ce0d31` |
| DOC-01 | https://docs.kie.ai/market/kling/kling-3-0.md                           | `8e91769f334c4b12d16537cc225c507ae80c2ddae76db14f8698559dc55410d0` |
| DOC-02 | https://docs.kie.ai/market/kling/v3-turbo-image-to-video.md             | `1c9f9ab8043070a23ab38c75360d26641f7649233d25a4f3090c03a8d0ca2a3e` |
| DOC-03 | https://docs.kie.ai/market/kling/v3-turbo-text-to-video.md              | `92649ab9812d3868ac1255e7861bcaa5477594225a1b41fd18ca36e7084696d4` |
| DOC-04 | https://docs.kie.ai/market/grok-imagine/text-to-video.md                | `aac0f86fbfc9eca8b48ecd09f175b1b83c074ecb38b49c5c7bd9fa26af15a05b` |
| DOC-05 | https://docs.kie.ai/market/grok-imagine/image-to-video.md               | `501884185fce60c18473aba69ce7e9e5d93843f76baf53882703a8b6703d5648` |
| DOC-06 | https://docs.kie.ai/market/grok-imagine/1-5-preview.md                  | `b9db86fc4d6dc738944289ac9f2f1753fd368e0532053970b266563df3beb25e` |
| DOC-07 | https://docs.kie.ai/market/grok-imagine/extend.md                       | `6a495e8b4787c6e063da393a5455d119c478a295960e3361535f3fa631fbf1b4` |
| DOC-08 | https://docs.kie.ai/market/qwen2/text-to-image.md                       | `f7f9bc18186f7eca06afc8e05f8c5de94b5d8ba0085fddee36283381ee128695` |
| DOC-09 | https://docs.kie.ai/market/qwen2/image-edit.md                          | `669abb6a6fb2b41f99539e15e312c315318f10e7f2b88535130f83d03eaaf781` |
| DOC-10 | https://docs.kie.ai/market/bytedance/seedance-2-fast.md                 | `d4b8daaa6b487f39abe7daa3602e478ff98978b946cebc42d0c6797a254838d2` |
| DOC-11 | https://docs.kie.ai/market/bytedance/seedance-2.md                      | `b61ad76b99afe2ca5eeeea41cf50cfe13e98ab76732b2142af1372d97d734592` |
| DOC-12 | https://docs.kie.ai/market/bytedance/seedance-2-mini.md                 | `cd6fedfe4984bd8a5e11fb6143c7f2488ffff9bca057a7e22cb9a9c18541e2ce` |
| DOC-13 | https://docs.kie.ai/market/wan/2-7-image-to-video.md                    | `88fdb4a0c8201dd440ea4e311063a28e16bf8ef1000db25bfc8e7ba5680714e7` |
| DOC-14 | https://docs.kie.ai/market/wan/2-7-text-to-video.md                     | `b6ae71e380c3c96adb39f5bf71d536967515d5ec2bbcad15af40e5be0277c3d6` |
| DOC-15 | https://docs.kie.ai/market/wan/2-7-r2v.md                               | `436b078887a931784384b2b7e7a999d5e627fcc5c6a871ccb7aee3d3bf940ae9` |
| DOC-16 | https://docs.kie.ai/market/wan/2-7-videoedit.md                         | `f3d430128497a4e04464fc1f43efcf399822eed9cf7163b76535d3ad3000cf6f` |
| DOC-17 | https://docs.kie.ai/market/wan/2-7-image.md                             | `8d1c13c0c9cd155968888fe1ba8053bcd5e11bc6b135876aae65037074ad0160` |
| DOC-18 | https://docs.kie.ai/market/wan/2-7-image-pro.md                         | `af2473f0149e9a033736be23b35ed060aef26c15c8242db7a2ca54560145b7f3` |
| DOC-19 | https://docs.kie.ai/market/happyhorse/text-to-video.md                  | `422c132da2ef812ae480fab0f2ebdcfb7e414f8c6b47076cdf7afadd99941a8c` |
| DOC-20 | https://docs.kie.ai/market/happyhorse/image-to-video.md                 | `e6e657656a36ee5befff4fa60e7a93385667148591b2f7950cb8c6652c25a170` |
| DOC-21 | https://docs.kie.ai/market/happyhorse/reference-to-video.md             | `c645623c7e8c8407b48cc93eb5823a842157708ea247330a611352696cab9297` |
| DOC-22 | https://docs.kie.ai/market/happyhorse/video-edit.md                     | `0dde955765fd447da4f082ac6a4cc007b31fca2312a4f0f13b4e5fdb78d758f5` |
| DOC-23 | https://docs.kie.ai/market/happyhorse-1-1/text-to-video.md              | `95b2af914728decfa6e93da284246a8f22ec9a00447d23308e9dc23167dcc0eb` |
| DOC-24 | https://docs.kie.ai/market/happyhorse-1-1/image-to-video.md             | `e335c26f6aa0bd70756180713195f9d085c506c0c26ec2d3caad9878e473674f` |
| DOC-25 | https://docs.kie.ai/market/happyhorse-1-1/reference-to-video.md         | `c1c24c5255417e1d1e88d6d8b5763edf37048036529b17cd5e4a27b4ade6e9d7` |
| DOC-26 | https://docs.kie.ai/market/omnihuman-1-5.md                             | `ab9070f5505b7b92e8a34a25956cc364e93334de9d414436fdb214cdcfa3a68f` |
| DOC-27 | https://docs.kie.ai/market/volcengine/video-to-video-lip-sync.md        | `c373f6e117bce35a84ef56377d92398e2bd07851ef0700a801808c80c534ab2f` |
| DOC-28 | https://docs.kie.ai/market/gemini-omni-video.md                         | `c48397bff1c597d1885c4bfbf3a9714177c5079137b6b250a79fedbea11ff173` |
| DOC-29 | https://docs.kie.ai/market/elevenlabs/text-to-dialogue-v3.md            | `af8459dffd80a4ec23a291c23f9959e82cd814b62829d37e568df05293431682` |
| DOC-30 | https://docs.kie.ai/market/elevenlabs/text-to-speech-multilingual-v2.md | `99292cead27b90ccc41fb8c75c9ba9e4441b379d4b7b9e1fdf64c90a33d142aa` |
| DOC-31 | https://docs.kie.ai/market/elevenlabs/text-to-speech-turbo-2-5.md       | `18e23ee4f96b5e7a0fee83ec5e52c2182eff6fd4239c3d1f271658df3808805f` |
| DOC-33 | https://docs.kie.ai/market/pixverse/text-to-video.md                    | `0262298f7fb23c11aebd780891d39839a065de16daf43fb042bad3f36f6ec5e7` |
| DOC-34 | https://docs.kie.ai/market/pixverse/image-to-video.md                   | `2042401ec6ccc94ff8ed592842b2cb557907dab0800667eeb0d57347bdf6432c` |
| DOC-35 | https://docs.kie.ai/market/pixverse/transition.md                       | `9b8d6898d05205e5ed28773892f128fdc07c3fce3ad208297349f7ef445d6808` |
| DOC-36 | https://docs.kie.ai/market/pixverse/extend.md                           | `092639d6883e0220f54b89775e9439546ecf837b809a7f2e658c864797950cd2` |
| DOC-37 | https://docs.kie.ai/market/pixverse/reference-to-video.md               | `787e3d8cce37bb2679eef55671d3acf3b401716b9ca87f11070862fa4e9b0e7a` |

## Numeric inventory

`NONE` means the current `DOC-00` index has no model-specific page. `absent`
means the current request example does not include that field. "Retain" means
this evidence item makes no runtime contract change for the row.

<!-- numeric-inventory:start -->

| Model                                     | Input path                    | Local contract                                                                                      | Official source     | Declared JSON type                          | Example JSON type   | Observation                                 | Classification      | Confidence | Decision                                   |
| ----------------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------- | ------------------- | ------------------------------------------- | ------------------- | ---------- | ------------------------------------------ |
| kling-3.0/video                           | input.duration                | required; numeric-string enum="3","4","5","6","7","8","9","10","11","12","13","14","15"             | DOC-01 @ 2026-07-31 | string default="5"                          | string ("5")        | none beyond current OpenAPI                 | numeric-string-only | high       | retain current behavior                    |
| kling-3.0/video                           | input.multi_prompt[].duration | optional; integer min=1 max=12                                                                      | DOC-01 @ 2026-07-31 | integer min=1 max=12                        | number (3)          | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                    |
| kling/v3-turbo-image-to-video             | input.duration                | required; numeric-string pattern=^[1-9]\d\*$                                                        | DOC-02 @ 2026-07-31 | string default="5"                          | string ("5")        | none beyond current OpenAPI                 | numeric-string-only | high       | retain current behavior                    |
| kling/v3-turbo-text-to-video              | input.duration                | optional; numeric-string enum="3","4","5","6","7","8","9","10","11","12","13","14","15" default="5" | DOC-03 @ 2026-07-31 | string default="5"                          | string ("5")        | none beyond current OpenAPI                 | numeric-string-only | high       | retain current behavior                    |
| grok-imagine/text-to-video                | input.duration                | optional; integer min=6 max=30                                                                      | DOC-04 @ 2026-07-31 | number                                      | string ("6")        | HAR string "6" -> HTTP 200 (2026-04-16)     | both                | high       | widen to bounded number + canonical string |
| grok-imagine/image-to-video               | input.index                   | optional; integer min=0 max=5 default=0                                                             | DOC-05 @ 2026-07-31 | integer min=0 max=5 default=0               | number (0)          | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                    |
| grok-imagine/image-to-video               | input.duration                | optional; integer min=6 max=30 default=6                                                            | DOC-05 @ 2026-07-31 | string                                      | string ("6")        | HAR string "6" -> 200; live number 6 -> 200 | both                | high       | widen to bounded number + canonical string |
| grok-imagine-video-1-5-preview            | input.duration                | optional; integer min=1 max=15 default=8                                                            | DOC-06 @ 2026-07-31 | integer multipleOf=1 min=1 max=15 default=8 | absent              | none beyond current OpenAPI                 | number-only         | medium     | retain current behavior                    |
| grok-imagine/extend                       | input.extend_at               | required; integer min=0                                                                             | DOC-07 @ 2026-07-31 | number min=2 default=2                      | number (2)          | current doc/local discrepancy; ac-4up9pn    | number-only         | high       | retain pending ac-4up9pn                   |
| grok-imagine/extend                       | input.extend_times            | required; numeric-string enum="6","10"                                                              | DOC-07 @ 2026-07-31 | number                                      | string ("6")        | current doc/local discrepancy; ac-4up9pn    | unknown             | medium     | retain pending ac-4up9pn                   |
| qwen2/text-to-image                       | input.seed                    | optional; integer                                                                                   | DOC-08 @ 2026-07-31 | integer                                     | number (0)          | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                    |
| qwen2/image-edit                          | input.seed                    | optional; number                                                                                    | DOC-09 @ 2026-07-31 | integer                                     | number (0)          | current doc/local discrepancy; ac-6uehjf    | number-only         | high       | retain pending ac-6uehjf                   |
| bytedance/seedance-2-fast                 | input.duration                | optional; integer min=4 max=15 default=5                                                            | DOC-10 @ 2026-07-31 | integer default=5                           | number (15)         | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                    |
| bytedance/seedance-2                      | input.duration                | optional; integer min=4 max=15 default=5                                                            | DOC-11 @ 2026-07-31 | integer default=5                           | number (15)         | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                    |
| bytedance/seedance-2-mini                 | input.duration                | optional; integer min=4 max=15 default=15                                                           | DOC-12 @ 2026-07-31 | integer default=5                           | number (15)         | current doc/local discrepancy; ac-07mm6l    | number-only         | high       | retain pending ac-07mm6l                   |
| wan/2-7-image-to-video                    | input.duration                | optional; integer min=2 max=15                                                                      | DOC-13 @ 2026-07-31 | integer min=2 max=15 default=5              | absent              | none beyond current OpenAPI                 | number-only         | medium     | retain current behavior                    |
| wan/2-7-image-to-video                    | input.seed                    | optional; integer min=0 max=2147483647                                                              | DOC-13 @ 2026-07-31 | integer min=0 max=2147483647                | absent              | none beyond current OpenAPI                 | number-only         | medium     | retain current behavior                    |
| wan/2-7-text-to-video                     | input.duration                | optional; integer min=2 max=15                                                                      | DOC-14 @ 2026-07-31 | integer min=2 max=15 default=5              | number (5)          | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                    |
| wan/2-7-text-to-video                     | input.seed                    | optional; integer min=0 max=2147483647                                                              | DOC-14 @ 2026-07-31 | integer min=0 max=2147483647                | number (123456)     | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                    |
| wan/2-7-r2v                               | input.duration                | optional; integer min=2 max=10                                                                      | DOC-15 @ 2026-07-31 | integer min=2 max=10 default=5              | number (5)          | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                    |
| wan/2-7-r2v                               | input.seed                    | optional; integer min=0 max=2147483647                                                              | DOC-15 @ 2026-07-31 | integer min=0 max=2147483647                | number (0)          | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                    |
| wan/2-7-videoedit                         | input.duration                | optional; integer min=0 max=10                                                                      | DOC-16 @ 2026-07-31 | integer min=0 max=10 default=0              | number (0)          | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                    |
| wan/2-7-videoedit                         | input.seed                    | optional; integer min=0 max=2147483647                                                              | DOC-16 @ 2026-07-31 | integer min=0 max=2147483647                | number (0)          | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                    |
| wan/2-7-image                             | input.n                       | optional; integer min=1 max=12                                                                      | DOC-17 @ 2026-07-31 | integer                                     | number (4)          | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                    |
| wan/2-7-image                             | input.bbox_list[][][]         | optional; number                                                                                    | DOC-17 @ 2026-07-31 | integer                                     | absent              | current doc/local discrepancy; ac-kxdmvm    | number-only         | medium     | retain pending ac-kxdmvm                   |
| wan/2-7-image                             | input.seed                    | optional; integer min=0 max=2147483647                                                              | DOC-17 @ 2026-07-31 | integer min=0 max=2147483647 default=0      | number (0)          | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                    |
| wan/2-7-image-pro                         | input.n                       | optional; integer min=1 max=12                                                                      | DOC-18 @ 2026-07-31 | integer                                     | number (4)          | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                    |
| wan/2-7-image-pro                         | input.bbox_list[][][]         | optional; number                                                                                    | DOC-18 @ 2026-07-31 | integer                                     | absent              | current doc/local discrepancy; ac-kxdmvm    | number-only         | medium     | retain pending ac-kxdmvm                   |
| wan/2-7-image-pro                         | input.seed                    | optional; integer min=0 max=2147483647                                                              | DOC-18 @ 2026-07-31 | integer min=0 max=2147483647 default=0      | number (0)          | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                    |
| happyhorse/text-to-video                  | input.duration                | optional; integer min=3 max=15                                                                      | DOC-19 @ 2026-07-31 | integer min=3 max=15 default=5              | number (5)          | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                    |
| happyhorse/text-to-video                  | input.seed                    | optional; integer min=0 max=2147483647                                                              | DOC-19 @ 2026-07-31 | integer min=0 max=2147483647 default=0      | number (1622429582) | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                    |
| happyhorse/image-to-video                 | input.duration                | optional; integer min=3 max=15                                                                      | DOC-20 @ 2026-07-31 | integer min=3 max=15 default=5              | number (5)          | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                    |
| happyhorse/image-to-video                 | input.seed                    | optional; integer min=0 max=2147483647                                                              | DOC-20 @ 2026-07-31 | integer min=0 max=2147483647 default=0      | number (1546095068) | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                    |
| happyhorse/reference-to-video             | input.duration                | optional; integer min=3 max=15                                                                      | DOC-21 @ 2026-07-31 | integer min=3 max=15 default=5              | number (5)          | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                    |
| happyhorse/reference-to-video             | input.seed                    | optional; integer min=0 max=2147483647                                                              | DOC-21 @ 2026-07-31 | integer min=0 max=2147483647 default=0      | number (1308038620) | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                    |
| happyhorse/video-edit                     | input.seed                    | optional; integer min=0 max=2147483647                                                              | DOC-22 @ 2026-07-31 | integer min=0 max=2147483647 default=0      | number (1764574909) | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                    |
| happyhorse-1-1/text-to-video              | input.duration                | optional; integer min=3 max=15 default=5                                                            | DOC-23 @ 2026-07-31 | number multipleOf=1 min=3 max=15 default=5  | number (5)          | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                    |
| happyhorse-1-1/image-to-video             | input.duration                | optional; integer min=3 max=15 default=5                                                            | DOC-24 @ 2026-07-31 | number multipleOf=1 min=3 max=15 default=5  | number (5)          | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                    |
| happyhorse-1-1/reference-to-video         | input.duration                | optional; integer min=3 max=15 default=5                                                            | DOC-25 @ 2026-07-31 | number multipleOf=1 min=3 max=15 default=5  | number (5)          | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                    |
| omnihuman-1-5                             | input.output_resolution       | optional; numeric-string enum="720","1080" default="1080"                                           | DOC-26 @ 2026-07-31 | string default="1080"                       | string ("1080")     | none beyond current OpenAPI                 | numeric-string-only | high       | retain current behavior                    |
| omnihuman-1-5                             | input.seed                    | optional; integer min=-1 default=-1                                                                 | DOC-26 @ 2026-07-31 | integer default=-1                          | number (-1)         | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                    |
| volcengine/video-to-video-lip-sync        | input.templ_start_seconds     | optional; number min=0 default=0                                                                    | DOC-27 @ 2026-07-31 | number default=0                            | number (0)          | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                    |
| gemini-omni-video                         | input.video_list[].start      | optional; number min=0                                                                              | DOC-28 @ 2026-07-31 | number min=0                                | number (0)          | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                    |
| gemini-omni-video                         | input.video_list[].ends       | optional; number min=0                                                                              | DOC-28 @ 2026-07-31 | number min=0                                | number (10)         | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                    |
| gemini-omni-video                         | input.duration                | required; numeric-string enum="4","6","8","10"                                                      | DOC-28 @ 2026-07-31 | string                                      | string ("4")        | none beyond current OpenAPI                 | numeric-string-only | high       | retain current behavior                    |
| gemini-omni-video                         | input.seed                    | optional; integer min=0 max=2147483647                                                              | DOC-28 @ 2026-07-31 | integer                                     | absent              | none beyond current OpenAPI                 | number-only         | medium     | retain current behavior                    |
| elevenlabs/text-to-dialogue-v3            | input.stability               | optional; number                                                                                    | DOC-29 @ 2026-07-31 | number default=0.5                          | number (0.5)        | current doc/local discrepancy; ac-elwd7r    | number-only         | high       | retain pending ac-elwd7r                   |
| elevenlabs/text-to-speech-multilingual-v2 | input.stability               | optional; number                                                                                    | DOC-30 @ 2026-07-31 | number min=0 max=1 default=0.5              | number (0.5)        | current doc/local discrepancy; ac-elwd7r    | number-only         | high       | retain pending ac-elwd7r                   |
| elevenlabs/text-to-speech-multilingual-v2 | input.similarity_boost        | optional; number                                                                                    | DOC-30 @ 2026-07-31 | number min=0 max=1 default=0.75             | number (0.75)       | current doc/local discrepancy; ac-elwd7r    | number-only         | high       | retain pending ac-elwd7r                   |
| elevenlabs/text-to-speech-multilingual-v2 | input.style                   | optional; number                                                                                    | DOC-30 @ 2026-07-31 | number min=0 max=1 default=0                | number (0)          | current doc/local discrepancy; ac-elwd7r    | number-only         | high       | retain pending ac-elwd7r                   |
| elevenlabs/text-to-speech-multilingual-v2 | input.speed                   | optional; number                                                                                    | DOC-30 @ 2026-07-31 | number min=0.7 max=1.2 default=1            | number (1)          | current doc/local discrepancy; ac-elwd7r    | number-only         | high       | retain pending ac-elwd7r                   |
| elevenlabs/text-to-speech-turbo-2-5       | input.stability               | optional; number                                                                                    | DOC-31 @ 2026-07-31 | number min=0 max=1 default=0.5              | number (0.5)        | current doc/local discrepancy; ac-elwd7r    | number-only         | high       | retain pending ac-elwd7r                   |
| elevenlabs/text-to-speech-turbo-2-5       | input.similarity_boost        | optional; number                                                                                    | DOC-31 @ 2026-07-31 | number min=0 max=1 default=0.75             | number (0.75)       | current doc/local discrepancy; ac-elwd7r    | number-only         | high       | retain pending ac-elwd7r                   |
| elevenlabs/text-to-speech-turbo-2-5       | input.style                   | optional; number                                                                                    | DOC-31 @ 2026-07-31 | number min=0 max=1 default=0                | number (0)          | current doc/local discrepancy; ac-elwd7r    | number-only         | high       | retain pending ac-elwd7r                   |
| elevenlabs/text-to-speech-turbo-2-5       | input.speed                   | optional; number                                                                                    | DOC-31 @ 2026-07-31 | number min=0.7 max=1.2 default=1            | number (1)          | current doc/local discrepancy; ac-elwd7r    | number-only         | high       | retain pending ac-elwd7r                   |
| elevenlabs/sound-effect-v2                | input.prompt_influence        | optional; number                                                                                    | NONE @ 2026-07-31   | unknown                                     | absent              | no current indexed model page               | unknown             | low        | retain; evidence unavailable               |
| pixverse-v6/text-to-video                 | input.duration                | required; integer min=1 max=15                                                                      | DOC-33 @ 2026-07-31 | integer min=1 max=15 default=5              | number (5)          | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                    |
| pixverse-v6/text-to-video                 | input.seed                    | optional; integer min=0 max=2147483647                                                              | DOC-33 @ 2026-07-31 | integer min=0 max=2147483647                | number (123456789)  | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                    |
| pixverse-v6/image-to-video                | input.duration                | optional; integer min=1 max=15                                                                      | DOC-34 @ 2026-07-31 | integer min=1 max=15 default=5              | number (5)          | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                    |
| pixverse-v6/image-to-video                | input.seed                    | optional; integer min=0 max=2147483647                                                              | DOC-34 @ 2026-07-31 | integer min=0 max=2147483647                | number (123456)     | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                    |
| pixverse-v6/transition                    | input.duration                | required; integer min=1 max=15                                                                      | DOC-35 @ 2026-07-31 | integer min=1 max=15 default=5              | number (5)          | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                    |
| pixverse-v6/transition                    | input.seed                    | optional; integer min=0 max=2147483647                                                              | DOC-35 @ 2026-07-31 | integer min=0 max=2147483647                | number (123456789)  | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                    |
| pixverse-v6/extend                        | input.duration                | required; integer min=1 max=15                                                                      | DOC-36 @ 2026-07-31 | integer min=1 max=15                        | number (5)          | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                    |
| pixverse-v6/extend                        | input.seed                    | optional; integer min=0 max=2147483647                                                              | DOC-36 @ 2026-07-31 | integer min=0 max=2147483647                | number (123456)     | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                    |
| pixverse-v6/reference-to-video            | input.duration                | required; integer min=1 max=15                                                                      | DOC-37 @ 2026-07-31 | integer min=1 max=15 default=5              | number (5)          | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                    |
| pixverse-v6/reference-to-video            | input.seed                    | optional; integer min=0 max=2147483647                                                              | DOC-37 @ 2026-07-31 | integer min=0 max=2147483647                | number (123456789)  | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                    |

<!-- numeric-inventory:end -->
