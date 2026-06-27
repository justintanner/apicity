# @apicity/zaicoding

[![npm](https://img.shields.io/npm/v/@apicity/zaicoding?color=cb0000)](https://www.npmjs.com/package/@apicity/zaicoding)
[![dependencies](https://img.shields.io/badge/dependencies-1-blue)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)

Z.ai GLM Coding Plan provider for Apicity — OpenAI-compatible chat completions plus coding-plan usage and quota monitoring.

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

const zaicoding = createZaiCoding({
  apiKey: process.env.ZAI_CODING_PLAN_API_KEY!,
});
```

## API Reference

4 endpoints across 2 groups. Each method mirrors an upstream URL path.

### post

<details>
<summary><code>POST</code> <b><code>zaicoding.post.api.coding.paas.v4.chat.completions</code></b></summary>

<code>POST https://api.z.ai/api/coding/paas/v4/chat/completions</code>

[Upstream docs ↗](https://docs.z.ai/api-reference/llm/chat-completion)

```typescript
const res = await zaicoding.post.api.coding.paas.v4.chat.completions({
  model: "glm-4-flash",
  messages: [{ role: "user", content: "Say hello." }],
});
console.log(res.choices[0].message.content);
```

Source: [`packages/provider/zaicoding/src/zaicoding.ts`](src/zaicoding.ts)

</details>

### get

<details>
<summary><code>GET</code> <b><code>zaicoding.get.api.monitor.usage.quota.limit</code></b></summary>

<code>GET https://api.z.ai/api/monitor/usage/quota/limit</code>

[Upstream docs ↗](https://docs.z.ai/api-reference/introduction)

```typescript
const res = await zaicoding.get.api.monitor.usage.quota.limit();
console.log(res.data?.level, res.data?.limits);
```

Source: [`packages/provider/zaicoding/src/zaicoding.ts`](src/zaicoding.ts)

</details>

<details>
<summary><code>GET</code> <b><code>zaicoding.get.api.monitor.usage.modelUsage</code></b></summary>

<code>GET https://api.z.ai/api/monitor/usage/model-usage</code>

[Upstream docs ↗](https://docs.z.ai/api-reference/introduction)

```typescript
const res = await zaicoding.get.api.monitor.usage.modelUsage();
console.log(res.data?.totalUsage);
```

Source: [`packages/provider/zaicoding/src/zaicoding.ts`](src/zaicoding.ts)

</details>

<details>
<summary><code>GET</code> <b><code>zaicoding.get.api.monitor.usage.toolUsage</code></b></summary>

<code>GET https://api.z.ai/api/monitor/usage/tool-usage</code>

[Upstream docs ↗](https://docs.z.ai/api-reference/introduction)

```typescript
const res = await zaicoding.get.api.monitor.usage.toolUsage();
console.log(res.data?.totalUsage);
```

Source: [`packages/provider/zaicoding/src/zaicoding.ts`](src/zaicoding.ts)

</details>
