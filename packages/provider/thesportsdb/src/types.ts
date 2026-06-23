import type { z } from "zod";

import type {
  TheSportsDBEquipmentLookupRequestSchema,
  TheSportsDBEventLookupRequest,
  TheSportsDBEventLookupRequestSchema,
  TheSportsDBEventsDayRequest,
  TheSportsDBEventsHighlightsRequest,
  TheSportsDBEventsSeasonRequest,
  TheSportsDBEventsTVRequest,
  TheSportsDBLeagueEventsRequest,
  TheSportsDBLeagueLookupRequestSchema,
  TheSportsDBLookupAllPlayersRequest,
  TheSportsDBPlayerIdRequestSchema,
  TheSportsDBLeagueScheduleRequestSchema,
  TheSportsDBLeagueSeasonScheduleRequestSchema,
  TheSportsDBLiveScoreLeagueRequestSchema,
  TheSportsDBLiveScoreSportRequestSchema,
  TheSportsDBSearchAllLeaguesRequest,
  TheSportsDBSearchAllSeasonsRequest,
  TheSportsDBSearchAllTeamsRequest,
  TheSportsDBSearchEventsRequestSchema,
  TheSportsDBSearchFilenameRequestSchema,
  TheSportsDBSearchPlayersRequestSchema,
  TheSportsDBSearchTeamsRequestSchema,
  TheSportsDBSearchVenuesRequestSchema,
  TheSportsDBTableLookupRequestSchema,
  TheSportsDBTeamEventsRequest,
  TheSportsDBTeamLookupRequestSchema,
  TheSportsDBTeamScheduleRequestSchema,
  TheSportsDBVenueLookupRequestSchema,
  TheSportsDBVenueScheduleRequestSchema,
} from "./zod";

export type {
  TheSportsDBEventLookupRequest,
  TheSportsDBEventsDayRequest,
  TheSportsDBEventsHighlightsRequest,
  TheSportsDBEventsSeasonRequest,
  TheSportsDBEventsTVRequest,
  TheSportsDBLeagueEventsRequest,
  TheSportsDBLookupAllPlayersRequest,
  TheSportsDBOptions,
  TheSportsDBSearchAllLeaguesRequest,
  TheSportsDBSearchAllSeasonsRequest,
  TheSportsDBSearchAllTeamsRequest,
  TheSportsDBTeamEventsRequest,
} from "./zod";

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

