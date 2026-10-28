# @apicity/tiktok-creative-center

[![npm](https://img.shields.io/npm/v/@apicity/tiktok-creative-center?color=cb0000)](https://www.npmjs.com/package/@apicity/tiktok-creative-center)
[![dependencies](https://img.shields.io/badge/dependencies-1-blue)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)
[![docs](https://img.shields.io/badge/docs-ads.tiktok.com-blue)](https://ads.tiktok.com/creative/creativeCenter/trends/video)

TikTok Creative Center trending videos provider (unofficial, undocumented endpoints).

These are unofficial, undocumented endpoints behind TikTok Creative Center's Trending videos page (https://ads.tiktok.com/creative/creativeCenter/trends/video), and TikTok can change or remove them without notice. They need no key. Without a TikTok One session every list holds the top 4 rows of page 1, whatever `page` and `limit` ask, and the client does not support a session cookie. TikTok sends item, author and creator ids as JSON numbers above 2^53, so `itemID`, `authorID` and `creatorID` come back as strings with every digit. Creative Center reports a failure as HTTP 200 with a nonzero `BaseResp.StatusCode`, which rejects with `TiktokCreativeCenterError` (`statusCode`). The overview reports the latest daily, weekly and monthly period ends, the values a list's `periodEndTimestamp` takes. A row's video page is `https://www.tiktok.com/@<handlerName>/video/<itemID>`; `videoURL` is a signed CDN link that expires.

Runtime dependencies:

- `zod@^4.6.6` — request schemas attached to endpoint methods as `.schema`

## Installation

```bash
npm install @apicity/tiktok-creative-center
# or
pnpm add @apicity/tiktok-creative-center
```

## Quick Start

```typescript
import { createTiktokCreativeCenter } from "@apicity/tiktok-creative-center";

const tiktokCreativeCenter = createTiktokCreativeCenter();
```

## API Reference

2 endpoints across 1 group. Each method mirrors an upstream URL path.

### ads

<details>
<summary><code>GET</code> <b><code>tiktok-creative-center.ads.creativeOne.report.creativeCenterGetTopContentsList</code></b></summary>

<code>GET https://ads.tiktok.com/CreativeOne/Report/CreativeCenterGetTopContentsList{query}</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://ads.tiktok.com/creative/creativeCenter/trends/video)

```typescript
const top = await tiktokCreativeCenter.ads.creativeOne.report.creativeCenterGetTopContentsList({
  countryCode: "TH",
  periodDimension: 3,
  periodEndTimestamp: 1792886400,
  orderByMetric: 1,
});
```

Source: [`packages/provider/tiktok-creative-center/src/tiktokCreativeCenter.ts`](src/tiktokCreativeCenter.ts)

</details>

<details>
<summary><code>GET</code> <b><code>tiktok-creative-center.ads.creativeOne.report.getTopContentsOverview</code></b></summary>

<code>GET https://ads.tiktok.com/CreativeOne/Report/GetTopContentsOverview</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://ads.tiktok.com/creative/creativeCenter/trends/video)

```typescript
const overview = await tiktokCreativeCenter.ads.creativeOne.report.getTopContentsOverview();
```

Source: [`packages/provider/tiktok-creative-center/src/tiktokCreativeCenter.ts`](src/tiktokCreativeCenter.ts)

</details>

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
