import { describe, expect, it } from "vitest";

import { createOpenF1, OpenF1Error } from "@apicity/openf1";
import type { OpenF1ChampionshipTeam } from "@apicity/openf1";

interface FetchCall {
  url: string;
  init?: RequestInit;
}

const sampleChampionshipTeam: OpenF1ChampionshipTeam = {
  meeting_key: 1276,
  points_current: 833,
  points_start: 800,
  position_current: 1,
  position_start: 1,
  session_key: 9839,
  team_name: "McLaren",
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
  body: unknown = [sampleChampionshipTeam],
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

describe("openf1 championship teams", () => {
  it("serializes equality, repeated equality, comparison, and latest filters", async () => {
    const calls: FetchCall[] = [];
    const openf1 = createOpenF1({
      baseURL: "https://openf1.test/root/",
      fetch: createJsonFetch(calls),
    });

    await expect(
      openf1.v1.championshipTeams({
        session_key: "latest",
        team_name: ["McLaren", "Ferrari"],
        filters: [
          { field: "points_current", op: ">=", value: 400 },
          { field: "position_current", op: "<=", value: 3 },
        ],
      })
    ).resolves.toEqual([sampleChampionshipTeam]);

    expect(calls).toHaveLength(1);
    expect(calls[0].init?.method).toBe("GET");
    const url = new URL(calls[0].url);
    expect(url.origin + url.pathname).toBe(
      "https://openf1.test/root/v1/championship_teams"
    );
    expect(url.searchParams.get("session_key")).toBe("latest");
    expect(url.searchParams.getAll("team_name")).toEqual([
      "McLaren",
      "Ferrari",
    ]);
    expect(url.searchParams.get("points_current>=")).toBe("400");
    expect(url.searchParams.get("position_current<=")).toBe("3");
  });

  it("returns typed CSV text when csv=true", async () => {
    const calls: FetchCall[] = [];
    const openf1 = createOpenF1({
      fetch: async (input, init) => {
        calls.push({ url: inputUrl(input), init });
        return new Response("team_name,points_current\nMcLaren,833\n", {
          headers: { "content-type": "text/csv" },
        });
      },
    });

    const result = await openf1.v1.championshipTeams({
      csv: true,
      team_name: "McLaren",
    });

    expect(result).toBe("team_name,points_current\nMcLaren,833\n");
    const url = new URL(calls[0].url);
    expect(url.searchParams.get("csv")).toBe("true");
    expect(url.searchParams.get("team_name")).toBe("McLaren");
  });

  it("preserves OpenF1Error details on non-ok responses", async () => {
    const openf1 = createOpenF1({
      fetch: createJsonFetch([], { detail: "No results found." }, 404),
    });

    await expect(
      openf1.v1.championshipTeams({ team_name: "Unknown" })
    ).rejects.toMatchObject({
      name: "OpenF1Error",
      status: 404,
      body: { detail: "No results found." },
    } satisfies Partial<OpenF1Error>);
  });

  it("exposes schema metadata for championship team requests", () => {
    const openf1 = createOpenF1();

    expect(
      openf1.v1.championshipTeams.schema.safeParse({
        team_name: ["McLaren", "Ferrari"],
        filters: [{ field: "points_current", op: ">=", value: 400 }],
      }).success
    ).toBe(true);
    expect(
      openf1.v1.championshipTeams.schema.safeParse({
        filters: [{ field: "driver_number", op: "=", value: 4 }],
      }).success
    ).toBe(false);
  });
});
