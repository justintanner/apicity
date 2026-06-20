# @apicity/binance

[![npm](https://img.shields.io/npm/v/@apicity/binance?color=cb0000)](https://www.npmjs.com/package/@apicity/binance)
[![dependencies](https://img.shields.io/badge/dependencies-1-blue)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)
[![docs](https://img.shields.io/badge/docs-developers.binance.com-blue)](https://developers.binance.com/docs/binance-spot-api-docs/rest-api/general-api-information)

Binance Spot, USD-M Futures, COIN-M Futures, and Options public REST API provider.

Binance coverage is focused on public REST market-data reads across Spot, USD-M Futures, COIN-M Futures, and Options. The COIN-M Old Trades Lookup endpoint (`GET /dapi/v1/historicalTrades`) is intentionally not exposed because Binance requires an API key for it. USD-M Old Trades Lookup (`GET /fapi/v1/historicalTrades`), signed trade, account, and user endpoints are out of scope.

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

## Public Market Data

`createBinance()` works without credentials for the public market-data
surface. Pass `apiKey` only when you intentionally call a Binance
endpoint that is documented as API-key or `MARKET_DATA`; signed trade,
account, and user-data-stream endpoints are not exposed by this package.

| Surface | Namespace | Default host | Auth |
|---------|-----------|--------------|------|
| Spot REST | `binance.api.v3.*` | `https://api.binance.com` | No key for public market data; optional `apiKey` header when supplied |
| Spot market-data-only REST | `binance.api.v3.*` with `spotBaseURL` | `https://data-api.binance.vision` | No key |
| USD-M Futures | `binance.fapi.v1.*`, `binance.fapi.v2.*`, `binance.futures.data.*` | `https://fapi.binance.com` | No key for exposed endpoints |
| COIN-M Futures | `binance.dapi.v1.*`, `binance.coinMFutures.data.*` | `https://dapi.binance.com` | No key for exposed endpoints |
| Options | `binance.eapi.v1.*` | `https://eapi.binance.com` | No key for exposed endpoints |

To send existing Spot public calls to Binance's market-data-only host,
override the Spot base URL. This keeps the same `api.v3` method paths
while changing the host:

```typescript
const binance = createBinance({
  spotBaseURL: "https://data-api.binance.vision",
});

const exchangeInfo = await binance.api.v3.exchangeInfo({
  symbol: "BTCUSDT",
  showPermissionSets: false,
});
```

You can also configure every public host explicitly:

```typescript
const binance = createBinance({
  publicBaseURLs: {
    spot: "https://data-api.binance.vision",
    spotData: "https://data-api.binance.vision",
    fapi: "https://fapi.binance.com",
    dapi: "https://dapi.binance.com",
    eapi: "https://eapi.binance.com",
  },
});
```

`binance.public.*` contains explicit no-auth smoke aliases for each
public surface, and `binance.public.coinMFutures.*` mirrors the COIN-M
public REST tree. Use the top-level namespaces above for the full
implemented market-data surface.

The `https://data.binance.vision` static archive serves public ZIP and
checksum files for historical Spot, USD-M, and COIN-M datasets. It is
intentionally outside this JSON REST provider; archive downloads need
separate binary/checksum handling and tests.

## API Reference

93 endpoints across 20 groups. Each method mirrors an upstream URL path.

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

### coinMFutures

<details>
<summary><code>GET</code> <b><code>binance.coinMFutures.data.basis</code></b></summary>

<code>GET https://dapi.binance.com/futures/data/basis{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/coin-margined-futures/market-data/rest-api/Basis)

```typescript
const res = await binance.coinMFutures.data.basis({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.coinMFutures.data.deliveryPrice</code></b></summary>

<code>GET https://dapi.binance.com/futures/data/delivery-price{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/usds-margined-futures/market-data/rest-api/Delivery-Price)

```typescript
const res = await binance.coinMFutures.data.deliveryPrice({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.coinMFutures.data.globalLongShortAccountRatio</code></b></summary>

<code>GET https://dapi.binance.com/futures/data/globalLongShortAccountRatio{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/coin-margined-futures/market-data/rest-api/Long-Short-Ratio)

```typescript
const res = await binance.coinMFutures.data.globalLongShortAccountRatio({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.coinMFutures.data.openInterestHist</code></b></summary>

<code>GET https://dapi.binance.com/futures/data/openInterestHist{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/coin-margined-futures/market-data/rest-api/Open-Interest-Statistics)

```typescript
const res = await binance.coinMFutures.data.openInterestHist({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.coinMFutures.data.takerBuySellVol</code></b></summary>

<code>GET https://dapi.binance.com/futures/data/takerBuySellVol{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/coin-margined-futures/market-data/rest-api/Taker-Buy-Sell-Volume)

```typescript
const res = await binance.coinMFutures.data.takerBuySellVol({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.coinMFutures.data.topLongShortAccountRatio</code></b></summary>

<code>GET https://dapi.binance.com/futures/data/topLongShortAccountRatio{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/coin-margined-futures/market-data/rest-api/Top-Long-Short-Account-Ratio)

```typescript
const res = await binance.coinMFutures.data.topLongShortAccountRatio({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.coinMFutures.data.topLongShortPositionRatio</code></b></summary>

<code>GET https://dapi.binance.com/futures/data/topLongShortPositionRatio{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/coin-margined-futures/market-data/rest-api/Top-Trader-Long-Short-Ratio)

```typescript
const res = await binance.coinMFutures.data.topLongShortPositionRatio({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

### dapi

<details>
<summary><code>GET</code> <b><code>binance.dapi.v1.aggTrades</code></b></summary>

<code>GET https://dapi.binance.com/dapi/v1/aggTrades{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/coin-margined-futures/market-data/rest-api/Compressed-Aggregate-Trades-List)

```typescript
const res = await binance.dapi.v1.aggTrades({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.dapi.v1.constituents</code></b></summary>

<code>GET https://dapi.binance.com/dapi/v1/constituents{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/coin-margined-futures/market-data/rest-api/Index-Constituents)

```typescript
const res = await binance.dapi.v1.constituents({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.dapi.v1.continuousKlines</code></b></summary>

<code>GET https://dapi.binance.com/dapi/v1/continuousKlines{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/coin-margined-futures/market-data/rest-api/Continuous-Contract-Kline-Candlestick-Data)

```typescript
const res = await binance.dapi.v1.continuousKlines({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.dapi.v1.depth</code></b></summary>

<code>GET https://dapi.binance.com/dapi/v1/depth{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/coin-margined-futures/market-data/rest-api/Order-Book)

```typescript
const res = await binance.dapi.v1.depth({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.dapi.v1.exchangeInfo</code></b></summary>

<code>GET https://dapi.binance.com/dapi/v1/exchangeInfo</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/coin-margined-futures/market-data/rest-api/Exchange-Information)

```typescript
const res = await binance.dapi.v1.exchangeInfo({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.dapi.v1.fundingInfo</code></b></summary>

<code>GET https://dapi.binance.com/dapi/v1/fundingInfo</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/coin-margined-futures/market-data/rest-api/Get-Funding-Info)

```typescript
const res = await binance.dapi.v1.fundingInfo({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.dapi.v1.fundingRate</code></b></summary>

<code>GET https://dapi.binance.com/dapi/v1/fundingRate{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/coin-margined-futures/market-data/rest-api/Get-Funding-Rate-History-of-Perpetual-Futures)

```typescript
const res = await binance.dapi.v1.fundingRate({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.dapi.v1.indexPriceKlines</code></b></summary>

<code>GET https://dapi.binance.com/dapi/v1/indexPriceKlines{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/coin-margined-futures/market-data/rest-api/Index-Price-Kline-Candlestick-Data)

```typescript
const res = await binance.dapi.v1.indexPriceKlines({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.dapi.v1.klines</code></b></summary>

<code>GET https://dapi.binance.com/dapi/v1/klines{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/coin-margined-futures/market-data/rest-api/Kline-Candlestick-Data)

```typescript
const res = await binance.dapi.v1.klines({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.dapi.v1.markPriceKlines</code></b></summary>

<code>GET https://dapi.binance.com/dapi/v1/markPriceKlines{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/coin-margined-futures/market-data/rest-api/Mark-Price-Kline-Candlestick-Data)

```typescript
const res = await binance.dapi.v1.markPriceKlines({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.dapi.v1.openInterest</code></b></summary>

<code>GET https://dapi.binance.com/dapi/v1/openInterest{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/coin-margined-futures/market-data/rest-api/Open-Interest)

```typescript
const res = await binance.dapi.v1.openInterest({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.dapi.v1.ping</code></b></summary>

<code>GET https://dapi.binance.com/dapi/v1/ping</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/coin-margined-futures/market-data/rest-api/Test-Connectivity)

```typescript
const res = await binance.dapi.v1.ping({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.dapi.v1.premiumIndex</code></b></summary>

<code>GET https://dapi.binance.com/dapi/v1/premiumIndex{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/coin-margined-futures/market-data/rest-api/Index-Price-and-Mark-Price)

```typescript
const res = await binance.dapi.v1.premiumIndex({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.dapi.v1.premiumIndexKlines</code></b></summary>

<code>GET https://dapi.binance.com/dapi/v1/premiumIndexKlines{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/coin-margined-futures/market-data/rest-api/Premium-Index-Kline-Data)

```typescript
const res = await binance.dapi.v1.premiumIndexKlines({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.dapi.v1.ticker.bookTicker</code></b></summary>

<code>GET https://dapi.binance.com/dapi/v1/ticker/bookTicker{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/coin-margined-futures/market-data/rest-api/Symbol-Order-Book-Ticker)

```typescript
const res = await binance.dapi.v1.ticker.bookTicker({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.dapi.v1.ticker.price</code></b></summary>

<code>GET https://dapi.binance.com/dapi/v1/ticker/price{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/coin-margined-futures/market-data/rest-api/Symbol-Price-Ticker)

```typescript
const res = await binance.dapi.v1.ticker.price({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.dapi.v1.ticker.twentyFourHr</code></b></summary>

<code>GET https://dapi.binance.com/dapi/v1/ticker/24hr{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/coin-margined-futures/market-data/rest-api/24hr-Ticker-Price-Change-Statistics)

```typescript
const res = await binance.dapi.v1.ticker.twentyFourHr({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.dapi.v1.time</code></b></summary>

<code>GET https://dapi.binance.com/dapi/v1/time</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/coin-margined-futures/market-data/rest-api/Check-Server-time)

```typescript
const res = await binance.dapi.v1.time({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.dapi.v1.trades</code></b></summary>

<code>GET https://dapi.binance.com/dapi/v1/trades{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/coin-margined-futures/market-data/rest-api/Recent-Trades-List)

```typescript
const res = await binance.dapi.v1.trades({ /* ... */ });
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

### executionRules

<details>
<summary><code>GET</code> <b><code>binance.api.v3.executionRules</code></b></summary>

<code>GET https://api.binance.com/api/v3/executionRules{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/binance-spot-api-docs/rest-api/general-endpoints#query-execution-rules)

```typescript
const res = await binance.api.v3.executionRules({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

### fapi

<details>
<summary><code>GET</code> <b><code>binance.fapi.v1.aggTrades</code></b></summary>

<code>GET https://fapi.binance.com/fapi/v1/aggTrades{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/usds-margined-futures/market-data/rest-api/Compressed-Aggregate-Trades-List)

```typescript
const res = await binance.fapi.v1.aggTrades({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.fapi.v1.assetIndex</code></b></summary>

<code>GET https://fapi.binance.com/fapi/v1/assetIndex{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/usds-margined-futures/market-data/rest-api/Multi-Assets-Mode-Asset-Index)

```typescript
const res = await binance.fapi.v1.assetIndex({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.fapi.v1.constituents</code></b></summary>

<code>GET https://fapi.binance.com/fapi/v1/constituents{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/usds-margined-futures/market-data/rest-api/Index-Constituents)

```typescript
const res = await binance.fapi.v1.constituents({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.fapi.v1.continuousKlines</code></b></summary>

<code>GET https://fapi.binance.com/fapi/v1/continuousKlines{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/usds-margined-futures/market-data/rest-api/Continuous-Contract-Kline-Candlestick-Data)

```typescript
const res = await binance.fapi.v1.continuousKlines({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.fapi.v1.depth</code></b></summary>

<code>GET https://fapi.binance.com/fapi/v1/depth{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/usds-margined-futures/market-data/rest-api/Order-Book)

```typescript
const res = await binance.fapi.v1.depth({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.fapi.v1.exchangeInfo</code></b></summary>

<code>GET https://fapi.binance.com/fapi/v1/exchangeInfo</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/usds-margined-futures/market-data/rest-api/Exchange-Information)

```typescript
const res = await binance.fapi.v1.exchangeInfo({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.fapi.v1.fundingInfo</code></b></summary>

<code>GET https://fapi.binance.com/fapi/v1/fundingInfo</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/usds-margined-futures/market-data/rest-api/Get-Funding-Rate-Info)

```typescript
const res = await binance.fapi.v1.fundingInfo({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.fapi.v1.fundingRate</code></b></summary>

<code>GET https://fapi.binance.com/fapi/v1/fundingRate{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/usds-margined-futures/market-data/rest-api/Get-Funding-Rate-History)

```typescript
const res = await binance.fapi.v1.fundingRate({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.fapi.v1.indexInfo</code></b></summary>

<code>GET https://fapi.binance.com/fapi/v1/indexInfo{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/usds-margined-futures/market-data/rest-api/Composite-Index-Symbol-Information)

```typescript
const res = await binance.fapi.v1.indexInfo({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.fapi.v1.indexPriceKlines</code></b></summary>

<code>GET https://fapi.binance.com/fapi/v1/indexPriceKlines{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/usds-margined-futures/market-data/rest-api/Index-Price-Kline-Candlestick-Data)

```typescript
const res = await binance.fapi.v1.indexPriceKlines({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.fapi.v1.insuranceBalance</code></b></summary>

<code>GET https://fapi.binance.com/fapi/v1/insuranceBalance{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/usds-margined-futures/market-data/rest-api/Insurance-Fund-Balance)

```typescript
const res = await binance.fapi.v1.insuranceBalance({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.fapi.v1.klines</code></b></summary>

<code>GET https://fapi.binance.com/fapi/v1/klines{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/usds-margined-futures/market-data/rest-api/Kline-Candlestick-Data)

```typescript
const res = await binance.fapi.v1.klines({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.fapi.v1.markPriceKlines</code></b></summary>

<code>GET https://fapi.binance.com/fapi/v1/markPriceKlines{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/usds-margined-futures/market-data/rest-api/Mark-Price-Kline-Candlestick-Data)

```typescript
const res = await binance.fapi.v1.markPriceKlines({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.fapi.v1.openInterest</code></b></summary>

<code>GET https://fapi.binance.com/fapi/v1/openInterest{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/usds-margined-futures/market-data/rest-api/Open-Interest)

```typescript
const res = await binance.fapi.v1.openInterest({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.fapi.v1.ping</code></b></summary>

<code>GET https://fapi.binance.com/fapi/v1/ping</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/usds-margined-futures/market-data/rest-api/Test-Connectivity)

```typescript
const res = await binance.fapi.v1.ping({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.fapi.v1.premiumIndex</code></b></summary>

<code>GET https://fapi.binance.com/fapi/v1/premiumIndex{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/usds-margined-futures/market-data/rest-api/Mark-Price)

```typescript
const res = await binance.fapi.v1.premiumIndex({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.fapi.v1.premiumIndexKlines</code></b></summary>

<code>GET https://fapi.binance.com/fapi/v1/premiumIndexKlines{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/usds-margined-futures/market-data/rest-api/Premium-Index-Kline-Data)

```typescript
const res = await binance.fapi.v1.premiumIndexKlines({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.fapi.v1.rpiDepth</code></b></summary>

<code>GET https://fapi.binance.com/fapi/v1/rpiDepth{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/usds-margined-futures/market-data/rest-api/Order-Book-RPI)

```typescript
const res = await binance.fapi.v1.rpiDepth({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.fapi.v1.symbolAdlRisk</code></b></summary>

<code>GET https://fapi.binance.com/fapi/v1/symbolAdlRisk{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/usds-margined-futures/market-data/rest-api/ADL-Risk)

```typescript
const res = await binance.fapi.v1.symbolAdlRisk({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.fapi.v1.ticker.bookTicker</code></b></summary>

<code>GET https://fapi.binance.com/fapi/v1/ticker/bookTicker{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/usds-margined-futures/market-data/rest-api/Symbol-Order-Book-Ticker)

```typescript
const res = await binance.fapi.v1.ticker.bookTicker({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.fapi.v1.ticker.twentyFourHr</code></b></summary>

<code>GET https://fapi.binance.com/fapi/v1/ticker/24hr{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/usds-margined-futures/market-data/rest-api/24hr-Ticker-Price-Change-Statistics)

```typescript
const res = await binance.fapi.v1.ticker.twentyFourHr({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.fapi.v1.time</code></b></summary>

<code>GET https://fapi.binance.com/fapi/v1/time</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/usds-margined-futures/market-data/rest-api/Check-Server-Time)

```typescript
const res = await binance.fapi.v1.time({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.fapi.v1.trades</code></b></summary>

<code>GET https://fapi.binance.com/fapi/v1/trades{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/usds-margined-futures/market-data/rest-api/Recent-Trades-List)

```typescript
const res = await binance.fapi.v1.trades({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.fapi.v1.tradingSchedule</code></b></summary>

<code>GET https://fapi.binance.com/fapi/v1/tradingSchedule</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/usds-margined-futures/market-data/rest-api/Trading-Schedule)

```typescript
const res = await binance.fapi.v1.tradingSchedule({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.fapi.v2.ticker.price</code></b></summary>

<code>GET https://fapi.binance.com/fapi/v2/ticker/price{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/usds-margined-futures/market-data/rest-api/Symbol-Price-Ticker-v2)

```typescript
const res = await binance.fapi.v2.ticker.price({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

### futures

<details>
<summary><code>GET</code> <b><code>binance.futures.data.basis</code></b></summary>

<code>GET https://fapi.binance.com/futures/data/basis{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/usds-margined-futures/market-data/rest-api/Basis)

```typescript
const res = await binance.futures.data.basis({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.futures.data.deliveryPrice</code></b></summary>

<code>GET https://fapi.binance.com/futures/data/delivery-price{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/usds-margined-futures/market-data/rest-api/Delivery-Price)

```typescript
const res = await binance.futures.data.deliveryPrice({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.futures.data.globalLongShortAccountRatio</code></b></summary>

<code>GET https://fapi.binance.com/futures/data/globalLongShortAccountRatio{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/usds-margined-futures/market-data/rest-api/Long-Short-Ratio)

```typescript
const res = await binance.futures.data.globalLongShortAccountRatio({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.futures.data.openInterestHist</code></b></summary>

<code>GET https://fapi.binance.com/futures/data/openInterestHist{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/usds-margined-futures/market-data/rest-api/Open-Interest-Statistics)

```typescript
const res = await binance.futures.data.openInterestHist({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.futures.data.takerlongshortRatio</code></b></summary>

<code>GET https://fapi.binance.com/futures/data/takerlongshortRatio{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/usds-margined-futures/market-data/rest-api/Taker-BuySell-Volume)

```typescript
const res = await binance.futures.data.takerlongshortRatio({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.futures.data.topLongShortAccountRatio</code></b></summary>

<code>GET https://fapi.binance.com/futures/data/topLongShortAccountRatio{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/usds-margined-futures/market-data/rest-api/Top-Long-Short-Account-Ratio)

```typescript
const res = await binance.futures.data.topLongShortAccountRatio({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.futures.data.topLongShortPositionRatio</code></b></summary>

<code>GET https://fapi.binance.com/futures/data/topLongShortPositionRatio{query}</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/usds-margined-futures/market-data/rest-api/Top-Trader-Long-Short-Ratio)

```typescript
const res = await binance.futures.data.topLongShortPositionRatio({ /* ... */ });
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

### public

<details>
<summary><code>GET</code> <b><code>binance.public.options.eapi.v1.ping</code></b></summary>

<code>GET https://eapi.binance.com/eapi/v1/ping</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/options-trading/market-data/Test-Connectivity)

```typescript
const res = await binance.public.options.eapi.v1.ping({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.public.spot.api.v3.ping</code></b></summary>

<code>GET https://api.binance.com/api/v3/ping</code>

[Upstream docs ↗](https://developers.binance.com/docs/binance-spot-api-docs/rest-api/general-endpoints#test-connectivity)

```typescript
const res = await binance.public.spot.api.v3.ping({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.public.spotData.api.v3.ping</code></b></summary>

<code>GET https://data-api.binance.vision/api/v3/ping</code>

[Upstream docs ↗](https://developers.binance.com/docs/binance-spot-api-docs/faqs/market_data_only)

```typescript
const res = await binance.public.spotData.api.v3.ping({ /* ... */ });
```

Source: [`packages/provider/binance/src/binance.ts`](src/binance.ts)

</details>

<details>
<summary><code>GET</code> <b><code>binance.public.usdMFutures.fapi.v1.ping</code></b></summary>

<code>GET https://fapi.binance.com/fapi/v1/ping</code>

[Upstream docs ↗](https://developers.binance.com/docs/derivatives/usds-margined-futures/market-data/rest-api/Test-Connectivity)

```typescript
const res = await binance.public.usdMFutures.fapi.v1.ping({ /* ... */ });
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
