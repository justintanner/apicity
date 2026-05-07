# apicity

[![CI](https://github.com/justintanner/apicity/actions/workflows/ci.yml/badge.svg)](https://github.com/justintanner/apicity/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.base.json)
[![Node](https://img.shields.io/badge/Node.js-%E2%89%A518-339933?logo=nodedotjs&logoColor=white)](package.json)
[![Zero Dependencies](https://img.shields.io/badge/provider_deps-0-brightgreen)](package.json)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/justintanner/apicity/pulls)

Apicity is a TypeScript monorepo of zero-dependency AI provider clients
designed to be read by LLMs as much as by humans. Methods mirror upstream URL
paths (`/v1/chat/completions` → `openai.v1.chat.completions()`), POST endpoints
expose a Zod `.schema` for validation, generated reference docs link back to
source, and `@apicity/cost` previews token/image/video spend from the same
payload you'd send for the real call — preview, budget-gate, then commit.
`@apicity/mcp-server` exposes the same endpoints as Model Context Protocol
tools.

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

## Packages

| Package                                                                       | Focus                                                              |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| [@apicity/openai](packages/provider/openai)                                   | OpenAI chat, responses, images, audio, embeddings, files           |
| [@apicity/anthropic](packages/provider/anthropic)                             | Anthropic messages, streams, batches, files, models, admin APIs    |
| [@apicity/xai](packages/provider/xai)                                         | xAI chat, responses, Grok images/video, files, collections, search |
| [@apicity/fal](packages/provider/fal)                                         | fal model registry, generation, pricing, usage, analytics          |
| [@apicity/kie](packages/provider/kie)                                         | KIE media generation for video, image, audio, Claude, Suno         |
| [@apicity/alibaba](packages/provider/alibaba)                                 | Alibaba DashScope/Qwen chat, image, and video workflows            |
| [@apicity/fireworks](packages/provider/fireworks)                             | Fireworks chat, embeddings, audio, deployments, fine-tuning        |
| [@apicity/kimicoding](packages/provider/kimicoding)                           | Kimi Coding messages, streaming, models, embeddings                |
| [@apicity/elevenlabs](packages/provider/elevenlabs)                           | ElevenLabs text-to-speech, sound effects, audio APIs               |
| [@apicity/free-media-upload](packages/provider/free-media-upload)             | Public file upload/hosting services                                |
| [@apicity/x](packages/provider/x)                                             | X API posting and media upload                                     |
| [@apicity/meta](packages/provider/meta)                                       | Instagram Graph API reel publishing                                |
| [@apicity/polymarket](packages/provider/polymarket)                           | Polymarket Gamma, Data, and CLOB public market data                |
| [@apicity/cost](packages/provider/cost)                                       | Pure local cost/token estimates across providers                   |
| [@apicity/mcp-server](packages/mcp-server)                                    | MCP server exposing provider endpoints as tools                    |

## More

- **Composition** — endpoint functions are just functions; each provider ships `withRetry` / `withFallback`, or wrap with your own.
- **Schemas for agents** — `openai.v1.chat.completions.schema.safeParse(payload)` validates before POST; useful when an LLM generates the call.
- **MCP server** — [@apicity/mcp-server](packages/mcp-server) maps each endpoint 1:1 to a tool name like `openai_v1_chat_completions`.
- **Cost coverage** — [@apicity/cost](packages/provider/cost) covers tokens, images, and video; pure local math, no keys, no network.
- **Runtime** — Node 18+, Cloudflare Workers, Deno, Bun. ESM only.
- **Develop** — `pnpm install && pnpm run build && pnpm run test:run`. Integration tests record/replay via Polly.js (no keys needed for replay).

## License

MIT — see [LICENSE](LICENSE).

Based on [TetherAI](https://github.com/nbursa/TetherAI) by Nenad Bursac.
