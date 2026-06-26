export class ZaiError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "ZaiError";
  }
}

export interface ZaiOptions {
  apiKey?: string;
  baseUrl?: string;
}

export interface ZaiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ZaiChatRequest {
  model: string;
  messages: ZaiMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface ZaiChatChoice {
  index: number;
  message: ZaiMessage;
  finish_reason: string;
}

export interface ZaiChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: ZaiChatChoice[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ZaiProvider {
  api: {
    paas: {
      v4: {
        chat: {
          completions: (
            params: ZaiChatRequest,
            options?: { signal?: AbortSignal }
          ) => Promise<ZaiChatResponse | AsyncIterable<unknown>>;
        };
      };
    };
  };
}
