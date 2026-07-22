import { describe, it, expect } from "vitest";
import { createXai } from "@apicity/xai";

describe("xAI validation error integration", () => {
  it("should handle type mismatch in request payload - string for number field", () => {
    const provider = createXai({ apiKey: "sk-test-key" });

    const result = provider.post.v1.chat.completions.schema.safeParse({
      model: "grok-3-fast",
      messages: [{ role: "user", content: "Hello" }],
      temperature: "hot",
    });

    expect(result.success).toBe(false);
    if (result.success) throw new Error("expected safeParse failure");
    expect(result.error?.issues.length).toBeGreaterThan(0);
  });

  it("should handle missing required field - messages", () => {
    const provider = createXai({ apiKey: "sk-test-key" });

    const result = provider.post.v1.chat.completions.schema.safeParse({
      model: "grok-3-fast",
    });

    expect(result.success).toBe(false);
    if (result.success) throw new Error("expected safeParse failure");
    expect(result.error?.issues.length).toBeGreaterThan(0);
  });

  it("should handle invalid enum value for message role", () => {
    const provider = createXai({ apiKey: "sk-test-key" });

    const result = provider.post.v1.chat.completions.schema.safeParse({
      model: "grok-3-fast",
      messages: [{ role: "superuser", content: "Hello" }],
    });

    expect(result.success).toBe(false);
    if (result.success) throw new Error("expected safeParse failure");
    expect(result.error?.issues.length).toBeGreaterThan(0);
  });

  it("should handle invalid message structure in array", () => {
    const provider = createXai({ apiKey: "sk-test-key" });

    const result = provider.post.v1.chat.completions.schema.safeParse({
      model: "grok-3-fast",
      messages: [{ role: "user", content: "Hello" }, { role: "assistant" }],
    });

    expect(result.success).toBe(false);
    if (result.success) throw new Error("expected safeParse failure");
    expect(result.error?.issues.length).toBeGreaterThan(0);
  });

  it("should validate responses schema with invalid temperature type", () => {
    const provider = createXai({ apiKey: "sk-test-key" });

    const result = provider.post.v1.responses.schema.safeParse({
      model: "grok-4-fast",
      input: "Hello",
      temperature: "hot",
    });

    expect(result.success).toBe(false);
    if (result.success) throw new Error("expected safeParse failure");
    expect(result.error?.issues.length).toBeGreaterThan(0);
  });

  it("should validate image generations with missing prompt", () => {
    const provider = createXai({ apiKey: "sk-test-key" });

    const result = provider.post.v1.images.generations.schema.safeParse({
      model: "grok-imagine-image-quality",
    });

    expect(result.success).toBe(false);
    if (result.success) throw new Error("expected safeParse failure");
    expect(result.error?.issues.length).toBeGreaterThan(0);
  });
});
