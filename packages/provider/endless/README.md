# @apicity/endless

[![npm](https://img.shields.io/npm/v/@apicity/endless?color=cb0000)](https://www.npmjs.com/package/@apicity/endless)
[![dependencies](https://img.shields.io/badge/dependencies-1-blue)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)
[![docs](https://img.shields.io/badge/docs-endless.app-blue)](https://endless.app/docs/api)

Endless public social trends API provider.

Endless's public social endpoints need no key; its authenticated API is not covered. `region` is a country slug from `EndlessTikTokTrendsRegionSchema.options`, and any other value is a 404 whose `EndlessError.code` is `invalid_path_parameter`. Every call sends `Endless-Api-Version: 1` unless `apiVersion` names another major.

Runtime dependencies:

- `zod@^4.6.6` — request schemas attached to endpoint methods as `.schema`

## Installation

```bash
npm install @apicity/endless
# or
pnpm add @apicity/endless
```

## Quick Start

```typescript
import { createEndless } from "@apicity/endless";

const endless = createEndless();
```

## API Reference

1 endpoint across 1 group. Each method mirrors an upstream URL path.

### social

<details>
<summary><code>GET</code> <b><code>endless.social.tiktokTrends.public</code></b></summary>

<code>GET https://api.endless.app/social/tiktok-trends/public/{region}</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://endless.app/docs/api/social/public-tiktok-trends)

```typescript
const trends = await endless.social.tiktokTrends.public({ region: "thailand" });
```

Source: [`packages/provider/endless/src/endless.ts`](src/endless.ts)

</details>

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
