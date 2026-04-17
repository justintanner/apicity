import { afterEach, describe, expect, it } from "vitest";
import { alibaba } from "@apicity/alibaba";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("alibaba qwen 2.0 text-to-image integration", () => {
  let ctx: PollyContext | undefined;

  afterEach(async () => {
    if (ctx) {
      await teardownPolly(ctx);
      ctx = undefined;
    }
  });

  it("should generate an image from text and return image URLs synchronously", async () => {
    ctx = setupPolly("alibaba/qwen-image-2-0-t2i");

    const provider = alibaba({
      apiKey: process.env.DASHSCOPE_API_KEY ?? "test-key",
    });

    const response =
      await provider.post.api.v1.services.aigc.multimodalGeneration.generation({
        model: "qwen-image-2.0-pro",
        input: {
          messages: [
            {
              role: "user",
              content: [
                {
                  text: "A sitting orange cat with a joyful expression, lively and adorable, highly realistic.",
                },
              ],
            },
          ],
        },
        parameters: {
          size: "1024*1024",
          n: 1,
          watermark: false,
          prompt_extend: true,
        },
      });

    expect(response.request_id).toBeTruthy();
    expect(response.output.choices.length).toBeGreaterThan(0);
    const content = response.output.choices[0].message.content;
    expect(content.length).toBe(1);
    expect(content[0].image).toMatch(/^https?:\/\//);
    expect(response.usage?.image_count).toBe(1);
  }, 300_000);

  it("should accept text-only content (no image parts) in schema", () => {
    const provider = alibaba({ apiKey: "test-key" });
    const schema =
      provider.post.api.v1.services.aigc.multimodalGeneration.generation.schema;

    const textOnly = schema.safeParse({
      model: "qwen-image-2.0-pro",
      input: {
        messages: [
          {
            role: "user",
            content: [{ text: "A lighthouse on a rocky coast at sunset." }],
          },
        ],
      },
      parameters: { size: "2048*2048", n: 2 },
    });
    expect(textOnly.success).toBe(true);

    const editModelWithoutImage = schema.safeParse({
      model: "qwen-image-edit",
      input: {
        messages: [
          {
            role: "user",
            content: [{ text: "Make it sunset." }],
          },
        ],
      },
    });
    expect(editModelWithoutImage.success).toBe(false);
  });
});
