import type { z } from "zod";

import type {
  TheSportsDBEquipmentLookupRequestSchema,
  TheSportsDBLeagueLookupRequestSchema,
  TheSportsDBTableLookupRequestSchema,
  TheSportsDBTeamLookupRequestSchema,
  TheSportsDBVenueLookupRequestSchema,
} from "./zod";

export type { TheSportsDBOptions } from "./zod";

export class TheSportsDBError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "TheSportsDBError";
    this.status = status;
    this.body = body ?? null;
  }
}

export interface TheSportsDBRecord {
  [key: string]: unknown;
}

export type TheSportsDBId = string | number;
export type TheSportsDBField = string | number | null;

export interface TheSportsDBEndpointMethod<TResponse> {
  (signal?: AbortSignal): Promise<TResponse>;
  schema: undefined;
}

export interface TheSportsDBSport extends TheSportsDBRecord {
  idSport?: string;
  strSport?: string;
  strFormat?: string;
  strSportThumb?: string;
  strSportThumbGreen?: string;
  strSportDescription?: string;
}

export interface TheSportsDBSportsResponse extends TheSportsDBRecord {
  sports: TheSportsDBSport[] | null;
}

export interface TheSportsDBCountry extends TheSportsDBRecord {
  name_en?: string;
}

export interface TheSportsDBCountriesResponse extends TheSportsDBRecord {
  countries: TheSportsDBCountry[] | null;
}

export interface TheSportsDBLeague extends TheSportsDBRecord {
  idLeague?: TheSportsDBField;
  strLeague?: string | null;
  strSport?: string | null;
  strLeagueAlternate?: string | null;
  strCountry?: string | null;
  strBadge?: string | null;
  strLogo?: string | null;
  strPoster?: string | null;
  strTrophy?: string | null;
  strFanart1?: string | null;
  strFanart2?: string | null;
  strFanart3?: string | null;
  strFanart4?: string | null;
}

export interface TheSportsDBLeaguesResponse extends TheSportsDBRecord {
  leagues: TheSportsDBLeague[] | null;
}

export interface TheSportsDBLeagueLookupResponse extends TheSportsDBRecord {
  leagues: TheSportsDBLeague[] | null;
}

export interface TheSportsDBTableRow extends TheSportsDBRecord {
  idStanding?: TheSportsDBField;
  idTeam?: TheSportsDBField;
  idLeague?: TheSportsDBField;
  strTeam?: string | null;
  strLeague?: string | null;
  strSeason?: string | null;
  intRank?: TheSportsDBField;
  intPlayed?: TheSportsDBField;
  intWin?: TheSportsDBField;
  intDraw?: TheSportsDBField;
  intLoss?: TheSportsDBField;
  intGoalsFor?: TheSportsDBField;
  intGoalsAgainst?: TheSportsDBField;
  intGoalDifference?: TheSportsDBField;
  intPoints?: TheSportsDBField;
  strDescription?: string | null;
}

export interface TheSportsDBTableLookupResponse extends TheSportsDBRecord {
  table: TheSportsDBTableRow[] | null;
}

export interface TheSportsDBTeam extends TheSportsDBRecord {
  idTeam?: TheSportsDBField;
  strTeam?: string | null;
  idLeague?: TheSportsDBField;
  strLeague?: string | null;
  idVenue?: TheSportsDBField;
  strVenue?: string | null;
  strStadium?: string | null;
  strSport?: string | null;
  strCountry?: string | null;
  strBadge?: string | null;
  strLogo?: string | null;
  strFanart1?: string | null;
  strFanart2?: string | null;
  strFanart3?: string | null;
  strFanart4?: string | null;
  strBanner?: string | null;
  strEquipment?: string | null;
}

export interface TheSportsDBTeamLookupResponse extends TheSportsDBRecord {
  teams: TheSportsDBTeam[] | null;
}

export interface TheSportsDBEquipment extends TheSportsDBRecord {
  idEquipment?: TheSportsDBField;
  idTeam?: TheSportsDBField;
  strTeam?: string | null;
  strSeason?: string | null;
  strEquipment?: string | null;
  strType?: string | null;
  strUsername?: string | null;
}

