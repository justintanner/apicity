# Paid endpoints (OTP pay gate)

A paid endpoint works out of the box, and an operator can gate it. This is the
walkthrough. The spec, the shared OTP format and the rate tables live in
[@apicity/cost](../packages/provider/cost/README.md#paid-endpoint-guard-otp-pay-gate).

## Example

Built without a pay-gate secret, a provider dispatches paid calls like any
other. Built with one, every paid call needs an approved, single-use OTP, and
an autonomous caller cannot bypass it.

```ts
import { createKie } from "@apicity/kie";
import { mintOtp, createCost } from "@apicity/cost";

// Same JSON body you'd POST to /api/v1/jobs/createTask.
const payload = {
  model: "gpt-image-2-text-to-image",
  input: {
    prompt: "A cinematic night-city poster with neon reflections.",
    aspect_ratio: "16:9",
    resolution: "4K",
  },
};

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
Upload, status, and helper endpoints are unlisted and remain free.

## Rules

Endpoints with direct marginal cost (e.g. `kie.post.api.v1.jobs.createTask`,
direct VEO calls under `kie.veo.post.api.v1.veo.*`, and xai's image and video
generation) are listed in `PAID_ENDPOINTS`. The pay gate in front of them is
**opt-in**:

- **Off by default.** A provider built without `paygate` dispatches a paid
  call like any other call: it goes upstream, and it bills.
- **Armed by a secret.** `paygate: { secret }` at provider construction arms
  it; in the CLI, `--paygate-secret-file` or `APICITY_PAYGATE_SECRET_FILE`
  does. Once armed, the gate is **fail-closed**: every paid call needs a valid
  OTP minted from that same secret, single-use and bound to the exact request,
  and a missing or bad one throws before anything is sent. The flow is the
  [example above](#example). The autonomous caller never sees the secret, so
  it cannot self-approve. A supplied but empty secret fails closed too, with
  `paygate-not-configured`.
- **An OTP needs an armed gate.** An OTP passed to a provider built without
  `paygate` is refused with `paygate-not-configured`, never silently dropped:
  whoever passes one believes a gate exists.

Armed or not, `paid: true` in `apicity describe` (and the `paid` column of
`apicity commands`) is the cue to say that a call bills before making it.
Unlisted endpoints are free.

The OTP is signed with a single shared **HMAC secret** — no key files, no
environment variables, no cost coupling — and commits to the exact
`(provider, method, dotPath, requestHash, exp)` tuple: change any byte of the
payload and verification fails. The `jti` is consumed before dispatch, so a
failed network call still burns the token — mint a fresh OTP for any retry.

Operators (or the code client) mint OTPs with `mintOtp(secret, { dotPath,
request, ttl })` or the CLI — the secret is read from a file, never an env
var:

```bash
apicity-paygate otp mint \
  --secret-file ./paygate.secret \
  --dot-path api.v1.jobs.createTask \
  --payload-file request.json \
  --ttl 10m
```

A blocked call throws `PayGateError` whose `.code` is one of
`paygate-not-configured`, `otp-missing`, `otp-malformed`,
`otp-invalid-signature`, `otp-expired`, `otp-mismatched-request`, or
`otp-replayed`.

The gate is generic: a provider joins it by adding `PAID_ENDPOINTS` entries,
as `kie` and `xai` do. On a host whose operator armed the gate, pass
`apicity … --otp <token>`.
