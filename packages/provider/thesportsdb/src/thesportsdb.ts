import { attachExamples } from "./example";
import { TheSportsDBError } from "./types";
import type {
  TheSportsDBCountriesResponse,
  TheSportsDBEquipmentLookupRequest,
  TheSportsDBEquipmentLookupResponse,
  TheSportsDBEventScheduleList,
  TheSportsDBEventsDayRequest,
  TheSportsDBEventsHighlightsRequest,
  TheSportsDBEventsResponse,
  TheSportsDBEventLookupRequest,
  TheSportsDBEventResponse,
  TheSportsDBEventResultsResponse,
  TheSportsDBEventStatsResponse,
  TheSportsDBEventsSeasonRequest,
  TheSportsDBEventsTVRequest,
  TheSportsDBFilenameSearchResponse,
  TheSportsDBLeagueEventsRequest,
  TheSportsDBLeagueLookupRequest,
  TheSportsDBLeagueLookupResponse,
  TheSportsDBLeagueScheduleRequest,
  TheSportsDBLeagueSeasonScheduleRequest,
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
  TheSportsDBPlayerIdRequest,
  TheSportsDBPlayerResultsResponse,
  TheSportsDBPlayersResponse,
  TheSportsDBProvider,
  TheSportsDBResultsResponse,
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
  TheSportsDBSportsResponse,
  TheSportsDBTableLookupRequest,
  TheSportsDBTableLookupResponse,
  TheSportsDBTeamEventsRequest,
  TheSportsDBTeamLookupRequest,
  TheSportsDBTeamLookupResponse,
  TheSportsDBTeamScheduleRequest,
  TheSportsDBTeamsResponse,
  TheSportsDBTimelineResponse,
  TheSportsDBTvEventResponse,
  TheSportsDBTVEventsResponse,
  TheSportsDBTVHighlightsResponse,
  TheSportsDBVenueLookupRequest,
  TheSportsDBVenueLookupResponse,
  TheSportsDBVenueScheduleRequest,
  TheSportsDBVenuesResponse,
} from "./types";
import {
  TheSportsDBEquipmentLookupRequestSchema,
  TheSportsDBEventLookupRequestSchema,
  TheSportsDBEventsDayRequestSchema,
  TheSportsDBEventsHighlightsRequestSchema,
  TheSportsDBEventsSeasonRequestSchema,
  TheSportsDBEventsTVRequestSchema,
  TheSportsDBLeagueEventsRequestSchema,
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
  TheSportsDBSearchEventsRequestSchema,
  TheSportsDBSearchFilenameRequestSchema,
  TheSportsDBSearchPlayersRequestSchema,
  TheSportsDBSearchTeamsRequestSchema,
  TheSportsDBSearchVenuesRequestSchema,
  TheSportsDBTableLookupRequestSchema,
  TheSportsDBTeamEventsRequestSchema,
  TheSportsDBTeamLookupRequestSchema,
  TheSportsDBTeamScheduleRequestSchema,
  TheSportsDBVenueLookupRequestSchema,
  TheSportsDBVenueScheduleRequestSchema,
} from "./zod";

type TheSportsDBQueryValue = string | number | boolean | null | undefined;

