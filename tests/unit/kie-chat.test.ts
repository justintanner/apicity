import { describe, it, expect } from "vitest";

import { createChatProvider } from "../../packages/provider/kie/src/chat";
import { KieChatRequestSchema } from "../../packages/provider/kie/src/zod";

describe("KIE Chat provider", () => {
  const mockFetch = () => Promise.resolve(new Response());
  const createProvider = () =>
    createChatProvider("https://api.kie.ai", "test-api-key", mockFetch, 30000);

  describe("namespace structure", () => {
    it("should have correct namespace structure", () => {
      const provider = createProvider();

      expect(provider.completions).toBeDefined();
      expect(typeof provider.completions).toBe("function");
    });

    it("should have callable completions method", () => {
      const provider = createProvider();
      expect(typeof provider.completions).toBe("function");
    });
  });

  describe("KieChatRequestSchema", () => {
    it("should expose safeParse", () => {
      expect(typeof KieChatRequestSchema.safeParse).toBe("function");
    });

    it("should expose parse", () => {
      expect(typeof KieChatRequestSchema.parse).toBe("function");
    });
  });

  describe("payload validation", () => {
    it("should validate valid chat completion payload", () => {
      const payload = {
        model: "gpt-5.5",
        messages: [{ role: "user", content: "Hello" }],
      };

      const result = KieChatRequestSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("should validate with all optional fields", () => {
      const payload = {
        model: "gpt-5.5",
        messages: [
          { role: "system", content: "You are helpful" },
          { role: "user", content: "Hello" },
          { role: "assistant", content: "Hi there!" },
        ],
        temperature: 0.7,
        max_tokens: 1024,
        stream: false,
        response_format: { type: "json_object" },
      };

      const result = KieChatRequestSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("should reject payload without required model", () => {
      const payload = {
        messages: [{ role: "user", content: "Hello" }],
      };

      const result = KieChatRequestSchema.safeParse(payload);
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("model"))).toBe(
        true
      );
    });

    it("should reject payload without required messages", () => {
      const payload = {
        model: "gpt-5.5",
      };

      const result = KieChatRequestSchema.safeParse(payload);
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("messages"))
      ).toBe(true);
    });

    it("should reject invalid message role", () => {
      const payload = {
        model: "gpt-5.5",
        messages: [{ role: "invalid", content: "Hello" }],
      };

      const result = KieChatRequestSchema.safeParse(payload);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should reject missing message content", () => {
      const payload = {
        model: "gpt-5.5",
        messages: [{ role: "user" }],
      };

      const result = KieChatRequestSchema.safeParse(payload);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should validate multiple messages", () => {
      const payload = {
        model: "gpt-5.5",
        messages: [
          { role: "user", content: "Hello" },
          { role: "assistant", content: "Hi!" },
          { role: "user", content: "How are you?" },
        ],
      };

      const result = KieChatRequestSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("should reject non-array messages", () => {
      const payload = {
        model: "gpt-5.5",
        messages: "Hello",
      };

      const result = KieChatRequestSchema.safeParse(payload);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should validate response_format with json_schema", () => {
      const payload = {
        model: "gpt-5.5",
        messages: [{ role: "user", content: "Hello" }],
        response_format: {
          type: "json_schema",
          json_schema: {
            type: "object",
            properties: { name: { type: "string" } },
          },
        },
      };

      const result = KieChatRequestSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("should validate with stream enabled", () => {
      const payload = {
        model: "gpt-5.5",
        messages: [{ role: "user", content: "Hello" }],
        stream: true,
      };

      const result = KieChatRequestSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });
  });

  describe("provider method validation", () => {
    it("completions should have schema attached", () => {
      const provider = createProvider();
      expect(provider.completions.schema).toBeDefined();
      expect(typeof provider.completions.schema.safeParse).toBe("function");
    });

    it("completions schema should validate correctly", () => {
      const provider = createProvider();
      const result = provider.completions.schema.safeParse({
        model: "gpt-5.5",
        messages: [{ role: "user", content: "Hello" }],
      });
      expect(result.success).toBe(true);
    });

    it("completions schema should reject invalid payload", () => {
      const provider = createProvider();
      const result = provider.completions.schema.safeParse({
        model: "gpt-5.5",
      });
      expect(result.success).toBe(false);
      if (result.success) throw new Error("expected failure");
      expect(result.error.issues.length).toBeGreaterThan(0);
    });

    it("completions schema should check message roles", () => {
      const provider = createProvider();
      const result = provider.completions.schema.safeParse({
        model: "gpt-5.5",
        messages: [{ role: "invalid", content: "Hello" }],
      });
      expect(result.success).toBe(false);
      if (result.success) throw new Error("expected failure");
      expect(result.error.issues.length).toBeGreaterThan(0);
    });
  });

  describe("KieChatMessage types", () => {
    it("should validate all valid role types", () => {
      const provider = createProvider();
      const validRoles = ["user", "assistant", "system"];

      for (const role of validRoles) {
        const result = provider.completions.schema.safeParse({
          model: "gpt-5.5",
          messages: [{ role, content: "Test" }],
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe("response_format type validation", () => {
    it("should validate all valid response format types", () => {
      const validTypes = ["text", "json_object", "json_schema"];

      for (const type of validTypes) {
        const payload = {
          model: "gpt-5.5",
          messages: [{ role: "user", content: "Hello" }],
          response_format: { type },
        };

        const result = KieChatRequestSchema.safeParse(payload);
        expect(result.success).toBe(true);
      }
    });

    it("should reject invalid response_format type", () => {
      const payload = {
        model: "gpt-5.5",
        messages: [{ role: "user", content: "Hello" }],
        response_format: { type: "xml" },
      };

      const result = KieChatRequestSchema.safeParse(payload);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });
  });
});
