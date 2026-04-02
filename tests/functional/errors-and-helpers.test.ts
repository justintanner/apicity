// Tests for error classes and helper functions — pure constructors, no API calls
import { describe, it, expect } from "vitest";
import { OpenAiError } from "../../packages/provider/openai/src/types";
import { XaiError } from "../../packages/provider/xai/src/types";
import { FalError } from "../../packages/provider/fal/src/types";
import { KieError } from "../../packages/provider/kie/src/types";
import { KimiCodingError } from "../../packages/provider/kimicoding/src/types";
import { AnthropicError } from "../../packages/provider/anthropic/src/types";
import { FireworksError } from "../../packages/provider/fireworks/src/types";
import {
  textBlock,
  imageBase64,
  imageUrl,
} from "../../packages/provider/kimicoding/src/kimicoding";
import {
  textPart,
  imageUrlPart,
  imageBase64Part,
  firstContent,
} from "../../packages/provider/openai/src/openai";
import type { OpenAiChatResponse } from "../../packages/provider/openai/src/types";

describe("error classes", () => {
  describe("OpenAiError", () => {
    it("sets name, message, status, body, and code", () => {
      const err = new OpenAiError("not found", 404, { detail: "gone" }, "nf");
      expect(err).toBeInstanceOf(Error);
      expect(err.name).toBe("OpenAiError");
      expect(err.message).toBe("not found");
      expect(err.status).toBe(404);
      expect(err.body).toEqual({ detail: "gone" });
      expect(err.code).toBe("nf");
    });

    it("defaults body to null when omitted", () => {
      const err = new OpenAiError("fail", 500);
      expect(err.body).toBeNull();
      expect(err.code).toBeUndefined();
    });
  });

  describe("XaiError", () => {
    it("sets all properties", () => {
      const err = new XaiError("rate limited", 429, null, "rate_limit");
      expect(err.name).toBe("XaiError");
      expect(err.status).toBe(429);
      expect(err.code).toBe("rate_limit");
    });

    it("defaults body to null", () => {
      const err = new XaiError("fail", 500);
      expect(err.body).toBeNull();
    });
  });

  describe("FalError", () => {
    it("sets all properties including type, request_id, docs_url", () => {
      const err = new FalError(
        "auth failed",
        401,
        "authentication_error",
        "req-123",
        "https://docs.fal.ai",
        { error: "bad key" }
      );
      expect(err.name).toBe("FalError");
      expect(err.message).toBe("auth failed");
      expect(err.status).toBe(401);
      expect(err.type).toBe("authentication_error");
      expect(err.request_id).toBe("req-123");
      expect(err.docs_url).toBe("https://docs.fal.ai");
      expect(err.body).toEqual({ error: "bad key" });
    });

    it("handles optional fields", () => {
      const err = new FalError("fail", 500, "server_error");
      expect(err.request_id).toBeUndefined();
      expect(err.docs_url).toBeUndefined();
      expect(err.body).toBeNull();
    });
  });

  describe("KieError", () => {
    it("sets all properties", () => {
      const err = new KieError("bad request", 400, { msg: "invalid" }, "bad");
      expect(err.name).toBe("KieError");
      expect(err.status).toBe(400);
      expect(err.body).toEqual({ msg: "invalid" });
      expect(err.code).toBe("bad");
    });
  });

  describe("KimiCodingError", () => {
    it("sets name, message, status, body", () => {
      const err = new KimiCodingError("timeout", 408, { detail: "slow" });
      expect(err.name).toBe("KimiCodingError");
      expect(err.message).toBe("timeout");
      expect(err.status).toBe(408);
      expect(err.body).toEqual({ detail: "slow" });
    });

    it("defaults body to null", () => {
      const err = new KimiCodingError("fail", 500);
      expect(err.body).toBeNull();
    });

    it("is instanceof Error", () => {
      const err = new KimiCodingError("x", 500);
      expect(err).toBeInstanceOf(Error);
    });
  });

  describe("AnthropicError", () => {
    it("sets all properties including errorType", () => {
      const err = new AnthropicError(
        "invalid request",
        400,
        { error: { type: "invalid_request_error" } },
        "invalid_request_error"
      );
      expect(err).toBeInstanceOf(Error);
      expect(err.name).toBe("AnthropicError");
      expect(err.message).toBe("invalid request");
      expect(err.status).toBe(400);
      expect(err.body).toEqual({ error: { type: "invalid_request_error" } });
      expect(err.errorType).toBe("invalid_request_error");
    });

    it("defaults body to null when omitted", () => {
      const err = new AnthropicError("fail", 500);
      expect(err.body).toBeNull();
      expect(err.errorType).toBeUndefined();
    });

    it("handles optional errorType", () => {
      const err = new AnthropicError("not found", 404, { detail: "missing" });
      expect(err.body).toEqual({ detail: "missing" });
      expect(err.errorType).toBeUndefined();
    });
  });

  describe("FireworksError", () => {
    it("sets all properties including code", () => {
      const err = new FireworksError(
        "model not found",
        404,
        { error: "model_does_not_exist" },
        "model_not_found"
      );
      expect(err).toBeInstanceOf(Error);
      expect(err.name).toBe("FireworksError");
      expect(err.message).toBe("model not found");
      expect(err.status).toBe(404);
      expect(err.body).toEqual({ error: "model_does_not_exist" });
      expect(err.code).toBe("model_not_found");
    });

    it("defaults body to null when omitted", () => {
      const err = new FireworksError("fail", 500);
      expect(err.body).toBeNull();
      expect(err.code).toBeUndefined();
    });

    it("handles body without code", () => {
      const err = new FireworksError("bad request", 400, { detail: "invalid" });
      expect(err.body).toEqual({ detail: "invalid" });
      expect(err.code).toBeUndefined();
    });
  });
});

