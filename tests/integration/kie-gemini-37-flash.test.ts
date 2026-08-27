import { describe, it, expect } from "vitest";
import {
  createKie,
  KieError,
  KieGemini37FlashStreamGenerateContentRequestSchema,
  type KieGemini37FlashStreamGenerateContentChunk,
  type KieGemini37FlashStreamGenerateContentResult,
} from "@apicity/kie";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function assertAsyncIterable(
  value: KieGemini37FlashStreamGenerateContentResult
): asserts value is AsyncIterable<KieGemini37FlashStreamGenerateContentChunk> {
  expect(typeof value).toBe("object");
  expect(value).not.toBeNull();
  expect(Symbol.asyncIterator in value).toBe(true);
}

describe("kie gemini 3.7 flash", () => {
  it("validates multimodal tools and thinking request payloads", () => {
    const valid = KieGemini37FlashStreamGenerateContentRequestSchema.safeParse({
      stream: true,
      contents: [
        {
          role: "user",
          parts: [
            { text: "Describe these inputs." },
            {
              inline_data: {
                mime_type: "image/png",
                data: "iVBORw0KGgo=",
              },
            },
            {
              file_data: {
                mime_type: "application/pdf",
                file_uri: "gs://example-bucket/file.pdf",
              },
            },
          ],
        },
      ],
      tools: [
        { googleSearch: {} },
        {
          functionDeclarations: [
            {
              name: "get_weather_forecast",
              description: "Get the weather forecast for a given location",
              parameters: {
                type: "OBJECT",
                properties: {
                  location: {
                    type: "STRING",
                    description: "The city name, e.g. Beijing",
                  },
                },
                required: ["location"],
              },
            },
          ],
        },
      ],
      generationConfig: {
        thinkingConfig: {
          includeThoughts: true,
          thinkingLevel: "high",
        },
      },
    });

    expect(valid.success).toBe(true);

    expect(
      KieGemini37FlashStreamGenerateContentRequestSchema.safeParse({
        contents: [],
      }).success
    ).toBe(false);
    expect(
      KieGemini37FlashStreamGenerateContentRequestSchema.safeParse({
        contents: [{ role: "assistant", parts: [{ text: "nope" }] }],
      }).success
    ).toBe(false);
    expect(
      KieGemini37FlashStreamGenerateContentRequestSchema.safeParse({
        contents: [{ role: "user", parts: [{ text: "hi" }] }],
        tools: [{ googleSearch: { query: "not allowed" } }],
      }).success
    ).toBe(false);
  });

  it("posts non-streaming requests with X-Goog-Api-Key auth", async () => {
    let capturedUrl = "";
    let capturedInit: RequestInit | undefined;
    const provider = createKie({
      apiKey: "kie-gemini-test-key",
      fetch: async (input, init) => {
        capturedUrl = String(input);
        capturedInit = init;
        return jsonResponse({
          candidates: [
            {
              content: {
                role: "model",
                parts: [
                  {
                    functionCall: {
                      args: { location: "Beijing" },
                      name: "get_weather_forecast",
                      id: "gp737gml",
                    },
                    thoughtSignature: "Es8CCswCAb4example",
                  },
                ],
              },
              finishReason: "STOP",
            },
          ],
          modelVersion: "gemini-3-7-flash",
          usageMetadata: {
            candidatesTokenCount: 18,
            thoughtsTokenCount: 55,
            totalTokenCount: 325,
            promptTokenCount: 252,
          },
          credits_consumed: 0.01,
          responseId: "xRS0aZC5BNHVz7IPuaO42Qk",
        });
      },
    });

    const result =
      await provider.gemini.post.v1.models.gemini37Flash.streamGenerateContent({
        stream: false,
        contents: [
          {
            role: "user",
            parts: [{ text: "What is the weather in Beijing today?" }],
          },
        ],
      });

    const headers = new Headers(capturedInit?.headers);
    const body = JSON.parse(String(capturedInit?.body)) as {
      stream?: boolean;
      contents?: unknown[];
    };

    expect(capturedUrl).toBe(
      "https://api.kie.ai/gemini/v1/models/gemini-3-7-flash:streamGenerateContent"
    );
    expect(capturedInit?.method).toBe("POST");
    expect(headers.get("X-Goog-Api-Key")).toBe("kie-gemini-test-key");
    expect(headers.get("Authorization")).toBeNull();
    expect(body.stream).toBe(false);
    expect(body.contents).toHaveLength(1);
    expect("candidates" in result).toBe(true);
    if (!("candidates" in result))
      throw new Error("expected non-stream result");
    expect(
      result.candidates?.[0]?.content?.parts?.[0]?.functionCall?.name
    ).toBe("get_weather_forecast");
    expect(result.candidates?.[0]?.content?.parts?.[0]?.thoughtSignature).toBe(
      "Es8CCswCAb4example"
    );
    expect(result.usageMetadata?.totalTokenCount).toBe(325);
    expect(result.credits_consumed).toBe(0.01);
    expect(result.responseId).toBe("xRS0aZC5BNHVz7IPuaO42Qk");
  });

  it("returns async chunks for event-stream responses", async () => {
    const provider = createKie({
      apiKey: "kie-gemini-test-key",
      fetch: async () =>
        new Response(
          [
            'data: {"candidates":[{"content":{"role":"model","parts":[{"text":"Hello"}]}}]}',
            "",
            'data: {"usageMetadata":{"totalTokenCount":12},"modelVersion":"gemini-3-7-flash"}',
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

    const result =
      await provider.gemini.post.v1.models.gemini37Flash.streamGenerateContent({
        stream: true,
        contents: [{ role: "user", parts: [{ text: "Say hello." }] }],
      });

    assertAsyncIterable(result);
    const chunks: KieGemini37FlashStreamGenerateContentChunk[] = [];
    for await (const chunk of result) {
      chunks.push(chunk);
    }

    expect(chunks).toHaveLength(2);
    expect(chunks[0].candidates?.[0]?.content?.parts?.[0]?.text).toBe("Hello");
    expect(chunks[1].usageMetadata?.totalTokenCount).toBe(12);
  });

  it("surfaces Gemini error envelopes with status and type", async () => {
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
      provider.gemini.post.v1.models.gemini37Flash.streamGenerateContent({
        contents: [{ role: "user", parts: [{ text: "Hello" }] }],
      })
    ).rejects.toMatchObject({
      name: "KieError",
      status: 401,
      code: "authentication_error",
    } satisfies Partial<KieError>);
  });

  it("surfaces HTTP 200 Kie error envelopes as KieError", async () => {
    const provider = createKie({
      apiKey: "bad-key",
      fetch: async () =>
        jsonResponse({
          code: 401,
          msg: "Unauthorized – Authentication failed. Please check that your Authorization and Content-Type headers are correctly set.",
        }),
    });

    await expect(
      provider.gemini.post.v1.models.gemini37Flash.streamGenerateContent({
        stream: false,
        contents: [{ role: "user", parts: [{ text: "ping" }] }],
      })
    ).rejects.toMatchObject({
      name: "KieError",
      status: 401,
      code: "401",
    } satisfies Partial<KieError>);
  });
});
