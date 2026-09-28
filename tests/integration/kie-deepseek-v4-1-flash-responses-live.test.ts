import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie } from "@apicity/kie";

/**
 * Live Polly recording for DeepSeek V4.1 Flash (`POST /openai/v1/responses`,
 * model `deepseek-v4-1-flash`).
 *
 * Fed with OUR OWN fixture asset, not a third-party example URL: red.png is
 * inlined as a `data:image/png;base64,...` input_image part — the form the
 * docs bless for publicly-unreachable callers — exercising the model's
 * multimodal input path (docs: https://docs.kie.ai/market/deepseek-v4-1-flash).
 * `thinking: { type: "disabled" }` keeps the recorded call fast and cheap.
 */
describe("kie deepseek v4.1 flash responses live", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("answers with output for our own red square plus a text question", async () => {
    ctx = setupPolly("kie/deepseek-v4-1-flash-responses");
    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "test-key",
    });

    const redBase64 = readFileSync(
      resolve(__dirname, "../fixtures", "red.png")
    ).toString("base64");

    const response = await provider.post.openai.v1.responses({
      model: "deepseek-v4-1-flash",
      stream: false,
      thinking: { type: "disabled" },
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
