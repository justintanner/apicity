# @apicity/google

[![npm](https://img.shields.io/npm/v/@apicity/google?color=cb0000)](https://www.npmjs.com/package/@apicity/google)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)
[![docs](https://img.shields.io/badge/docs-docs.cloud.google.com-blue)](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/reference/express-mode/rest/v1/publishers.models/generateContent)

Google Gemini provider for express-mode generateContent.

## Installation

```bash
npm install @apicity/google
# or
pnpm add @apicity/google
```

## Quick Start

```typescript
import { createGoogle } from "@apicity/google";

const google = createGoogle({ apiKey: process.env.GOOGLE_API_KEY! });
```

## API Reference

2 endpoints across 1 group. Each method mirrors an upstream URL path.

### publishers

<details>
<summary><code>POST</code> <b><code>google.v1.publishers.google.models.countTokens</code></b></summary>

<code>POST https://aiplatform.googleapis.com/v1/publishers/google/models/{model}:countTokens</code>

[Upstream docs ↗](https://docs.cloud.google.com/gemini-enterprise-agent-platform/reference/express-mode/rest/v1/publishers.models/countTokens)

```typescript
const res = await google.v1.publishers.google.models.countTokens(
  "gemini-2.5-flash",
  {
    contents: [{ role: "user", parts: [{ text: "How does AI work?" }] }],
  }
);
```

Source: [`packages/provider/google/src/google.ts`](src/google.ts)

</details>

<details>
<summary><code>POST</code> <b><code>google.v1.publishers.google.models.generateContent</code></b></summary>

<code>POST https://aiplatform.googleapis.com/v1/publishers/google/models/{model}:generateContent</code>

[Upstream docs ↗](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/reference/express-mode/rest/v1/publishers.models/generateContent)

```typescript
const res = await google.v1.publishers.google.models.generateContent(
  "gemini-2.5-flash",
  {
    contents: [{ role: "user", parts: [{ text: "How does AI work?" }] }],
  }
);
```

Source: [`packages/provider/google/src/google.ts`](src/google.ts)

</details>

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
