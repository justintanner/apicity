# Endpoint Signature Checks

Apicity enforces its provider-factory conventions with three repo checkers plus a
single fixer. They are **shared** across every provider (they walk the same
`scripts/lib/endpoint-walk.mjs` surface) and run in CI as part of `pnpm run lint`.
This document is the canonical reference for what each rule is, how intentional
deviations are acknowledged, and how the build gate fails on **new** warnings.

There is deliberately **no** factory/schema-specific lint plugin — the checks
below are the whole mechanism, and REQ-007 explicitly prohibits inventing a new
one.

## The checkers

All three live in `scripts/` and share the endpoint walker and convention
helpers (`scripts/lib/endpoint-walk.mjs`, `scripts/lib/endpoint-convention.mjs`).
Each exits non-zero on the first unacknowledged violation.

| Script                                  | pnpm script       | Enforces                                                                                                                                                                                                                       |
| --------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `scripts/check-endpoint-signatures.mjs` | `lint:signatures` | (1) endpoint keys are camelCase, never bracket-notation kebab-case; (2) the factory dotPath mirrors the upstream URL path segment-by-segment; (3) every POST endpoint exposes a zod request `.schema`.                         |
| `scripts/check-endpoint-comments.mjs`   | `lint:endpoints`  | Every endpoint carries the two-line `// <METHOD> <fullUrl>` + `// Docs: <docsUrl>` comment, and the docs hostname is on the provider's allow-list.                                                                             |
| `scripts/check-factory-signatures.mjs`  | `lint:factory`    | Each provider factory takes exactly one named options object, declares a named provider return type, and exposes the `timeout?` / `fetch?` (and, where present, `baseURL?`) transport hooks with the correct optionality/type. |

## Acknowledgment comments

When an endpoint or factory intentionally diverges from a rule, the divergence is
**acknowledged in place** with a one-line comment carrying a short reason. The
checker treats an acknowledged divergence as conforming; an _unacknowledged_ one
is a warning that fails the build.

| Comment                   | Applies to       | Meaning                                                                                                                       |
| ------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `// sig-ok: <reason>`     | endpoint         | The factory dotPath intentionally diverges from the URL-derived path (e.g. an ergonomic method name, a hoisted host segment). |
| `// schema-ok: <reason>`  | POST endpoint    | The POST has no zod request `.schema` because it has no JSON request body (body-less action, multipart upload, etc.).         |
| `// factory-ok: <reason>` | provider factory | The factory intentionally deviates from the standard shape.                                                                   |

The acknowledgment comment sits **above** the two-line URL/Docs comment, so the
endpoint-comment checker still sees the URL/Docs lines immediately above the
endpoint. Rules that are never acknowledgeable — camelCase endpoint keys and the
URL/Docs comment itself — must always be fixed, not annotated.

## The fixer

`pnpm run lint:signatures:fix` (`scripts/apply-sigok-comments.mjs`) inserts the
`// sig-ok:` / `// schema-ok:` acknowledgments for every currently-diverging
endpoint. Detection is shared with `check-endpoint-signatures.mjs`, so running
the fixer makes the checker pass **by construction**. It is idempotent — it skips
endpoints that already carry the matching acknowledgment — and defaults the
reason from the provider/dotPath (override the generic text with a specific
reason when the divergence deserves one). `// factory-ok:` is authored by hand;
there is no auto-fixer for factory-shape deviations.

## The build gate (fails on new warnings)

`lint:signatures`, `lint:factory`, and `lint:endpoints` are wired into
`lint:repo`, which `pnpm run lint` runs (`lint → lint:full → lint:repo`). CI runs
`pnpm run lint`, so any endpoint that newly diverges **without** an acknowledgment
fails the build. A new provider or endpoint therefore has exactly two conforming
outcomes: match the convention, or add an explicit `sig-ok` / `schema-ok` /
`factory-ok` acknowledgment with a reason.

Concretely: deleting the `// schema-ok:` line above a body-less POST (e.g.
`openai.v1.responses.cancel`) makes `check-endpoint-signatures.mjs` exit non-zero
with a "POST endpoint has no `.schema`" violation, and `pnpm run lint` fails with
it.

## Warning-count reconciliation (43 → 0)

The cost-policy directive recorded a baseline of **43** outstanding signature
checker warnings to triage (REQ-007). Those warnings were resolved through the
shared acknowledgment mechanism above — each divergence was either fixed to
conform or acknowledged with `sig-ok` / `schema-ok` — rather than by inventing a
new lint. As the provider surface grew past that snapshot, the fixer applied the
same acknowledgments to the newer endpoints, so the acknowledgment population is
now much larger than 43 while the _unacknowledged_ warning count is **0**:

```
$ node scripts/check-endpoint-signatures.mjs
Checked 1557 endpoints across 26 providers — camelCase keys, 1347 URL dotPaths, 623 POST schemas all conform.
```

The number the gate cares about is that unacknowledged count. It is 0 today and
CI keeps it at 0 by failing any new, unacknowledged divergence.
