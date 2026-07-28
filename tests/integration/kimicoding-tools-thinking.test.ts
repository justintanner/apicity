import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  createKimiCoding,
  KimiCodingError,
  type AnthropicStreamEvent,
  type ContentBlock,
} from "@apicity/kimicoding";

const WEATHER_TOOL = {
  name: "get_weather",
  description: "Get the current weather for a city.",
  input_schema: {
    type: "object",
    properties: {
      city: { type: "string", description: "City name" },
    },
    required: ["city"],
  },
};

describe("kimicoding Anthropic tools and thinking", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("round-trips tool use and thinking blocks (non-streaming)", async () => {
    ctx = setupPolly("kimicoding/tools-thinking-roundtrip");
    const provider = createKimiCoding({
      apiKey: process.env.KIMI_CODING_API_KEY ?? "sk-test-key",
    });

    const first = await provider.post.coding.v1.messages({
      model: "k3-256k",
      max_tokens: 8192,
      system: "You are a precise weather assistant.",
      messages: [
        {
          role: "user",
          content: "What is the weather in Paris? Use the get_weather tool.",
        },
      ],
      tools: [WEATHER_TOOL],
      tool_choice: { type: "auto" },
      thinking: { type: "enabled", budget_tokens: 2048 },
    });

    expect(first.stop_reason).toBe("tool_use");
    const blockTypes = first.content.map((block) => block.type);
    expect(blockTypes).toContain("tool_use");
    expect(blockTypes).toContain("thinking");

    const toolUse = first.content.find((block) => block.type === "tool_use");
    if (toolUse?.type !== "tool_use") {
      throw new Error("expected a tool_use block in the first response");
    }
    expect(toolUse.name).toBe("get_weather");
    expect(String(toolUse.input.city).toLowerCase()).toContain("paris");

    const thinking = first.content.find((block) => block.type === "thinking");
    if (thinking?.type !== "thinking") {
      throw new Error("expected a thinking block in the first response");
    }
    expect(thinking.thinking).toBeTruthy();

    const second = await provider.post.coding.v1.messages({
      model: "k3-256k",
      max_tokens: 8192,
      system: "You are a precise weather assistant.",
      messages: [
        {
          role: "user",
          content: "What is the weather in Paris? Use the get_weather tool.",
        },
        // Replay the recorded assistant turn verbatim (including thinking
        // blocks, which the API accepts on the request side); the static
        // request content union is narrower than the response block union.
        { role: "assistant", content: first.content as ContentBlock[] },
        {
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: toolUse.id,
              content: "Sunny, 24C in Paris.",
            },
          ],
        },
      ],
      tools: [WEATHER_TOOL],
      tool_choice: { type: "auto" },
      thinking: { type: "enabled", budget_tokens: 2048 },
    });

    const finalText = second.content
      .filter((block) => block.type === "text")
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("");
    expect(finalText).toBeTruthy();
    expect(second.stop_reason).toBeTruthy();
    expect(
      second.usage.input_tokens + second.usage.output_tokens
    ).toBeGreaterThan(0);
  });

  it("streams tool-use and thinking events", async () => {
    ctx = setupPolly("kimicoding/tools-thinking-stream");
    const provider = createKimiCoding({
      apiKey: process.env.KIMI_CODING_API_KEY ?? "sk-test-key",
    });

    const events: AnthropicStreamEvent[] = [];
    for await (const event of provider.post.stream.coding.v1.messages({
      model: "k3-256k",
      max_tokens: 8192,
      messages: [
        {
          role: "user",
          content: "What is the weather in Paris? Use the get_weather tool.",
        },
      ],
      tools: [WEATHER_TOOL],
      tool_choice: { type: "auto" },
      thinking: { type: "enabled", budget_tokens: 2048 },
      stream: true,
    })) {
      events.push(event);
    }

    const eventTypes = events.map((event) => event.type);
    expect(eventTypes[0]).toBe("message_start");
    expect(eventTypes).toContain("content_block_start");
    expect(eventTypes).toContain("content_block_delta");
    expect(eventTypes).toContain("content_block_stop");
    expect(eventTypes).toContain("message_delta");

    const deltaTypes = events
      .map((event) => event.delta?.type)
      .filter((type) => type != null);
    expect(deltaTypes).toContain("thinking_delta");
    expect(deltaTypes).toContain("input_json_delta");

    const startedBlocks = events
      .filter((event) => event.type === "content_block_start")
      .map((event) => event.content_block?.type);
    expect(startedBlocks).toContain("thinking");
    expect(startedBlocks).toContain("tool_use");

    const partialJson = events
      .filter((event) => event.delta?.type === "input_json_delta")
      .map((event) => event.delta?.partial_json ?? "")
      .join("");
    const toolInput = JSON.parse(partialJson) as Record<string, unknown>;
    expect(String(toolInput.city).toLowerCase()).toContain("paris");
  });

  it("surfaces a recorded 401 on the Anthropic surface", async () => {
    ctx = setupPolly("kimicoding/messages-unauthenticated");
    const provider = createKimiCoding({ apiKey: "sk-invalid-key" });
    let captured: unknown;
    try {
      await provider.post.coding.v1.messages({
        model: "k3-256k",
        max_tokens: 256,
        messages: [{ role: "user", content: "hi" }],
      });
    } catch (error) {
      captured = error;
    }
    expect(captured).toBeInstanceOf(KimiCodingError);
    const error = captured as KimiCodingError;
    expect(error.status).toBe(401);
    expect(error.message).toMatch(/^KimiCoding error 401: .+/);
  });

  it("surfaces a recorded 429 on the Anthropic surface", async () => {
    ctx = setupPolly("kimicoding/messages-rate-limit");
    const provider = createKimiCoding({
      apiKey: process.env.KIMI_CODING_API_KEY ?? "sk-test-key",
    });
    let captured: unknown;
    try {
      await provider.post.coding.v1.messages({
        model: "k3-256k",
        max_tokens: 256,
        messages: [{ role: "user", content: "hi" }],
      });
    } catch (error) {
      captured = error;
    }
    expect(captured).toBeInstanceOf(KimiCodingError);
    const error = captured as KimiCodingError;
    expect(error.status).toBe(429);
    expect(error.message).toMatch(/^KimiCoding error 429: .+/);
  });
});
