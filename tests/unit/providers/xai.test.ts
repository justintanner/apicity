// Tests for the xai provider
import { describe, it, expect, vi } from "vitest";
import { xai } from "../../../packages/provider/xai/src";

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

  interface XaiChatChoice {
    index: number;
    message: {
      role: string;
      content: string | null;
      tool_calls?: XaiToolCall[];
    };
    finish_reason: string;
  }

  interface XaiChatResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: XaiChatChoice[];
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
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
    respect_moderation?: boolean;
  }

  interface XaiImageResponse {
    created?: number;
    model?: string;
    data: XaiGeneratedImage[];
  }

  interface XaiProvider {
    v1: {
      chat: {
        completions(
          req: XaiChatRequest,
          signal?: AbortSignal
        ): Promise<XaiChatResponse>;
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
    return {
      v1: {
        chat: {
          completions: vi.fn().mockResolvedValue({
            id: "chatcmpl-test",
            object: "chat.completion",
            created: 1700000000,
            model: "grok-4-fast",
            choices: [
              {
                index: 0,
                message: {
                  role: "assistant",
                  content: "I'm Grok, nice to meet you!",
                },
                finish_reason: "stop",
              },
            ],
            usage: {
              prompt_tokens: 12,
              completion_tokens: 8,
              total_tokens: 20,
            },
          }),
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
    expect(result.choices[0].message.content).toBe(
      "I'm Grok, nice to meet you!"
    );
    expect(result.model).toBe("grok-4-fast");
  });

  it("should track usage tokens", async () => {
    const provider = createMockProvider();
    const result = await provider.v1.chat.completions({
      messages: [{ role: "user", content: "Hello" }],
    });
    expect(result.usage?.prompt_tokens).toBe(12);
    expect(result.usage?.completion_tokens).toBe(8);
    expect(result.usage?.total_tokens).toBe(20);
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

  it("should support tool calls in response", async () => {
    const provider = createMockProvider();
    (
      provider.v1.chat.completions as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: "chatcmpl-tool",
      object: "chat.completion",
      created: 1700000000,
      model: "grok-4-fast",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: null,
            tool_calls: [
              {
                id: "call_123",
                type: "function",
                function: {
                  name: "get_weather",
                  arguments: '{"location": "San Francisco"}',
                },
              },
            ],
          },
          finish_reason: "tool_calls",
        },
      ],
      usage: {
        prompt_tokens: 20,
        completion_tokens: 15,
        total_tokens: 35,
      },
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
    expect(result.choices[0].finish_reason).toBe("tool_calls");
    expect(result.choices[0].message.tool_calls).toHaveLength(1);
    expect(result.choices[0].message.tool_calls?.[0].function.name).toBe(
      "get_weather"
    );
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

    it("should include response metadata (model, created, respect_moderation)", async () => {
      const provider = createMockProvider();
      (
        provider.v1.images.generations as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        created: 1700000000,
        model: "grok-imagine-image",
        data: [
          {
            url: "https://api.x.ai/images/789.jpg",
            revised_prompt: "A serene garden",
            respect_moderation: true,
          },
        ],
      });
      const result = await provider.v1.images.generations({
        prompt: "A serene garden",
        model: "grok-imagine-image",
      });
      expect(result.created).toBe(1700000000);
      expect(result.model).toBe("grok-imagine-image");
      expect(result.data[0].respect_moderation).toBe(true);
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

  describe("batches", () => {
    it("should create a batch", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            batch_id: "batch_123",
            name: "My Batch",
            create_time: "2025-11-11",
            expire_time: "2025-11-12",
            create_api_key_id: "key-123",
            cancel_time: null,
            cancel_by_xai_message: null,
            state: {
              num_requests: 0,
              num_pending: 0,
              num_success: 0,
              num_error: 0,
              num_cancelled: 0,
            },
          }),
          { status: 200 }
        )
      );
      const provider = xai({ apiKey: "test-key", fetch: mockFetch });
      const result = await provider.v1.batches.create({ name: "My Batch" });
      expect(result.batch_id).toBe("batch_123");
      expect(result.name).toBe("My Batch");
      expect(result.state.num_requests).toBe(0);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.x.ai/v1/batches",
        expect.objectContaining({ method: "POST" })
      );
    });

    it("should list batches", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            batches: [
              {
                batch_id: "batch_1",
                name: "Batch 1",
                create_time: "2025-11-11",
                expire_time: null,
                create_api_key_id: "key-1",
                cancel_time: null,
                cancel_by_xai_message: null,
                state: {
                  num_requests: 5,
                  num_pending: 2,
                  num_success: 3,
                  num_error: 0,
                  num_cancelled: 0,
                },
              },
            ],
            pagination_token: null,
          }),
          { status: 200 }
        )
      );
      const provider = xai({ apiKey: "test-key", fetch: mockFetch });
      const result = await provider.v1.batches();
      expect(result.batches).toHaveLength(1);
      expect(result.batches[0].batch_id).toBe("batch_1");
    });

    it("should list batches with pagination params", async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({ batches: [], pagination_token: null }),
            { status: 200 }
          )
        );
      const provider = xai({ apiKey: "test-key", fetch: mockFetch });
      await provider.v1.batches({ limit: 10, pagination_token: "abc" });
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.x.ai/v1/batches?limit=10&pagination_token=abc",
        expect.objectContaining({ method: "GET" })
      );
    });

    it("should get a specific batch", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            batch_id: "batch_123",
            name: "My Batch",
            create_time: "2025-11-11",
            expire_time: null,
            create_api_key_id: "key-1",
            cancel_time: null,
            cancel_by_xai_message: null,
            state: {
              num_requests: 1,
              num_pending: 0,
              num_success: 1,
              num_error: 0,
              num_cancelled: 0,
            },
          }),
          { status: 200 }
        )
      );
      const provider = xai({ apiKey: "test-key", fetch: mockFetch });
      const result = await provider.v1.batches.get("batch_123");
      expect(result.batch_id).toBe("batch_123");
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.x.ai/v1/batches/batch_123",
        expect.objectContaining({ method: "GET" })
      );
    });

    it("should cancel a batch", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            batch_id: "batch_123",
            name: "My Batch",
            create_time: "2025-11-11",
            expire_time: null,
            create_api_key_id: "key-1",
            cancel_time: "2025-11-11",
            cancel_by_xai_message: null,
            state: {
              num_requests: 1,
              num_pending: 0,
              num_success: 1,
              num_error: 0,
              num_cancelled: 0,
            },
          }),
          { status: 200 }
        )
      );
      const provider = xai({ apiKey: "test-key", fetch: mockFetch });
      const result = await provider.v1.batches.cancel("batch_123");
      expect(result.cancel_time).toBe("2025-11-11");
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.x.ai/v1/batches/batch_123:cancel",
        expect.objectContaining({ method: "POST" })
      );
    });

    it("should list batch requests", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            batch_request_metadata: [
              {
                batch_request_id: "req_0",
                endpoint: "xai_api.Chat/GetCompletion",
                model: "grok-4",
                state: "succeeded",
                create_time: "2025-11-11",
                finish_time: "2025-11-12",
              },
            ],
            pagination_token: null,
          }),
          { status: 200 }
        )
      );
      const provider = xai({ apiKey: "test-key", fetch: mockFetch });
      const result = await provider.v1.batches.requests("batch_123");
      expect(result.batch_request_metadata).toHaveLength(1);
      expect(result.batch_request_metadata[0].state).toBe("succeeded");
    });

    it("should add requests to a batch", async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValue(new Response("{}", { status: 200 }));
      const provider = xai({ apiKey: "test-key", fetch: mockFetch });
      await provider.v1.batches.requests.add("batch_123", {
        batch_requests: [
          {
            batch_request_id: "req_0",
            batch_request: {
              chat_get_completion: {
                messages: [{ role: "user", content: "Hello" }],
                model: "grok-4",
              },
            },
          },
        ],
      });
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.x.ai/v1/batches/batch_123/requests",
        expect.objectContaining({ method: "POST" })
      );
    });

    it("should get batch results", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            results: [
              {
                batch_request_id: "req_0",
                batch_result: {
                  response: {
                    chat_get_completion: {
                      id: "resp-123",
                      object: "chat.completion",
                      model: "grok-4",
                      choices: [
                        {
                          index: 0,
                          message: { role: "assistant", content: "303" },
                          finish_reason: "stop",
                        },
                      ],
                    },
                  },
                },
              },
            ],
            pagination_token: null,
          }),
          { status: 200 }
        )
      );
      const provider = xai({ apiKey: "test-key", fetch: mockFetch });
      const result = await provider.v1.batches.results("batch_123");
      expect(result.results).toHaveLength(1);
      expect(result.results[0].batch_request_id).toBe("req_0");
    });
  });

  describe("payloadSchema", () => {
    const provider = xai({
      apiKey: "test-key",
      fetch: vi.fn().mockResolvedValue(new Response("{}", { status: 200 })),
    });

    it("v1.chat.completions.payloadSchema has correct method and path", () => {
      expect(provider.v1.chat.completions.payloadSchema.method).toBe("POST");
      expect(provider.v1.chat.completions.payloadSchema.path).toBe(
        "/chat/completions"
      );
    });

    it("v1.images.generations.payloadSchema has correct method and path", () => {
      expect(provider.v1.images.generations.payloadSchema.method).toBe("POST");
      expect(provider.v1.images.generations.payloadSchema.path).toBe(
        "/images/generations"
      );
    });

    it("v1.images.edits.payloadSchema has correct method and path", () => {
      expect(provider.v1.images.edits.payloadSchema.method).toBe("POST");
      expect(provider.v1.images.edits.payloadSchema.path).toBe("/images/edits");
    });

    it("v1.videos.generations.payloadSchema has correct method and path", () => {
      expect(provider.v1.videos.generations.payloadSchema.method).toBe("POST");
      expect(provider.v1.videos.generations.payloadSchema.path).toBe(
        "/videos/generations"
      );
    });

    it("v1.videos.edits.payloadSchema has correct method and path", () => {
      expect(provider.v1.videos.edits.payloadSchema.method).toBe("POST");
      expect(provider.v1.videos.edits.payloadSchema.path).toBe("/videos/edits");
    });

    it("v1.videos.extensions.payloadSchema has correct method and path", () => {
      expect(provider.v1.videos.extensions.payloadSchema.method).toBe("POST");
      expect(provider.v1.videos.extensions.payloadSchema.path).toBe(
        "/videos/extensions"
      );
    });

    it("v1.chat.completions.validatePayload accepts valid payload", () => {
      const result = provider.v1.chat.completions.validatePayload({
        messages: [{ role: "user", content: "Hi" }],
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("v1.chat.completions.validatePayload rejects missing messages", () => {
      const result = provider.v1.chat.completions.validatePayload({});
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("v1.images.generations.validatePayload accepts valid payload", () => {
      const result = provider.v1.images.generations.validatePayload({
        prompt: "a sunset",
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("v1.images.generations.validatePayload rejects missing prompt", () => {
      const result = provider.v1.images.generations.validatePayload({});
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("v1.videos.edits.validatePayload accepts valid payload", () => {
      const result = provider.v1.videos.edits.validatePayload({
        prompt: "Give the woman a silver necklace",
        video: { url: "https://example.com/video.mp4" },
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("v1.videos.edits.validatePayload rejects missing prompt and video", () => {
      const result = provider.v1.videos.edits.validatePayload({});
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("v1.videos.extensions.validatePayload rejects missing prompt and video", () => {
      const result = provider.v1.videos.extensions.validatePayload({});
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("v1.batches.create.payloadSchema has correct method and path", () => {
      expect(provider.v1.batches.create.payloadSchema.method).toBe("POST");
      expect(provider.v1.batches.create.payloadSchema.path).toBe("/batches");
    });

    it("v1.batches.create.validatePayload accepts valid payload", () => {
      const result = provider.v1.batches.create.validatePayload({
        name: "My Batch",
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("v1.batches.create.validatePayload rejects missing name", () => {
      const result = provider.v1.batches.create.validatePayload({});
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("v1.batches.requests.add.payloadSchema has correct method and path", () => {
      expect(provider.v1.batches.requests.add.payloadSchema.method).toBe(
        "POST"
      );
      expect(provider.v1.batches.requests.add.payloadSchema.path).toBe(
        "/batches/{batch_id}/requests"
      );
    });

    it("v1.batches.requests.add.validatePayload accepts valid payload", () => {
      const result = provider.v1.batches.requests.add.validatePayload({
        batch_requests: [
          {
            batch_request: {
              chat_get_completion: {
                messages: [{ role: "user", content: "Hi" }],
                model: "grok-4",
              },
            },
          },
        ],
      });
      expect(result.valid).toBe(true);
    });

    it("v1.batches.requests.add.validatePayload rejects missing batch_requests", () => {
      const result = provider.v1.batches.requests.add.validatePayload({});
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("v1.collections.create.payloadSchema has correct method and path", () => {
      expect(provider.v1.collections.create.payloadSchema.method).toBe("POST");
      expect(provider.v1.collections.create.payloadSchema.path).toBe(
        "/collections"
      );
    });

    it("v1.collections.create.validatePayload accepts valid payload", () => {
      const result = provider.v1.collections.create.validatePayload({
        collection_name: "My Collection",
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("v1.collections.create.validatePayload rejects missing collection_name", () => {
      const result = provider.v1.collections.create.validatePayload({});
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("v1.collections.update.payloadSchema has correct method and path", () => {
      expect(provider.v1.collections.update.payloadSchema.method).toBe("PUT");
      expect(provider.v1.collections.update.payloadSchema.path).toBe(
        "/collections/{collection_id}"
      );
    });

    it("v1.collections.documents.add.payloadSchema has correct method and path", () => {
      expect(provider.v1.collections.documents.add.payloadSchema.method).toBe(
        "POST"
      );
      expect(provider.v1.collections.documents.add.payloadSchema.path).toBe(
        "/collections/{collection_id}/documents/{file_id}"
      );
    });

    it("v1.documents.search.payloadSchema has correct method and path", () => {
      expect(provider.v1.documents.search.payloadSchema.method).toBe("POST");
      expect(provider.v1.documents.search.payloadSchema.path).toBe(
        "/documents/search"
      );
    });

    it("v1.documents.search.validatePayload accepts valid payload", () => {
      const result = provider.v1.documents.search.validatePayload({
        query: "test query",
        source: { collection_ids: ["col_123"] },
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("v1.documents.search.validatePayload rejects missing query", () => {
      const result = provider.v1.documents.search.validatePayload({
        source: { collection_ids: ["col_123"] },
      });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("v1.documents.search.validatePayload rejects missing source", () => {
      const result = provider.v1.documents.search.validatePayload({
        query: "test",
      });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("collections", () => {
    it("should create a collection", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            collection_id: "col_123",
            collection_name: "Test Collection",
            created_at: "1700000000",
            documents_count: 0,
          }),
          { status: 200 }
        )
      );
      const provider = xai({
        apiKey: "test-key",
        managementApiKey: "mgmt-key",
        fetch: mockFetch,
      });
      const result = await provider.v1.collections.create({
        collection_name: "Test Collection",
      });
      expect(result.collection_id).toBe("col_123");
      expect(mockFetch).toHaveBeenCalledWith(
        "https://management-api.x.ai/v1/collections",
        expect.objectContaining({ method: "POST" })
      );
      const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect((init.headers as Record<string, string>).Authorization).toBe(
        "Bearer mgmt-key"
      );
    });

    it("should list collections", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            collections: [
              {
                collection_id: "col_1",
                collection_name: "Collection 1",
                created_at: "1700000000",
              },
            ],
          }),
          { status: 200 }
        )
      );
      const provider = xai({
        apiKey: "test-key",
        managementApiKey: "mgmt-key",
        fetch: mockFetch,
      });
      const result = await provider.v1.collections();
      expect(result.collections).toHaveLength(1);
      expect(result.collections[0].collection_id).toBe("col_1");
    });

    it("should list collections with query params", async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ collections: [] }), { status: 200 })
        );
      const provider = xai({
        apiKey: "test-key",
        managementApiKey: "mgmt-key",
        fetch: mockFetch,
      });
      await provider.v1.collections({ limit: 10 });
      expect(mockFetch).toHaveBeenCalledWith(
        "https://management-api.x.ai/v1/collections?limit=10",
        expect.objectContaining({ method: "GET" })
      );
    });

    it("should get a collection", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            collection_id: "col_123",
            collection_name: "My Collection",
            created_at: "1700000000",
          }),
          { status: 200 }
        )
      );
      const provider = xai({
        apiKey: "test-key",
        managementApiKey: "mgmt-key",
        fetch: mockFetch,
      });
      const result = await provider.v1.collections.get("col_123");
      expect(result.collection_id).toBe("col_123");
      expect(mockFetch).toHaveBeenCalledWith(
        "https://management-api.x.ai/v1/collections/col_123",
        expect.objectContaining({ method: "GET" })
      );
    });

    it("should update a collection", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            collection_id: "col_123",
            collection_name: "Updated Name",
            created_at: "1700000000",
          }),
          { status: 200 }
        )
      );
      const provider = xai({
        apiKey: "test-key",
        managementApiKey: "mgmt-key",
        fetch: mockFetch,
      });
      const result = await provider.v1.collections.update("col_123", {
        collection_name: "Updated Name",
      });
      expect(result.collection_name).toBe("Updated Name");
      expect(mockFetch).toHaveBeenCalledWith(
        "https://management-api.x.ai/v1/collections/col_123",
        expect.objectContaining({ method: "PUT" })
      );
    });

    it("should delete a collection", async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));
      const provider = xai({
        apiKey: "test-key",
        managementApiKey: "mgmt-key",
        fetch: mockFetch,
      });
      await provider.v1.collections.delete("col_123");
      expect(mockFetch).toHaveBeenCalledWith(
        "https://management-api.x.ai/v1/collections/col_123",
        expect.objectContaining({ method: "DELETE" })
      );
    });

    it("should fall back to apiKey when managementApiKey not provided", async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ collections: [] }), { status: 200 })
        );
      const provider = xai({ apiKey: "test-key", fetch: mockFetch });
      await provider.v1.collections();
      const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect((init.headers as Record<string, string>).Authorization).toBe(
        "Bearer test-key"
      );
    });

    it("should use custom managementBaseURL", async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ collections: [] }), { status: 200 })
        );
      const provider = xai({
        apiKey: "test-key",
        managementBaseURL: "https://custom-mgmt.x.ai/v1",
        fetch: mockFetch,
      });
      await provider.v1.collections();
      expect(mockFetch).toHaveBeenCalledWith(
        "https://custom-mgmt.x.ai/v1/collections",
        expect.objectContaining({ method: "GET" })
      );
    });
  });

  describe("collection documents", () => {
    it("should add a document to a collection", async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));
      const provider = xai({
        apiKey: "test-key",
        managementApiKey: "mgmt-key",
        fetch: mockFetch,
      });
      await provider.v1.collections.documents.add("col_123", "file_456");
      expect(mockFetch).toHaveBeenCalledWith(
        "https://management-api.x.ai/v1/collections/col_123/documents/file_456",
        expect.objectContaining({ method: "POST" })
      );
    });

    it("should add a document with metadata fields", async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));
      const provider = xai({
        apiKey: "test-key",
        managementApiKey: "mgmt-key",
        fetch: mockFetch,
      });
      await provider.v1.collections.documents.add("col_123", "file_456", {
        fields: { category: "research" },
      });
      const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(init.body as string);
      expect(body.fields).toEqual({ category: "research" });
    });

    it("should list documents in a collection", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            documents: [
              {
                file_metadata: {
                  file_id: "file_1",
                  name: "doc.pdf",
                  size_bytes: "1024",
                  content_type: "application/pdf",
                  created_at: "1700000000",
                },
                status: "DOCUMENT_STATUS_PROCESSED",
              },
            ],
          }),
          { status: 200 }
        )
      );
      const provider = xai({
        apiKey: "test-key",
        managementApiKey: "mgmt-key",
        fetch: mockFetch,
      });
      const result = await provider.v1.collections.documents("col_123");
      expect(result.documents).toHaveLength(1);
      expect(result.documents[0].file_metadata.file_id).toBe("file_1");
    });

    it("should get a specific document", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            file_metadata: {
              file_id: "file_1",
              name: "doc.pdf",
              size_bytes: "1024",
              content_type: "application/pdf",
              created_at: "1700000000",
            },
            status: "DOCUMENT_STATUS_PROCESSED",
          }),
          { status: 200 }
        )
      );
      const provider = xai({
        apiKey: "test-key",
        managementApiKey: "mgmt-key",
        fetch: mockFetch,
      });
      const result = await provider.v1.collections.documents.get(
        "col_123",
        "file_1"
      );
      expect(result.status).toBe("DOCUMENT_STATUS_PROCESSED");
    });

    it("should delete a document", async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));
      const provider = xai({
        apiKey: "test-key",
        managementApiKey: "mgmt-key",
        fetch: mockFetch,
      });
      await provider.v1.collections.documents.delete("col_123", "file_1");
      expect(mockFetch).toHaveBeenCalledWith(
        "https://management-api.x.ai/v1/collections/col_123/documents/file_1",
        expect.objectContaining({ method: "DELETE" })
      );
    });

    it("should regenerate document indices", async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));
      const provider = xai({
        apiKey: "test-key",
        managementApiKey: "mgmt-key",
        fetch: mockFetch,
      });
      await provider.v1.collections.documents.regenerate("col_123", "file_1");
      expect(mockFetch).toHaveBeenCalledWith(
        "https://management-api.x.ai/v1/collections/col_123/documents/file_1",
        expect.objectContaining({ method: "PATCH" })
      );
    });

    it("should batch get documents", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            documents: [
              {
                file_metadata: {
                  file_id: "file_1",
                  name: "a.pdf",
                  size_bytes: "512",
                  content_type: "application/pdf",
                  created_at: "1700000000",
                },
                status: "DOCUMENT_STATUS_PROCESSED",
              },
              {
                file_metadata: {
                  file_id: "file_2",
                  name: "b.pdf",
                  size_bytes: "1024",
                  content_type: "application/pdf",
                  created_at: "1700000000",
                },
                status: "DOCUMENT_STATUS_PROCESSED",
              },
            ],
          }),
          { status: 200 }
        )
      );
      const provider = xai({
        apiKey: "test-key",
        managementApiKey: "mgmt-key",
        fetch: mockFetch,
      });
      const result = await provider.v1.collections.documents.batchGet(
        "col_123",
        ["file_1", "file_2"]
      );
      expect(result.documents).toHaveLength(2);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://management-api.x.ai/v1/collections/col_123/documents:batchGet?file_ids=file_1&file_ids=file_2",
        expect.objectContaining({ method: "GET" })
      );
    });
  });

  describe("document search", () => {
    it("should search documents", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            matches: [
              {
                file_id: "file_1",
                chunk_id: "chunk_1",
                chunk_content: "The quick brown fox",
                score: 0.95,
                collection_ids: ["col_123"],
                page_number: 1,
              },
            ],
          }),
          { status: 200 }
        )
      );
      const provider = xai({ apiKey: "test-key", fetch: mockFetch });
      const result = await provider.v1.documents.search({
        query: "brown fox",
        source: { collection_ids: ["col_123"] },
      });
      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].chunk_content).toBe("The quick brown fox");
      expect(result.matches[0].score).toBe(0.95);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.x.ai/v1/documents/search",
        expect.objectContaining({ method: "POST" })
      );
    });

    it("should search with all options", async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ matches: [] }), { status: 200 })
        );
      const provider = xai({ apiKey: "test-key", fetch: mockFetch });
      await provider.v1.documents.search({
        query: "test",
        source: { collection_ids: ["col_1"], rag_pipeline: "es" },
        filter: 'fields.category = "research"',
        instructions: "Focus on recent results",
        limit: 5,
        ranking_metric: "RANKING_METRIC_COSINE_SIMILARITY",
        retrieval_mode: { type: "hybrid" },
      });
      const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(init.body as string);
      expect(body.query).toBe("test");
      expect(body.source.rag_pipeline).toBe("es");
      expect(body.limit).toBe(5);
      expect(body.retrieval_mode.type).toBe("hybrid");
    });

    it("uses standard API key (not management key) for search", async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ matches: [] }), { status: 200 })
        );
      const provider = xai({
        apiKey: "standard-key",
        managementApiKey: "mgmt-key",
        fetch: mockFetch,
      });
      await provider.v1.documents.search({
        query: "test",
        source: { collection_ids: ["col_1"] },
      });
      const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect((init.headers as Record<string, string>).Authorization).toBe(
        "Bearer standard-key"
      );
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.x.ai/v1/documents/search",
        expect.anything()
      );
    });
  });
});
