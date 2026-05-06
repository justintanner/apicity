# apicity

[![CI](https://github.com/justintanner/apicity/actions/workflows/ci.yml/badge.svg)](https://github.com/justintanner/apicity/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.base.json)
[![Node](https://img.shields.io/badge/Node.js-%E2%89%A518-339933?logo=nodedotjs&logoColor=white)](package.json)
[![Zero Dependencies](https://img.shields.io/badge/provider_deps-0-brightgreen)](package.json)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/justintanner/apicity/pulls)

Zero-dependency TypeScript AI provider clients built for composable code,
LLM-readable endpoint shapes, MCP tools, and preflight video/image generation
cost estimates.

Apicity is a monorepo of small standalone packages. Each provider package
ships as plain TypeScript compiled to ESM, uses the runtime `fetch`, and mirrors
upstream API URL paths directly in code:

```ts
/v1/chat/completions        -> openai.v1.chat.completions()
/v1/images/generations      -> xai.v1.images.generations()
/api/v1/common/download-url -> kie.post.api.v1.common.downloadUrl()
```

## Why Apicity

- **No direct provider dependencies** — every `@apicity/<provider>` package,
  plus `@apicity/cost`, declares zero direct runtime dependencies.
- **Composable by default** — endpoint functions are just functions. Wrap them
  with retry, fallback, metrics, queues, or your own orchestration without
  adopting a framework.
- **LLM ready** — method names mirror upstream paths, endpoint functions expose
  request schemas, and generated docs keep URLs, examples, and source links
  close to the code.
- **MCP out of the box** — `@apicity/mcp-server` exposes provider endpoints as
  Model Context Protocol tools with the same names and payloads.
- **Cost estimates before generation** — `@apicity/cost` estimates token,
  image, and video generation spend from the same payloads you plan to send.

## Packages

| Package                                             | Focus                                                              |
| --------------------------------------------------- | ------------------------------------------------------------------ |
| [@apicity/openai](packages/provider/openai)         | OpenAI chat, responses, images, audio, embeddings, files           |
| [@apicity/anthropic](packages/provider/anthropic)   | Anthropic messages, streams, batches, files, models, admin APIs    |
| [@apicity/xai](packages/provider/xai)               | xAI chat, responses, Grok images/video, files, collections, search |
| [@apicity/fal](packages/provider/fal)               | fal model registry, generation, pricing, usage, analytics          |
| [@apicity/kie](packages/provider/kie)               | KIE media generation for video, image, audio, Claude, Suno         |
| [@apicity/alibaba](packages/provider/alibaba)       | Alibaba DashScope/Qwen chat, image, and video workflows            |
| [@apicity/fireworks](packages/provider/fireworks)   | Fireworks chat, embeddings, audio, deployments, fine-tuning        |
| [@apicity/kimicoding](packages/provider/kimicoding) | Kimi Coding messages, streaming, models, embeddings                |
| [@apicity/elevenlabs](packages/provider/elevenlabs) | ElevenLabs text-to-speech, sound effects, audio APIs               |
| [@apicity/free](packages/provider/free)             | Public file upload/hosting services                                |
| [@apicity/x](packages/provider/x)                   | X API posting and media upload                                     |
| [@apicity/ig](packages/provider/ig)                 | Instagram Graph API reel publishing                                |
| [@apicity/polymarket](packages/provider/polymarket) | Polymarket Gamma, Data, and CLOB public market data                |
| [@apicity/cost](packages/provider/cost)             | Pure local cost/token estimates across providers                   |
| [@apicity/mcp-server](packages/mcp-server)          | MCP server exposing provider endpoints as tools                    |

## Quick Start

Install one provider package. You do not need a shared SDK package.

```bash
npm install @apicity/openai
```

```ts
import { openai as createOpenai, withRetry } from "@apicity/openai";

const openai = createOpenai({ apiKey: process.env.OPENAI_API_KEY! });
const responses = withRetry(openai.v1.responses, { retries: 2 });

const result = await responses({
  model: "gpt-5",
  input: "Write a compact status update.",
});

console.log(result.output);
```

The object you call looks like the API URL you are calling. This makes provider
code easy for people and LLM agents to inspect, generate, diff, and verify.

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

## LLM-Ready Endpoints

Apicity keeps the representation close to upstream APIs:

- URL segments become property paths.
- Kebab-case URL segments become camelCase properties.
- Callable namespaces support overloaded upstream routes.
- POST endpoints expose `.schema` for payload validation.
- Provider READMEs are generated from source comments and
  `scripts/endpoint-docs.tsv`.

```ts
const validation = openai.v1.chat.completions.schema.safeParse({
  model: "gpt-5",
  messages: [{ role: "user", content: "Hello" }],
});

if (!validation.success) {
  console.error(validation.error.issues);
}
```

This is intentionally useful for coding agents: the path, schema, docs URL, and
implementation live in predictable places.

## MCP Tools

Install the MCP server and whichever providers you want exposed:

```bash
npm install @apicity/mcp-server @apicity/openai @apicity/anthropic @apicity/xai
```

Run the stdio server:

```bash
OPENAI_API_KEY=sk-... ANTHROPIC_API_KEY=sk-... \
  npx apicity-mcp --output-dir ./apicity-out
```

Each MCP tool maps 1:1 to a provider endpoint:

```text
openai_v1_chat_completions  -> POST https://api.openai.com/v1/chat/completions
xai_v1_images_generations   -> POST https://api.x.ai/v1/images/generations
kie_api_v1_jobs_createTask  -> POST https://api.kie.ai/api/v1/jobs/createTask
```

Providers without credentials are skipped. Binary responses and generated media
URLs can be saved automatically with `--output-dir`.

See [@apicity/mcp-server](packages/mcp-server/README.md) for flags, env vars,
and Claude Desktop config.

## Cost Estimates

Use `@apicity/cost` to estimate spend before you send a request. It accepts the
same payload shape you plan to pass to the real provider call and returns USD,
source metadata, units, and warnings.

```bash
npm install @apicity/cost
```

```ts
import { cost } from "@apicity/cost";

const c = cost();

const estimate = c.estimate({
  provider: "kie",
  payload: {
    model: "grok-imagine/text-to-video",
    input: {
      prompt: "A slow dolly shot through a neon arcade",
      resolution: "720p",
      duration: 8,
    },
  },
});

console.log(estimate.usd, estimate.breakdown, estimate.warnings);
```

The cost package is pure local math: no keys, no network calls. Token-billed
models use bundled rates with a text heuristic; media models such as KIE video
and image generation use payload-derived units like seconds or images.

For quick comparisons:

```bash
pnpm run compare:video
pnpm run compare:image
```

## Runtime Support

Provider packages target modern runtimes with `fetch` and ESM:

- Node.js 18+
- Cloudflare Workers
- Deno and Bun-style runtimes with standard `fetch`
- Browser-like environments when your API key handling is appropriate

No provider package pulls in a transport, retry, or streaming dependency. Zod
is an optional peer for endpoint schemas, and the MCP server intentionally ships
an MCP runtime.

## Development

```bash
pnpm install
pnpm run build
pnpm run lint
pnpm run test:run
```

Integration tests use Polly.js record/replay. Replaying tests requires no API
keys and no network.

```bash
pnpm run dev:record -- tests/integration/<file>.test.ts
pnpm run test:run tests/integration/<file>.test.ts
pnpm run ci:local
```

API keys for recording are resolved through the 1Password CLI via `.env.tpl`;
plaintext secrets are not committed.

## Using from JavaScript

TypeScript is optional. Every package compiles to plain ESM JavaScript with
`.d.ts` files alongside, so you can consume it from a `.js` or `.mjs` file
without a build step:

```js
// index.mjs
import { openai as createOpenai, withRetry } from "@apicity/openai";

const openai = createOpenai({ apiKey: process.env.OPENAI_API_KEY });
const responses = withRetry(openai.v1.responses, { retries: 2 });

const result = await responses({
  model: "gpt-5",
  input: "Write a compact status update.",
});

console.log(result.output);
```

```bash
node index.mjs
```

In a `package.json` with `"type": "module"`, plain `.js` files work the same
way. Editor autocomplete and inline docs still work because TypeScript and
modern editors read the bundled `.d.ts` files automatically.

Payload validation works without TypeScript too:

```js
const validation = openai.v1.chat.completions.schema.safeParse({
  model: "gpt-5",
  messages: [{ role: "user", content: "Hello" }],
});

if (!validation.success) {
  console.error(validation.error.issues);
}
```

Packages are ESM-only, so `require("@apicity/openai")` from CommonJS will not
work — use `import` or dynamic `await import("@apicity/openai")` from a CJS
module.

## License

MIT — see [LICENSE](LICENSE).

Based on [TetherAI](https://github.com/nbursa/TetherAI) by Nenad Bursac.
