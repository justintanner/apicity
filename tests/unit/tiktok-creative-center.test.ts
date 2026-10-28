import { describe, expect, it } from "vitest";

import { createTiktokCreativeCenter } from "@apicity/tiktok-creative-center";
import type { TiktokCreativeCenterError } from "@apicity/tiktok-creative-center";
import { TiktokCreativeCenterGetTopContentsListRequestSchema } from "@apicity/tiktok-creative-center/zod";

interface CapturedRequest {
  url: string;
  init: RequestInit;
}

const WEEK = {
  countryCode: "TH",
  periodDimension: 3,
  periodEndTimestamp: 1792886400,
  orderByMetric: 1,
} as const;

function capture(respond: () => Response) {
  const requests: CapturedRequest[] = [];
  const fetch: typeof globalThis.fetch = async (url, init) => {
    requests.push({ url: String(url), init: init ?? {} });
    return respond();
  };
  return { requests, fetch };
}

function textResponse(text: string, status = 200): Response {
  return new Response(text, {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const EMPTY_LIST = '{"BaseResp":{"StatusCode":0,"StatusMessage":""}}';

// Never answers; rejects once the request's signal aborts.
const hangingFetch: typeof globalThis.fetch = (_url, init) =>
  new Promise((_resolve, reject) => {
    init?.signal?.addEventListener(
      "abort",
      () => reject(new Error("aborted")),
      { once: true }
    );
  });

function list(provider: ReturnType<typeof createTiktokCreativeCenter>) {
  return provider.ads.creativeOne.report.creativeCenterGetTopContentsList;
}

describe("tiktok-creative-center provider", () => {
  it("sends the query in a fixed order with the trends page's browser headers", async () => {
    const { requests, fetch } = capture(() => textResponse(EMPTY_LIST));
    const tcc = createTiktokCreativeCenter({
      baseURL: "https://tcc.test/",
      fetch,
    });

    await list(tcc)({ organicOnly: true, contentLabelIDs: "", ...WEEK });

    expect(requests).toHaveLength(1);
    expect(requests[0].url).toBe(
      "https://tcc.test/CreativeOne/Report/CreativeCenterGetTopContentsList?countryCode=TH&periodDimension=3&periodEndTimestamp=1792886400&orderByMetric=1&organicOnly=true&contentLabelIDs="
    );
    expect(requests[0].init.method).toBe("GET");
    expect(requests[0].init.headers).toEqual({
      "User-Agent": expect.stringMatching(/^Mozilla\/5\.0 .*Chrome\//),
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.9",
      Referer: "https://ads.tiktok.com/creative/creativeCenter/trends/video",
    });
  });

  it("requests the overview with no query and the same headers", async () => {
    const overview = {
      BaseResp: { StatusCode: 0, StatusMessage: "" },
      lastDailyEndTimestamp: 1792886400,
      lastMonthlyEndTimestamp: 1790726400,
      lastWeeklyEndTimestamp: 1792886400,
    };
    const { requests, fetch } = capture(() =>
      textResponse(JSON.stringify(overview))
    );
    const tcc = createTiktokCreativeCenter({ fetch });

    await expect(
      tcc.ads.creativeOne.report.getTopContentsOverview()
    ).resolves.toEqual(overview);

    expect(requests[0].url).toBe(
      "https://ads.tiktok.com/CreativeOne/Report/GetTopContentsOverview"
    );
    expect(requests[0].init.method).toBe("GET");
    expect(requests[0].init.headers).toMatchObject({
      Referer: "https://ads.tiktok.com/creative/creativeCenter/trends/video",
    });
  });

  it("sends the userAgent option as User-Agent", async () => {
    const { requests, fetch } = capture(() => textResponse(EMPTY_LIST));
    const tcc = createTiktokCreativeCenter({ userAgent: "videobook/1", fetch });

    await list(tcc)(WEEK);

    expect(requests[0].url).toMatch(
      /^https:\/\/ads\.tiktok\.com\/CreativeOne\/Report\/CreativeCenterGetTopContentsList\?/
    );
    expect(
      (requests[0].init.headers as Record<string, string>)["User-Agent"]
    ).toBe("videobook/1");
  });

  it("returns ids above 2^53 as strings with every digit", async () => {
    // JSON.parse alone would round 7698250766473071893 to 7698250766473072000.
    // The title quotes an id-like key, which must stay as written.
    const raw =
      '{"BaseResp":{"StatusCode":0,"StatusMessage":""},"entityInfos":[{"itemInfo":{"authorID":7561973961975398407,"createTime":1792388688,"creatorID":7522434872880301074,"itemID":7698250766473071893,"title":"say \\"itemID\\":12345678901234567890"}}]}';
    const { fetch } = capture(() => textResponse(raw));

    const result = await list(createTiktokCreativeCenter({ fetch }))(WEEK);

    expect(result.entityInfos?.[0].itemInfo).toEqual({
      authorID: "7561973961975398407",
      createTime: 1792388688,
      creatorID: "7522434872880301074",
      itemID: "7698250766473071893",
      title: 'say "itemID":12345678901234567890',
    });
  });

  it("rejects a nonzero BaseResp.StatusCode that arrives with HTTP 200", async () => {
    const body = {
      BaseResp: {
        StatusCode: 38014004,
        StatusMessage: "not supported top contents setting",
      },
      pagination: {},
    };
    const { fetch } = capture(() => textResponse(JSON.stringify(body)));

    await expect(
      list(createTiktokCreativeCenter({ fetch }))({
        ...WEEK,
        periodDimension: 4 as never,
      })
    ).rejects.toMatchObject({
      name: "TiktokCreativeCenterError",
      message:
        "TikTok Creative Center error 38014004: not supported top contents setting",
      status: 200,
      statusCode: 38014004,
      body,
    } satisfies Partial<TiktokCreativeCenterError>);
  });

  it("rejects an answer without BaseResp, such as an HTML page", async () => {
    const { fetch } = capture(
      () => new Response("<!DOCTYPE html><html></html>", { status: 200 })
    );

    await expect(
      list(createTiktokCreativeCenter({ fetch }))(WEEK)
    ).rejects.toMatchObject({
      name: "TiktokCreativeCenterError",
      message: "TikTok Creative Center answered without BaseResp.StatusCode",
      status: 200,
      body: "<!DOCTYPE html><html></html>",
    });
  });

  it("rejects an HTTP error with its status and a bounded message", async () => {
    const page = `<html>${"x".repeat(500)}</html>`;
    const { fetch } = capture(() => new Response(page, { status: 503 }));

    const error = (await list(createTiktokCreativeCenter({ fetch }))(
      WEEK
    ).catch((caught: unknown) => caught)) as TiktokCreativeCenterError;

    expect(error).toMatchObject({
      name: "TiktokCreativeCenterError",
      status: 503,
      body: page,
    });
    expect(error.message).toBe(
      `TikTok Creative Center error 503: ${page.slice(0, 200)}`
    );
  });

  it("reports a timeout as 408, a caller abort as 499 and no response as 500", async () => {
    await expect(
      list(createTiktokCreativeCenter({ timeout: 1, fetch: hangingFetch }))(
        WEEK
      )
    ).rejects.toMatchObject({ status: 408 });

    const caller = new AbortController();
    const pending = list(createTiktokCreativeCenter({ fetch: hangingFetch }))(
      WEEK,
      caller.signal
    );
    caller.abort();
    await expect(pending).rejects.toMatchObject({ status: 499 });

    await expect(
      list(
        createTiktokCreativeCenter({
          fetch: async () => {
            throw new TypeError("fetch failed");
          },
        })
      )(WEEK)
    ).rejects.toMatchObject({
      message: "TikTok Creative Center request failed: fetch failed",
      status: 500,
    });
  });

  it("attaches the query schema and the recorded example", () => {
    const method = list(createTiktokCreativeCenter());

    expect(method.schema).toBe(
      TiktokCreativeCenterGetTopContentsListRequestSchema
    );
    expect(method.schema.safeParse(WEEK).success).toBe(true);
    for (const bad of [
      { ...WEEK, countryCode: "th" },
      { ...WEEK, periodDimension: 4 },
      { ...WEEK, orderByMetric: 0 },
      { countryCode: "TH" },
    ]) {
      expect(method.schema.safeParse(bad).success, JSON.stringify(bad)).toBe(
        false
      );
    }
    expect(
      (method as unknown as { example?: { payload: unknown } }).example?.payload
    ).toMatchObject({ countryCode: "TH", periodDimension: 3 });
  });
});
