import { describe, expect, it } from "vitest";

import { createOpenF1, OpenF1Error } from "@apicity/openf1";
import type { OpenF1ChampionshipDriver } from "@apicity/openf1";

const sampleDriver: OpenF1ChampionshipDriver = {
  driver_number: 4,
  meeting_key: 1276,
  points_current: 423,
  points_start: 408,
  position_current: 1,
  position_start: 1,
  session_key: 9839,
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function makeProvider(responseBody: unknown = [sampleDriver]) {
  const requests: Array<{ url: string; method?: string }> = [];
  const openf1 = createOpenF1({
    baseURL: "https://openf1.test/root/",
    fetch: async (input, init) => {
      requests.push({
        url: String(input),
        method: init?.method,
      });
      return jsonResponse(responseBody);
    },
  });
  return { openf1, requests };
}

describe("openf1 championship drivers", () => {
  it("builds the championship drivers route and OpenF1 filters", async () => {
    const { openf1, requests } = makeProvider();

    const result = await openf1.v1.championshipDrivers({
      session_key: 9839,
      driver_number: [4, 81],
      filters: [
        { field: "points_current", op: ">=", value: 400 },
        { field: "position_current", op: "<=", value: 3 },
      ],
    });

    expect(result).toEqual([sampleDriver]);
    expect(requests).toHaveLength(1);
    expect(requests[0].method).toBe("GET");

    const url = new URL(requests[0].url);
    expect(`${url.origin}${url.pathname}`).toBe(
      "https://openf1.test/root/v1/championship_drivers"
    );
    expect(url.searchParams.get("session_key")).toBe("9839");
    expect(url.searchParams.getAll("driver_number")).toEqual(["4", "81"]);
    expect(url.searchParams.get("points_current>=")).toBe("400");
    expect(url.searchParams.get("position_current<=")).toBe("3");
  });

  it("returns typed CSV text when csv=true", async () => {
    const requests: Array<{ url: string; method?: string }> = [];
    const openf1 = createOpenF1({
      fetch: async (input, init) => {
        requests.push({ url: String(input), method: init?.method });
        return new Response("driver_number,points_current\n4,423\n", {
          headers: { "content-type": "text/csv" },
        });
      },
    });

    const result = await openf1.v1.championshipDrivers({
      csv: true,
      session_key: "latest",
    });

    expect(result).toBe("driver_number,points_current\n4,423\n");
    const url = new URL(requests[0].url);
    expect(url.searchParams.get("csv")).toBe("true");
    expect(url.searchParams.get("session_key")).toBe("latest");
  });

  it("omits the query string when no request filters are provided", async () => {
    const { openf1, requests } = makeProvider();

    await openf1.v1.championshipDrivers();

    expect(requests[0]).toEqual({
      url: "https://openf1.test/root/v1/championship_drivers",
      method: "GET",
    });
  });

  it("exposes request schema metadata", () => {
    const openf1 = createOpenF1();
    const schema = openf1.v1.championshipDrivers.schema;

    expect(
      schema.safeParse({
        meeting_key: "latest",
        driver_number: [4, 81],
        filters: [{ field: "position_start", op: ">", value: 1 }],
      }).success
    ).toBe(true);
    expect(
      schema.safeParse({
        filters: [{ field: "unknown", op: ">", value: 1 }],
      }).success
    ).toBe(false);
  });

  it("maps non-ok responses to OpenF1Error", async () => {
    const openf1 = createOpenF1({
      fetch: async () => jsonResponse({ detail: "No results found." }, 404),
    });

    await expect(
      openf1.v1.championshipDrivers({ session_key: 1 })
    ).rejects.toMatchObject({
      name: "OpenF1Error",
      status: 404,
      body: { detail: "No results found." },
    } satisfies Partial<OpenF1Error>);
  });
});
