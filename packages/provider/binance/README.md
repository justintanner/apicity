# @apicity/binance

[![npm](https://img.shields.io/npm/v/@apicity/binance?color=cb0000)](https://www.npmjs.com/package/@apicity/binance)
[![dependencies](https://img.shields.io/badge/dependencies-1-blue)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)
[![docs](https://img.shields.io/badge/docs-developers.binance.com-blue)](https://developers.binance.com/docs/binance-spot-api-docs/rest-api/general-api-information)

Binance REST API provider for Spot and Options public market data.

Runtime dependencies:

- `zod@^3.24.0` — request schemas attached to every POST endpoint as `.schema`

## Installation

```bash
npm install @apicity/binance
# or
pnpm add @apicity/binance
```

## Quick Start

```typescript
import { createBinance } from "@apicity/binance";

const binance = createBinance();
```

## API Reference

30 endpoints across 14 groups. Each method mirrors an upstream URL path.

### aggTrades

<details>
<summary><code>GET</code> <b><code>binance.api.v3.aggTrades</code></b></summary>

<code>GET https://api.binance.com/api/v3/aggTrades{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/binance-spot-api-docs/rest-api/market-data-endpoints#compressedaggregate-trades-list)

```typescript
const res = await binance.api.v3.aggTrades({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

### avgPrice

<details>
<summary><code>GET</code> <b><code>binance.api.v3.avgPrice</code></b></summary>

<code>GET https://api.binance.com/api/v3/avgPrice{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/binance-spot-api-docs/rest-api/market-data-endpoints#current-average-price)

```typescript
const res = await binance.api.v3.avgPrice({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

### depth

<details>
<summary><code>GET</code> <b><code>binance.api.v3.depth</code></b></summary>

<code>GET https://api.binance.com/api/v3/depth{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/binance-spot-api-docs/rest-api/market-data-endpoints#order-book)

```typescript
const res = await binance.api.v3.depth({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

### eapi

<details>
<summary><code>GET</code> <b><code>binance.eapi.v1.blockTrades</code></b></summary>

<code>GET https://eapi.binance.com/eapi/v1/blockTrades{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/options-trading/market-data/Recent-Block-Trade-List)

```typescript
const res = await binance.eapi.v1.blockTrades({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.eapi.v1.depth</code></b></summary>

<code>GET https://eapi.binance.com/eapi/v1/depth{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/options-trading/market-data/Order-Book)

```typescript
const res = await binance.eapi.v1.depth({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.eapi.v1.exchangeInfo</code></b></summary>

<code>GET https://eapi.binance.com/eapi/v1/exchangeInfo</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/options-trading/market-data/Exchange-Information)

```typescript
const res = await binance.eapi.v1.exchangeInfo({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.eapi.v1.exerciseHistory</code></b></summary>

<code>GET https://eapi.binance.com/eapi/v1/exerciseHistory{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/options-trading/market-data/Historical-Exercise-Records)

```typescript
const res = await binance.eapi.v1.exerciseHistory({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.eapi.v1.index</code></b></summary>

<code>GET https://eapi.binance.com/eapi/v1/index{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/options-trading/market-data/Symbol-Price-Ticker)

```typescript
const res = await binance.eapi.v1.index({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.eapi.v1.klines</code></b></summary>

<code>GET https://eapi.binance.com/eapi/v1/klines{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/options-trading/market-data/Kline-Candlestick-Data)

```typescript
const res = await binance.eapi.v1.klines({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.eapi.v1.mark</code></b></summary>

<code>GET https://eapi.binance.com/eapi/v1/mark{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/options-trading/market-data/Option-Mark-Price)

```typescript
const res = await binance.eapi.v1.mark({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.eapi.v1.openInterest</code></b></summary>

<code>GET https://eapi.binance.com/eapi/v1/openInterest{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/options-trading/market-data/Open-Interest)

```typescript
const res = await binance.eapi.v1.openInterest({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.eapi.v1.ping</code></b></summary>

<code>GET https://eapi.binance.com/eapi/v1/ping</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/options-trading/market-data/Test-Connectivity)

```typescript
const res = await binance.eapi.v1.ping({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.eapi.v1.ticker</code></b></summary>

<code>GET https://eapi.binance.com/eapi/v1/ticker{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/options-trading/market-data/24hr-Ticker-Price-Change-Statistics)

```typescript
const res = await binance.eapi.v1.ticker({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.eapi.v1.time</code></b></summary>

<code>GET https://eapi.binance.com/eapi/v1/time</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/options-trading/market-data/Check-Server-Time)

```typescript
const res = await binance.eapi.v1.time({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.eapi.v1.trades</code></b></summary>

<code>GET https://eapi.binance.com/eapi/v1/trades{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/options-trading/market-data/Recent-Trades-List)

```typescript
const res = await binance.eapi.v1.trades({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

### exchangeInfo

<details>
<summary><code>GET</code> <b><code>binance.api.v3.exchangeInfo</code></b></summary>

<code>GET https://api.binance.com/api/v3/exchangeInfo{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/binance-spot-api-docs/rest-api/general-endpoints#exchange-information)

```typescript
const res = await binance.api.v3.exchangeInfo({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

### historicalBlockTrades

<details>
<summary><code>GET</code> <b><code>binance.api.v3.historicalBlockTrades</code></b></summary>

<code>GET https://api.binance.com/api/v3/historicalBlockTrades{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/binance-spot-api-docs/rest-api/market-data-endpoints#historical-block-trades)

```typescript
const res = await binance.api.v3.historicalBlockTrades({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

### historicalTrades

<details>
<summary><code>GET</code> <b><code>binance.api.v3.historicalTrades</code></b></summary>

<code>GET https://api.binance.com/api/v3/historicalTrades{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/binance-spot-api-docs/rest-api/market-data-endpoints#old-trade-lookup)

```typescript
const res = await binance.api.v3.historicalTrades({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

### klines

<details>
<summary><code>GET</code> <b><code>binance.api.v3.klines</code></b></summary>

<code>GET https://api.binance.com/api/v3/klines{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/binance-spot-api-docs/rest-api/market-data-endpoints#klinecandlestick-data)

```typescript
const res = await binance.api.v3.klines({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

### ping

<details>
<summary><code>GET</code> <b><code>binance.api.v3.ping</code></b></summary>

<code>GET https://api.binance.com/api/v3/ping</code>

[Upstream docs ↗](https://developers.binance.com/docs/binance-spot-api-docs/rest-api/general-endpoints#test-connectivity)

```typescript
const res = await binance.api.v3.ping({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

### referencePrice

<details>
<summary><code>GET</code> <b><code>binance.api.v3.referencePrice</code></b></summary>

<code>GET https://api.binance.com/api/v3/referencePrice{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/binance-spot-api-docs/rest-api/market-data-endpoints#query-reference-price)

```typescript
const res = await binance.api.v3.referencePrice({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.api.v3.referencePrice.calculation</code></b></summary>

<code>GET https://api.binance.com/api/v3/referencePrice/calculation{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/binance-spot-api-docs/rest-api/market-data-endpoints#query-reference-price-calculation)

```typescript
const res = await binance.api.v3.referencePrice.calculation({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

### ticker

<details>
<summary><code>GET</code> <b><code>binance.api.v3.ticker</code></b></summary>

<code>GET https://api.binance.com/api/v3/ticker{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/binance-spot-api-docs/rest-api/market-data-endpoints#rolling-window-price-change-statistics)

```typescript
const res = await binance.api.v3.ticker({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.api.v3.ticker.bookTicker</code></b></summary>

<code>GET https://api.binance.com/api/v3/ticker/bookTicker{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/binance-spot-api-docs/rest-api/market-data-endpoints#symbol-order-book-ticker)

```typescript
const res = await binance.api.v3.ticker.bookTicker({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.api.v3.ticker.price</code></b></summary>

<code>GET https://api.binance.com/api/v3/ticker/price{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/binance-spot-api-docs/rest-api/market-data-endpoints#symbol-price-ticker)

```typescript
const res = await binance.api.v3.ticker.price({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.api.v3.ticker.tradingDay</code></b></summary>

<code>GET https://api.binance.com/api/v3/ticker/tradingDay{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/binance-spot-api-docs/rest-api/market-data-endpoints#trading-day-ticker)

```typescript
const res = await binance.api.v3.ticker.tradingDay({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.api.v3.ticker.twentyFourHr</code></b></summary>

<code>GET https://api.binance.com/api/v3/ticker/24hr{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/binance-spot-api-docs/rest-api/market-data-endpoints#24hr-ticker-price-change-statistics)

```typescript
const res = await binance.api.v3.ticker.twentyFourHr({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

### time

<details>
<summary><code>GET</code> <b><code>binance.api.v3.time</code></b></summary>

<code>GET https://api.binance.com/api/v3/time</code>

[Upstream docs ↗](https://developers.binance.com/docs/binance-spot-api-docs/rest-api/general-endpoints#check-server-time)

```typescript
const res = await binance.api.v3.time({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

### trades

<details>
<summary><code>GET</code> <b><code>binance.api.v3.trades</code></b></summary>

<code>GET https://api.binance.com/api/v3/trades{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/binance-spot-api-docs/rest-api/market-data-endpoints#recent-trades-list)

```typescript
const res = await binance.api.v3.trades({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

### uiKlines

<details>
<summary><code>GET</code> <b><code>binance.api.v3.uiKlines</code></b></summary>

<code>GET https://api.binance.com/api/v3/uiKlines{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/binance-spot-api-docs/rest-api/market-data-endpoints#uiklines)

```typescript
const res = await binance.api.v3.uiKlines({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
