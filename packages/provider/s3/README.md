# @apicity/s3

[![npm](https://img.shields.io/npm/v/@apicity/s3?color=cb0000)](https://www.npmjs.com/package/@apicity/s3)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)
[![docs](https://img.shields.io/badge/docs-docs.aws.amazon.com-blue)](https://docs.aws.amazon.com/AmazonS3/latest/API/Welcome.html)

S3-compatible object storage provider.

## Installation

```bash
npm install @apicity/s3
# or
pnpm add @apicity/s3
```

## Quick Start

```typescript
import { createS3 } from "@apicity/s3";

const s3 = createS3({
  accessKeyId: process.env.S3_ACCESS_KEY_ID!,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  region: process.env.S3_REGION ?? "us-east-1",
  endpoint: process.env.S3_ENDPOINT,
});
```

## API Reference

6 endpoints across 2 groups. Each method mirrors an upstream URL path.

### buckets

<details>
<summary><code>GET</code> <b><code>s3.buckets.list</code></b></summary>

<code>GET https://s3.us-east-1.amazonaws.com/</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListBuckets.html)

```typescript
const res = await s3.buckets.list({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

### objects

<details>
<summary><code>DELETE</code> <b><code>s3.objects.del</code></b></summary>

<code>DELETE https://s3.us-east-1.amazonaws.com/{bucket}/{key}{query}</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteObject.html)

```typescript
const res = await s3.objects.del({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>GET</code> <b><code>s3.objects.get</code></b></summary>

<code>GET https://s3.us-east-1.amazonaws.com/{bucket}/{key}{query}</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetObject.html)

```typescript
const res = await s3.objects.get({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>HEAD</code> <b><code>s3.objects.head</code></b></summary>

<code>HEAD https://s3.us-east-1.amazonaws.com/{bucket}/{key}{query}</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_HeadObject.html)

```typescript
const res = await s3.objects.head({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>GET</code> <b><code>s3.objects.list</code></b></summary>

<code>GET https://s3.us-east-1.amazonaws.com/{bucket}?list-type=2{query}</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListObjectsV2.html)

```typescript
const res = await s3.objects.list({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>PUT</code> <b><code>s3.objects.put</code></b></summary>

<code>PUT https://s3.us-east-1.amazonaws.com/{bucket}/{key}</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutObject.html)

```typescript
const res = await s3.objects.put({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
