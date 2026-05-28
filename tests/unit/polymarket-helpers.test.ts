import { describe, it, expect } from "vitest";
import {
  formatErrorMessage,
  readErrorBody,
} from "../../packages/provider/polymarket/src/_helpers";

describe("formatErrorMessage", () => {
  it("formats string body", () => {
    const result = formatErrorMessage(404, "Not found");
    expect(result).toBe("Polymarket API error 404: Not found");
  });

  it("formats object body with error field", () => {
    const result = formatErrorMessage(500, { error: "Server error" });
    expect(result).toBe("Polymarket API error 500: Server error");
  });

  it("formats object body with message field", () => {
    const result = formatErrorMessage(400, { message: "Bad request" });
    expect(result).toBe("Polymarket API error 400: Bad request");
  });

  it("prefers error field over message field", () => {
    const result = formatErrorMessage(400, {
      error: "Primary error",
      message: "Secondary message",
    });
    expect(result).toBe("Polymarket API error 400: Primary error");
  });

  it("returns generic message for null body", () => {
    const result = formatErrorMessage(500, null);
    expect(result).toBe("Polymarket API error: 500");
  });

  it("returns generic message for empty string body", () => {
    const result = formatErrorMessage(500, "");
    expect(result).toBe("Polymarket API error: 500");
  });

  it("returns generic message for object without error or message", () => {
    const result = formatErrorMessage(500, { code: 123 });
    expect(result).toBe("Polymarket API error: 500");
  });

  it("returns generic message for number body", () => {
    const result = formatErrorMessage(500, 42);
    expect(result).toBe("Polymarket API error: 500");
  });

  it("returns generic message for undefined body", () => {
    const result = formatErrorMessage(500, undefined);
    expect(result).toBe("Polymarket API error: 500");
  });
});

describe("readErrorBody", () => {
  it("returns parsed JSON for application/json response", async () => {
    const response = new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
    const result = await readErrorBody(response);
    expect(result).toEqual({ error: "Not found" });
  });

  it("returns text for text/plain response", async () => {
    const response = new Response("Something went wrong", {
      status: 500,
      headers: { "content-type": "text/plain" },
    });
    const result = await readErrorBody(response);
    expect(result).toBe("Something went wrong");
  });

  it("returns text when no content-type header", async () => {
    const response = new Response("Plain text error", {
      status: 500,
    });
    const result = await readErrorBody(response);
    expect(result).toBe("Plain text error");
  });

  it("returns null when body parsing fails", async () => {
    const response = {
      headers: new Headers({ "content-type": "application/json" }),
      json: () => Promise.reject(new Error("Parse error")),
      text: () => Promise.resolve("ok"),
    } as unknown as Response;
    const result = await readErrorBody(response);
    expect(result).toBe(null);
  });

  it("returns null when text parsing fails", async () => {
    const response = {
      headers: new Headers(),
      json: () => Promise.resolve({}),
      text: () => Promise.reject(new Error("Read error")),
    } as unknown as Response;
    const result = await readErrorBody(response);
    expect(result).toBe(null);
  });
});
