import { afterEach, describe, expect, it } from "vitest";
import {
  createDoltHub,
  DoltHubError,
  DoltHubV2BranchCreateRequestSchema,
} from "@apicity/dolthub";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("dolthub v2 branch create", () => {
  it("exposes the api.v2.databases.branches.create namespace with a schema", () => {
    const provider = createDoltHub();
    expect(provider.api.v2.databases.branches).toBeDefined();
    expect(provider.api.v2.databases.branches.create).toBeInstanceOf(Function);
    // Unlike the read-only `list`, the POST method carries a zod request schema.
    // `.schema` is attached via Object.assign; the declared method type omits it.
    const create = provider.api.v2.databases.branches.create;
    expect((create as unknown as { schema?: unknown }).schema).toBeDefined();
  });

  it("POSTs the enveloped create request and preserves the branch envelope", async () => {
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
              name: "feature-x",
              head_commit_sha: "vt1u8gdsovtj0qq2qmd6he7n5o4mq2qm",
              last_updated_at: "2024-01-15T12:34:56Z",
            },
            meta: {},
          }),
          { status: 201, headers: { "Content-Type": "application/json" } }
        );
      },
    });

    const result = await provider.api.v2.databases.branches.create({
      owner: "dolthub",
      database: "ip-to-country",
      name: "feature-x",
      from: { branch: "main" },
    });

    // v2 branch creation is synchronous: the created branch is returned inside
    // the `{ data, meta }` envelope (not unwrapped like the async fork op).
    expect(result.data).toEqual({
      name: "feature-x",
      head_commit_sha: "vt1u8gdsovtj0qq2qmd6he7n5o4mq2qm",
      last_updated_at: "2024-01-15T12:34:56Z",
    });
    expect(result.meta).toEqual({});

    // URL mirrors the upstream path segment-by-segment.
    expect(capturedUrl).toBe(
      "https://www.dolthub.com/api/v2/databases/dolthub/ip-to-country/branches"
    );
    expect(capturedInit?.method).toBe("POST");

    // v2 uses Bearer auth (not v1alpha1's `token` scheme).
    const headers = (capturedInit?.headers as Record<string, string>) ?? {};
    expect(headers.authorization).toBe("Bearer dh_test_token");

    // Only body fields are sent; owner/database stay in the path.
    expect(JSON.parse(String(capturedInit?.body))).toEqual({
      name: "feature-x",
      from: { branch: "main" },
    });
  });

  it("url-encodes the owner and database path segments", async () => {
    let capturedUrl = "";
    const provider = createDoltHub({
      fetch: async (url) => {
        capturedUrl = String(url);
        return new Response(
          JSON.stringify({
            data: {
              name: "b",
              head_commit_sha: "s",
              last_updated_at: "t",
            },
            meta: {},
          }),
          { status: 201, headers: { "Content-Type": "application/json" } }
        );
      },
    });

    await provider.api.v2.databases.branches.create({
      owner: "dolt hub",
      database: "ip/to-country",
      name: "b",
      from: { commit: "abc123" },
    });

    const parsed = new URL(capturedUrl);
    expect(parsed.origin + parsed.pathname).toBe(
      "https://www.dolthub.com/api/v2/databases/dolt%20hub/ip%2Fto-country/branches"
    );
  });

  it("omits the Authorization header when no apiToken is set", async () => {
    let capturedHeaders: Record<string, string> = {};
    const provider = createDoltHub({
      fetch: async (_url, init) => {
        capturedHeaders = (init?.headers as Record<string, string>) ?? {};
        return new Response(
          JSON.stringify({
            data: {
              name: "b",
              head_commit_sha: "s",
              last_updated_at: "t",
            },
            meta: {},
          }),
          { status: 201, headers: { "Content-Type": "application/json" } }
        );
      },
    });

    await provider.api.v2.databases.branches.create({
      owner: "dolthub",
      database: "ip-to-country",
      name: "b",
      from: { branch: "main" },
    });

    expect(capturedHeaders.authorization).toBeUndefined();
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
            instance: "/api/v2/databases/dolthub/ip-to-country/branches",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/problem+json" },
          }
        ),
    });

    try {
      await provider.api.v2.databases.branches.create({
        owner: "dolthub",
        database: "ip-to-country",
        name: "feature-x",
        from: { branch: "main" },
      });
    } catch (err) {
      capturedError = err;
    }

    expect(capturedError).toBeInstanceOf(DoltHubError);
    const err = capturedError as DoltHubError;
    expect(err.status).toBe(401);
    expect(err.code).toBe("UNAUTHENTICATED");
    expect(err.title).toBe("Unauthenticated");
    expect(err.detail).toContain("Authentication credentials");
  });

  it("validates the request body via the exported zod schema", () => {
    // The `from` field is a discriminated union: exactly one of branch/commit.
    expect(
      DoltHubV2BranchCreateRequestSchema.safeParse({
        owner: "dolthub",
        database: "ip-to-country",
        name: "feature-x",
        from: { branch: "main" },
      }).success
    ).toBe(true);
    expect(
      DoltHubV2BranchCreateRequestSchema.safeParse({
        owner: "dolthub",
        database: "ip-to-country",
        name: "feature-x",
        from: { commit: "vt1u8gdsovtj0qq2qmd6he7n5o4mq2qm" },
      }).success
    ).toBe(true);
    // A `from` object with neither branch nor commit is rejected.
    expect(
      DoltHubV2BranchCreateRequestSchema.safeParse({
        owner: "dolthub",
        database: "ip-to-country",
        name: "feature-x",
        from: { nonsense: "x" },
      }).success
    ).toBe(false);
  });
});

describe("dolthub v2 branch create integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("surfaces the live 401 problem-details for an unauthenticated create", async () => {
    ctx = setupPolly("dolthub/branch-create-unauthenticated");
    // No apiToken: the live v2 endpoint returns an RFC 9457 problem-details 401
    // without mutating anything. This exercises the real v2 transport + the
    // problem-details -> DoltHubError mapping end-to-end against DoltHub.
    const provider = createDoltHub();
    let capturedError: unknown;
    try {
      await provider.api.v2.databases.branches.create({
        owner: "dolthub",
        database: "ip-to-country",
        name: "apicity-branch-probe",
        from: { branch: "main" },
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
