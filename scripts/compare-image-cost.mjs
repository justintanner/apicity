#!/usr/bin/env node
// Compare per-image USD across kie image generators.
//
//   pnpm run compare:image                  # default: 1,4,10 images
//   pnpm run compare:image -- --counts=1,4  # custom counts
//
// Each lineup row carries the *exact* JSON body the caller would POST to
// kie's /api/v1/jobs/createTask endpoint. Rates come from the bundled
// @apicity/cost PRICING table — no API keys, no network, instant.

import { fileURLToPath } from "node:url";

export const createTaskEndpointAssociation = Object.freeze({
  provider: "kie",
  endpoint: "post.api.v1.jobs.createTask",
});

export const lineup = [
  // nano-banana-2 — 3 tiers by resolution.
  {
    ...createTaskEndpointAssociation,
    label: "nano-banana-2 1K",
    payload: {
      model: "nano-banana-2",
      input: { prompt: "x", resolution: "1K" },
    },
  },
  {
    ...createTaskEndpointAssociation,
    label: "nano-banana-2 2K",
    payload: {
      model: "nano-banana-2",
      input: { prompt: "x", resolution: "2K" },
    },
  },
  {
    ...createTaskEndpointAssociation,
    label: "nano-banana-2 4K",
    payload: {
      model: "nano-banana-2",
      input: { prompt: "x", resolution: "4K" },
    },
  },
  // gpt-image-2 — 3 tiers by resolution, t2i and i2i share the same rates.
  {
    ...createTaskEndpointAssociation,
    label: "gpt-image-2 t2i 1K",
    payload: {
      model: "gpt-image-2-text-to-image",
      input: { prompt: "x", resolution: "1K" },
    },
  },
  {
    ...createTaskEndpointAssociation,
    label: "gpt-image-2 t2i 2K",
    payload: {
      model: "gpt-image-2-text-to-image",
      input: { prompt: "x", resolution: "2K" },
    },
  },
  {
    ...createTaskEndpointAssociation,
    label: "gpt-image-2 t2i 4K",
    payload: {
      model: "gpt-image-2-text-to-image",
      input: { prompt: "x", resolution: "4K" },
    },
  },
  {
    ...createTaskEndpointAssociation,
    label: "gpt-image-2 i2i 1K",
    payload: {
      model: "gpt-image-2-image-to-image",
      input: {
        prompt: "x",
        input_urls: ["https://example.com/x.jpg"],
        resolution: "1K",
      },
    },
  },
  {
    ...createTaskEndpointAssociation,
    label: "gpt-image-2 i2i 2K",
    payload: {
      model: "gpt-image-2-image-to-image",
      input: {
        prompt: "x",
        input_urls: ["https://example.com/x.jpg"],
        resolution: "2K",
      },
    },
  },
  {
    ...createTaskEndpointAssociation,
    label: "gpt-image-2 i2i 4K",
    payload: {
      model: "gpt-image-2-image-to-image",
      input: {
        prompt: "x",
        input_urls: ["https://example.com/x.jpg"],
        resolution: "4K",
      },
    },
  },
  // wan/2.7 image — bills per-image; supports `n` for batch.
  {
    ...createTaskEndpointAssociation,
    label: "wan-2.7 image",
    payload: {
      model: "wan/2-7-image",
      input: { prompt: "x", resolution: "1K" },
    },
  },
  {
    ...createTaskEndpointAssociation,
    label: "wan-2.7 image pro",
    payload: {
      model: "wan/2-7-image-pro",
      input: { prompt: "x", resolution: "1K" },
    },
  },
  // qwen2 / seedream — flat per-image rates, no tiers.
  {
    ...createTaskEndpointAssociation,
    label: "qwen2 t2i",
    payload: { model: "qwen2/text-to-image", input: { prompt: "x" } },
  },
  {
    ...createTaskEndpointAssociation,
    label: "qwen2 image-edit",
    payload: {
      model: "qwen2/image-edit",
      input: { prompt: "x", image_url: "https://example.com/x.jpg" },
    },
  },
  {
    ...createTaskEndpointAssociation,
    label: "seedream/5-lite t2i",
    payload: {
      model: "seedream/5-lite-text-to-image",
      input: { prompt: "xxx", quality: "basic" },
    },
  },
  {
    ...createTaskEndpointAssociation,
    label: "seedream/5-lite i2i",
    payload: {
      model: "seedream/5-lite-image-to-image",
      input: {
        prompt: "xxx",
        image_urls: ["https://example.com/x.jpg"],
        quality: "basic",
      },
    },
  },
];

// Patches `n` into a kie image payload when the upstream schema accepts it
// (currently wan/2-7-image and wan/2-7-image-pro). Other kie image schemas
// don't expose a batch field — for those we leave the payload alone and the
// rate-table multiplier (units = 1 per call) is multiplied externally.
export function withKieN(payload, n) {
  const supportsN =
    payload.model === "wan/2-7-image" || payload.model === "wan/2-7-image-pro";
  if (!supportsN) return payload;
  return { ...payload, input: { ...payload.input, n } };
}

export function schemaValidationCases(entry) {
  return [
    { name: "canonical", payload: entry.payload },
    { name: "representative", payload: withKieN(entry.payload, 4) },
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
  const counts = (args.counts ?? "1,4,10")
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isInteger(value) && value > 0);
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
    for (const count of counts) {
      const supportsN =
        entry.payload.model === "wan/2-7-image" ||
        entry.payload.model === "wan/2-7-image-pro";
      let estimate = cost.estimate({
        provider: "kie",
        payload: withKieN(entry.payload, count),
      });
      if (!supportsN) {
        estimate = { ...estimate, usd: estimate.usd * count };
      }
      cells[count] = { usd: estimate.usd };
      source = estimate.source;
      for (const warning of estimate.warnings) warnings.add(warning);
    }
    rows.push({
      label: entry.label,
      source,
      cells,
      warnings: [...warnings],
    });
  }

  const sortKey = counts[0];
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

  renderTable({ rows, counts, stdout });
  return 0;
}

function renderTable({ rows, counts, stdout }) {
  const labelWidth = Math.max(8, ...rows.map((r) => r.label.length));
  const colWidth = 10;
  const head =
    "| " +
    "model".padEnd(labelWidth) +
    " | " +
    counts.map((n) => `${n}×img`.padStart(colWidth)).join(" | ") +
    " | " +
    "source".padEnd(22) +
    " |";
  const sep =
    "|" +
    "-".repeat(labelWidth + 2) +
    "|" +
    counts.map(() => "-".repeat(colWidth + 2)).join("|") +
    "|" +
    "-".repeat(24) +
    "|";
  writeLine(stdout, head);
  writeLine(stdout, sep);
  for (const r of rows) {
    const cells = counts
      .map((n) => {
        const cell = r.cells[n];
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
      process.stderr.write(`compare-image-cost: ${formatError(error)}\n`);
      process.exitCode = 1;
    }
  );
}
