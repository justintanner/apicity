import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createDoltHub, DoltHubError } from "@apicity/dolthub";

describe("dolthub v2 operations get", () => {
  it("should expose the api.v2 operations namespace", () => {
    const provider = createDoltHub();
    expect(provider.api.v2.operations).toBeDefined();
    expect(provider.api.v2.operations.get).toBeInstanceOf(Function);
  });

  it("should poll a fork's OperationRef through to a succeeded operation (AC-6)", async () => {
    // AC-6: the fork call returns a 202 OperationRef; passing its `id` to
    // api.v2.operations.get polls GET /api/v2/operations/{id} to completion.
    const operationId = "fork/dolthub/ip-to-country/abc123";
    let forkUrl = "";
    let pollUrl = "";
    let pollInit: RequestInit | undefined;

    const provider = createDoltHub({
      apiToken: "dh_test_token",
      fetch: async (url, init) => {
        const u = String(url);
        if (u.endsWith("/forks")) {
          forkUrl = u;
          return new Response(
            JSON.stringify({
              data: {
                id: operationId,
                href: `https://www.dolthub.com/api/v2/operations/${encodeURIComponent(operationId)}`,
              },
              meta: {},
            }),
            { status: 202, headers: { "Content-Type": "application/json" } }
          );
        }
        // The poll call.
        pollUrl = u;
        pollInit = init;
        return new Response(
          JSON.stringify({
            data: {
              id: operationId,
              type: "fork",
              status: "succeeded",
              created_at: "2026-07-11T04:00:00Z",
              cancelable: false,
              result: { database: { owner: "taylor", name: "ip-to-country" } },
            },
            meta: {},
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      },
    });

    const ref = await provider.api.v2.databases.forks.create({
      owner: "dolthub",
      database: "ip-to-country",
      newOwner: "taylor",
    });
    expect(ref.id).toBe(operationId);
    expect(forkUrl).toBe(
      "https://www.dolthub.com/api/v2/databases/dolthub/ip-to-country/forks"
    );

    const op = await provider.api.v2.operations.get({ id: ref.id });

    // Envelope `data` is unwrapped into a typed Operation.
    expect(op.status).toBe("succeeded");
    expect(op.type).toBe("fork");
    expect(op.cancelable).toBe(false);
    expect(op.result).toEqual({
      database: { owner: "taylor", name: "ip-to-country" },
    });

    // The opaque id (with slashes) is URL-encoded into a single path segment.
    expect(pollUrl).toBe(
      "https://www.dolthub.com/api/v2/operations/fork%2Fdolthub%2Fip-to-country%2Fabc123"
    );
    expect(pollInit?.method).toBe("GET");
    // GET has no request body.
    expect(pollInit?.body).toBeUndefined();

    // v2 uses Bearer auth (not v1alpha1's `token` scheme).
    const headers = (pollInit?.headers as Record<string, string>) ?? {};
    expect(headers.authorization).toBe("Bearer dh_test_token");
  });

  it("should surface a still-running operation without treating it as terminal", async () => {
    const provider = createDoltHub({
      fetch: async () =>
        new Response(
          JSON.stringify({
            data: {
              id: "op-123",
              type: "merge",
              status: "running",
              created_at: "2026-07-11T04:00:00Z",
              cancelable: false,
            },
            meta: {},
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        ),
    });

    const op = await provider.api.v2.operations.get({ id: "op-123" });
    expect(op.status).toBe("running");
    expect(op.result).toBeUndefined();
    expect(op.error).toBeUndefined();
  });

  it("should omit the Authorization header when no apiToken is set", async () => {
    let capturedHeaders: Record<string, string> = {};
    const provider = createDoltHub({
      fetch: async (_url, init) => {
        capturedHeaders = (init?.headers as Record<string, string>) ?? {};
        return new Response(
          JSON.stringify({
            data: {
              id: "op-123",
              type: "fork",
              status: "queued",
              created_at: "2026-07-11T04:00:00Z",
              cancelable: false,
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      },
    });

    await provider.api.v2.operations.get({ id: "op-123" });
    expect(capturedHeaders.authorization).toBeUndefined();
  });

  it("should map an RFC 9457 problem-details error onto DoltHubError", async () => {
    let capturedError: unknown;
    const provider = createDoltHub({
      apiToken: "dh_test_token",
      fetch: async () =>
        new Response(
          JSON.stringify({
            type: "https://dolthub.com/docs/products/dolthub/api/v2/models/#model-errorcode",
            title: "Not Found",
            status: 404,
            detail: "No operation with that id exists.",
            code: "NOT_FOUND",
            request_id: "test-request-id",
            instance: "/api/v2/operations/missing",
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/problem+json" },
          }
        ),
    });

    try {
      await provider.api.v2.operations.get({ id: "missing" });
    } catch (err) {
      capturedError = err;
    }

    expect(capturedError).toBeInstanceOf(DoltHubError);
    const err = capturedError as DoltHubError;
    expect(err.status).toBe(404);
    expect(err.code).toBe("NOT_FOUND");
    expect(err.title).toBe("Not Found");
    expect(err.detail).toContain("No operation");
    expect(err.message).toContain("No operation");
  });
});

describe("dolthub v2 operations get integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should surface the live 401 problem-details for an unauthenticated poll", async () => {
    ctx = setupPolly("dolthub/operations-get-unauthenticated");
    // No apiToken: the live v2 poll endpoint returns an RFC 9457 problem-details
    // 401 without mutating anything. This exercises the real v2 transport + the
    // problem-details -> DoltHubError mapping end-to-end against DoltHub, on the
    // GET /api/v2/operations/{id} path.
    const provider = createDoltHub();
    let capturedError: unknown;
    try {
      await provider.api.v2.operations.get({
        id: "fork/dolthub/ip-to-country/abc123",
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
