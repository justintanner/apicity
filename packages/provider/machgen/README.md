# @apicity/machgen

[![npm](https://img.shields.io/npm/v/@apicity/machgen?color=cb0000)](https://www.npmjs.com/package/@apicity/machgen)
[![dependencies](https://img.shields.io/badge/dependencies-1-blue)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)
[![docs](https://img.shields.io/badge/docs-machgen.ai-blue)](https://www.machgen.ai/docs/rest_api)

MachGen video generation API provider.

Send `Alibaba-Wan-3.0` requests with MachGen's documented `video_config`: `aspect_ratio: "adaptive"`, `fps: 30` and `audio: true`. On 2026-10-22, seven Wan 3.0 tasks that omitted `aspect_ratio` and `fps` and sent `audio: false` were accepted, then failed upstream with `Request Rejected` at zero charge. With the documented config, 2-second 480p T2V, I2V and R2V requests completed. Which of the three fields MachGen requires has not been isolated.

Runtime dependencies:

- `zod@^4.4.3` — request schemas attached to every POST endpoint as `.schema`

## Installation

```bash
npm install @apicity/machgen
# or
pnpm add @apicity/machgen
```

## Quick Start

```typescript
import { createMachGen } from "@apicity/machgen";

const machgen = createMachGen({ apiKey: process.env.MACHGEN_API_KEY! });
```

## API Reference

3 endpoints across 3 groups. Each method mirrors an upstream URL path.

### assets

<details>
<summary><code>GET</code> <b><code>machgen.api.v0.assets</code></b></summary>

<code>GET https://api.machgen.ai/api/v0/assets/{taskId}</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://www.machgen.ai/docs/rest_api#check-status-and-download)

```typescript
const res = await machgen.api.v0.assets({ /* ... */ });
```

Source: [`packages/provider/machgen/src/machgen.ts`](src/machgen.ts)

</details>

### generate

<details>
<summary><code>POST</code> <b><code>machgen.api.v0.generate</code></b></summary>

<code>POST https://api.machgen.ai/api/v0/generate</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://www.machgen.ai/docs/rest_api#submit-a-task)

```typescript
const res = await machgen.api.v0.generate({ /* ... */ });
```

Source: [`packages/provider/machgen/src/machgen.ts`](src/machgen.ts)

</details>

### tasks

<details>
<summary><code>GET</code> <b><code>machgen.api.v0.tasks</code></b></summary>

<code>GET https://api.machgen.ai/api/v0/tasks/{taskId}</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://www.machgen.ai/docs/reference#taskstatusresponse)

```typescript
const res = await machgen.api.v0.tasks({ /* ... */ });
```

Source: [`packages/provider/machgen/src/machgen.ts`](src/machgen.ts)

</details>

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
