import { describe, expect, it } from "vitest";

import {
  createTheSportsDB,
  TheSportsDBError,
  TheSportsDBFilterTvChannelIdRequestSchema,
  TheSportsDBSearchTeamRequestSchema,
  TheSportsDBOptionsSchema,
  type TheSportsDBCountriesResponse,
  type TheSportsDBEventFilterResponse,
  type TheSportsDBLeagueListResponse,
  type TheSportsDBLeaguesResponse,
  type TheSportsDBSeasonPosterListResponse,
  type TheSportsDBSportsResponse,
  type TheSportsDBTeamSearchResponse,
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

function createJsonQueueFetch(
  calls: CapturedFetchCall[],
  bodies: unknown[]
): typeof fetch {
  let index = 0;
  return async (input, init) => {
    calls.push({ url: inputUrl(input), init });
    const body = bodies[index++] ?? null;
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };
}

describe("thesportsdb V1 catalog provider", () => {
  it("uses the free V1 key in the URL path by default", async () => {
    const calls: CapturedFetchCall[] = [];
    const provider = createTheSportsDB({
      fetch: createJsonFetch(calls, {
        sports: [{ idSport: "102", strSport: "Soccer" }],
      }),
    });

    const result: TheSportsDBSportsResponse = await provider.v1.allSports();

    expect(result.sports?.[0]).toEqual(
      expect.objectContaining({ idSport: "102", strSport: "Soccer" })
    );
    expect(calls[0].url).toBe(
      "https://www.thesportsdb.com/api/v1/json/123/all_sports.php"
    );
    expect(calls[0].init?.method).toBe("GET");
    expect(provider.v1.allSports.schema).toBeUndefined();
  });

  it("uses apiKey and baseURL overrides for V1 catalog calls", async () => {
    const calls: CapturedFetchCall[] = [];
    const provider = createTheSportsDB({
      apiKey: "premium key",
      baseURL: "https://example.test/root/",
      fetch: createJsonFetch(calls, {
        countries: [{ name_en: "England" }],
      }),
    });

    const result: TheSportsDBCountriesResponse =
      await provider.v1.allCountries();

    expect(result.countries?.[0]).toEqual({ name_en: "England" });
    expect(calls[0].url).toBe(
      "https://example.test/root/premium%20key/all_countries.php"
    );
  });

  it("supports fetch injection for the all leagues wrapper", async () => {
    const calls: CapturedFetchCall[] = [];
    const provider = createTheSportsDB({
      fetch: createJsonFetch(calls, {
        leagues: [
          {
            idLeague: "4328",
            strLeague: "English Premier League",
            strSport: "Soccer",
          },
        ],
      }),
    });

    const result: TheSportsDBLeaguesResponse =
      await provider.get.v1.allLeagues();

    expect(result.leagues?.[0]).toEqual(
      expect.objectContaining({
        idLeague: "4328",
        strLeague: "English Premier League",
        strSport: "Soccer",
      })
    );
    expect(calls[0].url.endsWith("/api/v1/json/123/all_leagues.php")).toBe(
      true
    );
  });

  it("parses JSON error bodies for non-2xx responses", async () => {
    const provider = createTheSportsDB({
      fetch: createJsonFetch([], { message: "bad key" }, 401),
    });

    await expect(provider.v1.allSports()).rejects.toMatchObject({
      name: "TheSportsDBError",
      status: 401,
      body: { message: "bad key" },
      message: "TheSportsDB API error 401: bad key",
    });
  });

  it("preserves text error bodies for 429 responses", async () => {
    const provider = createTheSportsDB({
      fetch: createTextFetch([], "rate limit", 429),
    });

    await expect(provider.v1.allCountries()).rejects.toMatchObject({
      status: 429,
      body: "rate limit",
      message: "TheSportsDB API error 429: rate limit",
    });
  });

  it("wraps timeout aborts in TheSportsDBError", async () => {
    const hangingFetch: typeof fetch = (_input, init) => {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener(
          "abort",
          () => reject(new Error("aborted")),
          { once: true }
        );
      });
    };
    const provider = createTheSportsDB({
      fetch: hangingFetch,
      timeout: 1,
    });

    await expect(provider.v1.allLeagues()).rejects.toBeInstanceOf(
      TheSportsDBError
    );
  });

  it("exports provider option schema metadata", () => {
    expect(
      TheSportsDBOptionsSchema.safeParse({
        apiKey: "123",
        baseURL: "https://www.thesportsdb.com/api/v1/json",
        v2BaseURL: "https://www.thesportsdb.com/api/v2/json",
        timeout: 1000,
        fetch,
      }).success
    ).toBe(true);
  });
});

