import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { anthropic } from "@nakedapi/anthropic";

describe("anthropic messages with tools", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("anthropic/messages-tools");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should invoke a tool", async () => {
    const provider = anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-ant-test-key",
    });
    const result = await provider.v1.messages({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: "What is the weather in San Francisco?",
        },
      ],
      tools: [
        {
          name: "get_weather",
          description: "Get the current weather for a location.",
          input_schema: {
            type: "object",
            properties: {
              location: {
                type: "string",
                description: "City name",
              },
            },
            required: ["location"],
          },
        },
      ],
    });
    expect(result.stop_reason).toBe("tool_use");
    const toolUse = result.content.find((b) => b.type === "tool_use");
    expect(toolUse).toBeTruthy();
    if (toolUse && toolUse.type === "tool_use") {
      expect(toolUse.name).toBe("get_weather");
      expect(toolUse.input).toHaveProperty("location");
    }
  });
});
