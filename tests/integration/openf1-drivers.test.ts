import { describe, expect, it } from "vitest";

import { createOpenF1, OpenF1Error } from "@apicity/openf1";
import type { OpenF1Driver } from "@apicity/openf1";

interface FetchCall {
  url: string;
  init?: RequestInit;
}

const sampleDriver: OpenF1Driver = {
  broadcast_name: "M VERSTAPPEN",
  country_code: "NED",
  driver_number: 1,
  first_name: "Max",
  full_name: "Max VERSTAPPEN",
  headshot_url: "https://example.test/max-verstappen.png",
  last_name: "Verstappen",
  meeting_key: 1219,
  name_acronym: "VER",
  session_key: 9158,
  team_colour: "3671C6",
  team_name: "Red Bull Racing",
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
  body: unknown = [sampleDriver],
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

describe("openf1 drivers", () => {
  it("serializes equality, repeated equality, comparison, and latest filters", async () => {
    const calls: FetchCall[] = [];
    const openf1 = createOpenF1({
      baseURL: "https://openf1.test/root/",
      fetch: createJsonFetch(calls),
    });

    await expect(
      openf1.v1.drivers({
        driver_number: [1, 11],
        session_key: "latest",
        team_name: "Red Bull Racing",
        filters: [
          {
            field: "meeting_key",
            op: ">=",
            value: 1219,
          },
          {
            field: "team_colour",
            op: "=",
            value: "3671C6",
          },
        ],
      })
    ).resolves.toEqual([sampleDriver]);

    expect(calls).toHaveLength(1);
    expect(calls[0].init?.method).toBe("GET");
    const url = new URL(calls[0].url);
    expect(url.origin + url.pathname).toBe(
      "https://openf1.test/root/v1/drivers"
    );
    expect(url.searchParams.getAll("driver_number")).toEqual(["1", "11"]);
    expect(url.searchParams.get("session_key")).toBe("latest");
    expect(url.searchParams.get("team_name")).toBe("Red Bull Racing");
    expect(url.searchParams.get("meeting_key>=")).toBe("1219");
    expect(url.searchParams.get("team_colour")).toBe("3671C6");
  });

  it("returns typed CSV text when csv=true", async () => {
    const calls: FetchCall[] = [];
    const openf1 = createOpenF1({
      fetch: async (input, init) => {
        calls.push({ url: inputUrl(input), init });
        return new Response("driver_number,session_key\n1,9158\n", {
          headers: { "content-type": "text/csv" },
        });
      },
    });

    const result = await openf1.v1.drivers({
      csv: true,
      driver_number: 1,
      session_key: 9158,
    });

    expect(result).toBe("driver_number,session_key\n1,9158\n");
    const url = new URL(calls[0].url);
    expect(url.searchParams.get("csv")).toBe("true");
    expect(url.searchParams.get("driver_number")).toBe("1");
    expect(url.searchParams.get("session_key")).toBe("9158");
  });

  it("preserves OpenF1Error metadata on non-ok responses", async () => {
    const openf1 = createOpenF1({
      fetch: createJsonFetch([], { detail: "No results found." }, 404),
    });

    await expect(
      openf1.v1.drivers({ driver_number: 999 })
    ).rejects.toMatchObject({
      name: "OpenF1Error",
      status: 404,
      body: { detail: "No results found." },
    } satisfies Partial<OpenF1Error>);
  });

  it("exposes schema metadata for drivers requests", () => {
    const openf1 = createOpenF1();

    expect(
      openf1.v1.drivers.schema.safeParse({
        driver_number: [1, 11],
        session_key: "latest",
        filters: [{ field: "meeting_key", op: ">=", value: 1219 }],
      }).success
    ).toBe(true);
    expect(
      openf1.v1.drivers.schema.safeParse({
        filters: [{ field: "unknown", op: ">=", value: 1219 }],
      }).success
    ).toBe(false);
  });
});
