import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createXaiProvider } from "../xai-provider";

describe("xAI realtime secrets integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  // POST /v1/realtime/client_secrets
  it("should create a realtime client secret", async () => {
    ctx = setupPolly("xai/realtime-client-secrets");
    const provider = createXaiProvider();
    const endpoint = provider.post.v1.realtime.clientSecrets;

    expect(endpoint).toBeDefined();
    expect(endpoint).toBeTypeOf("function");
    expect(
      endpoint.schema.safeParse({ expires_after: { seconds: 300 } })
    ).toHaveProperty("success", true);

    const result = await endpoint({
      model: "grok-2",
      voice: "echo",
    } as unknown as Parameters<typeof endpoint>[0]);

    expect(result.value).toMatch(/^xai-realtime-client-secret-/);
    expect(typeof result.expires_at).toBe("number");
    expect(result.expires_at).toBeGreaterThan(0);
  });
});
