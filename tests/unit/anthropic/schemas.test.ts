import { describe, it, expect } from "vitest";

import {
  AnthropicMessageRequestSchema,
  AnthropicCountTokensRequestSchema,
  AnthropicBatchCreateRequestSchema,
  AnthropicFileUploadRequestSchema,
  AnthropicSkillsCreateRequestSchema,
  AnthropicSkillVersionsCreateRequestSchema,
} from "../../../packages/provider/anthropic/src/zod";

describe("anthropic zod schemas", () => {
  describe("AnthropicMessageRequestSchema", () => {
    it("should accept valid payload with all required fields", () => {
      const result = AnthropicMessageRequestSchema.safeParse({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        messages: [{ role: "user", content: "Hello" }],
      });
      expect(result.success).toBe(true);
    });

    it("should reject payload missing required model field", () => {
      const result = AnthropicMessageRequestSchema.safeParse({
        max_tokens: 1024,
        messages: [{ role: "user", content: "Hello" }],
      });
      expect(result.success).toBe(false);
    });

    it("should reject payload missing required max_tokens field", () => {
      const result = AnthropicMessageRequestSchema.safeParse({
        model: "claude-sonnet-4-6",
        messages: [{ role: "user", content: "Hello" }],
      });
      expect(result.success).toBe(false);
    });

    it("should reject payload missing required messages field", () => {
      const result = AnthropicMessageRequestSchema.safeParse({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
      });
      expect(result.success).toBe(false);
    });

    it("should accept payload with optional fields", () => {
      const result = AnthropicMessageRequestSchema.safeParse({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        messages: [{ role: "user", content: "Hello" }],
        system: "You are a helpful assistant",
        temperature: 0.7,
        top_p: 0.9,
        top_k: 50,
        stream: true,
      });
      expect(result.success).toBe(true);
    });

    it("should accept payload with tool definitions", () => {
      const result = AnthropicMessageRequestSchema.safeParse({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        messages: [{ role: "user", content: "What's the weather?" }],
        tools: [
          {
            name: "get_weather",
            description: "Get weather information",
            input_schema: {
              type: "object",
              properties: {
                location: { type: "string" },
              },
            },
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("should accept the current Anthropic-provided tool set", () => {
      const result = AnthropicMessageRequestSchema.safeParse({
        model: "claude-opus-4-8",
        max_tokens: 1024,
        messages: [{ role: "user", content: "Help me" }],
        tools: [
          { type: "bash_20250124", name: "bash" },
          {
            type: "text_editor_20250728",
            name: "str_replace_based_edit_tool",
          },
          {
            type: "computer_20251124",
            name: "computer",
            display_width_px: 1024,
            display_height_px: 768,
            display_number: 1,
          },
          { type: "memory_20250818", name: "memory" },
          { type: "web_search_20260318", name: "web_search", max_uses: 3 },
          {
            type: "web_fetch_20260318",
            name: "web_fetch",
            max_uses: 5,
            citations: { enabled: true },
            use_cache: false,
            response_inclusion: "excluded",
          },
          { type: "code_execution_20260521", name: "code_execution" },
          {
            type: "tool_search_tool_regex_20251119",
            name: "tool_search_tool_regex",
          },
          {
            type: "advisor_20260301",
            name: "advisor",
            model: "claude-opus-4-8",
            max_tokens: 2048,
            caching: { type: "ephemeral", ttl: "1h" },
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("should accept shared tool-definition properties", () => {
      const result = AnthropicMessageRequestSchema.safeParse({
        model: "claude-opus-4-8",
        max_tokens: 1024,
        messages: [{ role: "user", content: "What's the weather?" }],
        tools: [
          {
            name: "get_weather",
            description: "Get weather information",
            input_schema: { type: "object", properties: {} },
            input_examples: [{ location: "San Francisco" }],
            strict: true,
            defer_loading: true,
            allowed_callers: ["code_execution_20260120"],
            cache_control: { type: "ephemeral", ttl: "5m" },
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("should require an advisor model on the advisor tool", () => {
      const result = AnthropicMessageRequestSchema.safeParse({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        messages: [{ role: "user", content: "Plan this" }],
        tools: [{ type: "advisor_20260301", name: "advisor" }],
      });
      expect(result.success).toBe(false);
    });

    it("should accept payload with tool_choice", () => {
      const result = AnthropicMessageRequestSchema.safeParse({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        messages: [{ role: "user", content: "Hello" }],
        tool_choice: { type: "auto" },
      });
      expect(result.success).toBe(true);
    });

    it("should accept payload with thinking configuration", () => {
      const result = AnthropicMessageRequestSchema.safeParse({
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        messages: [{ role: "user", content: "Solve this complex problem" }],
        thinking: {
          type: "enabled",
          budget_tokens: 1024,
        },
      });
      expect(result.success).toBe(true);
    });

    it("should accept payload with metadata", () => {
      const result = AnthropicMessageRequestSchema.safeParse({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        messages: [{ role: "user", content: "Hello" }],
        metadata: {
          user_id: "user_123",
        },
      });
      expect(result.success).toBe(true);
    });

    it("should accept payload with service_tier", () => {
      const result = AnthropicMessageRequestSchema.safeParse({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        messages: [{ role: "user", content: "Hello" }],
        service_tier: "auto",
      });
      expect(result.success).toBe(true);
    });

    it("should accept payload with stop_sequences", () => {
      const result = AnthropicMessageRequestSchema.safeParse({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        messages: [{ role: "user", content: "Hello" }],
        stop_sequences: ["STOP", "END"],
      });
      expect(result.success).toBe(true);
    });
  });

  describe("AnthropicCountTokensRequestSchema", () => {
    it("should accept valid payload", () => {
      const result = AnthropicCountTokensRequestSchema.safeParse({
        model: "claude-sonnet-4-6",
        messages: [{ role: "user", content: "Hello world" }],
      });
      expect(result.success).toBe(true);
    });

    it("should reject payload missing model", () => {
      const result = AnthropicCountTokensRequestSchema.safeParse({
        messages: [{ role: "user", content: "Hello" }],
      });
      expect(result.success).toBe(false);
    });

    it("should reject payload missing messages", () => {
      const result = AnthropicCountTokensRequestSchema.safeParse({
        model: "claude-sonnet-4-6",
      });
      expect(result.success).toBe(false);
    });

    it("should accept payload with optional system", () => {
      const result = AnthropicCountTokensRequestSchema.safeParse({
        model: "claude-sonnet-4-6",
        messages: [{ role: "user", content: "Hello" }],
        system: "You are helpful",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("AnthropicBatchCreateRequestSchema", () => {
    it("should accept valid payload", () => {
      const result = AnthropicBatchCreateRequestSchema.safeParse({
        requests: [
          {
            custom_id: "req_1",
            params: {
              model: "claude-sonnet-4-6",
              max_tokens: 1024,
              messages: [{ role: "user", content: "Hello" }],
            },
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("should reject payload missing requests", () => {
      const result = AnthropicBatchCreateRequestSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("should accept payload with multiple requests", () => {
      const result = AnthropicBatchCreateRequestSchema.safeParse({
        requests: [
          {
            custom_id: "req_1",
            params: {
              model: "claude-sonnet-4-6",
              max_tokens: 1024,
              messages: [{ role: "user", content: "Hello" }],
            },
          },
          {
            custom_id: "req_2",
            params: {
              model: "claude-sonnet-4-6",
              max_tokens: 1024,
              messages: [{ role: "user", content: "World" }],
            },
          },
        ],
      });
      expect(result.success).toBe(true);
    });
  });

  describe("AnthropicFileUploadRequestSchema", () => {
    it("should accept valid payload", () => {
      const result = AnthropicFileUploadRequestSchema.safeParse({
        file: new Blob(["test"]),
      });
      expect(result.success).toBe(true);
    });

    it("should reject payload missing file", () => {
      const result = AnthropicFileUploadRequestSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("AnthropicSkillsCreateRequestSchema", () => {
    it("should accept valid payload", () => {
      const result = AnthropicSkillsCreateRequestSchema.safeParse({
        display_title: "My Skill",
        files: [{ data: new Blob(["# Skill"]), path: "SKILL.md" }],
      });
      expect(result.success).toBe(true);
    });

    it("should reject payload missing display_title", () => {
      const result = AnthropicSkillsCreateRequestSchema.safeParse({
        files: [{ data: new Blob(["# Skill"]), path: "SKILL.md" }],
      });
      expect(result.success).toBe(false);
    });

    it("should reject payload missing files", () => {
      const result = AnthropicSkillsCreateRequestSchema.safeParse({
        display_title: "My Skill",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("AnthropicSkillVersionsCreateRequestSchema", () => {
    it("should accept valid payload", () => {
      const result = AnthropicSkillVersionsCreateRequestSchema.safeParse({
        files: [{ data: new Blob(["# Updated Skill"]), path: "SKILL.md" }],
      });
      expect(result.success).toBe(true);
    });

    it("should reject payload missing files", () => {
      const result = AnthropicSkillVersionsCreateRequestSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("schema exposes safeParse and parse", () => {
    const schemas = [
      {
        name: "AnthropicMessageRequestSchema",
        schema: AnthropicMessageRequestSchema,
      },
      {
        name: "AnthropicCountTokensRequestSchema",
        schema: AnthropicCountTokensRequestSchema,
      },
      {
        name: "AnthropicBatchCreateRequestSchema",
        schema: AnthropicBatchCreateRequestSchema,
      },
      {
        name: "AnthropicFileUploadRequestSchema",
        schema: AnthropicFileUploadRequestSchema,
      },
      {
        name: "AnthropicSkillsCreateRequestSchema",
        schema: AnthropicSkillsCreateRequestSchema,
      },
      {
        name: "AnthropicSkillVersionsCreateRequestSchema",
        schema: AnthropicSkillVersionsCreateRequestSchema,
      },
    ];

    for (const { name, schema } of schemas) {
      it(`${name} exposes safeParse`, () => {
        expect(typeof schema.safeParse).toBe("function");
      });

      it(`${name} exposes parse`, () => {
        expect(typeof schema.parse).toBe("function");
      });
    }
  });
});
