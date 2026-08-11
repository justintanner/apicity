---
{
  "schema": "gc.build.implementation-summary.v1",
  "workflow": { "id": "ac-uiemlk", "formula": "do-work" },
  "methodology": { "pack": "gascity", "name": "build-basic" },
  "producer": { "formula": "do-work", "stage": "implement", "attempt": 1 },
  "status": "approved",
  "trace":
    {
      "upstream":
        [
          { "path": "beads/ac-gsoa3v", "hash": "bead:ac-gsoa3v" },
          {
            "path": "scripts/lib/kie-pricing-reconciliation.mjs",
            "hash": "sha256:084873831f4727627dc6bda8387fb1f86049eccb77103360eec76c86403684e8",
          },
          {
            "path": "tests/unit/kie-pricing-reconciliation.test.ts",
            "hash": "sha256:ddb9720f2b167420bd6361aa9a906b270f2cc52191c6d0b4291dddd32b9839c7",
          },
          {
            "path": "tests/integration/cost-estimate.test.ts",
            "hash": "sha256:eca0115c9dde8e8f192d875b97a53b853c7bee2b3756f39c4198a01fba7c2a86",
          },
          {
            "path": "tests/fixtures/kie-pricing-evidence/kie-pricing-reconciliation-2026-08-11T09-18-45-401Z.json",
            "hash": "sha256:09f04fd895082c4cb05313a64670bab3120bd05bf408f58aff417e0eceada5a5",
          },
          {
            "path": "tests/fixtures/kie-pricing-evidence/kie-pricing-reconciliation-2026-08-11T09-18-45-401Z.md",
            "hash": "sha256:7bd6d8d07fa2e51a7baf19cd6fea4ee8c818b985ec97a8e0fb8896c9b7379707",
          },
        ],
      "coverage":
        [
          { "id": "REQ-001", "status": "covered" },
          { "id": "REQ-002", "status": "covered" },
          { "id": "REQ-003", "status": "covered" },
          { "id": "REQ-004", "status": "covered" },
          { "id": "REQ-005", "status": "covered" },
          { "id": "REQ-006", "status": "covered" },
          { "id": "REQ-007", "status": "covered" },
          { "id": "REQ-008", "status": "covered" },
          { "id": "REQ-009", "status": "covered" },
          { "id": "REQ-010", "status": "covered" },
          { "id": "REQ-011", "status": "covered" },
          { "id": "REQ-012", "status": "covered" },
          { "id": "WI-6", "status": "covered" },
        ],
    },
}
---

# Implementation Summary: WI6 Kie pricing reconciliation

## Summary

Completed the WI6 executable, bidirectional Kie pricing audit against the
frozen 408-row official snapshot. Implemented rows use concrete selector
values, schema-valid representative payloads, cost hints where duration is
inherited, and billing-basis normalization. Runtime Kie rate variants are
covered by evidence-backed cases or explicit legacy, pricing-only, and
unreachable exceptions. The checker reports zero unclassified official rows
and zero unclassified ApiCity keys.

The audit preserves the comparison baseline of 4 added, 0 removed, and 17
changed rows. Inventory records retain both the pre-WI5 baseline
(127/135/137/137/23/31/71) and the final WI6 counts
(127/137/139/139/21/31/71) for models, pricing keys, slug keys, display keys,
schema-without-pricing, pricing-only keys, and endpoints respectively.

## Intended Behavior

- Execute every implemented official cell exactly through `computeEstimate`,
  including free-nonbillable rows with a per-unit breakdown and no warnings.
- Exercise every reachable `PRICING.kie` rate variant, with provenance for
  legacy, pricing-only, unreachable, and structured query/rate conflicts.
- Normalize per-1000-character and batch-image official units while retaining
  malformed source spellings explicitly; use named audited exceptions only
  where the callable contract proves the basis.
- Assert H3 image and Seedream input-image charges as additive differential
  components, and keep Topaz image/Grok upscale fail-closed.
- Reject generic createTask selector pollution, validate representative
  payloads with `CREATE_TASK_GUARDS`, strip endpoint audit metadata before
  estimation, and prove Wan speech duration from frame count and frame rate.

## Changed Files

- `scripts/lib/kie-pricing-reconciliation.mjs` — executable manifest builder,
  bidirectional runtime coverage, structured conflicts, inventory baselines,
  Prettier artifact emission, and safe CLI guard.
- `tests/unit/kie-pricing-reconciliation.test.ts` — schema-safe executable
  audit, official-unit equality, additive billing, runtime-variant coverage,
  conflict, exception, and inventory assertions.
- `tests/integration/cost-estimate.test.ts` — integrated Kie cost and fail-closed
  behavior assertions.
- `tests/fixtures/kie-pricing-evidence/kie-pricing-reconciliation-2026-08-11T09-18-45-401Z.json` — final
  machine-readable WI6 manifest.
- `tests/fixtures/kie-pricing-evidence/kie-pricing-reconciliation-2026-08-11T09-18-45-401Z.md` — final
  generated WI6 report.
- `tests/fixtures/kie-pricing-evidence/kie-estimator-safeguards-implementation-summary.md` — formatted
  convoy evidence summary.
- `tests/fixtures/kie-pricing-evidence/kie-pricing-baseline-2026-08-06.json` — formatted
  convoy baseline evidence.
- `tests/fixtures/kie-pricing-evidence/kie-pricing-implementation-summary.md` — formatted
  convoy evidence summary.
- `tests/fixtures/kie-pricing-evidence/kie-provider-architecture-implementation-summary.md` — formatted
  convoy evidence summary.

## Verification

- First verification command: `node scripts/lib/kie-pricing-reconciliation.mjs check --manifest tests/fixtures/kie-pricing-evidence/kie-pricing-reconciliation-2026-08-11T09-18-45-401Z.json` — exit 0; 408 rows, 127 models, 71 endpoints, 137 pricing keys, 139 slugs, 139 displays, and zero unclassified totals.
- Final behavioral proof command: `/gc/apicity/worktrees/ac-gsoa3v/node_modules/.bin/vitest run --config tests/vitest.integration.ts tests/unit/kie-pricing-reconciliation.test.ts tests/integration/cost-estimate.test.ts` — exit 0; 2 files and 71 tests passed.
- `PATH=/gc/apicity/worktrees/ac-gsoa3v/node_modules/.bin:$PATH pnpm run dev:preflight:fast -- kie` — exit 0; 174 files and 2,011 tests, plus 18 cross-cutting tests.
- `PATH=/gc/apicity/worktrees/ac-gsoa3v/node_modules/.bin:$PATH pnpm run dev:preflight:fast -- cost` — exit 0; 13 files and 785 tests, plus 18 cross-cutting tests.
- `git diff --check` — exit 0.
- `PATH=/gc/apicity/worktrees/ac-gsoa3v/node_modules/.bin:$PATH pnpm run ci:local` — exit 0; 706 files and 7,143 tests passed.

## Remaining Risks

The manifest remains bound to the immutable 2026-08-11 official snapshot;
future source or official pricing changes require a new audited generation.
No push was performed, per the required independent review boundary.

## Coverage

| ID      | Status  |
| ------- | ------- |
| REQ-001 | covered |
| REQ-002 | covered |
| REQ-003 | covered |
| REQ-004 | covered |
| REQ-005 | covered |
| REQ-006 | covered |
| REQ-007 | covered |
| REQ-008 | covered |
| REQ-009 | covered |
| REQ-010 | covered |
| REQ-011 | covered |
| REQ-012 | covered |
| WI-6    | covered |
