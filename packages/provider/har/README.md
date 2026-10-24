# @apicity/har

Dependency-free Node.js HAR 1.2 serialization, secret scrubbing and opt-in
request/response capture. `createHarCapture` provides an injectable fetch,
call scopes, optional global installation, and scrubbed files with a JSONL index.
See the [capture guide](../../../docs/har-capture.md) for setup and retention details.

```ts
import { exchangeToEntry, scrubHar, pollyEntryId } from "@apicity/har";

const entry = await exchangeToEntry(request, response, {
  startedAt: new Date(),
  durationMs: 120,
});
entry._id = pollyEntryId(entry);
```

- `createHarCapture({ dir, mode: "all" | "failures", providers?, maxBodyBytes?,
  context?, onError?, clock?, idFactory? })` returns `{ fetch, call, install,
  flush, close }`. Wrap provider work in `call({ provider, endpoint, input }, fn)`
  and await `close()` before exit. Capture is disabled after a write error without
  changing the provider result.
- `exchangeToEntry(request: Request, responseOrError: Response | Error, timing,
  options?)` reads clones and returns a scrubbed entry. Timing has `startedAt`,
  `durationMs` and optional HAR `timings`. Options are `maxBodyBytes` (262144 by
  default), `streamed` and `role`. Binary and oversized bodies become SHA-256,
  byte-count and MIME-type placeholders. Multipart files become name/type/size
  summaries. Inline data URLs and long base64 are summarized. Text streams are
  concatenated up to the cap; `_apicity.streamed` and `bodyTruncated` describe
  them. A network error produces status 0; call-level error metadata belongs in
  `log._apicity`. Bodies must be unused and streams must eventually finish.
- `scrubEntry(entry)` and `scrubHar(har)` mutate and return their argument.
  Scrubbing covers provider credentials in headers, URLs and JSON, cookies,
  response account metadata and `_apicity` input/context/error fields. It preserves prompts and
  ordinary payloads. It is not a general personal-data anonymizer.
- `pollyEntryId(entry, options?)` hashes the identifying fields using the
  repository's default harness matching rules. Custom matching requires
  `excludeHeaders`, `headers: false`, or `body: false` as appropriate. The URL
  is normalized as Polly's url-parse and qs normalize it: keys are sorted and
  RFC 3986 escaped, repeated, valueless and bracket keys are kept, and the
  fragment is dropped. Summarized bodies cannot reproduce the identity of their
  original raw bytes, nor can a query part with a malformed percent escape once
  a `Request` has re-encoded it. A recorded URL with an unclosed `[` or more
  than five bracket levels in a key hashes as a new request to that URL would,
  not as recorded: Polly's re-serialization is not stable there.
- `pollyRecordingDir(name)` implements Polly's per-segment slug and FNV-1a hash.
- HAR types: `Har`, `HarLog`, `HarEntry`, `HarRequest`, `HarResponse`, `HarContent`,
  `HarPostData`, `HarNameValue`, `HarCookie`, `HarPage`, `HarCacheEntry`,
  `HarTimings`, `ApicityCallMetadata`, and `ApicityEntryMetadata`.
- Options: `ExchangeTiming`, `ExchangeOptions`, `PollyIdentityOptions`.

Compatibility exports for the recording tools: `redactPersistedHarSecrets`,
`persistSafeTextRequestBody`, `summarizeJsonRequestBodyMedia`,
`summarizeMultipartFormData`, `summarizeMultipartRequestBody`,
`redactedRequestId`, `PersistedHarRecording`, `REDACTED_HAR_VALUE`,
`HarHeaderLike`, `HarCookieLike`, `HarRequestLike`, `HarResponseLike`,
`HarRecordingLike`, `isSensitiveRequestHeaderName`,
`isSensitiveResponseHeaderName`, `scrubSensitiveRequestHeaders`,
`scrubSensitiveResponseHeaders`, `scrubRequestCookies`, `scrubResponseCookies`,
`scrubSensitiveResponse`, `scrubPolymarketAuthArtifacts`,
`scrubSensitiveRecording`, `PERSISTED_REQUEST_HEADER_PLACEHOLDERS`,
`persistedRequestHeaderPlaceholder`, `redactFalCheckpoints`,
`findUnredactedRequestSecrets`, and `findLiveFalCheckpoints`.

## Repository integration

The package owns the rules. `tests/harness.ts` and `tests/har-scrub.ts` are
compatibility exports; the Vitest source alias runs against this package.
Standalone HAR viewer/report/Telegram tools import the same source through
`har-data.ts` and `har-scrub.ts` using a relative path, so `tsx` also works
from outside the repository without a package build or a Vitest alias.
`gen:shared` copies `src/har-secrets.mjs` to `scripts/lib/har-secrets.mjs`
(the shared-source manifest pins it). This committed, generated copy lets
`gen:examples:check`, `lint:recordings` and `doc-gen:check` run on a clean checkout
before any package build. `gen:shared:check` prevents drift. No runtime package
dependency or build-on-import is needed by those scripts.

## Exchange analysis helpers

`exchangeSucceeded(provider, entry)` requires HTTP 2xx and rejects KIE and xAI
failure envelopes. `responseObject(entry)` decodes JSON object responses,
including base64 HAR content.

`findMatchingRow(entry, rows, {provider})` first matches full URLs, then uses a
provider-scoped path match. Rows carry `provider`, `method`, `dotPath` and
`fullUrl`. `matchHarEntryStrict`, `matchHarEntryLenient` and
`compileTsvUrlPattern` expose the individual matching operations. These are
the canonical implementations also synced to the repository scripts.
