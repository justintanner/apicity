import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  createMachGen,
  MachGenError,
  MACHGEN_VIDEO_GRIDS,
  MACHGEN_VIDEO_MODEL_TASK_TYPES,
  MachGenGenerateRequestSchema,
} from "@apicity/machgen";
import { setupPolly, teardownPolly } from "../harness";
import {
  machgenPayload,
  MACHGEN_CASES,
  MACHGEN_RECORDED,
} from "../machgen-helpers";

// Allowed values copied from MachGen's 400 responses on 2026-10-25.
const evidence = JSON.parse(
  readFileSync(
    "tests/fixtures/machgen-evidence/machgen-grids-2026-10-25.json",
    {
      encoding: "utf8",
    }
  )
) as {
  grids: Record<
    string,
    Record<
      string,
      { heights: number[]; durations: number[]; aspectRatios?: string[] }
    >
  >;
  taskTypes: Record<string, string[]>;
};

const issues = (overrides: Record<string, unknown>, index = 0) => {
  const result = MachGenGenerateRequestSchema.safeParse({
    ...machgenPayload(index, "I2V"),
    ...overrides,
  });
  return result.success
    ? []
    : result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
};

describe("MachGen", () => {
  it("exposes the video schema and every model in the docs matrix", () => {
    const provider = createMachGen({ apiKey: "test-key" });
    expect(provider.api.v0.generate.schema).toBe(MachGenGenerateRequestSchema);
    expect(MACHGEN_VIDEO_MODEL_TASK_TYPES).toEqual({
      "Wan2.2-A14B": ["T2V", "I2V"],
      "LTX-2.3-Pro": ["T2V", "I2V"],
      "Vidu-Q3-Turbo": ["T2V", "I2V", "R2V"],
      "Vidu-Q3-Pro": ["T2V", "I2V", "R2V"],
      "MiniMax-H3": ["T2V", "I2V", "R2V"],
      "MiniMax-H3-Turbo": ["T2V", "I2V", "R2V"],
      "Seedance-2.5": ["T2V", "I2V", "R2V"],
      "Seedance-2.0": ["T2V", "I2V", "R2V"],
      "Seedance-2.0-Fast": ["T2V", "I2V", "R2V"],
      "Seedance-2.0-Mini": ["T2V", "I2V", "R2V"],
      "Kling-v3": ["T2V", "I2V"],
      "Kling-o3": ["T2V", "R2V"],
      "Vidu-Q3": ["R2V"],
      "Vidu-Q4-Preview": ["I2V", "R2V"],
      "Vidu-Q3-Pro-Fast": ["I2V"],
      "Alibaba-Wan-3.0": ["T2V", "I2V", "R2V"],
      "Veo-3.1": ["T2V"],
      "Veo-3.1-Fast": ["T2V"],
      "Pixverse-V6": ["T2V", "I2V", "R2V"],
      "Pixverse-C1": ["T2V", "I2V", "R2V"],
      "HappyHorse-1.1": ["T2V", "I2V", "R2V"],
      "HappyHorse-1.0": ["T2V", "I2V", "R2V"],
      "Grok-Imagine-Video": ["T2V"],
      "Grok-Imagine-Video-1.5": ["I2V"],
    });
    const i2v = Object.entries(MACHGEN_VIDEO_MODEL_TASK_TYPES)
      .filter(([, tasks]) => (tasks as readonly string[]).includes("I2V"))
      .map(([model]) => model);
    expect(i2v).toHaveLength(19);
    // Every task-type list MachGen named in a 400 matches the matrix.
    for (const [model, tasks] of Object.entries(evidence.taskTypes)) {
      if (!Object.hasOwn(MACHGEN_VIDEO_MODEL_TASK_TYPES, model)) continue;
      expect(
        [...MACHGEN_VIDEO_MODEL_TASK_TYPES[model as "Kling-v3"]].sort(),
        model
      ).toEqual(tasks.filter((t) => t !== "F2F").sort());
    }
  });
  it("pins every T2V and I2V grid to MachGen's own 400 responses", () => {
    expect(Object.keys(MACHGEN_VIDEO_GRIDS).sort()).toEqual(
      Object.keys(evidence.grids).sort()
    );
    for (const [model, tasks] of Object.entries(evidence.grids))
      for (const [task, grid] of Object.entries(tasks)) {
        const ours = MACHGEN_VIDEO_GRIDS[model]?.[task as "T2V" | "I2V"];
        expect(ours?.heights, `${model} ${task}`).toEqual(grid.heights);
        expect(ours?.durations, `${model} ${task}`).toEqual(grid.durations);
        expect(ours?.aspectRatios, `${model} ${task}`).toEqual(
          grid.aspectRatios
        );
      }
    const endFrame = Object.entries(MACHGEN_VIDEO_GRIDS)
      .filter(([, grid]) => grid.I2V?.endFrame)
      .map(([model]) => model);
    expect(endFrame).toEqual([
      "LTX-2.3-Pro",
      "Vidu-Q3-Turbo",
      "Vidu-Q3-Pro",
      "MiniMax-H3",
      "MiniMax-H3-Turbo",
      "Seedance-2.5",
      "Seedance-2.0",
      "Seedance-2.0-Fast",
      "Seedance-2.0-Mini",
      "Kling-v3",
      "Alibaba-Wan-3.0",
    ]);
    const loneEndFrame = Object.entries(MACHGEN_VIDEO_GRIDS)
      .filter(([, grid]) => grid.I2V?.loneEndFrame)
      .map(([model]) => model);
    expect(loneEndFrame).toEqual(["MiniMax-H3", "MiniMax-H3-Turbo"]);
  });
  it("accepts every recorded payload", () => {
    for (const [i, task, variant] of MACHGEN_RECORDED)
      expect(
        MachGenGenerateRequestSchema.safeParse(machgenPayload(i, task, variant))
          .success,
        `${MACHGEN_CASES[i]![0]} ${task} ${JSON.stringify(variant ?? {})}`
      ).toBe(true);
    // Every case's model accepts its other declared tasks too.
    for (const [i, [, model]] of MACHGEN_CASES.entries())
      for (const task of MACHGEN_VIDEO_MODEL_TASK_TYPES[model])
        expect(
          MachGenGenerateRequestSchema.safeParse(machgenPayload(i, task))
            .success,
          `${model} ${task}`
        ).toBe(true);
  });
  it("restates MachGen's submit-time 400 rules", () => {
    const image = machgenPayload(0, "I2V").src_image_urls![0]!;
    expect(
      issues({ model: "Grok-Imagine-Video-1.5", task_type: "T2V" })
    ).toEqual([
      "task_type: Grok-Imagine-Video-1.5 does not support task_type=T2V; allowed task types: I2V",
    ]);
    expect(
      issues({
        model: "LTX-2.3-Pro",
        video_config: { height: 540, duration_secs: 6 },
      })
    ).toEqual([
      "video_config.height: LTX-2.3-Pro does not support I2V height=540; allowed heights: 1080, 1440, 2160",
    ]);
    expect(
      issues({ video_config: { height: 480, duration_secs: 2 } }, 6)
    ).toEqual([
      "video_config.duration_secs: MiniMax-H3-Turbo does not support I2V duration_secs=2; allowed durations: 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15",
    ]);
    expect(
      issues({
        model: "Seedance-2.5",
        video_config: { height: 480, duration_secs: 4, aspect_ratio: "16:9" },
      })
    ).toEqual([
      "video_config.aspect_ratio: Seedance-2.5 does not support I2V aspect_ratio='16:9'; allowed aspect ratios: adaptive",
    ]);
    expect(
      issues({
        model: "Pixverse-V6",
        video_config: { height: 360, duration_secs: 1, aspect_ratio: "16:9" },
      })
    ).toEqual([
      "video_config.aspect_ratio: Pixverse-V6 does not support configurable aspect_ratio for I2V",
    ]);
    expect(
      issues({
        model: "Pixverse-V6",
        video_config: { height: 360, duration_secs: 1 },
        src_image_urls: [image, image],
      })
    ).toEqual([
      "src_image_urls: Pixverse-V6 I2V accepts one source image; it does not support a last frame",
    ]);
    expect(
      issues({
        model: "Vidu-Q3-Turbo",
        video_config: { height: 540, duration_secs: 1 },
        keyframe_indices: [-1],
      })
    ).toEqual([
      "keyframe_indices: Vidu-Q3-Turbo I2V does not render towards a lone last frame; send the first frame as image 0",
    ]);
    expect(issues({ keyframe_indices: [0, -1] })).toEqual([
      "keyframe_indices: keyframe_indices has 2 entries for 1 source images; they must align",
    ]);
    expect(issues({ src_image_urls: [image, image, image] })).toEqual([
      "src_image_urls: I2V accepts at most 2 source images; got 3",
    ]);
    expect(issues({ src_image_urls: undefined })).toEqual([
      "src_image_urls: MiniMax-H3 I2V accepts one source image, or two to pin a start and end frame; got 0",
    ]);
  });
  it("keeps video task types closed and model aliases grammar-bound", () => {
    const payload = machgenPayload(0, "T2V");
    const parse = (overrides: Record<string, unknown>) =>
      MachGenGenerateRequestSchema.safeParse({ ...payload, ...overrides })
        .success;
    expect(parse({ task_type: "T2I" })).toBe(false);
    // An id outside the matrix is accepted unchecked.
    expect(parse({ model: "Vidu-Q9-Max" })).toBe(true);
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
