# Google Flow Character Metadata (REQ-007) — Negative Findings

Tracking beads: `ac-s4jb2` (WI-10, closed on this document), `ac-al61e`
(follow-up).

REQ-007 asserts that fetching a single Google Flow character by reference must
return the same fields the list endpoint reports, "so a character listed as
'Alice' with notes does not come back as 'Untitled Character'". This document
records an attempt to reproduce that symptom in this repository, and the
evidence that it is **not reproducible in-repo**.

It is a findings document only. It does not change provider behavior, and it
does not retire REQ-007 — the requirement is re-filed as `ac-al61e` for a
live-API reproduction.

## Disposition

The decomposition for WI-10 offered three paths: reproduced-and-ours (fix it),
reproduced-and-upstream (document the discrepancy), or not-reproducible (record
the negative findings and re-file). The third path applies.

## What was searched, and what was not found

### 1. The symptom string is absent

`grep -rni "untitled"` across the repository, excluding `node_modules/` and
`dist/`, returns exactly one hit:

```
scripts/audit.mjs:75:        title: advisory.title ?? "Untitled advisory",
```

That is an npm-audit fallback title and is unrelated. The string
"Untitled Character" appears nowhere in `packages/provider/googleflow`, its
examples, or any HAR recording.

### 2. The plan's prescribed remedy is a no-op

WI-10 prescribes widening "the single-character response type to a superset of
the list response type". Both already resolve to the _same_ type. Every
googleflow method is a `GoogleFlowMethod<TRequest>` returning
`Promise<GoogleFlowResponse>`, and `GoogleFlowResponse` is an open index
signature:

```typescript
// packages/provider/googleflow/src/types.ts:51
export interface GoogleFlowResponse {
  [key: string]: unknown;
}
```

The list method (`get.v1.googleFlow.characters`) and the single-fetch method
(`get.v1.googleFlow.characters.retrieve`) are both declared against it via
`GoogleFlowGetCharactersMethod` (`types.ts:108-110`). There is no narrower
single-fetch type to widen.

### 3. No response-side field stripping exists

`makeFlowRequest` returns the parsed body verbatim for every endpoint:

```typescript
// packages/provider/googleflow/src/google.ts:220
return (await res.json()) as T;
```

The only omission logic in the package is `bodyFromRequest`'s `omitKeys`
(`google.ts:99-110`), which applies to outbound _request_ bodies and is never
consulted on a response. The list and single-fetch character calls are both
built by the same `jsonGet` helper (`google.ts:228-247`), differing only in
their path function. The package therefore has no mechanism that could drop
fields from one and not the other.

### 4. No upstream payload evidence in-repo

The only googleflow recordings are under
`tests/recordings/google-flow_3038927025/`. They were captured against a local
echo server (`127.0.0.1:1818x`) that reflects method, path, and query back
rather than returning upstream data. The two character GET fixtures are:

```json
// GET /v1/google-flow/characters?email=user%40example.com
{ "ok": true, "method": "GET", "path": "/characters", "query": { "email": "user@example.com" } }

// GET /v1/google-flow/characters/char%2Fref
{ "ok": true, "method": "GET", "path": "/characters/char%2Fref", "query": {} }
```

Neither carries a character `name` or `notes` field, so AC-007's field-by-field
comparison cannot be evaluated against any recorded upstream payload.

## What would close REQ-007

A reproduction against the live `api.useapi.net` Google Flow API: fetch a
character that has both a name and notes via `GET /v1/google-flow/characters`
and via `GET /v1/google-flow/characters/{ref}`, then diff the payloads. That
requires a live useapi.net token and a real character, neither of which is
available in this repository's replay-only test suite.

If such a diff is real, it originates upstream — by finding 3 the package cannot
cause it — and REQ-007 reduces to documenting the discrepancy, per the plan's
own OQ-6 escape.

Giving `GoogleFlowResponse` real per-endpoint types is explicitly **not** the
remedy for REQ-007. It is a substantially larger change that overlaps WI-08's
response-typing clause and should be scheduled as its own item.
