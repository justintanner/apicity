# @apicity/thesportsdb

[![npm](https://img.shields.io/npm/v/@apicity/thesportsdb?color=cb0000)](https://www.npmjs.com/package/@apicity/thesportsdb)
[![dependencies](https://img.shields.io/badge/dependencies-1-blue)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)
[![docs](https://img.shields.io/badge/docs-thesportsdb.com-blue)](https://www.thesportsdb.com/docs_api_guide)

TheSportsDB sports data API provider.

Runtime dependencies:

- `zod@^3.24.0` — request schemas attached to endpoint methods as `.schema`; response schemas exported

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

## Player Lookup Examples

Player lookup, honours, former-team, milestone, contract, result, and
statistics routes use TheSportsDB's numeric player id.

```typescript
import { createTheSportsDB } from "@apicity/thesportsdb";

const thesportsdb = createTheSportsDB({
  apiKey: process.env.THESPORTSDB_API_KEY,
});

const player = await thesportsdb.v1.lookupplayer({ idPlayer: 34145937 });
const honours = await thesportsdb.v1.lookuphonours({ idPlayer: 34147178 });
const stats = await thesportsdb.v1.lookupplayerstats({ idPlayer: 34146304 });
```

No-result responses preserve TheSportsDB's wrapper key with a `null`
value, for example `{ players: null }`.

V1 uses an API key in the URL path. The provider defaults to the public
free key `123`; pass `apiKey` to use your own key.
V2 uses the same `apiKey` option as an `X-API-KEY` header and is
available under `thesportsdb.v2`.

```typescript
const league = await thesportsdb.v1.lookup.league({ idLeague: 4328 });
const table = await thesportsdb.v1.lookup.table({
  idLeague: 4328,
  season: "2020-2021",
});
const team = await thesportsdb.v1.lookup.team({ idTeam: 133604 });

const nextLeagueEvents = await thesportsdb.v2.schedule.next.league({
  idLeague: 4328,
});
const liveSoccer = await thesportsdb.v2.livescore.bySport({
  sport: "soccer",
});
```

V2 is premium-only and sends the same `apiKey` as an `X-API-KEY`
header. V2 lookup method names mirror the path segments:

```typescript
const player = await thesportsdb.v2.lookup.player({ idPlayer: 34172575 });
const lineup = await thesportsdb.v2.lookup.eventLineup({
  idEvent: 1937584,
});
const highlights = await thesportsdb.v2.lookup.eventHighlights({
  idEvent: 2044892,
});
```

## API Reference

67 endpoints across 36 groups. Each method mirrors an upstream URL path.

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

### eventResults

<details>
<summary><code>GET</code> <b><code>thesportsdb.v1.eventResults</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v1/json/{apiKey}/eventresults.php{query}</code>

[Upstream docs ↗](https://www.thesportsdb.com/docs_api_guide#v1-lookup)

```typescript
const res = await thesportsdb.v1.eventResults({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

### eventsday

<details>
<summary><code>GET</code> <b><code>thesportsdb.v1.eventsday</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v1/json/{apiKey}/eventsday.php{query}</code>

[Upstream docs ↗](https://www.thesportsdb.com/docs_api_guide#v1-schedule)

```typescript
const res = await thesportsdb.v1.eventsday({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

### eventshighlights

<details>
<summary><code>GET</code> <b><code>thesportsdb.v1.eventshighlights</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v1/json/{apiKey}/eventshighlights.php{query}</code>

[Upstream docs ↗](https://www.thesportsdb.com/docs_api_guide#v1-video)

```typescript
const res = await thesportsdb.v1.eventshighlights({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

### eventslast

<details>
<summary><code>GET</code> <b><code>thesportsdb.v1.eventslast</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v1/json/{apiKey}/eventslast.php{query}</code>

[Upstream docs ↗](https://www.thesportsdb.com/docs_api_guide#v1-schedule)

```typescript
const res = await thesportsdb.v1.eventslast({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

### eventsnext

<details>
<summary><code>GET</code> <b><code>thesportsdb.v1.eventsnext</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v1/json/{apiKey}/eventsnext.php{query}</code>

[Upstream docs ↗](https://www.thesportsdb.com/docs_api_guide#v1-schedule)

```typescript
const res = await thesportsdb.v1.eventsnext({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

### eventsnextleague

<details>
<summary><code>GET</code> <b><code>thesportsdb.v1.eventsnextleague</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v1/json/{apiKey}/eventsnextleague.php{query}</code>

[Upstream docs ↗](https://www.thesportsdb.com/docs_api_guide#v1-schedule)

```typescript
const res = await thesportsdb.v1.eventsnextleague({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

### eventspastleague

<details>
<summary><code>GET</code> <b><code>thesportsdb.v1.eventspastleague</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v1/json/{apiKey}/eventspastleague.php{query}</code>

[Upstream docs ↗](https://www.thesportsdb.com/docs_api_guide#v1-schedule)

```typescript
const res = await thesportsdb.v1.eventspastleague({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

### eventsseason

<details>
<summary><code>GET</code> <b><code>thesportsdb.v1.eventsseason</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v1/json/{apiKey}/eventsseason.php{query}</code>

[Upstream docs ↗](https://www.thesportsdb.com/docs_api_guide#v1-schedule)

```typescript
const res = await thesportsdb.v1.eventsseason({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

### eventstv

<details>
<summary><code>GET</code> <b><code>thesportsdb.v1.eventstv</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v1/json/{apiKey}/eventstv.php{query}</code>

[Upstream docs ↗](https://www.thesportsdb.com/docs_api_guide#v1-schedule)

```typescript
const res = await thesportsdb.v1.eventstv({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

### livescore

<details>
<summary><code>GET</code> <b><code>thesportsdb.v2.livescore.all</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v2/json/livescore/all</code>

[Upstream docs ↗](https://www.thesportsdb.com/docs_api_guide#v2-livescores)

```typescript
const res = await thesportsdb.v2.livescore.all({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

<details>
<summary><code>GET</code> <b><code>thesportsdb.v2.livescore.byLeague</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v2/json/livescore/{leagueId}</code>

[Upstream docs ↗](https://www.thesportsdb.com/docs_api_guide#v2-livescores)

```typescript
const res = await thesportsdb.v2.livescore.byLeague({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

<details>
<summary><code>GET</code> <b><code>thesportsdb.v2.livescore.bySport</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v2/json/livescore/{sport}</code>

[Upstream docs ↗](https://www.thesportsdb.com/docs_api_guide#v2-livescores)

```typescript
const res = await thesportsdb.v2.livescore.bySport({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

### lookup

<details>
<summary><code>GET</code> <b><code>thesportsdb.v2.lookup.event</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v2/json/lookup/event/{idEvent}</code>

[Upstream docs ↗](https://www.thesportsdb.com/docs_api_guide#v2-lookup)

```typescript
const res = await thesportsdb.v2.lookup.event({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

<details>
<summary><code>GET</code> <b><code>thesportsdb.v2.lookup.eventHighlights</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v2/json/lookup/event_highlights/{idEvent}</code>

[Upstream docs ↗](https://www.thesportsdb.com/docs_api_guide#v2-lookup)

```typescript
const res = await thesportsdb.v2.lookup.eventHighlights({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

<details>
<summary><code>GET</code> <b><code>thesportsdb.v2.lookup.eventLineup</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v2/json/lookup/event_lineup/{idEvent}</code>

[Upstream docs ↗](https://www.thesportsdb.com/docs_api_guide#v2-lookup)

```typescript
const res = await thesportsdb.v2.lookup.eventLineup({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

<details>
<summary><code>GET</code> <b><code>thesportsdb.v2.lookup.eventResults</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v2/json/lookup/event_results/{idEvent}</code>

[Upstream docs ↗](https://www.thesportsdb.com/docs_api_guide#v2-lookup)

```typescript
const res = await thesportsdb.v2.lookup.eventResults({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

<details>
<summary><code>GET</code> <b><code>thesportsdb.v2.lookup.eventStats</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v2/json/lookup/event_stats/{idEvent}</code>

[Upstream docs ↗](https://www.thesportsdb.com/docs_api_guide#v2-lookup)

```typescript
const res = await thesportsdb.v2.lookup.eventStats({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

<details>
<summary><code>GET</code> <b><code>thesportsdb.v2.lookup.eventTimeline</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v2/json/lookup/event_timeline/{idEvent}</code>

[Upstream docs ↗](https://www.thesportsdb.com/docs_api_guide#v2-lookup)

```typescript
const res = await thesportsdb.v2.lookup.eventTimeline({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

<details>
<summary><code>GET</code> <b><code>thesportsdb.v2.lookup.eventTv</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v2/json/lookup/event_tv/{idEvent}</code>

[Upstream docs ↗](https://www.thesportsdb.com/docs_api_guide#v2-lookup)

```typescript
const res = await thesportsdb.v2.lookup.eventTv({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

<details>
<summary><code>GET</code> <b><code>thesportsdb.v2.lookup.league</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v2/json/lookup/league/{idLeague}</code>

[Upstream docs ↗](https://www.thesportsdb.com/docs_api_guide#v2-lookup)

```typescript
const res = await thesportsdb.v2.lookup.league({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

<details>
<summary><code>GET</code> <b><code>thesportsdb.v2.lookup.player</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v2/json/lookup/player/{idPlayer}</code>

[Upstream docs ↗](https://www.thesportsdb.com/docs_api_guide#v2-lookup)

```typescript
const res = await thesportsdb.v2.lookup.player({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

<details>
<summary><code>GET</code> <b><code>thesportsdb.v2.lookup.playerContracts</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v2/json/lookup/player_contracts/{idPlayer}</code>

[Upstream docs ↗](https://www.thesportsdb.com/docs_api_guide#v2-lookup)

```typescript
const res = await thesportsdb.v2.lookup.playerContracts({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

<details>
<summary><code>GET</code> <b><code>thesportsdb.v2.lookup.playerHonours</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v2/json/lookup/player_honours/{idPlayer}</code>

[Upstream docs ↗](https://www.thesportsdb.com/docs_api_guide#v2-lookup)

```typescript
const res = await thesportsdb.v2.lookup.playerHonours({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

<details>
<summary><code>GET</code> <b><code>thesportsdb.v2.lookup.playerMilestones</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v2/json/lookup/player_milestones/{idPlayer}</code>

[Upstream docs ↗](https://www.thesportsdb.com/docs_api_guide#v2-lookup)

```typescript
const res = await thesportsdb.v2.lookup.playerMilestones({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

<details>
<summary><code>GET</code> <b><code>thesportsdb.v2.lookup.playerResults</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v2/json/lookup/player_results/{idPlayer}</code>

[Upstream docs ↗](https://www.thesportsdb.com/docs_api_guide#v2-lookup)

```typescript
const res = await thesportsdb.v2.lookup.playerResults({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

<details>
<summary><code>GET</code> <b><code>thesportsdb.v2.lookup.playerStats</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v2/json/lookup/player_stats/{idPlayer}</code>

[Upstream docs ↗](https://www.thesportsdb.com/docs_api_guide#v2-lookup)

```typescript
const res = await thesportsdb.v2.lookup.playerStats({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

<details>
<summary><code>GET</code> <b><code>thesportsdb.v2.lookup.playerTeams</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v2/json/lookup/player_teams/{idPlayer}</code>

[Upstream docs ↗](https://www.thesportsdb.com/docs_api_guide#v2-lookup)

```typescript
const res = await thesportsdb.v2.lookup.playerTeams({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

<details>
<summary><code>GET</code> <b><code>thesportsdb.v2.lookup.team</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v2/json/lookup/team/{idTeam}</code>

[Upstream docs ↗](https://www.thesportsdb.com/docs_api_guide#v2-lookup)

```typescript
const res = await thesportsdb.v2.lookup.team({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

<details>
<summary><code>GET</code> <b><code>thesportsdb.v2.lookup.teamEquipment</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v2/json/lookup/team_equipment/{idTeam}</code>

[Upstream docs ↗](https://www.thesportsdb.com/docs_api_guide#v2-lookup)

```typescript
const res = await thesportsdb.v2.lookup.teamEquipment({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

<details>
<summary><code>GET</code> <b><code>thesportsdb.v2.lookup.venue</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v2/json/lookup/venue/{idVenue}</code>

[Upstream docs ↗](https://www.thesportsdb.com/docs_api_guide#v2-lookup)

```typescript
const res = await thesportsdb.v2.lookup.venue({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

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

### lookupAllPlayers

<details>
<summary><code>GET</code> <b><code>thesportsdb.v1.lookupAllPlayers</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v1/json/{apiKey}/lookup_all_players.php{query}</code>

[Upstream docs ↗](https://www.thesportsdb.com/docs_api_guide#v1-list)

```typescript
const res = await thesportsdb.v1.lookupAllPlayers({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

### lookupcontracts

<details>
<summary><code>GET</code> <b><code>thesportsdb.v1.lookupcontracts</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v1/json/{apiKey}/lookupcontracts.php?id={idPlayer}</code>

[Upstream docs ↗](https://thedatadb.readme.io/reference/getcontractsbyplayerid)

```typescript
const res = await thesportsdb.v1.lookupcontracts({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

### lookupEvent

<details>
<summary><code>GET</code> <b><code>thesportsdb.v1.lookupEvent</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v1/json/{apiKey}/lookupevent.php{query}</code>

[Upstream docs ↗](https://www.thesportsdb.com/docs_api_guide#v1-lookup)

```typescript
const res = await thesportsdb.v1.lookupEvent({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

### lookupEventStats

<details>
<summary><code>GET</code> <b><code>thesportsdb.v1.lookupEventStats</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v1/json/{apiKey}/lookupeventstats.php{query}</code>

[Upstream docs ↗](https://www.thesportsdb.com/docs_api_guide#v1-lookup)

```typescript
const res = await thesportsdb.v1.lookupEventStats({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

### lookupformerteams

<details>
<summary><code>GET</code> <b><code>thesportsdb.v1.lookupformerteams</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v1/json/{apiKey}/lookupformerteams.php?id={idPlayer}</code>

[Upstream docs ↗](https://thedatadb.readme.io/reference/getformerteamsbyplayerid)

```typescript
const res = await thesportsdb.v1.lookupformerteams({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

### lookuphonours

<details>
<summary><code>GET</code> <b><code>thesportsdb.v1.lookuphonours</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v1/json/{apiKey}/lookuphonours.php?id={idPlayer}</code>

[Upstream docs ↗](https://thedatadb.readme.io/reference/gethonourbyid)

```typescript
const res = await thesportsdb.v1.lookuphonours({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

### lookupLineup

<details>
<summary><code>GET</code> <b><code>thesportsdb.v1.lookupLineup</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v1/json/{apiKey}/lookuplineup.php{query}</code>

[Upstream docs ↗](https://www.thesportsdb.com/docs_api_guide#v1-lookup)

```typescript
const res = await thesportsdb.v1.lookupLineup({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

### lookupmilestones

<details>
<summary><code>GET</code> <b><code>thesportsdb.v1.lookupmilestones</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v1/json/{apiKey}/lookupmilestones.php?id={idPlayer}</code>

[Upstream docs ↗](https://thedatadb.readme.io/reference/getmilestonesbyplayerid)

```typescript
const res = await thesportsdb.v1.lookupmilestones({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

### lookupplayer

<details>
<summary><code>GET</code> <b><code>thesportsdb.v1.lookupplayer</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v1/json/{apiKey}/lookupplayer.php?id={idPlayer}</code>

[Upstream docs ↗](https://thedatadb.readme.io/reference/getplayerbyid)

```typescript
const res = await thesportsdb.v1.lookupplayer({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

### lookupplayerstats

<details>
<summary><code>GET</code> <b><code>thesportsdb.v1.lookupplayerstats</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v1/json/{apiKey}/lookupplayerstats.php?id={idPlayer}</code>

[Upstream docs ↗](https://www.thesportsdb.com/docs_api_guide)

```typescript
const res = await thesportsdb.v1.lookupplayerstats({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

### lookupTimeline

<details>
<summary><code>GET</code> <b><code>thesportsdb.v1.lookupTimeline</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v1/json/{apiKey}/lookuptimeline.php{query}</code>

[Upstream docs ↗](https://www.thesportsdb.com/docs_api_guide#v1-lookup)

```typescript
const res = await thesportsdb.v1.lookupTimeline({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

### lookupTv

<details>
<summary><code>GET</code> <b><code>thesportsdb.v1.lookupTv</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v1/json/{apiKey}/lookuptv.php{query}</code>

[Upstream docs ↗](https://www.thesportsdb.com/docs_api_guide#v1-lookup)

```typescript
const res = await thesportsdb.v1.lookupTv({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

### playerresults

<details>
<summary><code>GET</code> <b><code>thesportsdb.v1.playerresults</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v1/json/{apiKey}/playerresults.php?id={idPlayer}</code>

[Upstream docs ↗](https://www.thesportsdb.com/docs_api_guide)

```typescript
const res = await thesportsdb.v1.playerresults({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

### schedule

<details>
<summary><code>GET</code> <b><code>thesportsdb.v2.schedule.full.team</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v2/json/schedule/full/team/{idTeam}</code>

[Upstream docs ↗](https://www.thesportsdb.com/docs_api_guide#v2-schedule)

```typescript
const res = await thesportsdb.v2.schedule.full.team({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

<details>
<summary><code>GET</code> <b><code>thesportsdb.v2.schedule.league</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v2/json/schedule/league/{idLeague}/{season}</code>

[Upstream docs ↗](https://www.thesportsdb.com/docs_api_guide#v2-schedule)

```typescript
const res = await thesportsdb.v2.schedule.league({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

<details>
<summary><code>GET</code> <b><code>thesportsdb.v2.schedule.next.league</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v2/json/schedule/next/league/{idLeague}</code>

[Upstream docs ↗](https://www.thesportsdb.com/docs_api_guide#v2-schedule)

```typescript
const res = await thesportsdb.v2.schedule.next.league({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

<details>
<summary><code>GET</code> <b><code>thesportsdb.v2.schedule.next.team</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v2/json/schedule/next/team/{idTeam}</code>

[Upstream docs ↗](https://www.thesportsdb.com/docs_api_guide#v2-schedule)

```typescript
const res = await thesportsdb.v2.schedule.next.team({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

<details>
<summary><code>GET</code> <b><code>thesportsdb.v2.schedule.next.venue</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v2/json/schedule/next/venue/{idVenue}</code>

[Upstream docs ↗](https://www.thesportsdb.com/docs_api_guide#v2-schedule)

```typescript
const res = await thesportsdb.v2.schedule.next.venue({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

<details>
<summary><code>GET</code> <b><code>thesportsdb.v2.schedule.previous.league</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v2/json/schedule/previous/league/{idLeague}</code>

[Upstream docs ↗](https://www.thesportsdb.com/docs_api_guide#v2-schedule)

```typescript
const res = await thesportsdb.v2.schedule.previous.league({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

<details>
<summary><code>GET</code> <b><code>thesportsdb.v2.schedule.previous.team</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v2/json/schedule/previous/team/{idTeam}</code>

[Upstream docs ↗](https://www.thesportsdb.com/docs_api_guide#v2-schedule)

```typescript
const res = await thesportsdb.v2.schedule.previous.team({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

<details>
<summary><code>GET</code> <b><code>thesportsdb.v2.schedule.previous.venue</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v2/json/schedule/previous/venue/{idVenue}</code>

[Upstream docs ↗](https://www.thesportsdb.com/docs_api_guide#v2-schedule)

```typescript
const res = await thesportsdb.v2.schedule.previous.venue({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

### searchAllLeagues

<details>
<summary><code>GET</code> <b><code>thesportsdb.v1.searchAllLeagues</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v1/json/{apiKey}/search_all_leagues.php{query}</code>

[Upstream docs ↗](https://www.thesportsdb.com/docs_api_guide#v1-list)

```typescript
const res = await thesportsdb.v1.searchAllLeagues({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

### searchAllSeasons

<details>
<summary><code>GET</code> <b><code>thesportsdb.v1.searchAllSeasons</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v1/json/{apiKey}/search_all_seasons.php{query}</code>

[Upstream docs ↗](https://www.thesportsdb.com/docs_api_guide#v1-list)

```typescript
const res = await thesportsdb.v1.searchAllSeasons({ /* ... */ });
```

Source: [`packages/provider/thesportsdb/src/thesportsdb.ts`](src/thesportsdb.ts)

</details>

### searchAllTeams

<details>
<summary><code>GET</code> <b><code>thesportsdb.v1.searchAllTeams</code></b></summary>

<code>GET https://www.thesportsdb.com/api/v1/json/{apiKey}/search_all_teams.php{query}</code>

[Upstream docs ↗](https://www.thesportsdb.com/docs_api_guide#v1-list)

```typescript
const res = await thesportsdb.v1.searchAllTeams({ /* ... */ });
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
