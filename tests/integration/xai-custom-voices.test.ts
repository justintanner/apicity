import { describe, it, expect, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createXai, XaiError } from "@apicity/xai";
import { XaiCustomVoiceCreateRequestSchema } from "@apicity/xai/zod";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

describe("xAI custom voices integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  // Custom voices are feature-gated upstream. The recorded fixture captures a
  // 403 ("Custom voices are not enabled for this team."). This test verifies
  // the request is shaped correctly and the gating error surfaces as a
  // typed XaiError; re-record once the team has access to assert on
  // voice_id success.
  it("should surface upstream gating as XaiError 403", async () => {
    ctx = setupPolly("xai/custom-voices-create");

    const refPath = resolve(__dirname, "../fixtures/dialog.mp3");
    const refBuffer = readFileSync(refPath);
    const file = new Blob([refBuffer], { type: "audio/mpeg" });

    const provider = createXai({
      apiKey: process.env.XAI_API_KEY ?? "xai-test-key",
    });

    await expect(
      provider.post.v1.customVoices({
        file,
        name: "Test Narrator",
        language: "en",
        filename: "dialog.mp3",
      })
    ).rejects.toBeInstanceOf(XaiError);
  });

  it("should validate customVoices payload", () => {
    const provider = createXai({ apiKey: "xai-test-key" });

    const valid = provider.post.v1.customVoices.schema.safeParse({
      file: new Blob([new Uint8Array([0])], { type: "audio/mpeg" }),
      name: "Test",
      language: "en",
      gender: "neutral",
      tone: "friendly",
    });
    expect(valid.success).toBe(true);

    const fileOnly = provider.post.v1.customVoices.schema.safeParse({
      file: new Blob([new Uint8Array([0])], { type: "audio/mpeg" }),
    });
    expect(fileOnly.success).toBe(true);

    const missingFile = provider.post.v1.customVoices.schema.safeParse({
      name: "Test",
      language: "en",
    });
    expect(missingFile.success).toBe(false);

    const invalidGender = provider.post.v1.customVoices.schema.safeParse({
      file: new Blob([new Uint8Array([0])], { type: "audio/mpeg" }),
      gender: "robot",
    });
    expect(invalidGender.success).toBe(false);
  });

  it("should expose customVoices schema", () => {
    const provider = createXai({ apiKey: "xai-test-key" });
    // Bind the identity, not just presence: the MCP server derives this
    // endpoint's tool input JSON Schema from `.schema`, so attaching a
    // sibling's schema here would ship a wrong tool contract silently.
    expect(provider.post.v1.customVoices.schema).toBe(
      XaiCustomVoiceCreateRequestSchema
    );
    expect(typeof provider.post.v1.customVoices.schema.safeParse).toBe(
      "function"
    );
  });
});
