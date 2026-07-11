# @apicity/dolthub

[![npm](https://img.shields.io/npm/v/@apicity/dolthub?color=cb0000)](https://www.npmjs.com/package/@apicity/dolthub)
[![dependencies](https://img.shields.io/badge/dependencies-1-blue)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)

DoltHub API provider for executing SQL and managing Dolt databases.

Runtime dependencies:

- `zod@^4.4.3` — request schemas attached to every POST endpoint as `.schema`

## Installation

```bash
npm install @apicity/dolthub
# or
pnpm add @apicity/dolthub
```

## Quick Start

```typescript
import { createDoltHub } from "@apicity/dolthub";

const dolthub = createDoltHub({ apiKey: process.env.DOLTHUB_API_KEY! });
```

## API Reference

13 endpoints across 3 groups. Each method mirrors an upstream URL path.

### databases

<details>
<summary><code>POST</code> <b><code>dolthub.api.v2.databases.forks.create</code></b></summary>

<code>POST https://www.dolthub.com/api/v2/databases/{owner}/{database}/forks</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://www.dolthub.com/docs/products/dolthub/api/v2/database)

```typescript
const res = await dolthub.api.v2.databases.forks.create({ /* ... */ });
```

Source: [`packages/provider/dolthub/src/dolthub.ts`](src/dolthub.ts)

</details>

### operations

<details>
<summary><code>GET</code> <b><code>dolthub.api.v2.operations</code></b></summary>

<code>GET https://www.dolthub.com/api/v2/operations/{operationId}</code>

Cost tier: <code>prohibitive</code>

```typescript
const res = await dolthub.api.v2.operations({ /* ... */ });
```

Source: [`packages/provider/dolthub/src/dolthub.ts`](src/dolthub.ts)

</details>

### v1alpha1

<details>
<summary><code>POST</code> <b><code>dolthub.v1alpha1.branches.create</code></b></summary>

<code>POST https://www.dolthub.com/api/v1alpha1/{owner}/{database}/branches</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://www.dolthub.com/docs/products/dolthub/api/database)

```typescript
const res = await dolthub.v1alpha1.branches.create({ /* ... */ });
```

Source: [`packages/provider/dolthub/src/dolthub.ts`](src/dolthub.ts)

</details>

<details>
<summary><code>GET</code> <b><code>dolthub.v1alpha1.branches.list</code></b></summary>

<code>GET https://www.dolthub.com/api/v1alpha1/{owner}/{database}/branches</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://www.dolthub.com/docs/products/dolthub/api/database)

```typescript
const res = await dolthub.v1alpha1.branches.list({ /* ... */ });
```

Source: [`packages/provider/dolthub/src/dolthub.ts`](src/dolthub.ts)

</details>

<details>
<summary><code>POST</code> <b><code>dolthub.v1alpha1.database.create</code></b></summary>

<code>POST https://www.dolthub.com/api/v1alpha1/database</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://www.dolthub.com/docs/products/dolthub/api/database)

```typescript
const res = await dolthub.v1alpha1.database.create({ /* ... */ });
```

Source: [`packages/provider/dolthub/src/dolthub.ts`](src/dolthub.ts)

</details>

<details>
<summary><code>POST</code> <b><code>dolthub.v1alpha1.pulls.create</code></b></summary>

<code>POST https://www.dolthub.com/api/v1alpha1/{owner}/{database}/pulls</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://www.dolthub.com/docs/products/dolthub/api/database)

```typescript
const res = await dolthub.v1alpha1.pulls.create({ /* ... */ });
```

Source: [`packages/provider/dolthub/src/dolthub.ts`](src/dolthub.ts)

</details>

<details>
<summary><code>GET</code> <b><code>dolthub.v1alpha1.pulls</code></b></summary>

<code>GET https://www.dolthub.com/api/v1alpha1/{owner}/{database}/pulls/{pullId}</code>

Cost tier: <code>cheap</code>

```typescript
const res = await dolthub.v1alpha1.pulls({ /* ... */ });
```

Source: [`packages/provider/dolthub/src/dolthub.ts`](src/dolthub.ts)

</details>

<details>
<summary><code>GET</code> <b><code>dolthub.v1alpha1.pulls.list</code></b></summary>

<code>GET https://www.dolthub.com/api/v1alpha1/{owner}/{database}/pulls{query}</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://www.dolthub.com/docs/products/dolthub/api/database)

```typescript
const res = await dolthub.v1alpha1.pulls.list({ /* ... */ });
```

Source: [`packages/provider/dolthub/src/dolthub.ts`](src/dolthub.ts)

</details>

<details>
<summary><code>POST</code> <b><code>dolthub.v1alpha1.pulls.merge</code></b></summary>

<code>POST https://www.dolthub.com/api/v1alpha1/{owner}/{database}/pulls/{pullId}/merge</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://www.dolthub.com/docs/products/dolthub/api/database)

```typescript
const res = await dolthub.v1alpha1.pulls.merge({ /* ... */ });
```

Source: [`packages/provider/dolthub/src/dolthub.ts`](src/dolthub.ts)

</details>

<details>
<summary><code>GET</code> <b><code>dolthub.v1alpha1.sql.read</code></b></summary>

<code>GET https://www.dolthub.com/api/v1alpha1/{owner}/{database}{refPath}{query}</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://www.dolthub.com/docs/products/dolthub/api/sql)

```typescript
const res = await dolthub.v1alpha1.sql.read({ /* ... */ });
```

Source: [`packages/provider/dolthub/src/dolthub.ts`](src/dolthub.ts)

</details>

<details>
<summary><code>POST</code> <b><code>dolthub.v1alpha1.sql.write</code></b></summary>

<code>POST https://www.dolthub.com/api/v1alpha1/{owner}/{database}/write/{fromBranch}/{toBranch}{query}</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://www.dolthub.com/docs/products/dolthub/api/sql)

```typescript
const res = await dolthub.v1alpha1.sql.write({ /* ... */ });
```

Source: [`packages/provider/dolthub/src/dolthub.ts`](src/dolthub.ts)

</details>

<details>
<summary><code>GET</code> <b><code>dolthub.v1alpha1.sql.writePoll</code></b></summary>

<code>GET https://www.dolthub.com/api/v1alpha1/{owner}/{database}/write{query}</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://www.dolthub.com/docs/products/dolthub/api/sql)

```typescript
const res = await dolthub.v1alpha1.sql.writePoll({ /* ... */ });
```

Source: [`packages/provider/dolthub/src/dolthub.ts`](src/dolthub.ts)

</details>

<details>
<summary><code>GET</code> <b><code>dolthub.v1alpha1.user</code></b></summary>

<code>GET https://www.dolthub.com/api/v1alpha1/user</code>

Cost tier: <code>cheap</code>

```typescript
const res = await dolthub.v1alpha1.user({ /* ... */ });
```

Source: [`packages/provider/dolthub/src/dolthub.ts`](src/dolthub.ts)

</details>

## Middleware

```typescript
import { createDoltHub, withRetry } from "@apicity/dolthub";

const dolthub = createDoltHub({ apiKey: process.env.DOLTHUB_API_KEY! });
const models = withRetry(dolthub.get.v1.models, { retries: 3 });
```

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
