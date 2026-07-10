# @apicity/zaicoding

[![npm](https://img.shields.io/npm/v/@apicity/zaicoding?color=cb0000)](https://www.npmjs.com/package/@apicity/zaicoding)
[![dependencies](https://img.shields.io/badge/dependencies-1-blue)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)

Z.ai GLM Coding Plan provider for Apicity — standalone, OpenAI-compatible chat completions plus coding-plan usage/quota monitoring.

Runtime dependencies:

- `zod@^4.4.3` — request schemas attached to every POST endpoint as `.schema`

## Installation

```bash
npm install @apicity/zaicoding
# or
pnpm add @apicity/zaicoding
```

## Quick Start

```typescript
import { createZaiCoding } from "@apicity/zaicoding";

const zaicoding = createZaiCoding({ apiKey: process.env.ZAI_CODING_PLAN_API_KEY! });
```

## API Reference

4 endpoints across 2 groups. Each method mirrors an upstream URL path.

### coding

<details>
<summary><code>POST</code> <b><code>zaicoding.api.coding.paas.v4.chat.completions</code></b></summary>

<code>POST https://api.z.ai/api/coding/paas/v4/chat/completions</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.z.ai/api-reference/llm/chat-completion)

```typescript
const res = await zaicoding.api.coding.paas.v4.chat.completions({ /* ... */ });
```

Source: [`packages/provider/zaicoding/src/zaicoding.ts`](src/zaicoding.ts)

</details>

### monitor

<details>
<summary><code>GET</code> <b><code>zaicoding.api.monitor.usage.modelUsage</code></b></summary>

<code>GET https://api.z.ai/api/monitor/usage/model-usage</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.z.ai/api-reference/introduction)

```typescript
const res = await zaicoding.api.monitor.usage.modelUsage({ /* ... */ });
```

Source: [`packages/provider/zaicoding/src/zaicoding.ts`](src/zaicoding.ts)

</details>

<details>
<summary><code>GET</code> <b><code>zaicoding.api.monitor.usage.quota.limit</code></b></summary>

<code>GET https://api.z.ai/api/monitor/usage/quota/limit</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.z.ai/api-reference/introduction)

```typescript
const res = await zaicoding.api.monitor.usage.quota.limit({ /* ... */ });
```

Source: [`packages/provider/zaicoding/src/zaicoding.ts`](src/zaicoding.ts)

</details>

<details>
<summary><code>GET</code> <b><code>zaicoding.api.monitor.usage.toolUsage</code></b></summary>

<code>GET https://api.z.ai/api/monitor/usage/tool-usage</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.z.ai/api-reference/introduction)

```typescript
const res = await zaicoding.api.monitor.usage.toolUsage({ /* ... */ });
```

Source: [`packages/provider/zaicoding/src/zaicoding.ts`](src/zaicoding.ts)

</details>

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
