import { describe, it, expect, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { xai, XaiError } from "@apicity/xai";

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

    const provider = xai({
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
    const provider = xai({ apiKey: "xai-test-key" });

    const valid = provider.post.v1.customVoices.schema.safeParse({
      file: new Blob([new Uint8Array([0])], { type: "audio/mpeg" }),
      name: "Test",
      language: "en",
    });
    expect(valid.success).toBe(true);

    const missingName = provider.post.v1.customVoices.schema.safeParse({
      file: new Blob([new Uint8Array([0])], { type: "audio/mpeg" }),
      language: "en",
    });
    expect(missingName.success).toBe(false);

    const missingFile = provider.post.v1.customVoices.schema.safeParse({
      name: "Test",
      language: "en",
    });
    expect(missingFile.success).toBe(false);
  });

  it("should expose customVoices schema", () => {
    const provider = xai({ apiKey: "xai-test-key" });
    expect(provider.post.v1.customVoices.schema).toBeDefined();
    expect(typeof provider.post.v1.customVoices.schema.safeParse).toBe(
      "function"
    );
  });
});
