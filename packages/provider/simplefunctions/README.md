# @apicity/simplefunctions

[![npm](https://img.shields.io/npm/v/@apicity/simplefunctions?color=cb0000)](https://www.npmjs.com/package/@apicity/simplefunctions)
[![dependencies](https://img.shields.io/badge/dependencies-1-blue)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)
[![docs](https://img.shields.io/badge/docs-docs.simplefunctions.dev-blue)](https://docs.simplefunctions.dev/api-reference/public-market-data)

SimpleFunctions analytical, authenticated, and real-time data API provider for prediction-market data.

SimpleFunctions exposes two REST surfaces here: analytical Query API calls use `https://simplefunctions.dev`, while real-time market-data calls under `simplefunctions.data.v1.*` use the separate `https://data.simplefunctions.dev/v1` data API base URL. Authenticated dashboard, thesis, portfolio, alerting, tool, and runtime routes also live under `simplefunctions.api.*` on the analytical host. `simplefunctions.api.public.market({ ticker })` mirrors `sf inspect <ticker> --json`; pass `depth: true` for the public orderbook view used by `sf book <ticker> --json`. The current public WebSocket endpoint is `wss://app.simplefunctions.dev/ws`; do not model `wss://data.simplefunctions.dev/v1/ws` as active until upstream routing changes.

Runtime dependencies:

- `zod@^4.4.3` — request schemas attached to provider endpoints as `.schema`

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

## Authenticated APIs

Passing `createSimpleFunctions({ apiKey })` adds
`Authorization: Bearer ...` to authenticated dashboard, thesis,
portfolio, alerting, tool, and runtime routes. The CLI-auth and
session-oriented Market Watch routes can also be called with a custom
`fetch` implementation that supplies browser/session cookies instead of
a local API key.

| Group | Methods | Purpose |
|-------|---------|---------|
| API keys and auth | `api.keys`, `api.keys.create`, `api.keys.delete`, `api.auth.cli.*`, `api.signup` | API-key lifecycle, CLI login handshakes, and signup. |
| Account | `api.feed`, `api.dashboard.usage` | Authenticated feed and usage telemetry. |
| Theses | `api.thesis.*` | Create, retrieve, update, fork, evaluate, augment, publish, and attach positions, strategies, videos, or context to private theses. |
| Portfolio | `api.portfolio.*` | Portfolio state, config, ticks, trades, ledger imports, fills, positions, activity, attribution, risk, views, strategy, secrets, and triggers. |
| Execution | `api.intents.*`, `api.runtime.exec.*` | Execution-intent lifecycle and runtime execution triggers. |
| Watch and alerts | `api.watch.*`, `api.alertRules.*`, `api.webhookEndpoints.*`, `api.alertDeliveries.*` | Watch objects, alert rules, webhook endpoints, delivery history, and test/refresh actions. |
| Tools | `api.contracts.tools`, `api.tools`, `api.skills`, `api.prompt`, `api.mcp.*`, `api.proxy.*` | Tool catalogs, prompt payloads, MCP transport, and raw speech proxy responses. |
| Market Watch | `api.dashboard2.marketWatchV2`, `api.dashboard2.marketWatch.panels.*` | Session-backed Market Watch dashboard reads and panel CRUD. |

## API Reference

188 endpoints across 27 groups. Each method mirrors an upstream URL path.

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

### alertDeliveries

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.alertDeliveries</code></b></summary>

<code>GET https://simplefunctions.dev/api/alert-deliveries{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/watch-alerts)

```typescript
const res = await simplefunctions.api.alertDeliveries({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

### alertRules

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.alertRules</code></b></summary>

<code>GET https://simplefunctions.dev/api/alert-rules{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/watch-alerts)

```typescript
const res = await simplefunctions.api.alertRules({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>POST</code> <b><code>simplefunctions.api.alertRules.create</code></b></summary>

<code>POST https://simplefunctions.dev/api/alert-rules</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/watch-alerts)

```typescript
const res = await simplefunctions.api.alertRules.create({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>simplefunctions.api.alertRules</code></b></summary>

<code>DELETE https://simplefunctions.dev/api/alert-rules/{id}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/watch-alerts)

```typescript
const res = await simplefunctions.api.alertRules({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.alertRules.retrieve</code></b></summary>

<code>GET https://simplefunctions.dev/api/alert-rules/{id}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/watch-alerts)

```typescript
const res = await simplefunctions.api.alertRules.retrieve({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>POST</code> <b><code>simplefunctions.api.alertRules.test</code></b></summary>

<code>POST https://simplefunctions.dev/api/alert-rules/{id}/test</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/watch-alerts)

```typescript
const res = await simplefunctions.api.alertRules.test({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>PATCH</code> <b><code>simplefunctions.api.alertRules.update</code></b></summary>

<code>PATCH https://simplefunctions.dev/api/alert-rules/{id}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/watch-alerts)

```typescript
const res = await simplefunctions.api.alertRules.update({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

### auth

<details>
<summary><code>POST</code> <b><code>simplefunctions.api.auth.cli</code></b></summary>

<code>POST https://simplefunctions.dev/api/auth/cli</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/keys)

```typescript
const res = await simplefunctions.api.auth.cli({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>POST</code> <b><code>simplefunctions.api.auth.cli.complete</code></b></summary>

<code>POST https://simplefunctions.dev/api/auth/cli/complete</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/keys)

```typescript
const res = await simplefunctions.api.auth.cli.complete({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.auth.cli.poll</code></b></summary>

<code>GET https://simplefunctions.dev/api/auth/cli/poll{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/keys)

```typescript
const res = await simplefunctions.api.auth.cli.poll({ /* ... */ });
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

### contracts

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.contracts.tools</code></b></summary>

<code>GET https://simplefunctions.dev/api/contracts/tools</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/contract-tools)

```typescript
const res = await simplefunctions.api.contracts.tools({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

### dashboard

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.dashboard.usage</code></b></summary>

<code>GET https://simplefunctions.dev/api/dashboard/usage{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/account)

```typescript
const res = await simplefunctions.api.dashboard.usage({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

### dashboard2

<details>
<summary><code>POST</code> <b><code>simplefunctions.api.dashboard2.marketWatch.panels.create</code></b></summary>

<code>POST https://simplefunctions.dev/api/dashboard2/market-watch/panels</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/market-watch)

```typescript
const res = await simplefunctions.api.dashboard2.marketWatch.panels.create({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>simplefunctions.api.dashboard2.marketWatch.panels</code></b></summary>

<code>DELETE https://simplefunctions.dev/api/dashboard2/market-watch/panels/{id}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/market-watch)

```typescript
const res = await simplefunctions.api.dashboard2.marketWatch.panels({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>POST</code> <b><code>simplefunctions.api.dashboard2.marketWatch.panels.reorder</code></b></summary>

<code>POST https://simplefunctions.dev/api/dashboard2/market-watch/panels/reorder</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/market-watch)

```typescript
const res = await simplefunctions.api.dashboard2.marketWatch.panels.reorder({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>POST</code> <b><code>simplefunctions.api.dashboard2.marketWatch.panels</code></b></summary>

<code>POST https://simplefunctions.dev/api/dashboard2/market-watch/panels/{id}/run</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/market-watch)

```typescript
const res = await simplefunctions.api.dashboard2.marketWatch.panels({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>PATCH</code> <b><code>simplefunctions.api.dashboard2.marketWatch.panels.update</code></b></summary>

<code>PATCH https://simplefunctions.dev/api/dashboard2/market-watch/panels/{id}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/market-watch)

```typescript
const res = await simplefunctions.api.dashboard2.marketWatch.panels.update({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.dashboard2.marketWatchV2</code></b></summary>

<code>GET https://simplefunctions.dev/api/dashboard2/market-watch-v2{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/market-watch)

```typescript
const res = await simplefunctions.api.dashboard2.marketWatchV2({ /* ... */ });
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

### feed

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.feed</code></b></summary>

<code>GET https://simplefunctions.dev/api/feed{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/account)

```typescript
const res = await simplefunctions.api.feed({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

### intents

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.intents</code></b></summary>

<code>GET https://simplefunctions.dev/api/intents{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/execution-intents)

```typescript
const res = await simplefunctions.api.intents({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>POST</code> <b><code>simplefunctions.api.intents.create</code></b></summary>

<code>POST https://simplefunctions.dev/api/intents</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/execution-intents)

```typescript
const res = await simplefunctions.api.intents.create({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>simplefunctions.api.intents</code></b></summary>

<code>DELETE https://simplefunctions.dev/api/intents/{id}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/execution-intents)

```typescript
const res = await simplefunctions.api.intents({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.intents.retrieve</code></b></summary>

<code>GET https://simplefunctions.dev/api/intents/{id}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/execution-intents)

```typescript
const res = await simplefunctions.api.intents.retrieve({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>PATCH</code> <b><code>simplefunctions.api.intents.update</code></b></summary>

<code>PATCH https://simplefunctions.dev/api/intents/{id}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/execution-intents)

```typescript
const res = await simplefunctions.api.intents.update({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

### keys

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.keys</code></b></summary>

<code>GET https://simplefunctions.dev/api/keys{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/keys)

```typescript
const res = await simplefunctions.api.keys({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>POST</code> <b><code>simplefunctions.api.keys.create</code></b></summary>

<code>POST https://simplefunctions.dev/api/keys</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/keys)

```typescript
const res = await simplefunctions.api.keys.create({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>simplefunctions.api.keys</code></b></summary>

<code>DELETE https://simplefunctions.dev/api/keys/{id}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/keys)

```typescript
const res = await simplefunctions.api.keys({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

### mcp

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.mcp</code></b></summary>

<code>GET https://simplefunctions.dev/api/mcp/{transport}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/tools)

```typescript
const res = await simplefunctions.api.mcp({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>POST</code> <b><code>simplefunctions.api.mcp.call</code></b></summary>

<code>POST https://simplefunctions.dev/api/mcp/{transport}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/tools)

```typescript
const res = await simplefunctions.api.mcp.call({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

### portfolio

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.portfolio.activity</code></b></summary>

<code>GET https://simplefunctions.dev/api/portfolio/activity{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/portfolio)

```typescript
const res = await simplefunctions.api.portfolio.activity({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.portfolio.attribution.daily</code></b></summary>

<code>GET https://simplefunctions.dev/api/portfolio/attribution/daily{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/portfolio)

```typescript
const res = await simplefunctions.api.portfolio.attribution.daily({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.portfolio.attribution.grouped</code></b></summary>

<code>GET https://simplefunctions.dev/api/portfolio/attribution/grouped{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/portfolio)

```typescript
const res = await simplefunctions.api.portfolio.attribution.grouped({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.portfolio.config</code></b></summary>

<code>GET https://simplefunctions.dev/api/portfolio/config</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/portfolio)

```typescript
const res = await simplefunctions.api.portfolio.config({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>PUT</code> <b><code>simplefunctions.api.portfolio.config.update</code></b></summary>

<code>PUT https://simplefunctions.dev/api/portfolio/config{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/portfolio)

```typescript
const res = await simplefunctions.api.portfolio.config.update({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.portfolio.fills</code></b></summary>

<code>GET https://simplefunctions.dev/api/portfolio/fills{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/portfolio)

```typescript
const res = await simplefunctions.api.portfolio.fills({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.portfolio.ledger</code></b></summary>

<code>GET https://simplefunctions.dev/api/portfolio/ledger{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/portfolio)

```typescript
const res = await simplefunctions.api.portfolio.ledger({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>POST</code> <b><code>simplefunctions.api.portfolio.ledger.import.kalshi</code></b></summary>

<code>POST https://simplefunctions.dev/api/portfolio/ledger/import/kalshi{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/portfolio)

```typescript
const res = await simplefunctions.api.portfolio.ledger.import.kalshi({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>POST</code> <b><code>simplefunctions.api.portfolio.ledger.import.kalshi.pull</code></b></summary>

<code>POST https://simplefunctions.dev/api/portfolio/ledger/import/kalshi/pull{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/portfolio)

```typescript
const res = await simplefunctions.api.portfolio.ledger.import.kalshi.pull({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>POST</code> <b><code>simplefunctions.api.portfolio.ledger.import.polymarket</code></b></summary>

<code>POST https://simplefunctions.dev/api/portfolio/ledger/import/polymarket{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/portfolio)

```typescript
const res = await simplefunctions.api.portfolio.ledger.import.polymarket({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.portfolio.positions</code></b></summary>

<code>GET https://simplefunctions.dev/api/portfolio/positions{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/portfolio)

```typescript
const res = await simplefunctions.api.portfolio.positions({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.portfolio.risk</code></b></summary>

<code>GET https://simplefunctions.dev/api/portfolio/risk{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/portfolio)

```typescript
const res = await simplefunctions.api.portfolio.risk({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>POST</code> <b><code>simplefunctions.api.portfolio.secrets.create</code></b></summary>

<code>POST https://simplefunctions.dev/api/portfolio/secrets{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/portfolio)

```typescript
const res = await simplefunctions.api.portfolio.secrets.create({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>simplefunctions.api.portfolio.secrets</code></b></summary>

<code>DELETE https://simplefunctions.dev/api/portfolio/secrets{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/portfolio)

```typescript
const res = await simplefunctions.api.portfolio.secrets({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.portfolio.state</code></b></summary>

<code>GET https://simplefunctions.dev/api/portfolio/state</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/portfolio)

```typescript
const res = await simplefunctions.api.portfolio.state({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>PUT</code> <b><code>simplefunctions.api.portfolio.state.update</code></b></summary>

<code>PUT https://simplefunctions.dev/api/portfolio/state{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/portfolio)

```typescript
const res = await simplefunctions.api.portfolio.state.update({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.portfolio.strategy</code></b></summary>

<code>GET https://simplefunctions.dev/api/portfolio/strategy{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/portfolio)

```typescript
const res = await simplefunctions.api.portfolio.strategy({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>POST</code> <b><code>simplefunctions.api.portfolio.strategy.create</code></b></summary>

<code>POST https://simplefunctions.dev/api/portfolio/strategy{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/portfolio)

```typescript
const res = await simplefunctions.api.portfolio.strategy.create({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>simplefunctions.api.portfolio.strategy</code></b></summary>

<code>DELETE https://simplefunctions.dev/api/portfolio/strategy{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/portfolio)

```typescript
const res = await simplefunctions.api.portfolio.strategy({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>PUT</code> <b><code>simplefunctions.api.portfolio.strategy.update</code></b></summary>

<code>PUT https://simplefunctions.dev/api/portfolio/strategy{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/portfolio)

```typescript
const res = await simplefunctions.api.portfolio.strategy.update({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.portfolio.ticks</code></b></summary>

<code>GET https://simplefunctions.dev/api/portfolio/ticks{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/portfolio)

```typescript
const res = await simplefunctions.api.portfolio.ticks({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>POST</code> <b><code>simplefunctions.api.portfolio.ticks.create</code></b></summary>

<code>POST https://simplefunctions.dev/api/portfolio/ticks{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/portfolio)

```typescript
const res = await simplefunctions.api.portfolio.ticks.create({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.portfolio.ticks.retrieve</code></b></summary>

<code>GET https://simplefunctions.dev/api/portfolio/ticks/{id}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/portfolio)

```typescript
const res = await simplefunctions.api.portfolio.ticks.retrieve({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.portfolio.trades</code></b></summary>

<code>GET https://simplefunctions.dev/api/portfolio/trades{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/portfolio)

```typescript
const res = await simplefunctions.api.portfolio.trades({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>POST</code> <b><code>simplefunctions.api.portfolio.trades.create</code></b></summary>

<code>POST https://simplefunctions.dev/api/portfolio/trades{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/portfolio)

```typescript
const res = await simplefunctions.api.portfolio.trades.create({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.portfolio.trades.retrieve</code></b></summary>

<code>GET https://simplefunctions.dev/api/portfolio/trades/{id}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/portfolio)

```typescript
const res = await simplefunctions.api.portfolio.trades.retrieve({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>POST</code> <b><code>simplefunctions.api.portfolio.trigger</code></b></summary>

<code>POST https://simplefunctions.dev/api/portfolio/trigger{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/portfolio)

```typescript
const res = await simplefunctions.api.portfolio.trigger({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.portfolio.views</code></b></summary>

<code>GET https://simplefunctions.dev/api/portfolio/views{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/portfolio)

```typescript
const res = await simplefunctions.api.portfolio.views({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>POST</code> <b><code>simplefunctions.api.portfolio.views.create</code></b></summary>

<code>POST https://simplefunctions.dev/api/portfolio/views{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/portfolio)

```typescript
const res = await simplefunctions.api.portfolio.views.create({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>simplefunctions.api.portfolio.views</code></b></summary>

<code>DELETE https://simplefunctions.dev/api/portfolio/views{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/portfolio)

```typescript
const res = await simplefunctions.api.portfolio.views({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>PUT</code> <b><code>simplefunctions.api.portfolio.views.update</code></b></summary>

<code>PUT https://simplefunctions.dev/api/portfolio/views{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/portfolio)

```typescript
const res = await simplefunctions.api.portfolio.views.update({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

### prompt

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.prompt</code></b></summary>

<code>GET https://simplefunctions.dev/api/prompt</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/tools)

```typescript
const res = await simplefunctions.api.prompt({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

### proxy

<details>
<summary><code>POST</code> <b><code>simplefunctions.api.proxy.stt</code></b></summary>

<code>POST https://simplefunctions.dev/api/proxy/stt</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/tools)

```typescript
const res = await simplefunctions.api.proxy.stt({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>POST</code> <b><code>simplefunctions.api.proxy.tts</code></b></summary>

<code>POST https://simplefunctions.dev/api/proxy/tts</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/tools)

```typescript
const res = await simplefunctions.api.proxy.tts({ /* ... */ });
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

### runtime

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.runtime.exec</code></b></summary>

<code>GET https://simplefunctions.dev/api/runtime/exec{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/execution-intents)

```typescript
const res = await simplefunctions.api.runtime.exec({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>POST</code> <b><code>simplefunctions.api.runtime.exec.trigger</code></b></summary>

<code>POST https://simplefunctions.dev/api/runtime/exec</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/execution-intents)

```typescript
const res = await simplefunctions.api.runtime.exec.trigger({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

### signup

<details>
<summary><code>POST</code> <b><code>simplefunctions.api.signup</code></b></summary>

<code>POST https://simplefunctions.dev/api/signup</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/keys)

```typescript
const res = await simplefunctions.api.signup({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

### skills

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.skills</code></b></summary>

<code>GET https://simplefunctions.dev/api/skills{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/tools)

```typescript
const res = await simplefunctions.api.skills({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

### thesis

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.thesis</code></b></summary>

<code>GET https://simplefunctions.dev/api/thesis{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/thesis)

```typescript
const res = await simplefunctions.api.thesis({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>POST</code> <b><code>simplefunctions.api.thesis.augment</code></b></summary>

<code>POST https://simplefunctions.dev/api/thesis/{id}/augment{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/thesis)

```typescript
const res = await simplefunctions.api.thesis.augment({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.thesis.byTicker</code></b></summary>

<code>GET https://simplefunctions.dev/api/thesis/by-ticker/{ticker}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/thesis)

```typescript
const res = await simplefunctions.api.thesis.byTicker({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.thesis.changes</code></b></summary>

<code>GET https://simplefunctions.dev/api/thesis/{id}/changes{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/thesis)

```typescript
const res = await simplefunctions.api.thesis.changes({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.thesis.context</code></b></summary>

<code>GET https://simplefunctions.dev/api/thesis/{id}/context</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/thesis)

```typescript
const res = await simplefunctions.api.thesis.context({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>POST</code> <b><code>simplefunctions.api.thesis.create</code></b></summary>

<code>POST https://simplefunctions.dev/api/thesis/create{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/thesis)

```typescript
const res = await simplefunctions.api.thesis.create({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>simplefunctions.api.thesis</code></b></summary>

<code>DELETE https://simplefunctions.dev/api/thesis/{id}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/thesis)

```typescript
const res = await simplefunctions.api.thesis({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>POST</code> <b><code>simplefunctions.api.thesis.evaluate</code></b></summary>

<code>POST https://simplefunctions.dev/api/thesis/{id}/evaluate</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/thesis)

```typescript
const res = await simplefunctions.api.thesis.evaluate({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.thesis.evaluations</code></b></summary>

<code>GET https://simplefunctions.dev/api/thesis/{id}/evaluations</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/thesis)

```typescript
const res = await simplefunctions.api.thesis.evaluations({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>POST</code> <b><code>simplefunctions.api.thesis.fork</code></b></summary>

<code>POST https://simplefunctions.dev/api/thesis/{id}/fork</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/thesis)

```typescript
const res = await simplefunctions.api.thesis.fork({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.thesis.heartbeat</code></b></summary>

<code>GET https://simplefunctions.dev/api/thesis/{id}/heartbeat</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/thesis)

```typescript
const res = await simplefunctions.api.thesis.heartbeat({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>PATCH</code> <b><code>simplefunctions.api.thesis.heartbeat.update</code></b></summary>

<code>PATCH https://simplefunctions.dev/api/thesis/{id}/heartbeat</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/thesis)

```typescript
const res = await simplefunctions.api.thesis.heartbeat.update({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>POST</code> <b><code>simplefunctions.api.thesis.nodes</code></b></summary>

<code>POST https://simplefunctions.dev/api/thesis/{id}/nodes</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/thesis)

```typescript
const res = await simplefunctions.api.thesis.nodes({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>POST</code> <b><code>simplefunctions.api.thesis.positions.create</code></b></summary>

<code>POST https://simplefunctions.dev/api/thesis/{id}/positions</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/thesis)

```typescript
const res = await simplefunctions.api.thesis.positions.create({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>simplefunctions.api.thesis.positions</code></b></summary>

<code>DELETE https://simplefunctions.dev/api/thesis/{id}/positions/{posId}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/thesis)

```typescript
const res = await simplefunctions.api.thesis.positions({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.thesis.positions.list</code></b></summary>

<code>GET https://simplefunctions.dev/api/thesis/{id}/positions</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/thesis)

```typescript
const res = await simplefunctions.api.thesis.positions.list({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>PATCH</code> <b><code>simplefunctions.api.thesis.positions.update</code></b></summary>

<code>PATCH https://simplefunctions.dev/api/thesis/{id}/positions/{posId}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/thesis)

```typescript
const res = await simplefunctions.api.thesis.positions.update({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.thesis.prompt</code></b></summary>

<code>GET https://simplefunctions.dev/api/thesis/{id}/prompt</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/thesis)

```typescript
const res = await simplefunctions.api.thesis.prompt({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>POST</code> <b><code>simplefunctions.api.thesis.publish</code></b></summary>

<code>POST https://simplefunctions.dev/api/thesis/{id}/publish</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/thesis)

```typescript
const res = await simplefunctions.api.thesis.publish({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.thesis.retrieve</code></b></summary>

<code>GET https://simplefunctions.dev/api/thesis/{id}{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/thesis)

```typescript
const res = await simplefunctions.api.thesis.retrieve({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>POST</code> <b><code>simplefunctions.api.thesis.signal</code></b></summary>

<code>POST https://simplefunctions.dev/api/thesis/{id}/signal</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/thesis)

```typescript
const res = await simplefunctions.api.thesis.signal({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>POST</code> <b><code>simplefunctions.api.thesis.strategies.create</code></b></summary>

<code>POST https://simplefunctions.dev/api/thesis/{id}/strategies</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/thesis)

```typescript
const res = await simplefunctions.api.thesis.strategies.create({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>simplefunctions.api.thesis.strategies</code></b></summary>

<code>DELETE https://simplefunctions.dev/api/thesis/{id}/strategies/{sid}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/thesis)

```typescript
const res = await simplefunctions.api.thesis.strategies({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.thesis.strategies.list</code></b></summary>

<code>GET https://simplefunctions.dev/api/thesis/{id}/strategies{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/thesis)

```typescript
const res = await simplefunctions.api.thesis.strategies.list({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>PATCH</code> <b><code>simplefunctions.api.thesis.strategies.update</code></b></summary>

<code>PATCH https://simplefunctions.dev/api/thesis/{id}/strategies/{sid}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/thesis)

```typescript
const res = await simplefunctions.api.thesis.strategies.update({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>simplefunctions.api.thesis.unpublish</code></b></summary>

<code>DELETE https://simplefunctions.dev/api/thesis/{id}/publish</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/thesis)

```typescript
const res = await simplefunctions.api.thesis.unpublish({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>PATCH</code> <b><code>simplefunctions.api.thesis.update</code></b></summary>

<code>PATCH https://simplefunctions.dev/api/thesis/{id}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/thesis)

```typescript
const res = await simplefunctions.api.thesis.update({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.thesis.videoData</code></b></summary>

<code>GET https://simplefunctions.dev/api/thesis/{id}/video-data</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/thesis)

```typescript
const res = await simplefunctions.api.thesis.videoData({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>POST</code> <b><code>simplefunctions.api.thesis.videos.create</code></b></summary>

<code>POST https://simplefunctions.dev/api/thesis/{id}/videos</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/thesis)

```typescript
const res = await simplefunctions.api.thesis.videos.create({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.thesis.videos.list</code></b></summary>

<code>GET https://simplefunctions.dev/api/thesis/{id}/videos</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/thesis)

```typescript
const res = await simplefunctions.api.thesis.videos.list({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>POST</code> <b><code>simplefunctions.api.thesis.whatif</code></b></summary>

<code>POST https://simplefunctions.dev/api/thesis/{id}/whatif</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/thesis)

```typescript
const res = await simplefunctions.api.thesis.whatif({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

### tools

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.tools</code></b></summary>

<code>GET https://simplefunctions.dev/api/tools{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/tools)

```typescript
const res = await simplefunctions.api.tools({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

### watch

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.watch</code></b></summary>

<code>GET https://simplefunctions.dev/api/watch{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/watch-alerts)

```typescript
const res = await simplefunctions.api.watch({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>POST</code> <b><code>simplefunctions.api.watch.create</code></b></summary>

<code>POST https://simplefunctions.dev/api/watch</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/watch-alerts)

```typescript
const res = await simplefunctions.api.watch.create({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>simplefunctions.api.watch</code></b></summary>

<code>DELETE https://simplefunctions.dev/api/watch/{id}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/watch-alerts)

```typescript
const res = await simplefunctions.api.watch({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>POST</code> <b><code>simplefunctions.api.watch.identify</code></b></summary>

<code>POST https://simplefunctions.dev/api/watch/identify</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/watch-alerts)

```typescript
const res = await simplefunctions.api.watch.identify({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>POST</code> <b><code>simplefunctions.api.watch.refresh</code></b></summary>

<code>POST https://simplefunctions.dev/api/watch/{id}/refresh</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/watch-alerts)

```typescript
const res = await simplefunctions.api.watch.refresh({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.watch.retrieve</code></b></summary>

<code>GET https://simplefunctions.dev/api/watch/{id}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/watch-alerts)

```typescript
const res = await simplefunctions.api.watch.retrieve({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>PATCH</code> <b><code>simplefunctions.api.watch.update</code></b></summary>

<code>PATCH https://simplefunctions.dev/api/watch/{id}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/watch-alerts)

```typescript
const res = await simplefunctions.api.watch.update({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

### webhookEndpoints

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.webhookEndpoints</code></b></summary>

<code>GET https://simplefunctions.dev/api/webhook-endpoints{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/watch-alerts)

```typescript
const res = await simplefunctions.api.webhookEndpoints({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>POST</code> <b><code>simplefunctions.api.webhookEndpoints.create</code></b></summary>

<code>POST https://simplefunctions.dev/api/webhook-endpoints</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/watch-alerts)

```typescript
const res = await simplefunctions.api.webhookEndpoints.create({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>simplefunctions.api.webhookEndpoints</code></b></summary>

<code>DELETE https://simplefunctions.dev/api/webhook-endpoints/{id}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/watch-alerts)

```typescript
const res = await simplefunctions.api.webhookEndpoints({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>POST</code> <b><code>simplefunctions.api.webhookEndpoints.test</code></b></summary>

<code>POST https://simplefunctions.dev/api/webhook-endpoints/{id}/test</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/watch-alerts)

```typescript
const res = await simplefunctions.api.webhookEndpoints.test({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>PATCH</code> <b><code>simplefunctions.api.webhookEndpoints.update</code></b></summary>

<code>PATCH https://simplefunctions.dev/api/webhook-endpoints/{id}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/api-reference/watch-alerts)

```typescript
const res = await simplefunctions.api.webhookEndpoints.update({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

### x

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.x.account</code></b></summary>

<code>GET https://simplefunctions.dev/api/x/account{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/inventory/surface-map)

```typescript
const res = await simplefunctions.api.x.account({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.x.news</code></b></summary>

<code>GET https://simplefunctions.dev/api/x/news{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/inventory/surface-map)

```typescript
const res = await simplefunctions.api.x.news({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.x.search</code></b></summary>

<code>GET https://simplefunctions.dev/api/x/search{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/inventory/surface-map)

```typescript
const res = await simplefunctions.api.x.search({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>simplefunctions.api.x.volume</code></b></summary>

<code>GET https://simplefunctions.dev/api/x/volume{query}</code>

[Upstream docs ↗](https://docs.simplefunctions.dev/inventory/surface-map)

```typescript
const res = await simplefunctions.api.x.volume({ /* ... */ });
```

Source: [`packages/provider/simplefunctions/src/simplefunctions.ts`](src/simplefunctions.ts)

</details>

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
