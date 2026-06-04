import { describe, it, expect } from "vitest";
import { createXai, XaiError } from "../../packages/provider/xai/src/index";

describe("xai deferred chat completion", () => {
  const completedResponse = {
    id: "3f4ddfca-b997-3bd4-80d4-8112278a1508",
    object: "chat.completion",
    created: 1752077400,
    model: "grok-3-fast",
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: "Hello! How can I help you today?",
          refusal: null,
        },
        finish_reason: "stop",
      },
    ],
    usage: {
      prompt_tokens: 10,
      completion_tokens: 8,
      total_tokens: 18,
    },
    system_fingerprint: "fp_abc123",
  };

  it("should return ready:false for a pending request (202)", async () => {
    const provider = createXai({
      apiKey: "sk-test-key",
      fetch: async () =>
        new Response(null, { status: 202, statusText: "Accepted" }),
    });

    const result =
      await provider.get.v1.chat.deferredCompletion("pending-request-id");
    expect(result.ready).toBe(false);
    expect(result.data).toBeNull();
  });

  it("should return ready:true with data for a completed request (200)", async () => {
    const provider = createXai({
      apiKey: "sk-test-key",
      fetch: async () =>
        new Response(JSON.stringify(completedResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    });

    const result = await provider.get.v1.chat.deferredCompletion(
      "completed-request-id"
    );
    expect(result.ready).toBe(true);
    expect(result.data).not.toBeNull();
    expect(result.data?.id).toBe("3f4ddfca-b997-3bd4-80d4-8112278a1508");
    expect(result.data?.choices[0].message.content).toBe(
      "Hello! How can I help you today?"
    );
    expect(result.data?.usage?.total_tokens).toBe(18);
  });

  it("should throw XaiError on error responses", async () => {
    const provider = createXai({
      apiKey: "sk-test-key",
      fetch: async () =>
        new Response(
          JSON.stringify({ error: { message: "Request not found" } }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        ),
    });

    await expect(
      provider.get.v1.chat.deferredCompletion("nonexistent-id")
    ).rejects.toThrow(XaiError);
  });

  it("should send correct URL with encoded request_id", async () => {
    let capturedUrl = "";
    const provider = createXai({
      apiKey: "sk-test-key",
      fetch: async (input: RequestInfo | URL) => {
        capturedUrl = String(input);
        return new Response(null, { status: 202 });
      },
    });

    await provider.get.v1.chat.deferredCompletion("req-123/abc");
    expect(capturedUrl).toContain("/chat/deferred-completion/req-123%2Fabc");
  });

  it("should send Authorization header", async () => {
    let capturedHeaders: Record<string, string> = {};
    const provider = createXai({
      apiKey: "sk-my-api-key",
      fetch: async (_input: RequestInfo | URL, init?: RequestInit) => {
        capturedHeaders = Object.fromEntries(
          Object.entries(init?.headers ?? {})
        );
        return new Response(null, { status: 202 });
      },
    });

    await provider.get.v1.chat.deferredCompletion("some-id");
    expect(capturedHeaders["Authorization"]).toBe("Bearer sk-my-api-key");
  });

  it("should use GET method", async () => {
    let capturedMethod = "";
    const provider = createXai({
      apiKey: "sk-test-key",
      fetch: async (_input: RequestInfo | URL, init?: RequestInit) => {
        capturedMethod = init?.method ?? "";
        return new Response(null, { status: 202 });
      },
    });

    await provider.get.v1.chat.deferredCompletion("some-id");
    expect(capturedMethod).toBe("GET");
  });

  it("should accept deferred:true in chat completions request type", async () => {
    let capturedBody = "";
    const provider = createXai({
      apiKey: "sk-test-key",
      fetch: async (_input: RequestInfo | URL, init?: RequestInit) => {
        capturedBody = (init?.body as string) ?? "";
        return new Response(JSON.stringify({ request_id: "req-abc123" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    });

    await provider.post.v1.chat.completions({
      model: "grok-3-fast",
      messages: [{ role: "user", content: "Hello" }],
      deferred: true,
    });

    const body = JSON.parse(capturedBody);
    expect(body.deferred).toBe(true);
  });
});
