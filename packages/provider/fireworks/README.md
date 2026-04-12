# @apicity/fireworks

[![npm](https://img.shields.io/npm/v/@apicity/fireworks?color=cb0000)](https://www.npmjs.com/package/@apicity/fireworks)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)

Fireworks AI provider for chat completions, completions, and embeddings.

## Installation

```bash
npm install @apicity/fireworks
# or
pnpm add @apicity/fireworks
```

## Quick Start

```typescript
import { fireworks as createFireworks } from "@apicity/fireworks";

const fireworks = createFireworks({ apiKey: process.env.FIREWORKS_API_KEY! });
```

## API Reference

All methods include their payload schema and a `validatePayload()` function for runtime validation.

## Middleware

```typescript
import { fireworks as createFireworks, withRetry } from "@apicity/fireworks";

const fireworks = createFireworks({ apiKey: process.env.FIREWORKS_API_KEY! });
const models = withRetry(fireworks.get.v1.models, { retries: 3 });
```

## License

MIT
