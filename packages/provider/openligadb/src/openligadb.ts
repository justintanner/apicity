import {
  OpenLigaDBError,
  OpenLigaDBMatch,
  OpenLigaDBMatchByIdRequest,
  OpenLigaDBMatchesByLeagueSeasonGroupRequest,
  OpenLigaDBMatchesByLeagueSeasonRequest,
  OpenLigaDBMatchesByLeagueSeasonTeamRequest,
  OpenLigaDBMatchesByTeamsRequest,
  OpenLigaDBOptions,
  OpenLigaDBProvider,
} from "./types";
import {
  OpenLigaDBMatchByIdRequestSchema,
  OpenLigaDBMatchesByLeagueSeasonGroupRequestSchema,
  OpenLigaDBMatchesByLeagueSeasonRequestSchema,
  OpenLigaDBMatchesByLeagueSeasonTeamRequestSchema,
  OpenLigaDBMatchesByTeamsRequestSchema,
} from "./zod";
import { attachExamples } from "./example";

export function createOpenLigaDB(opts?: OpenLigaDBOptions): OpenLigaDBProvider {
  const baseURL = (opts?.baseURL ?? "https://api.openligadb.de").replace(
    /\/+$/,
    ""
  );
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

  function pathSegment(value: string | number): string {
    return encodeURIComponent(String(value));
  }

  function formatErrorMessage(status: number, body: unknown): string {
    if (typeof body === "string" && body.length > 0) {
      return `OpenLigaDB API error ${status}: ${body}`;
    }
    if (typeof body === "object" && body !== null) {
      const b = body as {
        error?: string | { message?: string };
        message?: string;
        title?: string;
      };
      if (b.message) {
        return `OpenLigaDB API error ${status}: ${b.message}`;
      }
      if (b.title) {
        return `OpenLigaDB API error ${status}: ${b.title}`;
      }
      if (typeof b.error === "string") {
        return `OpenLigaDB API error ${status}: ${b.error}`;
      }
      if (b.error?.message) {
        return `OpenLigaDB API error ${status}: ${b.error.message}`;
      }
    }
    return `OpenLigaDB API error: ${status}`;
  }

  async function parseBody(res: Response): Promise<unknown> {
    const text = await res.text();
    if (text.length === 0) {
      return null;
    }
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text;
    }
  }

  async function makeGetRequest<T>(
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
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const body = await parseBody(res);

      if (!res.ok) {
        throw new OpenLigaDBError(
          formatErrorMessage(res.status, body),
          res.status,
          body
        );
      }

      return body as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof OpenLigaDBError) throw error;
      throw new OpenLigaDBError(`OpenLigaDB request failed: ${error}`, 500);
    }
  }

  // sig-ok: OpenLigaDB getmatchdata overload split into typed callables
  // GET https://api.openligadb.de/getmatchdata/{matchId}
  // Docs: https://api.openligadb.de/swagger/index.html
  const byId = Object.assign(
    async (
      req: OpenLigaDBMatchByIdRequest,
      signal?: AbortSignal
    ): Promise<OpenLigaDBMatch> => {
      const matchId = pathSegment(req.matchId);
      return makeGetRequest<OpenLigaDBMatch>(
        `/getmatchdata/${matchId}`,
        signal
      );
    },
    { schema: OpenLigaDBMatchByIdRequestSchema }
  );

  // sig-ok: OpenLigaDB getmatchdata overload split into typed callables
  // GET https://api.openligadb.de/getmatchdata/{leagueShortcut}/{leagueSeason}
  // Docs: https://api.openligadb.de/swagger/index.html
  const byLeagueSeason = Object.assign(
    async (
      req: OpenLigaDBMatchesByLeagueSeasonRequest,
      signal?: AbortSignal
    ): Promise<OpenLigaDBMatch[]> => {
      const leagueShortcut = pathSegment(req.leagueShortcut);
      const leagueSeason = pathSegment(req.leagueSeason);
      return makeGetRequest<OpenLigaDBMatch[]>(
        `/getmatchdata/${leagueShortcut}/${leagueSeason}`,
        signal
      );
    },
    { schema: OpenLigaDBMatchesByLeagueSeasonRequestSchema }
  );

  // sig-ok: OpenLigaDB getmatchdata overload split into typed callables
  // GET https://api.openligadb.de/getmatchdata/{leagueShortcut}/{leagueSeason}/{groupOrderId}
  // Docs: https://api.openligadb.de/swagger/index.html
  const byLeagueSeasonGroup = Object.assign(
    async (
      req: OpenLigaDBMatchesByLeagueSeasonGroupRequest,
      signal?: AbortSignal
    ): Promise<OpenLigaDBMatch[]> => {
      const leagueShortcut = pathSegment(req.leagueShortcut);
      const leagueSeason = pathSegment(req.leagueSeason);
      const groupOrderId = pathSegment(req.groupOrderId);
      return makeGetRequest<OpenLigaDBMatch[]>(
        `/getmatchdata/${leagueShortcut}/${leagueSeason}/${groupOrderId}`,
        signal
      );
    },
    { schema: OpenLigaDBMatchesByLeagueSeasonGroupRequestSchema }
  );

  // sig-ok: OpenLigaDB getmatchdata overload split into typed callables
  // GET https://api.openligadb.de/getmatchdata/{leagueShortcut}/{leagueSeason}/{teamFilterstring}
  // Docs: https://api.openligadb.de/swagger/index.html
  const byLeagueSeasonTeam = Object.assign(
    async (
      req: OpenLigaDBMatchesByLeagueSeasonTeamRequest,
      signal?: AbortSignal
    ): Promise<OpenLigaDBMatch[]> => {
      const leagueShortcut = pathSegment(req.leagueShortcut);
      const leagueSeason = pathSegment(req.leagueSeason);
      const teamFilterstring = pathSegment(req.teamFilterstring);
      return makeGetRequest<OpenLigaDBMatch[]>(
        `/getmatchdata/${leagueShortcut}/${leagueSeason}/${teamFilterstring}`,
        signal
      );
    },
    { schema: OpenLigaDBMatchesByLeagueSeasonTeamRequestSchema }
  );

  // sig-ok: OpenLigaDB getmatchdata overload split into typed callables
  // GET https://api.openligadb.de/getmatchdata/{teamId1}/{teamId2}
  // Docs: https://api.openligadb.de/swagger/index.html
  const byTeams = Object.assign(
    async (
      req: OpenLigaDBMatchesByTeamsRequest,
      signal?: AbortSignal
    ): Promise<OpenLigaDBMatch[]> => {
      const teamId1 = pathSegment(req.teamId1);
      const teamId2 = pathSegment(req.teamId2);
      return makeGetRequest<OpenLigaDBMatch[]>(
        `/getmatchdata/${teamId1}/${teamId2}`,
        signal
      );
    },
    { schema: OpenLigaDBMatchesByTeamsRequestSchema }
  );

  return attachExamples({
    getmatchdata: {
      byId,
      byLeagueSeason,
      byLeagueSeasonGroup,
      byLeagueSeasonTeam,
      byTeams,
    },
  });
}
