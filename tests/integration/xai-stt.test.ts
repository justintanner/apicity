import { describe, it, expect, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createXai } from "@apicity/xai";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

describe("xAI speech-to-text integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should transcribe a small mp3 file", async () => {
    ctx = setupPolly("xai/stt-dialog");

    const mp3Path = resolve(__dirname, "../fixtures/dialog.mp3");
    const mp3Buffer = readFileSync(mp3Path);
    const file = new Blob([mp3Buffer], { type: "audio/mpeg" });

    const provider = createXai({
      apiKey: process.env.XAI_API_KEY ?? "xai-test-key",
    });

    const result = await provider.post.v1.stt({
      file,
      filename: "dialog.mp3",
    });

    expect(typeof result.text).toBe("string");
    expect(result.text.length).toBeGreaterThan(0);
    if (result.duration !== undefined) {
      expect(result.duration).toBeGreaterThan(0);
    }
    if (result.words) {
      expect(result.words.length).toBeGreaterThan(0);
      expect(result.words[0]).toHaveProperty("text");
      expect(result.words[0]).toHaveProperty("start");
      expect(result.words[0]).toHaveProperty("end");
    }
  });

  it("should validate stt payload", () => {
    const provider = createXai({ apiKey: "xai-test-key" });

    const valid = provider.post.v1.stt.schema.safeParse({
      file: new Blob([new Uint8Array([0])], { type: "audio/mpeg" }),
    });
    expect(valid.success).toBe(true);

    const missing = provider.post.v1.stt.schema.safeParse({});
    expect(missing.success).toBe(false);
  });

  it("should expose stt schema", () => {
    const provider = createXai({ apiKey: "xai-test-key" });
    expect(provider.post.v1.stt.schema).toBeDefined();
    expect(typeof provider.post.v1.stt.schema.safeParse).toBe("function");
  });
});
