# @apicity/openf1

[![npm](https://img.shields.io/npm/v/@apicity/openf1?color=cb0000)](https://www.npmjs.com/package/@apicity/openf1)
[![dependencies](https://img.shields.io/badge/dependencies-1-blue)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)
[![docs](https://img.shields.io/badge/docs-openf1.org-blue)](https://openf1.org/docs/)

OpenF1 API provider for public Formula 1 historical data.

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

## Historical Data Examples

OpenF1 historical REST data is public and does not require an API key.
The paid live surfaces are intentionally outside this package.

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

## API Reference

3 endpoints across 3 groups. Each method mirrors an upstream URL path.

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

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
