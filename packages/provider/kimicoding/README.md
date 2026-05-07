# @apicity/kimicoding

[![npm](https://img.shields.io/npm/v/@apicity/kimicoding?color=cb0000)](https://www.npmjs.com/package/@apicity/kimicoding)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)

Kimi for Coding provider for Apicity - completely standalone with Anthropic Messages API format, streaming-first, and built-in middleware.

## Installation

```bash
npm install @apicity/kimicoding
# or
pnpm add @apicity/kimicoding
```

## Quick Start

```typescript
import { kimicoding as createKimicoding } from "@apicity/kimicoding";

const kimicoding = createKimicoding({ apiKey: process.env.KIMICODING_API_KEY! });
```

## API Reference

5 endpoints across 1 group. Each method mirrors an upstream URL path.

### coding

<details>
<summary><code>GET</code> <b><code>kimicoding.coding.v1.models</code></b></summary>

<code>GET https://api.kimi.com/coding/v1/models</code>

[Upstream docs ↗](https://platform.moonshot.ai/docs)

```typescript
const res = await kimicoding.coding.v1.models({ /* ... */ });
```

Source: [`packages/provider/kimicoding/src/kimicoding.ts`](src/kimicoding.ts)

</details>

<details>
<summary><code>POST</code> <b><code>kimicoding.coding.v1.countTokens</code></b></summary>

<code>POST https://api.kimi.com/coding/v1/tokens/count</code>

[Upstream docs ↗](https://platform.moonshot.ai/docs)

```typescript
const res = await kimicoding.coding.v1.countTokens({ /* ... */ });
```

Source: [`packages/provider/kimicoding/src/kimicoding.ts`](src/kimicoding.ts)

</details>

<details>
<summary><code>POST</code> <b><code>kimicoding.coding.v1.embeddings</code></b></summary>

<code>POST https://api.kimi.com/coding/v1/embeddings</code>

[Upstream docs ↗](https://platform.moonshot.ai/docs)

```typescript
const res = await kimicoding.coding.v1.embeddings({ /* ... */ });
```

Source: [`packages/provider/kimicoding/src/kimicoding.ts`](src/kimicoding.ts)

</details>

<details>
<summary><code>POST</code> <b><code>kimicoding.coding.v1.messages</code></b></summary>

<code>POST https://api.kimi.com/coding/v1/messages</code>

[Upstream docs ↗](https://platform.moonshot.ai/docs)

```typescript
const res = await kimicoding.coding.v1.messages({ /* ... */ });
```

Source: [`packages/provider/kimicoding/src/kimicoding.ts`](src/kimicoding.ts)

</details>

<details>
<summary><code>POST</code> <b><code>kimicoding.coding.v1.messages</code></b></summary>

<code>POST https://api.kimi.com/coding/v1/messages</code>

[Upstream docs ↗](https://platform.moonshot.ai/docs)

```typescript
const res = await kimicoding.coding.v1.messages({ /* ... */ });
```

Source: [`packages/provider/kimicoding/src/kimicoding.ts`](src/kimicoding.ts)

</details>

## Middleware

```typescript
import { kimicoding as createKimicoding, withRetry } from "@apicity/kimicoding";

const kimicoding = createKimicoding({ apiKey: process.env.KIMICODING_API_KEY! });
const models = withRetry(kimicoding.get.v1.models, { retries: 3 });
```

## License

MIT
