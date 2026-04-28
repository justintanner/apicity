import { describe, it, expect } from "vitest";

import {
  CreateTaskRequestSchema,
  DownloadUrlRequestSchema,
  UploadMediaRequestSchema,
  FileUrlUploadRequestSchema,
  FileBase64UploadRequestSchema,
  VeoGenerateRequestSchema,
  VeoExtendRequestSchema,
  SunoGenerateRequestSchema,
  KieChatRequestSchema,
  KieClaudeRequestSchema,
} from "../../../packages/provider/kie/src/zod";

describe("kie Zod schema validation", () => {
  describe("basic validation", () => {
    it("should reject non-object payload", () => {
      const result = CreateTaskRequestSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it("should reject array as payload", () => {
      const result = CreateTaskRequestSchema.safeParse([]);
      expect(result.success).toBe(false);
    });

    it("should reject string as payload", () => {
      const result = CreateTaskRequestSchema.safeParse("invalid");
      expect(result.success).toBe(false);
    });

    it("should reject number as payload", () => {
      const result = CreateTaskRequestSchema.safeParse(123);
      expect(result.success).toBe(false);
    });

    it("should reject boolean as payload", () => {
      const result = CreateTaskRequestSchema.safeParse(true);
      expect(result.success).toBe(false);
    });
  });

  describe("required field validation", () => {
    it("should reject missing required model field", () => {
      const result = CreateTaskRequestSchema.safeParse({
        input: { prompt: "test" },
        // Missing required 'model' field
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("model"))).toBe(
        true
      );
    });

    it("should reject missing required input field", () => {
      const result = CreateTaskRequestSchema.safeParse({
        model: "nano-banana-pro",
        // Missing required 'input' field
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("input"))).toBe(
        true
      );
    });

    it("should reject null for required field", () => {
      const result = CreateTaskRequestSchema.safeParse({
        model: null,
        input: {},
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("model"))).toBe(
        true
      );
    });

    it("should accept payload with all required fields", () => {
      const result = CreateTaskRequestSchema.safeParse({
        model: "nano-banana-pro",
        input: { prompt: "test" },
      });
      expect(result.success).toBe(true);
    });

    it("should accept undefined for optional fields", () => {
      const result = CreateTaskRequestSchema.safeParse({
        model: "nano-banana-pro",
        input: { prompt: "test" },
        callBackUrl: undefined,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("type checking", () => {
    it("should reject wrong string type for model", () => {
      const result = CreateTaskRequestSchema.safeParse({
        model: 123, // Should be string
        input: {},
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("model"))).toBe(
        true
      );
    });

    it("should reject wrong object type for input", () => {
      const result = CreateTaskRequestSchema.safeParse({
        model: "nano-banana-pro",
        input: "should-be-object", // Should be object
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("input"))).toBe(
        true
      );
    });

    it("should reject array when object expected for input", () => {
      const result = CreateTaskRequestSchema.safeParse({
        model: "nano-banana-pro",
        input: [], // Array is not a plain object
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("input"))).toBe(
        true
      );
    });
  });

  describe("downloadUrl schema validation", () => {
    it("should validate downloadUrl with required url", () => {
      const result = DownloadUrlRequestSchema.safeParse({
        url: "https://kie.io/cdn/file.zip",
      });
      expect(result.success).toBe(true);
    });

    it("should reject downloadUrl without required url", () => {
      const result = DownloadUrlRequestSchema.safeParse({});
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("url"))).toBe(
        true
      );
    });

    it("should reject non-string url", () => {
      const result = DownloadUrlRequestSchema.safeParse({
        url: 123,
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("url"))).toBe(
        true
      );
    });
  });

  describe("fileStreamUpload schema validation", () => {
    it("should validate fileStreamUpload with required fields", () => {
      const result = UploadMediaRequestSchema.safeParse({
        file: new Blob(["test"]),
        filename: "test.bin",
        uploadPath: "uploads",
      });
      expect(result.success).toBe(true);
    });

    it("should validate fileStreamUpload with optional fields", () => {
      const result = UploadMediaRequestSchema.safeParse({
        file: new Blob(["test"]),
        filename: "test.txt",
        uploadPath: "uploads",
        fileName: "test.txt",
        mimeType: "text/plain",
      });
      expect(result.success).toBe(true);
    });

    it("should reject fileStreamUpload without required file", () => {
      const result = UploadMediaRequestSchema.safeParse({
        uploadPath: "uploads",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("file"))).toBe(
        true
      );
    });

    it("should reject fileStreamUpload without required uploadPath", () => {
      const result = UploadMediaRequestSchema.safeParse({
        file: new Blob(["test"]),
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("uploadPath"))
      ).toBe(true);
    });
  });

  describe("fileUrlUpload schema validation", () => {
    it("should validate fileUrlUpload with required fields", () => {
      const result = FileUrlUploadRequestSchema.safeParse({
        fileUrl: "https://example.com/file.txt",
        uploadPath: "uploads",
      });
      expect(result.success).toBe(true);
    });

    it("should validate fileUrlUpload with optional fileName", () => {
      const result = FileUrlUploadRequestSchema.safeParse({
        fileUrl: "https://example.com/file.txt",
        uploadPath: "uploads",
        fileName: "test.txt",
      });
      expect(result.success).toBe(true);
    });

    it("should reject fileUrlUpload without required fileUrl", () => {
      const result = FileUrlUploadRequestSchema.safeParse({
        uploadPath: "uploads",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("fileUrl"))).toBe(
        true
      );
    });

    it("should reject fileUrlUpload without required uploadPath", () => {
      const result = FileUrlUploadRequestSchema.safeParse({
        fileUrl: "https://example.com/file.txt",
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("uploadPath"))
      ).toBe(true);
    });
  });

  describe("fileBase64Upload schema validation", () => {
    it("should validate fileBase64Upload with required fields", () => {
      const result = FileBase64UploadRequestSchema.safeParse({
        base64Data: "dGVzdCBjb250ZW50",
        uploadPath: "uploads",
      });
      expect(result.success).toBe(true);
    });

    it("should validate fileBase64Upload with optional fields", () => {
      const result = FileBase64UploadRequestSchema.safeParse({
        base64Data: "dGVzdCBjb250ZW50",
        uploadPath: "uploads",
        fileName: "test.txt",
        mimeType: "text/plain",
      });
      expect(result.success).toBe(true);
    });

    it("should reject fileBase64Upload without required base64Data", () => {
      const result = FileBase64UploadRequestSchema.safeParse({
        uploadPath: "uploads",
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("base64Data"))
      ).toBe(true);
    });

    it("should reject fileBase64Upload without required uploadPath", () => {
      const result = FileBase64UploadRequestSchema.safeParse({
        base64Data: "dGVzdCBjb250ZW50",
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("uploadPath"))
      ).toBe(true);
    });
  });

  describe("veoGenerate schema validation", () => {
    it("should validate veoGenerate with required prompt", () => {
      const result = VeoGenerateRequestSchema.safeParse({
        prompt: "A cat playing piano",
      });
      expect(result.success).toBe(true);
    });

    it("should validate veoGenerate with all fields", () => {
      const result = VeoGenerateRequestSchema.safeParse({
        prompt: "A cat playing piano",
        model: "veo3",
        aspectRatio: "16:9",
        generationType: "TEXT_2_VIDEO",
        imageUrls: ["https://example.com/image.jpg"],
        seeds: 42,
        watermark: "My Watermark",
        enableTranslation: true,
      });
      expect(result.success).toBe(true);
    });

    it("should reject veoGenerate without required prompt", () => {
      const result = VeoGenerateRequestSchema.safeParse({});
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("prompt"))).toBe(
        true
      );
    });

    it("should validate veoGenerate enum values for model", () => {
      const valid = VeoGenerateRequestSchema.safeParse({
        prompt: "test",
        model: "veo3",
      });
      expect(valid.success).toBe(true);

      const invalid = VeoGenerateRequestSchema.safeParse({
        prompt: "test",
        model: "invalid-model",
      });
      expect(invalid.success).toBe(false);
      expect(invalid.error?.issues.some((i) => i.path.includes("model"))).toBe(
        true
      );
    });

    it("should validate veoGenerate enum values for aspectRatio", () => {
      const valid = VeoGenerateRequestSchema.safeParse({
        prompt: "test",
        aspectRatio: "16:9",
      });
      expect(valid.success).toBe(true);

      const invalid = VeoGenerateRequestSchema.safeParse({
        prompt: "test",
        aspectRatio: "4:3",
      });
      expect(invalid.success).toBe(false);
    });
  });

  describe("veoExtend schema validation", () => {
    it("should validate veoExtend with required fields", () => {
      const result = VeoExtendRequestSchema.safeParse({
        taskId: "task-123",
        prompt: "Extend the video",
      });
      expect(result.success).toBe(true);
    });

    it("should validate veoExtend with optional fields", () => {
      const result = VeoExtendRequestSchema.safeParse({
        taskId: "task-123",
        prompt: "Extend the video",
        model: "fast",
        seeds: 42,
        watermark: "Mark",
      });
      expect(result.success).toBe(true);
    });

    it("should reject veoExtend without required taskId", () => {
      const result = VeoExtendRequestSchema.safeParse({
        prompt: "Extend the video",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("taskId"))).toBe(
        true
      );
    });

    it("should reject veoExtend without required prompt", () => {
      const result = VeoExtendRequestSchema.safeParse({
        taskId: "task-123",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("prompt"))).toBe(
        true
      );
    });
  });

  describe("sunoGenerate schema validation", () => {
    it("should reject sunoGenerate without required prompt", () => {
      const result = SunoGenerateRequestSchema.safeParse({
        model: "V4",
        instrumental: false,
        customMode: true,
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("prompt"))).toBe(
        true
      );
    });

    it("should reject sunoGenerate without required model", () => {
      const result = SunoGenerateRequestSchema.safeParse({
        prompt: "A happy song",
        instrumental: false,
        customMode: true,
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("model"))).toBe(
        true
      );
    });

    it("should reject sunoGenerate with invalid model enum value", () => {
      const invalid = SunoGenerateRequestSchema.safeParse({
        prompt: "test",
        model: "V3",
        instrumental: true,
        customMode: false,
        callBackUrl: "https://example.com/callback",
      });
      expect(invalid.success).toBe(false);
    });
  });

  describe("chatCompletions55 schema validation", () => {
    it("should validate chatCompletions55 with required fields", () => {
      const result = KieChatRequestSchema.safeParse({
        model: "gpt-5.5",
        messages: [{ role: "user", content: "Hello" }],
      });
      expect(result.success).toBe(true);
    });

    it("should validate chatCompletions55 with all optional fields", () => {
      const result = KieChatRequestSchema.safeParse({
        model: "gpt-5.5",
        messages: [
          { role: "system", content: "You are helpful" },
          { role: "user", content: "Hello" },
        ],
        temperature: 0.7,
        max_tokens: 1000,
        stream: true,
      });
      expect(result.success).toBe(true);
    });

    it("should reject chatCompletions55 without required model", () => {
      const result = KieChatRequestSchema.safeParse({
        messages: [{ role: "user", content: "Hello" }],
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("model"))).toBe(
        true
      );
    });

    it("should reject chatCompletions55 without required messages", () => {
      const result = KieChatRequestSchema.safeParse({
        model: "gpt-5.5",
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("messages"))
      ).toBe(true);
    });

    it("should validate message role enum values", () => {
      const validRoles = ["user", "assistant", "system"];
      for (const role of validRoles) {
        const result = KieChatRequestSchema.safeParse({
          model: "gpt-5.5",
          messages: [{ role, content: "test" }],
        });
        expect(result.success).toBe(true);
      }
    });

    it("should reject invalid message role", () => {
      const result = KieChatRequestSchema.safeParse({
        model: "gpt-5.5",
        messages: [{ role: "invalid", content: "Hello" }],
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should validate response_format type enum", () => {
      const validTypes = ["text", "json_object", "json_schema"];
      for (const type of validTypes) {
        const result = KieChatRequestSchema.safeParse({
          model: "gpt-5.5",
          messages: [{ role: "user", content: "Hello" }],
          response_format: { type },
        });
        expect(result.success).toBe(true);
      }
    });

    it("should validate array items with nested object validation", () => {
      const result = KieChatRequestSchema.safeParse({
        model: "gpt-5.5",
        messages: [
          { role: "user" }, // missing content
        ],
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });
  });

  describe("claudeMessages schema validation", () => {
    it("should validate claudeMessages with required fields", () => {
      const result = KieClaudeRequestSchema.safeParse({
        model: "claude-sonnet-4-6",
        messages: [{ role: "user", content: "Hello" }],
      });
      expect(result.success).toBe(true);
    });

    it("should validate claudeMessages with haiku model", () => {
      const result = KieClaudeRequestSchema.safeParse({
        model: "claude-haiku-4-5",
        messages: [{ role: "user", content: "Hello" }],
      });
      expect(result.success).toBe(true);
    });

    it("should validate claudeMessages with optional fields", () => {
      const result = KieClaudeRequestSchema.safeParse({
        model: "claude-sonnet-4-6",
        messages: [{ role: "user", content: "Hello" }],
        stream: true,
        thinkingFlag: true,
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid model enum value", () => {
      const result = KieClaudeRequestSchema.safeParse({
        model: "invalid-model",
        messages: [{ role: "user", content: "Hello" }],
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("model"))).toBe(
        true
      );
    });

    it("should validate claude message roles", () => {
      const result = KieClaudeRequestSchema.safeParse({
        model: "claude-sonnet-4-6",
        messages: [
          { role: "user", content: "Hello" },
          { role: "assistant", content: "Hi there" },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("should reject system role in claude messages", () => {
      const result = KieClaudeRequestSchema.safeParse({
        model: "claude-sonnet-4-6",
        messages: [{ role: "system", content: "System prompt" }],
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should validate tools array with nested validation", () => {
      const result = KieClaudeRequestSchema.safeParse({
        model: "claude-sonnet-4-6",
        messages: [{ role: "user", content: "Hello" }],
        tools: [
          {
            name: "get_weather",
            description: "Get weather info",
            input_schema: { type: "object" },
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("should reject tool missing required fields", () => {
      const result = KieClaudeRequestSchema.safeParse({
        model: "claude-sonnet-4-6",
        messages: [{ role: "user", content: "Hello" }],
        tools: [
          {
            name: "get_weather",
            // missing description and input_schema
          },
        ],
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("multiple errors", () => {
    it("should collect multiple validation errors", () => {
      const result = CreateTaskRequestSchema.safeParse({});
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThanOrEqual(2);
    });

    it("should collect type errors alongside required errors", () => {
      const result = CreateTaskRequestSchema.safeParse({
        model: 123,
        input: "not-an-object",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThanOrEqual(2);
    });
  });
});