describe("thesportsdb V2 premium provider", () => {
  it("requires an apiKey before V2 fetches", async () => {
    const calls: CapturedFetchCall[] = [];
    const provider = createTheSportsDB({
      fetch: createJsonFetch(calls, { search: [] }),
    });

    await expect(
      provider.v2.search.league({ leagueName: "English Premier League" })
    ).rejects.toMatchObject({
      name: "TheSportsDBError",
      status: 401,
      body: {
        error: "TheSportsDB V2 requires apiKey for X-API-KEY authentication",
      },
    });
    expect(calls).toHaveLength(0);
  });

  it("sends X-API-KEY and encodes V2 search path params", async () => {
    const calls: CapturedFetchCall[] = [];
    const provider = createTheSportsDB({
      apiKey: "premium key",
      v2BaseURL: "https://example.test/api/v2/json/",
      fetch: createJsonFetch(calls, {
        search: [
          {
            idTeam: "133612",
            strTeam: "Manchester United",
            strSport: "Soccer",
          },
        ],
      }),
    });

    const result: TheSportsDBTeamSearchResponse = await provider.v2.search.team(
      { teamName: "Manchester United" }
    );
    const headers = calls[0].init?.headers as Record<string, string>;

    expect(result.search?.[0]).toEqual(
      expect.objectContaining({
        idTeam: "133612",
        strTeam: "Manchester United",
      })
    );
    expect(calls[0].url).toBe(
      "https://example.test/api/v2/json/search/team/Manchester%20United"
    );
    expect(headers["X-API-KEY"]).toBe("premium key");
    expect(
      TheSportsDBSearchTeamRequestSchema.safeParse({
        teamName: "manchester_united",
      }).success
    ).toBe(true);
  });

  it("returns representative V2 all, list, and TV filter wrappers", async () => {
    const calls: CapturedFetchCall[] = [];
    const provider = createTheSportsDB({
      apiKey: "premium",
      fetch: createJsonQueueFetch(calls, [
        {
          all: [
            {
              idLeague: "4328",
              strLeague: "English Premier League",
              strSport: "Soccer",
            },
          ],
        },
        {
          list: [
            {
              strSeason: "2024-2025",
              strPoster:
                "https://www.thesportsdb.com/images/media/league/poster.jpg",
            },
          ],
        },
        {
          filter: [
            {
              id: "730084",
              idEvent: "1963785",
              idChannel: "3834",
              strChannel: "Sky Sports Main Event",
            },
          ],
        },
      ]),
    });

    const leagues: TheSportsDBLeagueListResponse =
      await provider.v2.all.leagues();
    const posters: TheSportsDBSeasonPosterListResponse =
      await provider.v2.list.seasonposters({ idLeague: 4328 });
    const tv: TheSportsDBEventFilterResponse =
      await provider.get.v2.filter.tv.channelid({ idChannel: "3834" });

    expect(leagues.all?.[0].strLeague).toBe("English Premier League");
    expect(posters.list?.[0].strSeason).toBe("2024-2025");
    expect(tv.filter?.[0].strChannel).toBe("Sky Sports Main Event");
    expect(calls.map((call) => call.url)).toEqual([
      "https://www.thesportsdb.com/api/v2/json/all/leagues",
      "https://www.thesportsdb.com/api/v2/json/list/seasonposters/4328",
      "https://www.thesportsdb.com/api/v2/json/filter/tv/channelid/3834",
    ]);
    expect(
      TheSportsDBFilterTvChannelIdRequestSchema.safeParse({
        idChannel: 3834,
      }).success
    ).toBe(true);
  });

  it("parses V2 error responses", async () => {
    const provider = createTheSportsDB({
      apiKey: "premium",
      fetch: createJsonFetch([], { error: { message: "rate limit" } }, 429),
    });

    await expect(
      provider.v2.filter.tv.day({ date: "2024-06-22" })
    ).rejects.toMatchObject({
      status: 429,
      body: { error: { message: "rate limit" } },
      message: "TheSportsDB API error 429: rate limit",
    });
  });
});
