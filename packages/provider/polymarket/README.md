# @apicity/polymarket

[![npm](https://img.shields.io/npm/v/@apicity/polymarket?color=cb0000)](https://www.npmjs.com/package/@apicity/polymarket)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)

Polymarket public-data API provider — Gamma, Data, and CLOB market-data endpoints (no auth).

## Installation

```bash
npm install @apicity/polymarket
# or
pnpm add @apicity/polymarket
```

## Quick Start

```typescript
import { polymarket as createPolymarket } from "@apicity/polymarket";

const polymarket = createPolymarket();
```

## API Reference

1 endpoint across 1 group. Each method mirrors an upstream URL path.

### clob

<details>
<summary><code>GET</code> <b><code>polymarket.clob.time</code></b></summary>

<code>GET https://clob.polymarket.com/time</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/clob/get-server-time)

```typescript
const res = await polymarket.clob.time({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/polymarket.ts`](src/polymarket.ts)

</details>

## License

MIT
