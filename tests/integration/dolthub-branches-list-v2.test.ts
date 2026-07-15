import { afterEach, describe, expect, it } from "vitest";
import { createDoltHub } from "@apicity/dolthub";
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
});
