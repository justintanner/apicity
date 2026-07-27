import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  createKimiCoding,
  KimiCodingError,
  KIMI_CODING_MODELS,
} from "@apicity/kimicoding";

describe("kimicoding OpenAI chat completions (non-streaming)", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("completes with reasoning content and usage", async () => {
    ctx = setupPolly("kimicoding/openai-chat-basic");
    const provider = createKimiCoding({
      apiKey: process.env.KIMI_CODING_API_KEY ?? "sk-test-key",
    });
    const result = await provider.post.coding.v1.chat.completions({
      model: "k3-256k",
      messages: [
        {
          role: "user",
          content:
            "What is 17 * 23? Think briefly, then answer with just the number.",
        },
      ],
      reasoning_effort: "low",
    });
    expect(result.object).toBe("chat.completion");
    expect(result.id).toBeTruthy();
    expect(KIMI_CODING_MODELS).toContain(result.model);
    expect(result.choices.length).toBeGreaterThan(0);
    const message = result.choices[0]?.message;
    expect(message?.role).toBe("assistant");
    expect(typeof message?.content).toBe("string");
    expect(message?.content).toBeTruthy();
    expect(typeof message?.reasoning_content).toBe("string");
    expect(message?.reasoning_content).toBeTruthy();
    expect(result.choices[0]?.finish_reason).toBeTruthy();
    expect(result.usage).toBeDefined();
    expect(
      (result.usage?.prompt_tokens ?? 0) +
        (result.usage?.completion_tokens ?? 0)
    ).toBeGreaterThan(0);
  });

  it("surfaces a recorded 401 on the OpenAI surface", async () => {
    ctx = setupPolly("kimicoding/openai-chat-unauthenticated");
    const provider = createKimiCoding({ apiKey: "sk-invalid-key" });
    let captured: unknown;
    try {
      await provider.post.coding.v1.chat.completions({
        model: "k3-256k",
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

  it("surfaces a recorded 429 on the OpenAI surface", async () => {
    ctx = setupPolly("kimicoding/openai-chat-rate-limit");
    const provider = createKimiCoding({
      apiKey: process.env.KIMI_CODING_API_KEY ?? "sk-test-key",
    });
    let captured: unknown;
    try {
      await provider.post.coding.v1.chat.completions({
        model: "k3-256k",
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
