import { describe, expect, it } from "vitest";

import { createOpenF1, OpenF1Error } from "@apicity/openf1";
import type { OpenF1CarData } from "@apicity/openf1";

interface FetchCall {
  url: string;
  init?: RequestInit;
}

const sampleCarData: OpenF1CarData = {
  brake: 0,
  date: "2023-09-15T13:08:19.923000+00:00",
  driver_number: 55,
  drs: 12,
  meeting_key: 1219,
  n_gear: 8,
  rpm: 11141,
  session_key: 9159,
  speed: 315,
  throttle: 99,
};

function inputUrl(input: string | URL | Request): string {
  if (typeof input === "string") {
    return input;
  }
  if (input instanceof URL) {
    return input.toString();
  }
  return input.url;
}

function createJsonFetch(
  calls: FetchCall[],
  body: unknown = [sampleCarData],
  status = 200
): typeof fetch {
  return async (input, init) => {
    calls.push({ url: inputUrl(input), init });
    return new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    });
  };
}

describe("openf1 car data", () => {
  it("serializes equality, repeated equality, comparison, and latest filters", async () => {
    const calls: FetchCall[] = [];
    const openf1 = createOpenF1({
      baseURL: "https://openf1.test/root/",
      fetch: createJsonFetch(calls),
    });

    await expect(
      openf1.v1.carData({
        driver_number: [55, 16],
        session_key: "latest",
        filters: [
          {
            field: "speed",
            op: ">=",
            value: 315,
          },
          {
            field: "date",
            op: "<",
            value: "2023-09-15T14:00:00+00:00",
          },
        ],
      })
    ).resolves.toEqual([sampleCarData]);

    expect(calls).toHaveLength(1);
    expect(calls[0].init?.method).toBe("GET");
    expect(new Headers(calls[0].init?.headers).has("Authorization")).toBe(
      false
    );
    const url = new URL(calls[0].url);
    expect(url.origin + url.pathname).toBe(
      "https://openf1.test/root/v1/car_data"
    );
    expect(url.searchParams.getAll("driver_number")).toEqual(["55", "16"]);
    expect(url.searchParams.get("session_key")).toBe("latest");
    expect(url.searchParams.get("speed>=")).toBe("315");
    expect(url.searchParams.get("date<")).toBe("2023-09-15T14:00:00+00:00");
  });

  it("returns typed CSV text when csv=true", async () => {
    const calls: FetchCall[] = [];
    const openf1 = createOpenF1({
      fetch: async (input, init) => {
        calls.push({ url: inputUrl(input), init });
        return new Response("driver_number,speed\n55,315\n", {
          headers: { "content-type": "text/csv" },
        });
      },
    });

    const result = await openf1.v1.carData({
      csv: true,
      session_key: 9159,
    });

    expect(result).toBe("driver_number,speed\n55,315\n");
    const url = new URL(calls[0].url);
    expect(url.searchParams.get("csv")).toBe("true");
    expect(url.searchParams.get("session_key")).toBe("9159");
  });

  it("preserves JSON error bodies on non-ok responses", async () => {
    const openf1 = createOpenF1({
      fetch: createJsonFetch([], { detail: "No results found." }, 404),
    });

    await expect(openf1.v1.carData({ session_key: 1 })).rejects.toMatchObject({
      name: "OpenF1Error",
      status: 404,
      body: { detail: "No results found." },
    } satisfies Partial<OpenF1Error>);
  });

  it("exposes schema metadata for car data requests", () => {
    const openf1 = createOpenF1();

    expect(
      openf1.v1.carData.schema.safeParse({
        brake: 0,
        date: "2023-09-15",
        driver_number: [55, 16],
        drs: 12,
        meeting_key: "latest",
        n_gear: 8,
        rpm: 11141,
        session_key: "latest",
        speed: 315,
        throttle: 99,
        filters: [{ field: "date", op: ">=", value: "2023-09-15" }],
      }).success
    ).toBe(true);
    expect(
      openf1.v1.carData.schema.safeParse({
        filters: [{ field: "unknown", op: ">=", value: 2023 }],
      }).success
    ).toBe(false);
  });
});
