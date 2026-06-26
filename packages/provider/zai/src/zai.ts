import { ZaiError, ZaiOptions, ZaiProvider, ZaiChatRequest } from "./types";
import { ZaiChatRequestSchema } from "./zod";

export function createZai(options: ZaiOptions = {}): ZaiProvider {
  const apiKey = options.apiKey || process.env.ZAI_API_KEY;
  if (!apiKey) {
    throw new ZaiError("ZAI_API_KEY is required");
  }

  const baseUrl = options.baseUrl || "https://api.z.ai";

  const request = async (path: string, init?: RequestInit) => {
    const url = new URL(path, baseUrl);
    const headers = new Headers(init?.headers);
    if (!headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${apiKey}`);
    }
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    try {
      const response = await fetch(url.toString(), { ...init, headers });
      if (!response.ok) {
        let errStr = response.statusText;
        try {
          const errBody = await response.json();
          errStr = JSON.stringify(errBody);
        } catch {}
        throw new Error(`HTTP ${response.status}: ${errStr}`);
      }
      return response;
    } catch (error) {
      throw new ZaiError(
        `Failed to fetch ${url.toString()}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error
      );
    }
  };

  return {
    api: {
      paas: {
        v4: {
          chat: {
            // POST https://api.z.ai/api/paas/v4/chat/completions
            // Docs: https://docs.z.ai/api-reference/llm/chat-completion
            completions: Object.assign(
              async (
                params: ZaiChatRequest,
                opts?: { signal?: AbortSignal }
              ) => {
                const res = await request("/api/paas/v4/chat/completions", {
                  method: "POST",
                  body: JSON.stringify(params),
                  signal: opts?.signal,
                });

                if (params.stream) {
                  throw new ZaiError(
                    "Streaming not implemented in basic endpoint yet"
                  );
                }
                return res.json();
              },
              { schema: ZaiChatRequestSchema }
            ),
          },
        },
      },
    },
  };
}
