import { describe, expect, it } from "vitest";

import { createOpenLigaDB, OpenLigaDBError } from "@apicity/openligadb";
import {
  OpenLigaDBCurrentGroupRequestSchema,
  OpenLigaDBLastChangeDateRequestSchema,
  OpenLigaDBLeagueSeasonRequestSchema,
  OpenLigaDBResultInfosRequestSchema,
  OpenLigaDBSeasonRequestSchema,
} from "@apicity/openligadb/zod";

interface CapturedRequest {
  url: string;
  init: RequestInit;
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function createCapturedProvider(responseBody: unknown) {
  const requests: CapturedRequest[] = [];
  const provider = createOpenLigaDB({
    baseURL: "https://example.test/base/",
    fetch: async (url, init) => {
      requests.push({ url: String(url), init: init ?? {} });
      return jsonResponse(responseBody);
    },
  });
  return { provider, requests };
}

describe("OpenLigaDB provider", () => {
  it("requests sports without auth headers", async () => {
    const { provider, requests } = createCapturedProvider([
      { sportId: 1, sportName: "Football" },
    ]);

    const sports = await provider.getavailablesports();

    expect(sports[0].sportId).toBe(1);
    expect(requests[0].url).toBe(
      "https://example.test/base/getavailablesports"
    );
    expect(requests[0].init.method).toBe("GET");
    expect(requests[0].init.headers).toEqual({});
  });

  it("requests available leagues with and without season path params", async () => {
    const { provider, requests } = createCapturedProvider([
      {
        leagueId: 4500,
        leagueName: "1. Fußball-Bundesliga 2021/2022",
        leagueShortcut: "bl1",
        leagueSeason: "2021",
        sport: { sportId: 1, sportName: "Fußball" },
      },
    ]);

    await provider.getavailableleagues();
    const bySeason = await provider.getavailableleagues.bySeason({
      season: 2021,
    });

    expect(bySeason[0].leagueShortcut).toBe("bl1");
    expect(requests.map((request) => request.url)).toEqual([
      "https://example.test/base/getavailableleagues",
      "https://example.test/base/getavailableleagues/2021",
    ]);
  });

  it("encodes league shortcut path params", async () => {
    const { provider, requests } = createCapturedProvider([
      { groupName: "Spieltag 1", groupOrderID: 1, groupID: 10 },
    ]);

    await provider.getavailablegroups({
      leagueShortcut: "bl 1/2",
      leagueSeason: 2024,
    });

    expect(requests[0].url).toBe(
      "https://example.test/base/getavailablegroups/bl%201%2F2/2024"
    );
  });

  it("requests current group, last change date, result info, and teams", async () => {
    const group = { groupName: "Spieltag 2", groupOrderID: 2, groupID: 20 };
    const resultInfo = {
      id: 1,
      name: "Endergebnis",
      description: null,
      orderId: 1,
      globalResultInfo: { id: 1, name: "Full time" },
    };
    const team = {
      teamId: 40,
      teamName: "Example FC",
      shortName: "EFC",
      teamIconUrl: null,
      teamGroupName: null,
    };
    const responses = [group, "2024-08-01T12:00:00Z", resultInfo, [team]];
    const requests: CapturedRequest[] = [];
    const provider = createOpenLigaDB({
      baseURL: "https://api.example",
      fetch: async (url, init) => {
        requests.push({ url: String(url), init: init ?? {} });
        return jsonResponse(responses[requests.length - 1]);
      },
    });

    expect(await provider.getcurrentgroup({ leagueShortcut: "bl1" })).toEqual(
      group
    );
    expect(
      await provider.getlastchangedate({
        leagueShortcut: "bl1",
        leagueSeason: 2024,
        groupOrderId: 2,
      })
    ).toBe("2024-08-01T12:00:00Z");
    expect(await provider.getresultinfos({ leagueId: 4500 })).toEqual(
      resultInfo
    );
    expect(
      await provider.getavailableteams({
        leagueShortcut: "bl1",
        leagueSeason: 2024,
      })
    ).toEqual([team]);

    expect(requests.map((request) => request.url)).toEqual([
      "https://api.example/getcurrentgroup/bl1",
      "https://api.example/getlastchangedate/bl1/2024/2",
      "https://api.example/getresultinfos/4500",
      "https://api.example/getavailableteams/bl1/2024",
    ]);
    expect(requests.every((request) => request.init.method === "GET")).toBe(
      true
    );
    expect(requests.map((request) => request.init.headers)).toEqual([
      {},
      {},
      {},
      {},
    ]);
  });

  it("preserves text error bodies", async () => {
    const provider = createOpenLigaDB({
      fetch: async () => new Response("not found", { status: 404 }),
    });

    await expect(provider.getresultinfos({ leagueId: 999 })).rejects.toThrow(
      OpenLigaDBError
    );
    await expect(
      provider.getresultinfos({ leagueId: 999 })
    ).rejects.toMatchObject({
      status: 404,
      body: "not found",
    });
  });
});

describe("OpenLigaDB request schemas", () => {
  it("validates integer path params", () => {
    expect(
      OpenLigaDBSeasonRequestSchema.safeParse({ season: 2024 }).success
    ).toBe(true);
    expect(
      OpenLigaDBSeasonRequestSchema.safeParse({ season: 2024.5 }).success
    ).toBe(false);
    expect(
      OpenLigaDBResultInfosRequestSchema.safeParse({ leagueId: "4500" }).success
    ).toBe(false);
  });

  it("validates non-empty shortcut path params", () => {
    expect(
      OpenLigaDBLeagueSeasonRequestSchema.safeParse({
        leagueShortcut: "bl1",
        leagueSeason: 2024,
      }).success
    ).toBe(true);
    expect(
      OpenLigaDBLeagueSeasonRequestSchema.safeParse({
        leagueShortcut: "",
        leagueSeason: 2024,
      }).success
    ).toBe(false);
    expect(
      OpenLigaDBCurrentGroupRequestSchema.safeParse({
        leagueShortcut: "",
      }).success
    ).toBe(false);
  });

  it("validates last change date path params", () => {
    expect(
      OpenLigaDBLastChangeDateRequestSchema.safeParse({
        leagueShortcut: "bl1",
        leagueSeason: 2024,
        groupOrderId: 1,
      }).success
    ).toBe(true);
    expect(
      OpenLigaDBLastChangeDateRequestSchema.safeParse({
        leagueShortcut: "bl1",
        leagueSeason: 2024,
        groupOrderId: 1.5,
      }).success
    ).toBe(false);
  });
});
