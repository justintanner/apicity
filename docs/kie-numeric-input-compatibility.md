# KIE numeric input compatibility audit

The base sweep was retrieved and observed on 2026-07-31; the MiniMax H3 rows
use the approved upstream snapshots retrieved on 2026-08-04; the Google Gemini
TTS rows use the approved upstream snapshots retrieved on 2026-08-06. This
audit covers numeric-valued input properties reachable from every current
`KIE_MEDIA_MODELS` entry through its `CREATE_TASK_GUARDS` schema. It is an
evidence and decision record, not a claim that fields with similar names share
an upstream contract.

## Method

The companion test converts each catalogue-linked request schema with the
repository's `zodToJsonSchema` helper and walks `properties.input` through
objects, arrays and tuples, `anyOf`, and `oneOf`. It collects number and integer
leaves, all-numeric string enums, and string patterns that accept numeric text.
Rows are deduplicated by model and input path. Unsupported schema branches,
duplicate rows, missing rows, extra rows, and stale local-contract cells all
fail with the affected model and path.

At this revision the derived inventory has 71 unique paths across 42 of the 57
catalogue models: 49 integer branches, 15 general-number branches, one numeric
literal enum, five numeric-string enums, and one numeric-string pattern. These
are measured facts, not permanent expected counts; the model/path set is
derived on every test run.

For upstream evidence, the sweep resolved English Markdown OpenAPI exports
from `llms.txt` before considering alternate pages. The current index matched
55 of 57 catalogue ids. It has no model-specific export for
`elevenlabs/sound-effect-v2` or `sora-watermark-remover`; only the former has a
numeric inventory row. A missing page, an absent example, or a conflict between
a declaration and example remains explicit rather than being treated as proof
of rejection or coercion.

The evidence hierarchy used here is:

1. a bounded current live observation;
2. a current official OpenAPI declaration and request example, kept as
   separate facts;
3. a historical committed HAR observation;
4. unknown when the current sources are absent or contradictory.

`number-only` and `numeric-string-only` describe the evidenced upstream JSON
representation, not whether a local schema matches every bound, default, or
integer rule. Such discrepancies are called out and tracked separately.

## Grok duration evidence

The current text-to-video OpenAPI (`DOC-04`) declares `duration` as a number
with 6–30 step-1 semantics in its description, but its request example sends
the JSON string `"6"`. The committed text-to-video HAR sent the same string at
`2026-04-16T07:18:50.680Z` and received HTTP 200. Its SHA-256 is
`2ed65430c2968ce64cbcc38a3b0c91c31e27464f00cbed1bd2f436e04d66ef74`.

The current image-to-video OpenAPI (`DOC-05`) declares `duration` as a string,
describes the same 6–30 step-1 semantics, and sends `"6"` in its request
example. The committed image-to-video HAR sent string `"6"` at
`2026-04-30T08:33:19.571Z` and received HTTP 200. Its SHA-256 is
`bcce0f7f4063885679acc734a8c4ee2745692f22c1684dcf878900fce686a984`.

The one allowed live probe established the missing numeric image-to-video fact:

- Credential preflight: `pnpm run check:op` passed.
- Start/end: `2026-07-31T18:49:11Z` / `2026-07-31T18:49:12Z`.
- Model and value: `grok-imagine/image-to-video`, JSON number `6`.
- Minimum payload: one public `image_urls` entry and `duration`; no callback,
  polling, retry, generated-media download, or committed recording.
- Redacted command:

  ```bash
  op run --env-file=.env -- curl \
    -X POST https://api.kie.ai/api/v1/jobs/createTask \
    -H 'Authorization: Bearer [redacted]' \
    -H 'Content-Type: application/json' \
    --data-raw '{"model":"grok-imagine/image-to-video","input":{"image_urls":["https://raw.githubusercontent.com/justintanner/apicity/main/tests/fixtures/cat1.jpg"],"duration":6}}'
  ```

- Result: HTTP 200; envelope `code: 200`, `msg: "success"`, and a task id was
  present. The task id is deliberately not retained here.

## Grok Extend evidence gate

The official Grok Extend Markdown (`DOC-07`) was fetched once at
`2026-08-02T01:05:13.612Z`. Its SHA-256 remained
`6a495e8b4787c6e063da393a5455d119c478a295960e3361535f3fa631fbf1b4`,
byte-for-byte identical to the 2026-07-31 snapshot. The current source still
contains these internally conflicting facts:

| Evidence dimension            | `input.extend_at`                                                         | `input.extend_times`                                        |
| ----------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------- |
| OpenAPI property declaration  | JSON `number`; minimum `2`; default `2`; no maximum or integer constraint | JSON `number`; no default, bounds, or machine-readable enum |
| Prose                         | "Optional field"                                                          | "Required field"; names durations `6` and `10`              |
| OpenAPI `required` membership | present                                                                   | present                                                     |
| Request example               | JSON number `2`                                                           | JSON string `"6"`                                           |
| Historical HAR                | JSON number `0`                                                           | JSON string `"6"`                                           |
| Historical result             | HTTP `200`; envelope `code: 200`, `msg: "success"`, task id present       | same request and result                                     |
| Current live observation      | none                                                                      | none                                                        |
| Vendor clarification          | none recorded                                                             | none recorded                                               |

The historical request started at `2026-04-16T07:18:51.533Z`. Its immutable
fixture is
`tests/recordings/kie_2079838932/grok-video-extend_884144663/recording.har`
with SHA-256
`994e2713d18af423bed0cdd71dcdcfb723484261d2c34818d01b9612588e47f6`.
That result proves only that the exact number-`0`/string-`"6"` request was
accepted on that date. It does not prove current omission, defaulting,
fractional behavior, lower bounds, numeric `extend_times`, or the `"10"` case.

### Authorization and bounded source preflight

Two later human decisions are inputs to this continuation without changing
the facts available to the earlier run:

- `approve-probe` was recorded at `2026-08-01T13:57:30Z`. It approves the
  eight sequential matrix cases, their no-retry stop rules, and a maximum
  matrix cost of `$0.50`.
- `generate-new` was recorded at `2026-08-02T00:30:30Z`. It approves at most
  one additional KIE request to create a fresh 480p source video and describes
  its expected cost as about `$0.01`.

The new run consumed both decisions as execution inputs but did not consume a
paid-call allowance. `pnpm run check:op` passed on 2026-08-02. The supported
minimum source request selected for preflight, but not submitted, was:

```json
{
  "model": "grok-imagine/text-to-video",
  "input": {
    "prompt": "A blue sphere drifts above a quiet lake.",
    "duration": 6,
    "resolution": "480p"
  }
}
```

This candidate reached two authorization boundaries before dispatch:

- KIE's public price is `$0.008` per second for 480p Grok Imagine
  text-to-video, and the supported minimum duration is 6 seconds. Its
  conservative maximum is therefore `$0.048`, not the approximately `$0.01`
  described by the source-generation decision.
- The create response contains a task id but not completed-task or confirmed
  resolution evidence. KIE documents the separate task-details endpoint or a
  callback as the way to establish completion. This run's no-polling and
  no-callback boundary therefore cannot establish the completed 480p source
  precondition after only the authorized create request.

No KIE request was submitted. Source-generation calls, matrix calls, retries,
polls, callbacks, downloads, and fixture writes were all zero. Source cost,
matrix cost, and total cost were `$0.00`. The historical HAR task id was not
used. Continuing would require expanding the approved source cost expectation
and completion-observation boundary, so execution stopped before provider or
pricing source changed.

The resulting contract matrix remains explicit about what is unresolved:

| Contract dimension                        | `input.extend_at`                                                                                                                                                          | `input.extend_times`                                                                                                                         | Status                                          |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Accepted JSON type(s)                     | Number is supported by both the current declaration and historical request; numeric strings have no evidence                                                               | Current declaration says number, while the current example and historical request use string; number, string, or both cannot yet be selected | `extend_at` resolved; `extend_times` unresolved |
| Requiredness                              | Prose says optional, but the same OpenAPI schema lists it as required; the historical request included it                                                                  | Declaration, prose, and `required` membership say required                                                                                   | `extend_at` unresolved; `extend_times` resolved |
| Omission/default ownership                | KIE advertises default `2`, but omission has not been observed and conflicts with `required` membership; Apicity must not inject a default                                 | Required and no default is declared                                                                                                          | `extend_at` unresolved; `extend_times` resolved |
| Integer/fractional semantics              | OpenAPI says general number; only integer examples/traffic exist; fractional acceptance or normalization is unknown                                                        | The documented duration set is integral, but accepted JSON representation remains unresolved                                                 | unresolved                                      |
| Bounds                                    | Current declaration has minimum `2` and no maximum; historical `0` succeeded, so the current lower bound is unresolved and absence of a declared maximum is not live proof | Only discrete durations `6` and `10` are named; no continuous range is declared                                                              | `extend_at` unresolved; duration set resolved   |
| Discrete values                           | No discrete set is declared                                                                                                                                                | Prose names exactly `6` and `10`; the declaration does not encode an enum                                                                    | resolved independently of JSON representation   |
| Representation preservation/normalization | Any selected Apicity contract must forward the supplied number unchanged; no coercion or upstream normalization is evidenced                                               | Any accepted number/string forms must remain distinct on the wire; no coercion or normalization is evidenced                                 | policy resolved; accepted union unresolved      |

