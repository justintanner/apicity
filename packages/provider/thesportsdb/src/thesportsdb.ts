import { attachExamples } from "./example";
import { TheSportsDBError } from "./types";
import type {
  TheSportsDBCountriesResponse,
  TheSportsDBLeaguesResponse,
  TheSportsDBOptions,
  TheSportsDBProvider,
  TheSportsDBSportsResponse,
} from "./types";

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

  const v1 = {
    allSports,
    allCountries,
    allLeagues,
  };

  return attachExamples({
    v1,
    get: {
      v1,
    },
  });
}
