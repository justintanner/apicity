import { describe, it, expect } from "vitest";
import { extractChat } from "../../packages/provider/cost/src/extract/chat";
import { extractOpenAi } from "../../packages/provider/cost/src/extract/openai";
import { extractAnthropic } from "../../packages/provider/cost/src/extract/anthropic";
import { extractXai } from "../../packages/provider/cost/src/extract/xai";
import {
  flattenMessages,
  asString,
  asNumber,
  asObject,
  pickMaxOutputTokens,
} from "../../packages/provider/cost/src/extract/messages";

describe("flattenMessages", () => {
  it("returns empty string for non-array input", () => {
    expect(flattenMessages(null)).toBe("");
    expect(flattenMessages(undefined)).toBe("");
    expect(flattenMessages("string")).toBe("");
    expect(flattenMessages(42)).toBe("");
    expect(flattenMessages({})).toBe("");
  });

  it("flattens simple string content", () => {
    const messages = [
      { role: "user", content: "Hello" },
      { role: "assistant", content: "World" },
    ];
    expect(flattenMessages(messages)).toBe("Hello\nWorld");
  });

  it("flattens array-of-parts content", () => {
    const messages = [
      {
        role: "user",
        content: [
          { type: "text", text: "Hello" },
          { type: "text", text: "there" },
        ],
      },
    ];
    expect(flattenMessages(messages)).toBe("Hello\nthere");
  });

  it("skips non-text parts", () => {
    const messages = [
      {
        role: "user",
        content: [
          { type: "text", text: "Hello" },
          {
            type: "image_url",
            image_url: { url: "https://example.com/image.png" },
          },
          { type: "audio", audio_url: "https://example.com/audio.mp3" },
        ],
      },
    ];
    expect(flattenMessages(messages)).toBe("Hello");
  });

  it("skips null and non-object messages", () => {
    const messages = [
      { role: "user", content: "Valid" },
      null,
      "not-an-object",
      42,
      { role: "assistant", content: "Also valid" },
    ];
    expect(flattenMessages(messages)).toBe("Valid\nAlso valid");
  });

  it("handles empty messages array", () => {
    expect(flattenMessages([])).toBe("");
  });

  it("handles mixed content types", () => {
    const messages = [
      { role: "user", content: "String content" },
      {
        role: "assistant",
        content: [{ type: "text", text: "Part content" }],
      },
    ];
    expect(flattenMessages(messages)).toBe("String content\nPart content");
  });

  it("handles deeply nested parts with missing text", () => {
    const messages = [
      {
        role: "user",
        content: [
          { type: "text", text: "A" },
          { type: "text" },
          { type: "other", value: "B" },
        ],
      },
    ];
    expect(flattenMessages(messages)).toBe("A");
  });
});

describe("asString", () => {
  it("returns string values", () => {
    expect(asString("hello")).toBe("hello");
    expect(asString("")).toBe("");
  });

  it("returns undefined for non-strings", () => {
    expect(asString(42)).toBeUndefined();
    expect(asString(null)).toBeUndefined();
    expect(asString(undefined)).toBeUndefined();
    expect(asString({})).toBeUndefined();
    expect(asString(true)).toBeUndefined();
  });
});

describe("asNumber", () => {
  it("returns finite numbers", () => {
    expect(asNumber(42)).toBe(42);
    expect(asNumber(0)).toBe(0);
    expect(asNumber(-1.5)).toBe(-1.5);
  });

  it("returns undefined for non-numbers", () => {
    expect(asNumber("42")).toBeUndefined();
    expect(asNumber(null)).toBeUndefined();
    expect(asNumber(undefined)).toBeUndefined();
    expect(asNumber(NaN)).toBeUndefined();
    expect(asNumber(Infinity)).toBeUndefined();
  });
});

describe("asObject", () => {
  it("returns plain objects", () => {
    const obj = { a: 1 };
    expect(asObject(obj)).toBe(obj);
  });

  it("returns undefined for non-objects", () => {
    expect(asObject(null)).toBeUndefined();
    expect(asObject([])).toBeUndefined();
    expect(asObject("str")).toBeUndefined();
    expect(asObject(42)).toBeUndefined();
  });
});

