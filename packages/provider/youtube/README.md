# @apicity/youtube

[![npm](https://img.shields.io/npm/v/@apicity/youtube?color=cb0000)](https://www.npmjs.com/package/@apicity/youtube)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)

YouTube Data API v3 provider for posting content.

## Installation

```bash
npm install @apicity/youtube
# or
pnpm add @apicity/youtube
```

## Quick Start

```typescript
import { youtube as createYoutube } from "@apicity/youtube";

const youtube = createYoutube({ apiKey: process.env.YOUTUBE_API_KEY! });
```

## API Reference

1 endpoint across 1 group. Each method mirrors an upstream URL path.

### channels

<details>
<summary><code>GET</code> <b><code>youtube.v3.channels</code></b></summary>

<code>GET https://www.googleapis.com/youtube/v3/channels{query}</code>

```typescript
const res = await youtube.v3.channels({
  /* ... */
});
```

Source: [`packages/provider/youtube/src/youtube.ts`](src/youtube.ts)

</details>

## Middleware

```typescript
import { youtube as createYoutube, withRetry } from "@apicity/youtube";

const youtube = createYoutube({ apiKey: process.env.YOUTUBE_API_KEY! });
const models = withRetry(youtube.get.v1.models, { retries: 3 });
```

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
