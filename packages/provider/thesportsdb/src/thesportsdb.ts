import { attachExamples } from "./example";
import { TheSportsDBError } from "./types";
import type {
  TheSportsDBCountriesResponse,
  TheSportsDBEquipmentLookupRequest,
  TheSportsDBEquipmentLookupResponse,
  TheSportsDBEventsResponse,
  TheSportsDBFilenameSearchResponse,
  TheSportsDBLeagueLookupRequest,
  TheSportsDBLeagueLookupResponse,
  TheSportsDBLeaguesResponse,
  TheSportsDBOptions,
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
  TheSportsDBVenueLookupRequest,
  TheSportsDBVenueLookupResponse,
  TheSportsDBVenuesResponse,
} from "./types";
import {
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

  function buildQuery(params: Record<string, string | number | undefined>) {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        qs.append(key, String(value));
      }
    }
    const query = qs.toString();
    return query ? `?${query}` : "";
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
  };

  return attachExamples({
    v1,
    get: {
      v1,
    },
  });
}