describe("pickMaxOutputTokens", () => {
  it("picks max_tokens", () => {
    expect(pickMaxOutputTokens({ max_tokens: 100 })).toBe(100);
  });

  it("picks max_output_tokens as fallback", () => {
    expect(pickMaxOutputTokens({ max_output_tokens: 200 })).toBe(200);
  });

  it("picks max_completion_tokens as second fallback", () => {
    expect(pickMaxOutputTokens({ max_completion_tokens: 300 })).toBe(300);
  });

  it("prefers max_tokens over other fields", () => {
    expect(
      pickMaxOutputTokens({
        max_tokens: 100,
        max_output_tokens: 200,
        max_completion_tokens: 300,
      })
    ).toBe(100);
  });

  it("prefers max_output_tokens over max_completion_tokens", () => {
    expect(
      pickMaxOutputTokens({
        max_output_tokens: 200,
        max_completion_tokens: 300,
      })
    ).toBe(200);
  });

  it("returns undefined when none present", () => {
    expect(pickMaxOutputTokens({})).toBeUndefined();
    expect(pickMaxOutputTokens({ other: 1 })).toBeUndefined();
  });

  it("ignores non-finite numbers", () => {
    expect(pickMaxOutputTokens({ max_tokens: Infinity })).toBeUndefined();
    expect(pickMaxOutputTokens({ max_tokens: NaN })).toBeUndefined();
  });
});

