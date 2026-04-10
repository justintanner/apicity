import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { alibaba } from "@nakedapi/alibaba";

describe("alibaba models list", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should list available models", async () => {
    ctx = setupPolly("alibaba/models-list");
    const provider = alibaba({
      apiKey: process.env.DASHSCOPE_API_KEY ?? "test-key",
    });

    const result = await provider.get.v1.models();

    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0].id).toBeTruthy();
  });
});
