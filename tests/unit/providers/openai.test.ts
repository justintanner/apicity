// Tests for the openai provider
import { describe, it, expect, vi } from "vitest";
import { openai, OpenAiError } from "../../../packages/provider/openai/src";

describe("openai provider", () => {
  interface OpenAiMessage {
    role: "user" | "assistant" | "system";
    content: string;
  }

  interface OpenAiToolCall {
    id: string;
    type: "function";
    function: {
      name: string;
      arguments: string;
    };
  }

  interface OpenAiChatChoice {
    index: number;
    message: {
      role: string;
      content: string | null;
      tool_calls?: OpenAiToolCall[];
    };
    finish_reason: string;
  }

  interface OpenAiChatResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: OpenAiChatChoice[];
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  }

  interface OpenAiChatRequest {
    model?: string;
    messages: OpenAiMessage[];
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

  interface OpenAiTranscribeResponse {
    text: string;
  }

  interface OpenAiTranslateResponse {
    text: string;
  }

  interface OpenAiProvider {
    v1: {
      chat: {
        completions(
          req: OpenAiChatRequest,
          signal?: AbortSignal
        ): Promise<OpenAiChatResponse>;
      };
      audio: {
        transcriptions(
          req: { file: Blob; model: string; language?: string },
          signal?: AbortSignal
        ): Promise<OpenAiTranscribeResponse>;
        translations(
          req: { file: Blob; model: string; prompt?: string },
          signal?: AbortSignal
        ): Promise<OpenAiTranslateResponse>;
      };
    };
  }

  function createMockProvider(): OpenAiProvider {
    return {
      v1: {
        chat: {
          completions: vi.fn().mockResolvedValue({
            id: "chatcmpl-test",
            object: "chat.completion",
            created: 1700000000,
            model: "gpt-5.4-2026-03-05",
            choices: [
              {
                index: 0,
                message: {
                  role: "assistant",
                  content: "Hello! How can I help you today?",
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
        audio: {
          transcriptions: vi.fn().mockResolvedValue({
            text: "Hello world, this is a test transcription.",
          }),
          translations: vi.fn().mockResolvedValue({
            text: "Hello world, this is a test translation.",
          }),
        },
      },
    };
  }

  it("should send a chat message", async () => {
    const provider = createMockProvider();
    const result = await provider.v1.chat.completions({
      messages: [{ role: "user", content: "Hello!" }],
    });
    expect(result.choices[0].message.content).toBe(
      "Hello! How can I help you today?"
    );
    expect(result.model).toBe("gpt-5.4-2026-03-05");
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
      model: "gpt-5.4-2026-03-05",
      messages: [{ role: "user", content: "Hello" }],
    });
    expect(provider.v1.chat.completions).toHaveBeenCalledWith({
      model: "gpt-5.4-2026-03-05",
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
      model: "gpt-5.4-2026-03-05",
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
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Hello" },
      ],
    });
    expect(provider.v1.chat.completions).toHaveBeenCalled();
  });

  it("should transcribe audio", async () => {
    const provider = createMockProvider();
    const file = new Blob(["fake-audio"], { type: "audio/mp3" });
    const result = await provider.v1.audio.transcriptions({
      file,
      model: "gpt-4o-mini-transcribe",
    });
    expect(result.text).toBe("Hello world, this is a test transcription.");
  });

  it("should pass model and language to transcribe", async () => {
    const provider = createMockProvider();
    const file = new Blob(["fake-audio"], { type: "audio/mp3" });
    await provider.v1.audio.transcriptions({
      file,
      model: "gpt-4o-mini-transcribe",
      language: "en",
    });
    expect(provider.v1.audio.transcriptions).toHaveBeenCalledWith({
      file,
      model: "gpt-4o-mini-transcribe",
      language: "en",
    });
  });

  it("should translate audio", async () => {
    const provider = createMockProvider();
    const file = new Blob(["fake-audio"], { type: "audio/mp3" });
    const result = await provider.v1.audio.translations({
      file,
      model: "whisper-1",
    });
    expect(result.text).toBe("Hello world, this is a test translation.");
  });

  it("should pass model and prompt to translate", async () => {
    const provider = createMockProvider();
    const file = new Blob(["fake-audio"], { type: "audio/mp3" });
    await provider.v1.audio.translations({
      file,
      model: "whisper-1",
      prompt: "Translate the following audio",
    });
    expect(provider.v1.audio.translations).toHaveBeenCalledWith({
      file,
      model: "whisper-1",
      prompt: "Translate the following audio",
    });
  });

  describe("payloadSchema", () => {
    const realProvider = openai({
      apiKey: "test-key",
      fetch: vi.fn().mockResolvedValue(new Response("{}", { status: 200 })),
    });

    it("v1.chat.completions.payloadSchema exists with correct method and path", () => {
      const schema = realProvider.v1.chat.completions.payloadSchema;
      expect(schema).toBeDefined();
      expect(schema.method).toBe("POST");
      expect(schema.path).toBe("/chat/completions");
    });

    it("v1.audio.transcriptions.payloadSchema exists with correct method and path", () => {
      const schema = realProvider.v1.audio.transcriptions.payloadSchema;
      expect(schema).toBeDefined();
      expect(schema.method).toBe("POST");
      expect(schema.path).toBe("/audio/transcriptions");
    });

    it("v1.chat.completions.validatePayload accepts valid payload with messages array", () => {
      const result = realProvider.v1.chat.completions.validatePayload({
        messages: [{ role: "user", content: "Hello" }],
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("v1.chat.completions.validatePayload rejects empty object missing required messages", () => {
      const result = realProvider.v1.chat.completions.validatePayload({});
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("messages is required");
    });

    it("v1.chat.completions.validatePayload rejects wrong type for messages", () => {
      const result = realProvider.v1.chat.completions.validatePayload({
        messages: "not-an-array",
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("messages must be of type array");
    });

    it("v1.audio.transcriptions.validatePayload rejects missing required fields", () => {
      const result = realProvider.v1.audio.transcriptions.validatePayload({});
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("file is required");
      expect(result.errors).toContain("model is required");
    });

    it("v1.images.edits.payloadSchema exists with correct method and path", () => {
      const schema = realProvider.v1.images.edits.payloadSchema;
      expect(schema).toBeDefined();
      expect(schema.method).toBe("POST");
      expect(schema.path).toBe("/images/edits");
      expect(schema.contentType).toBe("multipart/form-data");
    });

    it("v1.images.edits.validatePayload accepts valid payload", () => {
      const result = realProvider.v1.images.edits.validatePayload({
        image: new Blob(["fake-image"], { type: "image/png" }),
        prompt: "Add a hat to the cat",
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("v1.images.edits.validatePayload rejects missing required fields", () => {
      const result = realProvider.v1.images.edits.validatePayload({});
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("image is required");
      expect(result.errors).toContain("prompt is required");
    });

    it("v1.images.edits.validatePayload rejects invalid size enum", () => {
      const result = realProvider.v1.images.edits.validatePayload({
        image: new Blob(["fake"], { type: "image/png" }),
        prompt: "Edit this",
        size: "999x999",
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("size must be one of");
    });

    it("v1.images.edits.validatePayload rejects invalid quality enum", () => {
      const result = realProvider.v1.images.edits.validatePayload({
        image: new Blob(["fake"], { type: "image/png" }),
        prompt: "Edit this",
        quality: "ultra",
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("quality must be one of");
    });

    it("v1.images.edits.validatePayload accepts all optional fields", () => {
      const result = realProvider.v1.images.edits.validatePayload({
        image: new Blob(["fake"], { type: "image/png" }),
        prompt: "Edit this",
        mask: new Blob(["mask"], { type: "image/png" }),
        model: "gpt-image-1",
        n: 2,
        size: "1024x1024",
        quality: "high",
        output_format: "png",
        background: "transparent",
        input_fidelity: "high",
        output_compression: 80,
        user: "user-123",
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("v1.audio.translations.payloadSchema exists with correct method and path", () => {
      const schema = realProvider.v1.audio.translations.payloadSchema;
      expect(schema).toBeDefined();
      expect(schema.method).toBe("POST");
      expect(schema.path).toBe("/audio/translations");
    });

    it("v1.audio.translations.validatePayload rejects missing required fields", () => {
      const result = realProvider.v1.audio.translations.validatePayload({});
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("file is required");
      expect(result.errors).toContain("model is required");
    });

    it("v1.embeddings.payloadSchema exists with correct method and path", () => {
      const schema = realProvider.v1.embeddings.payloadSchema;
      expect(schema).toBeDefined();
      expect(schema.method).toBe("POST");
      expect(schema.path).toBe("/embeddings");
      expect(schema.contentType).toBe("application/json");
    });

    it("v1.embeddings.validatePayload accepts valid payload", () => {
      const result = realProvider.v1.embeddings.validatePayload({
        input: "Hello world",
        model: "text-embedding-3-small",
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("v1.embeddings.validatePayload rejects missing required fields", () => {
      const result = realProvider.v1.embeddings.validatePayload({});
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("input is required");
      expect(result.errors).toContain("model is required");
    });

    it("v1.embeddings.validatePayload rejects invalid encoding_format", () => {
      const result = realProvider.v1.embeddings.validatePayload({
        input: "Hello",
        model: "text-embedding-3-small",
        encoding_format: "invalid",
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("encoding_format must be one of");
    });

    it("v1.embeddings.validatePayload accepts optional fields", () => {
      const result = realProvider.v1.embeddings.validatePayload({
        input: "Hello",
        model: "text-embedding-3-small",
        encoding_format: "float",
        dimensions: 256,
        user: "user-123",
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("v1.images.generations.payloadSchema exists with correct method and path", () => {
      const schema = realProvider.v1.images.generations.payloadSchema;
      expect(schema).toBeDefined();
      expect(schema.method).toBe("POST");
      expect(schema.path).toBe("/images/generations");
      expect(schema.contentType).toBe("application/json");
    });

    it("v1.images.generations.validatePayload accepts valid payload", () => {
      const result = realProvider.v1.images.generations.validatePayload({
        prompt: "A cute cat sitting on a rainbow",
        model: "gpt-image-1",
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("v1.images.generations.validatePayload rejects missing required prompt", () => {
      const result = realProvider.v1.images.generations.validatePayload({});
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("prompt is required");
    });

    it("v1.images.generations.validatePayload rejects invalid size", () => {
      const result = realProvider.v1.images.generations.validatePayload({
        prompt: "A cat",
        size: "999x999",
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("size must be one of");
    });

    it("v1.images.generations.validatePayload rejects invalid quality", () => {
      const result = realProvider.v1.images.generations.validatePayload({
        prompt: "A cat",
        quality: "ultra",
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("quality must be one of");
    });

    it("v1.images.generations.validatePayload rejects invalid response_format", () => {
      const result = realProvider.v1.images.generations.validatePayload({
        prompt: "A cat",
        response_format: "svg",
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("response_format must be one of");
    });

    it("v1.images.generations.validatePayload accepts all optional fields", () => {
      const result = realProvider.v1.images.generations.validatePayload({
        prompt: "A sunset over mountains",
        model: "dall-e-3",
        n: 1,
        size: "1024x1024",
        quality: "hd",
        response_format: "url",
        style: "vivid",
        user: "user-123",
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("v1.responses.payloadSchema exists with correct method and path", () => {
      const schema = realProvider.v1.responses.payloadSchema;
      expect(schema).toBeDefined();
      expect(schema.method).toBe("POST");
      expect(schema.path).toBe("/responses");
      expect(schema.contentType).toBe("application/json");
    });

    it("v1.responses.validatePayload accepts valid payload with string input", () => {
      const result = realProvider.v1.responses.validatePayload({
        model: "gpt-4o",
        input: "Hello, how are you?",
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("v1.responses.validatePayload rejects missing required fields", () => {
      const result = realProvider.v1.responses.validatePayload({});
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("model is required");
      expect(result.errors).toContain("input is required");
    });

    it("v1.responses.validatePayload rejects missing model", () => {
      const result = realProvider.v1.responses.validatePayload({
        input: "Hello",
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("model is required");
    });

    it("v1.responses.validatePayload rejects invalid truncation enum", () => {
      const result = realProvider.v1.responses.validatePayload({
        model: "gpt-4o",
        input: "Hello",
        truncation: "invalid",
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("truncation must be one of");
    });

    it("v1.responses.validatePayload accepts all optional fields", () => {
      const result = realProvider.v1.responses.validatePayload({
        model: "gpt-4o",
        input: "Summarize this document",
        instructions: "Be concise",
        temperature: 0.7,
        max_output_tokens: 1000,
        top_p: 0.9,
        store: true,
        stream: false,
        truncation: "auto",
        user: "user-123",
        parallel_tool_calls: true,
        conversation: "conv-123",
        background: false,
        service_tier: "auto",
        safety_identifier: "hashed-user-id",
        prompt_cache_key: "cache-key-123",
        prompt_cache_retention: "24h",
        max_tool_calls: 10,
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("v1.responses.validatePayload rejects invalid service_tier enum", () => {
      const result = realProvider.v1.responses.validatePayload({
        model: "gpt-4o",
        input: "Hello",
        service_tier: "invalid",
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("service_tier must be one of");
    });

    it("v1.responses.validatePayload rejects invalid prompt_cache_retention enum", () => {
      const result = realProvider.v1.responses.validatePayload({
        model: "gpt-4o",
        input: "Hello",
        prompt_cache_retention: "forever",
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain(
        "prompt_cache_retention must be one of"
      );
    });
  });

  describe("responses endpoint", () => {
    it("should create a response with string input", async () => {
      const mockResponse = {
        id: "resp_test123",
        object: "response",
        created_at: 1700000000,
        status: "completed",
        model: "gpt-4o",
        output: [
          {
            type: "message",
            id: "msg_test",
            role: "assistant",
            content: [
              {
                type: "output_text",
                text: "Hello! How can I help you today?",
              },
            ],
            status: "completed",
          },
        ],
        usage: {
          input_tokens: 10,
          output_tokens: 8,
          total_tokens: 18,
        },
      };

      const mockFetch = vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify(mockResponse), { status: 200 })
        );

      const provider = openai({ apiKey: "test-key", fetch: mockFetch });
      const result = await provider.v1.responses({
        model: "gpt-4o",
        input: "Hello!",
      });

      expect(result.id).toBe("resp_test123");
      expect(result.object).toBe("response");
      expect(result.status).toBe("completed");
      expect(result.output).toHaveLength(1);
      expect(result.output[0].type).toBe("message");
      expect(result.usage?.total_tokens).toBe(18);
    });

    it("should create a response with array input", async () => {
      const mockResponse = {
        id: "resp_test456",
        object: "response",
        created_at: 1700000000,
        status: "completed",
        model: "gpt-4o",
        output: [
          {
            type: "message",
            id: "msg_test2",
            role: "assistant",
            content: [
              {
                type: "output_text",
                text: "The weather is sunny.",
              },
            ],
            status: "completed",
          },
        ],
      };

      const mockFetch = vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify(mockResponse), { status: 200 })
        );

      const provider = openai({ apiKey: "test-key", fetch: mockFetch });
      const result = await provider.v1.responses({
        model: "gpt-4o",
        input: [
          {
            role: "user",
            content: "What is the weather?",
          },
        ],
      });

      expect(result.id).toBe("resp_test456");
      expect(result.output[0].type).toBe("message");
    });

    it("should send correct request body to API", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            id: "resp_test",
            object: "response",
            created_at: 0,
            status: "completed",
            model: "gpt-4o",
            output: [],
          }),
          { status: 200 }
        )
      );

      const provider = openai({ apiKey: "test-key", fetch: mockFetch });
      await provider.v1.responses({
        model: "gpt-4o",
        input: "Hello",
        instructions: "Be helpful",
        temperature: 0.5,
        max_output_tokens: 500,
      });

      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toContain("/responses");
      const body = JSON.parse(init.body as string);
      expect(body.model).toBe("gpt-4o");
      expect(body.input).toBe("Hello");
      expect(body.instructions).toBe("Be helpful");
      expect(body.temperature).toBe(0.5);
      expect(body.max_output_tokens).toBe(500);
    });

    it("should support function tools in request", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            id: "resp_tool",
            object: "response",
            created_at: 0,
            status: "completed",
            model: "gpt-4o",
            output: [
              {
                type: "function_call",
                id: "fc_1",
                call_id: "call_abc",
                name: "get_weather",
                arguments: '{"location":"SF"}',
                status: "completed",
              },
            ],
          }),
          { status: 200 }
        )
      );

      const provider = openai({ apiKey: "test-key", fetch: mockFetch });
      const result = await provider.v1.responses({
        model: "gpt-4o",
        input: "What's the weather in SF?",
        tools: [
          {
            type: "function",
            name: "get_weather",
            description: "Get weather for a location",
            parameters: {
              type: "object",
              properties: { location: { type: "string" } },
            },
          },
        ],
      });

      expect(result.output[0].type).toBe("function_call");
      const fnCall = result.output[0] as {
        type: "function_call";
        name: string;
        arguments: string;
      };
      expect(fnCall.name).toBe("get_weather");
      expect(fnCall.arguments).toBe('{"location":"SF"}');
    });

    it("should support previous_response_id for multi-turn", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            id: "resp_turn2",
            object: "response",
            created_at: 0,
            status: "completed",
            model: "gpt-4o",
            output: [],
            previous_response_id: "resp_turn1",
          }),
          { status: 200 }
        )
      );

      const provider = openai({ apiKey: "test-key", fetch: mockFetch });
      await provider.v1.responses({
        model: "gpt-4o",
        input: "Tell me more",
        previous_response_id: "resp_turn1",
      });

      const [, init] = mockFetch.mock.calls[0];
      const body = JSON.parse(init.body as string);
      expect(body.previous_response_id).toBe("resp_turn1");
    });
  });

  describe("responses.get endpoint", () => {
    it("should retrieve a response by id", async () => {
      const mockResponse = {
        id: "resp_abc123",
        object: "response",
        created_at: 1700000000,
        status: "completed",
        model: "gpt-4o",
        output: [
          {
            type: "message",
            id: "msg_get1",
            role: "assistant",
            content: [
              {
                type: "output_text",
                text: "Previously generated response.",
              },
            ],
            status: "completed",
          },
        ],
        usage: {
          input_tokens: 5,
          output_tokens: 4,
          total_tokens: 9,
        },
      };

      const mockFetch = vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify(mockResponse), { status: 200 })
        );

      const provider = openai({ apiKey: "test-key", fetch: mockFetch });
      const result = await provider.v1.responses.get("resp_abc123");

      expect(result.id).toBe("resp_abc123");
      expect(result.object).toBe("response");
      expect(result.status).toBe("completed");
      expect(result.output).toHaveLength(1);
      expect(result.usage?.total_tokens).toBe(9);
    });

    it("should send GET request to correct URL", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            id: "resp_url_test",
            object: "response",
            created_at: 0,
            status: "completed",
            model: "gpt-4o",
            output: [],
          }),
          { status: 200 }
        )
      );

      const provider = openai({ apiKey: "test-key", fetch: mockFetch });
      await provider.v1.responses.get("resp_url_test");

      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toContain("/responses/resp_url_test");
      expect(init.method).toBe("GET");
    });

    it("should pass include query params", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            id: "resp_include",
            object: "response",
            created_at: 0,
            status: "completed",
            model: "gpt-4o",
            output: [],
          }),
          { status: 200 }
        )
      );

      const provider = openai({ apiKey: "test-key", fetch: mockFetch });
      await provider.v1.responses.get("resp_include", {
        include: ["file_search_call.results", "message.input_image.image_url"],
      });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain("include%5B%5D=file_search_call.results");
      expect(url).toContain("include%5B%5D=message.input_image.image_url");
    });

    it("should pass stream query param", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            id: "resp_stream",
            object: "response",
            created_at: 0,
            status: "completed",
            model: "gpt-4o",
            output: [],
          }),
          { status: 200 }
        )
      );

      const provider = openai({ apiKey: "test-key", fetch: mockFetch });
      await provider.v1.responses.get("resp_stream", { stream: true });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain("stream=true");
    });

    it("should include authorization header", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            id: "resp_auth",
            object: "response",
            created_at: 0,
            status: "completed",
            model: "gpt-4o",
            output: [],
          }),
          { status: 200 }
        )
      );

      const provider = openai({ apiKey: "sk-test-key-123", fetch: mockFetch });
      await provider.v1.responses.get("resp_auth");

      const [, init] = mockFetch.mock.calls[0];
      expect(init.headers.Authorization).toBe("Bearer sk-test-key-123");
    });

    it("should handle API errors", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: { message: "Response not found", type: "not_found_error" },
          }),
          { status: 404 }
        )
      );

      const provider = openai({ apiKey: "test-key", fetch: mockFetch });
      await expect(
        provider.v1.responses.get("resp_nonexistent")
      ).rejects.toThrow("OpenAI API error 404: Response not found");
    });

    it("should work with no options", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            id: "resp_noopts",
            object: "response",
            created_at: 0,
            status: "completed",
            model: "gpt-4o",
            output: [],
          }),
          { status: 200 }
        )
      );

      const provider = openai({ apiKey: "test-key", fetch: mockFetch });
      const result = await provider.v1.responses.get("resp_noopts");

      expect(result.id).toBe("resp_noopts");
      const [url] = mockFetch.mock.calls[0];
      expect(url).not.toContain("?");
    });
  });

  describe("embeddings endpoint", () => {
    it("should send correct URL and JSON body", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            object: "list",
            data: [
              { object: "embedding", index: 0, embedding: [0.1, 0.2, 0.3] },
            ],
            model: "text-embedding-3-small",
            usage: { prompt_tokens: 5, total_tokens: 5 },
          }),
          { status: 200 }
        )
      );
      const provider = openai({ apiKey: "test-key", fetch: mockFetch });
      const result = await provider.v1.embeddings({
        model: "text-embedding-3-small",
        input: "Hello world",
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].embedding).toEqual([0.1, 0.2, 0.3]);
      expect(result.model).toBe("text-embedding-3-small");
      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("https://api.openai.com/v1/embeddings");
      expect(init.method).toBe("POST");
      const body = JSON.parse(init.body as string);
      expect(body.model).toBe("text-embedding-3-small");
      expect(body.input).toBe("Hello world");
    });

    it("should support array input", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            object: "list",
            data: [
              { object: "embedding", index: 0, embedding: [0.1] },
              { object: "embedding", index: 1, embedding: [0.2] },
            ],
            model: "text-embedding-3-small",
            usage: { prompt_tokens: 10, total_tokens: 10 },
          }),
          { status: 200 }
        )
      );
      const provider = openai({ apiKey: "test-key", fetch: mockFetch });
      const result = await provider.v1.embeddings({
        model: "text-embedding-3-small",
        input: ["Hello", "World"],
      });

      expect(result.data).toHaveLength(2);
    });
  });

  describe("images.generations endpoint", () => {
    it("should send correct URL and JSON body", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            created: 1700000000,
            data: [{ url: "https://oaidalleapiprodscus.blob.core.windows.net/img.png" }],
          }),
          { status: 200 }
        )
      );
      const provider = openai({ apiKey: "test-key", fetch: mockFetch });
      const result = await provider.v1.images.generations({
        prompt: "A white cat",
        model: "gpt-image-1",
        n: 1,
        size: "1024x1024",
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].url).toContain("blob.core.windows.net");
      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("https://api.openai.com/v1/images/generations");
      expect(init.method).toBe("POST");
      const body = JSON.parse(init.body as string);
      expect(body.prompt).toBe("A white cat");
    });
  });

  describe("images.edits endpoint", () => {
    it("should send FormData with image and prompt", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            created: 1700000000,
            data: [{ url: "https://example.com/edited.png" }],
          }),
          { status: 200 }
        )
      );
      const provider = openai({ apiKey: "test-key", fetch: mockFetch });
      const imageBlob = new Blob(["fake-image"], { type: "image/png" });
      const result = await provider.v1.images.edits({
        image: imageBlob,
        prompt: "Add a hat",
        model: "gpt-image-1",
      });

      expect(result.data).toHaveLength(1);
      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("https://api.openai.com/v1/images/edits");
      expect(init.method).toBe("POST");
      expect(init.body).toBeInstanceOf(FormData);
      const form = init.body as FormData;
      expect(form.get("prompt")).toBe("Add a hat");
      expect(form.get("model")).toBe("gpt-image-1");
    });

    it("should support multiple images as array", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ created: 1700000000, data: [{ url: "https://example.com/out.png" }] }),
          { status: 200 }
        )
      );
      const provider = openai({ apiKey: "test-key", fetch: mockFetch });
      const img1 = new Blob(["img1"], { type: "image/png" });
      const img2 = new Blob(["img2"], { type: "image/png" });
      await provider.v1.images.edits({
        image: [img1, img2],
        prompt: "Merge these",
      });

      const form = mockFetch.mock.calls[0][1].body as FormData;
      expect(form.getAll("image")).toHaveLength(2);
    });
  });

  describe("audio.transcriptions endpoint", () => {
    it("should send FormData with file and model", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ text: "Hello, how are you?" }),
          { status: 200 }
        )
      );
      const provider = openai({ apiKey: "test-key", fetch: mockFetch });
      const audioBlob = new Blob(["fake-audio"], { type: "audio/mp3" });
      const result = await provider.v1.audio.transcriptions({
        file: audioBlob,
        model: "gpt-4o-transcribe",
      });

      expect(result.text).toBe("Hello, how are you?");
      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("https://api.openai.com/v1/audio/transcriptions");
      expect(init.method).toBe("POST");
      const form = init.body as FormData;
      expect(form.get("model")).toBe("gpt-4o-transcribe");
    });

    it("should pass optional params (language, prompt, temperature)", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ text: "Bonjour" }), { status: 200 })
      );
      const provider = openai({ apiKey: "test-key", fetch: mockFetch });
      const audioBlob = new Blob(["audio"], { type: "audio/wav" });
      await provider.v1.audio.transcriptions({
        file: audioBlob,
        model: "gpt-4o-transcribe",
        language: "fr",
        prompt: "French audio",
        temperature: 0.2,
        response_format: "json",
      });

      const form = mockFetch.mock.calls[0][1].body as FormData;
      expect(form.get("language")).toBe("fr");
      expect(form.get("prompt")).toBe("French audio");
      expect(form.get("temperature")).toBe("0.2");
      expect(form.get("response_format")).toBe("json");
    });
  });

  describe("audio.translations endpoint", () => {
    it("should send FormData with file and model", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ text: "Hello in English" }),
          { status: 200 }
        )
      );
      const provider = openai({ apiKey: "test-key", fetch: mockFetch });
      const audioBlob = new Blob(["audio"], { type: "audio/mp3" });
      const result = await provider.v1.audio.translations({
        file: audioBlob,
        model: "whisper-1",
      });

      expect(result.text).toBe("Hello in English");
      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("https://api.openai.com/v1/audio/translations");
      expect(init.method).toBe("POST");
      const form = init.body as FormData;
      expect(form.get("model")).toBe("whisper-1");
    });

    it("should pass optional prompt and temperature", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ text: "translated" }), { status: 200 })
      );
      const provider = openai({ apiKey: "test-key", fetch: mockFetch });
      const audioBlob = new Blob(["audio"], { type: "audio/wav" });
      await provider.v1.audio.translations({
        file: audioBlob,
        model: "whisper-1",
        prompt: "context hint",
        temperature: 0.5,
      });

      const form = mockFetch.mock.calls[0][1].body as FormData;
      expect(form.get("prompt")).toBe("context hint");
      expect(form.get("temperature")).toBe("0.5");
    });
  });

  describe("error handling", () => {
    it("should throw OpenAiError on 4xx with parsed error", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ error: { message: "Invalid API key" } }),
          { status: 401 }
        )
      );
      const provider = openai({ apiKey: "bad-key", fetch: mockFetch });

      try {
        await provider.v1.chat.completions({
          model: "gpt-4o",
          messages: [{ role: "user", content: "hi" }],
        });
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(OpenAiError);
        expect((err as OpenAiError).status).toBe(401);
        expect((err as OpenAiError).message).toContain("Invalid API key");
      }
    });

    it("should throw OpenAiError on network failure", async () => {
      const mockFetch = vi
        .fn()
        .mockRejectedValue(new TypeError("fetch failed"));
      const provider = openai({ apiKey: "test-key", fetch: mockFetch });

      try {
        await provider.v1.embeddings({
          model: "text-embedding-3-small",
          input: "test",
        });
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(OpenAiError);
        expect((err as OpenAiError).message).toContain("OpenAI request failed");
      }
    });

    it("should use custom baseURL", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            id: "chat-1",
            object: "chat.completion",
            created: 1700000000,
            model: "gpt-4o",
            choices: [
              {
                index: 0,
                message: { role: "assistant", content: "hi" },
                finish_reason: "stop",
              },
            ],
          }),
          { status: 200 }
        )
      );
      const provider = openai({
        apiKey: "test-key",
        baseURL: "https://custom.openai.com/v1",
        fetch: mockFetch,
      });
      await provider.v1.chat.completions({
        model: "gpt-4o",
        messages: [{ role: "user", content: "hi" }],
      });

      const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("https://custom.openai.com/v1/chat/completions");
    });
  });
});
