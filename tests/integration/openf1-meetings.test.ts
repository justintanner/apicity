import { describe, expect, it } from "vitest";

import { createOpenF1, OpenF1Error } from "@apicity/openf1";
import type { OpenF1Meeting } from "@apicity/openf1";

interface FetchCall {
  url: string;
  init?: RequestInit;
}

const sampleMeeting: OpenF1Meeting = {
  circuit_key: 61,
  circuit_image: "https://example.test/circuit.png",
  circuit_info_url: "https://example.test/circuit",
  circuit_short_name: "Singapore",
  circuit_type: "Street Circuit",
  country_code: "SGP",
  country_flag: "https://example.test/sgp.svg",
  country_key: 157,
  country_name: "Singapore",
  date_end: "2024-09-22T14:00:00+00:00",
  date_start: "2024-09-20T09:30:00+00:00",
  gmt_offset: "08:00:00",
  is_cancelled: false,
  location: "Marina Bay",
  meeting_key: 1251,
  meeting_name: "Singapore Grand Prix",
  meeting_official_name:
    "FORMULA 1 SINGAPORE AIRLINES SINGAPORE GRAND PRIX 2024",
  year: 2024,
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
  body: unknown = [sampleMeeting],
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

describe("openf1 meetings", () => {
  it("serializes equality, repeated equality, comparison, and latest filters", async () => {
    const calls: FetchCall[] = [];
    const openf1 = createOpenF1({
      baseURL: "https://openf1.test/root/",
      fetch: createJsonFetch(calls),
    });

    await expect(
      openf1.v1.meetings({
        country_name: ["Singapore", "Monaco"],
        meeting_key: "latest",
        year: 2024,
        filters: [
          {
            field: "date_start",
            op: ">=",
            value: "2024-01-01T00:00:00Z",
          },
          {
            field: "date_end",
            op: "<",
            value: "2025-01-01T00:00:00Z",
          },
        ],
      })
    ).resolves.toEqual([sampleMeeting]);

    expect(calls).toHaveLength(1);
    expect(calls[0].init?.method).toBe("GET");
    const url = new URL(calls[0].url);
    expect(url.origin + url.pathname).toBe(
      "https://openf1.test/root/v1/meetings"
    );
    expect(url.searchParams.getAll("country_name")).toEqual([
      "Singapore",
      "Monaco",
    ]);
    expect(url.searchParams.get("meeting_key")).toBe("latest");
    expect(url.searchParams.get("year")).toBe("2024");
    expect(url.searchParams.get("date_start>=")).toBe("2024-01-01T00:00:00Z");
    expect(url.searchParams.get("date_end<")).toBe("2025-01-01T00:00:00Z");
  });

  it("returns typed CSV text when csv=true", async () => {
    const calls: FetchCall[] = [];
    const openf1 = createOpenF1({
      fetch: async (input, init) => {
        calls.push({ url: inputUrl(input), init });
        return new Response("meeting_key,year\n1251,2024\n", {
          headers: { "content-type": "text/csv" },
        });
      },
    });

    const result = await openf1.v1.meetings({ csv: true, year: 2024 });

    expect(result).toBe("meeting_key,year\n1251,2024\n");
    const url = new URL(calls[0].url);
    expect(url.searchParams.get("csv")).toBe("true");
    expect(url.searchParams.get("year")).toBe("2024");
  });

  it("preserves JSON and text error bodies on non-ok responses", async () => {
    const jsonOpenf1 = createOpenF1({
      fetch: createJsonFetch([], { detail: "No results found." }, 404),
    });

    await expect(jsonOpenf1.v1.meetings({ year: 1990 })).rejects.toMatchObject({
      name: "OpenF1Error",
      status: 404,
      body: { detail: "No results found." },
    } satisfies Partial<OpenF1Error>);

    const textOpenf1 = createOpenF1({
      fetch: async () => new Response("bad gateway", { status: 502 }),
    });

    await expect(textOpenf1.v1.meetings()).rejects.toMatchObject({
      name: "OpenF1Error",
      status: 502,
      body: "bad gateway",
    } satisfies Partial<OpenF1Error>);
  });

  it("wraps abort/timeout failures as OpenF1Error", async () => {
    const openf1 = createOpenF1({
      timeout: 1,
      fetch: async (_input, init) => {
        await new Promise<void>((_resolve, reject) => {
          init?.signal?.addEventListener(
            "abort",
            () => reject(new Error("aborted")),
            { once: true }
          );
        });
        return new Response("[]");
      },
    });

    await expect(openf1.v1.meetings()).rejects.toMatchObject({
      name: "OpenF1Error",
      status: 500,
    });
  });

  it("exposes schema metadata for meetings requests", () => {
    const openf1 = createOpenF1();

    expect(
      openf1.v1.meetings.schema.safeParse({
        country_name: ["Singapore", "Monaco"],
        filters: [{ field: "year", op: ">=", value: 2023 }],
      }).success
    ).toBe(true);
    expect(
      openf1.v1.meetings.schema.safeParse({
        filters: [{ field: "unknown", op: ">=", value: 2023 }],
      }).success
    ).toBe(false);
  });
});
