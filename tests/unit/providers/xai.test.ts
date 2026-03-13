// Tests for the xai provider
import { describe, it, expect, vi } from "vitest";

describe("xai provider", () => {
  interface XaiMessage {
    role: "user" | "assistant" | "system";
    content: string;
  }

  interface XaiToolCall {
    id: string;
    type: "function";
    function: {
      name: string;
      arguments: string;
    };
  }

  interface XaiChatResponse {
    content: string;
    model: string;
    usage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    finishReason: string;
    toolCalls?: XaiToolCall[];
  }

  interface XaiChatRequest {
    model?: string;
    messages: XaiMessage[];
    temperature?: number;
    max_tokens?: number;
    tools?: Array<{
      type: "function";
      function: {
        name: string;
        description?: string;
        parameters?: Record<string, unknown>;
      };
    }>;
    tool_choice?:
      | "auto"
      | "none"
      | { type: "function"; function: { name: string } };
  }

  interface XaiImageReference {
    url: string;
    type?: "image_url";
  }

  interface XaiImageGenerateRequest {
    prompt: string;
    model?: string;
    n?: number;
    response_format?: "url" | "b64_json";
    aspect_ratio?: string;
    resolution?: "1k" | "2k";
  }

  interface XaiImageEditRequest {
    prompt: string;
    model?: string;
    image?: XaiImageReference;
    images?: XaiImageReference[];
    n?: number;
    response_format?: "url" | "b64_json";
    aspect_ratio?: string;
  }

  interface XaiGeneratedImage {
    url?: string;
    b64_json?: string;
    revised_prompt?: string;
  }

  interface XaiImageResponse {
    data: XaiGeneratedImage[];
  }

  interface XaiChatCompletions {
    (req: XaiChatRequest, signal?: AbortSignal): Promise<XaiChatResponse>;
    search(query: string, signal?: AbortSignal): Promise<XaiChatResponse>;
  }

  interface XaiProvider {
    v1: {
      chat: {
        completions: XaiChatCompletions;
      };
      images: {
        generations(
          req: XaiImageGenerateRequest,
          signal?: AbortSignal
        ): Promise<XaiImageResponse>;
        edits(
          req: XaiImageEditRequest,
          signal?: AbortSignal
        ): Promise<XaiImageResponse>;
      };
    };
  }

  function createMockProvider(): XaiProvider {
    const completions = Object.assign(
      vi.fn().mockResolvedValue({
        content: "I'm Grok, nice to meet you!",
        model: "grok-4-fast",
        usage: {
          promptTokens: 12,
          completionTokens: 8,
          totalTokens: 20,
        },
        finishReason: "stop",
      }),
      {
        search: vi.fn().mockResolvedValue({
          content: '{"urls": ["https://x.com/user/status/123"]}',
          model: "grok-4-fast",
          usage: {
            promptTokens: 50,
            completionTokens: 30,
            totalTokens: 80,
          },
          finishReason: "stop",
        }),
      }
    );
    return {
      v1: {
        chat: {
          completions,
        },
        images: {
          generations: vi.fn().mockResolvedValue({
            data: [
              {
                url: "https://api.x.ai/images/123.jpg",
                revised_prompt: "A cat in a tree",
              },
            ],
          }),
          edits: vi.fn().mockResolvedValue({
            data: [
              {
                url: "https://api.x.ai/images/456.jpg",
              },
            ],
          }),
        },
      },
    };
  }

  it("should send a chat message", async () => {
    const provider = createMockProvider();
    const result = await provider.v1.chat.completions({
      messages: [{ role: "user", content: "Hello Grok!" }],
    });
    expect(result.content).toBe("I'm Grok, nice to meet you!");
    expect(result.model).toBe("grok-4-fast");
  });

  it("should track usage tokens", async () => {
    const provider = createMockProvider();
    const result = await provider.v1.chat.completions({
      messages: [{ role: "user", content: "Hello" }],
    });
    expect(result.usage.promptTokens).toBe(12);
    expect(result.usage.completionTokens).toBe(8);
    expect(result.usage.totalTokens).toBe(20);
  });

  it("should support custom model selection", async () => {
    const provider = createMockProvider();
    await provider.v1.chat.completions({
      model: "grok-4-fast",
      messages: [{ role: "user", content: "Hello" }],
    });
    expect(provider.v1.chat.completions).toHaveBeenCalledWith({
      model: "grok-4-fast",
      messages: [{ role: "user", content: "Hello" }],
    });
  });

  it("should support temperature and max_tokens", async () => {
    const provider = createMockProvider();
    await provider.v1.chat.completions({
      messages: [{ role: "user", content: "Be creative" }],
      temperature: 0.8,
      max_tokens: 1000,
    });
    expect(provider.v1.chat.completions).toHaveBeenCalledWith({
      messages: [{ role: "user", content: "Be creative" }],
      temperature: 0.8,
      max_tokens: 1000,
    });
  });

  it("should perform a search", async () => {
    const provider = createMockProvider();
    const result = await provider.v1.chat.completions.search(
      "latest SpaceX launch videos"
    );
    expect(result.content).toContain("urls");
    expect(result.model).toBe("grok-4-fast");
  });

  it("should support tool calls in response", async () => {
    const provider = createMockProvider();
    (
      provider.v1.chat.completions as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      content: "",
      model: "grok-4-fast",
      usage: { promptTokens: 20, completionTokens: 15, totalTokens: 35 },
      finishReason: "tool_calls",
      toolCalls: [
        {
          id: "call_123",
          type: "function",
          function: {
            name: "get_weather",
            arguments: '{"location": "San Francisco"}',
          },
        },
      ],
    });

    const result = await provider.v1.chat.completions({
      messages: [{ role: "user", content: "What's the weather in SF?" }],
      tools: [
        {
          type: "function",
          function: {
            name: "get_weather",
            description: "Get weather for a location",
            parameters: {
              type: "object",
              properties: { location: { type: "string" } },
            },
          },
        },
      ],
    });
    expect(result.finishReason).toBe("tool_calls");
    expect(result.toolCalls).toHaveLength(1);
    expect(result.toolCalls?.[0].function.name).toBe("get_weather");
  });

  it("should support system messages", async () => {
    const provider = createMockProvider();
    await provider.v1.chat.completions({
      messages: [
        { role: "system", content: "You are a pirate." },
        { role: "user", content: "Hello" },
      ],
    });
    expect(provider.v1.chat.completions).toHaveBeenCalled();
  });

  describe("image generation", () => {
    it("should generate an image", async () => {
      const provider = createMockProvider();
      const result = await provider.v1.images.generations({
        prompt: "A cat in a tree",
      });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].url).toBe("https://api.x.ai/images/123.jpg");
      expect(result.data[0].revised_prompt).toBe("A cat in a tree");
    });

    it("should generate multiple images", async () => {
      const provider = createMockProvider();
      (
        provider.v1.images.generations as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        data: [
          { url: "https://api.x.ai/images/1.jpg" },
          { url: "https://api.x.ai/images/2.jpg" },
          { url: "https://api.x.ai/images/3.jpg" },
        ],
      });
      const result = await provider.v1.images.generations({
        prompt: "A futuristic city",
        n: 3,
      });
      expect(result.data).toHaveLength(3);
    });

    it("should support custom model for image generation", async () => {
      const provider = createMockProvider();
      await provider.v1.images.generations({
        prompt: "A cat",
        model: "grok-imagine-image-pro",
      });
      expect(provider.v1.images.generations).toHaveBeenCalledWith({
        prompt: "A cat",
        model: "grok-imagine-image-pro",
      });
    });

    it("should support aspect_ratio and resolution", async () => {
      const provider = createMockProvider();
      await provider.v1.images.generations({
        prompt: "A mountain landscape",
        aspect_ratio: "16:9",
        resolution: "2k",
      });
      expect(provider.v1.images.generations).toHaveBeenCalledWith({
        prompt: "A mountain landscape",
        aspect_ratio: "16:9",
        resolution: "2k",
      });
    });

    it("should support base64 response format", async () => {
      const provider = createMockProvider();
      (
        provider.v1.images.generations as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        data: [
          {
            b64_json: "base64encodedimagedata...",
            revised_prompt: "A cat in a tree",
          },
        ],
      });
      const result = await provider.v1.images.generations({
        prompt: "A cat in a tree",
        response_format: "b64_json",
      });
      expect(result.data[0].b64_json).toBe("base64encodedimagedata...");
      expect(result.data[0].url).toBeUndefined();
    });

    it("should edit an image", async () => {
      const provider = createMockProvider();
      const result = await provider.v1.images.edits({
        prompt: "Add a hat to this cat",
        image: {
          url: "https://example.com/cat.jpg",
          type: "image_url",
        },
      });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].url).toBe("https://api.x.ai/images/456.jpg");
    });

    it("should edit multiple images", async () => {
      const provider = createMockProvider();
      await provider.v1.images.edits({
        prompt: "Combine these images",
        images: [
          { url: "https://example.com/cat.jpg", type: "image_url" },
          { url: "https://example.com/dog.jpg", type: "image_url" },
        ],
        aspect_ratio: "1:1",
      });
      expect(provider.v1.images.edits).toHaveBeenCalledWith({
        prompt: "Combine these images",
        images: [
          { url: "https://example.com/cat.jpg", type: "image_url" },
          { url: "https://example.com/dog.jpg", type: "image_url" },
        ],
        aspect_ratio: "1:1",
      });
    });

    it("should support AbortSignal", async () => {
      const provider = createMockProvider();
      const controller = new AbortController();
      await provider.v1.images.generations(
        { prompt: "A cat" },
        controller.signal
      );
      expect(provider.v1.images.generations).toHaveBeenCalledWith(
        { prompt: "A cat" },
        controller.signal
      );
    });
  });
});
