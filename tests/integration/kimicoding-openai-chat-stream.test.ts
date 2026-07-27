import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  createKimiCoding,
  type OpenAiChatCompletionChunk,
} from "@apicity/kimicoding";

describe("kimicoding OpenAI chat completions (streaming)", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("streams ordered content and reasoning deltas until [DONE]", async () => {
    ctx = setupPolly("kimicoding/openai-chat-stream-basic");
    const provider = createKimiCoding({
      apiKey: process.env.KIMI_CODING_API_KEY ?? "sk-test-key",
    });
    const chunks: OpenAiChatCompletionChunk[] = [];
    for await (const chunk of provider.post.stream.coding.v1.chat.completions({
      model: "k3-256k",
      messages: [
        {
          role: "user",
          content:
            "What is 17 * 23? Think briefly, then answer with just the number.",
        },
      ],
      reasoning_effort: "low",
    })) {
      chunks.push(chunk);
    }

    // [DONE] termination: the async iterator completed after the sentinel.
    expect(chunks.length).toBeGreaterThan(0);
    for (const chunk of chunks) {
      expect(chunk.object).toBe("chat.completion.chunk");
      expect(chunk.id).toBeTruthy();
    }

    // Chunk ordering: every chunk addresses choice index 0 in arrival order.
    expect(chunks.map((chunk) => chunk.choices[0]?.index ?? -1)).toEqual(
      chunks.map(() => 0)
    );

    const content = chunks
      .map((chunk) => chunk.choices[0]?.delta?.content ?? "")
      .join("");
    expect(content).toBeTruthy();
    const reasoning = chunks
      .map((chunk) => chunk.choices[0]?.delta?.reasoning_content ?? "")
      .join("");
    expect(reasoning).toBeTruthy();

    const finishReasons = chunks
      .map((chunk) => chunk.choices[0]?.finish_reason)
      .filter((reason) => reason != null);
    expect(finishReasons.length).toBe(1);

    // No content or reasoning deltas arrive after the finish chunk; only a
    // final usage-carrying chunk may follow it.
    const finishIndex = chunks.findIndex(
      (chunk) => chunk.choices[0]?.finish_reason != null
    );
    for (const chunk of chunks.slice(finishIndex + 1)) {
      expect(chunk.choices[0]?.delta?.content ?? "").toBe("");
      expect(chunk.choices[0]?.delta?.reasoning_content ?? "").toBe("");
    }
  });

  it("streams tool-call deltas for a forced tool call", async () => {
    ctx = setupPolly("kimicoding/openai-chat-stream-tools");
    const provider = createKimiCoding({
      apiKey: process.env.KIMI_CODING_API_KEY ?? "sk-test-key",
    });
    const chunks: OpenAiChatCompletionChunk[] = [];
    for await (const chunk of provider.post.stream.coding.v1.chat.completions({
      model: "k3-256k",
      messages: [
        {
          role: "user",
          content: "What is the weather in Paris? Use the get_weather tool.",
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "get_weather",
            description: "Get the current weather for a city.",
            parameters: {
              type: "object",
              properties: {
                city: { type: "string", description: "City name" },
              },
              required: ["city"],
            },
          },
        },
      ],
      tool_choice: "required",
    })) {
      chunks.push(chunk);
    }

    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks.map((chunk) => chunk.choices[0]?.index ?? -1)).toEqual(
      chunks.map(() => 0)
    );

    const toolDeltas = chunks.flatMap(
      (chunk) => chunk.choices[0]?.delta?.tool_calls ?? []
    );
    expect(toolDeltas.length).toBeGreaterThan(0);

    const names = toolDeltas
      .map((delta) => delta.function?.name)
      .filter((name) => name != null);
    expect(names).toContain("get_weather");

    const argsJson = toolDeltas
      .map((delta) => delta.function?.arguments ?? "")
      .join("");
    const args = JSON.parse(argsJson) as Record<string, unknown>;
    expect(String(args.city).toLowerCase()).toContain("paris");

    const finishReasons = chunks
      .map((chunk) => chunk.choices[0]?.finish_reason)
      .filter((reason) => reason != null);
    expect(finishReasons).toEqual(["tool_calls"]);
  });
});
