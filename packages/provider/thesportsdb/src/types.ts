import type { z } from "zod";

import type {
  TheSportsDBEquipmentLookupRequestSchema,
  TheSportsDBEventLookupRequest,
  TheSportsDBEventLookupRequestSchema,
  TheSportsDBEventsDayRequest,
  TheSportsDBEventsHighlightsRequest,
  TheSportsDBEventsSeasonRequest,
  TheSportsDBEventsTVRequest,
  TheSportsDBFilterTvChannelIdRequest,
  TheSportsDBFilterTvChannelRequest,
  TheSportsDBFilterTvCountryRequest,
  TheSportsDBFilterTvDayRequest,
  TheSportsDBFilterTvSportRequest,
  TheSportsDBLeagueEventsRequest,
  TheSportsDBLeagueIdRequest,
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
  TheSportsDBSearchEventRequest,
  TheSportsDBSearchEventsRequestSchema,
  TheSportsDBSearchFilenameRequestSchema,
  TheSportsDBSearchLeagueRequest,
  TheSportsDBSearchPlayerRequest,
  TheSportsDBSearchPlayersRequestSchema,
  TheSportsDBSearchTeamRequest,
  TheSportsDBSearchTeamsRequestSchema,
  TheSportsDBSearchVenueRequest,
  TheSportsDBSearchVenuesRequestSchema,
  TheSportsDBTableLookupRequestSchema,
  TheSportsDBTeamEventsRequest,
  TheSportsDBTeamIdRequest,
  TheSportsDBTeamLookupRequestSchema,
  TheSportsDBTeamScheduleRequestSchema,
  TheSportsDBV2EventLookupRequestSchema,
  TheSportsDBV2LeagueLookupRequestSchema,
  TheSportsDBV2PlayerLookupRequestSchema,
  TheSportsDBV2TeamLookupRequestSchema,
  TheSportsDBV2VenueLookupRequestSchema,
  TheSportsDBVenueLookupRequestSchema,
  TheSportsDBVenueScheduleRequestSchema,
} from "./zod";

