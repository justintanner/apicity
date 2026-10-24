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
URL credentials, known secret body fields and cookies before writing. Non-text
bodies and bodies larger than `maxBodyBytes` (default 256 KiB) become placeholders
with SHA-256, byte count and content type. Multipart uploads retain field and
file summaries, not file bytes. Large base64 and data URL media are summarized.
SSE retains text up to the cap, with `streamed` and `bodyTruncated` metadata.
Captures still contain application data: choose a private directory and share
only the captures you intend to share.

Each call writes:

```text
<dir>/<provider>/<endpoint-dot-path>/<ISO-time-with-ms-and-colons-replaced>-<callId>.har
<dir>/index.jsonl
```

Unsafe path characters are escaped. The index contains one JSON line per file:
`{ts, callId, provider, endpoint, outcome, status, file, context}`. `file` is
relative to `dir`. `log.creator` identifies apicity and its package version.
`log._apicity` carries call ID, provider, endpoint, input, outcome, optional error,
context, runtime, version, start time and duration. Entry `_apicity` identifies
HTTP or local entries, stream/truncation flags and `pollRepeat` (the number of
additional consecutive identical GET responses collapsed into that entry).
Submissions are never collapsed. Timings measure fetch response-header latency;
call duration measures the callback, not the asynchronous disk write.

`call` determines success from the callback result, not HTTP status. A thrown
error after HTTP activity is `provider_error`, including KIE's HTTP 200 error
envelope. An error before any exchange is `local_error`, with a synthetic
status-zero entry whose URL contains the requested endpoint. A rejected fetch is
`network_error`, including when a provider wraps the network error. `failures`
mode keeps only non-`ok` calls; successful calls are discarded in memory.
Nested calls join the outer call and use its metadata. Concurrent outer calls
remain isolated. Await the provider work inside the callback so its exchanges
belong to that call.

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
is one call, attributed by full URL first, then provider-scoped path matching.
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
7. Local failures: normalized error groups with attempted input shapes only.

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
