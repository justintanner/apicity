import { describe, expect, it } from "vitest";

import { createOpenLigaDB } from "@apicity/openligadb";

interface CapturedRequest {
  url: string;
  init: RequestInit;
}

const sampleMatch = {
  matchID: 99,
  matchDateTime: "2024-08-23T20:30:00",
  timeZoneID: "W. Europe Standard Time",
  leagueId: 4500,
  leagueName: "1. Bundesliga",
  leagueSeason: 2024,
  leagueShortcut: "bl1",
  matchDateTimeUTC: "2024-08-23T18:30:00Z",
  group: null,
  team1: null,
  team2: null,
  lastUpdateDateTime: null,
  matchIsFinished: false,
  matchResults: null,
  goals: null,
  location: null,
  numberOfViewers: null,
};

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function makeProvider(responses: unknown[]) {
  const requests: CapturedRequest[] = [];
  const openligadb = createOpenLigaDB({
    baseURL: "https://openligadb.test/root/",
    fetch: async (input, init) => {
      requests.push({ url: String(input), init: init ?? {} });
      return jsonResponse(responses[requests.length - 1]);
    },
  });
  return { openligadb, requests };
}

describe("openligadb next/last and team-window endpoints", () => {
  it("builds next and last lookup routes without auth headers", async () => {
    const { openligadb, requests } = makeProvider([
      sampleMatch,
      sampleMatch,
      sampleMatch,
      sampleMatch,
    ]);

    const nextByTeam = await openligadb.getnextmatchbyleagueteam({
      leagueId: 4500,
      teamId: 40,
    });
    await openligadb.getnextmatchbyleagueshortcut({ leagueShortcut: "bl 1" });
    await openligadb.getlastmatchbyleagueshortcut({ leagueShortcut: "bl1" });
    await openligadb.getlastmatchbyleagueteam({
      leagueId: 4500,
      teamId: 40,
    });

    expect(nextByTeam.matchID).toBe(99);
    expect(requests.map((request) => request.url)).toEqual([
      "https://openligadb.test/root/getnextmatchbyleagueteam/4500/40",
      "https://openligadb.test/root/getnextmatchbyleagueshortcut/bl%201",
      "https://openligadb.test/root/getlastmatchbyleagueshortcut/bl1",
      "https://openligadb.test/root/getlastmatchbyleagueteam/4500/40",
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

  it("builds team window routes by filter and id without auth headers", async () => {
    const { openligadb, requests } = makeProvider([
      [sampleMatch],
      [sampleMatch],
    ]);

    const byFilter = await openligadb.getmatchesbyteam({
      teamFilterstring: "Bayern München",
      weekCountPast: 4,
      weekCountFuture: 2,
    });
    await openligadb.getmatchesbyteamid({
      teamId: 40,
      weekCountPast: 5,
      weekCountFuture: 1,
    });

    expect(byFilter).toEqual([sampleMatch]);
    expect(requests.map((request) => request.url)).toEqual([
      "https://openligadb.test/root/getmatchesbyteam/" +
        "Bayern%20M%C3%BCnchen/4/2",
      "https://openligadb.test/root/getmatchesbyteamid/40/5/1",
    ]);
    expect(requests.every((request) => request.init.method === "GET")).toBe(
      true
    );
    expect(requests.map((request) => request.init.headers)).toEqual([{}, {}]);
  });

  it("exposes request schemas for next, last, and window routes", () => {
    const openligadb = createOpenLigaDB();

    expect(
      openligadb.getnextmatchbyleagueteam.schema.safeParse({
        leagueId: 4500,
        teamId: 40,
      }).success
    ).toBe(true);
    expect(
      openligadb.getlastmatchbyleagueteam.schema.safeParse({
        leagueId: 4500,
        teamId: 40.5,
      }).success
    ).toBe(false);
    expect(
      openligadb.getnextmatchbyleagueshortcut.schema.safeParse({
        leagueShortcut: "",
      }).success
    ).toBe(false);
    expect(
      openligadb.getlastmatchbyleagueshortcut.schema.safeParse({
        leagueShortcut: "bl1",
      }).success
    ).toBe(true);
    expect(
      openligadb.getmatchesbyteam.schema.safeParse({
        teamFilterstring: "Bayern",
        weekCountPast: 4,
        weekCountFuture: 2,
      }).success
    ).toBe(true);
    expect(
      openligadb.getmatchesbyteamid.schema.safeParse({
        teamId: 40,
        weekCountPast: "4",
        weekCountFuture: 2,
      }).success
    ).toBe(false);
  });
});
