import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createOpenAi } from "@apicity/openai";

describe("openai vision", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should analyze a base64 image with gpt-5.4", async () => {
    ctx = setupPolly("openai/vision-red-pixel");

    const pngPath = resolve(__dirname, "../fixtures/red.png");
    const pngBuffer = readFileSync(pngPath);
    const base64 = pngBuffer.toString("base64");

    const provider = createOpenAi({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });

    const result = await provider.post.v1.chat.completions({
      model: "gpt-5.4-2026-03-05",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${base64}`,
                detail: "low",
              },
            },
            {
              type: "text",
              text: "What color is this image? Reply with just the color name.",
            },
          ],
        },
      ],
      temperature: 0,
    });

    expect(result.choices[0].message.content).toBeTruthy();
    expect(result.choices[0].message.content!.toLowerCase()).toMatch(/red/);
    expect(result.usage?.total_tokens).toBeGreaterThan(0);
  });
});
