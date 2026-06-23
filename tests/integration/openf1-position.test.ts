import { describe, expect, it } from "vitest";

import { createOpenF1, OpenF1Error } from "@apicity/openf1";
import type { OpenF1Position } from "@apicity/openf1";

const samplePosition: OpenF1Position = {
  date: "2024-09-22T13:15:00.000000+00:00",
  driver_number: 4,
  meeting_key: 1251,
  position: 2,
  session_key: 9574,
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function makeProvider(responseBody: unknown = [samplePosition]) {
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

describe("openf1 position", () => {
  it("builds the position route and OpenF1 filters", async () => {
    const { openf1, requests } = makeProvider();

    const result = await openf1.v1.position({
      session_key: "latest",
      driver_number: [4, 81],
      position: 2,
      filters: [
        { field: "date", op: ">=", value: "2024-09-22T13:00:00Z" },
        { field: "date", op: "<", value: "2024-09-22T14:00:00Z" },
      ],
    });

    expect(result).toEqual([samplePosition]);
    expect(requests).toHaveLength(1);
    expect(requests[0].method).toBe("GET");

    const url = new URL(requests[0].url);
    expect(`${url.origin}${url.pathname}`).toBe(
      "https://openf1.test/root/v1/position"
    );
    expect(url.searchParams.get("session_key")).toBe("latest");
    expect(url.searchParams.getAll("driver_number")).toEqual(["4", "81"]);
    expect(url.searchParams.get("position")).toBe("2");
    expect(url.searchParams.get("date>=")).toBe("2024-09-22T13:00:00Z");
    expect(url.searchParams.get("date<")).toBe("2024-09-22T14:00:00Z");
  });

  it("returns typed CSV text when csv=true", async () => {
    const requests: Array<{ url: string; method?: string }> = [];
    const openf1 = createOpenF1({
      fetch: async (input, init) => {
        requests.push({ url: String(input), method: init?.method });
        return new Response("date,driver_number,position\n2024-09-22,4,2\n", {
          headers: { "content-type": "text/csv" },
        });
      },
    });

    const result = await openf1.v1.position({
      csv: true,
      meeting_key: 1251,
    });

    expect(result).toBe("date,driver_number,position\n2024-09-22,4,2\n");
    const url = new URL(requests[0].url);
    expect(url.searchParams.get("csv")).toBe("true");
    expect(url.searchParams.get("meeting_key")).toBe("1251");
  });

  it("exposes request schema metadata", () => {
    const openf1 = createOpenF1();
    const schema = openf1.v1.position.schema;

    expect(
      schema.safeParse({
        meeting_key: "latest",
        session_key: "latest",
        driver_number: [4, 81],
        filters: [{ field: "date", op: ">=", value: "2024-09-22" }],
      }).success
    ).toBe(true);
    expect(
      schema.safeParse({
        filters: [{ field: "unknown", op: ">=", value: "2024-09-22" }],
      }).success
    ).toBe(false);
  });

  it("maps non-ok responses to OpenF1Error", async () => {
    const openf1 = createOpenF1({
      fetch: async () => jsonResponse({ detail: "No results found." }, 404),
    });

    await expect(openf1.v1.position({ session_key: 1 })).rejects.toMatchObject({
      name: "OpenF1Error",
      status: 404,
      body: { detail: "No results found." },
    } satisfies Partial<OpenF1Error>);
  });
});
