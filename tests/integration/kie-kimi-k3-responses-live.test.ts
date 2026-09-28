import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie } from "@apicity/kie";

/**
 * Live Polly recording for Kimi K3 (`POST /openai/v1/responses`,
 * model `kimi-k3`).
 *
 * Fed with OUR OWN fixture asset, not a third-party example URL: cat1.jpg is
 * inlined as a `data:image/jpeg;base64,...` input_image part — the form the
 * docs bless for publicly-unreachable callers — exercising the model's
 * multimodal input path (docs: https://docs.kie.ai/market/kimi/kimi-k3).
 */
describe("kie kimi k3 responses live", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("answers with output for our own cat photo plus a text question", async () => {
    ctx = setupPolly("kie/kimi-k3-responses");
    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "test-key",
    });

    const catBase64 = readFileSync(
      resolve(__dirname, "../fixtures", "cat1.jpg")
    ).toString("base64");

    const response = await provider.post.openai.v1.responses({
      model: "kimi-k3",
      stream: false,
      instructions: "Answer in one short sentence.",
      reasoning: { effort: "low" },
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: "What animal is in this image?" },
            {
              type: "input_image",
              image_url: `data:image/jpeg;base64,${catBase64}`,
            },
          ],
        },
      ],
    });

    expect(response.status).toBe("completed");
    expect(response.output?.length).toBeGreaterThan(0);
  });
});
