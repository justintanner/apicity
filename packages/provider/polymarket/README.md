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

## Unsupported Upstream Paths

The current Polymarket OpenAPI specs mark some paths as `x-excluded`; `@apicity/polymarket` intentionally does not expose wrappers for those unsupported surfaces. That includes Gamma administrative/private paths such as team detail, event pagination/results/comment-count, market information and abridged POST endpoints, series summaries, and private profile lookups, plus Data `/revisions` and `/other`.

## API Reference

108 endpoints across 3 groups. Each method mirrors an upstream URL path.

### clob

<details>
<summary><code>DELETE</code> <b><code>polymarket.clob.auth.apiKey</code></b></summary>

<code>DELETE https://clob.polymarket.com/auth/api-key</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/authentication.md)

```typescript
const res = await polymarket.clob.auth.apiKey({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>polymarket.clob.auth.builderApiKey</code></b></summary>

<code>DELETE https://clob.polymarket.com/auth/builder-api-key</code>

[Upstream docs ↗](https://docs.polymarket.com/api-spec/clob-openapi.yaml)

```typescript
const res = await polymarket.clob.auth.builderApiKey({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>polymarket.clob.cancelAll</code></b></summary>

<code>DELETE https://clob.polymarket.com/cancel-all</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/trade/cancel-all-orders.md)

```typescript
const res = await polymarket.clob.cancelAll({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>polymarket.clob.cancelMarketOrders</code></b></summary>

<code>DELETE https://clob.polymarket.com/cancel-market-orders</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/trade/cancel-orders-for-a-market.md)

```typescript
const res = await polymarket.clob.cancelMarketOrders({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>polymarket.clob.notifications</code></b></summary>

<code>DELETE https://clob.polymarket.com/notifications{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/authentication.md)

```typescript
const res = await polymarket.clob.notifications({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>polymarket.clob.order</code></b></summary>

<code>DELETE https://clob.polymarket.com/order</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/trade/cancel-single-order.md)

```typescript
const res = await polymarket.clob.order({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>polymarket.clob.orders</code></b></summary>

<code>DELETE https://clob.polymarket.com/orders</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/trade/cancel-multiple-orders.md)

```typescript
const res = await polymarket.clob.orders({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.auth.apiKeys</code></b></summary>

<code>GET https://clob.polymarket.com/auth/api-keys</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/authentication.md)

```typescript
const res = await polymarket.clob.auth.apiKeys({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.auth.banStatus.closedOnly</code></b></summary>

<code>GET https://clob.polymarket.com/auth/ban-status/closed-only</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/authentication.md)

```typescript
const res = await polymarket.clob.auth.banStatus.closedOnly({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.auth.builderApiKey</code></b></summary>

<code>GET https://clob.polymarket.com/auth/builder-api-key</code>

[Upstream docs ↗](https://docs.polymarket.com/api-spec/clob-openapi.yaml)

```typescript
const res = await polymarket.clob.auth.builderApiKey({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.auth.deriveApiKey</code></b></summary>

<code>GET https://clob.polymarket.com/auth/derive-api-key</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/authentication.md)

```typescript
const res = await polymarket.clob.auth.deriveApiKey({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.balanceAllowance</code></b></summary>

<code>GET https://clob.polymarket.com/balance-allowance{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/authentication.md)

```typescript
const res = await polymarket.clob.balanceAllowance({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.balanceAllowance.update</code></b></summary>

<code>GET https://clob.polymarket.com/balance-allowance/update{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/authentication.md)

```typescript
const res = await polymarket.clob.balanceAllowance.update({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.book</code></b></summary>

<code>GET https://clob.polymarket.com/book{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/market-data/get-order-book.md)

```typescript
const res = await polymarket.clob.book({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.books</code></b></summary>

<code>GET https://clob.polymarket.com/books{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-spec/clob-openapi.yaml)

```typescript
const res = await polymarket.clob.books({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.builderTrades</code></b></summary>

<code>GET https://clob.polymarket.com/builder/trades{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/trade/get-builder-trades.md)

```typescript
const res = await polymarket.clob.builderTrades({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.clobMarkets</code></b></summary>

<code>GET https://clob.polymarket.com/clob-markets/{conditionId}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/markets/get-clob-market-info.md)

```typescript
const res = await polymarket.clob.clobMarkets({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.data.order</code></b></summary>

<code>GET https://clob.polymarket.com/data/order/{orderID}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/trade/get-single-order-by-id.md)

```typescript
const res = await polymarket.clob.data.order({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.data.orders</code></b></summary>

<code>GET https://clob.polymarket.com/data/orders{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/trade/get-user-orders.md)

```typescript
const res = await polymarket.clob.data.orders({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.data.trades</code></b></summary>

<code>GET https://clob.polymarket.com/data/trades{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/trade/get-trades.md)

```typescript
const res = await polymarket.clob.data.trades({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.feeRate</code></b></summary>

<code>GET https://clob.polymarket.com/fee-rate/{tokenId}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/market-data/get-fee-rate-by-path-parameter.md)

```typescript
const res = await polymarket.clob.feeRate({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.feeRateByQuery</code></b></summary>

<code>GET https://clob.polymarket.com/fee-rate{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/market-data/get-fee-rate.md)

```typescript
const res = await polymarket.clob.feeRateByQuery({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.lastTradePrice</code></b></summary>

<code>GET https://clob.polymarket.com/last-trade-price{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/market-data/get-last-trade-price.md)

```typescript
const res = await polymarket.clob.lastTradePrice({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.lastTradesPrices</code></b></summary>

<code>GET https://clob.polymarket.com/last-trades-prices{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/market-data/get-last-trade-prices-query-parameters.md)

```typescript
const res = await polymarket.clob.lastTradesPrices({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.marketLiveActivity</code></b></summary>

<code>GET https://clob.polymarket.com/markets/live-activity/{conditionId}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-spec/clob-openapi.yaml)

```typescript
const res = await polymarket.clob.marketLiveActivity({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.markets</code></b></summary>

<code>GET https://clob.polymarket.com/markets/{paramsOrConditionIdOrSignal}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-spec/clob-openapi.yaml)

> **Legacy compatibility:** current public market discovery is documented on the Gamma `/markets` pages. The CLOB `/markets` compatibility path is retained for existing callers and is documented by the CLOB OpenAPI spec.

```typescript
const res = await polymarket.clob.markets({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.marketsByToken</code></b></summary>

<code>GET https://clob.polymarket.com/markets-by-token/{tokenId}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/markets/get-market-by-token.md)

```typescript
const res = await polymarket.clob.marketsByToken({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.midpoint</code></b></summary>

<code>GET https://clob.polymarket.com/midpoint{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/data/get-midpoint-price.md)

```typescript
const res = await polymarket.clob.midpoint({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.midpoints</code></b></summary>

<code>GET https://clob.polymarket.com/midpoints{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/market-data/get-midpoint-prices-query-parameters.md)

```typescript
const res = await polymarket.clob.midpoints({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.negRisk</code></b></summary>

<code>GET https://clob.polymarket.com/neg-risk/{tokenId}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-spec/clob-openapi.yaml)

```typescript
const res = await polymarket.clob.negRisk({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.negRiskByQuery</code></b></summary>

<code>GET https://clob.polymarket.com/neg-risk{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-spec/clob-openapi.yaml)

```typescript
const res = await polymarket.clob.negRiskByQuery({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.notifications</code></b></summary>

<code>GET https://clob.polymarket.com/notifications{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/authentication.md)

```typescript
const res = await polymarket.clob.notifications({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.orderScoring</code></b></summary>

<code>GET https://clob.polymarket.com/order-scoring{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/trade/get-order-scoring-status.md)

```typescript
const res = await polymarket.clob.orderScoring({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.ordersScoring</code></b></summary>

<code>GET https://clob.polymarket.com/orders-scoring{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/trade/get-order-scoring-status.md)

```typescript
const res = await polymarket.clob.ordersScoring({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.price</code></b></summary>

<code>GET https://clob.polymarket.com/price{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/market-data/get-market-price.md)

```typescript
const res = await polymarket.clob.price({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.prices</code></b></summary>

<code>GET https://clob.polymarket.com/prices{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/market-data/get-market-prices-query-parameters.md)

```typescript
const res = await polymarket.clob.prices({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.pricesHistory</code></b></summary>

<code>GET https://clob.polymarket.com/prices-history{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/markets/get-prices-history.md)

```typescript
const res = await polymarket.clob.pricesHistory({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.rebates.current</code></b></summary>

<code>GET https://clob.polymarket.com/rebates/current{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/rebates/get-current-rebated-fees-for-a-maker.md)

```typescript
const res = await polymarket.clob.rebates.current({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.rewards.markets.byCondition</code></b></summary>

<code>GET https://clob.polymarket.com/rewards/markets/{conditionId}{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/rewards/get-raw-rewards-for-a-specific-market.md)

```typescript
const res = await polymarket.clob.rewards.markets.byCondition({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.rewards.markets.current</code></b></summary>

<code>GET https://clob.polymarket.com/rewards/markets/current{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/rewards/get-current-active-rewards-configurations.md)

```typescript
const res = await polymarket.clob.rewards.markets.current({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.rewards.markets.multi</code></b></summary>

<code>GET https://clob.polymarket.com/rewards/markets/multi{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/rewards/get-multiple-markets-with-rewards.md)

```typescript
const res = await polymarket.clob.rewards.markets.multi({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.rewards.user</code></b></summary>

<code>GET https://clob.polymarket.com/rewards/user{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/rewards/get-earnings-for-user-by-date.md)

```typescript
const res = await polymarket.clob.rewards.user({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.rewards.userMarkets</code></b></summary>

<code>GET https://clob.polymarket.com/rewards/user/markets{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/rewards/get-user-earnings-and-markets-configuration.md)

```typescript
const res = await polymarket.clob.rewards.userMarkets({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.rewards.userPercentages</code></b></summary>

<code>GET https://clob.polymarket.com/rewards/user/percentages{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/rewards/get-reward-percentages-for-user.md)

```typescript
const res = await polymarket.clob.rewards.userPercentages({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.rewards.userTotal</code></b></summary>

<code>GET https://clob.polymarket.com/rewards/user/total{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/rewards/get-total-earnings-for-user-by-date.md)

```typescript
const res = await polymarket.clob.rewards.userTotal({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.samplingMarkets</code></b></summary>

<code>GET https://clob.polymarket.com/sampling-markets{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/markets/get-sampling-markets.md)

```typescript
const res = await polymarket.clob.samplingMarkets({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.samplingSimplifiedMarkets</code></b></summary>

<code>GET https://clob.polymarket.com/sampling-simplified-markets{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/markets/get-sampling-simplified-markets.md)

```typescript
const res = await polymarket.clob.samplingSimplifiedMarkets({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.simplifiedMarkets</code></b></summary>

<code>GET https://clob.polymarket.com/simplified-markets{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/markets/get-simplified-markets.md)

```typescript
const res = await polymarket.clob.simplifiedMarkets({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.spread</code></b></summary>

<code>GET https://clob.polymarket.com/spread{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/market-data/get-spread.md)

```typescript
const res = await polymarket.clob.spread({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.tickSize</code></b></summary>

<code>GET https://clob.polymarket.com/tick-size/{tokenId}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/market-data/get-tick-size-by-path-parameter.md)

```typescript
const res = await polymarket.clob.tickSize({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.tickSizeByQuery</code></b></summary>

<code>GET https://clob.polymarket.com/tick-size{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/market-data/get-tick-size.md)

```typescript
const res = await polymarket.clob.tickSizeByQuery({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.time</code></b></summary>

<code>GET https://clob.polymarket.com/time</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/data/get-server-time.md)

```typescript
const res = await polymarket.clob.time({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>POST</code> <b><code>polymarket.clob.auth.apiKey</code></b></summary>

<code>POST https://clob.polymarket.com/auth/api-key</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/authentication.md)

```typescript
const res = await polymarket.clob.auth.apiKey({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>POST</code> <b><code>polymarket.clob.auth.builderApiKey</code></b></summary>

<code>POST https://clob.polymarket.com/auth/builder-api-key</code>

[Upstream docs ↗](https://docs.polymarket.com/api-spec/clob-openapi.yaml)

```typescript
const res = await polymarket.clob.auth.builderApiKey({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>POST</code> <b><code>polymarket.clob.batchPricesHistory</code></b></summary>

<code>POST https://clob.polymarket.com/batch-prices-history</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/markets/get-batch-prices-history.md)

```typescript
const res = await polymarket.clob.batchPricesHistory({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>POST</code> <b><code>polymarket.clob.books</code></b></summary>

<code>POST https://clob.polymarket.com/books</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/market-data/get-order-books-request-body.md)

```typescript
const res = await polymarket.clob.books({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>POST</code> <b><code>polymarket.clob.heartbeats</code></b></summary>

<code>POST https://clob.polymarket.com/heartbeats</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/trade/send-heartbeat.md)

```typescript
const res = await polymarket.clob.heartbeats({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>POST</code> <b><code>polymarket.clob.lastTradesPrices</code></b></summary>

<code>POST https://clob.polymarket.com/last-trades-prices</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/market-data/get-last-trade-prices-request-body.md)

```typescript
const res = await polymarket.clob.lastTradesPrices({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>POST</code> <b><code>polymarket.clob.marketsLiveActivity</code></b></summary>

<code>POST https://clob.polymarket.com/markets/live-activity</code>

[Upstream docs ↗](https://docs.polymarket.com/api-spec/clob-openapi.yaml)

```typescript
const res = await polymarket.clob.marketsLiveActivity({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>POST</code> <b><code>polymarket.clob.midpoints</code></b></summary>

<code>POST https://clob.polymarket.com/midpoints</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/market-data/get-midpoint-prices-request-body.md)

```typescript
const res = await polymarket.clob.midpoints({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>POST</code> <b><code>polymarket.clob.order</code></b></summary>

<code>POST https://clob.polymarket.com/order</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/trade/post-a-new-order.md)

```typescript
const res = await polymarket.clob.order({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>POST</code> <b><code>polymarket.clob.orders</code></b></summary>

<code>POST https://clob.polymarket.com/orders</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/trade/post-multiple-orders.md)

```typescript
const res = await polymarket.clob.orders({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>POST</code> <b><code>polymarket.clob.ordersScoring</code></b></summary>

<code>POST https://clob.polymarket.com/orders-scoring</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/trade/get-order-scoring-status.md)

```typescript
const res = await polymarket.clob.ordersScoring({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>POST</code> <b><code>polymarket.clob.placeOrder</code></b></summary>

<code>POST https://clob.polymarket.com/order</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/trade/post-a-new-order.md)

```typescript
const res = await polymarket.clob.placeOrder({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>POST</code> <b><code>polymarket.clob.prices</code></b></summary>

<code>POST https://clob.polymarket.com/prices</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/market-data/get-market-prices-request-body.md)

```typescript
const res = await polymarket.clob.prices({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>POST</code> <b><code>polymarket.clob.spreads</code></b></summary>

<code>POST https://clob.polymarket.com/spreads</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/market-data/get-spreads.md)

```typescript
const res = await polymarket.clob.spreads({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>POST</code> <b><code>polymarket.clob.v1.heartbeats</code></b></summary>

<code>POST https://clob.polymarket.com/v1/heartbeats</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/trade/send-heartbeat.md)

```typescript
const res = await polymarket.clob.v1.heartbeats({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

<details>
<summary><code>PUT</code> <b><code>polymarket.clob.balanceAllowance</code></b></summary>

<code>PUT https://clob.polymarket.com/balance-allowance{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/authentication.md)

```typescript
const res = await polymarket.clob.balanceAllowance({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/clob.ts`](src/clob.ts)

</details>

### data

<details>
<summary><code>GET</code> <b><code>polymarket.data.accounting.snapshot</code></b></summary>

<code>GET https://data-api.polymarket.com/v1/accounting/snapshot{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/misc/download-an-accounting-snapshot-zip-of-csvs.md)

```typescript
const res = await polymarket.data.accounting.snapshot({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/data.ts`](src/data.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.data.activity</code></b></summary>

<code>GET https://data-api.polymarket.com/activity{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/core/get-user-activity.md)

```typescript
const res = await polymarket.data.activity({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/data.ts`](src/data.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.data.activity.combos</code></b></summary>

<code>GET https://data-api.polymarket.com/v1/activity/combos{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/core/get-user-combo-activity.md)

```typescript
const res = await polymarket.data.activity.combos({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/data.ts`](src/data.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.data.builders.leaderboard</code></b></summary>

<code>GET https://data-api.polymarket.com/v1/builders/leaderboard{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/builders/get-aggregated-builder-leaderboard.md)

```typescript
const res = await polymarket.data.builders.leaderboard({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/data.ts`](src/data.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.data.builders.volume</code></b></summary>

<code>GET https://data-api.polymarket.com/v1/builders/volume{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/builders/get-daily-builder-volume-time-series.md)

```typescript
const res = await polymarket.data.builders.volume({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/data.ts`](src/data.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.data.closedPositions</code></b></summary>

<code>GET https://data-api.polymarket.com/closed-positions{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/core/get-closed-positions-for-a-user.md)

```typescript
const res = await polymarket.data.closedPositions({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/data.ts`](src/data.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.data.health</code></b></summary>

<code>GET https://data-api.polymarket.com/</code>

[Upstream docs ↗](https://docs.polymarket.com/api-spec/data-openapi.yaml)

```typescript
const res = await polymarket.data.health({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/data.ts`](src/data.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.data.holders</code></b></summary>

<code>GET https://data-api.polymarket.com/holders{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/core/get-top-holders-for-markets.md)

```typescript
const res = await polymarket.data.holders({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/data.ts`](src/data.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.data.leaderboard</code></b></summary>

<code>GET https://data-api.polymarket.com/v1/leaderboard{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/core/get-trader-leaderboard-rankings.md)

```typescript
const res = await polymarket.data.leaderboard({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/data.ts`](src/data.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.data.liveVolume</code></b></summary>

<code>GET https://data-api.polymarket.com/live-volume{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/misc/get-live-volume-for-an-event.md)

```typescript
const res = await polymarket.data.liveVolume({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/data.ts`](src/data.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.data.marketPositions</code></b></summary>

<code>GET https://data-api.polymarket.com/v1/market-positions{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/core/get-positions-for-a-market.md)

```typescript
const res = await polymarket.data.marketPositions({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/data.ts`](src/data.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.data.oi</code></b></summary>

<code>GET https://data-api.polymarket.com/oi{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/misc/get-open-interest.md)

```typescript
const res = await polymarket.data.oi({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/data.ts`](src/data.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.data.positions</code></b></summary>

<code>GET https://data-api.polymarket.com/positions{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/core/get-current-positions-for-a-user.md)

```typescript
const res = await polymarket.data.positions({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/data.ts`](src/data.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.data.positions.combos</code></b></summary>

<code>GET https://data-api.polymarket.com/v1/positions/combos{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/core/get-user-combo-positions.md)

```typescript
const res = await polymarket.data.positions.combos({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/data.ts`](src/data.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.data.traded</code></b></summary>

<code>GET https://data-api.polymarket.com/traded{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/misc/get-total-markets-a-user-has-traded.md)

```typescript
const res = await polymarket.data.traded({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/data.ts`](src/data.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.data.trades</code></b></summary>

<code>GET https://data-api.polymarket.com/trades{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/core/get-trades-for-a-user-or-markets.md)

```typescript
const res = await polymarket.data.trades({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/data.ts`](src/data.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.data.value</code></b></summary>

<code>GET https://data-api.polymarket.com/value{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/core/get-total-value-of-a-users-positions.md)

```typescript
const res = await polymarket.data.value({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/data.ts`](src/data.ts)

</details>

### gamma

<details>
<summary><code>GET</code> <b><code>polymarket.gamma.comments</code></b></summary>

<code>GET https://gamma-api.polymarket.com/comments/{paramsOrIdOrSignal}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/comments/list-comments.md)

```typescript
const res = await polymarket.gamma.comments({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/gamma.ts`](src/gamma.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.gamma.comments.byUser</code></b></summary>

<code>GET https://gamma-api.polymarket.com/comments/user_address/{address}{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/comments/get-comments-by-user-address.md)

```typescript
const res = await polymarket.gamma.comments.byUser({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/gamma.ts`](src/gamma.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.gamma.events</code></b></summary>

<code>GET https://gamma-api.polymarket.com/events/{paramsOrIdOrSignal}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/events/list-events.md)

> **Deprecated upstream:** the replay fixture for the list form `GET /events?...` returned `Deprecation: true`, `Sunset: Fri, 01 May 2026 00:00:00 GMT`, and `Warning: 299 - "use /events/keyset"`. This compatibility method remains for existing bare-array `/events` callers; prefer `polymarket.gamma.events.keyset()` for new paginated event lists.

```typescript
const res = await polymarket.gamma.events({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/gamma.ts`](src/gamma.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.gamma.events.keyset</code></b></summary>

<code>GET https://gamma-api.polymarket.com/events/keyset{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/events/list-events-keyset-pagination.md)

```typescript
const res = await polymarket.gamma.events.keyset({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/gamma.ts`](src/gamma.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.gamma.events.slug</code></b></summary>

<code>GET https://gamma-api.polymarket.com/events/slug/{slug}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/events/get-event-by-slug.md)

```typescript
const res = await polymarket.gamma.events.slug({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/gamma.ts`](src/gamma.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.gamma.events.tags</code></b></summary>

<code>GET https://gamma-api.polymarket.com/events/{id}/tags</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/events/get-event-tags.md)

```typescript
const res = await polymarket.gamma.events.tags({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/gamma.ts`](src/gamma.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.gamma.markets</code></b></summary>

<code>GET https://gamma-api.polymarket.com/markets/{paramsOrIdOrSignal}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/markets/list-markets.md)

```typescript
const res = await polymarket.gamma.markets({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/gamma.ts`](src/gamma.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.gamma.markets.keyset</code></b></summary>

<code>GET https://gamma-api.polymarket.com/markets/keyset{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/markets/list-markets-keyset-pagination.md)

```typescript
const res = await polymarket.gamma.markets.keyset({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/gamma.ts`](src/gamma.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.gamma.markets.slug</code></b></summary>

<code>GET https://gamma-api.polymarket.com/markets/slug/{slug}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/markets/get-market-by-slug.md)

```typescript
const res = await polymarket.gamma.markets.slug({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/gamma.ts`](src/gamma.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.gamma.markets.tags</code></b></summary>

<code>GET https://gamma-api.polymarket.com/markets/{id}/tags</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/markets/get-market-tags-by-id.md)

```typescript
const res = await polymarket.gamma.markets.tags({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/gamma.ts`](src/gamma.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.gamma.publicProfile</code></b></summary>

<code>GET https://gamma-api.polymarket.com/public-profile{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/profiles/get-public-profile-by-wallet-address.md)

```typescript
const res = await polymarket.gamma.publicProfile({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/gamma.ts`](src/gamma.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.gamma.search</code></b></summary>

<code>GET https://gamma-api.polymarket.com/public-search{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/search/search-markets-events-and-profiles.md)

```typescript
const res = await polymarket.gamma.search({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/gamma.ts`](src/gamma.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.gamma.series</code></b></summary>

<code>GET https://gamma-api.polymarket.com/series/{paramsOrIdOrSignal}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/series/list-series.md)

```typescript
const res = await polymarket.gamma.series({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/gamma.ts`](src/gamma.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.gamma.sports</code></b></summary>

<code>GET https://gamma-api.polymarket.com/sports</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/sports/get-sports-metadata-information.md)

```typescript
const res = await polymarket.gamma.sports({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/gamma.ts`](src/gamma.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.gamma.sports.marketTypes</code></b></summary>

<code>GET https://gamma-api.polymarket.com/sports/market-types</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/sports/get-valid-sports-market-types.md)

```typescript
const res = await polymarket.gamma.sports.marketTypes({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/gamma.ts`](src/gamma.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.gamma.status</code></b></summary>

<code>GET https://gamma-api.polymarket.com/status</code>

[Upstream docs ↗](https://docs.polymarket.com/api-spec/gamma-openapi.yaml)

```typescript
const res = await polymarket.gamma.status({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/gamma.ts`](src/gamma.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.gamma.tags</code></b></summary>

<code>GET https://gamma-api.polymarket.com/tags/{paramsOrIdOrSignal}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/tags/list-tags.md)

```typescript
const res = await polymarket.gamma.tags({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/gamma.ts`](src/gamma.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.gamma.tags.relatedTags</code></b></summary>

<code>GET https://gamma-api.polymarket.com/tags/{id}/related-tags{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/tags/get-related-tags-relationships-by-tag-id.md)

```typescript
const res = await polymarket.gamma.tags.relatedTags({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/gamma.ts`](src/gamma.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.gamma.tags.relatedTags.slug</code></b></summary>

<code>GET https://gamma-api.polymarket.com/tags/slug/{slug}/related-tags{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/tags/get-related-tags-relationships-by-tag-slug.md)

```typescript
const res = await polymarket.gamma.tags.relatedTags.slug({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/gamma.ts`](src/gamma.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.gamma.tags.relatedTags.tags</code></b></summary>

<code>GET https://gamma-api.polymarket.com/tags/{id}/related-tags/tags{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/tags/get-tags-related-to-a-tag-id.md)

```typescript
const res = await polymarket.gamma.tags.relatedTags.tags({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/gamma.ts`](src/gamma.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.gamma.tags.relatedTags.tags.slug</code></b></summary>

<code>GET https://gamma-api.polymarket.com/tags/slug/{slug}/related-tags/tags{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/tags/get-tags-related-to-a-tag-slug.md)

```typescript
const res = await polymarket.gamma.tags.relatedTags.tags.slug({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/gamma.ts`](src/gamma.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.gamma.tags.slug</code></b></summary>

<code>GET https://gamma-api.polymarket.com/tags/slug/{slug}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/tags/get-tag-by-slug.md)

```typescript
const res = await polymarket.gamma.tags.slug({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/gamma.ts`](src/gamma.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.gamma.teams</code></b></summary>

<code>GET https://gamma-api.polymarket.com/teams{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/sports/list-teams.md)

```typescript
const res = await polymarket.gamma.teams({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/gamma.ts`](src/gamma.ts)

</details>

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
