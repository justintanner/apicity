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

1 endpoint across 1 group. Each method mirrors an upstream URL path.

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

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
