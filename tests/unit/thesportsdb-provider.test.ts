import { describe, expect, it, vi } from "vitest";

import {
  createTheSportsDB,
  TheSportsDBError,
  TheSportsDBEquipmentLookupRequestSchema,
  TheSportsDBLeagueLookupRequestSchema,
  TheSportsDBTableLookupRequestSchema,
} from "../../packages/provider/thesportsdb/src";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
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
});