export interface TheSportsDBRequestMethod<TRequest, TResponse> {
  (req: TRequest, signal?: AbortSignal): Promise<TResponse>;
  schema: z.ZodType<TRequest>;
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
  idAPIfootball?: TheSportsDBField;
  idAPIfootballv3?: TheSportsDBField;
  strLeague?: string | null;
  strSport?: string | null;
  strLeagueAlternate?: string | null;
  strCurrentSeason?: string | null;
  intFormedYear?: TheSportsDBField;
  dateFirstEvent?: string | null;
  strGender?: string | null;
  strCountry?: string | null;
  strWebsite?: string | null;
  strBadge?: string | null;
  strLogo?: string | null;
  strPoster?: string | null;
  strTrophy?: string | null;
  strNaming?: string | null;
  strDescriptionEN?: string | null;
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

export interface TheSportsDBSearchAllLeaguesResponse extends TheSportsDBRecord {
  countries: TheSportsDBLeague[] | null;
}

export interface TheSportsDBSeason extends TheSportsDBRecord {
  strSeason?: string;
  strBadge?: string | null;
  strPoster?: string | null;
  strDescriptionEN?: string | null;
}

export interface TheSportsDBSeasonsResponse extends TheSportsDBRecord {
  seasons: TheSportsDBSeason[] | null;
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
  event?: TheSportsDBEvent[] | null;
  events?: TheSportsDBEvent[] | null;
}

export interface TheSportsDBFilenameSearchResponse extends TheSportsDBRecord {
  event: TheSportsDBEvent[] | null;
}

export interface TheSportsDBEventSchedule extends TheSportsDBEvent {
  strOfficial?: string | null;
  idVenue?: TheSportsDBField;
  strTweet2?: string | null;
  strTweet3?: string | null;
}

export interface TheSportsDBEventScheduleList extends TheSportsDBRecord {
  schedule: TheSportsDBEventSchedule[] | null;
}

export interface TheSportsDBResultsResponse extends TheSportsDBRecord {
  results: TheSportsDBEvent[] | null;
}

export interface TheSportsDBPlayer extends TheSportsDBRecord {
  idPlayer?: TheSportsDBField;
  idTeam?: TheSportsDBField;
  idTeam2?: TheSportsDBField;
  idTeamNational?: TheSportsDBField;
  idAPIfootball?: string | null;
  idPlayerManager?: TheSportsDBField;
  idWikidata?: string | null;
  idTransferMkt?: string | null;
  idESPN?: string | null;
  intSoccerXMLTeamID?: TheSportsDBField;
  intLoved?: TheSportsDBField;
  strPlayer?: string | null;
  strPlayerAlternate?: string | null;
  strTeam?: string | null;
  strTeam2?: string | null;
  strSport?: string | null;
  strThumb?: string | null;
  strCutout?: string | null;
  strRender?: string | null;
  strNationality?: string | null;
  dateBorn?: string | null;
  dateDied?: string | null;
  dateSigned?: string | null;
  strNumber?: string | null;
  strStatus?: string | null;
  strGender?: string | null;
  strPosition?: string | null;
  strHeight?: string | null;
  strWeight?: string | null;
  strBirthLocation?: string | null;
  strDeathLocation?: string | null;
  strEthnicity?: string | null;
  strDescriptionEN?: string | null;
  strDescriptionDE?: string | null;
  strDescriptionFR?: string | null;
  strDescriptionCN?: string | null;
  strDescriptionIT?: string | null;
  strDescriptionJP?: string | null;
  strDescriptionRU?: string | null;
  strDescriptionES?: string | null;
  strDescriptionPT?: string | null;
  strDescriptionSE?: string | null;
  strDescriptionNL?: string | null;
  strDescriptionHU?: string | null;
  strDescriptionNO?: string | null;
  strDescriptionIL?: string | null;
  strDescriptionPL?: string | null;
  strCollege?: string | null;
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
  strPoster?: string | null;
  strBanner?: string | null;
  strFanart1?: string | null;
  strFanart2?: string | null;
  strFanart3?: string | null;
  strFanart4?: string | null;
  strCreativeCommons?: string | null;
  strLocked?: string | null;
  relevance?: TheSportsDBField;
}

export interface TheSportsDBPlayersResponse extends TheSportsDBRecord {
  player: TheSportsDBPlayer[] | null;
}

export interface TheSportsDBTVEvent extends TheSportsDBRecord {
  id?: TheSportsDBField;
  idEvent?: TheSportsDBField;
  intDivision?: TheSportsDBField;
  strSport?: string | null;
  strEvent?: string | null;
  strEventThumb?: string | null;
  strEventPoster?: string | null;
  strEventBanner?: string | null;
  strEventSquare?: string | null;
  idChannel?: TheSportsDBField;
  strChannel?: string | null;
  strCountry?: string | null;
  strEventCountry?: string | null;
  strLogo?: string | null;
  dateEvent?: string | null;
  strTime?: string | null;
  strTimestamp?: string | null;
}

export interface TheSportsDBTVEventsResponse extends TheSportsDBRecord {
  tvevents: TheSportsDBTVEvent[] | null;
}

export interface TheSportsDBTVHighlight extends TheSportsDBRecord {
  idEvent?: TheSportsDBField;
  strEvent?: string | null;
  strSport?: string | null;
  idLeague?: TheSportsDBField;
  strLeague?: string | null;
  strVideo?: string | null;
  strPoster?: string | null;
  strThumb?: string | null;
  strFanart?: string | null;
  strSeason?: string | null;
  dateEvent?: string | null;
}

export interface TheSportsDBTVHighlightsResponse extends TheSportsDBRecord {
  tvhighlights: TheSportsDBTVHighlight[] | null;
}

export interface TheSportsDBHonour extends TheSportsDBRecord {
  id?: TheSportsDBField;
  idPlayer?: TheSportsDBField;
  idTeam?: TheSportsDBField;
  idLeague?: TheSportsDBField;
  idHonour?: TheSportsDBField;
  strSport?: string | null;
  strPlayer?: string | null;
  strTeam?: string | null;
  strTeamBadge?: string | null;
  strHonour?: string | null;
  strHonourLogo?: string | null;
  strHonourTrophy?: string | null;
  strSeason?: string | null;
}

export interface TheSportsDBFormerTeam extends TheSportsDBRecord {
  id?: TheSportsDBField;
  idPlayer?: TheSportsDBField;
  idFormerTeam?: TheSportsDBField;
  strSport?: string | null;
  strPlayer?: string | null;
  strFormerTeam?: string | null;
  strMoveType?: string | null;
  strBadge?: string | null;
  strJoined?: string | null;
  strDeparted?: string | null;
}

export interface TheSportsDBMilestone extends TheSportsDBRecord {
  id?: TheSportsDBField;
  idPlayer?: TheSportsDBField;
  strPlayer?: string | null;
  idTeam?: TheSportsDBField;
  idMilestone?: TheSportsDBField;
  strTeam?: string | null;
  strSport?: string | null;
  strMilestone?: string | null;
  strMilestoneLogo?: string | null;
  dateMilestone?: string | null;
}

export interface TheSportsDBContract extends TheSportsDBRecord {
  id?: TheSportsDBField;
  idPlayer?: TheSportsDBField;
  idTeam?: TheSportsDBField;
  strSport?: string | null;
  strPlayer?: string | null;
  strTeam?: string | null;
  strBadge?: string | null;
  strYearStart?: string | null;
  strYearEnd?: string | null;
  strWage?: string | null;
}

export interface TheSportsDBPlayerResult extends TheSportsDBRecord {
  idResult?: TheSportsDBField;
  idPlayer?: TheSportsDBField;
  strPlayer?: string | null;
  idTeam?: TheSportsDBField;
  idEvent?: TheSportsDBField;
  strEvent?: string | null;
  strResult?: string | null;
  intPosition?: TheSportsDBField;
  intPoints?: TheSportsDBField;
  strDetail?: string | null;
  dateEvent?: string | null;
  strSeason?: string | null;
  strCountry?: string | null;
  strSport?: string | null;
}

export interface TheSportsDBPlayerStat extends TheSportsDBRecord {
  id?: TheSportsDBField;
  idPlayer?: TheSportsDBField;
  idTeam?: TheSportsDBField;
  idLeague?: TheSportsDBField;
  strSport?: string | null;
  strPlayer?: string | null;
  strTeam?: string | null;
  strTeamBadge?: string | null;
  strLeague?: string | null;
  strLeagueBadge?: string | null;
  strStatistic?: string | null;
  strValue?: string | null;
  strSeason?: string | null;
}

export interface TheSportsDBLookupPlayerResponse extends TheSportsDBRecord {
  players: TheSportsDBPlayer[] | null;
}

export interface TheSportsDBLookupHonoursResponse extends TheSportsDBRecord {
  honours: TheSportsDBHonour[] | null;
}

export interface TheSportsDBLookupFormerTeamsResponse extends TheSportsDBRecord {
  formerteams: TheSportsDBFormerTeam[] | null;
}

export interface TheSportsDBLookupMilestonesResponse extends TheSportsDBRecord {
  milestones: TheSportsDBMilestone[] | null;
}

export interface TheSportsDBLookupContractsResponse extends TheSportsDBRecord {
  contracts: TheSportsDBContract[] | null;
}

export interface TheSportsDBPlayerResultsResponse extends TheSportsDBRecord {
  results: TheSportsDBPlayerResult[] | null;
}

export interface TheSportsDBLookupPlayerStatsResponse extends TheSportsDBRecord {
  playerstats: TheSportsDBPlayerStat[] | null;
}

export interface TheSportsDBLiveScore extends TheSportsDBRecord {
  idLiveScore?: TheSportsDBField;
  idEvent?: TheSportsDBField;
  strSport?: string | null;
  idLeague?: TheSportsDBField;
  strLeague?: string | null;
  idHomeTeam?: TheSportsDBField;
  idAwayTeam?: TheSportsDBField;
  strHomeTeam?: string | null;
  strAwayTeam?: string | null;
  strHomeTeamBadge?: string | null;
  strAwayTeamBadge?: string | null;
  intHomeScore?: TheSportsDBField;
  intAwayScore?: TheSportsDBField;
  intEventScore?: TheSportsDBField;
  intEventScoreTotal?: TheSportsDBField;
  strStatus?: string | null;
  strProgress?: string | null;
  strEventTime?: string | null;
  dateEvent?: string | null;
  updated?: string | null;
}

export interface TheSportsDBLiveScoreList extends TheSportsDBRecord {
  livescore: TheSportsDBLiveScore[] | null;
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

export interface TheSportsDBPlayerIdRequest {
  idPlayer: number;
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

export interface TheSportsDBLeagueScheduleRequest {
  idLeague: TheSportsDBId;
}

export interface TheSportsDBTeamScheduleRequest {
  idTeam: TheSportsDBId;
}

export interface TheSportsDBVenueScheduleRequest {
  idVenue: TheSportsDBId;
}

export interface TheSportsDBLeagueSeasonScheduleRequest {
  idLeague: TheSportsDBId;
  season: string;
}

export interface TheSportsDBLiveScoreSportRequest {
  sport: string;
}

export interface TheSportsDBLiveScoreLeagueRequest {
  leagueId: TheSportsDBId;
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

export interface TheSportsDBLookupPlayerMethod {
  (
    req: TheSportsDBPlayerIdRequest,
    signal?: AbortSignal
  ): Promise<TheSportsDBLookupPlayerResponse>;
  schema: z.ZodType<z.infer<typeof TheSportsDBPlayerIdRequestSchema>>;
}

export interface TheSportsDBLookupHonoursMethod {
  (
    req: TheSportsDBPlayerIdRequest,
    signal?: AbortSignal
  ): Promise<TheSportsDBLookupHonoursResponse>;
  schema: z.ZodType<z.infer<typeof TheSportsDBPlayerIdRequestSchema>>;
}

export interface TheSportsDBLookupFormerTeamsMethod {
  (
    req: TheSportsDBPlayerIdRequest,
    signal?: AbortSignal
  ): Promise<TheSportsDBLookupFormerTeamsResponse>;
  schema: z.ZodType<z.infer<typeof TheSportsDBPlayerIdRequestSchema>>;
}

export interface TheSportsDBLookupMilestonesMethod {
  (
    req: TheSportsDBPlayerIdRequest,
    signal?: AbortSignal
  ): Promise<TheSportsDBLookupMilestonesResponse>;
  schema: z.ZodType<z.infer<typeof TheSportsDBPlayerIdRequestSchema>>;
}

export interface TheSportsDBLookupContractsMethod {
  (
    req: TheSportsDBPlayerIdRequest,
    signal?: AbortSignal
  ): Promise<TheSportsDBLookupContractsResponse>;
  schema: z.ZodType<z.infer<typeof TheSportsDBPlayerIdRequestSchema>>;
}

export interface TheSportsDBPlayerResultsMethod {
  (
    req: TheSportsDBPlayerIdRequest,
    signal?: AbortSignal
  ): Promise<TheSportsDBPlayerResultsResponse>;
  schema: z.ZodType<z.infer<typeof TheSportsDBPlayerIdRequestSchema>>;
}

export interface TheSportsDBLookupPlayerStatsMethod {
  (
    req: TheSportsDBPlayerIdRequest,
    signal?: AbortSignal
  ): Promise<TheSportsDBLookupPlayerStatsResponse>;
  schema: z.ZodType<z.infer<typeof TheSportsDBPlayerIdRequestSchema>>;
}

export interface TheSportsDBEventResponse extends TheSportsDBRecord {
  events: TheSportsDBEvent[] | null;
}

export interface TheSportsDBEventResult extends TheSportsDBRecord {
  idResult?: TheSportsDBField;
  idPlayer?: TheSportsDBField;
  strPlayer?: string | null;
  idTeam?: TheSportsDBField;
  idEvent?: TheSportsDBField;
  strEvent?: string | null;
  strResult?: string | null;
  intPosition?: TheSportsDBField;
  intPoints?: TheSportsDBField;
  strDetail?: string | null;
  dateEvent?: string | null;
  strSeason?: string | null;
  strCountry?: string | null;
  strSport?: string | null;
}

export interface TheSportsDBEventResultsResponse extends TheSportsDBRecord {
  results: TheSportsDBEventResult[] | null;
}

export interface TheSportsDBLineup extends TheSportsDBRecord {
  idLineup?: TheSportsDBField;
  idEvent?: TheSportsDBField;
  strPosition?: string | null;
  strHome?: string | null;
  strSubstitute?: string | null;
  intSquadNumber?: TheSportsDBField;
  idPlayer?: TheSportsDBField;
  strPlayer?: string | null;
  idTeam?: TheSportsDBField;
  strTeam?: string | null;
  strCutout?: string | null;
  strThumb?: string | null;
  strRender?: string | null;
}

export interface TheSportsDBLineupResponse extends TheSportsDBRecord {
  lineup: TheSportsDBLineup[] | null;
}

export interface TheSportsDBTimeline extends TheSportsDBRecord {
  idTimeline?: TheSportsDBField;
  idEvent?: TheSportsDBField;
  strTimeline?: string | null;
  strTimelineDetail?: string | null;
  strHome?: string | null;
  strEvent?: string | null;
  idPlayer?: TheSportsDBField;
  strPlayer?: string | null;
  idAssist?: TheSportsDBField;
  strAssist?: string | null;
  intTime?: TheSportsDBField;
  strPeriod?: string | null;
  idTeam?: TheSportsDBField;
  strTeam?: string | null;
  strComment?: string | null;
  dateEvent?: string | null;
  strSeason?: string | null;
}

export interface TheSportsDBTimelineResponse extends TheSportsDBRecord {
  timeline: TheSportsDBTimeline[] | null;
}

export interface TheSportsDBEventStat extends TheSportsDBRecord {
  idStatistic?: TheSportsDBField;
  idEvent?: TheSportsDBField;
  idApiFootball?: TheSportsDBField;
  strEvent?: string | null;
  strStat?: string | null;
  intHome?: TheSportsDBField;
  intAway?: TheSportsDBField;
}

export interface TheSportsDBEventStatsResponse extends TheSportsDBRecord {
  eventstats: TheSportsDBEventStat[] | null;
}

export interface TheSportsDBTvEvent extends TheSportsDBRecord {
  id?: TheSportsDBField;
  idEvent?: TheSportsDBField;
  strSport?: string | null;
  strEvent?: string | null;
  strEventThumb?: string | null;
  strEventPoster?: string | null;
  strEventBanner?: string | null;
  strEventSquare?: string | null;
  idChannel?: TheSportsDBField;
  strCountry?: string | null;
  strEventCountry?: string | null;
  strLogo?: string | null;
  strChannel?: string | null;
  strSeason?: string | null;
  strTime?: string | null;
  dateEvent?: string | null;
  strTimeStamp?: string | null;
}

export interface TheSportsDBTvEventResponse extends TheSportsDBRecord {
  tvevent: TheSportsDBTvEvent[] | null;
}

export interface TheSportsDBLeagueScheduleMethod {
  (
    req: TheSportsDBLeagueScheduleRequest,
    signal?: AbortSignal
  ): Promise<TheSportsDBEventScheduleList>;
  schema: z.ZodType<z.infer<typeof TheSportsDBLeagueScheduleRequestSchema>>;
}

export interface TheSportsDBTeamScheduleMethod {
  (
    req: TheSportsDBTeamScheduleRequest,
    signal?: AbortSignal
  ): Promise<TheSportsDBEventScheduleList>;
  schema: z.ZodType<z.infer<typeof TheSportsDBTeamScheduleRequestSchema>>;
}

export interface TheSportsDBVenueScheduleMethod {
  (
    req: TheSportsDBVenueScheduleRequest,
    signal?: AbortSignal
  ): Promise<TheSportsDBEventScheduleList>;
  schema: z.ZodType<z.infer<typeof TheSportsDBVenueScheduleRequestSchema>>;
}

export interface TheSportsDBLeagueSeasonScheduleMethod {
  (
    req: TheSportsDBLeagueSeasonScheduleRequest,
    signal?: AbortSignal
  ): Promise<TheSportsDBEventScheduleList>;
  schema: z.ZodType<
    z.infer<typeof TheSportsDBLeagueSeasonScheduleRequestSchema>
  >;
}

export interface TheSportsDBLiveScoreSportMethod {
  (
    req: TheSportsDBLiveScoreSportRequest,
    signal?: AbortSignal
  ): Promise<TheSportsDBLiveScoreList>;
  schema: z.ZodType<z.infer<typeof TheSportsDBLiveScoreSportRequestSchema>>;
}

export interface TheSportsDBLiveScoreLeagueMethod {
  (
    req: TheSportsDBLiveScoreLeagueRequest,
    signal?: AbortSignal
  ): Promise<TheSportsDBLiveScoreList>;
  schema: z.ZodType<z.infer<typeof TheSportsDBLiveScoreLeagueRequestSchema>>;
}

export type TheSportsDBLiveScoreAllMethod =
  TheSportsDBEndpointMethod<TheSportsDBLiveScoreList>;

export type TheSportsDBAllSportsMethod =
  TheSportsDBEndpointMethod<TheSportsDBSportsResponse>;
export type TheSportsDBAllCountriesMethod =
  TheSportsDBEndpointMethod<TheSportsDBCountriesResponse>;
export type TheSportsDBAllLeaguesMethod =
  TheSportsDBEndpointMethod<TheSportsDBLeaguesResponse>;
export type TheSportsDBSearchAllLeaguesMethod = TheSportsDBRequestMethod<
  TheSportsDBSearchAllLeaguesRequest,
  TheSportsDBSearchAllLeaguesResponse
>;
export type TheSportsDBSearchAllSeasonsMethod = TheSportsDBRequestMethod<
  TheSportsDBSearchAllSeasonsRequest,
  TheSportsDBSeasonsResponse
>;
export type TheSportsDBSearchAllTeamsMethod = TheSportsDBRequestMethod<
  TheSportsDBSearchAllTeamsRequest,
  TheSportsDBTeamsResponse
>;
export type TheSportsDBLookupAllPlayersMethod = TheSportsDBRequestMethod<
  TheSportsDBLookupAllPlayersRequest,
  TheSportsDBPlayersResponse
>;
export type TheSportsDBEventsnextMethod = TheSportsDBRequestMethod<
  TheSportsDBTeamEventsRequest,
  TheSportsDBEventsResponse
>;
export type TheSportsDBEventslastMethod = TheSportsDBRequestMethod<
  TheSportsDBTeamEventsRequest,
  TheSportsDBResultsResponse
>;
export type TheSportsDBEventsnextleagueMethod = TheSportsDBRequestMethod<
  TheSportsDBLeagueEventsRequest,
  TheSportsDBEventsResponse
>;
export type TheSportsDBEventspastleagueMethod = TheSportsDBRequestMethod<
  TheSportsDBLeagueEventsRequest,
  TheSportsDBEventsResponse
>;
export type TheSportsDBEventsdayMethod = TheSportsDBRequestMethod<
  TheSportsDBEventsDayRequest,
  TheSportsDBEventsResponse
>;
export type TheSportsDBEventsseasonMethod = TheSportsDBRequestMethod<
  TheSportsDBEventsSeasonRequest,
  TheSportsDBEventsResponse
>;
export type TheSportsDBEventstvMethod = TheSportsDBRequestMethod<
  TheSportsDBEventsTVRequest,
  TheSportsDBTVEventsResponse
>;
export type TheSportsDBEventshighlightsMethod = TheSportsDBRequestMethod<
  TheSportsDBEventsHighlightsRequest,
  TheSportsDBTVHighlightsResponse
>;

export interface TheSportsDBV1LookupNamespace {
  league: TheSportsDBLeagueLookupMethod;
  table: TheSportsDBTableLookupMethod;
  team: TheSportsDBTeamLookupMethod;
  equipment: TheSportsDBEquipmentLookupMethod;
  venue: TheSportsDBVenueLookupMethod;
}

export interface TheSportsDBLookupEventMethod {
  (
    req: TheSportsDBEventLookupRequest,
    signal?: AbortSignal
  ): Promise<TheSportsDBEventResponse>;
  schema: z.ZodType<z.infer<typeof TheSportsDBEventLookupRequestSchema>>;
}

export interface TheSportsDBEventResultsMethod {
  (
    req: TheSportsDBEventLookupRequest,
    signal?: AbortSignal
  ): Promise<TheSportsDBEventResultsResponse>;
  schema: z.ZodType<z.infer<typeof TheSportsDBEventLookupRequestSchema>>;
}

export interface TheSportsDBLookupLineupMethod {
  (
    req: TheSportsDBEventLookupRequest,
    signal?: AbortSignal
  ): Promise<TheSportsDBLineupResponse>;
  schema: z.ZodType<z.infer<typeof TheSportsDBEventLookupRequestSchema>>;
}

export interface TheSportsDBLookupTimelineMethod {
  (
    req: TheSportsDBEventLookupRequest,
    signal?: AbortSignal
  ): Promise<TheSportsDBTimelineResponse>;
  schema: z.ZodType<z.infer<typeof TheSportsDBEventLookupRequestSchema>>;
}

export interface TheSportsDBLookupEventStatsMethod {
  (
    req: TheSportsDBEventLookupRequest,
    signal?: AbortSignal
  ): Promise<TheSportsDBEventStatsResponse>;
  schema: z.ZodType<z.infer<typeof TheSportsDBEventLookupRequestSchema>>;
}

export interface TheSportsDBLookupTvMethod {
  (
    req: TheSportsDBEventLookupRequest,
    signal?: AbortSignal
  ): Promise<TheSportsDBTvEventResponse>;
  schema: z.ZodType<z.infer<typeof TheSportsDBEventLookupRequestSchema>>;
}

export interface TheSportsDBV1Namespace {
  allSports: TheSportsDBAllSportsMethod;
  allCountries: TheSportsDBAllCountriesMethod;
  allLeagues: TheSportsDBAllLeaguesMethod;
  lookup: TheSportsDBV1LookupNamespace;
  searchAllLeagues: TheSportsDBSearchAllLeaguesMethod;
  searchAllSeasons: TheSportsDBSearchAllSeasonsMethod;
  searchAllTeams: TheSportsDBSearchAllTeamsMethod;
  lookupAllPlayers: TheSportsDBLookupAllPlayersMethod;
  searchTeams: TheSportsDBSearchTeamsMethod;
  searchEvents: TheSportsDBSearchEventsMethod;
  searchFilename: TheSportsDBSearchFilenameMethod;
  searchPlayers: TheSportsDBSearchPlayersMethod;
  searchVenues: TheSportsDBSearchVenuesMethod;
  eventsnext: TheSportsDBEventsnextMethod;
  eventslast: TheSportsDBEventslastMethod;
  eventsnextleague: TheSportsDBEventsnextleagueMethod;
  eventspastleague: TheSportsDBEventspastleagueMethod;
  eventsday: TheSportsDBEventsdayMethod;
  eventsseason: TheSportsDBEventsseasonMethod;
  eventstv: TheSportsDBEventstvMethod;
  eventshighlights: TheSportsDBEventshighlightsMethod;
  lookupplayer: TheSportsDBLookupPlayerMethod;
  lookuphonours: TheSportsDBLookupHonoursMethod;
  lookupformerteams: TheSportsDBLookupFormerTeamsMethod;
  lookupmilestones: TheSportsDBLookupMilestonesMethod;
  lookupcontracts: TheSportsDBLookupContractsMethod;
  playerresults: TheSportsDBPlayerResultsMethod;
  lookupplayerstats: TheSportsDBLookupPlayerStatsMethod;
  lookupEvent: TheSportsDBLookupEventMethod;
  eventResults: TheSportsDBEventResultsMethod;
  lookupLineup: TheSportsDBLookupLineupMethod;
  lookupTimeline: TheSportsDBLookupTimelineMethod;
  lookupEventStats: TheSportsDBLookupEventStatsMethod;
  lookupTv: TheSportsDBLookupTvMethod;
}

export interface TheSportsDBV2SchedulePeriodNamespace {
  league: TheSportsDBLeagueScheduleMethod;
  team: TheSportsDBTeamScheduleMethod;
  venue: TheSportsDBVenueScheduleMethod;
}

export interface TheSportsDBV2ScheduleFullNamespace {
  team: TheSportsDBTeamScheduleMethod;
}

export interface TheSportsDBV2ScheduleNamespace {
  next: TheSportsDBV2SchedulePeriodNamespace;
  previous: TheSportsDBV2SchedulePeriodNamespace;
  full: TheSportsDBV2ScheduleFullNamespace;
  league: TheSportsDBLeagueSeasonScheduleMethod;
}

export interface TheSportsDBV2LiveScoreNamespace {
  bySport: TheSportsDBLiveScoreSportMethod;
  byLeague: TheSportsDBLiveScoreLeagueMethod;
  all: TheSportsDBLiveScoreAllMethod;
}

export interface TheSportsDBV2Namespace {
  schedule: TheSportsDBV2ScheduleNamespace;
  livescore: TheSportsDBV2LiveScoreNamespace;
}

export interface TheSportsDBGetNamespace {
  v1: TheSportsDBV1Namespace;
  v2: TheSportsDBV2Namespace;
}

export interface TheSportsDBProvider {
  v1: TheSportsDBV1Namespace;
  v2: TheSportsDBV2Namespace;
  get: TheSportsDBGetNamespace;
}
