import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createAnthropic } from "@apicity/anthropic";
import type { AnthropicFile } from "@apicity/anthropic";

describe("anthropic files integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  describe("list files", () => {
    beforeEach(() => {
      ctx = setupPolly("anthropic/files-list");
    });

    it("should list uploaded files", async () => {
      const provider = createAnthropic({
        apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-test-key",
      });

      const result = await provider.v1.files.list();

      expect(Array.isArray(result.data)).toBe(true);
      expect(typeof result.has_more).toBe("boolean");

      if (result.data.length > 0) {
        const file: AnthropicFile = result.data[0];
        expect(file.id).toBeDefined();
        expect(file.type).toBe("file");
        expect(file.filename).toBeDefined();
        expect(file.mime_type).toBeDefined();
        expect(typeof file.size_bytes).toBe("number");
      }
    });
  });

  describe("retrieve file", () => {
    beforeEach(() => {
      ctx = setupPolly("anthropic/files-retrieve");
    });

    it("should retrieve a single file's metadata by id", async () => {
      const provider = createAnthropic({
        apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-test-key",
      });

      const list = await provider.v1.files.list();
      if (list.data.length === 0) return; // no files to retrieve

      const id = list.data[0].id;
      const result = await provider.v1.files.retrieve(id);

      expect(result.id).toBe(id);
      expect(result.type).toBe("file");
      expect(result.filename).toBeDefined();
      expect(result.mime_type).toBeDefined();
      expect(typeof result.size_bytes).toBe("number");
      expect(result.created_at).toBeDefined();
    });
  });
});
