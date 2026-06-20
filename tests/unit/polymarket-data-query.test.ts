import { describe, expect, it } from "vitest";
import { createPolymarket } from "@apicity/polymarket";

const DATA_BASE_URL = "https://data-api.example.test";
const USER_ADDRESS = "0xf9ac4c4ef54ee6010a28299ec1d616b63bf7806e";
const CONDITION_ID_A =
  "0x384e2707bbb95da4bfa6f330fe7d5ccbec1c0a85e20be900cbf599987588e1a4";
const CONDITION_ID_B =
  "0x95d66c1152bfc3470ba4e08ac77729b244a5b2f12a21efc8dc75c2873d1fb2fb";
const COMBO_ID_A =
  "0x0391ab0ebea17b65ba87e071b0566e816b0000000000000000000000000000";
const COMBO_ID_B =
  "0x1e91ab0ebea17b65ba87e071b0566e816b0000000000000000000000000000";

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
  });
}

function createDataClient(
  response: Response | (() => Response) = jsonResponse([])
) {
  const requests: string[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    requests.push(String(url));
    expect(init?.method).toBe("GET");
    return typeof response === "function" ? response() : response.clone();
  };

  return {
    provider: createPolymarket({
      dataBaseURL: DATA_BASE_URL,
      fetch: fetchImpl,
    }),
    requests,
  };
}

function requestSearchParams(
  requests: string[],
  index: number,
  path: string
): URLSearchParams {
  const url = new URL(requests[index]);
  expect(`${url.origin}${url.pathname}`).toBe(`${DATA_BASE_URL}${path}`);
  return url.searchParams;
}

