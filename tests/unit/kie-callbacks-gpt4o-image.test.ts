import { describe, it, expect } from "vitest";
import { Gpt4oImageCallbackPayloadSchema } from "../../packages/provider/kie/src/callbacks-gpt4o-image";

describe("4o Image callback payload (ac-j28j32)", () => {
  it("parses documented success shape", () => {
    const result = Gpt4oImageCallbackPayloadSchema.safeParse({
      code: 200,
      msg: "success",
      data: {
        taskId: "task12345",
        info: { result_urls: ["https://example.com/result/image1.png"] },
      },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.data.info?.result_urls).toHaveLength(1);
    }
  });

  it("parses documented failure with null info", () => {
    const result = Gpt4oImageCallbackPayloadSchema.safeParse({
      code: 400,
      msg: "Your content was flagged by OpenAI as violating content policies",
      data: { taskId: "task12345", info: null },
    });
    expect(result.success).toBe(true);
  });
});
