import { afterEach, describe, expect, it } from "vitest";
import {
  createDoltHub,
  DoltHubError,
  DoltHubV2PullCreateRequestSchema,
} from "@apicity/dolthub";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("dolthub v2 pull create", () => {
  it("exposes the api.v2.databases.pulls.create namespace with a schema", () => {
    const provider = createDoltHub();
    expect(provider.api.v2.databases.pulls).toBeDefined();
    expect(provider.api.v2.databases.pulls.create).toBeInstanceOf(Function);
    // Unlike the read-only `list`, the POST method carries a zod request schema,
    // attached via Object.assign and declared on the method type.
    // Bind the identity, not just presence: the MCP server derives this
    // endpoint's tool input JSON Schema from `.schema`, so attaching a
    // sibling's schema here would ship a wrong tool contract silently.
    const create = provider.api.v2.databases.pulls.create;
    expect(create.schema).toBe(DoltHubV2PullCreateRequestSchema);
  });

  it("POSTs the enveloped create request and preserves the pull envelope", async () => {
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
              pull_number: 3,
              title: "Add more rows",
              description: "Adds new rows to the table.",
              state: "open",
              from_branch: {
                database: { owner: "contributor", name: "ip-to-country" },
                branch_name: "feature-x",
              },
              to_branch: {
                database: { owner: "dolthub", name: "ip-to-country" },
                branch_name: "main",
              },
              created_at: "2024-01-15T12:34:56Z",
              creator: "contributor",
            },
            meta: {},
          }),
          { status: 201, headers: { "Content-Type": "application/json" } }
        );
      },
    });

    const result = await provider.api.v2.databases.pulls.create({
      owner: "dolthub",
      database: "ip-to-country",
      title: "Add more rows",
      description: "Adds new rows to the table.",
      from_branch: {
        database: { owner: "contributor", name: "ip-to-country" },
        branch_name: "feature-x",
      },
      to_branch: {
        database: { owner: "dolthub", name: "ip-to-country" },
        branch_name: "main",
      },
    });

    // v2 pull creation is synchronous: the created pull is returned inside the
    // `{ data, meta }` envelope (not unwrapped like the async fork/sql-write op).
    expect(result.data.pull_number).toBe(3);
    expect(result.data.from_branch).toEqual({
      database: { owner: "contributor", name: "ip-to-country" },
      branch_name: "feature-x",
    });
    expect(result.meta).toEqual({});

    // URL mirrors the upstream path segment-by-segment.
    expect(capturedUrl).toBe(
      "https://www.dolthub.com/api/v2/databases/dolthub/ip-to-country/pulls"
    );
    expect(capturedInit?.method).toBe("POST");

    // v2 uses Bearer auth (not v1alpha1's `token` scheme).
    const headers = (capturedInit?.headers as Record<string, string>) ?? {};
    expect(headers.authorization).toBe("Bearer dh_test_token");

    // Only body fields are sent; owner/database stay in the path. The body
    // carries exactly the documented snake_case keys and no path-only fields.
    expect(JSON.parse(String(capturedInit?.body))).toEqual({
      title: "Add more rows",
      description: "Adds new rows to the table.",
      from_branch: {
        database: { owner: "contributor", name: "ip-to-country" },
        branch_name: "feature-x",
      },
      to_branch: {
        database: { owner: "dolthub", name: "ip-to-country" },
        branch_name: "main",
      },
    });
  });

  it("omits description from the body when it is not supplied", async () => {
    let capturedInit: RequestInit | undefined;
    const provider = createDoltHub({
      fetch: async (_url, init) => {
        capturedInit = init;
        return new Response(
          JSON.stringify({
            data: {
              pull_number: 1,
              title: "No description",
              state: "open",
              from_branch: {
                database: { owner: "dolthub", name: "ip-to-country" },
                branch_name: "feature-x",
              },
              to_branch: {
                database: { owner: "dolthub", name: "ip-to-country" },
                branch_name: "main",
              },
              created_at: "2024-01-15T12:34:56Z",
              creator: "dolthub",
            },
            meta: {},
          }),
          { status: 201, headers: { "Content-Type": "application/json" } }
        );
      },
    });

    await provider.api.v2.databases.pulls.create({
      owner: "dolthub",
      database: "ip-to-country",
      title: "No description",
      from_branch: {
        database: { owner: "dolthub", name: "ip-to-country" },
        branch_name: "feature-x",
      },
      to_branch: {
        database: { owner: "dolthub", name: "ip-to-country" },
        branch_name: "main",
      },
    });

    const body = JSON.parse(String(capturedInit?.body)) as Record<
      string,
      unknown
    >;
    expect("description" in body).toBe(false);
  });

  it("url-encodes the owner and database path segments", async () => {
    let capturedUrl = "";
    const provider = createDoltHub({
      fetch: async (url) => {
        capturedUrl = String(url);
        return new Response(
          JSON.stringify({
            data: {
              pull_number: 1,
              title: "t",
              state: "open",
              from_branch: {
                database: { owner: "o", name: "n" },
                branch_name: "b",
              },
              to_branch: {
                database: { owner: "o", name: "n" },
                branch_name: "main",
              },
              created_at: "t",
              creator: "o",
            },
            meta: {},
          }),
          { status: 201, headers: { "Content-Type": "application/json" } }
        );
      },
    });

    await provider.api.v2.databases.pulls.create({
      owner: "dolt hub",
      database: "ip/to-country",
      title: "t",
      from_branch: {
        database: { owner: "o", name: "n" },
        branch_name: "b",
      },
      to_branch: {
        database: { owner: "o", name: "n" },
        branch_name: "main",
      },
    });

    const parsed = new URL(capturedUrl);
    expect(parsed.origin + parsed.pathname).toBe(
      "https://www.dolthub.com/api/v2/databases/dolt%20hub/ip%2Fto-country/pulls"
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
              pull_number: 1,
              title: "t",
              state: "open",
              from_branch: {
                database: { owner: "o", name: "n" },
                branch_name: "b",
              },
              to_branch: {
                database: { owner: "o", name: "n" },
                branch_name: "main",
              },
              created_at: "t",
              creator: "o",
            },
            meta: {},
          }),
          { status: 201, headers: { "Content-Type": "application/json" } }
        );
      },
    });

    await provider.api.v2.databases.pulls.create({
      owner: "dolthub",
      database: "ip-to-country",
      title: "t",
      from_branch: {
        database: { owner: "o", name: "n" },
        branch_name: "b",
      },
      to_branch: {
        database: { owner: "o", name: "n" },
        branch_name: "main",
      },
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
            instance: "/api/v2/databases/dolthub/ip-to-country/pulls",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/problem+json" },
          }
        ),
    });

    try {
      await provider.api.v2.databases.pulls.create({
        owner: "dolthub",
        database: "ip-to-country",
        title: "Add more rows",
        from_branch: {
          database: { owner: "dolthub", name: "ip-to-country" },
          branch_name: "feature-x",
        },
        to_branch: {
          database: { owner: "dolthub", name: "ip-to-country" },
          branch_name: "main",
        },
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
    // A complete create body — owner/database path segments plus the snake_case
    // body fields — parses successfully.
    expect(
      DoltHubV2PullCreateRequestSchema.safeParse({
        owner: "dolthub",
        database: "ip-to-country",
        title: "Add more rows",
        description: "Adds new rows.",
        from_branch: {
          database: { owner: "contributor", name: "ip-to-country" },
          branch_name: "feature-x",
        },
        to_branch: {
          database: { owner: "dolthub", name: "ip-to-country" },
          branch_name: "main",
        },
      }).success
    ).toBe(true);
    // description is optional.
    expect(
      DoltHubV2PullCreateRequestSchema.safeParse({
        owner: "dolthub",
        database: "ip-to-country",
        title: "Add more rows",
        from_branch: {
          database: { owner: "dolthub", name: "ip-to-country" },
          branch_name: "feature-x",
        },
        to_branch: {
          database: { owner: "dolthub", name: "ip-to-country" },
          branch_name: "main",
        },
      }).success
    ).toBe(true);
    // A branch reference missing branch_name is rejected.
    expect(
      DoltHubV2PullCreateRequestSchema.safeParse({
        owner: "dolthub",
        database: "ip-to-country",
        title: "Add more rows",
        from_branch: {
          database: { owner: "dolthub", name: "ip-to-country" },
        },
        to_branch: {
          database: { owner: "dolthub", name: "ip-to-country" },
          branch_name: "main",
        },
      }).success
    ).toBe(false);
    // title is required.
    expect(
      DoltHubV2PullCreateRequestSchema.safeParse({
        owner: "dolthub",
        database: "ip-to-country",
        from_branch: {
          database: { owner: "dolthub", name: "ip-to-country" },
          branch_name: "feature-x",
        },
        to_branch: {
          database: { owner: "dolthub", name: "ip-to-country" },
          branch_name: "main",
        },
      }).success
    ).toBe(false);
  });
});

describe("dolthub v2 pull create integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("surfaces the live 401 problem-details for an unauthenticated create", async () => {
    ctx = setupPolly("dolthub/pulls-create-unauthenticated");
    // No apiToken: the live v2 endpoint returns an RFC 9457 problem-details 401
    // without mutating anything (the rig has no DoltHub write credentials). This
    // exercises the real v2 transport + the problem-details -> DoltHubError
    // mapping end-to-end against DoltHub, exactly like the branch-create probe.
    const provider = createDoltHub();
    let capturedError: unknown;
    try {
      await provider.api.v2.databases.pulls.create({
        owner: "dolthub",
        database: "ip-to-country",
        title: "apicity-pull-probe",
        from_branch: {
          database: { owner: "dolthub", name: "ip-to-country" },
          branch_name: "apicity-branch-probe",
        },
        to_branch: {
          database: { owner: "dolthub", name: "ip-to-country" },
          branch_name: "main",
        },
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
