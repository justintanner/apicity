# @apicity/b2

[![npm](https://img.shields.io/npm/v/@apicity/b2?color=cb0000)](https://www.npmjs.com/package/@apicity/b2)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)
[![docs](https://img.shields.io/badge/docs-backblaze.com-blue)](https://www.backblaze.com/docs/en/cloud-storage-call-the-s3-compatible-api)

Backblaze B2 S3-compatible object storage provider.

## Installation

```bash
npm install @apicity/b2
# or
pnpm add @apicity/b2
```

## Quick Start

```typescript
import { createB2 } from "@apicity/b2";

const b2 = createB2({
  accessKeyId: process.env.B2_ACCESS_KEY_ID!,
  secretAccessKey: process.env.B2_SECRET_ACCESS_KEY!,
  region: process.env.B2_REGION!,
  endpoint: process.env.B2_ENDPOINT,
});
```

`@apicity/b2` delegates signing, transport, response parsing, and schemas to `@apicity/s3` while exposing only Backblaze-supported S3-compatible calls.

## API Reference

39 endpoints across 2 groups. Each method mirrors an upstream URL path.

### buckets

<details>
<summary><code>PUT</code> <b><code>b2.buckets.create</code></b></summary>

<code>PUT https://s3.us-west-004.backblazeb2.com/{bucket}</code>

[Upstream docs ↗](https://www.backblaze.com/docs/en/cloud-storage-call-the-s3-compatible-api)

```typescript
const res = await b2.buckets.create({ /* ... */ });
```

Source: [`packages/provider/b2/src/b2.ts`](src/b2.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>b2.buckets.del</code></b></summary>

<code>DELETE https://s3.us-west-004.backblazeb2.com/{bucket}</code>

[Upstream docs ↗](https://www.backblaze.com/docs/en/cloud-storage-call-the-s3-compatible-api)

```typescript
const res = await b2.buckets.del({ /* ... */ });
```

Source: [`packages/provider/b2/src/b2.ts`](src/b2.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>b2.buckets.delCors</code></b></summary>

<code>DELETE https://s3.us-west-004.backblazeb2.com/{bucket}?cors</code>

[Upstream docs ↗](https://www.backblaze.com/docs/en/cloud-storage-call-the-s3-compatible-api)

```typescript
const res = await b2.buckets.delCors({ /* ... */ });
```

Source: [`packages/provider/b2/src/b2.ts`](src/b2.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>b2.buckets.delEncryption</code></b></summary>

<code>DELETE https://s3.us-west-004.backblazeb2.com/{bucket}?encryption</code>

[Upstream docs ↗](https://www.backblaze.com/docs/en/cloud-storage-call-the-s3-compatible-api)

```typescript
const res = await b2.buckets.delEncryption({ /* ... */ });
```

Source: [`packages/provider/b2/src/b2.ts`](src/b2.ts)

</details>

<details>
<summary><code>GET</code> <b><code>b2.buckets.getAcl</code></b></summary>

<code>GET https://s3.us-west-004.backblazeb2.com/{bucket}?acl</code>

[Upstream docs ↗](https://www.backblaze.com/docs/en/cloud-storage-call-the-s3-compatible-api)

```typescript
const res = await b2.buckets.getAcl({ /* ... */ });
```

Source: [`packages/provider/b2/src/b2.ts`](src/b2.ts)

</details>

<details>
<summary><code>GET</code> <b><code>b2.buckets.getCors</code></b></summary>

<code>GET https://s3.us-west-004.backblazeb2.com/{bucket}?cors</code>

[Upstream docs ↗](https://www.backblaze.com/docs/en/cloud-storage-call-the-s3-compatible-api)

```typescript
const res = await b2.buckets.getCors({ /* ... */ });
```

Source: [`packages/provider/b2/src/b2.ts`](src/b2.ts)

</details>

<details>
<summary><code>GET</code> <b><code>b2.buckets.getEncryption</code></b></summary>

<code>GET https://s3.us-west-004.backblazeb2.com/{bucket}?encryption</code>

[Upstream docs ↗](https://www.backblaze.com/docs/en/cloud-storage-call-the-s3-compatible-api)

```typescript
const res = await b2.buckets.getEncryption({ /* ... */ });
```

Source: [`packages/provider/b2/src/b2.ts`](src/b2.ts)

</details>

<details>
<summary><code>GET</code> <b><code>b2.buckets.getObjectLockConfiguration</code></b></summary>

<code>GET https://s3.us-west-004.backblazeb2.com/{bucket}?object-lock</code>

[Upstream docs ↗](https://www.backblaze.com/docs/en/cloud-storage-call-the-s3-compatible-api)

```typescript
const res = await b2.buckets.getObjectLockConfiguration({ /* ... */ });
```

Source: [`packages/provider/b2/src/b2.ts`](src/b2.ts)

</details>

<details>
<summary><code>GET</code> <b><code>b2.buckets.getVersioning</code></b></summary>

<code>GET https://s3.us-west-004.backblazeb2.com/{bucket}?versioning</code>

[Upstream docs ↗](https://www.backblaze.com/docs/en/cloud-storage-call-the-s3-compatible-api)

```typescript
const res = await b2.buckets.getVersioning({ /* ... */ });
```

Source: [`packages/provider/b2/src/b2.ts`](src/b2.ts)

</details>

<details>
<summary><code>HEAD</code> <b><code>b2.buckets.head</code></b></summary>

<code>HEAD https://s3.us-west-004.backblazeb2.com/{bucket}</code>

[Upstream docs ↗](https://www.backblaze.com/docs/en/cloud-storage-call-the-s3-compatible-api)

```typescript
const res = await b2.buckets.head({ /* ... */ });
```

Source: [`packages/provider/b2/src/b2.ts`](src/b2.ts)

</details>

<details>
<summary><code>GET</code> <b><code>b2.buckets.list</code></b></summary>

<code>GET https://s3.us-west-004.backblazeb2.com/</code>

[Upstream docs ↗](https://www.backblaze.com/docs/en/cloud-storage-call-the-s3-compatible-api)

```typescript
const res = await b2.buckets.list({ /* ... */ });
```

Source: [`packages/provider/b2/src/b2.ts`](src/b2.ts)

</details>

<details>
<summary><code>GET</code> <b><code>b2.buckets.location</code></b></summary>

<code>GET https://s3.us-west-004.backblazeb2.com/{bucket}?location</code>

[Upstream docs ↗](https://www.backblaze.com/docs/en/cloud-storage-call-the-s3-compatible-api)

```typescript
const res = await b2.buckets.location({ /* ... */ });
```

Source: [`packages/provider/b2/src/b2.ts`](src/b2.ts)

</details>

<details>
<summary><code>PUT</code> <b><code>b2.buckets.putAcl</code></b></summary>

<code>PUT https://s3.us-west-004.backblazeb2.com/{bucket}?acl</code>

[Upstream docs ↗](https://www.backblaze.com/docs/en/cloud-storage-call-the-s3-compatible-api)

```typescript
const res = await b2.buckets.putAcl({ /* ... */ });
```

Source: [`packages/provider/b2/src/b2.ts`](src/b2.ts)

</details>

<details>
<summary><code>PUT</code> <b><code>b2.buckets.putCors</code></b></summary>

<code>PUT https://s3.us-west-004.backblazeb2.com/{bucket}?cors</code>

[Upstream docs ↗](https://www.backblaze.com/docs/en/cloud-storage-call-the-s3-compatible-api)

```typescript
const res = await b2.buckets.putCors({ /* ... */ });
```

Source: [`packages/provider/b2/src/b2.ts`](src/b2.ts)

</details>

<details>
<summary><code>PUT</code> <b><code>b2.buckets.putEncryption</code></b></summary>

<code>PUT https://s3.us-west-004.backblazeb2.com/{bucket}?encryption</code>

[Upstream docs ↗](https://www.backblaze.com/docs/en/cloud-storage-call-the-s3-compatible-api)

```typescript
const res = await b2.buckets.putEncryption({ /* ... */ });
```

Source: [`packages/provider/b2/src/b2.ts`](src/b2.ts)

</details>

<details>
<summary><code>PUT</code> <b><code>b2.buckets.putObjectLockConfiguration</code></b></summary>

<code>PUT https://s3.us-west-004.backblazeb2.com/{bucket}?object-lock</code>

[Upstream docs ↗](https://www.backblaze.com/docs/en/cloud-storage-call-the-s3-compatible-api)

```typescript
const res = await b2.buckets.putObjectLockConfiguration({ /* ... */ });
```

Source: [`packages/provider/b2/src/b2.ts`](src/b2.ts)

</details>

### objects

<details>
<summary><code>DELETE</code> <b><code>b2.objects.abortMultipartUpload</code></b></summary>

<code>DELETE https://s3.us-west-004.backblazeb2.com/{bucket}/{key}{query}</code>

[Upstream docs ↗](https://www.backblaze.com/docs/en/cloud-storage-call-the-s3-compatible-api)

```typescript
const res = await b2.objects.abortMultipartUpload({ /* ... */ });
```

Source: [`packages/provider/b2/src/b2.ts`](src/b2.ts)

</details>

<details>
<summary><code>POST</code> <b><code>b2.objects.completeMultipartUpload</code></b></summary>

<code>POST https://s3.us-west-004.backblazeb2.com/{bucket}/{key}{query}</code>

[Upstream docs ↗](https://www.backblaze.com/docs/en/cloud-storage-call-the-s3-compatible-api)

```typescript
const res = await b2.objects.completeMultipartUpload({ /* ... */ });
```

Source: [`packages/provider/b2/src/b2.ts`](src/b2.ts)

</details>

<details>
<summary><code>PUT</code> <b><code>b2.objects.copy</code></b></summary>

<code>PUT https://s3.us-west-004.backblazeb2.com/{bucket}/{key}</code>

[Upstream docs ↗](https://www.backblaze.com/docs/en/cloud-storage-call-the-s3-compatible-api)

```typescript
const res = await b2.objects.copy({ /* ... */ });
```

Source: [`packages/provider/b2/src/b2.ts`](src/b2.ts)

</details>

<details>
<summary><code>POST</code> <b><code>b2.objects.createMultipartUpload</code></b></summary>

<code>POST https://s3.us-west-004.backblazeb2.com/{bucket}/{key}?uploads</code>

[Upstream docs ↗](https://www.backblaze.com/docs/en/cloud-storage-call-the-s3-compatible-api)

```typescript
const res = await b2.objects.createMultipartUpload({ /* ... */ });
```

Source: [`packages/provider/b2/src/b2.ts`](src/b2.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>b2.objects.del</code></b></summary>

<code>DELETE https://s3.us-west-004.backblazeb2.com/{bucket}/{key}{query}</code>

[Upstream docs ↗](https://www.backblaze.com/docs/en/cloud-storage-call-the-s3-compatible-api)

```typescript
const res = await b2.objects.del({ /* ... */ });
```

Source: [`packages/provider/b2/src/b2.ts`](src/b2.ts)

</details>

<details>
<summary><code>POST</code> <b><code>b2.objects.delMany</code></b></summary>

<code>POST https://s3.us-west-004.backblazeb2.com/{bucket}?delete</code>

[Upstream docs ↗](https://www.backblaze.com/docs/en/cloud-storage-call-the-s3-compatible-api)

```typescript
const res = await b2.objects.delMany({ /* ... */ });
```

Source: [`packages/provider/b2/src/b2.ts`](src/b2.ts)

</details>

<details>
<summary><code>GET</code> <b><code>b2.objects.get</code></b></summary>

<code>GET https://s3.us-west-004.backblazeb2.com/{bucket}/{key}{query}</code>

[Upstream docs ↗](https://www.backblaze.com/docs/en/cloud-storage-call-the-s3-compatible-api)

```typescript
const res = await b2.objects.get({ /* ... */ });
```

Source: [`packages/provider/b2/src/b2.ts`](src/b2.ts)

</details>

<details>
<summary><code>GET</code> <b><code>b2.objects.getAcl</code></b></summary>

<code>GET https://s3.us-west-004.backblazeb2.com/{bucket}/{key}?acl{query}</code>

[Upstream docs ↗](https://www.backblaze.com/docs/en/cloud-storage-call-the-s3-compatible-api)

```typescript
const res = await b2.objects.getAcl({ /* ... */ });
```

Source: [`packages/provider/b2/src/b2.ts`](src/b2.ts)

</details>

<details>
<summary><code>GET</code> <b><code>b2.objects.getLegalHold</code></b></summary>

<code>GET https://s3.us-west-004.backblazeb2.com/{bucket}/{key}?legal-hold{query}</code>

[Upstream docs ↗](https://www.backblaze.com/docs/en/cloud-storage-call-the-s3-compatible-api)

```typescript
const res = await b2.objects.getLegalHold({ /* ... */ });
```

Source: [`packages/provider/b2/src/b2.ts`](src/b2.ts)

</details>

<details>
<summary><code>GET</code> <b><code>b2.objects.getRetention</code></b></summary>

<code>GET https://s3.us-west-004.backblazeb2.com/{bucket}/{key}?retention{query}</code>

[Upstream docs ↗](https://www.backblaze.com/docs/en/cloud-storage-call-the-s3-compatible-api)

```typescript
const res = await b2.objects.getRetention({ /* ... */ });
```

Source: [`packages/provider/b2/src/b2.ts`](src/b2.ts)

</details>

<details>
<summary><code>GET</code> <b><code>b2.objects.getStream</code></b></summary>

<code>GET https://s3.us-west-004.backblazeb2.com/{bucket}/{key}{query}</code>

[Upstream docs ↗](https://www.backblaze.com/docs/en/cloud-storage-call-the-s3-compatible-api)

```typescript
const res = await b2.objects.getStream({ /* ... */ });
```

Source: [`packages/provider/b2/src/b2.ts`](src/b2.ts)

</details>

<details>
<summary><code>HEAD</code> <b><code>b2.objects.head</code></b></summary>

<code>HEAD https://s3.us-west-004.backblazeb2.com/{bucket}/{key}{query}</code>

[Upstream docs ↗](https://www.backblaze.com/docs/en/cloud-storage-call-the-s3-compatible-api)

```typescript
const res = await b2.objects.head({ /* ... */ });
```

Source: [`packages/provider/b2/src/b2.ts`](src/b2.ts)

</details>

<details>
<summary><code>GET</code> <b><code>b2.objects.list</code></b></summary>

<code>GET https://s3.us-west-004.backblazeb2.com/{bucket}?list-type=2{query}</code>

[Upstream docs ↗](https://www.backblaze.com/docs/en/cloud-storage-call-the-s3-compatible-api)

```typescript
const res = await b2.objects.list({ /* ... */ });
```

Source: [`packages/provider/b2/src/b2.ts`](src/b2.ts)

</details>

<details>
<summary><code>GET</code> <b><code>b2.objects.listLegacy</code></b></summary>

<code>GET https://s3.us-west-004.backblazeb2.com/{bucket}{query}</code>

[Upstream docs ↗](https://www.backblaze.com/docs/en/cloud-storage-call-the-s3-compatible-api)

```typescript
const res = await b2.objects.listLegacy({ /* ... */ });
```

Source: [`packages/provider/b2/src/b2.ts`](src/b2.ts)

</details>

<details>
<summary><code>GET</code> <b><code>b2.objects.listMultipartUploads</code></b></summary>

<code>GET https://s3.us-west-004.backblazeb2.com/{bucket}?uploads{query}</code>

[Upstream docs ↗](https://www.backblaze.com/docs/en/cloud-storage-call-the-s3-compatible-api)

```typescript
const res = await b2.objects.listMultipartUploads({ /* ... */ });
```

Source: [`packages/provider/b2/src/b2.ts`](src/b2.ts)

</details>

<details>
<summary><code>GET</code> <b><code>b2.objects.listParts</code></b></summary>

<code>GET https://s3.us-west-004.backblazeb2.com/{bucket}/{key}{query}</code>

[Upstream docs ↗](https://www.backblaze.com/docs/en/cloud-storage-call-the-s3-compatible-api)

```typescript
const res = await b2.objects.listParts({ /* ... */ });
```

Source: [`packages/provider/b2/src/b2.ts`](src/b2.ts)

</details>

<details>
<summary><code>GET</code> <b><code>b2.objects.listVersions</code></b></summary>

<code>GET https://s3.us-west-004.backblazeb2.com/{bucket}?versions{query}</code>

[Upstream docs ↗](https://www.backblaze.com/docs/en/cloud-storage-call-the-s3-compatible-api)

```typescript
const res = await b2.objects.listVersions({ /* ... */ });
```

Source: [`packages/provider/b2/src/b2.ts`](src/b2.ts)

</details>

<details>
<summary><code>PUT</code> <b><code>b2.objects.put</code></b></summary>

<code>PUT https://s3.us-west-004.backblazeb2.com/{bucket}/{key}</code>

[Upstream docs ↗](https://www.backblaze.com/docs/en/cloud-storage-call-the-s3-compatible-api)

```typescript
const res = await b2.objects.put({ /* ... */ });
```

Source: [`packages/provider/b2/src/b2.ts`](src/b2.ts)

</details>

<details>
<summary><code>PUT</code> <b><code>b2.objects.putAcl</code></b></summary>

<code>PUT https://s3.us-west-004.backblazeb2.com/{bucket}/{key}?acl{query}</code>

[Upstream docs ↗](https://www.backblaze.com/docs/en/cloud-storage-call-the-s3-compatible-api)

```typescript
const res = await b2.objects.putAcl({ /* ... */ });
```

Source: [`packages/provider/b2/src/b2.ts`](src/b2.ts)

</details>

<details>
<summary><code>PUT</code> <b><code>b2.objects.putLegalHold</code></b></summary>

<code>PUT https://s3.us-west-004.backblazeb2.com/{bucket}/{key}?legal-hold{query}</code>

[Upstream docs ↗](https://www.backblaze.com/docs/en/cloud-storage-call-the-s3-compatible-api)

```typescript
const res = await b2.objects.putLegalHold({ /* ... */ });
```

Source: [`packages/provider/b2/src/b2.ts`](src/b2.ts)

</details>

<details>
<summary><code>PUT</code> <b><code>b2.objects.putRetention</code></b></summary>

<code>PUT https://s3.us-west-004.backblazeb2.com/{bucket}/{key}?retention{query}</code>

[Upstream docs ↗](https://www.backblaze.com/docs/en/cloud-storage-call-the-s3-compatible-api)

```typescript
const res = await b2.objects.putRetention({ /* ... */ });
```

Source: [`packages/provider/b2/src/b2.ts`](src/b2.ts)

</details>

<details>
<summary><code>PUT</code> <b><code>b2.objects.uploadPart</code></b></summary>

<code>PUT https://s3.us-west-004.backblazeb2.com/{bucket}/{key}{query}</code>

[Upstream docs ↗](https://www.backblaze.com/docs/en/cloud-storage-call-the-s3-compatible-api)

```typescript
const res = await b2.objects.uploadPart({ /* ... */ });
```

Source: [`packages/provider/b2/src/b2.ts`](src/b2.ts)

</details>

<details>
<summary><code>PUT</code> <b><code>b2.objects.uploadPartCopy</code></b></summary>

<code>PUT https://s3.us-west-004.backblazeb2.com/{bucket}/{key}{query}</code>

[Upstream docs ↗](https://www.backblaze.com/docs/en/cloud-storage-call-the-s3-compatible-api)

```typescript
const res = await b2.objects.uploadPartCopy({ /* ... */ });
```

Source: [`packages/provider/b2/src/b2.ts`](src/b2.ts)

</details>

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
