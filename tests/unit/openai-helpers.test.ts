// Tests for OpenAI helper functions — no API calls
// Tests textPart, imageUrlPart, imageBase64Part, firstContent from openai.ts
import { describe, it, expect } from "vitest";
import {
  textPart,
  imageUrlPart,
  imageBase64Part,
  firstContent,
} from "../../packages/provider/openai/src/openai";
import type {
  OpenAiChatResponse,
  OpenAiTextPart,
  OpenAiImageUrlPart,
} from "../../packages/provider/openai/src/types";

describe("textPart", () => {
  it("should create text part object", () => {
    const result = textPart("hello");
    expect(result).toEqual({ type: "text", text: "hello" });
  });

  it("should handle empty string", () => {
    const result = textPart("");
    expect(result).toEqual({ type: "text", text: "" });
  });

  it("should handle special characters", () => {
    const result = textPart("Hello, 世界! 🌍");
    expect(result).toEqual({ type: "text", text: "Hello, 世界! 🌍" });
  });

  it("should handle long text", () => {
    const longText = "a".repeat(10000);
    const result = textPart(longText);
    expect(result).toEqual({ type: "text", text: longText });
  });

  it("should return correct type", () => {
    const result: OpenAiTextPart = textPart("test");
    expect(result.type).toBe("text");
  });
});

describe("imageUrlPart", () => {
  it("should create image_url part with URL only", () => {
    const result = imageUrlPart("https://example.com/image.png");
    expect(result).toEqual({
      type: "image_url",
      image_url: { url: "https://example.com/image.png" },
    });
  });

  it("should include detail parameter when provided", () => {
    const result = imageUrlPart("https://example.com/image.png", "high");
    expect(result).toEqual({
      type: "image_url",
      image_url: { url: "https://example.com/image.png", detail: "high" },
    });
  });

  it("should handle low detail", () => {
    const result = imageUrlPart("https://example.com/image.png", "low");
    expect(result.image_url.detail).toBe("low");
  });

  it("should handle auto detail", () => {
    const result = imageUrlPart("https://example.com/image.png", "auto");
    expect(result.image_url.detail).toBe("auto");
  });

  it("should not include detail when undefined", () => {
    const result = imageUrlPart("https://example.com/image.png", undefined);
    expect(result.image_url).not.toHaveProperty("detail");
  });

  it("should handle data URLs", () => {
    const dataUrl = "data:image/png;base64,ABC123";
    const result = imageUrlPart(dataUrl);
    expect(result.image_url.url).toBe(dataUrl);
  });

  it("should return correct types", () => {
    const result: OpenAiImageUrlPart = imageUrlPart("http://test.com/img.jpg");
    expect(result.type).toBe("image_url");
    expect(result.image_url.url).toBe("http://test.com/img.jpg");
  });
});

describe("imageBase64Part", () => {
  it("should create image_url part from base64 string", () => {
    const result = imageBase64Part("ABC123", "image/png");
    expect(result).toEqual({
      type: "image_url",
      image_url: { url: "data:image/png;base64,ABC123" },
    });
  });

  it("should handle jpeg media type", () => {
    const result = imageBase64Part("XYZ789", "image/jpeg");
    expect(result.image_url.url).toBe("data:image/jpeg;base64,XYZ789");
  });

  it("should include detail when provided", () => {
    const result = imageBase64Part("ABC123", "image/png", "high");
    expect(result).toEqual({
      type: "image_url",
      image_url: { url: "data:image/png;base64,ABC123", detail: "high" },
    });
  });

  it("should handle webp format", () => {
    const result = imageBase64Part("WEBPDATA", "image/webp");
    expect(result.image_url.url).toBe("data:image/webp;base64,WEBPDATA");
  });

  it("should handle empty base64 string", () => {
    const result = imageBase64Part("", "image/png");
    expect(result.image_url.url).toBe("data:image/png;base64,");
  });

  it("should handle complex base64 with padding", () => {
    const base64 =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    const result = imageBase64Part(base64, "image/png");
    expect(result.image_url.url).toBe(`data:image/png;base64,${base64}`);
  });

  it("should return OpenAiImageUrlPart type", () => {
    const result: OpenAiImageUrlPart = imageBase64Part("test", "image/png");
    expect(result.type).toBe("image_url");
  });
});

