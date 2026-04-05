import { describe, it, expect } from "vitest";

import { createChatProvider } from "../../packages/provider/kie/src/chat";
import {
  chatCompletions55Schema,
  chatCompletionsSchema,
} from "../../packages/provider/kie/src/schemas";
import { validatePayload } from "../../packages/provider/kie/src/validate";

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

  describe("chatCompletions55Schema", () => {
    it("should have correct method and path", () => {
      expect(chatCompletions55Schema.method).toBe("POST");
      expect(chatCompletions55Schema.path).toBe("/gpt-5.5/v1/chat/completions");
      expect(chatCompletions55Schema.contentType).toBe("application/json");
    });

    it("should define correct fields", () => {
      const fields = chatCompletions55Schema.fields;

      expect(fields.model).toBeDefined();
      expect(fields.model.type).toBe("string");
      expect(fields.model.required).toBe(true);

      expect(fields.messages).toBeDefined();
      expect(fields.messages.type).toBe("array");
      expect(fields.messages.required).toBe(true);
      expect(fields.messages.items).toBeDefined();
      expect(fields.messages.items?.type).toBe("object");
      expect(fields.messages.items?.properties).toBeDefined();

      const messageProps = fields.messages.items?.properties;
      expect(messageProps?.role).toBeDefined();
      expect(messageProps?.role.type).toBe("string");
      expect(messageProps?.role.required).toBe(true);
      expect(messageProps?.role.enum).toEqual(["user", "assistant", "system"]);

      expect(messageProps?.content).toBeDefined();
      expect(messageProps?.content.type).toBe("string");
      expect(messageProps?.content.required).toBe(true);

      expect(fields.temperature).toBeDefined();
      expect(fields.temperature.type).toBe("number");

      expect(fields.max_tokens).toBeDefined();
      expect(fields.max_tokens.type).toBe("number");

      expect(fields.stream).toBeDefined();
      expect(fields.stream.type).toBe("boolean");

      expect(fields.response_format).toBeDefined();
      expect(fields.response_format.type).toBe("object");
    });
  });

  describe("chatCompletionsSchema (gpt-5-2)", () => {
    it("should have correct method and path", () => {
      expect(chatCompletionsSchema.method).toBe("POST");
      expect(chatCompletionsSchema.path).toBe("/gpt-5-2/v1/chat/completions");
      expect(chatCompletionsSchema.contentType).toBe("application/json");
    });

    it("should have same field structure as chatCompletions55Schema", () => {
      expect(chatCompletionsSchema.fields.model).toBeDefined();
      expect(chatCompletionsSchema.fields.messages).toBeDefined();
      expect(chatCompletionsSchema.fields.temperature).toBeDefined();
      expect(chatCompletionsSchema.fields.max_tokens).toBeDefined();
    });
  });

  describe("payload validation", () => {
    it("should validate valid chat completion payload", () => {
      const payload = {
        model: "gpt-5.5",
        messages: [{ role: "user", content: "Hello" }],
      };

      const result = validatePayload(payload, chatCompletions55Schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
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

      const result = validatePayload(payload, chatCompletions55Schema);
      expect(result.valid).toBe(true);
    });

    it("should reject payload without required model", () => {
      const payload = {
        messages: [{ role: "user", content: "Hello" }],
      };

      const result = validatePayload(payload, chatCompletions55Schema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("model is required");
    });

    it("should reject payload without required messages", () => {
      const payload = {
        model: "gpt-5.5",
      };

      const result = validatePayload(payload, chatCompletions55Schema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("messages is required");
    });

    it("should reject invalid message role", () => {
      const payload = {
        model: "gpt-5.5",
        messages: [{ role: "invalid", content: "Hello" }],
      };

      const result = validatePayload(payload, chatCompletions55Schema);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("messages[0].role must be one of");
    });

    it("should reject missing message content", () => {
      const payload = {
        model: "gpt-5.5",
        messages: [{ role: "user" }],
      };

      const result = validatePayload(payload, chatCompletions55Schema);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("messages[0].content is required");
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

      const result = validatePayload(payload, chatCompletions55Schema);
      expect(result.valid).toBe(true);
    });

    it("should reject non-array messages", () => {
      const payload = {
        model: "gpt-5.5",
        messages: "Hello",
      };

      const result = validatePayload(payload, chatCompletions55Schema);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("messages must be of type");
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

      const result = validatePayload(payload, chatCompletions55Schema);
      expect(result.valid).toBe(true);
    });

    it("should validate with stream enabled", () => {
      const payload = {
        model: "gpt-5.5",
        messages: [{ role: "user", content: "Hello" }],
        stream: true,
      };

      const result = validatePayload(payload, chatCompletions55Schema);
      expect(result.valid).toBe(true);
    });
  });

  describe("provider method validation", () => {
    it("completions should have payloadSchema attached", () => {
      const provider = createProvider();
      expect(provider.completions.payloadSchema).toBe(chatCompletions55Schema);
    });

    it("completions should have validatePayload method", () => {
      const provider = createProvider();
      expect(typeof provider.completions.validatePayload).toBe("function");
    });

    it("completions validatePayload should validate correctly", () => {
      const provider = createProvider();
      const result = provider.completions.validatePayload({
        model: "gpt-5.5",
        messages: [{ role: "user", content: "Hello" }],
      });
      expect(result.valid).toBe(true);
    });

    it("completions validatePayload should reject invalid payload", () => {
      const provider = createProvider();
      const result = provider.completions.validatePayload({
        model: "gpt-5.5",
      });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("completions validatePayload should check message roles", () => {
      const provider = createProvider();
      const result = provider.completions.validatePayload({
        model: "gpt-5.5",
        messages: [{ role: "invalid", content: "Hello" }],
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("role"))).toBe(true);
    });
  });

  describe("KieChatMessage types", () => {
    it("should validate all valid role types", () => {
      const provider = createProvider();
      const validRoles = ["user", "assistant", "system"];

      for (const role of validRoles) {
        const result = provider.completions.validatePayload({
          model: "gpt-5.5",
          messages: [{ role, content: "Test" }],
        });
        expect(result.valid).toBe(true);
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

        const result = validatePayload(payload, chatCompletions55Schema);
        expect(result.valid).toBe(true);
      }
    });

    it("should reject invalid response_format type", () => {
      const payload = {
        model: "gpt-5.5",
        messages: [{ role: "user", content: "Hello" }],
        response_format: { type: "xml" },
      };

      const result = validatePayload(payload, chatCompletions55Schema);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("response_format.type must be one of");
    });
  });
});
