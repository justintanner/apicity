import { describe, it, expect, vi } from "vitest";

import { kieRequest } from "../../packages/provider/kie/src/request";
import { KieError } from "../../packages/provider/kie/src/types";

describe("KIE request utilities", () => {
  describe("kieRequest", () => {
    it("should make successful POST request", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: "result" }),
      });

      const result = await kieRequest("https://api.kie.ai/test", {
        method: "POST",
        apiKey: "test-key",
        body: { test: "data" },
        timeout: 30000,
        doFetch: mockFetch,
      });

      expect(result).toEqual({ data: "result" });
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.kie.ai/test",
        expect.objectContaining({
          method: "POST",
          headers: {
            Authorization: "Bearer test-key",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ test: "data" }),
        })
      );
    });

    it("should make successful GET request", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: "ok" }),
      });

      const result = await kieRequest("https://api.kie.ai/status", {
        method: "GET",
        apiKey: "test-key",
        timeout: 30000,
        doFetch: mockFetch,
      });

      expect(result).toEqual({ status: "ok" });
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.kie.ai/status",
        expect.objectContaining({
          method: "GET",
          headers: {
            Authorization: "Bearer test-key",
            "Content-Type": "application/json",
          },
        })
      );
    });

    it("should not include body for GET requests", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await kieRequest("https://api.kie.ai/test", {
        method: "GET",
        apiKey: "test-key",
        timeout: 30000,
        doFetch: mockFetch,
      });

      const init = mockFetch.mock.calls[0][1];
      expect(init.body).toBeUndefined();
    });

    it("should throw KieError on non-ok response", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ msg: "Bad Request" }),
      });

      await expect(
        kieRequest("https://api.kie.ai/test", {
          method: "POST",
          apiKey: "test-key",
          timeout: 30000,
          doFetch: mockFetch,
        })
      ).rejects.toBeInstanceOf(KieError);
    });

    it("should include error message from response body", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ msg: "Invalid parameters" }),
      });

      try {
        await kieRequest("https://api.kie.ai/test", {
          method: "POST",
          apiKey: "test-key",
          timeout: 30000,
          doFetch: mockFetch,
        });
      } catch (error) {
        expect(error).toBeInstanceOf(KieError);
        expect(error.message).toBe("Kie API error 400: Invalid parameters");
        expect(error.status).toBe(400);
      }
    });

    it("should use generic error message when no msg in body", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      });

      try {
        await kieRequest("https://api.kie.ai/test", {
          method: "POST",
          apiKey: "test-key",
          timeout: 30000,
          doFetch: mockFetch,
        });
      } catch (error) {
        expect(error).toBeInstanceOf(KieError);
        expect(error.message).toBe("Kie API error: 500");
      }
    });

    it("should handle JSON parse errors in error response", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error("Parse error")),
      });

      try {
        await kieRequest("https://api.kie.ai/test", {
          method: "POST",
          apiKey: "test-key",
          timeout: 30000,
          doFetch: mockFetch,
        });
      } catch (error) {
        expect(error).toBeInstanceOf(KieError);
        expect(error.message).toBe("Kie API error: 500");
      }
    });

    it("should throw KieError on network error", async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error("Network error"));

      try {
        await kieRequest("https://api.kie.ai/test", {
          method: "POST",
          apiKey: "test-key",
          timeout: 30000,
          doFetch: mockFetch,
        });
      } catch (error) {
        expect(error).toBeInstanceOf(KieError);
        expect(error.message).toContain("Request failed");
        expect(error.status).toBe(500);
      }
    });

    it("should throw KieError on timeout", async () => {
      const abortFn = vi.fn();
      const mockFetch = vi.fn().mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => {
            const error = new Error("The operation was aborted");
            (error as Error & { name: string }).name = "AbortError";
            reject(error);
          }, 10);
        });
      });

      await expect(
        kieRequest("https://api.kie.ai/test", {
          method: "POST",
          apiKey: "test-key",
          timeout: 5,
          doFetch: mockFetch,
        })
      ).rejects.toBeInstanceOf(KieError);
    });

    it("should rethrow existing KieError", async () => {
      const existingError = new KieError("Existing", 400);
      const mockFetch = vi.fn().mockRejectedValue(existingError);

      await expect(
        kieRequest("https://api.kie.ai/test", {
          method: "POST",
          apiKey: "test-key",
          timeout: 30000,
          doFetch: mockFetch,
        })
      ).rejects.toBe(existingError);
    });

    it("should set correct authorization header", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await kieRequest("https://api.kie.ai/test", {
        method: "POST",
        apiKey: "my-api-key",
        timeout: 30000,
        doFetch: mockFetch,
      });

      const init = mockFetch.mock.calls[0][1];
      expect(init.headers.Authorization).toBe("Bearer my-api-key");
    });

    it("should set correct content-type header", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await kieRequest("https://api.kie.ai/test", {
        method: "POST",
        apiKey: "test-key",
        timeout: 30000,
        doFetch: mockFetch,
      });

      const init = mockFetch.mock.calls[0][1];
      expect(init.headers["Content-Type"]).toBe("application/json");
    });

    it("should stringify body as JSON", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const body = { key: "value", nested: { data: 123 } };

      await kieRequest("https://api.kie.ai/test", {
        method: "POST",
        apiKey: "test-key",
        body,
        timeout: 30000,
        doFetch: mockFetch,
      });

      const init = mockFetch.mock.calls[0][1];
      expect(init.body).toBe(JSON.stringify(body));
    });

    it("should use abort controller for timeout", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await kieRequest("https://api.kie.ai/test", {
        method: "POST",
        apiKey: "test-key",
        timeout: 30000,
        doFetch: mockFetch,
      });

      const init = mockFetch.mock.calls[0][1];
      expect(init.signal).toBeDefined();
    });

    it("should handle request without body", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ result: "success" }),
      });

      const result = await kieRequest("https://api.kie.ai/test", {
        method: "POST",
        apiKey: "test-key",
        timeout: 30000,
        doFetch: mockFetch,
      });

      expect(result).toEqual({ result: "success" });
      const init = mockFetch.mock.calls[0][1];
      expect(init.body).toBeUndefined();
    });

    it("should clear timeout on success", async () => {
      const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await kieRequest("https://api.kie.ai/test", {
        method: "POST",
        apiKey: "test-key",
        timeout: 30000,
        doFetch: mockFetch,
      });

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });

    it("should preserve body in error when available", async () => {
      const errorBody = { error: "details", code: 123 };
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: () => Promise.resolve(errorBody),
      });

      try {
        await kieRequest("https://api.kie.ai/test", {
          method: "POST",
          apiKey: "test-key",
          timeout: 30000,
          doFetch: mockFetch,
        });
      } catch (error) {
        expect(error).toBeInstanceOf(KieError);
        expect(error.body).toEqual(errorBody);
      }
    });
  });
});
