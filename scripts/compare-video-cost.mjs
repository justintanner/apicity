#!/usr/bin/env node
// Compare per-duration USD across kie video generators.
//
//   pnpm run compare:video                       # default: 5,8,10 seconds
//   pnpm run compare:video -- --durations=4,6,8  # custom durations
//
// Each lineup row carries the *exact* JSON body the caller would POST to its
// associated kie endpoint. Marketplace rows use /api/v1/jobs/createTask;
// VEO rows use /api/v1/veo/generate. Duration is patched per iteration, which
// moves the per-second rows only — veo bills per video, so its columns are
// flat by design. Rates come from the bundled @apicity/cost PRICING table —
// no API keys, no network, instant.

import { fileURLToPath } from "node:url";

export const createTaskEndpointAssociation = Object.freeze({
  provider: "kie",
  endpoint: "post.api.v1.jobs.createTask",
});

export const veoGenerateEndpointAssociation = Object.freeze({
  provider: "kie",
  endpoint: "veo.post.api.v1.veo.generate",
});

// `audio` derived from each model's zod schema in @apicity/kie:
//   - "yes" = no audio toggle in the schema → audio is on by default
//   - "opt" = schema exposes an audio toggle (sound / generate_audio /
//     audio_setting) → caller chooses on or off per request
export const lineup = [
  // Veo 3.1 bills per VIDEO, not per second: every duration column below
  // prints the same number for a given (tier × resolution) cell. The matrix is
  // fully selector-addressable because the veo generate schema carries
  // top-level `resolution`, so each page cell gets its own row.
  {
    ...veoGenerateEndpointAssociation,
    label: "veo3 quality 720p",
    payload: { model: "veo3", prompt: "x", resolution: "720p" },
    audio: "yes",
  },
  {
    ...veoGenerateEndpointAssociation,
    label: "veo3 quality 1080p",
    payload: { model: "veo3", prompt: "x", resolution: "1080p" },
    audio: "yes",
  },
  {
    ...veoGenerateEndpointAssociation,
    label: "veo3 quality 4k",
    payload: { model: "veo3", prompt: "x", resolution: "4k" },
    audio: "yes",
  },
  {
    ...veoGenerateEndpointAssociation,
    label: "veo3-fast 720p",
    payload: { model: "veo3_fast", prompt: "x", resolution: "720p" },
    audio: "yes",
  },
  {
    ...veoGenerateEndpointAssociation,
    label: "veo3-fast 1080p",
    payload: { model: "veo3_fast", prompt: "x", resolution: "1080p" },
    audio: "yes",
  },
  {
    ...veoGenerateEndpointAssociation,
    label: "veo3-fast 4k",
    payload: { model: "veo3_fast", prompt: "x", resolution: "4k" },
    audio: "yes",
  },
  {
    ...veoGenerateEndpointAssociation,
    label: "veo3-lite 720p",
    payload: { model: "veo3_lite", prompt: "x", resolution: "720p" },
    audio: "yes",
  },
  {
    ...veoGenerateEndpointAssociation,
    label: "veo3-lite 1080p",
    payload: { model: "veo3_lite", prompt: "x", resolution: "1080p" },
    audio: "yes",
  },
  {
    ...veoGenerateEndpointAssociation,
    label: "veo3-lite 4k",
    payload: { model: "veo3_lite", prompt: "x", resolution: "4k" },
    audio: "yes",
  },
  // Kling 3.0 video — kie publishes 6 rates split by mode
  // (std=720P / pro=1080P / 4K) × audio (sound on/off). 4K is the same
  // with or without audio. The kie zod schema's `sound` field is the
  // audio toggle; `mode` selects the resolution tier.
  {
    ...createTaskEndpointAssociation,
    label: "kling 3.0 std (720p) silent",
    payload: {
      model: "kling-3.0/video",
      input: {
        prompt: "x",
        sound: false,
        mode: "std",
        multi_shots: false,
        duration: "8",
      },
    },
    audio: "opt",
  },
  {
    ...createTaskEndpointAssociation,
    label: "kling 3.0 std (720p) audio",
    payload: {
      model: "kling-3.0/video",
      input: {
        prompt: "x",
        sound: true,
        mode: "std",
        multi_shots: false,
        duration: "8",
      },
    },
    audio: "opt",
  },
  {
    ...createTaskEndpointAssociation,
    label: "kling 3.0 pro (1080p) silent",
    payload: {
      model: "kling-3.0/video",
      input: {
        prompt: "x",
        sound: false,
        mode: "pro",
        multi_shots: false,
        duration: "8",
      },
    },
    audio: "opt",
  },
  {
    ...createTaskEndpointAssociation,
    label: "kling 3.0 pro (1080p) audio",
    payload: {
      model: "kling-3.0/video",
      input: {
        prompt: "x",
        sound: true,
        mode: "pro",
        multi_shots: false,
        duration: "8",
      },
    },
    audio: "opt",
  },
  {
    ...createTaskEndpointAssociation,
    label: "kling 3.0 4K",
    payload: {
      model: "kling-3.0/video",
      input: {
        prompt: "x",
        sound: false,
        mode: "4K",
        multi_shots: false,
        duration: "8",
      },
    },
    audio: "opt",
  },
  // wan 2.7 — flat per-second rate across t2v / i2v variants.
  {
    ...createTaskEndpointAssociation,
    label: "wan 2.7 t2v",
    payload: { model: "wan/2-7-text-to-video", input: { prompt: "x" } },
    audio: "yes",
  },
  {
    ...createTaskEndpointAssociation,
    label: "wan 2.7 i2v",
    payload: {
      model: "wan/2-7-image-to-video",
      input: { prompt: "x", first_frame_url: "https://example.com/x.jpg" },
    },
    audio: "yes",
  },
  // grok-imagine: 2 tiers by resolution, audio always on.
  {
    ...createTaskEndpointAssociation,
    label: "grok-imagine 480p",
    payload: {
      model: "grok-imagine/text-to-video",
      input: { prompt: "x", resolution: "480p" },
    },
    audio: "yes",
  },
  {
    ...createTaskEndpointAssociation,
    label: "grok-imagine 720p",
    payload: {
      model: "grok-imagine/text-to-video",
      input: { prompt: "x", resolution: "720p" },
    },
    audio: "yes",
  },
  // happyhorse: kie charges by resolution only (720p / 1080p; no i2v/t2v
  // split). Audio always on for the generation modes.
  {
    ...createTaskEndpointAssociation,
    label: "happyhorse 720p",
    payload: {
      model: "happyhorse/text-to-video",
      input: { prompt: "x", resolution: "720p" },
    },
    audio: "yes",
  },
  {
    ...createTaskEndpointAssociation,
    label: "happyhorse 1080p",
    payload: {
      model: "happyhorse/text-to-video",
      input: { prompt: "x", resolution: "1080p" },
    },
    audio: "yes",
  },
  // seedance-2 i2v variants (the rate-bearing direction).
  {
    ...createTaskEndpointAssociation,
    label: "seedance-2 480p i2v",
    payload: {
      model: "bytedance/seedance-2",
      input: {
        prompt: "xxx",
        first_frame_url: "https://example.com/x.jpg",
        resolution: "480p",
      },
    },
    audio: "—",
  },
  {
    ...createTaskEndpointAssociation,
    label: "seedance-2 720p i2v",
    payload: {
      model: "bytedance/seedance-2",
      input: {
        prompt: "xxx",
        first_frame_url: "https://example.com/x.jpg",
        resolution: "720p",
      },
    },
    audio: "—",
  },
  {
    ...createTaskEndpointAssociation,
    label: "seedance-2 1080p i2v",
    payload: {
      model: "bytedance/seedance-2",
      input: {
        prompt: "xxx",
        first_frame_url: "https://example.com/x.jpg",
        resolution: "1080p",
      },
    },
    audio: "—",
  },
  {
    ...createTaskEndpointAssociation,
    label: "seedance-2-fast 480p i2v",
    payload: {
      model: "bytedance/seedance-2-fast",
      input: {
        prompt: "xxx",
        first_frame_url: "https://example.com/x.jpg",
        resolution: "480p",
      },
    },
    audio: "—",
  },
  {
    ...createTaskEndpointAssociation,
    label: "seedance-2-fast 720p i2v",
    payload: {
      model: "bytedance/seedance-2-fast",
      input: {
        prompt: "xxx",
        first_frame_url: "https://example.com/x.jpg",
        resolution: "720p",
      },
    },
    audio: "—",
  },
  // Kling 2.6 — bills per VIDEO across a 4-cell sound × duration matrix, and
  // its `duration` is the "5"|"10" string enum, so each cell is its own row
  // and the duration columns are flat (see FIXED_DURATION_MODELS).
  {
    ...createTaskEndpointAssociation,
    label: "kling 2.6 t2v 5s silent",
    payload: {
      model: "kling-2.6/text-to-video",
      input: {
        prompt: "x",
        sound: false,
        aspect_ratio: "16:9",
        duration: "5",
      },
    },
    audio: "opt",
  },
  {
    ...createTaskEndpointAssociation,
    label: "kling 2.6 t2v 5s audio",
    payload: {
      model: "kling-2.6/text-to-video",
      input: {
        prompt: "x",
        sound: true,
        aspect_ratio: "16:9",
        duration: "5",
      },
    },
    audio: "opt",
  },
  {
    ...createTaskEndpointAssociation,
    label: "kling 2.6 t2v 10s silent",
    payload: {
      model: "kling-2.6/text-to-video",
      input: {
        prompt: "x",
        sound: false,
        aspect_ratio: "16:9",
        duration: "10",
      },
    },
    audio: "opt",
  },
  {
    ...createTaskEndpointAssociation,
    label: "kling 2.6 t2v 10s audio",
    payload: {
      model: "kling-2.6/text-to-video",
      input: {
        prompt: "x",
        sound: true,
        aspect_ratio: "16:9",
        duration: "10",
      },
    },
    audio: "opt",
  },
  // Kling 2.6 motion-control — per second by mode, no duration field, so the
  // length rides the cost hint and the columns do scale.
  {
    ...createTaskEndpointAssociation,
    label: "kling 2.6 motion-control 720p",
    payload: {
      model: "kling-2.6/motion-control",
      input: {
        input_urls: ["https://example.com/x.jpg"],
        video_urls: ["https://example.com/x.mp4"],
        character_orientation: "image",
        mode: "720p",
      },
    },
    audio: "—",
  },
  {
    ...createTaskEndpointAssociation,
    label: "kling 2.6 motion-control 1080p",
    payload: {
      model: "kling-2.6/motion-control",
      input: {
        input_urls: ["https://example.com/x.jpg"],
        video_urls: ["https://example.com/x.mp4"],
        character_orientation: "video",
        mode: "1080p",
      },
    },
    audio: "—",
  },
  // Kling AI Avatar — flat per second per tier; length follows the driving
  // audio, so these also price off the hint.
  {
    ...createTaskEndpointAssociation,
    label: "kling ai-avatar standard",
    payload: {
      model: "kling/ai-avatar-standard",
      input: {
        image_url: "https://example.com/x.jpg",
        audio_url: "https://example.com/x.mp3",
        prompt: "x",
      },
    },
    audio: "yes",
  },
  {
    ...createTaskEndpointAssociation,
    label: "kling ai-avatar pro",
    payload: {
      model: "kling/ai-avatar-pro",
      input: {
        image_url: "https://example.com/x.jpg",
        audio_url: "https://example.com/x.mp3",
        prompt: "x",
      },
    },
    audio: "yes",
  },
  // Kling 2.5 Turbo Pro and the three 2.1 tiers — per video, 5s rows.
  {
    ...createTaskEndpointAssociation,
    label: "kling 2.5 turbo pro 5s",
    payload: {
      model: "kling/v2-5-turbo-text-to-video-pro",
      input: { prompt: "x", duration: "5" },
    },
    audio: "—",
  },
  {
    ...createTaskEndpointAssociation,
    label: "kling 2.1 standard 5s",
    payload: {
      model: "kling/v2-1-standard",
      input: {
        prompt: "x",
        image_url: "https://example.com/x.jpg",
        duration: "5",
      },
    },
    audio: "—",
  },
  {
    ...createTaskEndpointAssociation,
    label: "kling 2.1 pro 5s",
    payload: {
      model: "kling/v2-1-pro",
      input: {
        prompt: "x",
        image_url: "https://example.com/x.jpg",
        duration: "5",
      },
    },
    audio: "—",
  },
  {
    ...createTaskEndpointAssociation,
    label: "kling 2.1 master 5s",
    payload: {
      model: "kling/v2-1-master-text-to-video",
      input: { prompt: "x", duration: "5" },
    },
    audio: "—",
  },
  // Seedance 1.5 Pro — per second, resolution × generate_audio.
  {
    ...createTaskEndpointAssociation,
    label: "seedance-1.5-pro 480p silent",
    payload: {
      model: "bytedance/seedance-1.5-pro",
      input: {
        prompt: "xxx",
        aspect_ratio: "16:9",
        duration: 5,
        resolution: "480p",
        generate_audio: false,
      },
    },
    audio: "opt",
  },
  {
    ...createTaskEndpointAssociation,
    label: "seedance-1.5-pro 480p audio",
    payload: {
      model: "bytedance/seedance-1.5-pro",
      input: {
        prompt: "xxx",
        aspect_ratio: "16:9",
        duration: 5,
        resolution: "480p",
        generate_audio: true,
      },
    },
    audio: "opt",
  },
  {
    ...createTaskEndpointAssociation,
    label: "seedance-1.5-pro 720p silent",
    payload: {
      model: "bytedance/seedance-1.5-pro",
      input: {
        prompt: "xxx",
        aspect_ratio: "16:9",
        duration: 5,
        resolution: "720p",
        generate_audio: false,
      },
    },
    audio: "opt",
  },
  {
    ...createTaskEndpointAssociation,
    label: "seedance-1.5-pro 720p audio",
    payload: {
      model: "bytedance/seedance-1.5-pro",
      input: {
        prompt: "xxx",
        aspect_ratio: "16:9",
        duration: 5,
        resolution: "720p",
        generate_audio: true,
      },
    },
    audio: "opt",
  },
  {
    ...createTaskEndpointAssociation,
    label: "seedance-1.5-pro 1080p silent",
    payload: {
      model: "bytedance/seedance-1.5-pro",
      input: {
        prompt: "xxx",
        aspect_ratio: "16:9",
        duration: 5,
        resolution: "1080p",
        generate_audio: false,
      },
    },
    audio: "opt",
  },
  {
    ...createTaskEndpointAssociation,
    label: "seedance-1.5-pro 1080p audio",
    payload: {
      model: "bytedance/seedance-1.5-pro",
      input: {
        prompt: "xxx",
        aspect_ratio: "16:9",
        duration: 5,
        resolution: "1080p",
        generate_audio: true,
      },
    },
    audio: "opt",
  },
  // Topaz video upscale + InfiniTalk — per second, no duration field.
  {
    ...createTaskEndpointAssociation,
    label: "topaz video-upscale 2x",
    payload: {
      model: "topaz/video-upscale",
      input: {
        video_url: "https://example.com/x.mp4",
        upscale_factor: "2",
      },
    },
    audio: "—",
  },
  {
    ...createTaskEndpointAssociation,
    label: "topaz video-upscale 4x",
    payload: {
      model: "topaz/video-upscale",
      input: {
        video_url: "https://example.com/x.mp4",
        upscale_factor: "4",
      },
    },
    audio: "—",
  },
  {
    ...createTaskEndpointAssociation,
    label: "infinitalk 480p",
    payload: {
      model: "infinitalk/from-audio",
      input: {
        image_url: "https://example.com/x.jpg",
        audio_url: "https://example.com/x.mp3",
        prompt: "x",
        resolution: "480p",
      },
    },
    audio: "yes",
  },
  {
    ...createTaskEndpointAssociation,
    label: "infinitalk 720p",
    payload: {
      model: "infinitalk/from-audio",
      input: {
        image_url: "https://example.com/x.jpg",
        audio_url: "https://example.com/x.mp3",
        prompt: "x",
        resolution: "720p",
      },
    },
    audio: "yes",
  },
];

