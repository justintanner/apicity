import { describe, it, expect } from "vitest";

import { createClaudeProvider } from "../../packages/provider/kie/src/claude";
import { KieClaudeRequestSchema } from "../../packages/provider/kie/src/zod";

describe("KIE Claude provider", () => {
  const mockFetch = () => Promise.resolve(new Response());
  const createProvider = () =>
    createClaudeProvider(
      "https://api.kie.ai",
      "test-api-key",
      mockFetch,
      30000
    );

  describe("namespace structure", () => {
    it("should have correct namespace structure", () => {
      const provider = createProvider();

      expect(provider.claude).toBeDefined();
      expect(provider.claude.post).toBeDefined();
      expect(provider.claude.post.v1).toBeDefined();
      expect(provider.claude.post.v1.messages).toBeDefined();
      expect(typeof provider.claude.post.v1.messages).toBe("function");
    });
  });

  describe("KieClaudeRequestSchema", () => {
    it("should expose safeParse", () => {
      expect(typeof KieClaudeRequestSchema.safeParse).toBe("function");
    });

    it("should expose parse", () => {
      expect(typeof KieClaudeRequestSchema.parse).toBe("function");
    });
  });

  describe("payload validation", () => {
    it("should validate valid messages payload", () => {
      const payload = {
        model: "claude-sonnet-4-6",
        messages: [{ role: "user", content: "Hello" }],
      };

      const result = KieClaudeRequestSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("should validate with conversation history", () => {
      const payload = {
        model: "claude-sonnet-4-6",
        messages: [
          { role: "user", content: "Hello" },
          { role: "assistant", content: "Hi there!" },
          { role: "user", content: "How are you?" },
        ],
      };

      const result = KieClaudeRequestSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("should reject payload without required model", () => {
      const payload = {
        messages: [{ role: "user", content: "Hello" }],
      };

      const result = KieClaudeRequestSchema.safeParse(payload);
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("model"))).toBe(
        true
      );
    });

    it("should reject payload without required messages", () => {
      const payload = {
        model: "claude-sonnet-4-6",
      };

      const result = KieClaudeRequestSchema.safeParse(payload);
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("messages"))
      ).toBe(true);
    });

    it("should reject invalid model enum", () => {
      const payload = {
        model: "claude-opus",
        messages: [{ role: "user", content: "Hello" }],
      };

      const result = KieClaudeRequestSchema.safeParse(payload);
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("model"))).toBe(
        true
      );
    });

    it("should reject invalid message role", () => {
      const payload = {
        model: "claude-sonnet-4-6",
        messages: [{ role: "system", content: "Hello" }],
      };

      const result = KieClaudeRequestSchema.safeParse(payload);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should reject missing message content", () => {
      const payload = {
        model: "claude-sonnet-4-6",
        messages: [{ role: "user" }],
      };

      const result = KieClaudeRequestSchema.safeParse(payload);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should validate all listed model options", () => {
      const validModels = [
        "claude-sonnet-4-6",
        "claude-haiku-4-5",
        "claude-opus-5",
      ];

      for (const model of validModels) {
        const result = KieClaudeRequestSchema.safeParse({
          model,
          messages: [{ role: "user", content: "Hi" }],
        });
        expect(result.success).toBe(true);
      }
    });

    it("should validate with tools", () => {
      const payload = {
        model: "claude-sonnet-4-6",
        messages: [{ role: "user", content: "What's the weather?" }],
        tools: [
          {
            name: "get_weather",
            description: "Get weather information",
            input_schema: {
              type: "object",
              properties: { location: { type: "string" } },
            },
          },
        ],
      };

      const result = KieClaudeRequestSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("should validate with thinkingFlag", () => {
      const payload = {
        model: "claude-sonnet-4-6",
        messages: [{ role: "user", content: "Solve this puzzle" }],
        thinkingFlag: true,
      };

      const result = KieClaudeRequestSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("should validate with stream enabled", () => {
      const payload = {
        model: "claude-sonnet-4-6",
        messages: [{ role: "user", content: "Hello" }],
        stream: true,
      };

      const result = KieClaudeRequestSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("should validate complete payload with all optional fields", () => {
      const payload = {
        model: "claude-haiku-4-5",
        messages: [
          { role: "user", content: "Calculate 2+2" },
          { role: "assistant", content: "4" },
        ],
        tools: [
          {
            name: "calculator",
            description: "Perform calculations",
            input_schema: { type: "object" },
          },
        ],
        thinkingFlag: false,
        stream: false,
      };

      const result = KieClaudeRequestSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("should reject tool without required name", () => {
      const payload = {
        model: "claude-sonnet-4-6",
        messages: [{ role: "user", content: "Hello" }],
        tools: [
          {
            description: "A tool",
            input_schema: { type: "object" },
          },
        ],
      };

      const result = KieClaudeRequestSchema.safeParse(payload);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should reject tool without required description", () => {
      const payload = {
        model: "claude-sonnet-4-6",
        messages: [{ role: "user", content: "Hello" }],
        tools: [
          {
            name: "my_tool",
            input_schema: { type: "object" },
          },
        ],
      };

      const result = KieClaudeRequestSchema.safeParse(payload);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should reject tool without required input_schema", () => {
      const payload = {
        model: "claude-sonnet-4-6",
        messages: [{ role: "user", content: "Hello" }],
        tools: [
          {
            name: "my_tool",
            description: "A tool",
          },
        ],
      };

      const result = KieClaudeRequestSchema.safeParse(payload);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });
  });

  describe("provider method validation", () => {
    it("messages should have schema attached", () => {
      const provider = createProvider();
      expect(provider.claude.post.v1.messages.schema).toBeDefined();
      expect(typeof provider.claude.post.v1.messages.schema.safeParse).toBe(
        "function"
      );
    });

    it("messages schema should validate correctly", () => {
      const provider = createProvider();
      const result = provider.claude.post.v1.messages.schema.safeParse({
        model: "claude-sonnet-4-6",
        messages: [{ role: "user", content: "Hello" }],
      });
      expect(result.success).toBe(true);
    });

    it("messages schema should reject invalid payload", () => {
      const provider = createProvider();
      const result = provider.claude.post.v1.messages.schema.safeParse({
        messages: [{ role: "user", content: "Hello" }],
      });
      expect(result.success).toBe(false);
      if (result.success) throw new Error("expected failure");
      expect(result.error.issues.length).toBeGreaterThan(0);
    });

    it("messages schema should check model enum", () => {
      const provider = createProvider();
      const result = provider.claude.post.v1.messages.schema.safeParse({
        model: "invalid-model",
        messages: [{ role: "user", content: "Hello" }],
      });
      expect(result.success).toBe(false);
      if (result.success) throw new Error("expected failure");
      expect(result.error.issues.some((i) => i.path.includes("model"))).toBe(
        true
      );
    });
  });

  describe("KieClaudeMessage roles", () => {
    it("should accept valid role types", () => {
      const provider = createProvider();
      const validRoles = ["user", "assistant"];

      for (const role of validRoles) {
        const result = provider.claude.post.v1.messages.schema.safeParse({
          model: "claude-sonnet-4-6",
          messages: [{ role, content: "Test" }],
        });
        expect(result.success).toBe(true);
      }
    });

    it("should reject system role", () => {
      const provider = createProvider();
      const result = provider.claude.post.v1.messages.schema.safeParse({
        model: "claude-sonnet-4-6",
        messages: [{ role: "system", content: "System prompt" }],
      });
      expect(result.success).toBe(false);
      if (result.success) throw new Error("expected failure");
      expect(result.error.issues.length).toBeGreaterThan(0);
    });
  });

  describe("claudeHaikuMessagesSchema", () => {
    it("should validate haiku model using KieClaudeRequestSchema", () => {
      // Both sonnet and haiku are validated by the same schema
      const result = KieClaudeRequestSchema.safeParse({
        model: "claude-haiku-4-5",
        messages: [{ role: "user", content: "Hello" }],
      });
      expect(result.success).toBe(true);
    });
  });
});
