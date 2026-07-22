import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createDoltHub, DoltHubError } from "@apicity/dolthub";

describe("dolthub v2 sql read", () => {
  it("should expose the api.v2.databases.sql namespace", () => {
    const provider = createDoltHub();
    expect(provider.api.v2.databases.sql).toBeDefined();
    expect(provider.api.v2.databases.sql.read).toBeInstanceOf(Function);
  });

  it("should carry no request schema (GET read endpoint)", () => {
    const provider = createDoltHub();
    // REQ-002: the v2 SQL read is a GET with query params, so it has no request
    // body and therefore no `.schema` (mirrors the v2 user-get read endpoint).
    const read = provider.api.v2.databases.sql.read;
    expect((read as unknown as { schema?: unknown }).schema).toBeUndefined();
  });

  it("should issue a single Bearer GET to the v2 sql path and unwrap the envelope", async () => {
    // AC-1/AC-3: a single v2 GET with `Authorization: Bearer <token>` and the
    // SQL passed as query params, resolving to the `{ data }` envelope's
    // unwrapped payload.
    let capturedUrl = "";
    let capturedInit: RequestInit | undefined;
    let callCount = 0;

    const provider = createDoltHub({
      apiToken: "dh_test_token",
      fetch: async (url, init) => {
        callCount++;
        capturedUrl = String(url);
        capturedInit = init;
        return new Response(
          JSON.stringify({
            data: {
              columns: [
                {
                  name: "state_name",
                  type: "VARCHAR(255)",
                  is_primary_key: true,
                  source_table: "jails",
                },
                {
                  name: "count",
                  type: "BIGINT",
                  is_primary_key: false,
                  source_table: "",
                },
              ],
              rows: [
                ["California", "162"],
                ["Texas", "108"],
                [null, "0"],
              ],
              status: "success",
              warnings: [],
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      },
    });

    const result = await provider.api.v2.databases.sql.read({
      owner: "dolthub",
      database: "ip-to-country",
      ref: "master",
      query: "SELECT state_name, COUNT(*) FROM jails GROUP BY state_name",
    });

    // Envelope `data` is unwrapped into the typed v2 SQL read response.
    expect(result.status).toBe("success");
    expect(result.columns).toHaveLength(2);
    expect(result.columns[0].name).toBe("state_name");
    expect(result.columns[0].is_primary_key).toBe(true);
    expect(result.columns[1].source_table).toBe("");
    // Rows are positional value arrays; each cell is a string or null.
    expect(result.rows).toHaveLength(3);
    expect(result.rows[0]).toEqual(["California", "162"]);
    expect(result.rows[2][0]).toBeNull();

    // Exactly one request, a GET to the mirrored v2 sql path.
    expect(callCount).toBe(1);
    const parsed = new URL(capturedUrl);
    expect(parsed.origin + parsed.pathname).toBe(
      "https://www.dolthub.com/api/v2/databases/dolthub/ip-to-country/sql"
    );
    // v2 passes the ref and the SQL as query params (not path segments).
    expect(parsed.searchParams.get("ref")).toBe("master");
    expect(parsed.searchParams.get("q")).toBe(
      "SELECT state_name, COUNT(*) FROM jails GROUP BY state_name"
    );
    expect(capturedInit?.method).toBe("GET");
    // GET has no request body.
    expect(capturedInit?.body).toBeUndefined();

    // v2 uses Bearer auth (not v1alpha1's `token` scheme).
    const headers = (capturedInit?.headers as Record<string, string>) ?? {};
    expect(headers.authorization).toBe("Bearer dh_test_token");
  });

  it("should omit the ref query param when no ref is provided", async () => {
    let capturedUrl = "";
    const provider = createDoltHub({
      fetch: async (url) => {
        capturedUrl = String(url);
        return new Response(
          JSON.stringify({
            data: { columns: [], rows: [], status: "success" },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      },
    });

    await provider.api.v2.databases.sql.read({
      owner: "dolthub",
      database: "ip-to-country",
      query: "SHOW TABLES",
    });

    const parsed = new URL(capturedUrl);
    // Optional `ref` is dropped from the query string when absent.
    expect(parsed.searchParams.has("ref")).toBe(false);
    expect(parsed.searchParams.get("q")).toBe("SHOW TABLES");
  });

  it("should omit the Authorization header when no apiToken is set", async () => {
    let capturedHeaders: Record<string, string> = {};
    const provider = createDoltHub({
      fetch: async (_url, init) => {
        capturedHeaders = (init?.headers as Record<string, string>) ?? {};
        return new Response(
          JSON.stringify({
            data: { columns: [], rows: [], status: "success" },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      },
    });

    await provider.api.v2.databases.sql.read({
      owner: "dolthub",
      database: "ip-to-country",
      query: "SHOW TABLES",
    });
    expect(capturedHeaders.authorization).toBeUndefined();
  });

  it("should map an RFC 9457 problem-details error onto DoltHubError", async () => {
    let capturedError: unknown;
    const provider = createDoltHub({
      fetch: async () =>
        new Response(
          JSON.stringify({
            type: "https://dolthub.com/docs/products/dolthub/api/v2/models/#model-errorcode",
            title: "Unauthenticated",
            status: 401,
            detail: "Authentication credentials were missing or invalid.",
            code: "UNAUTHENTICATED",
            request_id: "test-request-id",
            instance: "/api/v2/databases/dolthub/private-db/sql",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/problem+json" },
          }
        ),
    });

    try {
      await provider.api.v2.databases.sql.read({
        owner: "dolthub",
        database: "private-db",
        query: "SELECT 1",
      });
    } catch (err) {
      capturedError = err;
    }

    expect(capturedError).toBeInstanceOf(DoltHubError);
    const err = capturedError as DoltHubError;
    expect(err.status).toBe(401);
    expect(err.code).toBe("UNAUTHENTICATED");
    expect(err.title).toBe("Unauthenticated");
    expect(err.detail).toContain("credentials");
    expect(err.message).toContain("credentials");
  });
});

describe("dolthub v2 sql read integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should read tables from a public database over the v2 API", async () => {
    ctx = setupPolly("dolthub/sql-read-v2-show-tables");
    // REQ-001/REQ-007: a real v2 GET against a public database resolves to the
    // unwrapped `{ data }` payload — the v2 parity twin of v1alpha1.sql.read.
    // Public reads need no token, so this records deterministically with no
    // secrets (auth headers auto-redact if any were present).
    const provider = createDoltHub();
    const result = await provider.api.v2.databases.sql.read({
      owner: "dolthub",
      database: "ip-to-country",
      ref: "master",
      query: "SHOW TABLES",
    });
    expect(result.status).toBe("success");
    expect(result.columns.length).toBeGreaterThan(0);
    expect(result.rows.length).toBeGreaterThan(0);
    // Rows are positional arrays aligned to `columns`.
    expect(Array.isArray(result.rows[0])).toBe(true);
    // REQ-002: the callable carries no request schema.
    const read = provider.api.v2.databases.sql.read;
    expect((read as unknown as { schema?: unknown }).schema).toBeUndefined();
  });
});
