# Apicity Provider Gap Inventory

This document records the provider schema and endpoint gaps tracked by the
`ac-sh9k` epic. It is an inventory and handoff reference; implementation work
belongs in the focused beads listed below.

Restored on 2026-06-23 because `docs/apicity-gaps.md` was absent from
`origin/main`. The source of truth for scheduling remains beads, not this file.

## Tracking Beads

| Area                            | Bead         | Scope                                                                |
| ------------------------------- | ------------ | -------------------------------------------------------------------- |
| Docs restoration                | `ac-sh9k.2`  | Restore this inventory document.                                     |
| Zod major/runtime compatibility | `ac-sh9k.3`  | Align provider Zod runtime and declaration compatibility.            |
| Request input types             | `ac-sh9k.4`  | Export `z.input` request types for defaulted schemas.                |
| Constraint metadata             | `ac-sh9k.5`  | Preserve Zod constraints in public metadata and model input schemas. |
| Schema introspection            | `ac-sh9k.6`  | Stabilize unwrap-safe optional/default/refined schema access.        |
| KIE Grok video schemas          | `ac-sh9k.7`  | Split and harden Grok Imagine t2v/i2v surfaces.                      |
| KIE Wan 2.7 videoedit           | `ac-sh9k.8`  | Make videoedit duration constraints introspectable.                  |
| KIE HappyHorse duration         | `ac-sh9k.9`  | Export shared HappyHorse duration schema and metadata.               |
| xAI video duration              | `ac-sh9k.10` | Constrain relevant video durations to supported values.              |
| Alibaba video schemas           | `ac-sh9k.11` | Export standalone video model enum and unwrap-safe schemas.          |
| Alibaba Qwen image schemas      | `ac-sh9k.12` | Split Qwen generation/edit models and image slot schemas.            |
| fal WAN r2v duration            | `ac-sh9k.13` | Remove invalid `0` duration from reference-to-video.                 |
| X users/me endpoint             | `ac-sh9k.14` | Add authenticated `GET /2/users/me` support.                         |

## Workspace-Wide Schema Gaps

The workspace has several schema/type issues that cut across providers:

- Mixed Zod majors: `@apicity/kie` depends on Zod 4 while
  `@apicity/alibaba`, `@apicity/xai`, `@apicity/fal`, and `@apicity/x`
  currently depend on Zod 3.
- Request types are exported as parsed `z.infer` outputs only. For schemas
  with `.default()`, callers see defaulted fields as required even when runtime
  input accepts omission.
- Numeric, string, integer, and length constraints are not consistently exposed
  in public metadata. The MCP Zod-to-JSON-schema bridge already reads some Zod
  checks, but manual registries such as KIE `modelInputSchemas` still rely on
  prose for many constraints.
- Downstream introspection is fragile when schemas mix bare fields,
  `.optional()`, `.default()`, nullable wrappers, and outer
  `.refine()`/effects. Callers should not need to depend on raw
  `.unwrap().options` paths.

## Provider Gaps

### `@apicity/kie`

Grok Imagine video schemas need separate t2v and i2v surfaces where upstream
behavior differs:

- `mode` currently includes `spicy` broadly, but i2v rejects or limits it.
- Active i2v aspect ratios should not expose `auto` if it is not honored.
- i2v duration is too loose because it accepts both numbers and digit strings.
- i2v prompt cap should match the expected 4096-character limit where
  applicable rather than 5000.

Wan 2.7 videoedit duration is behaviorally constrained by an outer refine, but
the field itself remains `z.number().int().optional()`. The 0-or-2-through-10
domain should be exported and visible to metadata consumers.

HappyHorse text/image/reference-to-video duration bounds are repeated inline.
There is no exported HappyHorse duration schema/type for callers and UI layers.

### `@apicity/xai`

Video generation/extension duration is currently exposed as an unbounded number
on relevant schemas. The implementation bead should verify the applicable
surfaces and constrain duration to the documented accepted values, currently
expected to be 6 or 10 seconds.

### `@apicity/alibaba`

DashScope video model options are embedded inside refined request schemas,
which makes model discovery brittle for UI and generated-tool consumers.

Qwen image generation/editing model IDs are intermixed in one enum, including
dated snapshots and stable IDs. Generation-vs-edit constraints should be
represented explicitly. Current code has an image reference slot companion for
Wan image generation; Qwen multimodal generation/editing still needs explicit
slot schemas and export coverage.

### `@apicity/fal`

WAN 2.7 reference-to-video accepts `duration: 0` in the schema, but r2v has no
source clip where 0/full-source semantics apply. That value should remain valid
only on surfaces that actually operate on a source clip.

### `@apicity/x`

The provider has OAuth token, media upload/status, and tweet creation surfaces,
but lacks `GET /2/users/me`. Clients therefore cannot read the authenticated
handle even though the documented OAuth flow requests `users.read`.

## Out Of Scope

This inventory does not implement provider changes, add live API recordings, or
replace bead state. Each implementation bead should keep its own focused tests,
generated-doc updates, and acceptance criteria.
