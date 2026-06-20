import { describe, expect, it } from "vitest";
import { createPolymarket } from "@apicity/polymarket";

const DATA_BASE_URL = "https://data-api.example.test";
const USER_ADDRESS = "0xf9ac4c4ef54ee6010a28299ec1d616b63bf7806e";
const CONDITION_ID_A =
  "0x384e2707bbb95da4bfa6f330fe7d5ccbec1c0a85e20be900cbf599987588e1a4";
const CONDITION_ID_B =
  "0x95d66c1152bfc3470ba4e08ac77729b244a5b2f12a21efc8dc75c2873d1fb2fb";

function createDataClient() {
  const requests: string[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    requests.push(String(url));
    expect(init?.method).toBe("GET");
    return new Response("[]", {
      headers: { "content-type": "application/json" },
    });
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
  it("serializes positions filters, repeated markets, sorting, and pagination", async () => {
    const { provider, requests } = createDataClient();

    await provider.get.data.positions({
      user: USER_ADDRESS,
      market: [CONDITION_ID_A, CONDITION_ID_B],
      eventId: "16167",
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
    expect(params.getAll("market")).toEqual([CONDITION_ID_A, CONDITION_ID_B]);
    expect(params.get("eventId")).toBe("16167");
    expect(params.get("sizeThreshold")).toBe("0.01");
    expect(params.get("redeemable")).toBe("true");
    expect(params.get("mergeable")).toBe("false");
    expect(params.get("title")).toBe("Election & Markets");
    expect(params.get("sortBy")).toBe("CURRENT");
    expect(params.get("sortDirection")).toBe("DESC");
    expect(params.get("limit")).toBe("25");
    expect(params.get("offset")).toBe("50");
  });

  it("serializes holders and trades repeated market inputs", async () => {
    const { provider, requests } = createDataClient();

    await provider.get.data.holders({
      market: [CONDITION_ID_A, CONDITION_ID_B],
      limit: 3,
    });
    await provider.get.data.trades({
      user: USER_ADDRESS,
      market: [CONDITION_ID_A, CONDITION_ID_B],
      limit: 10,
      offset: 20,
      takerOnly: true,
      filterType: "CASH",
    });

    expect(requests).toHaveLength(2);

    const holders = requestSearchParams(requests, 0, "/holders");
    expect(holders.getAll("market")).toEqual([CONDITION_ID_A, CONDITION_ID_B]);
    expect(holders.get("limit")).toBe("3");

    const trades = requestSearchParams(requests, 1, "/trades");
    expect(trades.get("user")).toBe(USER_ADDRESS);
    expect(trades.getAll("market")).toEqual([CONDITION_ID_A, CONDITION_ID_B]);
    expect(trades.get("limit")).toBe("10");
    expect(trades.get("offset")).toBe("20");
    expect(trades.get("takerOnly")).toBe("true");
    expect(trades.get("filterType")).toBe("CASH");
  });

  it("serializes activity windows, repeated type filters, side, sorting, and pagination", async () => {
    const { provider, requests } = createDataClient();

    await provider.get.data.activity({
      user: USER_ADDRESS,
      market: [CONDITION_ID_A, CONDITION_ID_B],
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
    expect(params.getAll("market")).toEqual([CONDITION_ID_A, CONDITION_ID_B]);
    expect(params.getAll("type")).toEqual(["TRADE", "REDEEM"]);
    expect(params.get("start")).toBe("1700000000");
    expect(params.get("end")).toBe("1700086400");
    expect(params.get("side")).toBe("BUY");
    expect(params.get("sortBy")).toBe("TIMESTAMP");
    expect(params.get("sortDirection")).toBe("ASC");
    expect(params.get("limit")).toBe("15");
    expect(params.get("offset")).toBe("30");
  });

  it("serializes open-interest defaults and repeated market filters", async () => {
    const { provider, requests } = createDataClient();

    await provider.get.data.oi();
    await provider.get.data.oi({ market: [CONDITION_ID_A, CONDITION_ID_B] });

    expect(requests).toHaveLength(2);
    expect(new URL(requests[0]).search).toBe("");

    const params = requestSearchParams(requests, 1, "/oi");
    expect(params.getAll("market")).toEqual([CONDITION_ID_A, CONDITION_ID_B]);
  });

  it("serializes value user input and live-volume event ids", async () => {
    const { provider, requests } = createDataClient();

    await provider.get.data.value({ user: USER_ADDRESS });
    await provider.get.data.liveVolume({ id: 16167 });

    expect(requests).toHaveLength(2);

    const value = requestSearchParams(requests, 0, "/value");
    expect(value.get("user")).toBe(USER_ADDRESS);

    const liveVolume = requestSearchParams(requests, 1, "/live-volume");
    expect(liveVolume.get("id")).toBe("16167");
  });
});