### Continuation run `ac-rqfacx`: frozen pre-dispatch boundary

This continuation consumes the later manual decision `ac-ct24hp`, answered
`approve-spend` at `2026-08-02T05:19:34Z`. Together, the three recorded human
decisions authorize exactly this run boundary:

- `ac-egtr46=approve-probe` at `2026-08-01T13:57:30Z`: at most eight
  sequential Extend creates under the recorded stop rules and a conservative
  matrix ceiling of `$0.50`;
- `ac-lnlcvk=generate-new` at `2026-08-02T00:30:30Z`: at most one fresh 480p
  source-video create; and
- `ac-ct24hp=approve-spend` at `2026-08-02T05:19:34Z`: the supported six-second
  source request at a conservative maximum of `$0.048`, plus bounded status
  polling to establish completion.

The repository started at `0b0b828200c8f54261e16d37a6019d8c132e42da` on
`main`, equal to `origin/main`, with no tracked diff. Untracked Gas City and
user paths were present and are excluded from this work. Credential preflight
`pnpm run check:op` passed before dispatch. DOC-07 was fetched exactly once at
`2026-08-02T07:06:20Z`; the response contained 12,968 bytes and retained
SHA-256
`6a495e8b4787c6e063da393a5455d119c478a295960e3361535f3fa631fbf1b4`,
so the official declaration had not drifted.

The single permitted source-create payload is frozen as:

```json
{
  "model": "grok-imagine/text-to-video",
  "input": {
    "prompt": "A blue sphere drifts above a quiet lake.",
    "duration": 6,
    "resolution": "480p"
  }
}
```

The source create has no automatic retry. If it returns a successful task ID,
this run calls `/api/v1/jobs/recordInfo` at a 10-second cadence and stops at
the earlier of 120 task-detail requests or 20 minutes from source creation.
Every poll is counted and timestamped. Polling stops early on `success` or
`fail`, and stops without retry on the first HTTP/API error, malformed
response, mismatched task ID, or unrecognized state. The matrix may begin only
after task details establish `success`, the same task ID, and `480p` in the
recorded source parameters.

At this frozen boundary, source creates, source polls, matrix creates, retries,
callbacks, downloads, and fixture writes were all zero; source, matrix, and
total cost were `$0.00`. The run will not use the historical HAR task ID,
enable recording mode, register a callback, download generated media, or
retry any create. Its hard maxima are one source create, `$0.048` source cost,
120 source polls and 20 minutes, eight matrix creates, `$0.50` matrix cost, and
nine total paid creates at a conservative `$0.548` total maximum.

### Continuation run `ac-rqfacx`: source observation and stop outcome

The source create was dispatched once at `2026-08-02T07:09:02.687Z`. It
returned HTTP `200`, envelope `code: 200`, `msg: "success"`, and a task ID.
The task ID matched all later task-detail responses. The `op run` output
masker concealed two characters in the retained transcript, so the durable
redacted identifier is
`09[masked]7ee21b9c1791[masked]a0ec7fc9d7a9eae6`; it is not silently
reconstructed or reused here.

Three task-detail requests followed at the frozen 10-second cadence:

| Poll | Timestamp              | HTTP / API    | State     | Retained parameter projection                                            |
| ---- | ---------------------- | ------------- | --------- | ------------------------------------------------------------------------ |
| 1    | `2026-08-02T07:09:12Z` | `200` / `200` | `waiting` | model `grok-imagine/text-to-video`; duration and resolution not retained |
| 2    | `2026-08-02T07:09:22Z` | `200` / `200` | `waiting` | model `grok-imagine/text-to-video`; duration and resolution not retained |
| 3    | `2026-08-02T07:09:32Z` | `200` / `200` | `success` | model `grok-imagine/text-to-video`; duration and resolution not retained |

The terminal response reported `costTime: 24` and no failure code or message.
It proved current successful completion for the same task and model, but the
run's redacted projection decoded only the outer `param` object and attempted
object-shaped access to its `input` member. The historical task-detail fixture
shows that KIE may serialize `input` as a nested JSON string; the current
runner did not retain or decode that inner value. Consequently, the durable
observation does not prove that the completed source was `480p`, even though
the create payload requested `480p`. Inferring resolution from the submitted
payload would collapse request evidence into completion evidence.

The frozen protocol required polling to stop on terminal `success`, so no
additional status request was made to repair the projection. The matrix
precondition was not met and no Extend case ran. Final accounting is one
source create, three source polls, zero matrix creates, zero retries, zero
callbacks, zero downloads, and zero fixture writes. Conservative source and
total cost are at most `$0.048`; matrix cost is `$0.00`. Provider schema,
discovery metadata, generated documentation, tests, and pricing source remain
unchanged. The exact blocker is missing durable current 480p confirmation
after the one-create allowance was consumed and terminal polling stopped.

## Decisions

### Existing Grok duration decision

Both `grok-imagine/text-to-video.input.duration` and
`grok-imagine/image-to-video.input.duration` are classified `both`. Their local
schemas accept bounded integer numbers or canonical decimal integer strings
from 6 through 30, preserve the supplied representation, retain the numeric
image-to-video default `6`, and reject coercive or noncanonical forms.

Rows outside the Grok duration and Qwen2 image-edit seed decisions retain their
current local behavior. A current declaration alone does not authorize a
speculative numeric-string widening. Unknown rows stay unknown, and documented
discrepancies remain unchanged until their linked Beads work establishes a
deliberate contract.

### Grok Extend decision status

No final Grok Extend compatibility contract is selected. The current source
remains contradictory. The authorized source request completed successfully,
but its retained task-detail projection did not preserve the nested resolution
field, so the eight-case matrix remained at zero calls. A narrower
continuation must supply durable evidence that a reusable completed KIE task is
`480p` and its exact task ID, or explicitly authorize a new bounded source
observation after review of the consumed one-create allowance.

Until that input exists, the existing Apicity runtime behavior remains
unchanged and downstream schema, metadata, test, documentation, and pricing
work stays blocked. Authorization alone is not recorded as service evidence.

### Continuation run `ac-c9zybp`: authorized one-read boundary

This continuation starts at `2026-08-02T12:19:30Z` from reviewed repository
anchor `14ad882c1479826c4d3735c35fd2207d100aaba4` on `main`, equal to
`origin/main` with no tracked diff. Pre-existing untracked Gas City, launcher,
and user paths are excluded from this work. `pnpm run check:op` passed before
dispatch.

The run consumes the local recovery in
`plans/ac-4up9pn/build/source-task-recovery.ac-lw5h1b.md` and manual decision
`ac-q8gjzt=read-ok`, answered at `2026-08-02T11:45:34Z`. That decision
authorizes exactly one zero-cost `GET` to host `api.kie.ai`, path
`/api/v1/jobs/recordInfo`, and query
`taskId=0937ee21b9c17913a0ec7fc9d7a9eae6`. It authorizes no retry,
alternative task ID, source create, poll, callback, media download, or fixture
write. The recovered identifier is an input to this read, not service
evidence by itself.

Starting run counters are zero new source creates, zero task-detail reads,
zero matrix creates, and `$0.00` new spend. Historical consumed accounting
remains separate: the earlier source run made one create and three polls at a
conservative maximum of `$0.048`. Only after this saved response confirms the
same terminally successful six-second 480p source may the standing
`ac-egtr46=approve-probe` authority resume the eight-case matrix under its
eight-create and `$0.50` ceilings.

File-first evidence is rooted at
`plans/ac-4up9pn/build/evidence/ac-c9zybp/`. Before dispatch, the one-shot
runner exclusively creates `task-detail.attempt.json`; it refuses to run when
that marker or `task-detail-response.raw.json` already exists. The raw
response is written with mode `0600` and fsynced before projection. Its digest,
safe HTTP metadata, exact raw `param`, safe projection, and terminal outcome
use the sibling `task-detail-*` paths. Request data and API output are never
printed by the runner. `op run` stdout is not evidence because 1Password masks
every digit `3`; restricted files and their hashes are authoritative.

The single GET was dispatched at `2026-08-02T12:24:18.209Z` and returned at
`2026-08-02T12:24:18.510Z`. HTTP status was `200`; the KIE envelope had
`code: 200`, `msg: "success"`, and non-null data. The exact recovered task ID
matched, state was `success`, model was `grok-imagine/text-to-video`, and both
failure fields were empty. The saved raw response hashes to
`a35a728896255181f0583554afd5470e26f76434263e9ee574a6e9f77f0faf56`.
The exact raw `param` value hashes to
`94b582fd1279dc9e223a0de78dfb5f763756be58083a1ccf6ca21e450fc575b4`;
its outer JSON contains a string-valued `input`, and that nested JSON records
number `duration: 6` and string `resolution: "480p"`. Incidental result URLs
remain restricted and are not published here.

