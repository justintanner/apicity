import { describe, expect, it } from "vitest";

import { createOpenF1, OpenF1Error } from "@apicity/openf1";
import type { OpenF1RaceControlMessage } from "@apicity/openf1";

const sampleMessage: OpenF1RaceControlMessage = {
  category: "Flag",
  date: "2023-06-04T14:21:01+00:00",
  driver_number: 1,
  flag: "BLACK AND WHITE",
  lap_number: 59,
  meeting_key: 1211,
  message: "BLACK AND WHITE FLAG FOR CAR 1 (VER) - TRACK LIMITS",
  qualifying_phase: null,
  scope: "Driver",
  sector: null,
  session_key: 9102,
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function makeProvider(responseBody: unknown = [sampleMessage]) {
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

describe("openf1 race control", () => {
  it("builds the race control route and OpenF1 filters", async () => {
    const { openf1, requests } = makeProvider();

    const result = await openf1.v1.raceControl({
      flag: "BLACK AND WHITE",
      driver_number: [1, 44],
      session_key: "latest",
      filters: [
        { field: "date", op: ">=", value: "2023-01-01" },
        { field: "date", op: "<", value: "2023-09-01" },
      ],
    });

    expect(result).toEqual([sampleMessage]);
    expect(requests).toHaveLength(1);
    expect(requests[0].method).toBe("GET");

    const url = new URL(requests[0].url);
    expect(`${url.origin}${url.pathname}`).toBe(
      "https://openf1.test/root/v1/race_control"
    );
    expect(url.searchParams.get("flag")).toBe("BLACK AND WHITE");
    expect(url.searchParams.getAll("driver_number")).toEqual(["1", "44"]);
    expect(url.searchParams.get("session_key")).toBe("latest");
    expect(url.searchParams.get("date>=")).toBe("2023-01-01");
    expect(url.searchParams.get("date<")).toBe("2023-09-01");
  });

  it("returns typed CSV text when csv=true", async () => {
    const requests: Array<{ url: string; method?: string }> = [];
    const openf1 = createOpenF1({
      fetch: async (input, init) => {
        requests.push({ url: String(input), method: init?.method });
        return new Response("category,flag\nFlag,BLACK AND WHITE\n", {
          headers: { "content-type": "text/csv" },
        });
      },
    });

    const result = await openf1.v1.raceControl({
      csv: true,
      category: "Flag",
    });

    expect(result).toBe("category,flag\nFlag,BLACK AND WHITE\n");
    const url = new URL(requests[0].url);
    expect(url.searchParams.get("csv")).toBe("true");
    expect(url.searchParams.get("category")).toBe("Flag");
  });

  it("exposes request schema metadata", () => {
    const openf1 = createOpenF1();
    const schema = openf1.v1.raceControl.schema;

    expect(
      schema.safeParse({
        meeting_key: "latest",
        session_key: "latest",
        flag: ["YELLOW", "DOUBLE YELLOW"],
        filters: [{ field: "lap_number", op: ">=", value: 1 }],
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
      openf1.v1.raceControl({ session_key: 1 })
    ).rejects.toMatchObject({
      name: "OpenF1Error",
      status: 404,
      body: { detail: "No results found." },
    } satisfies Partial<OpenF1Error>);
  });
});
