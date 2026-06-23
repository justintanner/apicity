# @apicity/openligadb

[![npm](https://img.shields.io/npm/v/@apicity/openligadb?color=cb0000)](https://www.npmjs.com/package/@apicity/openligadb)
[![dependencies](https://img.shields.io/badge/dependencies-1-blue)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)
[![docs](https://img.shields.io/badge/docs-api.openligadb.de-blue)](https://api.openligadb.de/swagger/index.html)

OpenLigaDB API provider for public soccer match data.

Runtime dependencies:

- `zod@^3.24.0` — request schemas attached to OpenLigaDB endpoint methods as `.schema`

## Installation

```bash
npm install @apicity/openligadb
# or
pnpm add @apicity/openligadb
```

## Quick Start

```typescript
import { createOpenLigaDB } from "@apicity/openligadb";

const openligadb = createOpenLigaDB();
```

## Matchdata Examples

OpenLigaDB is public and does not require an API key.

```typescript
import { createOpenLigaDB } from "@apicity/openligadb";

const openligadb = createOpenLigaDB();

const match = await openligadb.getmatchdata.byId({ matchId: 68720 });

const season = await openligadb.getmatchdata.byLeagueSeason({
  leagueShortcut: "bl1",
  leagueSeason: 2024,
});
```

The overloaded upstream `/getmatchdata` paths are exposed as explicit
`by*` methods so team, group, season, and match-id routes cannot collide.

## API Reference

5 endpoints across 1 group. Each method mirrors an upstream URL path.

### getmatchdata

<details>
<summary><code>GET</code> <b><code>openligadb.getmatchdata.byId</code></b></summary>

<code>GET https://api.openligadb.de/getmatchdata/{matchId}</code>

[Upstream docs ↗](https://api.openligadb.de/swagger/index.html)

```typescript
const res = await openligadb.getmatchdata.byId({ matchId: 68720 });
```

Source: [`packages/provider/openligadb/src/openligadb.ts`](src/openligadb.ts)

</details>

<details>
<summary><code>GET</code> <b><code>openligadb.getmatchdata.byLeagueSeason</code></b></summary>

<code>GET https://api.openligadb.de/getmatchdata/{leagueShortcut}/{leagueSeason}</code>

[Upstream docs ↗](https://api.openligadb.de/swagger/index.html)

```typescript
const res = await openligadb.getmatchdata.byLeagueSeason({
  leagueShortcut: "bl1",
  leagueSeason: 2024,
});
```

Source: [`packages/provider/openligadb/src/openligadb.ts`](src/openligadb.ts)

</details>

<details>
<summary><code>GET</code> <b><code>openligadb.getmatchdata.byLeagueSeasonGroup</code></b></summary>

<code>GET https://api.openligadb.de/getmatchdata/{leagueShortcut}/{leagueSeason}/{groupOrderId}</code>

[Upstream docs ↗](https://api.openligadb.de/swagger/index.html)

```typescript
const res = await openligadb.getmatchdata.byLeagueSeasonGroup({
  leagueShortcut: "bl1",
  leagueSeason: 2024,
  groupOrderId: 1,
});
```

Source: [`packages/provider/openligadb/src/openligadb.ts`](src/openligadb.ts)

</details>

<details>
<summary><code>GET</code> <b><code>openligadb.getmatchdata.byLeagueSeasonTeam</code></b></summary>

<code>GET https://api.openligadb.de/getmatchdata/{leagueShortcut}/{leagueSeason}/{teamFilterstring}</code>

[Upstream docs ↗](https://api.openligadb.de/swagger/index.html)

```typescript
const res = await openligadb.getmatchdata.byLeagueSeasonTeam({
  leagueShortcut: "bl1",
  leagueSeason: 2024,
  teamFilterstring: "Bayern",
});
```

Source: [`packages/provider/openligadb/src/openligadb.ts`](src/openligadb.ts)

</details>

<details>
<summary><code>GET</code> <b><code>openligadb.getmatchdata.byTeams</code></b></summary>

<code>GET https://api.openligadb.de/getmatchdata/{teamId1}/{teamId2}</code>

[Upstream docs ↗](https://api.openligadb.de/swagger/index.html)

```typescript
const res = await openligadb.getmatchdata.byTeams({ teamId1: 16, teamId2: 40 });
```

Source: [`packages/provider/openligadb/src/openligadb.ts`](src/openligadb.ts)

</details>

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
