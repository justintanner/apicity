import { describe, expect, it } from "vitest";

import {
  OpenLigaDBBlTableResponseSchema,
  OpenLigaDBGoalGettersResponseSchema,
  OpenLigaDBLeagueSeasonRequestSchema,
} from "../../packages/provider/openligadb/src/zod";

describe("OpenLigaDB schemas", () => {
  it("requires a non-empty shortcut and integer season", () => {
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
      OpenLigaDBLeagueSeasonRequestSchema.safeParse({
        leagueShortcut: "bl1",
        leagueSeason: 2024.5,
      }).success
    ).toBe(false);
  });

  it("parses table response examples with nullable names", () => {
    const parsed = OpenLigaDBBlTableResponseSchema.safeParse([
      {
        teamInfoId: 40,
        teamName: "FC Bayern Muenchen",
        shortName: "FCB",
        teamIconUrl: null,
        points: 82,
        opponentGoals: 32,
        goals: 99,
        matches: 34,
        won: 25,
        lost: 2,
        draw: 7,
        goalDiff: 67,
      },
    ]);

    expect(parsed.success).toBe(true);
  });

  it("parses goal getter response examples", () => {
    const parsed = OpenLigaDBGoalGettersResponseSchema.safeParse([
      {
        goalGetterId: 123,
        goalGetterName: "Harry Kane",
        goalCount: 36,
      },
    ]);

    expect(parsed.success).toBe(true);
  });
});
