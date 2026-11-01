/**
 * Print the MachGen README's "Video models" section as Markdown on stdout.
 *
 * `scripts/doc-gen.mjs` is a plain Node script, so this bridge runs under
 * `node --import tsx` and reads the provider's model table and grids and the
 * bundled `@apicity/cost` rates directly. It makes no network call.
 */
import {
  MACHGEN_VIDEO_GRIDS,
  MACHGEN_VIDEO_MODEL_TASK_TYPES,
  MACHGEN_VIDEO_SHARPEN,
  MACHGEN_VIDEO_UPSCALE,
  type MachGenVideoGrid,
} from "../../packages/provider/machgen/src/zod.ts";
import { computeEstimate } from "../../packages/provider/cost/src/compute.ts";

/** "1, 2, 3, 6" -> "1-3, 6"; MachGen's Smart length (-1) stays first. */
function runs(values: readonly number[]): string {
  const parts: string[] = [];
  let start = values[0];
  let prev = values[0];
  for (const value of [...values.slice(1), undefined]) {
    if (value !== undefined && prev !== undefined && value === prev + 1) {
      prev = value;
      continue;
    }
    if (start !== undefined && prev !== undefined)
      parts.push(start === prev ? String(start) : `${start}-${prev}`);
    start = value;
    prev = value;
  }
  return parts.join(", ");
}

type Task = "T2V" | "I2V" | "R2V" | "UPSCALE" | "SHARPEN";

/** Whether `@apicity/cost` prices a grid-valid request of this task. */
function priced(model: string, task: Task): boolean {
  if (task === "UPSCALE" || task === "SHARPEN") {
    const heights =
      task === "UPSCALE" ? MACHGEN_VIDEO_UPSCALE : MACHGEN_VIDEO_SHARPEN;
    const estimate = computeEstimate({
      provider: "machgen",
      payload: {
        model,
        task_type: task,
        prompt: "",
        src_task_ids: ["source-task"],
        video_config: {
          height: heights[model]?.heights[0] ?? 1080,
          duration_secs: 5,
        },
      },
      costHints: { inputDurationSeconds: 5 },
    });
    return estimate.usd > 0 && estimate.warnings.length === 0;
  }
  const grid =
    MACHGEN_VIDEO_GRIDS[model]?.[task] ??
    MACHGEN_VIDEO_GRIDS[model]?.I2V ??
    MACHGEN_VIDEO_GRIDS[model]?.T2V;
  const height = grid?.heights[0] ?? 720;
  const duration_secs = grid?.durations.find((d) => d > 0) ?? 5;
  const estimate = computeEstimate({
    provider: "machgen",
    payload: {
      model,
      task_type: task,
      prompt: "A cat walks across a sunlit wooden floor.",
      video_config: { height, duration_secs, audio: false },
      ...(task === "T2V"
        ? {}
        : { src_image_urls: ["https://example.com/cat.jpg"] }),
    },
  });
  return estimate.usd > 0 && estimate.warnings.length === 0;
}

const yes = "✓";
const rows = Object.entries(MACHGEN_VIDEO_MODEL_TASK_TYPES).map(
  ([model, tasks]) => {
    const has = (task: string) => (tasks as readonly string[]).includes(task);
    const i2v = MACHGEN_VIDEO_GRIDS[model]?.I2V;
    const frames = !i2v?.endFrame
      ? ""
      : i2v.loneEndFrame
        ? "start + end, or end only"
        : "start + end";
    const pricedTasks = (
      ["T2V", "I2V", "R2V", "UPSCALE", "SHARPEN"] as const
    ).filter((task) => has(task) && priced(model, task));
    return [
      `\`${model}\``,
      has("T2V") ? yes : "",
      has("I2V") ? yes : "",
      has("R2V") ? yes : "",
      has("UPSCALE") ? yes : "",
      has("SHARPEN") ? yes : "",
      frames,
      i2v ? i2v.heights.join(", ") : "",
      i2v ? runs(i2v.durations) : "",
      pricedTasks.join(", "),
    ];
  }
);

