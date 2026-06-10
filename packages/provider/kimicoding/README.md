# @apicity/kimicoding

[![npm](https://img.shields.io/npm/v/@apicity/kimicoding?color=cb0000)](https://www.npmjs.com/package/@apicity/kimicoding)
[![dependencies](https://img.shields.io/badge/dependencies-1-blue)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)

Kimi for Coding provider for Apicity - completely standalone with Anthropic Messages API format, streaming-first, and built-in middleware.

Runtime dependencies:

- `zod@^3.24.0` — request schemas attached to every POST endpoint as `.schema`

## Installation

```bash
npm install @apicity/kimicoding
# or
pnpm add @apicity/kimicoding
```

## Quick Start

```typescript
import { createKimiCoding } from "@apicity/kimicoding";

const kimicoding = createKimiCoding({ apiKey: process.env.KIMICODING_API_KEY! });
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
import { createKimiCoding, withRetry } from "@apicity/kimicoding";

const kimicoding = createKimiCoding({ apiKey: process.env.KIMICODING_API_KEY! });
const models = withRetry(kimicoding.get.v1.models, { retries: 3 });
```

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
