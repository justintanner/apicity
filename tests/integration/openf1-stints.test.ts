import { describe, expect, it } from "vitest";

import { createOpenF1, OpenF1Error } from "@apicity/openf1";
import type { OpenF1Stint } from "@apicity/openf1";

const sampleStint: OpenF1Stint = {
  compound: "SOFT",
  driver_number: 16,
  lap_end: 20,
  lap_start: 1,
  meeting_key: 1219,
  session_key: 9165,
  stint_number: 1,
  tyre_age_at_start: 3,
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function makeProvider(responseBody: unknown = [sampleStint]) {
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

describe("openf1 stints", () => {
  it("builds the stints route and OpenF1 filters", async () => {
    const { openf1, requests } = makeProvider();

    const result = await openf1.v1.stints({
      compound: "SOFT",
      driver_number: [16, 20],
      session_key: "latest",
      filters: [
        { field: "tyre_age_at_start", op: ">=", value: 3 },
        { field: "lap_end", op: "<=", value: 62 },
      ],
    });

    expect(result).toEqual([sampleStint]);
    expect(requests).toHaveLength(1);
    expect(requests[0].method).toBe("GET");

    const url = new URL(requests[0].url);
    expect(`${url.origin}${url.pathname}`).toBe(
      "https://openf1.test/root/v1/stints"
    );
    expect(url.searchParams.get("compound")).toBe("SOFT");
    expect(url.searchParams.getAll("driver_number")).toEqual(["16", "20"]);
    expect(url.searchParams.get("session_key")).toBe("latest");
    expect(url.searchParams.get("tyre_age_at_start>=")).toBe("3");
    expect(url.searchParams.get("lap_end<=")).toBe("62");
  });

  it("returns typed CSV text when csv=true", async () => {
    const requests: Array<{ url: string; method?: string }> = [];
    const openf1 = createOpenF1({
      fetch: async (input, init) => {
        requests.push({ url: String(input), method: init?.method });
        return new Response("compound,driver_number\nSOFT,16\n", {
          headers: { "content-type": "text/csv" },
        });
      },
    });

    const result = await openf1.v1.stints({
      csv: true,
      session_key: "latest",
    });

    expect(result).toBe("compound,driver_number\nSOFT,16\n");
    const url = new URL(requests[0].url);
    expect(url.searchParams.get("csv")).toBe("true");
    expect(url.searchParams.get("session_key")).toBe("latest");
  });

  it("exposes request schema metadata", () => {
    const openf1 = createOpenF1();
    const schema = openf1.v1.stints.schema;

    expect(
      schema.safeParse({
        meeting_key: "latest",
        session_key: "latest",
        driver_number: [16, 20],
        filters: [{ field: "tyre_age_at_start", op: ">=", value: 3 }],
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

    await expect(openf1.v1.stints({ session_key: 1 })).rejects.toMatchObject({
      name: "OpenF1Error",
      status: 404,
      body: { detail: "No results found." },
    } satisfies Partial<OpenF1Error>);
  });
});
