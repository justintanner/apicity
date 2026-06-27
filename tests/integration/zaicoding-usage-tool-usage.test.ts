import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createZaiCoding } from "@apicity/zaicoding";

describe("zaicoding usage tool-usage integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("zaicoding/usage-tool-usage");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should return tool usage data without throwing", async () => {
    const provider = createZaiCoding({
      apiKey: process.env.ZAI_CODING_PLAN_API_KEY ?? "test-api-key",
    });

    const result = await provider.get.api.monitor.usage.toolUsage();

    expect(result).toBeDefined();
    expect(typeof result).toBe("object");
  });
});
