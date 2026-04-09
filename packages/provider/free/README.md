# @nakedapi/free

[![npm](https://img.shields.io/npm/v/@nakedapi/free?color=cb0000)](https://www.npmjs.com/package/@nakedapi/free)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)

Free file hosting providers — tmpfiles.org and file.io.

## Installation

```bash
npm install @nakedapi/free
# or
pnpm add @nakedapi/free
```

## Quick Start

```typescript
import { free as createFree } from "@nakedapi/free";

const free = createFree({ apiKey: process.env.FREE_API_KEY! });
```

## API Reference

All methods include their payload schema and a `validatePayload()` function for runtime validation.

### POST Endpoints

<details>
<summary><b><code>api.v1.upload</code></b> — <code>POST /api/v1/upload</code></summary>

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | object | Yes | The file to upload (Blob or File). Auto-deleted after 60 minutes. |
| `filename` | string | No | Optional filename for the upload. |

**Validation:**

```typescript
// Access the schema
free.tmpfiles.upload.payloadSchema

// Validate data
free.tmpfiles.upload.validatePayload(data)
```

</details>

<details>
<summary><b><code>upload</code></b> — <code>POST /upload</code></summary>

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | object | Yes | The file to upload (Blob or File). 128 MiB max. Expires after 3 hours. |
| `filename` | string | No | Optional filename for the upload. |

**Validation:**

```typescript
// Access the schema
free.uguu.upload.payloadSchema

// Validate data
free.uguu.upload.validatePayload(data)
```

</details>

<details>
<summary><b><code>user.api.php</code></b> — <code>POST /user/api.php</code></summary>

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | object | Yes | The file to upload (Blob or File). 200 MB max. Stored permanently. |
| `filename` | string | No | Optional filename for the upload. |

**Validation:**

```typescript
// Access the schema
free.catbox.upload.payloadSchema

// Validate data
free.catbox.upload.validatePayload(data)
```

</details>

<details>
<summary><b><code>resources.internals.api.php</code></b> — <code>POST /resources/internals/api.php</code></summary>

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | object | Yes | The file to upload (Blob or File). 1 GB max. |
| `filename` | string | No | Optional filename for the upload. |
| `time` | string | No | Retention time: 1h, 12h, 24h, or 72h (default 1h).<br>Enum: `1h`, `12h`, `24h`, `72h` |

**Validation:**

```typescript
// Access the schema
free.litterbox.upload.payloadSchema

// Validate data
free.litterbox.upload.validatePayload(data)
```

</details>

<details>
<summary><b><code>uploadfile</code></b> — <code>POST /uploadfile</code></summary>

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | object | Yes | The file to upload (Blob or File). Free tier: 10-day retention. |
| `filename` | string | No | Optional filename for the upload. |

**Validation:**

```typescript
// Access the schema
free.gofile.upload.payloadSchema

// Validate data
free.gofile.upload.validatePayload(data)
```

</details>

<details>
<summary><b><code>bin.filename</code></b> — <code>POST /{bin}/{filename}</code></summary>

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | object | Yes | The file to upload (Blob or File). Expires after ~1 week. |
| `filename` | string | No | Filename for the upload (defaults to 'upload'). |
| `bin` | string | No | Bin name to group files (auto-generated if omitted). |

**Validation:**

```typescript
// Access the schema
free.filebin.upload.payloadSchema

// Validate data
free.filebin.upload.validatePayload(data)
```

</details>

<details>
<summary><b><code>upload</code></b> — <code>POST /upload</code></summary>

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | object | Yes | The file to upload (Blob or File). Expires after 3 days. |
| `filename` | string | No | Optional filename for the upload. |

**Validation:**

```typescript
// Access the schema
free.tempsh.upload.payloadSchema

// Validate data
free.tempsh.upload.validatePayload(data)
```

</details>

<details>
<summary><b><code>api.upload</code></b> — <code>POST /api/upload</code></summary>

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | object | Yes | The file to upload (Blob or File). 100 MB max. Anonymous uploads auto-delete after 7 days. |
| `filename` | string | No | Optional filename for the upload. |

**Validation:**

```typescript
// Access the schema
free.tflink.upload.payloadSchema

// Validate data
free.tflink.upload.validatePayload(data)
```

</details>

## Middleware

```typescript
import { free as createFree, withRetry } from "@nakedapi/free";

const free = createFree({ apiKey: process.env.FREE_API_KEY! });
const models = withRetry(free.get.v1.models, { retries: 3 });
```

## License

MIT
