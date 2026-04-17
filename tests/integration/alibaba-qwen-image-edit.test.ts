import { afterEach, describe, expect, it } from "vitest";
import { alibaba } from "@apicity/alibaba";
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

    const provider = alibaba({
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

  it("should validate multimodal-generation payload via .schema.safeParse", () => {
    const provider = alibaba({ apiKey: "test-key" });
    const schema =
      provider.post.api.v1.services.aigc.multimodalGeneration.generation.schema;

    const singleImage = schema.safeParse({
      model: "qwen-image-2.0-pro",
      input: {
        messages: [
          {
            role: "user",
            content: [
              { image: "https://example.com/a.png" },
              { text: "Make it sunset." },
            ],
          },
        ],
      },
      parameters: { n: 2, size: "1024*1536", watermark: false },
    });
    expect(singleImage.success).toBe(true);

    const threeImages = schema.safeParse({
      model: "qwen-image-edit-plus",
      input: {
        messages: [
          {
            role: "user",
            content: [
              { image: "https://example.com/a.png" },
              { image: "https://example.com/b.png" },
              { image: "https://example.com/c.png" },
              { text: "Combine scenes into one." },
            ],
          },
        ],
      },
    });
    expect(threeImages.success).toBe(true);

    const missingText = schema.safeParse({
      model: "qwen-image-2.0-pro",
      input: {
        messages: [
          {
            role: "user",
            content: [{ image: "https://example.com/a.png" }],
          },
        ],
      },
    });
    expect(missingText.success).toBe(false);

    const tooManyImages = schema.safeParse({
      model: "qwen-image-2.0-pro",
      input: {
        messages: [
          {
            role: "user",
            content: [
              { image: "https://example.com/a.png" },
              { image: "https://example.com/b.png" },
              { image: "https://example.com/c.png" },
              { image: "https://example.com/d.png" },
              { text: "Combine." },
            ],
          },
        ],
      },
    });
    expect(tooManyImages.success).toBe(false);

    const badModel = schema.safeParse({
      model: "unknown-model",
      input: {
        messages: [
          {
            role: "user",
            content: [{ image: "https://example.com/a.png" }, { text: "hi" }],
          },
        ],
      },
    });
    expect(badModel.success).toBe(false);

    const editWithN2 = schema.safeParse({
      model: "qwen-image-edit",
      input: {
        messages: [
          {
            role: "user",
            content: [{ image: "https://example.com/a.png" }, { text: "edit" }],
          },
        ],
      },
      parameters: { n: 2 },
    });
    expect(editWithN2.success).toBe(false);
  });
});