describe("extractChat", () => {
  it("extracts model and messages for alibaba", () => {
    const result = extractChat("alibaba", {
      model: "qwen3.6-plus",
      messages: [{ role: "user", content: "hello" }],
      max_tokens: 100,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.model).toBe("qwen3.6-plus");
    expect(result.data.text).toBe("hello");
    expect(result.data.maxOutputTokens).toBe(100);
  });

  it("extracts prompt field for kimicoding", () => {
    const result = extractChat("kimicoding", {
      model: "kimi-k2.6",
      prompt: "hello world",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.text).toBe("hello world");
    expect(result.data.maxOutputTokens).toBeUndefined();
  });

  it("extracts text field for fireworks", () => {
    const result = extractChat("fireworks", {
      model: "deepseek-v3",
      text: "test input",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.text).toBe("test input");
  });

  it("extracts input field for alibaba", () => {
    const result = extractChat("alibaba", {
      model: "qwen3.5-0.8b",
      input: "direct input",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.text).toBe("direct input");
  });

  it("fails when model is missing", () => {
    const result = extractChat("alibaba", {
      messages: [{ role: "user", content: "hello" }],
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.warnings).toContain("alibaba: payload.model is required");
  });

  it("falls back through text sources in order", () => {
    // messages present → prompt ignored
    const result = extractChat("kimicoding", {
      model: "kimi-k2",
      messages: [{ role: "user", content: "from messages" }],
      prompt: "from prompt",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.text).toBe("from messages");
  });
});

describe("extractOpenAi", () => {
  it("extracts model and messages", () => {
    const result = extractOpenAi({
      model: "gpt-5",
      messages: [{ role: "user", content: "hello" }],
      max_tokens: 100,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.model).toBe("gpt-5");
    expect(result.data.text).toBe("hello");
    expect(result.data.maxOutputTokens).toBe(100);
  });

  it("extracts responses-style input string", () => {
    const result = extractOpenAi({
      model: "gpt-5",
      input: "simple input",
      max_tokens: 50,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.text).toBe("simple input");
  });

  it("extracts responses-style input array", () => {
    const result = extractOpenAi({
      model: "gpt-5",
      input: [{ role: "user", content: "array input" }],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.text).toBe("array input");
  });

  it("includes instructions prefix when present", () => {
    const result = extractOpenAi({
      model: "gpt-5",
      instructions: "Be concise",
      messages: [{ role: "user", content: "hello" }],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.text).toBe("Be concise\nhello");
  });

  it("prefers input over messages over prompt", () => {
    const result = extractOpenAi({
      model: "gpt-5",
      input: "from input",
      messages: [{ role: "user", content: "from messages" }],
      prompt: "from prompt",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.text).toBe("from input");
  });

  it("fails when model is missing", () => {
    const result = extractOpenAi({
      messages: [{ role: "user", content: "hello" }],
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.warnings).toContain("openai: payload.model is required");
  });

  it("handles empty payload gracefully", () => {
    const result = extractOpenAi({});
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.warnings).toContain("openai: payload.model is required");
  });
});

describe("extractAnthropic", () => {
  it("extracts model and messages", () => {
    const result = extractAnthropic({
      model: "claude-opus-4",
      messages: [{ role: "user", content: "hello" }],
      max_tokens: 100,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.model).toBe("claude-opus-4");
    expect(result.data.text).toBe("hello");
    expect(result.data.maxOutputTokens).toBe(100);
  });

  it("includes system string in text", () => {
    const result = extractAnthropic({
      model: "claude-opus-4",
      system: "You are helpful",
      messages: [{ role: "user", content: "hello" }],
      max_tokens: 50,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.text).toBe("You are helpful\nhello");
  });

  it("includes system array blocks in text", () => {
    const result = extractAnthropic({
      model: "claude-sonnet-4",
      system: [
        { type: "text", text: "System A" },
        { type: "text", text: "System B" },
      ],
      messages: [{ role: "user", content: "hello" }],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.text).toBe("System A\nSystem B\nhello");
  });

  it("skips non-text blocks in system array", () => {
    const result = extractAnthropic({
      model: "claude-sonnet-4",
      system: [
        { type: "text", text: "Keep" },
        { type: "image", source: "data" },
        { type: "text", text: "Also keep" },
      ],
      messages: [{ role: "user", content: "hello" }],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.text).toBe("Keep\nAlso keep\nhello");
  });

  it("handles null blocks in system array", () => {
    const result = extractAnthropic({
      model: "claude-haiku-3-5",
      system: [
        { type: "text", text: "Valid" },
        null,
        "not-an-object",
        { type: "text", text: "Also valid" },
      ],
      messages: [{ role: "user", content: "hello" }],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.text).toBe("Valid\nAlso valid\nhello");
  });

  it("works without system field", () => {
    const result = extractAnthropic({
      model: "claude-opus-4",
      messages: [{ role: "user", content: "hello" }],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.text).toBe("hello");
    expect(result.data.maxOutputTokens).toBeUndefined();
  });

  it("fails when model is missing", () => {
    const result = extractAnthropic({
      messages: [{ role: "user", content: "hello" }],
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.warnings).toContain("anthropic: payload.model is required");
  });
});

describe("extractXai", () => {
  it("extracts model and messages", () => {
    const result = extractXai({
      model: "grok-4",
      messages: [{ role: "user", content: "hello" }],
      max_tokens: 100,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.model).toBe("grok-4");
    expect(result.data.text).toBe("hello");
    expect(result.data.maxOutputTokens).toBe(100);
  });

  it("extracts text field (tokenize-text)", () => {
    const result = extractXai({
      model: "grok-3",
      text: "hello world",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.text).toBe("hello world");
  });

  it("extracts input string", () => {
    const result = extractXai({
      model: "grok-4",
      input: "simple input",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.text).toBe("simple input");
  });

  it("extracts input array", () => {
    const result = extractXai({
      model: "grok-4-fast",
      input: [{ role: "user", content: "array input" }],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.text).toBe("array input");
  });

  it("extracts prompt field", () => {
    const result = extractXai({
      model: "grok-4-1-fast",
      prompt: "prompt text",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.text).toBe("prompt text");
  });

  it("prefers text over messages over input over prompt", () => {
    const result = extractXai({
      model: "grok-4",
      text: "from text",
      messages: [{ role: "user", content: "from messages" }],
      input: "from input",
      prompt: "from prompt",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.text).toBe("from text");
  });

  it("fails when model is missing", () => {
    const result = extractXai({
      messages: [{ role: "user", content: "hello" }],
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.warnings).toContain("xai: payload.model is required");
  });

  it("handles empty payload gracefully", () => {
    const result = extractXai({});
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.warnings).toContain("xai: payload.model is required");
  });

  it("works with max_output_tokens", () => {
    const result = extractXai({
      model: "grok-4",
      text: "hi",
      max_output_tokens: 75,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.maxOutputTokens).toBe(75);
  });

  it("works with max_completion_tokens", () => {
    const result = extractXai({
      model: "grok-4",
      text: "hi",
      max_completion_tokens: 60,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.maxOutputTokens).toBe(60);
  });
});
