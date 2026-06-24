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

export type OpenLigaDBRequestMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "HEAD";

export type OpenLigaDBPathSegment = string | number | boolean;

export type OpenLigaDBQueryValue =
  | string
  | number
  | boolean
  | readonly (string | number | boolean)[]
  | null
  | undefined;

export interface OpenLigaDBRequestOptions {
  method?: OpenLigaDBRequestMethod;
  path: string | readonly OpenLigaDBPathSegment[];
  query?: Record<string, OpenLigaDBQueryValue>;
  body?: unknown;
  signal?: AbortSignal;
  emptyResponse?: unknown;
}

export interface OpenLigaDBRequestFunction {
  <T = unknown>(options: OpenLigaDBRequestOptions): Promise<T>;
}

export type OpenLigaDBJsonObject = Record<string, unknown>;

export type OpenLigaDBSwaggerDocument = OpenLigaDBJsonObject;

export interface OpenLigaDBSwaggerJsonMethod {
  (signal?: AbortSignal): Promise<OpenLigaDBSwaggerDocument>;
  schema?: undefined;
}

export interface OpenLigaDBSwaggerV1Namespace {
  swaggerJson: OpenLigaDBSwaggerJsonMethod;
}

export interface OpenLigaDBSwaggerNamespace {
  v1: OpenLigaDBSwaggerV1Namespace;
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

export interface OpenLigaDBSeasonRequest {
  season: number;
}

export interface OpenLigaDBLeagueSeasonRequest {
  leagueShortcut: string;
  leagueSeason: number;
}

export interface OpenLigaDBCurrentGroupRequest {
  leagueShortcut: string;
}

export interface OpenLigaDBLastChangeDateRequest {
  leagueShortcut: string;
  leagueSeason: number;
  groupOrderId: number;
}

export interface OpenLigaDBResultInfosRequest {
  leagueId: number;
}

export interface OpenLigaDBMatchByIdRequest {
  matchId: number;
}

export interface OpenLigaDBLeagueTeamRequest {
  leagueId: number;
  teamId: number;
}

export interface OpenLigaDBLeagueShortcutRequest {
  leagueShortcut: string;
}

export interface OpenLigaDBTeamWindowRequest {
  teamFilterstring: string;
  weekCountPast: number;
  weekCountFuture: number;
}

export interface OpenLigaDBTeamIdWindowRequest {
  teamId: number;
  weekCountPast: number;
  weekCountFuture: number;
}

export type OpenLigaDBAvailableSportsResponse = OpenLigaDBSport[];

export type OpenLigaDBAvailableLeaguesResponse = OpenLigaDBLeague[];

export type OpenLigaDBAvailableGroupsResponse = OpenLigaDBGroup[];

export type OpenLigaDBCurrentGroupResponse = OpenLigaDBGroup;

export type OpenLigaDBLastChangeDateResponse = string;

export type OpenLigaDBResultInfosResponse = OpenLigaDBResultInfo;

export type OpenLigaDBAvailableTeamsResponse = OpenLigaDBTeam[];

export type OpenLigaDBMatchByIdResponse = OpenLigaDBMatch;

export type OpenLigaDBNextMatchByLeagueTeamRequest =
  OpenLigaDBLeagueTeamRequest;

export type OpenLigaDBNextMatchByLeagueTeamResponse = OpenLigaDBMatch;

export type OpenLigaDBNextMatchByLeagueShortcutRequest =
  OpenLigaDBLeagueShortcutRequest;

export type OpenLigaDBNextMatchByLeagueShortcutResponse = OpenLigaDBMatch;

export type OpenLigaDBLastMatchByLeagueShortcutRequest =
  OpenLigaDBLeagueShortcutRequest;

export type OpenLigaDBLastMatchByLeagueShortcutResponse = OpenLigaDBMatch;

export type OpenLigaDBLastMatchByLeagueTeamRequest =
  OpenLigaDBLeagueTeamRequest;

export type OpenLigaDBLastMatchByLeagueTeamResponse = OpenLigaDBMatch;

export type OpenLigaDBMatchesByLeagueSeasonRequest =
  OpenLigaDBLeagueSeasonRequest;

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

export type OpenLigaDBMatchesByTeamRequest = OpenLigaDBTeamWindowRequest;

export type OpenLigaDBMatchesByTeamResponse = OpenLigaDBMatch[];

export type OpenLigaDBMatchesByTeamIdRequest = OpenLigaDBTeamIdWindowRequest;

export type OpenLigaDBMatchesByTeamIdResponse = OpenLigaDBMatch[];

export type OpenLigaDBBlTableResponse = OpenLigaDBBlTableTeam[];

export type OpenLigaDBGoalGettersResponse = OpenLigaDBGoalGetter[];

export interface OpenLigaDBNoRequestMethod<Response> {
  (signal?: AbortSignal): Promise<Response>;
  schema?: undefined;
}

export interface OpenLigaDBMethod<Request, Response> {
  (req: Request, signal?: AbortSignal): Promise<Response>;
  schema: z.ZodType<Request>;
}

export type OpenLigaDBAvailableSportsMethod =
  OpenLigaDBNoRequestMethod<OpenLigaDBAvailableSportsResponse>;

export interface OpenLigaDBAvailableLeaguesMethod extends OpenLigaDBNoRequestMethod<OpenLigaDBAvailableLeaguesResponse> {
  bySeason: OpenLigaDBMethod<
    OpenLigaDBSeasonRequest,
    OpenLigaDBAvailableLeaguesResponse
  >;
}

export type OpenLigaDBAvailableGroupsMethod = OpenLigaDBMethod<
  OpenLigaDBLeagueSeasonRequest,
  OpenLigaDBAvailableGroupsResponse
>;

export type OpenLigaDBCurrentGroupMethod = OpenLigaDBMethod<
  OpenLigaDBCurrentGroupRequest,
  OpenLigaDBCurrentGroupResponse
>;

export type OpenLigaDBLastChangeDateMethod = OpenLigaDBMethod<
  OpenLigaDBLastChangeDateRequest,
  OpenLigaDBLastChangeDateResponse
>;

export type OpenLigaDBResultInfosMethod = OpenLigaDBMethod<
  OpenLigaDBResultInfosRequest,
  OpenLigaDBResultInfosResponse
>;

export type OpenLigaDBAvailableTeamsMethod = OpenLigaDBMethod<
  OpenLigaDBLeagueSeasonRequest,
  OpenLigaDBAvailableTeamsResponse
>;

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

export type OpenLigaDBNextMatchByLeagueTeamMethod = OpenLigaDBMethod<
  OpenLigaDBNextMatchByLeagueTeamRequest,
  OpenLigaDBNextMatchByLeagueTeamResponse
>;

export type OpenLigaDBNextMatchByLeagueShortcutMethod = OpenLigaDBMethod<
  OpenLigaDBNextMatchByLeagueShortcutRequest,
  OpenLigaDBNextMatchByLeagueShortcutResponse
>;

export type OpenLigaDBLastMatchByLeagueShortcutMethod = OpenLigaDBMethod<
  OpenLigaDBLastMatchByLeagueShortcutRequest,
  OpenLigaDBLastMatchByLeagueShortcutResponse
>;

export type OpenLigaDBLastMatchByLeagueTeamMethod = OpenLigaDBMethod<
  OpenLigaDBLastMatchByLeagueTeamRequest,
  OpenLigaDBLastMatchByLeagueTeamResponse
>;

export type OpenLigaDBMatchesByTeamMethod = OpenLigaDBMethod<
  OpenLigaDBMatchesByTeamRequest,
  OpenLigaDBMatchesByTeamResponse
>;

export type OpenLigaDBMatchesByTeamIdMethod = OpenLigaDBMethod<
  OpenLigaDBMatchesByTeamIdRequest,
  OpenLigaDBMatchesByTeamIdResponse
>;

export type OpenLigaDBBlTableMethod = OpenLigaDBMethod<
  OpenLigaDBLeagueSeasonRequest,
  OpenLigaDBBlTableResponse
>;

export type OpenLigaDBGoalGettersMethod = OpenLigaDBMethod<
  OpenLigaDBLeagueSeasonRequest,
  OpenLigaDBGoalGettersResponse
>;

export interface OpenLigaDBGetMatchdataNamespace {
  byId: OpenLigaDBMatchByIdMethod;
  byLeagueSeason: OpenLigaDBMatchesByLeagueSeasonMethod;
  byLeagueSeasonGroup: OpenLigaDBMatchesByLeagueSeasonGroupMethod;
  byLeagueSeasonTeam: OpenLigaDBMatchesByLeagueSeasonTeamMethod;
  byTeams: OpenLigaDBMatchesByTeamsMethod;
}

export interface OpenLigaDBGetNamespace {
  getbltable: OpenLigaDBBlTableMethod;
  getgrouptable: OpenLigaDBBlTableMethod;
  getgoalgetters: OpenLigaDBGoalGettersMethod;
}

export interface OpenLigaDBProvider {
  swagger: OpenLigaDBSwaggerNamespace;
  getavailablesports: OpenLigaDBAvailableSportsMethod;
  getavailableleagues: OpenLigaDBAvailableLeaguesMethod;
  getavailablegroups: OpenLigaDBAvailableGroupsMethod;
  getcurrentgroup: OpenLigaDBCurrentGroupMethod;
  getlastchangedate: OpenLigaDBLastChangeDateMethod;
  getresultinfos: OpenLigaDBResultInfosMethod;
  getavailableteams: OpenLigaDBAvailableTeamsMethod;
  getbltable: OpenLigaDBBlTableMethod;
  getgrouptable: OpenLigaDBBlTableMethod;
  getgoalgetters: OpenLigaDBGoalGettersMethod;
  getnextmatchbyleagueteam: OpenLigaDBNextMatchByLeagueTeamMethod;
  getnextmatchbyleagueshortcut: OpenLigaDBNextMatchByLeagueShortcutMethod;
  getlastmatchbyleagueshortcut: OpenLigaDBLastMatchByLeagueShortcutMethod;
  getlastmatchbyleagueteam: OpenLigaDBLastMatchByLeagueTeamMethod;
  getmatchesbyteam: OpenLigaDBMatchesByTeamMethod;
  getmatchesbyteamid: OpenLigaDBMatchesByTeamIdMethod;
  get: OpenLigaDBGetNamespace;
  getmatchdata: OpenLigaDBGetMatchdataNamespace;
}
