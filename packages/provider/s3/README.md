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

92 endpoints across 3 groups. Each method mirrors an upstream URL path.

### buckets

<details>
<summary><code>PUT</code> <b><code>s3.buckets.create</code></b></summary>

<code>PUT https://s3.us-east-1.amazonaws.com/{bucket}</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_CreateBucket.html)

```typescript
const res = await s3.buckets.create({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>POST</code> <b><code>s3.buckets.createMetadataConfiguration</code></b></summary>

<code>POST https://s3.us-east-1.amazonaws.com/{bucket}?metadataConfiguration</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_CreateBucketMetadataConfiguration.html)

```typescript
const res = await s3.buckets.createMetadataConfiguration({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>GET</code> <b><code>s3.buckets.createSession</code></b></summary>

<code>GET https://s3express-{param}.{param}.amazonaws.com/{bucket}?session</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_CreateSession.html)

```typescript
const res = await s3.buckets.createSession({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>s3.buckets.del</code></b></summary>

<code>DELETE https://s3.us-east-1.amazonaws.com/{bucket}</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteBucket.html)

```typescript
const res = await s3.buckets.del({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>s3.buckets.delAnalytics</code></b></summary>

<code>DELETE https://s3.us-east-1.amazonaws.com/{bucket}?analytics{query}</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteBucketAnalyticsConfiguration.html)

```typescript
const res = await s3.buckets.delAnalytics({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>s3.buckets.delCors</code></b></summary>

<code>DELETE https://s3.us-east-1.amazonaws.com/{bucket}?cors</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteBucketCors.html)

```typescript
const res = await s3.buckets.delCors({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>s3.buckets.delEncryption</code></b></summary>

<code>DELETE https://s3.us-east-1.amazonaws.com/{bucket}?encryption</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteBucketEncryption.html)

```typescript
const res = await s3.buckets.delEncryption({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>s3.buckets.delInventory</code></b></summary>

<code>DELETE https://s3.us-east-1.amazonaws.com/{bucket}?inventory{query}</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteBucketInventoryConfiguration.html)

```typescript
const res = await s3.buckets.delInventory({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>s3.buckets.delLifecycle</code></b></summary>

<code>DELETE https://s3.us-east-1.amazonaws.com/{bucket}?lifecycle</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteBucketLifecycle.html)

```typescript
const res = await s3.buckets.delLifecycle({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>s3.buckets.delMetadataConfiguration</code></b></summary>

<code>DELETE https://s3.us-east-1.amazonaws.com/{bucket}?metadataConfiguration</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteBucketMetadataConfiguration.html)

```typescript
const res = await s3.buckets.delMetadataConfiguration({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>s3.buckets.delMetrics</code></b></summary>

<code>DELETE https://s3.us-east-1.amazonaws.com/{bucket}?metrics{query}</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteBucketMetricsConfiguration.html)

```typescript
const res = await s3.buckets.delMetrics({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>s3.buckets.delOwnershipControls</code></b></summary>

<code>DELETE https://s3.us-east-1.amazonaws.com/{bucket}?ownershipControls</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteBucketOwnershipControls.html)

```typescript
const res = await s3.buckets.delOwnershipControls({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>s3.buckets.delPolicy</code></b></summary>

<code>DELETE https://s3.us-east-1.amazonaws.com/{bucket}?policy</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteBucketPolicy.html)

```typescript
const res = await s3.buckets.delPolicy({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>s3.buckets.delPublicAccessBlock</code></b></summary>

<code>DELETE https://s3.us-east-1.amazonaws.com/{bucket}?publicAccessBlock</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeletePublicAccessBlock.html)

```typescript
const res = await s3.buckets.delPublicAccessBlock({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>s3.buckets.delReplication</code></b></summary>

<code>DELETE https://s3.us-east-1.amazonaws.com/{bucket}?replication</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteBucketReplication.html)

```typescript
const res = await s3.buckets.delReplication({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>s3.buckets.delTagging</code></b></summary>

<code>DELETE https://s3.us-east-1.amazonaws.com/{bucket}?tagging</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteBucketTagging.html)

```typescript
const res = await s3.buckets.delTagging({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>s3.buckets.delWebsite</code></b></summary>

<code>DELETE https://s3.us-east-1.amazonaws.com/{bucket}?website</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteBucketWebsite.html)

```typescript
const res = await s3.buckets.delWebsite({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>GET</code> <b><code>s3.buckets.getAnalytics</code></b></summary>

<code>GET https://s3.us-east-1.amazonaws.com/{bucket}?analytics{query}</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketAnalyticsConfiguration.html)

```typescript
const res = await s3.buckets.getAnalytics({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>GET</code> <b><code>s3.buckets.getCors</code></b></summary>

<code>GET https://s3.us-east-1.amazonaws.com/{bucket}?cors</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketCors.html)

```typescript
const res = await s3.buckets.getCors({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>GET</code> <b><code>s3.buckets.getEncryption</code></b></summary>

<code>GET https://s3.us-east-1.amazonaws.com/{bucket}?encryption</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketEncryption.html)

```typescript
const res = await s3.buckets.getEncryption({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>GET</code> <b><code>s3.buckets.getInventory</code></b></summary>

<code>GET https://s3.us-east-1.amazonaws.com/{bucket}?inventory{query}</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketInventoryConfiguration.html)

```typescript
const res = await s3.buckets.getInventory({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>GET</code> <b><code>s3.buckets.getLifecycle</code></b></summary>

<code>GET https://s3.us-east-1.amazonaws.com/{bucket}?lifecycle</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketLifecycleConfiguration.html)

```typescript
const res = await s3.buckets.getLifecycle({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>GET</code> <b><code>s3.buckets.getLogging</code></b></summary>

<code>GET https://s3.us-east-1.amazonaws.com/{bucket}?logging</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketLogging.html)

```typescript
const res = await s3.buckets.getLogging({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>GET</code> <b><code>s3.buckets.getMetadataConfiguration</code></b></summary>

<code>GET https://s3.us-east-1.amazonaws.com/{bucket}?metadataConfiguration</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketMetadataConfiguration.html)

```typescript
const res = await s3.buckets.getMetadataConfiguration({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>GET</code> <b><code>s3.buckets.getMetrics</code></b></summary>

<code>GET https://s3.us-east-1.amazonaws.com/{bucket}?metrics{query}</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketMetricsConfiguration.html)

```typescript
const res = await s3.buckets.getMetrics({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>GET</code> <b><code>s3.buckets.getNotification</code></b></summary>

<code>GET https://s3.us-east-1.amazonaws.com/{bucket}?notification</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketNotificationConfiguration.html)

```typescript
const res = await s3.buckets.getNotification({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>GET</code> <b><code>s3.buckets.getObjectLockConfiguration</code></b></summary>

<code>GET https://s3.us-east-1.amazonaws.com/{bucket}?object-lock</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetObjectLockConfiguration.html)

```typescript
const res = await s3.buckets.getObjectLockConfiguration({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>GET</code> <b><code>s3.buckets.getOwnershipControls</code></b></summary>

<code>GET https://s3.us-east-1.amazonaws.com/{bucket}?ownershipControls</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketOwnershipControls.html)

```typescript
const res = await s3.buckets.getOwnershipControls({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>GET</code> <b><code>s3.buckets.getPolicy</code></b></summary>

<code>GET https://s3.us-east-1.amazonaws.com/{bucket}?policy</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketPolicy.html)

```typescript
const res = await s3.buckets.getPolicy({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>GET</code> <b><code>s3.buckets.getPublicAccessBlock</code></b></summary>

<code>GET https://s3.us-east-1.amazonaws.com/{bucket}?publicAccessBlock</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetPublicAccessBlock.html)

```typescript
const res = await s3.buckets.getPublicAccessBlock({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>GET</code> <b><code>s3.buckets.getReplication</code></b></summary>

<code>GET https://s3.us-east-1.amazonaws.com/{bucket}?replication</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketReplication.html)

```typescript
const res = await s3.buckets.getReplication({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>GET</code> <b><code>s3.buckets.getRequestPayment</code></b></summary>

<code>GET https://s3.us-east-1.amazonaws.com/{bucket}?requestPayment</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketRequestPayment.html)

```typescript
const res = await s3.buckets.getRequestPayment({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>GET</code> <b><code>s3.buckets.getTagging</code></b></summary>

<code>GET https://s3.us-east-1.amazonaws.com/{bucket}?tagging</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketTagging.html)

```typescript
const res = await s3.buckets.getTagging({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>GET</code> <b><code>s3.buckets.getVersioning</code></b></summary>

<code>GET https://s3.us-east-1.amazonaws.com/{bucket}?versioning</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketVersioning.html)

```typescript
const res = await s3.buckets.getVersioning({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>GET</code> <b><code>s3.buckets.getWebsite</code></b></summary>

<code>GET https://s3.us-east-1.amazonaws.com/{bucket}?website</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketWebsite.html)

```typescript
const res = await s3.buckets.getWebsite({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>HEAD</code> <b><code>s3.buckets.head</code></b></summary>

<code>HEAD https://s3.us-east-1.amazonaws.com/{bucket}</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_HeadBucket.html)

```typescript
const res = await s3.buckets.head({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>GET</code> <b><code>s3.buckets.list</code></b></summary>

<code>GET https://s3.us-east-1.amazonaws.com/</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListBuckets.html)

```typescript
const res = await s3.buckets.list({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>GET</code> <b><code>s3.buckets.listAnalytics</code></b></summary>

<code>GET https://s3.us-east-1.amazonaws.com/{bucket}?analytics{query}</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListBucketAnalyticsConfigurations.html)

```typescript
const res = await s3.buckets.listAnalytics({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>GET</code> <b><code>s3.buckets.listDirectory</code></b></summary>

<code>GET https://s3express-control.{param}.amazonaws.com/{query}</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListDirectoryBuckets.html)

```typescript
const res = await s3.buckets.listDirectory({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>GET</code> <b><code>s3.buckets.listInventory</code></b></summary>

<code>GET https://s3.us-east-1.amazonaws.com/{bucket}?inventory{query}</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListBucketInventoryConfigurations.html)

```typescript
const res = await s3.buckets.listInventory({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>GET</code> <b><code>s3.buckets.listMetrics</code></b></summary>

<code>GET https://s3.us-east-1.amazonaws.com/{bucket}?metrics{query}</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListBucketMetricsConfigurations.html)

```typescript
const res = await s3.buckets.listMetrics({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>GET</code> <b><code>s3.buckets.location</code></b></summary>

<code>GET https://s3.us-east-1.amazonaws.com/{bucket}?location</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketLocation.html)

```typescript
const res = await s3.buckets.location({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>PUT</code> <b><code>s3.buckets.putAnalytics</code></b></summary>

<code>PUT https://s3.us-east-1.amazonaws.com/{bucket}?analytics{query}</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutBucketAnalyticsConfiguration.html)

```typescript
const res = await s3.buckets.putAnalytics({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>PUT</code> <b><code>s3.buckets.putCors</code></b></summary>

<code>PUT https://s3.us-east-1.amazonaws.com/{bucket}?cors</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutBucketCors.html)

```typescript
const res = await s3.buckets.putCors({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>PUT</code> <b><code>s3.buckets.putEncryption</code></b></summary>

<code>PUT https://s3.us-east-1.amazonaws.com/{bucket}?encryption</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutBucketEncryption.html)

```typescript
const res = await s3.buckets.putEncryption({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>PUT</code> <b><code>s3.buckets.putInventory</code></b></summary>

<code>PUT https://s3.us-east-1.amazonaws.com/{bucket}?inventory{query}</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutBucketInventoryConfiguration.html)

```typescript
const res = await s3.buckets.putInventory({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>PUT</code> <b><code>s3.buckets.putLifecycle</code></b></summary>

<code>PUT https://s3.us-east-1.amazonaws.com/{bucket}?lifecycle</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutBucketLifecycleConfiguration.html)

```typescript
const res = await s3.buckets.putLifecycle({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>PUT</code> <b><code>s3.buckets.putLogging</code></b></summary>

<code>PUT https://s3.us-east-1.amazonaws.com/{bucket}?logging</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutBucketLogging.html)

```typescript
const res = await s3.buckets.putLogging({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>PUT</code> <b><code>s3.buckets.putMetrics</code></b></summary>

<code>PUT https://s3.us-east-1.amazonaws.com/{bucket}?metrics{query}</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutBucketMetricsConfiguration.html)

```typescript
const res = await s3.buckets.putMetrics({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>PUT</code> <b><code>s3.buckets.putNotification</code></b></summary>

<code>PUT https://s3.us-east-1.amazonaws.com/{bucket}?notification</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutBucketNotificationConfiguration.html)

```typescript
const res = await s3.buckets.putNotification({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>PUT</code> <b><code>s3.buckets.putObjectLockConfiguration</code></b></summary>

<code>PUT https://s3.us-east-1.amazonaws.com/{bucket}?object-lock</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutObjectLockConfiguration.html)

```typescript
const res = await s3.buckets.putObjectLockConfiguration({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>PUT</code> <b><code>s3.buckets.putOwnershipControls</code></b></summary>

<code>PUT https://s3.us-east-1.amazonaws.com/{bucket}?ownershipControls</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutBucketOwnershipControls.html)

```typescript
const res = await s3.buckets.putOwnershipControls({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>PUT</code> <b><code>s3.buckets.putPolicy</code></b></summary>

<code>PUT https://s3.us-east-1.amazonaws.com/{bucket}?policy</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutBucketPolicy.html)

```typescript
const res = await s3.buckets.putPolicy({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>PUT</code> <b><code>s3.buckets.putPublicAccessBlock</code></b></summary>

<code>PUT https://s3.us-east-1.amazonaws.com/{bucket}?publicAccessBlock</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutPublicAccessBlock.html)

```typescript
const res = await s3.buckets.putPublicAccessBlock({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>PUT</code> <b><code>s3.buckets.putReplication</code></b></summary>

<code>PUT https://s3.us-east-1.amazonaws.com/{bucket}?replication</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutBucketReplication.html)

```typescript
const res = await s3.buckets.putReplication({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>PUT</code> <b><code>s3.buckets.putRequestPayment</code></b></summary>

<code>PUT https://s3.us-east-1.amazonaws.com/{bucket}?requestPayment</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutBucketRequestPayment.html)

```typescript
const res = await s3.buckets.putRequestPayment({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>PUT</code> <b><code>s3.buckets.putTagging</code></b></summary>

<code>PUT https://s3.us-east-1.amazonaws.com/{bucket}?tagging</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutBucketTagging.html)

```typescript
const res = await s3.buckets.putTagging({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>PUT</code> <b><code>s3.buckets.putVersioning</code></b></summary>

<code>PUT https://s3.us-east-1.amazonaws.com/{bucket}?versioning</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutBucketVersioning.html)

```typescript
const res = await s3.buckets.putVersioning({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>PUT</code> <b><code>s3.buckets.putWebsite</code></b></summary>

<code>PUT https://s3.us-east-1.amazonaws.com/{bucket}?website</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutBucketWebsite.html)

```typescript
const res = await s3.buckets.putWebsite({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>PUT</code> <b><code>s3.buckets.updateMetadataInventoryTable</code></b></summary>

<code>PUT https://s3.us-east-1.amazonaws.com/{bucket}?metadataInventoryTable</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_UpdateBucketMetadataInventoryTableConfiguration.html)

```typescript
const res = await s3.buckets.updateMetadataInventoryTable({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>PUT</code> <b><code>s3.buckets.updateMetadataJournalTable</code></b></summary>

<code>PUT https://s3.us-east-1.amazonaws.com/{bucket}?metadataJournalTable</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_UpdateBucketMetadataJournalTableConfiguration.html)

```typescript
const res = await s3.buckets.updateMetadataJournalTable({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

### objectLambda

<details>
<summary><code>POST</code> <b><code>s3.objectLambda.writeGetObjectResponse</code></b></summary>

<code>POST https://{param}.s3-object-lambda.{param}.amazonaws.com/WriteGetObjectResponse</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_WriteGetObjectResponse.html)

```typescript
const res = await s3.objectLambda.writeGetObjectResponse({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

### objects

<details>
<summary><code>DELETE</code> <b><code>s3.objects.abortMultipartUpload</code></b></summary>

<code>DELETE https://s3.us-east-1.amazonaws.com/{bucket}/{key}{query}</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_AbortMultipartUpload.html)

```typescript
const res = await s3.objects.abortMultipartUpload({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>POST</code> <b><code>s3.objects.completeMultipartUpload</code></b></summary>

<code>POST https://s3.us-east-1.amazonaws.com/{bucket}/{key}{query}</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_CompleteMultipartUpload.html)

```typescript
const res = await s3.objects.completeMultipartUpload({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>PUT</code> <b><code>s3.objects.copy</code></b></summary>

<code>PUT https://s3.us-east-1.amazonaws.com/{bucket}/{key}</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_CopyObject.html)

```typescript
const res = await s3.objects.copy({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>POST</code> <b><code>s3.objects.createMultipartUpload</code></b></summary>

<code>POST https://s3.us-east-1.amazonaws.com/{bucket}/{key}?uploads</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_CreateMultipartUpload.html)

```typescript
const res = await s3.objects.createMultipartUpload({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

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
<summary><code>POST</code> <b><code>s3.objects.delMany</code></b></summary>

<code>POST https://s3.us-east-1.amazonaws.com/{bucket}?delete</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteObjects.html)

```typescript
const res = await s3.objects.delMany({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>s3.objects.delTagging</code></b></summary>

<code>DELETE https://s3.us-east-1.amazonaws.com/{bucket}/{key}?tagging{query}</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteObjectTagging.html)

```typescript
const res = await s3.objects.delTagging({ /* ... */ });
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
<summary><code>GET</code> <b><code>s3.objects.getAcl</code></b></summary>

<code>GET https://s3.us-east-1.amazonaws.com/{bucket}/{key}?acl{query}</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetObjectAcl.html)

```typescript
const res = await s3.objects.getAcl({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>GET</code> <b><code>s3.objects.getAttributes</code></b></summary>

<code>GET https://s3.us-east-1.amazonaws.com/{bucket}/{key}?attributes{query}</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetObjectAttributes.html)

```typescript
const res = await s3.objects.getAttributes({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>GET</code> <b><code>s3.objects.getLegalHold</code></b></summary>

<code>GET https://s3.us-east-1.amazonaws.com/{bucket}/{key}?legal-hold{query}</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetObjectLegalHold.html)

```typescript
const res = await s3.objects.getLegalHold({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>GET</code> <b><code>s3.objects.getRetention</code></b></summary>

<code>GET https://s3.us-east-1.amazonaws.com/{bucket}/{key}?retention{query}</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetObjectRetention.html)

```typescript
const res = await s3.objects.getRetention({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>GET</code> <b><code>s3.objects.getTagging</code></b></summary>

<code>GET https://s3.us-east-1.amazonaws.com/{bucket}/{key}?tagging{query}</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetObjectTagging.html)

```typescript
const res = await s3.objects.getTagging({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>GET</code> <b><code>s3.objects.getTorrent</code></b></summary>

<code>GET https://s3.us-east-1.amazonaws.com/{bucket}/{key}?torrent{query}</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetObjectTorrent.html)

```typescript
const res = await s3.objects.getTorrent({ /* ... */ });
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
<summary><code>GET</code> <b><code>s3.objects.listMultipartUploads</code></b></summary>

<code>GET https://s3.us-east-1.amazonaws.com/{bucket}?uploads{query}</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListMultipartUploads.html)

```typescript
const res = await s3.objects.listMultipartUploads({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>GET</code> <b><code>s3.objects.listParts</code></b></summary>

<code>GET https://s3.us-east-1.amazonaws.com/{bucket}/{key}{query}</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListParts.html)

```typescript
const res = await s3.objects.listParts({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>GET</code> <b><code>s3.objects.listVersions</code></b></summary>

<code>GET https://s3.us-east-1.amazonaws.com/{bucket}?versions{query}</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListObjectVersions.html)

```typescript
const res = await s3.objects.listVersions({ /* ... */ });
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

<details>
<summary><code>PUT</code> <b><code>s3.objects.putAcl</code></b></summary>

<code>PUT https://s3.us-east-1.amazonaws.com/{bucket}/{key}?acl{query}</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutObjectAcl.html)

```typescript
const res = await s3.objects.putAcl({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>PUT</code> <b><code>s3.objects.putLegalHold</code></b></summary>

<code>PUT https://s3.us-east-1.amazonaws.com/{bucket}/{key}?legal-hold{query}</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutObjectLegalHold.html)

```typescript
const res = await s3.objects.putLegalHold({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>PUT</code> <b><code>s3.objects.putRetention</code></b></summary>

<code>PUT https://s3.us-east-1.amazonaws.com/{bucket}/{key}?retention{query}</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutObjectRetention.html)

```typescript
const res = await s3.objects.putRetention({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>PUT</code> <b><code>s3.objects.putTagging</code></b></summary>

<code>PUT https://s3.us-east-1.amazonaws.com/{bucket}/{key}?tagging{query}</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutObjectTagging.html)

```typescript
const res = await s3.objects.putTagging({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>PUT</code> <b><code>s3.objects.rename</code></b></summary>

<code>PUT https://s3express-{param}.{param}.amazonaws.com/{bucket}/{key}?renameObject</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_RenameObject.html)

```typescript
const res = await s3.objects.rename({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>POST</code> <b><code>s3.objects.restore</code></b></summary>

<code>POST https://s3.us-east-1.amazonaws.com/{bucket}/{key}?restore{query}</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_RestoreObject.html)

```typescript
const res = await s3.objects.restore({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>POST</code> <b><code>s3.objects.selectContent</code></b></summary>

<code>POST https://s3.us-east-1.amazonaws.com/{bucket}/{key}?select&select-type=2</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_SelectObjectContent.html)

```typescript
const res = await s3.objects.selectContent({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>PUT</code> <b><code>s3.objects.updateEncryption</code></b></summary>

<code>PUT https://s3.us-east-1.amazonaws.com/{bucket}/{key}?encryption{query}</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_UpdateObjectEncryption.html)

```typescript
const res = await s3.objects.updateEncryption({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>PUT</code> <b><code>s3.objects.uploadPart</code></b></summary>

<code>PUT https://s3.us-east-1.amazonaws.com/{bucket}/{key}{query}</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_UploadPart.html)

```typescript
const res = await s3.objects.uploadPart({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

<details>
<summary><code>PUT</code> <b><code>s3.objects.uploadPartCopy</code></b></summary>

<code>PUT https://s3.us-east-1.amazonaws.com/{bucket}/{key}{query}</code>

[Upstream docs ↗](https://docs.aws.amazon.com/AmazonS3/latest/API/API_UploadPartCopy.html)

```typescript
const res = await s3.objects.uploadPartCopy({ /* ... */ });
```

Source: [`packages/provider/s3/src/s3.ts`](src/s3.ts)

</details>

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
