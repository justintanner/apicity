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

29 endpoints across 2 groups. Each method mirrors an upstream URL path.

### clob

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

### gamma

<details>
<summary><code>GET</code> <b><code>polymarket.gamma.events</code></b></summary>

<code>GET https://gamma-api.polymarket.com/events/{paramsOrIdOrSignal}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/gamma/get-events)

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

## License

MIT
