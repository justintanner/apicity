// Unit tests for xAI XaiError class — no API calls
import { describe, it, expect } from "vitest";
import { XaiError } from "../../packages/provider/xai/src/types";

describe("xAI XaiError", () => {
  it("creates error with message and status", () => {
    const error = new XaiError("Something went wrong", 500);
    expect(error.message).toBe("Something went wrong");
    expect(error.status).toBe(500);
    expect(error.name).toBe("XaiError");
  });

  it("creates error with body", () => {
    const body = { error: { message: "Detailed error" } };
    const error = new XaiError("API error", 400, body);
    expect(error.body).toBe(body);
  });

  it("creates error with code", () => {
    const error = new XaiError(
      "Rate limited",
      429,
      null,
      "RATE_LIMIT_EXCEEDED"
    );
    expect(error.code).toBe("RATE_LIMIT_EXCEEDED");
  });

  it("defaults body to null when not provided", () => {
    const error = new XaiError("Error", 500);
    expect(error.body).toBeNull();
  });

  it("defaults code to undefined when not provided", () => {
    const error = new XaiError("Error", 500);
    expect(error.code).toBeUndefined();
  });

  it("is instanceof Error", () => {
    const error = new XaiError("Test", 500);
    expect(error).toBeInstanceOf(Error);
  });

  it("is instanceof XaiError", () => {
    const error = new XaiError("Test", 500);
    expect(error).toBeInstanceOf(XaiError);
  });

  it("captures stack trace", () => {
    const error = new XaiError("Test", 500);
    expect(error.stack).toBeDefined();
    expect(error.stack).toContain("XaiError");
  });

  it("works with try/catch and instanceof", () => {
    try {
      throw new XaiError("Test error", 400);
    } catch (e) {
      expect(e instanceof XaiError).toBe(true);
      expect(e instanceof Error).toBe(true);
    }
  });

  it("handles 400 bad request", () => {
    const error = new XaiError("Bad request", 400, {
      error: { message: "Invalid parameter" },
    });
    expect(error.status).toBe(400);
    expect(error.body).toEqual({ error: { message: "Invalid parameter" } });
  });

  it("handles 401 unauthorized", () => {
    const error = new XaiError("Unauthorized", 401);
    expect(error.status).toBe(401);
  });

  it("handles 403 forbidden", () => {
    const error = new XaiError("Forbidden", 403);
    expect(error.status).toBe(403);
  });

  it("handles 404 not found", () => {
    const error = new XaiError("Not found", 404);
    expect(error.status).toBe(404);
  });

  it("handles 429 rate limit", () => {
    const error = new XaiError("Rate limited", 429, {
      error: { message: "Too many requests" },
    });
    expect(error.status).toBe(429);
  });

  it("handles 500 server error", () => {
    const error = new XaiError("Internal server error", 500);
    expect(error.status).toBe(500);
  });

  it("handles 503 service unavailable", () => {
    const error = new XaiError("Service unavailable", 503);
    expect(error.status).toBe(503);
  });

  it("handles complex error body", () => {
    const complexBody = {
      error: {
        message: "Multiple errors",
        type: "invalid_request_error",
        param: "messages",
        code: "invalid_role",
      },
    };
    const error = new XaiError("Request failed", 400, complexBody);
    expect(error.body).toEqual(complexBody);
  });
});
