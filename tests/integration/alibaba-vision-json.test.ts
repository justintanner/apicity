import { afterEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { alibaba } from "@apicity/alibaba";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("alibaba vision JSON integration", () => {
  let ctx: PollyContext | undefined;

  afterEach(async () => {
    if (ctx) {
      await teardownPolly(ctx);
      ctx = undefined;
    }
  });

  it("should validate multimodal chat content with image_url parts", () => {
    const provider = alibaba({ apiKey: "test-key" });
    const schema = provider.post.compatibleMode.v1.chat.completions.schema;

    const parsed = schema.safeParse({
      model: "qwen3.5-plus",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: "https://example.com/cat.jpg",
                detail: "low",
              },
            },
            {
              type: "text",
              text: "Analyze the subject pose and framing as JSON.",
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0,
      max_tokens: 300,
    });

    expect(parsed.success).toBe(true);
  });

  it("should analyze cat pose and framing as structured JSON", async () => {
    ctx = setupPolly("alibaba/vision-pose-framing-json");

    const imagePath = resolve(__dirname, "../fixtures/cat2.jpg");
    const image = readFileSync(imagePath);
    const base64 = image.toString("base64");

    const provider = alibaba({
      apiKey: process.env.DASHSCOPE_API_KEY ?? "test-key",
      timeout: 60_000,
    });

    const result = await provider.post.compatibleMode.v1.chat.completions({
      model: "qwen3.5-plus",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64}`,
                detail: "low",
              },
            },
            {
              type: "text",
              text: [
                "Analyze this image and return only JSON.",
                'Use keys "subject", "pose", "framing", "composition", and "notable_details".',
                "Keep each value concise and grounded in visible evidence.",
              ].join(" "),
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0,
      max_tokens: 300,
    });

    const content = result.choices[0].message.content;
    expect(content).toBeTruthy();

    const parsed = JSON.parse(content!) as Record<string, unknown>;

    expect(parsed.subject).toEqual(expect.any(String));
    expect(String(parsed.subject).toLowerCase()).toMatch(/cat/);
    expect(parsed.pose).toEqual(expect.any(String));
    expect(String(parsed.pose)).not.toHaveLength(0);
    expect(parsed.framing).toEqual(expect.any(String));
    expect(String(parsed.framing)).not.toHaveLength(0);
    expect(parsed.composition).toEqual(expect.any(String));
    expect(parsed.notable_details).toEqual(expect.any(String));
    expect(result.usage?.total_tokens).toBeGreaterThan(0);
  }, 120_000);
});
