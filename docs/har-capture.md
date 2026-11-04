# Opt-in HAR capture

`@apicity/har` records Node.js fetch exchanges in HAR 1.2 format. Nothing is
captured until you create a capture and inject its fetch or install its wrapper.
WebSockets are outside its scope.

```typescript
import { createHarCapture } from "@apicity/har";
import { createKie } from "@apicity/kie";

const capture = createHarCapture({
  dir: "./captures",
  mode: "failures", // or "all"
  context: { attemptId: "attempt-123" },
  onError: (error) => console.error("HAR capture disabled", error),
});
const kie = createKie({
  apiKey: process.env.KIE_API_KEY!,
  fetch: capture.fetch,
});
try {
  const input = { taskId: "task-123" };
  const result = await capture.call(
    { provider: "kie", endpoint: "api.v1.jobs.recordInfo", input },
    () => kie.get.api.v1.jobs.recordInfo(input.taskId)
  );
  console.log(result);
} finally {
  await capture.close();
}
```

Capture keeps prompts, media URLs, model parameters, provider responses and
error text, HTTP status, and timings. It scrubs authentication headers, signed
URL credentials, known secret fields in JSON and form-encoded bodies, and cookies
before writing. Non-text
bodies and bodies larger than `maxBodyBytes` (default 256 KiB) become placeholders
with SHA-256, byte count and content type. Multipart uploads retain field and
file summaries, not file bytes. Large base64 and data URL media are summarized, in
bodies and in the call's `input`. Base64 may wrap on line ends at one width of 60
characters or more. A string with spaces in it, or with one word, path or ID to a
line, is text. Captures still contain application data: choose a private directory
and share only the captures you intend to share.

Two kinds of oversized body keep what a cost report needs:

- **A JSON request** up to `maxSummarizeBytes` (default 16 MiB) is held in full and
  its media summarized. If the result fits `maxBodyBytes` the text is kept, so a
  video analysis request still shows its model and limits. If it does not, or the
  body is larger than `maxSummarizeBytes`, it becomes a placeholder. `bodySize` is
  always the wire byte count.
- **An SSE response** keeps its first `maxBodyBytes` plus its last `sseTailBytes`
  (default 64 KiB), because the usage frame comes last. Each part keeps whole lines,
  and they are joined by an SSE comment, `: apicity-gap <n> bytes dropped`, which no
  parser reads as a frame. `streamed` and `bodyTruncated` are set, and scrubbing
  covers all of the retained text. A body with no line ends keeps its head alone.
  When the frame carrying the final usage is larger than `sseTailBytes` it goes with
  the gap, and `extractActual` reads the call as unsettled. Raise the limit for a
  provider that repeats a long output in its final frame. Set `sseTailBytes: 0` to
  keep the head only.

`bodyTruncated` covers both directions, so it can mean the request was cut while
the response is whole, and a body that failed mid-read as well as one over a cap.
Captures from before this behaviour have a placeholder or a head-only stream, and
read the same way as any other.

A call's `input` holds no media. Each data URL or base64 field over 1024 characters,
and each byte array, becomes the placeholder a dropped body leaves:

```json
{
  "_apicity_placeholder": {
    "sha256": "<hash>",
    "bytes": 161585,
    "contentType": "image/jpeg"
  }
}
```

The hash and byte count describe the decoded media, or the text as written for a
data URL that is not base64. `contentType` is the data URL's media type, otherwise
`application/octet-stream`. The model, parameters, prose and shorter strings stay,
and neither the caller's value nor what the provider receives changes. Captures
from before this behaviour keep their media in `input`: `apicity har scrub` scrubs
it for secrets and leaves it there.

Each call writes:

```text
<dir>/<provider>/<endpoint-dot-path>/<ISO-time-with-ms-and-colons-replaced>-<callId>.har
<dir>/index.jsonl
```