describe("firstContent", () => {
  it("should return first content from response", () => {
    const response: OpenAiChatResponse = {
      id: "chatcmpl-123",
      object: "chat.completion",
      created: 1234567890,
      model: "gpt-4",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "Hello, world!",
          },
          finish_reason: "stop",
        },
      ],
    };
    expect(firstContent(response)).toBe("Hello, world!");
  });

  it("should handle empty content string", () => {
    const response: OpenAiChatResponse = {
      id: "chatcmpl-123",
      object: "chat.completion",
      created: 1234567890,
      model: "gpt-4",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "",
          },
          finish_reason: "stop",
        },
      ],
    };
    expect(firstContent(response)).toBe("");
  });

  it("should return empty string when choices array is empty", () => {
    const response: OpenAiChatResponse = {
      id: "chatcmpl-123",
      object: "chat.completion",
      created: 1234567890,
      model: "gpt-4",
      choices: [],
    };
    expect(firstContent(response)).toBe("");
  });

  it("should return empty string when message is missing", () => {
    const response: OpenAiChatResponse = {
      id: "chatcmpl-123",
      object: "chat.completion",
      created: 1234567890,
      model: "gpt-4",
      choices: [
        {
          index: 0,
          message: undefined as unknown as { role: string; content: string },
          finish_reason: "stop",
        },
      ],
    };
    expect(firstContent(response)).toBe("");
  });

  it("should return empty string when content is null", () => {
    const response: OpenAiChatResponse = {
      id: "chatcmpl-123",
      object: "chat.completion",
      created: 1234567890,
      model: "gpt-4",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: null as unknown as string,
          },
          finish_reason: "stop",
        },
      ],
    };
    expect(firstContent(response)).toBe("");
  });

  it("should handle multiple choices (return first)", () => {
    const response: OpenAiChatResponse = {
      id: "chatcmpl-123",
      object: "chat.completion",
      created: 1234567890,
      model: "gpt-4",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "First choice",
          },
          finish_reason: "stop",
        },
        {
          index: 1,
          message: {
            role: "assistant",
            content: "Second choice",
          },
          finish_reason: "stop",
        },
      ],
    };
    expect(firstContent(response)).toBe("First choice");
  });

  it("should handle content with special characters", () => {
    const response: OpenAiChatResponse = {
      id: "chatcmpl-123",
      object: "chat.completion",
      created: 1234567890,
      model: "gpt-4",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "Hello, 世界! 🌍 <script>alert('xss')</script>",
          },
          finish_reason: "stop",
        },
      ],
    };
    expect(firstContent(response)).toBe(
      "Hello, 世界! 🌍 <script>alert('xss')</script>"
    );
  });

  it("should handle very long content", () => {
    const longContent = "a".repeat(100000);
    const response: OpenAiChatResponse = {
      id: "chatcmpl-123",
      object: "chat.completion",
      created: 1234567890,
      model: "gpt-4",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: longContent,
          },
          finish_reason: "stop",
        },
      ],
    };
    expect(firstContent(response)).toBe(longContent);
  });

  it("should handle response with tool_calls in message", () => {
    const response: OpenAiChatResponse = {
      id: "chatcmpl-123",
      object: "chat.completion",
      created: 1234567890,
      model: "gpt-4",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "Using tool...",
            tool_calls: [
              {
                id: "call-123",
                type: "function",
                function: {
                  name: "get_weather",
                  arguments: '{"location": "NYC"}',
                },
              },
            ],
          },
          finish_reason: "tool_calls",
        },
      ],
    };
    expect(firstContent(response)).toBe("Using tool...");
  });
});
