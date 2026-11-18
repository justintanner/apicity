import { describe, expect, it } from "vitest";
import { createNunchux } from "@apicity/nunchux";
import { setupPolly, teardownPolly } from "../harness";

describe("Nunchux Nano Banana 2.1", () => {
  it("generates a 1K JPEG from a text prompt", async () => {
    const ctx = setupPolly("nunchux/nano-banana-2-1-text-to-image");
    try {
      const client = createNunchux({
        apiKey: process.env.NUNCHUX_API_KEY ?? "test-key",
        timeout: 240000,
      });
      const response = await client.v1.google.v1beta.interactions({
        model: "gemini-nano-banana-2.1",
        input: [
          {
            type: "text",
            text: "A red paper boat on a calm pond at sunrise, soft morning light, photographic.",
          },
        ],
        response_format: {
          type: "image",
          image_size: "1K",
          aspect_ratio: "1:1",
        },
      });
      console.log("Nano Banana interaction", response.id);
      expect(response.model).toBe("gemini-nano-banana-2.1");
      expect(response.status).toBe("completed");
      const image = response.steps
        .flatMap((step) => step.content ?? [])
        .find((part) => part.data);
      expect(image?.data?.startsWith("/9j/")).toBe(true);
    } finally {
      await teardownPolly(ctx);
    }
  }, 250000);
});
