import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  setupPolly,
  setupPollyForFileUploads,
  setupPollyWithPersistScrubber,
  teardownPolly,
  type PersistedHarRecording,
  type PollyContext,
} from "../harness";
import { createOpenAi } from "@apicity/openai";
import { OpenAiFileUploadRequestSchema } from "@apicity/openai/zod";

const MINIMAL_FILES_LIST_RESPONSE = {
  object: "list",
  data: [],
  has_more: false,
  first_id: null,
  last_id: null,
};

function sanitizeOpenAiFilesListRecording(
  recording: PersistedHarRecording
): void {
  const response = recording.response;
  if (!response) return;

  const text = JSON.stringify(MINIMAL_FILES_LIST_RESPONSE);
  response.bodySize = text.length;
  response.content ??= {};
  response.content.mimeType = "application/json";
  response.content.size = text.length;
  response.content.text = text;
  response.cookies = [];

  const droppedHeaders = new Set([
    "openai-organization",
    "openai-project",
    "set-cookie",
    "x-request-id",
  ]);
  response.headers = response.headers?.filter(
    (header) => !droppedHeaders.has(header.name?.toLowerCase() ?? "")
  );
}

describe("openai files integration", () => {
  let ctx: PollyContext;

  describe("list files", () => {
    beforeEach(() => {
      ctx = setupPollyWithPersistScrubber(
        "openai/files-list",
        sanitizeOpenAiFilesListRecording
      );
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should list files", async () => {
      const provider = createOpenAi({
        apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
      });

      const result = await provider.get.v1.files();

      expect(result.object).toBe("list");
      expect(Array.isArray(result.data)).toBe(true);
      expect(typeof result.has_more).toBe("boolean");
    });
  });

  describe("upload and retrieve file", () => {
    beforeEach(() => {
      ctx = setupPollyForFileUploads("openai/files-upload");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should upload a file", async () => {
      const provider = createOpenAi({
        apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
      });

      const content = '{"prompt": "test", "completion": "hello"}\n';
      const file = new Blob([content], { type: "application/jsonl" });

      const result = await provider.post.v1.files({
        file,
        purpose: "fine-tune",
      });

      expect(result.id).toBeDefined();
      expect(result.object).toBe("file");
      expect(result.filename).toBeDefined();
      expect(result.purpose).toBe("fine-tune");
    });
  });

  describe("retrieve file", () => {
    beforeEach(() => {
      ctx = setupPolly("openai/files-retrieve");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should retrieve file info", async () => {
      const provider = createOpenAi({
        apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
      });

      // Use a file ID from a previously uploaded file
      const files = await provider.get.v1.files();
      if (files.data.length === 0) return; // skip if no files

      const result = await provider.get.v1.files(files.data[0].id);

      expect(result.id).toBe(files.data[0].id);
      expect(result.object).toBe("file");
      expect(result.bytes).toBeGreaterThanOrEqual(0);
      expect(result.filename).toBeDefined();
    });
  });

  describe("validation", () => {
    it("should expose schema on upload", () => {
      const provider = createOpenAi({ apiKey: "sk-test" });
      // Bind the identity, not just presence: the MCP server derives this
      // endpoint's tool input JSON Schema from `.schema`, so attaching a
      // sibling's schema here would ship a wrong tool contract silently.
      expect(provider.post.v1.files.schema).toBe(OpenAiFileUploadRequestSchema);
      expect(typeof provider.post.v1.files.schema.safeParse).toBe("function");
    });

    it("should validate upload payload - valid", () => {
      const provider = createOpenAi({ apiKey: "sk-test" });
      const result = provider.post.v1.files.schema.safeParse({
        file: new Blob(["test"]),
        purpose: "fine-tune",
      });

      expect(result.success).toBe(true);
    });

    it("should validate upload payload - missing required fields", () => {
      const provider = createOpenAi({ apiKey: "sk-test" });
      const result = provider.post.v1.files.schema.safeParse({});

      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThanOrEqual(2);
    });

    it("should validate upload payload - invalid purpose", () => {
      const provider = createOpenAi({ apiKey: "sk-test" });
      const result = provider.post.v1.files.schema.safeParse({
        file: new Blob(["test"]),
        purpose: "invalid",
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("purpose"))).toBe(
        true
      );
    });
  });
});
