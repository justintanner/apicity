# apicity

[![CI](https://github.com/justintanner/apicity/actions/workflows/ci.yml/badge.svg)](https://github.com/justintanner/apicity/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.base.json)
[![Node](https://img.shields.io/badge/Node.js-%E2%89%A518-339933?logo=nodedotjs&logoColor=white)](package.json)
[![Zero Dependencies](https://img.shields.io/badge/provider_deps-0-brightgreen)](package.json)

A thin wrapper for many APIs covering AI image generation, video generation, all major social media APIs, and more.

## Example

```ts
import { createCost } from "@apicity/cost";
import { createKie } from "@apicity/kie";

const c = createCost();
const kie = createKie({
  apiKey: process.env.KIE_API_KEY!,
  // Paid endpoints (e.g. createTask) are gated — see "Paid endpoints" below.
  // The secret comes from your secret manager / config, never a magic env var.
  paygate: { secret: loadSecret() },
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

// Preview the cost — no keys, no network, sync.
const estimate = c.estimate({ provider: "kie", payload });
// estimate.usd === 0.08
// estimate.source === "per-unit-table"
// estimate.breakdown === { units: 1, unit: "images", perUnitUsd: 0.08 }

// Budget-gate before committing to the generation.
if (estimate.usd > 0.1) {
  throw new Error(`Estimate $${estimate.usd.toFixed(4)} exceeds $0.10 cap`);
}

// Same payload — now actually run the generation. Paid endpoints require an
// operator-minted, single-use OTP (see "Paid endpoints (OTP pay gate)" below).
const task = await kie.post.api.v1.jobs.createTask(payload, {
  otp: process.env.KIE_OTP!,
});
```

## Motivation

Mitigate the predicatble mistakes that AI Agents make when calls APIs such as:

- Hallicinating JSON payloads or URLs
- Calling APIs from weird locations and times
- Wasting your expensive video and image gen tokens
- And more

## Packages

| Package                                                           | Focus                                                              |
| ----------------------------------------------------------------- | ------------------------------------------------------------------ |
| [@apicity/openai](packages/provider/openai)                       | OpenAI chat, responses, images, audio, embeddings, files           |
| [@apicity/anthropic](packages/provider/anthropic)                 | Anthropic messages, streams, batches, files, models, admin APIs    |
| [@apicity/xai](packages/provider/xai)                             | xAI chat, responses, Grok images/video, files, collections, search |
| [@apicity/fal](packages/provider/fal)                             | fal model registry, generation, pricing, usage, analytics          |
| [@apicity/kie](packages/provider/kie)                             | KIE media generation for video, image, audio, Claude, Suno         |
| [@apicity/alibaba](packages/provider/alibaba)                     | Alibaba DashScope/Qwen chat, image, and video workflows            |
| [@apicity/fireworks](packages/provider/fireworks)                 | Fireworks chat, embeddings, audio, deployments, fine-tuning        |
| [@apicity/kimicoding](packages/provider/kimicoding)               | Kimi Coding messages, streaming, models, embeddings                |
| [@apicity/elevenlabs](packages/provider/elevenlabs)               | ElevenLabs text-to-speech, sound effects, audio APIs               |
| [@apicity/free-media-upload](packages/provider/free-media-upload) | Public file upload/hosting services                                |
| [@apicity/x](packages/provider/x)                                 | X API posting and media upload                                     |
| [@apicity/meta](packages/provider/meta)                           | Instagram Graph API reel publishing                                |
| [@apicity/polymarket](packages/provider/polymarket)               | Polymarket Gamma, Data, and CLOB public market data                |
| [@apicity/cost](packages/provider/cost)                           | Pure local cost/token estimates across providers                   |
| [@apicity/mcp-server](packages/mcp-server)                        | MCP server exposing provider endpoints as tools                    |

## Composition

Every endpoint is a plain async function with the provider's request and
response types. Middleware is function-level, so composition stays explicit:

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

Use the wrappers that ship with each provider, or pass endpoint functions into
your own orchestration layer.

## More

- **Schemas for agents** — `openai.v1.chat.completions.schema.safeParse(payload)` validates before POST; useful when an LLM generates the call.
- **MCP server** — [@apicity/mcp-server](packages/mcp-server) maps each endpoint 1:1 to a tool name like `openai_v1_chat_completions`.
- **Cost coverage** — [@apicity/cost](packages/provider/cost) covers tokens, images, and video; pure local math, no keys, no network.
- **Runtime** — Node 18+, Cloudflare Workers, Deno, Bun. ESM only.
- **Develop** — `pnpm install && pnpm run build && pnpm run test:run`. Integration tests record/replay via Polly.js (no keys needed for replay).

## Paid endpoints (OTP pay gate)

Endpoints that incur direct marginal cost (e.g. `kie.post.api.v1.jobs.createTask`
for video/image generation) are listed in `PAID_ENDPOINTS` and gated behind a
single-use OTP. The gate is **fail-closed**: a paid call cannot fire unless the
provider was constructed with a pay-gate secret **and** the caller presents a
valid OTP minted from that same secret. Only the human (or the code client that
holds the secret) can mint OTPs — the autonomous caller never sees the secret,
so it cannot self-approve. Unlisted endpoints are free and require no changes.

The gate uses a single shared **HMAC secret** — no key files, no environment
variables, no cost coupling. The code client supplies it via factory options:

```ts
import { createKie } from "@apicity/kie";

const provider = createKie({
  apiKey: process.env.KIE_API_KEY!,
  paygate: { secret: loadSecret() }, // from your secret manager / config
});
```

The human (or code client) mints a single-use OTP, bound to the exact request,
with `mintOtp` (or the `apicity-paygate` CLI):

```ts
import { mintOtp } from "@apicity/cost";

const otp = mintOtp(secret, {
  dotPath: "api.v1.jobs.createTask", // provider/method resolved from the registry
  request: payload, // bound by canonical hash — change a byte and it fails
  ttl: "10m",
});
```

```bash
apicity-paygate otp mint \
  --secret-file ./paygate.secret \
  --dot-path api.v1.jobs.createTask \
  --payload-file request.json \
  --ttl 10m
```

The caller passes the OTP alongside the request:

```ts
import { PayGateError } from "@apicity/cost";

try {
  const task = await provider.post.api.v1.jobs.createTask(payload, { otp });
} catch (e) {
  if (e instanceof PayGateError) {
    // paygate-not-configured | otp-missing | otp-malformed
    // otp-invalid-signature | otp-expired | otp-mismatched-request | otp-replayed
  } else throw e;
}
```

The OTP commits to the exact `(provider, method, dotPath, requestHash, exp)`
tuple — change any byte of the payload and verification fails. The `jti` is
consumed before dispatch, so a failed network call still burns the token: mint a
fresh OTP for any retry. The same gate is generic across providers (`xai` and
others can opt in by adding a `PAID_ENDPOINTS` entry). See
[@apicity/cost](packages/provider/cost) for the full spec and the MCP server's
`--paygate-secret-file` wiring.

## License

MIT — see [LICENSE](LICENSE).

Based on [TetherAI](https://github.com/nbursa/TetherAI) by Nenad Bursac.
