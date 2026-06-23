import { describe, expect, it } from "vitest";

import { createOpenF1, OpenF1Error } from "@apicity/openf1";
import type { OpenF1TeamRadio } from "@apicity/openf1";

const sampleTeamRadio: OpenF1TeamRadio = {
  date: "2023-09-15T09:40:43.005000+00:00",
  driver_number: 11,
  meeting_key: 1219,
  recording_url:
    "https://livetiming.formula1.com/static/2023/TeamRadio/SERPER01.mp3",
  session_key: 9158,
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function makeProvider(responseBody: unknown = [sampleTeamRadio]) {
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

describe("openf1 team radio", () => {
  it("builds the team radio route and OpenF1 filters", async () => {
    const { openf1, requests } = makeProvider();

    const result = await openf1.v1.teamRadio({
      session_key: 9158,
      driver_number: [11, 44],
      recording_url: sampleTeamRadio.recording_url,
      filters: [
        { field: "date", op: ">=", value: "2023-09-15T09:00:00Z" },
        { field: "date", op: "<", value: "2023-09-15T11:00:00Z" },
      ],
    });

    expect(result).toEqual([sampleTeamRadio]);
    expect(requests).toHaveLength(1);
    expect(requests[0].method).toBe("GET");

    const url = new URL(requests[0].url);
    expect(`${url.origin}${url.pathname}`).toBe(
      "https://openf1.test/root/v1/team_radio"
    );
    expect(url.searchParams.get("session_key")).toBe("9158");
    expect(url.searchParams.getAll("driver_number")).toEqual(["11", "44"]);
    expect(url.searchParams.get("recording_url")).toBe(
      sampleTeamRadio.recording_url
    );
    expect(url.searchParams.get("date>=")).toBe("2023-09-15T09:00:00Z");
    expect(url.searchParams.get("date<")).toBe("2023-09-15T11:00:00Z");
  });

  it("returns typed CSV text when csv=true", async () => {
    const requests: Array<{ url: string; method?: string }> = [];
    const openf1 = createOpenF1({
      fetch: async (input, init) => {
        requests.push({ url: String(input), method: init?.method });
        return new Response("date,driver_number,recording_url\n2023,11,url\n", {
          headers: { "content-type": "text/csv" },
        });
      },
    });

    const result = await openf1.v1.teamRadio({
      csv: true,
      meeting_key: "latest",
    });

    expect(result).toBe("date,driver_number,recording_url\n2023,11,url\n");
    const url = new URL(requests[0].url);
    expect(url.searchParams.get("csv")).toBe("true");
    expect(url.searchParams.get("meeting_key")).toBe("latest");
  });

  it("exposes request schema metadata", () => {
    const openf1 = createOpenF1();
    const schema = openf1.v1.teamRadio.schema;

    expect(
      schema.safeParse({
        meeting_key: "latest",
        session_key: "latest",
        driver_number: [11, 44],
        filters: [{ field: "date", op: ">=", value: "2023-09-15" }],
      }).success
    ).toBe(true);
    expect(
      schema.safeParse({
        filters: [{ field: "unknown", op: ">=", value: "2023-09-15" }],
      }).success
    ).toBe(false);
  });

  it("maps non-ok responses to OpenF1Error", async () => {
    const openf1 = createOpenF1({
      fetch: async () => jsonResponse({ detail: "No results found." }, 404),
    });

    await expect(openf1.v1.teamRadio({ session_key: 1 })).rejects.toMatchObject(
      {
        name: "OpenF1Error",
        status: 404,
        body: { detail: "No results found." },
      } satisfies Partial<OpenF1Error>
    );
  });
});
