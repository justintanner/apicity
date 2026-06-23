import { describe, expect, it } from "vitest";

import {
  createTheSportsDB,
  TheSportsDBSearchEventsRequestSchema,
  TheSportsDBSearchFilenameRequestSchema,
  TheSportsDBSearchPlayersRequestSchema,
  TheSportsDBSearchTeamsRequestSchema,
  TheSportsDBSearchVenuesRequestSchema,
  type TheSportsDBEventsResponse,
  type TheSportsDBFilenameSearchResponse,
  type TheSportsDBPlayersResponse,
  type TheSportsDBTeamsResponse,
  type TheSportsDBVenuesResponse,
} from "@apicity/thesportsdb";

interface CapturedFetchCall {
  url: string;
  init?: RequestInit;
}

function inputUrl(input: Parameters<typeof fetch>[0]): string {
  if (typeof input === "string") {
    return input;
  }
  if (input instanceof URL) {
    return input.toString();
  }
  return input.url;
}

function createJsonFetch(
  calls: CapturedFetchCall[],
  body: unknown,
  status = 200
): typeof fetch {
  return async (input, init) => {
    calls.push({ url: inputUrl(input), init });
    return new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    });
  };
}

function createTextFetch(
  calls: CapturedFetchCall[],
  body: string,
  status: number
): typeof fetch {
  return async (input, init) => {
    calls.push({ url: inputUrl(input), init });
    return new Response(body, { status });
  };
}

