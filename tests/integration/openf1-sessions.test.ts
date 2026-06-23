import { describe, expect, it } from "vitest";

import { createOpenF1, OpenF1Error } from "@apicity/openf1";
import type { OpenF1Session } from "@apicity/openf1";

const sampleSession: OpenF1Session = {
  circuit_key: 7,
  circuit_short_name: "Spa-Francorchamps",
  country_code: "BEL",
  country_key: 16,
  country_name: "Belgium",
  date_end: "2023-07-29T15:35:00+00:00",
  date_start: "2023-07-29T15:05:00+00:00",
  gmt_offset: "02:00:00",
  is_cancelled: false,
  location: "Spa-Francorchamps",
  meeting_key: 1216,
  session_key: 9140,
  session_name: "Sprint Qualifying",
  session_type: "Sprint Qualifying",
  year: 2023,
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function makeProvider(responseBody: unknown = [sampleSession]) {
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

describe("openf1 sessions", () => {
  it("builds the sessions route and OpenF1 filters", async () => {
    const { openf1, requests } = makeProvider();

    const result = await openf1.v1.sessions({
      country_name: ["Belgium", "Singapore"],
      session_key: "latest",
      session_name: "Sprint Qualifying",
      is_cancelled: false,
      filters: [
        { field: "date_start", op: ">=", value: "2023-07-01" },
        { field: "date_end", op: "<=", value: "2023-07-31" },
      ],
    });

    expect(result).toEqual([sampleSession]);
    expect(requests).toHaveLength(1);
    expect(requests[0].method).toBe("GET");

    const url = new URL(requests[0].url);
    expect(`${url.origin}${url.pathname}`).toBe(
      "https://openf1.test/root/v1/sessions"
    );
    expect(url.searchParams.getAll("country_name")).toEqual([
      "Belgium",
      "Singapore",
    ]);
    expect(url.searchParams.get("session_key")).toBe("latest");
    expect(url.searchParams.get("session_name")).toBe("Sprint Qualifying");
    expect(url.searchParams.get("is_cancelled")).toBe("false");
    expect(url.searchParams.get("date_start>=")).toBe("2023-07-01");
    expect(url.searchParams.get("date_end<=")).toBe("2023-07-31");
  });

  it("returns typed CSV text when csv=true", async () => {
    const requests: Array<{ url: string; method?: string }> = [];
    const openf1 = createOpenF1({
      fetch: async (input, init) => {
        requests.push({ url: String(input), method: init?.method });
        return new Response("session_key,session_name\n9140,Sprint\n", {
          headers: { "content-type": "text/csv" },
        });
      },
    });

    const result = await openf1.v1.sessions({
      csv: true,
      year: 2023,
    });

    expect(result).toBe("session_key,session_name\n9140,Sprint\n");
    const url = new URL(requests[0].url);
    expect(url.searchParams.get("csv")).toBe("true");
    expect(url.searchParams.get("year")).toBe("2023");
  });

  it("exposes request schema metadata", () => {
    const openf1 = createOpenF1();
    const schema = openf1.v1.sessions.schema;

    expect(
      schema.safeParse({
        meeting_key: "latest",
        session_key: "latest",
        country_name: ["Belgium", "Singapore"],
        filters: [{ field: "date_start", op: ">=", value: "2023-07-01" }],
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

    await expect(openf1.v1.sessions({ year: 1990 })).rejects.toMatchObject({
      name: "OpenF1Error",
      status: 404,
      body: { detail: "No results found." },
    } satisfies Partial<OpenF1Error>);
  });
});
