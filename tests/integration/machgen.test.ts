import { describe, it, expect } from "vitest";
import {
  createMachGen,
  MachGenError,
  MACHGEN_VIDEO_MODEL_TASK_TYPES,
  MachGenGenerateRequestSchema,
} from "@apicity/machgen";
import { setupPolly, teardownPolly } from "../harness";
import { machgenPayload, MACHGEN_CASES } from "../machgen-helpers";

describe("MachGen", () => {
  it("exposes the video schema and all 16 supported surfaces", () => {
    const provider = createMachGen({ apiKey: "test-key" });
    expect(provider.api.v0.generate.schema).toBe(MachGenGenerateRequestSchema);
    expect(Object.keys(MACHGEN_VIDEO_MODEL_TASK_TYPES)).toEqual(
      MACHGEN_CASES.map((c) => c[1])
    );
    expect(Object.values(MACHGEN_VIDEO_MODEL_TASK_TYPES)).toEqual([
      ["T2V", "I2V", "R2V"],
      ["T2V", "I2V", "R2V"],
      ["T2V", "I2V", "R2V"],
      ["T2V", "I2V", "R2V"],
      ["T2V", "I2V", "R2V"],
      ["I2V"],
    ]);
    for (const [i, [, model]] of MACHGEN_CASES.entries())
      for (const task of MACHGEN_VIDEO_MODEL_TASK_TYPES[model])
        expect(
          MachGenGenerateRequestSchema.safeParse(machgenPayload(i, task))
            .success
        ).toBe(true);
  });
  it("keeps video task types closed and model aliases grammar-bound", () => {
    const payload = machgenPayload(0, "T2V");
    const parse = (overrides: Record<string, unknown>) =>
      MachGenGenerateRequestSchema.safeParse({ ...payload, ...overrides })
        .success;
    expect(parse({ task_type: "T2I" })).toBe(false);
    expect(parse({ model: "Vidu-Q3-Pro" })).toBe(true);
    expect(parse({ model: "minimax h3" })).toBe(false);
    expect(parse({ video_config: { duration_secs: 1 } })).toBe(false);
  });
  it("preserves the upstream invalid-key error", async () => {
    const ctx = setupPolly("machgen/invalid-key");
    try {
      const provider = createMachGen({ apiKey: "invalid-test-key" });
      let captured: unknown;
      try {
        await provider.api.v0.tasks("invalid-task-id");
      } catch (error) {
        captured = error;
      }
      expect(captured).toBeInstanceOf(MachGenError);
      expect((captured as MachGenError).status).toBe(401);
      expect((captured as MachGenError).detail).toBe("Invalid JWT");
    } finally {
      await teardownPolly(ctx);
    }
  });
});
