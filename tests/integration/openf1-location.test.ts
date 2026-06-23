import { describe, expect, it } from "vitest";

import { createOpenF1, OpenF1Error } from "@apicity/openf1";
import type { OpenF1Location } from "@apicity/openf1";

const sampleLocation: OpenF1Location = {
  date: "2023-09-16T13:03:35.292000+00:00",
  driver_number: 81,
  meeting_key: 1219,
  session_key: 9161,
  x: 567,
  y: 3195,
  z: 187,
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("openf1 location", () => {
  it("builds the location route and OpenF1 filters", async () => {
    const requests: Array<{ url: string; method?: string }> = [];
    const openf1 = createOpenF1({
      baseURL: "https://openf1.test/root/",
      fetch: async (input, init) => {
        requests.push({
          url: String(input),
          method: init?.method,
        });
        return jsonResponse([sampleLocation]);
      },
    });

    const result = await openf1.v1.location({
      session_key: 9161,
      driver_number: [81, 1],
      x: 567,
      filters: [
        { field: "date", op: ">", value: "2023-09-16T13:03:35.200" },
        { field: "date", op: "<", value: "2023-09-16T13:03:35.800" },
        { field: "z", op: ">=", value: 180 },
      ],
    });

    expect(result).toEqual([sampleLocation]);
    expect(requests).toHaveLength(1);
    expect(requests[0].method).toBe("GET");

    const url = new URL(requests[0].url);
    expect(`${url.origin}${url.pathname}`).toBe(
      "https://openf1.test/root/v1/location"
    );
    expect(url.searchParams.get("session_key")).toBe("9161");
    expect(url.searchParams.getAll("driver_number")).toEqual(["81", "1"]);
    expect(url.searchParams.get("x")).toBe("567");
    expect(url.searchParams.get("date>")).toBe("2023-09-16T13:03:35.200");
    expect(url.searchParams.get("date<")).toBe("2023-09-16T13:03:35.800");
    expect(url.searchParams.get("z>=")).toBe("180");
  });

  it("returns typed CSV text when csv=true", async () => {
    const requests: Array<{ url: string; method?: string }> = [];
    const openf1 = createOpenF1({
      fetch: async (input, init) => {
        requests.push({ url: String(input), method: init?.method });
        return new Response("driver_number,x,y,z\n81,567,3195,187\n", {
          headers: { "content-type": "text/csv" },
        });
      },
    });

    const result = await openf1.v1.location({
      csv: true,
      meeting_key: "latest",
    });

    expect(result).toBe("driver_number,x,y,z\n81,567,3195,187\n");
    const url = new URL(requests[0].url);
    expect(url.searchParams.get("csv")).toBe("true");
    expect(url.searchParams.get("meeting_key")).toBe("latest");
  });

  it("exposes request schema metadata", () => {
    const openf1 = createOpenF1();
    const schema = openf1.v1.location.schema;

    expect(
      schema.safeParse({
        meeting_key: "latest",
        session_key: 9161,
        driver_number: [81, 1],
        filters: [{ field: "date", op: ">=", value: "2023-09-16" }],
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

    await expect(openf1.v1.location({ session_key: 1 })).rejects.toMatchObject({
      name: "OpenF1Error",
      status: 404,
      body: { detail: "No results found." },
    } satisfies Partial<OpenF1Error>);
  });
});
