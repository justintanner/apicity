import { describe, expect, it } from "vitest";
import {
  createKie,
  KieError,
  type KieResponsesStreamEvent,
} from "@apicity/kie";

interface CapturedRequest {
  input: RequestInfo | URL;
  init?: RequestInit;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function sseResponse(events: string[]): Response {
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        for (const event of events) {
          controller.enqueue(encoder.encode(`data: ${event}\n\n`));
        }
        controller.close();
      },
    }),
    {
      headers: { "content-type": "text/event-stream" },
    }
  );
}

describe("kie grok 4.5 responses", () => {
  it("maps multimodal web-search requests to POST /grok/v1/responses", async () => {
    let captured: CapturedRequest | undefined;
    const provider = createKie({
      apiKey: "sk-test-key",
      fetch: async (input, init) => {
        captured = { input, init };
        return jsonResponse({
          id: "resp_test",
          status: "completed",
          output: [
            {
              type: "message",
              role: "assistant",
              content: [{ type: "output_text", text: "It is a test image." }],
            },
          ],
          usage: {
            input_tokens: 12,
            output_tokens: 6,
            total_tokens: 18,
          },
          credits_consumed: 0.1,
        });
      },
    });

    const result = await provider.post.grok.v1.responses({
      model: "grok-4-5",
      stream: false,
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: "What is in this image?" },
            {
              type: "input_image",
              image_url:
                "https://file.aiquickdraw.com/custom-page/akr/section-images/1759055072437dqlsclj2.png",
            },
            {
              type: "input_file",
              file_url: "https://example.com/context.pdf",
            },
          ],
        },
      ],
      tools: [{ type: "web_search" }],
      reasoning: { effort: "high" },
    });

    if (!captured) throw new Error("expected fetch to be called");
    expect(String(captured.input)).toBe("https://api.kie.ai/grok/v1/responses");
    expect(captured.init?.method).toBe("POST");

    const headers = new Headers(captured.init?.headers);
    expect(headers.get("authorization")).toBe("Bearer sk-test-key");
    expect(headers.get("content-type")).toBe("application/json");

    const body = JSON.parse(String(captured.init?.body)) as unknown;
    expect(body).toMatchObject({
      model: "grok-4-5",
      stream: false,
      tools: [{ type: "web_search" }],
      reasoning: { effort: "high" },
    });
    expect(result.status).toBe("completed");
    expect(result.output?.[0]?.type).toBe("message");
    expect(result.usage?.total_tokens).toBe(18);
    expect(result.credits_consumed).toBe(0.1);
  });

  it("maps function tools with tool_choice auto", async () => {
    let capturedBody: unknown;
    const provider = createKie({
      apiKey: "sk-test-key",
      fetch: async (_input, init) => {
        capturedBody = JSON.parse(String(init?.body)) as unknown;
        return jsonResponse({
          id: "resp_function",
          status: "completed",
          output: [
            {
              type: "function_call",
              call_id: "call_1",
              name: "get_weather",
              arguments: '{"location":"Austin"}',
            },
          ],
        });
      },
    });

    await provider.post.grok.v1.responses({
      model: "grok-4-5",
      input: "Use the tool.",
      tools: [
        {
          type: "function",
          name: "get_weather",
          description: "Return current weather for a city.",
          parameters: {
            type: "object",
            properties: {
              location: { type: "string" },
            },
            required: ["location"],
          },
        },
      ],
      tool_choice: "auto",
    });

    expect(capturedBody).toMatchObject({
      model: "grok-4-5",
      input: "Use the tool.",
      tool_choice: "auto",
      tools: [{ type: "function", name: "get_weather" }],
    });
  });

  it("rejects mixed web_search and function tools in schema metadata", () => {
    const provider = createKie({ apiKey: "sk-test-key" });
    const parsed = provider.post.grok.v1.responses.schema.safeParse({
      model: "grok-4-5",
      input: "Search and call a function.",
      tools: [
        { type: "web_search" },
        {
          type: "function",
          name: "get_weather",
          description: "Return current weather for a city.",
          parameters: {},
        },
      ],
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.message).toContain("mutually exclusive");
    }
  });

  it("parses streaming responses events", async () => {
    const provider = createKie({
      apiKey: "sk-test-key",
      fetch: async (_input, init) => {
        const headers = new Headers(init?.headers);
        expect(headers.get("accept")).toBe("text/event-stream");
        return sseResponse([
          JSON.stringify({
            type: "response.output_text.delta",
            delta: "Hel",
          }),
          JSON.stringify({
            type: "response.function_call_arguments.delta",
            delta: '{"city"',
          }),
          JSON.stringify({
            type: "response.completed",
            response: { status: "completed" },
          }),
          "[DONE]",
        ]);
      },
    });

    const stream = await provider.post.grok.v1.responses({
      model: "grok-4-5",
      input: "Stream a response.",
      stream: true,
    });
    const events: KieResponsesStreamEvent[] = [];
    for await (const event of stream) {
      events.push(event);
    }

    expect(events).toEqual([
      { type: "response.output_text.delta", delta: "Hel" },
      {
        type: "response.function_call_arguments.delta",
        delta: '{"city"',
      },
      {
        type: "response.completed",
        response: { status: "completed" },
      },
      { type: "done" },
    ]);
  });

  it("surfaces upstream error payloads with KieError code", async () => {
    const provider = createKie({
      apiKey: "sk-test-key",
      fetch: async () =>
        jsonResponse(
          {
            error: {
              message: "Invalid bearer token.",
              type: "authentication_error",
            },
          },
          401
        ),
    });

    await expect(
      provider.post.grok.v1.responses({
        model: "grok-4-5",
        input: "Hello.",
      })
    ).rejects.toMatchObject({
      name: "KieError",
      status: 401,
      code: "authentication_error",
      message: "Kie Responses API error 401: Invalid bearer token.",
    } satisfies Partial<KieError>);
  });
});
