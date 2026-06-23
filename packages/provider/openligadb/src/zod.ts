import { z } from "zod";
import type {
  OpenLigaDBBlTableTeam,
  OpenLigaDBGoal,
  OpenLigaDBGoalGetter,
  OpenLigaDBGroup,
  OpenLigaDBLeague,
  OpenLigaDBLocation,
  OpenLigaDBMatch,
  OpenLigaDBMatchByIdRequest,
  OpenLigaDBMatchResult,
  OpenLigaDBMatchesByLeagueSeasonGroupRequest,
  OpenLigaDBMatchesByLeagueSeasonRequest,
  OpenLigaDBMatchesByLeagueSeasonTeamRequest,
  OpenLigaDBMatchesByTeamsRequest,
  OpenLigaDBOptions,
  OpenLigaDBResultInfo,
  OpenLigaDBSport,
  OpenLigaDBSwaggerDocument,
  OpenLigaDBTeam,
} from "./types";

const intPathParam = z.number().int();
const nonEmptyPathString = z.string().min(1);
const nullableString = z.string().nullable();
const nullableInt = z.number().int().nullable();

export const OpenLigaDBOptionsSchema: z.ZodType<OpenLigaDBOptions> = z.object({
  baseURL: z.string().optional(),
  timeout: z.number().optional(),
  fetch: z.custom<typeof fetch>().optional(),
});

export const OpenLigaDBSwaggerDocumentSchema: z.ZodType<OpenLigaDBSwaggerDocument> =
  z.record(z.string(), z.unknown());

export const OpenLigaDBSportSchema: z.ZodType<OpenLigaDBSport> = z.object({
  sportId: z.number().int(),
  sportName: nullableString,
});

export const OpenLigaDBLeagueSchema: z.ZodType<OpenLigaDBLeague> = z.object({
  leagueId: z.number().int(),
  leagueName: nullableString,
  leagueShortcut: nullableString,
  leagueSeason: nullableString,
  sport: OpenLigaDBSportSchema.nullable(),
});

export const OpenLigaDBGroupSchema: z.ZodType<OpenLigaDBGroup> = z.object({
  groupName: nullableString,
  groupOrderID: z.number().int(),
  groupID: z.number().int(),
});

export const OpenLigaDBTeamSchema: z.ZodType<OpenLigaDBTeam> = z.object({
  teamId: z.number().int(),
  teamName: nullableString,
  shortName: nullableString,
  teamIconUrl: nullableString,
  teamGroupName: nullableString,
});

export const OpenLigaDBMatchResultSchema: z.ZodType<OpenLigaDBMatchResult> =
  z.object({
    resultID: z.number().int(),
    resultName: nullableString,
    pointsTeam1: nullableInt,
    pointsTeam2: nullableInt,
    resultOrderID: z.number().int(),
    resultTypeID: z.number().int(),
    resultDescription: nullableString,
  });

export const OpenLigaDBGoalSchema: z.ZodType<OpenLigaDBGoal> = z.object({
  goalID: z.number().int(),
  scoreTeam1: nullableInt,
  scoreTeam2: nullableInt,
  matchMinute: nullableInt,
  goalGetterID: z.number().int(),
  goalGetterName: nullableString,
  isPenalty: z.boolean().nullable(),
  isOwnGoal: z.boolean().nullable(),
  isOvertime: z.boolean().nullable(),
  comment: nullableString,
});

export const OpenLigaDBLocationSchema: z.ZodType<OpenLigaDBLocation> = z.object(
  {
    locationID: z.number().int(),
    locationCity: nullableString,
    locationStadium: nullableString,
  }
);

export const OpenLigaDBGlobalResultInfoSchema = z.object({
  id: z.number().int(),
  name: nullableString,
});

export const OpenLigaDBResultInfoSchema: z.ZodType<OpenLigaDBResultInfo> =
  z.object({
    id: z.number().int(),
    name: nullableString,
    description: nullableString,
    orderId: nullableInt,
    globalResultInfo: OpenLigaDBGlobalResultInfoSchema.nullable(),
  });

export const OpenLigaDBBlTableTeamSchema: z.ZodType<OpenLigaDBBlTableTeam> =
  z.object({
    teamInfoId: z.number().int(),
    teamName: nullableString,
    shortName: nullableString,
    teamIconUrl: nullableString,
    points: z.number().int(),
    opponentGoals: z.number().int(),
    goals: z.number().int(),
    matches: z.number().int(),
    won: z.number().int(),
    lost: z.number().int(),
    draw: z.number().int(),
    goalDiff: z.number().int(),
  });

export const OpenLigaDBGoalGetterSchema: z.ZodType<OpenLigaDBGoalGetter> =
  z.object({
    goalGetterId: z.number().int(),
    goalGetterName: nullableString,
    goalCount: z.number().int(),
  });

export const OpenLigaDBMatchSchema: z.ZodType<OpenLigaDBMatch> = z.object({
  matchID: z.number().int(),
  matchDateTime: nullableString,
  timeZoneID: nullableString,
  leagueId: z.number().int(),
  leagueName: nullableString,
  leagueSeason: z.number().int(),
  leagueShortcut: nullableString,
  matchDateTimeUTC: nullableString,
  group: OpenLigaDBGroupSchema.nullable(),
  team1: OpenLigaDBTeamSchema.nullable(),
  team2: OpenLigaDBTeamSchema.nullable(),
  lastUpdateDateTime: nullableString,
  matchIsFinished: z.boolean(),
  matchResults: z.array(OpenLigaDBMatchResultSchema).nullable(),
  goals: z.array(OpenLigaDBGoalSchema).nullable(),
  location: OpenLigaDBLocationSchema.nullable(),
  numberOfViewers: nullableInt,
});

export const OpenLigaDBMatchByIdRequestSchema: z.ZodType<OpenLigaDBMatchByIdRequest> =
  z.object({
    matchId: intPathParam,
  });

const openLigaDBMatchesByLeagueSeasonRequestObject = z.object({
  leagueShortcut: nonEmptyPathString,
  leagueSeason: intPathParam,
});

export const OpenLigaDBMatchesByLeagueSeasonRequestSchema: z.ZodType<OpenLigaDBMatchesByLeagueSeasonRequest> =
  openLigaDBMatchesByLeagueSeasonRequestObject;

export const OpenLigaDBMatchesByLeagueSeasonGroupRequestSchema: z.ZodType<OpenLigaDBMatchesByLeagueSeasonGroupRequest> =
  openLigaDBMatchesByLeagueSeasonRequestObject.extend({
    groupOrderId: intPathParam,
  });

export const OpenLigaDBMatchesByLeagueSeasonTeamRequestSchema: z.ZodType<OpenLigaDBMatchesByLeagueSeasonTeamRequest> =
  openLigaDBMatchesByLeagueSeasonRequestObject.extend({
    teamFilterstring: nonEmptyPathString,
  });

export const OpenLigaDBMatchesByTeamsRequestSchema: z.ZodType<OpenLigaDBMatchesByTeamsRequest> =
  z.object({
    teamId1: intPathParam,
    teamId2: intPathParam,
  });
