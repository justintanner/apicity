import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createDoltHub, DoltHubError } from "@apicity/dolthub";

describe("dolthub v2 fork create", () => {
  it("should expose the api.v2 forks namespace", () => {
    const provider = createDoltHub();
    expect(provider.api).toBeDefined();
    expect(provider.api.v2).toBeDefined();
    expect(provider.api.v2.databases).toBeDefined();
    expect(provider.api.v2.databases.forks).toBeDefined();
    expect(provider.api.v2.databases.forks.create).toBeInstanceOf(Function);
  });

  it("should POST an enveloped fork request and unwrap the OperationRef", async () => {
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
              id: "fork/dolthub/ip-to-country/abc123",
              href: "https://www.dolthub.com/api/v2/operations/fork%2Fdolthub%2Fip-to-country%2Fabc123",
            },
            meta: {},
          }),
          { status: 202, headers: { "Content-Type": "application/json" } }
        );
      },
    });

    const result = await provider.api.v2.databases.forks.create({
      owner: "dolthub",
      database: "ip-to-country",
      newOwner: "taylor",
    });

    // Envelope `data` is unwrapped into a typed OperationRef.
    expect(result.id).toBe("fork/dolthub/ip-to-country/abc123");
    expect(result.href).toContain("/api/v2/operations/");

    // URL mirrors the upstream path segment-by-segment.
    expect(capturedUrl).toBe(
      "https://www.dolthub.com/api/v2/databases/dolthub/ip-to-country/forks"
    );
    expect(capturedInit?.method).toBe("POST");

    // v2 uses Bearer auth (not v1alpha1's `token` scheme).
    const headers = (capturedInit?.headers as Record<string, string>) ?? {};
    expect(headers.authorization).toBe("Bearer dh_test_token");

    // Only the target owner is sent in the body; source owner/database are path.
    expect(JSON.parse(String(capturedInit?.body))).toEqual({ owner: "taylor" });
  });

  it("should omit the Authorization header when no apiToken is set", async () => {
    let capturedHeaders: Record<string, string> = {};
    const provider = createDoltHub({
      fetch: async (_url, init) => {
        capturedHeaders = (init?.headers as Record<string, string>) ?? {};
        return new Response(
          JSON.stringify({ data: { id: "op", href: "https://x" } }),
          { status: 202, headers: { "Content-Type": "application/json" } }
        );
      },
    });

    await provider.api.v2.databases.forks.create({
      owner: "dolthub",
      database: "ip-to-country",
      newOwner: "taylor",
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
            instance: "/api/v2/databases/dolthub/ip-to-country/forks",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/problem+json" },
          }
        ),
    });

    try {
      await provider.api.v2.databases.forks.create({
        owner: "dolthub",
        database: "ip-to-country",
        newOwner: "taylor",
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
    expect(err.message).toContain("Authentication credentials");
  });
});

describe("dolthub v2 fork create integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should surface the live 401 problem-details for an unauthenticated fork", async () => {
    ctx = setupPolly("dolthub/fork-create-unauthenticated");
    // No apiToken: the live v2 endpoint returns an RFC 9457 problem-details 401
    // without mutating anything. This exercises the real v2 transport + the
    // problem-details -> DoltHubError mapping end-to-end against DoltHub.
    const provider = createDoltHub();
    let capturedError: unknown;
    try {
      await provider.api.v2.databases.forks.create({
        owner: "dolthub",
        database: "ip-to-country",
        newOwner: "apicity-fork-probe",
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
