# @apicity/x

[![npm](https://img.shields.io/npm/v/@apicity/x?color=cb0000)](https://www.npmjs.com/package/@apicity/x)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)

X (formerly Twitter) social API provider for posting content (api.x.com).

## Installation

```bash
npm install @apicity/x
# or
pnpm add @apicity/x
```

## Quick Start

```typescript
import { x as createX } from "@apicity/x";

const x = createX({ accessToken: process.env.X_ACCESS_TOKEN! });
```

## API Reference

2 endpoints across 1 group. Each method mirrors an upstream URL path.

### media

<details>
<summary><code>POST</code> <b><code>x.v2.media.upload.append</code></b></summary>

<code>POST https://api.x.com/2/media/upload/{id}/append</code>

[Upstream docs ↗](https://docs.x.com/x-api/media/append-media-upload)

```typescript
const res = await x.v2.media.upload.append({ /* ... */ });
```

Source: [`packages/provider/x/src/x.ts`](src/x.ts)

</details>

<details>
<summary><code>POST</code> <b><code>x.v2.media.upload.initialize</code></b></summary>

<code>POST https://api.x.com/2/media/upload/initialize</code>

[Upstream docs ↗](https://docs.x.com/x-api/media/media-upload-initialize)

```typescript
const res = await x.v2.media.upload.initialize({ /* ... */ });
```

Source: [`packages/provider/x/src/x.ts`](src/x.ts)

</details>

## License

MIT
