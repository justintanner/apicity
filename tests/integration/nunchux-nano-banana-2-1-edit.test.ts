import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createNunchux } from "@apicity/nunchux";
import { setupPolly, teardownPolly } from "../harness";

// Read from disk so the replayed request body matches the recorded one.
const CAT = readFileSync("tests/fixtures/cat1.jpg").toString("base64");

describe("Nunchux Nano Banana 2.1 edit", () => {
  it("edits the cat photo into a 1K JPEG", async () => {
    const ctx = setupPolly("nunchux/nano-banana-2-1-edit");
    try {
      const client = createNunchux({
        apiKey: process.env.NUNCHUX_API_KEY ?? "test-key",
        timeout: 240000,
      });
      // Text first, as in the docs' edit example. No aspect_ratio, so the
      // output keeps the cat's 3:4 shape.
      const response = await client.v1.google.v1beta.interactions({
        model: "gemini-nano-banana-2.1",
        input: [
          {
            type: "text",
            text: "Put a small red knitted hat on the cat. Keep everything else unchanged.",
          },
          { type: "image", data: CAT, mime_type: "image/jpeg" },
        ],
        response_format: { type: "image", image_size: "1K" },
      });
      console.log("Nano Banana edit interaction", response.id);
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
