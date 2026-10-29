import { afterEach, describe, expect, it, vi } from "vitest";

import { createOmkar } from "@apicity/omkar";
import type { OmkarError } from "@apicity/omkar";
import {
  OmkarFeedExploreRequestSchema,
  OmkarFeedTrendingRequestSchema,
} from "@apicity/omkar/zod";

interface CapturedRequest {
  url: string;
  init: RequestInit;
}

function capture(respond: () => Response) {
  const requests: CapturedRequest[] = [];
  const fetch: typeof globalThis.fetch = async (url, init) => {
    requests.push({ url: String(url), init: init ?? {} });
    return respond();
  };
  return { requests, fetch };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const EMPTY_FEED = { country: "TH", video_count: 0, videos: [] };
const EMPTY_EXPLORE = { ...EMPTY_FEED, category: "comedy" };

// Never answers; rejects once the request's signal aborts.
const hangingFetch: typeof globalThis.fetch = (_url, init) =>
  new Promise((_resolve, reject) => {
    init?.signal?.addEventListener(
      "abort",
      () => reject(new Error("aborted")),
      { once: true }
    );
  });

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("omkar provider", () => {
  it("sends the key as API-Key and the country as the query", async () => {
    const { requests, fetch } = capture(() => jsonResponse(EMPTY_FEED));
    const omkar = createOmkar({ apiKey: "omkar-key", fetch });

    await expect(omkar.feed.trending({ country: "TH" })).resolves.toEqual(
      EMPTY_FEED
    );

    expect(requests).toHaveLength(1);
    expect(requests[0].url).toBe(
      "https://tiktok-scraper.omkar.cloud/feed/trending?country=TH"
    );
    expect(requests[0].init.method).toBe("GET");
    expect(requests[0].init.headers).toEqual({ "API-Key": "omkar-key" });
  });

  it("leaves the country to Omkar when the request omits it", async () => {
    const { requests, fetch } = capture(() => jsonResponse(EMPTY_FEED));
    const omkar = createOmkar({
      apiKey: "omkar-key",
      baseURL: "https://omkar.test/",
      fetch,
    });

    await omkar.feed.trending();
    await omkar.feed.trending({});

    expect(requests.map((request) => request.url)).toEqual([
      "https://omkar.test/feed/trending",
      "https://omkar.test/feed/trending",
    ]);
  });

  it("sends an Explore request's country, then its category", async () => {
    const { requests, fetch } = capture(() => jsonResponse(EMPTY_EXPLORE));
    const omkar = createOmkar({ apiKey: "omkar-key", fetch });

    await expect(
      omkar.feed.explore({ category: "comedy", country: "TH" })
    ).resolves.toEqual(EMPTY_EXPLORE);
    await omkar.feed.explore();

    expect(requests.map((request) => request.url)).toEqual([
      "https://tiktok-scraper.omkar.cloud/feed/explore?country=TH&category=comedy",
      "https://tiktok-scraper.omkar.cloud/feed/explore",
    ]);
    expect(requests[0].init.method).toBe("GET");
    expect(requests[0].init.headers).toEqual({ "API-Key": "omkar-key" });
  });

  it("reads OMKAR_API_KEY when no apiKey is passed", async () => {
    vi.stubEnv("OMKAR_API_KEY", "env-key");
    const { requests, fetch } = capture(() => jsonResponse(EMPTY_FEED));

    await createOmkar({ fetch }).feed.trending({ country: "TH" });

    expect(requests[0].init.headers).toEqual({ "API-Key": "env-key" });
  });

  it("rejects without a key before sending anything", async () => {
    vi.stubEnv("OMKAR_API_KEY", "");
    const { requests, fetch } = capture(() => jsonResponse(EMPTY_FEED));

    await expect(createOmkar({ fetch }).feed.trending()).rejects.toMatchObject({
      name: "OmkarError",
      message: "Omkar API key is required. Pass apiKey or set OMKAR_API_KEY.",
      status: 401,
    });
    expect(requests).toHaveLength(0);
  });

  it("rejects a gateway error with Omkar's code and message", async () => {
    const body = {
      code: "quota_exceeded",
      message: "You have used all 1000 requests of your monthly limit.",
      requests_limit: 1000,
      requests_used: 1000,
      renews_at: "2026-11-27T23:16:29Z",
    };
    const { fetch } = capture(() => jsonResponse(body, 429));

    await expect(
      createOmkar({ apiKey: "omkar-key", fetch }).feed.trending()
    ).rejects.toMatchObject({
      name: "OmkarError",
      message:
        "Omkar API error 429: You have used all 1000 requests of your monthly limit.",
      status: 429,
      code: "quota_exceeded",
      body,
    } satisfies Partial<OmkarError>);
  });

  it("redacts the key from an error body that echoes it", async () => {
    const { fetch } = capture(() =>
      jsonResponse(
        { code: "invalid_api_key", message: "Unknown key omkar-key." },
        401
      )
    );

    const error = (await createOmkar({ apiKey: "omkar-key", fetch })
      .feed.trending()
      .catch((caught: unknown) => caught)) as OmkarError;

    expect(error.message).toBe("Omkar API error 401: Unknown key [REDACTED].");
    expect(error.code).toBe("invalid_api_key");
    expect(JSON.stringify(error.body)).not.toContain("omkar-key");
  });

  it("rejects a non-JSON error with its status and a bounded message", async () => {
    const page = `<html>${"x".repeat(500)}</html>`;
    const { fetch } = capture(() => new Response(page, { status: 502 }));

    const error = (await createOmkar({ apiKey: "omkar-key", fetch })
      .feed.trending()
      .catch((caught: unknown) => caught)) as OmkarError;

    expect(error).toMatchObject({
      name: "OmkarError",
      status: 502,
      body: page,
    });
    expect(error.code).toBeUndefined();
    expect(error.message).toBe(`Omkar API error 502: ${page.slice(0, 200)}`);
  });

  it("rejects a success that is not a JSON object", async () => {
    const { fetch } = capture(
      () => new Response("<!DOCTYPE html><html></html>", { status: 200 })
    );

    await expect(
      createOmkar({ apiKey: "omkar-key", fetch }).feed.trending()
    ).rejects.toMatchObject({
      name: "OmkarError",
      message: "Omkar API returned invalid JSON",
      status: 200,
      body: "<!DOCTYPE html><html></html>",
    });
  });

  it("reports a timeout as 408, a caller abort as 499 and no response as 500", async () => {
    await expect(
      createOmkar({
        apiKey: "omkar-key",
        timeout: 1,
        fetch: hangingFetch,
      }).feed.trending()
    ).rejects.toMatchObject({ status: 408 });

    const caller = new AbortController();
    const pending = createOmkar({
      apiKey: "omkar-key",
      fetch: hangingFetch,
    }).feed.trending({ country: "TH" }, caller.signal);
    caller.abort();
    await expect(pending).rejects.toMatchObject({ status: 499 });

    await expect(
      createOmkar({
        apiKey: "omkar-key",
        fetch: async () => {
          throw new TypeError("fetch failed");
        },
      }).feed.trending()
    ).rejects.toMatchObject({
      message: "Omkar request failed: fetch failed",
      status: 500,
    });
  });

  it("attaches the request schema and the recorded example", () => {
    const trending = createOmkar({ apiKey: "omkar-key" }).feed.trending;

    expect(trending.schema).toBe(OmkarFeedTrendingRequestSchema);
    expect(
      (trending as unknown as { example: { payload: unknown } }).example.payload
    ).toEqual({ country: "TH" });
  });

  it("attaches the Explore schema and the recorded example", () => {
    const explore = createOmkar({ apiKey: "omkar-key" }).feed.explore;

    expect(explore.schema).toBe(OmkarFeedExploreRequestSchema);
    expect(
      (explore as unknown as { example: { payload: unknown } }).example.payload
    ).toEqual({ country: "TH", category: "all" });
  });

  it("accepts the 21 Explore tabs and no other category", () => {
    const parse = (request: unknown) =>
      OmkarFeedExploreRequestSchema.safeParse(request).success;

    expect(parse({})).toBe(true);
    expect(parse({ country: "TH", category: "all" })).toBe(true);
    expect(parse({ category: "fitness-health" })).toBe(true);
    expect(
      OmkarFeedExploreRequestSchema.shape.category.unwrap().options
    ).toHaveLength(21);
    expect(parse({ category: "music" })).toBe(false);
    expect(parse({ category: "Comedy" })).toBe(false);
    expect(parse({ country: "th" })).toBe(false);
  });

  it("accepts an ISO alpha-2 country or none", () => {
    expect(OmkarFeedTrendingRequestSchema.safeParse({}).success).toBe(true);
    expect(
      OmkarFeedTrendingRequestSchema.safeParse({ country: "TH" }).success
    ).toBe(true);
    for (const country of ["th", "THA", "T", ""]) {
      expect(
        OmkarFeedTrendingRequestSchema.safeParse({ country }).success,
        country
      ).toBe(false);
    }
  });
});