Unsafe path characters are escaped. The index contains one JSON line per file:
`{ts, callId, provider, endpoint, outcome, status, file, context}`, plus
`estimateUsd` when the call passed an estimate. `file` is relative to `dir`.
`log.creator` identifies apicity and its package version. `log._apicity` carries
call ID, provider, endpoint, input, outcome, optional error, optional estimate,
context, runtime, version, start time and duration. Entry `_apicity` identifies
HTTP or local entries, stream/truncation/`responseCut` flags and `pollRepeat` (the number of
additional consecutive identical GET responses collapsed into that entry).
Submissions are never collapsed. Timings measure fetch response-header latency;
call duration measures the callback, not the asynchronous disk write.

To keep what was quoted beside what the call then cost, pass the estimate to
`call`. It is written to `log._apicity.estimate` (`usd`, `source`, `rateAsOf`,
`warnings`, `breakdown`, `status`), scrubbed like `input`, and it never changes the
provider call. An estimate with no finite `usd`, or that will not serialize, is
dropped. `computeEstimate`'s result from `@apicity/cost` fits as is:

```ts
import { createHarCapture } from "@apicity/har";
import { computeEstimate } from "@apicity/cost";

declare const capture: ReturnType<typeof createHarCapture>;
const payload = { model: "gpt-5", input: "hello", max_output_tokens: 500 };

await capture.call(
  {
    provider: "openai",
    endpoint: "v1.responses",
    input: payload,
    estimate: computeEstimate({ provider: "openai", payload }),
  },
  async () => "the provider call goes here"
);
```

A quote the estimator could not make reads `usd: 0` with warnings, and `estimateUsd`
copies `usd`, so a bare 0 in the index does not tell it from a free call.
`compareCost` does, from the estimate in the HAR.

`call` determines success from the callback result, not HTTP status. A thrown
error after HTTP activity is `provider_error`, including KIE's HTTP 200 error
envelope. An error before any exchange is `local_error`, with a synthetic
status-zero entry whose URL contains the requested endpoint. A rejected fetch is
`network_error`, including when a provider wraps the network error, and so is a body
that fails mid-read, even if the callback swallowed the error or had already
returned. `failures` mode keeps only non-`ok` calls; successful calls are discarded
in memory.
Nested calls join the outer call and use its metadata. Concurrent outer calls
remain isolated. Await the provider work inside the callback so its exchanges
belong to that call.

The `context` option is the default context of every call. To attribute
concurrent work through one capture, give each call its own context:
`capture.call({ provider, endpoint, input, context: { runId, attemptId } }, fn)`.
It is merged shallowly over the capture's `context` for that call only: its
keys replace the capture's values for the same keys, and calls without it keep
the capture's context. A nested call's `context` is ignored, like the rest of
its metadata. The merged context is scrubbed like call input and written to
`log._apicity.context` and the index row.

`capture.fetch` has the global fetch signature. Outside a call it records an
implicit call under provider `unknown`, endpoint `unscoped`. It uses the global
fetch present when the capture is constructed. To compose another fetch wrapper,
install that wrapper before creating the capture. Responses are cloned before
returning them; streaming callers retain their readable body. Capture does not
wait for a stream to finish before returning the response or callback value.
`flush()` waits for active calls, body serialization and pending writes; finish
or cancel streams before flushing. `close()` uninstalls wrappers, flushes, and
turns the instance into a pass-through. Do not call `flush` or `close` from inside
an active capture callback.

Alternatively, `capture.install(host = globalThis)` wraps `host.fetch` and
returns an uninstaller. Install before constructing providers. This wrapper
ignores all traffic outside a call scope. If `providers` is supplied, it also
filters scoped traffic by known provider API/storage hostname boundaries;
unknown providers and custom proxy hosts do not match. For custom endpoints use
explicit fetch injection. Injection records every exchange it carries and can
be combined with installation without duplicating those exchanges. Only wrap
provider work in `call`; unrelated application work inside a scope is captured
unless excluded by the hostname filter. Uninstallers preserve any newer wrapper
installed by the application.

A capture/serialization/write failure invokes `onError` once, disables the
capture instance for the remainder of its lifetime, and leaves provider results
and thrown values unchanged. `flush` and `close` do not throw capture failures.

A body that fails mid-read, on a dropped connection or a timeout abort, is not a
capture failure. The exchange is saved with `bodyTruncated`, and `bodySize` counts
what arrived. A failed response also sets `responseCut`.