describe("thesportsdb V1 search provider", () => {
  it("builds team search queries with the default key and encoded spaces", async () => {
    const calls: CapturedFetchCall[] = [];
    const provider = createTheSportsDB({
      fetch: createJsonFetch(calls, {
        teams: [
          {
            idTeam: "133738",
            strTeam: "Real Madrid",
            strTeamBadge: "https://r2.thesportsdb.com/team/badge.png",
          },
        ],
      }),
    });

    const result: TheSportsDBTeamsResponse = await provider.v1.searchTeams({
      team: "Real Madrid",
    });

    expect(result.teams?.[0]).toEqual(
      expect.objectContaining({
        idTeam: "133738",
        strTeam: "Real Madrid",
      })
    );
    expect(calls[0].url).toBe(
      "https://www.thesportsdb.com/api/v1/json/123/searchteams.php?t=Real+Madrid"
    );
    expect(calls[0].init?.method).toBe("GET");
    expect(provider.v1.searchTeams.schema).toBe(
      TheSportsDBSearchTeamsRequestSchema
    );
  });

  it("sends event search optional filters and preserves underscores", async () => {
    const calls: CapturedFetchCall[] = [];
    const provider = createTheSportsDB({
      fetch: createJsonFetch(calls, {
        event: [
          {
            idEvent: "480006",
            strEvent: "Arsenal vs Chelsea",
            strFilename: "English Premier League 2015-04-26 Arsenal vs Chelsea",
          },
        ],
      }),
    });

    const result: TheSportsDBEventsResponse = await provider.v1.searchEvents({
      event: "Arsenal_vs_Chelsea",
      season: "2016-2017",
      date: "2015-04-26",
      filename: "English_Premier_League_2015-04-26_Arsenal_vs_Chelsea",
    });

    expect(result.event?.[0]).toEqual(
      expect.objectContaining({
        idEvent: "480006",
        strEvent: "Arsenal vs Chelsea",
      })
    );
    expect(calls[0].url).toBe(
      "https://www.thesportsdb.com/api/v1/json/123/searchevents.php?e=Arsenal_vs_Chelsea&s=2016-2017&d=2015-04-26&f=English_Premier_League_2015-04-26_Arsenal_vs_Chelsea"
    );
    expect(provider.v1.searchEvents.schema).toBe(
      TheSportsDBSearchEventsRequestSchema
    );
  });

  it("supports filename search filters and apiKey path overrides", async () => {
    const calls: CapturedFetchCall[] = [];
    const provider = createTheSportsDB({
      apiKey: "paid key",
      baseURL: "https://example.test/api/v1/json/",
      fetch: createJsonFetch(calls, {
        event: [{ idEvent: "480006", strSeason: "2014-2015" }],
      }),
    });

    const result: TheSportsDBFilenameSearchResponse =
      await provider.get.v1.searchFilename({
        filename: "English_Premier_League_2015-04-26_Arsenal_vs_Chelsea",
        season: "2016-2017",
      });

    expect(result.event?.[0]).toEqual(
      expect.objectContaining({ idEvent: "480006" })
    );
    expect(calls[0].url).toBe(
      "https://example.test/api/v1/json/paid%20key/searchfilename.php?e=English_Premier_League_2015-04-26_Arsenal_vs_Chelsea&s=2016-2017"
    );
    expect(provider.get.v1.searchFilename.schema).toBe(
      TheSportsDBSearchFilenameRequestSchema
    );
  });

  it("preserves null player wrappers for no-result searches", async () => {
    const calls: CapturedFetchCall[] = [];
    const provider = createTheSportsDB({
      fetch: createJsonFetch(calls, { player: null }),
    });

    const result: TheSportsDBPlayersResponse = await provider.v1.searchPlayers({
      player: "Missing Player",
    });

    expect(result.player).toBeNull();
    expect(calls[0].url).toBe(
      "https://www.thesportsdb.com/api/v1/json/123/searchplayers.php?p=Missing+Player"
    );
  });

  it("returns venue search wrappers with sparse nullable fields", async () => {
    const calls: CapturedFetchCall[] = [];
    const provider = createTheSportsDB({
      fetch: createJsonFetch(calls, {
        venues: [
          {
            idVenue: "23604",
            strVenue: "Wembley Centre of Excellence",
            strThumb: null,
            strWebsite: null,
          },
        ],
      }),
    });

    const result: TheSportsDBVenuesResponse =
      await provider.get.v1.searchVenues({
        venue: "Wembley",
      });

    expect(result.venues?.[0]).toEqual(
      expect.objectContaining({
        strVenue: "Wembley Centre of Excellence",
        strThumb: null,
      })
    );
    expect(calls[0].url).toBe(
      "https://www.thesportsdb.com/api/v1/json/123/searchvenues.php?v=Wembley"
    );
    expect(provider.v1.searchVenues.schema).toBe(
      TheSportsDBSearchVenuesRequestSchema
    );
  });

  it("parses JSON error bodies for search endpoints", async () => {
    const provider = createTheSportsDB({
      fetch: createJsonFetch([], { error: { message: "bad key" } }, 403),
    });

    await expect(
      provider.v1.searchPlayers({ player: "Danny Welbeck" })
    ).rejects.toMatchObject({
      name: "TheSportsDBError",
      status: 403,
      body: { error: { message: "bad key" } },
      message: "TheSportsDB API error 403: bad key",
    });
  });

  it("preserves non-JSON error bodies for search endpoints", async () => {
    const provider = createTheSportsDB({
      fetch: createTextFetch([], "<html>unavailable</html>", 503),
    });

    await expect(
      provider.v1.searchVenues({ venue: "Wembley" })
    ).rejects.toMatchObject({
      status: 503,
      body: "<html>unavailable</html>",
      message: "TheSportsDB API error 503: <html>unavailable</html>",
    });
  });

  it("exports request schemas for the search slice", () => {
    expect(
      TheSportsDBSearchEventsRequestSchema.safeParse({
        event: "Arsenal_vs_Chelsea",
        season: "2016-2017",
        date: "2015-04-26",
        filename: "English_Premier_League_2015-04-26_Arsenal_vs_Chelsea",
      }).success
    ).toBe(true);
    expect(
      TheSportsDBSearchFilenameRequestSchema.safeParse({
        filename: "English_Premier_League_2015-04-26_Arsenal_vs_Chelsea",
      }).success
    ).toBe(true);
    expect(
      TheSportsDBSearchPlayersRequestSchema.safeParse({
        player: "Danny Welbeck",
      }).success
    ).toBe(true);
    expect(
      TheSportsDBSearchTeamsRequestSchema.safeParse({ team: "" }).success
    ).toBe(false);
  });
});
