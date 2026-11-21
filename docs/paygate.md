# Paid endpoints (OTP pay gate)

A paid endpoint works out of the box, and an operator can gate it. This is the
walkthrough. The spec, the shared OTP format and the rate tables live in
[@apicity/cost](../packages/provider/cost/README.md#paid-endpoint-guard-otp-pay-gate).

## Example

Built without a pay-gate secret, a provider dispatches paid calls like any
other. Built with one, every paid call needs an approved OTP bound to that
exact endpoint and request (single-use within one process, or across processes
when backed by a shared `ReplayStore`), and an autonomous caller cannot bypass
it.

```ts
import { createKie, type MediaGenerationRequest } from "@apicity/kie";
import { mintOtp, createCost } from "@apicity/cost";

declare function loadSecret(): string; // your secret manager / config

// Same JSON body you'd POST to /api/v1/jobs/createTask.
const payload = {
  model: "gpt-image-2-text-to-image",
  input: {
    prompt: "A cinematic night-city poster with neon reflections.",
    aspect_ratio: "16:9",
    resolution: "4K",
  },
} satisfies MediaGenerationRequest;

// Pure local cost preview — no keys, no network, sync.
const estimate = createCost().estimate({ provider: "kie", payload });
// estimate.usd === 0.08

// No pay-gate secret → the gate is off. The paid call dispatches (and bills).
const kie = createKie({ apiKey: process.env.KIE_API_KEY! });
await kie.post.api.v1.jobs.createTask(payload);
// ✅ { code: 200, msg: "success", data: { taskId: "…" } }

// Arm the gate: the code client holds the secret (from your secret manager /
// config). The autonomous caller never sees it, so it can't self-approve.
const secret = loadSecret();
const gated = createKie({
  apiKey: process.env.KIE_API_KEY!,
  paygate: { secret },
});

// Armed, no OTP → fails closed. No bypass.
await gated.post.api.v1.jobs.createTask(payload);
// ❌ throws PayGateError { code: "otp-missing" }

// A human (or the code client) mints a single-use OTP bound to THIS request.
const otp = mintOtp(secret, {
  dotPath: "api.v1.jobs.createTask",
  request: payload,
  ttl: "10m",
});

// Approved — runs once. Replaying the OTP, or changing any byte of the
// payload, fails verification.
const task = await gated.post.api.v1.jobs.createTask(payload, { otp });
```

Direct KIE VEO calls are gated separately from `createTask`: for
`kie.veo.post.api.v1.veo.generate` mint with `dotPath: "api.v1.veo.generate"`,
for `kie.veo.post.api.v1.veo.extend` use `dotPath: "api.v1.veo.extend"`.
Non-billing endpoints (`gate: "none"`, such as status polls and free helpers)
stay ungated. Billed endpoints outside `PAID_ENDPOINTS` (`gate: "cli"`) have no
SDK gate when called directly from a provider package, and are gated by the
`apicity` CLI once armed.

## Rules

Endpoints with direct marginal cost (e.g. `kie.post.api.v1.jobs.createTask`,
direct VEO calls under `kie.veo.post.api.v1.veo.*`, and xai's image and video
generation) are listed in `PAID_ENDPOINTS`. The pay gate in front of them is
**opt-in**:

- **Off by default.** A provider built without `paygate` dispatches a paid
  call like any other call: it goes upstream, and it bills.
- **Armed by a secret.** `paygate: { secret }` at provider construction arms
  it; in the CLI, `--paygate-secret-file` or `APICITY_PAYGATE_SECRET_FILE`
  does. Once armed, the gate is **fail-closed**: every gated call needs a valid
  OTP minted from that same secret, bound to the exact endpoint and request
  until it expires (default `10m`, or `--ttl` with no upper limit; single-use
  within one process), and a missing or bad one fails closed before anything is
  sent. The flow is the [example above](#example). The autonomous caller never
  sees the secret, so it cannot self-approve. A supplied but empty secret fails
  closed too, with `paygate-not-configured`.
- **An OTP needs an armed gate.** An OTP passed to a provider or CLI host
  without a pay-gate secret is refused with `paygate-not-configured`, never
  silently dropped: whoever passes one believes a gate exists.

Armed or not, `paid: true` in `apicity describe` (and the `paid` column of
`apicity commands`) is the cue to say that a call bills before making it.
`paid` follows each endpoint's reviewed billing record (`billing`), plus the
`PAID_ENDPOINTS` registry, and in the CLI `gated` equals `paid` on every row
(611 of 1,950). Unbilled rows (`free`, `followup`, and `subscription` outside
the registry — 1,339 rows) stay ungated (`gate: "none"`). Five unpriced upload
rows (`x v2.media.upload` and `machgen api.v0.upload`) remain gated because
their billing records are `unpriced`, so the gate fails closed when a call may
bill.

## The CLI gate vs. the SDK gate

Discovery exposes a `gate` field (`"sdk"`, `"cli"`, or `"none"`) showing which
gate applies when a host is armed:

- **`gate: "sdk"`** (the 27 rows in `PAID_ENDPOINTS` across `kie` and `xai`):
  the provider package enforces the gate itself through `withPaidGate`, so both
  CLI calls and direct SDK calls require an OTP.
- **`gate: "cli"`** (all other 584 paid rows across billed kinds `metered`,
  `accrual`, and `unpriced`): the CLI enforces the gate through `dispatchGated`
  immediately before invoking the provider function, keeping provider function
  signatures unchanged (`direct SDK` calls outside the CLI stay unaffected).
- **`gate: "none"`** (1,339 unbilled rows): not gated on any host.

What an OTP binds (one provider, method, `dotPath`, and request):

- On `"sdk"` rows and `"cli"` rows without URL path parameters, the hashed
  request is the JSON request body with any `--<field>` flags merged in.
- On `"cli"` rows with URL path parameters (`pathParams`), the hashed request is
  `{ "path": { <param>: <value> }, "body": <request> }`, keyed by `pathParams`
  so distinct target IDs cannot share a token.

Every pay-gate refusal prints a complete mint command and includes
`meta.requestHash` on the error envelope:

```bash
apicity-paygate otp mint \
  --secret-file ./paygate.secret \
  --provider elevenlabs \
  --method POST \
  --dot-path v1.textToSpeech \
  --request-hash sha256:<hex>
```

`--payload-file <path>` continues to work for registry rows and any row whose
request is a single JSON object with no path parameters. To verify what a
`requestHash` covers before minting, run the caller's exact command without
`--otp`: the CLI refuses with `otp-missing`, prints the exact same `requestHash`
in `hint` and `meta.requestHash`, and sends nothing upstream.

One OTP covers one provider, method, and `dotPath`, one exact request, valid
until expiration (`10m` by default or `--ttl <duration>` with no upper limit),
and single-use within one process.

The OTP is signed with a single shared **HMAC secret** — no key files, no
environment variables, no cost coupling — and commits to the exact
`(provider, method, dotPath, requestHash, exp)` tuple: change any byte of the
request or any path parameter and verification fails. Inside one provider or
`dispatchGated` replay store, the `jti` is consumed before dispatch, so a
failed network call still burns the token there — mint a fresh OTP for any
retry.

Operators (or the code client) mint OTPs with `mintOtp(secret, { provider,
method, dotPath, requestHash, ttl })`, `mintOtp(secret, { dotPath, request,
ttl })`, or the CLI — the secret is read from a file, never an env var. Because
`apicity-paygate` ships with `@apicity/cost` (installing `@apicity/cli` globally
does not put it directly on `PATH`), install `@apicity/cost` globally (`npm install -g @apicity/cost`)
or run `npx -p @apicity/cost apicity-paygate`:

```bash
apicity-paygate otp mint \
  --secret-file ./paygate.secret \
  --provider kie \
  --method POST \
  --dot-path api.v1.jobs.createTask \
  --request-hash sha256:<hex> \
  --ttl 10m
```

## Grants

For **`gate: "cli"`** endpoints (584 rows across 17 billed providers), an
operator can alternatively mint a time-boxed **provider grant** once per
provider instead of minting an OTP per request. The 27 **`gate: "sdk"`**
registry endpoints (`kie` and `xai`) never accept a grant and still require a
per-request OTP checked by the provider package.

```bash
apicity-paygate grant mint \
  --secret-file ./paygate.secret \
  --provider fal \
  --ttl 4h

apicity-paygate grant list --secret-file ./paygate.secret
apicity-paygate grant revoke --provider fal
```

How grants work:

- **What a grant covers (and ignores).** A grant token is signed with the
  shared secret, one provider name, and an expiry (`1h` default, `24h` max;
  up to 5 minutes ahead of clock skew allowed; valid through its `exp` second).
  It is **not** bound to a method, `dotPath`, request, host, lane, session, or
  process, and it is **reusable** across calls and processes until it expires.
  No host without a secret reads the grant directory.
- **Stored on disk, never passed on the command line.** `grant mint` writes
  `<grant dir>/<provider>.grant` (`0600`) in `<grant dir>` (`0700`) and prints
  the grant `id`, `expires`, and `path` — never the token. There is no CLI flag
  or environment variable that carries a grant token.
- **Directory resolution.** Both `apicity-paygate` and `@apicity/cli` resolve
  the grant directory from `$APICITY_PAYGATE_GRANT_DIR`, defaulting to
  `~/.config/apicity/paygate-grants`. Because `@apicity/cli` also reads
  `APICITY_PAYGATE_GRANT_DIR` from its `.env` / `--env-file` while
  `apicity-paygate` does not, a grant-directory line in the CLI's env file moves
  the directory for the CLI only — which is why refusal hints include
  `--grant-dir <dir>`.
- **Per OS user, not per lane.** Any process running as that OS user that reads
  the same grant directory can use the grant (an operator can point one lane at
  its own `APICITY_PAYGATE_GRANT_DIR`, though same-user OS isolation still
  applies: since the CLI must read both the secret file and the grant file, any
  process running as the same OS user technically has OS file access unless rules
  forbid it). Keep the grant directory out of repositories and synced/shared
  folders, and move grants as files rather than pasted text.
- **Explicit `--otp` wins alone.** If a caller passes `--otp`, only that OTP is
  verified — even if a valid grant exists, a bad OTP still refuses without
  touching or recording against the grant.
- **Audit trail (`uses.jsonl`).** Every `gate: "cli"` call approved under a
  grant appends one JSON line to `<grant dir>/uses.jsonl` (`0600`) **before**
  dispatching (`ts`, `grant`, `provider`, `method`, `dotPath`, `requestHash`,
  `expires`, `cwd` — no token or request body). If writing fails, the call is
  refused with `grant-unrecorded` before reaching the provider.
- **Revocation.** `apicity-paygate grant revoke --provider <p>` deletes
  `<grant dir>/<p>.grant`. Copies kept elsewhere remain valid until their expiry
  (`24h` max); rotating the pay-gate secret is the hard stop that voids every
  existing grant and OTP immediately.

A blocked call raises `PayGateError` (or `GrantRefusal` in `@apicity/cli`) whose
`.code` is one of `paygate-not-configured`, `otp-missing`, `otp-malformed`,
`otp-invalid-signature`, `otp-expired`, `otp-mismatched-request`,
`otp-replayed`, `grant-malformed`, `grant-invalid-signature`,
`grant-not-yet-valid`, `grant-expired`, `grant-mismatched-provider`,
`grant-unreadable`, or `grant-unrecorded`.

The SDK gate covers every entry listed in `PAID_ENDPOINTS` (`kie` and `xai`),
while `@apicity/cli` automatically gates every other endpoint whose billing
record bills (`endpointBilling`). On a host whose operator armed the gate, pass
`apicity … --otp <token>`.
