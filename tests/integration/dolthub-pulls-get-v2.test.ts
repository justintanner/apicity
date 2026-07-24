import { afterEach, describe, expect, it } from "vitest";
import { createDoltHub, DoltHubError } from "@apicity/dolthub";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("dolthub v2 pulls get", () => {
  it("exposes the api.v2.databases.pulls.get namespace", () => {
    const provider = createDoltHub();
    expect(provider.api.v2.databases.pulls).toBeDefined();
    expect(provider.api.v2.databases.pulls.get).toBeInstanceOf(Function);
    // A GET carries no request body, so there is no zod `.schema` metadata to
    // attach (schema is POST-body metadata only, mirroring pulls.list).
    const get = provider.api.v2.databases.pulls.get;
    expect((get as unknown as { schema?: unknown }).schema).toBeUndefined();
  });

  it("fetches one pull by number, preserving the fuller detail envelope", async () => {
    let capturedUrl = "";
    let capturedInit: RequestInit | undefined;

    const provider = createDoltHub({
      apiToken: "dh_test_token",
      fetch: async (url, init) => {
        capturedUrl = String(url);
        capturedInit = init;
        return new Response(
          JSON.stringify({
            data: {
              pull_number: 2,
              title: "Changes from workspace a611861",
              state: "open",
              from_branch: {
                database: { owner: "dolthub", name: "SHAQ" },
                branch_name: "tbantle/workspace-banking-rottweiler",
              },
              to_branch: {
                database: { owner: "dolthub", name: "SHAQ" },
                branch_name: "main",
              },
              created_at: "2023-10-04T17:03:15.000Z",
              creator: "tbantle",
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      },
    });

    const result = await provider.api.v2.databases.pulls.get({
      owner: "dolt hub",
      database: "ip/to-country",
      pull_number: 2,
    });

    // The single-pull `get` returns the fuller detail model with structured
    // from_branch / to_branch references, not the compact list summary.
    expect(result.data.pull_number).toBe(2);
    expect(result.data.title).toBe("Changes from workspace a611861");
    expect(result.data.state).toBe("open");
    expect(result.data.from_branch).toEqual({
      database: { owner: "dolthub", name: "SHAQ" },
      branch_name: "tbantle/workspace-banking-rottweiler",
    });
    expect(result.data.to_branch).toEqual({
      database: { owner: "dolthub", name: "SHAQ" },
      branch_name: "main",
    });
    expect(result.data.creator).toBe("tbantle");

    // Path segments — including pull_number — are percent-encoded.
    const parsed = new URL(capturedUrl);
    expect(parsed.origin + parsed.pathname).toBe(
      "https://www.dolthub.com/api/v2/databases/dolt%20hub/ip%2Fto-country/pulls/2"
    );
    // A GET carries no query string and no body.
    expect(parsed.search).toBe("");
    expect(capturedInit?.method).toBe("GET");
    expect(capturedInit?.body).toBeUndefined();
    const headers = (capturedInit?.headers as Record<string, string>) ?? {};
    expect(headers.authorization).toBe("Bearer dh_test_token");
  });

  it("maps an RFC 9457 problem-details error to DoltHubError", async () => {
    // A real DoltHub v2 pulls 404 body (unknown pull number). The shared v2
    // transport parses problem-details into DoltHubError; this asserts it on
    // the single-pull get path specifically.
    const provider = createDoltHub({
      apiToken: "dh_test_token",
      fetch: async () =>
        new Response(
          JSON.stringify({
            type: "https://dolthub.com/docs/products/dolthub/api/v2/models/#model-errorcode",
            title: "Not found",
            status: 404,
            detail: "no such pull request",
            code: "NOT_FOUND",
            request_id: "d57d8a79-d473-469d-8b66-c693ab715463",
            instance: "/api/v2/databases/dolthub/SHAQ/pulls/999999",
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/problem+json" },
          }
        ),
    });

    let captured: unknown;
    try {
      await provider.api.v2.databases.pulls.get({
        owner: "dolthub",
        database: "SHAQ",
        pull_number: 999999,
      });
    } catch (error) {
      captured = error;
    }

    expect(captured).toBeInstanceOf(DoltHubError);
    const err = captured as DoltHubError;
    expect(err.status).toBe(404);
    expect(err.code).toBe("NOT_FOUND");
    expect(err.title).toBe("Not found");
    expect(err.detail).toContain("no such pull request");
  });
});

describe("dolthub v2 pulls get integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("fetches a public database's single pull request with the detail envelope", async () => {
    // `dolthub/SHAQ` is a public database, so an unauthenticated read of pull
    // request #1 returns a populated `{ data }` envelope (v2 pulls.get allows
    // public reads, exactly like pulls.list). The single-pull payload is the
    // fuller detail model with structured from_branch / to_branch references.
    ctx = setupPolly("dolthub/pulls-get-v2");
    const provider = createDoltHub();
    const result = await provider.api.v2.databases.pulls.get({
      owner: "dolthub",
      database: "SHAQ",
      pull_number: 1,
    });

    expect(result.data.pull_number).toBe(1);
    expect(typeof result.data.title).toBe("string");
    expect(result.data.title.length).toBeGreaterThan(0);
    expect(typeof result.data.state).toBe("string");
    expect(typeof result.data.created_at).toBe("string");
    expect(typeof result.data.creator).toBe("string");
    // The fuller detail model carries structured branch references the compact
    // list summary omits.
    expect(typeof result.data.from_branch.branch_name).toBe("string");
    expect(typeof result.data.from_branch.database.owner).toBe("string");
    expect(typeof result.data.from_branch.database.name).toBe("string");
    expect(typeof result.data.to_branch.branch_name).toBe("string");
    expect(result.data.to_branch.database.owner).toBe("dolthub");
    expect(result.data.to_branch.database.name).toBe("SHAQ");
  });
});
