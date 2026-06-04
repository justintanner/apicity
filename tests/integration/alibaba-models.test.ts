import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createAlibaba } from "@apicity/alibaba";

describe("alibaba models list", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should list available models", async () => {
    ctx = setupPolly("alibaba/models-list");
    const provider = createAlibaba({
      apiKey: process.env.DASHSCOPE_API_KEY ?? "test-key",
    });

    const result = await provider.get.compatibleMode.v1.models();

    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0].id).toBeTruthy();
  });
});
