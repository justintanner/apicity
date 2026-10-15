import { describe, it, expect } from "vitest";
import {
  createKie,
  KieError,
  KieGemini4ArgonOpenaiChatCompletionsRequestSchema,
  type KieGemini4ArgonOpenaiChatCompletionChunk,
  type KieGemini4ArgonOpenaiChatCompletionsResult,
} from "@apicity/kie";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function assertAsyncIterable(
  value: KieGemini4ArgonOpenaiChatCompletionsResult
): asserts value is AsyncIterable<KieGemini4ArgonOpenaiChatCompletionChunk> {
  expect(typeof value).toBe("object");
  expect(value).not.toBeNull();
  expect(Symbol.asyncIterator in value).toBe(true);
}

describe("kie gemini 4 argon openai chat completions", () => {
  it("accepts the documented example and leaves undocumented defaults unset", () => {
    // The request example from docs.kie.ai/market/gemini/gemini-4-argon-openai.
    const documented =
      KieGemini4ArgonOpenaiChatCompletionsRequestSchema.safeParse({
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
        tools: [{ type: "function", function: { name: "googleSearch" } }],
        stream: true,
        include_thoughts: true,
        reasoning_effort: "high",
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "structured_output",
            strict: true,
            schema: {
              type: "object",
              properties: { response: { type: "string" } },
              required: ["response"],
            },
          },
        },
      });
    expect(documented.success).toBe(true);

    const minimal = KieGemini4ArgonOpenaiChatCompletionsRequestSchema.safeParse(
      {
        messages: [{ role: "user", content: [{ type: "text", text: "Hi" }] }],
      }
    );
    expect(minimal.success).toBe(true);
    if (!minimal.success) throw new Error("expected success");
    // The docs default stream to false and declare no other default.
    expect(minimal.data.stream).toBe(false);
    expect(minimal.data.include_thoughts).toBeUndefined();
    expect(minimal.data.reasoning_effort).toBeUndefined();
    expect("model" in minimal.data).toBe(false);
  });

  it("accepts custom function tools beside the documented roles", () => {
    const customTool =
      KieGemini4ArgonOpenaiChatCompletionsRequestSchema.safeParse({
        messages: [
          { role: "developer", content: [{ type: "text", text: "Be brief." }] },
          { role: "system", content: [{ type: "text", text: "Use tools." }] },
          { role: "user", content: [{ type: "text", text: "Weather?" }] },
          { role: "assistant", content: [{ type: "text", text: "Checking." }] },
          { role: "tool", content: [{ type: "text", text: "Sunny, 21C" }] },
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
                  unit: { type: "string", enum: ["celsius", "fahrenheit"] },
                },
                required: ["location"],
              },
            },
          },
        ],
        stream: false,
        include_thoughts: false,
        reasoning_effort: "low",
      });
    expect(customTool.success).toBe(true);
  });

  it("rejects payloads outside the documented request body", () => {
    const parses = (payload: unknown) =>
      KieGemini4ArgonOpenaiChatCompletionsRequestSchema.safeParse(payload)
        .success;

    expect(parses({ messages: [] })).toBe(false);
    expect(
      parses({
        messages: [
          { role: "invalid", content: [{ type: "text", text: "hi" }] },
        ],
      })
    ).toBe(false);
    expect(parses({ messages: [{ role: "user", content: [] }] })).toBe(false);
    // The docs define content as an array of text and image_url parts only.
    expect(parses({ messages: [{ role: "user", content: "hi" }] })).toBe(false);
    expect(
      parses({
        messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
        reasoning_effort: "medium",
      })
    ).toBe(false);
    expect(
      parses({
        messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
        tools: [{ type: "function" }],
      })
    ).toBe(false);
  });

  it("posts requests with bearer auth and preserves usage details", async () => {
    let capturedUrl = "";
    let capturedInit: RequestInit | undefined;
    const provider = createKie({
      apiKey: "kie-gemini-4-argon-openai-test-key",
      fetch: async (input, init) => {
        capturedUrl = String(input);
        capturedInit = init;
        // Shaped like the recorded kie/gemini-4-argon-openai-chat answer,
        // which carries no `model` key.
        return jsonResponse({
          choices: [
            {
              finish_reason: "stop",
              index: 0,
              message: { content: "pong", role: "assistant" },
            },
          ],
          created: 1792025349,
          credits_consumed: 0.03,
          id: "chatcmpl-test",
          object: "chat.completion",
          usage: {
            completion_tokens: 5,
            completion_tokens_details: { reasoning_tokens: 0 },
            prompt_tokens: 170,
            total_tokens: 175,
          },
        });
      },
    });

    const result = await provider.gemini4ArgonOpenai.post.v1.chat.completions({
      messages: [
        {
          role: "developer",
          content: [{ type: "text", text: "Be concise." }],
        },
        {
          role: "user",
          content: [{ type: "text", text: "Reply with the single word: pong" }],
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
      "https://api.kie.ai/gemini-4-argon-openai/v1/chat/completions"
    );
    expect(capturedInit?.method).toBe("POST");
    expect(headers.get("Authorization")).toBe(
      "Bearer kie-gemini-4-argon-openai-test-key"
    );
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(body.stream).toBe(false);
    expect(body.include_thoughts).toBe(false);
    expect(body.reasoning_effort).toBe("low");
    expect(body.messages).toHaveLength(2);
    expect("choices" in result).toBe(true);
    if (!("choices" in result)) throw new Error("expected non-stream result");
    expect(result.choices?.[0]?.message?.content).toBe("pong");
    expect(result.credits_consumed).toBe(0.03);
    expect(result.usage?.total_tokens).toBe(175);
    expect(result.usage?.completion_tokens_details?.reasoning_tokens).toBe(0);
  });

  it("returns async chunks for event-stream responses", async () => {
    const provider = createKie({
      apiKey: "kie-gemini-4-argon-openai-test-key",
      fetch: async () =>
        new Response(
          [
            'data: {"id":"chunk-1","object":"chat.completion.chunk","choices":[{"index":0,"delta":{"role":"assistant","content":"Hello"}}]}',
            "",
            'data: {"id":"chunk-1","object":"chat.completion.chunk","choices":[{"index":0,"delta":{"content":" there"},"finish_reason":"stop"}]}',
            "",
            'data: {"id":"chunk-1","object":"chat.completion.chunk","choices":[],"usage":{"prompt_tokens":4,"completion_tokens":8,"total_tokens":12},"credits_consumed":0.01}',
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

    const result = await provider.gemini4ArgonOpenai.post.v1.chat.completions({
      messages: [{ role: "user", content: [{ type: "text", text: "Hi" }] }],
      stream: true,
    });

    assertAsyncIterable(result);
    const chunks: KieGemini4ArgonOpenaiChatCompletionChunk[] = [];
    for await (const chunk of result) {
      chunks.push(chunk);
    }

    expect(chunks).toHaveLength(3);
    expect(chunks[0].choices?.[0]?.delta?.content).toBe("Hello");
    expect(chunks[1].choices?.[0]?.finish_reason).toBe("stop");
    expect(chunks[2].usage?.total_tokens).toBe(12);
    expect(chunks[2].credits_consumed).toBe(0.01);
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
      provider.gemini4ArgonOpenai.post.v1.chat.completions({
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
      provider.gemini4ArgonOpenai.post.v1.chat.completions({
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
          code: 402,
          msg: "Insufficient Credits",
        }),
    });

    await expect(
      provider.gemini4ArgonOpenai.post.v1.chat.completions({
        messages: [
          { role: "user", content: [{ type: "text", text: "Hello" }] },
        ],
        stream: false,
      })
    ).rejects.toMatchObject({
      name: "KieError",
      status: 402,
      code: "402",
      message: "Kie Gemini 4 Argon OpenAI API error 402: Insufficient Credits",
    } satisfies Partial<KieError>);
  });
});