export type {
  TheSportsDBEventLookupRequest,
  TheSportsDBEventLookupParsedRequest,
  TheSportsDBEventsDayRequest,
  TheSportsDBEventsDayParsedRequest,
  TheSportsDBEventsHighlightsRequest,
  TheSportsDBEventsHighlightsParsedRequest,
  TheSportsDBEventsSeasonRequest,
  TheSportsDBEventsSeasonParsedRequest,
  TheSportsDBEventsTVRequest,
  TheSportsDBEventsTVParsedRequest,
  TheSportsDBFilterTvChannelIdRequest,
  TheSportsDBFilterTvChannelIdParsedRequest,
  TheSportsDBFilterTvChannelRequest,
  TheSportsDBFilterTvChannelParsedRequest,
  TheSportsDBFilterTvCountryRequest,
  TheSportsDBFilterTvCountryParsedRequest,
  TheSportsDBFilterTvDayRequest,
  TheSportsDBFilterTvDayParsedRequest,
  TheSportsDBFilterTvSportRequest,
  TheSportsDBFilterTvSportParsedRequest,
  TheSportsDBLeagueEventsRequest,
  TheSportsDBLeagueEventsParsedRequest,
  TheSportsDBLeagueIdRequest,
  TheSportsDBLeagueIdParsedRequest,
  TheSportsDBLookupAllPlayersRequest,
  TheSportsDBLookupAllPlayersParsedRequest,
  TheSportsDBOptions,
  TheSportsDBSearchAllLeaguesRequest,
  TheSportsDBSearchAllLeaguesParsedRequest,
  TheSportsDBSearchAllSeasonsRequest,
  TheSportsDBSearchAllSeasonsParsedRequest,
  TheSportsDBSearchAllTeamsRequest,
  TheSportsDBSearchAllTeamsParsedRequest,
  TheSportsDBSearchEventRequest,
  TheSportsDBSearchEventParsedRequest,
  TheSportsDBSearchLeagueRequest,
  TheSportsDBSearchLeagueParsedRequest,
  TheSportsDBSearchPlayerRequest,
  TheSportsDBSearchPlayerParsedRequest,
  TheSportsDBSearchTeamRequest,
  TheSportsDBSearchTeamParsedRequest,
  TheSportsDBSearchVenueRequest,
  TheSportsDBSearchVenueParsedRequest,
  TheSportsDBTeamEventsRequest,
  TheSportsDBTeamEventsParsedRequest,
  TheSportsDBTeamIdRequest,
  TheSportsDBTeamIdParsedRequest,
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

export interface TheSportsDBSportListResponse extends TheSportsDBRecord {
  all: TheSportsDBSport[] | null;
}

export interface TheSportsDBCountry extends TheSportsDBRecord {
  name_en?: string;
}

export interface TheSportsDBCountriesResponse extends TheSportsDBRecord {
  countries: TheSportsDBCountry[] | null;
}

export interface TheSportsDBCountryLookupResponse extends TheSportsDBRecord {
  all: TheSportsDBCountry[] | null;
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

export interface TheSportsDBLeagueSearchResponse extends TheSportsDBRecord {
  search: TheSportsDBLeague[] | null;
}

export interface TheSportsDBLeagueListResponse extends TheSportsDBRecord {
  all: TheSportsDBLeague[] | null;
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

export interface TheSportsDBSeasonListResponse extends TheSportsDBRecord {
  list: TheSportsDBSeason[] | null;
}

export interface TheSportsDBSeasonPoster extends TheSportsDBRecord {
  strSeason?: string;
  strPoster?: string | null;
}

export interface TheSportsDBSeasonPosterListResponse extends TheSportsDBRecord {
  list: TheSportsDBSeasonPoster[] | null;
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

export interface TheSportsDBTeamSearchResponse extends TheSportsDBRecord {
  search: TheSportsDBTeam[] | null;
}

export interface TheSportsDBTeamListResponse extends TheSportsDBRecord {
  list: TheSportsDBTeam[] | null;
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

export interface TheSportsDBVenueSearchResponse extends TheSportsDBRecord {
  search: TheSportsDBVenue[] | null;
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

export interface TheSportsDBEventSearchResponse extends TheSportsDBRecord {
  search: TheSportsDBEvent[] | null;
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

export interface TheSportsDBPlayerSearchResponse extends TheSportsDBRecord {
  search: TheSportsDBPlayer[] | null;
}

export interface TheSportsDBPlayerListResponse extends TheSportsDBRecord {
  list: TheSportsDBPlayer[] | null;
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

export interface TheSportsDBV2LookupResponse<
  TItem extends TheSportsDBRecord,
> extends TheSportsDBRecord {
  lookup: TItem[] | null;
}

export interface TheSportsDBV2League extends TheSportsDBLeague {
  idAPIfootball?: TheSportsDBField;
  strCurrentSeason?: string | null;
  intFormedYear?: TheSportsDBField;
  dateFirstEvent?: string | null;
  strGender?: string | null;
  strWebsite?: string | null;
  strDescriptionEN?: string | null;
  strTvRights?: string | null;
  strBanner?: string | null;
  strNaming?: string | null;
  strComplete?: string | null;
  strLocked?: string | null;
}

export interface TheSportsDBV2TeamInfo extends TheSportsDBTeam {
  idESPN?: TheSportsDBField;
  idAPIfootball?: TheSportsDBField;
  intLoved?: TheSportsDBField;
  strTeamAlternate?: string | null;
  strTeamShort?: string | null;
  intFormedYear?: TheSportsDBField;
  strLeague2?: string | null;
  idLeague2?: TheSportsDBField;
  strDivision?: string | null;
  strStadium?: string | null;
  strKeywords?: string | null;
  strLocation?: string | null;
  intStadiumCapacity?: TheSportsDBField;
  strWebsite?: string | null;
  strDescriptionEN?: string | null;
  strColour1?: string | null;
  strColour2?: string | null;
  strColour3?: string | null;
  strGender?: string | null;
  strYoutube?: string | null;
  strLocked?: string | null;
}

export interface TheSportsDBV2TeamEquipment extends TheSportsDBEquipment {
  date?: string | null;
}

export interface TheSportsDBV2PlayerLookup extends TheSportsDBRecord {
  idPlayer?: TheSportsDBField;
  idTeam?: TheSportsDBField;
  idTeam2?: TheSportsDBField;
  idTeamNational?: TheSportsDBField;
  idAPIfootball?: TheSportsDBField;
  strNationality?: string | null;
  strPlayer?: string | null;
  strPlayerAlternate?: string | null;
  strTeam?: string | null;
  strTeam2?: string | null;
  strSport?: string | null;
  dateBorn?: string | null;
  dateDied?: string | null;
  strNumber?: string | null;
  strStatus?: string | null;
  strDescriptionEN?: string | null;
  strGender?: string | null;
  strPosition?: string | null;
  strHeight?: string | null;
  strWeight?: string | null;
  strThumb?: string | null;
  strCutout?: string | null;
  strRender?: string | null;
  strLocked?: string | null;
}

export interface TheSportsDBV2PlayerCareerHistory extends TheSportsDBRecord {
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

export interface TheSportsDBV2PlayerResult extends TheSportsDBRecord {
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

export interface TheSportsDBV2PlayerHonour extends TheSportsDBRecord {
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

export interface TheSportsDBV2PlayerMilestone extends TheSportsDBRecord {
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

export interface TheSportsDBV2FormerTeam extends TheSportsDBRecord {
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

export interface TheSportsDBV2PlayerStatistic extends TheSportsDBRecord {
  idStatistic?: TheSportsDBField;
  idPlayer?: TheSportsDBField;
  idTeam?: TheSportsDBField;
  idEvent?: TheSportsDBField;
  strPlayer?: string | null;
  strTeam?: string | null;
  strEvent?: string | null;
  strStat?: string | null;
  intValue?: TheSportsDBField;
  strSeason?: string | null;
  strSport?: string | null;
}

export interface TheSportsDBV2EventLookup extends TheSportsDBRecord {
  idEvent?: TheSportsDBField;
  idAPIfootball?: TheSportsDBField;
  strEvent?: string | null;
  strEventAlternate?: string | null;
  strFilename?: string | null;
  strSport?: string | null;
  idLeague?: TheSportsDBField;
  strLeague?: string | null;
  strLeagueBadge?: string | null;
  strSeason?: string | null;
  strHomeTeam?: string | null;
  strAwayTeam?: string | null;
  intHomeScore?: TheSportsDBField;
  intRound?: TheSportsDBField;
  intAwayScore?: TheSportsDBField;
  strTimestamp?: string | null;
  dateEvent?: string | null;
  strTime?: string | null;
  idVenue?: TheSportsDBField;
  strVenue?: string | null;
  strCountry?: string | null;
  strVideo?: string | null;
  strStatus?: string | null;
}

export interface TheSportsDBV2EventLineup extends TheSportsDBRecord {
  idLineup?: TheSportsDBField;
  idEvent?: TheSportsDBField;
  strEvent?: string | null;
  strPosition?: string | null;
  strPositionShort?: string | null;
  strFormation?: string | null;
  strHome?: string | null;
  strSubstitute?: string | null;
  intSquadNumber?: TheSportsDBField;
  idPlayer?: TheSportsDBField;
  strPlayer?: string | null;
  idTeam?: TheSportsDBField;
  strTeam?: string | null;
  strCountry?: string | null;
  strSeason?: string | null;
}

export interface TheSportsDBV2EventResult extends TheSportsDBRecord {
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

export interface TheSportsDBV2EventStatistic extends TheSportsDBRecord {
  idStatistic?: TheSportsDBField;
  idEvent?: TheSportsDBField;
  idApiFootball?: TheSportsDBField;
  strEvent?: string | null;
  strStat?: string | null;
  intHome?: TheSportsDBField;
  intAway?: TheSportsDBField;
}

export interface TheSportsDBV2EventTimeline extends TheSportsDBRecord {
  idTimeline?: TheSportsDBField;
  idEvent?: TheSportsDBField;
  strTimeline?: string | null;
  strTimelineDetail?: string | null;
  strHome?: string | null;
  strEvent?: string | null;
  idAPIfootball?: TheSportsDBField;
  idPlayer?: TheSportsDBField;
  strPlayer?: string | null;
  idAssist?: TheSportsDBField;
  strAssist?: string | null;
  intTime?: TheSportsDBField;
  idTeam?: TheSportsDBField;
  strTeam?: string | null;
  strComment?: string | null;
  dateEvent?: string | null;
  strSeason?: string | null;
}

export interface TheSportsDBV2EventBroadcast extends TheSportsDBRecord {
  id?: TheSportsDBField;
  idEvent?: TheSportsDBField;
  strSport?: string | null;
  strEvent?: string | null;
  idChannel?: TheSportsDBField;
  strCountry?: string | null;
  strLogo?: string | null;
  strChannel?: string | null;
  strSeason?: string | null;
  strTime?: string | null;
  dateEvent?: string | null;
  strTimeStamp?: string | null;
}

export interface TheSportsDBV2Venue extends TheSportsDBVenue {
  idDupe?: TheSportsDBField;
  strVenueAlternate?: string | null;
  strVenueSponsor?: string | null;
  strDescriptionEN?: string | null;
  strArchitect?: string | null;
  intCapacity?: TheSportsDBField;
  strCost?: string | null;
  strTimezone?: string | null;
  intFormedYear?: TheSportsDBField;
}

export interface TheSportsDBV2LeagueLookupResponse extends TheSportsDBRecord {
  lookup: TheSportsDBV2League[] | null;
}
export interface TheSportsDBV2TeamInfoResponse extends TheSportsDBRecord {
  lookup: TheSportsDBV2TeamInfo[] | null;
}
export interface TheSportsDBV2TeamEquipmentsResponse extends TheSportsDBRecord {
  lookup: TheSportsDBV2TeamEquipment[] | null;
}
export interface TheSportsDBV2PlayerLookupResponse extends TheSportsDBRecord {
  lookup: TheSportsDBV2PlayerLookup[] | null;
}
export interface TheSportsDBV2PlayerCareerHistoryResponse extends TheSportsDBRecord {
  lookup: TheSportsDBV2PlayerCareerHistory[] | null;
}
export interface TheSportsDBV2PlayerResultsResponse extends TheSportsDBRecord {
  lookup: TheSportsDBV2PlayerResult[] | null;
}
export interface TheSportsDBV2PlayerHonourLookupResponse extends TheSportsDBRecord {
  lookup: TheSportsDBV2PlayerHonour[] | null;
}
export interface TheSportsDBV2PlayerMilestonesResponse extends TheSportsDBRecord {
  lookup: TheSportsDBV2PlayerMilestone[] | null;
}
export interface TheSportsDBV2FormerTeamsResponse extends TheSportsDBRecord {
  lookup: TheSportsDBV2FormerTeam[] | null;
}
export interface TheSportsDBV2PlayerStatsResponse extends TheSportsDBRecord {
  lookup: TheSportsDBV2PlayerStatistic[] | null;
}
export interface TheSportsDBV2EventLookupResponse extends TheSportsDBRecord {
  lookup: TheSportsDBV2EventLookup[] | null;
}
export interface TheSportsDBV2EventLineupResponse extends TheSportsDBRecord {
  lookup: TheSportsDBV2EventLineup[] | null;
}
export interface TheSportsDBV2EventResultsResponse extends TheSportsDBRecord {
  lookup: TheSportsDBV2EventResult[] | null;
}
export interface TheSportsDBV2EventStatisticsResponse extends TheSportsDBRecord {
  lookup: TheSportsDBV2EventStatistic[] | null;
}
export interface TheSportsDBV2EventTimelineResponse extends TheSportsDBRecord {
  lookup: TheSportsDBV2EventTimeline[] | null;
}
export interface TheSportsDBV2EventBroadcastResponse extends TheSportsDBRecord {
  lookup: TheSportsDBV2EventBroadcast[] | null;
}
export interface TheSportsDBV2VenueResponse extends TheSportsDBRecord {
  lookup: TheSportsDBV2Venue[] | null;
}

export interface TheSportsDBV2LeagueLookupRequest {
  idLeague: TheSportsDBId;
}

export interface TheSportsDBV2TeamLookupRequest {
  idTeam: TheSportsDBId;
}

export interface TheSportsDBV2PlayerLookupRequest {
  idPlayer: TheSportsDBId;
}

export interface TheSportsDBV2EventLookupRequest {
  idEvent: TheSportsDBId;
}

export interface TheSportsDBV2VenueLookupRequest {
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

export interface TheSportsDBEventFilterResponse extends TheSportsDBRecord {
  filter: TheSportsDBTvEvent[] | null;
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

export interface TheSportsDBRequestEndpointMethod<
  TRequest,
  TResponse,
  TSchema extends z.ZodTypeAny,
> {
  (req: TRequest, signal?: AbortSignal): Promise<TResponse>;
  schema: z.ZodType<z.infer<TSchema>>;
}

export type TheSportsDBV2LeagueLookupMethod = TheSportsDBRequestEndpointMethod<
  TheSportsDBV2LeagueLookupRequest,
  TheSportsDBV2LeagueLookupResponse,
  typeof TheSportsDBV2LeagueLookupRequestSchema
>;
export type TheSportsDBV2TeamLookupMethod = TheSportsDBRequestEndpointMethod<
  TheSportsDBV2TeamLookupRequest,
  TheSportsDBV2TeamInfoResponse,
  typeof TheSportsDBV2TeamLookupRequestSchema
>;
export type TheSportsDBV2TeamEquipmentLookupMethod =
  TheSportsDBRequestEndpointMethod<
    TheSportsDBV2TeamLookupRequest,
    TheSportsDBV2TeamEquipmentsResponse,
    typeof TheSportsDBV2TeamLookupRequestSchema
  >;
export type TheSportsDBV2PlayerLookupMethod = TheSportsDBRequestEndpointMethod<
  TheSportsDBV2PlayerLookupRequest,
  TheSportsDBV2PlayerLookupResponse,
  typeof TheSportsDBV2PlayerLookupRequestSchema
>;
export type TheSportsDBV2PlayerContractsLookupMethod =
  TheSportsDBRequestEndpointMethod<
    TheSportsDBV2PlayerLookupRequest,
    TheSportsDBV2PlayerCareerHistoryResponse,
    typeof TheSportsDBV2PlayerLookupRequestSchema
  >;
export type TheSportsDBV2PlayerResultsLookupMethod =
  TheSportsDBRequestEndpointMethod<
    TheSportsDBV2PlayerLookupRequest,
    TheSportsDBV2PlayerResultsResponse,
    typeof TheSportsDBV2PlayerLookupRequestSchema
  >;
export type TheSportsDBV2PlayerHonoursLookupMethod =
  TheSportsDBRequestEndpointMethod<
    TheSportsDBV2PlayerLookupRequest,
    TheSportsDBV2PlayerHonourLookupResponse,
    typeof TheSportsDBV2PlayerLookupRequestSchema
  >;
export type TheSportsDBV2PlayerMilestonesLookupMethod =
  TheSportsDBRequestEndpointMethod<
    TheSportsDBV2PlayerLookupRequest,
    TheSportsDBV2PlayerMilestonesResponse,
    typeof TheSportsDBV2PlayerLookupRequestSchema
  >;
export type TheSportsDBV2PlayerTeamsLookupMethod =
  TheSportsDBRequestEndpointMethod<
    TheSportsDBV2PlayerLookupRequest,
    TheSportsDBV2FormerTeamsResponse,
    typeof TheSportsDBV2PlayerLookupRequestSchema
  >;
export type TheSportsDBV2PlayerStatsLookupMethod =
  TheSportsDBRequestEndpointMethod<
    TheSportsDBV2PlayerLookupRequest,
    TheSportsDBV2PlayerStatsResponse,
    typeof TheSportsDBV2PlayerLookupRequestSchema
  >;
export type TheSportsDBV2EventLookupMethod = TheSportsDBRequestEndpointMethod<
  TheSportsDBV2EventLookupRequest,
  TheSportsDBV2EventLookupResponse,
  typeof TheSportsDBV2EventLookupRequestSchema
>;
export type TheSportsDBV2EventLineupLookupMethod =
  TheSportsDBRequestEndpointMethod<
    TheSportsDBV2EventLookupRequest,
    TheSportsDBV2EventLineupResponse,
    typeof TheSportsDBV2EventLookupRequestSchema
  >;
export type TheSportsDBV2EventResultsLookupMethod =
  TheSportsDBRequestEndpointMethod<
    TheSportsDBV2EventLookupRequest,
    TheSportsDBV2EventResultsResponse,
    typeof TheSportsDBV2EventLookupRequestSchema
  >;
export type TheSportsDBV2EventStatsLookupMethod =
  TheSportsDBRequestEndpointMethod<
    TheSportsDBV2EventLookupRequest,
    TheSportsDBV2EventStatisticsResponse,
    typeof TheSportsDBV2EventLookupRequestSchema
  >;
export type TheSportsDBV2EventTimelineLookupMethod =
  TheSportsDBRequestEndpointMethod<
    TheSportsDBV2EventLookupRequest,
    TheSportsDBV2EventTimelineResponse,
    typeof TheSportsDBV2EventLookupRequestSchema
  >;
export type TheSportsDBV2EventTvLookupMethod = TheSportsDBRequestEndpointMethod<
  TheSportsDBV2EventLookupRequest,
  TheSportsDBV2EventBroadcastResponse,
  typeof TheSportsDBV2EventLookupRequestSchema
>;
export type TheSportsDBV2EventHighlightsLookupMethod =
  TheSportsDBRequestEndpointMethod<
    TheSportsDBV2EventLookupRequest,
    TheSportsDBV2EventLookupResponse,
    typeof TheSportsDBV2EventLookupRequestSchema
  >;
export type TheSportsDBV2VenueLookupMethod = TheSportsDBRequestEndpointMethod<
  TheSportsDBV2VenueLookupRequest,
  TheSportsDBV2VenueResponse,
  typeof TheSportsDBV2VenueLookupRequestSchema
>;

export type TheSportsDBV2SearchLeagueMethod = TheSportsDBRequestMethod<
  TheSportsDBSearchLeagueRequest,
  TheSportsDBLeagueSearchResponse
>;
export type TheSportsDBV2SearchTeamMethod = TheSportsDBRequestMethod<
  TheSportsDBSearchTeamRequest,
  TheSportsDBTeamSearchResponse
>;
export type TheSportsDBV2SearchPlayerMethod = TheSportsDBRequestMethod<
  TheSportsDBSearchPlayerRequest,
  TheSportsDBPlayerSearchResponse
>;
export type TheSportsDBV2SearchEventMethod = TheSportsDBRequestMethod<
  TheSportsDBSearchEventRequest,
  TheSportsDBEventSearchResponse
>;
export type TheSportsDBV2SearchVenueMethod = TheSportsDBRequestMethod<
  TheSportsDBSearchVenueRequest,
  TheSportsDBVenueSearchResponse
>;
export type TheSportsDBV2AllCountriesMethod =
  TheSportsDBEndpointMethod<TheSportsDBCountryLookupResponse>;
export type TheSportsDBV2AllSportsMethod =
  TheSportsDBEndpointMethod<TheSportsDBSportListResponse>;
export type TheSportsDBV2AllLeaguesMethod =
  TheSportsDBEndpointMethod<TheSportsDBLeagueListResponse>;
export type TheSportsDBV2ListTeamsMethod = TheSportsDBRequestMethod<
  TheSportsDBLeagueIdRequest,
  TheSportsDBTeamListResponse
>;
export type TheSportsDBV2ListSeasonsMethod = TheSportsDBRequestMethod<
  TheSportsDBLeagueIdRequest,
  TheSportsDBSeasonListResponse
>;
export type TheSportsDBV2ListSeasonPostersMethod = TheSportsDBRequestMethod<
  TheSportsDBLeagueIdRequest,
  TheSportsDBSeasonPosterListResponse
>;
export type TheSportsDBV2ListPlayersMethod = TheSportsDBRequestMethod<
  TheSportsDBTeamIdRequest,
  TheSportsDBPlayerListResponse
>;
export type TheSportsDBV2FilterTvDayMethod = TheSportsDBRequestMethod<
  TheSportsDBFilterTvDayRequest,
  TheSportsDBEventFilterResponse
>;
export type TheSportsDBV2FilterTvCountryMethod = TheSportsDBRequestMethod<
  TheSportsDBFilterTvCountryRequest,
  TheSportsDBEventFilterResponse
>;
export type TheSportsDBV2FilterTvSportMethod = TheSportsDBRequestMethod<
  TheSportsDBFilterTvSportRequest,
  TheSportsDBEventFilterResponse
>;
export type TheSportsDBV2FilterTvChannelMethod = TheSportsDBRequestMethod<
  TheSportsDBFilterTvChannelRequest,
  TheSportsDBEventFilterResponse
>;
export type TheSportsDBV2FilterTvChannelIdMethod = TheSportsDBRequestMethod<
  TheSportsDBFilterTvChannelIdRequest,
  TheSportsDBEventFilterResponse
>;

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

export interface TheSportsDBV2LookupNamespace {
  league: TheSportsDBV2LeagueLookupMethod;
  team: TheSportsDBV2TeamLookupMethod;
  teamEquipment: TheSportsDBV2TeamEquipmentLookupMethod;
  player: TheSportsDBV2PlayerLookupMethod;
  playerContracts: TheSportsDBV2PlayerContractsLookupMethod;
  playerResults: TheSportsDBV2PlayerResultsLookupMethod;
  playerHonours: TheSportsDBV2PlayerHonoursLookupMethod;
  playerMilestones: TheSportsDBV2PlayerMilestonesLookupMethod;
  playerTeams: TheSportsDBV2PlayerTeamsLookupMethod;
  playerStats: TheSportsDBV2PlayerStatsLookupMethod;
  event: TheSportsDBV2EventLookupMethod;
  eventLineup: TheSportsDBV2EventLineupLookupMethod;
  eventResults: TheSportsDBV2EventResultsLookupMethod;
  eventStats: TheSportsDBV2EventStatsLookupMethod;
  eventTimeline: TheSportsDBV2EventTimelineLookupMethod;
  eventTv: TheSportsDBV2EventTvLookupMethod;
  eventHighlights: TheSportsDBV2EventHighlightsLookupMethod;
  venue: TheSportsDBV2VenueLookupMethod;
}

export interface TheSportsDBV2SearchNamespace {
  league: TheSportsDBV2SearchLeagueMethod;
  team: TheSportsDBV2SearchTeamMethod;
  player: TheSportsDBV2SearchPlayerMethod;
  event: TheSportsDBV2SearchEventMethod;
  venue: TheSportsDBV2SearchVenueMethod;
}

export interface TheSportsDBV2AllNamespace {
  countries: TheSportsDBV2AllCountriesMethod;
  sports: TheSportsDBV2AllSportsMethod;
  leagues: TheSportsDBV2AllLeaguesMethod;
}

export interface TheSportsDBV2ListNamespace {
  teams: TheSportsDBV2ListTeamsMethod;
  seasons: TheSportsDBV2ListSeasonsMethod;
  seasonposters: TheSportsDBV2ListSeasonPostersMethod;
  players: TheSportsDBV2ListPlayersMethod;
}

export interface TheSportsDBV2FilterTvNamespace {
  day: TheSportsDBV2FilterTvDayMethod;
  country: TheSportsDBV2FilterTvCountryMethod;
  sport: TheSportsDBV2FilterTvSportMethod;
  channel: TheSportsDBV2FilterTvChannelMethod;
  channelid: TheSportsDBV2FilterTvChannelIdMethod;
}

export interface TheSportsDBV2FilterNamespace {
  tv: TheSportsDBV2FilterTvNamespace;
}

export interface TheSportsDBV2Namespace {
  lookup: TheSportsDBV2LookupNamespace;
  schedule: TheSportsDBV2ScheduleNamespace;
  livescore: TheSportsDBV2LiveScoreNamespace;
  search: TheSportsDBV2SearchNamespace;
  all: TheSportsDBV2AllNamespace;
  list: TheSportsDBV2ListNamespace;
  filter: TheSportsDBV2FilterNamespace;
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

export type {
  TheSportsDBEquipmentLookupParsedRequest,
  TheSportsDBLeagueLookupParsedRequest,
  TheSportsDBLeagueScheduleParsedRequest,
  TheSportsDBLeagueSeasonScheduleParsedRequest,
  TheSportsDBLiveScoreLeagueParsedRequest,
  TheSportsDBLiveScoreSportParsedRequest,
  TheSportsDBTableLookupParsedRequest,
  TheSportsDBTeamLookupParsedRequest,
  TheSportsDBTeamScheduleParsedRequest,
  TheSportsDBV2EventLookupParsedRequest,
  TheSportsDBV2LeagueLookupParsedRequest,
  TheSportsDBV2PlayerLookupParsedRequest,
  TheSportsDBV2TeamLookupParsedRequest,
  TheSportsDBV2VenueLookupParsedRequest,
  TheSportsDBVenueLookupParsedRequest,
  TheSportsDBVenueScheduleParsedRequest,
} from "./zod";
