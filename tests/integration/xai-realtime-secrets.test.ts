import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { xai } from "@nakedapi/xai";

describe("xAI realtime client secrets integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("xai/realtime-client-secrets");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should create a realtime client secret", async () => {
    const provider = xai({
      apiKey: process.env.XAI_API_KEY ?? "xai-test-key",
    });
    const result = await provider.post.v1.realtime.clientSecrets({
      model: "grok-2",
      voice: "alloy",
    });
    expect(result.client_secret).toBeDefined();
    expect(result.client_secret.value).toBeTruthy();
    expect(result.client_secret.expires_at).toBeGreaterThan(0);
  });

  it("should create a realtime client secret with ephemeral key", async () => {
    const provider = xai({
      apiKey: process.env.XAI_API_KEY ?? "xai-test-key",
    });
    const result = await provider.post.v1.realtime.clientSecrets({
      model: "grok-2",
      voice: "echo",
    });
    expect(result.client_secret).toBeDefined();
    expect(result.client_secret.value).toBeTruthy();
  });
});
