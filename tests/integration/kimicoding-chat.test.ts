import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { kimicoding, type AnthropicStreamEvent } from "@nakedapi/kimicoding";

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
    const result = await provider.post.coding.v1.messages({
      model: "k2p5",
      max_tokens: 32768,
      messages: [{ role: "user", content: "hi" }],
      temperature: 0,
    });
    expect(result.content).toBeTruthy();
    expect(result.model).toBeTruthy();
    expect(
      result.usage.input_tokens + result.usage.output_tokens
    ).toBeGreaterThan(0);
    expect(result.stop_reason).toBeTruthy();
  });

  it("should stream a chat response with k2p5", async () => {
    ctx = setupPolly("kimicoding/stream-hi");
    const provider = kimicoding({
      apiKey: process.env.KIMI_CODING_API_KEY ?? "sk-test-key",
    });
    const deltas: string[] = [];
    let gotStopReason = false;
    for await (const event of provider.post.coding.v1.messages.stream({
      model: "k2p5",
      max_tokens: 32768,
      messages: [{ role: "user", content: "hi" }],
      temperature: 0,
      stream: true,
    })) {
      if (event.delta?.text) deltas.push(event.delta.text);
      if (event.delta?.stop_reason) gotStopReason = true;
    }
    expect(deltas.length).toBeGreaterThan(0);
    expect(deltas.join("")).toBeTruthy();
    expect(gotStopReason).toBe(true);
  });

  it("should analyze a base64 image with k2p5", async () => {
    ctx = setupPolly("kimicoding/chat-image-base64");
    const provider = kimicoding({
      apiKey: process.env.KIMI_CODING_API_KEY ?? "sk-test-key",
    });
    const redPixel =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
    const result = await provider.post.coding.v1.messages({
      model: "k2p5",
      max_tokens: 32768,
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
    expect(
      result.usage.input_tokens + result.usage.output_tokens
    ).toBeGreaterThan(0);
    expect(result.stop_reason).toBeTruthy();
  });

  it("should stream image analysis with k2p5", async () => {
    ctx = setupPolly("kimicoding/stream-image-base64");
    const provider = kimicoding({
      apiKey: process.env.KIMI_CODING_API_KEY ?? "sk-test-key",
    });
    const redPixel =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
    const events: AnthropicStreamEvent[] = [];
    for await (const event of provider.post.coding.v1.messages.stream({
      model: "k2p5",
      max_tokens: 32768,
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
      stream: true,
    })) {
      events.push(event);
    }
    const text = events
      .filter((e) => e.delta?.text)
      .map((e) => e.delta!.text)
      .join("");
    expect(text).toBeTruthy();
    expect(events.some((e) => e.delta?.stop_reason)).toBe(true);
  });
});
