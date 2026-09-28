import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie } from "@apicity/kie";

/**
 * Live Polly recording for Grok 4.7 (`POST /grok/v1/responses`,
 * model `grok-4-7`).
 *
 * Fed with OUR OWN fixture asset, not a third-party example URL: red.png is
 * inlined as a `data:image/png;base64,...` input_image part, exercising the
 * model's multimodal input path (docs:
 * https://docs.kie.ai/market/grok/grok-4-7).
 */
describe("kie grok 4.7 responses live", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("returns a completed multimodal response with output", async () => {
    ctx = setupPolly("kie/grok-4-7-responses");
    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "test-key",
    });

    const redBase64 = readFileSync(
      resolve(__dirname, "../fixtures", "red.png")
    ).toString("base64");

    const response = await provider.post.grok.v1.responses({
      model: "grok-4-7",
      stream: false,
      reasoning: { effort: "low" },
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: "What color dominates this image?" },
            {
              type: "input_image",
              image_url: `data:image/png;base64,${redBase64}`,
            },
          ],
        },
      ],
    });

    expect(response.status).toBe("completed");
    expect(response.output?.length).toBeGreaterThan(0);
  });
});
