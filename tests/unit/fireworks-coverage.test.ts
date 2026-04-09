import { describe, it, expect, vi } from "vitest";

// Fireworks validation
import { validatePayload } from "../../packages/provider/fireworks/src/validate";
import type { PayloadSchema } from "../../packages/provider/fireworks/src/types";
import { chatCompletionsSchema } from "../../packages/provider/fireworks/src/schemas";

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

describe("Fireworks validatePayload gaps", () => {
  describe("enum validation errors (validate.ts lines 42-43)", () => {
    it("should return enum validation error for invalid enum value", () => {
      const result = validatePayload(
        {
          model: "gpt-4o",
          messages: [{ role: "invalid-role", content: "Hello" }],
        },
        chatCompletionsSchema
      );
      expect(result.valid).toBe(false);
      expect(result.errors?.some((e) => e.includes("must be one of:"))).toBe(
        true
      );
    });

    it("should return enum validation error for multiple invalid values", () => {
      const result = validatePayload(
        {
          model: "gpt-4o",
          messages: [
            { role: "user", content: "Hello" },
            { role: "invalid", content: "World" },
          ],
        },
        chatCompletionsSchema
      );
      expect(result.valid).toBe(false);
      expect(result.errors?.some((e) => e.includes("must be one of:"))).toBe(
        true
      );
    });
  });

  describe("array item type errors (validate.ts line 60)", () => {
    it("should return type error for invalid array item type", () => {
      const result = validatePayload(
        {
          model: "gpt-4o",
          messages: "not-an-array",
        },
        chatCompletionsSchema
      );
      expect(result.valid).toBe(false);
      expect(result.errors?.some((e) => e.includes("must be of type"))).toBe(
        true
      );
    });

    it("should validate array items with type error on nested object", () => {
      const schemaWithNestedArray: PayloadSchema = {
        method: "POST",
        path: "/test",
        contentType: "application/json",
        fields: {
          items: {
            type: "array",
            required: true,
            items: {
              type: "string",
            },
          },
        },
      };

      const result = validatePayload(
        {
          items: ["valid", 123, "also-valid"],
        },
        schemaWithNestedArray
      );
      expect(result.valid).toBe(false);
      expect(result.errors?.some((e) => e.includes("must be of type"))).toBe(
        true
      );
    });
  });

  describe("payload type check error (validate.ts lines 82-83)", () => {
    it("should reject null payload", () => {
      const result = validatePayload(null, chatCompletionsSchema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("payload must be a non-null object");
    });

    it("should reject array payload", () => {
      const result = validatePayload(["invalid"], chatCompletionsSchema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("payload must be a non-null object");
    });

    it("should reject string payload", () => {
      const result = validatePayload("invalid", chatCompletionsSchema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("payload must be a non-null object");
    });

    it("should reject number payload", () => {
      const result = validatePayload(123, chatCompletionsSchema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("payload must be a non-null object");
    });

    it("should reject boolean payload", () => {
      const result = validatePayload(true, chatCompletionsSchema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("payload must be a non-null object");
    });
  });
});

describe("Fireworks validatePayload inline functions coverage", () => {
  it("should validate via multiple endpoint validatePayload methods", async () => {
    const { fireworks } =
      await import("../../packages/provider/fireworks/src/fireworks");
    const client = fireworks({ apiKey: "test" });

    // Test various validatePayload methods exist and are callable
    // We test both valid and invalid payloads to ensure coverage
    const tests = [
      // Core endpoints - test with valid payloads
      {
        name: "chat.completions",
        fn: () =>
          client.v1.chat.completions.validatePayload({
            model: "gpt-4o",
            messages: [{ role: "user", content: "Hello" }],
          }),
        expectValid: true,
      },
      {
        name: "completions",
        fn: () =>
          client.v1.completions.validatePayload({
            model: "gpt-4o",
            prompt: "Hello",
          }),
        expectValid: true,
      },
      {
        name: "embeddings",
        fn: () =>
          client.v1.embeddings.validatePayload({
            model: "text-embedding-ada-002",
            input: "Hello",
          }),
        expectValid: true,
      },
      {
        name: "rerank",
        fn: () =>
          client.v1.rerank.validatePayload({
            model: "model",
            query: "query",
            documents: ["doc1"],
          }),
        expectValid: true,
      },
      {
        name: "messages",
        fn: () =>
          client.v1.messages.validatePayload({
            model: "claude-3",
            max_tokens: 1024,
            messages: [{ role: "user", content: "Hello" }],
          }),
        expectValid: true,
      },
      // Workflows
      {
        name: "workflows.textToImage",
        fn: () =>
          client.v1.workflows.textToImage.validatePayload({
            prompt: "A cat",
          }),
        expectValid: true,
      },
      {
        name: "workflows.kontext",
        fn: () =>
          client.v1.workflows.kontext.validatePayload({
            prompt: "Hello",
          }),
        expectValid: true,
      },
      {
        name: "workflows.getResult",
        fn: () =>
          client.v1.workflows.getResult.validatePayload({
            id: "req-123",
          }),
        expectValid: true,
      },
      // Audio - test that functions are callable (covering the code paths)
      // Note: These return validation errors but the functions are invoked
      {
        name: "audio.transcriptions",
        fn: () => client.v1.audio.transcriptions.validatePayload({}),
        expectValid: false, // Will have validation errors but function is called
      },
      {
        name: "audio.translations",
        fn: () => client.v1.audio.translations.validatePayload({}),
        expectValid: false,
      },
      {
        name: "audio.batch.transcriptions",
        fn: () => client.v1.audio.batch.transcriptions.validatePayload({}),
        expectValid: false,
      },
      {
        name: "audio.batch.translations",
        fn: () => client.v1.audio.batch.translations.validatePayload({}),
        expectValid: false,
      },
      // Account endpoints - test functions are callable
      {
        name: "accounts.users.update",
        fn: () =>
          client.v1.accounts.users.update.validatePayload({
            role: "user",
          }),
        expectValid: true,
      },
      {
        name: "accounts.models.create",
        fn: () => client.v1.accounts.models.create.validatePayload({}),
        expectValid: false,
      },
      {
        name: "accounts.models.prepare",
        fn: () => client.v1.accounts.models.prepare.validatePayload({}),
        expectValid: false,
      },
      {
        name: "accounts.models.getUploadEndpoint",
        fn: () =>
          client.v1.accounts.models.getUploadEndpoint.validatePayload({
            filename: "model.bin",
            filenameToSize: { "model.bin": 1024 },
          }),
        expectValid: true,
      },
      {
        name: "accounts.deployments.create",
        fn: () => client.v1.accounts.deployments.create.validatePayload({}),
        expectValid: false,
      },
      {
        name: "accounts.deployedModels.create",
        fn: () => client.v1.accounts.deployedModels.create.validatePayload({}),
        expectValid: false,
      },
      {
        name: "accounts.apiKeys.create",
        fn: () =>
          client.v1.accounts.apiKeys.create.validatePayload({
            apiKey: { displayName: "test-key" },
          }),
        expectValid: true,
      },
      {
        name: "accounts.secrets.create",
        fn: () => client.v1.accounts.secrets.create.validatePayload({}),
        expectValid: false,
      },
      {
        name: "accounts.datasets.create",
        fn: () => client.v1.accounts.datasets.create.validatePayload({}),
        expectValid: false,
      },
      {
        name: "accounts.datasets.getUploadEndpoint",
        fn: () =>
          client.v1.accounts.datasets.getUploadEndpoint.validatePayload({
            filename: "data.bin",
            filenameToSize: { "data.bin": 1024 },
          }),
        expectValid: true,
      },
      {
        name: "accounts.datasets.validateUpload",
        fn: () =>
          client.v1.accounts.datasets.validateUpload.validatePayload({}),
        expectValid: true,
      },
      {
        name: "accounts.batchInferenceJobs.create",
        fn: () =>
          client.v1.accounts.batchInferenceJobs.create.validatePayload({}),
        expectValid: false,
      },
      {
        name: "accounts.supervisedFineTuningJobs.create",
        fn: () =>
          client.v1.accounts.supervisedFineTuningJobs.create.validatePayload(
            {}
          ),
        expectValid: false,
      },
      {
        name: "accounts.dpoJobs.create",
        fn: () => client.v1.accounts.dpoJobs.create.validatePayload({}),
        expectValid: false,
      },
      {
        name: "accounts.evaluators.create",
        fn: () => client.v1.accounts.evaluators.create.validatePayload({}),
        expectValid: false,
      },
      {
        name: "accounts.evaluators.getUploadEndpoint",
        fn: () =>
          client.v1.accounts.evaluators.getUploadEndpoint.validatePayload({
            filename: "eval.bin",
            filenameToSize: { "eval.bin": 1024 },
          }),
        expectValid: true,
      },
      {
        name: "accounts.evaluationJobs.create",
        fn: () => client.v1.accounts.evaluationJobs.create.validatePayload({}),
        expectValid: false,
      },
      {
        name: "accounts.reinforcementFineTuningJobs.create",
        fn: () =>
          client.v1.accounts.reinforcementFineTuningJobs.create.validatePayload(
            {}
          ),
        expectValid: false,
      },
      {
        name: "accounts.rlorTrainerJobs.create",
        fn: () => client.v1.accounts.rlorTrainerJobs.create.validatePayload({}),
        expectValid: false,
      },
      {
        name: "accounts.rlorTrainerJobs.executeTrainStep",
        fn: () =>
          client.v1.accounts.rlorTrainerJobs.executeTrainStep.validatePayload(
            {}
          ),
        expectValid: false,
      },
    ];

    for (const test of tests) {
      const result = test.fn();
      if (result.valid !== test.expectValid) {
        // Debug logging to identify which tests fail
        console.log(`FAIL: ${test.name}`, result.errors);
      }
      expect(result.valid).toBe(test.expectValid);
    }
  });

  it("should return validation errors for invalid payloads", async () => {
    const { fireworks } =
      await import("../../packages/provider/fireworks/src/fireworks");
    const client = fireworks({ apiKey: "test" });

    // Test invalid payloads
    const invalidResult1 = client.v1.chat.completions.validatePayload({
      model: "gpt-4o",
      // Missing required 'messages'
    });
    expect(invalidResult1.valid).toBe(false);
    expect(invalidResult1.errors?.length).toBeGreaterThan(0);

    const invalidResult2 = client.v1.completions.validatePayload({
      model: "gpt-4o",
      // Missing required 'prompt'
    });
    expect(invalidResult2.valid).toBe(false);
  });
});

describe("Fireworks SSE line 55 coverage", () => {
  it("should parse trailing event with event: prefix (covers sse.ts line 55)", async () => {
    // This test specifically covers line 55: event = trimmed.slice(6).trim();
    // in the trailing event handling section of sse.ts
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

    // This test covers the early return when signal is undefined
    // by calling a method without providing a signal
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
    await testClient.v1.chat.completions({
      model: "gpt-4o",
      messages: [{ role: "user", content: "Hello" }],
    });

    expect(mockFetch).toHaveBeenCalled();
    // No signal provided, so attachAbortHandler returns early (line 208)
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

    await testClient.v1.chat.completions(
      {
        model: "gpt-4o",
        messages: [{ role: "user", content: "Hello" }],
      },
      mockSignal
    );

    // Verify addEventListener was called with correct arguments
    // This covers line 212: signal.addEventListener("abort", () => controller.abort(), { once: true });
    expect(mockAddEventListener).toHaveBeenCalledWith(
      "abort",
      expect.any(Function),
      { once: true }
    );
  });

  it("should handle signal already aborted without addEventListener", async () => {
    const { fireworks } =
      await import("../../packages/provider/fireworks/src/fireworks");

    // Create a signal that is already aborted and has no addEventListener
    // This covers lines 213-215: else if (signal.aborted) { controller.abort(); }
    const mockSignal = {
      aborted: true,
      // No addEventListener - simulating older environment
    } as unknown as AbortSignal;

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({}),
    });

    const testClient = fireworks({ apiKey: "test", fetch: mockFetch });

    // When signal is already aborted without addEventListener,
    // the controller should be aborted immediately
    try {
      await testClient.v1.chat.completions(
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

    const requestPromise = testClient.v1.chat.completions(
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
