# @apicity/cost

Cross-provider cost & token estimation for the [apicity](https://github.com/justintanner/apicity) monorepo. Returns a USD figure for a planned API call across **every** apicity provider — using the upstream estimate endpoint where one exists, and a bundled hardcoded rate table otherwise.

This is the only `@apicity/*` package that depends on other workspace packages — it's a deliberate cross-provider helper, not a wrapper for any single upstream API.

## Install

```bash
npm install @apicity/cost
# or
pnpm add @apicity/cost
```

## Usage

`c.estimate(req)` accepts the **exact JSON body you would POST to upstream**. The package lightly parses the payload to extract the fields that affect price (model, resolution, duration, message contents, etc.) — so the same object you build for the real generation call doubles as the input to the cost estimate.

```ts
import { cost } from "@apicity/cost";

const c = cost({
  openai: { apiKey: process.env.OPENAI_API_KEY! },
  anthropic: { apiKey: process.env.ANTHROPIC_API_KEY! },
  fal: { apiKey: process.env.FAL_API_KEY! },
  // fireworks / alibaba / elevenlabs / kie / free need NO opts — pure local math
});

// openai chat — same body you'd POST to /v1/chat/completions
const a = await c.estimate({
  provider: "openai",
  payload: {
    model: "gpt-5",
    messages: [{ role: "user", content: "Estimate this prompt's cost." }],
    max_tokens: 1000,
  },
});
// → { usd: 0.01..., source: "tokens-api+table", breakdown: { inputTokens: 7, outputTokens: 1000, ... } }

// Skip the network call — use chars/4 heuristic
const a2 = await c.estimate({
  provider: "openai",
  payload: { model: "gpt-5", messages: [...], max_tokens: 1000 },
  useHeuristic: true,
});

// fal — payload is whatever the chosen endpoint expects; defers to upstream USD endpoint
const f = await c.estimate({
  provider: "fal",
  endpoint_id: "fal-ai/flux/dev",
  payload: { unit_quantity: 100 },
});
// → { usd: ..., source: "upstream-usd", rateAsOf: null }

// kie — the same body you'd POST to /api/v1/jobs/createTask
const k = await c.estimate({
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
// extractor reads model + input.resolution + first_frame_url presence (i2v)
// + input.duration → seedance-2-720p-i2v rate × 8 seconds

// elevenlabs TTS — payload is the /v1/text-to-speech body
const e = await c.estimate({
  provider: "elevenlabs",
  payload: { model_id: "eleven_flash_v2_5", text: "Hello world" },
});

// free → always $0
const z = await c.estimate({ provider: "free-media-upload" });
```

## Return shape

```ts
interface CostEstimate {
  usd: number;
  currency: "USD";
  source:
    | "upstream-usd" // fal — exact USD from upstream
    | "tokens-api+table" // openai/anthropic/xai — exact tokens × bundled rate
    | "tokens-heuristic+table" // useHeuristic:true, plus fireworks/alibaba/kimicoding (always heuristic)
    | "per-unit-table" // elevenlabs/kie — payload-derived units × bundled rate
    | "free";
  breakdown: {
    inputTokens?: number;
    outputTokens?: number;
    units?: number;
    unit?: "tokens" | "characters" | "seconds" | "images" | "songs";
    inputUsdPerMillion?: number;
    outputUsdPerMillion?: number;
    perUnitUsd?: number;
  };
  rateAsOf: string | null; // YYYY-MM-DD; null when source=upstream-usd
  warnings: string[]; // non-empty when fallback fired (unknown model, missing max_tokens, missing duration, etc.)
}
```

`source` is the load-bearing field: callers who want guarantees check `source === "upstream-usd"`. Callers who tolerate ±20% can accept `tokens-api+table` and `per-unit-table`. Heuristic mode (`tokens-heuristic+table`) is rougher — chars/4 ≈ tokens.

## How payloads are parsed

Each provider has a small extractor in `src/extract/` that walks the payload looking for the fields the rate table discriminates on. Unrecognized payloads return `usd: 0` plus a warning rather than throwing — so a missing `input.resolution` on a kie seedance payload, or a model not in the bundled table, produces a diagnosable `CostEstimate` rather than an exception.

For text providers (openai / anthropic / xai / kimicoding / fireworks / alibaba), the extractor flattens the chat `messages` array (or `input` / `prompt` / `text`) into a single string for token counting; non-text content parts (images, audio, tool calls) are dropped.

For kie, the rate table keys are not 1:1 with the payload's `model` field — the extractor rebuilds them from the payload's `input.resolution`, `input.first_frame_url` (i2v vs t2v), and the marketplace model slug. See `src/extract/kie.ts` for the full mapping. Image models (nano-banana-2, gpt-image-2, qwen2, seedream/5-lite, wan/2-7-image) price per image; resolution-tiered families require `input.resolution`.

## Bundled pricing

Rates are frozen at `PRICING_AS_OF` (currently `2026-04-30`) and shipped in `src/pricing.ts`. They cover the most common model on each provider; calling `estimate()` with an unknown model returns `usd: 0` plus a warning, never throws.

To inspect what's bundled:

```ts
import { TOKEN_RATES, PER_UNIT_RATES, PRICING_AS_OF } from "@apicity/cost";
```

Maintenance is manual: re-fetch each upstream's pricing page, edit `pricing.ts`, bump `PRICING_AS_OF`.

## Coverage

| Provider     | source                   | Notes                                                                 |
| ------------ | ------------------------ | --------------------------------------------------------------------- |
| `openai`     | `tokens-api+table`       | wraps `POST /v1/responses/input_tokens`                               |
| `anthropic`  | `tokens-api+table`       | wraps `POST /v1/messages/count_tokens`                                |
| `xai`        | `tokens-api+table`       | wraps `POST /v1/tokenize-text`                                        |
| `kimicoding` | `tokens-heuristic+table` | upstream `/coding/v1/tokens/count` returns 404 — local heuristic only |
| `fireworks`  | `tokens-heuristic+table` | no upstream estimate endpoint                                         |
| `alibaba`    | `tokens-heuristic+table` | no upstream estimate endpoint                                         |
| `fal`        | `upstream-usd`           | wraps `POST /v1/models/pricing/estimate`                              |
| `elevenlabs` | `per-unit-table`         | priced per character                                                  |
| `kie`        | `per-unit-table`         | priced per second of video / per image                                |
| `free`       | `free`                   | always $0                                                             |

## Paid endpoint guard (OTP pay gate)

Some endpoints have a direct marginal compute cost (e.g. video generation).
The cost package maintains a small, explicit **paid-endpoint registry**.
Endpoints that are **not** in the registry are assumed free and require no
caller changes.

Paid endpoints require a **human-minted, single-request OTP** (one-time
password). Autonomous callers cannot self-approve paid requests by passing
a numeric `maxSpend` — they must present an OTP that was signed by an
operator-held Ed25519 key.

### Registry model

- `PAID_ENDPOINTS` is the canonical list. Every entry is an exact triple of
  `(provider, method, dotPath)` — there is no regex, prefix, wildcard, or
  inferred matching.
- Unlisted endpoints are free. Free endpoints pass through without OTP or
  pay gate configuration.
- Listed endpoints block unless a valid OTP is supplied.

### Token format

OTP tokens are a dependency-free compact envelope:

```
<base64url(payloadJson)>.<base64url(signature)>
```

The payload JSON is canonicalized with sorted object keys before signing.
Signature is Ed25519 over the exact base64url payload segment bytes.

Payload schema:

```ts
interface PayGateOtpPayload {
  v: 1;                        // version
  jti: string;                 // random 128-bit hex (unique token id)
  provider: string;            // e.g. "kie"
  method: string;              // e.g. "POST"
  dotPath: string;             // e.g. "api.v1.jobs.createTask"
  requestHash: `sha256:${string}`; // sha256 of canonical request JSON
  maxSpendUsd: number;         // maximum allowed spend in USD
  iat: number;                 // issued-at unix seconds
  exp: number;                 // expiration unix seconds
}
```

Request hash is `sha256:` + hex SHA-256 of the canonical JSON for the request
payload. Object keys are sorted recursively; array order is preserved.
Non-JSON payload values must fail closed.

### Key configuration

**Runtime (verification):**

| Variable | Required | Description |
|----------|----------|-------------|
| `APICITY_PAYGATE_PUBLIC_KEY_PATH` | Yes | Path to an Ed25519 public key PEM file. Without this, the pay gate is disabled and all paid endpoints throw `PayGateError`. |

**CLI (minting):**

| Variable | Required | Description |
|----------|----------|-------------|
| `APICITY_PAYGATE_PRIVATE_KEY_PATH` | Yes | Path to an Ed25519 private key PEM file. Used by the `apicity-paygate` CLI to sign OTPs. |

### Request canonicalization

Before hashing, the request payload is canonicalized:

1. Serialize to JSON with **sorted object keys** (recursive).
2. Preserve array order exactly.
3. Reject non-JSON values (functions, undefined, circular references, etc.).

The canonical JSON string is then SHA-256 hashed, and the hash is prefixed
with `sha256:` in the OTP payload.

### Replay ledger

Consumed OTPs are recorded immediately before dispatch to prevent replay
attacks. The default ledger path:

- `$XDG_STATE_HOME/apicity/paygate-used.jsonl`
- Fallback: `~/.local/state/apicity/paygate-used.jsonl`

Each line is a JSON object: `{ "jti": "...", "consumedAt": 1234567890 }`.

If dispatch later fails (network error, upstream 500, etc.), the OTP remains
consumed. The operator must mint a new OTP for retry.

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
  dispatch: () => Promise<T>
): Promise<T>;
```

Paid endpoint APIs pass the approval as an options object:

```ts
import { kie } from "@apicity/kie";

