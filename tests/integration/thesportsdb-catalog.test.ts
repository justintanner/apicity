import { describe, expect, it } from "vitest";

import {
  createTheSportsDB,
  TheSportsDBError,
  TheSportsDBOptionsSchema,
  type TheSportsDBCountriesResponse,
  type TheSportsDBLeaguesResponse,
  type TheSportsDBSportsResponse,
} from "@apicity/thesportsdb";

interface CapturedFetchCall {
  url: string;
  init?: RequestInit;
}

function inputUrl(input: Parameters<typeof fetch>[0]): string {
  if (typeof input === "string") {
    return input;
  }
  if (input instanceof URL) {
    return input.toString();
  }
  return input.url;
}

function createJsonFetch(
  calls: CapturedFetchCall[],
  body: unknown,
  status = 200
): typeof fetch {
  return async (input, init) => {
    calls.push({ url: inputUrl(input), init });
    return new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    });
  };
}

function createTextFetch(
  calls: CapturedFetchCall[],
  body: string,
  status: number
): typeof fetch {
  return async (input, init) => {
    calls.push({ url: inputUrl(input), init });
    return new Response(body, { status });
  };
}

describe("thesportsdb V1 catalog provider", () => {
  it("uses the free V1 key in the URL path by default", async () => {
    const calls: CapturedFetchCall[] = [];
    const provider = createTheSportsDB({
      fetch: createJsonFetch(calls, {
        sports: [{ idSport: "102", strSport: "Soccer" }],
      }),
    });

    const result: TheSportsDBSportsResponse = await provider.v1.allSports();

    expect(result.sports?.[0]).toEqual(
      expect.objectContaining({ idSport: "102", strSport: "Soccer" })
    );
    expect(calls[0].url).toBe(
      "https://www.thesportsdb.com/api/v1/json/123/all_sports.php"
    );
    expect(calls[0].init?.method).toBe("GET");
    expect(provider.v1.allSports.schema).toBeUndefined();
  });

  it("uses apiKey and baseURL overrides for V1 catalog calls", async () => {
    const calls: CapturedFetchCall[] = [];
    const provider = createTheSportsDB({
      apiKey: "premium key",
      baseURL: "https://example.test/root/",
      fetch: createJsonFetch(calls, {
        countries: [{ name_en: "England" }],
      }),
    });

    const result: TheSportsDBCountriesResponse =
      await provider.v1.allCountries();

    expect(result.countries?.[0]).toEqual({ name_en: "England" });
    expect(calls[0].url).toBe(
      "https://example.test/root/premium%20key/all_countries.php"
    );
  });

  it("supports fetch injection for the all leagues wrapper", async () => {
    const calls: CapturedFetchCall[] = [];
    const provider = createTheSportsDB({
      fetch: createJsonFetch(calls, {
        leagues: [
          {
            idLeague: "4328",
            strLeague: "English Premier League",
            strSport: "Soccer",
          },
        ],
      }),
    });

    const result: TheSportsDBLeaguesResponse =
      await provider.get.v1.allLeagues();

    expect(result.leagues?.[0]).toEqual(
      expect.objectContaining({
        idLeague: "4328",
        strLeague: "English Premier League",
        strSport: "Soccer",
      })
    );
    expect(calls[0].url.endsWith("/api/v1/json/123/all_leagues.php")).toBe(
      true
    );
  });

  it("parses JSON error bodies for non-2xx responses", async () => {
    const provider = createTheSportsDB({
      fetch: createJsonFetch([], { message: "bad key" }, 401),
    });

    await expect(provider.v1.allSports()).rejects.toMatchObject({
      name: "TheSportsDBError",
      status: 401,
      body: { message: "bad key" },
      message: "TheSportsDB API error 401: bad key",
    });
  });

  it("preserves text error bodies for 429 responses", async () => {
    const provider = createTheSportsDB({
      fetch: createTextFetch([], "rate limit", 429),
    });

    await expect(provider.v1.allCountries()).rejects.toMatchObject({
      status: 429,
      body: "rate limit",
      message: "TheSportsDB API error 429: rate limit",
    });
  });

  it("wraps timeout aborts in TheSportsDBError", async () => {
    const hangingFetch: typeof fetch = (_input, init) => {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener(
          "abort",
          () => reject(new Error("aborted")),
          { once: true }
        );
      });
    };
    const provider = createTheSportsDB({
      fetch: hangingFetch,
      timeout: 1,
    });

    await expect(provider.v1.allLeagues()).rejects.toBeInstanceOf(
      TheSportsDBError
    );
  });

  it("exports provider option schema metadata", () => {
    expect(
      TheSportsDBOptionsSchema.safeParse({
        apiKey: "123",
        baseURL: "https://www.thesportsdb.com/api/v1/json",
        timeout: 1000,
        fetch,
      }).success
    ).toBe(true);
  });
});
