import { describe, it, expect } from "vitest";
import { xai } from "@nakedapi/xai";

describe("xAI validation error integration", () => {
  it("should handle type mismatch in request payload - string for number field", () => {
    const provider = xai({ apiKey: "sk-test-key" });

    const result = provider.post.v1.chat.completions.validatePayload({
      model: "grok-3-fast",
      messages: [{ role: "user", content: "Hello" }],
      temperature: "hot",
    });

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("should handle missing required field - messages", () => {
    const provider = xai({ apiKey: "sk-test-key" });

    const result = provider.post.v1.chat.completions.validatePayload({
      model: "grok-3-fast",
    });

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("should handle invalid enum value for message role", () => {
    const provider = xai({ apiKey: "sk-test-key" });

    const result = provider.post.v1.chat.completions.validatePayload({
      model: "grok-3-fast",
      messages: [{ role: "superuser", content: "Hello" }],
    });

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("should handle invalid message structure in array", () => {
    const provider = xai({ apiKey: "sk-test-key" });

    const result = provider.post.v1.chat.completions.validatePayload({
      model: "grok-3-fast",
      messages: [{ role: "user", content: "Hello" }, { role: "assistant" }],
    });

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("should validate responses schema with invalid temperature type", () => {
    const provider = xai({ apiKey: "sk-test-key" });

    const result = provider.post.v1.responses.validatePayload({
      model: "grok-4-fast",
      input: "Hello",
      temperature: "hot",
    });

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("should validate image generations with missing prompt", () => {
    const provider = xai({ apiKey: "sk-test-key" });

    const result = provider.post.v1.images.generations.validatePayload({
      model: "grok-imagine-image",
    });

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
