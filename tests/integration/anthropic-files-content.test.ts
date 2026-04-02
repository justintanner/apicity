import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { anthropic } from "@nakedapi/anthropic";

describe("anthropic files content download integration", () => {
  let ctx: PollyContext;
  let createdFileId: string | null = null;

  beforeEach(() => {
    ctx = setupPolly("anthropic/files-content");
  });

  afterEach(async () => {
    if (createdFileId) {
      try {
        const provider = anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-test-key",
        });
        await provider.delete.v1.files.del(createdFileId);
      } catch {
        // Ignore cleanup errors
      }
      createdFileId = null;
    }
    await teardownPolly(ctx);
  });

  it("should download file content", async () => {
    const provider = anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-test-key",
    });
    // Upload a file first
    const fileContent = "test content for download";
    const blob = new Blob([fileContent], { type: "text/plain" });
    const created = await provider.post.v1.files(blob, "content-test.txt");
    createdFileId = created.id;

    // Download content
    const result = await provider.get.v1.files.content(created.id);
    expect(result).toBeDefined();
  });
});
