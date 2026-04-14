import { describe, it, expect, vi } from "vitest";

// Fireworks Zod schemas
import { FireworksChatRequestSchema } from "../../packages/provider/fireworks/src/zod";

// Fireworks SSE
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

describe("Fireworks Zod schema validation gaps", () => {
  describe("enum validation errors", () => {
    it("should return error for invalid enum value", () => {
      const result = FireworksChatRequestSchema.safeParse({
        model: "gpt-4o",
        messages: [{ role: "invalid-role", content: "Hello" }],
      });
      expect(result.success).toBe(false);
    });

    it("should return error for multiple invalid values", () => {
      const result = FireworksChatRequestSchema.safeParse({
        model: "gpt-4o",
        messages: [
          { role: "user", content: "Hello" },
          { role: "invalid", content: "World" },
        ],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("array item type errors", () => {
    it("should return type error for invalid messages type", () => {
      const result = FireworksChatRequestSchema.safeParse({
        model: "gpt-4o",
        messages: "not-an-array",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("payload type check error", () => {
    it("should reject null payload", () => {
      const result = FireworksChatRequestSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it("should reject array payload", () => {
      const result = FireworksChatRequestSchema.safeParse(["invalid"]);
      expect(result.success).toBe(false);
    });

    it("should reject string payload", () => {
      const result = FireworksChatRequestSchema.safeParse("invalid");
      expect(result.success).toBe(false);
    });

    it("should reject number payload", () => {
      const result = FireworksChatRequestSchema.safeParse(123);
      expect(result.success).toBe(false);
    });

    it("should reject boolean payload", () => {
      const result = FireworksChatRequestSchema.safeParse(true);
      expect(result.success).toBe(false);
    });
  });
});

describe("Fireworks Zod schema .schema property coverage", () => {
  it("should validate via multiple endpoint schemas", async () => {
    const { fireworks } =
      await import("../../packages/provider/fireworks/src/fireworks");
    const client = fireworks({ apiKey: "test" });

    // Test various .schema properties exist and are callable via safeParse
    const tests = [
      {
        name: "chat.completions",
        fn: () =>
          client.inference.v1.chat.completions.schema.safeParse({
            model: "gpt-4o",
            messages: [{ role: "user", content: "Hello" }],
          }),
        expectSuccess: true,
      },
      {
        name: "completions",
        fn: () =>
          client.inference.v1.completions.schema.safeParse({
            model: "gpt-4o",
            prompt: "Hello",
          }),
        expectSuccess: true,
      },
      {
        name: "embeddings",
        fn: () =>
          client.inference.v1.embeddings.schema.safeParse({
            model: "text-embedding-ada-002",
            input: "Hello",
          }),
        expectSuccess: true,
      },
      {
        name: "rerank",
        fn: () =>
          client.inference.v1.rerank.schema.safeParse({
            model: "model",
            query: "query",
            documents: ["doc1"],
          }),
        expectSuccess: true,
      },
      {
        name: "messages",
        fn: () =>
          client.inference.v1.messages.schema.safeParse({
            model: "claude-3",
            messages: [{ role: "user", content: "Hello" }],
          }),
        expectSuccess: true,
      },
      // Workflows
      {
        name: "workflows.textToImage",
        fn: () =>
          client.inference.v1.workflows.textToImage.schema.safeParse({
            prompt: "A cat",
          }),
        expectSuccess: true,
      },
      {
        name: "workflows.kontext",
        fn: () =>
          client.inference.v1.workflows.kontext.schema.safeParse({
            prompt: "Hello",
          }),
        expectSuccess: true,
      },
      {
        name: "workflows.getResult",
        fn: () =>
          client.inference.v1.workflows.getResult.schema.safeParse({
            id: "req-123",
          }),
        expectSuccess: true,
      },
      // Account endpoints
      {
        name: "accounts.models.create",
        fn: () =>
          client.inference.v1.accounts.models.create.schema.safeParse({
            modelId: "test",
            model: {},
          }),
        expectSuccess: true,
      },
      {
        name: "accounts.deployments.create",
        fn: () =>
          client.inference.v1.accounts.deployments.create.schema.safeParse({
            baseModel: "accounts/fireworks/models/test",
          }),
        expectSuccess: true,
      },
      {
        name: "accounts.batchInferenceJobs.create",
        fn: () =>
          client.inference.v1.accounts.batchInferenceJobs.create.schema.safeParse(
            {
              model: "test",
              inputDatasetId: "test-ds",
            }
          ),
        expectSuccess: true,
      },
    ];

    for (const test of tests) {
      const result = test.fn();
      expect(result.success).toBe(test.expectSuccess);
    }
  });

  it("should return validation errors for invalid payloads", async () => {
    const { fireworks } =
      await import("../../packages/provider/fireworks/src/fireworks");
    const client = fireworks({ apiKey: "test" });

    // Test invalid payloads
    const invalidResult1 =
      client.inference.v1.chat.completions.schema.safeParse({
        model: "gpt-4o",
        // Missing required 'messages'
      });
    expect(invalidResult1.success).toBe(false);
    expect(invalidResult1.error?.issues.length).toBeGreaterThan(0);

    const invalidResult2 = client.inference.v1.completions.schema.safeParse({
      model: "gpt-4o",
      // Missing required 'prompt'
    });
    expect(invalidResult2.success).toBe(false);
  });
});

describe("Fireworks SSE line 55 coverage", () => {
  it("should parse trailing event with event: prefix (covers sse.ts line 55)", async () => {
    const response = createMockResponse([
      'event: custom_event\ndata: {"key":"value"}',
    ]);
    const events: { event: string; data: string }[] = [];
    for await (const event of sseToIterable(response)) {
      events.push(event);
    }
    expect(events).toHaveLength(1);
    expect(events[0].event).toBe("custom_event");
    expect(events[0].data).toBe('{"key":"value"}');
  });

  it("should handle multiple trailing events with different event types", async () => {
    const response = createMockResponse([
      "event: start\ndata: first\n\nevent: end\ndata: last",
    ]);
    const events: { event: string; data: string }[] = [];
    for await (const event of sseToIterable(response)) {
      events.push(event);
    }
    expect(events).toHaveLength(2);
    expect(events[0].event).toBe("start");
    expect(events[1].event).toBe("end");
  });

  it("should handle trailing data-only event", async () => {
    const response = createMockResponse(["data: trailing data"]);
    const events: { event: string; data: string }[] = [];
    for await (const event of sseToIterable(response)) {
      events.push(event);
    }
    expect(events).toHaveLength(1);
    expect(events[0].event).toBe("message");
    expect(events[0].data).toBe("trailing data");
  });

  it("should handle trailing event with empty data", async () => {
    const response = createMockResponse(["event: empty_event"]);
    const events: { event: string; data: string }[] = [];
    for await (const event of sseToIterable(response)) {
      events.push(event);
    }
    expect(events).toHaveLength(0);
  });

  it("should handle trailing event with whitespace trimming", async () => {
    const response = createMockResponse([
      "event:   spaced_event   \ndata:   spaced_data   ",
    ]);
    const events: { event: string; data: string }[] = [];
    for await (const event of sseToIterable(response)) {
      events.push(event);
    }
    expect(events).toHaveLength(1);
    expect(events[0].event).toBe("spaced_event");
    expect(events[0].data).toBe("spaced_data");
  });
});

describe("Fireworks attachAbortHandler coverage (fireworks.ts lines 204-217)", () => {
  it("should return early when signal is undefined", async () => {
    const { fireworks } =
      await import("../../packages/provider/fireworks/src/fireworks");

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        id: "chatcmpl-123",
        object: "chat.completion",
        created: 1234567890,
        model: "gpt-4o",
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: "Hello" },
            finish_reason: "stop",
          },
        ],
      }),
    });

    const testClient = fireworks({ apiKey: "test", fetch: mockFetch });
    await testClient.inference.v1.chat.completions({
      model: "gpt-4o",
      messages: [{ role: "user", content: "Hello" }],
    });

    expect(mockFetch).toHaveBeenCalled();
  });

  it("should add event listener when signal has addEventListener", async () => {
    const { fireworks } =
      await import("../../packages/provider/fireworks/src/fireworks");

    const mockAddEventListener = vi.fn();
    const mockSignal = {
      addEventListener: mockAddEventListener,
      aborted: false,
    } as unknown as AbortSignal;

    const mockFetch = vi.fn().mockImplementation(() => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            ok: true,
            json: vi.fn().mockResolvedValue({
              id: "chatcmpl-123",
              object: "chat.completion",
              created: 1234567890,
              model: "gpt-4o",
              choices: [
                {
                  index: 0,
                  message: { role: "assistant", content: "Hello" },
                  finish_reason: "stop",
                },
              ],
            }),
          });
        }, 10);
      });
    });

    const testClient = fireworks({ apiKey: "test", fetch: mockFetch });

    await testClient.inference.v1.chat.completions(
      {
        model: "gpt-4o",
        messages: [{ role: "user", content: "Hello" }],
      },
      mockSignal
    );

    expect(mockAddEventListener).toHaveBeenCalledWith(
      "abort",
      expect.any(Function),
      { once: true }
    );
  });

  it("should handle signal already aborted without addEventListener", async () => {
    const { fireworks } =
      await import("../../packages/provider/fireworks/src/fireworks");

    const mockSignal = {
      aborted: true,
    } as unknown as AbortSignal;

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({}),
    });

    const testClient = fireworks({ apiKey: "test", fetch: mockFetch });

    try {
      await testClient.inference.v1.chat.completions(
        {
          model: "gpt-4o",
          messages: [{ role: "user", content: "Hello" }],
        },
        mockSignal
      );
    } catch {
      // May throw due to abort
    }
  });

  it("should handle signal abort during request", async () => {
    const { fireworks } =
      await import("../../packages/provider/fireworks/src/fireworks");

    const abortController = new AbortController();
    const signal = abortController.signal;

    const mockFetch = vi.fn().mockImplementation(() => {
      return new Promise((_, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Timeout"));
        }, 1000);

        signal.addEventListener("abort", () => {
          clearTimeout(timeout);
          reject(new Error("Aborted"));
        });
      });
    });

    const testClient = fireworks({ apiKey: "test", fetch: mockFetch });

    const requestPromise = testClient.inference.v1.chat.completions(
      {
        model: "gpt-4o",
        messages: [{ role: "user", content: "Hello" }],
      },
      signal
    );

    // Abort after a short delay
    setTimeout(() => abortController.abort(), 50);

    await expect(requestPromise).rejects.toThrow();
  });
});
