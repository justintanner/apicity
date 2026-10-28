import { describe, expect, it } from "vitest";

import { createEndless } from "@apicity/endless";
import type { EndlessError } from "@apicity/endless";
import {
  EndlessTikTokTrendsPublicRequestSchema,
  EndlessTikTokTrendsRegionSchema,
  EndlessTrendsPublicRequestSchema,
  EndlessTrendsRegionSchema,
} from "@apicity/endless/zod";

interface CapturedRequest {
  url: string;
  init: RequestInit;
}

const TRENDS = {
  region: "united-states",
  captured_at: "2026-10-28T06:48:17.888Z",
  videos: [],
  longest: [],
  sounds: [],
  hashtags: [],
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function capture(respond: () => Response) {
  const requests: CapturedRequest[] = [];
  const fetch: typeof globalThis.fetch = async (url, init) => {
    requests.push({ url: String(url), init: init ?? {} });
    return respond();
  };
  return { requests, fetch };
}

// Never answers; rejects once the request's signal aborts.
const hangingFetch: typeof globalThis.fetch = (_url, init) =>
  new Promise((_resolve, reject) => {
    init?.signal?.addEventListener(
      "abort",
      () => reject(new Error("aborted")),
      { once: true }
    );
  });

describe("endless provider", () => {
  it("requests TikTok trends by slug, pinned to API major 1, without auth", async () => {
    const { requests, fetch } = capture(() => jsonResponse(TRENDS));
    const endless = createEndless({ baseURL: "https://endless.test/", fetch });

    await expect(
      endless.social.tiktokTrends.public({ region: "united-states" })
    ).resolves.toEqual(TRENDS);

    expect(requests).toHaveLength(1);
    expect(requests[0].url).toBe(
      "https://endless.test/social/tiktok-trends/public/united-states"
    );
    expect(requests[0].init.method).toBe("GET");
    expect(requests[0].init.headers).toEqual({ "Endless-Api-Version": "1" });
  });

  it("sends apiVersion as the Endless-Api-Version header", async () => {
    const { requests, fetch } = capture(() => jsonResponse(TRENDS));
    const endless = createEndless({ apiVersion: "2", fetch });

    await endless.social.tiktokTrends.public({ region: "japan" });

    expect(requests[0].url).toBe(
      "https://api.endless.app/social/tiktok-trends/public/japan"
    );
    expect(requests[0].init.headers).toEqual({ "Endless-Api-Version": "2" });
  });

  it("maps an Endless error body to EndlessError with its reason code", async () => {
    const body = {
      defined: false,
      code: "NOT_FOUND",
      status: 404,
      message:
        "A path parameter in /social/tiktok-trends/public/TH does not name an existing resource.",
      data: { code: "invalid_path_parameter" },
    };
    const { fetch } = capture(() => jsonResponse(body, 404));
    const endless = createEndless({ fetch });

    await expect(
      endless.social.tiktokTrends.public({ region: "TH" as never })
    ).rejects.toMatchObject({
      name: "EndlessError",
      message:
        "Endless API error 404: A path parameter in /social/tiktok-trends/public/TH does not name an existing resource.",
      status: 404,
      code: "invalid_path_parameter",
      body,
    } satisfies Partial<EndlessError>);
  });

  it("keeps a non-JSON error body as text", async () => {
    const { fetch } = capture(
      () => new Response("bad gateway", { status: 502 })
    );
    const endless = createEndless({ fetch });

    const error = await endless.social.tiktokTrends
      .public({ region: "peru" })
      .catch((caught: unknown) => caught);

    expect(error).toMatchObject({
      name: "EndlessError",
      message: "Endless API error 502: bad gateway",
      status: 502,
      body: "bad gateway",
    } satisfies Partial<EndlessError>);
    expect((error as EndlessError).code).toBeUndefined();
  });

  it("reports a timeout as 408 and a caller abort as 499", async () => {
    const timedOut = createEndless({ timeout: 1, fetch: hangingFetch });
    await expect(
      timedOut.social.tiktokTrends.public({ region: "chile" })
    ).rejects.toMatchObject({ name: "EndlessError", status: 408 });

    const caller = new AbortController();
    const aborted = createEndless({ fetch: hangingFetch });
    const pending = aborted.social.tiktokTrends.public(
      { region: "chile" },
      caller.signal
    );
    caller.abort();
    await expect(pending).rejects.toMatchObject({
      name: "EndlessError",
      status: 499,
    });
  });

  it("reports a request that never got a response as 500 with its cause", async () => {
    const endless = createEndless({
      fetch: async () => {
        throw new TypeError("fetch failed");
      },
    });

    await expect(
      endless.social.tiktokTrends.public({ region: "egypt" })
    ).rejects.toMatchObject({
      name: "EndlessError",
      message: "Endless request failed: fetch failed",
      status: 500,
    });
  });

  it("attaches the region-slug schema and the recorded example", () => {
    const method = createEndless().social.tiktokTrends.public;

    expect(method.schema).toBe(EndlessTikTokTrendsPublicRequestSchema);
    expect(method.schema.safeParse({ region: "thailand" }).success).toBe(true);
    expect(method.schema.safeParse({ region: "TH" }).success).toBe(false);
    expect(method.schema.safeParse({}).success).toBe(false);
    expect(EndlessTikTokTrendsRegionSchema.options).toHaveLength(20);
    expect(
      (method as unknown as { example?: { payload: unknown } }).example?.payload
    ).toEqual({ region: "thailand" });
  });

  it("requests X trends by region slug", async () => {
    const trends = {
      region: "worldwide",
      captured_at: null,
      trends: [],
      timeline: [],
      longest: [],
    };
    const { requests, fetch } = capture(() => jsonResponse(trends));
    const endless = createEndless({ fetch });

    await expect(
      endless.social.trends.public({ region: "south-korea" })
    ).resolves.toEqual(trends);

    expect(requests[0].url).toBe(
      "https://api.endless.app/social/trends/public/south-korea"
    );
    expect(requests[0].init.method).toBe("GET");
    expect(requests[0].init.headers).toEqual({ "Endless-Api-Version": "1" });
  });

  it("attaches the X trends region schema and the recorded example", () => {
    const method = createEndless().social.trends.public;

    expect(method.schema).toBe(EndlessTrendsPublicRequestSchema);
    expect(method.schema.safeParse({ region: "worldwide" }).success).toBe(true);
    // X trends cover 43 regions TikTok trends do not, `worldwide` among them.
    expect(method.schema.safeParse({ region: "south-korea" }).success).toBe(
      true
    );
    expect(
      EndlessTikTokTrendsPublicRequestSchema.safeParse({ region: "worldwide" })
        .success
    ).toBe(false);
    expect(EndlessTrendsRegionSchema.options).toHaveLength(63);
    expect(
      (method as unknown as { example?: { payload: unknown } }).example?.payload
    ).toEqual({ region: "worldwide" });
  });
});
