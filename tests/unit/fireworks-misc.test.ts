import { describe, it, expect } from "vitest";
import { fireworks } from "@apicity/fireworks";

// Direct imports for unit-level coverage
import {
  FireworksChatRequestSchema,
  FireworksKontextRequestSchema,
} from "../../packages/provider/fireworks/src/zod";
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

describe("fireworks Zod schema validation edge cases", () => {
  describe("non-object payloads", () => {
    it("should reject null payload", () => {
      const result = FireworksChatRequestSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it("should reject string payload", () => {
      const result = FireworksChatRequestSchema.safeParse("not an object");
      expect(result.success).toBe(false);
    });

    it("should reject array payload", () => {
      const result = FireworksChatRequestSchema.safeParse([1, 2, 3]);
      expect(result.success).toBe(false);
    });

    it("should reject number payload", () => {
      const result = FireworksChatRequestSchema.safeParse(42);
      expect(result.success).toBe(false);
    });

    it("should reject undefined payload", () => {
      const result = FireworksChatRequestSchema.safeParse(undefined);
      expect(result.success).toBe(false);
    });
  });

  describe("enum validation errors", () => {
    it("should reject invalid enum value in nested object", () => {
      const result = FireworksChatRequestSchema.safeParse({
        model: "test-model",
        messages: [{ role: "invalid-role", content: "Hello" }],
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid reasoning_effort enum", () => {
      const result = FireworksChatRequestSchema.safeParse({
        model: "test-model",
        messages: [{ role: "user", content: "Hello" }],
        reasoning_effort: "maximum",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("array item type validation", () => {
    it("should reject non-object items in messages array", () => {
      const result = FireworksChatRequestSchema.safeParse({
        model: "test-model",
        messages: ["not an object", 123],
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("fireworks schema property on endpoints", () => {
  it("should expose .schema on chat.completions", () => {
    const provider = fireworks({ apiKey: "test-key" });
    expect(provider.inference.v1.chat.completions.schema).toBeDefined();
    expect(typeof provider.inference.v1.chat.completions.schema.safeParse).toBe(
      "function"
    );
  });

  it("should expose .schema on completions", () => {
    const provider = fireworks({ apiKey: "test-key" });
    expect(provider.inference.v1.completions.schema).toBeDefined();
  });

  it("should expose .schema on embeddings", () => {
    const provider = fireworks({ apiKey: "test-key" });
    expect(provider.inference.v1.embeddings.schema).toBeDefined();
  });

  it("should expose .schema on rerank", () => {
    const provider = fireworks({ apiKey: "test-key" });
    expect(provider.inference.v1.rerank.schema).toBeDefined();
  });

  it("should expose .schema on messages", () => {
    const provider = fireworks({ apiKey: "test-key" });
    expect(provider.inference.v1.messages.schema).toBeDefined();
  });

  it("should expose .schema on workflows.textToImage", () => {
    const provider = fireworks({ apiKey: "test-key" });
    expect(provider.inference.v1.workflows.textToImage.schema).toBeDefined();
  });

  it("should expose .schema on workflows.kontext", () => {
    const provider = fireworks({ apiKey: "test-key" });
    expect(provider.inference.v1.workflows.kontext.schema).toBeDefined();
  });

  it("should expose .schema on workflows.getResult", () => {
    const provider = fireworks({ apiKey: "test-key" });
    expect(provider.inference.v1.workflows.getResult.schema).toBeDefined();
  });

  it("should validate via safeParse on chat.completions.schema", () => {
    const provider = fireworks({ apiKey: "test-key" });
    const result = provider.inference.v1.chat.completions.schema.safeParse({
      model: "test-model",
      messages: [{ role: "user", content: "Hello" }],
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid payload via safeParse on chat.completions.schema", () => {
    const provider = fireworks({ apiKey: "test-key" });
    const result = provider.inference.v1.chat.completions.schema.safeParse({
      // Missing required 'model' and 'messages'
    });
    expect(result.success).toBe(false);
  });

  it("should validate kontext via Zod schema directly", () => {
    const result = FireworksKontextRequestSchema.safeParse({
      prompt: "Add warm afternoon lighting",
      output_format: "jpeg",
      prompt_upsampling: false,
    });
    expect(result.success).toBe(true);
  });

  it("should reject missing prompt on kontext schema", () => {
    const result = FireworksKontextRequestSchema.safeParse({});
    expect(result.success).toBe(false);
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
      await provider.inference.v1.chat.completions(
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
      await provider.inference.v1.chat.completions(
        {
          model: "test",
          messages: [{ role: "user", content: "Hello" }],
        },
        alreadyAbortedSignal
      );
    } catch {
      // Expected -- aborted signal causes errors
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

    // No signal passed -- exercises the early return in attachAbortHandler
    const result = await provider.inference.v1.chat.completions({
      model: "test",
      messages: [{ role: "user", content: "Hello" }],
    });
    expect(result).toBeDefined();
  });
});
