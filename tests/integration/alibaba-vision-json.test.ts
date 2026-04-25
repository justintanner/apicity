import { afterEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { alibaba } from "@apicity/alibaba";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

const SHOT_PATTERN =
  /^(extreme close-up|close-up|medium close-up|medium shot|medium long shot|long shot|extreme long shot), (eye-level|low-angle|high-angle|overhead|dutch)$/;

const CLIPFIRST_STYLE_SYSTEM_PROMPT = [
  "You are an expert image-to-prompt analyst.",
  "Return only a JSON object with keys prompt, shot, and pose.",
  "prompt: a single-paragraph reproduction-ready image prompt, 1900 characters or fewer, with no line breaks.",
  'shot: "<size>, <angle>" using standard cinematography terms.',
  "pose: only body geometry for human figures, with no clothing, hair, background, or lighting details.",
  "For cropped portraits, include the implied off-frame posture in the pose field.",
].join(" ");

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
              text: "Analyze this image and return JSON with prompt, shot, and pose fields.",
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

  it("should analyze an image as clipfirst-style structured JSON", async () => {
    ctx = setupPolly("alibaba/vision-analysis-json");

    const imagePath = resolve(__dirname, "../fixtures/man.jpg");
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
          role: "system",
          content: CLIPFIRST_STYLE_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64}`,
                detail: "high",
              },
            },
            {
              type: "text",
              text: [
                "Analyze this image and produce a reproduction-ready JSON description.",
                'Return only JSON with keys "prompt", "shot", and "pose".',
                "The shot field must be lowercase cinematography terms in the form size, angle.",
                "The pose field must describe only body geometry.",
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

    expect(parsed.prompt).toEqual(expect.any(String));
    expect(String(parsed.prompt)).not.toContain("\n");
    expect(String(parsed.prompt).length).toBeGreaterThan(80);
    expect(String(parsed.prompt).length).toBeLessThanOrEqual(1900);
    expect(parsed.shot).toEqual(expect.any(String));
    expect(String(parsed.shot)).toMatch(SHOT_PATTERN);
    expect(parsed.pose).toEqual(expect.any(String));
    expect(String(parsed.pose)).not.toHaveLength(0);
    expect(String(parsed.pose)).toMatch(
      /\b(head|shoulder|torso|lean|forward|seated|camera)\b/i
    );
    expect(String(parsed.pose)).not.toMatch(
      /\b(suit|tie|shirt|jacket|hair|background|light|lighting|blue)\b/i
    );
    expect(result.usage?.total_tokens).toBeGreaterThan(0);
  }, 120_000);
});
