# Kie Pricing Reconciliation — tests/fixtures/kie-pricing-evidence/kie-pricing-snapshot-2026-08-11T09-18-45-401Z.json

## Scope

This WI6 executable reconciliation joins the frozen official Kie pricing pull to the current ApiCity Kie model, endpoint, pricing, slug, and display registries. Every raw occurrence and every inventory key has exactly one explicit disposition.

## Frozen Evidence

- Snapshot: `tests/fixtures/kie-pricing-evidence/kie-pricing-snapshot-2026-08-11T09-18-45-401Z.json`
- Snapshot SHA-256: `sha256:5a11661f99a78ec391baa5fc38e9f8d215e3efb4651c237b26a74a46a5f03db7`
- Reported/captured rows: **408/408**
- Unique/duplicate occurrences: **408/0**
- Comparison baseline: **404** rows; added **4**, removed **0**, changed **17**.

## Inventory Counts

| Surface                          | Baseline | Final | Detail                           |
| -------------------------------- | -------: | ----: | -------------------------------- |
| Schema model IDs                 |      127 |   131 | descriptors 131; guards 131      |
| Documented endpoints             |       71 |    71 | 53 POST; 18 GET                  |
| Runtime pricing keys             |      135 |   137 | current Kie table                |
| Schema-without-pricing inventory |       23 |    25 | explicit model memberships       |
| Pricing-only inventory           |       31 |    31 | explicit runtime-key memberships |
| Slug keys                        |      137 |   139 | Kie model metadata               |
| Display keys                     |      137 |   139 | Kie model metadata               |

## Row Dispositions

| Disposition          | Count |
| -------------------- | ----: |
| implemented          |   194 |
| canonical-alias      |   104 |
| duplicate            |     0 |
| free-nonbillable     |     3 |
| unsupported-endpoint |    15 |
| token-billed         |    69 |
| upstream-unmappable  |    23 |

Malformed or conflicting cells explicitly classified by WI6: **12**.
Examples: sha256:965de053b342b89a582ca92040e1f771391a2ada7e199708cba095e1f492988f#1 (credit-unit-format), sha256:75676629885edb93635ce4f355e50a9584aab60bbceb153b7174df460f916507#1 (credit-unit-format), sha256:412c186f278699f823412f4ddeb6c58ad7dc21d756d986a13cd4a9d5782dd3ee#1 (credit-unit-format), sha256:6d02ded92b2ac43445e40b03c06639de472601391a1005a8dd6e776a89b80bff#1 (credit-unit-format), sha256:91d91736be572f35eb57d3ab4adb8b67292b14084240c6f286b0a6ab6cd14260#1 (credit-unit-format), sha256:518c5e461eb2dbc7036ece15fa03a3b33c76d9be39e82faf9d37fa066feec3c5#1 (credit-unit-format), sha256:cbb1e5a5b79a764121eea82347a58f8eee2dbac847d1eab16d80928ac3a28c6b#1 (credit-unit-format), sha256:a9373cc8950d57a3fb850b9944e8f984b645a74d6077b198a216a269ceff0f1a#1 (credit-unit-format)
Derived USD values: none; implemented cells retain the official published USD field and do not apply an inferred credit conversion.

## Evidence Conflicts

Structured evidence conflicts: **3** (1 query/operation; 2 official/runtime rate).

| Kind                                 | Occurrence                                                                | Description                                 | Official USD | Runtime USD | Query model                | Disposition         |
| ------------------------------------ | ------------------------------------------------------------------------- | ------------------------------------------- | -----------: | ----------: | -------------------------- | ------------------- |
| rate-conflict                        | sha256:56f4176ffba8ebda78d26c318dd3750e7b8e07bef30043f7fa331f63576cf8cb#1 | bytedance/seedance-2, 480p with video input |        0.057 |      0.0575 | —                          | upstream-unmappable |
| rate-conflict                        | sha256:767e5a741a9773d682a2c95caa3525630a22ea43ef5a982c06d22061f2a278cd#1 | grok-imagine, image-to-video, 1080p         |        0.004 |        0.04 | —                          | upstream-unmappable |
| query-description-operation-conflict | sha256:e4175f135dbd9e60f7961cf0c5fa3a0f3218600e3baf7c2e9738bd72cc560425#1 | grok-imagine, text-to-image                 |            — |           — | grok-imagine/text-to-video | upstream-unmappable |

## Seedance 2.5

The mandatory four official cells are executable against the integrated WI6 cost table:

| Resolution | Generate audio | USD/sec | Occurrence                                                                |
| ---------- | -------------- | ------: | ------------------------------------------------------------------------- |
| 720p       | audio          |   0.190 | sha256:f343208348f54abf2d1c4e40751bd996115e248bf6c395382f52ea838228efe2#1 |
| 720p       | no-audio       |   0.315 | sha256:985b30aa8f4221a3230a72a03d84feab5302ae165424ceef9113aca9e5558522#1 |
| 480p       | audio          |   0.085 | sha256:307d3eedee19303eb54a9c3a4eb647c5e1d5912123e08bb72d21c6f7c1c7005a#1 |
| 480p       | no-audio       |   0.140 | sha256:40f9dba288fd7eaee8235c7749b7c1171e9f9e2804e8689355f5e05a96059453#1 |

## Explicit Audit Queue

Schema models without a current usable pricing key: **25**; pricing-only runtime keys: **31**.

| Model                                  | Disposition         | Technical blocker                                                                                                | Follow-up |
| -------------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------- | --------- |
| `grok-imagine/upscale`                 | upstream-unmappable | The final WI6 inventory records the model without a current runtime pricing key as an explicit audit membership. | none      |
| `qwen3/text-to-image`                  | upstream-unmappable | The final WI6 inventory records the model without a current runtime pricing key as an explicit audit membership. | none      |
| `qwen3/image-to-image`                 | upstream-unmappable | The final WI6 inventory records the model without a current runtime pricing key as an explicit audit membership. | none      |
| `qwen3/pro-text-to-image`              | upstream-unmappable | The final WI6 inventory records the model without a current runtime pricing key as an explicit audit membership. | none      |
| `qwen3/pro-image-to-image`             | upstream-unmappable | The final WI6 inventory records the model without a current runtime pricing key as an explicit audit membership. | none      |
| `qwen/image-to-image`                  | upstream-unmappable | The final WI6 inventory records the model without a current runtime pricing key as an explicit audit membership. | none      |
| `bytedance/seedream`                   | upstream-unmappable | The final WI6 inventory records the model without a current runtime pricing key as an explicit audit membership. | none      |
| `bytedance/seedream-v4-edit`           | upstream-unmappable | The final WI6 inventory records the model without a current runtime pricing key as an explicit audit membership. | none      |
| `bytedance/seedream-v4-text-to-image`  | upstream-unmappable | The final WI6 inventory records the model without a current runtime pricing key as an explicit audit membership. | none      |
| `bytedance/v1-lite-image-to-video`     | upstream-unmappable | The final WI6 inventory records the model without a current runtime pricing key as an explicit audit membership. | none      |
| `bytedance/v1-lite-text-to-video`      | upstream-unmappable | The final WI6 inventory records the model without a current runtime pricing key as an explicit audit membership. | none      |
| `bytedance/v1-pro-fast-image-to-video` | upstream-unmappable | The final WI6 inventory records the model without a current runtime pricing key as an explicit audit membership. | none      |
| `bytedance/v1-pro-image-to-video`      | upstream-unmappable | The final WI6 inventory records the model without a current runtime pricing key as an explicit audit membership. | none      |
| `bytedance/v1-pro-text-to-video`       | upstream-unmappable | The final WI6 inventory records the model without a current runtime pricing key as an explicit audit membership. | none      |
| `wan/2-6-flash-image-to-video`         | upstream-unmappable | The final WI6 inventory records the model without a current runtime pricing key as an explicit audit membership. | none      |
| `wan/2-6-flash-video-to-video`         | upstream-unmappable | The final WI6 inventory records the model without a current runtime pricing key as an explicit audit membership. | none      |
| `omnihuman-1-5/human-identification`   | upstream-unmappable | The final WI6 inventory records the model without a current runtime pricing key as an explicit audit membership. | none      |
| `omnihuman-1-5/subject-detection`      | upstream-unmappable | The final WI6 inventory records the model without a current runtime pricing key as an explicit audit membership. | none      |
| `elevenlabs/audio-isolation`           | upstream-unmappable | The final WI6 inventory records the model without a current runtime pricing key as an explicit audit membership. | none      |
| `elevenlabs/sound-effect-v2`           | upstream-unmappable | The final WI6 inventory records the model without a current runtime pricing key as an explicit audit membership. | none      |
| `sora-watermark-remover`               | upstream-unmappable | The final WI6 inventory records the model without a current runtime pricing key as an explicit audit membership. | none      |
| `pixverse-v6/text-to-video`            | upstream-unmappable | The final WI6 inventory records the model without a current runtime pricing key as an explicit audit membership. | none      |
| `pixverse-v6/image-to-video`           | upstream-unmappable | The final WI6 inventory records the model without a current runtime pricing key as an explicit audit membership. | none      |
| `pixverse-v6/transition`               | upstream-unmappable | The final WI6 inventory records the model without a current runtime pricing key as an explicit audit membership. | none      |
| `pixverse-v6/extend`                   | upstream-unmappable | The final WI6 inventory records the model without a current runtime pricing key as an explicit audit membership. | none      |
| `pixverse-v6/reference-to-video`       | upstream-unmappable | The final WI6 inventory records the model without a current runtime pricing key as an explicit audit membership. | none      |
| `google/gemini-2-5-pro-tts`            | upstream-unmappable | The final WI6 inventory records the model without a current runtime pricing key as an explicit audit membership. | none      |
| `google/gemini-3-1-flash-tts`          | upstream-unmappable | The final WI6 inventory records the model without a current runtime pricing key as an explicit audit membership. | none      |
| `topaz/image-upscale`                  | upstream-unmappable | The final WI6 inventory records the model without a current runtime pricing key as an explicit audit membership. | none      |