const provider = kie({ apiKey: process.env.KIE_API_KEY! });

const task = await provider.post.api.v1.jobs.createTask(
  {
    model: "kling-3.0/video",
    input: { prompt: "...", duration: "5", aspect_ratio: "16:9" },
  },
  { otp: "eyJ2IjoxLCJqdGkiOi4uLn0.uK2J9..." }
);
```

### Guard behavior

1. **Preflight** — before any network dispatch, `dispatchWithPaidGate` checks
   whether the endpoint is paid. If the runtime lacks
   `APICITY_PAYGATE_PUBLIC_KEY_PATH`, the call throws `PayGateError`.
2. **OTP presence** — paid endpoints require `approval.otp`. If omitted, the
   call throws `PayGateError`.
3. **Signature verification** — the OTP payload segment is verified against
   the Ed25519 public key. If the signature is invalid or forged, the call
   throws `PayGateError`.
4. **Expiration** — if `exp` is in the past, the call throws `PayGateError`.
5. **Request binding** — the OTP `provider`, `method`, `dotPath`, and
   `requestHash` must match the actual call. Any mismatch throws
   `PayGateError`.
6. **Replay check** — if the OTP `jti` already exists in the ledger, the call
   throws `PayGateError`.
7. **Estimate** — the package computes a local cost estimate from the payload.
8. **Bound check** — if the estimate exceeds `maxSpendUsd`, or if the cost
   cannot be estimated (unknown model, missing fields), the call throws
   `SpendBoundError`.
9. **Consume** — the `jti` is appended to the replay ledger.
10. **Dispatch** — only when all checks pass does the actual HTTP request fire.

```ts
import { PayGateError, SpendBoundError } from "@apicity/cost";

