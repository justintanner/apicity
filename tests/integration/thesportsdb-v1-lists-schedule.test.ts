import { describe, expect, it } from "vitest";

import {
  createTheSportsDB,
  TheSportsDBEventsDayRequestSchema,
  TheSportsDBEventsHighlightsRequestSchema,
  TheSportsDBEventsSeasonRequestSchema,
  TheSportsDBEventsTVRequestSchema,
  TheSportsDBLeagueEventsRequestSchema,
  TheSportsDBLookupAllPlayersRequestSchema,
  TheSportsDBSearchAllLeaguesRequestSchema,
  TheSportsDBSearchAllSeasonsRequestSchema,
  TheSportsDBSearchAllTeamsRequestSchema,
  TheSportsDBTeamEventsRequestSchema,
  type TheSportsDBEventsResponse,
  type TheSportsDBPlayersResponse,
  type TheSportsDBResultsResponse,
  type TheSportsDBSearchAllLeaguesResponse,
  type TheSportsDBSeasonsResponse,
  type TheSportsDBTeamsResponse,
  type TheSportsDBTVEventsResponse,
  type TheSportsDBTVHighlightsResponse,
} from "@apicity/thesportsdb";

interface CapturedFetchCall {
  url: string;
  init?: RequestInit;
}

interface JsonFetchResponse {
  body: unknown;
  status?: number;
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
  responses: JsonFetchResponse[]
): typeof fetch {
  let index = 0;
  return async (input, init) => {
    calls.push({ url: inputUrl(input), init });
    const response = responses[Math.min(index, responses.length - 1)];
    index += 1;
    return new Response(JSON.stringify(response.body), {
      status: response.status ?? 200,
      headers: { "content-type": "application/json" },
    });
  };
}

