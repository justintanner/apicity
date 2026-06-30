# apicity

[![CI](https://github.com/justintanner/apicity/actions/workflows/ci.yml/badge.svg)](https://github.com/justintanner/apicity/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.base.json)
[![Node](https://img.shields.io/badge/Node.js-%E2%89%A518-339933?logo=nodedotjs&logoColor=white)](package.json)

A thin wrapper for many APIs: AI image and video generation, all major social
media APIs, and more.

## Features

- **OTP pay gate — no bypass.** Paid endpoints (media generation, etc.) fire
  only with a human- or code-client-minted, single-use OTP bound to the exact
  request. An autonomous agent can't self-approve or run up your bill.
  [Details ↓](#paid-endpoints-otp-pay-gate)
- **Pre-flight cost estimates.** Pure local USD estimates for the billed
  providers (openai, anthropic, xai, kimicoding, fireworks, alibaba, kie,
  elevenlabs) — no keys, no network.
- **Schemas for agents.** Every POST endpoint ships a zod request schema
  (`endpoint.schema`) — hosts and agents catch a hallucinated call locally
  instead of at the API; the MCP server uses it as the tool's input schema.
  Provider packages may carry Zod 3 or Zod 4 at runtime; the compatibility
  policy is documented in [docs/zod-compatibility.md](docs/zod-compatibility.md).
- **MCP server.** Every endpoint exposed 1:1 as an MCP tool.
- **Composable middleware.** `withRetry` / `withFallback` / `withRateLimit` as
  plain function wrappers.
- **Minimal provider dependencies.** Providers depend only on `zod` — plus
  `viem` in `@apicity/polymarket` for order signing. Paid endpoint OTP
  verification and B2's S3-compatible transport are bundled inside their
  provider packages. ESM, strict TypeScript.

## Example

The headline behavior: a **paid endpoint is gated**. Without an approved,
single-use OTP the call fails closed — an autonomous caller cannot bypass it.

```ts
import { createKie } from "@apicity/kie";
import { mintOtp, createCost } from "@apicity/cost";

// The code client holds the pay-gate secret (from your secret manager /
// config). The autonomous caller never sees it, so it can't self-approve.
const secret = loadSecret();
const kie = createKie({
  apiKey: process.env.KIE_API_KEY!,
  paygate: { secret },
});

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

// No OTP → fails closed. No bypass.
await kie.post.api.v1.jobs.createTask(payload);
// ❌ throws PayGateError { code: "otp-missing" }

// A human (or the code client) mints a single-use OTP bound to THIS request.
const otp = mintOtp(secret, {
  dotPath: "api.v1.jobs.createTask",
  request: payload,
  ttl: "10m",
});

// Approved — runs once. Replaying the OTP, or changing any byte of the
// payload, fails verification.
const task = await kie.post.api.v1.jobs.createTask(payload, { otp });
```

Direct KIE VEO calls are gated separately from `createTask`: for
`kie.veo.post.api.v1.veo.generate` mint with `dotPath: "api.v1.veo.generate"`,
for `kie.veo.post.api.v1.veo.extend` use `dotPath: "api.v1.veo.extend"`.
Upload, status, and helper endpoints are unlisted and remain free.

## Packages

| Package                                                           | Focus                                                              |
| ----------------------------------------------------------------- | ------------------------------------------------------------------ |
| [@apicity/openai](packages/provider/openai)                       | OpenAI chat, responses, images, audio, embeddings, files           |
| [@apicity/anthropic](packages/provider/anthropic)                 | Anthropic messages, streams, batches, files, models, admin APIs    |
| [@apicity/xai](packages/provider/xai)                             | xAI chat, responses, Grok images/video, files, collections, search |
| [@apicity/fal](packages/provider/fal)                             | fal model registry, generation, pricing, usage, analytics          |
| [@apicity/google](packages/provider/google)                       | Google Gemini express-mode generateContent                         |
| [@apicity/kie](packages/provider/kie)                             | KIE media generation for video, image, audio, Claude, Suno         |
| [@apicity/alibaba](packages/provider/alibaba)                     | Alibaba DashScope/Qwen chat, image, and video workflows            |
| [@apicity/binance](packages/provider/binance)                     | Binance Spot REST public/general endpoints                         |
| [@apicity/openligadb](packages/provider/openligadb)               | OpenLigaDB public soccer match data, standings, and scorers        |
| [@apicity/fireworks](packages/provider/fireworks)                 | Fireworks chat, embeddings, audio, deployments, fine-tuning        |
| [@apicity/kimicoding](packages/provider/kimicoding)               | Kimi Coding messages, streaming, models, embeddings                |
| [@apicity/elevenlabs](packages/provider/elevenlabs)               | ElevenLabs text-to-speech, sound effects, audio APIs               |
| [@apicity/s3](packages/provider/s3)                               | S3-compatible object storage                                       |
| [@apicity/b2](packages/provider/b2)                               | Backblaze B2 S3-compatible object storage                          |
| [@apicity/free-media-upload](packages/provider/free-media-upload) | Public file upload/hosting services                                |
| [@apicity/x](packages/provider/x)                                 | X API posting and media upload                                     |
| [@apicity/meta](packages/provider/meta)                           | Instagram Graph API reel publishing                                |
| [@apicity/polymarket](packages/provider/polymarket)               | Polymarket Gamma, Data, and CLOB public market data                |
| [@apicity/simplefunctions](packages/provider/simplefunctions)     | SimpleFunctions public prediction-market and analytical APIs       |
| [@apicity/telegram](packages/provider/telegram)                   | Telegram Bot API text, photo, video, and audio sending             |
| [@apicity/thesportsdb](packages/provider/thesportsdb)             | TheSportsDB public sports player data                              |
| [@apicity/cost](packages/provider/cost)                           | Pure local cost/token estimates across providers                   |
| [@apicity/mcp-server](packages/mcp-server)                        | MCP server exposing provider endpoints as tools                    |

## MCP server

Every endpoint as an MCP tool. Install with a 1Password vault holding the
provider keys, or a plain `.env` file:

```bash
claude mcp add apicity -- \
  npx -y @apicity/mcp-server@latest \
  --op-vault apicity --op-token "$OP_SERVICE_ACCOUNT_TOKEN"

# or
claude mcp add apicity -- \
  npx -y @apicity/mcp-server@latest --env-file ~/.config/apicity/.env
```

Codex: same command after `codex mcp add apicity --`. Details in
[@apicity/mcp-server](packages/mcp-server).

## Middleware

Every endpoint is a plain `(req, signal?) => Promise<T>` function, and every
package exports `withRetry`, `withFallback`, and `withRateLimit` — generic
wrappers that compose, or you can pass endpoint functions into your own
orchestration layer. (`@apicity/kimicoding` also ships `withStreamRetry` /
`withStreamFallback` for streamed async iterables.)

### `withRetry` — exponential backoff

Retries transient errors (HTTP 429 and 5xx) with configurable backoff:

```ts
import { createOpenAi, withRetry } from "@apicity/openai";

const openai = createOpenAi({ apiKey: process.env.OPENAI_API_KEY! });

const chat = withRetry(openai.v1.chat.completions, {
  retries: 3, // max attempts (default: 2)
  baseMs: 500, // initial delay in ms (default: 300)
  factor: 2, // exponential multiplier (default: 2)
  jitter: true, // randomize delay ±20% (default: true)
});
```

### `withFallback` — multi-provider failover

Tries each function in order; wrappers keep the same signature, so they nest:

```ts
import { createXai, withFallback, withRetry } from "@apicity/xai";

const primary = createXai({ apiKey: process.env.XAI_API_KEY_PRIMARY! });
const backup = createXai({ apiKey: process.env.XAI_API_KEY_BACKUP! });

const image = withFallback([
  withRetry(primary.v1.images.generations, { retries: 2 }),
  withRetry(backup.v1.images.generations, { retries: 1 }),
]);

const result = await image({
  model: "grok-2-image",
  prompt: "A product photo of a small brass desk lamp",
  n: 1,
});
```

### `withRateLimit` — client-side throttling

Bounds requests-per-minute and concurrency through a shared limiter:

```ts
import {
  createOpenAi,
  withRateLimit,
  createRateLimiter,
} from "@apicity/openai";

const openai = createOpenAi({ apiKey: process.env.OPENAI_API_KEY! });
const limiter = createRateLimiter({ rpm: 60, concurrent: 5 });

const chat = withRateLimit(openai.v1.chat.completions, limiter);
```

## Paid endpoints (OTP pay gate)

Endpoints with direct marginal cost (e.g. `kie.post.api.v1.jobs.createTask`
and direct VEO calls under `kie.veo.post.api.v1.veo.*`) are listed in
`PAID_ENDPOINTS` and gated behind a single-use OTP — the flow is the
[example above](#example). The gate is **fail-closed**: a paid call needs both
a pay-gate secret at provider construction **and** a valid OTP minted from
that same secret. The autonomous caller never sees the secret, so it cannot
self-approve. Unlisted endpoints are free.

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

The gate is generic — `xai` and others opt in by adding a `PAID_ENDPOINTS`
entry. See [@apicity/cost](packages/provider/cost) for the full spec and the
MCP server's `--paygate-secret-file` wiring.

## Development

- **Runtime** — Node 18+, Cloudflare Workers, Deno, Bun. ESM only.
- **Build & test** — `pnpm install && pnpm run build && pnpm run test:run`.
  Integration tests record/replay via Polly.js (no keys needed for replay).
- **Provider-scoped loop** — use `pnpm run test:provider -- <name-or-path>`
  for one provider's typecheck + replay tests, and
  `pnpm run dev:preflight:provider -- <name-or-path>` for scoped
  format/lint/typecheck/tests. `<name-or-path>` can be `openai`,
  `packages/provider/openai/src/openai.ts`, or a matching
  `tests/integration/openai-*.test.ts` path. From a provider package,
  `pnpm -w run dev:preflight:provider` infers the provider from `INIT_CWD`.
  `pnpm run ci:local` remains the full repository gate.
- **Validate before sending** — every POST endpoint exposes a `.schema`:
  `createOpenAi(...).v1.chat.completions.schema.safeParse(payload)` catches a
  hallucinated call locally instead of at the API.

## License

MIT — see [LICENSE](LICENSE).

Based on [TetherAI](https://github.com/nbursa/TetherAI) by Nenad Bursac.
