import { describe, it, expect, afterEach } from "vitest";
import {
  setupPolly,
  setupPollyForFileUploads,
  teardownPolly,
  TEST_PAYGATE_SECRET,
  mintKieCreateTaskOtp,
  type PollyContext,
} from "../harness";
import {
  createKie,
  submitMediaJob,
  type MediaGenerationRequest,
} from "@apicity/kie";

describe("kie helper functions", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  describe("submitMediaJob", () => {
    it("should create task and return taskId", async () => {
      ctx = setupPolly("kie/helpers/submit-media-job");
      const provider = createKie({
        apiKey: process.env.KIE_API_KEY ?? "test-key",
        paygate: { secret: TEST_PAYGATE_SECRET },
      });
      const request = {
        model: "grok-imagine/text-to-image",
        input: {
          prompt: "A red apple on a wooden table",
          aspect_ratio: "1:1",
        },
      } satisfies MediaGenerationRequest;
      const taskId = await submitMediaJob(
        provider,
        request,
        mintKieCreateTaskOtp(request)
      );

      expect(taskId).toBeTruthy();
      expect(typeof taskId).toBe("string");
      expect(taskId.length).toBeGreaterThan(0);
    });
  });

  describe("upload helpers", () => {
    it("should upload file stream directly and return download URL", async () => {
      ctx = setupPollyForFileUploads("kie/helpers/upload-file");
      const provider = createKie({
        apiKey: process.env.KIE_API_KEY ?? "test-key",
        paygate: { secret: TEST_PAYGATE_SECRET },
      });

      // Create a small test file
      const base64Pixel =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFCcSAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
      const binaryString = atob(base64Pixel);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const file = new Blob([bytes], { type: "image/png" });

      // Use the direct endpoint instead of helper for consistent replay.
      // fileStreamUpload is a FREE endpoint (no OTP needed).
      const result = await provider.post.api.fileStreamUpload({
        file,
        filename: "test.png",
        uploadPath: "uploads",
      });

      expect(result.code).toBe(200);
      expect(result.data?.downloadUrl).toBeTruthy();
      expect(result.data?.downloadUrl).toMatch(/^https:\/\//);
    });
  });

  describe("payload validation", () => {
    it("should validate payload schema for createTask", async () => {
      const provider = createKie({
        apiKey: process.env.KIE_API_KEY ?? "test-key",
        paygate: { secret: TEST_PAYGATE_SECRET },
      });
      const result = provider.post.api.v1.jobs.createTask.schema.safeParse({
        model: "grok-imagine/text-to-image",
        input: {
          prompt: "test",
          aspect_ratio: "1:1",
        },
      });
      expect(result.success).toBe(true);
    });

    it("should validate payload schema for file uploads", async () => {
      const provider = createKie({
        apiKey: process.env.KIE_API_KEY ?? "test-key",
        paygate: { secret: TEST_PAYGATE_SECRET },
      });
      const result = provider.post.api.fileStreamUpload.schema.safeParse({
        file: new Blob(["test"]),
        filename: "test.png",
        uploadPath: "uploads",
      });
      expect(result.success).toBe(true);
    });
  });
});
