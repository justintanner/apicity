process.env.NODE_ENV = "test";

process.env.KIMI_CODING_API_KEY = "sk-test-key";
process.env.KIE_API_KEY = "sk-test-key";
process.env.XAI_API_KEY = "sk-test-key";
process.env.OPENAI_API_KEY = "sk-test-key";

export const mockKimiCodingResponse = {
  id: "test-id",
  type: "message",
  role: "assistant",
  content: [
    {
      type: "text",
      text: "Hello! How can I help you today?",
    },
  ],
  model: "k2p5",
  stop_reason: "end_turn",
  usage: {
    input_tokens: 10,
    output_tokens: 8,
  },
};

export const mockKieResponse = {
  code: 200,
  msg: "success",
  data: {
    taskId: "test-task-id-123",
  },
};
