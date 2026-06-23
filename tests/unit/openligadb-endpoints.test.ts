import { describe, expect, it, vi } from "vitest";

import {
  createOpenLigaDB,
  OpenLigaDBError,
} from "../../packages/provider/openligadb/src";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("OpenLigaDB endpoint wiring", () => {
  it("exposes Bundesliga standings with encoded path parameters", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      jsonResponse([
        {
          teamInfoId: 40,
          teamName: "FC Bayern Muenchen",
          shortName: "FCB",
          teamIconUrl: "https://example.test/fcb.svg",
          points: 82,
          opponentGoals: 32,
          goals: 99,
          matches: 34,
          won: 25,
          lost: 2,
          draw: 7,
          goalDiff: 67,
        },
      ])
    );
    const openligadb = createOpenLigaDB({
      baseURL: "https://openliga.local/",
      fetch: mockFetch,
    });

    const result = await openligadb.getbltable({
      leagueShortcut: "bl 1",
      leagueSeason: 2024,
    });

    expect(result[0]).toEqual(
      expect.objectContaining({
        teamName: "FC Bayern Muenchen",
        points: 82,
        goalDiff: 67,
      })
    );
    expect(openligadb.get.getbltable).toBe(openligadb.getbltable);
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://openliga.local/getbltable/bl%201/2024");
    expect(init.method).toBe("GET");
    expect(init.headers).toEqual({});
  });

  it("exposes group table and goal getter routes", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(
        jsonResponse([
          {
            goalGetterId: 123,
            goalGetterName: "Harry Kane",
            goalCount: 36,
          },
        ])
      );
    const openligadb = createOpenLigaDB({
      baseURL: "https://openliga.local",
      fetch: mockFetch,
    });

    await openligadb.getgrouptable({
      leagueShortcut: "bl1",
      leagueSeason: 2024,
    });
    const scorers = await openligadb.getgoalgetters({
      leagueShortcut: "bl1",
      leagueSeason: 2024,
    });

    expect(scorers).toEqual([
      {
        goalGetterId: 123,
        goalGetterName: "Harry Kane",
        goalCount: 36,
      },
    ]);
    expect(openligadb.get.getgrouptable).toBe(openligadb.getgrouptable);
    expect(openligadb.get.getgoalgetters).toBe(openligadb.getgoalgetters);
    expect(mockFetch.mock.calls.map(([url]) => url)).toEqual([
      "https://openliga.local/getgrouptable/bl1/2024",
      "https://openliga.local/getgoalgetters/bl1/2024",
    ]);
  });

  it("preserves text error bodies", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response("league not found", {
        status: 404,
        headers: { "Content-Type": "text/plain" },
      })
    );
    const openligadb = createOpenLigaDB({ fetch: mockFetch });

    await expect(
      openligadb.getbltable({ leagueShortcut: "missing", leagueSeason: 1900 })
    ).rejects.toMatchObject({
      name: "OpenLigaDBError",
      status: 404,
      body: "league not found",
    } satisfies Partial<OpenLigaDBError>);
  });
});
