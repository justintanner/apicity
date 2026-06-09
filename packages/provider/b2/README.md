# @apicity/b2

[![npm](https://img.shields.io/npm/v/@apicity/b2?color=cb0000)](https://www.npmjs.com/package/@apicity/b2)
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

await b2.objects.put({
  bucket: process.env.B2_BUCKET!,
  key: "hello.txt",
  body: "hello from @apicity/b2\n",
  contentType: "text/plain",
});
```

`@apicity/b2` delegates signing, request transport, response parsing, and
schemas to `@apicity/s3`. The public provider surface is limited to the
Backblaze-supported S3-compatible calls.
