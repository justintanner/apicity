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

/** Whether `@apicity/cost` prices a grid-valid request of this task. */
function priced(model: string, task: "T2V" | "I2V" | "R2V"): boolean {
  const grid =
    MACHGEN_VIDEO_GRIDS[model]?.[task === "R2V" ? "T2V" : task] ??
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
    const pricedTasks = (["T2V", "I2V", "R2V"] as const).filter(
      (task) => has(task) && priced(model, task)
    );
    return [
      `\`${model}\``,
      has("T2V") ? yes : "",
      has("I2V") ? yes : "",
      has("R2V") ? yes : "",
      frames,
      i2v ? i2v.heights.join(", ") : "",
      i2v ? runs(i2v.durations) : "",
      pricedTasks.join(", "),
    ];
  }
);

const header = [
  "Model",
  "T2V",
  "I2V",
  "R2V",
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
  "holds each T2V grid too) and the I2V frame rules; other ids pass",
  "unchecked. MachGen answers an off-grid request with HTTP 400 before it",
  "accepts the task, and does not bill it. The grids were read from those",
  "400 responses on 2026-10-25. `-1` asks the model for a Smart length.",
  "",
  `| ${header.join(" | ")} |`,
  `| ${header.map(() => "---").join(" | ")} |`,
  ...rows.map((row) => `| ${row.join(" | ")} |`),
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
  "**Priced** lists the task types `computeEstimate` from `@apicity/cost`",
  "prices per output second. Kling-v3 and the Pixverse models price audio on",
  "and off apart, so set `video_config.audio`. `api.v0.tasks.billing` returns",
  "a finished task's actual charge in micro-USD.",
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
  "console.log(bill.generation_cost_micros / 1e6); // 0.04",
  "```",
  "",
];
process.stdout.write(lines.join("\n"));