The first local outcome artifact conservatively labeled the observation
blocked because it compared timestamps for exact millisecond equality. It
recorded `createTime: 1785654543000` and
`completeTime: 1785654568000`, while recovery retained
`1785654543003` and `1785654568023`. The response values are whole-second
representations of the same Unix seconds, differing only by 3 ms and 23 ms.
The independent offline validator preserves the first outcome, hashes both
inputs, and applies the plan's non-contradiction rule: exact equality or the
same Unix second when KIE returns zero milliseconds. All identity, envelope,
state, model, failure, serialization, duration, resolution, and timestamp
checks pass in `task-detail-offline-validation.json`. The source confirmation
gate is therefore satisfied without another request.

Final pre-matrix accounting is zero new source creates, `1 of 1` task-detail
GETs, zero retries, zero polls, zero callbacks, zero downloads, zero fixture
writes, and `$0.00` new spend. The historical source run remains one create,
three polls, and at most `$0.048` separately.

### Continuation run `ac-c9zybp`: frozen Extend matrix

The confirmed source ID, constant prompt
`The blue sphere drifts slowly as the camera pans right.`, and top-level
`resolution: "480p"` are frozen for all eight cases. Every payload uses model
`grok-imagine/extend`, the same `task_id`, no callback, and changes only
`extend_at` and `extend_times` in this order:

| Order | Case        | `extend_at` | `extend_times` | Maximum cost | Cumulative ceiling |
| ----- | ----------- | ----------- | -------------- | ------------ | ------------------ |
| 1     | control     | `2`         | `"6"`          | `$0.05`      | `$0.05`            |
| 2     | omission    | omitted     | `"6"`          | `$0.05`      | `$0.10`            |
| 3     | lower zero  | `0`         | `"6"`          | `$0.05`      | `$0.15`            |
| 4     | lower one   | `1`         | `"6"`          | `$0.05`      | `$0.20`            |
| 5     | fraction    | `2.5`       | `"6"`          | `$0.05`      | `$0.25`            |
| 6     | numeric six | `2`         | `6`            | `$0.05`      | `$0.30`            |
| 7     | string ten  | `2`         | `"10"`         | `$0.10`      | `$0.40`            |
| 8     | numeric ten | `2`         | `10`           | `$0.10`      | `$0.50`            |

The current local schema intentionally rejects three candidate forms before
transport, so the evidence runner binds each exact raw payload through the
repository's OTP pay gate and then performs one direct POST to the existing
`createTask` URL. This keeps the approval check payload-bound without changing
or bypassing product source. A local no-network preflight proves the pay gate
dispatches exactly once. Before every external dispatch, an exclusive
per-case marker and exact payload file are fsynced; raw response bytes, HTTP
metadata, digest, safe projection, and outcome use matching `matrix-*` paths.
No case is retried. Extend tasks are not polled, callbacks are absent, output
is not downloaded, and no fixture is written. Matrix counters start at zero
calls and `$0.00`; their hard ceilings remain eight calls and `$0.50`.

### Continuation run `ac-c9zybp`: matrix observations and decision

The matrix ran from `2026-08-02T12:32:31Z` through
`2026-08-02T12:32:42.242Z` and completed all eight cases in the frozen order.
Each response had HTTP status `200`; KIE used envelope `code: 200` and
`msg: "success"` for accepted requests, and envelope `code: 500` with a
field-specific message for rejected requests. The create responses establish
submission acceptance or rejection only; no output behavior is inferred.

| Order | Case        | Exact variant                         | Observation                                  | Returned task ID                   | Raw-response SHA-256                                               |
| ----- | ----------- | ------------------------------------- | -------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------ |
| 1     | control     | `extend_at: 2`, `extend_times: "6"`   | accepted                                     | `8779ac76caaf8931f6e7d784cb00f59f` | `9deb8afa5dec5c496e0f96e69047a6e04fd8baf79e638d44d298c14cc00e07bb` |
| 2     | omission    | omit `extend_at`, `extend_times: "6"` | rejected: `This field is required`           | none                               | `67f6da88e6a8c443a6c23821ac73a048ad18da7d64c2321208371f7b4d6ee0b1` |
| 3     | lower zero  | `extend_at: 0`, `extend_times: "6"`   | accepted                                     | `381d1468f8224be23c0f762ef1a9d00d` | `48e0c73bd50c7138e26e7c316c8bc343be034e3176238f91131f664e33faf6ca` |
| 4     | lower one   | `extend_at: 1`, `extend_times: "6"`   | accepted                                     | `515a0f4e95adf79c48370a07d4810237` | `e1705ce6f6e1026e0c65f2139488d053806401e536192a296c498eeed87d26e6` |
| 5     | fraction    | `extend_at: 2.5`, `extend_times: "6"` | accepted                                     | `43de4ae8215106411dac3d8791b5cf82` | `a2cb7f15597b7dbfc7ae067d889411975ae20e561b36bd0cbdbeaa660b2e045c` |
| 6     | numeric six | `extend_at: 2`, `extend_times: 6`     | rejected: `extend_times it must be a string` | none                               | `a73753654a09c41f0d578fc437cb2bc831268813436abae3ed9e995f28a66056` |
| 7     | string ten  | `extend_at: 2`, `extend_times: "10"`  | accepted                                     | `af4581028a65c6146b4b16062d76d1d0` | `9f9a45e76b85d62cf6205308422ab43b8351f5eccca32eea71237c989f434dc3` |
| 8     | numeric ten | `extend_at: 2`, `extend_times: 10`    | rejected: `extend_times it must be a string` | none                               | `a73753654a09c41f0d578fc437cb2bc831268813436abae3ed9e995f28a66056` |

The selected contract is complete and representable without coercion:

| Contract dimension           | `input.extend_at`                                                                    | `input.extend_times`                                                                  |
| ---------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| Accepted JSON types          | number only                                                                          | string only                                                                           |
| Requiredness                 | required; omission was rejected                                                      | required; no omission case is needed because every source agrees                      |
| Default ownership            | no Apicity default; KIE's advertised `2` is not usable because omission was rejected | no default                                                                            |
| Integer/fractional semantics | general number; `2.5` was accepted                                                   | discrete string values only                                                           |
| Bounds and values            | minimum `0`; no fixed maximum                                                        | exactly `"6"` and `"10"`                                                              |
| Representation policy        | forward the caller's number unchanged                                                | forward the caller's canonical string unchanged; reject numbers and malformed strings |

Accordingly, Apicity keeps `extend_at` required and minimum `0`, removes its
unsupported integer-only restriction, and does not materialize a default. It
keeps `extend_times` required as the exact string enum `"6" | "10"`; numeric
`6` and `10` are not added. Discovery metadata, generated caller docs, direct
and guarded tests, the derived inventory, and cost fixtures must express the
same decision. The price selector remains string-only because that is the
evidenced provider contract.

Final evidence accounting is zero new source creates, one zero-cost
task-detail GET, eight matrix creates, and at most `$0.50` matrix spend.
Retries, source polls, Extend polls, callbacks, downloads, fixture writes, and
historical-HAR task reuse are all zero. The earlier source run's one create,
three polls, and at most `$0.048` remain historical accounting, not new
authority.

## Qwen2 image-edit seed evidence and decision

KIE's official Qwen2 image-edit Markdown OpenAPI is
https://docs.kie.ai/market/qwen2/image-edit.md (`DOC-09`). It was retrieved on
2026-07-31 and verified unchanged on 2026-08-01, with SHA-256
`669abb6a6fb2b41f99539e15e312c315318f10e7f2b88535130f83d03eaaf781`.
The source declares `input.seed` optional with JSON type `integer`, shows the
JSON number `0` in its request example, and declares no minimum, maximum, or
default.

No live fractional-seed observation or vendor clarification is available.
Accordingly, this record does not claim that the current KIE service rejects
fractions and does not infer a service default. Apicity follows the normative
published contract: when supplied, `seed` must be an integer JSON number;
omission remains absent; and no bounds, default, coercion, normalization, or
other transformation is introduced. Supplied integers are preserved, while
fractions and numeric strings are rejected by local validation.

## WAN 2.7 image bounding-box evidence and decision

KIE's official WAN 2.7 image Markdown OpenAPI exports were retrieved again on
2026-08-03 and remained byte-for-byte identical to the 2026-07-31 snapshots:

- https://docs.kie.ai/market/wan/2-7-image.md (`DOC-17`) has SHA-256
  `8d1c13c0c9cd155968888fe1ba8053bcd5e11bc6b135876aae65037074ad0160`.
- https://docs.kie.ai/market/wan/2-7-image-pro.md (`DOC-18`) has SHA-256
  `af2473f0149e9a033736be23b35ed060aef26c15c8242db7a2ca54560145b7f3`.

Both sources declare every `input.bbox_list[][][]` coordinate as a JSON
`integer`. Apicity follows that published integer contract for both model IDs:
supplied coordinates must be integer JSON numbers and remain unbounded and
uncoerced. No paid or live fractional probe was run. This decision does not
claim an observed KIE rejection, rounding, normalization, or other live
fractional behavior.

## Follow-up discrepancies

The audit still tracks four unrelated evidence groups that are concrete enough
for separate work outside the decisions recorded above:

