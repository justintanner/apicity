import { OpenLigaDBError } from "./types";
import type {
  OpenLigaDBMatch,
  OpenLigaDBMatchByIdRequest,
  OpenLigaDBMatchesByLeagueSeasonGroupRequest,
  OpenLigaDBMatchesByLeagueSeasonRequest,
  OpenLigaDBMatchesByLeagueSeasonTeamRequest,
  OpenLigaDBMatchesByTeamsRequest,
  OpenLigaDBOptions,
  OpenLigaDBPathSegment,
  OpenLigaDBProvider,
  OpenLigaDBQueryValue,
  OpenLigaDBRequestFunction,
  OpenLigaDBRequestOptions,
  OpenLigaDBSwaggerDocument,
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
  const request = createOpenLigaDBRequest(opts);

  // sig-ok: OpenAPI document filename maps to the camelCase swaggerJson method.
  // GET https://api.openligadb.de/swagger/v1/swagger.json
  // Docs: https://api.openligadb.de/swagger/v1/swagger.json
  const swaggerJson = Object.assign(
    async (signal?: AbortSignal): Promise<OpenLigaDBSwaggerDocument> => {
      return request<OpenLigaDBSwaggerDocument>({
        method: "GET",
        path: ["swagger", "v1", "swagger.json"],
        signal,
      });
    },
    { schema: undefined }
  );

  // sig-ok: OpenLigaDB getmatchdata overload split into typed callables
  // GET https://api.openligadb.de/getmatchdata/{matchId}
  // Docs: https://api.openligadb.de/swagger/index.html
  const byId = Object.assign(
    async (
      req: OpenLigaDBMatchByIdRequest,
      signal?: AbortSignal
    ): Promise<OpenLigaDBMatch> => {
      return request<OpenLigaDBMatch>({
        method: "GET",
        path: ["getmatchdata", req.matchId],
        signal,
      });
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
      return request<OpenLigaDBMatch[]>({
        method: "GET",
        path: ["getmatchdata", req.leagueShortcut, req.leagueSeason],
        signal,
      });
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
      return request<OpenLigaDBMatch[]>({
        method: "GET",
        path: [
          "getmatchdata",
          req.leagueShortcut,
          req.leagueSeason,
          req.groupOrderId,
        ],
        signal,
      });
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
      return request<OpenLigaDBMatch[]>({
        method: "GET",
        path: [
          "getmatchdata",
          req.leagueShortcut,
          req.leagueSeason,
          req.teamFilterstring,
        ],
        signal,
      });
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
      return request<OpenLigaDBMatch[]>({
        method: "GET",
        path: ["getmatchdata", req.teamId1, req.teamId2],
        signal,
      });
    },
    { schema: OpenLigaDBMatchesByTeamsRequestSchema }
  );

  return attachExamples({
    swagger: {
      v1: {
        swaggerJson,
      },
    },
    getmatchdata: {
      byId,
      byLeagueSeason,
      byLeagueSeasonGroup,
      byLeagueSeasonTeam,
      byTeams,
    },
  });
}

export function createOpenLigaDBRequest(
  opts?: OpenLigaDBOptions
): OpenLigaDBRequestFunction {
  const baseURL = (opts?.baseURL ?? "https://api.openligadb.de").replace(
    /\/+$/,
    ""
  );
  const doFetch = opts?.fetch ?? fetch;
  const timeout = opts?.timeout ?? 30000;

  return async function request<T = unknown>(
    options: OpenLigaDBRequestOptions
  ): Promise<T> {
    const method = options.method ?? "GET";
    const pathInput = options.path;
    const path = isOpenLigaDBPathSegments(pathInput)
      ? buildOpenLigaDBPath(...pathInput)
      : normalizeOpenLigaDBPath(pathInput);
    const query = buildOpenLigaDBQuery(options.query ?? {});
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (options.signal) {
      attachAbortHandler(options.signal, controller);
    }

    try {
      const headers: Record<string, string> = {};
      const init: RequestInit = {
        method,
        headers,
        signal: controller.signal,
      };

      if (options.body !== undefined) {
        headers["Content-Type"] = "application/json";
        init.body = JSON.stringify(options.body);
      }

      const res = await doFetch(`${baseURL}${path}${query}`, init);
      clearTimeout(timeoutId);

      const body = await readResponseBody(res, options.emptyResponse);

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
      if (error instanceof OpenLigaDBError) {
        throw error;
      }
      throw new OpenLigaDBError(
        `OpenLigaDB request failed: ${formatThrown(error)}`,
        500
      );
    }
  };
}

export function buildOpenLigaDBPath(
  ...segments: readonly OpenLigaDBPathSegment[]
): string {
  return `/${segments.map(encodeOpenLigaDBPathSegment).join("/")}`;
}

export function encodeOpenLigaDBPathSegment(
  segment: OpenLigaDBPathSegment
): string {
  return encodeURIComponent(String(segment));
}

export function buildOpenLigaDBQuery(
  params: Record<string, OpenLigaDBQueryValue>
): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) {
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        qs.append(key, String(item));
      }
      continue;
    }
    qs.append(key, String(value));
  }
  const query = qs.toString();
  return query ? `?${query}` : "";
}

function normalizeOpenLigaDBPath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

function isOpenLigaDBPathSegments(
  path: OpenLigaDBRequestOptions["path"]
): path is readonly OpenLigaDBPathSegment[] {
  return Array.isArray(path);
}

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

async function readResponseBody(
  res: Response,
  emptyResponse: unknown
): Promise<unknown> {
  const text = await res.text();
  if (text.length === 0) {
    return emptyResponse ?? null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function formatErrorMessage(status: number, body: unknown): string {
  if (typeof body === "object" && body !== null) {
    const b = body as {
      message?: string;
      title?: string;
      error?: string | { message?: string };
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
    if (typeof b.error === "object" && b.error?.message) {
      return `OpenLigaDB API error ${status}: ${b.error.message}`;
    }
  }
  if (typeof body === "string" && body.length > 0) {
    return `OpenLigaDB API error ${status}: ${body}`;
  }
  return `OpenLigaDB API error: ${status}`;
}

function formatThrown(error: unknown): string {
  return error instanceof Error
    ? `${error.name}: ${error.message}`
    : `${error}`;
}
