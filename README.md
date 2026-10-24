# apicity

[![CI](https://github.com/justintanner/apicity/actions/workflows/ci.yml/badge.svg)](https://github.com/justintanner/apicity/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.base.json)
[![Node](https://img.shields.io/badge/Node.js-%E2%89%A518-339933?logo=nodedotjs&logoColor=white)](package.json)

One command and one function per upstream endpoint, for AI image and video
generation, LLMs, social posting, storage and market data. TypeScript, ESM,
providers that depend only on zod, a cost estimate and an opt-in pay gate for
every paid call.

## Install

```bash
npm install -g @apicity/cli
# or, without installing:
npx -y @apicity/cli@latest providers
```

Node.js 20 or newer for the CLI. Each provider is also its own package that
runs on Node 18+, Cloudflare Workers, Deno and Bun: `npm install @apicity/kie`.

## Getting started

```bash
apicity providers                 # who exists, which env var, which are set
apicity commands --provider xai   # one provider's endpoints
apicity describe xai v1.tokenizeText
apicity xai v1.tokenizeText --data '{"model":"grok-3","text":"Hello, world!"}'
```

Discovery is offline; only the call needs a key. Keys come from the
environment, an env file or 1Password: `apicity help environment`.

## Using the CLI

```bash
apicity kie api.v1.jobs.createTask --data '{"model":"minimax-h3/image-to-video","input":{...}}'
apicity commands --json | jq '.data[] | select(.paid)'   # every billed endpoint
apicity doctor                                           # the install, in twelve rows
```

Every command explains itself with `--help`. At a terminal the output is made
for reading. Piped, or with `--json`, a command writes one JSON envelope
`{ok, data}`, plus `summary` when the command sets one; `--quiet` writes the
data alone. A paid endpoint says so in `apicity describe` and bills unless the
operator arms the pay gate: [docs/paygate.md](docs/paygate.md).

## Frontier models

```bash
apicity frontier                    # the types: t2i, i2i, t2v, i2v, v2v, r2v
apicity frontier i2v                # top 10 image-to-video models, the call, and the price
apicity frontier t2i --provider kie
```

```ts
import { frontier } from "@apicity/cost";
frontier("i2v");
frontier("t2i", { provider: "fal" });
```

A committed snapshot of the Artificial Analysis leaderboards, top 10 per type,
never fetched at runtime. [docs/frontier.md](docs/frontier.md) has the current
ranking and the refresh procedure.

## Library

```ts
import { createKie } from "@apicity/kie";

const kie = createKie({ apiKey: process.env.KIE_API_KEY! });
await kie.post.api.v1.jobs.createTask({
  model: "minimax-h3/image-to-video",
  input: { prompt: "...", image_url: "..." },
});
```

Every endpoint is a plain async function with a zod `.schema`. `withRetry`,
`withFallback` and `withRateLimit` wrap any of them:
[docs/middleware.md](docs/middleware.md).

## Coding agents

```bash
apicity setup claude   # the skill plus the Claude Code plugin
apicity setup codex    # the skill Codex reads
apicity skill          # print the skill
```

Agents discover endpoints with `apicity commands` and `apicity describe`, then
call them. There is no MCP server: [MCP.md](MCP.md).

## Providers

<!-- provider-inventory:providers:start -->

<!-- prettier-ignore -->
[@apicity/machgen](packages/provider/machgen), [@apicity/openai](packages/provider/openai),
[@apicity/anthropic](packages/provider/anthropic), [@apicity/xai](packages/provider/xai),
[@apicity/fal](packages/provider/fal), [@apicity/google](packages/provider/google),
[@apicity/kie](packages/provider/kie), [@apicity/alibaba](packages/provider/alibaba),
[@apicity/binance](packages/provider/binance), [@apicity/openligadb](packages/provider/openligadb),
[@apicity/fireworks](packages/provider/fireworks), [@apicity/kimicoding](packages/provider/kimicoding),
[@apicity/elevenlabs](packages/provider/elevenlabs), [@apicity/s3](packages/provider/s3),
[@apicity/b2](packages/provider/b2), [@apicity/free-media-upload](packages/provider/free-media-upload),
[@apicity/x](packages/provider/x), [@apicity/meta](packages/provider/meta),
[@apicity/polymarket](packages/provider/polymarket), [@apicity/simplefunctions](packages/provider/simplefunctions),
[@apicity/telegram](packages/provider/telegram), [@apicity/quo](packages/provider/quo),
[@apicity/thesportsdb](packages/provider/thesportsdb), [@apicity/googleflow](packages/provider/googleflow),
[@apicity/zaicoding](packages/provider/zaicoding), [@apicity/openf1](packages/provider/openf1),
[@apicity/dropbox](packages/provider/dropbox), [@apicity/dolthub](packages/provider/dolthub),
[@apicity/youtube](packages/provider/youtube), [@apicity/cost](packages/provider/cost), [@apicity/har](packages/provider/har).

<!-- provider-inventory:providers:end -->

[docs/providers.md](docs/providers.md) says what each one covers.

## Docs

- [packages/cli/README.md](packages/cli/README.md): every command, flag, output format and exit code
- [docs/frontier.md](docs/frontier.md): the frontier ranking by type and how it is refreshed
- [docs/paygate.md](docs/paygate.md): cost estimates and the OTP pay gate
- [docs/middleware.md](docs/middleware.md): retry, fallback and rate limiting
- [docs/providers.md](docs/providers.md): what each provider package covers
- [docs/zod-compatibility.md](docs/zod-compatibility.md): Zod 3 and Zod 4 in one repository
- [MCP.md](MCP.md): migrating from `@apicity/mcp-server`

## Development

```bash
pnpm install
pnpm run build
pnpm run test:run
```

[CONTRIBUTING.md](CONTRIBUTING.md) has the gates, the provider loop and the
[recording rules](CONTRIBUTING.md#recording-rules).

## License

MIT. See [LICENSE](LICENSE). Based on
[TetherAI](https://github.com/nbursa/TetherAI).