// Models whose zod schema has NO duration field: the output length follows a
// driving audio or video input, so the estimate reads it from
// costHints.durationSeconds instead. Writing `duration` into their `input`
// would invent a field the shipped schema does not declare, so these rows
// leave the payload alone and pass the hint (see durationHints below).
const HINT_DURATION_MODELS = new Set([
  "kling-2.6/motion-control",
  "kling/ai-avatar-standard",
  "kling/ai-avatar-pro",
  "topaz/video-upscale",
  "infinitalk/from-audio",
]);

// Models that bill PER VIDEO off a fixed duration enum ("5" | "10"): an 8s
// request is not one upstream accepts, so patching the column's duration in
// would produce a payload the schema rejects. Each row keeps the tier its own
// payload names, which makes its columns flat by design — the same way the veo
// rows above are flat.
const FIXED_DURATION_MODELS = new Set([
  "kling-2.6/text-to-video",
  "kling-2.6/image-to-video",
  "kling/v2-5-turbo-text-to-video-pro",
  "kling/v2-5-turbo-image-to-video-pro",
  "kling/v2-1-standard",
  "kling/v2-1-pro",
  "kling/v2-1-master-text-to-video",
  "kling/v2-1-master-image-to-video",
]);

// Patches `duration` into the kie payload at either the top level (veo) or
// nested under `input` (marketplace shape). Returns a fresh object so the
// per-iteration mutation doesn't leak back into the lineup. Models in the two
// sets above accept no patched duration at all and are returned unchanged.
export function withDuration(payload, sec) {
  if (payload.input) {
    if (
      HINT_DURATION_MODELS.has(payload.model) ||
      FIXED_DURATION_MODELS.has(payload.model)
    ) {
      return payload;
    }
    const duration = payload.model === "kling-3.0/video" ? String(sec) : sec;
    return { ...payload, input: { ...payload.input, duration } };
  }
  return { ...payload, duration: sec };
}

