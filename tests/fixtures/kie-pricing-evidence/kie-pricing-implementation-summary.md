---
schema: gc.build.implementation-summary.v1
workflow:
  id: ac-iw40hr
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
    - path: beads/ac-ypfsdq
      hash: bead:ac-ypfsdq
      ids: [REQ-001, REQ-007, WI-1]
    - path: scripts/kie-pricing-audit.mjs
      hash: sha256:a330ab41351c50db23399212386f3ec55eb2554b36e78c1e0dabdf8ddc4b87ec
    - path: scripts/lib/kie-pricing-pull.mjs
      hash: sha256:6a57b688124c9c7a2dc50c88e728b663e7b3e5913698e571c957b104effd2c2f
    - path: tests/unit/kie-pricing-audit-pull.test.ts
      hash: sha256:013d195b76cdaa84067002e72b82de869cc877c7eeec452d8a11b61b58281aec
  coverage:
    - id: REQ-001
      status: covered
    - id: REQ-007
      status: covered
    - id: WI-1
      status: covered
---

# Implementation Summary: WI-1 Kie pricing audit evidence

## Summary

WI-1 now pulls every official Kie pricing page, validates pagination and row
integrity, sanitizes the response envelope before persistence, and writes the
snapshot, pull metadata, page captures, and source facts under the tracked
canonical evidence root `tests/fixtures/kie-pricing-evidence`. WI-2 and WI-6
must inherit this root; no `/plans` artifact is part of the delivery.

The frozen pull contains 408 reported and captured rows. The durable baseline
comparison is 4 added, 0 removed, and 17 changed, with the complete row lists
persisted as `addedRows`, `removedRows`, and `changedRows`.

## Intended Behavior

- Every persisted snapshot page is checked against its ordered annotated
  `record.raw` values using canonical content and row hashes.
- Every source capture is checked against the sanitized snapshot response for
  the same page, with matching checksums and one-to-one page coverage.
- Every source fact binds to the exact page, capture path, JSON pointer, row
  occurrence, and checksum; cross-page references fail validation.
- Credential-like response fields are redacted before persistence. If
  sanitization changes a pricing record, the pull fails closed rather than
  dropping a billable field. The generated redaction round-trip verifies
  `[REDACTED]` and absence of the injected secret in every artifact.

## Changed Files

- `scripts/kie-pricing-audit.mjs` — pull/check CLI and tracked evidence-root
  defaults.
- `scripts/lib/kie-pricing-pull.mjs` — pagination, sanitization, persistence,
  comparison, and provenance validation.
- `tests/unit/kie-pricing-audit-pull.test.ts` — strict typing and focused
  mutation/security/provenance tests.
- `tests/fixtures/kie-pricing-page-sequences.json` — pagination fixtures.
- `tests/fixtures/kie-pricing-evidence/` — baseline, dated snapshot, metadata,
  five sanitized page captures, and sources index.

## Verification

- `pnpm exec tsc --noEmit -p tests/tsconfig.json` — exit 0.
- `pnpm run lint:after-format` — exit 0; ignore-shadow checked 1992 tracked
  files and found no new shadowed artifact.
- `pnpm run test:run tests/unit/kie-pricing-audit-pull.test.ts` — exit 0;
  1 file and 19 tests passed.
- `pnpm run test:run` — exit 0; 705 files and 7100 tests passed.
- `node scripts/kie-pricing-audit.mjs check --snapshot tests/fixtures/kie-pricing-evidence/kie-pricing-snapshot-2026-08-11T09-18-45-401Z.json --metadata tests/fixtures/kie-pricing-evidence/kie-pricing-pull-2026-08-11T09-18-45-401Z.json` — exit 0; 408 rows, 5 pages, and 5 source captures checked.
- Snapshot SHA-256: `sha256:5a11661f99a78ec391baa5fc38e9f8d215e3efb4651c237b26a74a46a5f03db7`.
- `git ls-files` contains every required baseline, dated pull, snapshot,
  source capture, sources index, and page fixture; staged `/plans` paths: 0.

## Remaining Risks

The official pricing endpoint is mutable, so this evidence is an immutable
record of the captured pull rather than a guarantee that later upstream pages
remain unchanged. Downstream work must use the canonical evidence root and
preserve the page/capture/source bindings when deriving reports.

## Coverage

| ID      | Status  |
| ------- | ------- |
| REQ-001 | covered |
| REQ-007 | covered |
| WI-1    | covered |
