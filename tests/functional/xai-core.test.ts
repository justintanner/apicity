// Unit tests for xAI core provider (xai.ts) — mocked fetch, no real API calls
import { describe, it, expect } from "vitest";
import { xai, XaiError } from "../../packages/provider/xai/src/index";

describe("xAI provider core", () => {
  describe("provider initialization", () => {
    it("creates provider with apiKey", () => {
      const provider = xai({ apiKey: "sk-test-key" });
      expect(provider.post).toBeDefined();
      expect(provider.get).toBeDefined();
      expect(provider.delete).toBeDefined();
      expect(provider.put).toBeDefined();
      expect(provider.patch).toBeDefined();
      expect(provider.ws).toBeDefined();
    });

    it("creates provider with custom baseURL", () => {
      const provider = xai({
        apiKey: "sk-test-key",
        baseURL: "https://custom.api.x.ai/v1",
      });
      expect(provider).toBeDefined();
    });

    it("creates provider with managementApiKey", () => {
      const provider = xai({
        apiKey: "sk-test-key",
        managementApiKey: "sk-mgmt-key",
      });
      expect(provider).toBeDefined();
    });

    it("creates provider with custom timeout", () => {
      const provider = xai({
        apiKey: "sk-test-key",
        timeout: 60000,
      });
      expect(provider).toBeDefined();
    });

    it("creates provider with custom fetch", async () => {
      const mockFetch = async () =>
        new Response(JSON.stringify({ id: "test" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });

      const provider = xai({
        apiKey: "sk-test-key",
        fetch: mockFetch,
      });

      const result = await provider.get.v1.models();
      expect(result).toBeDefined();
    });
  });

  describe("makeRequest with mocked fetch", () => {
    it("sends GET request with correct headers", async () => {
      let capturedUrl = "";
      let capturedHeaders: Record<string, string> = {};
      let capturedMethod = "";

      const mockFetch = async (
        input: RequestInfo | URL,
        init?: RequestInit
      ) => {
        capturedUrl = String(input);
        capturedHeaders = Object.fromEntries(
          new Headers(init?.headers).entries()
        );
        capturedMethod = init?.method ?? "";
        return new Response(JSON.stringify({ data: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      };

      const provider = xai({ apiKey: "sk-my-key", fetch: mockFetch });
      await provider.get.v1.models();

      expect(capturedMethod).toBe("GET");
      expect(capturedHeaders["authorization"]).toBe("Bearer sk-my-key");
      expect(capturedUrl).toContain("/models");
    });

    it("sends POST request with JSON body", async () => {
      let capturedBody = "";
      let capturedHeaders: Record<string, string> = {};

      const mockFetch = async (
        _input: RequestInfo | URL,
        init?: RequestInit
      ) => {
        capturedBody = (init?.body as string) ?? "";
        capturedHeaders = Object.fromEntries(
          new Headers(init?.headers).entries()
        );
        return new Response(JSON.stringify({ id: "chat-123", choices: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      };

      const provider = xai({ apiKey: "sk-my-key", fetch: mockFetch });
      await provider.post.v1.chat.completions({
        model: "grok-3-fast",
        messages: [{ role: "user", content: "Hello" }],
      });

      expect(capturedHeaders["content-type"]).toBe("application/json");
      const body = JSON.parse(capturedBody);
      expect(body.model).toBe("grok-3-fast");
      expect(body.messages).toHaveLength(1);
    });

    it("sends DELETE request", async () => {
      let capturedMethod = "";

      const mockFetch = async (
        _input: RequestInfo | URL,
        init?: RequestInit
      ) => {
        capturedMethod = init?.method ?? "";
        return new Response(JSON.stringify({ id: "file-123", deleted: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      };

      const provider = xai({ apiKey: "sk-my-key", fetch: mockFetch });
      await provider.delete.v1.files("file-123");

      expect(capturedMethod).toBe("DELETE");
    });

    it("encodes URL parameters correctly", async () => {
      let capturedUrl = "";

      const mockFetch = async (input: RequestInfo | URL) => {
        capturedUrl = String(input);
        return new Response(JSON.stringify({ id: "resp-123" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      };

      const provider = xai({ apiKey: "sk-my-key", fetch: mockFetch });
      await provider.get.v1.responses("resp/123+abc");

      expect(capturedUrl).toContain("/responses/resp%2F123%2Babc");
    });

    it("builds query string for list endpoints", async () => {
      let capturedUrl = "";

      const mockFetch = async (input: RequestInfo | URL) => {
        capturedUrl = String(input);
        return new Response(
          JSON.stringify({ batches: [], pagination_token: null }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      };

      const provider = xai({ apiKey: "sk-my-key", fetch: mockFetch });
      await provider.get.v1.batches({ limit: 10, pagination_token: "abc123" });

      expect(capturedUrl).toContain("limit=10");
      expect(capturedUrl).toContain("pagination_token=abc123");
    });

    it("handles 200 success response", async () => {
      const mockFetch = async () =>
        new Response(JSON.stringify({ id: "model-123", object: "model" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });

      const provider = xai({ apiKey: "sk-my-key", fetch: mockFetch });
      const result = await provider.get.v1.models("model-123");

      expect((result as { id: string }).id).toBe("model-123");
    });

    it("handles 201 created response", async () => {
      const mockFetch = async () =>
        new Response(
          JSON.stringify({ batch_id: "batch-123", name: "my-batch" }),
          {
            status: 201,
            headers: { "Content-Type": "application/json" },
          }
        );

      const provider = xai({ apiKey: "sk-my-key", fetch: mockFetch });
      const result = await provider.post.v1.batches({ name: "my-batch" });

      expect(result.batch_id).toBe("batch-123");
    });

    it("throws XaiError on 400 bad request", async () => {
      const mockFetch = async () =>
        new Response(
          JSON.stringify({ error: { message: "Invalid request" } }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );

      const provider = xai({ apiKey: "sk-my-key", fetch: mockFetch });
      await expect(
        provider.post.v1.chat.completions({
          model: "grok-3-fast",
          messages: [{ role: "user", content: "Hello" }],
        })
      ).rejects.toThrow(XaiError);
    });

    it("throws XaiError on 401 unauthorized", async () => {
      const mockFetch = async () =>
        new Response(JSON.stringify({ error: { message: "Unauthorized" } }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });

      const provider = xai({ apiKey: "sk-my-key", fetch: mockFetch });
      await expect(provider.get.v1.models()).rejects.toThrow(XaiError);
    });

    it("throws XaiError on 429 rate limited", async () => {
      const mockFetch = async () =>
        new Response(
          JSON.stringify({ error: { message: "Rate limit exceeded" } }),
          {
            status: 429,
            headers: { "Content-Type": "application/json" },
          }
        );

      const provider = xai({ apiKey: "sk-my-key", fetch: mockFetch });
      await expect(provider.get.v1.models()).rejects.toThrow(XaiError);
    });

    it("throws XaiError on 500 server error", async () => {
      const mockFetch = async () =>
        new Response(JSON.stringify({ error: { message: "Internal error" } }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });

      const provider = xai({ apiKey: "sk-my-key", fetch: mockFetch });
      await expect(provider.get.v1.models()).rejects.toThrow(XaiError);
    });

    it("handles error response without JSON body", async () => {
      const mockFetch = async () =>
        new Response("Internal Server Error", {
          status: 500,
          statusText: "Internal Server Error",
        });

      const provider = xai({ apiKey: "sk-my-key", fetch: mockFetch });
      await expect(provider.get.v1.models()).rejects.toThrow(XaiError);
    });

    it("handles fetch network error", async () => {
      const mockFetch = async () => {
        throw new Error("Network request failed");
      };

      const provider = xai({ apiKey: "sk-my-key", fetch: mockFetch });
      await expect(provider.get.v1.models()).rejects.toThrow(XaiError);
    });

    it("handles timeout via AbortSignal", async () => {
      const mockFetch = async (
        _input: RequestInfo | URL,
        init?: RequestInit
      ) => {
        // Check that signal was passed
        expect(init?.signal).toBeDefined();
        return new Response(JSON.stringify({ data: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      };

      const provider = xai({ apiKey: "sk-my-key", fetch: mockFetch });
      const controller = new AbortController();
      await provider.get.v1.models(controller.signal);
    });

    it("respects custom timeout option", async () => {
      const mockFetch = async () =>
        new Response(JSON.stringify({ data: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });

      const provider = xai({
        apiKey: "sk-my-key",
        fetch: mockFetch,
        timeout: 5000,
      });
      const result = await provider.get.v1.models();
      expect(result).toBeDefined();
    });
  });

  describe("management API requests", () => {
    it("sends management request with managementApiKey", async () => {
      let capturedHeaders: Record<string, string> = {};

      const mockFetch = async (
        input: RequestInfo | URL,
        init?: RequestInit
      ) => {
        capturedHeaders = Object.fromEntries(
          new Headers(init?.headers).entries()
        );
        return new Response(
          JSON.stringify({ collections: [], pagination_token: null }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      };

      const provider = xai({
        apiKey: "sk-api-key",
        managementApiKey: "sk-mgmt-key",
        fetch: mockFetch,
      });
      await provider.get.v1.collections();

      expect(capturedHeaders["authorization"]).toBe("Bearer sk-mgmt-key");
    });

    it("uses apiKey as fallback for management requests", async () => {
      let capturedHeaders: Record<string, string> = {};

      const mockFetch = async (
        input: RequestInfo | URL,
        init?: RequestInit
      ) => {
        capturedHeaders = Object.fromEntries(
          new Headers(init?.headers).entries()
        );
        return new Response(
          JSON.stringify({ collections: [], pagination_token: null }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      };

      const provider = xai({
        apiKey: "sk-api-key",
        fetch: mockFetch,
      });
      await provider.get.v1.collections();

      expect(capturedHeaders["authorization"]).toBe("Bearer sk-api-key");
    });
  });

  describe("files upload (multipart/form-data)", () => {
    it("uploads file with correct form data", async () => {
      let capturedHeaders: Record<string, string> = {};

      const mockFetch = async (
        _input: RequestInfo | URL,
        init?: RequestInit
      ) => {
        capturedHeaders = Object.fromEntries(
          new Headers(init?.headers).entries()
        );
        return new Response(
          JSON.stringify({
            id: "file-123",
            filename: "test.json",
            bytes: 100,
            created_at: 1234567890,
            purpose: "batch",
            object: "file",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      };

      const provider = xai({ apiKey: "sk-my-key", fetch: mockFetch });
      const blob = new Blob(['{"test": "data"}'], { type: "application/json" });
      const result = await provider.post.v1.files(blob, "test.json", "batch");

      expect(result.id).toBe("file-123");
      expect(capturedHeaders["authorization"]).toBe("Bearer sk-my-key");
      // FormData should not have Content-Type set (browser sets it with boundary)
      expect(capturedHeaders["content-type"]).toBeUndefined();
    });
  });

  describe("namespace structure", () => {
    it("has correct post.v1 namespace", () => {
      const provider = xai({ apiKey: "sk-test" });

      expect(provider.post.v1.responses).toBeDefined();
      expect(provider.post.v1.chat.completions).toBeDefined();
      expect(provider.post.v1.images.generations).toBeDefined();
      expect(provider.post.v1.images.edits).toBeDefined();
      expect(provider.post.v1.videos.generations).toBeDefined();
      expect(provider.post.v1.videos.edits).toBeDefined();
      expect(provider.post.v1.videos.extensions).toBeDefined();
      expect(provider.post.v1.files).toBeDefined();
      expect(provider.post.v1.batches).toBeDefined();
      expect(provider.post.v1.collections).toBeDefined();
      expect(provider.post.v1.documents.search).toBeDefined();
      expect(provider.post.v1.tokenizeText).toBeDefined();
      expect(provider.post.v1.realtime.clientSecrets).toBeDefined();
    });

    it("has correct get.v1 namespace", () => {
      const provider = xai({ apiKey: "sk-test" });

      expect(provider.get.v1.responses).toBeDefined();
      expect(provider.get.v1.chat.deferredCompletion).toBeDefined();
      expect(provider.get.v1.videos).toBeDefined();
      expect(provider.get.v1.files).toBeDefined();
      expect(provider.get.v1.models).toBeDefined();
      expect(provider.get.v1.languageModels).toBeDefined();
      expect(provider.get.v1.imageGenerationModels).toBeDefined();
      expect(provider.get.v1.videoGenerationModels).toBeDefined();
      expect(provider.get.v1.batches).toBeDefined();
      expect(provider.get.v1.collections).toBeDefined();
    });

    it("has correct delete.v1 namespace", () => {
      const provider = xai({ apiKey: "sk-test" });

      expect(provider.delete.v1.responses).toBeDefined();
      expect(provider.delete.v1.files).toBeDefined();
      expect(provider.delete.v1.collections).toBeDefined();
    });

    it("has correct put.v1 namespace", () => {
      const provider = xai({ apiKey: "sk-test" });

      expect(provider.put.v1.collections).toBeDefined();
    });

    it("has correct patch.v1 namespace", () => {
      const provider = xai({ apiKey: "sk-test" });

      expect(provider.patch.v1.collections.documents).toBeDefined();
    });

    it("has correct ws.v1 namespace", () => {
      const provider = xai({ apiKey: "sk-test" });

      expect(provider.ws.v1.realtime).toBeDefined();
    });
  });

  describe("payload schema and validatePayload methods", () => {
    it("has payloadSchema on chat.completions", () => {
      const provider = xai({ apiKey: "sk-test" });
      expect(provider.post.v1.chat.completions.payloadSchema).toBeDefined();
    });

    it("has validatePayload method on chat.completions", () => {
      const provider = xai({ apiKey: "sk-test" });
      expect(provider.post.v1.chat.completions.validatePayload).toBeDefined();

      const result = provider.post.v1.chat.completions.validatePayload({
        messages: [{ role: "user", content: "Hello" }],
      });
      expect(result.valid).toBe(true);
    });

    it("has validatePayload method on responses", () => {
      const provider = xai({ apiKey: "sk-test" });
      const result = provider.post.v1.responses.validatePayload({
        model: "grok-4-fast",
        input: "Hello",
      });
      expect(result.valid).toBe(true);
    });

    it("has validatePayload method on image.generations", () => {
      const provider = xai({ apiKey: "sk-test" });
      const result = provider.post.v1.images.generations.validatePayload({
        prompt: "A red apple",
      });
      expect(result.valid).toBe(true);
    });

    it("returns validation errors for invalid payload", () => {
      const provider = xai({ apiKey: "sk-test" });
      const result = provider.post.v1.chat.completions.validatePayload({});
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("messages is required");
    });
  });
});
