import { describe, expect, it } from "vitest";

import {
  createTheSportsDB,
  TheSportsDBEventLookupRequestSchema,
  TheSportsDBEventResponseSchema,
  TheSportsDBEventResultsResponseSchema,
  TheSportsDBEventStatsResponseSchema,
  TheSportsDBLineupResponseSchema,
  TheSportsDBTimelineResponseSchema,
  TheSportsDBTvEventResponseSchema,
  type TheSportsDBEventResponse,
  type TheSportsDBEventResultsResponse,
  type TheSportsDBEventStatsResponse,
  type TheSportsDBLineupResponse,
  type TheSportsDBProvider,
  type TheSportsDBTimelineResponse,
  type TheSportsDBTvEventResponse,
} from "@apicity/thesportsdb";

interface CapturedFetchCall {
  url: string;
  init?: RequestInit;
}

interface EventDetailEndpointCase {
  name: string;
  idEvent: string | number;
  path: string;
  key: string;
  body: Record<string, unknown>;
  call: (
    provider: TheSportsDBProvider,
    idEvent: string | number
  ) => Promise<Record<string, unknown>>;
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

const endpointCases: EventDetailEndpointCase[] = [
  {
    name: "lookupEvent",
    idEvent: "441613",
    path: "lookupevent.php",
    key: "events",
    body: {
      events: [
        {
          idEvent: "441613",
          strEvent: "Liverpool vs Swansea",
          dateEvent: "2014-12-29",
          idHomeTeam: "133602",
          idAwayTeam: "133614",
          strHomeTeam: "Liverpool",
          strAwayTeam: "Swansea",
          intHomeScore: "4",
          intAwayScore: "1",
          strThumb: null,
        },
      ],
    },
    call: (provider, idEvent) => provider.v1.lookupEvent({ idEvent }),
  },
  {
    name: "eventResults",
    idEvent: "652890",
    path: "eventresults.php",
    key: "results",
    body: {
      results: [
        {
          idResult: "607",
          idPlayer: "34167526",
          strPlayer: "Justin Barcia",
          idTeam: "135832",
          idEvent: "652890",
          strEvent: "Anaheim 1",
          intPosition: "1",
          intPoints: "26",
          dateEvent: "2020-01-05",
          strSport: "Motorsport",
        },
      ],
    },
    call: (provider, idEvent) => provider.v1.eventResults({ idEvent }),
  },
  {
    name: "lookupLineup",
    idEvent: 1032723,
    path: "lookuplineup.php",
    key: "lineup",
    body: {
      lineup: [
        {
          idLineup: "541",
          idEvent: "1032723",
          strPosition: "Goalkeeper",
          strHome: "Yes",
          strSubstitute: "No",
          idPlayer: "34145423",
          strPlayer: "Emiliano Martinez",
          idTeam: "133601",
          strTeam: "Aston Villa",
          strThumb: "https://r2.thesportsdb.com/images/player.jpg",
        },
      ],
    },
    call: (provider, idEvent) => provider.v1.lookupLineup({ idEvent }),
  },
  {
    name: "lookupTimeline",
    idEvent: "1032718",
    path: "lookuptimeline.php",
    key: "timeline",
    body: {
      timeline: [
        {
          idTimeline: "871243",
          idEvent: "1032718",
          strTimeline: "Card",
          strTimelineDetail: "Yellow Card",
          strEvent: "Sheffield United vs Leeds",
          idPlayer: "34147877",
          strPlayer: "Kalvin Phillips",
          intTime: "6",
          idTeam: "133635",
          strTeam: "Leeds",
          dateEvent: "2020-09-27",
        },
      ],
    },
    call: (provider, idEvent) => provider.v1.lookupTimeline({ idEvent }),
  },
  {
    name: "lookupEventStats",
    idEvent: 1032723,
    path: "lookupeventstats.php",
    key: "eventstats",
    body: {
      eventstats: [
        {
          idStatistic: "17",
          idEvent: "1032723",
          strEvent: "Aston Villa vs Liverpool",
          strStat: "Shots on Goal",
          intHome: "11",
          intAway: "8",
        },
      ],
    },
    call: (provider, idEvent) => provider.v1.lookupEventStats({ idEvent }),
  },
  {
    name: "lookupTv",
    idEvent: "584911",
    path: "lookuptv.php",
    key: "tvevent",
    body: {
      tvevent: [
        {
          id: "4867",
          idEvent: "584911",
          strSport: "Motorsport",
          strEvent: "Marrakesh E-Prix",
          idChannel: "8165",
          strCountry: "Ireland",
          strLogo: "https://r2.thesportsdb.com/images/channel.png",
          strChannel: "BT Sport ESPN HD",
          dateEvent: "2019-01-12",
        },
      ],
    },
    call: (provider, idEvent) => provider.v1.lookupTv({ idEvent }),
  },
];

describe("thesportsdb V1 event detail lookup provider", () => {
  for (const endpoint of endpointCases) {
    it(`constructs the ${endpoint.name} URL and returns ${endpoint.key}`, async () => {
      const calls: CapturedFetchCall[] = [];
      const provider = createTheSportsDB({
        fetch: createJsonFetch(calls, endpoint.body),
      });

      const result = await endpoint.call(provider, endpoint.idEvent);

      expect(result[endpoint.key]).toEqual(endpoint.body[endpoint.key]);
      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe(
        `https://www.thesportsdb.com/api/v1/json/123/${endpoint.path}?id=${endpoint.idEvent}`
      );
      expect(calls[0].init?.method).toBe("GET");
    });
  }

  it("uses apiKey and baseURL overrides for event lookups", async () => {
    const calls: CapturedFetchCall[] = [];
    const provider = createTheSportsDB({
      apiKey: "premium key",
      baseURL: "https://example.test/root/",
      fetch: createJsonFetch(calls, { lineup: null }),
    });

    const result: TheSportsDBLineupResponse =
      await provider.get.v1.lookupLineup({ idEvent: 1032723 });

    expect(result.lineup).toBeNull();
    expect(calls[0].url).toBe(
      "https://example.test/root/premium%20key/lookuplineup.php?id=1032723"
    );
  });

  it("attaches the event lookup request schema to every method", () => {
    const provider = createTheSportsDB();

    expect(provider.v1.lookupEvent.schema).toBe(
      TheSportsDBEventLookupRequestSchema
    );
    expect(provider.v1.eventResults.schema).toBe(
      TheSportsDBEventLookupRequestSchema
    );
    expect(provider.v1.lookupLineup.schema).toBe(
      TheSportsDBEventLookupRequestSchema
    );
    expect(provider.v1.lookupTimeline.schema).toBe(
      TheSportsDBEventLookupRequestSchema
    );
    expect(provider.v1.lookupEventStats.schema).toBe(
      TheSportsDBEventLookupRequestSchema
    );
    expect(provider.v1.lookupTv.schema).toBe(
      TheSportsDBEventLookupRequestSchema
    );
  });

  it("exports request and response schemas for event wrappers", () => {
    const eventResponse: TheSportsDBEventResponse = {
      events: [{ idEvent: "441613", strEvent: "Liverpool vs Swansea" }],
    };
    const resultsResponse: TheSportsDBEventResultsResponse = {
      results: [{ idEvent: "652890", strEvent: "Anaheim 1" }],
    };
    const lineupResponse: TheSportsDBLineupResponse = {
      lineup: [{ idEvent: "1032723", strPlayer: "Emiliano Martinez" }],
    };
    const timelineResponse: TheSportsDBTimelineResponse = {
      timeline: [{ idEvent: "1032718", strTimeline: "Card" }],
    };
    const statsResponse: TheSportsDBEventStatsResponse = {
      eventstats: [{ idEvent: "1032723", strStat: "Shots on Goal" }],
    };
    const tvResponse: TheSportsDBTvEventResponse = {
      tvevent: [{ idEvent: "584911", strChannel: "BT Sport ESPN HD" }],
    };

    expect(
      TheSportsDBEventLookupRequestSchema.safeParse({ idEvent: "1032723" })
        .success
    ).toBe(true);
    expect(
      TheSportsDBEventLookupRequestSchema.safeParse({ idEvent: "" }).success
    ).toBe(false);
    expect(
      TheSportsDBEventResponseSchema.safeParse(eventResponse).success
    ).toBe(true);
    expect(
      TheSportsDBEventResultsResponseSchema.safeParse(resultsResponse).success
    ).toBe(true);
    expect(
      TheSportsDBLineupResponseSchema.safeParse(lineupResponse).success
    ).toBe(true);
    expect(
      TheSportsDBTimelineResponseSchema.safeParse(timelineResponse).success
    ).toBe(true);
    expect(
      TheSportsDBEventStatsResponseSchema.safeParse(statsResponse).success
    ).toBe(true);
    expect(TheSportsDBTvEventResponseSchema.safeParse(tvResponse).success).toBe(
      true
    );
  });

  it("preserves null arrays for empty event detail wrappers", async () => {
    const nullCases = [
      {
        key: "events",
        body: { events: null },
        call: (provider: TheSportsDBProvider) =>
          provider.v1.lookupEvent({ idEvent: "441613" }),
      },
      {
        key: "results",
        body: { results: null },
        call: (provider: TheSportsDBProvider) =>
          provider.v1.eventResults({ idEvent: "652890" }),
      },
      {
        key: "lineup",
        body: { lineup: null },
        call: (provider: TheSportsDBProvider) =>
          provider.v1.lookupLineup({ idEvent: "1032723" }),
      },
      {
        key: "timeline",
        body: { timeline: null },
        call: (provider: TheSportsDBProvider) =>
          provider.v1.lookupTimeline({ idEvent: "1032718" }),
      },
      {
        key: "eventstats",
        body: { eventstats: null },
        call: (provider: TheSportsDBProvider) =>
          provider.v1.lookupEventStats({ idEvent: "1032723" }),
      },
      {
        key: "tvevent",
        body: { tvevent: null },
        call: (provider: TheSportsDBProvider) =>
          provider.v1.lookupTv({ idEvent: "584911" }),
      },
    ];

    for (const empty of nullCases) {
      const provider = createTheSportsDB({
        fetch: createJsonFetch([], empty.body),
      });
      const result = await empty.call(provider);

      expect(result[empty.key]).toBeNull();
    }
  });

  it("parses JSON error bodies for event lookup failures", async () => {
    const provider = createTheSportsDB({
      fetch: createJsonFetch([], { message: "event not found" }, 404),
    });

    await expect(
      provider.v1.lookupEvent({ idEvent: "missing" })
    ).rejects.toMatchObject({
      name: "TheSportsDBError",
      status: 404,
      body: { message: "event not found" },
      message: "TheSportsDB API error 404: event not found",
    });
  });

  it("preserves text error bodies for lookup TV rate limits", async () => {
    const provider = createTheSportsDB({
      fetch: createTextFetch([], "rate limit", 429),
    });

    await expect(
      provider.v1.lookupTv({ idEvent: "584911" })
    ).rejects.toMatchObject({
      status: 429,
      body: "rate limit",
      message: "TheSportsDB API error 429: rate limit",
    });
  });
});
