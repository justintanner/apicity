import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { deepseek } from "@nakedapi/deepseek";

describe("deepseek models", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("deepseek/models-list");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should list available models", async () => {
    const provider = deepseek({
      apiKey: process.env.DEEPSEEK_API_KEY ?? "sk-test-key",
    });
    const result = await provider.v1.models.list();
    expect(result.object).toBe("list");
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0].object).toBe("model");
    expect(result.data[0].id).toBeTruthy();
  });
});