- `ac-4up9pn` — the Grok Extend matrix remains blocked before its first call.
  One authorized source create completed, but the retained terminal projection
  did not preserve 480p evidence and the one-create allowance is consumed.
- `ac-07mm6l` — reconcile the then-current Seedance 2 Mini duration default
  (`15` locally, `5` in `DOC-12`).
- `ac-kxdmvm` — decide whether Wan 2.7 image bounding-box coordinates are
  integer-only; both local schemas currently accept fractions.
- `ac-elwd7r` — reconcile ElevenLabs media stability, similarity, style, and
  speed bounds/defaults with the current OpenAPI exports.

Status update at `2026-08-02T12:32:42.242Z`: the later `ac-c9zybp`
continuation resolved `ac-4up9pn` through the saved source confirmation and
completed matrix recorded above. The other three follow-up groups remain open;
the historical blocked status in the list is retained as the earlier run's
truthful state.

Status update at `2026-08-02T19:16:00Z`: `ac-07mm6l` is resolved. The local
Seedance 2 Mini duration default is now `5`, aligned with `DOC-12`. The two
unrelated Wan 2.7 and ElevenLabs follow-up groups remain open.

Status update at `2026-08-03`: `ac-kxdmvm` is resolved by following the
unchanged published integer contract for both WAN 2.7 image bounding-box
coordinate leaves. No paid or live fractional probe occurred. The unrelated
ElevenLabs follow-up group remains open.

## Official source registry

All hashes cover the exact UTF-8 Markdown response retrieved on 2026-07-31.
`DOC-07` was fetched again at `2026-08-02T01:05:13.612Z` and at
`2026-08-02T07:06:20Z`; both snapshots retained the same hash.
`DOC-17` and `DOC-18` were fetched again on 2026-08-03 and remained
byte-for-byte identical to the registered snapshots.

| ID     | URL                                                                     | SHA-256                                                            |
| ------ | ----------------------------------------------------------------------- | ------------------------------------------------------------------ |
| DOC-00 | https://docs.kie.ai/llms.txt                                            | `28d0bbd00f86c2cea957414a3b3b2250c36c6de97ea32ec119cbd05628ce0d31` |
| DOC-01 | https://docs.kie.ai/market/kling/kling-3-0.md                           | `8e91769f334c4b12d16537cc225c507ae80c2ddae76db14f8698559dc55410d0` |
| DOC-02 | https://docs.kie.ai/market/kling/v3-turbo-image-to-video.md             | `1c9f9ab8043070a23ab38c75360d26641f7649233d25a4f3090c03a8d0ca2a3e` |
| DOC-03 | https://docs.kie.ai/market/kling/v3-turbo-text-to-video.md              | `92649ab9812d3868ac1255e7861bcaa5477594225a1b41fd18ca36e7084696d4` |
| DOC-04 | https://docs.kie.ai/market/grok-imagine/text-to-video.md                | `aac0f86fbfc9eca8b48ecd09f175b1b83c074ecb38b49c5c7bd9fa26af15a05b` |
| DOC-05 | https://docs.kie.ai/market/grok-imagine/image-to-video.md               | `501884185fce60c18473aba69ce7e9e5d93843f76baf53882703a8b6703d5648` |
| DOC-06 | https://docs.kie.ai/market/grok-imagine/1-5-preview.md                  | `b9db86fc4d6dc738944289ac9f2f1753fd368e0532053970b266563df3beb25e` |
| DOC-07 | https://docs.kie.ai/market/grok-imagine/extend.md                       | `6a495e8b4787c6e063da393a5455d119c478a295960e3361535f3fa631fbf1b4` |
| DOC-08 | https://docs.kie.ai/market/qwen2/text-to-image.md                       | `f7f9bc18186f7eca06afc8e05f8c5de94b5d8ba0085fddee36283381ee128695` |
| DOC-09 | https://docs.kie.ai/market/qwen2/image-edit.md                          | `669abb6a6fb2b41f99539e15e312c315318f10e7f2b88535130f83d03eaaf781` |
| DOC-10 | https://docs.kie.ai/market/bytedance/seedance-2-fast.md                 | `d4b8daaa6b487f39abe7daa3602e478ff98978b946cebc42d0c6797a254838d2` |
| DOC-11 | https://docs.kie.ai/market/bytedance/seedance-2.md                      | `b61ad76b99afe2ca5eeeea41cf50cfe13e98ab76732b2142af1372d97d734592` |
| DOC-12 | https://docs.kie.ai/market/bytedance/seedance-2-mini.md                 | `cd6fedfe4984bd8a5e11fb6143c7f2488ffff9bca057a7e22cb9a9c18541e2ce` |
| DOC-13 | https://docs.kie.ai/market/wan/2-7-image-to-video.md                    | `88fdb4a0c8201dd440ea4e311063a28e16bf8ef1000db25bfc8e7ba5680714e7` |
| DOC-14 | https://docs.kie.ai/market/wan/2-7-text-to-video.md                     | `b6ae71e380c3c96adb39f5bf71d536967515d5ec2bbcad15af40e5be0277c3d6` |
| DOC-15 | https://docs.kie.ai/market/wan/2-7-r2v.md                               | `436b078887a931784384b2b7e7a999d5e627fcc5c6a871ccb7aee3d3bf940ae9` |
| DOC-16 | https://docs.kie.ai/market/wan/2-7-videoedit.md                         | `f3d430128497a4e04464fc1f43efcf399822eed9cf7163b76535d3ad3000cf6f` |
| DOC-17 | https://docs.kie.ai/market/wan/2-7-image.md                             | `8d1c13c0c9cd155968888fe1ba8053bcd5e11bc6b135876aae65037074ad0160` |
| DOC-18 | https://docs.kie.ai/market/wan/2-7-image-pro.md                         | `af2473f0149e9a033736be23b35ed060aef26c15c8242db7a2ca54560145b7f3` |
| DOC-19 | https://docs.kie.ai/market/happyhorse/text-to-video.md                  | `422c132da2ef812ae480fab0f2ebdcfb7e414f8c6b47076cdf7afadd99941a8c` |
| DOC-20 | https://docs.kie.ai/market/happyhorse/image-to-video.md                 | `e6e657656a36ee5befff4fa60e7a93385667148591b2f7950cb8c6652c25a170` |
| DOC-21 | https://docs.kie.ai/market/happyhorse/reference-to-video.md             | `c645623c7e8c8407b48cc93eb5823a842157708ea247330a611352696cab9297` |
| DOC-22 | https://docs.kie.ai/market/happyhorse/video-edit.md                     | `0dde955765fd447da4f082ac6a4cc007b31fca2312a4f0f13b4e5fdb78d758f5` |
| DOC-23 | https://docs.kie.ai/market/happyhorse-1-1/text-to-video.md              | `95b2af914728decfa6e93da284246a8f22ec9a00447d23308e9dc23167dcc0eb` |
| DOC-24 | https://docs.kie.ai/market/happyhorse-1-1/image-to-video.md             | `e335c26f6aa0bd70756180713195f9d085c506c0c26ec2d3caad9878e473674f` |
| DOC-25 | https://docs.kie.ai/market/happyhorse-1-1/reference-to-video.md         | `c1c24c5255417e1d1e88d6d8b5763edf37048036529b17cd5e4a27b4ade6e9d7` |
| DOC-26 | https://docs.kie.ai/market/omnihuman-1-5.md                             | `ab9070f5505b7b92e8a34a25956cc364e93334de9d414436fdb214cdcfa3a68f` |
| DOC-27 | https://docs.kie.ai/market/volcengine/video-to-video-lip-sync.md        | `c373f6e117bce35a84ef56377d92398e2bd07851ef0700a801808c80c534ab2f` |
| DOC-28 | https://docs.kie.ai/market/gemini-omni-video.md                         | `c48397bff1c597d1885c4bfbf3a9714177c5079137b6b250a79fedbea11ff173` |
| DOC-29 | https://docs.kie.ai/market/elevenlabs/text-to-dialogue-v3.md            | `af8459dffd80a4ec23a291c23f9959e82cd814b62829d37e568df05293431682` |
| DOC-30 | https://docs.kie.ai/market/elevenlabs/text-to-speech-multilingual-v2.md | `99292cead27b90ccc41fb8c75c9ba9e4441b379d4b7b9e1fdf64c90a33d142aa` |
| DOC-31 | https://docs.kie.ai/market/elevenlabs/text-to-speech-turbo-2-5.md       | `18e23ee4f96b5e7a0fee83ec5e52c2182eff6fd4239c3d1f271658df3808805f` |
| DOC-33 | https://docs.kie.ai/market/pixverse/text-to-video.md                    | `0262298f7fb23c11aebd780891d39839a065de16daf43fb042bad3f36f6ec5e7` |
| DOC-34 | https://docs.kie.ai/market/pixverse/image-to-video.md                   | `2042401ec6ccc94ff8ed592842b2cb557907dab0800667eeb0d57347bdf6432c` |
| DOC-35 | https://docs.kie.ai/market/pixverse/transition.md                       | `9b8d6898d05205e5ed28773892f128fdc07c3fce3ad208297349f7ef445d6808` |
| DOC-36 | https://docs.kie.ai/market/pixverse/extend.md                           | `092639d6883e0220f54b89775e9439546ecf837b809a7f2e658c864797950cd2` |
| DOC-37 | https://docs.kie.ai/market/pixverse/reference-to-video.md               | `787e3d8cce37bb2679eef55671d3acf3b401716b9ca87f11070862fa4e9b0e7a` |
| DOC-38 | https://docs.kie.ai/market/minimax-h3/text-to-video.md                  | `c607d9ad9831132ba5993c2ab2bb586a64ade36f2e0cc14d7705ca5839e20239` |
| DOC-39 | https://docs.kie.ai/market/minimax-h3/image-to-video.md                 | `03c053ae3a71bae492905348da8d8da6b562568d6a564171b6e1785a41497c5b` |
| DOC-40 | https://docs.kie.ai/market/minimax-h3/reference-to-video.md             | `5af016278f46ab9fa0ed7a99daf36cde3d7dcbb7a0de6cbf5db5e55be67d5e10` |
| DOC-41 | https://docs.kie.ai/google/gemini-2-5-pro-tts.md                        | `b9aaabce44a2ef7adc1fe349df4ee6f92b354b441f5e57c4877ab5d0324570ac` |
| DOC-42 | https://docs.kie.ai/market/google/gemini-3-1-flash-tts.md               | `b54d49a925d3877a272ca276bf7d499acae01b673e0e168c7b1adde817e49b08` |
| DOC-43 | https://docs.kie.ai/market/topaz/image-upscale.md                       | `b62f234c238c3b732a9fbc72ea0ef48b4807d96b1ba165ca1cff2f802ac97866` |
| DOC-44 | https://docs.kie.ai/market/topaz/video-upscale.md                       | `af5913ab87bf9449201d7b0c0046364698702e41accd76ffb1828618818ddc35` |
| DOC-45 | https://docs.kie.ai/market/qwen/text-to-image.md                        | `759e044e4d09bf1a9b28ccd996d135b4f66b9651766f815027c5cb626d3e9cc1` |
| DOC-46 | https://docs.kie.ai/market/qwen/image-edit.md                           | `e7f62d6033c0e34f6aceb3b196fce59a9284075dcc019e9708ed6e31c1e828ea` |
| DOC-47 | https://docs.kie.ai/market/qwen/image-to-image.md                       | `1c271ad205c8d34c14966b85f5b212e51921df529c8a9f5161a92c6f180e6bba` |
| DOC-48 | https://docs.kie.ai/market/infinitalk/from-audio.md                     | `19eccc3ccf827942d6b10ebd6aa45bcb31a3e0fd83a08e4ea22be2f42c5e2dfc` |
| DOC-49 | https://docs.kie.ai/market/bytedance/seedance-1-5-pro.md                | `9bb3c2045435de83803f871979791621dc08859155a7b5ab96dfe292eae39d8c` |
| DOC-50 | https://docs.kie.ai/market/ideogram/v3-text-to-image.md                 | `fc6f48022774b2db9a1b904245e29fe275dd4baf68c05bd0e13e8c17864eb967` |
| DOC-51 | https://docs.kie.ai/market/ideogram/v3-edit.md                          | `d95f246d53736b84e86944d068e22ccd3317e5adcfba96d27f610052416b2021` |
| DOC-52 | https://docs.kie.ai/market/ideogram/v3-remix.md                         | `347374b8f224f947706f0a1ff951d53ebbea0d3e15e2f3dd93dd55379570c55c` |
| DOC-53 | https://docs.kie.ai/market/ideogram/character.md                        | `18151dd260baa20a89fad3d5fcd53919283e0016c71419aff7a5a6414be9f717` |
| DOC-54 | https://docs.kie.ai/market/ideogram/character-edit.md                   | `a04d1691f2077d7df6fc4e35603478c02f81b44fe88d862f020d2f99f73eab89` |
| DOC-55 | https://docs.kie.ai/market/ideogram/character-remix.md                  | `fe9b23b067cf334863d8fd1aeb762bb6397580a46939faca0acfba6c3eadefac` |
| DOC-56 | https://docs.kie.ai/market/google/imagen4-fast.md                       | `b037df529a223c192352cfb3cd3ee68091295c7e77a1407061d48c8b1d744763` |
| DOC-57 | https://docs.kie.ai/market/seedream/seedream.md                         | `4786302f7419b5783903cf835eea133241a17fa47822ce0f5f031469ac1c2b6c` |
| DOC-58 | https://docs.kie.ai/market/seedream/seedream-v4-edit.md                 | `f7378aa6b9e9bf8e3829ab043f8843409d660385eb7a07bde0fa38f5207a2b0f` |
| DOC-59 | https://docs.kie.ai/market/seedream/seedream-v4-text-to-image.md        | `6151724cd73f03c95a61e0cac486953ce80316e2728730b1ba131e5e0e45b161` |
| DOC-60 | https://docs.kie.ai/market/bytedance/v1-lite-image-to-video.md          | `014f63b648e61e5692e371003d4b047cc4d951108aad7884ae1b4074d317b6c7` |
| DOC-61 | https://docs.kie.ai/market/bytedance/v1-lite-text-to-video.md           | `82967ae393e6b1508e38de8cc9db39e83e368b61c9b923baa2ca5a6aefce4c50` |
| DOC-62 | https://docs.kie.ai/market/bytedance/v1-pro-fast-image-to-video.md      | `9511782f755de53ccf734a511db25368b42bf29b0fcbbab611917ccb90a96137` |
| DOC-63 | https://docs.kie.ai/market/bytedance/v1-pro-image-to-video.md           | `f26482add7cfe35e661cda5125bdaecaa819d01d2ebfa36a1bcbed195c316948` |
| DOC-64 | https://docs.kie.ai/market/bytedance/v1-pro-text-to-video.md            | `46619cfc27d6677b75012eeafa82021b48c99a416bf5f53bdcd1a73bad3586f1` |

