import { afterEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createXaiProvider } from "../xai-provider";

const SHOT_PATTERN =
  /^(extreme close-up|close-up|medium close-up|medium shot|medium long shot|long shot|extreme long shot), (eye-level|low-angle|high-angle|overhead|dutch)$/;

const CLIPFIRST_STYLE_SYSTEM_PROMPT = [
  "You are an expert image-to-prompt analyst.",
  "Return only a JSON object with keys prompt, shot, and pose.",
  "prompt: a single-paragraph reproduction-ready image prompt, 1900 characters or fewer, with no line breaks.",
  'shot: exactly "<size>, <angle>" where size is one of extreme close-up, close-up, medium close-up, medium shot, medium long shot, long shot, or extreme long shot, and angle is one of eye-level, low-angle, high-angle, overhead, or dutch.',
  "pose: only body geometry for human figures, with no clothing, hair, background, or lighting details.",
  "For cropped portraits, include the implied off-frame posture in the pose field.",
].join(" ");

describe("xai vision JSON integration", () => {
  let ctx: PollyContext | undefined;

  afterEach(async () => {
    if (ctx) {
      await teardownPolly(ctx);
      ctx = undefined;
    }
  });

  it("should validate multimodal responses input with image content", () => {
    const provider = createXaiProvider();
    const schema = provider.post.v1.responses.schema;

    const parsed = schema.safeParse({
      model: "grok-4",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_image",
              image_url: "https://example.com/person.jpg",
              detail: "high",
            },
            {
              type: "input_text",
              text: "Analyze this image and return JSON with prompt, shot, and pose fields.",
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_object",
        },
      },
      store: false,
      temperature: 0,
      max_output_tokens: 300,
    });

    expect(parsed.success).toBe(true);
  });

  it("should analyze an image as clipfirst-style structured JSON", async () => {
    ctx = setupPolly("xai/vision-analysis-json");

    const imagePath = resolve(__dirname, "../fixtures/man.jpg");
    const image = readFileSync(imagePath);
    const base64 = image.toString("base64");
    const provider = createXaiProvider();

    const result = await provider.post.v1.responses({
      model: "grok-4",
      input: [
        {
          role: "system",
          content: CLIPFIRST_STYLE_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: [
            {
              type: "input_image",
              image_url: `data:image/jpeg;base64,${base64}`,
              detail: "high",
            },
            {
              type: "input_text",
              text: [
                "Analyze this image and produce a reproduction-ready JSON description.",
                'Return only JSON with keys "prompt", "shot", and "pose".',
                "The shot field must use the exact lowercase labels from the allowed list, including eye-level with a hyphen.",
                "The pose field must describe only body geometry.",
              ].join(" "),
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_object",
        },
      },
      store: false,
      temperature: 0,
      max_output_tokens: 300,
    });

    const message = result.output.find((item) => item.type === "message");

    expect(message).toBeDefined();
    expect(message?.type).toBe("message");

    const content =
      message?.type === "message"
        ? message.content.find((part) => part.type === "output_text")
        : undefined;

    expect(content).toBeDefined();
    expect(content?.type).toBe("output_text");

    const parsed = JSON.parse(content!.text) as Record<string, unknown>;

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
    expect(result.usage.total_tokens).toBeGreaterThan(0);
  }, 120_000);
});
