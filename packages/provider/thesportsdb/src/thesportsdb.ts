import { attachExamples } from "./example";
import { TheSportsDBError } from "./types";
import type {
  TheSportsDBCountriesResponse,
  TheSportsDBCountryLookupResponse,
  TheSportsDBEquipmentLookupRequest,
  TheSportsDBEquipmentLookupResponse,
  TheSportsDBEventFilterResponse,
  TheSportsDBEventScheduleList,
  TheSportsDBEventsDayRequest,
  TheSportsDBEventsHighlightsRequest,
  TheSportsDBEventsResponse,
  TheSportsDBEventLookupRequest,
  TheSportsDBEventResponse,
  TheSportsDBEventResultsResponse,
  TheSportsDBEventSearchResponse,
  TheSportsDBEventStatsResponse,
  TheSportsDBEventsSeasonRequest,
  TheSportsDBEventsTVRequest,
  TheSportsDBFilenameSearchResponse,
  TheSportsDBLeagueEventsRequest,
  TheSportsDBLeagueListResponse,
  TheSportsDBLeagueLookupRequest,
  TheSportsDBLeagueLookupResponse,
  TheSportsDBLeagueScheduleRequest,
  TheSportsDBLeagueSeasonScheduleRequest,
  TheSportsDBLeagueSearchResponse,
  TheSportsDBLeaguesResponse,
  TheSportsDBLineupResponse,
  TheSportsDBLiveScoreLeagueRequest,
  TheSportsDBLiveScoreList,
  TheSportsDBLiveScoreSportRequest,
  TheSportsDBLookupAllPlayersRequest,
  TheSportsDBLookupContractsResponse,
  TheSportsDBLookupFormerTeamsResponse,
  TheSportsDBLookupHonoursResponse,
  TheSportsDBLookupMilestonesResponse,
  TheSportsDBLookupPlayerResponse,
  TheSportsDBLookupPlayerStatsResponse,
  TheSportsDBOptions,
  TheSportsDBPlayerListResponse,
  TheSportsDBPlayerIdRequest,
  TheSportsDBPlayerResultsResponse,
  TheSportsDBPlayerSearchResponse,
  TheSportsDBPlayersResponse,
  TheSportsDBProvider,
  TheSportsDBResultsResponse,
  TheSportsDBSeasonListResponse,
  TheSportsDBSeasonPosterListResponse,
  TheSportsDBSearchAllLeaguesRequest,
  TheSportsDBSearchAllLeaguesResponse,
  TheSportsDBSearchAllSeasonsRequest,
  TheSportsDBSearchAllTeamsRequest,
  TheSportsDBSearchEventsRequest,
  TheSportsDBSearchFilenameRequest,
  TheSportsDBSearchPlayersRequest,
  TheSportsDBSearchTeamsRequest,
  TheSportsDBSearchVenuesRequest,
  TheSportsDBSeasonsResponse,
  TheSportsDBSportListResponse,
  TheSportsDBSportsResponse,
  TheSportsDBTableLookupRequest,
  TheSportsDBTableLookupResponse,
  TheSportsDBTeamEventsRequest,
  TheSportsDBTeamListResponse,
  TheSportsDBTeamLookupRequest,
  TheSportsDBTeamLookupResponse,
  TheSportsDBTeamScheduleRequest,
  TheSportsDBTeamSearchResponse,
  TheSportsDBTeamsResponse,
  TheSportsDBTimelineResponse,
  TheSportsDBTvEventResponse,
  TheSportsDBTVEventsResponse,
  TheSportsDBTVHighlightsResponse,
  TheSportsDBV2EventBroadcastResponse,
  TheSportsDBV2EventLineupResponse,
  TheSportsDBV2EventLookupRequest,
  TheSportsDBV2EventLookupResponse,
  TheSportsDBV2EventResultsResponse,
  TheSportsDBV2EventStatisticsResponse,
  TheSportsDBV2EventTimelineResponse,
  TheSportsDBV2FormerTeamsResponse,
  TheSportsDBV2LeagueLookupRequest,
  TheSportsDBV2LeagueLookupResponse,
  TheSportsDBV2PlayerCareerHistoryResponse,
  TheSportsDBV2PlayerHonourLookupResponse,
  TheSportsDBV2PlayerLookupRequest,
  TheSportsDBV2PlayerLookupResponse,
  TheSportsDBV2PlayerMilestonesResponse,
  TheSportsDBV2PlayerResultsResponse,
  TheSportsDBV2PlayerStatsResponse,
  TheSportsDBV2TeamEquipmentsResponse,
  TheSportsDBV2TeamInfoResponse,
  TheSportsDBV2TeamLookupRequest,
  TheSportsDBV2VenueLookupRequest,
  TheSportsDBV2VenueResponse,
  TheSportsDBVenueLookupRequest,
  TheSportsDBVenueLookupResponse,
  TheSportsDBVenueScheduleRequest,
  TheSportsDBVenueSearchResponse,
  TheSportsDBVenuesResponse,
} from "./types";
import {
  TheSportsDBEquipmentLookupRequestSchema,
  TheSportsDBEventLookupRequestSchema,
  TheSportsDBEventsDayRequestSchema,
  TheSportsDBEventsHighlightsRequestSchema,
  TheSportsDBEventsSeasonRequestSchema,
  TheSportsDBEventsTVRequestSchema,
  TheSportsDBFilterTvChannelIdRequestSchema,
  type TheSportsDBFilterTvChannelIdRequest,
  TheSportsDBFilterTvChannelRequestSchema,
  type TheSportsDBFilterTvChannelRequest,
  TheSportsDBFilterTvCountryRequestSchema,
  type TheSportsDBFilterTvCountryRequest,
  TheSportsDBFilterTvDayRequestSchema,
  type TheSportsDBFilterTvDayRequest,
  TheSportsDBFilterTvSportRequestSchema,
  type TheSportsDBFilterTvSportRequest,
  TheSportsDBLeagueEventsRequestSchema,
  TheSportsDBLeagueIdRequestSchema,
  type TheSportsDBLeagueIdRequest,
  TheSportsDBLeagueLookupRequestSchema,
  TheSportsDBLeagueScheduleRequestSchema,
  TheSportsDBLeagueSeasonScheduleRequestSchema,
  TheSportsDBLiveScoreLeagueRequestSchema,
  TheSportsDBLiveScoreSportRequestSchema,
  TheSportsDBLookupAllPlayersRequestSchema,
  TheSportsDBPlayerIdRequestSchema,
  TheSportsDBSearchAllLeaguesRequestSchema,
  TheSportsDBSearchAllSeasonsRequestSchema,
  TheSportsDBSearchAllTeamsRequestSchema,
  TheSportsDBSearchEventRequestSchema,
  type TheSportsDBSearchEventRequest,
  TheSportsDBSearchEventsRequestSchema,
  TheSportsDBSearchFilenameRequestSchema,
  TheSportsDBSearchLeagueRequestSchema,
  type TheSportsDBSearchLeagueRequest,
  TheSportsDBSearchPlayerRequestSchema,
  type TheSportsDBSearchPlayerRequest,
  TheSportsDBSearchPlayersRequestSchema,
  TheSportsDBSearchTeamRequestSchema,
  type TheSportsDBSearchTeamRequest,
  TheSportsDBSearchTeamsRequestSchema,
  TheSportsDBSearchVenueRequestSchema,
  type TheSportsDBSearchVenueRequest,
  TheSportsDBSearchVenuesRequestSchema,
  TheSportsDBTableLookupRequestSchema,
  TheSportsDBTeamEventsRequestSchema,
  TheSportsDBTeamIdRequestSchema,
  type TheSportsDBTeamIdRequest,
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

type TheSportsDBQueryValue = string | number | boolean | null | undefined;

export function createTheSportsDB(
  opts?: TheSportsDBOptions
): TheSportsDBProvider {
  const v1BaseURL = (
    opts?.baseURL ?? "https://www.thesportsdb.com/api/v1/json"
  ).replace(/\/+$/, "");
  const v2BaseURL = (
    opts?.v2BaseURL ?? "https://www.thesportsdb.com/api/v2/json"
  ).replace(/\/+$/, "");
  const apiKey = encodeURIComponent(opts?.apiKey ?? "123");
  const v2ApiKey = opts?.apiKey;
  const doFetch = opts?.fetch ?? fetch;
  const timeout = opts?.timeout ?? 30000;

  function attachAbortHandler(
    signal: AbortSignal,
    controller: AbortController
  ): void {
    if (signal.aborted) {
      controller.abort();
      return;
    }
    signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  function formatErrorMessage(status: number, body: unknown): string {
    if (typeof body === "object" && body !== null) {
      const b = body as {
        error?: string | { message?: string };
        message?: string;
      };
      if (typeof b.error === "string") {
        return `TheSportsDB API error ${status}: ${b.error}`;
      }
      if (b.error?.message) {
        return `TheSportsDB API error ${status}: ${b.error.message}`;
      }
      if (b.message) {
        return `TheSportsDB API error ${status}: ${b.message}`;
      }
    }
    if (typeof body === "string" && body.length > 0) {
      return `TheSportsDB API error ${status}: ${body}`;
    }
    return `TheSportsDB API error: ${status}`;
  }

  function createLocalError(status: number, message: string): TheSportsDBError {
    return new TheSportsDBError(
      formatErrorMessage(status, { error: message }),
      status,
      { error: message }
    );
  }

  function requireV2ApiKey(): string {
    if (!v2ApiKey || v2ApiKey.trim().length === 0) {
      throw createLocalError(
        401,
        "TheSportsDB V2 requires apiKey for X-API-KEY authentication"
      );
    }
    return v2ApiKey;
  }

  async function parseResponseBody(res: Response): Promise<unknown> {
    const text = await res.text();
    if (!text) {
      return null;
    }
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text;
    }
  }

  async function makeJsonRequest<T>(
    method: "GET",
    requestBaseURL: string,
    path: string,
    signal?: AbortSignal,
    headers?: HeadersInit
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    try {
      const init: RequestInit = {
        method,
        signal: controller.signal,
      };
      if (headers) {
        init.headers = headers;
      }
      const res = await doFetch(`${requestBaseURL}${path}`, init);

      clearTimeout(timeoutId);

      const resBody = await parseResponseBody(res);

      if (!res.ok) {
        throw new TheSportsDBError(
          formatErrorMessage(res.status, resBody),
          res.status,
          resBody
        );
      }

      return resBody as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof TheSportsDBError) throw error;
      throw new TheSportsDBError(`TheSportsDB request failed: ${error}`, 500);
    }
  }

  async function makeV1Request<T>(
    method: "GET",
    path: string,
    requestBaseURL: string,
    signal?: AbortSignal
  ): Promise<T> {
    return makeJsonRequest<T>(method, requestBaseURL, path, signal);
  }

  async function makeV2Request<T>(
    method: "GET",
    path: string,
    requestBaseURL: string,
    signal?: AbortSignal
  ): Promise<T> {
    return makeJsonRequest<T>(method, requestBaseURL, path, signal, {
      "X-API-KEY": requireV2ApiKey(),
    });
  }

  function buildPath(...segments: Array<string | number>): string {
    return `/${segments.map((s) => encodeURIComponent(String(s))).join("/")}`;
  }

  function buildQuery(params: Record<string, TheSportsDBQueryValue>): string {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        qs.append(key, String(value));
      }
    }
    const query = qs.toString();
    return query ? `?${query}` : "";
  }

  function eventIdQuery(req: TheSportsDBEventLookupRequest): string {
    return buildQuery({ id: req.idEvent });
  }

  function flagQueryValue(
    value: boolean | 0 | 1 | undefined
  ): number | undefined {
    if (value === undefined) {
      return undefined;
    }
    if (typeof value === "boolean") {
      return value ? 1 : 0;
    }
    return value;
  }

  // sig-ok: V1 PHP script names exposed as catalog methods.
  // GET https://www.thesportsdb.com/api/v1/json/{apiKey}/all_sports.php
  // Docs: https://thedatadb.readme.io/reference/getallsports
  const allSports = Object.assign(
    async (signal?: AbortSignal): Promise<TheSportsDBSportsResponse> => {
      return makeV1Request<TheSportsDBSportsResponse>(
        "GET",
        `/${apiKey}/all_sports.php`,
        v1BaseURL,
        signal
      );
    },
    { schema: undefined }
  );

  // sig-ok: V1 PHP script names exposed as catalog methods.
  // GET https://www.thesportsdb.com/api/v1/json/{apiKey}/all_countries.php
  // Docs: https://thedatadb.readme.io/reference/getallcountries
  const allCountries = Object.assign(
    async (signal?: AbortSignal): Promise<TheSportsDBCountriesResponse> => {
      return makeV1Request<TheSportsDBCountriesResponse>(
        "GET",
        `/${apiKey}/all_countries.php`,
        v1BaseURL,
        signal
      );
    },
    { schema: undefined }
  );

  // sig-ok: V1 PHP script names exposed as catalog methods.
  // GET https://www.thesportsdb.com/api/v1/json/{apiKey}/all_leagues.php
  // Docs: https://www.thesportsdb.com/docs_api_guide#v1-list
  const allLeagues = Object.assign(
    async (signal?: AbortSignal): Promise<TheSportsDBLeaguesResponse> => {
      return makeV1Request<TheSportsDBLeaguesResponse>(
        "GET",
        `/${apiKey}/all_leagues.php`,
        v1BaseURL,
        signal
      );
    },
    { schema: undefined }
  );

  // sig-ok: semantic V1 lookup namespace over TheSportsDB PHP script names.
  // GET https://www.thesportsdb.com/api/v1/json/{apiKey}/lookupleague.php{query}
  // Docs: https://www.thesportsdb.com/docs_api_guide
  const league = Object.assign(
    async (
      req: TheSportsDBLeagueLookupRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBLeagueLookupResponse> => {
      const query = buildQuery({ id: req.idLeague });
      return makeV1Request<TheSportsDBLeagueLookupResponse>(
        "GET",
        `/${apiKey}/lookupleague.php${query}`,
        v1BaseURL,
        signal
      );
    },
    { schema: TheSportsDBLeagueLookupRequestSchema }
  );

  // sig-ok: semantic V1 lookup namespace over TheSportsDB PHP script names.
  // GET https://www.thesportsdb.com/api/v1/json/{apiKey}/lookuptable.php{query}
  // Docs: https://www.thesportsdb.com/docs_api_guide
  const table = Object.assign(
    async (
      req: TheSportsDBTableLookupRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBTableLookupResponse> => {
      const query = buildQuery({
        l: req.idLeague,
        s: req.season,
      });
      return makeV1Request<TheSportsDBTableLookupResponse>(
        "GET",
        `/${apiKey}/lookuptable.php${query}`,
        v1BaseURL,
        signal
      );
    },
    { schema: TheSportsDBTableLookupRequestSchema }
  );

  // sig-ok: semantic V1 lookup namespace over TheSportsDB PHP script names.
  // GET https://www.thesportsdb.com/api/v1/json/{apiKey}/lookupteam.php{query}
  // Docs: https://www.thesportsdb.com/docs_api_guide
  const team = Object.assign(
    async (
      req: TheSportsDBTeamLookupRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBTeamLookupResponse> => {
      const query = buildQuery({ id: req.idTeam });
      return makeV1Request<TheSportsDBTeamLookupResponse>(
        "GET",
        `/${apiKey}/lookupteam.php${query}`,
        v1BaseURL,
        signal
      );
    },
    { schema: TheSportsDBTeamLookupRequestSchema }
  );

  // sig-ok: semantic V1 lookup namespace over TheSportsDB PHP script names.
  // GET https://www.thesportsdb.com/api/v1/json/{apiKey}/lookupequipment.php{query}
  // Docs: https://www.thesportsdb.com/docs_api_guide
  const equipment = Object.assign(
    async (
      req: TheSportsDBEquipmentLookupRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBEquipmentLookupResponse> => {
      const query = buildQuery({ id: req.idTeam });
      return makeV1Request<TheSportsDBEquipmentLookupResponse>(
        "GET",
        `/${apiKey}/lookupequipment.php${query}`,
        v1BaseURL,
        signal
      );
    },
    { schema: TheSportsDBEquipmentLookupRequestSchema }
  );

  // sig-ok: semantic V1 lookup namespace over TheSportsDB PHP script names.
  // GET https://www.thesportsdb.com/api/v1/json/{apiKey}/lookupvenue.php{query}
  // Docs: https://www.thesportsdb.com/docs_api_guide
  const venue = Object.assign(
    async (
      req: TheSportsDBVenueLookupRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBVenueLookupResponse> => {
      const query = buildQuery({ id: req.idVenue });
      return makeV1Request<TheSportsDBVenueLookupResponse>(
        "GET",
        `/${apiKey}/lookupvenue.php${query}`,
        v1BaseURL,
        signal
      );
    },
    { schema: TheSportsDBVenueLookupRequestSchema }
  );

  // GET https://www.thesportsdb.com/api/v2/json/lookup/league/{idLeague}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v2-lookup
  const v2League = Object.assign(
    async (
      req: TheSportsDBV2LeagueLookupRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBV2LeagueLookupResponse> => {
      return makeV2Request<TheSportsDBV2LeagueLookupResponse>(
        "GET",
        buildPath("lookup", "league", req.idLeague),
        v2BaseURL,
        signal
      );
    },
    { schema: TheSportsDBV2LeagueLookupRequestSchema }
  );

  // GET https://www.thesportsdb.com/api/v2/json/lookup/team/{idTeam}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v2-lookup
  const v2Team = Object.assign(
    async (
      req: TheSportsDBV2TeamLookupRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBV2TeamInfoResponse> => {
      return makeV2Request<TheSportsDBV2TeamInfoResponse>(
        "GET",
        buildPath("lookup", "team", req.idTeam),
        v2BaseURL,
        signal
      );
    },
    { schema: TheSportsDBV2TeamLookupRequestSchema }
  );

  // GET https://www.thesportsdb.com/api/v2/json/lookup/team_equipment/{idTeam}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v2-lookup
  const v2TeamEquipment = Object.assign(
    async (
      req: TheSportsDBV2TeamLookupRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBV2TeamEquipmentsResponse> => {
      return makeV2Request<TheSportsDBV2TeamEquipmentsResponse>(
        "GET",
        buildPath("lookup", "team_equipment", req.idTeam),
        v2BaseURL,
        signal
      );
    },
    { schema: TheSportsDBV2TeamLookupRequestSchema }
  );

  // GET https://www.thesportsdb.com/api/v2/json/lookup/player/{idPlayer}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v2-lookup
  const v2Player = Object.assign(
    async (
      req: TheSportsDBV2PlayerLookupRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBV2PlayerLookupResponse> => {
      return makeV2Request<TheSportsDBV2PlayerLookupResponse>(
        "GET",
        buildPath("lookup", "player", req.idPlayer),
        v2BaseURL,
        signal
      );
    },
    { schema: TheSportsDBV2PlayerLookupRequestSchema }
  );

  // GET https://www.thesportsdb.com/api/v2/json/lookup/player_contracts/{idPlayer}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v2-lookup
  const v2PlayerContracts = Object.assign(
    async (
      req: TheSportsDBV2PlayerLookupRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBV2PlayerCareerHistoryResponse> => {
      return makeV2Request<TheSportsDBV2PlayerCareerHistoryResponse>(
        "GET",
        buildPath("lookup", "player_contracts", req.idPlayer),
        v2BaseURL,
        signal
      );
    },
    { schema: TheSportsDBV2PlayerLookupRequestSchema }
  );

  // GET https://www.thesportsdb.com/api/v2/json/lookup/player_results/{idPlayer}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v2-lookup
  const v2PlayerResults = Object.assign(
    async (
      req: TheSportsDBV2PlayerLookupRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBV2PlayerResultsResponse> => {
      return makeV2Request<TheSportsDBV2PlayerResultsResponse>(
        "GET",
        buildPath("lookup", "player_results", req.idPlayer),
        v2BaseURL,
        signal
      );
    },
    { schema: TheSportsDBV2PlayerLookupRequestSchema }
  );

  // GET https://www.thesportsdb.com/api/v2/json/lookup/player_honours/{idPlayer}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v2-lookup
  const v2PlayerHonours = Object.assign(
    async (
      req: TheSportsDBV2PlayerLookupRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBV2PlayerHonourLookupResponse> => {
      return makeV2Request<TheSportsDBV2PlayerHonourLookupResponse>(
        "GET",
        buildPath("lookup", "player_honours", req.idPlayer),
        v2BaseURL,
        signal
      );
    },
    { schema: TheSportsDBV2PlayerLookupRequestSchema }
  );

  // GET https://www.thesportsdb.com/api/v2/json/lookup/player_milestones/{idPlayer}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v2-lookup
  const v2PlayerMilestones = Object.assign(
    async (
      req: TheSportsDBV2PlayerLookupRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBV2PlayerMilestonesResponse> => {
      return makeV2Request<TheSportsDBV2PlayerMilestonesResponse>(
        "GET",
        buildPath("lookup", "player_milestones", req.idPlayer),
        v2BaseURL,
        signal
      );
    },
    { schema: TheSportsDBV2PlayerLookupRequestSchema }
  );

  // GET https://www.thesportsdb.com/api/v2/json/lookup/player_teams/{idPlayer}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v2-lookup
  const v2PlayerTeams = Object.assign(
    async (
      req: TheSportsDBV2PlayerLookupRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBV2FormerTeamsResponse> => {
      return makeV2Request<TheSportsDBV2FormerTeamsResponse>(
        "GET",
        buildPath("lookup", "player_teams", req.idPlayer),
        v2BaseURL,
        signal
      );
    },
    { schema: TheSportsDBV2PlayerLookupRequestSchema }
  );

  // GET https://www.thesportsdb.com/api/v2/json/lookup/player_stats/{idPlayer}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v2-lookup
  const v2PlayerStats = Object.assign(
    async (
      req: TheSportsDBV2PlayerLookupRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBV2PlayerStatsResponse> => {
      return makeV2Request<TheSportsDBV2PlayerStatsResponse>(
        "GET",
        buildPath("lookup", "player_stats", req.idPlayer),
        v2BaseURL,
        signal
      );
    },
    { schema: TheSportsDBV2PlayerLookupRequestSchema }
  );

  // GET https://www.thesportsdb.com/api/v2/json/lookup/event/{idEvent}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v2-lookup
  const v2Event = Object.assign(
    async (
      req: TheSportsDBV2EventLookupRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBV2EventLookupResponse> => {
      return makeV2Request<TheSportsDBV2EventLookupResponse>(
        "GET",
        buildPath("lookup", "event", req.idEvent),
        v2BaseURL,
        signal
      );
    },
    { schema: TheSportsDBV2EventLookupRequestSchema }
  );

  // GET https://www.thesportsdb.com/api/v2/json/lookup/event_lineup/{idEvent}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v2-lookup
  const v2EventLineup = Object.assign(
    async (
      req: TheSportsDBV2EventLookupRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBV2EventLineupResponse> => {
      return makeV2Request<TheSportsDBV2EventLineupResponse>(
        "GET",
        buildPath("lookup", "event_lineup", req.idEvent),
        v2BaseURL,
        signal
      );
    },
    { schema: TheSportsDBV2EventLookupRequestSchema }
  );

  // GET https://www.thesportsdb.com/api/v2/json/lookup/event_results/{idEvent}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v2-lookup
  const v2EventResults = Object.assign(
    async (
      req: TheSportsDBV2EventLookupRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBV2EventResultsResponse> => {
      return makeV2Request<TheSportsDBV2EventResultsResponse>(
        "GET",
        buildPath("lookup", "event_results", req.idEvent),
        v2BaseURL,
        signal
      );
    },
    { schema: TheSportsDBV2EventLookupRequestSchema }
  );

  // GET https://www.thesportsdb.com/api/v2/json/lookup/event_stats/{idEvent}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v2-lookup
  const v2EventStats = Object.assign(
    async (
      req: TheSportsDBV2EventLookupRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBV2EventStatisticsResponse> => {
      return makeV2Request<TheSportsDBV2EventStatisticsResponse>(
        "GET",
        buildPath("lookup", "event_stats", req.idEvent),
        v2BaseURL,
        signal
      );
    },
    { schema: TheSportsDBV2EventLookupRequestSchema }
  );

  // GET https://www.thesportsdb.com/api/v2/json/lookup/event_timeline/{idEvent}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v2-lookup
  const v2EventTimeline = Object.assign(
    async (
      req: TheSportsDBV2EventLookupRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBV2EventTimelineResponse> => {
      return makeV2Request<TheSportsDBV2EventTimelineResponse>(
        "GET",
        buildPath("lookup", "event_timeline", req.idEvent),
        v2BaseURL,
        signal
      );
    },
    { schema: TheSportsDBV2EventLookupRequestSchema }
  );

  // GET https://www.thesportsdb.com/api/v2/json/lookup/event_tv/{idEvent}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v2-lookup
  const v2EventTv = Object.assign(
    async (
      req: TheSportsDBV2EventLookupRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBV2EventBroadcastResponse> => {
      return makeV2Request<TheSportsDBV2EventBroadcastResponse>(
        "GET",
        buildPath("lookup", "event_tv", req.idEvent),
        v2BaseURL,
        signal
      );
    },
    { schema: TheSportsDBV2EventLookupRequestSchema }
  );

  // GET https://www.thesportsdb.com/api/v2/json/lookup/event_highlights/{idEvent}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v2-lookup
  const v2EventHighlights = Object.assign(
    async (
      req: TheSportsDBV2EventLookupRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBV2EventLookupResponse> => {
      return makeV2Request<TheSportsDBV2EventLookupResponse>(
        "GET",
        buildPath("lookup", "event_highlights", req.idEvent),
        v2BaseURL,
        signal
      );
    },
    { schema: TheSportsDBV2EventLookupRequestSchema }
  );

  // GET https://www.thesportsdb.com/api/v2/json/lookup/venue/{idVenue}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v2-lookup
  const v2Venue = Object.assign(
    async (
      req: TheSportsDBV2VenueLookupRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBV2VenueResponse> => {
      return makeV2Request<TheSportsDBV2VenueResponse>(
        "GET",
        buildPath("lookup", "venue", req.idVenue),
        v2BaseURL,
        signal
      );
    },
    { schema: TheSportsDBV2VenueLookupRequestSchema }
  );

  const lookup = {
    league,
    table,
    team,
    equipment,
    venue,
  };

  // sig-ok: V2 namespace omits the fixed /api/v2/json base path.
  // GET https://www.thesportsdb.com/api/v2/json/search/league/{leagueName}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v2-search
  const searchLeague = Object.assign(
    async (
      req: TheSportsDBSearchLeagueRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBLeagueSearchResponse> => {
      return makeV2Request<TheSportsDBLeagueSearchResponse>(
        "GET",
        buildPath("search", "league", req.leagueName),
        v2BaseURL,
        signal
      );
    },
    { schema: TheSportsDBSearchLeagueRequestSchema }
  );

  // sig-ok: V2 namespace omits the fixed /api/v2/json base path.
  // GET https://www.thesportsdb.com/api/v2/json/search/team/{teamName}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v2-search
  const searchTeam = Object.assign(
    async (
      req: TheSportsDBSearchTeamRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBTeamSearchResponse> => {
      return makeV2Request<TheSportsDBTeamSearchResponse>(
        "GET",
        buildPath("search", "team", req.teamName),
        v2BaseURL,
        signal
      );
    },
    { schema: TheSportsDBSearchTeamRequestSchema }
  );

  // sig-ok: V2 namespace omits the fixed /api/v2/json base path.
  // GET https://www.thesportsdb.com/api/v2/json/search/player/{playerName}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v2-search
  const searchPlayer = Object.assign(
    async (
      req: TheSportsDBSearchPlayerRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBPlayerSearchResponse> => {
      return makeV2Request<TheSportsDBPlayerSearchResponse>(
        "GET",
        buildPath("search", "player", req.playerName),
        v2BaseURL,
        signal
      );
    },
    { schema: TheSportsDBSearchPlayerRequestSchema }
  );

  // sig-ok: V2 namespace omits the fixed /api/v2/json base path.
  // GET https://www.thesportsdb.com/api/v2/json/search/event/{eventName}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v2-search
  const searchEvent = Object.assign(
    async (
      req: TheSportsDBSearchEventRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBEventSearchResponse> => {
      return makeV2Request<TheSportsDBEventSearchResponse>(
        "GET",
        buildPath("search", "event", req.eventName),
        v2BaseURL,
        signal
      );
    },
    { schema: TheSportsDBSearchEventRequestSchema }
  );

  // sig-ok: V2 namespace omits the fixed /api/v2/json base path.
  // GET https://www.thesportsdb.com/api/v2/json/search/venue/{venueName}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v2-search
  const searchVenue = Object.assign(
    async (
      req: TheSportsDBSearchVenueRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBVenueSearchResponse> => {
      return makeV2Request<TheSportsDBVenueSearchResponse>(
        "GET",
        buildPath("search", "venue", req.venueName),
        v2BaseURL,
        signal
      );
    },
    { schema: TheSportsDBSearchVenueRequestSchema }
  );

  // sig-ok: V2 namespace omits the fixed /api/v2/json base path.
  // GET https://www.thesportsdb.com/api/v2/json/all/countries
  // Docs: https://www.thesportsdb.com/docs_api_guide#v2-all
  const v2AllCountries = Object.assign(
    async (signal?: AbortSignal): Promise<TheSportsDBCountryLookupResponse> => {
      return makeV2Request<TheSportsDBCountryLookupResponse>(
        "GET",
        buildPath("all", "countries"),
        v2BaseURL,
        signal
      );
    },
    { schema: undefined }
  );

  // sig-ok: V2 namespace omits the fixed /api/v2/json base path.
  // GET https://www.thesportsdb.com/api/v2/json/all/sports
  // Docs: https://www.thesportsdb.com/docs_api_guide#v2-all
  const v2AllSports = Object.assign(
    async (signal?: AbortSignal): Promise<TheSportsDBSportListResponse> => {
      return makeV2Request<TheSportsDBSportListResponse>(
        "GET",
        buildPath("all", "sports"),
        v2BaseURL,
        signal
      );
    },
    { schema: undefined }
  );

  // sig-ok: V2 namespace omits the fixed /api/v2/json base path.
  // GET https://www.thesportsdb.com/api/v2/json/all/leagues
  // Docs: https://www.thesportsdb.com/docs_api_guide#v2-all
  const v2AllLeagues = Object.assign(
    async (signal?: AbortSignal): Promise<TheSportsDBLeagueListResponse> => {
      return makeV2Request<TheSportsDBLeagueListResponse>(
        "GET",
        buildPath("all", "leagues"),
        v2BaseURL,
        signal
      );
    },
    { schema: undefined }
  );

  // sig-ok: V2 namespace omits the fixed /api/v2/json base path.
  // GET https://www.thesportsdb.com/api/v2/json/list/teams/{idLeague}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v2-list
  const listTeams = Object.assign(
    async (
      req: TheSportsDBLeagueIdRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBTeamListResponse> => {
      return makeV2Request<TheSportsDBTeamListResponse>(
        "GET",
        buildPath("list", "teams", req.idLeague),
        v2BaseURL,
        signal
      );
    },
    { schema: TheSportsDBLeagueIdRequestSchema }
  );

  // sig-ok: V2 namespace omits the fixed /api/v2/json base path.
  // GET https://www.thesportsdb.com/api/v2/json/list/seasons/{idLeague}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v2-list
  const listSeasons = Object.assign(
    async (
      req: TheSportsDBLeagueIdRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBSeasonListResponse> => {
      return makeV2Request<TheSportsDBSeasonListResponse>(
        "GET",
        buildPath("list", "seasons", req.idLeague),
        v2BaseURL,
        signal
      );
    },
    { schema: TheSportsDBLeagueIdRequestSchema }
  );

  // sig-ok: V2 namespace omits the fixed /api/v2/json base path.
  // GET https://www.thesportsdb.com/api/v2/json/list/seasonposters/{idLeague}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v2-list
  const listSeasonposters = Object.assign(
    async (
      req: TheSportsDBLeagueIdRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBSeasonPosterListResponse> => {
      return makeV2Request<TheSportsDBSeasonPosterListResponse>(
        "GET",
        buildPath("list", "seasonposters", req.idLeague),
        v2BaseURL,
        signal
      );
    },
    { schema: TheSportsDBLeagueIdRequestSchema }
  );

  // sig-ok: V2 namespace omits the fixed /api/v2/json base path.
  // GET https://www.thesportsdb.com/api/v2/json/list/players/{idTeam}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v2-list
  const listPlayers = Object.assign(
    async (
      req: TheSportsDBTeamIdRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBPlayerListResponse> => {
      return makeV2Request<TheSportsDBPlayerListResponse>(
        "GET",
        buildPath("list", "players", req.idTeam),
        v2BaseURL,
        signal
      );
    },
    { schema: TheSportsDBTeamIdRequestSchema }
  );

  // sig-ok: V2 namespace omits the fixed /api/v2/json base path.
  // GET https://www.thesportsdb.com/api/v2/json/filter/tv/day/{date}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v2-filter
  const filterTvDay = Object.assign(
    async (
      req: TheSportsDBFilterTvDayRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBEventFilterResponse> => {
      return makeV2Request<TheSportsDBEventFilterResponse>(
        "GET",
        buildPath("filter", "tv", "day", req.date),
        v2BaseURL,
        signal
      );
    },
    { schema: TheSportsDBFilterTvDayRequestSchema }
  );

  // sig-ok: V2 namespace omits the fixed /api/v2/json base path.
  // GET https://www.thesportsdb.com/api/v2/json/filter/tv/country/{country}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v2-filter
  const filterTvCountry = Object.assign(
    async (
      req: TheSportsDBFilterTvCountryRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBEventFilterResponse> => {
      return makeV2Request<TheSportsDBEventFilterResponse>(
        "GET",
        buildPath("filter", "tv", "country", req.country),
        v2BaseURL,
        signal
      );
    },
    { schema: TheSportsDBFilterTvCountryRequestSchema }
  );

  // sig-ok: V2 namespace omits the fixed /api/v2/json base path.
  // GET https://www.thesportsdb.com/api/v2/json/filter/tv/sport/{sport}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v2-filter
  const filterTvSport = Object.assign(
    async (
      req: TheSportsDBFilterTvSportRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBEventFilterResponse> => {
      return makeV2Request<TheSportsDBEventFilterResponse>(
        "GET",
        buildPath("filter", "tv", "sport", req.sport),
        v2BaseURL,
        signal
      );
    },
    { schema: TheSportsDBFilterTvSportRequestSchema }
  );

  // sig-ok: V2 namespace omits the fixed /api/v2/json base path.
  // GET https://www.thesportsdb.com/api/v2/json/filter/tv/channel/{channel}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v2-filter
  const filterTvChannel = Object.assign(
    async (
      req: TheSportsDBFilterTvChannelRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBEventFilterResponse> => {
      return makeV2Request<TheSportsDBEventFilterResponse>(
        "GET",
        buildPath("filter", "tv", "channel", req.channel),
        v2BaseURL,
        signal
      );
    },
    { schema: TheSportsDBFilterTvChannelRequestSchema }
  );

  // sig-ok: V2 namespace omits the fixed /api/v2/json base path.
  // GET https://www.thesportsdb.com/api/v2/json/filter/tv/channelid/{idChannel}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v2-filter
  const filterTvChannelid = Object.assign(
    async (
      req: TheSportsDBFilterTvChannelIdRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBEventFilterResponse> => {
      return makeV2Request<TheSportsDBEventFilterResponse>(
        "GET",
        buildPath("filter", "tv", "channelid", req.idChannel),
        v2BaseURL,
        signal
      );
    },
    { schema: TheSportsDBFilterTvChannelIdRequestSchema }
  );

  // sig-ok: V1 PHP script names exposed as list methods.
  // GET https://www.thesportsdb.com/api/v1/json/{apiKey}/search_all_leagues.php{query}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v1-list
  const searchAllLeagues = Object.assign(
    async (
      req: TheSportsDBSearchAllLeaguesRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBSearchAllLeaguesResponse> => {
      const query = buildQuery({
        c: req.country,
        s: req.sport,
      });
      return makeV1Request<TheSportsDBSearchAllLeaguesResponse>(
        "GET",
        `/${apiKey}/search_all_leagues.php${query}`,
        v1BaseURL,
        signal
      );
    },
    { schema: TheSportsDBSearchAllLeaguesRequestSchema }
  );

  // sig-ok: V1 PHP script names exposed as list methods.
  // GET https://www.thesportsdb.com/api/v1/json/{apiKey}/search_all_seasons.php{query}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v1-list
  const searchAllSeasons = Object.assign(
    async (
      req: TheSportsDBSearchAllSeasonsRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBSeasonsResponse> => {
      const query = buildQuery({
        id: req.idLeague,
        poster: flagQueryValue(req.poster),
        badge: flagQueryValue(req.badge),
        description: flagQueryValue(req.description),
      });
      return makeV1Request<TheSportsDBSeasonsResponse>(
        "GET",
        `/${apiKey}/search_all_seasons.php${query}`,
        v1BaseURL,
        signal
      );
    },
    { schema: TheSportsDBSearchAllSeasonsRequestSchema }
  );

  // sig-ok: V1 PHP script names exposed as list methods.
  // GET https://www.thesportsdb.com/api/v1/json/{apiKey}/search_all_teams.php{query}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v1-list
  const searchAllTeams = Object.assign(
    async (
      req: TheSportsDBSearchAllTeamsRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBTeamsResponse> => {
      const query = buildQuery({
        l: req.league,
        s: req.sport,
        c: req.country,
      });
      return makeV1Request<TheSportsDBTeamsResponse>(
        "GET",
        `/${apiKey}/search_all_teams.php${query}`,
        v1BaseURL,
        signal
      );
    },
    { schema: TheSportsDBSearchAllTeamsRequestSchema }
  );

  // sig-ok: V1 PHP script names exposed as list methods.
  // GET https://www.thesportsdb.com/api/v1/json/{apiKey}/lookup_all_players.php{query}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v1-list
  const lookupAllPlayers = Object.assign(
    async (
      req: TheSportsDBLookupAllPlayersRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBPlayersResponse> => {
      const query = buildQuery({
        id: req.idTeam,
      });
      return makeV1Request<TheSportsDBPlayersResponse>(
        "GET",
        `/${apiKey}/lookup_all_players.php${query}`,
        v1BaseURL,
        signal
      );
    },
    { schema: TheSportsDBLookupAllPlayersRequestSchema }
  );

  // sig-ok: V1 PHP script names exposed as schedule methods.
  // GET https://www.thesportsdb.com/api/v1/json/{apiKey}/eventsnext.php{query}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v1-schedule
  const eventsnext = Object.assign(
    async (
      req: TheSportsDBTeamEventsRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBEventsResponse> => {
      const query = buildQuery({
        id: req.idTeam,
      });
      return makeV1Request<TheSportsDBEventsResponse>(
        "GET",
        `/${apiKey}/eventsnext.php${query}`,
        v1BaseURL,
        signal
      );
    },
    { schema: TheSportsDBTeamEventsRequestSchema }
  );

  // sig-ok: V1 PHP script names exposed as schedule methods.
  // GET https://www.thesportsdb.com/api/v1/json/{apiKey}/eventslast.php{query}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v1-schedule
  const eventslast = Object.assign(
    async (
      req: TheSportsDBTeamEventsRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBResultsResponse> => {
      const query = buildQuery({
        id: req.idTeam,
      });
      return makeV1Request<TheSportsDBResultsResponse>(
        "GET",
        `/${apiKey}/eventslast.php${query}`,
        v1BaseURL,
        signal
      );
    },
    { schema: TheSportsDBTeamEventsRequestSchema }
  );

  // sig-ok: V1 PHP script names exposed as schedule methods.
  // GET https://www.thesportsdb.com/api/v1/json/{apiKey}/eventsnextleague.php{query}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v1-schedule
  const eventsnextleague = Object.assign(
    async (
      req: TheSportsDBLeagueEventsRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBEventsResponse> => {
      const query = buildQuery({
        id: req.idLeague,
      });
      return makeV1Request<TheSportsDBEventsResponse>(
        "GET",
        `/${apiKey}/eventsnextleague.php${query}`,
        v1BaseURL,
        signal
      );
    },
    { schema: TheSportsDBLeagueEventsRequestSchema }
  );

  // sig-ok: V1 PHP script names exposed as schedule methods.
  // GET https://www.thesportsdb.com/api/v1/json/{apiKey}/eventspastleague.php{query}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v1-schedule
  const eventspastleague = Object.assign(
    async (
      req: TheSportsDBLeagueEventsRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBEventsResponse> => {
      const query = buildQuery({
        id: req.idLeague,
      });
      return makeV1Request<TheSportsDBEventsResponse>(
        "GET",
        `/${apiKey}/eventspastleague.php${query}`,
        v1BaseURL,
        signal
      );
    },
    { schema: TheSportsDBLeagueEventsRequestSchema }
  );

  // sig-ok: V1 PHP script names exposed as schedule methods.
  // GET https://www.thesportsdb.com/api/v1/json/{apiKey}/eventsday.php{query}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v1-schedule
  const eventsday = Object.assign(
    async (
      req: TheSportsDBEventsDayRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBEventsResponse> => {
      const query = buildQuery({
        d: req.date,
        s: req.sport,
        l: req.league,
      });
      return makeV1Request<TheSportsDBEventsResponse>(
        "GET",
        `/${apiKey}/eventsday.php${query}`,
        v1BaseURL,
        signal
      );
    },
    { schema: TheSportsDBEventsDayRequestSchema }
  );

  // sig-ok: V1 PHP script names exposed as schedule methods.
  // GET https://www.thesportsdb.com/api/v1/json/{apiKey}/eventsseason.php{query}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v1-schedule
  const eventsseason = Object.assign(
    async (
      req: TheSportsDBEventsSeasonRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBEventsResponse> => {
      const query = buildQuery({
        id: req.idLeague,
        s: req.season,
      });
      return makeV1Request<TheSportsDBEventsResponse>(
        "GET",
        `/${apiKey}/eventsseason.php${query}`,
        v1BaseURL,
        signal
      );
    },
    { schema: TheSportsDBEventsSeasonRequestSchema }
  );

  // sig-ok: V1 PHP script names exposed as schedule methods.
  // GET https://www.thesportsdb.com/api/v1/json/{apiKey}/eventstv.php{query}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v1-schedule
  const eventstv = Object.assign(
    async (
      req: TheSportsDBEventsTVRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBTVEventsResponse> => {
      const query = buildQuery({
        d: req.date,
        a: req.country,
        s: req.sport,
        c: req.channel,
        id: req.idChannel,
      });
      return makeV1Request<TheSportsDBTVEventsResponse>(
        "GET",
        `/${apiKey}/eventstv.php${query}`,
        v1BaseURL,
        signal
      );
    },
    { schema: TheSportsDBEventsTVRequestSchema }
  );

  // sig-ok: V1 PHP script names exposed as video methods.
  // GET https://www.thesportsdb.com/api/v1/json/{apiKey}/eventshighlights.php{query}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v1-video
  const eventshighlights = Object.assign(
    async (
      req: TheSportsDBEventsHighlightsRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBTVHighlightsResponse> => {
      const query = buildQuery({
        d: req.date,
        l: req.idLeague,
        s: req.sport,
      });
      return makeV1Request<TheSportsDBTVHighlightsResponse>(
        "GET",
        `/${apiKey}/eventshighlights.php${query}`,
        v1BaseURL,
        signal
      );
    },
    { schema: TheSportsDBEventsHighlightsRequestSchema }
  );

  // sig-ok: V1 PHP script names exposed as search methods.
  // GET https://www.thesportsdb.com/api/v1/json/{apiKey}/searchteams.php{query}
  // Docs: https://thedatadb.readme.io/reference/getteambyname
  const searchTeams = Object.assign(
    async (
      req: TheSportsDBSearchTeamsRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBTeamsResponse> => {
      const query = buildQuery({ t: req.team });
      return makeV1Request<TheSportsDBTeamsResponse>(
        "GET",
        `/${apiKey}/searchteams.php${query}`,
        v1BaseURL,
        signal
      );
    },
    { schema: TheSportsDBSearchTeamsRequestSchema }
  );

  // sig-ok: V1 PHP script names exposed as search methods.
  // GET https://www.thesportsdb.com/api/v1/json/{apiKey}/searchevents.php{query}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v1-search
  const searchEvents = Object.assign(
    async (
      req: TheSportsDBSearchEventsRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBEventsResponse> => {
      const query = buildQuery({
        e: req.event,
        s: req.season,
        d: req.date,
        f: req.filename,
      });
      return makeV1Request<TheSportsDBEventsResponse>(
        "GET",
        `/${apiKey}/searchevents.php${query}`,
        v1BaseURL,
        signal
      );
    },
    { schema: TheSportsDBSearchEventsRequestSchema }
  );

  // sig-ok: V1 PHP script names exposed as search methods.
  // GET https://www.thesportsdb.com/api/v1/json/{apiKey}/searchfilename.php{query}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v1-search
  const searchFilename = Object.assign(
    async (
      req: TheSportsDBSearchFilenameRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBFilenameSearchResponse> => {
      const query = buildQuery({
        e: req.filename,
        s: req.season,
      });
      return makeV1Request<TheSportsDBFilenameSearchResponse>(
        "GET",
        `/${apiKey}/searchfilename.php${query}`,
        v1BaseURL,
        signal
      );
    },
    { schema: TheSportsDBSearchFilenameRequestSchema }
  );

  // sig-ok: V1 PHP script names exposed as search methods.
  // GET https://www.thesportsdb.com/api/v1/json/{apiKey}/searchplayers.php{query}
  // Docs: https://thedatadb.readme.io/reference/getplayerbyname
  const searchPlayers = Object.assign(
    async (
      req: TheSportsDBSearchPlayersRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBPlayersResponse> => {
      const query = buildQuery({ p: req.player });
      return makeV1Request<TheSportsDBPlayersResponse>(
        "GET",
        `/${apiKey}/searchplayers.php${query}`,
        v1BaseURL,
        signal
      );
    },
    { schema: TheSportsDBSearchPlayersRequestSchema }
  );

  // sig-ok: V1 PHP script names exposed as search methods.
  // GET https://www.thesportsdb.com/api/v1/json/{apiKey}/searchvenues.php{query}
  // Docs: https://thedatadb.readme.io/reference/getvenuebyname
  const searchVenues = Object.assign(
    async (
      req: TheSportsDBSearchVenuesRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBVenuesResponse> => {
      const query = buildQuery({ v: req.venue });
      return makeV1Request<TheSportsDBVenuesResponse>(
        "GET",
        `/${apiKey}/searchvenues.php${query}`,
        v1BaseURL,
        signal
      );
    },
    { schema: TheSportsDBSearchVenuesRequestSchema }
  );

  // sig-ok: V1 PHP script names exposed as player lookup methods.
  // GET https://www.thesportsdb.com/api/v1/json/{apiKey}/lookupplayer.php?id={idPlayer}
  // Docs: https://thedatadb.readme.io/reference/getplayerbyid
  const lookupplayer = Object.assign(
    async (
      req: TheSportsDBPlayerIdRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBLookupPlayerResponse> => {
      const idPlayer = encodeURIComponent(String(req.idPlayer));
      return makeV1Request<TheSportsDBLookupPlayerResponse>(
        "GET",
        `/${apiKey}/lookupplayer.php?id=${idPlayer}`,
        v1BaseURL,
        signal
      );
    },
    { schema: TheSportsDBPlayerIdRequestSchema }
  );

  // sig-ok: V1 PHP script names exposed as player lookup methods.
  // GET https://www.thesportsdb.com/api/v1/json/{apiKey}/lookuphonours.php?id={idPlayer}
  // Docs: https://thedatadb.readme.io/reference/gethonourbyid
  const lookuphonours = Object.assign(
    async (
      req: TheSportsDBPlayerIdRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBLookupHonoursResponse> => {
      const idPlayer = encodeURIComponent(String(req.idPlayer));
      return makeV1Request<TheSportsDBLookupHonoursResponse>(
        "GET",
        `/${apiKey}/lookuphonours.php?id=${idPlayer}`,
        v1BaseURL,
        signal
      );
    },
    { schema: TheSportsDBPlayerIdRequestSchema }
  );

  // sig-ok: V1 PHP script names exposed as player lookup methods.
  // GET https://www.thesportsdb.com/api/v1/json/{apiKey}/lookupformerteams.php?id={idPlayer}
  // Docs: https://thedatadb.readme.io/reference/getformerteamsbyplayerid
  const lookupformerteams = Object.assign(
    async (
      req: TheSportsDBPlayerIdRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBLookupFormerTeamsResponse> => {
      const idPlayer = encodeURIComponent(String(req.idPlayer));
      return makeV1Request<TheSportsDBLookupFormerTeamsResponse>(
        "GET",
        `/${apiKey}/lookupformerteams.php?id=${idPlayer}`,
        v1BaseURL,
        signal
      );
    },
    { schema: TheSportsDBPlayerIdRequestSchema }
  );

  // sig-ok: V1 PHP script names exposed as player lookup methods.
  // GET https://www.thesportsdb.com/api/v1/json/{apiKey}/lookupmilestones.php?id={idPlayer}
  // Docs: https://thedatadb.readme.io/reference/getmilestonesbyplayerid
  const lookupmilestones = Object.assign(
    async (
      req: TheSportsDBPlayerIdRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBLookupMilestonesResponse> => {
      const idPlayer = encodeURIComponent(String(req.idPlayer));
      return makeV1Request<TheSportsDBLookupMilestonesResponse>(
        "GET",
        `/${apiKey}/lookupmilestones.php?id=${idPlayer}`,
        v1BaseURL,
        signal
      );
    },
    { schema: TheSportsDBPlayerIdRequestSchema }
  );

  // sig-ok: V1 PHP script names exposed as player lookup methods.
  // GET https://www.thesportsdb.com/api/v1/json/{apiKey}/lookupcontracts.php?id={idPlayer}
  // Docs: https://thedatadb.readme.io/reference/getcontractsbyplayerid
  const lookupcontracts = Object.assign(
    async (
      req: TheSportsDBPlayerIdRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBLookupContractsResponse> => {
      const idPlayer = encodeURIComponent(String(req.idPlayer));
      return makeV1Request<TheSportsDBLookupContractsResponse>(
        "GET",
        `/${apiKey}/lookupcontracts.php?id=${idPlayer}`,
        v1BaseURL,
        signal
      );
    },
    { schema: TheSportsDBPlayerIdRequestSchema }
  );

  // sig-ok: V1 PHP script names exposed as player lookup methods.
  // GET https://www.thesportsdb.com/api/v1/json/{apiKey}/playerresults.php?id={idPlayer}
  // Docs: https://www.thesportsdb.com/docs_api_guide
  const playerresults = Object.assign(
    async (
      req: TheSportsDBPlayerIdRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBPlayerResultsResponse> => {
      const idPlayer = encodeURIComponent(String(req.idPlayer));
      return makeV1Request<TheSportsDBPlayerResultsResponse>(
        "GET",
        `/${apiKey}/playerresults.php?id=${idPlayer}`,
        v1BaseURL,
        signal
      );
    },
    { schema: TheSportsDBPlayerIdRequestSchema }
  );

  // sig-ok: V1 PHP script names exposed as player lookup methods.
  // GET https://www.thesportsdb.com/api/v1/json/{apiKey}/lookupplayerstats.php?id={idPlayer}
  // Docs: https://www.thesportsdb.com/docs_api_guide
  const lookupplayerstats = Object.assign(
    async (
      req: TheSportsDBPlayerIdRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBLookupPlayerStatsResponse> => {
      const idPlayer = encodeURIComponent(String(req.idPlayer));
      return makeV1Request<TheSportsDBLookupPlayerStatsResponse>(
        "GET",
        `/${apiKey}/lookupplayerstats.php?id=${idPlayer}`,
        v1BaseURL,
        signal
      );
    },
    { schema: TheSportsDBPlayerIdRequestSchema }
  );

  // sig-ok: V1 PHP script names exposed as event lookup methods.
  // GET https://www.thesportsdb.com/api/v1/json/{apiKey}/lookupevent.php{query}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v1-lookup
  const lookupEvent = Object.assign(
    async (
      req: TheSportsDBEventLookupRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBEventResponse> => {
      const query = eventIdQuery(req);
      return makeV1Request<TheSportsDBEventResponse>(
        "GET",
        `/${apiKey}/lookupevent.php${query}`,
        v1BaseURL,
        signal
      );
    },
    { schema: TheSportsDBEventLookupRequestSchema }
  );

  // sig-ok: V1 PHP script names exposed as event lookup methods.
  // GET https://www.thesportsdb.com/api/v1/json/{apiKey}/eventresults.php{query}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v1-lookup
  const eventResults = Object.assign(
    async (
      req: TheSportsDBEventLookupRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBEventResultsResponse> => {
      const query = eventIdQuery(req);
      return makeV1Request<TheSportsDBEventResultsResponse>(
        "GET",
        `/${apiKey}/eventresults.php${query}`,
        v1BaseURL,
        signal
      );
    },
    { schema: TheSportsDBEventLookupRequestSchema }
  );

  // sig-ok: V1 PHP script names exposed as event lookup methods.
  // GET https://www.thesportsdb.com/api/v1/json/{apiKey}/lookuplineup.php{query}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v1-lookup
  const lookupLineup = Object.assign(
    async (
      req: TheSportsDBEventLookupRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBLineupResponse> => {
      const query = eventIdQuery(req);
      return makeV1Request<TheSportsDBLineupResponse>(
        "GET",
        `/${apiKey}/lookuplineup.php${query}`,
        v1BaseURL,
        signal
      );
    },
    { schema: TheSportsDBEventLookupRequestSchema }
  );

  // sig-ok: V1 PHP script names exposed as event lookup methods.
  // GET https://www.thesportsdb.com/api/v1/json/{apiKey}/lookuptimeline.php{query}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v1-lookup
  const lookupTimeline = Object.assign(
    async (
      req: TheSportsDBEventLookupRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBTimelineResponse> => {
      const query = eventIdQuery(req);
      return makeV1Request<TheSportsDBTimelineResponse>(
        "GET",
        `/${apiKey}/lookuptimeline.php${query}`,
        v1BaseURL,
        signal
      );
    },
    { schema: TheSportsDBEventLookupRequestSchema }
  );

  // sig-ok: V1 PHP script names exposed as event lookup methods.
  // GET https://www.thesportsdb.com/api/v1/json/{apiKey}/lookupeventstats.php{query}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v1-lookup
  const lookupEventStats = Object.assign(
    async (
      req: TheSportsDBEventLookupRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBEventStatsResponse> => {
      const query = eventIdQuery(req);
      return makeV1Request<TheSportsDBEventStatsResponse>(
        "GET",
        `/${apiKey}/lookupeventstats.php${query}`,
        v1BaseURL,
        signal
      );
    },
    { schema: TheSportsDBEventLookupRequestSchema }
  );

  // sig-ok: V1 PHP script names exposed as event lookup methods.
  // GET https://www.thesportsdb.com/api/v1/json/{apiKey}/lookuptv.php{query}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v1-lookup
  const lookupTv = Object.assign(
    async (
      req: TheSportsDBEventLookupRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBTvEventResponse> => {
      const query = eventIdQuery(req);
      return makeV1Request<TheSportsDBTvEventResponse>(
        "GET",
        `/${apiKey}/lookuptv.php${query}`,
        v1BaseURL,
        signal
      );
    },
    { schema: TheSportsDBEventLookupRequestSchema }
  );

  const v2Lookup = {
    league: v2League,
    team: v2Team,
    teamEquipment: v2TeamEquipment,
    player: v2Player,
    playerContracts: v2PlayerContracts,
    playerResults: v2PlayerResults,
    playerHonours: v2PlayerHonours,
    playerMilestones: v2PlayerMilestones,
    playerTeams: v2PlayerTeams,
    playerStats: v2PlayerStats,
    event: v2Event,
    eventLineup: v2EventLineup,
    eventResults: v2EventResults,
    eventStats: v2EventStats,
    eventTimeline: v2EventTimeline,
    eventTv: v2EventTv,
    eventHighlights: v2EventHighlights,
    venue: v2Venue,
  };

  const v1 = {
    allSports,
    allCountries,
    allLeagues,
    lookup,
    searchAllLeagues,
    searchAllSeasons,
    searchAllTeams,
    lookupAllPlayers,
    searchTeams,
    searchEvents,
    searchFilename,
    searchPlayers,
    searchVenues,
    eventsnext,
    eventslast,
    eventsnextleague,
    eventspastleague,
    eventsday,
    eventsseason,
    eventstv,
    eventshighlights,
    lookupplayer,
    lookuphonours,
    lookupformerteams,
    lookupmilestones,
    lookupcontracts,
    playerresults,
    lookupplayerstats,
    lookupEvent,
    eventResults,
    lookupLineup,
    lookupTimeline,
    lookupEventStats,
    lookupTv,
  };

  // sig-ok: V2 namespace omits the fixed /api/v2/json base path.
  // GET https://www.thesportsdb.com/api/v2/json/schedule/next/league/{idLeague}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v2-schedule
  const scheduleNextLeague = Object.assign(
    async (
      req: TheSportsDBLeagueScheduleRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBEventScheduleList> => {
      return makeV2Request<TheSportsDBEventScheduleList>(
        "GET",
        buildPath("schedule", "next", "league", req.idLeague),
        v2BaseURL,
        signal
      );
    },
    { schema: TheSportsDBLeagueScheduleRequestSchema }
  );

  // sig-ok: V2 namespace omits the fixed /api/v2/json base path.
  // GET https://www.thesportsdb.com/api/v2/json/schedule/previous/league/{idLeague}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v2-schedule
  const schedulePreviousLeague = Object.assign(
    async (
      req: TheSportsDBLeagueScheduleRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBEventScheduleList> => {
      return makeV2Request<TheSportsDBEventScheduleList>(
        "GET",
        buildPath("schedule", "previous", "league", req.idLeague),
        v2BaseURL,
        signal
      );
    },
    { schema: TheSportsDBLeagueScheduleRequestSchema }
  );

  // sig-ok: V2 namespace omits the fixed /api/v2/json base path.
  // GET https://www.thesportsdb.com/api/v2/json/schedule/next/team/{idTeam}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v2-schedule
  const scheduleNextTeam = Object.assign(
    async (
      req: TheSportsDBTeamScheduleRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBEventScheduleList> => {
      return makeV2Request<TheSportsDBEventScheduleList>(
        "GET",
        buildPath("schedule", "next", "team", req.idTeam),
        v2BaseURL,
        signal
      );
    },
    { schema: TheSportsDBTeamScheduleRequestSchema }
  );

  // sig-ok: V2 namespace omits the fixed /api/v2/json base path.
  // GET https://www.thesportsdb.com/api/v2/json/schedule/previous/team/{idTeam}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v2-schedule
  const schedulePreviousTeam = Object.assign(
    async (
      req: TheSportsDBTeamScheduleRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBEventScheduleList> => {
      return makeV2Request<TheSportsDBEventScheduleList>(
        "GET",
        buildPath("schedule", "previous", "team", req.idTeam),
        v2BaseURL,
        signal
      );
    },
    { schema: TheSportsDBTeamScheduleRequestSchema }
  );

  // sig-ok: V2 namespace omits the fixed /api/v2/json base path.
  // GET https://www.thesportsdb.com/api/v2/json/schedule/next/venue/{idVenue}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v2-schedule
  const scheduleNextVenue = Object.assign(
    async (
      req: TheSportsDBVenueScheduleRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBEventScheduleList> => {
      return makeV2Request<TheSportsDBEventScheduleList>(
        "GET",
        buildPath("schedule", "next", "venue", req.idVenue),
        v2BaseURL,
        signal
      );
    },
    { schema: TheSportsDBVenueScheduleRequestSchema }
  );

  // sig-ok: V2 namespace omits the fixed /api/v2/json base path.
  // GET https://www.thesportsdb.com/api/v2/json/schedule/previous/venue/{idVenue}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v2-schedule
  const schedulePreviousVenue = Object.assign(
    async (
      req: TheSportsDBVenueScheduleRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBEventScheduleList> => {
      return makeV2Request<TheSportsDBEventScheduleList>(
        "GET",
        buildPath("schedule", "previous", "venue", req.idVenue),
        v2BaseURL,
        signal
      );
    },
    { schema: TheSportsDBVenueScheduleRequestSchema }
  );

  // sig-ok: V2 namespace omits the fixed /api/v2/json base path.
  // GET https://www.thesportsdb.com/api/v2/json/schedule/full/team/{idTeam}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v2-schedule
  const scheduleFullTeam = Object.assign(
    async (
      req: TheSportsDBTeamScheduleRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBEventScheduleList> => {
      return makeV2Request<TheSportsDBEventScheduleList>(
        "GET",
        buildPath("schedule", "full", "team", req.idTeam),
        v2BaseURL,
        signal
      );
    },
    { schema: TheSportsDBTeamScheduleRequestSchema }
  );

  // sig-ok: V2 namespace omits the fixed /api/v2/json base path.
  // GET https://www.thesportsdb.com/api/v2/json/schedule/league/{idLeague}/{season}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v2-schedule
  const scheduleLeague = Object.assign(
    async (
      req: TheSportsDBLeagueSeasonScheduleRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBEventScheduleList> => {
      return makeV2Request<TheSportsDBEventScheduleList>(
        "GET",
        buildPath("schedule", "league", req.idLeague, req.season),
        v2BaseURL,
        signal
      );
    },
    { schema: TheSportsDBLeagueSeasonScheduleRequestSchema }
  );

  // sig-ok: livescore path overload is exposed as bySport.
  // GET https://www.thesportsdb.com/api/v2/json/livescore/{sport}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v2-livescores
  const livescoreBySport = Object.assign(
    async (
      req: TheSportsDBLiveScoreSportRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBLiveScoreList> => {
      return makeV2Request<TheSportsDBLiveScoreList>(
        "GET",
        buildPath("livescore", req.sport),
        v2BaseURL,
        signal
      );
    },
    { schema: TheSportsDBLiveScoreSportRequestSchema }
  );

  // sig-ok: livescore path overload is exposed as byLeague.
  // GET https://www.thesportsdb.com/api/v2/json/livescore/{leagueId}
  // Docs: https://www.thesportsdb.com/docs_api_guide#v2-livescores
  const livescoreByLeague = Object.assign(
    async (
      req: TheSportsDBLiveScoreLeagueRequest,
      signal?: AbortSignal
    ): Promise<TheSportsDBLiveScoreList> => {
      return makeV2Request<TheSportsDBLiveScoreList>(
        "GET",
        buildPath("livescore", req.leagueId),
        v2BaseURL,
        signal
      );
    },
    { schema: TheSportsDBLiveScoreLeagueRequestSchema }
  );

  // sig-ok: V2 namespace omits the fixed /api/v2/json base path.
  // GET https://www.thesportsdb.com/api/v2/json/livescore/all
  // Docs: https://www.thesportsdb.com/docs_api_guide#v2-livescores
  const livescoreAll = Object.assign(
    async (signal?: AbortSignal): Promise<TheSportsDBLiveScoreList> => {
      return makeV2Request<TheSportsDBLiveScoreList>(
        "GET",
        buildPath("livescore", "all"),
        v2BaseURL,
        signal
      );
    },
    { schema: undefined }
  );

  const schedule = {
    next: {
      league: scheduleNextLeague,
      team: scheduleNextTeam,
      venue: scheduleNextVenue,
    },
    previous: {
      league: schedulePreviousLeague,
      team: schedulePreviousTeam,
      venue: schedulePreviousVenue,
    },
    full: {
      team: scheduleFullTeam,
    },
    league: scheduleLeague,
  };

  const livescore = {
    bySport: livescoreBySport,
    byLeague: livescoreByLeague,
    all: livescoreAll,
  };

  const v2 = {
    lookup: v2Lookup,
    schedule,
    livescore,
    search: {
      league: searchLeague,
      team: searchTeam,
      player: searchPlayer,
      event: searchEvent,
      venue: searchVenue,
    },
    all: {
      countries: v2AllCountries,
      sports: v2AllSports,
      leagues: v2AllLeagues,
    },
    list: {
      teams: listTeams,
      seasons: listSeasons,
      seasonposters: listSeasonposters,
      players: listPlayers,
    },
    filter: {
      tv: {
        day: filterTvDay,
        country: filterTvCountry,
        sport: filterTvSport,
        channel: filterTvChannel,
        channelid: filterTvChannelid,
      },
    },
  };

  return attachExamples({
    v1,
    v2,
    get: {
      v1,
      v2,
    },
  });
}