// Cost-only side channel for the no-duration-field models: their per-second
// rate needs a length, and the hint is the declared way to supply one. Returns
// undefined for every other row, which `estimate` treats as absent.
export function durationHints(payload, sec) {
  return HINT_DURATION_MODELS.has(payload.model)
    ? { durationSeconds: sec }
    : undefined;
}

export function schemaValidationCases(entry) {
  return [
    { name: "canonical", payload: entry.payload },
    { name: "representative", payload: withDuration(entry.payload, 8) },
  ];
}

export async function main(argv = process.argv.slice(2), dependencies = {}) {
  const args = Object.fromEntries(
    argv
      .filter((argument) => argument.startsWith("--"))
      .map((argument) => {
        const [key, value = "true"] = argument.replace(/^--/, "").split("=");
        return [key, value];
      })
  );
  const durations = (args.durations ?? "5,8,10")
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value) && value > 0);
  const createCost =
    dependencies.createCost ??
    (await import("../packages/provider/cost/dist/src/index.js")).createCost;
  const stdout = dependencies.stdout ?? process.stdout;
  const cost = createCost();
  const rows = [];

  for (const entry of lineup) {
    const cells = {};
    let source = null;
    const warnings = new Set();
    for (const duration of durations) {
      const estimate = cost.estimate({
        provider: "kie",
        payload: withDuration(entry.payload, duration),
        costHints: durationHints(entry.payload, duration),
      });
      cells[duration] = { usd: estimate.usd };
      source = estimate.source;
      for (const warning of estimate.warnings) warnings.add(warning);
    }
    rows.push({
      label: entry.label,
      audio: entry.audio ?? "—",
      source,
      cells,
      warnings: [...warnings],
    });
  }

  const sortKey = durations[0];
  rows.sort((a, b) => {
    const av = a.cells[sortKey];
    const bv = b.cells[sortKey];
    const aHas = av && Number.isFinite(av.usd);
    const bHas = bv && Number.isFinite(bv.usd);
    if (aHas && bHas) return av.usd - bv.usd;
    if (aHas) return -1;
    if (bHas) return 1;
    return 0;
  });

  renderTable({ rows, durations, stdout });
  return 0;
}