- **A stream** keeps its whole lines. Each frame is scrubbed alone, and the one the
  read ended inside would not parse. `extractActual` reads it as unsettled unless
  its final usage had already arrived.
- **Any other body** keeps its text only when it parses as a whole JSON document, as
  when the connection died after the last byte. Otherwise it becomes a placeholder of
  what arrived, whatever its content type says, because the scrub rules and media
  summaries read whole documents. `extractActual` reads that as unsettled too unless
  the headers stated a figure, so a poll cut this way does not end its call.

A multipart body that arrives whole but will not parse becomes a placeholder as well,
and is not marked truncated unless it is over the cap. A stream drops what nobody has
read when it errors, so a request body stream that fails may keep nothing: its copy
is read once the fetch has settled.

`clock` and `idFactory` are optional deterministic test hooks; IDs must be unique
within a directory and timestamp. There is no automatic retention or rotation.

## CLI

Use `apicity <provider> <dotPath> --capture-har [all|failures]` to capture an
endpoint call (bare flag means `all`). The flag overrides
`APICITY_HAR_CAPTURE=all|failures|off`; default `off` writes nothing.
`APICITY_HAR_DIR` defaults to `$HOME/.config/apicity/har`. The CLI creates
that directory with mode 0700 on the first capture write. Each saved call contributes
one HAR and one `index.jsonl` row. `meta.har` in success/error envelopes and
`--verbose` stderr identify the file; successful calls in failures mode have
neither. Command-line values are omitted from context, cwd is omitted, and
context.cli records the CLI version. Call input uses the runtime scrubber.
Media downloads are excluded. Write failures leave the endpoint result intact.

- `apicity har list [--dir d] [--since iso] [--failures] [--provider p] [--json]`:
  newest first; ts, provider, endpoint, outcome, status, file.
- `apicity har show <file|callId> [--dir d] [--bodies] [--json]`: outcome,
  duration, context and exchange method, URL, status, size, role, pollRepeat;
  bodies and call input appear only with `--bodies` and are scrubbed on read.
- `apicity har scrub <file...> [--check]`: re-scrub in place; `--check` is
  read-only and exits 1, naming each file that would change.
- `apicity doctor`: capture mode, dir and writability (no directory creation).

Captures retain application data, including prompts and media URLs. Scrubbing
covers known credential fields; it cannot identify arbitrary private text.
Review captures before sharing, in addition to running `scrub --check`.

Generic credential body fields are scrubbed recursively in request/response
JSON and call metadata: `api_key`, `access_token`, `refresh_token`,
`auth_token`, `client_secret`, `secret_access_key`, `private_key` and
`password` (case, camelCase, underscore and hyphen variants). Credential
values become `***`; nulls stay null. Quoted credential fields in partial
JSON and SSE text are also scrubbed. Generic `key`, `token` and `signature`
fields retain their existing provider-specific rules because they can carry
model data rather than credentials. Other sensitive prose still needs review.

## Learning report

```sh
apicity har report ./captures --provider fal,kie > report.md
apicity har report ./captures --baseline tests/recordings --json > report.json
apicity har report single.har --since 2026-10-01 --no-baseline
```

The command reads directories recursively or individual files without provider
calls. Extract archives first. Hidden directories and node_modules are skipped;
directory symlinks are not followed. Repeated real paths are counted once.
Unreadable files are listed; at least one readable HAR gives exit 0, including
reports with findings. Missing paths or no readable HAR give not_found (exit 2);
bad flags, providers or dates give usage (exit 1).

Markdown is printed even when stdout is redirected, an intentional exception
to the CLI's automatic JSON rule. `--json` prints the normal success envelope
`{ok: true, data: <HarReport>}`. Every field below is present; unavailable values
are null. `schemaVersion` is 1: renames, removals and semantic changes require
a new version, additive fields do not. No generation time or package version
appears. Equal inputs give equal bytes.

