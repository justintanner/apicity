# @apicity/simplefunctions

[![npm](https://img.shields.io/npm/v/@apicity/simplefunctions?color=cb0000)](https://www.npmjs.com/package/@apicity/simplefunctions)
[![dependencies](https://img.shields.io/badge/dependencies-1-blue)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)
[![docs](https://img.shields.io/badge/docs-docs.simplefunctions.dev-blue)](https://docs.simplefunctions.dev/llms.txt)

SimpleFunctions Query and Real-Time Data API provider for prediction-market search and market data.

SimpleFunctions exposes two REST surfaces here: analytical Query API calls use `https://simplefunctions.dev`, while real-time market-data calls under `simplefunctions.data.v1.*` use the separate `https://data.simplefunctions.dev/v1` data API base URL. The current public WebSocket endpoint is `wss://app.simplefunctions.dev/ws`; do not model `wss://data.simplefunctions.dev/v1/ws` as active until upstream routing changes.

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

11 endpoints across 2 groups. Each method mirrors an upstream URL path.

### data

<details>
<summary><code>GET</code> <b><code>simplefunctions.data.v1.candles</code></b></summary>

<code>GET https://data.simplefunctions.dev/v1/candles/{ticker}{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/reference/realtime-data)

```typescript
const res = await simplefunctions.data.v1.candles("KXPRESNOMD-28-GN", {
  tf: "1h",
  limit: 500,
});
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.data.v1.heartbeat</code></b></summary>

<code>GET https://data.simplefunctions.dev/v1/heartbeat</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/reference/realtime-data)

```typescript
const res = await simplefunctions.data.v1.heartbeat();
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.data.v1.markets</code></b></summary>

<code>GET https://data.simplefunctions.dev/v1/markets{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/reference/realtime-data)

```typescript
const res = await simplefunctions.data.v1.markets({
  q: "newsom",
  venue: "kalshi",
});
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.data.v1.markets.featured</code></b></summary>

<code>GET https://data.simplefunctions.dev/v1/markets/featured{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/reference/realtime-data)

```typescript
const res = await simplefunctions.data.v1.markets.featured({ n: 50 });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.data.v1.markets.retrieve</code></b></summary>

<code>GET https://data.simplefunctions.dev/v1/markets/{ticker}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/reference/realtime-data)

```typescript
const res = await simplefunctions.data.v1.markets.retrieve("KXPRESNOMD-28-GN");
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.data.v1.movers</code></b></summary>

<code>GET https://data.simplefunctions.dev/v1/movers{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/reference/realtime-data)

```typescript
const res = await simplefunctions.data.v1.movers({
  window: "1h",
  n: 50,
  minVol: 1000,
  dir: "both",
});
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.data.v1.orderbook</code></b></summary>

<code>GET https://data.simplefunctions.dev/v1/orderbook/{ticker}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/reference/realtime-data)

```typescript
const res = await simplefunctions.data.v1.orderbook("KXPRESNOMD-28-GN");
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.data.v1.search</code></b></summary>

<code>GET https://data.simplefunctions.dev/v1/search{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/reference/realtime-data)

```typescript
const res = await simplefunctions.data.v1.search({
  q: "rate cut",
  limit: 10,
  venue: "kalshi",
});
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.data.v1.snapshot</code></b></summary>

<code>GET https://data.simplefunctions.dev/v1/snapshot</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/reference/realtime-data)

```typescript
const res = await simplefunctions.data.v1.snapshot();
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.data.v1.trades</code></b></summary>

<code>GET https://data.simplefunctions.dev/v1/trades/{ticker}{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/reference/realtime-data)

```typescript
const res = await simplefunctions.data.v1.trades("KXPRESNOMD-28-GN", { limit: 50 });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

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
