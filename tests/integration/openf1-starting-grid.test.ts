import { describe, expect, it } from "vitest";

import { createOpenF1, OpenF1Error } from "@apicity/openf1";
import type { OpenF1StartingGridEntry } from "@apicity/openf1";

const sampleStartingGridEntry: OpenF1StartingGridEntry = {
  driver_number: 1,
  lap_duration: 76.732,
  meeting_key: 1143,
  position: 1,
  session_key: 7783,
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function makeProvider(responseBody: unknown = [sampleStartingGridEntry]) {
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

describe("openf1 starting grid", () => {
  it("builds the starting grid route and OpenF1 filters", async () => {
    const { openf1, requests } = makeProvider();

    const result = await openf1.v1.startingGrid({
      session_key: "latest",
      driver_number: [1, 63],
      position: 1,
      filters: [
        { field: "lap_duration", op: "<=", value: 77 },
        { field: "position", op: "<=", value: 3 },
      ],
    });

    expect(result).toEqual([sampleStartingGridEntry]);
    expect(requests).toHaveLength(1);
    expect(requests[0].method).toBe("GET");

    const url = new URL(requests[0].url);
    expect(`${url.origin}${url.pathname}`).toBe(
      "https://openf1.test/root/v1/starting_grid"
    );
    expect(url.searchParams.get("session_key")).toBe("latest");
    expect(url.searchParams.getAll("driver_number")).toEqual(["1", "63"]);
    expect(url.searchParams.get("position")).toBe("1");
    expect(url.searchParams.get("lap_duration<=")).toBe("77");
    expect(url.searchParams.get("position<=")).toBe("3");
  });

  it("returns typed CSV text when csv=true", async () => {
    const requests: Array<{ url: string; method?: string }> = [];
    const openf1 = createOpenF1({
      fetch: async (input, init) => {
        requests.push({ url: String(input), method: init?.method });
        return new Response("position,driver_number\n1,1\n", {
          headers: { "content-type": "text/csv" },
        });
      },
    });

    const result = await openf1.v1.startingGrid({
      csv: true,
      session_key: 7783,
    });

    expect(result).toBe("position,driver_number\n1,1\n");
    const url = new URL(requests[0].url);
    expect(url.searchParams.get("csv")).toBe("true");
    expect(url.searchParams.get("session_key")).toBe("7783");
  });

  it("exposes request schema metadata", () => {
    const openf1 = createOpenF1();
    const schema = openf1.v1.startingGrid.schema;

    expect(
      schema.safeParse({
        meeting_key: "latest",
        session_key: "latest",
        driver_number: [1, 63],
        filters: [{ field: "lap_duration", op: "<=", value: 77 }],
      }).success
    ).toBe(true);
    expect(
      schema.safeParse({
        filters: [{ field: "unknown", op: "<=", value: 77 }],
      }).success
    ).toBe(false);
  });

  it("maps non-ok responses to OpenF1Error", async () => {
    const openf1 = createOpenF1({
      fetch: async () => jsonResponse({ detail: "No results found." }, 404),
    });

    await expect(
      openf1.v1.startingGrid({ session_key: 1 })
    ).rejects.toMatchObject({
      name: "OpenF1Error",
      status: 404,
      body: { detail: "No results found." },
    } satisfies Partial<OpenF1Error>);
  });
});
