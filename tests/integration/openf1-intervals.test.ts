import { describe, expect, it } from "vitest";

import { createOpenF1, OpenF1Error } from "@apicity/openf1";
import type { OpenF1Interval } from "@apicity/openf1";

interface FetchCall {
  url: string;
  init?: RequestInit;
}

const sampleInterval: OpenF1Interval = {
  date: "2023-09-17T13:31:02.395000+00:00",
  driver_number: 1,
  gap_to_leader: 41.019,
  interval: 0.003,
  meeting_key: 1219,
  session_key: 9165,
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
  body: unknown = [sampleInterval],
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

describe("openf1 intervals", () => {
  it("serializes interval filters and returns interval records", async () => {
    const calls: FetchCall[] = [];
    const openf1 = createOpenF1({
      baseURL: "https://openf1.test/root/",
      fetch: createJsonFetch(calls),
    });

    await expect(
      openf1.v1.intervals({
        driver_number: [1, 16],
        meeting_key: "latest",
        session_key: 9165,
        filters: [
          {
            field: "interval",
            op: ">",
            value: 0,
          },
          {
            field: "interval",
            op: "<",
            value: 0.005,
          },
        ],
      })
    ).resolves.toEqual([sampleInterval]);

    expect(calls).toHaveLength(1);
    expect(calls[0].init?.method).toBe("GET");
    const url = new URL(calls[0].url);
    expect(url.origin + url.pathname).toBe(
      "https://openf1.test/root/v1/intervals"
    );
    expect(url.searchParams.getAll("driver_number")).toEqual(["1", "16"]);
    expect(url.searchParams.get("meeting_key")).toBe("latest");
    expect(url.searchParams.get("session_key")).toBe("9165");
    expect(url.searchParams.get("interval>")).toBe("0");
    expect(url.searchParams.get("interval<")).toBe("0.005");
  });

  it("preserves lapped and race-leader interval values", async () => {
    const lappedInterval: OpenF1Interval = {
      ...sampleInterval,
      gap_to_leader: "+1 LAP",
      interval: null,
    };
    const openf1 = createOpenF1({
      fetch: createJsonFetch([], [lappedInterval]),
    });

    await expect(openf1.v1.intervals()).resolves.toEqual([lappedInterval]);
  });

  it("maps non-ok responses to OpenF1Error", async () => {
    const openf1 = createOpenF1({
      fetch: createJsonFetch([], { detail: "No results found." }, 404),
    });

    await expect(openf1.v1.intervals({ session_key: 1 })).rejects.toMatchObject(
      {
        name: "OpenF1Error",
        status: 404,
        body: { detail: "No results found." },
      } satisfies Partial<OpenF1Error>
    );
  });

  it("exposes schema metadata for intervals requests", () => {
    const openf1 = createOpenF1();

    expect(
      openf1.v1.intervals.schema.safeParse({
        session_key: "latest",
        filters: [{ field: "interval", op: "<", value: 0.005 }],
      }).success
    ).toBe(true);
    expect(
      openf1.v1.intervals.schema.safeParse({
        filters: [{ field: "unknown", op: "<", value: 0.005 }],
      }).success
    ).toBe(false);
  });
});
