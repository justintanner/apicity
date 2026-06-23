import { attachExamples } from "./example";
import { TheSportsDBError } from "./types";
import type {
  TheSportsDBCountriesResponse,
  TheSportsDBEquipmentLookupRequest,
  TheSportsDBEquipmentLookupResponse,
  TheSportsDBEventsResponse,
  TheSportsDBEventLookupRequest,
  TheSportsDBEventResponse,
  TheSportsDBEventResultsResponse,
  TheSportsDBEventStatsResponse,
  TheSportsDBFilenameSearchResponse,
  TheSportsDBLeagueLookupRequest,
  TheSportsDBLeagueLookupResponse,
  TheSportsDBLeaguesResponse,
  TheSportsDBLineupResponse,
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
  TheSportsDBSearchEventsRequest,
  TheSportsDBSearchFilenameRequest,
  TheSportsDBSearchPlayersRequest,
  TheSportsDBSearchTeamsRequest,
  TheSportsDBSearchVenuesRequest,
  TheSportsDBSportsResponse,
  TheSportsDBTableLookupRequest,
  TheSportsDBTableLookupResponse,
  TheSportsDBTeamLookupRequest,
  TheSportsDBTeamLookupResponse,
  TheSportsDBTeamsResponse,
  TheSportsDBTimelineResponse,
  TheSportsDBTvEventResponse,
  TheSportsDBVenueLookupRequest,
  TheSportsDBVenueLookupResponse,
  TheSportsDBVenuesResponse,
} from "./types";
import {
  TheSportsDBEquipmentLookupRequestSchema,
  TheSportsDBEventLookupRequestSchema,
  TheSportsDBLeagueLookupRequestSchema,
  TheSportsDBPlayerIdRequestSchema,
  TheSportsDBSearchEventsRequestSchema,
  TheSportsDBSearchFilenameRequestSchema,
  TheSportsDBSearchPlayersRequestSchema,
  TheSportsDBSearchTeamsRequestSchema,
  TheSportsDBSearchVenuesRequestSchema,
  TheSportsDBTableLookupRequestSchema,
  TheSportsDBTeamLookupRequestSchema,
  TheSportsDBVenueLookupRequestSchema,
} from "./zod";

type TheSportsDBQueryValue = string | number | boolean | null | undefined;

export function createTheSportsDB(
  opts?: TheSportsDBOptions
): TheSportsDBProvider {
  const baseURL = (
    opts?.baseURL ?? "https://www.thesportsdb.com/api/v1/json"
  ).replace(/\/+$/, "");
  const apiKey = encodeURIComponent(opts?.apiKey ?? "123");
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
    signal?: AbortSignal
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    try {
      const res = await doFetch(`${baseURL}${path}`, {
        method,
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
    searchTeams,
    searchEvents,
    searchFilename,
    searchPlayers,
    searchVenues,
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

  return attachExamples({
    v1,
    get: {
      v1,
    },
  });
}
