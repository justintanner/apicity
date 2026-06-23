import type { z } from "zod";

import type {
  TheSportsDBEquipmentLookupRequestSchema,
  TheSportsDBLeagueLookupRequestSchema,
  TheSportsDBSearchEventsRequestSchema,
  TheSportsDBSearchFilenameRequestSchema,
  TheSportsDBSearchPlayersRequestSchema,
  TheSportsDBSearchTeamsRequestSchema,
  TheSportsDBSearchVenuesRequestSchema,
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
  idESPN?: TheSportsDBField;
  idAPIfootball?: TheSportsDBField;
  intLoved?: TheSportsDBField;
  strTeam?: string | null;
  strTeamAlternate?: string | null;
  strTeamShort?: string | null;
  intFormedYear?: TheSportsDBField;
  idLeague?: TheSportsDBField;
  strLeague?: string | null;
  strLeague2?: string | null;
  idLeague2?: TheSportsDBField;
  strLeague3?: string | null;
  idLeague3?: TheSportsDBField;
  strLeague4?: string | null;
  idLeague4?: TheSportsDBField;
  strLeague5?: string | null;
  idLeague5?: TheSportsDBField;
  strLeague6?: string | null;
  idLeague6?: TheSportsDBField;
  idVenue?: TheSportsDBField;
  strVenue?: string | null;
  strStadium?: string | null;
  strStadiumThumb?: string | null;
  strStadiumDescription?: string | null;
  strStadiumLocation?: string | null;
  intStadiumCapacity?: TheSportsDBField;
  strSport?: string | null;
  strCountry?: string | null;
  strKeywords?: string | null;
  strRSS?: string | null;
  strWebsite?: string | null;
  strFacebook?: string | null;
  strTwitter?: string | null;
  strInstagram?: string | null;
  strYoutube?: string | null;
  strDescriptionEN?: string | null;
  strGender?: string | null;
  strBadge?: string | null;
  strLogo?: string | null;
  strTeamBadge?: string | null;
  strTeamJersey?: string | null;
  strTeamLogo?: string | null;
  strFanart1?: string | null;
  strFanart2?: string | null;
  strFanart3?: string | null;
  strFanart4?: string | null;
  strTeamFanart1?: string | null;
  strTeamFanart2?: string | null;
  strTeamFanart3?: string | null;
  strTeamFanart4?: string | null;
  strBanner?: string | null;
  strTeamBanner?: string | null;
  strEquipment?: string | null;
  strLocked?: string | null;
}

export interface TheSportsDBTeamLookupResponse extends TheSportsDBRecord {
  teams: TheSportsDBTeam[] | null;
}

export interface TheSportsDBTeamsResponse extends TheSportsDBRecord {
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
  idDupe?: TheSportsDBField;
  strVenue?: string | null;
  intLoved?: TheSportsDBField;
  strVenueAlternate?: string | null;
  strVenueSponsor?: string | null;
  strSport?: string | null;
  strDescriptionEN?: string | null;
  strArchitect?: string | null;
  intCapacity?: TheSportsDBField;
  strCost?: string | null;
  strCountry?: string | null;
  strLocation?: string | null;
  strTimezone?: string | null;
  intFormedYear?: TheSportsDBField;
  strThumb?: string | null;
  strLogo?: string | null;
  strMap?: string | null;
  strWebsite?: string | null;
  strFacebook?: string | null;
  strTwitter?: string | null;
  strInstagram?: string | null;
  strYoutube?: string | null;
  strFanart1?: string | null;
  strFanart2?: string | null;
  strFanart3?: string | null;
  strFanart4?: string | null;
  strLocked?: string | null;
}

export interface TheSportsDBVenueLookupResponse extends TheSportsDBRecord {
  venues: TheSportsDBVenue[] | null;
}

export interface TheSportsDBVenuesResponse extends TheSportsDBRecord {
  venues: TheSportsDBVenue[] | null;
}

export interface TheSportsDBEvent extends TheSportsDBRecord {
  idEvent?: TheSportsDBField;
  idAPIfootball?: TheSportsDBField;
  strTimestamp?: string | null;
  dateEvent?: string | null;
  dateEventLocal?: string | null;
  strTime?: string | null;
  strTimeLocal?: string | null;
  strEvent?: string | null;
  strEventAlternate?: string | null;
  strFilename?: string | null;
  strSport?: string | null;
  idLeague?: TheSportsDBField;
  strLeague?: string | null;
  strLeagueBadge?: string | null;
  strSeason?: string | null;
  strDescriptionEN?: string | null;
  strHomeTeam?: string | null;
  strAwayTeam?: string | null;
  idHomeTeam?: TheSportsDBField;
  idAwayTeam?: TheSportsDBField;
  intHomeScore?: TheSportsDBField;
  intAwayScore?: TheSportsDBField;
  intRound?: TheSportsDBField;
  intSpectators?: TheSportsDBField;
  strVenue?: string | null;
  strCountry?: string | null;
  strCity?: string | null;
  strPoster?: string | null;
  strSquare?: string | null;
  strFanart?: string | null;
  strThumb?: string | null;
  strBanner?: string | null;
  strMap?: string | null;
  strTweet1?: string | null;
  strVideo?: string | null;
  strStatus?: string | null;
  strPostponed?: string | null;
  strLocked?: string | null;
}

