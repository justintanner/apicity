import { describe, expect, it } from "vitest";

import { createOpenF1, OpenF1Error } from "@apicity/openf1";
import type { OpenF1Weather } from "@apicity/openf1";

const sampleWeather: OpenF1Weather = {
  air_temperature: 27.8,
  date: "2023-05-07T18:42:25.233000+00:00",
  humidity: 58,
  meeting_key: 1208,
  pressure: 1018.7,
  rainfall: 0,
  session_key: 9078,
  track_temperature: 52.5,
  wind_direction: 136,
  wind_speed: 2.4,
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function makeProvider(responseBody: unknown = [sampleWeather]) {
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

describe("openf1 weather", () => {
  it("builds the weather route and OpenF1 filters", async () => {
    const { openf1, requests } = makeProvider();

    const result = await openf1.v1.weather({
      meeting_key: 1208,
      session_key: "latest",
      rainfall: 0,
      filters: [
        { field: "wind_direction", op: ">=", value: 130 },
        { field: "track_temperature", op: ">=", value: 52 },
      ],
    });

    expect(result).toEqual([sampleWeather]);
    expect(requests).toHaveLength(1);
    expect(requests[0].method).toBe("GET");

    const url = new URL(requests[0].url);
    expect(`${url.origin}${url.pathname}`).toBe(
      "https://openf1.test/root/v1/weather"
    );
    expect(url.searchParams.get("meeting_key")).toBe("1208");
    expect(url.searchParams.get("session_key")).toBe("latest");
    expect(url.searchParams.get("rainfall")).toBe("0");
    expect(url.searchParams.get("wind_direction>=")).toBe("130");
    expect(url.searchParams.get("track_temperature>=")).toBe("52");
  });

  it("returns typed CSV text when csv=true", async () => {
    const requests: Array<{ url: string; method?: string }> = [];
    const openf1 = createOpenF1({
      fetch: async (input, init) => {
        requests.push({ url: String(input), method: init?.method });
        return new Response(
          "date,air_temperature,track_temperature\n2023-05-07,27.8,52.5\n",
          { headers: { "content-type": "text/csv" } }
        );
      },
    });

    const result = await openf1.v1.weather({
      csv: true,
      meeting_key: 1208,
    });

    expect(result).toBe(
      "date,air_temperature,track_temperature\n2023-05-07,27.8,52.5\n"
    );
    const url = new URL(requests[0].url);
    expect(url.searchParams.get("csv")).toBe("true");
    expect(url.searchParams.get("meeting_key")).toBe("1208");
  });

  it("exposes request schema metadata", () => {
    const openf1 = createOpenF1();
    const schema = openf1.v1.weather.schema;

    expect(
      schema.safeParse({
        meeting_key: "latest",
        session_key: "latest",
        rainfall: 0,
        filters: [{ field: "date", op: ">=", value: "2023-05-07" }],
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

    await expect(openf1.v1.weather({ session_key: 1 })).rejects.toMatchObject({
      name: "OpenF1Error",
      status: 404,
      body: { detail: "No results found." },
    } satisfies Partial<OpenF1Error>);
  });
});
