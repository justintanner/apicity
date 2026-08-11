---
schema: gc.build.implementation-summary.v1
workflow:
  id: ac-j6j2kl
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
    - path: beads/ac-oo9k9q
      hash: bead:ac-oo9k9q
    - path: scripts/lib/kie-pricing-reconciliation.mjs
      hash: sha256:f339696ceb5a6ee68236730171cdf071526345ab42dae47eb98048dfb1f2fe97
    - path: tests/unit/kie-pricing-reconciliation.test.ts
      hash: sha256:777118f53ffc1bf61a9de42ad5ca2950081cdeb09099d002f4cc4080d47eabad
    - path: tests/fixtures/kie-pricing-evidence/kie-pricing-reconciliation-2026-08-11T09-18-45-401Z.json
      hash: sha256:99983f24cff6e8bd5edaf395ab51c237e9f6cd23de961a39f089e698465ded0a
    - path: tests/fixtures/kie-pricing-evidence/kie-pricing-reconciliation-2026-08-11T09-18-45-401Z.md
      hash: sha256:137eab565c8a8969ec0cfe30f4849e3e91165e7c556b2d43d318d94d64546154
  coverage:
    - id: REQ-002
      status: covered
    - id: REQ-003
      status: covered
    - id: REQ-006
      status: covered
    - id: REQ-007
      status: covered
    - id: WI-2
      status: covered
---

# Implementation Summary: WI-2 Kie pricing reconciliation

## Summary

Added a network-free reconciliation checker that derives the current Kie
source inventories from TypeScript registries and `scripts/endpoint-docs.tsv`.
The initial dated manifest covers all 408 frozen official pricing occurrences,
127 schema models, 71 documented endpoints, 135 runtime pricing keys, and 137
slug/display keys. The checker reports zero unclassified raw rows and zero
unclassified ApiCity keys.
Implemented and canonical-alias rows each have exactly one canonical pricing
key. The manifest also records 23 schema-without-pricing models and 31
pricing-only runtime keys, with selector schema sources and explicit
query/description conflicts.

## Intended Behavior

- Every official occurrence is retained with its row hash, semantic key,
  evidence URL, exact official fields, and one closed-vocabulary disposition.
- Every model, endpoint, pricing key, slug, and display key is derived from the
  current source tree and independently classified with a rationale for
  explicit omissions.
- The four official Seedance 2.5 cells are preserved as implemented planned
  coverage: 480p no-audio $0.140/sec, 480p audio $0.085/sec, 720p no-audio
  $0.315/sec, and 720p audio $0.190/sec.
- Snapshot bytes, pull metadata, source registry hashes, row identity, and
  computed coverage summaries fail closed when stale or mutated.

## Changed Files

- `scripts/lib/kie-pricing-reconciliation.mjs` — source inventory extraction,
  row classification, manifest generation, validation, and Markdown rendering.
- `tests/unit/kie-pricing-reconciliation.test.ts` — count, Seedance, mutation,
  checksum, manifest, and human-summary coverage tests.
- `tests/fixtures/kie-pricing-evidence/kie-pricing-reconciliation-2026-08-11T09-18-45-401Z.json` —
  initial machine-readable reconciliation manifest.
- `tests/fixtures/kie-pricing-evidence/kie-pricing-reconciliation-2026-08-11T09-18-45-401Z.md` —
  initial human-readable reconciliation report.

## Verification

- First verification command: `node scripts/lib/kie-pricing-reconciliation.mjs check --manifest tests/fixtures/kie-pricing-evidence/kie-pricing-reconciliation-2026-08-11T09-18-45-401Z.json` — exit 0; 408 rows, 127 models, 71 endpoints, 135 pricing keys, 137 slugs, 137 displays, and zero unclassified totals.
- `/gc/apicity/node_modules/.bin/tsc --noEmit -p tests/tsconfig.json` — exit 0.
- `/gc/apicity/node_modules/.bin/eslint scripts/lib/kie-pricing-reconciliation.mjs tests/unit/kie-pricing-reconciliation.test.ts` — exit 0.
- `/gc/apicity/node_modules/.bin/vitest run tests/unit/kie-pricing-reconciliation.test.ts` — exit 0; 1 file and 12 tests passed.
- Final proof command: `node scripts/lib/kie-pricing-reconciliation.mjs check --manifest tests/fixtures/kie-pricing-evidence/kie-pricing-reconciliation-2026-08-11T09-18-45-401Z.json` — exit 0 after formatting and lint; the committed manifest still reproduces all source inventories and zero-unclassified assertions.

## Remaining Risks

This is the initial WI-2 gate. The manifest deliberately records 15 raw rows
as upstream-unmappable, 35 as unsupported-endpoint, 69 as token-billed, and
22 schema models as explicit WI-3 architecture handoffs where the current
estimator or callable source tree cannot prove a safe mapping. Exactly one
query/description conflict remains: Grok text-to-image versus its
text-to-video query. WI-3 through WI-6 must resolve those dispositions and
regenerate the manifest after source and pricing changes. The manifest is
bound to the immutable 2026-08-11 snapshot and must be regenerated for a new
official pull.

## Coverage

| ID | Status |
| --- | --- |
| REQ-002 | covered |
| REQ-003 | covered |
| REQ-006 | covered |
| REQ-007 | covered |
| WI-2 | covered |
