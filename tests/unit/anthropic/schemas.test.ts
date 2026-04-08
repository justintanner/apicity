import { describe, it, expect } from "vitest";

import {
  messagesSchema,
  countTokensSchema,
  batchesCreateSchema,
  filesUploadSchema,
  inviteCreateSchema,
  workspaceCreateSchema,
  skillsCreateSchema,
  skillVersionsCreateSchema,
  workspaceMemberAddSchema,
} from "../../../packages/provider/anthropic/src/schemas";

import {
  validatePayload,
} from "../../../packages/provider/anthropic/src/validate";

describe("anthropic schemas", () => {
  describe("messagesSchema", () => {
    it("should have correct metadata", () => {
      expect(messagesSchema.method).toBe("POST");
      expect(messagesSchema.path).toBe("/messages");
      expect(messagesSchema.contentType).toBe("application/json");
    });

    it("should define required fields", () => {
      expect(messagesSchema.fields.model.required).toBe(true);
      expect(messagesSchema.fields.max_tokens.required).toBe(true);
      expect(messagesSchema.fields.messages.required).toBe(true);
    });

    it("should define optional fields", () => {
      expect(messagesSchema.fields.system.required).toBeUndefined();
      expect(messagesSchema.fields.temperature.required).toBeUndefined();
      expect(messagesSchema.fields.top_p.required).toBeUndefined();
      expect(messagesSchema.fields.top_k.required).toBeUndefined();
      expect(messagesSchema.fields.stream.required).toBeUndefined();
      expect(messagesSchema.fields.tools.required).toBeUndefined();
      expect(messagesSchema.fields.tool_choice.required).toBeUndefined();
      expect(messagesSchema.fields.thinking.required).toBeUndefined();
      expect(messagesSchema.fields.metadata.required).toBeUndefined();
      expect(messagesSchema.fields.service_tier.required).toBeUndefined();
    });

    it("should validate valid payload with all required fields", () => {
      const result = validatePayload(
        {
          model: "claude-sonnet-4-6",
          max_tokens: 1024,
          messages: [{ role: "user", content: "Hello" }],
        },
        messagesSchema
      );
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject payload missing required model field", () => {
      const result = validatePayload(
        {
          max_tokens: 1024,
          messages: [{ role: "user", content: "Hello" }],
        },
        messagesSchema
      );
      expect(result.valid).toBe(false);
    });

    it("should reject payload missing required max_tokens field", () => {
      const result = validatePayload(
        {
          model: "claude-sonnet-4-6",
          messages: [{ role: "user", content: "Hello" }],
        },
        messagesSchema
      );
      expect(result.valid).toBe(false);
    });

    it("should reject payload missing required messages field", () => {
      const result = validatePayload(
        {
          model: "claude-sonnet-4-6",
          max_tokens: 1024,
        },
        messagesSchema
      );
      expect(result.valid).toBe(false);
    });

    it("should validate payload with optional fields", () => {
      const result = validatePayload(
        {
          model: "claude-sonnet-4-6",
          max_tokens: 1024,
          messages: [{ role: "user", content: "Hello" }],
          system: "You are a helpful assistant",
          temperature: 0.7,
          top_p: 0.9,
          top_k: 50,
          stream: true,
        },
        messagesSchema
      );
      expect(result.valid).toBe(true);
    });

    it("should validate payload with tool definitions", () => {
      const result = validatePayload(
        {
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
        },
        messagesSchema
      );
      expect(result.valid).toBe(true);
    });

    it("should validate payload with tool_choice", () => {
      const result = validatePayload(
        {
          model: "claude-sonnet-4-6",
          max_tokens: 1024,
          messages: [{ role: "user", content: "Hello" }],
          tool_choice: { type: "auto" },
        },
        messagesSchema
      );
      expect(result.valid).toBe(true);
    });

    it("should validate payload with thinking configuration", () => {
      const result = validatePayload(
        {
          model: "claude-sonnet-4-6",
          max_tokens: 2048,
          messages: [{ role: "user", content: "Solve this complex problem" }],
          thinking: {
            type: "enabled",
            budget_tokens: 1024,
          },
        },
        messagesSchema
      );
      expect(result.valid).toBe(true);
    });

    it("should validate payload with metadata", () => {
      const result = validatePayload(
        {
          model: "claude-sonnet-4-6",
          max_tokens: 1024,
          messages: [{ role: "user", content: "Hello" }],
          metadata: {
            user_id: "user_123",
          },
        },
        messagesSchema
      );
      expect(result.valid).toBe(true);
    });

    it("should validate payload with service_tier", () => {
      const result = validatePayload(
        {
          model: "claude-sonnet-4-6",
          max_tokens: 1024,
          messages: [{ role: "user", content: "Hello" }],
          service_tier: "auto",
        },
        messagesSchema
      );
      expect(result.valid).toBe(true);
    });

    it("should validate payload with stop_sequences", () => {
      const result = validatePayload(
        {
          model: "claude-sonnet-4-6",
          max_tokens: 1024,
          messages: [{ role: "user", content: "Hello" }],
          stop_sequences: ["STOP", "END"],
        },
        messagesSchema
      );
      expect(result.valid).toBe(true);
    });
  });

  describe("countTokensSchema", () => {
    it("should have correct metadata", () => {
      expect(countTokensSchema.method).toBe("POST");
      expect(countTokensSchema.path).toBe("/messages/count_tokens");
      expect(countTokensSchema.contentType).toBe("application/json");
    });

    it("should define required fields", () => {
      expect(countTokensSchema.fields.model.required).toBe(true);
      expect(countTokensSchema.fields.messages.required).toBe(true);
    });

    it("should define optional fields", () => {
      expect(countTokensSchema.fields.system.required).toBeUndefined();
      expect(countTokensSchema.fields.tools.required).toBeUndefined();
    });

    it("should validate valid payload", () => {
      const result = validatePayload(
        {
          model: "claude-sonnet-4-6",
          messages: [{ role: "user", content: "Hello world" }],
        },
        countTokensSchema
      );
      expect(result.valid).toBe(true);
    });

    it("should reject payload missing model", () => {
      const result = validatePayload(
        {
          messages: [{ role: "user", content: "Hello" }],
        },
        countTokensSchema
      );
      expect(result.valid).toBe(false);
    });

    it("should reject payload missing messages", () => {
      const result = validatePayload(
        {
          model: "claude-sonnet-4-6",
        },
        countTokensSchema
      );
      expect(result.valid).toBe(false);
    });

    it("should validate payload with optional system", () => {
      const result = validatePayload(
        {
          model: "claude-sonnet-4-6",
          messages: [{ role: "user", content: "Hello" }],
          system: "You are helpful",
        },
        countTokensSchema
      );
      expect(result.valid).toBe(true);
    });
  });

  describe("batchesCreateSchema", () => {
    it("should have correct metadata", () => {
      expect(batchesCreateSchema.method).toBe("POST");
      expect(batchesCreateSchema.path).toBe("/messages/batches");
      expect(batchesCreateSchema.contentType).toBe("application/json");
    });

    it("should define required fields", () => {
      expect(batchesCreateSchema.fields.requests.required).toBe(true);
    });

    it("should validate valid payload", () => {
      const result = validatePayload(
        {
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
        },
        batchesCreateSchema
      );
      expect(result.valid).toBe(true);
    });

    it("should reject payload missing requests", () => {
      const result = validatePayload(
        {
          // missing requests
        },
        batchesCreateSchema
      );
      expect(result.valid).toBe(false);
    });

    it("should validate payload with multiple requests", () => {
      const result = validatePayload(
        {
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
        },
        batchesCreateSchema
      );
      expect(result.valid).toBe(true);
    });
  });

  describe("filesUploadSchema", () => {
    it("should have correct metadata", () => {
      expect(filesUploadSchema.method).toBe("POST");
      expect(filesUploadSchema.path).toBe("/files");
      expect(filesUploadSchema.contentType).toBe("multipart/form-data");
    });

    it("should define required fields", () => {
      expect(filesUploadSchema.fields.file.required).toBe(true);
    });

    it("should validate valid payload", () => {
      const result = validatePayload(
        {
          file: { name: "test.pdf", content: "base64data" },
        },
        filesUploadSchema
      );
      expect(result.valid).toBe(true);
    });

    it("should reject payload missing file", () => {
      const result = validatePayload(
        {},
        filesUploadSchema
      );
      expect(result.valid).toBe(false);
    });
  });

  describe("inviteCreateSchema", () => {
    it("should have correct metadata", () => {
      expect(inviteCreateSchema.method).toBe("POST");
      expect(inviteCreateSchema.path).toBe("/organizations/invites");
      expect(inviteCreateSchema.contentType).toBe("application/json");
    });

    it("should define required fields", () => {
      expect(inviteCreateSchema.fields.email.required).toBe(true);
      expect(inviteCreateSchema.fields.role.required).toBe(true);
    });

    it("should validate valid payload", () => {
      const result = validatePayload(
        {
          email: "user@example.com",
          role: "developer",
        },
        inviteCreateSchema
      );
      expect(result.valid).toBe(true);
    });

    it("should reject payload missing email", () => {
      const result = validatePayload(
        {
          role: "developer",
        },
        inviteCreateSchema
      );
      expect(result.valid).toBe(false);
    });

    it("should reject payload missing role", () => {
      const result = validatePayload(
        {
          email: "user@example.com",
        },
        inviteCreateSchema
      );
      expect(result.valid).toBe(false);
    });

    it("should validate all valid role values", () => {
      const validRoles = ["user", "developer", "billing", "claude_code_user", "managed"];
      for (const role of validRoles) {
        const result = validatePayload(
          {
            email: "user@example.com",
            role,
          },
          inviteCreateSchema
        );
        expect(result.valid).toBe(true);
      }
    });
  });

  describe("workspaceCreateSchema", () => {
    it("should have correct metadata", () => {
      expect(workspaceCreateSchema.method).toBe("POST");
      expect(workspaceCreateSchema.path).toBe("/organizations/workspaces");
      expect(workspaceCreateSchema.contentType).toBe("application/json");
    });

    it("should define required fields", () => {
      expect(workspaceCreateSchema.fields.name.required).toBe(true);
    });

    it("should define optional fields", () => {
      expect(workspaceCreateSchema.fields.data_residency.required).toBeUndefined();
    });

    it("should validate valid payload", () => {
      const result = validatePayload(
        {
          name: "My Workspace",
        },
        workspaceCreateSchema
      );
      expect(result.valid).toBe(true);
    });

    it("should reject payload missing name", () => {
      const result = validatePayload(
        {},
        workspaceCreateSchema
      );
      expect(result.valid).toBe(false);
    });

    it("should validate payload with data_residency", () => {
      const result = validatePayload(
        {
          name: "My Workspace",
          data_residency: { region: "us-east-1" },
        },
        workspaceCreateSchema
      );
      expect(result.valid).toBe(true);
    });
  });

  describe("skillsCreateSchema", () => {
    it("should have correct metadata", () => {
      expect(skillsCreateSchema.method).toBe("POST");
      expect(skillsCreateSchema.path).toBe("/skills");
      expect(skillsCreateSchema.contentType).toBe("multipart/form-data");
    });

    it("should define required fields", () => {
      expect(skillsCreateSchema.fields.display_title.required).toBe(true);
      expect(skillsCreateSchema.fields.files.required).toBe(true);
    });

    it("should validate valid payload", () => {
      const result = validatePayload(
        {
          display_title: "My Skill",
          files: [{ name: "SKILL.md", content: "# Skill Definition" }],
        },
        skillsCreateSchema
      );
      expect(result.valid).toBe(true);
    });

    it("should reject payload missing display_title", () => {
      const result = validatePayload(
        {
          files: [{ name: "SKILL.md", content: "# Skill" }],
        },
        skillsCreateSchema
      );
      expect(result.valid).toBe(false);
    });

    it("should reject payload missing files", () => {
      const result = validatePayload(
        {
          display_title: "My Skill",
        },
        skillsCreateSchema
      );
      expect(result.valid).toBe(false);
    });
  });

  describe("skillVersionsCreateSchema", () => {
    it("should have correct metadata", () => {
      expect(skillVersionsCreateSchema.method).toBe("POST");
      expect(skillVersionsCreateSchema.path).toBe("/skills/{skill_id}/versions");
      expect(skillVersionsCreateSchema.contentType).toBe("multipart/form-data");
    });

    it("should define required fields", () => {
      expect(skillVersionsCreateSchema.fields.files.required).toBe(true);
    });

    it("should validate valid payload", () => {
      const result = validatePayload(
        {
          files: [{ name: "SKILL.md", content: "# Updated Skill" }],
        },
        skillVersionsCreateSchema
      );
      expect(result.valid).toBe(true);
    });

    it("should reject payload missing files", () => {
      const result = validatePayload(
        {},
        skillVersionsCreateSchema
      );
      expect(result.valid).toBe(false);
    });
  });

  describe("workspaceMemberAddSchema", () => {
    it("should have correct metadata", () => {
      expect(workspaceMemberAddSchema.method).toBe("POST");
      expect(workspaceMemberAddSchema.path).toBe(
        "/organizations/workspaces/{workspace_id}/members"
      );
      expect(workspaceMemberAddSchema.contentType).toBe("application/json");
    });

    it("should define required fields", () => {
      expect(workspaceMemberAddSchema.fields.user_id.required).toBe(true);
      expect(workspaceMemberAddSchema.fields.workspace_role.required).toBe(true);
    });

    it("should validate valid payload", () => {
      const result = validatePayload(
        {
          user_id: "user_123",
          workspace_role: "workspace_developer",
        },
        workspaceMemberAddSchema
      );
      expect(result.valid).toBe(true);
    });

    it("should reject payload missing user_id", () => {
      const result = validatePayload(
        {
          workspace_role: "workspace_developer",
        },
        workspaceMemberAddSchema
      );
      expect(result.valid).toBe(false);
    });

    it("should reject payload missing workspace_role", () => {
      const result = validatePayload(
        {
          user_id: "user_123",
        },
        workspaceMemberAddSchema
      );
      expect(result.valid).toBe(false);
    });

    it("should validate all valid workspace_role values", () => {
      const validRoles = [
        "workspace_user",
        "workspace_developer",
        "workspace_admin",
      ];
      for (const workspace_role of validRoles) {
        const result = validatePayload(
          {
            user_id: "user_123",
            workspace_role,
          },
          workspaceMemberAddSchema
        );
        expect(result.valid).toBe(true);
      }
    });
  });

  describe("schema field definitions", () => {
    it("should have correct types for all schema fields", () => {
      // Check messagesSchema field types
      expect(messagesSchema.fields.model.type).toBe("string");
      expect(messagesSchema.fields.max_tokens.type).toBe("number");
      expect(messagesSchema.fields.messages.type).toBe("array");
      expect(messagesSchema.fields.system.type).toBe("string");
      expect(messagesSchema.fields.temperature.type).toBe("number");
      expect(messagesSchema.fields.top_p.type).toBe("number");
      expect(messagesSchema.fields.top_k.type).toBe("number");
      expect(messagesSchema.fields.stream.type).toBe("boolean");
      expect(messagesSchema.fields.tools.type).toBe("array");
      expect(messagesSchema.fields.stop_sequences.type).toBe("array");
      expect(messagesSchema.fields.tool_choice.type).toBe("object");
      expect(messagesSchema.fields.thinking.type).toBe("object");
      expect(messagesSchema.fields.metadata.type).toBe("object");
      expect(messagesSchema.fields.service_tier.type).toBe("string");
    });

    it("should have correct enum definitions for constrained fields", () => {
      expect(messagesSchema.fields.messages.items.properties.role.enum).toEqual([
        "user",
        "assistant",
      ]);
      expect(messagesSchema.fields.tool_choice.properties.type.enum).toEqual([
        "auto",
        "any",
        "tool",
        "none",
      ]);
      expect(messagesSchema.fields.thinking.properties.type.enum).toEqual([
        "enabled",
        "disabled",
        "adaptive",
      ]);
      expect(messagesSchema.fields.service_tier.enum).toEqual([
        "auto",
        "standard_only",
      ]);
    });

    it("should have descriptions for all fields", () => {
      expect(messagesSchema.fields.model.description).toBeDefined();
      expect(messagesSchema.fields.max_tokens.description).toBeDefined();
      expect(messagesSchema.fields.messages.description).toBeDefined();
      expect(messagesSchema.fields.system.description).toBeDefined();
    });

    it("should have proper array item definitions", () => {
      expect(messagesSchema.fields.messages.items.type).toBe("object");
      expect(messagesSchema.fields.messages.items.properties.role.type).toBe(
        "string"
      );
      expect(messagesSchema.fields.messages.items.properties.content.type).toBe(
        "string"
      );
    });

    it("should have proper nested object definitions", () => {
      expect(messagesSchema.fields.thinking.properties.budget_tokens.type).toBe(
        "number"
      );
      expect(messagesSchema.fields.metadata.properties.user_id.type).toBe(
        "string"
      );
    });
  });
});
