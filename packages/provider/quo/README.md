# @apicity/quo

Typed Quo API provider for sending SMS text messages.

## Installation

```bash
pnpm add @apicity/quo
```

## Usage

```typescript
import { createQuo } from "@apicity/quo";

const quo = createQuo({ apiKey: process.env.QUO_API_KEY });

const response = await quo.v1.messages({
  content: "Your appointment is confirmed.",
  from: "+15550100001",
  to: ["+15550100002"],
});

console.log(response.data.status);
```

If `apiKey` is omitted, the provider reads `QUO_API_KEY` when a request is
made. Quo receives the key as the raw `Authorization` header value, without a
`Bearer` prefix.

The optional `baseURL`, `timeout`, and `fetch` options support alternate
environments and injected-fetch testing. Pass an `AbortSignal` as the second
argument to cancel a request:

```typescript
await quo.v1.messages(request, controller.signal);
```

Request schemas are metadata and do not mutate or validate requests at
runtime:

```typescript
const result = quo.v1.messages.schema.safeParse(request);
```

The deprecated `phoneNumberId` request field remains available for upstream
compatibility; new code should use `from`.

This package intentionally exposes only `POST /v1/messages`. See the
[official send-text documentation](https://www.quo.com/docs/mdx/api-reference/messages/send-a-text-message).
