import { afterEach, describe, expect, it } from "vitest";
import { createAlibaba } from "@apicity/alibaba";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("alibaba qwen multimodal image editing integration", () => {
  let ctx: PollyContext | undefined;

  afterEach(async () => {
    if (ctx) {
      await teardownPolly(ctx);
      ctx = undefined;
    }
  });

  it("should edit a single image and return image URLs synchronously", async () => {
    ctx = setupPolly("alibaba/qwen-image-edit-single");

    const provider = createAlibaba({
      apiKey: process.env.DASHSCOPE_API_KEY ?? "test-key",
    });

    const response =
      await provider.post.api.v1.services.aigc.multimodalGeneration.generation({
        model: "qwen-image-edit",
        input: {
          messages: [
            {
              role: "user",
              content: [
                {
                  image:
                    "https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20250925/fpakfo/image36.webp",
                },
                { text: "Add a small red bird perched on the bicycle seat." },
              ],
            },
          ],
        },
      });

    expect(response.request_id).toBeTruthy();
    expect(response.output.choices.length).toBeGreaterThan(0);
    const content = response.output.choices[0].message.content;
    expect(content.length).toBeGreaterThan(0);
    for (const part of content) {
      expect(typeof part.image).toBe("string");
      expect(part.image).toMatch(/^https?:\/\//);
    }
  }, 300_000);
});