function renderTable({ rows, durations, stdout }) {
  const labelWidth = Math.max(8, ...rows.map((r) => r.label.length));
  const colWidth = 10;
  const audioWidth = 5;
  const head =
    "| " +
    "model".padEnd(labelWidth) +
    " | " +
    durations.map((d) => `${d}s`.padStart(colWidth)).join(" | ") +
    " | " +
    "audio".padEnd(audioWidth) +
    " | " +
    "source".padEnd(22) +
    " |";
  const sep =
    "|" +
    "-".repeat(labelWidth + 2) +
    "|" +
    durations.map(() => "-".repeat(colWidth + 2)).join("|") +
    "|" +
    "-".repeat(audioWidth + 2) +
    "|" +
    "-".repeat(24) +
    "|";
  writeLine(stdout, head);
  writeLine(stdout, sep);
  for (const r of rows) {
    const cells = durations
      .map((d) => {
        const cell = r.cells[d];
        if (!cell) return "—".padStart(colWidth);
        return ("$" + cell.usd.toFixed(4)).padStart(colWidth);
      })
      .join(" | ");
    writeLine(
      stdout,
      "| " +
        r.label.padEnd(labelWidth) +
        " | " +
        cells +
        " | " +
        (r.audio ?? "—").padEnd(audioWidth) +
        " | " +
        (r.source ?? "—").padEnd(22) +
        " |"
    );
  }
  const allWarnings = rows.flatMap((r) =>
    r.warnings.map((w) => `${r.label}: ${w}`)
  );
  if (allWarnings.length) {
    writeLine(stdout, "\nwarnings:");
    for (const warning of allWarnings) {
      writeLine(stdout, "  · " + warning);
    }
  }
}

function writeLine(stream, value) {
  stream.write(`${value}\n`);
}

function formatError(error) {
  return error instanceof Error ? error.message : String(error);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().then(
    (status) => {
      process.exitCode = status;
    },
    (error) => {
      process.stderr.write(`compare-video-cost: ${formatError(error)}\n`);
      process.exitCode = 1;
    }
  );
}
