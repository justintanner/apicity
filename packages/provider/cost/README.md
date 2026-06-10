# @apicity/cost

Cross-provider cost & token estimation for the
[apicity](https://github.com/justintanner/apicity) monorepo: a USD figure for a
planned API call to the billed providers (openai, anthropic, xai, kimicoding,
fireworks, alibaba, kie, elevenlabs — see [Coverage](#coverage)), computed
purely locally from bundled rate tables — no keys, no network.

Zero dependencies, and not a wrapper for any single upstream API — a deliberate
cross-provider helper. Other workspace packages depend on _it_: `@apicity/kie`
and `@apicity/xai` use its `withPaidGate` to gate paid endpoints.

## Install

```bash
npm install @apicity/cost
# or
pnpm add @apicity/cost
```

## Usage

`c.estimate(req)` takes the **exact JSON body you would POST upstream** and
lightly parses out the price-affecting fields (model, resolution, duration,
message contents, etc.) — the object you build for the real call doubles as
the estimate input.

```ts
import { createCost } from "@apicity/cost";

const c = createCost(); // no options, no keys — pure local math

// openai chat — same body you'd POST to /v1/chat/completions
const a = c.estimate({
  provider: "openai",
  payload: {
    model: "gpt-5",
    messages: [{ role: "user", content: "Estimate this prompt's cost." }],
    max_tokens: 1000,
  },
});
// → { usd: 0.01..., source: "tokens-heuristic+table", breakdown: { inputTokens: 8, outputTokens: 1000, ... } }

// kie — same body you'd POST to /api/v1/jobs/createTask
const k = c.estimate({
  provider: "kie",
  payload: {
    model: "bytedance/seedance-2",
    input: {
      prompt: "...",
      first_frame_url: "https://...",
      resolution: "720p",
      duration: 8,
      web_search: false,
    },
  },
});
// rate entry reads model + input.resolution + first_frame_url presence (i2v)
// + input.duration → seedance-2-720p-i2v rate × 8 seconds

// kie endpoints whose pricing isn't keyed by payload.model (e.g. Suno) take
// an explicit `endpoint` discriminator that wins the pricing lookup
const s = c.estimate({
  provider: "kie",
  endpoint: "suno/generate",
  payload: { model: "V5_5", prompt: "..." },
});

// elevenlabs TTS — payload is the /v1/text-to-speech body
const e = c.estimate({
  provider: "elevenlabs",
  payload: { model_id: "eleven_flash_v2_5", text: "Hello world" },
});

// free → always $0
const z = c.estimate({ provider: "free-media-upload" });
```

`estimate()` is synchronous — nothing to await.

## Return shape

```ts
interface CostEstimate {
  usd: number;
  currency: "USD";
  source:
    | "tokens-heuristic+table" // openai/anthropic/xai/kimicoding/fireworks/alibaba — chars/4 ≈ tokens × bundled rate
    | "per-unit-table" // elevenlabs/kie — payload-derived units × bundled rate
    | "free";
  breakdown: {
    inputTokens?: number;
    outputTokens?: number;
    units?: number;
    unit?:
      | "tokens"
      | "characters"
      | "seconds"
      | "images"
      | "songs"
      | "generations";
    inputUsdPerMillion?: number;
    outputUsdPerMillion?: number;
    perUnitUsd?: number;
  };
  rateAsOf: string | null; // YYYY-MM-DD — the rate entry's as-of date, falling back to PRICING_AS_OF
  warnings: string[]; // non-empty when fallback fired (unknown model, missing max_tokens, missing duration, etc.)
}
```

`source` is the load-bearing field: `per-unit-table` is exact when the bundled
rate is current; `tokens-heuristic+table` (chars/4 ≈ tokens) is rougher —
treat it as ±20%. Nothing calls upstream.

## How payloads are parsed

Each provider has a small extractor in `src/extract/` that pulls the fields
the rate table discriminates on. Unrecognized payloads return `usd: 0` plus a
warning instead of throwing — a missing `input.resolution` on a kie seedance
payload, or a model not in the bundled table, yields a diagnosable
`CostEstimate`, never an exception.

Text providers (openai / anthropic / xai / kimicoding / fireworks / alibaba):
the extractor flattens the chat `messages` array (or `input` / `prompt` /
`text`) into one string for token counting; non-text content parts (images,
audio, tool calls) are dropped.

Per-unit providers (kie / elevenlabs): payload-shape knowledge lives in each
rate entry's closures in `src/pricing/kie.ts` / `src/pricing/elevenlabs.ts` —
`units(payload)` derives the billable quantity (seconds, characters, images)
and ordered `select` pickers resolve the rate variant from fields like
`input.resolution` and `input.first_frame_url` (i2v vs t2v). Image models
price per image; resolution-tiered families require `input.resolution`;
endpoint-keyed pricing (e.g. Suno) uses the `EstimateRequest.endpoint`
discriminator instead of `payload.model`.

## Bundled pricing

Rates are frozen at `PRICING_AS_OF` (currently `2026-04-30`; individual
entries may carry their own as-of date) and shipped in `src/pricing/` as
per-provider modules covering each provider's most common models. Unknown
models return `usd: 0` plus a warning, never throw.

```ts
import { PRICING, PRICING_AS_OF } from "@apicity/cost";
```

Maintenance is manual: re-fetch the upstream pricing page, edit the provider's
module in `src/pricing/`, bump `PRICING_AS_OF`.

## Coverage

| Provider                                                           | source                   | Notes                                                                               |
| ------------------------------------------------------------------ | ------------------------ | ----------------------------------------------------------------------------------- |
| `openai`, `anthropic`, `xai`, `kimicoding`, `fireworks`, `alibaba` | `tokens-heuristic+table` | chars/4 ≈ tokens — no upstream call                                                 |
| `elevenlabs`                                                       | `per-unit-table`         | priced per character                                                                |
| `kie`                                                              | `per-unit-table`         | per second of video / per image / per generation; `endpoint` discriminator for Suno |
| `free`                                                             | `free`                   | always $0                                                                           |

## Paid endpoint guard (OTP pay gate)

The cost package keeps a small, explicit **paid-endpoint registry** for
endpoints with direct marginal compute cost (e.g. video generation).
Endpoints **not** in the registry are assumed free and need no caller changes.

Paid endpoints require a **single-use OTP** (one-time password) minted from a
shared **HMAC secret**. The gate is fail-closed and does **no** cost
estimation — pure authorization: a paid call cannot fire unless the provider
was constructed with the secret **and** the caller presents a valid,
request-bound OTP. The autonomous caller never holds the secret, so it cannot
self-approve; only the human or code client that holds the secret can mint.
There are **no environment variables and no key files** — the secret is passed
in via factory options (or the MCP server's `--paygate-secret-file`).

### Registry model

- `PAID_ENDPOINTS` is the canonical list: exact `(provider, method, dotPath)`
  triples — no regex, prefix, wildcard, or inferred matching.
- Unlisted endpoints pass through free, with no OTP or configuration.
- Listed endpoints block unless a valid OTP is supplied.

### Token format

OTP tokens are a dependency-free compact envelope:

```
<base64url(payloadJson)>.<base64url(HMAC-SHA256(payloadSegment, secret))>
```

The signature is HMAC-SHA256 over the exact base64url payload segment bytes,
verified in constant time. Payload schema:

```ts
interface PayGateOtpPayload {
  v: 1; // version
  jti: string; // random 128-bit hex (unique token id)
  provider: string; // e.g. "kie"
  method: string; // e.g. "POST"
  dotPath: string; // e.g. "api.v1.jobs.createTask"
  requestHash: `sha256:${string}`; // sha256 of canonical request JSON
  iat: number; // issued-at unix seconds
  exp: number; // expiration unix seconds
}
```

### Configuration

The code client supplies a `PayGateConfig` via factory options:

```ts
interface PayGateConfig {
  secret: string; // shared HMAC secret (the code client holds it)
  replayStore?: ReplayStore; // defaults to an in-process Set, per provider instance
  now?: () => number; // clock injection for tests; defaults to Date.now
}

interface ReplayStore {
  has(jti: string): boolean;
  add(jti: string): void;
}
```

```ts
import { createKie } from "@apicity/kie";

const provider = createKie({
  apiKey: process.env.KIE_API_KEY!,
  paygate: { secret: loadSecret() }, // from your secret manager / config
});
```

### Minting OTPs

`mintOtp` is pure and env-free — the secret is passed explicitly and the OTP
binds to the exact request via its canonical hash:

```ts
import { mintOtp } from "@apicity/cost";

const otp = mintOtp(secret, {
  dotPath: "api.v1.jobs.createTask", // provider/method resolved from the registry
  request: payload, // bound by canonical hash
  ttl: "10m", // seconds or "10m" / "1h" / "1d"; defaults to 10m
});
```

### Request canonicalization

Before hashing, the payload is canonicalized — serialized to JSON with
recursively **sorted object keys**, array order preserved, non-JSON values
(functions, undefined, circular references) rejected — then SHA-256 hashed and
prefixed `sha256:`. Change any byte of the request and verification fails.

### Replay protection

Each OTP `jti` is single-use. The default `ReplayStore` is an in-process Set
scoped to one provider instance (no files, no `XDG_STATE_HOME`); pass a custom
`replayStore` for cross-process or persistent protection. The `jti` is
consumed **before** dispatch — see [Retry semantics](#retry-semantics).

### Public interface

```ts
interface PayGateApproval {
  otp: string;
}

async function dispatchWithPaidGate<T>(
  provider: string,
  method: string,
  dotPath: string,
  payload: Record<string, unknown>,
  approval: PayGateApproval | undefined,
  dispatch: () => Promise<T>,
  config?: PayGateConfig
): Promise<T>;
```

Paid endpoint APIs accept the approval as a second options object:

```ts
const task = await provider.post.api.v1.jobs.createTask(
  { model: "kling-3.0/video", input: { prompt: "...", duration: "5" } },
  { otp }
);
```

### Guard behavior

Each failed check throws `PayGateError` with the code shown:

1. **Preflight** — endpoints not in `PAID_ENDPOINTS` dispatch immediately.
2. **Configuration** — paid endpoint with no `paygate.secret` →
   `paygate-not-configured`.
3. **OTP presence** — missing `approval.otp` → `otp-missing`.
4. **Signature** — constant-time HMAC check of the payload segment →
   `otp-invalid-signature` on mismatch.
5. **Expiration** — `exp` in the past → `otp-expired`.
6. **Request binding** — `provider`, `method`, `dotPath`, and `requestHash`
   must match the actual call → `otp-mismatched-request`.
7. **Replay check** — `jti` already in the store → `otp-replayed`.
8. **Consume + dispatch** — the `jti` is recorded, then the HTTP request
   fires.

```ts
import { PayGateError } from "@apicity/cost";

try {
  await provider.post.api.v1.jobs.createTask({ ... }, { otp });
} catch (e) {
  if (e instanceof PayGateError) {
    // e.code: paygate-not-configured | otp-missing | otp-malformed
    //         | otp-invalid-signature | otp-expired
    //         | otp-mismatched-request | otp-replayed
  } else throw e;
}
```

### Failure modes

| Condition                          | `PayGateError.code`      |
| ---------------------------------- | ------------------------ |
| Provider built without a secret    | `paygate-not-configured` |
| Paid endpoint without OTP          | `otp-missing`            |
| Malformed envelope                 | `otp-malformed`          |
| Invalid HMAC signature             | `otp-invalid-signature`  |
| Expired OTP (`exp` < now)          | `otp-expired`            |
| Mismatched provider/method/dotPath | `otp-mismatched-request` |
| Mismatched request hash            | `otp-mismatched-request` |
| Replayed OTP (`jti` seen)          | `otp-replayed`           |

### CLI: minting OTPs

The `apicity-paygate` binary mints OTPs. The secret is read from a **file**
(never an env var); only the OTP is printed to stdout:

```bash
apicity-paygate otp mint \
  --secret-file ./paygate.secret \
  --dot-path api.v1.jobs.createTask \
  --payload-file request.json \
  --ttl 10m
```

### Wiring the gate into a provider

Providers apply the gate at the bottom of their factory with `withPaidGate`.
The walker descends the HTTP-method roots (`post`, `get`, `delete`, `patch`,
`put`) and routes every leaf whose `(provider, method, dotPath)` is in
`PAID_ENDPOINTS` through `dispatchWithPaidGate`; free leaves pass through
unchanged, and schema records and other non-route properties are returned by
reference. Providers with paid sub-provider roots wrap those trees explicitly
with the same config so one replay store covers the provider instance:

```ts
import { createReplayStore, withPaidGate } from "@apicity/cost";

export function createKie(opts: KieOptions): KieProvider {
  const paygate = opts.paygate
    ? {
        ...opts.paygate,
        replayStore: opts.paygate.replayStore ?? createReplayStore(),
      }
    : undefined;

  // ...build endpoint functions...
  return withPaidGate(
    "kie",
    {
      veo: withPaidGate("kie", createVeoProvider(...), { config: paygate }),
      modelInputSchemas,               // data, untouched
      post: { api: { v1: { jobs: { createTask: Object.assign(createTask, { schema }) } } } },
      get:  { api: { v1: { jobs: { recordInfo } } } },
    },
    { config: paygate }
  );
}
```

The gate is generic — `xai` and other providers opt in by adding a
`PAID_ENDPOINTS` entry and threading `{ config: opts.paygate }` through their
factory.

### Retry semantics

The OTP `jti` is consumed **before** `dispatch()` runs: if dispatch later
fails (network error, upstream 5xx, abort), it stays consumed and the caller
must mint a fresh OTP to retry. This is intentional — otherwise a hostile
caller could replay a single OTP on every transient failure. Each OTP is
single-use authority for one network attempt.

### MCP server

`@apicity/mcp-server` is the code client: started with
`--paygate-secret-file <path>`, it holds the secret to **verify** OTPs (it
never mints). A human mints an OTP out-of-band with the same secret and the
caller passes it as the paid tool's `otp` argument — an AI driving the tool
cannot self-approve.

### Minimal operator workflow

1. **Generate a secret** (one-time) and store it (secret manager / file).
2. **Prepare a request** JSON file.
3. **Mint an OTP** with the [CLI above](#cli-minting-otps).
4. **Pass the OTP to the caller** (copy-paste, secrets manager, etc.).
5. **Caller uses it**:
   ```ts
   await provider.post.api.v1.jobs.createTask({ ... }, { otp: "<paste>" });
   ```

## Out of scope

- Anthropic prompt-cache pricing (rates are in the table but `estimate()` ignores them — assumes no caching)
- Batch API discount (50% off across providers)
- Tier-based fallback for fireworks (parameter-count brackets)
- Suno per-song pricing on kie (no stable published rate)
- Caller-side `pricingOverrides`

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