/** An R2V grid's reference limits: "up to 7 images; no videos or audio". */
function references(grid: MachGenVideoGrid): string {
  const caps = grid.references;
  if (!caps) return "not checked";
  const nouns = { images: "images", videos: "videos", audios: "audio" };
  const kinds = (["images", "videos", "audios"] as const).filter(
    (kind) => caps[kind] !== undefined
  );
  const capped = kinds.filter((kind) => caps[kind]! > 0);
  const none = kinds.filter((kind) => caps[kind] === 0);
  const open = (["images", "videos", "audios"] as const).filter(
    (kind) => caps[kind] === undefined
  );
  return [
    capped.length &&
      `up to ${capped.map((kind) => `${caps[kind]} ${nouns[kind]}`).join(", ")}`,
    none.length && `no ${none.map((kind) => nouns[kind]).join(" or ")}`,
    caps.total !== undefined && `${caps.total} in all`,
    open.length &&
      `${open.map((kind) => nouns[kind]).join(" and ")} not checked`,
    grid.visualReference && "audio needs an image or video",
  ]
    .filter(Boolean)
    .join("; ");
}

const r2vRows = Object.entries(MACHGEN_VIDEO_GRIDS).flatMap(
  ([model, grids]) => {
    const grid = grids.R2V;
    if (!grid) return [];
    const video =
      grid.references?.videos === 0
        ? "none"
        : [
            grid.operations?.join(", "),
            grid.startOffset ? "start offsets" : undefined,
          ]
            .filter(Boolean)
            .join("; ") || "not checked";
    return [
      [
        `\`${model}\``,
        grid.heights.join(", "),
        runs(grid.durations),
        references(grid),
        video,
      ],
    ];
  }
);

const upscaleRows = Object.entries(MACHGEN_VIDEO_UPSCALE).map(
  ([model, grid]) => [
    `\`${model}\``,
    grid.heights.join(", "),
    grid.engines?.map((engine) => `\`${engine}\``).join(", ") ?? "",
    priced(model, "UPSCALE") ? yes : "",
  ]
);

const sharpenRows = Object.entries(MACHGEN_VIDEO_SHARPEN).map(
  ([model, grid]) => [
    `\`${model}\``,
    grid.heights.join(", "),
    priced(model, "SHARPEN") ? yes : "",
  ]
);

const table = (head: string[], body: string[][]) => [
  `| ${head.join(" | ")} |`,
  `| ${head.map(() => "---").join(" | ")} |`,
  ...body.map((row) => `| ${row.join(" | ")} |`),
];

