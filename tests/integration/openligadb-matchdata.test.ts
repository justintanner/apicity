import { describe, expect, it } from "vitest";

import { createOpenLigaDB, OpenLigaDBError } from "@apicity/openligadb";
import type { OpenLigaDBMatch } from "@apicity/openligadb";

const sampleMatch: OpenLigaDBMatch = {
  matchID: 1,
  matchDateTime: "2024-08-23T20:30:00",
  timeZoneID: "W. Europe Standard Time",
  leagueId: 1,
  leagueName: "1. Bundesliga",
  leagueSeason: 2024,
  leagueShortcut: "bl1",
  matchDateTimeUTC: "2024-08-23T18:30:00Z",
  group: {
    groupName: "1. Spieltag",
    groupOrderID: 1,
    groupID: 1,
  },
  team1: {
    teamId: 16,
    teamName: "FC Bayern München",
    shortName: "Bayern",
    teamIconUrl: "https://example.test/bayern.png",
    teamGroupName: null,
  },
  team2: {
    teamId: 40,
    teamName: "Borussia Dortmund",
    shortName: "BVB",
    teamIconUrl: "https://example.test/bvb.png",
    teamGroupName: null,
  },
  lastUpdateDateTime: "2024-08-23T22:30:00",
  matchIsFinished: true,
  matchResults: [
    {
      resultID: 1,
      resultName: "Endergebnis",
      pointsTeam1: 2,
      pointsTeam2: 1,
      resultOrderID: 2,
      resultTypeID: 2,
      resultDescription: "Ergebnis nach Ende der offiziellen Spielzeit",
    },
  ],
  goals: [
    {
      goalID: 1,
      scoreTeam1: 1,
      scoreTeam2: 0,
      matchMinute: 22,
      goalGetterID: 7,
      goalGetterName: "Example Scorer",
      isPenalty: false,
      isOwnGoal: false,
      isOvertime: false,
      comment: null,
    },
  ],
  location: {
    locationID: 1,
    locationCity: "München",
    locationStadium: "Allianz Arena",
  },
  numberOfViewers: 75000,
};

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function makeProvider(responseBody: unknown = [sampleMatch]) {
  const requests: Array<{ url: string; method?: string }> = [];
  const openligadb = createOpenLigaDB({
    baseURL: "https://openligadb.test/root/",
    fetch: async (input, init) => {
      requests.push({
        url: String(input),
        method: init?.method,
      });
      return jsonResponse(responseBody);
    },
  });
  return { openligadb, requests };
}

describe("openligadb matchdata overloads", () => {
  it("builds the by-id route", async () => {
    const { openligadb, requests } = makeProvider(sampleMatch);

    const result = await openligadb.getmatchdata.byId({ matchId: 42 });

    expect(result).toEqual(sampleMatch);
    expect(requests).toEqual([
      {
        url: "https://openligadb.test/root/getmatchdata/42",
        method: "GET",
      },
    ]);
  });

  it("builds the league-season route and encodes leagueShortcut", async () => {
    const { openligadb, requests } = makeProvider();

    const result = await openligadb.getmatchdata.byLeagueSeason({
      leagueShortcut: "bl 1",
      leagueSeason: 2024,
    });

    expect(result).toEqual([sampleMatch]);
    expect(requests[0]).toEqual({
      url: "https://openligadb.test/root/getmatchdata/bl%201/2024",
      method: "GET",
    });
  });

  it("builds the league-season-group route", async () => {
    const { openligadb, requests } = makeProvider();

    await openligadb.getmatchdata.byLeagueSeasonGroup({
      leagueShortcut: "bl1",
      leagueSeason: 2024,
      groupOrderId: 8,
    });

    expect(requests[0]).toEqual({
      url: "https://openligadb.test/root/getmatchdata/bl1/2024/8",
      method: "GET",
    });
  });

  it("builds the league-season-team route and encodes path strings", async () => {
    const { openligadb, requests } = makeProvider();

    await openligadb.getmatchdata.byLeagueSeasonTeam({
      leagueShortcut: "bl/1",
      leagueSeason: 2024,
      teamFilterstring: "Bayern München",
    });

    expect(requests[0]).toEqual({
      url:
        "https://openligadb.test/root/getmatchdata/bl%2F1/2024/" +
        "Bayern%20M%C3%BCnchen",
      method: "GET",
    });
  });

  it("builds the by-teams route", async () => {
    const { openligadb, requests } = makeProvider();

    await openligadb.getmatchdata.byTeams({
      teamId1: 16,
      teamId2: 40,
    });

    expect(requests[0]).toEqual({
      url: "https://openligadb.test/root/getmatchdata/16/40",
      method: "GET",
    });
  });

  it("preserves text/plain 404 errors for missing match ids", async () => {
    const openligadb = createOpenLigaDB({
      fetch: async () =>
        new Response("No match found for match id 999999", {
          status: 404,
          headers: { "Content-Type": "text/plain" },
        }),
    });

    await expect(
      openligadb.getmatchdata.byId({ matchId: 999999 })
    ).rejects.toMatchObject({
      name: "OpenLigaDBError",
      status: 404,
      body: "No match found for match id 999999",
    } satisfies Partial<OpenLigaDBError>);
  });

  it("exposes request schemas for every overload", () => {
    const openligadb = createOpenLigaDB();

    expect(
      openligadb.getmatchdata.byId.schema.safeParse({ matchId: 1 }).success
    ).toBe(true);
    expect(
      openligadb.getmatchdata.byLeagueSeason.schema.safeParse({
        leagueShortcut: "",
        leagueSeason: 2024,
      }).success
    ).toBe(false);
    expect(
      openligadb.getmatchdata.byTeams.schema.safeParse({
        teamId1: 16,
        teamId2: 40,
      }).success
    ).toBe(true);
  });
});
