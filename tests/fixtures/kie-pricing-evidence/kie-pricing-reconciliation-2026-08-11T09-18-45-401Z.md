# Kie Pricing Reconciliation — tests/fixtures/kie-pricing-evidence/kie-pricing-snapshot-2026-08-11T09-18-45-401Z.json

## Scope

This initial, network-free reconciliation joins the frozen official Kie pricing pull to the current ApiCity Kie model, endpoint, pricing, slug, and display registries. Every raw occurrence and every inventory key has exactly one explicit disposition.

## Frozen Evidence

- Snapshot: `tests/fixtures/kie-pricing-evidence/kie-pricing-snapshot-2026-08-11T09-18-45-401Z.json`
- Snapshot SHA-256: `sha256:5a11661f99a78ec391baa5fc38e9f8d215e3efb4651c237b26a74a46a5f03db7`
- Reported/captured rows: **408/408**
- Unique/duplicate occurrences: **408/0**
- Comparison baseline: **404** rows; added **4**, removed **0**, changed **17**.

## Inventory Counts

| Surface | Count | Detail |
| --- | ---: | --- |
| Schema model IDs | 127 | descriptors 127; guards 127 |
| Documented endpoints | 71 | 53 POST; 18 GET |
| Runtime pricing keys | 135 | current Kie table |
| Schema-without-pricing inventory | 23 | explicit model memberships |
| Pricing-only inventory | 31 | explicit runtime-key memberships |
| Slug keys | 137 | Kie model metadata |
| Display keys | 137 | Kie model metadata |

## Row Dispositions

| Disposition | Count |
| --- | ---: |
| implemented | 201 |
| canonical-alias | 85 |
| duplicate | 0 |
| free-nonbillable | 3 |
| unsupported-endpoint | 35 |
| token-billed | 69 |
| upstream-unmappable | 15 |

Malformed or conflicting cells retained for downstream review: **22**.
Examples: sha256:965de053b342b89a582ca92040e1f771391a2ada7e199708cba095e1f492988f#1 (credit-unit-format), sha256:75676629885edb93635ce4f355e50a9584aab60bbceb153b7174df460f916507#1 (credit-unit-format), sha256:412c186f278699f823412f4ddeb6c58ad7dc21d756d986a13cd4a9d5782dd3ee#1 (credit-unit-format), sha256:a81d2759efd843c9dcd9350ea05aa91d65375e96e2a6c1eab70ffbccdc501ea3#1 (credit-unit-format), sha256:6d02ded92b2ac43445e40b03c06639de472601391a1005a8dd6e776a89b80bff#1 (credit-unit-format), sha256:91d91736be572f35eb57d3ab4adb8b67292b14084240c6f286b0a6ab6cd14260#1 (credit-unit-format), sha256:518c5e461eb2dbc7036ece15fa03a3b33c76d9be39e82faf9d37fa066feec3c5#1 (credit-unit-format), sha256:db28a0e35d3b9466d8a6947cb0186ea22685104c62fca6551ef4bc0ff907d7a5#1 (credit-unit-format)
Derived USD values: none; implemented cells retain the official published USD field and do not apply an inferred credit conversion.

## Evidence Conflicts

Query/description operation conflicts: **1**. These rows are upstream-unmappable and no pricing key is guessed.

| Occurrence | Description | Query model | Disposition |
| --- | --- | --- | --- |
| sha256:e4175f135dbd9e60f7961cf0c5fa3a0f3218600e3baf7c2e9738bd72cc560425#1 | grok-imagine, text-to-image | grok-imagine/text-to-video | upstream-unmappable |

## Seedance 2.5

The mandatory four official cells are present and marked implemented pending the downstream cost-table addition:

| Resolution | Generate audio | USD/sec | Occurrence |
| --- | --- | ---: | --- |
| 720p | audio | 0.190 | sha256:f343208348f54abf2d1c4e40751bd996115e248bf6c395382f52ea838228efe2#1 |
| 720p | no-audio | 0.315 | sha256:985b30aa8f4221a3230a72a03d84feab5302ae165424ceef9113aca9e5558522#1 |
| 480p | audio | 0.085 | sha256:307d3eedee19303eb54a9c3a4eb647c5e1d5912123e08bb72d21c6f7c1c7005a#1 |
| 480p | no-audio | 0.140 | sha256:40f9dba288fd7eaee8235c7749b7c1171e9f9e2804e8689355f5e05a96059453#1 |

## Explicit Audit Queue

Schema models without a current usable pricing key: **23**; pricing-only runtime keys: **31**.

| Model | Disposition | Technical blocker | Follow-up |
| --- | --- | --- | --- |
| `nano-banana-pro` | upstream-unmappable | No current usable pricing key is available in the initial source tree; retain this model as an explicit audit queue entry. | none |
| `nano-banana-2` | upstream-unmappable | No current usable pricing key is available in the initial source tree; retain this model as an explicit audit queue entry. | none |
| `seedream/5-pro-layer-decomposition` | unsupported-endpoint | ApiCity has no runtime pricing key for schema model seedream/5-pro-layer-decomposition; the WI-3 architecture handoff must decide whether the official operation is callable or needs a new pricing surface. | pending-WI3 |
| `bytedance/seedream` | unsupported-endpoint | ApiCity has no runtime pricing key for schema model bytedance/seedream; the WI-3 architecture handoff must decide whether the official operation is callable or needs a new pricing surface. | pending-WI3 |
| `bytedance/seedream-v4-edit` | unsupported-endpoint | ApiCity has no runtime pricing key for schema model bytedance/seedream-v4-edit; the WI-3 architecture handoff must decide whether the official operation is callable or needs a new pricing surface. | pending-WI3 |
| `bytedance/seedream-v4-text-to-image` | unsupported-endpoint | ApiCity has no runtime pricing key for schema model bytedance/seedream-v4-text-to-image; the WI-3 architecture handoff must decide whether the official operation is callable or needs a new pricing surface. | pending-WI3 |
| `bytedance/v1-lite-image-to-video` | unsupported-endpoint | ApiCity has no runtime pricing key for schema model bytedance/v1-lite-image-to-video; the WI-3 architecture handoff must decide whether the official operation is callable or needs a new pricing surface. | pending-WI3 |
| `bytedance/v1-lite-text-to-video` | unsupported-endpoint | ApiCity has no runtime pricing key for schema model bytedance/v1-lite-text-to-video; the WI-3 architecture handoff must decide whether the official operation is callable or needs a new pricing surface. | pending-WI3 |
| `bytedance/v1-pro-fast-image-to-video` | unsupported-endpoint | ApiCity has no runtime pricing key for schema model bytedance/v1-pro-fast-image-to-video; the WI-3 architecture handoff must decide whether the official operation is callable or needs a new pricing surface. | pending-WI3 |
| `bytedance/v1-pro-image-to-video` | unsupported-endpoint | ApiCity has no runtime pricing key for schema model bytedance/v1-pro-image-to-video; the WI-3 architecture handoff must decide whether the official operation is callable or needs a new pricing surface. | pending-WI3 |
| `bytedance/v1-pro-text-to-video` | unsupported-endpoint | ApiCity has no runtime pricing key for schema model bytedance/v1-pro-text-to-video; the WI-3 architecture handoff must decide whether the official operation is callable or needs a new pricing surface. | pending-WI3 |
| `wan/2-2-a14b-speech-to-video-turbo` | upstream-unmappable | No current usable pricing key is available in the initial source tree; retain this model as an explicit audit queue entry. | none |
| `wan/2-2-animate-move` | upstream-unmappable | No current usable pricing key is available in the initial source tree; retain this model as an explicit audit queue entry. | none |
| `wan/2-2-animate-replace` | upstream-unmappable | No current usable pricing key is available in the initial source tree; retain this model as an explicit audit queue entry. | none |
| `wan/2-6-flash-image-to-video` | unsupported-endpoint | ApiCity has no runtime pricing key for schema model wan/2-6-flash-image-to-video; the WI-3 architecture handoff must decide whether the official operation is callable or needs a new pricing surface. | pending-WI3 |
| `wan/2-6-flash-video-to-video` | unsupported-endpoint | ApiCity has no runtime pricing key for schema model wan/2-6-flash-video-to-video; the WI-3 architecture handoff must decide whether the official operation is callable or needs a new pricing surface. | pending-WI3 |
| `omnihuman-1-5/human-identification` | unsupported-endpoint | ApiCity has no runtime pricing key for schema model omnihuman-1-5/human-identification; the WI-3 architecture handoff must decide whether the official operation is callable or needs a new pricing surface. | pending-WI3 |
| `omnihuman-1-5/subject-detection` | unsupported-endpoint | ApiCity has no runtime pricing key for schema model omnihuman-1-5/subject-detection; the WI-3 architecture handoff must decide whether the official operation is callable or needs a new pricing surface. | pending-WI3 |
| `elevenlabs/audio-isolation` | unsupported-endpoint | ApiCity has no runtime pricing key for schema model elevenlabs/audio-isolation; the WI-3 architecture handoff must decide whether the official operation is callable or needs a new pricing surface. | pending-WI3 |
| `elevenlabs/text-to-dialogue-v3` | upstream-unmappable | No current usable pricing key is available in the initial source tree; retain this model as an explicit audit queue entry. | none |
| `elevenlabs/sound-effect-v2` | unsupported-endpoint | ApiCity has no runtime pricing key for schema model elevenlabs/sound-effect-v2; the WI-3 architecture handoff must decide whether the official operation is callable or needs a new pricing surface. | pending-WI3 |
| `sora-watermark-remover` | upstream-unmappable | No current usable pricing key is available in the initial source tree; retain this model as an explicit audit queue entry. | none |
| `pixverse-v6/text-to-video` | unsupported-endpoint | ApiCity has no runtime pricing key for schema model pixverse-v6/text-to-video; the WI-3 architecture handoff must decide whether the official operation is callable or needs a new pricing surface. | pending-WI3 |
| `pixverse-v6/image-to-video` | unsupported-endpoint | ApiCity has no runtime pricing key for schema model pixverse-v6/image-to-video; the WI-3 architecture handoff must decide whether the official operation is callable or needs a new pricing surface. | pending-WI3 |
| `pixverse-v6/transition` | unsupported-endpoint | ApiCity has no runtime pricing key for schema model pixverse-v6/transition; the WI-3 architecture handoff must decide whether the official operation is callable or needs a new pricing surface. | pending-WI3 |
| `pixverse-v6/extend` | unsupported-endpoint | ApiCity has no runtime pricing key for schema model pixverse-v6/extend; the WI-3 architecture handoff must decide whether the official operation is callable or needs a new pricing surface. | pending-WI3 |
| `pixverse-v6/reference-to-video` | unsupported-endpoint | ApiCity has no runtime pricing key for schema model pixverse-v6/reference-to-video; the WI-3 architecture handoff must decide whether the official operation is callable or needs a new pricing surface. | pending-WI3 |
| `google/gemini-2-5-pro-tts` | unsupported-endpoint | ApiCity has no runtime pricing key for schema model google/gemini-2-5-pro-tts; the WI-3 architecture handoff must decide whether the official operation is callable or needs a new pricing surface. | pending-WI3 |
| `google/gemini-3-1-flash-tts` | unsupported-endpoint | ApiCity has no runtime pricing key for schema model google/gemini-3-1-flash-tts; the WI-3 architecture handoff must decide whether the official operation is callable or needs a new pricing surface. | pending-WI3 |

## Verification Contract

- Snapshot bytes, pull metadata, and all six source registries are checksum-checked.
- Manifest row IDs, row hashes, semantic keys, and official fields must reproduce the snapshot exactly.
- Registry keys are derived from the current TypeScript/TSV source files; stale or missing entries fail the checker.
- Zero unclassified raw rows: **true**.
- Zero unclassified ApiCity keys: **true**.