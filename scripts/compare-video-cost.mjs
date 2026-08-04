#!/usr/bin/env node
// Compare per-duration USD across kie video generators.
//
//   pnpm run compare:video                       # default: 5,8,10 seconds
//   pnpm run compare:video -- --durations=4,6,8  # custom durations
//
// Each lineup row carries the *exact* JSON body the caller would POST to its
// associated kie endpoint. Marketplace rows use /api/v1/jobs/createTask;
// legacy VEO rows use /api/v1/veo/generate. Duration is patched per iteration.
// Rates come from the bundled @apicity/cost PRICING table — no API keys, no
// network, instant.

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
  {
    ...veoGenerateEndpointAssociation,
    label: "veo3 (4K)",
    payload: { model: "veo3", prompt: "x" },
    audio: "yes",
  },
  {
    ...veoGenerateEndpointAssociation,
    label: "veo3-fast (720p)",
    payload: { model: "veo3_fast", prompt: "x" },
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
];

// Patches `duration` into the kie payload at either the top level (veo) or
// nested under `input` (marketplace shape). Returns a fresh object so the
// per-iteration mutation doesn't leak back into the lineup.
export function withDuration(payload, sec) {
  if (payload.input) {
    const duration = payload.model === "kling-3.0/video" ? String(sec) : sec;
    return { ...payload, input: { ...payload.input, duration } };
  }
  return { ...payload, duration: sec };
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
