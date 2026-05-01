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

3 endpoints across 3 groups. Each method mirrors an upstream URL path.

### container

<details>
<summary><code>GET</code> <b><code>ig.v25.container</code></b></summary>

<code>GET https://graph.instagram.com/v25.0/{containerId}{query}</code>

[Upstream docs ↗](https://developers.facebook.com/docs/instagram-platform/reference/ig-container/)

```typescript
const res = await ig.v25.container({ /* ... */ });
```

Source: [`packages/provider/ig/src/ig.ts`](src/ig.ts)

</details>

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

### mediaPublish

<details>
<summary><code>POST</code> <b><code>ig.v25.mediaPublish</code></b></summary>

<code>POST https://graph.instagram.com/v25.0/{igUserId}/media_publish</code>

[Upstream docs ↗](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media_publish/)

```typescript
const res = await ig.v25.mediaPublish({ /* ... */ });
```

Source: [`packages/provider/ig/src/ig.ts`](src/ig.ts)

</details>

## License

MIT
