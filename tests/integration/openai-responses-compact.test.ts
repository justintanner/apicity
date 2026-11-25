import { afterEach, describe, expect, expectTypeOf, it } from "vitest";
import {
  createOpenAi,
  type OpenAiResponseCompactionItem,
} from "@apicity/openai";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("openai responses compact", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("returns a compacted conversation window", async () => {
    ctx = setupPolly("openai/responses-compact");
    const provider = createOpenAi({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });
    const result = await provider.post.v1.responses.compact({
      model: "gpt-5-nano",
      input: [
        { role: "user", content: "Pick a color." },
        { role: "assistant", content: "Blue." },
      ],
    });

    expect(result.object).toBe("response.compaction");
    type Item = (typeof result.output)[number];
    expectTypeOf<Item["type"]>().toEqualTypeOf<
      | "message"
      | "function_call_output"
      | "item_reference"
      | "reasoning"
      | "function_call"
      | "web_search_call"
      | "file_search_call"
      | "compaction"
      | undefined
    >();
    expect(result.output.map((item) => item.type)).toEqual([
      "message",
      "compaction",
    ]);
    const [message, compacted] = result.output;
    expect(message).toMatchObject({
      type: "message",
      role: "user",
      content: [{ type: "input_text", text: "Pick a color." }],
    });
    if (compacted.type !== "compaction") {
      throw new Error("Expected a compaction item after the retained message");
    }
    expectTypeOf(compacted).toEqualTypeOf<OpenAiResponseCompactionItem>();
    expectTypeOf(compacted).toEqualTypeOf<{
      type: "compaction";
      id: string;
      encrypted_content: string;
      created_by?: string;
    }>();
    expect(compacted.id).toMatch(/^cmp_/);
    expect(compacted.encrypted_content).toMatch(/.+/);
  });
});
