import { afterEach, describe, expect, it } from "vitest";
import { createDoltHub, DoltHubError } from "@apicity/dolthub";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("dolthub v2 branches list", () => {
  it("exposes the api.v2.databases.branches.list namespace", () => {
    const provider = createDoltHub();
    expect(provider.api.v2.databases.branches).toBeDefined();
    expect(provider.api.v2.databases.branches.list).toBeInstanceOf(Function);
    expect(provider.api.v2.databases.branches.list.schema).toBeUndefined();
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
                name: "main",
                head_commit_sha: "vt1u8gdsovtj0qq2qmd6he7n5o4mq2qm",
                last_updated_at: "2024-01-15T12:34:56Z",
              },
            ],
            meta: { next_page_token: "next-page" },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      },
    });

    const result = await provider.api.v2.databases.branches.list({
      owner: "dolt hub",
      database: "ip/to-country",
      pageToken: "prior-page",
    });

    expect(result.data).toEqual([
      {
        name: "main",
        head_commit_sha: "vt1u8gdsovtj0qq2qmd6he7n5o4mq2qm",
        last_updated_at: "2024-01-15T12:34:56Z",
      },
    ]);
    expect(result.meta.next_page_token).toBe("next-page");

    const parsed = new URL(capturedUrl);
    expect(parsed.origin + parsed.pathname).toBe(
      "https://www.dolthub.com/api/v2/databases/dolt%20hub/ip%2Fto-country/branches"
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

    await provider.api.v2.databases.branches.list({
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
                  name: "main",
                  head_commit_sha: "u6qjmherm9lrp6henu8rr1efs8vjm7op",
                  last_updated_at: "2021-11-10T23:19:38.622Z",
                },
                {
                  name: "update-player",
                  head_commit_sha: "c5seedcgn87h5vad6kj0glmshkdf334b",
                  last_updated_at: "2023-10-05T22:25:06.496Z",
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
                name: "tbantle/workspace-whimsical-kitten",
                head_commit_sha: "lpciql40eh23r0n56n88pfa2gj5pbhri",
                last_updated_at: "2023-10-04T17:01:16.764Z",
              },
            ],
            meta: {},
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      },
    });

    const pageOne = await provider.api.v2.databases.branches.list({
      owner: "dolthub",
      database: "SHAQ",
    });
    // Response `meta.next_page_token` is preserved verbatim (REQ-009).
    expect(pageOne.meta?.next_page_token).toBe(PAGE_ONE_CURSOR);

    const pageTwo = await provider.api.v2.databases.branches.list({
      owner: "dolthub",
      database: "SHAQ",
      pageToken: pageOne.meta?.next_page_token,
    });

    // Page one issued no cursor; page two carried the exact server cursor
    // byte-for-byte (REQ-003/REQ-004/REQ-008).
    expect(new URLSearchParams(requestQueries[0]).has("page_token")).toBe(
      false
    );
    expect(new URLSearchParams(requestQueries[1]).get("page_token")).toBe(
      PAGE_ONE_CURSOR
    );
    // Terminal page: the envelope is preserved and the cursor is gone (REQ-011).
    expect(pageTwo.data).toHaveLength(1);
    expect(pageTwo.meta?.next_page_token).toBeUndefined();
  });

  it("maps an RFC 9457 problem-details error to DoltHubError", async () => {
    // A real DoltHub v2 branches 404 body (unknown repository). The shared v2
    // transport parses problem-details into DoltHubError (REQ-010); this asserts
    // it on the branches path specifically.
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
            instance: "/api/v2/databases/dolthub/does-not-exist-xyz/branches",
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/problem+json" },
          }
        ),
    });

    let captured: unknown;
    try {
      await provider.api.v2.databases.branches.list({
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

describe("dolthub v2 branches list integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("lists a public database's branches with its envelope intact", async () => {
    ctx = setupPolly("dolthub/branches-list-v2");
    const provider = createDoltHub();
    const result = await provider.api.v2.databases.branches.list({
      owner: "dolthub",
      database: "ip-to-country",
    });

    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0].name).toBeTruthy();
    // The server omits `meta` at the end of the cursor sequence.
    expect(result.meta?.next_page_token).toBeUndefined();
  });

  it("lists a multi-branch public database and preserves the terminal envelope", async () => {
    // `dolthub/SHAQ` is the branch-richest database currently served by the v2
    // REST branches endpoint (a live read-only probe across the public corpus
    // found no database whose first page returns a cursor — the endpoint's page
    // size exceeds every public database's branch count). This recording proves
    // the `{ data, meta }` envelope round-trips with real multi-branch data and
    // that a real terminal page omits `meta.next_page_token` (REQ-009/REQ-011).
    ctx = setupPolly("dolthub/branches-list-v2-pagination");
    const provider = createDoltHub();
    const result = await provider.api.v2.databases.branches.list({
      owner: "dolthub",
      database: "SHAQ",
    });

    expect(Array.isArray(result.data)).toBe(true);
    // More than one real branch distinguishes this from the single-branch
    // `ip-to-country` fixture and exercises the list envelope.
    expect(result.data.length).toBeGreaterThan(1);
    for (const branch of result.data) {
      expect(typeof branch.name).toBe("string");
      expect(branch.name.length).toBeGreaterThan(0);
      expect(typeof branch.head_commit_sha).toBe("string");
      expect(typeof branch.last_updated_at).toBe("string");
    }
    // This is the terminal (and only) page for this database: no next cursor.
    expect(result.meta?.next_page_token).toBeUndefined();
  });
});
