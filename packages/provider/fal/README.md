# @nakedapi/fal

[![npm](https://img.shields.io/npm/v/@nakedapi/fal?color=cb0000)](https://www.npmjs.com/package/@nakedapi/fal)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)

Fal provider — model registry, pricing, usage analytics, and request management. Completely standalone with zero external dependencies.

## Installation

```bash
npm install @nakedapi/fal
# or
pnpm add @nakedapi/fal
```

## Quick Start

```typescript
import { fal as createFal } from "@nakedapi/fal";

const fal = createFal({ apiKey: process.env.FAL_API_KEY! });

const models = await fal.v1.models({ search: "flux" });
const pricing = await fal.v1.models.pricing({ appId: "fal-ai/flux" });
const usage = await fal.v1.models.usage();
```

## Endpoints

Base URL: `https://api.fal.ai/v1`

| URL                                     | Method Signature                      |
| --------------------------------------- | ------------------------------------- |
| `GET /models`                           | `fal.v1.models()`                     |
| `GET /models/pricing`                   | `fal.v1.models.pricing()`             |
| `POST /models/pricing/estimate`         | `fal.v1.models.pricing.estimate()`    |
| `GET /models/usage`                     | `fal.v1.models.usage()`               |
| `GET /models/analytics`                 | `fal.v1.models.analytics()`           |
| `GET /models/requests/by-endpoint`      | `fal.v1.models.requests.byEndpoint()` |
| `DELETE /models/requests/{id}/payloads` | `fal.v1.models.requests.payloads()`   |

## Usage Examples

### Browse Models

```typescript
const models = await fal.v1.models({ search: "flux" });
```

### Pricing

```typescript
const pricing = await fal.v1.models.pricing({ appId: "fal-ai/flux" });

// Estimate cost before running
const estimate = await fal.v1.models.pricing.estimate({
  appId: "fal-ai/flux",
  input: { prompt: "A cat" },
});
```

### Usage & Analytics

```typescript
const usage = await fal.v1.models.usage();
const analytics = await fal.v1.models.analytics();
const byEndpoint = await fal.v1.models.requests.byEndpoint();
```

### Delete Request Payloads

```typescript
await fal.v1.models.requests.payloads({
  requestId: "req-123",
  idempotency_key: "unique-key",
});
```

## Data Shaping

These endpoints transform input before sending (all others are pure pass-through):

| Method                                                                            | What happens                                                    |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `v1.models()`, `.pricing()`, `.usage()`, `.analytics()`, `.requests.byEndpoint()` | Converts param objects to URL query strings                     |
| `v1.models.requests.payloads()`                                                   | Moves `idempotency_key` from params to `Idempotency-Key` header |

## Configuration

```typescript
const fal = createFal({
  apiKey: "your-api-key", // required
  baseURL: "https://...", // optional, custom base URL
  timeout: 30000, // optional, ms (default: 30000)
  fetch: customFetch, // optional, custom fetch implementation
});
```

## Middleware

```typescript
import { fal as createFal, withRetry } from "@nakedapi/fal";

const fal = createFal({ apiKey: process.env.FAL_API_KEY! });
const models = withRetry(fal.v1.models, { retries: 3 });
```

## License

MIT