const header = [
  "Model",
  "T2V",
  "I2V",
  "R2V",
  "UPSCALE",
  "SHARPEN",
  "I2V frames",
  "I2V heights",
  "I2V seconds",
  "Priced",
];
const lines = [
  "## Video models",
  "",
  "Pass a `model` id with a `task_type` it supports. For the ids below,",
  "`machgen.api.v0.generate.schema` also checks the height, `duration_secs`",
  "and `aspect_ratio` against the model's grid (`MACHGEN_VIDEO_GRIDS`, which",
  "holds each T2V and R2V grid too), the I2V frame rules, the R2V reference",
  "limits, the UPSCALE targets (`MACHGEN_VIDEO_UPSCALE`) and the SHARPEN",
  "heights (`MACHGEN_VIDEO_SHARPEN`); other ids pass unchecked. MachGen",
  "answers an off-grid request with HTTP 400 before it accepts the task, and",
  "does not bill it. The grids were read from those 400 responses on",
  "2026-10-25, and the SHARPEN heights on 2026-10-31. `-1` asks the model for",
  "a Smart length.",
  "",
  ...table(header, rows),
  "",
  "An I2V request takes one start frame in `src_image_urls`. Where the table",
  'lists "start + end", entry 1 is the end frame; "end only" means',
  "`keyframe_indices: [-1]` animates toward a single image used as the end",
  'frame. MachGen also accepts `task_type: "F2F"` for two-image I2V; the',
  "schema keeps the documented I2V form. MiniMax-H3 and MiniMax-H3-Turbo list",
  "1080p, but MachGen answers 403 to accounts without access to it, and the",
  "pricebook has no 1080p rate. The pricebook's LTX-2.3-Pro 540p and 720p",
  "tiers are not requestable.",
  "",
  "### Reference-to-video",
  "",
  "An R2V request takes reference images, videos and audio clips in",
  "`src_image_urls`, `src_video_urls` (public http(s) URLs) and",
  "`src_audio_urls`, or earlier outputs in `src_task_ids`.",
  "`reference_video_start_secs` lists one start second per reference video.",
  "`reference_video_operation` edits or extends the video instead of using",
  "it as a reference; an edit renders at the video's own length, so MachGen",
  "ignores `duration_secs`.",
  "",
  ...table(
    ["Model", "R2V heights", "R2V seconds", "References", "Reference video"],
    r2vRows
  ),
  "",
  "### Upscale and sharpen",
  "",
  "An `UPSCALE` task re-renders a finished video, named in `src_task_ids` or",
  "`src_video_urls`, at the target `video_config.height`; set",
  "`duration_secs` to the source's length. MiniMax-H3 upscales only its own",
  "768p outputs of 5 s or more. MachGen also rejects a target at or below the",
  "source's height, and a `gaia-2` target above twice it; those depend on the",
  "source, so the schema cannot check them.",
  "",
  ...table(["Model", "Target heights", "Engines", "Priced"], upscaleRows),
  "",
  "A `SHARPEN` task sharpens one owned video and keeps its length: a MachGen",
  "output named in `src_task_ids`, or an upload referenced as",
  "`@input/<artifact_path>` in `src_video_urls`. MachGen refuses a public",
  "URL. It takes `duration_secs`, not `num_frames`. MachGen's quote prices",
  "the source's height and seconds, whatever the request's height or",
  "`duration_secs`, so set `video_config.height` to the source's height.",
  "",
  ...table(["Model", "Heights", "Priced"], sharpenRows),
  "",
  "**Priced** lists the task types `computeEstimate` from `@apicity/cost`",
  "prices per output second. An R2V reference video also bills the seconds",
  "MachGen reads from it, after any start offset, so pass their total as",
  "`costHints.inputDurationSeconds`; an edit's output is that long too. An",
  "upscale bills by its source's length, so it needs the same hint;",
  "MiniMax-H3 bills those seconds in and out. A sharpen needs the hint too",
  "and bills the seconds once. Topaz bills vendor credits that",
  "depend on the source's frames and resolution, so `computeEstimate` does",
  "not price it; `api.v0.upscale.quote` asks MachGen for the exact price, and",
  "`resolveMachGenUpscaleEstimate` turns that quote into an estimate.",
  "Kling-v3, Kling-o3 and the Pixverse models price audio on",
  "and off apart, so set `video_config.audio`. `api.v0.tasks.billing`",
  "returns a finished task's actual charge in micro-USD.",
  "",
  "```typescript",
  'import { createMachGen } from "@apicity/machgen";',
  "",
  "const machgen = createMachGen({ apiKey: process.env.MACHGEN_API_KEY! });",
  "",
  "const task = await machgen.api.v0.generate({",
  '  model: "MiniMax-H3-Turbo",',
  '  task_type: "I2V",',
  '  prompt: "The cat slowly blinks and turns its head toward the window.",',
  "  video_config: { height: 480, duration_secs: 4 },",
  "  src_image_urls: [",
  '    "https://example.com/start.jpg",',
  '    "https://example.com/end.jpg",',
  "  ],",
  "});",
  "",
  "let status = await machgen.api.v0.tasks(task.task_id);",
  'while (status.status === "PENDING" || status.status === "RUNNING") {',
  "  await new Promise((resolve) => setTimeout(resolve, 10_000));",
  "  status = await machgen.api.v0.tasks(task.task_id);",
  "}",
  "const bill = await machgen.api.v0.tasks.billing(task.task_id);",
  "console.log(bill.generation_cost_micros / 1e6); // 0.06",
  "```",
  "",
];
process.stdout.write(lines.join("\n"));