export interface TheSportsDBEventsResponse extends TheSportsDBRecord {
  event: TheSportsDBEvent[] | null;
}

export interface TheSportsDBFilenameSearchResponse extends TheSportsDBRecord {
  event: TheSportsDBEvent[] | null;
}

export interface TheSportsDBPlayer extends TheSportsDBRecord {
  idPlayer?: TheSportsDBField;
  idTeam?: TheSportsDBField;
  strPlayer?: string | null;
  strTeam?: string | null;
  strSport?: string | null;
  strThumb?: string | null;
  strCutout?: string | null;
  strRender?: string | null;
  strNationality?: string | null;
  dateBorn?: string | null;
  dateSigned?: string | null;
  strNumber?: string | null;
  strStatus?: string | null;
  strGender?: string | null;
  strPosition?: string | null;
  strHeight?: string | null;
  strWeight?: string | null;
  strBirthLocation?: string | null;
  strDescriptionEN?: string | null;
  strWebsite?: string | null;
  strFacebook?: string | null;
  strTwitter?: string | null;
  strInstagram?: string | null;
  strYoutube?: string | null;
  strSigning?: string | null;
  strWage?: string | null;
  strOutfitter?: string | null;
  strKit?: string | null;
  strSide?: string | null;
  strAgent?: string | null;
  strBanner?: string | null;
  strFanart1?: string | null;
  strFanart2?: string | null;
  strFanart3?: string | null;
  strFanart4?: string | null;
  strLocked?: string | null;
  relevance?: TheSportsDBField;
}

export interface TheSportsDBPlayersResponse extends TheSportsDBRecord {
  player: TheSportsDBPlayer[] | null;
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

export interface TheSportsDBSearchTeamsRequest {
  team: string;
}

export interface TheSportsDBSearchEventsRequest {
  event: string;
  season?: string;
  date?: string;
  filename?: string;
}

export interface TheSportsDBSearchFilenameRequest {
  filename: string;
  season?: string;
}

export interface TheSportsDBSearchPlayersRequest {
  player: string;
}

export interface TheSportsDBSearchVenuesRequest {
  venue: string;
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

export interface TheSportsDBSearchTeamsMethod {
  (
    req: TheSportsDBSearchTeamsRequest,
    signal?: AbortSignal
  ): Promise<TheSportsDBTeamsResponse>;
  schema: z.ZodType<z.infer<typeof TheSportsDBSearchTeamsRequestSchema>>;
}

export interface TheSportsDBSearchEventsMethod {
  (
    req: TheSportsDBSearchEventsRequest,
    signal?: AbortSignal
  ): Promise<TheSportsDBEventsResponse>;
  schema: z.ZodType<z.infer<typeof TheSportsDBSearchEventsRequestSchema>>;
}

export interface TheSportsDBSearchFilenameMethod {
  (
    req: TheSportsDBSearchFilenameRequest,
    signal?: AbortSignal
  ): Promise<TheSportsDBFilenameSearchResponse>;
  schema: z.ZodType<z.infer<typeof TheSportsDBSearchFilenameRequestSchema>>;
}

export interface TheSportsDBSearchPlayersMethod {
  (
    req: TheSportsDBSearchPlayersRequest,
    signal?: AbortSignal
  ): Promise<TheSportsDBPlayersResponse>;
  schema: z.ZodType<z.infer<typeof TheSportsDBSearchPlayersRequestSchema>>;
}

export interface TheSportsDBSearchVenuesMethod {
  (
    req: TheSportsDBSearchVenuesRequest,
    signal?: AbortSignal
  ): Promise<TheSportsDBVenuesResponse>;
  schema: z.ZodType<z.infer<typeof TheSportsDBSearchVenuesRequestSchema>>;
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
  searchTeams: TheSportsDBSearchTeamsMethod;
  searchEvents: TheSportsDBSearchEventsMethod;
  searchFilename: TheSportsDBSearchFilenameMethod;
  searchPlayers: TheSportsDBSearchPlayersMethod;
  searchVenues: TheSportsDBSearchVenuesMethod;
}

export interface TheSportsDBGetNamespace {
  v1: TheSportsDBV1Namespace;
}

export interface TheSportsDBProvider {
  v1: TheSportsDBV1Namespace;
  get: TheSportsDBGetNamespace;
}
