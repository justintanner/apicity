// Set test environment
process.env.NODE_ENV = "test";

// Mock API keys
process.env.KIMI25_API_KEY = "sk-test-key";
process.env.KEI_AI_API_KEY = "sk-test-key";

// Export mock responses for reuse
export const mockKimi25Response = {
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

export const mockKeiAIResponse = {
  code: 200,
  msg: "success",
  data: {
    taskId: "test-task-id-123",
  },
};
