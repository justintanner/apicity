import { describe, expect, it, vi } from "vitest";

import {
  createTheSportsDB,
  TheSportsDBError,
  TheSportsDBEquipmentLookupRequestSchema,
  TheSportsDBLeagueLookupRequestSchema,
  TheSportsDBTableLookupRequestSchema,
  TheSportsDBV2EventLookupRequestSchema,
  TheSportsDBV2LeagueLookupRequestSchema,
  TheSportsDBV2PlayerLookupRequestSchema,
  TheSportsDBV2TeamLookupRequestSchema,
  TheSportsDBV2VenueLookupRequestSchema,
  type TheSportsDBProvider,
} from "../../packages/provider/thesportsdb/src";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

interface V2LookupCase {
  name: string;
  run: (provider: TheSportsDBProvider) => Promise<unknown>;
  expectedUrl: string;
}

interface EndpointExample {
  source: string;
  payload: unknown;
}

function requestHeaders(init: RequestInit | undefined): Record<string, string> {
  return init?.headers as Record<string, string>;
}

function endpointExample(fn: unknown): EndpointExample | undefined {
  return (fn as { example?: EndpointExample }).example;
}

describe("thesportsdb provider", () => {
  it("exposes V1 lookup methods and schemas", () => {
    const thesportsdb = createTheSportsDB();

    expect(thesportsdb.v1.lookup.league).toBeInstanceOf(Function);
    expect(thesportsdb.v1.lookup.table).toBeInstanceOf(Function);
    expect(thesportsdb.v1.lookup.team).toBeInstanceOf(Function);
    expect(thesportsdb.v1.lookup.equipment).toBeInstanceOf(Function);
    expect(thesportsdb.v1.lookup.venue).toBeInstanceOf(Function);
    expect(
      thesportsdb.v1.lookup.league.schema.safeParse({ idLeague: 4328 }).success
    ).toBe(true);
    expect(
      thesportsdb.v1.lookup.table.schema.safeParse({
        idLeague: "4328",
        season: "2020-2021",
      }).success
    ).toBe(true);
  });

  it("attaches representative V1 and V2 endpoint examples", () => {
    const thesportsdb = createTheSportsDB();

    expect(endpointExample(thesportsdb.v1.searchTeams)).toMatchObject({
      source: "static:thesportsdb-v1-free-search",
      payload: { team: "Arsenal" },
    });
    expect(endpointExample(thesportsdb.v1.eventstv)).toMatchObject({
      source: "static:thesportsdb-v1-premium-tv-filter",
      payload: { channel: "Peacock_Premium" },
    });
    expect(endpointExample(thesportsdb.v2.search.team)).toMatchObject({
      source: "static:thesportsdb-v2-premium-search",
      payload: { teamName: "Manchester United" },
    });
    expect(endpointExample(thesportsdb.v2.schedule.next.league)).toMatchObject({
      source: "static:thesportsdb-v2-premium-schedule",
      payload: { idLeague: 4328 },
    });
  });

  it("validates integer and string IDs", () => {
    expect(
      TheSportsDBLeagueLookupRequestSchema.safeParse({ idLeague: 4328 }).success
    ).toBe(true);
    expect(
      TheSportsDBEquipmentLookupRequestSchema.safeParse({ idTeam: "133597" })
        .success
    ).toBe(true);
    expect(
      TheSportsDBTableLookupRequestSchema.safeParse({
        idLeague: "4328",
        season: "",
      }).success
    ).toBe(false);
    expect(
      TheSportsDBLeagueLookupRequestSchema.safeParse({ idLeague: "" }).success
    ).toBe(false);
  });

  it("constructs required ID queries with the default free V1 key", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () =>
      jsonResponse({
        leagues: [
          {
            idLeague: "4328",
            strLeague: "English Premier League",
            strSport: "Soccer",
            strCountry: "England",
            strBadge:
              "https://r2.thesportsdb.com/images/media/league/badge.png",
          },
        ],
      })
    );
    const thesportsdb = createTheSportsDB({ fetch });

    const result = await thesportsdb.v1.lookup.league({ idLeague: 4328 });

    expect(result.leagues?.[0]?.strLeague).toBe("English Premier League");
    expect(String(fetch.mock.calls[0][0])).toBe(
      "https://www.thesportsdb.com/api/v1/json/123/lookupleague.php?id=4328"
    );
    expect(fetch.mock.calls[0][1]?.method).toBe("GET");
  });

  it("uses apiKey overrides in the V1 path segment", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () =>
      jsonResponse({
        teams: [
          {
            idTeam: "133604",
            strTeam: "Arsenal",
            idLeague: "4328",
            strLeague: "English Premier League",
            strSport: "Soccer",
            strCountry: "England",
          },
        ],
      })
    );
    const thesportsdb = createTheSportsDB({
      apiKey: "premium-key",
      fetch,
    });

    const result = await thesportsdb.v1.lookup.team({ idTeam: "133604" });

    expect(result.teams?.[0]?.strTeam).toBe("Arsenal");
    expect(String(fetch.mock.calls[0][0])).toBe(
      "https://www.thesportsdb.com/api/v1/json/premium-key/lookupteam.php?id=133604"
    );
  });

  it("constructs table lookups with optional season", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () =>
      jsonResponse({
        table: [
          {
            idTeam: "133604",
            strTeam: "Arsenal",
            intRank: "1",
            intPoints: "90",
          },
        ],
      })
    );
    const thesportsdb = createTheSportsDB({ fetch });

    const result = await thesportsdb.v1.lookup.table({
      idLeague: 4328,
      season: "2020-2021",
    });

    expect(result.table?.[0]?.strTeam).toBe("Arsenal");
    expect(String(fetch.mock.calls[0][0])).toBe(
      "https://www.thesportsdb.com/api/v1/json/123/lookuptable.php?l=4328&s=2020-2021"
    );
  });

  it("preserves null and empty lookup wrappers", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async (url) => {
      if (String(url).includes("lookupequipment.php")) {
        return jsonResponse({ equipment: [] });
      }
      return jsonResponse({ venues: null });
    });
    const thesportsdb = createTheSportsDB({ fetch });

    const equipment = await thesportsdb.v1.lookup.equipment({
      idTeam: 133597,
    });
    const venue = await thesportsdb.v1.lookup.venue({ idVenue: 16163 });

    expect(equipment.equipment).toEqual([]);
    expect(venue.venues).toBeNull();
    expect(String(fetch.mock.calls[0][0])).toBe(
      "https://www.thesportsdb.com/api/v1/json/123/lookupequipment.php?id=133597"
    );
    expect(String(fetch.mock.calls[1][0])).toBe(
      "https://www.thesportsdb.com/api/v1/json/123/lookupvenue.php?id=16163"
    );
  });

  it("throws TheSportsDBError for JSON and non-JSON HTTP errors", async () => {
    const jsonErrorProvider = createTheSportsDB({
      fetch: async () => jsonResponse({ message: "Rate limited" }, 429),
    });
    await expect(
      jsonErrorProvider.v1.lookup.league({ idLeague: 4328 })
    ).rejects.toMatchObject({
      name: "TheSportsDBError",
      status: 429,
      body: { message: "Rate limited" },
    });

    const textErrorProvider = createTheSportsDB({
      fetch: async () => new Response("upstream unavailable", { status: 503 }),
    });
    await expect(
      textErrorProvider.v1.lookup.team({ idTeam: 133604 })
    ).rejects.toBeInstanceOf(TheSportsDBError);
  });

  it("exposes V2 lookup methods and integer path schemas", () => {
    const thesportsdb = createTheSportsDB();

    expect(thesportsdb.v2.lookup.league).toBeInstanceOf(Function);
    expect(thesportsdb.v2.lookup.team).toBeInstanceOf(Function);
    expect(thesportsdb.v2.lookup.teamEquipment).toBeInstanceOf(Function);
    expect(thesportsdb.v2.lookup.player).toBeInstanceOf(Function);
    expect(thesportsdb.v2.lookup.playerContracts).toBeInstanceOf(Function);
    expect(thesportsdb.v2.lookup.playerResults).toBeInstanceOf(Function);
    expect(thesportsdb.v2.lookup.playerHonours).toBeInstanceOf(Function);
    expect(thesportsdb.v2.lookup.playerMilestones).toBeInstanceOf(Function);
    expect(thesportsdb.v2.lookup.playerTeams).toBeInstanceOf(Function);
    expect(thesportsdb.v2.lookup.playerStats).toBeInstanceOf(Function);
    expect(thesportsdb.v2.lookup.event).toBeInstanceOf(Function);
    expect(thesportsdb.v2.lookup.eventLineup).toBeInstanceOf(Function);
    expect(thesportsdb.v2.lookup.eventResults).toBeInstanceOf(Function);
    expect(thesportsdb.v2.lookup.eventStats).toBeInstanceOf(Function);
    expect(thesportsdb.v2.lookup.eventTimeline).toBeInstanceOf(Function);
    expect(thesportsdb.v2.lookup.eventTv).toBeInstanceOf(Function);
    expect(thesportsdb.v2.lookup.eventHighlights).toBeInstanceOf(Function);
    expect(thesportsdb.v2.lookup.venue).toBeInstanceOf(Function);
    expect(
      TheSportsDBV2LeagueLookupRequestSchema.safeParse({ idLeague: 4328 })
        .success
    ).toBe(true);
    expect(
      TheSportsDBV2TeamLookupRequestSchema.safeParse({ idTeam: "133597" })
        .success
    ).toBe(true);
    expect(
      TheSportsDBV2PlayerLookupRequestSchema.safeParse({
        idPlayer: "34146304",
      }).success
    ).toBe(true);
    expect(
      TheSportsDBV2EventLookupRequestSchema.safeParse({ idEvent: 1937584 })
        .success
    ).toBe(true);
    expect(
      TheSportsDBV2VenueLookupRequestSchema.safeParse({ idVenue: 15910 })
        .success
    ).toBe(true);
    expect(
      TheSportsDBV2PlayerLookupRequestSchema.safeParse({
        idPlayer: "not-an-int",
      }).success
    ).toBe(false);
    expect(
      TheSportsDBV2EventLookupRequestSchema.safeParse({ idEvent: 1.5 }).success
    ).toBe(false);
  });

  it("constructs every V2 lookup path and sends X-API-KEY", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () =>
      jsonResponse({ lookup: [] })
    );
    const thesportsdb = createTheSportsDB({
      apiKey: "premium-key",
      fetch,
    });
    const cases: V2LookupCase[] = [
      {
        name: "league",
        run: (provider) => provider.v2.lookup.league({ idLeague: 4328 }),
        expectedUrl:
          "https://www.thesportsdb.com/api/v2/json/lookup/league/4328",
      },
      {
        name: "team",
        run: (provider) => provider.v2.lookup.team({ idTeam: 133597 }),
        expectedUrl:
          "https://www.thesportsdb.com/api/v2/json/lookup/team/133597",
      },
      {
        name: "team equipment",
        run: (provider) => provider.v2.lookup.teamEquipment({ idTeam: 133597 }),
        expectedUrl:
          "https://www.thesportsdb.com/api/v2/json/lookup/team_equipment/133597",
      },
      {
        name: "player",
        run: (provider) => provider.v2.lookup.player({ idPlayer: 34172575 }),
        expectedUrl:
          "https://www.thesportsdb.com/api/v2/json/lookup/player/34172575",
      },
      {
        name: "player contracts",
        run: (provider) =>
          provider.v2.lookup.playerContracts({ idPlayer: 34146304 }),
        expectedUrl:
          "https://www.thesportsdb.com/api/v2/json/lookup/player_contracts/34146304",
      },
      {
        name: "player results",
        run: (provider) =>
          provider.v2.lookup.playerResults({ idPlayer: 34160573 }),
        expectedUrl:
          "https://www.thesportsdb.com/api/v2/json/lookup/player_results/34160573",
      },
      {
        name: "player honours",
        run: (provider) =>
          provider.v2.lookup.playerHonours({ idPlayer: 34146304 }),
        expectedUrl:
          "https://www.thesportsdb.com/api/v2/json/lookup/player_honours/34146304",
      },
      {
        name: "player milestones",
        run: (provider) =>
          provider.v2.lookup.playerMilestones({ idPlayer: 34146304 }),
        expectedUrl:
          "https://www.thesportsdb.com/api/v2/json/lookup/player_milestones/34146304",
      },
      {
        name: "player teams",
        run: (provider) =>
          provider.v2.lookup.playerTeams({ idPlayer: 34146304 }),
        expectedUrl:
          "https://www.thesportsdb.com/api/v2/json/lookup/player_teams/34146304",
      },
      {
        name: "player stats",
        run: (provider) =>
          provider.v2.lookup.playerStats({ idPlayer: 34146304 }),
        expectedUrl:
          "https://www.thesportsdb.com/api/v2/json/lookup/player_stats/34146304",
      },
      {
        name: "event",
        run: (provider) => provider.v2.lookup.event({ idEvent: 441613 }),
        expectedUrl:
          "https://www.thesportsdb.com/api/v2/json/lookup/event/441613",
      },
      {
        name: "event lineup",
        run: (provider) => provider.v2.lookup.eventLineup({ idEvent: 1937584 }),
        expectedUrl:
          "https://www.thesportsdb.com/api/v2/json/lookup/event_lineup/1937584",
      },
      {
        name: "event results",
        run: (provider) => provider.v2.lookup.eventResults({ idEvent: 652890 }),
        expectedUrl:
          "https://www.thesportsdb.com/api/v2/json/lookup/event_results/652890",
      },
      {
        name: "event stats",
        run: (provider) => provider.v2.lookup.eventStats({ idEvent: 1937584 }),
        expectedUrl:
          "https://www.thesportsdb.com/api/v2/json/lookup/event_stats/1937584",
      },
      {
        name: "event timeline",
        run: (provider) =>
          provider.v2.lookup.eventTimeline({ idEvent: 1937584 }),
        expectedUrl:
          "https://www.thesportsdb.com/api/v2/json/lookup/event_timeline/1937584",
      },
      {
        name: "event tv",
        run: (provider) => provider.v2.lookup.eventTv({ idEvent: 584911 }),
        expectedUrl:
          "https://www.thesportsdb.com/api/v2/json/lookup/event_tv/584911",
      },
      {
        name: "event highlights",
        run: (provider) =>
          provider.v2.lookup.eventHighlights({ idEvent: 2044892 }),
        expectedUrl:
          "https://www.thesportsdb.com/api/v2/json/lookup/event_highlights/2044892",
      },
      {
        name: "venue",
        run: (provider) => provider.v2.lookup.venue({ idVenue: 15910 }),
        expectedUrl:
          "https://www.thesportsdb.com/api/v2/json/lookup/venue/15910",
      },
    ];

    for (const [index, c] of cases.entries()) {
      await c.run(thesportsdb);
      expect(String(fetch.mock.calls[index][0]), c.name).toBe(c.expectedUrl);
      expect(requestHeaders(fetch.mock.calls[index][1])["X-API-KEY"]).toBe(
        "premium-key"
      );
      expect(fetch.mock.calls[index][1]?.method).toBe("GET");
    }
  });

  it("preserves V2 lookup wrappers for representative results", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async (url) => {
      const requestUrl = String(url);
      if (requestUrl.includes("/lookup/player/")) {
        return jsonResponse({
          lookup: [
            {
              idPlayer: "34172575",
              strPlayer: "Junior Messias",
              strPosition: "Forward",
            },
          ],
        });
      }
      if (requestUrl.includes("/lookup/event_lineup/")) {
        return jsonResponse({
          lookup: [
            {
              idLineup: "438003",
              idEvent: "1937584",
              strPosition: "Goalkeeper",
            },
          ],
        });
      }
      return jsonResponse({ lookup: [] });
    });
    const thesportsdb = createTheSportsDB({ apiKey: "premium-key", fetch });

    const player = await thesportsdb.get.v2.lookup.player({
      idPlayer: 34172575,
    });
    const lineup = await thesportsdb.v2.lookup.eventLineup({
      idEvent: 1937584,
    });

    expect(player.lookup?.[0]).toEqual(
      expect.objectContaining({
        idPlayer: "34172575",
        strPlayer: "Junior Messias",
      })
    );
    expect(lineup.lookup?.[0]).toEqual(
      expect.objectContaining({
        idLineup: "438003",
        strPosition: "Goalkeeper",
      })
    );
  });

  it("preserves V2 null and empty lookup wrappers", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async (url) => {
      if (String(url).includes("/lookup/team_equipment/")) {
        return jsonResponse({ lookup: [] });
      }
      return jsonResponse({ lookup: null });
    });
    const thesportsdb = createTheSportsDB({ apiKey: "premium-key", fetch });

    const equipment = await thesportsdb.v2.lookup.teamEquipment({
      idTeam: 133597,
    });
    const venue = await thesportsdb.v2.lookup.venue({ idVenue: 15910 });

    expect(equipment.lookup).toEqual([]);
    expect(venue.lookup).toBeNull();
  });

  it("throws a local TheSportsDBError when V2 apiKey is missing", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () =>
      jsonResponse({ message: "premium key required" }, 403)
    );
    const thesportsdb = createTheSportsDB({ fetch });

    await expect(
      thesportsdb.v2.lookup.league({ idLeague: 4328 })
    ).rejects.toMatchObject({
      name: "TheSportsDBError",
      status: 401,
      body: {
        error: "TheSportsDB V2 requires apiKey for X-API-KEY authentication",
      },
      message:
        "TheSportsDB API error 401: TheSportsDB V2 requires apiKey for X-API-KEY authentication",
    });
    expect(fetch).not.toHaveBeenCalled();
  });
});
