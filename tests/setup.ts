process.env.NODE_ENV = "test";

process.env.MOONSHOT_API_KEY = "sk-test-key";
process.env.KIE_API_KEY = "sk-test-key";

export const mockMoonshotResponse = {
  id: "test-id",
  object: "chat.completion",
  created: 1704067200,
  model: "kimi-k2-5",
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
    prompt_tokens: 10,
    completion_tokens: 8,
    total_tokens: 18,
  },
};

export const mockKieResponse = {
  code: 200,
  msg: "success",
  data: {
    taskId: "test-task-id-123",
  },
};

export const mockFileObject = {
  id: "file-test-id",
  bytes: 1234,
  created_at: 1704067200,
  filename: "test.txt",
  purpose: "assistants",
  status: "processed" as const,
};

export const mockEmbeddingResponse = {
  object: "list" as const,
  data: [
    {
      object: "embedding" as const,
      index: 0,
      embedding: [0.1, 0.2, 0.3, 0.4, 0.5],
    },
  ],
  model: "moonshot-embedding-1",
  usage: {
    prompt_tokens: 5,
    total_tokens: 5,
  },
};
