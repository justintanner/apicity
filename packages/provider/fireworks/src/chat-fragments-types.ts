// AUTO-GENERATED from shared/provider-src/chat-fragments-types.ts; do not edit.
// Edit the canonical file and run `pnpm run gen:shared`.
export interface ChatToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface ChatUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatChoice {
  index: number;
  message: {
    role: string;
    content: string | null;
    tool_calls?: ChatToolCall[];
  };
  finish_reason: string;
}
