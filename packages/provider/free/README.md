# @apicity/free

[![npm](https://img.shields.io/npm/v/@apicity/free?color=cb0000)](https://www.npmjs.com/package/@apicity/free)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)

Free file hosting providers — tmpfiles.org and file.io.

## Installation

```bash
npm install @apicity/free
# or
pnpm add @apicity/free
```

## Quick Start

```typescript
import { free as createFree } from "@apicity/free";

const free = createFree({ apiKey: process.env.FREE_API_KEY! });
```

## API Reference

8 endpoints across 8 groups. Each method mirrors an upstream URL path.

### catbox

<details>
<summary><code>POST</code> <b><code>free.catbox.upload</code></b></summary>

<code>POST https://catbox.moe/user/api.php</code>

[Upstream docs ↗](https://catbox.moe/tools.php)

```typescript
const res = await free.catbox.upload({ /* ... */ });
```

Source: [`packages/provider/free/src/free.ts`](src/free.ts)

</details>

### filebin

<details>
<summary><code>POST</code> <b><code>free.filebin.upload</code></b></summary>

<code>POST https://filebin.net/{bin}/{filename}</code>

[Upstream docs ↗](https://filebin.net/)

```typescript
const res = await free.filebin.upload({ /* ... */ });
```

Source: [`packages/provider/free/src/free.ts`](src/free.ts)

</details>

### gofile

<details>
<summary><code>POST</code> <b><code>free.gofile.upload</code></b></summary>

<code>POST https://upload.gofile.io/uploadfile</code>

[Upstream docs ↗](https://gofile.io/api)

```typescript
const res = await free.gofile.upload({ /* ... */ });
```

Source: [`packages/provider/free/src/free.ts`](src/free.ts)

</details>

### litterbox

<details>
<summary><code>POST</code> <b><code>free.litterbox.upload</code></b></summary>

<code>POST https://litterbox.catbox.moe/resources/internals/api.php</code>

[Upstream docs ↗](https://litterbox.catbox.moe/)

```typescript
const res = await free.litterbox.upload({ /* ... */ });
```

Source: [`packages/provider/free/src/free.ts`](src/free.ts)

</details>

### tempsh

<details>
<summary><code>POST</code> <b><code>free.tempsh.upload</code></b></summary>

<code>POST https://temp.sh/upload</code>

[Upstream docs ↗](https://temp.sh/)

```typescript
const res = await free.tempsh.upload({ /* ... */ });
```

Source: [`packages/provider/free/src/free.ts`](src/free.ts)

</details>

### tflink

<details>
<summary><code>POST</code> <b><code>free.tflink.upload</code></b></summary>

<code>POST https://tmpfile.link/api/upload</code>

[Upstream docs ↗](https://tmpfile.link/)

```typescript
const res = await free.tflink.upload({ /* ... */ });
```

Source: [`packages/provider/free/src/free.ts`](src/free.ts)

</details>

### tmpfiles

<details>
<summary><code>POST</code> <b><code>free.tmpfiles.api.v1.upload</code></b></summary>

<code>POST https://tmpfiles.org/api/v1/upload</code>

[Upstream docs ↗](https://tmpfiles.org/)

```typescript
const res = await free.tmpfiles.api.v1.upload({ /* ... */ });
```

Source: [`packages/provider/free/src/free.ts`](src/free.ts)

</details>

### uguu

<details>
<summary><code>POST</code> <b><code>free.uguu.upload</code></b></summary>

<code>POST https://uguu.se/upload</code>

[Upstream docs ↗](https://uguu.se/)

```typescript
const res = await free.uguu.upload({ /* ... */ });
```

Source: [`packages/provider/free/src/free.ts`](src/free.ts)

</details>

## Middleware

```typescript
import { free as createFree, withRetry } from "@apicity/free";

const free = createFree({ apiKey: process.env.FREE_API_KEY! });
const models = withRetry(free.get.v1.models, { retries: 3 });
```

## License

MIT
