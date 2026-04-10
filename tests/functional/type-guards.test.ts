// Tests for type guard functions — pure validation logic, no API calls
import { describe, it, expect } from "vitest";

// Import type guards indirectly by testing their behavior through error handling
import { fal } from "../../packages/provider/fal/src/fal";
import { kimicoding } from "../../packages/provider/kimicoding/src/kimicoding";

describe("fal isFalApiErrorResponse type guard", () => {
  it("recognizes valid fal error response", async () => {
    let capturedError: Error | null = null;
    const mockFetch = (): Promise<Response> => {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            error: {
              type: "authentication_error",
              message: "Invalid API key",
              docs_url: "https://docs.fal.ai",
              request_id: "req-123",
            },
          }),
          { status: 401 }
        )
      );
    };
    const p = fal({ apiKey: "test", fetch: mockFetch as typeof fetch });
    try {
      await p.ai.v1.models();
    } catch (err) {
      capturedError = err as Error;
    }
    expect(capturedError).not.toBeNull();
    expect(capturedError?.message).toBe("Invalid API key");
  });

  it("handles error without optional fields", async () => {
    let capturedError: Error | null = null;
    const mockFetch = (): Promise<Response> => {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            error: {
              type: "server_error",
              message: "Internal server error",
            },
          }),
          { status: 500 }
        )
      );
    };
    const p = fal({ apiKey: "test", fetch: mockFetch as typeof fetch });
    try {
      await p.ai.v1.models();
    } catch (err) {
      capturedError = err as Error;
    }
    expect(capturedError).not.toBeNull();
    expect(capturedError?.message).toBe("Internal server error");
  });

  it("handles non-object error data gracefully", async () => {
    let capturedError: Error | null = null;
    const mockFetch = (): Promise<Response> => {
      return Promise.resolve(
        new Response("Internal Server Error", { status: 500 })
      );
    };
    const p = fal({ apiKey: "test", fetch: mockFetch as typeof fetch });
    try {
      await p.ai.v1.models();
    } catch (err) {
      capturedError = err as Error;
    }
    expect(capturedError).not.toBeNull();
    // Falls back to generic error message when parsing fails
    expect(capturedError?.message).toContain("Fal API error: 500");
  });

  it("handles null error data gracefully", async () => {
    let capturedError: Error | null = null;
    const mockFetch = (): Promise<Response> => {
      return Promise.resolve(
        new Response(JSON.stringify(null), { status: 500 })
      );
    };
    const p = fal({ apiKey: "test", fetch: mockFetch as typeof fetch });
    try {
      await p.ai.v1.models();
    } catch (err) {
      capturedError = err as Error;
    }
    expect(capturedError).not.toBeNull();
    expect(capturedError?.message).toContain("Fal API error: 500");
  });

  it("handles error object without error property", async () => {
    let capturedError: Error | null = null;
    const mockFetch = (): Promise<Response> => {
      return Promise.resolve(
        new Response(JSON.stringify({ message: "Something went wrong" }), {
          status: 500,
        })
      );
    };
    const p = fal({ apiKey: "test", fetch: mockFetch as typeof fetch });
    try {
      await p.ai.v1.models();
    } catch (err) {
      capturedError = err as Error;
    }
    expect(capturedError).not.toBeNull();
    expect(capturedError?.message).toContain("Fal API error: 500");
  });

  it("preserves request_id and docs_url when present", async () => {
    let capturedError:
      | (Error & { request_id?: string; docs_url?: string })
      | null = null;
    const mockFetch = (): Promise<Response> => {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            error: {
              type: "rate_limited",
              message: "Rate limit exceeded",
              request_id: "req-abc-123",
              docs_url: "https://docs.fal.ai/rate-limits",
            },
          }),
          { status: 429 }
        )
      );
    };
    const p = fal({ apiKey: "test", fetch: mockFetch as typeof fetch });
    try {
      await p.ai.v1.models();
    } catch (err) {
      capturedError = err as Error & { request_id?: string; docs_url?: string };
    }
    expect(capturedError).not.toBeNull();
    expect(capturedError?.request_id).toBe("req-abc-123");
    expect(capturedError?.docs_url).toBe("https://docs.fal.ai/rate-limits");
  });
});

