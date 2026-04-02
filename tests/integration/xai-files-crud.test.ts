import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { xai } from "@nakedapi/xai";

describe("xAI files CRUD integration", () => {
  let ctx: PollyContext;
  let createdFileId: string | null = null;

  beforeEach(() => {
    ctx = setupPolly("xai/files-crud");
  });

  afterEach(async () => {
    // Cleanup
    if (createdFileId) {
      try {
        const provider = xai({
          apiKey: process.env.XAI_API_KEY ?? "xai-test-key",
        });
        await provider.delete.v1.files(createdFileId);
      } catch {
        // Ignore cleanup errors
      }
      createdFileId = null;
    }
    await teardownPolly(ctx);
  });

  it("should upload a file", async () => {
    const provider = xai({
      apiKey: process.env.XAI_API_KEY ?? "xai-test-key",
    });
    const content = new Blob([JSON.stringify({ test: "data" })], {
      type: "application/json",
    });
    const result = await provider.post.v1.files(content, "test.json", "batch");
    expect(result.id).toBeTruthy();
    expect(result.filename).toBe("test.json");
    createdFileId = result.id;
  });

  it("should list files", async () => {
    const provider = xai({
      apiKey: process.env.XAI_API_KEY ?? "xai-test-key",
    });
    const result = await provider.get.v1.files();
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
  });

  it("should get a file by id", async () => {
    const provider = xai({
      apiKey: process.env.XAI_API_KEY ?? "xai-test-key",
    });
    // Upload first
    const content = new Blob([JSON.stringify({ test: "get" })], {
      type: "application/json",
    });
    const created = await provider.post.v1.files(
      content,
      "get-test.json",
      "batch"
    );
    createdFileId = created.id;

    // Get
    const result = await provider.get.v1.files(created.id);
    expect(result.id).toBe(created.id);
  });

  it("should delete a file", async () => {
    const provider = xai({
      apiKey: process.env.XAI_API_KEY ?? "xai-test-key",
    });
    // Upload
    const content = new Blob([JSON.stringify({ test: "delete" })], {
      type: "application/json",
    });
    const created = await provider.post.v1.files(
      content,
      "delete-test.json",
      "batch"
    );

    // Delete
    const result = await provider.delete.v1.files(created.id);
    expect(result.id).toBe(created.id);
    expect(result.deleted).toBe(true);
    createdFileId = null; // Already deleted
  });
});
