import { describe, expect, it } from "vitest";

import { createOpenF1, OpenF1Error } from "@apicity/openf1";
import type { OpenF1Lap } from "@apicity/openf1";

const sampleLap: OpenF1Lap = {
  date_start: "2024-09-22T12:08:08.823000+00:00",
  driver_number: 4,
  duration_sector_1: 28.657,
  duration_sector_2: 41.389,
  duration_sector_3: 29.765,
  i1_speed: 292,
  i2_speed: 277,
  is_pit_out_lap: false,
  lap_duration: 99.811,
  lap_number: 2,
  meeting_key: 1251,
  segments_sector_1: [2049, 2049, 2049, 2049],
  segments_sector_2: [2049, 2049, 2049, 2049, 2049, 2049, 2049, 2049],
  segments_sector_3: [2049, 2049, 2049, 2049, 2049, 2049],
  session_key: 9636,
  st_speed: 312,
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function makeProvider(responseBody: unknown = [sampleLap]) {
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

describe("openf1 laps", () => {
  it("builds the laps route and OpenF1 filters", async () => {
    const { openf1, requests } = makeProvider();

    const result = await openf1.v1.laps({
      session_key: "latest",
      driver_number: [4, 81],
      is_pit_out_lap: false,
      filters: [
        { field: "lap_duration", op: ">=", value: 95 },
        { field: "lap_number", op: "<=", value: 12 },
      ],
    });

    expect(result).toEqual([sampleLap]);
    expect(requests).toHaveLength(1);
    expect(requests[0].method).toBe("GET");

    const url = new URL(requests[0].url);
    expect(`${url.origin}${url.pathname}`).toBe(
      "https://openf1.test/root/v1/laps"
    );
    expect(url.searchParams.get("session_key")).toBe("latest");
    expect(url.searchParams.getAll("driver_number")).toEqual(["4", "81"]);
    expect(url.searchParams.get("is_pit_out_lap")).toBe("false");
    expect(url.searchParams.get("lap_duration>=")).toBe("95");
    expect(url.searchParams.get("lap_number<=")).toBe("12");
  });

  it("returns typed CSV text when csv=true", async () => {
    const requests: Array<{ url: string; method?: string }> = [];
    const openf1 = createOpenF1({
      fetch: async (input, init) => {
        requests.push({ url: String(input), method: init?.method });
        return new Response("driver_number,lap_number\n4,2\n", {
          headers: { "content-type": "text/csv" },
        });
      },
    });

    const result = await openf1.v1.laps({
      csv: true,
      session_key: "latest",
    });

    expect(result).toBe("driver_number,lap_number\n4,2\n");
    const url = new URL(requests[0].url);
    expect(url.searchParams.get("csv")).toBe("true");
    expect(url.searchParams.get("session_key")).toBe("latest");
  });

  it("exposes request schema metadata", () => {
    const openf1 = createOpenF1();
    const schema = openf1.v1.laps.schema;

    expect(
      schema.safeParse({
        meeting_key: "latest",
        session_key: "latest",
        driver_number: [4, 81],
        filters: [{ field: "date_start", op: ">=", value: "2024-01-01" }],
      }).success
    ).toBe(true);
    expect(
      schema.safeParse({
        filters: [{ field: "unknown", op: ">=", value: 1 }],
      }).success
    ).toBe(false);
  });

  it("maps non-ok responses to OpenF1Error", async () => {
    const openf1 = createOpenF1({
      fetch: async () => jsonResponse({ detail: "No results found." }, 404),
    });

    await expect(openf1.v1.laps({ session_key: 1 })).rejects.toMatchObject({
      name: "OpenF1Error",
      status: 404,
      body: { detail: "No results found." },
    } satisfies Partial<OpenF1Error>);
  });
});