describe("kimicoding isAnthropicErrorBody type guard", () => {
  it("recognizes valid anthropic-style error body", async () => {
    let capturedError: Error | null = null;
    const mockFetch = (): Promise<Response> => {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            error: {
              type: "authentication_error",
              message: "Invalid x-api-key",
            },
          }),
          { status: 401 }
        )
      );
    };
    const p = kimicoding({ apiKey: "test", fetch: mockFetch as typeof fetch });
    try {
      await p.get.coding.v1.models();
    } catch (err) {
      capturedError = err as Error;
    }
    expect(capturedError).not.toBeNull();
    // Error message includes the API error message
    expect(capturedError?.message).toContain("Invalid x-api-key");
  });

  it("handles error without nested error object", async () => {
    let capturedError: Error | null = null;
    const mockFetch = (): Promise<Response> => {
      return Promise.resolve(
        new Response(JSON.stringify({ message: "Bad request" }), {
          status: 400,
        })
      );
    };
    const p = kimicoding({ apiKey: "test", fetch: mockFetch as typeof fetch });
    try {
      await p.get.coding.v1.models();
    } catch (err) {
      capturedError = err as Error;
    }
    expect(capturedError).not.toBeNull();
    // Falls back to generic error message
    expect(capturedError?.message).toContain("KimiCoding error: 400");
  });

  it("handles non-object response body", async () => {
    let capturedError: Error | null = null;
    const mockFetch = (): Promise<Response> => {
      return Promise.resolve(
        new Response("Internal Server Error", { status: 500 })
      );
    };
    const p = kimicoding({ apiKey: "test", fetch: mockFetch as typeof fetch });
    try {
      await p.get.coding.v1.models();
    } catch (err) {
      capturedError = err as Error;
    }
    expect(capturedError).not.toBeNull();
    expect(capturedError?.message).toContain("KimiCoding error: 500");
  });

  it("handles null response body", async () => {
    let capturedError: Error | null = null;
    const mockFetch = (): Promise<Response> => {
      return Promise.resolve(
        new Response(JSON.stringify(null), { status: 500 })
      );
    };
    const p = kimicoding({ apiKey: "test", fetch: mockFetch as typeof fetch });
    try {
      await p.get.coding.v1.models();
    } catch (err) {
      capturedError = err as Error;
    }
    expect(capturedError).not.toBeNull();
    expect(capturedError?.message).toContain("KimiCoding error: 500");
  });

  it("handles error with empty error object", async () => {
    let capturedError: Error | null = null;
    const mockFetch = (): Promise<Response> => {
      return Promise.resolve(
        new Response(JSON.stringify({ error: {} }), { status: 500 })
      );
    };
    const p = kimicoding({ apiKey: "test", fetch: mockFetch as typeof fetch });
    try {
      await p.get.coding.v1.models();
    } catch (err) {
      capturedError = err as Error;
    }
    expect(capturedError).not.toBeNull();
    // Should still use generic error since message is missing
    expect(capturedError?.message).toContain("KimiCoding error: 500");
  });

  it("handles network/connection errors", async () => {
    let capturedError: Error | null = null;
    const mockFetch = (): Promise<Response> => {
      return Promise.reject(new Error("Network error"));
    };
    const p = kimicoding({ apiKey: "test", fetch: mockFetch as typeof fetch });
    try {
      await p.get.coding.v1.models();
    } catch (err) {
      capturedError = err as Error;
    }
    expect(capturedError).not.toBeNull();
    expect(capturedError?.message).toContain("KimiCoding request failed");
  });

  it("preserves error body in error object", async () => {
    let capturedError: (Error & { body?: unknown }) | null = null;
    const errorBody = {
      error: {
        type: "invalid_request_error",
        message: "Invalid model",
      },
    };
    const mockFetch = (): Promise<Response> => {
      return Promise.resolve(
        new Response(JSON.stringify(errorBody), { status: 400 })
      );
    };
    const p = kimicoding({ apiKey: "test", fetch: mockFetch as typeof fetch });
    try {
      await p.get.coding.v1.models();
    } catch (err) {
      capturedError = err as Error & { body?: unknown };
    }
    expect(capturedError).not.toBeNull();
    expect(capturedError?.body).toEqual(errorBody);
  });
});
