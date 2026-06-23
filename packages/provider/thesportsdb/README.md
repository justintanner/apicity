# @apicity/thesportsdb

[![npm](https://img.shields.io/npm/v/@apicity/thesportsdb?color=cb0000)](https://www.npmjs.com/package/@apicity/thesportsdb)
[![dependencies](https://img.shields.io/badge/dependencies-1-blue)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)
[![docs](https://img.shields.io/badge/docs-thesportsdb.com-blue)](https://www.thesportsdb.com/docs_api_guide)

TheSportsDB V1 and V2 sports data API provider.

Runtime dependencies:

- `zod@^3.24.0` — request schemas attached to every POST endpoint as `.schema`

## Installation

```bash
npm install @apicity/thesportsdb
# or
pnpm add @apicity/thesportsdb
```

## Quick Start

```typescript
import { createTheSportsDB } from "@apicity/thesportsdb";

const thesportsdb = createTheSportsDB({ apiKey: process.env.THESPORTSDB_API_KEY });
```

## API Reference

3 endpoints across 3 groups. Each method mirrors an upstream URL path.

### allCountries

<details>
<summary><code>GET</code> <b><code>thesportsdb.v1.allCountries</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v1/json/{apiKey}/all_countries.php</code>

[Upstream docs ↗](https://thedatadb.readme.io/reference/getallcountries)

```typescript
const res = await thesportsdb.v1.allCountries({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

### allLeagues

<details>
<summary><code>GET</code> <b><code>thesportsdb.v1.allLeagues</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v1/json/{apiKey}/all_leagues.php</code>

[Upstream docs ↗](https://www.thesportsdb.com/docs_api_guide#v1-list)

```typescript
const res = await thesportsdb.v1.allLeagues({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

### allSports

<details>
<summary><code>GET</code> <b><code>thesportsdb.v1.allSports</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v1/json/{apiKey}/all_sports.php</code>

[Upstream docs ↗](https://thedatadb.readme.io/reference/getallsports)

```typescript
const res = await thesportsdb.v1.allSports({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
