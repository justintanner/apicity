import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { xai } from "@nakedapi/xai";

describe("xAI files content download integration", () => {
  let ctx: PollyContext;
  let createdFileId: string | null = null;

  beforeEach(() => {
    ctx = setupPolly("xai/files-content");
  });

  afterEach(async () => {
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

  it("should download file content as text", async () => {
    const provider = xai({
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
    const response = await fetch(
      `${process.env.XAI_BASE_URL ?? "https://api.x.ai/v1"}/files/${created.id}/content`,
      {
        headers: {
          Authorization: `Bearer ${process.env.XAI_API_KEY ?? "xai-test-key"}`,
        },
      }
    );
    expect(response.ok).toBe(true);
    const downloaded = await response.text();
    expect(downloaded).toBeTruthy();
  });
});
