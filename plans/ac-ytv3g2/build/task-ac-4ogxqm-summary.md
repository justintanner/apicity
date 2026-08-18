---
schema: gc.build.implementation-summary.v1
workflow:
  id: ac-ikdg8m
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
    - path: beads/ac-4ogxqm
      hash: bead:ac-4ogxqm
      ids:
        - REQ-006
        - REQ-007
        - AC-5
        - AC-6
    - path: plans/ac-ytv3g2/build/task-ac-aniivq-summary.md
      hash: sha256:da5d65e6ae7d2b530c781d7d54997eea377f4350f83edb8f3050600e51a6204e
    - path: tests/unit/kie-aleph-record-info-schema.test.ts
      hash: sha256:7cbc914477db1ea47def2ddc384da629e7f1f923b156ea7f3d46843dd0446249
  coverage:
    - id: REQ-006
      status: not_applicable
      rationale: Branch B observed no successful Aleph render, so no real success envelope exists for the conditional unit-fixture rebase.
    - id: REQ-007
      status: covered
    - id: AC-5
      status: not_applicable
      rationale: The approved Branch B contract requires both constructed success variants to remain honestly labeled and unchanged.
    - id: AC-6
      status: covered
---

# Implementation Summary: KIE Aleph Branch-B fixture disposition

## Summary

Completed the approved Branch B outcome for source anchor `ac-4ogxqm` without
editing `tests/unit/kie-aleph-record-info-schema.test.ts`. Its prerequisite
implementation exhausted the authorized four Aleph submissions; every task
ended with `successFlag: 3`, `errorCode: 500`, and no result video. Because no
success envelope was observed, re-basing either constructed success fixture
would fabricate evidence and is explicitly prohibited by this item's contract.

The existing constructed numeric- and string-timestamp success variants remain
honestly labeled. The intermediate, failure, boolean rejection, type pins, and
unknown-task coverage also remain unchanged.

| ID | Status |
| --- | --- |
| REQ-006 | not_applicable |
| REQ-007 | covered |
| AC-5 | not_applicable |
| AC-6 | covered |

## Intended Behavior

Under Branch A, one success variant would be re-based on the envelope observed
in a committed HAR and the alternate timestamp form would be retained as an
explicit schema-tolerance case. Branch B was selected upstream, so the correct
behavior is instead to preserve both constructed variants and avoid claiming
that either came from a successful Aleph task.

`REQ-007` and `AC-6` remain covered: waiting (`successFlag: 0`), failure
(`successFlag: 3` with `errorCode: 500` and a non-empty message), boolean
timestamp rejection, exported type pins, and unknown-task behavior remain
distinguishable and green.

## Changed Files

- `plans/ac-ytv3g2/build/task-ac-4ogxqm-summary.md` records the explicit
  not-applicable Branch B disposition and verification evidence.

No provider, test, recording, generated-example, or documentation source file
was changed. In particular,
`tests/unit/kie-aleph-record-info-schema.test.ts` remains byte-for-byte
unchanged from detached base revision `c3414de4260136ac8defa44351f146bd1f7b5040`.

## Verification

- First verification command:
  `git diff --exit-code -- tests/unit/kie-aleph-record-info-schema.test.ts` —
  **passed** with exit code 0 and no diff.
- `pnpm run test:provider -- kie` — **passed**: 181 files and 2,092 tests.
- Final proof command:
  `GC_BEAD_ID=ac-yckv7o .gc/scripts/checks/build-artifact-valid.sh` — **passed**
  with schema `gc.build.implementation-summary.v1` and the published absolute
  artifact path.

## Remaining Risks

- No real Aleph success envelope has been observed. The two success fixtures
  remain constructed tolerance examples and must not be presented as upstream
  evidence.
- Re-running paid generation would require fresh budget authority; this item
  made no network calls and incurred no additional spend.
- Workflow root `ac-ikdg8m` does not publish the expected `gc.work_dir`
  metadata. Artifact validation therefore uses the explicit launcher rig root
  `/gc/apicity`, matching the preceding item in this workflow.