## Numeric inventory

`NONE` means the current `DOC-00` index has no model-specific page. `absent`
means the current request example does not include that field. "Retain" means
this evidence item makes no runtime contract change for the row.

<!-- numeric-inventory:start -->

| Model                                     | Input path                    | Local contract                                                                                       | Official source     | Declared JSON type                          | Example JSON type   | Observation                                 | Classification      | Confidence | Decision                                     |
| ----------------------------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------- | ------------------- | ------------------------------------------- | ------------------- | ---------- | -------------------------------------------- |
| kling-3.0/video                           | input.duration                | required; numeric-string enum="3","4","5","6","7","8","9","10","11","12","13","14","15"              | DOC-01 @ 2026-07-31 | string default="5"                          | string ("5")        | none beyond current OpenAPI                 | numeric-string-only | high       | retain current behavior                      |
| kling-3.0/video                           | input.multi_prompt[].duration | optional; integer min=1 max=12                                                                       | DOC-01 @ 2026-07-31 | integer min=1 max=12                        | number (3)          | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                      |
| kling/v3-turbo-image-to-video             | input.duration                | required; numeric-string pattern=^[1-9]\d\*$                                                         | DOC-02 @ 2026-07-31 | string default="5"                          | string ("5")        | none beyond current OpenAPI                 | numeric-string-only | high       | retain current behavior                      |
| kling/v3-turbo-text-to-video              | input.duration                | optional; numeric-string enum="3","4","5","6","7","8","9","10","11","12","13","14","15" default="5"  | DOC-03 @ 2026-07-31 | string default="5"                          | string ("5")        | none beyond current OpenAPI                 | numeric-string-only | high       | retain current behavior                      |
| grok-imagine/text-to-video                | input.duration                | optional; integer min=6 max=30 + numeric-string pattern=^(?:[6-9]&#124;[12][0-9]&#124;30)$           | DOC-04 @ 2026-07-31 | number                                      | string ("6")        | HAR string "6" -> HTTP 200 (2026-04-16)     | both                | high       | accept bounded number + canonical string     |
| grok-imagine/image-to-video               | input.index                   | optional; integer min=0 max=5 default=0                                                              | DOC-05 @ 2026-07-31 | integer min=0 max=5 default=0               | number (0)          | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                      |
| grok-imagine/image-to-video               | input.duration                | optional; integer min=6 max=30 + numeric-string pattern=^(?:[6-9]&#124;[12][0-9]&#124;30)$ default=6 | DOC-05 @ 2026-07-31 | string                                      | string ("6")        | HAR string "6" -> 200; live number 6 -> 200 | both                | high       | accept bounded number + canonical string     |
| grok-imagine-video-1-5-preview            | input.duration                | optional; integer min=1 max=15 default=8                                                             | DOC-06 @ 2026-07-31 | integer multipleOf=1 min=1 max=15 default=8 | absent              | none beyond current OpenAPI                 | number-only         | medium     | retain current behavior                      |
| grok-imagine/extend                       | input.extend_at               | required; number min=0                                                                               | DOC-07 @ 2026-07-31 | number min=2 default=2                      | number (2)          | matrix 0/1/2/2.5 -> 200; omit -> 500        | number-only         | high       | require general number min=0; no default     |
| grok-imagine/extend                       | input.extend_times            | required; numeric-string enum="6","10"                                                               | DOC-07 @ 2026-07-31 | number                                      | string ("6")        | matrix "6"/"10" -> 200; 6/10 -> 500         | numeric-string-only | high       | retain exact strings; reject numbers         |
| qwen2/text-to-image                       | input.seed                    | optional; integer                                                                                    | DOC-08 @ 2026-07-31 | integer                                     | number (0)          | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                      |
| qwen2/image-edit                          | input.seed                    | optional; integer                                                                                    | DOC-09 @ 2026-07-31 | integer                                     | number (0)          | no fractional observation or clarification  | number-only         | high       | align with official integer contract         |
| bytedance/seedance-2-fast                 | input.duration                | optional; integer min=4 max=15 default=5                                                             | DOC-10 @ 2026-07-31 | integer default=5                           | number (15)         | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                      |
| bytedance/seedance-2                      | input.duration                | optional; integer min=4 max=15 default=5                                                             | DOC-11 @ 2026-07-31 | integer default=5                           | number (15)         | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                      |
| bytedance/seedance-2-mini                 | input.duration                | optional; integer min=4 max=15 default=5                                                             | DOC-12 @ 2026-07-31 | integer default=5                           | number (15)         | default aligned with DOC-12 by ac-07mm6l    | number-only         | high       | retain aligned default 5                     |
| bytedance/seedance-1.5-pro                | input.duration                | required; integer min=4 max=12                                                                       | DOC-49 @ 2026-08-06 | number                                      | number (8)          | OpenAPI required; range 4-12 s              | number-only         | high       | enforce integer range; do not inject default |
| bytedance/seedream                        | input.guidance_scale          | optional; number min=1 max=10 default=2.5                                                            | DOC-57 @ 2026-08-06 | number min=1 max=10 default=2.5             | number (2.5)        | none beyond current OpenAPI                 | number-only         | high       | enforce bounds; default matches OpenAPI      |
| bytedance/seedream                        | input.seed                    | optional; integer                                                                                    | DOC-57 @ 2026-08-06 | integer                                     | absent              | none beyond current OpenAPI                 | number-only         | medium     | retain integer seed; reject strings          |
| bytedance/seedream-v4-edit                | input.max_images              | optional; integer min=1 max=6 default=1                                                              | DOC-58 @ 2026-08-06 | number min=1 max=6 default=1                | number (1)          | none beyond current OpenAPI                 | number-only         | high       | enforce integer range; default matches docs  |
| bytedance/seedream-v4-edit                | input.seed                    | optional; integer                                                                                    | DOC-58 @ 2026-08-06 | integer                                     | number (80960659)   | none beyond current OpenAPI                 | number-only         | high       | retain integer seed; reject strings          |
| bytedance/seedream-v4-text-to-image       | input.max_images              | optional; integer min=1 max=6 default=1                                                              | DOC-59 @ 2026-08-06 | number min=1 max=6 default=1                | number (1)          | none beyond current OpenAPI                 | number-only         | high       | enforce integer range; default matches docs  |
| bytedance/seedream-v4-text-to-image       | input.seed                    | optional; integer                                                                                    | DOC-59 @ 2026-08-06 | integer                                     | number (50331296)   | none beyond current OpenAPI                 | number-only         | high       | retain integer seed; reject strings          |
| bytedance/v1-lite-image-to-video          | input.duration                | optional; numeric-string enum="5","10" default="5"                                                   | DOC-60 @ 2026-08-06 | string enum="5","10" default="5"            | string ("5")        | none beyond current OpenAPI                 | numeric-string-only | high       | retain exact strings; reject numbers         |
| bytedance/v1-lite-image-to-video          | input.seed                    | optional; integer min=-1 max=2147483647                                                              | DOC-60 @ 2026-08-06 | number min=-1 max=2147483647 default=-1     | number (-1)         | none beyond current OpenAPI                 | number-only         | high       | enforce integer range; do not inject default |
| bytedance/v1-lite-text-to-video           | input.duration                | optional; numeric-string enum="5","10" default="5"                                                   | DOC-61 @ 2026-08-06 | string enum="5","10" default="5"            | string ("5")        | none beyond current OpenAPI                 | numeric-string-only | high       | retain exact strings; reject numbers         |
| bytedance/v1-lite-text-to-video           | input.seed                    | optional; integer min=-1 max=2147483647                                                              | DOC-61 @ 2026-08-06 | integer                                     | number (91466377)   | none beyond current OpenAPI                 | number-only         | high       | enforce integer range; do not inject default |
| bytedance/v1-pro-fast-image-to-video      | input.duration                | optional; numeric-string enum="5","10" default="5"                                                   | DOC-62 @ 2026-08-06 | string enum="5","10" default="5"            | string ("5")        | none beyond current OpenAPI                 | numeric-string-only | high       | retain exact strings; reject numbers         |
| bytedance/v1-pro-image-to-video           | input.duration                | optional; numeric-string enum="5","10" default="5"                                                   | DOC-63 @ 2026-08-06 | string enum="5","10" default="5"            | string ("5")        | none beyond current OpenAPI                 | numeric-string-only | high       | retain exact strings; reject numbers         |
| bytedance/v1-pro-image-to-video           | input.seed                    | optional; integer min=-1 max=2147483647                                                              | DOC-63 @ 2026-08-06 | number min=-1 max=2147483647 default=-1     | number (-1)         | none beyond current OpenAPI                 | number-only         | high       | enforce integer range; do not inject default |
| bytedance/v1-pro-text-to-video            | input.duration                | optional; numeric-string enum="5","10" default="5"                                                   | DOC-64 @ 2026-08-06 | string enum="5","10" default="5"            | string ("5")        | none beyond current OpenAPI                 | numeric-string-only | high       | retain exact strings; reject numbers         |
| bytedance/v1-pro-text-to-video            | input.seed                    | optional; integer min=-1 max=2147483647                                                              | DOC-64 @ 2026-08-06 | number min=-1 max=2147483647 default=-1     | number (-1)         | none beyond current OpenAPI                 | number-only         | high       | enforce integer range; do not inject default |
| wan/2-7-image-to-video                    | input.duration                | optional; integer min=2 max=15                                                                       | DOC-13 @ 2026-07-31 | integer min=2 max=15 default=5              | absent              | none beyond current OpenAPI                 | number-only         | medium     | retain current behavior                      |
| wan/2-7-image-to-video                    | input.seed                    | optional; integer min=0 max=2147483647                                                               | DOC-13 @ 2026-07-31 | integer min=0 max=2147483647                | absent              | none beyond current OpenAPI                 | number-only         | medium     | retain current behavior                      |
| wan/2-7-text-to-video                     | input.duration                | optional; integer min=2 max=15                                                                       | DOC-14 @ 2026-07-31 | integer min=2 max=15 default=5              | number (5)          | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                      |
| wan/2-7-text-to-video                     | input.seed                    | optional; integer min=0 max=2147483647                                                               | DOC-14 @ 2026-07-31 | integer min=0 max=2147483647                | number (123456)     | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                      |
| wan/2-7-r2v                               | input.duration                | optional; integer min=2 max=10                                                                       | DOC-15 @ 2026-07-31 | integer min=2 max=10 default=5              | number (5)          | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                      |
| wan/2-7-r2v                               | input.seed                    | optional; integer min=0 max=2147483647                                                               | DOC-15 @ 2026-07-31 | integer min=0 max=2147483647                | number (0)          | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                      |
| wan/2-7-videoedit                         | input.duration                | optional; integer min=0 max=10                                                                       | DOC-16 @ 2026-07-31 | integer min=0 max=10 default=0              | number (0)          | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                      |
| wan/2-7-videoedit                         | input.seed                    | optional; integer min=0 max=2147483647                                                               | DOC-16 @ 2026-07-31 | integer min=0 max=2147483647                | number (0)          | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                      |
| wan/2-7-image                             | input.n                       | optional; integer min=1 max=12                                                                       | DOC-17 @ 2026-07-31 | integer                                     | number (4)          | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                      |
| wan/2-7-image                             | input.bbox_list[][][]         | optional; integer                                                                                    | DOC-17 @ 2026-08-03 | integer                                     | absent              | no fractional live observation              | number-only         | medium     | align with published integer contract        |
| wan/2-7-image                             | input.seed                    | optional; integer min=0 max=2147483647                                                               | DOC-17 @ 2026-07-31 | integer min=0 max=2147483647 default=0      | number (0)          | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                      |
| wan/2-7-image-pro                         | input.n                       | optional; integer min=1 max=12                                                                       | DOC-18 @ 2026-07-31 | integer                                     | number (4)          | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                      |
| wan/2-7-image-pro                         | input.bbox_list[][][]         | optional; integer                                                                                    | DOC-18 @ 2026-08-03 | integer                                     | absent              | no fractional live observation              | number-only         | medium     | align with published integer contract        |
| wan/2-7-image-pro                         | input.seed                    | optional; integer min=0 max=2147483647                                                               | DOC-18 @ 2026-07-31 | integer min=0 max=2147483647 default=0      | number (0)          | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                      |
| happyhorse/text-to-video                  | input.duration                | optional; integer min=3 max=15                                                                       | DOC-19 @ 2026-07-31 | integer min=3 max=15 default=5              | number (5)          | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                      |
| happyhorse/text-to-video                  | input.seed                    | optional; integer min=0 max=2147483647                                                               | DOC-19 @ 2026-07-31 | integer min=0 max=2147483647 default=0      | number (1622429582) | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                      |
| happyhorse/image-to-video                 | input.duration                | optional; integer min=3 max=15                                                                       | DOC-20 @ 2026-07-31 | integer min=3 max=15 default=5              | number (5)          | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                      |
| happyhorse/image-to-video                 | input.seed                    | optional; integer min=0 max=2147483647                                                               | DOC-20 @ 2026-07-31 | integer min=0 max=2147483647 default=0      | number (1546095068) | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                      |
| happyhorse/reference-to-video             | input.duration                | optional; integer min=3 max=15                                                                       | DOC-21 @ 2026-07-31 | integer min=3 max=15 default=5              | number (5)          | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                      |
| happyhorse/reference-to-video             | input.seed                    | optional; integer min=0 max=2147483647                                                               | DOC-21 @ 2026-07-31 | integer min=0 max=2147483647 default=0      | number (1308038620) | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                      |
| happyhorse/video-edit                     | input.seed                    | optional; integer min=0 max=2147483647                                                               | DOC-22 @ 2026-07-31 | integer min=0 max=2147483647 default=0      | number (1764574909) | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                      |
| happyhorse-1-1/text-to-video              | input.duration                | optional; integer min=3 max=15 default=5                                                             | DOC-23 @ 2026-07-31 | number multipleOf=1 min=3 max=15 default=5  | number (5)          | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                      |
| happyhorse-1-1/image-to-video             | input.duration                | optional; integer min=3 max=15 default=5                                                             | DOC-24 @ 2026-07-31 | number multipleOf=1 min=3 max=15 default=5  | number (5)          | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                      |
| happyhorse-1-1/reference-to-video         | input.duration                | optional; integer min=3 max=15 default=5                                                             | DOC-25 @ 2026-07-31 | number multipleOf=1 min=3 max=15 default=5  | number (5)          | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                      |
| omnihuman-1-5                             | input.output_resolution       | optional; numeric-string enum="720","1080" default="1080"                                            | DOC-26 @ 2026-07-31 | string default="1080"                       | string ("1080")     | none beyond current OpenAPI                 | numeric-string-only | high       | retain current behavior                      |
| omnihuman-1-5                             | input.seed                    | optional; integer min=-1 default=-1                                                                  | DOC-26 @ 2026-07-31 | integer default=-1                          | number (-1)         | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                      |
| volcengine/video-to-video-lip-sync        | input.templ_start_seconds     | optional; number min=0 default=0                                                                     | DOC-27 @ 2026-07-31 | number default=0                            | number (0)          | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                      |
| gemini-omni-video                         | input.video_list[].start      | optional; number min=0                                                                               | DOC-28 @ 2026-07-31 | number min=0                                | number (0)          | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                      |
| gemini-omni-video                         | input.video_list[].ends       | optional; number min=0                                                                               | DOC-28 @ 2026-07-31 | number min=0                                | number (10)         | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                      |
| gemini-omni-video                         | input.duration                | required; numeric-string enum="4","6","8","10"                                                       | DOC-28 @ 2026-07-31 | string                                      | string ("4")        | none beyond current OpenAPI                 | numeric-string-only | high       | retain current behavior                      |
| gemini-omni-video                         | input.seed                    | optional; integer min=0 max=2147483647                                                               | DOC-28 @ 2026-07-31 | integer                                     | absent              | none beyond current OpenAPI                 | number-only         | medium     | retain current behavior                      |
| elevenlabs/text-to-dialogue-v3            | input.stability               | optional; number enum=0,0.5,1 default=0.5                                                            | DOC-29 @ 2026-08-03 | number default=0.5                          | number (0.5)        | schema aligned to reverified DOC-29         | number-only         | high       | enforce enum/default; preserve caller JSON   |
| elevenlabs/text-to-speech-multilingual-v2 | input.stability               | optional; number min=0 max=1 default=0.5                                                             | DOC-30 @ 2026-08-03 | number min=0 max=1 default=0.5              | number (0.5)        | schema aligned to reverified DOC-30         | number-only         | high       | enforce bounds/default; preserve caller JSON |
| elevenlabs/text-to-speech-multilingual-v2 | input.similarity_boost        | optional; number min=0 max=1 default=0.75                                                            | DOC-30 @ 2026-08-03 | number min=0 max=1 default=0.75             | number (0.75)       | schema aligned to reverified DOC-30         | number-only         | high       | enforce bounds/default; preserve caller JSON |
| elevenlabs/text-to-speech-multilingual-v2 | input.style                   | optional; number min=0 max=1 default=0                                                               | DOC-30 @ 2026-08-03 | number min=0 max=1 default=0                | number (0)          | schema aligned to reverified DOC-30         | number-only         | high       | enforce bounds/default; preserve caller JSON |
| elevenlabs/text-to-speech-multilingual-v2 | input.speed                   | optional; number min=0.7 max=1.2 default=1                                                           | DOC-30 @ 2026-08-03 | number min=0.7 max=1.2 default=1            | number (1)          | schema aligned to reverified DOC-30         | number-only         | high       | enforce bounds/default; preserve caller JSON |
| elevenlabs/text-to-speech-turbo-2-5       | input.stability               | optional; number min=0 max=1 default=0.5                                                             | DOC-31 @ 2026-08-03 | number min=0 max=1 default=0.5              | number (0.5)        | schema aligned to reverified DOC-31         | number-only         | high       | enforce bounds/default; preserve caller JSON |
| elevenlabs/text-to-speech-turbo-2-5       | input.similarity_boost        | optional; number min=0 max=1 default=0.75                                                            | DOC-31 @ 2026-08-03 | number min=0 max=1 default=0.75             | number (0.75)       | schema aligned to reverified DOC-31         | number-only         | high       | enforce bounds/default; preserve caller JSON |
| elevenlabs/text-to-speech-turbo-2-5       | input.style                   | optional; number min=0 max=1 default=0                                                               | DOC-31 @ 2026-08-03 | number min=0 max=1 default=0                | number (0)          | schema aligned to reverified DOC-31         | number-only         | high       | enforce bounds/default; preserve caller JSON |
| elevenlabs/text-to-speech-turbo-2-5       | input.speed                   | optional; number min=0.7 max=1.2 default=1                                                           | DOC-31 @ 2026-08-03 | number min=0.7 max=1.2 default=1            | number (1)          | schema aligned to reverified DOC-31         | number-only         | high       | enforce bounds/default; preserve caller JSON |
| elevenlabs/sound-effect-v2                | input.prompt_influence        | optional; number                                                                                     | NONE @ 2026-07-31   | unknown                                     | absent              | no current indexed model page               | unknown             | low        | retain; evidence unavailable                 |
| pixverse-v6/text-to-video                 | input.duration                | required; integer min=1 max=15                                                                       | DOC-33 @ 2026-07-31 | integer min=1 max=15 default=5              | number (5)          | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                      |
| pixverse-v6/text-to-video                 | input.seed                    | optional; integer min=0 max=2147483647                                                               | DOC-33 @ 2026-07-31 | integer min=0 max=2147483647                | number (123456789)  | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                      |
| pixverse-v6/image-to-video                | input.duration                | optional; integer min=1 max=15                                                                       | DOC-34 @ 2026-07-31 | integer min=1 max=15 default=5              | number (5)          | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                      |
| pixverse-v6/image-to-video                | input.seed                    | optional; integer min=0 max=2147483647                                                               | DOC-34 @ 2026-07-31 | integer min=0 max=2147483647                | number (123456)     | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                      |
| pixverse-v6/transition                    | input.duration                | required; integer min=1 max=15                                                                       | DOC-35 @ 2026-07-31 | integer min=1 max=15 default=5              | number (5)          | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                      |
| pixverse-v6/transition                    | input.seed                    | optional; integer min=0 max=2147483647                                                               | DOC-35 @ 2026-07-31 | integer min=0 max=2147483647                | number (123456789)  | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                      |
| pixverse-v6/extend                        | input.duration                | required; integer min=1 max=15                                                                       | DOC-36 @ 2026-07-31 | integer min=1 max=15                        | number (5)          | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                      |
| pixverse-v6/extend                        | input.seed                    | optional; integer min=0 max=2147483647                                                               | DOC-36 @ 2026-07-31 | integer min=0 max=2147483647                | number (123456)     | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                      |
| pixverse-v6/reference-to-video            | input.duration                | required; integer min=1 max=15                                                                       | DOC-37 @ 2026-07-31 | integer min=1 max=15 default=5              | number (5)          | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                      |
| pixverse-v6/reference-to-video            | input.seed                    | optional; integer min=0 max=2147483647                                                               | DOC-37 @ 2026-07-31 | integer min=0 max=2147483647                | number (123456789)  | none beyond current OpenAPI                 | number-only         | high       | retain current behavior                      |
| minimax-h3/text-to-video                  | input.duration                | required; integer min=4 max=15                                                                       | DOC-38 @ 2026-08-04 | integer min=4 max=15 default=6              | number (6)          | none beyond current OpenAPI                 | number-only         | high       | enforce integer range; do not inject default |
| minimax-h3/image-to-video                 | input.duration                | required; integer min=4 max=15                                                                       | DOC-39 @ 2026-08-04 | integer min=4 max=15 default=6              | number (6)          | none beyond current OpenAPI                 | number-only         | high       | enforce integer range; do not inject default |
| minimax-h3/reference-to-video             | input.duration                | required; integer min=4 max=15                                                                       | DOC-40 @ 2026-08-04 | integer min=4 max=15 default=6              | number (6)          | none beyond current OpenAPI                 | number-only         | high       | enforce integer range; do not inject default |
| google/gemini-2-5-pro-tts                 | input.temperature             | optional; number min=0 max=2                                                                         | DOC-41 @ 2026-08-06 | number min=0 max=2 default=1                | number (1)          | none beyond current OpenAPI                 | number-only         | high       | enforce bounds; do not inject default        |
| google/gemini-3-1-flash-tts               | input.temperature             | optional; number min=0 max=2                                                                         | DOC-42 @ 2026-08-06 | number min=0 max=2 default=1                | number (1)          | none beyond current OpenAPI                 | number-only         | high       | enforce bounds; do not inject default        |
| google/imagen4-fast                       | input.seed                    | optional; integer                                                                                    | DOC-56 @ 2026-08-06 | integer                                     | absent              | none beyond current OpenAPI                 | number-only         | medium     | retain integer seed; reject strings          |
| topaz/image-upscale                       | input.upscale_factor          | required; numeric-string enum="1","2","4"                                                            | DOC-43 @ 2026-08-06 | string default="2"                          | string ("2")        | none beyond current OpenAPI                 | numeric-string-only | high       | retain exact strings; reject numbers         |
| topaz/video-upscale                       | input.upscale_factor          | optional; numeric-string enum="1","2","4"                                                            | DOC-44 @ 2026-08-06 | string default="2"                          | string ("2")        | none beyond current OpenAPI                 | numeric-string-only | high       | retain exact strings; reject numbers         |
| qwen/text-to-image                        | input.num_inference_steps     | optional; number min=2 max=250 default=30                                                            | DOC-45 @ 2026-08-06 | number min=2 max=250 default=30             | number (30)         | none beyond current OpenAPI                 | number-only         | high       | enforce bounds; default matches OpenAPI      |
| qwen/text-to-image                        | input.seed                    | optional; integer                                                                                    | DOC-45 @ 2026-08-06 | integer                                     | absent              | none beyond current OpenAPI                 | number-only         | medium     | retain integer seed; reject strings          |
| qwen/text-to-image                        | input.guidance_scale          | optional; number min=0 max=20 default=2.5                                                            | DOC-45 @ 2026-08-06 | number min=0 max=20 default=2.5             | number (2.5)        | none beyond current OpenAPI                 | number-only         | high       | enforce bounds; default matches OpenAPI      |
| qwen/image-edit                           | input.num_inference_steps     | optional; number min=2 max=49 default=25                                                             | DOC-46 @ 2026-08-06 | number min=2 max=49 default=25              | number (25)         | none beyond current OpenAPI                 | number-only         | high       | enforce bounds; default matches OpenAPI      |
| qwen/image-edit                           | input.seed                    | optional; integer                                                                                    | DOC-46 @ 2026-08-06 | integer                                     | absent              | none beyond current OpenAPI                 | number-only         | medium     | retain integer seed; reject strings          |
| qwen/image-edit                           | input.guidance_scale          | optional; number min=0 max=20 default=4                                                              | DOC-46 @ 2026-08-06 | number min=0 max=20 default=4               | number (4)          | none beyond current OpenAPI                 | number-only         | high       | enforce bounds; default matches OpenAPI      |
| qwen/image-edit                           | input.num_images              | optional; numeric-string enum="1","2","3","4"                                                        | DOC-46 @ 2026-08-06 | string enum="1","2","3","4"                 | absent              | none beyond current OpenAPI                 | numeric-string-only | high       | retain exact strings; reject numbers         |
| qwen/image-to-image                       | input.strength                | optional; number min=0 max=1 default=0.8                                                             | DOC-47 @ 2026-08-06 | number min=0 max=1 default=0.8              | number (0.8)        | none beyond current OpenAPI                 | number-only         | high       | enforce bounds; default matches OpenAPI      |
| qwen/image-to-image                       | input.seed                    | optional; integer                                                                                    | DOC-47 @ 2026-08-06 | integer                                     | absent              | none beyond current OpenAPI                 | number-only         | medium     | retain integer seed; reject strings          |
| qwen/image-to-image                       | input.num_inference_steps     | optional; number min=2 max=250 default=30                                                            | DOC-47 @ 2026-08-06 | number min=2 max=250 default=30             | number (30)         | none beyond current OpenAPI                 | number-only         | high       | enforce bounds; default matches OpenAPI      |
| qwen/image-to-image                       | input.guidance_scale          | optional; number min=0 max=20 default=2.5                                                            | DOC-47 @ 2026-08-06 | number min=0 max=20 default=2.5             | number (2.5)        | none beyond current OpenAPI                 | number-only         | high       | enforce bounds; default matches OpenAPI      |
| infinitalk/from-audio                     | input.seed                    | optional; integer min=10000 max=1000000                                                              | DOC-48 @ 2026-08-06 | number                                      | absent              | none beyond current OpenAPI                 | number-only         | high       | enforce integer range; do not inject default |
| ideogram/v3-text-to-image                 | input.seed                    | optional; integer                                                                                    | DOC-50 @ 2026-08-06 | integer                                     | number (123456)     | none beyond current OpenAPI                 | number-only         | high       | retain integer seed; reject strings          |
| ideogram/v3-edit                          | input.seed                    | optional; integer                                                                                    | DOC-51 @ 2026-08-06 | integer                                     | number (123456)     | none beyond current OpenAPI                 | number-only         | high       | retain integer seed; reject strings          |
| ideogram/v3-remix                         | input.num_images              | optional; numeric-string enum="1","2","3","4"                                                        | DOC-52 @ 2026-08-06 | string enum="1","2","3","4"                 | string ("1")        | none beyond current OpenAPI                 | numeric-string-only | high       | retain exact strings; reject numbers         |
| ideogram/v3-remix                         | input.seed                    | optional; integer                                                                                    | DOC-52 @ 2026-08-06 | integer                                     | number (123456)     | none beyond current OpenAPI                 | number-only         | high       | retain integer seed; reject strings          |
| ideogram/v3-remix                         | input.strength                | optional; number min=0.01 max=1                                                                      | DOC-52 @ 2026-08-06 | number min=0.01 max=1                       | number (0.8)        | none beyond current OpenAPI                 | number-only         | high       | enforce bounds; do not inject default        |
| ideogram/character                        | input.num_images              | optional; numeric-string enum="1","2","3","4"                                                        | DOC-53 @ 2026-08-06 | string enum="1","2","3","4" default="1"     | string ("1")        | none beyond current OpenAPI                 | numeric-string-only | high       | retain exact strings; reject numbers         |
| ideogram/character                        | input.seed                    | optional; integer                                                                                    | DOC-53 @ 2026-08-06 | integer                                     | absent              | none beyond current OpenAPI                 | number-only         | medium     | retain integer seed; reject strings          |
| ideogram/character-edit                   | input.num_images              | optional; numeric-string enum="1","2","3","4"                                                        | DOC-54 @ 2026-08-06 | string enum="1","2","3","4" default="1"     | string ("1")        | none beyond current OpenAPI                 | numeric-string-only | high       | retain exact strings; reject numbers         |
| ideogram/character-edit                   | input.seed                    | optional; integer                                                                                    | DOC-54 @ 2026-08-06 | integer                                     | absent              | none beyond current OpenAPI                 | number-only         | medium     | retain integer seed; reject strings          |
| ideogram/character-remix                  | input.num_images              | optional; numeric-string enum="1","2","3","4"                                                        | DOC-55 @ 2026-08-06 | string enum="1","2","3","4" default="1"     | string ("1")        | none beyond current OpenAPI                 | numeric-string-only | high       | retain exact strings; reject numbers         |
| ideogram/character-remix                  | input.seed                    | optional; integer                                                                                    | DOC-55 @ 2026-08-06 | integer                                     | absent              | none beyond current OpenAPI                 | number-only         | medium     | retain integer seed; reject strings          |
| ideogram/character-remix                  | input.strength                | optional; number min=0.1 max=1                                                                       | DOC-55 @ 2026-08-06 | number min=0.1 max=1 default=0.8            | number (0.8)        | none beyond current OpenAPI                 | number-only         | high       | enforce bounds; do not inject default        |

<!-- numeric-inventory:end -->
