---
schema: gc.build.implementation-summary.v1
workflow:
  id: ac-vnoapw
  formula: do-work
methodology:
  pack: gascity
  name: build-basic
producer:
  formula: do-work
  stage: implement
  attempt: 1
status: approved
evidence_root: tests/fixtures/kie-pricing-evidence
trace:
  upstream:
    - path: beads/ac-0t5jjo
      hash: bead:ac-0t5jjo
      ids:
        - REQ-004
        - REQ-008
        - REQ-012
        - WI-4
    - path: packages/provider/cost/src/pricing/types.ts
      hash: sha256:40f173213fb48421904fc6b39ecdec5c74b5ac409ce783d5ad3a32d314f0b736
    - path: packages/provider/cost/src/compute.ts
      hash: sha256:6f12ba3449fcaa0e66253924effa1f2a09edf3c280611ed3c6382cfa253d8a76
    - path: tests/unit/cost-compute.test.ts
      hash: sha256:76e17a004dba0319d6f6712a7002b210332f96a380e9570056d054aa5c46d1c1
  coverage:
    - id: REQ-004
      status: covered
    - id: REQ-008
      status: covered
    - id: REQ-012
      status: covered
    - id: WI-4
      status: covered
---

# Implementation Summary: WI-4 shared estimator safeguards

## Summary

Added an additive `required` selector contract for per-unit pricing entries.
Evidence-backed billing axes can now fail with their named missing dimension
before the generic selector join can resolve a partial rate key. Existing
entries remain unchanged because the flag is opt-in, while the focused cost
suite proves omitted optional selectors still work for fal and googleflow.

## Intended Behavior

- A selector with `required: true` returns a zero-cost unresolved estimate and
  a precise warning when its picker returns `undefined`.
- Missing required selectors are checked before pricing-table lookup, so a
  lower-dimensional rate cannot be selected accidentally.
- Selectors without the flag retain the existing optional/omitted-value join
  semantics, including non-Kie providers and mode-specific selectors.

## Changed Files

- `packages/provider/cost/src/pricing/types.ts` — documented and typed the
  optional required-selector contract.
- `packages/provider/cost/src/compute.ts` — checked required selectors before
  constructing and looking up a variant key.
- `tests/unit/cost-compute.test.ts` — added a partial-rate regression and
  non-Kie optional-selector compatibility coverage.

## Verification

- First verification command: `pnpm run test:run tests/unit/cost-compute.test.ts`
  — exit 1 because the isolated worktree has no local `node_modules` and
  `vitest` was unavailable.
- `/gc/apicity/node_modules/.bin/vitest run --config tests/vitest.integration.ts tests/unit/cost-compute.test.ts`
  — exit 0; 86 tests passed.
- `/gc/apicity/node_modules/.bin/vitest run --config tests/vitest.integration.ts tests/unit/cost-compute.test.ts tests/unit/cost-pricing.test.ts`
  — exit 0; 457 tests passed.
- `/gc/apicity/node_modules/.bin/tsc --noEmit -p tests/tsconfig.json` — exit 0.
- `/gc/apicity/node_modules/.bin/eslint packages/provider/cost/src/pricing/types.ts packages/provider/cost/src/compute.ts tests/unit/cost-compute.test.ts` — exit 0.
- `/gc/apicity/node_modules/.bin/prettier --check packages/provider/cost/src/pricing/types.ts packages/provider/cost/src/compute.ts tests/unit/cost-compute.test.ts` — exit 0 after formatting.
- Final proof command: `GC_BEAD_ID=ac-wvxw6k .gc/scripts/checks/build-artifact-valid.sh` — exit 0; the committed summary validates against `gc.build.implementation-summary.v1`.

## Remaining Risks

WI-5 must mark each fresh Kie selector that has no documented upstream
default with `required: true`; this stage intentionally does not edit Kie
pricing tables outside its exclusive ownership boundary. An empty selector
value remains an intentional mode-specific omission, while `undefined` is the
missing-axis signal for the new contract.

## Coverage

| ID      | Status  |
| ------- | ------- |
| REQ-004 | covered |
| REQ-008 | covered |
| REQ-012 | covered |
| WI-4    | covered |
