# @apicity/nunchux

[![npm](https://img.shields.io/npm/v/@apicity/nunchux?color=cb0000)](https://www.npmjs.com/package/@apicity/nunchux)
[![dependencies](https://img.shields.io/badge/dependencies-1-blue)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)
[![docs](https://img.shields.io/badge/docs-docs.nunchux.ai-blue)](https://docs.nunchux.ai/credits-pricing)

Nunchux AI media generation API provider.

Nunchux account credits and plan limits. `v1.credits()` is free and takes no job slot, but counts toward the request rate limit. Authentication uses `Authorization: Bearer`. `NunchuxError` preserves the HTTP status, error code and body across standard and partner errors.

Runtime dependencies:

- `zod@^4.6.6` — reserved for request schemas; the credits read takes no parameters

## Installation

```bash
npm install @apicity/nunchux
# or
pnpm add @apicity/nunchux
```

## Quick Start

```typescript
import { createNunchux } from "@apicity/nunchux";

const nunchux = createNunchux({ apiKey: process.env.NUNCHUX_API_KEY! });
```

## API Reference

2 endpoints across 2 groups. Each method mirrors an upstream URL path.

### alibaba

<details>
<summary><code>GET</code> <b><code>nunchux.v1.alibaba.tasks</code></b></summary>

<code>GET https://api.nunchux.com/v1/alibaba/tasks/{taskId}</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://docs.nunchux.ai/partner-models/wan)

```typescript
const res = await nunchux.v1.alibaba.tasks({ /* ... */ });
```

Source: [`packages/provider/nunchux/src/nunchux.ts`](src/nunchux.ts)

</details>

### credits

<details>
<summary><code>GET</code> <b><code>nunchux.v1.credits</code></b></summary>

<code>GET https://api.nunchux.com/v1/credits</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://docs.nunchux.ai/credits-pricing)

```typescript
const res = await nunchux.v1.credits();
```

Source: [`packages/provider/nunchux/src/nunchux.ts`](src/nunchux.ts)

</details>

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
