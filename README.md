# apicity

[![CI](https://github.com/justintanner/apicity/actions/workflows/ci.yml/badge.svg)](https://github.com/justintanner/apicity/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.base.json)
[![Node](https://img.shields.io/badge/Node.js-%E2%89%A518-339933?logo=nodedotjs&logoColor=white)](package.json)
[![Zero Dependencies](https://img.shields.io/badge/provider_deps-0-brightgreen)](package.json)

A thin wrapper for many APIs covering AI image generation, video generation, all major social media APIs, and more.

## Example

```ts
import { cost } from "@apicity/cost";
import { kie as createKie } from "@apicity/kie";

const c = cost();
const kie = createKie({ apiKey: process.env.KIE_API_KEY! });

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

// Same payload — now actually run the generation.
const task = await kie.post.api.v1.jobs.createTask(payload);
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
import { xai as createXai, withFallback, withRetry } from "@apicity/xai";

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
single-use, operator-signed OTP. Autonomous callers cannot self-approve — they
must present a token signed by an operator-held Ed25519 key. Unlisted endpoints
are free and require no caller changes.

Providers wire the gate once at the bottom of their factory:

```ts
import { withPaidGate } from "@apicity/cost";

export function kie(opts: KieOptions): KieProvider {
  // …build endpoint functions…
  return withPaidGate("kie", {
    post: { api: { v1: { jobs: { createTask: Object.assign(createTask, { schema }) } } } },
    get:  { api: { v1: { jobs: { recordInfo } } } },
    // sub-providers, schema maps, etc. pass through untouched
  });
}
```

Operators mint an OTP per request with the `apicity-paygate` CLI:

```bash
export APICITY_PAYGATE_PRIVATE_KEY_PATH=./paygate-private.pem  # signer
export APICITY_PAYGATE_PUBLIC_KEY_PATH=./paygate-public.pem    # verifier

apicity-paygate otp mint \
  --provider kie \
  --method POST \
  --dot-path api.v1.jobs.createTask \
  --payload-file request.json \
  --max-spend 5 \
  --ttl 10m
```

The caller passes the OTP alongside the request:

```ts
import { kie } from "@apicity/kie";
import { PayGateError, SpendBoundError } from "@apicity/cost";

const provider = kie({ apiKey: process.env.KIE_API_KEY! });

try {
  const task = await provider.post.api.v1.jobs.createTask(
    payload,
    { otp: process.env.KIE_OTP! },
  );
} catch (e) {
  if (e instanceof PayGateError) {
    // otp-missing | otp-expired | otp-invalid-signature
    // otp-mismatched-request | otp-replayed | paygate-not-configured
  } else if (e instanceof SpendBoundError) {
    // estimated cost > maxSpendUsd, or cost couldn't be bounded
  } else throw e;
}
```

The OTP commits to the exact `(provider, method, dotPath, requestHash,
maxSpendUsd, exp)` tuple — change any byte of the payload and verification
fails. The `jti` is consumed before dispatch, so a failed network call still
burns the token: operators must mint a fresh OTP for any retry. See
[@apicity/cost](packages/provider/cost) for the full spec, key setup, and
retry semantics.

## License

MIT — see [LICENSE](LICENSE).

Based on [TetherAI](https://github.com/nbursa/TetherAI) by Nenad Bursac.
