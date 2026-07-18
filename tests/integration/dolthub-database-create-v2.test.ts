import { afterEach, describe, expect, it } from "vitest";
import {
  createDoltHub,
  DoltHubError,
  DoltHubV2DatabaseCreateRequestSchema,
} from "@apicity/dolthub";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

// NOTE ON PATH ENCODING: the sibling v2 endpoints (branches.create,
// forks.create) each carry a percent-encoding test because their URLs
// interpolate {owner}/{database} path parameters. `databases.create` resolves
// to the static collection root `/api/v2/databases` with NO path parameters —
// owner and name travel in the JSON body, where JSON.stringify handles
// escaping. There is therefore nothing to percent-encode here, and the absence
// of an encoding case is deliberate rather than an oversight.

describe("dolthub v2 database create", () => {
  it("exposes the api.v2.databases.create method with a schema", () => {
    const provider = createDoltHub();
    expect(provider.api.v2.databases.create).toBeInstanceOf(Function);
    // Bind the identity, not just presence: the MCP server derives this
    // endpoint's tool input JSON Schema from `.schema`, so attaching a
    // sibling's schema here would ship a wrong tool contract silently.
    expect(provider.api.v2.databases.create.schema).toBe(
      DoltHubV2DatabaseCreateRequestSchema
    );
  });

  it("POSTs the create request to the collection root and preserves the envelope", async () => {
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
              owner: "apicity",
              name: "probe-db",
              description: "Created by the apicity integration test",
              visibility: "private",
              fork_network_count: 1,
              star_count: 0,
              size_bytes: 0,
            },
            meta: {},
          }),
          { status: 201, headers: { "Content-Type": "application/json" } }
        );
      },
    });

    const result = await provider.api.v2.databases.create({
      owner: "apicity",
      name: "probe-db",
      visibility: "private",
      description: "Created by the apicity integration test",
    });

    // v2 database creation is synchronous: the created database comes back
    // inside the `{ data, meta }` envelope (not unwrapped to an async
    // operation reference like the fork endpoint).
    expect(result.data).toEqual({
      owner: "apicity",
      name: "probe-db",
      description: "Created by the apicity integration test",
      visibility: "private",
      fork_network_count: 1,
      star_count: 0,
      size_bytes: 0,
    });
    expect(result.meta).toEqual({});

    // Static collection root — owner/name are body fields, not path segments.
    expect(capturedUrl).toBe("https://www.dolthub.com/api/v2/databases");
    expect(capturedInit?.method).toBe("POST");

    // v2 uses Bearer auth (not v1alpha1's `token` scheme).
    const headers = (capturedInit?.headers as Record<string, string>) ?? {};
    expect(headers.authorization).toBe("Bearer dh_test_token");

    // The body is built from typed fields explicitly, so it carries exactly
    // the four documented keys and nothing else.
    expect(JSON.parse(String(capturedInit?.body))).toEqual({
      owner: "apicity",
      name: "probe-db",
      visibility: "private",
      description: "Created by the apicity integration test",
    });
  });

  it("omits the description key entirely when no description is given", async () => {
    let capturedInit: RequestInit | undefined;
    const provider = createDoltHub({
      apiToken: "dh_test_token",
      fetch: async (_url, init) => {
        capturedInit = init;
        return new Response(
          JSON.stringify({
            data: {
              owner: "apicity",
              name: "probe-db",
              visibility: "public",
              fork_network_count: 1,
              star_count: 0,
              size_bytes: 0,
            },
            meta: {},
          }),
          { status: 201, headers: { "Content-Type": "application/json" } }
        );
      },
    });

    await provider.api.v2.databases.create({
      owner: "apicity",
      name: "probe-db",
      visibility: "public",
    });

    const body = JSON.parse(String(capturedInit?.body));
    // Absent, not `null` — an omitted optional must not reach the wire at all.
    expect(body).toEqual({
      owner: "apicity",
      name: "probe-db",
      visibility: "public",
    });
    expect("description" in body).toBe(false);
  });

  it("omits the Authorization header when no apiToken is set", async () => {
    let capturedHeaders: Record<string, string> = {};
    const provider = createDoltHub({
      fetch: async (_url, init) => {
        capturedHeaders = (init?.headers as Record<string, string>) ?? {};
        return new Response(
          JSON.stringify({
            data: {
              owner: "apicity",
              name: "probe-db",
              visibility: "public",
              fork_network_count: 1,
              star_count: 0,
              size_bytes: 0,
            },
            meta: {},
          }),
          { status: 201, headers: { "Content-Type": "application/json" } }
        );
      },
    });

    await provider.api.v2.databases.create({
      owner: "apicity",
      name: "probe-db",
      visibility: "public",
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
            instance: "/api/v2/databases",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/problem+json" },
          }
        ),
    });

    try {
      await provider.api.v2.databases.create({
        owner: "apicity",
        name: "probe-db",
        visibility: "public",
      });
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
      DoltHubV2DatabaseCreateRequestSchema.safeParse({
        owner: "apicity",
        name: "probe-db",
        visibility: "private",
        description: "Created by the apicity integration test",
      }).success
    ).toBe(true);

    // owner, name, and visibility are all required by v2 (unlike the
    // all-optional v1alpha1 create body).
    expect(
      DoltHubV2DatabaseCreateRequestSchema.safeParse({
        name: "probe-db",
        visibility: "private",
      }).success
    ).toBe(false);
    expect(
      DoltHubV2DatabaseCreateRequestSchema.safeParse({
        owner: "apicity",
        visibility: "private",
      }).success
    ).toBe(false);
    expect(
      DoltHubV2DatabaseCreateRequestSchema.safeParse({
        owner: "apicity",
        name: "probe-db",
      }).success
    ).toBe(false);

    // owner and name are .min(1): present-but-empty is rejected, not just
    // missing.
    expect(
      DoltHubV2DatabaseCreateRequestSchema.safeParse({
        owner: "",
        name: "probe-db",
        visibility: "private",
      }).success
    ).toBe(false);
    expect(
      DoltHubV2DatabaseCreateRequestSchema.safeParse({
        owner: "apicity",
        name: "",
        visibility: "private",
      }).success
    ).toBe(false);

    // visibility is narrowed to the documented public/private union.
    expect(
      DoltHubV2DatabaseCreateRequestSchema.safeParse({
        owner: "apicity",
        name: "probe-db",
        visibility: "unlisted",
      }).success
    ).toBe(false);
  });
});

describe("dolthub v2 database create integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("surfaces the live problem-details rejection for an unauthenticated create", async () => {
    ctx = setupPolly("dolthub/database-create-unauthenticated");
    // Database creation is a real, non-idempotent mutation, so the committed
    // recording deliberately captures an UNAUTHENTICATED attempt: with no
    // apiToken the live v2 endpoint rejects the request before creating
    // anything. That exercises the real v2 transport and the problem-details
    // -> DoltHubError mapping end-to-end without leaving a database behind.
    const provider = createDoltHub();
    let capturedError: unknown;
    try {
      await provider.api.v2.databases.create({
        owner: "apicity",
        name: "apicity-database-probe",
        visibility: "private",
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
