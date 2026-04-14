import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { fireworks } from "@apicity/fireworks";

describe("fireworks workflows integration", () => {
  describe("kontext async (FLUX Kontext Pro)", () => {
    let ctx: PollyContext;

    beforeEach(() => {
      ctx = setupPolly("fireworks/kontext-pro");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should submit an async image generation request and poll for result", async () => {
      const provider = fireworks({
        apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
      });

      // Submit async request
      const createResult = await provider.inference.v1.workflows.kontext(
        "flux-kontext-pro",
        {
          prompt: "A small blue sphere on a white background",
          seed: 42,
          output_format: "png",
        }
      );
      expect(createResult.request_id).toBeTruthy();

      // Poll for result
      const pollResult = await provider.inference.v1.workflows.getResult(
        "flux-kontext-pro",
        { id: createResult.request_id }
      );
      expect(pollResult.id).toBeTruthy();
      // Fireworks can return "Task not found" when polling immediately after
      // submit (before the task has propagated to the result store), so we
      // accept it alongside the normal lifecycle states.
      expect(
        ["Pending", "Ready", "Error", "Task not found"].includes(
          pollResult.status
        )
      ).toBe(true);
    });
  });

  describe("payload validation", () => {
    it("should validate textToImage payload", () => {
      const provider = fireworks({ apiKey: "test" });
      const valid =
        provider.inference.v1.workflows.textToImage.schema.safeParse({
          prompt: "A cat",
        });
      expect(valid.success).toBe(true);
      // errors checked via success;

      const invalid =
        provider.inference.v1.workflows.textToImage.schema.safeParse({});
      expect(invalid.success).toBe(false);
      expect(invalid.success).toBe(false);
    });

    it("should validate kontext payload", () => {
      const provider = fireworks({ apiKey: "test" });
      const valid = provider.inference.v1.workflows.kontext.schema.safeParse({
        prompt: "A cat",
      });
      expect(valid.success).toBe(true);

      const invalid = provider.inference.v1.workflows.kontext.schema.safeParse(
        {}
      );
      expect(invalid.success).toBe(false);
      expect(invalid.success).toBe(false);
    });

    it("should validate getResult payload", () => {
      const provider = fireworks({ apiKey: "test" });
      const valid = provider.inference.v1.workflows.getResult.schema.safeParse({
        id: "abc-123",
      });
      expect(valid.success).toBe(true);

      const invalid =
        provider.inference.v1.workflows.getResult.schema.safeParse({});
      expect(invalid.success).toBe(false);
      expect(invalid.success).toBe(false);
    });

    it("should expose payload schemas", () => {
      const provider = fireworks({ apiKey: "test" });
      expect(
        typeof provider.inference.v1.workflows.textToImage.schema.safeParse
      ).toBe("function");
      expect(
        typeof provider.inference.v1.workflows.kontext.schema.safeParse
      ).toBe("function");
      expect(
        typeof provider.inference.v1.workflows.getResult.schema.safeParse
      ).toBe("function");
    });
  });
});
