import { afterEach, describe, expect, it } from "vitest";
import { createOpenAi } from "@apicity/openai";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

const RECORDING_NAME = "openai/uploads-create";
const REQUEST = {
  purpose: "fine-tune" as const,
  filename: "apicity-upload-create.jsonl",
  bytes: 18,
  mime_type: "application/jsonl",
  expires_after: {
    anchor: "created_at" as const,
    seconds: 3600,
  },
};

describe("openai uploads create integration", () => {
  let ctx: PollyContext | undefined;

  afterEach(async () => {
    if (ctx) {
      await teardownPolly(ctx);
      ctx = undefined;
    }
  });

  it("creates an upload request as JSON", async () => {
    ctx = setupPolly(RECORDING_NAME);

    const provider = createOpenAi({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });

    const result = await provider.post.v1.uploads(REQUEST);

    expect(result.id).toMatch(/^upload_/);
    expect(result.object).toBe("upload");
    expect(result.bytes).toBe(REQUEST.bytes);
    expect(result.filename).toBe(REQUEST.filename);
    expect(result.purpose).toBe(REQUEST.purpose);
    expect(typeof result.status).toBe("string");
  });

  it("validates create upload payloads", () => {
    const provider = createOpenAi({ apiKey: "sk-test-key" });
    const schema = provider.post.v1.uploads.schema;

    expect(
      schema.safeParse({
        purpose: "vision",
        filename: "image.png",
        bytes: 12345,
        mime_type: "image/png",
        expires_after: {
          anchor: "created_at",
          seconds: 2592000,
        },
      }).success
    ).toBe(true);

    expect(
      schema.safeParse({
        purpose: "vision",
        filename: "image.png",
        bytes: 12345,
      }).success
    ).toBe(false);

    expect(
      schema.safeParse({
        purpose: "user_data",
        filename: "notes.txt",
        bytes: 12345,
        mime_type: "text/plain",
      }).success
    ).toBe(false);

    expect(
      schema.safeParse({
        purpose: "batch",
        filename: "batch.jsonl",
        bytes: 12345,
        mime_type: "application/jsonl",
        expires_after: {
          anchor: "created_at",
          seconds: 3599,
        },
      }).success
    ).toBe(false);
  });
});
