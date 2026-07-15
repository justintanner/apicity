# @apicity/quo

[![npm](https://img.shields.io/npm/v/@apicity/quo?color=cb0000)](https://www.npmjs.com/package/@apicity/quo)
[![dependencies](https://img.shields.io/badge/dependencies-1-blue)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)
[![docs](https://img.shields.io/badge/docs-quo.com-blue)](https://www.quo.com/docs/mdx/api-reference/messages/send-a-text-message)

Quo API provider for sending SMS text messages.

Runtime dependencies:

- `zod@^4.4.3` — request schemas attached to every POST endpoint as `.schema`

## Installation

```bash
npm install @apicity/quo
# or
pnpm add @apicity/quo
```

## Quick Start

```typescript
import { createQuo } from "@apicity/quo";

const quo = createQuo({ apiKey: process.env.QUO_API_KEY! });
```

## Send A Message

```typescript
import { createQuo } from "@apicity/quo";

const quo = createQuo({ apiKey: process.env.QUO_API_KEY! });

const response = await quo.v1.messages({
  content: "Hello from Quo",
  from: "+15550100001",
  to: ["+15550100002"],
});

console.log(response.data.conversationId);
```

The request schema is available as `quo.v1.messages.schema`. The client
uses the raw API key as the `Authorization` header, accepts an optional
`AbortSignal`, clears request timers, and redacts credentials and phone
numbers from thrown error messages. Prefer `from`; `phoneNumberId` is
retained only as a deprecated request alias.

## API Reference

1 endpoint across 1 group. Each method mirrors an upstream URL path.

### messages

<details>
<summary><code>POST</code> <b><code>quo.v1.messages</code></b></summary>

<code>POST https://api.quo.com/v1/messages</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://www.quo.com/docs/mdx/api-reference/messages/send-a-text-message)

```typescript
const res = await quo.v1.messages({ /* ... */ });
```

Source: [`packages/provider/quo/src/quo.ts`](src/quo.ts)

</details>

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