try {
  await provider.post.api.v1.jobs.createTask({ ... }, { otp: "..." });
} catch (e) {
  if (e instanceof PayGateError) {
    // OTP missing, invalid, expired, replayed, or mismatched request
  }
  if (e instanceof SpendBoundError) {
    // estimated cost > maxSpendUsd, or cost could not be computed
  }
}
```

### Failure modes

| Condition | Error | Notes |
|-----------|-------|-------|
| No `APICITY_PAYGATE_PUBLIC_KEY_PATH` | `PayGateError` | Pay gate is not configured |
| Paid endpoint without OTP | `PayGateError` | Caller must pass `approval.otp` |
| Invalid signature | `PayGateError` | OTP was not signed by the correct key |
| Expired OTP (`exp` < now) | `PayGateError` | Operator must mint a fresh OTP |
| Replayed OTP (`jti` in ledger) | `PayGateError` | Each OTP is single-use |
| Mismatched provider/method/dotPath | `PayGateError` | OTP is bound to a specific call |
| Mismatched request hash | `PayGateError` | Payload must match exactly |
| Estimate > `maxSpendUsd` | `SpendBoundError` | Request is too expensive |
| Unestimable cost | `SpendBoundError` | Unknown model or missing fields |

### CLI: minting OTPs

The `apicity-paygate` binary from `@apicity/cost` mints operator-signed OTPs:

```bash
# Mint an OTP for a specific request
apicity-paygate otp mint \
  --provider kie \
  --method POST \
  --dot-path api.v1.jobs.createTask \
  --payload-file request.json \
  --max-spend 5 \
  --ttl 10m
```

The CLI requires `APICITY_PAYGATE_PRIVATE_KEY_PATH` and prints only the OTP
to stdout on success.

### Migration from `maxSpend`

The previous numeric `maxSpend` parameter is **deprecated**. It allowed
autonomous callers to self-approve by passing any positive number, which is
not a true authority boundary.

Migration path:

1. **Operator** generates an Ed25519 key pair:
   ```bash
   openssl genpkey -algorithm Ed25519 -out paygate-private.pem
   openssl pkey -in paygate-private.pem -pubout -out paygate-public.pem
   ```
2. **Runtime** sets `APICITY_PAYGATE_PUBLIC_KEY_PATH` to the public key.
3. **Operator** mints OTPs before each paid call using the CLI or a custom
   tool that signs the same payload format.
4. **Caller** passes `{ otp }` instead of a numeric `maxSpend`:
   ```ts
   // Before (deprecated)
   await provider.post.api.v1.jobs.createTask({ ... }, 5);

   // After
   await provider.post.api.v1.jobs.createTask({ ... }, { otp: "..." });
   ```

The old `maxSpendPreflight`, `MaxSpendError`, and `dispatchWithPaidGuard`
interfaces are retained during the transition but will be removed in a
future major version.

### Minimal operator workflow

1. **Set up keys** (one-time):
   ```bash
   export APICITY_PAYGATE_PRIVATE_KEY_PATH=./paygate-private.pem
   export APICITY_PAYGATE_PUBLIC_KEY_PATH=./paygate-public.pem
   ```
2. **Prepare a request**:
   ```bash
   cat > request.json << 'EOF'
   {
     "model": "kling-3.0/video",
     "input": {
       "prompt": "A cat playing piano",
       "duration": "5",
       "aspect_ratio": "16:9"
     }
   }
   EOF
   ```
3. **Mint an OTP**:
   ```bash
   apicity-paygate otp mint \
     --provider kie \
     --method POST \
     --dot-path api.v1.jobs.createTask \
     --payload-file request.json \
     --max-spend 5 \
     --ttl 10m
   ```
4. **Pass the OTP to the caller** (copy-paste, secrets manager, etc.).
5. **Caller uses the OTP**:
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
