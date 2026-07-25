import { afterEach, describe, expect, it } from "vitest";
import {
  createDoltHub,
  DoltHubError,
  DoltHubV2PullMergeRequestSchema,
  type DoltHubOperationRef,
} from "@apicity/dolthub";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

const VALID_REQUEST = {
  owner: "dolthub",
  database: "ip-to-country",
  pullNumber: 1,
};

describe("dolthub v2 pulls merge", () => {
  it("exposes the api.v2.databases.pulls.merge method with a schema", () => {
    const provider = createDoltHub();
    expect(provider.api.v2.databases.pulls).toBeDefined();
    expect(provider.api.v2.databases.pulls.merge).toBeInstanceOf(Function);
    // The merge sits beside the existing list in the shared v2 `pulls`
    // namespace.
    expect(provider.api.v2.databases.pulls.list).toBeInstanceOf(Function);
    // Bind the identity, not just presence: the MCP server derives this
    // endpoint's tool input JSON Schema from `.schema`, so attaching a
    // sibling's schema here would ship a wrong tool contract silently.
    const merge = provider.api.v2.databases.pulls.merge;
    expect(merge.schema).toBe(DoltHubV2PullMergeRequestSchema);
  });

  it("POSTs to the merge path with an empty body and Bearer auth", async () => {
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
              id: "merge/abc",
              href: "https://www.dolthub.com/api/v2/operations/merge%2Fabc",
            },
            meta: {},
          }),
          { status: 202, headers: { "Content-Type": "application/json" } }
        );
      },
    });

    await provider.api.v2.databases.pulls.merge(VALID_REQUEST);

    expect(capturedUrl).toBe(
      "https://www.dolthub.com/api/v2/databases/dolthub/ip-to-country/pulls/1/merge"
    );
    expect(capturedInit?.method).toBe("POST");

    // v2 uses Bearer auth (not v1alpha1's `token` scheme).
    const headers = (capturedInit?.headers as Record<string, string>) ?? {};
    expect(headers.authorization).toBe("Bearer dh_test_token");

    // The v2 merge body is empty, exactly like v1alpha1's merge: `pull_number`
    // is a path segment, so nothing is serialized onto the wire and the
    // transport sets no Content-Type.
    expect(capturedInit?.body).toBeUndefined();
    expect(headers["Content-Type"]).toBeUndefined();
  });

  it("percent-encodes owner, database, and pull number into single path segments", async () => {
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

    await provider.api.v2.databases.pulls.merge({
      owner: "weird/owner name",
      database: "odd db",
      pullNumber: 42,
    });

    expect(capturedUrl).toBe(
      "https://www.dolthub.com/api/v2/databases/weird%2Fowner%20name/odd%20db/pulls/42/merge"
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

    await provider.api.v2.databases.pulls.merge(VALID_REQUEST);

    expect(capturedHeaders.authorization).toBeUndefined();
  });

  it("unwraps the 202 envelope to the operation reference", async () => {
    const provider = createDoltHub({
      fetch: async () =>
        new Response(
          JSON.stringify({
            data: {
              id: "merge/abc",
              href: "https://www.dolthub.com/api/v2/operations/merge%2Fabc",
            },
            meta: {},
          }),
          { status: 202, headers: { "Content-Type": "application/json" } }
        ),
    });

    const result = await provider.api.v2.databases.pulls.merge(VALID_REQUEST);

    // A v2 pull merge is asynchronous, so the envelope's `data` is unwrapped
    // exactly like the sibling async `sql.write` — `meta` is dropped.
    expect(result).toEqual({
      id: "merge/abc",
      href: "https://www.dolthub.com/api/v2/operations/merge%2Fabc",
    });

    // Compile-time proof that the response type is an alias of the shared
    // operation reference rather than a restated `{ id, href }` shape.
    const ref: DoltHubOperationRef = result;
    expect(ref.id).toBe("merge/abc");
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
                id: "merge/abc",
                href: "https://www.dolthub.com/api/v2/operations/merge%2Fabc",
              },
              meta: {},
            }),
            { status: 202, headers: { "Content-Type": "application/json" } }
          );
        }
        return new Response(
          JSON.stringify({
            data: {
              id: "merge/abc",
              type: "merge",
              status: "succeeded",
              created_at: "2026-07-24T00:00:00Z",
              cancelable: false,
              result: { pull_id: "1" },
            },
            meta: {},
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      },
    });

    const ref = await provider.api.v2.databases.pulls.merge(VALID_REQUEST);
    const operation = await provider.api.v2.operations.get({ id: ref.id });

    // The id is opaque: it round-trips through `encodeURIComponent` verbatim,
    // is never parsed or reconstructed, and the poll URL is built from the id
    // rather than derived from `href`.
    expect(urls[1]).toBe(
      "https://www.dolthub.com/api/v2/operations/merge%2Fabc"
    );
    expect(operation.type).toBe("merge");
    expect(operation.status).toBe("succeeded");
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
            instance: "/api/v2/databases/dolthub/ip-to-country/pulls/1/merge",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/problem+json" },
          }
        ),
    });

    try {
      await provider.api.v2.databases.pulls.merge(VALID_REQUEST);
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

  it("validates the request via the exported zod schema", () => {
    expect(
      DoltHubV2PullMergeRequestSchema.safeParse(VALID_REQUEST).success
    ).toBe(true);

    // owner/database are required non-empty strings.
    for (const field of ["owner", "database"] as const) {
      const missing: Record<string, unknown> = { ...VALID_REQUEST };
      delete missing[field];
      expect(DoltHubV2PullMergeRequestSchema.safeParse(missing).success).toBe(
        false
      );
      expect(
        DoltHubV2PullMergeRequestSchema.safeParse({
          ...VALID_REQUEST,
          [field]: "",
        }).success
      ).toBe(false);
    }

    // pullNumber must be a non-negative integer.
    expect(
      DoltHubV2PullMergeRequestSchema.safeParse({
        ...VALID_REQUEST,
        pullNumber: -1,
      }).success
    ).toBe(false);
    expect(
      DoltHubV2PullMergeRequestSchema.safeParse({
        ...VALID_REQUEST,
        pullNumber: 1.5,
      }).success
    ).toBe(false);
    const missingNumber: Record<string, unknown> = { ...VALID_REQUEST };
    delete missingNumber.pullNumber;
    expect(
      DoltHubV2PullMergeRequestSchema.safeParse(missingNumber).success
    ).toBe(false);
  });
});

describe("dolthub v2 pulls merge integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("surfaces the live problem-details rejection for an unauthenticated merge", async () => {
    ctx = setupPolly("dolthub/pulls-merge-v2");
    // A merge is a real, non-idempotent mutation, so the committed recording
    // deliberately captures an UNAUTHENTICATED attempt: with no apiToken the
    // live v2 endpoint rejects the request before merging anything. That
    // exercises the real v2 transport, the real URL, and the problem-details ->
    // DoltHubError mapping end-to-end without changing any database — the same
    // reason the sibling fork-create, sql-write, branch-create, and
    // database-create recordings are unauthenticated.
    const provider = createDoltHub();
    let capturedError: unknown;
    try {
      await provider.api.v2.databases.pulls.merge({
        owner: "dolthub",
        database: "ip-to-country",
        pullNumber: 1,
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