describe("polymarket Data API query serialization", () => {
  it("serializes health root and accounting snapshot binary requests", async () => {
    const responses = [
      jsonResponse({ data: "OK" }),
      new Response(new Uint8Array([0x50, 0x4b, 0x03, 0x04]), {
        headers: { "content-type": "application/zip" },
      }),
    ];
    const { provider, requests } = createDataClient(() => {
      const response = responses.shift();
      if (!response) throw new Error("unexpected request");
      return response;
    });

    await expect(provider.get.data.health()).resolves.toEqual({ data: "OK" });
    const snapshot = await provider.get.data.accounting.snapshot({
      user: USER_ADDRESS,
    });

    expect(new Uint8Array(snapshot)).toEqual(
      new Uint8Array([0x50, 0x4b, 0x03, 0x04])
    );
    expect(requests).toHaveLength(2);
    expect(new URL(requests[0]).pathname).toBe("/");
    const snapshotParams = requestSearchParams(
      requests,
      1,
      "/v1/accounting/snapshot"
    );
    expect(snapshotParams.get("user")).toBe(USER_ADDRESS);
  });

  it("serializes positions filters, CSV markets, sorting, and pagination", async () => {
    const { provider, requests } = createDataClient();

    await provider.get.data.positions({
      user: USER_ADDRESS,
      market: [CONDITION_ID_A, CONDITION_ID_B],
      eventId: [16167, 16168],
      sizeThreshold: 0.01,
      redeemable: true,
      mergeable: false,
      title: "Election & Markets",
      sortBy: "CURRENT",
      sortDirection: "DESC",
      limit: 25,
      offset: 50,
    });

    expect(requests).toHaveLength(1);
    const params = requestSearchParams(requests, 0, "/positions");
    expect(params.get("user")).toBe(USER_ADDRESS);
    expect(params.get("market")).toBe(`${CONDITION_ID_A},${CONDITION_ID_B}`);
    expect(params.get("eventId")).toBe("16167,16168");
    expect(params.get("sizeThreshold")).toBe("0.01");
    expect(params.get("redeemable")).toBe("true");
    expect(params.get("mergeable")).toBe("false");
    expect(params.get("title")).toBe("Election & Markets");
    expect(params.get("sortBy")).toBe("CURRENT");
    expect(params.get("sortDirection")).toBe("DESC");
    expect(params.get("limit")).toBe("25");
    expect(params.get("offset")).toBe("50");
  });

  it("serializes combo position filters", async () => {
    const { provider, requests } = createDataClient(jsonResponse({}));

    await provider.get.data.positions.combos({
      user: USER_ADDRESS,
      status: "OPEN",
      sort: "entry_cost_desc",
      market_id: [COMBO_ID_A, COMBO_ID_B],
      limit: 20,
      offset: 40,
    });

    expect(requests).toHaveLength(1);
    const params = requestSearchParams(requests, 0, "/v1/positions/combos");
    expect(params.get("user")).toBe(USER_ADDRESS);
    expect(params.get("status")).toBe("OPEN");
    expect(params.get("sort")).toBe("entry_cost_desc");
    expect(params.get("market_id")).toBe(`${COMBO_ID_A},${COMBO_ID_B}`);
    expect(params.get("limit")).toBe("20");
    expect(params.get("offset")).toBe("40");
  });

  it("serializes holders and trades CSV market inputs", async () => {
    const { provider, requests } = createDataClient();

    await provider.get.data.holders({
      market: [CONDITION_ID_A, CONDITION_ID_B],
      limit: 3,
    });
    await provider.get.data.trades({
      user: USER_ADDRESS,
      market: [CONDITION_ID_A, CONDITION_ID_B],
      eventId: [16167, 16168],
      limit: 10,
      offset: 20,
      takerOnly: true,
      filterType: "CASH",
      filterAmount: 100,
      side: "SELL",
    });

    expect(requests).toHaveLength(2);

    const holders = requestSearchParams(requests, 0, "/holders");
    expect(holders.get("market")).toBe(`${CONDITION_ID_A},${CONDITION_ID_B}`);
    expect(holders.get("limit")).toBe("3");

    const trades = requestSearchParams(requests, 1, "/trades");
    expect(trades.get("user")).toBe(USER_ADDRESS);
    expect(trades.get("market")).toBe(`${CONDITION_ID_A},${CONDITION_ID_B}`);
    expect(trades.get("eventId")).toBe("16167,16168");
    expect(trades.get("limit")).toBe("10");
    expect(trades.get("offset")).toBe("20");
    expect(trades.get("takerOnly")).toBe("true");
    expect(trades.get("filterType")).toBe("CASH");
    expect(trades.get("filterAmount")).toBe("100");
    expect(trades.get("side")).toBe("SELL");
  });

  it("serializes activity windows, CSV type filters, side, sorting, and pagination", async () => {
    const { provider, requests } = createDataClient();

    await provider.get.data.activity({
      user: USER_ADDRESS,
      market: [CONDITION_ID_A, CONDITION_ID_B],
      eventId: [16167, 16168],
      type: ["TRADE", "REDEEM"],
      start: 1_700_000_000,
      end: 1_700_086_400,
      side: "BUY",
      sortBy: "TIMESTAMP",
      sortDirection: "ASC",
      limit: 15,
      offset: 30,
    });

    expect(requests).toHaveLength(1);
    const params = requestSearchParams(requests, 0, "/activity");
    expect(params.get("user")).toBe(USER_ADDRESS);
    expect(params.get("market")).toBe(`${CONDITION_ID_A},${CONDITION_ID_B}`);
    expect(params.get("eventId")).toBe("16167,16168");
    expect(params.get("type")).toBe("TRADE,REDEEM");
    expect(params.get("start")).toBe("1700000000");
    expect(params.get("end")).toBe("1700086400");
    expect(params.get("side")).toBe("BUY");
    expect(params.get("sortBy")).toBe("TIMESTAMP");
    expect(params.get("sortDirection")).toBe("ASC");
    expect(params.get("limit")).toBe("15");
    expect(params.get("offset")).toBe("30");
  });

  it("serializes combo activity filters", async () => {
    const { provider, requests } = createDataClient(jsonResponse({}));

    await provider.get.data.activity.combos({
      user: USER_ADDRESS,
      market_id: [COMBO_ID_A, COMBO_ID_B],
      limit: 5,
      offset: 10,
    });

    expect(requests).toHaveLength(1);
    const params = requestSearchParams(requests, 0, "/v1/activity/combos");
    expect(params.get("user")).toBe(USER_ADDRESS);
    expect(params.get("market_id")).toBe(`${COMBO_ID_A},${COMBO_ID_B}`);
    expect(params.get("limit")).toBe("5");
    expect(params.get("offset")).toBe("10");
  });

  it("serializes value, traded, open-interest, and live-volume inputs", async () => {
    const { provider, requests } = createDataClient();

    await provider.get.data.value({
      user: USER_ADDRESS,
      market: [CONDITION_ID_A, CONDITION_ID_B],
    });
    await provider.get.data.traded({ user: USER_ADDRESS });
    await provider.get.data.oi();
    await provider.get.data.oi({ market: [CONDITION_ID_A, CONDITION_ID_B] });
    await provider.get.data.liveVolume({ id: 16167 });

    expect(requests).toHaveLength(5);

    const value = requestSearchParams(requests, 0, "/value");
    expect(value.get("user")).toBe(USER_ADDRESS);
    expect(value.get("market")).toBe(`${CONDITION_ID_A},${CONDITION_ID_B}`);

    const traded = requestSearchParams(requests, 1, "/traded");
    expect(traded.get("user")).toBe(USER_ADDRESS);

    expect(new URL(requests[2]).search).toBe("");

    const oi = requestSearchParams(requests, 3, "/oi");
    expect(oi.get("market")).toBe(`${CONDITION_ID_A},${CONDITION_ID_B}`);

    const liveVolume = requestSearchParams(requests, 4, "/live-volume");
    expect(liveVolume.get("id")).toBe("16167");
  });

  it("serializes closed and market position filters", async () => {
    const { provider, requests } = createDataClient();

    await provider.get.data.closedPositions({
      user: USER_ADDRESS,
      market: [CONDITION_ID_A, CONDITION_ID_B],
      title: "Election",
      eventId: [16167, 16168],
      limit: 10,
      offset: 100,
      sortBy: "TIMESTAMP",
      sortDirection: "ASC",
    });
    await provider.get.data.marketPositions({
      market: CONDITION_ID_A,
      user: USER_ADDRESS,
      status: "ALL",
      sortBy: "TOTAL_PNL",
      sortDirection: "DESC",
      limit: 50,
      offset: 150,
    });

    expect(requests).toHaveLength(2);

    const closed = requestSearchParams(requests, 0, "/closed-positions");
    expect(closed.get("user")).toBe(USER_ADDRESS);
    expect(closed.get("market")).toBe(`${CONDITION_ID_A},${CONDITION_ID_B}`);
    expect(closed.get("title")).toBe("Election");
    expect(closed.get("eventId")).toBe("16167,16168");
    expect(closed.get("limit")).toBe("10");
    expect(closed.get("offset")).toBe("100");
    expect(closed.get("sortBy")).toBe("TIMESTAMP");
    expect(closed.get("sortDirection")).toBe("ASC");

    const market = requestSearchParams(requests, 1, "/v1/market-positions");
    expect(market.get("market")).toBe(CONDITION_ID_A);
    expect(market.get("user")).toBe(USER_ADDRESS);
    expect(market.get("status")).toBe("ALL");
    expect(market.get("sortBy")).toBe("TOTAL_PNL");
    expect(market.get("sortDirection")).toBe("DESC");
    expect(market.get("limit")).toBe("50");
    expect(market.get("offset")).toBe("150");
  });

  it("serializes builder and trader leaderboard filters", async () => {
    const { provider, requests } = createDataClient();

    await provider.get.data.builders.leaderboard({
      timePeriod: "WEEK",
      limit: 25,
      offset: 50,
    });
    await provider.get.data.builders.volume({ timePeriod: "MONTH" });
    await provider.get.data.leaderboard({
      category: "SPORTS",
      timePeriod: "ALL",
      orderBy: "VOL",
      limit: 30,
      offset: 60,
      user: USER_ADDRESS,
      userName: "trader",
    });

    expect(requests).toHaveLength(3);

    const builders = requestSearchParams(
      requests,
      0,
      "/v1/builders/leaderboard"
    );
    expect(builders.get("timePeriod")).toBe("WEEK");
    expect(builders.get("limit")).toBe("25");
    expect(builders.get("offset")).toBe("50");

    const volume = requestSearchParams(requests, 1, "/v1/builders/volume");
    expect(volume.get("timePeriod")).toBe("MONTH");

    const leaderboard = requestSearchParams(requests, 2, "/v1/leaderboard");
    expect(leaderboard.get("category")).toBe("SPORTS");
    expect(leaderboard.get("timePeriod")).toBe("ALL");
    expect(leaderboard.get("orderBy")).toBe("VOL");
    expect(leaderboard.get("limit")).toBe("30");
    expect(leaderboard.get("offset")).toBe("60");
    expect(leaderboard.get("user")).toBe(USER_ADDRESS);
    expect(leaderboard.get("userName")).toBe("trader");
  });
});