export function createTheSportsDB(
  opts?: TheSportsDBOptions
): TheSportsDBProvider {
  const baseURL = (
    opts?.baseURL ?? "https://www.thesportsdb.com/api/v1/json"
  ).replace(/\/+$/, "");
  const apiBaseURL = (
    opts?.v2BaseURL ?? "https://www.thesportsdb.com/api/v2/json"
  ).replace(/\/+$/, "");
  const rawApiKey = opts?.apiKey ?? "123";
  const apiKey = encodeURIComponent(rawApiKey);
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
    path: string,
    signal?: AbortSignal,
    requestBaseURL = baseURL,
    headers?: Record<string, string>
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    try {
      const res = await doFetch(`${requestBaseURL}${path}`, {
        method,
        headers,
        signal: controller.signal,
      });

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

  function pathSegment(value: string | number): string {
    return encodeURIComponent(String(value));
  }

  function v2Headers(): Record<string, string> {
    return { "X-API-KEY": rawApiKey };
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
      return makeJsonRequest<TheSportsDBSportsResponse>(
        "GET",
        `/${apiKey}/all_sports.php`,
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
      return makeJsonRequest<TheSportsDBCountriesResponse>(
        "GET",
        `/${apiKey}/all_countries.php`,
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
      return makeJsonRequest<TheSportsDBLeaguesResponse>(
        "GET",
        `/${apiKey}/all_leagues.php`,
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
      return makeJsonRequest<TheSportsDBLeagueLookupResponse>(
        "GET",
        `/${apiKey}/lookupleague.php${query}`,
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
      return makeJsonRequest<TheSportsDBTableLookupResponse>(
        "GET",
        `/${apiKey}/lookuptable.php${query}`,
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
      return makeJsonRequest<TheSportsDBTeamLookupResponse>(
        "GET",
        `/${apiKey}/lookupteam.php${query}`,
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
      return makeJsonRequest<TheSportsDBEquipmentLookupResponse>(
        "GET",
        `/${apiKey}/lookupequipment.php${query}`,
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
      return makeJsonRequest<TheSportsDBVenueLookupResponse>(
        "GET",
        `/${apiKey}/lookupvenue.php${query}`,
        signal
      );
    },
    { schema: TheSportsDBVenueLookupRequestSchema }
  );

  const lookup = {
    league,
    table,
    team,
    equipment,
    venue,
  };

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
      return makeJsonRequest<TheSportsDBSearchAllLeaguesResponse>(
        "GET",
        `/${apiKey}/search_all_leagues.php${query}`,
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
      return makeJsonRequest<TheSportsDBSeasonsResponse>(
        "GET",
        `/${apiKey}/search_all_seasons.php${query}`,
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
      return makeJsonRequest<TheSportsDBTeamsResponse>(
        "GET",
        `/${apiKey}/search_all_teams.php${query}`,
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
      return makeJsonRequest<TheSportsDBPlayersResponse>(
        "GET",
        `/${apiKey}/lookup_all_players.php${query}`,
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
      return makeJsonRequest<TheSportsDBEventsResponse>(
        "GET",
        `/${apiKey}/eventsnext.php${query}`,
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
      return makeJsonRequest<TheSportsDBResultsResponse>(
        "GET",
        `/${apiKey}/eventslast.php${query}`,
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
      return makeJsonRequest<TheSportsDBEventsResponse>(
        "GET",
        `/${apiKey}/eventsnextleague.php${query}`,
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
      return makeJsonRequest<TheSportsDBEventsResponse>(
        "GET",
        `/${apiKey}/eventspastleague.php${query}`,
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
      return makeJsonRequest<TheSportsDBEventsResponse>(
        "GET",
        `/${apiKey}/eventsday.php${query}`,
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
      return makeJsonRequest<TheSportsDBEventsResponse>(
        "GET",
        `/${apiKey}/eventsseason.php${query}`,
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
      return makeJsonRequest<TheSportsDBTVEventsResponse>(
        "GET",
        `/${apiKey}/eventstv.php${query}`,
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
      return makeJsonRequest<TheSportsDBTVHighlightsResponse>(
        "GET",
        `/${apiKey}/eventshighlights.php${query}`,
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
      return makeJsonRequest<TheSportsDBTeamsResponse>(
        "GET",
        `/${apiKey}/searchteams.php${query}`,
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
      return makeJsonRequest<TheSportsDBEventsResponse>(
        "GET",
        `/${apiKey}/searchevents.php${query}`,
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
      return makeJsonRequest<TheSportsDBFilenameSearchResponse>(
        "GET",
        `/${apiKey}/searchfilename.php${query}`,
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
      return makeJsonRequest<TheSportsDBPlayersResponse>(
        "GET",
        `/${apiKey}/searchplayers.php${query}`,
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
      return makeJsonRequest<TheSportsDBVenuesResponse>(
        "GET",
        `/${apiKey}/searchvenues.php${query}`,
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
      return makeJsonRequest<TheSportsDBLookupPlayerResponse>(
        "GET",
        `/${apiKey}/lookupplayer.php?id=${idPlayer}`,
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
      return makeJsonRequest<TheSportsDBLookupHonoursResponse>(
        "GET",
        `/${apiKey}/lookuphonours.php?id=${idPlayer}`,
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
      return makeJsonRequest<TheSportsDBLookupFormerTeamsResponse>(
        "GET",
        `/${apiKey}/lookupformerteams.php?id=${idPlayer}`,
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
      return makeJsonRequest<TheSportsDBLookupMilestonesResponse>(
        "GET",
        `/${apiKey}/lookupmilestones.php?id=${idPlayer}`,
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
      return makeJsonRequest<TheSportsDBLookupContractsResponse>(
        "GET",
        `/${apiKey}/lookupcontracts.php?id=${idPlayer}`,
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
      return makeJsonRequest<TheSportsDBPlayerResultsResponse>(
        "GET",
        `/${apiKey}/playerresults.php?id=${idPlayer}`,
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
      return makeJsonRequest<TheSportsDBLookupPlayerStatsResponse>(
        "GET",
        `/${apiKey}/lookupplayerstats.php?id=${idPlayer}`,
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
      return makeJsonRequest<TheSportsDBEventResponse>(
        "GET",
        `/${apiKey}/lookupevent.php${query}`,
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
      return makeJsonRequest<TheSportsDBEventResultsResponse>(
        "GET",
        `/${apiKey}/eventresults.php${query}`,
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
      return makeJsonRequest<TheSportsDBLineupResponse>(
        "GET",
        `/${apiKey}/lookuplineup.php${query}`,
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
      return makeJsonRequest<TheSportsDBTimelineResponse>(
        "GET",
        `/${apiKey}/lookuptimeline.php${query}`,
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
      return makeJsonRequest<TheSportsDBEventStatsResponse>(
        "GET",
        `/${apiKey}/lookupeventstats.php${query}`,
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
      return makeJsonRequest<TheSportsDBTvEventResponse>(
        "GET",
        `/${apiKey}/lookuptv.php${query}`,
        signal
      );
    },
    { schema: TheSportsDBEventLookupRequestSchema }
  );

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
      const idLeague = pathSegment(req.idLeague);
      return makeJsonRequest<TheSportsDBEventScheduleList>(
        "GET",
        `/schedule/next/league/${idLeague}`,
        signal,
        apiBaseURL,
        v2Headers()
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
      const idLeague = pathSegment(req.idLeague);
      return makeJsonRequest<TheSportsDBEventScheduleList>(
        "GET",
        `/schedule/previous/league/${idLeague}`,
        signal,
        apiBaseURL,
        v2Headers()
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
      const idTeam = pathSegment(req.idTeam);
      return makeJsonRequest<TheSportsDBEventScheduleList>(
        "GET",
        `/schedule/next/team/${idTeam}`,
        signal,
        apiBaseURL,
        v2Headers()
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
      const idTeam = pathSegment(req.idTeam);
      return makeJsonRequest<TheSportsDBEventScheduleList>(
        "GET",
        `/schedule/previous/team/${idTeam}`,
        signal,
        apiBaseURL,
        v2Headers()
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
      const idVenue = pathSegment(req.idVenue);
      return makeJsonRequest<TheSportsDBEventScheduleList>(
        "GET",
        `/schedule/next/venue/${idVenue}`,
        signal,
        apiBaseURL,
        v2Headers()
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
      const idVenue = pathSegment(req.idVenue);
      return makeJsonRequest<TheSportsDBEventScheduleList>(
        "GET",
        `/schedule/previous/venue/${idVenue}`,
        signal,
        apiBaseURL,
        v2Headers()
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
      const idTeam = pathSegment(req.idTeam);
      return makeJsonRequest<TheSportsDBEventScheduleList>(
        "GET",
        `/schedule/full/team/${idTeam}`,
        signal,
        apiBaseURL,
        v2Headers()
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
      const idLeague = pathSegment(req.idLeague);
      const season = pathSegment(req.season);
      return makeJsonRequest<TheSportsDBEventScheduleList>(
        "GET",
        `/schedule/league/${idLeague}/${season}`,
        signal,
        apiBaseURL,
        v2Headers()
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
      const sport = pathSegment(req.sport);
      return makeJsonRequest<TheSportsDBLiveScoreList>(
        "GET",
        `/livescore/${sport}`,
        signal,
        apiBaseURL,
        v2Headers()
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
      const leagueId = pathSegment(req.leagueId);
      return makeJsonRequest<TheSportsDBLiveScoreList>(
        "GET",
        `/livescore/${leagueId}`,
        signal,
        apiBaseURL,
        v2Headers()
      );
    },
    { schema: TheSportsDBLiveScoreLeagueRequestSchema }
  );

  // sig-ok: V2 namespace omits the fixed /api/v2/json base path.
  // GET https://www.thesportsdb.com/api/v2/json/livescore/all
  // Docs: https://www.thesportsdb.com/docs_api_guide#v2-livescores
  const livescoreAll = Object.assign(
    async (signal?: AbortSignal): Promise<TheSportsDBLiveScoreList> => {
      return makeJsonRequest<TheSportsDBLiveScoreList>(
        "GET",
        "/livescore/all",
        signal,
        apiBaseURL,
        v2Headers()
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
    schedule,
    livescore,
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
