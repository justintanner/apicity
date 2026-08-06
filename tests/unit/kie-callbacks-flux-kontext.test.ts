import { describe, it, expect } from "vitest";
import { FluxKontextCallbackPayloadSchema } from "../../packages/provider/kie/src/callbacks-flux-kontext";

describe("Flux Kontext callback payload (ac-gggaq8)", () => {
  it("parses documented success shape", () => {
    const result = FluxKontextCallbackPayloadSchema.safeParse({
      code: 200,
      msg: "BFL image generated successfully.",
      data: {
        taskId: "task12345",
        info: {
          originImageUrl: "https://example.com/original.jpg",
          resultImageUrl: "https://example.com/result.jpg",
        },
      },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.data.info?.resultImageUrl).toContain("result.jpg");
    }
  });

  it("parses documented failure shape", () => {
    const result = FluxKontextCallbackPayloadSchema.safeParse({
      code: 501,
      msg: "Image generation task failed",
      data: {
        taskId: "task12345",
        info: { originImageUrl: "", resultImageUrl: "" },
      },
    });
    expect(result.success).toBe(true);
  });
});
