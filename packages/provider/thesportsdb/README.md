# @apicity/thesportsdb

[![npm](https://img.shields.io/npm/v/@apicity/thesportsdb?color=cb0000)](https://www.npmjs.com/package/@apicity/thesportsdb)
[![dependencies](https://img.shields.io/badge/dependencies-1-blue)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)
[![docs](https://img.shields.io/badge/docs-thesportsdb.com-blue)](https://www.thesportsdb.com/docs_api_guide)

TheSportsDB V1 sports data API provider.

Runtime dependencies:

- `zod@^3.24.0` — request schemas attached to provider endpoints as `.schema`

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

## Search Examples

TheSportsDB V1 uses the free `123` key by default. Pass `apiKey` only
when you have a premium key.

```typescript
import { createTheSportsDB } from "@apicity/thesportsdb";

const thesportsdb = createTheSportsDB();

const teams = await thesportsdb.v1.searchTeams({
  team: "Arsenal",
});

const events = await thesportsdb.v1.searchEvents({
  event: "Arsenal_vs_Chelsea",
  season: "2016-2017",
  date: "2015-04-26",
});

const filename = await thesportsdb.v1.searchFilename({
  filename: "English_Premier_League_2015-04-26_Arsenal_vs_Chelsea",
});

const players = await thesportsdb.v1.searchPlayers({
  player: "Danny Welbeck",
});

const venues = await thesportsdb.v1.searchVenues({
  venue: "Wembley",
});
```

No-result V1 searches preserve TheSportsDB's nullable wrapper arrays,
such as `{ teams: null }` or `{ player: null }`.

V1 uses an API key in the URL path. The provider defaults to the public
free key `123`; pass `apiKey` to use your own key.

```typescript
const league = await thesportsdb.v1.lookup.league({ idLeague: 4328 });
const table = await thesportsdb.v1.lookup.table({
  idLeague: 4328,
  season: "2020-2021",
});
const team = await thesportsdb.v1.lookup.team({ idTeam: 133604 });
```

## API Reference

13 endpoints across 9 groups. Each method mirrors an upstream URL path.

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

### lookup

<details>
<summary><code>GET</code> <b><code>thesportsdb.v1.lookup.equipment</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v1/json/{apiKey}/lookupequipment.php{query}</code>

[Upstream docs ↗](https://www.thesportsdb.com/docs_api_guide)

```typescript
const res = await thesportsdb.v1.lookup.equipment({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

<details>
<summary><code>GET</code> <b><code>thesportsdb.v1.lookup.league</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v1/json/{apiKey}/lookupleague.php{query}</code>

[Upstream docs ↗](https://www.thesportsdb.com/docs_api_guide)

```typescript
const res = await thesportsdb.v1.lookup.league({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

<details>
<summary><code>GET</code> <b><code>thesportsdb.v1.lookup.table</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v1/json/{apiKey}/lookuptable.php{query}</code>

[Upstream docs ↗](https://www.thesportsdb.com/docs_api_guide)

```typescript
const res = await thesportsdb.v1.lookup.table({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

<details>
<summary><code>GET</code> <b><code>thesportsdb.v1.lookup.team</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v1/json/{apiKey}/lookupteam.php{query}</code>

[Upstream docs ↗](https://www.thesportsdb.com/docs_api_guide)

```typescript
const res = await thesportsdb.v1.lookup.team({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

<details>
<summary><code>GET</code> <b><code>thesportsdb.v1.lookup.venue</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v1/json/{apiKey}/lookupvenue.php{query}</code>

[Upstream docs ↗](https://www.thesportsdb.com/docs_api_guide)

```typescript
const res = await thesportsdb.v1.lookup.venue({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

### searchEvents

<details>
<summary><code>GET</code> <b><code>thesportsdb.v1.searchEvents</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v1/json/{apiKey}/searchevents.php{query}</code>

[Upstream docs ↗](https://www.thesportsdb.com/docs_api_guide#v1-search)

```typescript
const res = await thesportsdb.v1.searchEvents({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

### searchFilename

<details>
<summary><code>GET</code> <b><code>thesportsdb.v1.searchFilename</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v1/json/{apiKey}/searchfilename.php{query}</code>

[Upstream docs ↗](https://www.thesportsdb.com/docs_api_guide#v1-search)

```typescript
const res = await thesportsdb.v1.searchFilename({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

### searchPlayers

<details>
<summary><code>GET</code> <b><code>thesportsdb.v1.searchPlayers</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v1/json/{apiKey}/searchplayers.php{query}</code>

[Upstream docs ↗](https://thedatadb.readme.io/reference/getplayerbyname)

```typescript
const res = await thesportsdb.v1.searchPlayers({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

### searchTeams

<details>
<summary><code>GET</code> <b><code>thesportsdb.v1.searchTeams</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v1/json/{apiKey}/searchteams.php{query}</code>

[Upstream docs ↗](https://thedatadb.readme.io/reference/getteambyname)

```typescript
const res = await thesportsdb.v1.searchTeams({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

### searchVenues

<details>
<summary><code>GET</code> <b><code>thesportsdb.v1.searchVenues</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v1/json/{apiKey}/searchvenues.php{query}</code>

[Upstream docs ↗](https://thedatadb.readme.io/reference/getvenuebyname)

```typescript
const res = await thesportsdb.v1.searchVenues({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