export interface TheSportsDBEquipmentLookupResponse extends TheSportsDBRecord {
  equipment: TheSportsDBEquipment[] | null;
}

export interface TheSportsDBVenue extends TheSportsDBRecord {
  idVenue?: TheSportsDBField;
  strVenue?: string | null;
  strSport?: string | null;
  strCountry?: string | null;
  strLocation?: string | null;
  strThumb?: string | null;
  strLogo?: string | null;
  strFanart1?: string | null;
  strFanart2?: string | null;
  strFanart3?: string | null;
  strFanart4?: string | null;
}

export interface TheSportsDBVenueLookupResponse extends TheSportsDBRecord {
  venues: TheSportsDBVenue[] | null;
}

export interface TheSportsDBLeagueLookupRequest {
  idLeague: TheSportsDBId;
}

export interface TheSportsDBTableLookupRequest {
  idLeague: TheSportsDBId;
  season?: string;
}

export interface TheSportsDBTeamLookupRequest {
  idTeam: TheSportsDBId;
}

export interface TheSportsDBEquipmentLookupRequest {
  idTeam: TheSportsDBId;
}

export interface TheSportsDBVenueLookupRequest {
  idVenue: TheSportsDBId;
}

export interface TheSportsDBLeagueLookupMethod {
  (
    req: TheSportsDBLeagueLookupRequest,
    signal?: AbortSignal
  ): Promise<TheSportsDBLeagueLookupResponse>;
  schema: z.ZodType<z.infer<typeof TheSportsDBLeagueLookupRequestSchema>>;
}

export interface TheSportsDBTableLookupMethod {
  (
    req: TheSportsDBTableLookupRequest,
    signal?: AbortSignal
  ): Promise<TheSportsDBTableLookupResponse>;
  schema: z.ZodType<z.infer<typeof TheSportsDBTableLookupRequestSchema>>;
}

export interface TheSportsDBTeamLookupMethod {
  (
    req: TheSportsDBTeamLookupRequest,
    signal?: AbortSignal
  ): Promise<TheSportsDBTeamLookupResponse>;
  schema: z.ZodType<z.infer<typeof TheSportsDBTeamLookupRequestSchema>>;
}

export interface TheSportsDBEquipmentLookupMethod {
  (
    req: TheSportsDBEquipmentLookupRequest,
    signal?: AbortSignal
  ): Promise<TheSportsDBEquipmentLookupResponse>;
  schema: z.ZodType<z.infer<typeof TheSportsDBEquipmentLookupRequestSchema>>;
}

export interface TheSportsDBVenueLookupMethod {
  (
    req: TheSportsDBVenueLookupRequest,
    signal?: AbortSignal
  ): Promise<TheSportsDBVenueLookupResponse>;
  schema: z.ZodType<z.infer<typeof TheSportsDBVenueLookupRequestSchema>>;
}

export type TheSportsDBAllSportsMethod =
  TheSportsDBEndpointMethod<TheSportsDBSportsResponse>;
export type TheSportsDBAllCountriesMethod =
  TheSportsDBEndpointMethod<TheSportsDBCountriesResponse>;
export type TheSportsDBAllLeaguesMethod =
  TheSportsDBEndpointMethod<TheSportsDBLeaguesResponse>;

export interface TheSportsDBV1LookupNamespace {
  league: TheSportsDBLeagueLookupMethod;
  table: TheSportsDBTableLookupMethod;
  team: TheSportsDBTeamLookupMethod;
  equipment: TheSportsDBEquipmentLookupMethod;
  venue: TheSportsDBVenueLookupMethod;
}

export interface TheSportsDBV1Namespace {
  allSports: TheSportsDBAllSportsMethod;
  allCountries: TheSportsDBAllCountriesMethod;
  allLeagues: TheSportsDBAllLeaguesMethod;
  lookup: TheSportsDBV1LookupNamespace;
}

export interface TheSportsDBGetNamespace {
  v1: TheSportsDBV1Namespace;
}

export interface TheSportsDBProvider {
  v1: TheSportsDBV1Namespace;
  get: TheSportsDBGetNamespace;
}
