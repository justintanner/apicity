# @apicity/simplefunctions

[![npm](https://img.shields.io/npm/v/@apicity/simplefunctions?color=cb0000)](https://www.npmjs.com/package/@apicity/simplefunctions)
[![dependencies](https://img.shields.io/badge/dependencies-1-blue)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)
[![docs](https://img.shields.io/badge/docs-docs.simplefunctions.dev-blue)](https://docs.simplefunctions.dev/api-reference/query)

SimpleFunctions Query API provider for prediction-market search.

Runtime dependencies:

- `zod@^3.24.0` — request schemas attached to every GET endpoint as `.schema`

## Installation

```bash
npm install @apicity/simplefunctions
# or
pnpm add @apicity/simplefunctions
```

## Quick Start

```typescript
import { createSimpleFunctions } from "@apicity/simplefunctions";

const simplefunctions = createSimpleFunctions({ apiKey: process.env.SIMPLEFUNCTIONS_API_KEY });
```

## API Reference

1 endpoint across 1 group. Each method mirrors an upstream URL path.

### public

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.public.query</code></b></summary>

<code>GET https://simplefunctions.dev/api/public/query{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/query)

```typescript
const res = await simplefunctions.api.public.query({
  q: "Fed rate cut",
  sources: ["kalshi", "polymarket"],
  limit: 3,
});
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
