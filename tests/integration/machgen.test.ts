import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  createMachGen,
  MachGenError,
  MACHGEN_VIDEO_GRIDS,
  MACHGEN_VIDEO_MODEL_TASK_TYPES,
  MACHGEN_VIDEO_SHARPEN,
  MACHGEN_VIDEO_UPSCALE,
  MachGenGenerateRequestSchema,
  type MachGenGenerateRequest,
} from "@apicity/machgen";
import { setupPolly, teardownPolly } from "../harness";
import {
  machgenPayload,
  MACHGEN_CASES,
  MACHGEN_RECORDED,
  MACHGEN_REF_VIDEO,
  MACHGEN_SHARPEN_SOURCE,
  MACHGEN_UPSCALE_SOURCE,
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
  upscale: Record<string, { heights: number[]; engines?: string[] }>;
};

// MiniMax-H3-Omni's task type and R2V grid from MachGen's 400s on 2026-11-01.
const omniEvidence = JSON.parse(
  readFileSync("tests/fixtures/machgen-evidence/machgen-omni-2026-11-01.json", {
    encoding: "utf8",
  })
) as Pick<typeof evidence, "grids" | "taskTypes"> & {
  probes: Array<{ label: string; status: number; response: unknown }>;
};

// SHARPEN rules and heights from MachGen's quote on 2026-10-31.
const sharpenEvidence = JSON.parse(
  readFileSync(
    "tests/fixtures/machgen-evidence/machgen-sharpen-2026-10-31.json",
    { encoding: "utf8" }
  )
) as {
  sharpen: Record<string, { heights: number[] }>;
  probes: Array<{ label: string; status: number; response: unknown }>;
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
      "MiniMax-H3": ["T2V", "I2V", "R2V", "UPSCALE", "SHARPEN"],
      "MiniMax-H3-Turbo": ["T2V", "I2V", "R2V"],
      "MiniMax-H3-Omni": ["R2V"],
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
      "Topaz-Video-Precision": ["UPSCALE"],
      "Topaz-Video-Precision-Animation": ["UPSCALE"],
      "Topaz-Video-Generative": ["UPSCALE"],
      "Topaz-Video-Generative-Fast": ["UPSCALE"],
    });
    const i2v = Object.entries(MACHGEN_VIDEO_MODEL_TASK_TYPES)
      .filter(([, tasks]) => (tasks as readonly string[]).includes("I2V"))
      .map(([model]) => model);
    expect(i2v).toHaveLength(19);
    // Every task-type list MachGen named in a 400 matches the matrix.
    for (const [model, tasks] of Object.entries({
      ...evidence.taskTypes,
      ...omniEvidence.taskTypes,
    })) {
      if (!Object.hasOwn(MACHGEN_VIDEO_MODEL_TASK_TYPES, model)) continue;
      expect(
        [...MACHGEN_VIDEO_MODEL_TASK_TYPES[model as "Kling-v3"]].sort(),
        model
      ).toEqual(tasks.filter((t) => t !== "F2F").sort());
    }
  });
  it("pins every T2V, I2V and R2V grid to MachGen's own 400 responses", () => {
    const grids = { ...evidence.grids, ...omniEvidence.grids };
    expect(Object.keys(MACHGEN_VIDEO_GRIDS).sort()).toEqual(
      Object.keys(grids).sort()
    );
    for (const [model, tasks] of Object.entries(grids))
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
    const r2v = Object.entries(MACHGEN_VIDEO_MODEL_TASK_TYPES)
      .filter(([, tasks]) => (tasks as readonly string[]).includes("R2V"))
      .map(([model]) => model);
    expect(r2v).toHaveLength(17);
    for (const model of r2v)
      expect(MACHGEN_VIDEO_GRIDS[model]?.R2V, model).toBeDefined();
    // Upscale tiers and engines from the quote's 400s.
    expect(MACHGEN_VIDEO_UPSCALE).toEqual(evidence.upscale);
    expect(MACHGEN_VIDEO_SHARPEN).toEqual(sharpenEvidence.sharpen);
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
        if (task !== "UPSCALE" && task !== "SHARPEN")
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
  it("restates MachGen's R2V and UPSCALE rules", () => {
    const image = machgenPayload(0, "I2V").src_image_urls![0]!;
    const audio = "https://example.com/voice.mp3";
    const r2v = (overrides: Record<string, unknown>, index = 0) => {
      const result = MachGenGenerateRequestSchema.safeParse({
        ...machgenPayload(index, "R2V"),
        ...overrides,
      });
      return result.success
        ? []
        : result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
    };
    // Pixverse-V6 (case 16) takes up to three images and nothing else.
    expect(r2v({ src_image_urls: [image, image, image, image] }, 16)).toEqual([
      "src_image_urls: Pixverse-V6 R2V accepts at most 3 reference images; got 4",
    ]);
    expect(r2v({ src_video_urls: [MACHGEN_REF_VIDEO] }, 16)).toEqual([
      "src_video_urls: Pixverse-V6 R2V accepts at most 0 reference videos; got 1",
    ]);
    expect(r2v({ src_audio_urls: [audio] }, 16)).toEqual([
      "src_audio_urls: Pixverse-V6 R2V accepts at most 0 reference audio clips; got 1",
    ]);
    // Seedance-2.0-Mini (case 12).
    expect(
      r2v(
        {
          src_image_urls: Array(9).fill(image),
          src_video_urls: Array(3).fill(MACHGEN_REF_VIDEO),
          src_audio_urls: [audio],
        },
        12
      )
    ).toEqual([
      "src_image_urls: Seedance-2.0-Mini R2V accepts at most 12 reference files; got 13",
    ]);
    expect(
      r2v({ src_image_urls: undefined, src_audio_urls: [audio] }, 12)
    ).toEqual([
      "src_audio_urls: Seedance-2.0-Mini R2V audio references require at least one image or video reference",
    ]);
    expect(
      r2v(
        {
          src_image_urls: undefined,
          src_video_urls: [MACHGEN_REF_VIDEO],
          reference_video_start_secs: [1],
        },
        12
      )
    ).toEqual([
      "reference_video_start_secs: Seedance-2.0-Mini R2V reads every reference video from its start; it does not support reference_video_start_secs",
    ]);
    expect(
      r2v(
        {
          src_video_urls: [MACHGEN_REF_VIDEO],
          reference_video_operation: "edit",
        },
        12
      )
    ).toEqual([
      "reference_video_operation: Seedance-2.0-Mini R2V does not support reference_video_operation='edit'; allowed operations: reference",
    ]);
    // MiniMax-H3 (case 0) reads from an offset and takes audio alone.
    expect(
      r2v({
        src_image_urls: undefined,
        src_video_urls: [MACHGEN_REF_VIDEO],
        reference_video_start_secs: [0, 0],
      })
    ).toEqual([
      "reference_video_start_secs: reference_video_start_secs has 2 entries for 1 reference videos; they must align",
    ]);
    expect(
      r2v({
        src_video_urls: [MACHGEN_REF_VIDEO],
        reference_video_start_secs: [1],
      })
    ).toEqual([]);
    expect(r2v({ src_image_urls: undefined, src_audio_urls: [audio] })).toEqual(
      []
    );
    expect(r2v({ src_video_urls: ["ftp://example.com/clip.mp4"] })).toEqual([
      "src_video_urls.0: src_video_urls takes public http(s) URLs; reference a MachGen output with src_task_ids",
    ]);
    // An edit matches its source's length, so duration_secs is not checked.
    expect(
      r2v(
        {
          src_image_urls: undefined,
          src_video_urls: [MACHGEN_REF_VIDEO],
          reference_video_operation: "edit",
          video_config: { height: 480, duration_secs: 999 },
        },
        1
      )
    ).toEqual([]);
    expect(
      r2v(
        {
          src_video_urls: [MACHGEN_REF_VIDEO],
          subject_to_image_ids: { cat: [0] },
          subject_to_video_ids: { cat: [0] },
        },
        2
      )
    ).toEqual([
      "subject_to_video_ids.cat: subject cat appears in both subject_to_image_ids and subject_to_video_ids; a name may appear in only one map",
    ]);
    expect(r2v({ subject_to_image_ids: { cat: [3] } }, 2)).toEqual([
      "subject_to_image_ids.cat: subject_to_image_ids cat points at index 3, but there are 1 references",
    ]);
    // MiniMax-H3-Omni (case 24): each rule restates a 400 MachGen answered on
    // 2026-11-01, Python list brackets aside.
    const omni = (label: string) => {
      const probe = omniEvidence.probes.find((p) => p.label === label)!;
      expect(probe.status, label).toBe(400);
      return String(probe.response).replace(/\[([^\]]*)\]/g, (_, items) =>
        String(items).replaceAll("'", "")
      );
    };
    const video = {
      src_image_urls: undefined,
      src_video_urls: [MACHGEN_REF_VIDEO],
    };
    for (const [label, path, overrides] of [
      [
        "O11-10img-d1",
        "src_image_urls",
        { src_image_urls: Array(10).fill(image) },
      ],
      [
        "O14-13files-d1",
        "src_image_urls",
        {
          src_image_urls: Array(9).fill(image),
          src_video_urls: Array(3).fill(MACHGEN_REF_VIDEO),
          src_audio_urls: [audio],
        },
      ],
      [
        "O15-audio-only-d1",
        "src_audio_urls",
        { src_image_urls: undefined, src_audio_urls: [audio] },
      ],
      [
        "O16-offset9-d1",
        "reference_video_start_secs",
        { ...video, reference_video_start_secs: [9] },
      ],
      [
        "O17-edit",
        "reference_video_operation",
        { ...video, reference_video_operation: "edit" },
      ],
      [
        "O18-extend",
        "reference_video_operation",
        { ...video, reference_video_operation: "extend" },
      ],
    ] as const)
      expect(r2v(overrides, 24), label).toEqual([`${path}: ${omni(label)}`]);
    // Its video and audio caps equal the schema's own array limits, which
    // refuse a fourth video or audio clip first.
    expect(MACHGEN_VIDEO_GRIDS["MiniMax-H3-Omni"]?.R2V?.references).toEqual({
      images: 9,
      videos: 3,
      audios: 3,
      total: 12,
    });
    expect(omni("O12-4vid-d1")).toBe(
      "MiniMax-H3-Omni R2V accepts at most 3 reference videos; got 4"
    );
    expect(omni("O13-1img-4aud-d1")).toBe(
      "MiniMax-H3-Omni R2V accepts at most 3 reference audio clips; got 4"
    );
    const upscale = (overrides: Record<string, unknown>) => {
      const result = MachGenGenerateRequestSchema.safeParse({
        prompt: "",
        model: "Topaz-Video-Precision",
        task_type: "UPSCALE",
        src_task_ids: [MACHGEN_UPSCALE_SOURCE],
        video_config: { height: 1080, duration_secs: 4 },
        ...overrides,
      });
      return result.success
        ? []
        : result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
    };
    expect(upscale({})).toEqual([]);
    expect(upscale({ src_task_ids: undefined })).toEqual([
      "src_task_ids: a source video or image is required for UPSCALE",
    ]);
    expect(upscale({ video_config: { height: 1, duration_secs: 4 } })).toEqual([
      "video_config.height: Topaz-Video-Precision does not support UPSCALE height=1; allowed heights: 1080, 1440, 2160, 4320",
    ]);
    expect(upscale({ upscale_config: { engine: "starlight-hq" } })).toEqual([
      "upscale_config.engine: Topaz-Video-Precision does not support UPSCALE engine=starlight-hq; allowed engines: artemis-hq, artemis-lq, artemis-mq, gaia-cg, gaia-hq, proteus",
    ]);
    // Topaz's tuning knobs pass through untouched.
    expect(
      MachGenGenerateRequestSchema.parse({
        prompt: "",
        model: "Topaz-Video-Precision",
        task_type: "UPSCALE",
        src_task_ids: [MACHGEN_UPSCALE_SOURCE],
        upscale_config: { engine: "proteus", details: 0.2 },
        video_config: { height: 1080, duration_secs: 4 },
      }).upscale_config
    ).toEqual({ engine: "proteus", details: 0.2 });
    expect(upscale({ model: "Pixverse-V6" })).toEqual([
      "task_type: Pixverse-V6 does not support task_type=UPSCALE; allowed task types: T2V, I2V, R2V",
    ]);
    expect(
      issues({
        video_config: { height: 480, duration_secs: 1, num_frames: 22 },
      })
    ).toEqual([
      "video_config: set exactly one of duration_secs and num_frames",
    ]);
  });
  it("restates MachGen's SHARPEN rules", () => {
    const sharpen = (overrides: Record<string, unknown>) => {
      const result = MachGenGenerateRequestSchema.safeParse({
        prompt: "",
        model: "MiniMax-H3",
        task_type: "SHARPEN",
        src_task_ids: [MACHGEN_SHARPEN_SOURCE],
        video_config: { height: 480, duration_secs: 1 },
        ...overrides,
      });
      return result.success
        ? []
        : result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
    };
    // Each rule below restates a quote 400 in the evidence.
    const quoted = (label: string) =>
      sharpenEvidence.probes.find((probe) => probe.label === label)?.response;
    expect(sharpen({})).toEqual([]);
    expect(quoted("Q1-pin-480-d1")).toEqual({ cost_micros: 15000 });
    expect(
      sharpen({ video_config: { height: 768, duration_secs: 1 } })
    ).toEqual([]);
    expect(
      sharpen({ video_config: { height: 720, duration_secs: 1 } })
    ).toEqual([
      "video_config.height: MiniMax-H3 does not support SHARPEN height=720; allowed heights: 480, 768",
    ]);
    expect(quoted("Q2-height-720")).toBe(
      "MiniMax-H3 does not support SHARPEN height=720; allowed heights: [480, 768]"
    );
    expect(sharpen({ model: "Seedance-2.5" })).toEqual([
      "task_type: Seedance-2.5 does not support task_type=SHARPEN; allowed task types: T2V, I2V, R2V",
    ]);
    expect(sharpen({ src_task_ids: undefined })).toEqual([
      "src_task_ids: SHARPEN requires an owned uploaded or generated video",
    ]);
    expect(quoted("Q4-no-source")).toBe(
      "SHARPEN requires an owned uploaded or generated video"
    );
    expect(
      sharpen({ src_task_ids: undefined, src_video_urls: [MACHGEN_REF_VIDEO] })
    ).toEqual([
      "src_video_urls: SHARPEN requires an owned uploaded or generated video",
    ]);
    expect(quoted("Q15-public-video-url")).toBe(
      "SHARPEN requires an owned uploaded or generated video"
    );
    // An upload is owned: MachGen references it as @input/<artifact_path>.
    expect(
      sharpen({ src_task_ids: undefined, src_video_urls: ["@input/clip.mp4"] })
    ).toEqual([]);
    expect(
      sharpen({
        src_task_ids: [MACHGEN_SHARPEN_SOURCE, MACHGEN_UPSCALE_SOURCE],
      })
    ).toEqual(["src_task_ids: SHARPEN accepts one source video"]);
    expect(quoted("Q17-two-sources")).toBe("SHARPEN accepts one source video");
    expect(sharpen({ video_config: { height: 480, num_frames: 22 } })).toEqual([
      "video_config.num_frames: MiniMax-H3 SHARPEN does not accept num_frames",
    ]);
    expect(quoted("Q18-num-frames")).toBe(
      "MiniMax-H3 SHARPEN does not accept num_frames"
    );
  });
  it("keeps MachGen's 9-image ceiling on every video task", () => {
    const image = machgenPayload(0, "I2V").src_image_urls![0]!;
    const withImages = (payload: MachGenGenerateRequest, count: number) => {
      const result = MachGenGenerateRequestSchema.safeParse({
        ...payload,
        src_image_urls: Array(count).fill(image),
      });
      return result.success
        ? []
        : result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
    };
    // R2V grids without an image cap fall back to the documented 9.
    const uncapped = Object.entries(MACHGEN_VIDEO_GRIDS)
      .filter(
        ([, grids]) => grids.R2V && grids.R2V.references?.images === undefined
      )
      .map(([model]) => model);
    expect(uncapped).toEqual([
      "Seedance-2.5",
      "Vidu-Q4-Preview",
      "Alibaba-Wan-3.0",
      "HappyHorse-1.1",
      "HappyHorse-1.0",
    ]);
    const payloads: MachGenGenerateRequest[] = [
      ...MACHGEN_CASES.flatMap(([, model], i) =>
        uncapped.includes(model) ? [machgenPayload(i, "R2V")] : []
      ),
      // An id outside the matrix, T2V, UPSCALE and SHARPEN keep it too.
      { ...machgenPayload(0, "R2V"), model: "Vidu-Q9-Max" },
      machgenPayload(0, "T2V"),
      {
        prompt: "",
        model: "Topaz-Video-Precision",
        task_type: "UPSCALE",
        src_task_ids: [MACHGEN_UPSCALE_SOURCE],
        video_config: { height: 1080, duration_secs: 4 },
      },
      {
        prompt: "",
        model: "MiniMax-H3",
        task_type: "SHARPEN",
        src_task_ids: [MACHGEN_SHARPEN_SOURCE],
        video_config: { height: 480, duration_secs: 1 },
      },
    ];
    expect(payloads).toHaveLength(9);
    for (const payload of payloads) {
      const { model, task_type } = payload;
      const noun = task_type === "R2V" ? "reference" : "source";
      expect(withImages(payload, 9), `${model} ${task_type}`).toEqual([]);
      expect(withImages(payload, 10), `${model} ${task_type}`).toEqual([
        `src_image_urls: ${task_type} accepts at most 9 ${noun} images; got 10`,
      ]);
    }
    // A lower cap reports alone: I2V's two images, or an R2V grid's own cap.
    expect(withImages(machgenPayload(0, "I2V"), 10)).toEqual([
      "src_image_urls: I2V accepts at most 2 source images; got 10",
    ]);
    expect(withImages(machgenPayload(9, "R2V"), 10)).toEqual([
      "src_image_urls: Vidu-Q3-Turbo R2V accepts at most 7 reference images; got 10",
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
