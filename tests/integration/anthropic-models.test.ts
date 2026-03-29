import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { anthropic } from "@nakedapi/anthropic";

describe("anthropic models", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("anthropic/models");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should list models", async () => {
    const provider = anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-ant-test-key",
    });
    const result = await provider.v1.models.list({ limit: 5 });
    expect(result.data).toBeInstanceOf(Array);
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0].id).toBeTruthy();
    expect(result.data[0].type).toBe("model");
    expect(result.data[0].display_name).toBeTruthy();
  });

  it("should retrieve a model", async () => {
    const provider = anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-ant-test-key",
    });
    const result = await provider.v1.models.retrieve(
      "claude-sonnet-4-5-20250929"
    );
    expect(result.id).toBe("claude-sonnet-4-5-20250929");
    expect(result.type).toBe("model");
    expect(result.display_name).toBeTruthy();
    expect(result.max_tokens).toBeGreaterThan(0);
  });
});
