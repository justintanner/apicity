import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createOpenAi } from "@apicity/openai";

describe("openai files content download integration", () => {
  let ctx: PollyContext;
  let createdFileId: string | null = null;

  beforeEach(() => {
    ctx = setupPolly("openai/files-content");
  });

  afterEach(async () => {
    if (createdFileId) {
      try {
        const provider = createOpenAi({
          apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
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
    const provider = createOpenAi({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });
    // Upload a file first
    const fileContent = JSON.stringify({ test: "content" });
    const blob = new Blob([fileContent], { type: "application/json" });
    // `filename` is forwarded to the multipart body at runtime but absent
    // from the declared request type; hoisting the payload out of the call
    // bypasses excess-property checking only.
    const uploadRequest = {
      file: blob,
      purpose: "batch",
      filename: "content-test.json",
    } as const;
    const created = await provider.post.v1.files(uploadRequest);
    createdFileId = created.id;

    // Get content URL
    const baseURL = "https://api.openai.com/v1";
    const response = await fetch(`${baseURL}/files/${created.id}/content`, {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? "sk-test-key"}`,
      },
    });
    expect(response.ok).toBe(true);
    const downloaded = await response.text();
    expect(downloaded).toBeTruthy();
  });
});
