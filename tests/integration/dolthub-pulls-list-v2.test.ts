import { afterEach, describe, expect, it } from "vitest";
import { createDoltHub, DoltHubError } from "@apicity/dolthub";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("dolthub v2 pulls list", () => {
  it("exposes the api.v2.databases.pulls.list namespace", () => {
    const provider = createDoltHub();
    expect(provider.api.v2.databases.pulls).toBeDefined();
    expect(provider.api.v2.databases.pulls.list).toBeInstanceOf(Function);
    // A GET carries no request body, so there is no zod `.schema` metadata to
    // attach (schema is POST-body metadata only, mirroring branches.list).
    const list = provider.api.v2.databases.pulls.list;
    expect((list as unknown as { schema?: unknown }).schema).toBeUndefined();
  });

  it("preserves the paginated envelope and serializes pageToken", async () => {
    let capturedUrl = "";
    let capturedInit: RequestInit | undefined;

    const provider = createDoltHub({
      apiToken: "dh_test_token",
      fetch: async (url, init) => {
        capturedUrl = String(url);
        capturedInit = init;
        return new Response(
          JSON.stringify({
            data: [
              {
                pull_number: 2,
                title: "Changes from workspace a611861",
                state: "open",
                created_at: "2023-10-04T17:03:15.000Z",
                creator: "tbantle",
              },
            ],
            meta: { next_page_token: "next-page" },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      },
    });

    const result = await provider.api.v2.databases.pulls.list({
      owner: "dolt hub",
      database: "ip/to-country",
      pageToken: "prior-page",
    });

    expect(result.data).toEqual([
      {
        pull_number: 2,
        title: "Changes from workspace a611861",
        state: "open",
        created_at: "2023-10-04T17:03:15.000Z",
        creator: "tbantle",
      },
    ]);
    expect(result.meta?.next_page_token).toBe("next-page");

    const parsed = new URL(capturedUrl);
    expect(parsed.origin + parsed.pathname).toBe(
      "https://www.dolthub.com/api/v2/databases/dolt%20hub/ip%2Fto-country/pulls"
    );
    expect(parsed.searchParams.get("page_token")).toBe("prior-page");
    expect(capturedInit?.method).toBe("GET");
    expect(capturedInit?.body).toBeUndefined();
    const headers = (capturedInit?.headers as Record<string, string>) ?? {};
    expect(headers.authorization).toBe("Bearer dh_test_token");
  });

  it("omits page_token when no pageToken is supplied", async () => {
    let capturedUrl = "";
    const provider = createDoltHub({
      fetch: async (url) => {
        capturedUrl = String(url);
        return new Response(JSON.stringify({ data: [], meta: {} }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    });

    await provider.api.v2.databases.pulls.list({
      owner: "dolthub",
      database: "ip-to-country",
    });

    expect(new URL(capturedUrl).searchParams.has("page_token")).toBe(false);
  });

  it("round-trips a server cursor across two pages and ends on a terminal page", async () => {
    // The cursor is chosen by the *server* on page one; the caller must echo it
    // back byte-for-byte as `page_token` on page two, and the final page must
    // omit `meta.next_page_token`. A live public database cannot reproduce this
    // shape (see the integration test below), so the two-page round-trip is
    // proven here with a deterministic, no-network fetch double. The cursor is
    // NOT fabricated into a recording: it originates from the fake page-one
    // response and is asserted to survive serialization unchanged.
    const PAGE_ONE_CURSOR = "eyJvIjoxMDAsInMiOiJtYWluIn0=";
    const requestQueries: string[] = [];

    const provider = createDoltHub({
      apiToken: "dh_test_token",
      fetch: async (url) => {
        const parsed = new URL(String(url));
        requestQueries.push(parsed.search);
        const token = parsed.searchParams.get("page_token");
        if (token === null) {
          // Page one: a full page that advertises a next cursor.
          return new Response(
            JSON.stringify({
              data: [
                {
                  pull_number: 2,
                  title: "Changes from workspace a611861",
                  state: "open",
                  created_at: "2023-10-04T17:03:15.000Z",
                  creator: "tbantle",
                },
                {
                  pull_number: 1,
                  title: "Changes from workspace 9d66cdd",
                  state: "open",
                  created_at: "2023-10-04T17:01:20.000Z",
                  creator: "tbantle",
                },
              ],
              meta: { next_page_token: PAGE_ONE_CURSOR },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
        // Page two: the terminal page — no further cursor.
        return new Response(
          JSON.stringify({
            data: [
              {
                pull_number: 0,
                title: "Initial import",
                description: "Seed the database from the source dump.",
                state: "merged",
                created_at: "2023-10-04T16:55:00.000Z",
                creator: "tbantle",
              },
            ],
            meta: {},
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      },
    });

    const pageOne = await provider.api.v2.databases.pulls.list({
      owner: "dolthub",
      database: "SHAQ",
    });
    // Response `meta.next_page_token` is preserved verbatim.
    expect(pageOne.meta?.next_page_token).toBe(PAGE_ONE_CURSOR);

    const pageTwo = await provider.api.v2.databases.pulls.list({
      owner: "dolthub",
      database: "SHAQ",
      pageToken: pageOne.meta?.next_page_token,
    });

    // Page one issued no cursor; page two carried the exact server cursor
    // byte-for-byte.
    expect(new URLSearchParams(requestQueries[0]).has("page_token")).toBe(
      false
    );
    expect(new URLSearchParams(requestQueries[1]).get("page_token")).toBe(
      PAGE_ONE_CURSOR
    );
    // Terminal page: the envelope is preserved and the cursor is gone.
    expect(pageTwo.data).toHaveLength(1);
    expect(pageTwo.data[0].description).toBe(
      "Seed the database from the source dump."
    );
    expect(pageTwo.meta?.next_page_token).toBeUndefined();
  });

  it("maps an RFC 9457 problem-details error to DoltHubError", async () => {
    // A real DoltHub v2 pulls 404 body (unknown repository). The shared v2
    // transport parses problem-details into DoltHubError; this asserts it on
    // the pulls path specifically.
    const provider = createDoltHub({
      apiToken: "dh_test_token",
      fetch: async () =>
        new Response(
          JSON.stringify({
            type: "https://dolthub.com/docs/products/dolthub/api/v2/models/#model-errorcode",
            title: "Not found",
            status: 404,
            detail: "no such repository",
            code: "NOT_FOUND",
            request_id: "d57d8a79-d473-469d-8b66-c693ab715463",
            instance: "/api/v2/databases/dolthub/does-not-exist-xyz/pulls",
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/problem+json" },
          }
        ),
    });

    let captured: unknown;
    try {
      await provider.api.v2.databases.pulls.list({
        owner: "dolthub",
        database: "does-not-exist-xyz",
      });
    } catch (error) {
      captured = error;
    }

    expect(captured).toBeInstanceOf(DoltHubError);
    const err = captured as DoltHubError;
    expect(err.status).toBe(404);
    expect(err.code).toBe("NOT_FOUND");
    expect(err.title).toBe("Not found");
    expect(err.detail).toContain("no such repository");
  });
});

describe("dolthub v2 pulls list integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("lists a public database's pull requests with its envelope intact", async () => {
    // `dolthub/SHAQ` is a public database with real pull requests, so an
    // unauthenticated read returns a populated `{ data }` envelope (the v2
    // pulls list allows public reads, exactly like branches.list). This is the
    // terminal (and only) page for this database, so the server omits `meta`.
    ctx = setupPolly("dolthub/pulls-list-v2");
    const provider = createDoltHub();
    const result = await provider.api.v2.databases.pulls.list({
      owner: "dolthub",
      database: "SHAQ",
    });

    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBeGreaterThan(0);
    for (const pull of result.data) {
      expect(typeof pull.pull_number).toBe("number");
      expect(typeof pull.title).toBe("string");
      expect(pull.title.length).toBeGreaterThan(0);
      expect(typeof pull.state).toBe("string");
      expect(typeof pull.created_at).toBe("string");
      expect(typeof pull.creator).toBe("string");
    }
    // The server omits `meta` at the end of the cursor sequence.
    expect(result.meta?.next_page_token).toBeUndefined();
  });
});
