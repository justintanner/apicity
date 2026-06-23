import { describe, expect, it } from "vitest";

import {
  createTheSportsDB,
  TheSportsDBLeagueScheduleRequestSchema,
  TheSportsDBLiveScoreLeagueRequestSchema,
  TheSportsDBLiveScoreSportRequestSchema,
  type TheSportsDBEventScheduleList,
  type TheSportsDBLiveScoreList,
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

function headersRecord(init?: RequestInit): Record<string, string> {
  return (init?.headers ?? {}) as Record<string, string>;
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

describe("thesportsdb V2 premium schedule and livescore provider", () => {
  it("sends X-API-KEY and builds V2 schedule paths", async () => {
    const calls: CapturedFetchCall[] = [];
    const provider = createTheSportsDB({
      apiKey: "premium key",
      v2BaseURL: "https://example.test/v2/",
      fetch: createJsonFetch(calls, {
        schedule: [
          {
            idEvent: "2070217",
            strEvent: "Wolves vs Brentford",
            intHomeScore: null,
            intAwayScore: "1",
            strStatus: null,
          },
        ],
      }),
    });

    const result: TheSportsDBEventScheduleList =
      await provider.v2.schedule.next.league({ idLeague: 4328 });

    expect(result.schedule?.[0]).toEqual(
      expect.objectContaining({
        idEvent: "2070217",
        strEvent: "Wolves vs Brentford",
        intHomeScore: null,
        intAwayScore: "1",
        strStatus: null,
      })
    );
    expect(calls[0].url).toBe(
      "https://example.test/v2/schedule/next/league/4328"
    );
    expect(calls[0].init?.method).toBe("GET");
    expect(headersRecord(calls[0].init)["X-API-KEY"]).toBe("premium key");
    expect(provider.v2.schedule.next.league.schema).toBe(
      TheSportsDBLeagueScheduleRequestSchema
    );
  });

  it("encodes V2 schedule path parameters", async () => {
    const calls: CapturedFetchCall[] = [];
    const provider = createTheSportsDB({
      apiKey: "premium",
      fetch: createJsonFetch(calls, { schedule: [] }),
    });

    await provider.v2.schedule.league({
      idLeague: "43/28",
      season: "2023/2024",
    });

    expect(calls[0].url).toBe(
      "https://www.thesportsdb.com/api/v2/json/schedule/league/43%2F28/2023%2F2024"
    );
    expect(
      provider.v2.schedule.league.schema.safeParse({
        idLeague: 4328,
        season: "2023-2024",
      }).success
    ).toBe(true);
  });

  it("routes livescore sport, league, and all overloads explicitly", async () => {
    const calls: CapturedFetchCall[] = [];
    const provider = createTheSportsDB({
      apiKey: "premium",
      fetch: createJsonFetch(calls, { livescore: [] }),
    });

    await provider.v2.livescore.bySport({ sport: "ice hockey" });
    await provider.v2.livescore.byLeague({ leagueId: 4399 });
    await provider.v2.livescore.all();

    expect(calls.map((call) => call.url)).toEqual([
      "https://www.thesportsdb.com/api/v2/json/livescore/ice%20hockey",
      "https://www.thesportsdb.com/api/v2/json/livescore/4399",
      "https://www.thesportsdb.com/api/v2/json/livescore/all",
    ]);
    expect(provider.v2.livescore.bySport.schema).toBe(
      TheSportsDBLiveScoreSportRequestSchema
    );
    expect(provider.v2.livescore.byLeague.schema).toBe(
      TheSportsDBLiveScoreLeagueRequestSchema
    );
    expect(provider.v2.livescore.all.schema).toBeUndefined();
  });

  it("returns live score wrappers with nullable score and status fields", async () => {
    const provider = createTheSportsDB({
      apiKey: "premium",
      fetch: createJsonFetch([], {
        livescore: [
          {
            idLiveScore: "267125786",
            idEvent: "2250886",
            strSport: "Soccer",
            idLeague: "4626",
            strLeague: "Bulgarian First League",
            intHomeScore: "0",
            intAwayScore: null,
            intEventScore: null,
            intEventScoreTotal: null,
            strStatus: "2H",
            strProgress: null,
          },
        ],
      }),
    });

    const result: TheSportsDBLiveScoreList =
      await provider.get.v2.livescore.bySport({ sport: "soccer" });

    expect(result.livescore?.[0]).toEqual(
      expect.objectContaining({
        idLiveScore: "267125786",
        intAwayScore: null,
        intEventScore: null,
        strStatus: "2H",
        strProgress: null,
      })
    );
  });

  it("preserves V2 429 error bodies", async () => {
    const provider = createTheSportsDB({
      apiKey: "premium",
      fetch: createTextFetch([], "rate limit", 429),
    });

    await expect(provider.v2.livescore.all()).rejects.toMatchObject({
      status: 429,
      body: "rate limit",
      message: "TheSportsDB API error 429: rate limit",
    });
  });
});
