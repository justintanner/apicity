import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { kimicoding, type ChatStreamChunk } from "@bareapi/kimicoding";

describe("kimicoding integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should complete a chat request with k2p5", async () => {
    ctx = setupPolly("kimicoding/chat-hi");
    const provider = kimicoding({
      apiKey: process.env.KIMI_CODING_API_KEY ?? "sk-test-key",
    });
    const result = await provider.chat({
      model: "k2p5",
      messages: [{ role: "user", content: "hi" }],
      temperature: 0,
    });
    expect(result.content).toBeTruthy();
    expect(result.model).toBeTruthy();
    expect(result.usage.totalTokens).toBeGreaterThan(0);
    expect(result.finishReason).toBe("stop");
  });

  it("should stream a chat response with k2p5", async () => {
    ctx = setupPolly("kimicoding/stream-hi");
    const provider = kimicoding({
      apiKey: process.env.KIMI_CODING_API_KEY ?? "sk-test-key",
    });
    const chunks: string[] = [];
    let gotDone = false;
    for await (const chunk of provider.streamChat({
      model: "k2p5",
      messages: [{ role: "user", content: "hi" }],
      temperature: 0,
    })) {
      if (chunk.delta) chunks.push(chunk.delta);
      if (chunk.done) gotDone = true;
    }
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks.join("")).toBeTruthy();
    expect(gotDone).toBe(true);
  });

  it("should analyze a base64 image with k2p5", async () => {
    ctx = setupPolly("kimicoding/chat-image-base64");
    const provider = kimicoding({
      apiKey: process.env.KIMI_CODING_API_KEY ?? "sk-test-key",
    });
    const redPixel =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
    const result = await provider.chat({
      model: "k2p5",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/png",
                data: redPixel,
              },
            },
            { type: "text", text: "What color is this image?" },
          ],
        },
      ],
      temperature: 0,
    });
    expect(result.content).toBeTruthy();
    expect(result.usage.totalTokens).toBeGreaterThan(0);
    expect(result.finishReason).toBe("stop");
  });

  it("should stream image analysis with k2p5", async () => {
    ctx = setupPolly("kimicoding/stream-image-base64");
    const provider = kimicoding({
      apiKey: process.env.KIMI_CODING_API_KEY ?? "sk-test-key",
    });
    const redPixel =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
    const chunks: ChatStreamChunk[] = [];
    for await (const chunk of provider.streamChat({
      model: "k2p5",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/png",
                data: redPixel,
              },
            },
            { type: "text", text: "What color is this image?" },
          ],
        },
      ],
      temperature: 0,
    })) {
      chunks.push(chunk);
    }
    const text = chunks.map((c) => c.delta).join("");
    expect(text).toBeTruthy();
    expect(chunks.some((c) => c.done)).toBe(true);
  });
});
