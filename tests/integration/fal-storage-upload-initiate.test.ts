import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { fal } from "@apicity/fal";

describe("fal storage upload initiate integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/storage-upload-initiate");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should initiate an upload, PUT bytes, and return a usable CDN url", async () => {
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 120000,
    });

    const fixturePath = path.resolve(
      import.meta.dirname,
      "..",
      "fixtures",
      "cat1.jpg"
    );
    const bytes = fs.readFileSync(fixturePath);

    const initiated = await provider.storage.upload.initiate({
      file_name: "cat1.jpg",
      content_type: "image/jpeg",
    });

    expect(initiated.file_url).toMatch(/^https:\/\/v3b?\.fal\.media\//);
    expect(initiated.upload_url.startsWith("https://")).toBe(true);

    const putRes = await fetch(initiated.upload_url, {
      method: "PUT",
      headers: { "Content-Type": "image/jpeg" },
      body: bytes,
    });
    expect(putRes.ok).toBe(true);
  }, 120000);

  it("should validate a valid payload", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const v = provider.storage.upload.initiate.schema.safeParse({
      file_name: "test.jpg",
      content_type: "image/jpeg",
    });
    expect(v.success).toBe(true);
  });

  it("should reject payload missing required fields", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const v = provider.storage.upload.initiate.schema.safeParse({});
    expect(v.success).toBe(false);
    expect(v.error?.issues.some((i) => i.path.includes("file_name"))).toBe(
      true
    );
    expect(v.error?.issues.some((i) => i.path.includes("content_type"))).toBe(
      true
    );
  });

  it("should accept an optional lifecycle object", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const v = provider.storage.upload.initiate.schema.safeParse({
      file_name: "test.jpg",
      content_type: "image/jpeg",
      lifecycle: { expiration_duration_seconds: 3600 },
    });
    expect(v.success).toBe(true);
  });

  it("should expose schema", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const schema = provider.storage.upload.initiate.schema;
    expect(schema).toBeDefined();
    expect(typeof schema.safeParse).toBe("function");
  });
});
