import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createAnthropic } from "@apicity/anthropic";
import type { AnthropicCountTokensResponse } from "@apicity/anthropic";
import { AnthropicCountTokensRequestSchema } from "@apicity/anthropic/zod";

describe("anthropic v1.messages.countTokens integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should count input tokens for a message request", async () => {
    ctx = setupPolly("anthropic/count-tokens");
    const provider = createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-test-key",
    });

    const result: AnthropicCountTokensResponse =
      await provider.v1.messages.countTokens({
        model: "claude-sonnet-4-6",
        messages: [
          {
            role: "user",
            content: "How many tokens does this sentence use?",
          },
        ],
      });

    expect(typeof result.input_tokens).toBe("number");
    expect(result.input_tokens).toBeGreaterThan(0);
  });

  it("should expose a request schema", () => {
    const provider = createAnthropic({ apiKey: "sk-test" });
    // Bind the identity, not just presence: the MCP server derives this
    // endpoint's tool input JSON Schema from `.schema`, so attaching a
    // sibling's schema here would ship a wrong tool contract silently.
    expect(provider.v1.messages.countTokens.schema).toBe(
      AnthropicCountTokensRequestSchema
    );
    expect(typeof provider.v1.messages.countTokens.schema.safeParse).toBe(
      "function"
    );
  });
});
