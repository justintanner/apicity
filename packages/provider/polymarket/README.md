# @apicity/polymarket

[![npm](https://img.shields.io/npm/v/@apicity/polymarket?color=cb0000)](https://www.npmjs.com/package/@apicity/polymarket)
[![dependencies](https://img.shields.io/badge/dependencies-2-blue)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)
[![docs](https://img.shields.io/badge/docs-docs.polymarket.com-blue)](https://docs.polymarket.com/api-reference/introduction)

Polymarket API provider — Gamma, Data, and CLOB market-data/trading endpoints.

Runtime dependencies:

- `viem@^2.52.2` — EIP-712 order signing for the CLOB trading endpoints
- `zod@^3.24.0` — request schemas attached to every POST endpoint as `.schema`

## Installation

```bash
npm install @apicity/polymarket
# or
pnpm add @apicity/polymarket
```

## Quick Start

```typescript
import { createPolymarket } from "@apicity/polymarket";

const polymarket = createPolymarket();
```

## API Reference

76 endpoints across 3 groups. Each method mirrors an upstream URL path.

### clob

<details>
<summary><code>DELETE</code> <b><code>polymarket.clob.auth.apiKey</code></b></summary>

<code>DELETE https://clob.polymarket.com/auth/api-key</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/authentication)

```typescript
const res = await polymarket.clob.auth.apiKey({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>polymarket.clob.cancelAll</code></b></summary>

<code>DELETE https://clob.polymarket.com/cancel-all</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/trade/cancel-all-orders)

```typescript
const res = await polymarket.clob.cancelAll({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>polymarket.clob.cancelMarketOrders</code></b></summary>

<code>DELETE https://clob.polymarket.com/cancel-market-orders</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/trade/cancel-orders-for-a-market)

```typescript
const res = await polymarket.clob.cancelMarketOrders({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>polymarket.clob.notifications</code></b></summary>

<code>DELETE https://clob.polymarket.com/notifications{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/authentication)

```typescript
const res = await polymarket.clob.notifications({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>polymarket.clob.order</code></b></summary>

<code>DELETE https://clob.polymarket.com/order</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/trade/cancel-single-order)

```typescript
const res = await polymarket.clob.order({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>polymarket.clob.orders</code></b></summary>

<code>DELETE https://clob.polymarket.com/orders</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/trade/cancel-multiple-orders)

```typescript
const res = await polymarket.clob.orders({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.auth.apiKeys</code></b></summary>

<code>GET https://clob.polymarket.com/auth/api-keys</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/authentication)

```typescript
const res = await polymarket.clob.auth.apiKeys({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.auth.banStatus.closedOnly</code></b></summary>

<code>GET https://clob.polymarket.com/auth/ban-status/closed-only</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/authentication)

```typescript
const res = await polymarket.clob.auth.banStatus.closedOnly({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.auth.deriveApiKey</code></b></summary>

<code>GET https://clob.polymarket.com/auth/derive-api-key</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/authentication)

```typescript
const res = await polymarket.clob.auth.deriveApiKey({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.balanceAllowance</code></b></summary>

<code>GET https://clob.polymarket.com/balance-allowance{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/authentication)

```typescript
const res = await polymarket.clob.balanceAllowance({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.balanceAllowance.update</code></b></summary>

<code>GET https://clob.polymarket.com/balance-allowance/update{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/authentication)

```typescript
const res = await polymarket.clob.balanceAllowance.update({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.book</code></b></summary>

<code>GET https://clob.polymarket.com/book{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/clob/get-order-book)

```typescript
const res = await polymarket.clob.book({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.clobMarkets</code></b></summary>

<code>GET https://clob.polymarket.com/clob-markets/{conditionId}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/clob/get-clob-market-info)

```typescript
const res = await polymarket.clob.clobMarkets({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.data.order</code></b></summary>

<code>GET https://clob.polymarket.com/data/order/{orderID}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/trade/get-single-order-by-id)

```typescript
const res = await polymarket.clob.data.order({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.data.orders</code></b></summary>

<code>GET https://clob.polymarket.com/data/orders{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/trade/get-user-orders)

```typescript
const res = await polymarket.clob.data.orders({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.data.trades</code></b></summary>

<code>GET https://clob.polymarket.com/data/trades{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/trade/get-trades)

```typescript
const res = await polymarket.clob.data.trades({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.feeRate</code></b></summary>

<code>GET https://clob.polymarket.com/fee-rate/{tokenId}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/clob/get-fee-rate)

```typescript
const res = await polymarket.clob.feeRate({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.lastTradePrice</code></b></summary>

<code>GET https://clob.polymarket.com/last-trade-price{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/clob/get-last-trade-price)

```typescript
const res = await polymarket.clob.lastTradePrice({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.markets</code></b></summary>

<code>GET https://clob.polymarket.com/markets/{paramsOrConditionIdOrSignal}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/clob/get-markets)

```typescript
const res = await polymarket.clob.markets({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.marketsByToken</code></b></summary>

<code>GET https://clob.polymarket.com/markets-by-token/{tokenId}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/clob/get-market-by-token)

```typescript
const res = await polymarket.clob.marketsByToken({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.midpoint</code></b></summary>

<code>GET https://clob.polymarket.com/midpoint{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/clob/get-midpoint)

```typescript
const res = await polymarket.clob.midpoint({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.notifications</code></b></summary>

<code>GET https://clob.polymarket.com/notifications{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/authentication)

```typescript
const res = await polymarket.clob.notifications({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.orderScoring</code></b></summary>

<code>GET https://clob.polymarket.com/order-scoring{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/trade/get-order-scoring-status)

```typescript
const res = await polymarket.clob.orderScoring({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.ordersScoring</code></b></summary>

<code>GET https://clob.polymarket.com/orders-scoring{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/trade/get-order-scoring-status)

```typescript
const res = await polymarket.clob.ordersScoring({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.price</code></b></summary>

<code>GET https://clob.polymarket.com/price{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/clob/get-market-price)

```typescript
const res = await polymarket.clob.price({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.pricesHistory</code></b></summary>

<code>GET https://clob.polymarket.com/prices-history{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/clob/get-prices-history)

```typescript
const res = await polymarket.clob.pricesHistory({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.samplingMarkets</code></b></summary>

<code>GET https://clob.polymarket.com/sampling-markets{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/clob/get-sampling-markets)

```typescript
const res = await polymarket.clob.samplingMarkets({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.samplingSimplifiedMarkets</code></b></summary>

<code>GET https://clob.polymarket.com/sampling-simplified-markets{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/clob/get-sampling-simplified-markets)

```typescript
const res = await polymarket.clob.samplingSimplifiedMarkets({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.simplifiedMarkets</code></b></summary>

<code>GET https://clob.polymarket.com/simplified-markets{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/clob/get-simplified-markets)

```typescript
const res = await polymarket.clob.simplifiedMarkets({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.spread</code></b></summary>

<code>GET https://clob.polymarket.com/spread{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/clob/get-spread)

```typescript
const res = await polymarket.clob.spread({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.tickSize</code></b></summary>

<code>GET https://clob.polymarket.com/tick-size/{tokenId}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/clob/get-tick-size)

```typescript
const res = await polymarket.clob.tickSize({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.time</code></b></summary>

<code>GET https://clob.polymarket.com/time</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/clob/get-server-time)

```typescript
const res = await polymarket.clob.time({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>POST</code> <b><code>polymarket.clob.auth.apiKey</code></b></summary>

<code>POST https://clob.polymarket.com/auth/api-key</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/authentication)

```typescript
const res = await polymarket.clob.auth.apiKey({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>POST</code> <b><code>polymarket.clob.batchPricesHistory</code></b></summary>

<code>POST https://clob.polymarket.com/batch-prices-history</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/clob/get-batch-prices-history)

```typescript
const res = await polymarket.clob.batchPricesHistory({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>POST</code> <b><code>polymarket.clob.books</code></b></summary>

<code>POST https://clob.polymarket.com/books</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/clob/get-order-books)

```typescript
const res = await polymarket.clob.books({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>POST</code> <b><code>polymarket.clob.heartbeats</code></b></summary>

<code>POST https://clob.polymarket.com/heartbeats</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/trade/send-heartbeat)

```typescript
const res = await polymarket.clob.heartbeats({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>POST</code> <b><code>polymarket.clob.lastTradesPrices</code></b></summary>

<code>POST https://clob.polymarket.com/last-trades-prices</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/clob/get-last-trades-prices)

```typescript
const res = await polymarket.clob.lastTradesPrices({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>POST</code> <b><code>polymarket.clob.midpoints</code></b></summary>

<code>POST https://clob.polymarket.com/midpoints</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/clob/get-midpoints)

```typescript
const res = await polymarket.clob.midpoints({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>POST</code> <b><code>polymarket.clob.order</code></b></summary>

<code>POST https://clob.polymarket.com/order</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/trade/post-a-new-order)

```typescript
const res = await polymarket.clob.order({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>POST</code> <b><code>polymarket.clob.orders</code></b></summary>

<code>POST https://clob.polymarket.com/orders</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/trade/post-multiple-orders)

```typescript
const res = await polymarket.clob.orders({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>POST</code> <b><code>polymarket.clob.ordersScoring</code></b></summary>

<code>POST https://clob.polymarket.com/orders-scoring</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/trade/get-order-scoring-status)

```typescript
const res = await polymarket.clob.ordersScoring({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>POST</code> <b><code>polymarket.clob.placeOrder</code></b></summary>

<code>POST https://clob.polymarket.com/order</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/trade/post-a-new-order)

```typescript
const res = await polymarket.clob.placeOrder({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>POST</code> <b><code>polymarket.clob.prices</code></b></summary>

<code>POST https://clob.polymarket.com/prices</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/clob/get-market-prices)

```typescript
const res = await polymarket.clob.prices({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>POST</code> <b><code>polymarket.clob.spreads</code></b></summary>

<code>POST https://clob.polymarket.com/spreads</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/clob/get-spreads)

```typescript
const res = await polymarket.clob.spreads({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>POST</code> <b><code>polymarket.clob.v1.heartbeats</code></b></summary>

<code>POST https://clob.polymarket.com/v1/heartbeats</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/trade/send-heartbeat)

```typescript
const res = await polymarket.clob.v1.heartbeats({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>PUT</code> <b><code>polymarket.clob.balanceAllowance</code></b></summary>

<code>PUT https://clob.polymarket.com/balance-allowance{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/authentication)

```typescript
const res = await polymarket.clob.balanceAllowance({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

### data

<details>
<summary><code>GET</code> <b><code>polymarket.data.activity</code></b></summary>

<code>GET https://data-api.polymarket.com/activity{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/data/get-activity)

```typescript
const res = await polymarket.data.activity({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/data.ts`](src/data.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.data.holders</code></b></summary>

<code>GET https://data-api.polymarket.com/holders{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/data/get-holders)

```typescript
const res = await polymarket.data.holders({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/data.ts`](src/data.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.data.liveVolume</code></b></summary>

<code>GET https://data-api.polymarket.com/live-volume{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/data/get-live-volume)

```typescript
const res = await polymarket.data.liveVolume({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/data.ts`](src/data.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.data.oi</code></b></summary>

<code>GET https://data-api.polymarket.com/oi{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/data/get-open-interest)

```typescript
const res = await polymarket.data.oi({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/data.ts`](src/data.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.data.positions</code></b></summary>

<code>GET https://data-api.polymarket.com/positions{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/data/get-positions)

```typescript
const res = await polymarket.data.positions({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/data.ts`](src/data.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.data.trades</code></b></summary>

<code>GET https://data-api.polymarket.com/trades{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/data/get-trades)

```typescript
const res = await polymarket.data.trades({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/data.ts`](src/data.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.data.value</code></b></summary>

<code>GET https://data-api.polymarket.com/value{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/data/get-positions-value)

```typescript
const res = await polymarket.data.value({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/data.ts`](src/data.ts)

</details>

### gamma

<details>
<summary><code>GET</code> <b><code>polymarket.gamma.comments</code></b></summary>

<code>GET https://gamma-api.polymarket.com/comments/{paramsOrIdOrSignal}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/gamma/get-comments)

```typescript
const res = await polymarket.gamma.comments({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/gamma.ts`](src/gamma.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.gamma.comments.byUser</code></b></summary>

<code>GET https://gamma-api.polymarket.com/comments/user_address/{address}{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/gamma/get-comments-by-user)

```typescript
const res = await polymarket.gamma.comments.byUser({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/gamma.ts`](src/gamma.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.gamma.events</code></b></summary>

<code>GET https://gamma-api.polymarket.com/events/{paramsOrIdOrSignal}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/gamma/get-events)

> **Deprecated upstream:** the replay fixture for the list form `GET /events?...` returned `Deprecation: true`, `Sunset: Fri, 01 May 2026 00:00:00 GMT`, and `Warning: 299 - "use /events/keyset"`. This compatibility method remains for existing bare-array `/events` callers; prefer `polymarket.gamma.events.keyset()` for new paginated event lists.

```typescript
const res = await polymarket.gamma.events({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/gamma.ts`](src/gamma.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.gamma.events.keyset</code></b></summary>

<code>GET https://gamma-api.polymarket.com/events/keyset{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/gamma/get-events-keyset)

```typescript
const res = await polymarket.gamma.events.keyset({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/gamma.ts`](src/gamma.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.gamma.events.slug</code></b></summary>

<code>GET https://gamma-api.polymarket.com/events/slug/{slug}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/gamma/get-event-by-slug)

```typescript
const res = await polymarket.gamma.events.slug({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/gamma.ts`](src/gamma.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.gamma.events.tags</code></b></summary>

<code>GET https://gamma-api.polymarket.com/events/{id}/tags</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/gamma/get-event-tags)

```typescript
const res = await polymarket.gamma.events.tags({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/gamma.ts`](src/gamma.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.gamma.markets</code></b></summary>

<code>GET https://gamma-api.polymarket.com/markets/{paramsOrIdOrSignal}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/gamma/get-markets)

```typescript
const res = await polymarket.gamma.markets({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/gamma.ts`](src/gamma.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.gamma.markets.keyset</code></b></summary>

<code>GET https://gamma-api.polymarket.com/markets/keyset{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/gamma/get-markets-keyset)

```typescript
const res = await polymarket.gamma.markets.keyset({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/gamma.ts`](src/gamma.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.gamma.markets.slug</code></b></summary>

<code>GET https://gamma-api.polymarket.com/markets/slug/{slug}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/gamma/get-market-by-slug)

```typescript
const res = await polymarket.gamma.markets.slug({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/gamma.ts`](src/gamma.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.gamma.markets.tags</code></b></summary>

<code>GET https://gamma-api.polymarket.com/markets/{id}/tags</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/gamma/get-market-tags)

```typescript
const res = await polymarket.gamma.markets.tags({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/gamma.ts`](src/gamma.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.gamma.publicProfile</code></b></summary>

<code>GET https://gamma-api.polymarket.com/public-profile{query}</code>

```typescript
const res = await polymarket.gamma.publicProfile({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/gamma.ts`](src/gamma.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.gamma.search</code></b></summary>

<code>GET https://gamma-api.polymarket.com/public-search{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/gamma/search)

```typescript
const res = await polymarket.gamma.search({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/gamma.ts`](src/gamma.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.gamma.series</code></b></summary>

<code>GET https://gamma-api.polymarket.com/series/{paramsOrIdOrSignal}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/gamma/get-series)

```typescript
const res = await polymarket.gamma.series({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/gamma.ts`](src/gamma.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.gamma.sports</code></b></summary>

<code>GET https://gamma-api.polymarket.com/sports</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/gamma/get-sports)

```typescript
const res = await polymarket.gamma.sports({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/gamma.ts`](src/gamma.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.gamma.sports.marketTypes</code></b></summary>

<code>GET https://gamma-api.polymarket.com/sports/market-types</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/gamma/get-sports-market-types)

```typescript
const res = await polymarket.gamma.sports.marketTypes({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/gamma.ts`](src/gamma.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.gamma.status</code></b></summary>

<code>GET https://gamma-api.polymarket.com/status</code>

```typescript
const res = await polymarket.gamma.status({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/gamma.ts`](src/gamma.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.gamma.tags</code></b></summary>

<code>GET https://gamma-api.polymarket.com/tags/{paramsOrIdOrSignal}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/gamma/get-tags)

```typescript
const res = await polymarket.gamma.tags({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/gamma.ts`](src/gamma.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.gamma.tags.relatedTags</code></b></summary>

<code>GET https://gamma-api.polymarket.com/tags/{id}/related-tags{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/gamma/get-related-tags-by-id)

```typescript
const res = await polymarket.gamma.tags.relatedTags({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/gamma.ts`](src/gamma.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.gamma.tags.relatedTags.slug</code></b></summary>

<code>GET https://gamma-api.polymarket.com/tags/slug/{slug}/related-tags{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/gamma/get-related-tags-by-slug)

```typescript
const res = await polymarket.gamma.tags.relatedTags.slug({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/gamma.ts`](src/gamma.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.gamma.tags.relatedTags.tags</code></b></summary>

<code>GET https://gamma-api.polymarket.com/tags/{id}/related-tags/tags{query}</code>

```typescript
const res = await polymarket.gamma.tags.relatedTags.tags({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/gamma.ts`](src/gamma.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.gamma.tags.relatedTags.tags.slug</code></b></summary>

<code>GET https://gamma-api.polymarket.com/tags/slug/{slug}/related-tags/tags{query}</code>

```typescript
const res = await polymarket.gamma.tags.relatedTags.tags.slug({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/gamma.ts`](src/gamma.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.gamma.tags.slug</code></b></summary>

<code>GET https://gamma-api.polymarket.com/tags/slug/{slug}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/gamma/get-tag-by-slug)

```typescript
const res = await polymarket.gamma.tags.slug({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/gamma.ts`](src/gamma.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.gamma.teams</code></b></summary>

<code>GET https://gamma-api.polymarket.com/teams{query}</code>

```typescript
const res = await polymarket.gamma.teams({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/gamma.ts`](src/gamma.ts)

</details>

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
