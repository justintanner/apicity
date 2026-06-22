# @apicity/simplefunctions

[![npm](https://img.shields.io/npm/v/@apicity/simplefunctions?color=cb0000)](https://www.npmjs.com/package/@apicity/simplefunctions)
[![dependencies](https://img.shields.io/badge/dependencies-1-blue)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)
[![docs](https://img.shields.io/badge/docs-docs.simplefunctions.dev-blue)](https://docs.simplefunctions.dev/api-reference/public-market-data)

SimpleFunctions public analytical and real-time data API provider for prediction-market data.

SimpleFunctions exposes two REST surfaces here: analytical Query API calls use `https://simplefunctions.dev`, while real-time market-data calls under `simplefunctions.data.v1.*` use the separate `https://data.simplefunctions.dev/v1` data API base URL. `simplefunctions.api.public.market({ ticker })` mirrors `sf inspect <ticker> --json`; pass `depth: true` for the public orderbook view used by `sf book <ticker> --json`. The current public WebSocket endpoint is `wss://app.simplefunctions.dev/ws`; do not model `wss://data.simplefunctions.dev/v1/ws` as active until upstream routing changes.

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

## Public Market APIs

`simplefunctions.api.public.*` mirrors the hosted `/api/public/*`
surface on `https://simplefunctions.dev`. Most basic reads work without
an API key. Passing `createSimpleFunctions({ apiKey })` adds the
`Authorization: Bearer ...` header and may unlock higher rate limits,
higher model tiers, or user-specific overlays on routes that support
them.

Most public routes are CDN cached with `Cache-Control: public,
s-maxage=N`; route TTLs vary. Common TTLs are: markets, scan, and
screen at 60 seconds; query, query-gov, and query-econ at 5-10 minutes
in memory plus 5 minute CDN stale-while-revalidate; index and regime at
30 seconds; legislation and congress members at 1 hour ISR.

| Group | Methods | Purpose |
|-------|---------|---------|
| Markets | `markets`, `newmarkets`, `scan`, `screen`, `screenByTickers`, `search`, `market`, `market.history`, `marketMicrostructureHistory`, `liveTickers`, `market.candles` | Market universe, recently listed markets, keyword/series/market scans, indicator screens, explicit ticker screens, search, detail, history, spread/depth/flow history, live-priced tickers, and OHLCV candles. |
| Cross-venue | `crossVenue.pairs`, `crossVenue.stats` | Kalshi to Polymarket pairs, pair counts, and confidence distribution. |
| Regime and index | `regime.scan`, `index`, `index.history`, `calibration` | Current regime labels, SimpleFunctions Index v2 gauges, index history, and calibration. |
| Probability index | `odds`, `oddsMd` | Liquidity-weighted YES probability snapshot for the `/odds` page, refreshed every 15 minutes; `oddsMd` is the Markdown variant for agents, capped at 500 slugs upstream. |
| Calendar and milestones | `calendar`, `yieldCurves`, `yieldCurves.event` | Upcoming resolutions and event yield curves. |
| Liquidity and contagion | `liquidityByTheme`, `contagion` | Liquidity grouped by theme and lagging related markets. |
| Government data | `queryGov`, `legislation`, `legislation.byBillId`, `congress.members`, `congress.member` | Congress-mirror-backed bill, member, and treaty search plus bill/member detail. |
| Economic data | `queryEcon`, `fred`, `databento`, `tradMarkets` | FRED-mirror-backed series search, FRED details, Databento traditional markets, and traditional market anchors. |
| Content | `query`, `topic`, `answer`, `glossary`, `glossary.entry`, `guide`, `highlights`, `briefing`, `diff`, `discuss` | Headline cross-venue search, topic and stable answer data, glossary, agent guide, editorial highlights, briefing, daily diff, and discussion topics. |
| Skills | `skills`, `skill` | Public skill catalog and one skill by slug. |
| Theses and opinions | `theses`, `thesis`, `opinions`, `opinions.entry` | Public theses and editorial opinions. |
| Technicals | `technicals`, `technicals.entry` | Technical guides and one guide by slug. |
| Ideas | `ideas`, `ideas.byId` | Trade ideas and one idea by id. |
| Context | `context` | Global market context without thesis payloads. |

### Market candles

`simplefunctions.api.public.market.candles` is the hosted API mapping for
the strict `market.candles` SDK/Agent contract. The Vercel API route
proxies to the terminal/Fly candle service and normalizes the response
for SDK consumers.

```typescript
const candles = await simplefunctions.api.public.market.candles({
  ticker: "KXRATECUT-26DEC31",
  venue: "kalshi",
  timeframe: "1m",
  limit: 500,
});
```

| Parameter | Values | Notes |
|-----------|--------|-------|
| `venue` | `kalshi`, `polymarket` | Optional. Use it when the ticker or id is ambiguous. |
| `timeframe` / `tf` | `1m`, `5m`, `15m`, `1h`, `1d` | Default is `1m`. |
| `limit` | number | Default is 500, max is 2000 upstream. |

The probability index routes accept `category`, `band`, and `limit`.
`band` can be `mid` for probabilities near 50% or `moving` for recently
shifted questions.

`GET /api/public/regime/history` is deprecated and returns `410 Gone`.
Use `regime.scan` for current regime labels and
`marketMicrostructureHistory` for spread/depth history.

## API Reference

73 endpoints across 6 groups. Each method mirrors an upstream URL path.

### agent

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.agent.feed</code></b></summary>

<code>GET https://simplefunctions.dev/api/agent/feed/{topic}{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/agent)

```typescript
const res = await simplefunctions.api.agent.feed({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.agent.inspect</code></b></summary>

<code>GET https://simplefunctions.dev/api/agent/inspect/{ticker}{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/agent)

```typescript
const res = await simplefunctions.api.agent.inspect({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.agent.world</code></b></summary>

<code>GET https://simplefunctions.dev/api/agent/world{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/world-state)

```typescript
const res = await simplefunctions.api.agent.world({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.agent.world.delta</code></b></summary>

<code>GET https://simplefunctions.dev/api/agent/world/delta{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/world-state)

```typescript
const res = await simplefunctions.api.agent.world.delta({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.agent.world.feed</code></b></summary>

<code>GET https://simplefunctions.dev/api/agent/world/feed</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/world-state)

```typescript
const res = await simplefunctions.api.agent.world.feed({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.agent.world.path</code></b></summary>

<code>GET https://simplefunctions.dev/api/agent/world/{path}{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/world-state)

```typescript
const res = await simplefunctions.api.agent.world.path({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

### calibration

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.calibration</code></b></summary>

<code>GET https://simplefunctions.dev/api/calibration{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/index-regime)

```typescript
const res = await simplefunctions.api.calibration({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

### changes

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.changes</code></b></summary>

<code>GET https://simplefunctions.dev/api/changes{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/reference/daily-data)

```typescript
const res = await simplefunctions.api.changes({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

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

### edges

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.edges</code></b></summary>

<code>GET https://simplefunctions.dev/api/edges{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/index-regime)

```typescript
const res = await simplefunctions.api.edges({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

### public

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.public.answer</code></b></summary>

<code>GET https://simplefunctions.dev/api/public/answer/{slug}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/public-market-data)

```typescript
const res = await simplefunctions.api.public.answer({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.public.briefing</code></b></summary>

<code>GET https://simplefunctions.dev/api/public/briefing{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/reference/daily-data)

```typescript
const res = await simplefunctions.api.public.briefing({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.public.calendar</code></b></summary>

<code>GET https://simplefunctions.dev/api/public/calendar{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/index-regime)

```typescript
const res = await simplefunctions.api.public.calendar({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.public.calibration</code></b></summary>

<code>GET https://simplefunctions.dev/api/public/calibration{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/index-regime)

```typescript
const res = await simplefunctions.api.public.calibration({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.public.congress.member</code></b></summary>

<code>GET https://simplefunctions.dev/api/public/congress/member/{id}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/public-market-data)

```typescript
const res = await simplefunctions.api.public.congress.member({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.public.congress.members</code></b></summary>

<code>GET https://simplefunctions.dev/api/public/congress/members{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/public-market-data)

```typescript
const res = await simplefunctions.api.public.congress.members({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.public.contagion</code></b></summary>

<code>GET https://simplefunctions.dev/api/public/contagion{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/public-market-data)

```typescript
const res = await simplefunctions.api.public.contagion({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.public.context</code></b></summary>

<code>GET https://simplefunctions.dev/api/public/context{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/reference/daily-data)

```typescript
const res = await simplefunctions.api.public.context({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.public.crossVenue.pairs</code></b></summary>

<code>GET https://simplefunctions.dev/api/public/cross-venue/pairs{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/public-market-data)

```typescript
const res = await simplefunctions.api.public.crossVenue.pairs({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.public.crossVenue.stats</code></b></summary>

<code>GET https://simplefunctions.dev/api/public/cross-venue/stats{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/public-market-data)

```typescript
const res = await simplefunctions.api.public.crossVenue.stats({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.public.databento</code></b></summary>

<code>GET https://simplefunctions.dev/api/public/databento{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/public-market-data)

```typescript
const res = await simplefunctions.api.public.databento({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.public.diff</code></b></summary>

<code>GET https://simplefunctions.dev/api/public/diff{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/public-market-data)

```typescript
const res = await simplefunctions.api.public.diff({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>POST</code> <b><code>simplefunctions.api.public.discuss</code></b></summary>

<code>POST https://simplefunctions.dev/api/public/discuss</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/public-market-data)

```typescript
const res = await simplefunctions.api.public.discuss({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.public.fred</code></b></summary>

<code>GET https://simplefunctions.dev/api/public/fred{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/gov-econ)

```typescript
const res = await simplefunctions.api.public.fred({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.public.glossary</code></b></summary>

<code>GET https://simplefunctions.dev/api/public/glossary{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/reference/daily-data)

```typescript
const res = await simplefunctions.api.public.glossary({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.public.glossary.entry</code></b></summary>

<code>GET https://simplefunctions.dev/api/public/glossary/{slug}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/reference/daily-data)

```typescript
const res = await simplefunctions.api.public.glossary.entry({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.public.guide</code></b></summary>

<code>GET https://simplefunctions.dev/api/public/guide</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/public-market-data)

```typescript
const res = await simplefunctions.api.public.guide({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.public.highlights</code></b></summary>

<code>GET https://simplefunctions.dev/api/public/highlights{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/public-market-data)

```typescript
const res = await simplefunctions.api.public.highlights({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.public.ideas</code></b></summary>

<code>GET https://simplefunctions.dev/api/public/ideas{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/reference/daily-data)

```typescript
const res = await simplefunctions.api.public.ideas({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.public.ideas.byId</code></b></summary>

<code>GET https://simplefunctions.dev/api/public/ideas/{id}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/reference/daily-data)

```typescript
const res = await simplefunctions.api.public.ideas.byId({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.public.index</code></b></summary>

<code>GET https://simplefunctions.dev/api/public/index</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/index-regime)

```typescript
const res = await simplefunctions.api.public.index({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.public.index.history</code></b></summary>

<code>GET https://simplefunctions.dev/api/public/index/history{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/index-regime)

```typescript
const res = await simplefunctions.api.public.index.history({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.public.legislation</code></b></summary>

<code>GET https://simplefunctions.dev/api/public/legislation{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/gov-econ)

```typescript
const res = await simplefunctions.api.public.legislation({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.public.legislation.byBillId</code></b></summary>

<code>GET https://simplefunctions.dev/api/public/legislation/{billId}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/gov-econ)

```typescript
const res = await simplefunctions.api.public.legislation.byBillId({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.public.liquidityByTheme</code></b></summary>

<code>GET https://simplefunctions.dev/api/public/liquidity-by-theme{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/public-market-data)

```typescript
const res = await simplefunctions.api.public.liquidityByTheme({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.public.liveTickers</code></b></summary>

<code>GET https://simplefunctions.dev/api/public/live-tickers{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/public-market-data)

```typescript
const res = await simplefunctions.api.public.liveTickers({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.public.market</code></b></summary>

<code>GET https://simplefunctions.dev/api/public/market/{ticker}{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/market-detail)

```typescript
const res = await simplefunctions.api.public.market({
  ticker: "KXRATECUT-26DEC31",
  depth: true,
});
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.public.market.candles</code></b></summary>

<code>GET https://simplefunctions.dev/api/public/market/{ticker}/candles{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/public-market-data)

```typescript
const res = await simplefunctions.api.public.market.candles({
  ticker: "KXRATECUT-26DEC31",
  venue: "kalshi",
  timeframe: "1m",
  limit: 500,
});
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.public.market.history</code></b></summary>

<code>GET https://simplefunctions.dev/api/public/market/{ticker}/history</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/market-detail)

```typescript
const res = await simplefunctions.api.public.market.history({
  ticker: "KXRATECUT-26DEC31",
});
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.public.marketMicrostructureHistory</code></b></summary>

<code>GET https://simplefunctions.dev/api/public/market-microstructure-history{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/public-market-data)

```typescript
const res = await simplefunctions.api.public.marketMicrostructureHistory({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.public.markets</code></b></summary>

<code>GET https://simplefunctions.dev/api/public/markets{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/public-market-data)

```typescript
const res = await simplefunctions.api.public.markets({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.public.newmarkets</code></b></summary>

<code>GET https://simplefunctions.dev/api/public/newmarkets{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/public-market-data)

```typescript
const res = await simplefunctions.api.public.newmarkets({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.public.odds</code></b></summary>

<code>GET https://simplefunctions.dev/api/public/odds{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/public-market-data)

```typescript
const res = await simplefunctions.api.public.odds({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.public.oddsMd</code></b></summary>

<code>GET https://simplefunctions.dev/api/public/odds.md{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/public-market-data)

```typescript
const res = await simplefunctions.api.public.oddsMd({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.public.opinions</code></b></summary>

<code>GET https://simplefunctions.dev/api/public/opinions{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/public-market-data)

```typescript
const res = await simplefunctions.api.public.opinions({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.public.opinions.entry</code></b></summary>

<code>GET https://simplefunctions.dev/api/public/opinions/{slug}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/public-market-data)

```typescript
const res = await simplefunctions.api.public.opinions.entry({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

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

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.public.queryEcon</code></b></summary>

<code>GET https://simplefunctions.dev/api/public/query-econ{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/gov-econ)

```typescript
const res = await simplefunctions.api.public.queryEcon({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.public.queryGov</code></b></summary>

<code>GET https://simplefunctions.dev/api/public/query-gov{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/gov-econ)

```typescript
const res = await simplefunctions.api.public.queryGov({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.public.regime.scan</code></b></summary>

<code>GET https://simplefunctions.dev/api/public/regime/scan{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/index-regime)

```typescript
const res = await simplefunctions.api.public.regime.scan({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.public.scan</code></b></summary>

<code>GET https://simplefunctions.dev/api/public/scan{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/public-market-data)

```typescript
const res = await simplefunctions.api.public.scan({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.public.screen</code></b></summary>

<code>GET https://simplefunctions.dev/api/public/screen{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/public-market-data)

```typescript
const res = await simplefunctions.api.public.screen({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.public.screenByTickers</code></b></summary>

<code>GET https://simplefunctions.dev/api/public/screen-by-tickers{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/public-market-data)

```typescript
const res = await simplefunctions.api.public.screenByTickers({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.public.search</code></b></summary>

<code>GET https://simplefunctions.dev/api/public/search{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/public-market-data)

```typescript
const res = await simplefunctions.api.public.search({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.public.skill</code></b></summary>

<code>GET https://simplefunctions.dev/api/public/skill/{slug}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/public-market-data)

```typescript
const res = await simplefunctions.api.public.skill({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.public.skills</code></b></summary>

<code>GET https://simplefunctions.dev/api/public/skills{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/public-market-data)

```typescript
const res = await simplefunctions.api.public.skills({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.public.technicals</code></b></summary>

<code>GET https://simplefunctions.dev/api/public/technicals{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/public-market-data)

```typescript
const res = await simplefunctions.api.public.technicals({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.public.technicals.entry</code></b></summary>

<code>GET https://simplefunctions.dev/api/public/technicals/{slug}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/public-market-data)

```typescript
const res = await simplefunctions.api.public.technicals.entry({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.public.theses</code></b></summary>

<code>GET https://simplefunctions.dev/api/public/theses{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/reference/daily-data)

```typescript
const res = await simplefunctions.api.public.theses({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.public.thesis</code></b></summary>

<code>GET https://simplefunctions.dev/api/public/thesis/{slug}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/reference/daily-data)

```typescript
const res = await simplefunctions.api.public.thesis({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.public.topic</code></b></summary>

<code>GET https://simplefunctions.dev/api/public/topic/{slug}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/public-market-data)

```typescript
const res = await simplefunctions.api.public.topic({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.public.tradMarkets</code></b></summary>

<code>GET https://simplefunctions.dev/api/public/trad-markets{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/public-market-data)

```typescript
const res = await simplefunctions.api.public.tradMarkets({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.public.yieldCurves</code></b></summary>

<code>GET https://simplefunctions.dev/api/public/yield-curves</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/public-market-data)

```typescript
const res = await simplefunctions.api.public.yieldCurves({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.public.yieldCurves.event</code></b></summary>

<code>GET https://simplefunctions.dev/api/public/yield-curves/{event}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/public-market-data)

```typescript
const res = await simplefunctions.api.public.yieldCurves.event({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
