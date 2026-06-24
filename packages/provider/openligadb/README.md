# @apicity/openligadb

[![npm](https://img.shields.io/npm/v/@apicity/openligadb?color=cb0000)](https://www.npmjs.com/package/@apicity/openligadb)
[![dependencies](https://img.shields.io/badge/dependencies-1-blue)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)
[![docs](https://img.shields.io/badge/docs-api.openligadb.de-blue)](https://api.openligadb.de/swagger/v1/swagger.json)

OpenLigaDB API provider for public soccer match data, metadata, standings, and scorers.

OpenLigaDB is a public read-only API. `createOpenLigaDB()` does not take credentials, and the provider does not send auth headers.

Runtime dependencies:

- `zod@^4.4.3` — request schemas attached to endpoint methods as `.schema`; response schemas exported

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

## Next Match And Team Window Examples

The next/last shortcuts return one match. Team windows return recent and
upcoming matches around today, controlled by past/future week counts:

```typescript
const nextMatch = await openligadb.getnextmatchbyleagueshortcut({
  leagueShortcut: "bl1",
});

const recentAndUpcoming = await openligadb.getmatchesbyteam({
  teamFilterstring: "Bayern",
  weekCountPast: 4,
  weekCountFuture: 2,
});
```

## Standings And Scorers Examples

League standings, group tables, and top scorers share the same
`leagueShortcut` and `leagueSeason` request shape:

```typescript
const standings = await openligadb.getbltable({
  leagueShortcut: "bl1",
  leagueSeason: 2024,
});

const groupTable = await openligadb.getgrouptable({
  leagueShortcut: "bl1",
  leagueSeason: 2024,
});

const topScorers = await openligadb.getgoalgetters({
  leagueShortcut: "bl1",
  leagueSeason: 2024,
});
```

## Catalog Discovery Flow

OpenLigaDB's public catalog endpoints work without credentials. A common
flow is sports -> leagues -> groups, teams, and result metadata:

```typescript
import { createOpenLigaDB } from "@apicity/openligadb";

const openligadb = createOpenLigaDB();

const sports = await openligadb.getavailablesports();
const leagues = await openligadb.getavailableleagues.bySeason({
  season: 2024,
});

const league = leagues.find((item) => item.leagueShortcut === "bl1");
if (league) {
  const groups = await openligadb.getavailablegroups({
    leagueShortcut: league.leagueShortcut!,
    leagueSeason: Number(league.leagueSeason),
  });
  const teams = await openligadb.getavailableteams({
    leagueShortcut: league.leagueShortcut!,
    leagueSeason: Number(league.leagueSeason),
  });
  const resultInfo = await openligadb.getresultinfos({
    leagueId: league.leagueId,
  });
}
```

All path-parameter methods expose request schemas via `.schema`, for
example `openligadb.getavailablegroups.schema.safeParse(input)`.

## Errors And Scope

- OpenLigaDB's documented public surface is read-only. This package
  exposes `GET` helpers only and never sends auth headers.
- The public upstream docs do not document pagination parameters,
  rate-limit headers, or credential requirements for these routes,
  so this provider does not add client-side helpers for them.
- Non-2xx responses throw `OpenLigaDBError` with `status` and `body`.
  JSON error bodies stay as parsed objects, while `text/plain` bodies
  are preserved as strings so missing-match messages are not lost.
- Empty success bodies resolve to `null`; endpoint helpers with schemas
  expose request validation through `.schema.safeParse(input)`.

## API Reference

23 endpoints across 18 groups. Each method mirrors an upstream URL path.

### getavailablegroups

<details>
<summary><code>GET</code> <b><code>openligadb.getavailablegroups</code></b></summary>

<code>GET https://api.openligadb.de/getavailablegroups/{leagueShortcut}/{leagueSeason}</code>

[Upstream docs ↗](https://api.openligadb.de/swagger/v1/swagger.json)

```typescript
const groups = await openligadb.getavailablegroups({ leagueShortcut: "bl1", leagueSeason: 2024 });
```

Source: [`packages/provider/openligadb/src/openligadb.ts`](src/openligadb.ts)

</details>

### getavailableleagues

<details>
<summary><code>GET</code> <b><code>openligadb.getavailableleagues</code></b></summary>

<code>GET https://api.openligadb.de/getavailableleagues</code>

[Upstream docs ↗](https://api.openligadb.de/swagger/v1/swagger.json)

```typescript
const leagues = await openligadb.getavailableleagues();
```

Source: [`packages/provider/openligadb/src/openligadb.ts`](src/openligadb.ts)

</details>

<details>
<summary><code>GET</code> <b><code>openligadb.getavailableleagues.bySeason</code></b></summary>

<code>GET https://api.openligadb.de/getavailableleagues/{season}</code>

[Upstream docs ↗](https://api.openligadb.de/swagger/v1/swagger.json)

```typescript
const leagues = await openligadb.getavailableleagues.bySeason({ season: 2024 });
```

Source: [`packages/provider/openligadb/src/openligadb.ts`](src/openligadb.ts)

</details>

### getavailablesports

<details>
<summary><code>GET</code> <b><code>openligadb.getavailablesports</code></b></summary>

<code>GET https://api.openligadb.de/getavailablesports</code>

[Upstream docs ↗](https://api.openligadb.de/swagger/v1/swagger.json)

```typescript
const sports = await openligadb.getavailablesports();
```

Source: [`packages/provider/openligadb/src/openligadb.ts`](src/openligadb.ts)

</details>

### getavailableteams

<details>
<summary><code>GET</code> <b><code>openligadb.getavailableteams</code></b></summary>

<code>GET https://api.openligadb.de/getavailableteams/{leagueShortcut}/{leagueSeason}</code>

[Upstream docs ↗](https://api.openligadb.de/swagger/v1/swagger.json)

```typescript
const teams = await openligadb.getavailableteams({ leagueShortcut: "bl1", leagueSeason: 2024 });
```

Source: [`packages/provider/openligadb/src/openligadb.ts`](src/openligadb.ts)

</details>

### getbltable

<details>
<summary><code>GET</code> <b><code>openligadb.getbltable</code></b></summary>

<code>GET https://api.openligadb.de/getbltable/{leagueShortcut}/{leagueSeason}</code>

[Upstream docs ↗](https://api.openligadb.de/swagger/v1/swagger.json)

```typescript
const res = await openligadb.getbltable({
  leagueShortcut: "bl1",
  leagueSeason: 2024,
});
```

Source: [`packages/provider/openligadb/src/openligadb.ts`](src/openligadb.ts)

</details>

### getcurrentgroup

<details>
<summary><code>GET</code> <b><code>openligadb.getcurrentgroup</code></b></summary>

<code>GET https://api.openligadb.de/getcurrentgroup/{leagueShortcut}</code>

[Upstream docs ↗](https://api.openligadb.de/swagger/v1/swagger.json)

```typescript
const group = await openligadb.getcurrentgroup({ leagueShortcut: "bl1" });
```

Source: [`packages/provider/openligadb/src/openligadb.ts`](src/openligadb.ts)

</details>

### getgoalgetters

<details>
<summary><code>GET</code> <b><code>openligadb.getgoalgetters</code></b></summary>

<code>GET https://api.openligadb.de/getgoalgetters/{leagueShortcut}/{leagueSeason}</code>

[Upstream docs ↗](https://api.openligadb.de/swagger/v1/swagger.json)

```typescript
const res = await openligadb.getgoalgetters({
  leagueShortcut: "bl1",
  leagueSeason: 2024,
});
```

Source: [`packages/provider/openligadb/src/openligadb.ts`](src/openligadb.ts)

</details>

### getgrouptable

<details>
<summary><code>GET</code> <b><code>openligadb.getgrouptable</code></b></summary>

<code>GET https://api.openligadb.de/getgrouptable/{leagueShortcut}/{leagueSeason}</code>

[Upstream docs ↗](https://api.openligadb.de/swagger/v1/swagger.json)

```typescript
const res = await openligadb.getgrouptable({
  leagueShortcut: "bl1",
  leagueSeason: 2024,
});
```

Source: [`packages/provider/openligadb/src/openligadb.ts`](src/openligadb.ts)

</details>

### getlastchangedate

<details>
<summary><code>GET</code> <b><code>openligadb.getlastchangedate</code></b></summary>

<code>GET https://api.openligadb.de/getlastchangedate/{leagueShortcut}/{leagueSeason}/{groupOrderId}</code>

[Upstream docs ↗](https://api.openligadb.de/swagger/v1/swagger.json)

```typescript
const changedAt = await openligadb.getlastchangedate({
  leagueShortcut: "bl1",
  leagueSeason: 2024,
  groupOrderId: 1,
});
```

Source: [`packages/provider/openligadb/src/openligadb.ts`](src/openligadb.ts)

</details>

### getlastmatchbyleagueshortcut

<details>
<summary><code>GET</code> <b><code>openligadb.getlastmatchbyleagueshortcut</code></b></summary>

<code>GET https://api.openligadb.de/getlastmatchbyleagueshortcut/{leagueShortcut}</code>

[Upstream docs ↗](https://api.openligadb.de/swagger/v1/swagger.json)

```typescript
const match = await openligadb.getlastmatchbyleagueshortcut({ leagueShortcut: "bl1" });
```

Source: [`packages/provider/openligadb/src/openligadb.ts`](src/openligadb.ts)

</details>

### getlastmatchbyleagueteam

<details>
<summary><code>GET</code> <b><code>openligadb.getlastmatchbyleagueteam</code></b></summary>

<code>GET https://api.openligadb.de/getlastmatchbyleagueteam/{leagueId}/{teamId}</code>

[Upstream docs ↗](https://api.openligadb.de/swagger/v1/swagger.json)

```typescript
const match = await openligadb.getlastmatchbyleagueteam({
  leagueId: 4500,
  teamId: 40,
});
```

Source: [`packages/provider/openligadb/src/openligadb.ts`](src/openligadb.ts)

</details>

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

### getmatchesbyteam

<details>
<summary><code>GET</code> <b><code>openligadb.getmatchesbyteam</code></b></summary>

<code>GET https://api.openligadb.de/getmatchesbyteam/{teamFilterstring}/{weekCountPast}/{weekCountFuture}</code>

[Upstream docs ↗](https://api.openligadb.de/swagger/v1/swagger.json)

```typescript
const matches = await openligadb.getmatchesbyteam({
  teamFilterstring: "Bayern",
  weekCountPast: 4,
  weekCountFuture: 2,
});
```

Source: [`packages/provider/openligadb/src/openligadb.ts`](src/openligadb.ts)

</details>

### getmatchesbyteamid

<details>
<summary><code>GET</code> <b><code>openligadb.getmatchesbyteamid</code></b></summary>

<code>GET https://api.openligadb.de/getmatchesbyteamid/{teamId}/{weekCountPast}/{weekCountFuture}</code>

[Upstream docs ↗](https://api.openligadb.de/swagger/v1/swagger.json)

```typescript
const matches = await openligadb.getmatchesbyteamid({
  teamId: 40,
  weekCountPast: 4,
  weekCountFuture: 2,
});
```

Source: [`packages/provider/openligadb/src/openligadb.ts`](src/openligadb.ts)

</details>

### getnextmatchbyleagueshortcut

<details>
<summary><code>GET</code> <b><code>openligadb.getnextmatchbyleagueshortcut</code></b></summary>

<code>GET https://api.openligadb.de/getnextmatchbyleagueshortcut/{leagueShortcut}</code>

[Upstream docs ↗](https://api.openligadb.de/swagger/v1/swagger.json)

```typescript
const match = await openligadb.getnextmatchbyleagueshortcut({ leagueShortcut: "bl1" });
```

Source: [`packages/provider/openligadb/src/openligadb.ts`](src/openligadb.ts)

</details>

### getnextmatchbyleagueteam

<details>
<summary><code>GET</code> <b><code>openligadb.getnextmatchbyleagueteam</code></b></summary>

<code>GET https://api.openligadb.de/getnextmatchbyleagueteam/{leagueId}/{teamId}</code>

[Upstream docs ↗](https://api.openligadb.de/swagger/v1/swagger.json)

```typescript
const match = await openligadb.getnextmatchbyleagueteam({
  leagueId: 4500,
  teamId: 40,
});
```

Source: [`packages/provider/openligadb/src/openligadb.ts`](src/openligadb.ts)

</details>

### getresultinfos

<details>
<summary><code>GET</code> <b><code>openligadb.getresultinfos</code></b></summary>

<code>GET https://api.openligadb.de/getresultinfos/{leagueId}</code>

[Upstream docs ↗](https://api.openligadb.de/swagger/v1/swagger.json)

```typescript
const resultInfo = await openligadb.getresultinfos({ leagueId: 4500 });
```

Source: [`packages/provider/openligadb/src/openligadb.ts`](src/openligadb.ts)

</details>

### swagger

<details>
<summary><code>GET</code> <b><code>openligadb.swagger.v1.swaggerJson</code></b></summary>

<code>GET https://api.openligadb.de/swagger/v1/swagger.json</code>

[Upstream docs ↗](https://api.openligadb.de/swagger/v1/swagger.json)

```typescript
const res = await openligadb.swagger.v1.swaggerJson();
```

Source: [`packages/provider/openligadb/src/openligadb.ts`](src/openligadb.ts)

</details>

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
