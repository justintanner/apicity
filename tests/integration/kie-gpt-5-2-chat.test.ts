import { describe, it, expect } from "vitest";
import {
  createKie,
  KieError,
  KieGpt52ChatCompletionsRequestSchema,
  type KieGpt52ChatCompletionChunk,
  type KieGpt52ChatCompletionsRequest,
  type KieGpt52ChatCompletionsResult,
} from "@apicity/kie";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function assertAsyncIterable(
  value: KieGpt52ChatCompletionsResult
): asserts value is AsyncIterable<KieGpt52ChatCompletionChunk> {
  expect(typeof value).toBe("object");
  expect(value).not.toBeNull();
  expect(Symbol.asyncIterator in value).toBe(true);
}

function parses(body: unknown): boolean {
  return KieGpt52ChatCompletionsRequestSchema.safeParse(body).success;
}

// The request example of the swept catalog document and of
// https://docs.kie.ai/market/chat/gpt-5-2.
const DOCUMENTED_EXAMPLE = {
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
  tools: [{ type: "function", function: { name: "web_search" } }],
  reasoning_effort: "high",
};

// The minimal paid turn of kie-gpt-5-2-chat-live.test.ts. It sends string
// content, and DOCUMENTED_EXAMPLE sends the parts array, so the schema cases
// cover both content forms.
const MINIMAL_TURN: KieGpt52ChatCompletionsRequest = {
  messages: [{ role: "user", content: "Reply with the single word: pong" }],
};

describe("kie gpt 5.2 chat completions", () => {
  it("declares exactly messages, tools and reasoning_effort", () => {
    expect(Object.keys(KieGpt52ChatCompletionsRequestSchema.shape)).toEqual([
      "messages",
      "tools",
      "reasoning_effort",
    ]);
  });

  it("accepts the documented example and the minimal turn", () => {
    expect(parses(DOCUMENTED_EXAMPLE)).toBe(true);
    expect(parses(MINIMAL_TURN)).toBe(true);

    const defaulted = KieGpt52ChatCompletionsRequestSchema.safeParse({
      messages: MINIMAL_TURN.messages,
    });
    expect(defaulted.success).toBe(true);
    if (!defaulted.success) throw new Error("expected success");
    expect(defaulted.data.reasoning_effort).toBe("high");
  });

  it("rejects an empty body, no messages, an unknown role and medium effort", () => {
    expect(parses({})).toBe(false);
    expect(parses({ messages: [] })).toBe(false);
    expect(
      parses({
        messages: [{ role: "robot", content: [{ type: "text", text: "hi" }] }],
      })
    ).toBe(false);
    expect(parses({ ...MINIMAL_TURN, reasoning_effort: "medium" })).toBe(false);
    // REQ-006 item 1 (plan-review AD-1): content needs an item, image_url.url
    // is a URL, the only tool is web_search, and content items are strict.
    expect(parses({ messages: [{ role: "user", content: [] }] })).toBe(false);
    expect(
      parses({
        messages: [
          {
            role: "user",
            content: [{ type: "image_url", image_url: { url: "not a url" } }],
          },
        ],
      })
    ).toBe(false);
    expect(
      parses({
        ...MINIMAL_TURN,
        tools: [{ type: "function", function: { name: "lookup" } }],
      })
    ).toBe(false);
    expect(
      parses({
        messages: [
          { role: "user", content: [{ type: "text", text: "hi", extra: 1 }] },
        ],
      })
    ).toBe(false);
    // String content must not be empty either.
    expect(parses({ messages: [{ role: "user", content: "" }] })).toBe(false);
  });

  it("posts the body unchanged with bearer auth to the gpt-5-2 path", async () => {
    let capturedUrl = "";
    let capturedInit: RequestInit | undefined;
    const provider = createKie({
      apiKey: "kie-gpt-5-2-test-key",
      fetch: async (input, init) => {
        capturedUrl = String(input);
        capturedInit = init;
        return jsonResponse({
          id: "chatcmpl-example-123",
          object: "chat.completion",
          created: 1741569952,
          model: "gpt-5-2",
          choices: [
            {
              index: 0,
              message: {
                role: "assistant",
                content: "pong",
                refusal: null,
                annotations: [],
              },
              logprobs: null,
              finish_reason: "stop",
            },
          ],
          usage: { prompt_tokens: 10, completion_tokens: 50, total_tokens: 60 },
        });
      },
    });

    const result = await provider.gpt52.post.v1.chat.completions(MINIMAL_TURN);

    const headers = new Headers(capturedInit?.headers);
    expect(capturedUrl).toBe("https://api.kie.ai/gpt-5-2/v1/chat/completions");
    expect(capturedInit?.method).toBe("POST");
    expect(headers.get("Authorization")).toBe("Bearer kie-gpt-5-2-test-key");
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(capturedInit?.body).toBe(JSON.stringify(MINIMAL_TURN));
    expect("choices" in result).toBe(true);
    if (!("choices" in result)) throw new Error("expected non-stream result");
    expect(result.model).toBe("gpt-5-2");
    expect(result.choices?.[0]?.message?.content).toBe("pong");
    expect(result.usage?.total_tokens).toBe(60);
  });

  it("returns async chunks for event-stream responses", async () => {
    const provider = createKie({
      apiKey: "kie-gpt-5-2-test-key",
      fetch: async () =>
        new Response(
          [
            'data: {"id":"chunk-1","object":"chat.completion.chunk","choices":[{"index":0,"delta":{"role":"assistant","content":"po"}}]}',
            "",
            'data: {"id":"chunk-1","choices":[{"index":0,"delta":{"content":"ng"},"finish_reason":"stop"}],"usage":{"total_tokens":12}}',
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

    const result = await provider.gpt52.post.v1.chat.completions(MINIMAL_TURN);

    assertAsyncIterable(result);
    const chunks: KieGpt52ChatCompletionChunk[] = [];
    for await (const chunk of result) {
      chunks.push(chunk);
    }

    expect(chunks).toHaveLength(2);
    expect(chunks[0].choices?.[0]?.delta?.content).toBe("po");
    expect(chunks[1].choices?.[0]?.finish_reason).toBe("stop");
    expect(chunks[1].usage?.total_tokens).toBe(12);
  });

  it("rejects an HTTP 200 kie error envelope with the envelope's code", async () => {
    const provider = createKie({
      apiKey: "bad-key",
      fetch: async () =>
        jsonResponse({
          code: 401,
          msg: "Unauthorized – Authentication failed. Please check that your Authorization and Content-Type headers are correctly set.",
        }),
    });

    await expect(
      provider.gpt52.post.v1.chat.completions(MINIMAL_TURN)
    ).rejects.toMatchObject({
      name: "KieError",
      status: 401,
      code: "401",
    } satisfies Partial<KieError>);
  });

  it("rejects a non-2xx HTTP error with its status", async () => {
    const provider = createKie({
      apiKey: "kie-gpt-5-2-test-key",
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
      provider.gpt52.post.v1.chat.completions(MINIMAL_TURN)
    ).rejects.toMatchObject({
      name: "KieError",
      status: 500,
      code: "455",
    } satisfies Partial<KieError>);
  });
});
