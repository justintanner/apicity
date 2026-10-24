# @apicity/har

Dependency-free Node.js HAR 1.2 serialization and secret scrubbing. This package
provides data helpers; it does not install capture hooks or write recordings.

```ts
import { exchangeToEntry, scrubHar, pollyEntryId } from "@apicity/har";

const entry = await exchangeToEntry(request, response, {
  startedAt: new Date(),
  durationMs: 120,
});
entry._id = pollyEntryId(entry);
```

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
  response account metadata and `_apicity.input`. It preserves prompts and
  ordinary payloads. It is not a general personal-data anonymizer.
- `pollyEntryId(entry, options?)` hashes the identifying fields using the
  repository's default harness matching rules. Custom matching requires
  `excludeHeaders`, `headers: false`, or `body: false` as appropriate. Summarized
  bodies cannot reproduce the identity of their original raw bytes.
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
