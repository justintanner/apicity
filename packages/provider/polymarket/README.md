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

15 endpoints across 1 group. Each method mirrors an upstream URL path.

### clob

<details>
<summary><code>GET</code> <b><code>polymarket.clob.book</code></b></summary>

<code>GET https://clob.polymarket.com/book{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/clob/get-order-book)

```typescript
const res = await polymarket.clob.book({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/polymarket.ts`](src/polymarket.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.clobMarkets</code></b></summary>

<code>GET https://clob.polymarket.com/clob-markets/{conditionId}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/clob/get-clob-market-info)

```typescript
const res = await polymarket.clob.clobMarkets({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/polymarket.ts`](src/polymarket.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.feeRate</code></b></summary>

<code>GET https://clob.polymarket.com/fee-rate/{tokenId}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/clob/get-fee-rate)

```typescript
const res = await polymarket.clob.feeRate({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/polymarket.ts`](src/polymarket.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.lastTradePrice</code></b></summary>

<code>GET https://clob.polymarket.com/last-trade-price{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/clob/get-last-trade-price)

```typescript
const res = await polymarket.clob.lastTradePrice({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/polymarket.ts`](src/polymarket.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.markets</code></b></summary>

<code>GET https://clob.polymarket.com/markets/{paramsOrConditionIdOrSignal}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/clob/get-markets)

```typescript
const res = await polymarket.clob.markets({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/polymarket.ts`](src/polymarket.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.marketsByToken</code></b></summary>

<code>GET https://clob.polymarket.com/markets-by-token/{tokenId}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/clob/get-market-by-token)

```typescript
const res = await polymarket.clob.marketsByToken({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/polymarket.ts`](src/polymarket.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.midpoint</code></b></summary>

<code>GET https://clob.polymarket.com/midpoint{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/clob/get-midpoint)

```typescript
const res = await polymarket.clob.midpoint({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/polymarket.ts`](src/polymarket.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.price</code></b></summary>

<code>GET https://clob.polymarket.com/price{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/clob/get-market-price)

```typescript
const res = await polymarket.clob.price({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/polymarket.ts`](src/polymarket.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.pricesHistory</code></b></summary>

<code>GET https://clob.polymarket.com/prices-history{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/clob/get-prices-history)

```typescript
const res = await polymarket.clob.pricesHistory({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/polymarket.ts`](src/polymarket.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.samplingMarkets</code></b></summary>

<code>GET https://clob.polymarket.com/sampling-markets{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/clob/get-sampling-markets)

```typescript
const res = await polymarket.clob.samplingMarkets({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/polymarket.ts`](src/polymarket.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.samplingSimplifiedMarkets</code></b></summary>

<code>GET https://clob.polymarket.com/sampling-simplified-markets{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/clob/get-sampling-simplified-markets)

```typescript
const res = await polymarket.clob.samplingSimplifiedMarkets({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/polymarket.ts`](src/polymarket.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.simplifiedMarkets</code></b></summary>

<code>GET https://clob.polymarket.com/simplified-markets{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/clob/get-simplified-markets)

```typescript
const res = await polymarket.clob.simplifiedMarkets({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/polymarket.ts`](src/polymarket.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.spread</code></b></summary>

<code>GET https://clob.polymarket.com/spread{query}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/clob/get-spread)

```typescript
const res = await polymarket.clob.spread({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/polymarket.ts`](src/polymarket.ts)

</details>

<details>
<summary><code>GET</code> <b><code>polymarket.clob.tickSize</code></b></summary>

<code>GET https://clob.polymarket.com/tick-size/{tokenId}</code>

[Upstream docs ↗](https://docs.polymarket.com/api-reference/clob/get-tick-size)

```typescript
const res = await polymarket.clob.tickSize({ /* ... */ });
```

Source: [`packages/provider/polymarket/src/polymarket.ts`](src/polymarket.ts)

</details>

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
