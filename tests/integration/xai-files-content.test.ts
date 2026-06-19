import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createXai } from "@apicity/xai";

describe("xAI files content download integration", () => {
  let ctx: PollyContext;
  let createdFileId: string | null = null;

  beforeEach(() => {
    ctx = setupPolly("xai/files-content");
  });

  afterEach(async () => {
    if (createdFileId) {
      try {
        const provider = createXai({
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

  it("should download file content as text", async () => {
    const provider = createXai({
      apiKey: process.env.XAI_API_KEY ?? "xai-test-key",
    });
    // Upload a file first
    const fileContent = JSON.stringify({ test: "content download" });
    const blob = new Blob([fileContent], { type: "application/json" });
    const created = await provider.post.v1.files(
      blob,
      "content-test.json",
      "batch"
    );
    createdFileId = created.id;

    // Download content
    const downloaded = await provider.get.v1.files.content(created.id);
    expect(downloaded).toContain("content download");
  });
});
