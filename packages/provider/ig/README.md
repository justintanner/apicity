# @apicity/ig

[![npm](https://img.shields.io/npm/v/@apicity/ig?color=cb0000)](https://www.npmjs.com/package/@apicity/ig)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)

Instagram Graph API provider for posting reels via the public-URL flow (graph.instagram.com).

## Installation

```bash
npm install @apicity/ig
# or
pnpm add @apicity/ig
```

## Quick Start

```typescript
import { ig as createIg } from "@apicity/ig";

const ig = createIg({ accessToken: process.env.IG_ACCESS_TOKEN! });
```

## API Reference

1 endpoint across 1 group. Each method mirrors an upstream URL path.

### media

<details>
<summary><code>POST</code> <b><code>ig.v25.media</code></b></summary>

<code>POST https://graph.instagram.com/v25.0/{igUserId}/media</code>

[Upstream docs ↗](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media/)

```typescript
const res = await ig.v25.media({ /* ... */ });
```

Source: [`packages/provider/ig/src/ig.ts`](src/ig.ts)

</details>

## License

MIT
