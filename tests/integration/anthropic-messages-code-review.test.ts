import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createAnthropic } from "@apicity/anthropic";
import type {
  AnthropicMessageResponse,
  AnthropicTextBlock,
} from "@apicity/anthropic";

describe("anthropic v1.messages multi-turn code review", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("reviews a snippet with a system prompt and few-shot history", async () => {
    ctx = setupPolly("anthropic/messages-code-review");
    const provider = createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-test-key",
    });

    const result: AnthropicMessageResponse = await provider.v1.messages({
      model: "claude-sonnet-4-6",
      max_tokens: 256,
      system:
        "You are a senior TypeScript reviewer. Reply with exactly one line in the form: 'BUG: <one-sentence summary>'. No preamble, no code, no Markdown.",
      messages: [
        {
          role: "user",
          content:
            "Review this:\n```ts\nfunction firstNonEmpty(xs: string[]): string {\n  for (let i = 0; i <= xs.length; i++) {\n    if (xs[i]) return xs[i];\n  }\n  return '';\n}\n```",
        },
        {
          role: "assistant",
          content:
            "BUG: The loop condition `i <= xs.length` reads one past the last index, so `xs[xs.length]` is dereferenced as undefined.",
        },
        {
          role: "user",
          content:
            "Now review this one the same way:\n```ts\nasync function readAll(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {\n  const reader = stream.getReader();\n  const chunks: Uint8Array[] = [];\n  while (true) {\n    const { done, value } = await reader.read();\n    if (done) break;\n    chunks.push(value);\n  }\n  return Buffer.concat(chunks);\n}\n```",
        },
      ],
    });

    expect(result.role).toBe("assistant");
    expect(result.model).toContain("claude-sonnet-4");
    expect(Array.isArray(result.content)).toBe(true);
    expect(result.content.length).toBeGreaterThan(0);

    const text = result.content
      .filter(
        (b): b is AnthropicTextBlock =>
          typeof b === "object" &&
          b !== null &&
          "type" in b &&
          b.type === "text"
      )
      .map((b) => b.text)
      .join("");
    expect(text.length).toBeGreaterThan(0);
    expect(text.trim()).toMatch(/^BUG:/);

    expect(result.usage.input_tokens).toBeGreaterThan(0);
    expect(result.usage.output_tokens).toBeGreaterThan(0);
    expect(["end_turn", "stop_sequence", "max_tokens"]).toContain(
      result.stop_reason
    );
  });
});
