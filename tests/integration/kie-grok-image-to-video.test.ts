import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { kie } from "@nakedapi/kie";

describe("kie grok-imagine/image-to-video integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "should generate a video from an image url",
    { timeout: 300_000 },
    async () => {
      ctx = setupPolly("kie/grok-image-to-video");
      const provider = kie({
        apiKey: process.env.KIE_API_KEY ?? "sk-test-key",
      });

      const result = await provider.generate(
        {
          model: "grok-imagine/image-to-video",
          input: {
            image_urls: [
              "https://static.aiquickdraw.com/tools/example/1767602105243_0MmMCrwq.png",
            ],
            prompt:
              "Slow zoom in as the subject blinks and turns their head slightly to the left, soft natural lighting shifts across the face",
            mode: "normal",
            duration: "6",
            resolution: "480p",
          },
        },
        {
          intervalMs: 3000,
          maxAttempts: 100,
          onProgress: (status) => {
            console.log(`[grok-i2v] ${status.state} ${status.progress ?? ""}%`);
          },
        }
      );

      expect(result.status).toBe("completed");
      expect(result.urls.length).toBeGreaterThan(0);
      expect(result.urls[0]).toMatch(/^https?:\/\//);
    }
  );
});
