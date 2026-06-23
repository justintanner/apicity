# @apicity/openf1

[![npm](https://img.shields.io/npm/v/@apicity/openf1?color=cb0000)](https://www.npmjs.com/package/@apicity/openf1)
[![dependencies](https://img.shields.io/badge/dependencies-1-blue)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)
[![docs](https://img.shields.io/badge/docs-openf1.org-blue)](https://openf1.org/docs/)

OpenF1 API provider for Formula 1 historical and authenticated live REST data.

Runtime dependencies:

- `zod@^3.24.0` — request schemas attached to OpenF1 endpoint methods as `.schema`

## Installation

```bash
npm install @apicity/openf1
# or
pnpm add @apicity/openf1
```

## Quick Start

```typescript
import { createOpenF1 } from "@apicity/openf1";

const openf1 = createOpenF1();
```

## REST Examples

OpenF1 historical REST data is public and does not require an API key.

```typescript
import { createOpenF1 } from "@apicity/openf1";

const openf1 = createOpenF1();

const meetings = await openf1.v1.meetings({
  year: 2024,
  country_name: ["Singapore", "Monaco"],
});

const recentMeetings = await openf1.v1.meetings({
  filters: [
    { field: "date_start", op: ">=", value: "2024-01-01T00:00:00Z" },
  ],
});
```

Use arrays for repeated equality filters and `filters` for OpenF1
comparison operators such as `>=`, `<`, and `>`.

## Authenticated REST

OpenF1 live REST access uses the same `/v1/{collection}` endpoints with
a Bearer token. See the [OpenF1 auth guide](https://openf1.org/auth.html)
for the upstream token contract.

```typescript
import { createOpenF1 } from "@apicity/openf1";

const openf1 = createOpenF1();

const token = await openf1.token({
  username: "driver@example.com",
  password: "placeholder-password",
});

const liveOpenF1 = createOpenF1({
  accessToken: token.access_token,
});

const liveSessions = await liveOpenF1.v1.sessions({
  session_key: "latest",
});
```

For refreshable tokens, provide a `tokenProvider`. The provider is called
for REST reads and this package does not store credentials or tokens
outside the client instance.

```typescript
const openf1 = createOpenF1({
  tokenProvider: async () => {
    const token = await fetchTokenSomewhereElse();
    return token.access_token;
  },
});
```

## API Reference

13 endpoints across 13 groups. Each method mirrors an upstream URL path.

### championshipDrivers

<details>
<summary><code>GET</code> <b><code>openf1.v1.championshipDrivers</code></b></summary>

<code>GET https://api.openf1.org/v1/championship_drivers{query}</code>

[Upstream docs ↗](https://openf1.org/docs/#drivers-championship-beta)

```typescript
const res = await openf1.v1.championshipDrivers({ /* ... */ });
```

Source: [`packages/provider/openf1/src/openf1.ts`](src/openf1.ts)

</details>

### intervals

<details>
<summary><code>GET</code> <b><code>openf1.v1.intervals</code></b></summary>

<code>GET https://api.openf1.org/v1/intervals{query}</code>

[Upstream docs ↗](https://openf1.org/docs/#intervals)

```typescript
const res = await openf1.v1.intervals({ /* ... */ });
```

Source: [`packages/provider/openf1/src/openf1.ts`](src/openf1.ts)

</details>

### laps

<details>
<summary><code>GET</code> <b><code>openf1.v1.laps</code></b></summary>

<code>GET https://api.openf1.org/v1/laps{query}</code>

[Upstream docs ↗](https://openf1.org/docs/#laps)

```typescript
const res = await openf1.v1.laps({ /* ... */ });
```

Source: [`packages/provider/openf1/src/openf1.ts`](src/openf1.ts)

</details>

### meetings

<details>
<summary><code>GET</code> <b><code>openf1.v1.meetings</code></b></summary>

<code>GET https://api.openf1.org/v1/meetings{query}</code>

[Upstream docs ↗](https://openf1.org/docs/#meetings)

```typescript
const res = await openf1.v1.meetings({ /* ... */ });
```

Source: [`packages/provider/openf1/src/openf1.ts`](src/openf1.ts)

</details>

### pit

<details>
<summary><code>GET</code> <b><code>openf1.v1.pit</code></b></summary>

<code>GET https://api.openf1.org/v1/pit{query}</code>

[Upstream docs ↗](https://openf1.org/docs/#pit)

```typescript
const res = await openf1.v1.pit({ /* ... */ });
```

Source: [`packages/provider/openf1/src/openf1.ts`](src/openf1.ts)

</details>

### position

<details>
<summary><code>GET</code> <b><code>openf1.v1.position</code></b></summary>

<code>GET https://api.openf1.org/v1/position{query}</code>

[Upstream docs ↗](https://openf1.org/docs/#position)

```typescript
const res = await openf1.v1.position({ /* ... */ });
```

Source: [`packages/provider/openf1/src/openf1.ts`](src/openf1.ts)

</details>

### raceControl

<details>
<summary><code>GET</code> <b><code>openf1.v1.raceControl</code></b></summary>

<code>GET https://api.openf1.org/v1/race_control{query}</code>

[Upstream docs ↗](https://openf1.org/docs/#race-control)

```typescript
const res = await openf1.v1.raceControl({ /* ... */ });
```

Source: [`packages/provider/openf1/src/openf1.ts`](src/openf1.ts)

</details>

### sessionResult

<details>
<summary><code>GET</code> <b><code>openf1.v1.sessionResult</code></b></summary>

<code>GET https://api.openf1.org/v1/session_result{query}</code>

[Upstream docs ↗](https://openf1.org/docs/#session-result)

```typescript
const res = await openf1.v1.sessionResult({ /* ... */ });
```

Source: [`packages/provider/openf1/src/openf1.ts`](src/openf1.ts)

</details>

### sessions

<details>
<summary><code>GET</code> <b><code>openf1.v1.sessions</code></b></summary>

<code>GET https://api.openf1.org/v1/sessions{query}</code>

[Upstream docs ↗](https://openf1.org/docs/#sessions)

```typescript
const res = await openf1.v1.sessions({ /* ... */ });
```

Source: [`packages/provider/openf1/src/openf1.ts`](src/openf1.ts)

</details>

### stints

<details>
<summary><code>GET</code> <b><code>openf1.v1.stints</code></b></summary>

<code>GET https://api.openf1.org/v1/stints{query}</code>

[Upstream docs ↗](https://openf1.org/docs/#stints)

```typescript
const res = await openf1.v1.stints({ /* ... */ });
```

Source: [`packages/provider/openf1/src/openf1.ts`](src/openf1.ts)

</details>

### teamRadio

<details>
<summary><code>GET</code> <b><code>openf1.v1.teamRadio</code></b></summary>

<code>GET https://api.openf1.org/v1/team_radio{query}</code>

[Upstream docs ↗](https://openf1.org/docs/#team-radio)

```typescript
const res = await openf1.v1.teamRadio({ /* ... */ });
```

Source: [`packages/provider/openf1/src/openf1.ts`](src/openf1.ts)

</details>

### token

<details>
<summary><code>POST</code> <b><code>openf1.token</code></b></summary>

<code>POST https://api.openf1.org/token</code>

[Upstream docs ↗](https://openf1.org/auth.html)

```typescript
const token = await openf1.token({
  username: "driver@example.com",
  password: "placeholder-password",
});
```

Source: [`packages/provider/openf1/src/openf1.ts`](src/openf1.ts)

</details>

### weather

<details>
<summary><code>GET</code> <b><code>openf1.v1.weather</code></b></summary>

<code>GET https://api.openf1.org/v1/weather{query}</code>

[Upstream docs ↗](https://openf1.org/docs/#weather)

```typescript
const res = await openf1.v1.weather({ /* ... */ });
```

Source: [`packages/provider/openf1/src/openf1.ts`](src/openf1.ts)

</details>

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
