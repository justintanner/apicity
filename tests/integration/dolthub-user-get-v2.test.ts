import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createDoltHub, DoltHubError } from "@apicity/dolthub";

describe("dolthub v2 user get", () => {
  it("should expose the api.v2 user namespace", () => {
    const provider = createDoltHub();
    expect(provider.api.v2.user).toBeDefined();
    expect(provider.api.v2.user.get).toBeInstanceOf(Function);
  });

  it("should carry no request schema (parameterless read endpoint)", () => {
    const provider = createDoltHub();
    // REQ-002: the read endpoint has no POST body and therefore no `.schema`.
    const get = provider.api.v2.user.get;
    expect((get as unknown as { schema?: unknown }).schema).toBeUndefined();
  });

  it("should issue a single Bearer GET to /api/v2/user and unwrap the envelope", async () => {
    // AC-1/AC-3: a single v2 GET with `Authorization: Bearer <token>`, no body,
    // resolving to the `{ data, meta }` envelope's unwrapped `data` payload.
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
              username: "taylor",
              display_name: "Taylor",
              bio: "database enthusiast",
              location: "SF",
              website_url: "https://example.com",
              profile_pic_url: "https://www.dolthub.com/avatars/taylor.png",
              email_addresses: [
                {
                  address: "taylor@example.com",
                  is_primary: true,
                  is_verified: true,
                },
              ],
            },
            meta: {},
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      },
    });

    const user = await provider.api.v2.user.get();

    // Envelope `data` is unwrapped into the typed user profile.
    expect(user.username).toBe("taylor");
    expect(user.display_name).toBe("Taylor");
    expect(user.email_addresses).toEqual([
      { address: "taylor@example.com", is_primary: true, is_verified: true },
    ]);

    // Parameterless GET to the v2 user path.
    expect(capturedUrl).toBe("https://www.dolthub.com/api/v2/user");
    expect(capturedInit?.method).toBe("GET");
    // GET has no request body.
    expect(capturedInit?.body).toBeUndefined();

    // v2 uses Bearer auth (not v1alpha1's `token` scheme).
    const headers = (capturedInit?.headers as Record<string, string>) ?? {};
    expect(headers.authorization).toBe("Bearer dh_test_token");
  });

  it("should omit the Authorization header when no apiToken is set", async () => {
    let capturedHeaders: Record<string, string> = {};
    const provider = createDoltHub({
      fetch: async (_url, init) => {
        capturedHeaders = (init?.headers as Record<string, string>) ?? {};
        return new Response(
          JSON.stringify({
            data: {
              username: "anon",
              display_name: "Anon",
              email_addresses: [],
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      },
    });

    await provider.api.v2.user.get();
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
            instance: "/api/v2/user",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/problem+json" },
          }
        ),
    });

    try {
      await provider.api.v2.user.get();
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

describe("dolthub v2 user get integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should surface the live 401 problem-details for an unauthenticated read", async () => {
    ctx = setupPolly("dolthub/user-get-v2-unauthenticated");
    // No apiToken: the live v2 current-user endpoint returns an RFC 9457
    // problem-details 401 without mutating anything. This exercises the real v2
    // transport + the problem-details -> DoltHubError mapping end-to-end against
    // DoltHub, on the GET /api/v2/user path.
    const provider = createDoltHub();
    let capturedError: unknown;
    try {
      await provider.api.v2.user.get();
    } catch (err) {
      capturedError = err;
    }
    expect(capturedError).toBeInstanceOf(DoltHubError);
    const err = capturedError as DoltHubError;
    expect(err.status).toBe(401);
    expect(err.code).toBe("UNAUTHENTICATED");
    expect(err.title).toBeTruthy();
    // REQ-002: the callable carries no request schema.
    const get = provider.api.v2.user.get;
    expect((get as unknown as { schema?: unknown }).schema).toBeUndefined();
  });
});
