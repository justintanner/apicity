import { describe, it, expect } from "vitest";

import { createClaudeProvider } from "../../packages/provider/kie/src/claude";
import { claudeMessagesSchema } from "../../packages/provider/kie/src/schemas";
import { validatePayload } from "../../packages/provider/kie/src/validate";

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

  describe("claudeMessagesSchema", () => {
    it("should have correct method and path", () => {
      expect(claudeMessagesSchema.method).toBe("POST");
      expect(claudeMessagesSchema.path).toBe("/claude/v1/messages");
      expect(claudeMessagesSchema.contentType).toBe("application/json");
    });

    it("should define correct fields", () => {
      const fields = claudeMessagesSchema.fields;

      expect(fields.model).toBeDefined();
      expect(fields.model.type).toBe("string");
      expect(fields.model.required).toBe(true);
      expect(fields.model.enum).toEqual([
        "claude-sonnet-4-6",
        "claude-haiku-4-5",
      ]);

      expect(fields.messages).toBeDefined();
      expect(fields.messages.type).toBe("array");
      expect(fields.messages.required).toBe(true);
      expect(fields.messages.items).toBeDefined();

      const messageProps = fields.messages.items?.properties;
      expect(messageProps?.role).toBeDefined();
      expect(messageProps?.role.type).toBe("string");
      expect(messageProps?.role.required).toBe(true);
      expect(messageProps?.role.enum).toEqual(["user", "assistant"]);

      expect(messageProps?.content).toBeDefined();
      expect(messageProps?.content.type).toBe("string");
      expect(messageProps?.content.required).toBe(true);

      expect(fields.tools).toBeDefined();
      expect(fields.tools.type).toBe("array");

      const toolProps = fields.tools?.items?.properties;
      expect(toolProps?.name).toBeDefined();
      expect(toolProps?.name.type).toBe("string");
      expect(toolProps?.name.required).toBe(true);
      expect(toolProps?.description).toBeDefined();
      expect(toolProps?.description.required).toBe(true);
      expect(toolProps?.input_schema).toBeDefined();
      expect(toolProps?.input_schema.required).toBe(true);

      expect(fields.thinkingFlag).toBeDefined();
      expect(fields.thinkingFlag.type).toBe("boolean");

      expect(fields.stream).toBeDefined();
      expect(fields.stream.type).toBe("boolean");
    });
  });

  describe("payload validation", () => {
    it("should validate valid messages payload", () => {
      const payload = {
        model: "claude-sonnet-4-6",
        messages: [{ role: "user", content: "Hello" }],
      };

      const result = validatePayload(payload, claudeMessagesSchema);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
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

      const result = validatePayload(payload, claudeMessagesSchema);
      expect(result.valid).toBe(true);
    });

    it("should reject payload without required model", () => {
      const payload = {
        messages: [{ role: "user", content: "Hello" }],
      };

      const result = validatePayload(payload, claudeMessagesSchema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("model is required");
    });

    it("should reject payload without required messages", () => {
      const payload = {
        model: "claude-sonnet-4-6",
      };

      const result = validatePayload(payload, claudeMessagesSchema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("messages is required");
    });

    it("should reject invalid model enum", () => {
      const payload = {
        model: "claude-opus",
        messages: [{ role: "user", content: "Hello" }],
      };

      const result = validatePayload(payload, claudeMessagesSchema);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("model must be one of");
    });

    it("should reject invalid message role", () => {
      const payload = {
        model: "claude-sonnet-4-6",
        messages: [{ role: "system", content: "Hello" }],
      };

      const result = validatePayload(payload, claudeMessagesSchema);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("messages[0].role must be one of");
    });

    it("should reject missing message content", () => {
      const payload = {
        model: "claude-sonnet-4-6",
        messages: [{ role: "user" }],
      };

      const result = validatePayload(payload, claudeMessagesSchema);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("messages[0].content is required");
    });

    it("should validate with both model options", () => {
      const validModels = ["claude-sonnet-4-6", "claude-haiku-4-5"];

      for (const model of validModels) {
        const result = validatePayload(
          { model, messages: [{ role: "user", content: "Hi" }] },
          claudeMessagesSchema
        );
        expect(result.valid).toBe(true);
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

      const result = validatePayload(payload, claudeMessagesSchema);
      expect(result.valid).toBe(true);
    });

    it("should validate with thinkingFlag", () => {
      const payload = {
        model: "claude-sonnet-4-6",
        messages: [{ role: "user", content: "Solve this puzzle" }],
        thinkingFlag: true,
      };

      const result = validatePayload(payload, claudeMessagesSchema);
      expect(result.valid).toBe(true);
    });

    it("should validate with stream enabled", () => {
      const payload = {
        model: "claude-sonnet-4-6",
        messages: [{ role: "user", content: "Hello" }],
        stream: true,
      };

      const result = validatePayload(payload, claudeMessagesSchema);
      expect(result.valid).toBe(true);
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

      const result = validatePayload(payload, claudeMessagesSchema);
      expect(result.valid).toBe(true);
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

      const result = validatePayload(payload, claudeMessagesSchema);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("tools[0].name is required");
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

      const result = validatePayload(payload, claudeMessagesSchema);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("tools[0].description is required");
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

      const result = validatePayload(payload, claudeMessagesSchema);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("tools[0].input_schema is required");
    });
  });

  describe("provider method validation", () => {
    it("messages should have payloadSchema attached", () => {
      const provider = createProvider();
      expect(provider.claude.post.v1.messages.payloadSchema).toBe(
        claudeMessagesSchema
      );
    });

    it("messages should have validatePayload method", () => {
      const provider = createProvider();
      expect(typeof provider.claude.post.v1.messages.validatePayload).toBe(
        "function"
      );
    });

    it("messages validatePayload should validate correctly", () => {
      const provider = createProvider();
      const result = provider.claude.post.v1.messages.validatePayload({
        model: "claude-sonnet-4-6",
        messages: [{ role: "user", content: "Hello" }],
      });
      expect(result.valid).toBe(true);
    });

    it("messages validatePayload should reject invalid payload", () => {
      const provider = createProvider();
      const result = provider.claude.post.v1.messages.validatePayload({
        messages: [{ role: "user", content: "Hello" }],
      });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("messages validatePayload should check model enum", () => {
      const provider = createProvider();
      const result = provider.claude.post.v1.messages.validatePayload({
        model: "invalid-model",
        messages: [{ role: "user", content: "Hello" }],
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("model"))).toBe(true);
    });
  });

  describe("KieClaudeMessage roles", () => {
    it("should accept valid role types", () => {
      const provider = createProvider();
      const validRoles = ["user", "assistant"];

      for (const role of validRoles) {
        const result = provider.claude.post.v1.messages.validatePayload({
          model: "claude-sonnet-4-6",
          messages: [{ role, content: "Test" }],
        });
        expect(result.valid).toBe(true);
      }
    });

    it("should reject system role", () => {
      const provider = createProvider();
      const result = provider.claude.post.v1.messages.validatePayload({
        model: "claude-sonnet-4-6",
        messages: [{ role: "system", content: "System prompt" }],
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("role must be one of");
    });
  });

  describe("claudeHaikuMessagesSchema", () => {
    it("should be same as claudeMessagesSchema", async () => {
      // Both schemas are identical per the source code
      const schemas = await import("../../packages/provider/kie/src/schemas");
      expect(schemas.claudeHaikuMessagesSchema).toBe(claudeMessagesSchema);
    });
  });
});