describe("thesportsdb V1 list, schedule, and video endpoints", () => {
  it("constructs list endpoint queries and unwraps documented wrappers", async () => {
    const calls: CapturedFetchCall[] = [];
    const provider = createTheSportsDB({
      fetch: createJsonFetch(calls, [
        {
          body: {
            countries: [
              {
                idLeague: "4328",
                strLeague: "English Premier League",
                strSport: "Soccer",
              },
            ],
          },
        },
        {
          body: {
            seasons: [
              {
                strSeason: "2024-2025",
                strBadge: "https://example.test/badge.png",
              },
            ],
          },
        },
        {
          body: {
            teams: [
              {
                idTeam: "133604",
                strTeam: "Arsenal",
                strLeague: "English Premier League",
              },
            ],
          },
        },
        {
          body: {
            player: [
              {
                idPlayer: "34145937",
                idTeam: "133604",
                strPlayer: "Danny Welbeck",
              },
            ],
          },
        },
      ]),
    });

    const leagues: TheSportsDBSearchAllLeaguesResponse =
      await provider.v1.searchAllLeagues({
        country: "England",
        sport: "Soccer",
      });
    const seasons: TheSportsDBSeasonsResponse =
      await provider.v1.searchAllSeasons({
        idLeague: 4328,
        poster: true,
        badge: 0,
      });
    const teams: TheSportsDBTeamsResponse = await provider.v1.searchAllTeams({
      sport: "Soccer",
      country: "Spain",
    });
    const players: TheSportsDBPlayersResponse =
      await provider.v1.lookupAllPlayers({ idTeam: "133604" });

    expect(leagues.countries?.[0].strLeague).toBe("English Premier League");
    expect(seasons.seasons?.[0].strSeason).toBe("2024-2025");
    expect(teams.teams?.[0].strTeam).toBe("Arsenal");
    expect(players.player?.[0].strPlayer).toBe("Danny Welbeck");
    expect(calls.map((call) => call.url)).toEqual([
      "https://www.thesportsdb.com/api/v1/json/123/search_all_leagues.php?c=England&s=Soccer",
      "https://www.thesportsdb.com/api/v1/json/123/search_all_seasons.php?id=4328&poster=1&badge=0",
      "https://www.thesportsdb.com/api/v1/json/123/search_all_teams.php?s=Soccer&c=Spain",
      "https://www.thesportsdb.com/api/v1/json/123/lookup_all_players.php?id=133604",
    ]);
    for (const call of calls) {
      expect(call.init?.method).toBe("GET");
      expect(call.url).not.toContain("undefined");
    }
  });

  it("constructs schedule endpoint queries and preserves result limits", async () => {
    const calls: CapturedFetchCall[] = [];
    const provider = createTheSportsDB({
      fetch: createJsonFetch(calls, [
        {
          body: {
            events: [{ idEvent: "1", strEvent: "Next team event" }],
          },
        },
        {
          body: {
            results: [{ idEvent: "2", strEvent: "Previous team event" }],
          },
        },
        {
          body: {
            events: [{ idEvent: "3", strEvent: "Next league event" }],
          },
        },
        {
          body: {
            events: [{ idEvent: "4", strEvent: "Past league event" }],
          },
        },
        {
          body: {
            events: [
              { idEvent: "5", strEvent: "Day event" },
              { idEvent: "6", strEvent: "Second day event" },
              { idEvent: "7", strEvent: "Third day event" },
            ],
          },
        },
        {
          body: {
            events: [
              { idEvent: "8", strEvent: "Season event" },
              { idEvent: "9", strEvent: "Second season event" },
            ],
          },
        },
      ]),
    });

    const nextTeam: TheSportsDBEventsResponse = await provider.v1.eventsnext({
      idTeam: 133602,
    });
    const lastTeam: TheSportsDBResultsResponse = await provider.v1.eventslast({
      idTeam: "133602",
    });
    const nextLeague: TheSportsDBEventsResponse =
      await provider.v1.eventsnextleague({ idLeague: 4328 });
    const pastLeague: TheSportsDBEventsResponse =
      await provider.v1.eventspastleague({ idLeague: "4328" });
    const day: TheSportsDBEventsResponse = await provider.v1.eventsday({
      date: "2014-10-10",
      sport: "Baseball",
      league: 4424,
    });
    const season: TheSportsDBEventsResponse = await provider.v1.eventsseason({
      idLeague: 4328,
      season: "2014-2015",
    });

    expect(nextTeam.events).toHaveLength(1);
    expect(lastTeam.results?.[0].strEvent).toBe("Previous team event");
    expect(nextLeague.events?.[0].strEvent).toBe("Next league event");
    expect(pastLeague.events?.[0].strEvent).toBe("Past league event");
    expect(day.events).toHaveLength(3);
    expect(season.events).toHaveLength(2);
    expect(calls.map((call) => call.url)).toEqual([
      "https://www.thesportsdb.com/api/v1/json/123/eventsnext.php?id=133602",
      "https://www.thesportsdb.com/api/v1/json/123/eventslast.php?id=133602",
      "https://www.thesportsdb.com/api/v1/json/123/eventsnextleague.php?id=4328",
      "https://www.thesportsdb.com/api/v1/json/123/eventspastleague.php?id=4328",
      "https://www.thesportsdb.com/api/v1/json/123/eventsday.php?d=2014-10-10&s=Baseball&l=4424",
      "https://www.thesportsdb.com/api/v1/json/123/eventsseason.php?id=4328&s=2014-2015",
    ]);
  });

  it("supports alternate TV and highlight filters without undefined params", async () => {
    const calls: CapturedFetchCall[] = [];
    const provider = createTheSportsDB({
      apiKey: "premium key",
      fetch: createJsonFetch(calls, [
        {
          body: {
            tvevents: [
              {
                id: "1",
                idEvent: "584911",
                strChannel: "Peacock Premium",
              },
            ],
          },
        },
        {
          body: {
            tvevents: [
              {
                id: "2",
                idChannel: "7000",
                strEvent: "Channel ID event",
              },
            ],
          },
        },
        {
          body: {
            tvhighlights: [
              {
                idEvent: "2044892",
                strEvent: "Race highlights",
                strVideo: "https://youtube.example/watch?v=abc",
              },
            ],
          },
        },
      ]),
    });

    const channel: TheSportsDBTVEventsResponse = await provider.v1.eventstv({
      channel: "Peacock_Premium",
    });
    const channelId: TheSportsDBTVEventsResponse = await provider.v1.eventstv({
      idChannel: 7000,
    });
    const highlights: TheSportsDBTVHighlightsResponse =
      await provider.v1.eventshighlights({
        date: "2024-07-07",
        idLeague: 4684,
        sport: "motorsport",
      });

    expect(channel.tvevents?.[0].strChannel).toBe("Peacock Premium");
    expect(channelId.tvevents?.[0].strEvent).toBe("Channel ID event");
    expect(highlights.tvhighlights?.[0].strVideo).toContain("youtube.example");
    expect(calls.map((call) => call.url)).toEqual([
      "https://www.thesportsdb.com/api/v1/json/premium%20key/eventstv.php?c=Peacock_Premium",
      "https://www.thesportsdb.com/api/v1/json/premium%20key/eventstv.php?id=7000",
      "https://www.thesportsdb.com/api/v1/json/premium%20key/eventshighlights.php?d=2024-07-07&l=4684&s=motorsport",
    ]);
    expect(calls.every((call) => !call.url.includes("undefined"))).toBe(true);
  });

  it("preserves null wrappers for no-result list and video responses", async () => {
    const provider = createTheSportsDB({
      fetch: createJsonFetch(
        [],
        [
          { body: { teams: null } },
          { body: { events: null } },
          { body: { tvevents: null } },
          { body: { tvhighlights: null } },
        ]
      ),
    });

    await expect(
      provider.v1.searchAllTeams({ league: "Definitely_No_Such_League" })
    ).resolves.toEqual({ teams: null });
    await expect(
      provider.v1.eventsday({ date: "1900-01-01" })
    ).resolves.toEqual({ events: null });
    await expect(provider.v1.eventstv({ idChannel: "0" })).resolves.toEqual({
      tvevents: null,
    });
    await expect(
      provider.v1.eventshighlights({ date: "1900-01-01" })
    ).resolves.toEqual({ tvhighlights: null });
  });

  it("exports schemas for list, schedule, TV, and highlight filters", () => {
    expect(
      TheSportsDBSearchAllLeaguesRequestSchema.safeParse({
        country: "England",
        sport: "Soccer",
      }).success
    ).toBe(true);
    expect(
      TheSportsDBSearchAllLeaguesRequestSchema.safeParse({
        country: "",
        sport: "Soccer",
      }).success
    ).toBe(false);
    expect(
      TheSportsDBSearchAllSeasonsRequestSchema.safeParse({
        idLeague: 4328,
        poster: true,
        description: 1,
      }).success
    ).toBe(true);
    expect(TheSportsDBSearchAllTeamsRequestSchema.safeParse({}).success).toBe(
      false
    );
    expect(
      TheSportsDBSearchAllTeamsRequestSchema.safeParse({
        sport: "",
      }).success
    ).toBe(false);
    expect(
      TheSportsDBLookupAllPlayersRequestSchema.safeParse({
        idTeam: 133604,
      }).success
    ).toBe(true);
    expect(
      TheSportsDBTeamEventsRequestSchema.safeParse({ idTeam: 133602 }).success
    ).toBe(true);
    expect(
      TheSportsDBLeagueEventsRequestSchema.safeParse({ idLeague: 4328 }).success
    ).toBe(true);
    expect(
      TheSportsDBEventsDayRequestSchema.safeParse({
        date: "2014-10-10",
      }).success
    ).toBe(true);
    expect(
      TheSportsDBEventsSeasonRequestSchema.safeParse({
        idLeague: 4328,
        season: "2014-2015",
      }).success
    ).toBe(true);
    expect(TheSportsDBEventsTVRequestSchema.safeParse({}).success).toBe(false);
    expect(
      TheSportsDBEventsTVRequestSchema.safeParse({
        channel: "",
      }).success
    ).toBe(false);
    expect(
      TheSportsDBEventsHighlightsRequestSchema.safeParse({
        date: "2024-07-07",
      }).success
    ).toBe(true);
  });

  it("parses non-2xx errors for newly added endpoints", async () => {
    const provider = createTheSportsDB({
      fetch: createJsonFetch(
        [],
        [
          {
            status: 429,
            body: { message: "rate limit" },
          },
        ]
      ),
    });

    await expect(
      provider.v1.eventstv({ date: "2024-07-07" })
    ).rejects.toMatchObject({
      name: "TheSportsDBError",
      status: 429,
      body: { message: "rate limit" },
      message: "TheSportsDB API error 429: rate limit",
    });
  });
});