An annotated file is one call attributed to its `_apicity` endpoint. Primary
HTTP exchanges match that endpoint; uploads and other auxiliary exchanges
contribute volume but no schema or response-drift evidence. A legacy exchange
is one call, attributed by full URL first, then provider-scoped path matching,
then full URL again with a fal endpoint id spanning path segments
(`POST queue.fal.run/fal-ai/flux/dev` is `v1.queue.submit`), so a fal model row
keeps a queue submit to its own path. `matchedBy` counts full-URL matches as
`strict`, path matches as `lenient`, and an annotated call's only HTTP
exchange, kept when its URL matched no row, as `soleEntry`.
Root discriminated unions create one record per variant (KIE's model).
Unknown annotations appear in unresolvedCalls and their HTTP exchanges are
matched as legacy. Unmatched URL paths mask IDs and omit queries.

`--provider p[,p]` and `--endpoint dot.path` filter after attribution. Endpoint
filtering clears unmatched/unresolved entries. `--since` is inclusive, applies
to call timestamps, and counts missing timestamps separately. All inputs are
scrubbed before analysis, and emitted strings are bounded.

The seven sections count:

1. Volume: calls and outcomes separately from exchange success, primary HTTP
   statuses, nearest-rank p50/p95 latency (rounded milliseconds), and collapsed
   pollRepeat totals. Repeats never weight other statistics.
2. Provider errors: failed primary exchanges except status 0, plus annotated
   provider failures discovered after successful primary exchanges. Groups use
   status, code and normalized message (URLs, IDs and digits masked). Samples
   are scrubbed, bounded, and chosen deterministically.
3. Schema too loose: JSON object requests accepted by real `.schema.safeParse`
   but rejected with payload-relevant 4xx errors (including KIE envelope codes).
   Auth, credit, rate limits, timeouts and server failures are excluded.
4. Schema too strict: successful JSON object requests rejected by safeParse,
   plus keys absent from the converted schema even if safeParse strips them.
   Enum and numeric range violations are listed. Captured media placeholders
   are counted separately and never treated as evidence of schema rejection.
   GET/HEAD/DELETE queries, form data and multipart summaries are not validated.
5. Defaults: schema default observations count bodies where the parent object
   exists; absent + equal + overridden = observed. Override rates divide by
   observed and round to four decimals. Factory defaults compare primary bodies
   with annotated input: these may also be derived fields, not just defaults.
6. Response drift: successful JSON response shapes, top-level and one level
   nested (including object elements in arrays). New keys compare against the
   baseline union; missing keys must appear in every baseline response. Type
   changes report newly observed types. KIE/xAI business failures are excluded.
7. Local failures: normalized error groups with attempted input shapes only. A
   media placeholder in the input reads as type `media`.

fal `v1.queue.submit` sends its request's `input` member as the whole body, so
its schema sections (3, 4 and schema defaults) check each annotated call's
input instead, and its factory defaults compare the body with that `input`
member. A legacy submit has no input, so those sections report
`no annotated input`.

Baseline defaults to tests/recordings only when both that directory and
scripts/endpoint-docs.tsv exist in the working directory; otherwise none.
`--baseline dir` overrides it and `--no-baseline` disables it. Input files are
excluded by realpath, so a corpus is never compared with itself. Baselines are
unfiltered, share response shapes across endpoint variants, and expose only
shapes. Promotion candidates are resolved annotated OK calls whose HTTP
exchanges all succeed; promotion must still run scrub --check. committedFiles
counts successful baseline files for the same variant, or null with no baseline.

Unavailable reasons are identical in JSON and Markdown:
`no _apicity block`, `no JSON request bodies`, `endpoint has no .schema`,
`endpoint function not found in the provider tree`,
`provider package could not be loaded`, `schema conversion failed`,
`no schema option for this variant`, `no baseline`,
`no successful JSON response`, `no successful baseline response`. Legacy
recordings lack poll-repeat, factory-default and local-failure annotations.
Available sections without findings say `none`. Value lists keep the 20 most
frequent values (canonical JSON breaks ties) and count the remainder in
otherCount. Markdown shortens file lists to five; JSON retains every file.

```ts
type Outcomes = {
  ok: number;
  provider_error: number;
  local_error: number;
  network_error: number;
};
type ValueList = {
  values: Array<{ value: unknown; count: number }>;
  otherCount: number;
};
interface HarReport {
  schemaVersion: 1;
  filters: {
    providers: string[] | null;
    endpoint: string | null;
    since: string | null;
  };
  baseline: {
    source: "default" | "flag" | "none";
    path: string | null;
    files: number;
    responses: number;
  };
  inputs: {
    paths: string[];
    files: number;
    annotatedFiles: number;
    legacyFiles: number;
    duplicateFiles: number;
    unreadable: Array<{
      file: string;
      reason: "invalid-json" | "not-a-har" | "read-error";
    }>;
    entries: number;
    skipped: {
      malformedEntries: number;
      localEntries: number;
      beforeSince: number;
      noTimestamp: number;
    };
  };
  summary: {
    endpoints: number;
    records: number;
    calls: number;
    outcomes: Outcomes;
    primaryExchanges: number;
    auxiliaryExchanges: number;
    unmatchedExchanges: number;
    unresolvedCalls: number;
  };
  endpoints: EndpointRecord[];
  unmatched: Array<{
    method: string;
    host: string;
    path: string;
    providerHint: string | null;
    count: number;
  }>;
  unresolvedCalls: Array<{
    provider: string;
    endpoint: string;
    reason: "not-in-catalog" | "method-ambiguous";
    count: number;
    files: string[];
  }>;
}
interface EndpointRecord {
  provider: string;
  method: string;
  dotPath: string;
  variant: { key: string; value: string } | null;
  schema: {
    status: "ok" | "no-introspection" | "absent" | "unresolved" | "unavailable";
    variantKey: string | null;
    option: "selected" | "none" | null;
  };
  volume: {
    // section 1
    calls: number;
    callsBySource: { annotated: number; legacy: number };
    outcomes: Outcomes;
    exchanges: { primary: number; auxiliary: number; local: number };
    matchedBy: { strict: number; lenient: number; soleEntry: number };
    exchangeSuccess: { succeeded: number; failed: number };
    statusHistogram: Array<{ status: number; count: number }>;
    polls: { available: boolean; reason: string | null; repeats: number };
    latencyMs: { samples: number; p50: number | null; p95: number | null };
    auxiliaryTargets: Array<{ target: string; count: number }>; // "<provider> <METHOD> <dotPath>" or "<METHOD> <host><masked path>"
  };
  providerErrors: { groups: ErrorGroup[] }; // section 2
  schemaTooLoose: {
    available: boolean;
    reason: string | null;
    checked: number;
    rejectedBySchema: number; // section 3
    groups: Array<{
      status: number;
      code: string | null;
      message: string;
      count: number;
      files: string[];
    }>;
  };
  schemaTooStrict: {
    available: boolean;
    reason: string | null;
    checked: number;
    rejected: number; // section 4
    safeParseErrors: number;
    placeholderIssues: number;
    issues: Array<{
      code: string;
      path: string;
      message: string;
      count: number;
    }>;
    unknownKeys: {
      available: boolean;
      reason: string | null;
      keys: Array<{ path: string; count: number; acceptedBySchema: number }>;
    };
    valuesOutsideEnum: Array<
      { path: string; allowed: unknown[]; allowedCount: number } & ValueList
    >;
    valuesOutsideRange: Array<
      {
        path: string;
        minimum: number | null;
        maximum: number | null;
        inclusive: boolean;
      } & ValueList
    >;
  };
  defaults: {
    // section 5
    schemaDefaults: {
      available: boolean;
      reason: string | null;
      bodies: number;
      fields: Array<{
        path: string;
        default: unknown;
        observed: number;
        absent: number;
        equal: number;
        overridden: number;
        overrideRate: number | null;
        values: Array<{ value: unknown; count: number; succeeded: number }>;
        otherCount: number;
      }>;
    };
    factoryDefaults: {
      available: boolean;
      reason: string | null;
      calls: number;
      fields: Array<{ path: string; count: number } & ValueList>;
    };
  };
  responseDrift: {
    available: boolean;
    reason: string | null;
    baselineResponses: number;
    corpusResponses: number; // section 6
    newKeys: Array<{ path: string; types: string[]; count: number }>;
    missingKeys: Array<{
      path: string;
      types: string[];
      baselineCount: number;
    }>;
    typeChanges: Array<{
      path: string;
      baselineTypes: string[];
      corpusTypes: string[];
      newTypes: string[];
    }>;
  };
  localFailures: {
    available: boolean;
    reason: string | null; // section 7
    groups: Array<{
      code: string | null;
      message: string;
      count: number;
      firstSeen: string | null;
      lastSeen: string | null;
      files: string[];
      inputShape: Array<{ path: string; types: string[] }>;
    }>;
  };
  promotion: { candidates: string[]; committedFiles: number | null };
}
interface ErrorGroup {
  status: number;
  code: string | null;
  message: string;
  source: "response-body" | "call-error" | "http-status";
  payloadRelevant: boolean;
  count: number;
  firstSeen: string | null;
  lastSeen: string | null;
  fields: string[];
  files: string[];
  sample: {
    file: string;
    entry: number | null;
    method: string | null;
    url: string | null;
    body: {
      source: "request" | "input";
      mimeType: string | null;
      value: unknown;
    } | null;
  };
}
```

## Cost report

```sh
apicity har cost ./captures --provider fal,kie > cost.md
apicity har cost tests/recordings --model grok-4.6 --json > cost.json
apicity har cost ./captures --since 2026-11-01 --tolerance 0.05
```

The command answers what calls actually cost and how many tokens they used, per
provider, endpoint and model, without provider calls. It reads paths as
`har report` does, with the same exits: at least one readable HAR gives exit 0,
missing paths or no readable HAR give not_found (exit 2), and bad flags, providers,
dates or tolerances give usage (exit 1). Output is Markdown even when redirected;
`--json` emits `{ok: true, data: ...}` with `schemaVersion: 1`. Equal inputs give
equal bytes: the output holds no timestamps or versions.

**What counts as one call.** A file with `log._apicity` is one call, and all its
exchanges read together; the request is the exchange that matches its endpoint, not
an upload beside it. In a recording, a poll or result joins its call in the same
file, because the request is on the submit and the bill is on the last read.
`@apicity/cost`'s `endpointBilling` says which rows those are. The join follows the
id the poll names, so interleaved tasks stay apart, and repeated polls of a task
with no submit are one call. Captures in separate files are not joined, so a poll
captured on its own is its own call, with its stated charge and no estimate.

**Each group of (provider, endpoint, model) reports:**

- `calls` and `settledCalls`. An unsettled figure can still move, so actual USD and
  usage totals read settled calls only.
- `quoted`: the sum of `log._apicity.estimate` where one held. A quote that failed
  closed adds nothing.
- `recomputed`: `estimateEndpoint` on today's tables, when the request body exists.
  A request stored as a placeholder has none, and neither does a figure the
  estimator warns is partial, such as one with no output cost. A free row needs no
  body.
- `actual`: USD paid, the list price where a provider states one apart (`listUsd`),
  and how many calls rest on each basis (`stated`, `derived`, `usage-only`, `none`).
- `ratio` (p50 and p95) and `verdicts`, from `compareCost` with `--tolerance`. They
  compare each call's quote, or the recomputed figure when no quote was stored, with
  its actual at list price. A ratio above 1 means the estimate ran high. A recomputed
  token figure counts input at chars/4, so its ratio measures that heuristic, not a
  rate.
- `usage`: totals for tokens, characters, seconds, credits and billable units.
- `capturedBeforeRate`: calls captured before the rate's `asOf`. Their difference
  is a price change, not an error. A call with no time counts here too. A table row
  with no `asOf` of its own uses `PRICING_AS_OF`, so this gate is weaker for it.

**Corrections.** A proposal needs a stated charge and exactly one unknown rate, and
solves `(stated - known parts) / count`, using the list price where there is one.
A token row's unknown is a `cacheRead` or `cacheWrite` the table lacks, with tokens
to count. A per-unit row has one rate per variant, so that rate is the unknown; the
table counts its units and any extra charge, and the proposal shows the rate beside
the implied value when they differ by over 1%.

It proposes only when every call that solved for that rate agrees within 1%, across
endpoints, so filters narrow that evidence too. Filling an empty rate can rest on one
call, but changing a published one needs at least two, since one call can be a
promotion. It stays quiet when:

- a capture in the group is older than the rate;
- a token call on that row, on any endpoint, misses its stated charge with every rate
  known, or solves to a negative rate or one above what input costs, since then a
  known rate or a fee is off;
- the charge is zero, which can be a failed task or a promotion;
- the call reports a fee no rate prices, or a non-standard service tier;
- the row can bill several rates at once (long-context tiers, audio or image tokens)
  or warns that its figure is a floor, or it cannot count the request's units, as a
  reference video with no known length;
- a KIE token charge is too small for its 0.01 credit rounding to stay under 1%;
- the model has no table row.

A proposal is a lead to check, not a fact. Before changing a rate, read the files it
names: `tests/recordings` holds some hand-written cassettes whose stated charges were
never billed.

## From capture to test

Promote a captured successful call to an existing endpoint without a provider
request or recording spend:

```bash
pnpm run har:promote -- capture.har --name fal/my-real-payload --dry-run
pnpm run har:promote -- capture.har --name fal/my-real-payload
```

Use `<provider>/<test-name>` (Google Flow uses `google-flow`). The test name is
lowercase kebab case, at most 80 characters. Optional flags are
`--test-file tests/integration/<provider>-<name>.test.ts`, `--dry-run`,
`--force`, `--keep`, and the maintainer/testing flag `--root <directory>`.
Values also accept `--flag=value`. An alternate root must be outside the
repository.

The command first reconstructs the endpoint calls and executes them against
the captured exchanges through an injected fetch, with global fetch disabled.
It preserves captured request objects and wire bodies, resolves positional
arguments from URLs, and includes async create, poll, and result calls. Every
expanded exchange must be consumed. The generated test uses the current
repository lifecycle template, provider credential environment names, and the
existing harness OTP helpers for paid endpoints.

The outputs are `tests/recordings/<provider>_<hash>/<test-name>_<hash>/recording.har`
and `tests/integration/<provider>-<test-name>.test.ts`. The recording uses
Polly's creator (required by its persister), default request identities and
per-identity occurrence orders. Collapsed polls expand back to individual
exchanges. Apicity metadata is retained and scrubbed again. The test asserts
response keys and status fields plus the exact replayed exchange count.

Before success, promotion runs secret and orphan-recording checks, the fal
credential audit when applicable, a targeted TypeScript check, and Polly replay.
Replay children remove provider credentials and force replay mode. The
`POLLY_RECORDINGS_DIR` harness override accepts an alternate recordings root
only in replay mode; recording with it set throws.

Refusals (exit **2**) happen before writing:

- Invalid/unsuccessful captures: `unreadable`, `not-annotated`,
  `outcome-not-ok`, `no-http-entry`, `local-entry`, `exchange-failed`,
  `needs-scrub`, `endpoint-not-in-catalog`.
- Unsupported bodies or identities: `streamed`, `truncated`, `binary-body`,
  `multipart-body`, `media-summary`, `non-json-body`, `redacted-body`,
  `unsafe-key`, `credential-in-url`, `query-shape`, `too-many-exchanges`.
  `query-shape` refuses malformed percent escapes or invalid UTF-8 escapes
  in queries. Repeated or valueless keys, reserved or escaped characters, and
  fragments are supported. The expanded limit is 500 exchanges.
- Unsupported providers: `provider-unsupported` for S3, B2, Polymarket,
  Telegram, TheSportsDB, Quo, and free-media-upload; fal also refuses
  `fal-unknown-host` and `fal-mixed-hosts`.
- Invalid destinations or templates: `name`, `test-file`, `exists`,
  `force-unrecoverable`, `force-shared-recording`, `force-shared-test`,
  `template`, `no-otp-helper`.
- A call that cannot reproduce its exchanges: `dry-replay:unmatched-exchange`,
  `dry-replay:identity`, `dry-replay:not-issued`, `dry-replay:no-primary`,
  `dry-replay:threw`, `dry-replay:timeout`, `dry-replay:bypassed-fetch`,
  `dry-replay:result-type`, `dry-replay:lenient-placeholders`,
  `dry-replay:field-mismatch`, or `dry-replay:paid-positional`.

`--dry-run` performs the refusal checks and dry replay, then prints targets,
credential wiring, call plan and generated source without writing. `--force`
replaces only exact, tracked, clean files recoverable from git; it refuses
shared recordings, tests referencing other recordings, and normalized-name
collisions. On a failed post-write check (exit **1**), created files/directories
are removed and replaced files restored byte for byte. `--keep` instead keeps
the files for inspection. Exit **0** means all checks passed, or the dry-run
plan succeeded.

A successful HTTP/KIE envelope can still describe a failed generation. The
command prints a note and the generated test pins that state: promotion proves
the recorded exchange sequence, not generation success.

After promotion, review and stage the files, then run:

```bash
pnpm run gen:examples
pnpm run harness:telegram -- --all my-real-payload --dry-run
pnpm run dev:preflight:fast -- fal
```

Example selection follows the normal recording rules. Run
`apicity har scrub --check capture.har` before sharing any capture; never copy
it directly into the recordings tree.

## Failures become tests

Every provider rejection apicity has seen is held to one rule: apicity either
rejects the payload before the network, with a message that restates the
provider's rule, or the failure is listed as a pass-through with a reason.
`tests/integration/captured-failures.test.ts` enforces it without Polly or a
network:

- `tests/failures/<provider>/<name>.har` is a scrubbed HAR holding exactly one
  failed exchange (HTTP non-2xx, or a KIE/xAI failure envelope) that sent a
  request body.
- `tests/failures/<provider>/<name>.expect.json` names the endpoint dot path
  (as in `scripts/endpoint-docs.tsv`), the `rule` phrase the local rejection
  message must contain, and the `source` the HAR came from:
  `{ "endpoint": "...", "rule": "...", "source": "..." }`. A listed
  pass-through may omit `rule`.
- `tests/failures/passthrough.json` lists the files whose rule apicity does not
  enforce, each as `{ "file", "reason", "providerMessage" }`. The provider
  message must appear in that file's response.

For each file the suite takes the failed request body (for multipart, the
`_multipart` summary's fields) and builds the provider with a fetch that only
counts calls. KIE `api.v1.jobs.createTask` and xAI `v1.videos.generations`
validate when called, so the suite calls them; for every other endpoint the
local check is `.schema.safeParse`. A file not in `passthrough.json` must be
rejected locally with its sidecar's rule phrase, without reaching fetch. A
listed file must reach the provider: once apicity rejects it locally, the
suite fails until the entry is removed and the sidecar carries the rule. The
suite also runs `apicity har scrub --check` over every file, and
`pnpm run lint:recordings` reports a failure HAR without its sidecar.

To triage a captured or recorded failure:

1. Keep only payload failures. Missing or invalid credentials (401), plan,
   permission or feature errors (403), rate limits (429), unknown ids (404, or
   "not found" / "does not exist"), server errors (5xx) and requests without a
   body are not payload rules; do not add them.
2. Copy the one failed entry into a new HAR, run
   `apicity har scrub <file>`, and save it as
   `tests/failures/<provider>/<name>.har`.
3. Write `<name>.expect.json` with the endpoint, the source, and the phrase
   your local message will contain.
4. Run `pnpm run test:run tests/integration/captured-failures.test.ts`. A
   failure quotes the provider's error body. Restate the rule locally: an
   object-level `.refine` with `message` and `path`, as in
   `packages/provider/fal/src/zod.ts`, or the KIE createTask guard's schema.
   Pin the rule in that provider's unit tests. If the rule cannot be expressed
   locally (it depends on the provider's own state or undocumented lists), or
   it waits for a later change, add a `passthrough.json` entry that says so.

## First committed-corpus learning pass

[The 2026-10-24 learning report](har-learning-pass-1.md) records frontier coverage,
per-finding verdicts, videobook overrides and provider-family follow-up beads.
It distinguishes successful overrides from evidence that a default is invalid,
and historical successes from a newer provider contract.
