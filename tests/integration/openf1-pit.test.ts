import { describe, expect, it } from "vitest";

import { createOpenF1, OpenF1Error } from "@apicity/openf1";
import type { OpenF1PitStop } from "@apicity/openf1";

const samplePitStop: OpenF1PitStop = {
  date: "2025-10-26T20:46:37.358000+00:00",
  driver_number: 16,
  lane_duration: 22.215,
  lap_number: 31,
  meeting_key: 1272,
  pit_duration: 22.215,
  session_key: 9877,
  stop_duration: 2.2,
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function makeProvider(responseBody: unknown = [samplePitStop]) {
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

describe("openf1 pit", () => {
  it("builds the pit route and OpenF1 filters", async () => {
    const { openf1, requests } = makeProvider();

    const result = await openf1.v1.pit({
      session_key: "latest",
      driver_number: [16, 81],
      lap_number: 31,
      filters: [
        { field: "date", op: ">=", value: "2025-10-26T00:00:00Z" },
        { field: "stop_duration", op: "<", value: 2.3 },
      ],
    });

    expect(result).toEqual([samplePitStop]);
    expect(requests).toHaveLength(1);
    expect(requests[0].method).toBe("GET");

    const url = new URL(requests[0].url);
    expect(`${url.origin}${url.pathname}`).toBe(
      "https://openf1.test/root/v1/pit"
    );
    expect(url.searchParams.get("session_key")).toBe("latest");
    expect(url.searchParams.getAll("driver_number")).toEqual(["16", "81"]);
    expect(url.searchParams.get("lap_number")).toBe("31");
    expect(url.searchParams.get("date>=")).toBe("2025-10-26T00:00:00Z");
    expect(url.searchParams.get("stop_duration<")).toBe("2.3");
  });

  it("returns typed CSV text when csv=true", async () => {
    const requests: Array<{ url: string; method?: string }> = [];
    const openf1 = createOpenF1({
      fetch: async (input, init) => {
        requests.push({ url: String(input), method: init?.method });
        return new Response("driver_number,stop_duration\n16,2.2\n", {
          headers: { "content-type": "text/csv" },
        });
      },
    });

    const result = await openf1.v1.pit({
      csv: true,
      session_key: 9877,
    });

    expect(result).toBe("driver_number,stop_duration\n16,2.2\n");
    const url = new URL(requests[0].url);
    expect(url.searchParams.get("csv")).toBe("true");
    expect(url.searchParams.get("session_key")).toBe("9877");
  });

  it("exposes request schema metadata", () => {
    const openf1 = createOpenF1();
    const schema = openf1.v1.pit.schema;

    expect(
      schema.safeParse({
        date: "2025-10-26T20:46:37.358000+00:00",
        meeting_key: "latest",
        stop_duration: [2.1, 2.2],
        filters: [{ field: "lane_duration", op: ">=", value: 20 }],
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

    await expect(openf1.v1.pit({ session_key: 1 })).rejects.toMatchObject({
      name: "OpenF1Error",
      status: 404,
      body: { detail: "No results found." },
    } satisfies Partial<OpenF1Error>);
  });
});
