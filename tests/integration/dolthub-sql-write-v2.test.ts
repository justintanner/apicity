import { afterEach, describe, expect, it } from "vitest";
import {
  createDoltHub,
  DoltHubError,
  DoltHubV2SqlWriteRequestSchema,
  type DoltHubOperationRef,
} from "@apicity/dolthub";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

const VALID_REQUEST = {
  owner: "dolthub",
  database: "ip-to-country",
  fromBranch: "main",
  toBranch: "feature/new-states",
  query: "INSERT INTO states (name, abbr) VALUES ('Puerto Rico', 'PR')",
};

describe("dolthub v2 sql write", () => {
  it("exposes the api.v2.databases.sql.write method with a schema", () => {
    const provider = createDoltHub();
    expect(provider.api.v2.databases.sql.write).toBeInstanceOf(Function);
    // The write sits beside the existing read in the shared `sql` namespace.
    expect(provider.api.v2.databases.sql.read).toBeInstanceOf(Function);
    // Bind the identity, not just presence: the MCP server derives this
    // endpoint's tool input JSON Schema from `.schema`, so attaching a
    // sibling's schema here would ship a wrong tool contract silently.
    expect(provider.api.v2.databases.sql.write.schema).toBe(
      DoltHubV2SqlWriteRequestSchema
    );
  });

  it("POSTs the write to the sql-writes path with exactly the documented body", async () => {
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
              id: "sql_write/abc",
              href: "https://www.dolthub.com/api/v2/operations/sql_write%2Fabc",
            },
            meta: {},
          }),
          { status: 202, headers: { "Content-Type": "application/json" } }
        );
      },
    });

    await provider.api.v2.databases.sql.write(VALID_REQUEST);

    expect(capturedUrl).toBe(
      "https://www.dolthub.com/api/v2/databases/dolthub/ip-to-country/sql-writes"
    );
    expect(capturedInit?.method).toBe("POST");

    // v2 uses Bearer auth (not v1alpha1's `token` scheme). The transport writes
    // a capital-C `Content-Type` key while it lowercases `authorization`, so
    // these assert what the code actually produces.
    const headers = (capturedInit?.headers as Record<string, string>) ?? {};
    expect(headers.authorization).toBe("Bearer dh_test_token");
    expect(headers["Content-Type"]).toBe("application/json");

    // The body is built from typed fields explicitly, so owner/database stay in
    // the path and the wire carries exactly the three snake_case keys.
    expect(JSON.parse(String(capturedInit?.body))).toEqual({
      from_branch: "main",
      to_branch: "feature/new-states",
      q: "INSERT INTO states (name, abbr) VALUES ('Puerto Rico', 'PR')",
    });
  });

  it("percent-encodes owner and database into single path segments", async () => {
    let capturedUrl = "";
    const provider = createDoltHub({
      fetch: async (url) => {
        capturedUrl = String(url);
        return new Response(
          JSON.stringify({
            data: { id: "op-1", href: "/api/v2/operations/op-1" },
            meta: {},
          }),
          { status: 202, headers: { "Content-Type": "application/json" } }
        );
      },
    });

    await provider.api.v2.databases.sql.write({
      ...VALID_REQUEST,
      owner: "weird/owner name",
      database: "odd db",
    });

    expect(capturedUrl).toBe(
      "https://www.dolthub.com/api/v2/databases/weird%2Fowner%20name/odd%20db/sql-writes"
    );
  });

  it("omits the Authorization header when no apiToken is set", async () => {
    let capturedHeaders: Record<string, string> = {};
    const provider = createDoltHub({
      fetch: async (_url, init) => {
        capturedHeaders = (init?.headers as Record<string, string>) ?? {};
        return new Response(
          JSON.stringify({
            data: { id: "op-1", href: "/api/v2/operations/op-1" },
            meta: {},
          }),
          { status: 202, headers: { "Content-Type": "application/json" } }
        );
      },
    });

    await provider.api.v2.databases.sql.write(VALID_REQUEST);

    expect(capturedHeaders.authorization).toBeUndefined();
  });

  it("unwraps the 202 envelope to the operation reference", async () => {
    const provider = createDoltHub({
      fetch: async () =>
        new Response(
          JSON.stringify({
            data: {
              id: "sql_write/abc",
              href: "https://www.dolthub.com/api/v2/operations/sql_write%2Fabc",
            },
            meta: {},
          }),
          { status: 202, headers: { "Content-Type": "application/json" } }
        ),
    });

    const result = await provider.api.v2.databases.sql.write(VALID_REQUEST);

    // A v2 SQL write is asynchronous, so the envelope's `data` is unwrapped
    // exactly like the sibling async `forks.create` — `meta` is dropped.
    expect(result).toEqual({
      id: "sql_write/abc",
      href: "https://www.dolthub.com/api/v2/operations/sql_write%2Fabc",
    });

    // Compile-time proof that the response type is an alias of the shared
    // operation reference rather than a restated `{ id, href }` shape.
    const ref: DoltHubOperationRef = result;
    expect(ref.id).toBe("sql_write/abc");
  });

  it("chains the returned id into api.v2.operations.get", async () => {
    const urls: string[] = [];
    const provider = createDoltHub({
      fetch: async (url) => {
        urls.push(String(url));
        if (urls.length === 1) {
          return new Response(
            JSON.stringify({
              data: {
                id: "sql_write/abc",
                href: "https://www.dolthub.com/api/v2/operations/sql_write%2Fabc",
              },
              meta: {},
            }),
            { status: 202, headers: { "Content-Type": "application/json" } }
          );
        }
        return new Response(
          JSON.stringify({
            data: {
              id: "sql_write/abc",
              type: "sql_write",
              status: "succeeded",
              created_at: "2026-07-21T00:00:00Z",
              cancelable: false,
              result: {
                commit_sha: "9f1c0a2b3d4e5f60718293a4b5c6d7e8f9a0b1c2",
              },
            },
            meta: {},
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      },
    });

    const ref = await provider.api.v2.databases.sql.write(VALID_REQUEST);
    const operation = await provider.api.v2.operations.get({ id: ref.id });

    // The id is opaque: it round-trips through `encodeURIComponent` verbatim,
    // is never parsed or reconstructed, and the poll URL is built from the id
    // rather than derived from `href`.
    expect(urls[1]).toBe(
      "https://www.dolthub.com/api/v2/operations/sql_write%2Fabc"
    );
    expect(operation.type).toBe("sql_write");
    expect(operation.status).toBe("succeeded");
    expect(operation.result?.commit_sha).toBe(
      "9f1c0a2b3d4e5f60718293a4b5c6d7e8f9a0b1c2"
    );
  });

  it("maps an RFC 9457 problem-details error onto DoltHubError", async () => {
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
            instance: "/api/v2/databases/dolthub/ip-to-country/sql-writes",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/problem+json" },
          }
        ),
    });

    try {
      await provider.api.v2.databases.sql.write(VALID_REQUEST);
    } catch (err) {
      capturedError = err;
    }

    expect(capturedError).toBeInstanceOf(DoltHubError);
    const err = capturedError as DoltHubError;
    expect(err.status).toBe(401);
    expect(err.code).toBe("UNAUTHENTICATED");
    expect(err.title).toBe("Unauthenticated");
    expect(err.detail).toBe(
      "Authentication credentials were missing or invalid."
    );
  });

  it("validates the request body via the exported zod schema", () => {
    expect(
      DoltHubV2SqlWriteRequestSchema.safeParse(VALID_REQUEST).success
    ).toBe(true);

    // All five fields are required by v2.
    for (const field of [
      "owner",
      "database",
      "fromBranch",
      "toBranch",
      "query",
    ] as const) {
      const missing: Record<string, string> = { ...VALID_REQUEST };
      delete missing[field];
      expect(DoltHubV2SqlWriteRequestSchema.safeParse(missing).success).toBe(
        false
      );

      // Every field is .min(1): present-but-empty is rejected, not just
      // missing.
      expect(
        DoltHubV2SqlWriteRequestSchema.safeParse({
          ...VALID_REQUEST,
          [field]: "",
        }).success
      ).toBe(false);
    }
  });
});

describe("dolthub v2 sql write integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("surfaces the live problem-details rejection for an unauthenticated write", async () => {
    ctx = setupPolly("dolthub/sql-write-v2-unauthenticated");
    // A SQL write is a real, non-idempotent mutation, so the committed
    // recording deliberately captures an UNAUTHENTICATED attempt: with no
    // apiToken the live v2 endpoint rejects the request before executing any
    // statement. That exercises the real v2 transport, the real URL, and the
    // problem-details -> DoltHubError mapping end-to-end without writing to a
    // database. The same reason the sibling fork-create, branch-create, and
    // database-create recordings are unauthenticated.
    const provider = createDoltHub();
    let capturedError: unknown;
    try {
      await provider.api.v2.databases.sql.write({
        owner: "dolthub",
        database: "ip-to-country",
        fromBranch: "main",
        toBranch: "apicity-probe",
        query: "INSERT INTO apicity_probe (id) VALUES (1)",
      });
    } catch (err) {
      capturedError = err;
    }

    expect(capturedError).toBeInstanceOf(DoltHubError);
    const err = capturedError as DoltHubError;
    expect(err.status).toBe(401);
    expect(err.code).toBe("UNAUTHENTICATED");
    expect(err.title).toBeTruthy();
  });
});
