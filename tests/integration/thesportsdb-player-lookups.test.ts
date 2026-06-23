import { describe, expect, it } from "vitest";

import { createTheSportsDB, TheSportsDBError } from "@apicity/thesportsdb";
import {
  TheSportsDBLookupPlayerResponseSchema,
  TheSportsDBLookupPlayerStatsResponseSchema,
  TheSportsDBPlayerResultsResponseSchema,
} from "@apicity/thesportsdb/zod";
import type {
  TheSportsDBLookupPlayerResponse,
  TheSportsDBProvider,
} from "@apicity/thesportsdb";

const samplePlayerResponse: TheSportsDBLookupPlayerResponse = {
  players: [
    {
      idPlayer: "34145937",
      idTeam: "133675",
      idTeam2: null,
      strPlayer: "Mario Balotelli",
      strTeam: "Genoa",
      strTeam2: "",
      strSport: "Soccer",
      dateDied: null,
      strDescriptionEN: "Forward",
      strInstagram: "",
      strThumb: "https://www.thesportsdb.com/images/media/player/thumb.jpg",
      strLocked: "unlocked",
    },
  ],
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function makeProvider(responseBody: unknown = samplePlayerResponse): {
  thesportsdb: TheSportsDBProvider;
  requests: Array<{ url: string; method?: string }>;
} {
  const requests: Array<{ url: string; method?: string }> = [];
  const thesportsdb = createTheSportsDB({
    apiKey: "premium/key",
    baseURL: "https://sports.example/api/v1/json/",
    fetch: async (input, init) => {
      requests.push({
        url: String(input),
        method: init?.method,
      });
      return jsonResponse(responseBody);
    },
  });
  return { thesportsdb, requests };
}

describe("thesportsdb player lookup endpoints", () => {
  it("builds player-centric lookup URLs with the configured API key", async () => {
    const { thesportsdb, requests } = makeProvider();

    await thesportsdb.v1.lookupplayer({ idPlayer: 34145937 });
    await thesportsdb.v1.lookuphonours({ idPlayer: 34147178 });
    await thesportsdb.v1.lookupformerteams({ idPlayer: 34147178 });
    await thesportsdb.v1.lookupmilestones({ idPlayer: 34146304 });
    await thesportsdb.v1.lookupcontracts({ idPlayer: 34146304 });
    await thesportsdb.v1.playerresults({ idPlayer: 34160573 });
    await thesportsdb.v1.lookupplayerstats({ idPlayer: 34146304 });

    expect(requests).toEqual([
      {
        url:
          "https://sports.example/api/v1/json/premium%2Fkey/" +
          "lookupplayer.php?id=34145937",
        method: "GET",
      },
      {
        url:
          "https://sports.example/api/v1/json/premium%2Fkey/" +
          "lookuphonours.php?id=34147178",
        method: "GET",
      },
      {
        url:
          "https://sports.example/api/v1/json/premium%2Fkey/" +
          "lookupformerteams.php?id=34147178",
        method: "GET",
      },
      {
        url:
          "https://sports.example/api/v1/json/premium%2Fkey/" +
          "lookupmilestones.php?id=34146304",
        method: "GET",
      },
      {
        url:
          "https://sports.example/api/v1/json/premium%2Fkey/" +
          "lookupcontracts.php?id=34146304",
        method: "GET",
      },
      {
        url:
          "https://sports.example/api/v1/json/premium%2Fkey/" +
          "playerresults.php?id=34160573",
        method: "GET",
      },
      {
        url:
          "https://sports.example/api/v1/json/premium%2Fkey/" +
          "lookupplayerstats.php?id=34146304",
        method: "GET",
      },
    ]);
  });

  it("uses the public free key by default", async () => {
    const requests: string[] = [];
    const thesportsdb = createTheSportsDB({
      baseURL: "https://sports.example/api/v1/json",
      fetch: async (input) => {
        requests.push(String(input));
        return jsonResponse(samplePlayerResponse);
      },
    });

    await thesportsdb.v1.lookupplayer({ idPlayer: 34145937 });

    expect(requests).toEqual([
      "https://sports.example/api/v1/json/123/lookupplayer.php?id=34145937",
    ]);
  });

  it("preserves sparse wrappers, nulls, and empty strings", async () => {
    const { thesportsdb } = makeProvider(samplePlayerResponse);

    const result = await thesportsdb.v1.lookupplayer({ idPlayer: 34145937 });

    expect(result).toEqual(samplePlayerResponse);
    expect(
      TheSportsDBLookupPlayerResponseSchema.safeParse(result).success
    ).toBe(true);
    expect(result.players?.[0]?.idTeam2).toBeNull();
    expect(result.players?.[0]?.strTeam2).toBe("");
  });

  it("accepts documented guide-only result and stat wrappers", () => {
    const playerResults = {
      results: [
        {
          idResult: "21890",
          idPlayer: "34160573",
          strResult: null,
          intPosition: "4",
          intPoints: "0",
          strDetail: "+ 3.631",
        },
      ],
    };
    const playerStats = {
      playerstats: [
        {
          id: "5321",
          idPlayer: "34146304",
          strStatistic: "Appearances",
          strValue: "6",
          strSeason: "2004",
        },
      ],
    };

    expect(
      TheSportsDBPlayerResultsResponseSchema.safeParse(playerResults).success
    ).toBe(true);
    expect(
      TheSportsDBLookupPlayerStatsResponseSchema.safeParse(playerStats).success
    ).toBe(true);
  });

  it("preserves no-result wrappers as null", async () => {
    const { thesportsdb } = makeProvider({ honours: null });

    await expect(
      thesportsdb.v1.lookuphonours({ idPlayer: 0 })
    ).resolves.toEqual({
      honours: null,
    });
  });

  it("surfaces non-2xx JSON errors", async () => {
    const thesportsdb = createTheSportsDB({
      fetch: async () =>
        jsonResponse(
          {
            error: "rate limit exceeded",
          },
          429
        ),
    });

    await expect(
      thesportsdb.v1.lookupplayer({ idPlayer: 34145937 })
    ).rejects.toMatchObject({
      name: "TheSportsDBError",
      status: 429,
      body: { error: "rate limit exceeded" },
    } satisfies Partial<TheSportsDBError>);
  });

  it("exposes a required integer player ID schema on every endpoint", () => {
    const thesportsdb = createTheSportsDB();

    for (const endpoint of [
      thesportsdb.v1.lookupplayer,
      thesportsdb.v1.lookuphonours,
      thesportsdb.v1.lookupformerteams,
      thesportsdb.v1.lookupmilestones,
      thesportsdb.v1.lookupcontracts,
      thesportsdb.v1.playerresults,
      thesportsdb.v1.lookupplayerstats,
    ]) {
      expect(endpoint.schema.safeParse({ idPlayer: 1 }).success).toBe(true);
      expect(endpoint.schema.safeParse({ idPlayer: "1" }).success).toBe(false);
    }
  });
});
