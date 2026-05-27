# @apicity/dolthub

[![npm](https://img.shields.io/npm/v/@apicity/dolthub?color=cb0000)](https://www.npmjs.com/package/@apicity/dolthub)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)

DoltHub API provider for executing SQL and managing Dolt databases.

## Installation

```bash
npm install @apicity/dolthub
# or
pnpm add @apicity/dolthub
```

## Quick Start

```typescript
import { dolthub as createDolthub } from "@apicity/dolthub";

const dolthub = createDolthub({ apiKey: process.env.DOLTHUB_API_KEY! });
```

## API Reference

11 endpoints across 1 group. Each method mirrors an upstream URL path.

### v1alpha1

<details>
<summary><code>POST</code> <b><code>dolthub.v1alpha1.branches.create</code></b></summary>

<code>POST https://www.dolthub.com/api/v1alpha1/{owner}/{database}/branches</code>

[Upstream docs ↗](https://www.dolthub.com/docs/products/dolthub/api/database)

```typescript
const res = await dolthub.v1alpha1.branches.create({ /* ... */ });
```

Source: [`packages/provider/dolthub/src/dolthub.ts`](src/dolthub.ts)

</details>

<details>
<summary><code>GET</code> <b><code>dolthub.v1alpha1.branches.list</code></b></summary>

<code>GET https://www.dolthub.com/api/v1alpha1/{owner}/{database}/branches</code>

[Upstream docs ↗](https://www.dolthub.com/docs/products/dolthub/api/database)

```typescript
const res = await dolthub.v1alpha1.branches.list({ /* ... */ });
```

Source: [`packages/provider/dolthub/src/dolthub.ts`](src/dolthub.ts)

</details>

<details>
<summary><code>POST</code> <b><code>dolthub.v1alpha1.database.create</code></b></summary>

<code>POST https://www.dolthub.com/api/v1alpha1/database</code>

[Upstream docs ↗](https://www.dolthub.com/docs/products/dolthub/api/database)

```typescript
const res = await dolthub.v1alpha1.database.create({ /* ... */ });
```

Source: [`packages/provider/dolthub/src/dolthub.ts`](src/dolthub.ts)

</details>

<details>
<summary><code>POST</code> <b><code>dolthub.v1alpha1.pulls.create</code></b></summary>

<code>POST https://www.dolthub.com/api/v1alpha1/{owner}/{database}/pulls</code>

[Upstream docs ↗](https://www.dolthub.com/docs/products/dolthub/api/database)

```typescript
const res = await dolthub.v1alpha1.pulls.create({ /* ... */ });
```

Source: [`packages/provider/dolthub/src/dolthub.ts`](src/dolthub.ts)

</details>

<details>
<summary><code>GET</code> <b><code>dolthub.v1alpha1.pulls</code></b></summary>

<code>GET https://www.dolthub.com/api/v1alpha1/{owner}/{database}/pulls/{pullId}</code>

```typescript
const res = await dolthub.v1alpha1.pulls({ /* ... */ });
```

Source: [`packages/provider/dolthub/src/dolthub.ts`](src/dolthub.ts)

</details>

<details>
<summary><code>GET</code> <b><code>dolthub.v1alpha1.pulls.list</code></b></summary>

<code>GET https://www.dolthub.com/api/v1alpha1/{owner}/{database}/pulls{query}</code>

[Upstream docs ↗](https://www.dolthub.com/docs/products/dolthub/api/database)

```typescript
const res = await dolthub.v1alpha1.pulls.list({ /* ... */ });
```

Source: [`packages/provider/dolthub/src/dolthub.ts`](src/dolthub.ts)

</details>

<details>
<summary><code>POST</code> <b><code>dolthub.v1alpha1.pulls.merge</code></b></summary>

<code>POST https://www.dolthub.com/api/v1alpha1/{owner}/{database}/pulls/{pullId}/merge</code>

[Upstream docs ↗](https://www.dolthub.com/docs/products/dolthub/api/database)

```typescript
const res = await dolthub.v1alpha1.pulls.merge({ /* ... */ });
```

Source: [`packages/provider/dolthub/src/dolthub.ts`](src/dolthub.ts)

</details>

<details>
<summary><code>GET</code> <b><code>dolthub.v1alpha1.sql.read</code></b></summary>

<code>GET https://www.dolthub.com/api/v1alpha1/{owner}/{database}{refPath}{query}</code>

[Upstream docs ↗](https://www.dolthub.com/docs/products/dolthub/api/sql)

```typescript
const res = await dolthub.v1alpha1.sql.read({ /* ... */ });
```

Source: [`packages/provider/dolthub/src/dolthub.ts`](src/dolthub.ts)

</details>

<details>
<summary><code>POST</code> <b><code>dolthub.v1alpha1.sql.write</code></b></summary>

<code>POST https://www.dolthub.com/api/v1alpha1/{owner}/{database}/write/{fromBranch}/{toBranch}{query}</code>

[Upstream docs ↗](https://www.dolthub.com/docs/products/dolthub/api/sql)

```typescript
const res = await dolthub.v1alpha1.sql.write({ /* ... */ });
```

Source: [`packages/provider/dolthub/src/dolthub.ts`](src/dolthub.ts)

</details>

<details>
<summary><code>GET</code> <b><code>dolthub.v1alpha1.sql.writePoll</code></b></summary>

<code>GET https://www.dolthub.com/api/v1alpha1/{owner}/{database}/write{query}</code>

[Upstream docs ↗](https://www.dolthub.com/docs/products/dolthub/api/sql)

```typescript
const res = await dolthub.v1alpha1.sql.writePoll({ /* ... */ });
```

Source: [`packages/provider/dolthub/src/dolthub.ts`](src/dolthub.ts)

</details>

<details>
<summary><code>GET</code> <b><code>dolthub.v1alpha1.user</code></b></summary>

<code>GET https://www.dolthub.com/api/v1alpha1/user</code>

```typescript
const res = await dolthub.v1alpha1.user({ /* ... */ });
```

Source: [`packages/provider/dolthub/src/dolthub.ts`](src/dolthub.ts)

</details>

## Middleware

```typescript
import { dolthub as createDolthub, withRetry } from "@apicity/dolthub";

const dolthub = createDolthub({ apiKey: process.env.DOLTHUB_API_KEY! });
const models = withRetry(dolthub.get.v1.models, { retries: 3 });
```

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