## Runtime Variant Coverage

Every live Kie per-unit rate variant is covered by an executable official case or one of **11** explicit exceptions below. Zero-rate Grok and Topaz entries are unreachable sentinels, not free variants.

| Runtime identity                   | Status | Provenance   | Rationale                                                                                                                                                                                         |
| ---------------------------------- | ------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `grok-imagine/image-to-video       | 1080p` | pricing-only | frozen Grok image-to-video 1080p cell publishes $0.004/s; live Kie 1080p tier is $0.04/s                                                                                                          | No exact official USD evidence matches the reachable runtime tier; the malformed official row is upstream-unmappable.                                                  |
| `grok-imagine/text-to-image        | `      | pricing-only | frozen snapshot contains a $0.02 default row whose URL query names text-to-video, plus a separate $0.025 quality bundle row                                                                       | The live non-pro default bundle has no conflict-free official cell; the query-conflicted row remains upstream-unmappable and the quality bundle is audited separately. |
| `hailuo/02-image-to-video-standard | 6      | 768P`        | pricing-only                                                                                                                                                                                      | frozen snapshot contains 6s/512p and 10s/768p, but no 6s/768p cell                                                                                                     | WI6 records the live variant as pricing-only because the frozen source has no exact cell for this selector combination. |
| `bytedance/seedance-2              | 480p   | video`       | pricing-only                                                                                                                                                                                      | frozen Seedance 2 480p reference-video cell publishes $0.057; live runtime rate is $0.0575                                                                             | The official/runtime USD conflict is explicit in WI6 and is not rounded or treated as exact evidence.                   |
| `grok-imagine/upscale              | `      | unreachable  | live PRICING.kie contains a zero-rate fail-closed sentinel; the frozen source has no callable selector for Grok upscale                                                                           | The zero entry is an unreachable sentinel, never a free estimate, because source and target resolution selectors are absent from the task request.                     |
| `topaz/image-upscale               | `      | unreachable  | live PRICING.kie contains a zero-rate fail-closed sentinel; the frozen Topaz image rows are not expressible by the callable request                                                               | The zero entry is an unreachable sentinel, never a free estimate, because output-resolution billing cannot be derived from the request schema.                         |
| `runway/extend                     | 720p`  | pricing-only | no matching official occurrence in the frozen 408-row Kie snapshot                                                                                                                                | WI6 records the live runtime option as pricing-only because no exact official cell identifies this variant.                                                            |
| `runway/extend                     | 1080p` | pricing-only | no matching official occurrence in the frozen 408-row Kie snapshot                                                                                                                                | WI6 records the live runtime option as pricing-only because no exact official cell identifies this variant.                                                            |
| `sora-watermark-remover            | `      | pricing-only | no matching official occurrence in the frozen 408-row Kie snapshot                                                                                                                                | WI6 records the live runtime option as pricing-only because no exact official cell identifies this variant.                                                            |
| `nano-banana                       | `      | legacy       | frozen snapshot contains nano-banana family rows, but they identify google/nano-banana, nano-banana-2, nano-banana-pro, or google/nano-banana-edit rather than the legacy nano-banana runtime key | The legacy family key is retained as legacy; family-name collapse must not substitute it for a concrete official model operation.                                      |
| `qwen/image-to-image               | `      | unreachable  | frozen Qwen Image image-to-image cell is nonzero, but no output-area or megapixel selector exists in the callable schema                                                                          | The live rate is units-unreachable; it must fail closed rather than injecting undeclared image_size or claiming a free/default area.                                   |

## Verification Contract

- Snapshot bytes, pull metadata, and all six source registries are checksum-checked.
- Manifest row IDs, row hashes, semantic keys, and official fields must reproduce the snapshot exactly.
- Registry keys are derived from the current TypeScript/TSV source files; stale or missing entries fail the checker.
- Zero unclassified raw rows: **true**.
- Zero unclassified ApiCity keys: **true**.
