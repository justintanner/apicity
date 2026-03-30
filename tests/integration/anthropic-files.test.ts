import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { anthropic } from "@nakedapi/anthropic";

describe("anthropic files", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should upload a file", async () => {
    ctx = setupPolly("anthropic/files-upload");
    const provider = anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-ant-test-key",
    });
    const content = "Hello, this is a test file for the Anthropic Files API.";
    const file = new Blob([content], { type: "text/plain" });
    const result = await provider.v1.files.upload(file);
    expect(result.id).toBeTruthy();
    expect(result.type).toBe("file");
    expect(result.filename).toBeTruthy();
    expect(result.size_bytes).toBeGreaterThan(0);
    expect(result.created_at).toBeTruthy();
  });

  it("should list files", async () => {
    ctx = setupPolly("anthropic/files-list");
    const provider = anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-ant-test-key",
    });
    const result = await provider.v1.files.list({ limit: 5 });
    expect(result.data).toBeInstanceOf(Array);
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0].id).toBeTruthy();
    expect(result.data[0].type).toBe("file");
  });

  it("should retrieve a file", async () => {
    ctx = setupPolly("anthropic/files-retrieve");
    const provider = anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-ant-test-key",
    });
    const list = await provider.v1.files.list({ limit: 1 });
    const fileId = list.data[0].id;
    const result = await provider.v1.files.retrieve(fileId);
    expect(result.id).toBe(fileId);
    expect(result.type).toBe("file");
    expect(result.filename).toBeTruthy();
    expect(result.size_bytes).toBeGreaterThan(0);
  });

  it("should download file content", async () => {
    ctx = setupPolly("anthropic/files-content");
    const provider = anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-ant-test-key",
    });
    const list = await provider.v1.files.list({ limit: 1 });
    const fileId = list.data[0].id;
    const result = await provider.v1.files.content(fileId);
    expect(result).toBeInstanceOf(ArrayBuffer);
    expect(result.byteLength).toBeGreaterThan(0);
  });

  it("should delete a file", async () => {
    ctx = setupPolly("anthropic/files-delete");
    const provider = anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-ant-test-key",
    });
    // Upload a file to delete
    const content = "Temporary file for deletion test.";
    const file = new Blob([content], { type: "text/plain" });
    const uploaded = await provider.v1.files.upload(file);
    const result = await provider.v1.files.del(uploaded.id);
    expect(result.id).toBe(uploaded.id);
    expect(result.type).toBe("file_deleted");
  });
});
