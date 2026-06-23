import { describe, expect, it } from "vitest";

import { createOpenF1, OpenF1Error } from "@apicity/openf1";
import type { OpenF1SessionResult } from "@apicity/openf1";

const sampleSessionResult: OpenF1SessionResult = {
  dnf: false,
  dns: false,
  dsq: false,
  driver_number: 1,
  duration: 77.565,
  gap_to_leader: 0,
  number_of_laps: 24,
  meeting_key: 1143,
  position: 1,
  session_key: 7782,
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function makeProvider(responseBody: unknown = [sampleSessionResult]) {
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

describe("openf1 session result", () => {
  it("builds the session_result route and OpenF1 filters", async () => {
    const { openf1, requests } = makeProvider();

    const result = await openf1.v1.sessionResult({
      session_key: "latest",
      driver_number: [1, 14],
      dsq: false,
      filters: [
        { field: "position", op: "<=", value: 3 },
        { field: "gap_to_leader", op: ">=", value: 0 },
      ],
    });

    expect(result).toEqual([sampleSessionResult]);
    expect(requests).toHaveLength(1);
    expect(requests[0].method).toBe("GET");

    const url = new URL(requests[0].url);
    expect(`${url.origin}${url.pathname}`).toBe(
      "https://openf1.test/root/v1/session_result"
    );
    expect(url.searchParams.get("session_key")).toBe("latest");
    expect(url.searchParams.getAll("driver_number")).toEqual(["1", "14"]);
    expect(url.searchParams.get("dsq")).toBe("false");
    expect(url.searchParams.get("position<=")).toBe("3");
    expect(url.searchParams.get("gap_to_leader>=")).toBe("0");
  });

  it("returns typed CSV text when csv=true", async () => {
    const requests: Array<{ url: string; method?: string }> = [];
    const openf1 = createOpenF1({
      fetch: async (input, init) => {
        requests.push({ url: String(input), method: init?.method });
        return new Response("driver_number,position\n1,1\n", {
          headers: { "content-type": "text/csv" },
        });
      },
    });

    const result = await openf1.v1.sessionResult({
      csv: true,
      session_key: 7782,
    });

    expect(result).toBe("driver_number,position\n1,1\n");
    const url = new URL(requests[0].url);
    expect(url.searchParams.get("csv")).toBe("true");
    expect(url.searchParams.get("session_key")).toBe("7782");
  });

  it("exposes request schema metadata", () => {
    const openf1 = createOpenF1();
    const schema = openf1.v1.sessionResult.schema;

    expect(
      schema.safeParse({
        meeting_key: "latest",
        session_key: "latest",
        driver_number: [1, 14],
        gap_to_leader: ["+1 LAP", 0.162],
        filters: [{ field: "position", op: "<=", value: 3 }],
      }).success
    ).toBe(true);
    expect(
      schema.safeParse({
        filters: [{ field: "unknown", op: "<=", value: 3 }],
      }).success
    ).toBe(false);
  });

  it("maps non-ok responses to OpenF1Error", async () => {
    const openf1 = createOpenF1({
      fetch: async () => jsonResponse({ detail: "No results found." }, 404),
    });

    await expect(
      openf1.v1.sessionResult({ session_key: 1 })
    ).rejects.toMatchObject({
      name: "OpenF1Error",
      status: 404,
      body: { detail: "No results found." },
    } satisfies Partial<OpenF1Error>);
  });
});
