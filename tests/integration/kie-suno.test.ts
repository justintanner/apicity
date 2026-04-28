import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { kie } from "@apicity/kie";

describe("kie suno music generation integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should submit a music generation request via Suno", async () => {
    ctx = setupPolly("kie/suno-generate-vocal");
    const provider = kie({
      apiKey: process.env.KIE_API_KEY ?? "test-key",
    });

    // Use the Suno sub-provider endpoint
    const result = await provider.suno.post.api.v1.generate({
      prompt: "A cheerful indie pop song about summer adventures",
      model: "V5",
      instrumental: false,
      customMode: false,
    });

    // API may return error code if model unavailable, but should have well-formed response
    expect(result).toBeDefined();
    expect(typeof result.code).toBe("number");

    // If successful, verify taskId structure
    if (result.data?.taskId) {
      expect(typeof result.data.taskId).toBe("string");
    }
  });

  it("should support instrumental music generation", async () => {
    ctx = setupPolly("kie/suno-generate-instrumental");
    const provider = kie({
      apiKey: process.env.KIE_API_KEY ?? "test-key",
    });

    const result = await provider.suno.post.api.v1.generate({
      prompt: "An ambient soundscape for meditation and relaxation",
      model: "V5",
      instrumental: true,
      customMode: false,
    });

    expect(result).toBeDefined();
    expect(typeof result.code).toBe("number");
  });

  it("rejects sunoGenerate payload missing required fields", async () => {
    const provider = kie({
      apiKey: process.env.KIE_API_KEY ?? "test-key",
    });

    const invalidResult = provider.suno.post.api.v1.generate.schema.safeParse({
      prompt: "Missing required fields",
    });
    expect(invalidResult.success).toBe(false);
    expect(
      invalidResult.error?.issues.some((i) => i.path.includes("model"))
    ).toBe(true);
    expect(
      invalidResult.error?.issues.some((i) => i.path.includes("instrumental"))
    ).toBe(true);
    expect(
      invalidResult.error?.issues.some((i) => i.path.includes("customMode"))
    ).toBe(true);
  });
});
