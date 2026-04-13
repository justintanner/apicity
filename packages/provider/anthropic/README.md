# @apicity/anthropic

[![npm](https://img.shields.io/npm/v/@apicity/anthropic?color=cb0000)](https://www.npmjs.com/package/@apicity/anthropic)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)

Anthropic / Claude provider for messages, batches, models, files, and admin APIs.

## Installation

```bash
npm install @apicity/anthropic
# or
pnpm add @apicity/anthropic
```

## Quick Start

```typescript
import { anthropic as createAnthropic } from "@apicity/anthropic";

const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
```

## API Reference

26 endpoints across 4 groups. Each method mirrors an upstream URL path.

### files

<details>
<summary><code>DELETE</code> <b><code>anthropic.v1.files.del</code></b></summary>

<code>DELETE https://api.anthropic.com/v1/files/{fileId}</code>

[Upstream docs ↗](https://docs.anthropic.com/en/api)

```typescript
const res = await anthropic.v1.files.del({ /* ... */ });
```

Source: [`packages/provider/anthropic/src/anthropic.ts`](src/anthropic.ts)

</details>

<details>
<summary><code>GET</code> <b><code>anthropic.v1.files.content</code></b></summary>

<code>GET https://api.anthropic.com/v1/files/{fileId}/content</code>

[Upstream docs ↗](https://docs.anthropic.com/en/api)

```typescript
const res = await anthropic.v1.files.content({ /* ... */ });
```

Source: [`packages/provider/anthropic/src/anthropic.ts`](src/anthropic.ts)

</details>

<details>
<summary><code>GET</code> <b><code>anthropic.v1.files.list</code></b></summary>

<code>GET https://api.anthropic.com/v1/files</code>

[Upstream docs ↗](https://docs.anthropic.com/en/api)

```typescript
const res = await anthropic.v1.files.list({ /* ... */ });
```

Source: [`packages/provider/anthropic/src/anthropic.ts`](src/anthropic.ts)

</details>

<details>
<summary><code>GET</code> <b><code>anthropic.v1.files.retrieve</code></b></summary>

<code>GET https://api.anthropic.com/v1/files/{fileId}</code>

[Upstream docs ↗](https://docs.anthropic.com/en/api)

```typescript
const res = await anthropic.v1.files.retrieve({ /* ... */ });
```

Source: [`packages/provider/anthropic/src/anthropic.ts`](src/anthropic.ts)

</details>

<details>
<summary><code>POST</code> <b><code>anthropic.v1.files</code></b></summary>

<code>POST https://api.anthropic.com/v1/files</code>

[Upstream docs ↗](https://docs.anthropic.com/en/api)

```typescript
const res = await anthropic.v1.files({ /* ... */ });
```

Source: [`packages/provider/anthropic/src/anthropic.ts`](src/anthropic.ts)

</details>

### messages

<details>
<summary><code>DELETE</code> <b><code>anthropic.v1.messages.batches.del</code></b></summary>

<code>DELETE https://api.anthropic.com/v1/messages/batches/{batchId}</code>

[Upstream docs ↗](https://docs.anthropic.com/en/api)

```typescript
const res = await anthropic.v1.messages.batches.del({ /* ... */ });
```

Source: [`packages/provider/anthropic/src/anthropic.ts`](src/anthropic.ts)

</details>

<details>
<summary><code>GET</code> <b><code>anthropic.v1.messages.batches.list</code></b></summary>

<code>GET https://api.anthropic.com/v1/messages/batches</code>

[Upstream docs ↗](https://docs.anthropic.com/en/api)

```typescript
const res = await anthropic.v1.messages.batches.list({ /* ... */ });
```

Source: [`packages/provider/anthropic/src/anthropic.ts`](src/anthropic.ts)

</details>

<details>
<summary><code>GET</code> <b><code>anthropic.v1.messages.batches.results</code></b></summary>

<code>GET https://api.anthropic.com/v1/messages/batches/{batchId}/results</code>

[Upstream docs ↗](https://docs.anthropic.com/en/api)

```typescript
const res = await anthropic.v1.messages.batches.results({ /* ... */ });
```

Source: [`packages/provider/anthropic/src/anthropic.ts`](src/anthropic.ts)

</details>

<details>
<summary><code>GET</code> <b><code>anthropic.v1.messages.batches.retrieve</code></b></summary>

<code>GET https://api.anthropic.com/v1/messages/batches/{batchId}</code>

[Upstream docs ↗](https://docs.anthropic.com/en/api)

```typescript
const res = await anthropic.v1.messages.batches.retrieve({ /* ... */ });
```

Source: [`packages/provider/anthropic/src/anthropic.ts`](src/anthropic.ts)

</details>

<details>
<summary><code>POST</code> <b><code>anthropic.v1.messages</code></b></summary>

<code>POST https://api.anthropic.com/v1/messages</code>

[Upstream docs ↗](https://docs.anthropic.com/en/api)

```typescript
const res = await anthropic.v1.messages({ /* ... */ });
```

Source: [`packages/provider/anthropic/src/anthropic.ts`](src/anthropic.ts)

</details>

<details>
<summary><code>POST</code> <b><code>anthropic.v1.messages</code></b></summary>

<code>POST https://api.anthropic.com/v1/messages</code>

[Upstream docs ↗](https://docs.anthropic.com/en/api)

```typescript
const res = await anthropic.v1.messages({ /* ... */ });
```

Source: [`packages/provider/anthropic/src/anthropic.ts`](src/anthropic.ts)

</details>

<details>
<summary><code>POST</code> <b><code>anthropic.v1.messages.batches</code></b></summary>

<code>POST https://api.anthropic.com/v1/messages/batches</code>

[Upstream docs ↗](https://docs.anthropic.com/en/api)

```typescript
const res = await anthropic.v1.messages.batches({ /* ... */ });
```

Source: [`packages/provider/anthropic/src/anthropic.ts`](src/anthropic.ts)

</details>

<details>
<summary><code>POST</code> <b><code>anthropic.v1.messages.batches.cancel</code></b></summary>

<code>POST https://api.anthropic.com/v1/messages/batches/{batchId}/cancel</code>

[Upstream docs ↗](https://docs.anthropic.com/en/api)

```typescript
const res = await anthropic.v1.messages.batches.cancel({ /* ... */ });
```

Source: [`packages/provider/anthropic/src/anthropic.ts`](src/anthropic.ts)

</details>

<details>
<summary><code>POST</code> <b><code>anthropic.v1.messages.countTokens</code></b></summary>

<code>POST https://api.anthropic.com/v1/messages/count_tokens</code>

[Upstream docs ↗](https://docs.anthropic.com/en/api)

```typescript
const res = await anthropic.v1.messages.countTokens({ /* ... */ });
```

Source: [`packages/provider/anthropic/src/anthropic.ts`](src/anthropic.ts)

</details>

<details>
<summary><code>POST</code> <b><code>anthropic.v1.messages</code></b></summary>

<code>POST https://api.anthropic.com/v1/messages</code>

[Upstream docs ↗](https://docs.anthropic.com/en/api)

```typescript
const res = await anthropic.v1.messages({ /* ... */ });
```

Source: [`packages/provider/anthropic/src/anthropic.ts`](src/anthropic.ts)

</details>

<details>
<summary><code>POST</code> <b><code>anthropic.v1.messages.batches</code></b></summary>

<code>POST https://api.anthropic.com/v1/messages/batches</code>

[Upstream docs ↗](https://docs.anthropic.com/en/api)

```typescript
const res = await anthropic.v1.messages.batches({ /* ... */ });
```

Source: [`packages/provider/anthropic/src/anthropic.ts`](src/anthropic.ts)

</details>

<details>
<summary><code>POST</code> <b><code>anthropic.v1.messages.countTokens</code></b></summary>

<code>POST https://api.anthropic.com/v1/messages/count_tokens</code>

[Upstream docs ↗](https://docs.anthropic.com/en/api)

```typescript
const res = await anthropic.v1.messages.countTokens({ /* ... */ });
```

Source: [`packages/provider/anthropic/src/anthropic.ts`](src/anthropic.ts)

</details>

### models

<details>
<summary><code>GET</code> <b><code>anthropic.v1.models.list</code></b></summary>

<code>GET https://api.anthropic.com/v1/models</code>

[Upstream docs ↗](https://docs.anthropic.com/en/api)

```typescript
const res = await anthropic.v1.models.list({ /* ... */ });
```

Source: [`packages/provider/anthropic/src/anthropic.ts`](src/anthropic.ts)

</details>

<details>
<summary><code>GET</code> <b><code>anthropic.v1.models.retrieve</code></b></summary>

<code>GET https://api.anthropic.com/v1/models/{modelId}</code>

[Upstream docs ↗](https://docs.anthropic.com/en/api)

```typescript
const res = await anthropic.v1.models.retrieve({ /* ... */ });
```

Source: [`packages/provider/anthropic/src/anthropic.ts`](src/anthropic.ts)

</details>

### skills

<details>
<summary><code>DELETE</code> <b><code>anthropic.v1.skills.del</code></b></summary>

<code>DELETE https://api.anthropic.com/v1/skills/{skillId}</code>

[Upstream docs ↗](https://docs.anthropic.com/en/api)

```typescript
const res = await anthropic.v1.skills.del({ /* ... */ });
```

Source: [`packages/provider/anthropic/src/anthropic.ts`](src/anthropic.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>anthropic.v1.skills.versions.del</code></b></summary>

<code>DELETE https://api.anthropic.com/v1/skills/{skillId}/versions/{version}</code>

[Upstream docs ↗](https://docs.anthropic.com/en/api)

```typescript
const res = await anthropic.v1.skills.versions.del({ /* ... */ });
```

Source: [`packages/provider/anthropic/src/anthropic.ts`](src/anthropic.ts)

</details>

<details>
<summary><code>GET</code> <b><code>anthropic.v1.skills.list</code></b></summary>

<code>GET https://api.anthropic.com/v1/skills</code>

[Upstream docs ↗](https://docs.anthropic.com/en/api)

```typescript
const res = await anthropic.v1.skills.list({ /* ... */ });
```

Source: [`packages/provider/anthropic/src/anthropic.ts`](src/anthropic.ts)

</details>

<details>
<summary><code>GET</code> <b><code>anthropic.v1.skills.retrieve</code></b></summary>

<code>GET https://api.anthropic.com/v1/skills/{skillId}</code>

[Upstream docs ↗](https://docs.anthropic.com/en/api)

```typescript
const res = await anthropic.v1.skills.retrieve({ /* ... */ });
```

Source: [`packages/provider/anthropic/src/anthropic.ts`](src/anthropic.ts)

</details>

<details>
<summary><code>GET</code> <b><code>anthropic.v1.skills.versions.list</code></b></summary>

<code>GET https://api.anthropic.com/v1/skills/{skillId}/versions</code>

[Upstream docs ↗](https://docs.anthropic.com/en/api)

```typescript
const res = await anthropic.v1.skills.versions.list({ /* ... */ });
```

Source: [`packages/provider/anthropic/src/anthropic.ts`](src/anthropic.ts)

</details>

<details>
<summary><code>POST</code> <b><code>anthropic.v1.skills.create</code></b></summary>

<code>POST https://api.anthropic.com/v1/skills</code>

[Upstream docs ↗](https://docs.anthropic.com/en/api)

```typescript
const res = await anthropic.v1.skills.create({ /* ... */ });
```

Source: [`packages/provider/anthropic/src/anthropic.ts`](src/anthropic.ts)

</details>

<details>
<summary><code>POST</code> <b><code>anthropic.v1.skills.versions.create</code></b></summary>

<code>POST https://api.anthropic.com/v1/skills/{skillId}/versions</code>

[Upstream docs ↗](https://docs.anthropic.com/en/api)

```typescript
const res = await anthropic.v1.skills.versions.create({ /* ... */ });
```

Source: [`packages/provider/anthropic/src/anthropic.ts`](src/anthropic.ts)

</details>

## Middleware

```typescript
import { anthropic as createAnthropic, withRetry } from "@apicity/anthropic";

const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const models = withRetry(anthropic.get.v1.models, { retries: 3 });
```

## License

MIT
