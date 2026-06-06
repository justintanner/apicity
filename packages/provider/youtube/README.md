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
import { createYouTube } from "@apicity/youtube";

const youtube = createYouTube({ apiKey: process.env.YOUTUBE_API_KEY! });
```

## API Reference

5 endpoints across 4 groups. Each method mirrors an upstream URL path.

### channels

<details>
<summary><code>GET</code> <b><code>youtube.channels.list</code></b></summary>

<code>GET https://www.googleapis.com/youtube/v3/channels{query}</code>

[Upstream docs ↗](https://developers.google.com/youtube/v3/docs/channels/list)

```typescript
const res = await youtube.channels.list({ /* ... */ });
```

Source: [`packages/provider/youtube/src/youtube.ts`](src/youtube.ts)

</details>

### transcripts

<details>
<summary><code>GET</code> <b><code>youtube.transcripts</code></b></summary>

<code>GET https://www.youtube.com/watch?v={videoId}</code>

```typescript
const res = await youtube.transcripts({ /* ... */ });
```

Source: [`packages/provider/youtube/src/youtube.ts`](src/youtube.ts)

</details>

### videoMetadata

<details>
<summary><b><code>youtube.videoMetadata</code></b></summary>

[Upstream docs ↗](https://developers.google.com/youtube/player_parameters)

```typescript
const res = await youtube.videoMetadata({ /* ... */ });
```

Source: [`packages/provider/youtube/src/youtube.ts`](src/youtube.ts)

</details>

### videos

<details>
<summary><code>POST</code> <b><code>youtube.videos.insert</code></b></summary>

<code>POST https://www.googleapis.com/youtube/v3/videos{query}</code>

[Upstream docs ↗](https://developers.google.com/youtube/v3/docs/videos/insert)

```typescript
const res = await youtube.videos.insert({ /* ... */ });
```

Source: [`packages/provider/youtube/src/youtube.ts`](src/youtube.ts)

</details>

<details>
<summary><code>GET</code> <b><code>youtube.videos.list</code></b></summary>

<code>GET https://www.googleapis.com/youtube/v3/videos{query}</code>

[Upstream docs ↗](https://developers.google.com/youtube/v3/docs/videos/list)

```typescript
const res = await youtube.videos.list({ /* ... */ });
```

Source: [`packages/provider/youtube/src/youtube.ts`](src/youtube.ts)

</details>

## Middleware

```typescript
import { createYouTube, withRetry } from "@apicity/youtube";

const youtube = createYouTube({ apiKey: process.env.YOUTUBE_API_KEY! });
const models = withRetry(youtube.get.v1.models, { retries: 3 });
```

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
