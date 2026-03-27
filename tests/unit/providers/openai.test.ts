// Tests for the openai provider
import { describe, it, expect, vi } from "vitest";
import { openai } from "../../../packages/provider/openai/src";

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
  });
});
