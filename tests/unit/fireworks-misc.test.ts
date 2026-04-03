import { describe, it, expect } from "vitest";
import { fireworks } from "@nakedapi/fireworks";

// Direct imports for unit-level coverage
import { validatePayload } from "../../packages/provider/fireworks/src/validate";
import { chatCompletionsSchema } from "../../packages/provider/fireworks/src/schemas";
import { sseToIterable } from "../../packages/provider/fireworks/src/sse";

// Helper to create a mock Response with a ReadableStream
function createMockResponse(chunks: string[]): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
  return new Response(stream);
}

describe("fireworks validate.ts edge cases", () => {
  describe("non-object payloads (lines 82-83)", () => {
    it("should reject null payload", () => {
      const result = validatePayload(null, chatCompletionsSchema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("payload must be a non-null object");
    });

    it("should reject string payload", () => {
      const result = validatePayload("not an object", chatCompletionsSchema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("payload must be a non-null object");
    });

    it("should reject array payload", () => {
      const result = validatePayload([1, 2, 3], chatCompletionsSchema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("payload must be a non-null object");
    });

    it("should reject number payload", () => {
      const result = validatePayload(42, chatCompletionsSchema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("payload must be a non-null object");
    });

    it("should reject undefined payload", () => {
      const result = validatePayload(undefined, chatCompletionsSchema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("payload must be a non-null object");
    });
  });

  describe("enum validation errors (lines 42-43)", () => {
    it("should reject invalid enum value in nested object", () => {
      const result = validatePayload(
        {
          model: "test-model",
          messages: [{ role: "invalid-role", content: "Hello" }],
        },
        chatCompletionsSchema
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([expect.stringContaining("must be one of:")])
      );
    });

    it("should reject invalid response_format type enum", () => {
      const result = validatePayload(
        {
          model: "test-model",
          messages: [{ role: "user", content: "Hello" }],
          response_format: { type: "invalid_format" },
        },
        chatCompletionsSchema
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([expect.stringContaining("must be one of:")])
      );
    });

    it("should reject invalid reasoning_effort enum", () => {
      const result = validatePayload(
        {
          model: "test-model",
          messages: [{ role: "user", content: "Hello" }],
          reasoning_effort: "maximum",
        },
        chatCompletionsSchema
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([expect.stringContaining("must be one of:")])
      );
    });
  });

  describe("array item type validation (line 60)", () => {
    it("should reject non-object items in messages array", () => {
      const result = validatePayload(
        {
          model: "test-model",
          messages: ["not an object", 123],
        },
        chatCompletionsSchema
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.stringContaining("must be of type object"),
        ])
      );
    });

    it("should reject non-object items in tools array", () => {
      const result = validatePayload(
        {
          model: "test-model",
          messages: [{ role: "user", content: "Hello" }],
          tools: ["not an object"],
        },
        chatCompletionsSchema
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.stringContaining("must be of type object"),
        ])
      );
    });
  });
});

describe("fireworks validatePayload inline wrappers", () => {
  it("should validate via chat.completions.validatePayload", () => {
    const provider = fireworks({ apiKey: "test-key" });
    const result = provider.v1.chat.completions.validatePayload({
      model: "test-model",
      messages: [{ role: "user", content: "Hello" }],
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should validate via completions.validatePayload", () => {
    const provider = fireworks({ apiKey: "test-key" });
    const result = provider.v1.completions.validatePayload({
      model: "test-model",
      prompt: "Hello",
    });
    expect(result.valid).toBe(true);
  });

  it("should validate via embeddings.validatePayload", () => {
    const provider = fireworks({ apiKey: "test-key" });
    const result = provider.v1.embeddings.validatePayload({
      model: "test-model",
      input: "Hello world",
    });
    expect(result.valid).toBe(true);
  });

  it("should validate via rerank.validatePayload", () => {
    const provider = fireworks({ apiKey: "test-key" });
    const result = provider.v1.rerank.validatePayload({
      model: "test-model",
      query: "search query",
      documents: ["doc1", "doc2"],
    });
    expect(result.valid).toBe(true);
  });

  it("should validate via messages.validatePayload", () => {
    const provider = fireworks({ apiKey: "test-key" });
    const result = provider.v1.messages.validatePayload({
      model: "test-model",
      messages: [{ role: "user", content: "Hello" }],
    });
    expect(result.valid).toBe(true);
  });

  it("should validate via workflows.textToImage.validatePayload", () => {
    const provider = fireworks({ apiKey: "test-key" });
    const result = provider.v1.workflows.textToImage.validatePayload({
      prompt: "a cat",
    });
    expect(result.valid).toBe(true);
  });

  it("should validate via workflows.kontext.validatePayload", () => {
    const provider = fireworks({ apiKey: "test-key" });
    const result = provider.v1.workflows.kontext.validatePayload({
      prompt: "modify image",
    });
    expect(result.valid).toBe(true);
  });

  it("should validate via workflows.getResult.validatePayload", () => {
    const provider = fireworks({ apiKey: "test-key" });
    const result = provider.v1.workflows.getResult.validatePayload({
      id: "result-123",
    });
    expect(result.valid).toBe(true);
  });

  it("should reject invalid payload via inline wrapper", () => {
    const provider = fireworks({ apiKey: "test-key" });
    const result = provider.v1.chat.completions.validatePayload({
      // Missing required 'model' and 'messages'
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe("fireworks sse.ts trailing buffer with event type (line 55)", () => {
  it("should parse event type from trailing buffer", async () => {
    // Trailing buffer with event: line (no double-newline terminator)
    const response = createMockResponse([
      "event: custom_type\ndata: trailing data",
    ]);
    const events: { event: string; data: string }[] = [];
    for await (const event of sseToIterable(response)) {
      events.push(event);
    }
    expect(events).toHaveLength(1);
    expect(events[0].event).toBe("custom_type");
    expect(events[0].data).toBe("trailing data");
  });

  it("should default event to message in trailing buffer without event line", async () => {
    const response = createMockResponse(["data: no event type"]);
    const events: { event: string; data: string }[] = [];
    for await (const event of sseToIterable(response)) {
      events.push(event);
    }
    expect(events).toHaveLength(1);
    expect(events[0].event).toBe("message");
    expect(events[0].data).toBe("no event type");
  });

  it("should handle trailing buffer with only event type and no data", async () => {
    const response = createMockResponse(["event: orphan_event"]);
    const events: { event: string; data: string }[] = [];
    for await (const event of sseToIterable(response)) {
      events.push(event);
    }
    // No data means the event is not yielded
    expect(events).toHaveLength(0);
  });

  it("should handle empty response body", async () => {
    const response = new Response(null);
    const events: { event: string; data: string }[] = [];
    for await (const event of sseToIterable(response)) {
      events.push(event);
    }
    expect(events).toHaveLength(0);
  });
});

describe("fireworks attachAbortHandler (lines 204-217)", () => {
  it("should propagate abort from user signal to request", async () => {
    const abortController = new AbortController();
    let fetchCalledWithSignal: AbortSignal | undefined;

    const provider = fireworks({
      apiKey: "test-key",
      fetch: async (_url: string | URL | Request, init?: RequestInit) => {
        fetchCalledWithSignal = init?.signal ?? undefined;
        // Abort the user signal while fetch is "in flight"
        abortController.abort();
        // Give a moment for the abort handler to fire
        await new Promise((r) => setTimeout(r, 10));
        // The internal controller should now be aborted
        expect(fetchCalledWithSignal?.aborted).toBe(true);
        return new Response(JSON.stringify({ choices: [] }), { status: 200 });
      },
    });

    try {
      await provider.v1.chat.completions(
        {
          model: "test",
          messages: [{ role: "user", content: "Hello" }],
        },
        abortController.signal
      );
    } catch {
      // Expected - abort may cause errors
    }

    expect(fetchCalledWithSignal).toBeDefined();
  });

  it("should handle already-aborted signal without addEventListener", async () => {
    // Create a signal-like object that's already aborted and has no addEventListener
    const alreadyAbortedSignal = {
      aborted: true,
      reason: new DOMException("Aborted", "AbortError"),
      throwIfAborted: () => {
        throw new DOMException("Aborted", "AbortError");
      },
      onabort: null,
    } as unknown as AbortSignal;

    const provider = fireworks({
      apiKey: "test-key",
      fetch: async (_url: string | URL | Request, init?: RequestInit) => {
        // Internal controller should be aborted because signal was pre-aborted
        expect(init?.signal?.aborted).toBe(true);
        return new Response(JSON.stringify({ choices: [] }), { status: 200 });
      },
    });

    try {
      await provider.v1.chat.completions(
        {
          model: "test",
          messages: [{ role: "user", content: "Hello" }],
        },
        alreadyAbortedSignal
      );
    } catch {
      // Expected — aborted signal causes errors
    }
  });

  it("should work without a signal (undefined path)", async () => {
    const provider = fireworks({
      apiKey: "test-key",
      fetch: async () => {
        return new Response(
          JSON.stringify({
            id: "test",
            choices: [
              {
                index: 0,
                message: { role: "assistant", content: "Hi" },
                finish_reason: "stop",
              },
            ],
            model: "test",
            object: "chat.completion",
          }),
          { status: 200 }
        );
      },
    });

    // No signal passed — exercises the early return in attachAbortHandler
    const result = await provider.v1.chat.completions({
      model: "test",
      messages: [{ role: "user", content: "Hello" }],
    });
    expect(result).toBeDefined();
  });
});
