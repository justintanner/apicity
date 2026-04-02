import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { fal } from "@nakedapi/fal";

describe("fal files upload integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("fal/files-upload");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should get upload URL for a file", async () => {
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });
    const result = await provider.v1.serverless.files.uploadUrl({
      file_name: "test-upload.png",
      content_type: "image/png",
    });
    expect(result.upload_url).toBeTruthy();
    expect(result.file_url).toBeTruthy();
  });

  it("should list files", async () => {
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });
    const result = await provider.v1.serverless.files.list();
    expect(result.files).toBeDefined();
    expect(Array.isArray(result.files)).toBe(true);
  });

  it("should get download URL for a file", async () => {
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });
    const result = await provider.v1.serverless.files.download({
      file_url: "https://v1.fal.media/test-file.png",
    });
    expect(result.url).toBeTruthy();
  });
});
