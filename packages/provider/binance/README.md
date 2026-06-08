# @apicity/binance

[![npm](https://img.shields.io/npm/v/@apicity/binance?color=cb0000)](https://www.npmjs.com/package/@apicity/binance)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)
[![docs](https://img.shields.io/badge/docs-developers.binance.com-blue)](https://developers.binance.com/docs/binance-spot-api-docs/rest-api/general-api-information)

Binance Spot REST API provider.

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

3 endpoints across 3 groups. Each method mirrors an upstream URL path.

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

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
