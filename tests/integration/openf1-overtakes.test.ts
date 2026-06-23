import { describe, expect, it } from "vitest";

import { createOpenF1, OpenF1Error } from "@apicity/openf1";
import type { OpenF1Overtake } from "@apicity/openf1";

const sampleOvertake: OpenF1Overtake = {
  date: "2024-11-03T15:50:07.565000+00:00",
  meeting_key: 1249,
  overtaken_driver_number: 4,
  overtaking_driver_number: 63,
  position: 1,
  session_key: 9636,
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function createProvider(responseBody: unknown = [sampleOvertake]) {
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

describe("openf1 overtakes", () => {
  it("builds the overtakes route and OpenF1 filters", async () => {
    const { openf1, requests } = createProvider();

    const result = await openf1.v1.overtakes({
      session_key: "latest",
      overtaking_driver_number: 63,
      overtaken_driver_number: [4, 81],
      position: 1,
      filters: [{ field: "date", op: ">=", value: "2024-11-03T00:00:00Z" }],
    });

    expect(result).toEqual([sampleOvertake]);
    expect(requests).toHaveLength(1);
    expect(requests[0].method).toBe("GET");

    const url = new URL(requests[0].url);
    expect(`${url.origin}${url.pathname}`).toBe(
      "https://openf1.test/root/v1/overtakes"
    );
    expect(url.searchParams.get("session_key")).toBe("latest");
    expect(url.searchParams.get("overtaking_driver_number")).toBe("63");
    expect(url.searchParams.getAll("overtaken_driver_number")).toEqual([
      "4",
      "81",
    ]);
    expect(url.searchParams.get("position")).toBe("1");
    expect(url.searchParams.get("date>=")).toBe("2024-11-03T00:00:00Z");
  });

  it("returns typed CSV text when csv=true", async () => {
    const requests: Array<{ url: string; method?: string }> = [];
    const openf1 = createOpenF1({
      fetch: async (input, init) => {
        requests.push({ url: String(input), method: init?.method });
        return new Response("position,overtaking_driver_number\n1,63\n", {
          headers: { "content-type": "text/csv" },
        });
      },
    });

    const result = await openf1.v1.overtakes({
      csv: true,
      meeting_key: 1249,
    });

    expect(result).toBe("position,overtaking_driver_number\n1,63\n");
    const url = new URL(requests[0].url);
    expect(url.searchParams.get("csv")).toBe("true");
    expect(url.searchParams.get("meeting_key")).toBe("1249");
  });

  it("exposes request schema metadata", () => {
    const openf1 = createOpenF1();
    const schema = openf1.v1.overtakes.schema;

    expect(
      schema.safeParse({
        session_key: "latest",
        overtaken_driver_number: [4, 81],
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
      openf1.v1.overtakes({ session_key: 9636 })
    ).rejects.toMatchObject({
      name: "OpenF1Error",
      status: 404,
      body: { detail: "No results found." },
    } satisfies Partial<OpenF1Error>);
  });
});
