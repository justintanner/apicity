import type { z } from "zod";

export class OpenLigaDBError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "OpenLigaDBError";
    this.status = status;
    this.body = body ?? null;
  }
}

export interface OpenLigaDBOptions {
  baseURL?: string;
  timeout?: number;
  fetch?: typeof fetch;
}

export interface OpenLigaDBSport {
  sportId: number;
  sportName: string | null;
}

export interface OpenLigaDBLeague {
  leagueId: number;
  leagueName: string | null;
  leagueShortcut: string | null;
  leagueSeason: string | null;
  sport: OpenLigaDBSport | null;
}

export interface OpenLigaDBGroup {
  groupName: string | null;
  groupOrderID: number;
  groupID: number;
}

export interface OpenLigaDBTeam {
  teamId: number;
  teamName: string | null;
  shortName: string | null;
  teamIconUrl: string | null;
  teamGroupName: string | null;
}

export interface OpenLigaDBMatchResult {
  resultID: number;
  resultName: string | null;
  pointsTeam1: number | null;
  pointsTeam2: number | null;
  resultOrderID: number;
  resultTypeID: number;
  resultDescription: string | null;
}

export interface OpenLigaDBGoal {
  goalID: number;
  scoreTeam1: number | null;
  scoreTeam2: number | null;
  matchMinute: number | null;
  goalGetterID: number;
  goalGetterName: string | null;
  isPenalty: boolean | null;
  isOwnGoal: boolean | null;
  isOvertime: boolean | null;
  comment: string | null;
}

export interface OpenLigaDBLocation {
  locationID: number;
  locationCity: string | null;
  locationStadium: string | null;
}

export interface OpenLigaDBGlobalResultInfo {
  id: number;
  name: string | null;
}

export interface OpenLigaDBResultInfo {
  id: number;
  name: string | null;
  description: string | null;
  orderId: number | null;
  globalResultInfo: OpenLigaDBGlobalResultInfo | null;
}

export interface OpenLigaDBBlTableTeam {
  teamInfoId: number;
  teamName: string | null;
  shortName: string | null;
  teamIconUrl: string | null;
  points: number;
  opponentGoals: number;
  goals: number;
  matches: number;
  won: number;
  lost: number;
  draw: number;
  goalDiff: number;
}

export interface OpenLigaDBGoalGetter {
  goalGetterId: number;
  goalGetterName: string | null;
  goalCount: number;
}

export interface OpenLigaDBMatch {
  matchID: number;
  matchDateTime: string | null;
  timeZoneID: string | null;
  leagueId: number;
  leagueName: string | null;
  leagueSeason: number;
  leagueShortcut: string | null;
  matchDateTimeUTC: string | null;
  group: OpenLigaDBGroup | null;
  team1: OpenLigaDBTeam | null;
  team2: OpenLigaDBTeam | null;
  lastUpdateDateTime: string | null;
  matchIsFinished: boolean;
  matchResults: OpenLigaDBMatchResult[] | null;
  goals: OpenLigaDBGoal[] | null;
  location: OpenLigaDBLocation | null;
  numberOfViewers: number | null;
}

export interface OpenLigaDBMatchByIdRequest {
  matchId: number;
}

export type OpenLigaDBMatchByIdResponse = OpenLigaDBMatch;

export interface OpenLigaDBMatchesByLeagueSeasonRequest {
  leagueShortcut: string;
  leagueSeason: number;
}

export type OpenLigaDBMatchesByLeagueSeasonResponse = OpenLigaDBMatch[];

export interface OpenLigaDBMatchesByLeagueSeasonGroupRequest extends OpenLigaDBMatchesByLeagueSeasonRequest {
  groupOrderId: number;
}

export type OpenLigaDBMatchesByLeagueSeasonGroupResponse = OpenLigaDBMatch[];

export interface OpenLigaDBMatchesByLeagueSeasonTeamRequest extends OpenLigaDBMatchesByLeagueSeasonRequest {
  teamFilterstring: string;
}

export type OpenLigaDBMatchesByLeagueSeasonTeamResponse = OpenLigaDBMatch[];

export interface OpenLigaDBMatchesByTeamsRequest {
  teamId1: number;
  teamId2: number;
}

export type OpenLigaDBMatchesByTeamsResponse = OpenLigaDBMatch[];

export interface OpenLigaDBMethod<Request, Response> {
  (req: Request, signal?: AbortSignal): Promise<Response>;
  schema: z.ZodType<Request>;
}

export type OpenLigaDBMatchByIdMethod = OpenLigaDBMethod<
  OpenLigaDBMatchByIdRequest,
  OpenLigaDBMatchByIdResponse
>;

export type OpenLigaDBMatchesByLeagueSeasonMethod = OpenLigaDBMethod<
  OpenLigaDBMatchesByLeagueSeasonRequest,
  OpenLigaDBMatchesByLeagueSeasonResponse
>;

export type OpenLigaDBMatchesByLeagueSeasonGroupMethod = OpenLigaDBMethod<
  OpenLigaDBMatchesByLeagueSeasonGroupRequest,
  OpenLigaDBMatchesByLeagueSeasonGroupResponse
>;

export type OpenLigaDBMatchesByLeagueSeasonTeamMethod = OpenLigaDBMethod<
  OpenLigaDBMatchesByLeagueSeasonTeamRequest,
  OpenLigaDBMatchesByLeagueSeasonTeamResponse
>;

export type OpenLigaDBMatchesByTeamsMethod = OpenLigaDBMethod<
  OpenLigaDBMatchesByTeamsRequest,
  OpenLigaDBMatchesByTeamsResponse
>;

export interface OpenLigaDBGetMatchdataNamespace {
  byId: OpenLigaDBMatchByIdMethod;
  byLeagueSeason: OpenLigaDBMatchesByLeagueSeasonMethod;
  byLeagueSeasonGroup: OpenLigaDBMatchesByLeagueSeasonGroupMethod;
  byLeagueSeasonTeam: OpenLigaDBMatchesByLeagueSeasonTeamMethod;
  byTeams: OpenLigaDBMatchesByTeamsMethod;
}

export interface OpenLigaDBProvider {
  getmatchdata: OpenLigaDBGetMatchdataNamespace;
}
