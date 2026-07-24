import { describe, it, expect } from "vitest";
import { createDoltHub, DoltHubError } from "@apicity/dolthub";

describe("dolthub provider structure", () => {
  it("should expose v1alpha1 namespace", () => {
    const provider = createDoltHub();
    expect(provider.v1alpha1).toBeDefined();
    expect(provider.v1alpha1.sql).toBeDefined();
    expect(provider.v1alpha1.sql.read).toBeInstanceOf(Function);
    expect(provider.v1alpha1.sql.write).toBeInstanceOf(Function);
    expect(provider.v1alpha1.sql.writePoll).toBeInstanceOf(Function);
    expect(provider.v1alpha1.database).toBeDefined();
    expect(provider.v1alpha1.database.create).toBeInstanceOf(Function);
    expect(provider.v1alpha1.branches).toBeDefined();
    expect(provider.v1alpha1.branches.list).toBeInstanceOf(Function);
    expect(provider.v1alpha1.branches.create).toBeInstanceOf(Function);
    expect(provider.v1alpha1.pulls).toBeDefined();
    expect(provider.v1alpha1.pulls.list).toBeInstanceOf(Function);
    expect(provider.v1alpha1.pulls.create).toBeInstanceOf(Function);
    expect(provider.v1alpha1.pulls.get).toBeInstanceOf(Function);
    expect(provider.v1alpha1.pulls.merge).toBeInstanceOf(Function);
    expect(provider.v1alpha1.user).toBeDefined();
    expect(provider.v1alpha1.user.get).toBeInstanceOf(Function);
  });

  it("should expose the api.v2 databases pulls namespace", () => {
    const provider = createDoltHub();
    expect(provider.api).toBeDefined();
    expect(provider.api.v2).toBeDefined();
    expect(provider.api.v2.databases).toBeDefined();
    expect(provider.api.v2.databases.pulls).toBeDefined();
    // The v2 pulls surface currently exposes the read-only `list` (GET, no
    // schema) and the mutating `create` (POST, with a zod `.schema`).
    expect(provider.api.v2.databases.pulls.list).toBeInstanceOf(Function);
    expect(provider.api.v2.databases.pulls.create).toBeInstanceOf(Function);
    expect(
      (provider.api.v2.databases.pulls.list as unknown as { schema?: unknown })
        .schema
    ).toBeUndefined();
    expect(
      (
        provider.api.v2.databases.pulls.create as unknown as {
          schema?: unknown;
        }
      ).schema
    ).toBeDefined();
  });

  it("should throw DoltHubError on HTTP error", async () => {
    const provider = createDoltHub({
      fetch: async () =>
        new Response(JSON.stringify({ message: "Not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }),
    });
    await expect(
      provider.v1alpha1.sql.read({
        owner: "test",
        database: "test",
        query: "SELECT 1",
      })
    ).rejects.toThrow(DoltHubError);
  });

  it("should pass apiToken in authorization header", async () => {
    let capturedHeaders: Record<string, string> = {};
    const provider = createDoltHub({
      apiToken: "test-token-123",
      fetch: async (_url, init) => {
        capturedHeaders = (init?.headers as Record<string, string>) ?? {};
        return new Response(
          JSON.stringify({
            query_execution_status: "Success",
            query_execution_message: "",
            repository_owner: "test",
            repository_name: "test",
            commit_ref: "main",
            sql_query: "SELECT 1",
            schema: [],
            rows: [],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      },
    });
    await provider.v1alpha1.sql.read({
      owner: "test",
      database: "test",
      query: "SELECT 1",
    });
    expect(capturedHeaders.authorization).toBe("token test-token-123");
  });
});
