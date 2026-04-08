import { describe, it, expect } from "vitest";

import { validatePayload } from "../../../packages/provider/kie/src/validate";
import {
  createTaskSchema,
  downloadUrlSchema,
  fileStreamUploadSchema,
  fileUrlUploadSchema,
  fileBase64UploadSchema,
  veoGenerateSchema,
  veoExtendSchema,
  sunoGenerateSchema,
  chatCompletions55Schema,
  claudeMessagesSchema,
} from "../../../packages/provider/kie/src/schemas";

describe("kie validatePayload", () => {
  describe("basic validation", () => {
    it("should reject non-object payload", () => {
      const result = validatePayload(null, createTaskSchema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("payload must be a non-null object");
    });

    it("should reject array as payload", () => {
      const result = validatePayload([], createTaskSchema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("payload must be a non-null object");
    });

    it("should reject string as payload", () => {
      const result = validatePayload("invalid", createTaskSchema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("payload must be a non-null object");
    });

    it("should reject number as payload", () => {
      const result = validatePayload(123, createTaskSchema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("payload must be a non-null object");
    });

    it("should reject boolean as payload", () => {
      const result = validatePayload(true, createTaskSchema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("payload must be a non-null object");
    });
  });

  describe("required field validation", () => {
    it("should reject missing required model field", () => {
      const result = validatePayload(
        {
          input: { prompt: "test" },
          // Missing required 'model' field
        },
        createTaskSchema
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("model is required");
    });

    it("should reject missing required input field", () => {
      const result = validatePayload(
        {
          model: "nano-banana-pro",
          // Missing required 'input' field
        },
        createTaskSchema
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("input is required");
    });

    it("should reject null for required field", () => {
      const result = validatePayload(
        {
          model: null,
          input: {},
        },
        createTaskSchema
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("model is required");
    });

    it("should accept payload with all required fields", () => {
      const result = validatePayload(
        {
          model: "nano-banana-pro",
          input: { prompt: "test" },
        },
        createTaskSchema
      );
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should accept undefined for optional fields", () => {
      const result = validatePayload(
        {
          model: "nano-banana-pro",
          input: { prompt: "test" },
          callBackUrl: undefined,
        },
        createTaskSchema
      );
      expect(result.valid).toBe(true);
    });
  });

  describe("type checking", () => {
    it("should reject wrong string type for model", () => {
      const result = validatePayload(
        {
          model: 123, // Should be string
          input: {},
        },
        createTaskSchema
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("model must be of type string");
    });

    it("should reject wrong object type for input", () => {
      const result = validatePayload(
        {
          model: "nano-banana-pro",
          input: "should-be-object", // Should be object
        },
        createTaskSchema
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("input must be of type object");
    });

    it("should reject array when object expected for input", () => {
      const result = validatePayload(
        {
          model: "nano-banana-pro",
          input: [], // Array is not a plain object
        },
        createTaskSchema
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("input must be of type object");
    });
  });

  describe("downloadUrl schema validation", () => {
    it("should validate downloadUrl with required url", () => {
      const result = validatePayload(
        {
          url: "https://kie.io/cdn/file.zip",
        },
        downloadUrlSchema
      );
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject downloadUrl without required url", () => {
      const result = validatePayload(
        {},
        downloadUrlSchema
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("url is required");
    });

    it("should reject non-string url", () => {
      const result = validatePayload(
        {
          url: 123,
        },
        downloadUrlSchema
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("url must be of type string");
    });
  });

  describe("fileStreamUpload schema validation", () => {
    it("should validate fileStreamUpload with required fields", () => {
      const result = validatePayload(
        {
          file: new Blob(["test"]),
          filename: "test.txt",
        },
        fileStreamUploadSchema
      );
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate fileStreamUpload with optional mimeType", () => {
      const result = validatePayload(
        {
          file: new Blob(["test"]),
          filename: "test.txt",
          mimeType: "text/plain",
        },
        fileStreamUploadSchema
      );
      expect(result.valid).toBe(true);
    });

    it("should reject fileStreamUpload without required file", () => {
      const result = validatePayload(
        {
          filename: "test.txt",
        },
        fileStreamUploadSchema
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("file is required");
    });

    it("should reject fileStreamUpload without required filename", () => {
      const result = validatePayload(
        {
          file: new Blob(["test"]),
        },
        fileStreamUploadSchema
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("filename is required");
    });
  });

  describe("fileUrlUpload schema validation", () => {
    it("should validate fileUrlUpload with required url", () => {
      const result = validatePayload(
        {
          url: "https://example.com/file.txt",
        },
        fileUrlUploadSchema
      );
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate fileUrlUpload with optional uploadPath", () => {
      const result = validatePayload(
        {
          url: "https://example.com/file.txt",
          uploadPath: "/uploads/test.txt",
        },
        fileUrlUploadSchema
      );
      expect(result.valid).toBe(true);
    });

    it("should reject fileUrlUpload without required url", () => {
      const result = validatePayload(
        {},
        fileUrlUploadSchema
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("url is required");
    });
  });

  describe("fileBase64Upload schema validation", () => {
    it("should validate fileBase64Upload with required fields", () => {
      const result = validatePayload(
        {
          base64: "dGVzdCBjb250ZW50",
          filename: "test.txt",
        },
        fileBase64UploadSchema
      );
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate fileBase64Upload with optional mimeType", () => {
      const result = validatePayload(
        {
          base64: "dGVzdCBjb250ZW50",
          filename: "test.txt",
          mimeType: "text/plain",
        },
        fileBase64UploadSchema
      );
      expect(result.valid).toBe(true);
    });

    it("should reject fileBase64Upload without required base64", () => {
      const result = validatePayload(
        {
          filename: "test.txt",
        },
        fileBase64UploadSchema
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("base64 is required");
    });

    it("should reject fileBase64Upload without required filename", () => {
      const result = validatePayload(
        {
          base64: "dGVzdCBjb250ZW50",
        },
        fileBase64UploadSchema
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("filename is required");
    });
  });

  describe("veoGenerate schema validation", () => {
    it("should validate veoGenerate with required prompt", () => {
      const result = validatePayload(
        {
          prompt: "A cat playing piano",
        },
        veoGenerateSchema
      );
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate veoGenerate with all fields", () => {
      const result = validatePayload(
        {
          prompt: "A cat playing piano",
          model: "veo3",
          aspectRatio: "16:9",
          generationType: "TEXT_2_VIDEO",
          imageUrls: ["https://example.com/image.jpg"],
          seeds: 42,
          watermark: "My Watermark",
          enableTranslation: true,
        },
        veoGenerateSchema
      );
      expect(result.valid).toBe(true);
    });

    it("should reject veoGenerate without required prompt", () => {
      const result = validatePayload(
        {},
        veoGenerateSchema
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("prompt is required");
    });

    it("should validate veoGenerate enum values for model", () => {
      const valid = validatePayload(
        { prompt: "test", model: "veo3" },
        veoGenerateSchema
      );
      expect(valid.valid).toBe(true);

      const invalid = validatePayload(
        { prompt: "test", model: "invalid-model" },
        veoGenerateSchema
      );
      expect(invalid.valid).toBe(false);
      expect(invalid.errors).toContain(
        'model must be one of: veo3, veo3_fast'
      );
    });

    it("should validate veoGenerate enum values for aspectRatio", () => {
      const valid = validatePayload(
        { prompt: "test", aspectRatio: "16:9" },
        veoGenerateSchema
      );
      expect(valid.valid).toBe(true);

      const invalid = validatePayload(
        { prompt: "test", aspectRatio: "4:3" },
        veoGenerateSchema
      );
      expect(invalid.valid).toBe(false);
    });
  });

  describe("veoExtend schema validation", () => {
    it("should validate veoExtend with required fields", () => {
      const result = validatePayload(
        {
          taskId: "task-123",
          prompt: "Extend the video",
        },
        veoExtendSchema
      );
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate veoExtend with optional fields", () => {
      const result = validatePayload(
        {
          taskId: "task-123",
          prompt: "Extend the video",
          model: "fast",
          seeds: 42,
          watermark: "Mark",
        },
        veoExtendSchema
      );
      expect(result.valid).toBe(true);
    });

    it("should reject veoExtend without required taskId", () => {
      const result = validatePayload(
        {
          prompt: "Extend the video",
        },
        veoExtendSchema
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("taskId is required");
    });

    it("should reject veoExtend without required prompt", () => {
      const result = validatePayload(
        {
          taskId: "task-123",
        },
        veoExtendSchema
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("prompt is required");
    });
  });

  describe("sunoGenerate schema validation", () => {
    it("should validate sunoGenerate with required fields", () => {
      const result = validatePayload(
        {
          prompt: "A happy song",
          model: "V4",
          instrumental: false,
          customMode: true,
        },
        sunoGenerateSchema
      );
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate sunoGenerate with all fields", () => {
      const result = validatePayload(
        {
          prompt: "A happy song",
          model: "V4",
          instrumental: true,
          customMode: false,
          style: "pop",
          negativeTags: "rock",
          title: "My Song",
        },
        sunoGenerateSchema
      );
      expect(result.valid).toBe(true);
    });

    it("should reject sunoGenerate without required prompt", () => {
      const result = validatePayload(
        {
          model: "V4",
          instrumental: false,
          customMode: true,
        },
        sunoGenerateSchema
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("prompt is required");
    });

    it("should reject sunoGenerate without required model", () => {
      const result = validatePayload(
        {
          prompt: "A happy song",
          instrumental: false,
          customMode: true,
        },
        sunoGenerateSchema
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("model is required");
    });

    it("should validate sunoGenerate enum values for model", () => {
      const validVersions = ["V4", "V4_5", "V4_5PLUS", "V4_5ALL", "V5"];
      for (const version of validVersions) {
        const result = validatePayload(
          {
            prompt: "test",
            model: version,
            instrumental: true,
            customMode: false,
          },
          sunoGenerateSchema
        );
        expect(result.valid).toBe(true);
      }

      const invalid = validatePayload(
        {
          prompt: "test",
          model: "V3",
          instrumental: true,
          customMode: false,
        },
        sunoGenerateSchema
      );
      expect(invalid.valid).toBe(false);
    });
  });

  describe("chatCompletions55 schema validation", () => {
    it("should validate chatCompletions55 with required fields", () => {
      const result = validatePayload(
        {
          model: "gpt-5.5",
          messages: [{ role: "user", content: "Hello" }],
        },
        chatCompletions55Schema
      );
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate chatCompletions55 with all optional fields", () => {
      const result = validatePayload(
        {
          model: "gpt-5.5",
          messages: [
            { role: "system", content: "You are helpful" },
            { role: "user", content: "Hello" },
          ],
          temperature: 0.7,
          max_tokens: 1000,
          stream: true,
        },
        chatCompletions55Schema
      );
      expect(result.valid).toBe(true);
    });

    it("should reject chatCompletions55 without required model", () => {
      const result = validatePayload(
        {
          messages: [{ role: "user", content: "Hello" }],
        },
        chatCompletions55Schema
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("model is required");
    });

    it("should reject chatCompletions55 without required messages", () => {
      const result = validatePayload(
        {
          model: "gpt-5.5",
        },
        chatCompletions55Schema
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("messages is required");
    });

    it("should validate message role enum values", () => {
      const validRoles = ["user", "assistant", "system"];
      for (const role of validRoles) {
        const result = validatePayload(
          {
            model: "gpt-5.5",
            messages: [{ role, content: "test" }],
          },
          chatCompletions55Schema
        );
        expect(result.valid).toBe(true);
      }
    });

    it("should reject invalid message role", () => {
      const result = validatePayload(
        {
          model: "gpt-5.5",
          messages: [{ role: "invalid", content: "Hello" }],
        },
        chatCompletions55Schema
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'messages[0].role must be one of: user, assistant, system'
      );
    });

    it("should validate response_format type enum", () => {
      const validTypes = ["text", "json_object", "json_schema"];
      for (const type of validTypes) {
        const result = validatePayload(
          {
            model: "gpt-5.5",
            messages: [{ role: "user", content: "Hello" }],
            response_format: { type },
          },
          chatCompletions55Schema
        );
        expect(result.valid).toBe(true);
      }
    });

    it("should validate array items with nested object validation", () => {
      const result = validatePayload(
        {
          model: "gpt-5.5",
          messages: [
            { role: "user" }, // missing content
          ],
        },
        chatCompletions55Schema
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("messages[0].content is required");
    });
  });

  describe("claudeMessages schema validation", () => {
    it("should validate claudeMessages with required fields", () => {
      const result = validatePayload(
        {
          model: "claude-sonnet-4-6",
          messages: [{ role: "user", content: "Hello" }],
        },
        claudeMessagesSchema
      );
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate claudeMessages with haiku model", () => {
      const result = validatePayload(
        {
          model: "claude-haiku-4-5",
          messages: [{ role: "user", content: "Hello" }],
        },
        claudeMessagesSchema
      );
      expect(result.valid).toBe(true);
    });

    it("should validate claudeMessages with optional fields", () => {
      const result = validatePayload(
        {
          model: "claude-sonnet-4-6",
          messages: [{ role: "user", content: "Hello" }],
          stream: true,
          thinkingFlag: true,
        },
        claudeMessagesSchema
      );
      expect(result.valid).toBe(true);
    });

    it("should reject invalid model enum value", () => {
      const result = validatePayload(
        {
          model: "invalid-model",
          messages: [{ role: "user", content: "Hello" }],
        },
        claudeMessagesSchema
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'model must be one of: claude-sonnet-4-6, claude-haiku-4-5'
      );
    });

    it("should validate claude message roles", () => {
      const result = validatePayload(
        {
          model: "claude-sonnet-4-6",
          messages: [
            { role: "user", content: "Hello" },
            { role: "assistant", content: "Hi there" },
          ],
        },
        claudeMessagesSchema
      );
      expect(result.valid).toBe(true);
    });

    it("should reject system role in claude messages", () => {
      const result = validatePayload(
        {
          model: "claude-sonnet-4-6",
          messages: [{ role: "system", content: "System prompt" }],
        },
        claudeMessagesSchema
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'messages[0].role must be one of: user, assistant'
      );
    });

    it("should validate tools array with nested validation", () => {
      const result = validatePayload(
        {
          model: "claude-sonnet-4-6",
          messages: [{ role: "user", content: "Hello" }],
          tools: [
            {
              name: "get_weather",
              description: "Get weather info",
              input_schema: { type: "object" },
            },
          ],
        },
        claudeMessagesSchema
      );
      expect(result.valid).toBe(true);
    });

    it("should reject tool missing required fields", () => {
      const result = validatePayload(
        {
          model: "claude-sonnet-4-6",
          messages: [{ role: "user", content: "Hello" }],
          tools: [
            {
              name: "get_weather",
              // missing description and input_schema
            },
          ],
        },
        claudeMessagesSchema
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("tools[0].description is required");
      expect(result.errors).toContain("tools[0].input_schema is required");
    });
  });

  describe("multiple errors", () => {
    it("should collect multiple validation errors", () => {
      const result = validatePayload(
        {},
        createTaskSchema
      );
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
      expect(result.errors).toContain("model is required");
      expect(result.errors).toContain("input is required");
    });

    it("should collect type errors alongside required errors", () => {
      const result = validatePayload(
        {
          model: 123,
          input: "not-an-object",
        },
        createTaskSchema
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("model must be of type string");
      expect(result.errors).toContain("input must be of type object");
    });
  });

  describe("schema metadata", () => {
    it("createTaskSchema should have correct metadata", () => {
      expect(createTaskSchema.method).toBe("POST");
      expect(createTaskSchema.path).toBe("/api/v1/jobs/createTask");
      expect(createTaskSchema.contentType).toBe("application/json");
    });

    it("downloadUrlSchema should have correct metadata", () => {
      expect(downloadUrlSchema.method).toBe("POST");
      expect(downloadUrlSchema.path).toBe("/api/v1/common/download-url");
      expect(downloadUrlSchema.contentType).toBe("application/json");
    });

    it("fileStreamUploadSchema should have correct metadata", () => {
      expect(fileStreamUploadSchema.method).toBe("POST");
      expect(fileStreamUploadSchema.path).toBe("/api/file-stream-upload");
      expect(fileStreamUploadSchema.contentType).toBe("multipart/form-data");
    });

    it("veoGenerateSchema should have correct metadata", () => {
      expect(veoGenerateSchema.method).toBe("POST");
      expect(veoGenerateSchema.path).toBe("/api/v1/veo/generate");
      expect(veoGenerateSchema.contentType).toBe("application/json");
    });

    it("sunoGenerateSchema should have correct metadata", () => {
      expect(sunoGenerateSchema.method).toBe("POST");
      expect(sunoGenerateSchema.path).toBe("/api/v1/generate");
      expect(sunoGenerateSchema.contentType).toBe("application/json");
    });

    it("claudeMessagesSchema should have correct metadata", () => {
      expect(claudeMessagesSchema.method).toBe("POST");
      expect(claudeMessagesSchema.path).toBe("/claude/v1/messages");
      expect(claudeMessagesSchema.contentType).toBe("application/json");
    });
  });
});