describe("kimicoding content helpers", () => {
  describe("textBlock", () => {
    it("returns text content block", () => {
      expect(textBlock("hello")).toEqual({ type: "text", text: "hello" });
    });

    it("handles empty string", () => {
      expect(textBlock("")).toEqual({ type: "text", text: "" });
    });
  });

  describe("imageBase64", () => {
    it("returns base64 image content block", () => {
      expect(imageBase64("abc123", "image/png")).toEqual({
        type: "image",
        source: { type: "base64", media_type: "image/png", data: "abc123" },
      });
    });

    it("supports all media types", () => {
      for (const mt of [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ] as const) {
        const block = imageBase64("data", mt);
        expect(block.source.media_type).toBe(mt);
      }
    });
  });

  describe("imageUrl", () => {
    it("returns url image content block", () => {
      expect(imageUrl("https://example.com/img.png")).toEqual({
        type: "image",
        source: { type: "url", url: "https://example.com/img.png" },
      });
    });
  });
});

describe("openai content helpers", () => {
  describe("textPart", () => {
    it("returns text content part", () => {
      expect(textPart("hello")).toEqual({ type: "text", text: "hello" });
    });

    it("handles empty string", () => {
      expect(textPart("")).toEqual({ type: "text", text: "" });
    });
  });

  describe("imageUrlPart", () => {
    it("returns image_url content part with url", () => {
      const part = imageUrlPart("https://example.com/img.png");
      expect(part).toEqual({
        type: "image_url",
        image_url: { url: "https://example.com/img.png" },
      });
    });

    it("includes detail when provided", () => {
      const part = imageUrlPart("https://example.com/img.png", "high");
      expect(part.image_url.detail).toBe("high");
    });

    it("omits detail when not provided", () => {
      const part = imageUrlPart("https://example.com/img.png");
      expect(part.image_url.detail).toBeUndefined();
    });

    it("supports all detail levels", () => {
      const levels = ["auto", "low", "high"] as const;
      for (const level of levels) {
        const part = imageUrlPart("https://example.com/img.png", level);
        expect(part.image_url.detail).toBe(level);
      }
    });
  });

  describe("imageBase64Part", () => {
    it("returns image_url content part with data URL", () => {
      const part = imageBase64Part("abc123", "image/png");
      expect(part).toEqual({
        type: "image_url",
        image_url: { url: "data:image/png;base64,abc123" },
      });
    });

    it("supports different media types", () => {
      const mediaTypes = ["image/png", "image/jpeg", "image/gif", "image/webp"];
      for (const mt of mediaTypes) {
        const part = imageBase64Part("data", mt);
        expect(part.image_url.url).toBe(`data:${mt};base64,data`);
      }
    });

    it("passes detail through to imageUrlPart", () => {
      const part = imageBase64Part("abc123", "image/png", "low");
      expect(part.image_url.detail).toBe("low");
    });
  });

  describe("firstContent", () => {
    it("returns content from first choice", () => {
      const response = {
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: "Hello!" },
            finish_reason: "stop",
          },
        ],
      } as OpenAiChatResponse;
      expect(firstContent(response)).toBe("Hello!");
    });

    it("returns empty string when no choices", () => {
      const response = { choices: [] } as unknown as OpenAiChatResponse;
      expect(firstContent(response)).toBe("");
    });

    it("returns empty string when content is null", () => {
      const response = {
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: null },
            finish_reason: "stop",
          },
        ],
      } as OpenAiChatResponse;
      expect(firstContent(response)).toBe("");
    });

    it("returns empty string when message is undefined", () => {
      const response = {
        choices: [{ index: 0, finish_reason: "stop" }],
      } as unknown as OpenAiChatResponse;
      expect(firstContent(response)).toBe("");
    });
  });
});
