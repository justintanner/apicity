---
schema: gc.build.implementation-summary.v1
workflow:
  id: ac-evblhu
  formula: do-work
methodology:
  pack: gascity
  name: build-basic
producer:
  formula: do-work
  stage: implement
  attempt: 1
status: approved
trace:
  upstream:
    - path: beads/ac-q536qt
      hash: bead:ac-q536qt
    - path: tests/fixtures/kie-pricing-evidence/kie-pricing-snapshot-2026-08-11T09-18-45-401Z.json
      hash: sha256:5a11661f99a78ec391baa5fc38e9f8d215e3efb4651c237b26a74a46a5f03db7
    - path: tests/fixtures/kie-pricing-evidence/kie-pricing-pull-2026-08-11T09-18-45-401Z.json
      hash: sha256:abc7d0e037e05fd8a8c43a7c62651a6d013a7e8ee296cf3f82c99fd2d9e5e2b4
    - path: packages/provider/kie/src/zod.ts
      hash: sha256:0af0f7e397df46a8c664de43037b5aa5e62183ec5d358247b0201333a8c561d9
    - path: packages/provider/kie/src/model-schemas.ts
      hash: sha256:67160b79b06136d7f9c17b31cecf6408dcd1f046fe3d5529cd4674e174c993c2
  coverage:
    - id: REQ-004
      status: covered
    - id: REQ-005
      status: covered
    - id: REQ-008
      status: covered
    - id: REQ-009
      status: covered
    - id: WI-5
      status: covered
---

# Implementation Summary: WI-5 Kie pricing reconciliation

## Summary

Reconciled the supported Kie pricing rows against the frozen 2026-08-11
official snapshot without editing the reconciliation manifest. The cost table
now carries the four mandatory Seedance 2.5 per-second cells, refreshed
Seedance 2 Fast/Mini and MiniMax H3 rates, exact dated source URLs, callable
Seedream 5 Pro layer decomposition rates, exact additive media charges, and
required-selector metadata for billed axes that have no upstream default. No
unselectable nonzero floor is emitted: Grok Imagine upscale and Topaz image
upscale fail closed, while H3 reference-video payloads fail closed when their
clip duration is not present. Slug and display registries include the two new
callable pricing keys.

## Intended Behavior

- Seedance 2.5 prices 480p no-audio at $0.140/s, 480p audio at $0.085/s,
  720p no-audio at $0.315/s, and 720p audio at $0.190/s. The documented 720p,
  audio-on, five-second defaults are honored; an explicit `-1` duration fails
  closed unless a positive cost-only duration hint is supplied.
- Seedream 5 Pro layer decomposition prices `1K` and `1.5K` at $0.035/image
  and `2K` at $0.07/image. Its callable `auto` default remains unpriced because
  Kie publishes no `auto` cell; no tier is guessed. The live Seedream 5 Pro
  text-to-image and image-to-image createTask schemas require `quality`, so
  pricing also fails incomplete payloads rather than applying the docs-only
  `basic` default. Image-to-image adds the exact $0.0025 per input image after
  the first; an unknown image list fails closed.
- MiniMax H3 prices 768P at $0.08/s and 2K at $0.13/s. Its callable image
  inputs (`first_frame_url`, `last_frame_url`, and `reference_image_urls`) add
  the exact $0.04 per input image. Reference-video payloads fail closed because
  the request carries no clip duration for the separately billed video input.
- Grok Imagine upscale publishes $0.05, $0.10, and $0.15 task-dependent tiers,
  but `task_id` carries no source/target resolution. The estimator returns
  zero with a fail-closed warning rather than selecting the $0.05 tier. Topaz
  image upscale follows the same rule because `upscale_factor` has no
  documented output-resolution mapping.
- Seedance 2 Fast uses the documented 720p rate when `input.resolution` is
  omitted. Wan speech-to-video derives exact seconds as
  `input.num_frames / input.frames_per_second`, with documented defaults 80/16
  and explicit non-default frame/FPS combinations covered by tests; it does
  not require a cost hint.
- Existing callable surfaces were inspected explicitly. ElevenLabs dialogue
  remains character-billed at $0.07/1000 characters using all dialogue turns;
  Wan speech-to-video remains $0.06/$0.09/$0.12 per second at 480p/580p/720p;
  Wan animate retains its three exact resolution rates; and Suno vocal
  separation retains the schema-representable $0.05 separate-vocal and $0.25
  split-stem rates. Their reviewed provenance is dated 2026-08-11.
