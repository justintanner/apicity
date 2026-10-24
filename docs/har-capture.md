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
