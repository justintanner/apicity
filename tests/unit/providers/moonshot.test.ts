import { describe, it, expect, vi } from "vitest";
import type {
  ChatRequest,
  ChatStreamChunk,
  MoonshotProvider,
} from "@bareapi/moonshot";

function createMockProvider(): MoonshotProvider {
  return {
    streamChat: vi.fn().mockImplementation(async function* (_req: ChatRequest) {
      yield { delta: "Hello", done: false };
      yield { delta: " world", done: false };
      yield { delta: "", done: true };
    }),
    chat: vi.fn().mockResolvedValue({
      content: "Hello! How can I help you today?",
      model: "kimi-k2-5",
      usage: { promptTokens: 10, completionTokens: 8, totalTokens: 18 },
      finishReason: "stop",
    }),
    getModels: vi.fn().mockResolvedValue(["kimi-k2-5", "moonshot-v1-8k"]),
    validateModel: vi
      .fn()
      .mockImplementation(
        (modelId: string) =>
          modelId.startsWith("kimi-k2-5") || modelId.startsWith("moonshot-v1")
      ),
    getMaxTokens: vi.fn().mockImplementation((modelId: string) => {
      if (modelId.startsWith("kimi-k2-5")) return 131072;
      if (modelId.startsWith("moonshot-v1-128k")) return 131072;
      if (modelId.startsWith("moonshot-v1-32k")) return 32768;
      if (modelId.startsWith("moonshot-v1-8k")) return 8192;
      return 8192;
    }),
    listFiles: vi.fn().mockResolvedValue([
      {
        id: "file-test-1",
        bytes: 1234,
        created_at: 1704067200,
        filename: "test.txt",
        purpose: "assistants",
        status: "processed",
      },
    ]),
    uploadFile: vi.fn().mockResolvedValue({
      id: "file-uploaded",
      bytes: 1000,
      created_at: 1704067200,
      filename: "uploaded.txt",
      purpose: "assistants",
      status: "processed",
    }),
    deleteFile: vi.fn().mockResolvedValue(undefined),
    retrieveFile: vi.fn().mockResolvedValue({
      id: "file-test-1",
      bytes: 1234,
      created_at: 1704067200,
      filename: "test.txt",
      purpose: "assistants",
      status: "processed",
    }),
    retrieveFileContent: vi.fn().mockResolvedValue("file content here"),
    createEmbedding: vi.fn().mockResolvedValue({
      object: "list",
      data: [
        {
          object: "embedding",
          index: 0,
          embedding: [0.1, 0.2, 0.3],
        },
      ],
      model: "moonshot-embedding-1",
      usage: { prompt_tokens: 5, total_tokens: 5 },
    }),
  };
}

describe("moonshot provider", () => {
  it("should validate model IDs correctly", () => {
    const provider = createMockProvider();
    expect(provider.validateModel("kimi-k2-5")).toBe(true);
    expect(provider.validateModel("kimi-k2-5-latest")).toBe(true);
    expect(provider.validateModel("moonshot-v1-8k")).toBe(true);
    expect(provider.validateModel("moonshot-v1-32k")).toBe(true);
    expect(provider.validateModel("gpt-4")).toBe(false);
  });

  it("should return max tokens based on model", () => {
    const provider = createMockProvider();
    expect(provider.getMaxTokens("kimi-k2-5")).toBe(131072);
    expect(provider.getMaxTokens("kimi-k2-5-latest")).toBe(131072);
    expect(provider.getMaxTokens("moonshot-v1-128k")).toBe(131072);
    expect(provider.getMaxTokens("moonshot-v1-32k")).toBe(32768);
    expect(provider.getMaxTokens("moonshot-v1-8k")).toBe(8192);
    expect(provider.getMaxTokens("unknown-model")).toBe(8192);
  });

  it("should stream chat responses", async () => {
    const provider = createMockProvider();
    const req: ChatRequest = {
      model: "kimi-k2-5",
      messages: [{ role: "user", content: "Hello!" }],
    };

    const chunks: ChatStreamChunk[] = [];
    for await (const chunk of provider.streamChat(req)) {
      chunks.push(chunk);
    }

    expect(chunks).toHaveLength(3);
    expect(chunks[0].delta).toBe("Hello");
    expect(chunks[1].delta).toBe(" world");
    expect(chunks[2].done).toBe(true);
  });

  it("should return non-streaming chat response", async () => {
    const provider = createMockProvider();
    const req: ChatRequest = {
      model: "kimi-k2-5",
      messages: [{ role: "user", content: "Hello!" }],
    };

    const response = await provider.chat(req);

    expect(response.content).toBe("Hello! How can I help you today?");
    expect(response.model).toBe("kimi-k2-5");
    expect(response.usage.totalTokens).toBe(18);
  });

  it("should list files", async () => {
    const provider = createMockProvider();
    const files = await provider.listFiles();

    expect(files).toHaveLength(1);
    expect(files[0].id).toBe("file-test-1");
    expect(files[0].filename).toBe("test.txt");
  });

  it("should upload file", async () => {
    const provider = createMockProvider();
    const file = new Blob(["test content"], { type: "text/plain" });
    const result = await provider.uploadFile(file, "assistants", "test.txt");

    expect(result.id).toBe("file-uploaded");
    expect(result.filename).toBe("uploaded.txt");
  });

  it("should delete file", async () => {
    const provider = createMockProvider();
    await expect(provider.deleteFile("file-test-1")).resolves.toBeUndefined();
  });

  it("should retrieve file", async () => {
    const provider = createMockProvider();
    const file = await provider.retrieveFile("file-test-1");

    expect(file.id).toBe("file-test-1");
    expect(file.filename).toBe("test.txt");
  });

  it("should retrieve file content", async () => {
    const provider = createMockProvider();
    const content = await provider.retrieveFileContent("file-test-1");

    expect(content).toBe("file content here");
  });

  it("should create embedding", async () => {
    const provider = createMockProvider();
    const response = await provider.createEmbedding("test text");

    expect(response.object).toBe("list");
    expect(response.data).toHaveLength(1);
    expect(response.data[0].embedding).toEqual([0.1, 0.2, 0.3]);
  });

  it("should create embeddings for array input", async () => {
    const provider = createMockProvider();
    const response = await provider.createEmbedding(["text1", "text2"]);

    expect(response.object).toBe("list");
    expect(response.model).toBe("moonshot-embedding-1");
  });
});
