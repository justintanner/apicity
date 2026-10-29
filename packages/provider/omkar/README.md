# @apicity/omkar

[![npm](https://img.shields.io/npm/v/@apicity/omkar?color=cb0000)](https://www.npmjs.com/package/@apicity/omkar)
[![dependencies](https://img.shields.io/badge/dependencies-1-blue)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)
[![docs](https://img.shields.io/badge/docs-omkar.cloud-blue)](https://www.omkar.cloud/tools/tiktok-scraper)

Omkar Cloud TikTok Scraper provider: trending and Explore feeds by country.

Omkar Cloud's TikTok Scraper scrapes TikTok live on every call, so a feed call returns a fresh batch each time. The key goes in the `API-Key` header. The free plan allows 1,000 successful (HTTP 200) requests a month; errors are not charged, and `GET https://tiktok-scraper.omkar.cloud/account/usage` reports usage without spending a request. Every gateway error is JSON with a stable `code` (`missing_api_key`, `invalid_api_key`, `quota_exceeded`, `rate_limited`, ...), which rejects with `OmkarError` (`code`). Media and subtitle links are signed TikTok CDN URLs that expire.

Runtime dependencies:

- `zod@^4.6.6` — request schemas attached to endpoint methods as `.schema`

## Installation

```bash
npm install @apicity/omkar
# or
pnpm add @apicity/omkar
```

## Quick Start

```typescript
import { createOmkar } from "@apicity/omkar";

const omkar = createOmkar({ apiKey: process.env.OMKAR_API_KEY! });
```

## API Reference

3 endpoints across 1 group. Each method mirrors an upstream URL path.

### feed

<details>
<summary><code>GET</code> <b><code>omkar.feed.explore</code></b></summary>

<code>GET https://tiktok-scraper.omkar.cloud/feed/explore{query}</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://www.omkar.cloud/tools/tiktok-scraper/explore-feed)

```typescript
const feed = await omkar.feed.explore({ country: "TH", category: "all" });
```

Source: [`packages/provider/omkar/src/omkar.ts`](src/omkar.ts)

</details>

<details>
<summary><code>GET</code> <b><code>omkar.feed.explore.categories</code></b></summary>

<code>GET https://tiktok-scraper.omkar.cloud/feed/explore/categories</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://www.omkar.cloud/tools/tiktok-scraper/explore-categories)

```typescript
const categories = await omkar.feed.explore.categories();
```

Source: [`packages/provider/omkar/src/omkar.ts`](src/omkar.ts)

</details>

<details>
<summary><code>GET</code> <b><code>omkar.feed.trending</code></b></summary>

<code>GET https://tiktok-scraper.omkar.cloud/feed/trending{query}</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://www.omkar.cloud/tools/tiktok-scraper/trending-feed)

```typescript
const feed = await omkar.feed.trending({ country: "TH" });
```

Source: [`packages/provider/omkar/src/omkar.ts`](src/omkar.ts)

</details>

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