- Gemini TTS models are callable in the generic createTask surface, but their
  official rows are input/output token rates. They remain outside Kie's
  per-unit table rather than being assigned a character or mixed-token guess.
- Qwen Image 3, Ideogram V3 Reframe, and distinct Wan auxiliary routes remain
  unpriced and tied to follow-ups `ac-huxfmb`, `ac-flqhcu`, and `ac-7r282y`
  respectively because no callable mapping was evidenced for those routes.

## Changed Files

- `packages/provider/cost/src/pricing/kie.ts` — refreshed official rates and
  provenance, Seedance 2.5 duration/audio handling, exact H3 and Seedream
  additive charges, Wan frame/FPS duration derivation, fail-closed unmappable
  tiers, and required selector declarations.
- `packages/provider/cost/src/compute.ts` — shared exact-additive-charge and
  undefined fail-closed evaluation path.
- `packages/provider/cost/src/pricing/types.ts` and
  `packages/provider/cost/src/types.ts` — optional pricing extras and
  `breakdown.extraUsd` types.
- `packages/provider/cost/src/slugs.ts` — added Seedance 2.5 and Seedream layer
  decomposition slugs and display names.
- `tests/unit/cost-pricing.test.ts` — pinned all Seedance 2.5 cells, defaults,
  sentinel handling, strict Seedream quality, Seedream edit charges, layer
  decomposition provenance, H3 image shapes/video failure, Grok and Topaz
  fail-closed behavior, refreshed rates, Wan frame/FPS combinations, and
  required-selector failures.
- `tests/unit/cost-compute.test.ts` — shared exact-extra and undefined-extra
  regression coverage.
- `tests/fixtures/kie-pricing-evidence/kie-pricing-wi5-implementation-summary.md`
  — this WI5 handoff artifact.

## Verification

- First verification command: `/gc/apicity/node_modules/.bin/vitest run tests/unit/cost-pricing.test.ts` — stale expectations were corrected while adding the fail-closed and exact-charge regressions.
- `/gc/apicity/node_modules/.bin/prettier --write packages/provider/cost/src/pricing/kie.ts packages/provider/cost/src/slugs.ts tests/unit/cost-pricing.test.ts` — exit 0.
- `/gc/apicity/node_modules/.bin/eslint packages/provider/cost/src/pricing/kie.ts packages/provider/cost/src/slugs.ts tests/unit/cost-pricing.test.ts` — exit 0.
- `/gc/apicity/node_modules/.bin/tsc --noEmit -p packages/provider/cost/tsconfig.json` — exit 0.
- `/gc/apicity/node_modules/.bin/tsc --noEmit -p tests/tsconfig.json` — exit 0.
- `/gc/apicity/node_modules/.bin/vitest run tests/unit/cost-pricing.test.ts tests/unit/cost-slugs.test.ts tests/unit/cost-compute.test.ts` — exit 0; 584 tests passed.
- `/gc/apicity/node_modules/.bin/vitest run --config tests/vitest.integration.ts tests/integration/upload-recordings.test.ts tests/integration/multipart-recordings.test.ts tests/unit/endpoint-cost-tiers.test.ts` — exit 0; 18 tests passed.
- `node scripts/check-orphan-recordings.mjs --provider cost && node scripts/check-test-timers.mjs --provider cost` — exit 0.
- `pnpm run dev:preflight:fast -- cost` — not runnable in this detached worktree because its local `node_modules` directory is absent; the individual gate commands above passed using the shared launcher installation.
- Final proof command: `GC_BEAD_ID=ac-j59if0 .gc/scripts/checks/build-artifact-valid.sh` — exit 0; the implementation summary validated as `gc.build.implementation-summary.v1` from the launcher worktree.

## Remaining Risks

The frozen reconciliation manifest intentionally still reflects the WI5 input
inventory and must be regenerated exactly once by WI6 after this commit. The
Gemini TTS token-billed rows remain intentionally outside Kie's per-unit
estimator. Qwen Image 3, Ideogram V3 Reframe, and distinct Wan auxiliary routes
remain follow-up work because no callable mapping was evidenced; their links
are recorded above. All implemented unmappable nonzero tiers fail closed.

## Coverage

| ID      | Status  |
| ------- | ------- |
| REQ-004 | covered |
| REQ-005 | covered |
| REQ-008 | covered |
| REQ-009 | covered |
| WI-5    | covered |
