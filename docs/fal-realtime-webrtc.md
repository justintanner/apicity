# fal realtime WebRTC transport

Design spike for `ac-4na3id`. It does not add a provider leaf, a
recording, or a dependency. No call was made while writing it, and
this note stores no SDP offer and no ICE credential.

The operator answered ask `ac-8ovct6` with `webrtc-spike` on
2026-10-07. Folded bead `ac-xumi5y` stays blocked: `minimax/h3-max/director`
ships no leaf until a later bead implements the recommendation below.

## 1. How a realtime fal endpoint is shaped

The captured model page for `minimax/h3-max/director` (fetched
2026-10-07, `plans/ac-yjml5s/build/evidence/requirements/director-realtime-contract.json`)
documents one HTTP path, `POST /start-session`. The queue OpenAPI for
that id returned HTTP 404 on 2026-10-05 and again on 2026-10-07, and
the pricing read returned `not_found`. The page OpenAPI is the
contract.

`POST /start-session` carries `x-fal-realtime`:

- `schemaVersion`: 1
- `transport.protocol`: `webrtc`
- `transport.version`: 1
- `transport.sessionProtocol`: `wma`
- `asyncapi.url`: `./asyncapi.json`

The JSON body is `StartSessionRequest`. `sdp` is required. `type` is
the const `offer` and defaults to `offer`. `session_id`, `ice_status`,
and `credential_age_seconds` (number, minimum 0) are nullable.
`ice_servers` is an array of objects. The description calls the body
an offer forwarded by the WMA bridge. Optional headers are
`x-fal-caller-user-id` and `x-fal-request-id`.

The documented 200 schema is an empty object. The live answer is not
empty: it carries the session's ICE credentials. Those credentials
are a secret. A 422 returns `HTTPValidationError`.

After the HTTP answer, video is a WebRTC stream, not an HTTP body.
Polly records HTTP only. A "successful generation" cannot be replayed
from a HAR. The repository has no WebRTC dependency.

Billing, from the same page:

- Promotional card text: $0.048 per second of video, 40% off, ending
  2026-10-15, then $0.08 per second. 1080p is twice the standard rate.
  Each session is billed for at least 60 seconds.
- A second string on the same page says the promotional price expires
  on 14 September and that the default session runs up to 15 minutes.
- `minimumUnits` on the capture is 60.

The two expiry sentences disagree. The spike does not pick a promo
rate to encode. Section 4 uses the list rate.

### Sibling catalog entries

The requirements capture and `plans/ac-cc4voo/audit/fal-openapi/`
contain `x-fal-realtime` on `minimax/h3-max/director` only. No sibling
id in that evidence shares the marker. A follow-up bead has to scan
the live catalog before a second leaf is named. `minimax/h3-max/styles/*`
is out of this spike; it is not this transport.

## 2. Options

**(a) HTTP-only `start-session` leaf.** Types, Zod metadata, and
per-second cost metadata for `POST /start-session`. The leaf returns
the JSON answer and stops. Media, ICE gathering, and the WMA stream
stay in the caller's own WebRTC stack. The fixture is hand-written.
The response fields that hold session credentials are redacted in
that fixture and are not typed as something a test asserts by value.

**(b) WebRTC client in a separate package.** A new package would own
the peer connection, the offer, and the stream. It needs a WebRTC
implementation that runs under Node, a way to test it without a paid
60-second session, and a rule that keeps ICE secrets out of git.
Polly still cannot replay the media. The package would be the first
provider-adjacent dependency that is not `zod` or `viem`.

**(c) Declare realtime endpoints unsupported.** Document the rule in
`CLAUDE.md` and teach `lint:endpoints` to ignore, or reject, a factory
leaf whose upstream path is `/start-session` or whose OpenAPI carries
`x-fal-realtime`. No leaf, no fixture, no cost entry.

**Recommendation: (a), with (c) remaining in force until that leaf
lands.** (a) matches the way every other fal leaf works: one HTTP
call, Zod metadata, no runtime validation, cost metadata, and a
replayable fixture. The caller who already has a WebRTC stack can
exchange the offer. (b) takes on a media stack this repository's
record/replay loop cannot see. (c) is the right rule for the director
item in the current epic, and it should stay the rule for any id the
catalog scan has not classified. It is not the long-term shape,
because the HTTP handshake itself is an ordinary POST.

## 3. Testing and credential policy

For the recommended leaf:

- Do not record a live `start-session`. A real offer needs a WebRTC
  stack, the call bills at least 60 seconds, and the answer contains
  ICE credentials.
- Commit a hand-written HAR, or a hand-written JSON fixture the test
  loads, whose response body has the credential-bearing fields
  replaced with a fixed redaction such as `***`. The fixture contains
  no live `sdp` answer and no live `ice_servers` entry. The request
  fixture uses a short fake offer string, not a captured one.
- The integration test injects `fetch` or replays only that
  hand-written fixture. It does not call `dev:record`.
- `lint:recordings` gains a check: any HAR whose URL path ends in
  `/start-session`, or whose request or response mentions
  `ice_servers` or `iceServers` with a non-redacted value, fails.
  Redaction is the same `***` the fal auth header already uses.
  A unit test pins both the reject and the allow cases.
- The leaf's call site uses `process.env.FAL_API_KEY` when a live
  call is ever added. This spike does not add that call.
- Logs and error messages must not print the response body of a
  start-session answer.

## 4. Cost metadata

The billed quantity is session runtime in seconds, which the request
does not contain. `sdp` does not encode duration. The only figure the
request can bound is the published minimum.

The follow-up leaf encodes the post-promotion list rate, because the
page's two promo-expiry sentences disagree and the later date is
2026-10-15:

- Standard: $0.08 per second, minimum 60 seconds, so an omitted
  duration estimates $4.80.
- 1080p: $0.16 per second, the same 60-second minimum, $9.60.
- `costHints.durationSeconds`, when it is a finite number greater
  than 60, replaces the minimum. A hint at or below 60 still
  estimates the minimum.
- A resolution the card does not price, and a hint that is not a
  finite number, select no rate and the estimate warns.
- There is no dynamic-pricing entry beside that static minimum. The
  leaf does not invent a promo rate of $0.048.

That is the same shape as other fal estimates that know a floor and
not the final meter: the number is the minimum the card publishes,
and a longer session costs more than the estimate.

## 5. Follow-up beads

1. **Add an HTTP-only fal start-session leaf for minimax/h3-max/director.**
   Acceptance: one POST leaf at the page path, Zod metadata and no
   runtime validation, response type from the documented empty 200
   plus a documented redacted credential slot, cost metadata as in
   section 4, a hand-written fixture with no live ICE secret, replay
   with no network, and no WebRTC client. `dev:preflight:fast -- fal`
   exits 0. No `package.json` dependency is added.

2. **Reject start-session recordings that store ICE credentials.**
   Acceptance: `lint:recordings` fails a HAR that carries a
   non-redacted `ice_servers` value on a `/start-session` exchange,
   and a unit test covers the reject and the `***` allow case.

3. **Scan the fal catalog for other `x-fal-realtime` endpoints.**
   Acceptance: a note listing every current catalog id whose OpenAPI
   or model page carries `x-fal-realtime`, each with transport and
   session protocol. No leaf is added in that bead. An id that does
   not use `webrtc` / `wma` gets its own spike instead of reusing
   this recommendation unchanged.
