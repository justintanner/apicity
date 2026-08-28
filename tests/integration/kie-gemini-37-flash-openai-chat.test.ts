import { describe, it, expect } from "vitest";
import {
  createKie,
  KieError,
  KieGemini37FlashOpenaiChatCompletionsRequestSchema,
  type KieGemini37FlashOpenaiChatCompletionChunk,
  type KieGemini37FlashOpenaiChatCompletionsResult,
} from "@apicity/kie";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function assertAsyncIterable(
  value: KieGemini37FlashOpenaiChatCompletionsResult
): asserts value is AsyncIterable<KieGemini37FlashOpenaiChatCompletionChunk> {
  expect(typeof value).toBe("object");
  expect(value).not.toBeNull();
  expect(Symbol.asyncIterator in value).toBe(true);
}

describe("kie gemini 3.7 flash openai chat completions", () => {
  it("validates multimodal googleSearch and custom tool request payloads", () => {
    const valid = KieGemini37FlashOpenaiChatCompletionsRequestSchema.safeParse({
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "What is in this image?" },
            {
              type: "image_url",
              image_url: {
                url: "https://file.aiquickdraw.com/custom-page/akr/section-images/1759055072437dqlsclj2.png",
              },
            },
          ],
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "googleSearch",
          },
        },
      ],
    });

    expect(valid.success).toBe(true);
    if (!valid.success) throw new Error("expected success");
    expect(valid.data.stream).toBe(true);
    expect(valid.data.include_thoughts).toBe(true);
    expect(valid.data.reasoning_effort).toBe("high");

    const customTool =
      KieGemini37FlashOpenaiChatCompletionsRequestSchema.safeParse({
        messages: [
          { role: "user", content: [{ type: "text", text: "Weather?" }] },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "get_current_weather",
              description: "Get the current weather in a given location",
              parameters: {
                type: "object",
                properties: {
                  location: { type: "string" },
                },
                required: ["location"],
              },
            },
          },
        ],
        stream: false,
        include_thoughts: false,
        reasoning_effort: "low",
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "structured_output",
            strict: true,
            schema: {
              type: "object",
              properties: { response: { type: "string" } },
            },
          },
        },
      });
    expect(customTool.success).toBe(true);

    expect(
      KieGemini37FlashOpenaiChatCompletionsRequestSchema.safeParse({
        messages: [],
      }).success
    ).toBe(false);
    expect(
      KieGemini37FlashOpenaiChatCompletionsRequestSchema.safeParse({
        messages: [
          { role: "invalid", content: [{ type: "text", text: "hi" }] },
        ],
      }).success
    ).toBe(false);
    expect(
      KieGemini37FlashOpenaiChatCompletionsRequestSchema.safeParse({
        messages: [{ role: "user", content: [] }],
      }).success
    ).toBe(false);
    expect(
      KieGemini37FlashOpenaiChatCompletionsRequestSchema.safeParse({
        messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
        tools: [{ type: "function" }],
      }).success
    ).toBe(false);
  });

  it("posts requests with bearer auth and preserves usage details", async () => {
    let capturedUrl = "";
    let capturedInit: RequestInit | undefined;
    const provider = createKie({
      apiKey: "kie-gemini-3-7-flash-openai-test-key",
      fetch: async (input, init) => {
        capturedUrl = String(input);
        capturedInit = init;
        return jsonResponse({
          id: "chatcmpl-test",
          object: "chat.completion",
          created: 1768283309,
          model: "gemini-3-7-flash-openai",
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
          credits_consumed: 5,
          usage: {
            prompt_tokens: 1,
            completion_tokens: 20,
            total_tokens: 21,
            completion_tokens_details: {
              reasoning_tokens: 10,
              audio_tokens: 0,
              text_tokens: 10,
            },
          },
        });
      },
    });

    const result = await provider.gemini37FlashOpenai.post.v1.chat.completions({
      messages: [
        {
          role: "developer",
          content: [{ type: "text", text: "Be concise." }],
        },
        {
          role: "user",
          content: [{ type: "text", text: "Say hello." }],
        },
      ],
      stream: false,
      include_thoughts: false,
      reasoning_effort: "low",
    });

    const headers = new Headers(capturedInit?.headers);
    const body = JSON.parse(String(capturedInit?.body)) as {
      stream?: boolean;
      include_thoughts?: boolean;
      reasoning_effort?: string;
      messages?: unknown[];
    };

    expect(capturedUrl).toBe(
      "https://api.kie.ai/gemini-3-7-flash-openai/v1/chat/completions"
    );
    expect(capturedInit?.method).toBe("POST");
    expect(headers.get("Authorization")).toBe(
      "Bearer kie-gemini-3-7-flash-openai-test-key"
    );
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(body.stream).toBe(false);
    expect(body.include_thoughts).toBe(false);
    expect(body.reasoning_effort).toBe("low");
    expect(body.messages).toHaveLength(2);
    expect("choices" in result).toBe(true);
    if (!("choices" in result)) throw new Error("expected non-stream result");
    expect(result.model).toBe("gemini-3-7-flash-openai");
    expect(result.credits_consumed).toBe(5);
    expect(result.usage?.completion_tokens_details?.reasoning_tokens).toBe(10);
  });

  it("returns async chunks for event-stream responses", async () => {
    const provider = createKie({
      apiKey: "kie-gemini-3-7-flash-openai-test-key",
      fetch: async () =>
        new Response(
          [
            'data: {"id":"chunk-1","object":"chat.completion.chunk","choices":[{"index":0,"delta":{"role":"assistant","content":"Hello"}}]}',
            "",
            'data: {"id":"chunk-1","choices":[{"index":0,"delta":{"content":" there"},"finish_reason":"stop"}],"usage":{"total_tokens":12}}',
            "",
            "data: [DONE]",
            "",
          ].join("\n"),
          {
            status: 200,
            headers: { "content-type": "text/event-stream" },
          }
        ),
    });

    const result = await provider.gemini37FlashOpenai.post.v1.chat.completions({
      messages: [{ role: "user", content: [{ type: "text", text: "Hi" }] }],
      stream: true,
    });

    assertAsyncIterable(result);
    const chunks: KieGemini37FlashOpenaiChatCompletionChunk[] = [];
    for await (const chunk of result) {
      chunks.push(chunk);
    }

    expect(chunks).toHaveLength(2);
    expect(chunks[0].choices?.[0]?.delta?.content).toBe("Hello");
    expect(chunks[1].choices?.[0]?.finish_reason).toBe("stop");
    expect(chunks[1].usage?.total_tokens).toBe(12);
  });

  it("surfaces openai-style error envelopes with status and type", async () => {
    const provider = createKie({
      apiKey: "bad-key",
      fetch: async () =>
        jsonResponse(
          {
            error: {
              message: "Invalid API key",
              type: "authentication_error",
            },
          },
          401
        ),
    });

    await expect(
      provider.gemini37FlashOpenai.post.v1.chat.completions({
        messages: [
          { role: "user", content: [{ type: "text", text: "Hello" }] },
        ],
      })
    ).rejects.toMatchObject({
      name: "KieError",
      status: 401,
      code: "authentication_error",
    } satisfies Partial<KieError>);
  });

  it("surfaces kie status-code error envelopes with status and code", async () => {
    const provider = createKie({
      apiKey: "bad-key",
      fetch: async () =>
        jsonResponse(
          {
            code: 455,
            msg: "No available channels",
            data: null,
          },
          500
        ),
    });

    await expect(
      provider.gemini37FlashOpenai.post.v1.chat.completions({
        messages: [
          { role: "user", content: [{ type: "text", text: "Hello" }] },
        ],
      })
    ).rejects.toMatchObject({
      name: "KieError",
      status: 500,
      code: "455",
    } satisfies Partial<KieError>);
  });

  it("surfaces HTTP 200 kie error envelopes as KieError", async () => {
    const provider = createKie({
      apiKey: "bad-key",
      fetch: async () =>
        jsonResponse({
          code: 401,
          msg: "Unauthorized – Authentication failed.",
        }),
    });

    await expect(
      provider.gemini37FlashOpenai.post.v1.chat.completions({
        messages: [
          { role: "user", content: [{ type: "text", text: "Hello" }] },
        ],
        stream: false,
      })
    ).rejects.toMatchObject({
      name: "KieError",
      status: 401,
      code: "401",
    } satisfies Partial<KieError>);
  });
});
