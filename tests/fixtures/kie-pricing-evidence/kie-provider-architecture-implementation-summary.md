---
schema: gc.build.implementation-summary.v1
workflow:
  id: ac-1tx8gb
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
    - path: beads/ac-9p592t
      hash: bead:ac-9p592t
      ids: [REQ-003, REQ-004, REQ-006, REQ-009, REQ-012, WI-3]
    - path: packages/provider/kie/src/zod.ts
      hash: sha256:0af0f7e397df46a8c664de43037b5aa5e62183ec5d358247b0201333a8c561d9
    - path: packages/provider/kie/src/model-schemas.ts
      hash: sha256:67160b79b06136d7f9c17b31cecf6408dcd1f046fe3d5529cd4674e174c993c2
    - path: packages/provider/kie/src/kie.ts
      hash: sha256:58ec0b97f37f26bd3ab61b64f3d077e185b561650b8be63d2e9b00e8e3dfbffd
    - path: tests/unit/kie-zod.test.ts
      hash: sha256:78f30571d45964897fe8cb6f711c406891b6df10a3a92cb5b1182425d5c54ead
  coverage:
    - id: REQ-003
      status: covered
    - id: REQ-004
      status: covered
    - id: REQ-006
      status: covered
    - id: REQ-009
      status: covered
    - id: REQ-012
      status: covered
    - id: WI-3
      status: covered
---

# Implementation Summary: WI-3 Kie provider/schema architecture

## Summary

WI-3 reconciled the Kie generic create-task boundary. The frozen source anchor
already contained 127 catalogued model IDs, 127 public descriptors, and 127
runtime guards; the new regression makes that three-way parity executable at
runtime in addition to the existing TypeScript `satisfies` checks. The source
anchor remains based on the verified WI-2 commit `cfac492637e09caf26e8f0ab4fcccb99268b4fc1`.

The official rows that fit the existing generic architecture (including the
Seedream layer model, Wan 2.2 create-task models, Google Gemini TTS models, and
ElevenLabs dialogue model) remain callable and are handed to WI-5 for pricing
reconciliation. Operations that need a new Kie route are kept unsupported.

## Intended Behavior

- Every catalogued Kie create-task model has exactly one descriptor and one
  runtime guard.
- The enum catalogue, `modelInputSchemas`, and `CREATE_TASK_GUARDS` cannot drift
  silently when a model is added or removed.
- Existing model schemas and defaults remain unchanged; no unsupported pricing
  row is mapped to a guessed model or transport.
- Direct Kie operations without an evidenced route remain explicit follow-up
  work rather than being folded into the generic create-task endpoint.

## Changed Files

- `tests/unit/kie-zod.test.ts` — added WI-3 runtime parity assertions for all
  127 catalogued Kie models.
- `tests/fixtures/kie-pricing-evidence/kie-provider-architecture-implementation-summary.md`
  — this validated implementation summary.

## Verification

- First verification command: `pnpm run test:run tests/unit/kie-zod.test.ts` —
  failed before test startup because the isolated worktree initially had no
  local `node_modules` (`vitest: not found`).
- `/gc/apicity/node_modules/.bin/vitest run --config tests/vitest.integration.ts tests/unit/kie-zod.test.ts`
  — exit 0; 1 file and 542 tests passed.
- `PATH=/gc/apicity/worktrees/ac-9p592t/node_modules/.bin:$PATH pnpm run dev:preflight:fast -- kie`
  — exit 0; provider lint, whole tests-project typecheck, 174 provider files
  and 2,003 tests, plus 3 cross-cutting recording tests passed.
- Final proof command: `GC_BEAD_ID=ac-l5c52k .gc/scripts/checks/build-artifact-valid.sh`
  — exit 0; `build artifact valid` for the recorded summary path.

## Remaining Risks

The frozen pricing manifest contains operations whose pricing URLs do not prove
callable Kie routes. WI-3 created the required discovered follow-ups:

- `ac-huxfmb` — Qwen Image 3 callable surface.
- `ac-flqhcu` — Ideogram V3 Reframe callable endpoint.
- `ac-7r282y` — Wan 2.2 auxiliary media endpoints.

WI-5 must map only evidenced callable operations and WI-6 must regenerate the
manifest after those pricing and architecture decisions. Seedream layer
decomposition, Wan generic create-task models, Google Gemini TTS, ElevenLabs
dialogue, and Suno vocal separation were not assigned new architecture beads
because the current source already exposes their generic/direct callable
surfaces; their remaining work is pricing reconciliation or evidence review.

## Coverage

| ID | Status |
| --- | --- |
| REQ-003 | covered |
| REQ-004 | covered |
| REQ-006 | covered |
| REQ-009 | covered |
| REQ-012 | covered |
| WI-3 | covered |
