#!/usr/bin/env node
// Compare per-image USD across kie image generators.
//
//   pnpm run compare:image                  # default: 1,4,10 images
//   pnpm run compare:image -- --counts=1,4  # custom counts
//
// Each lineup row carries the *exact* JSON body the caller would POST to
// kie's /api/v1/jobs/createTask endpoint. Rates come from the bundled
// @apicity/cost PRICING table — no API keys, no network, instant.

import { cost } from "../packages/provider/cost/dist/src/index.js";

const argv = process.argv.slice(2);
const args = Object.fromEntries(
  argv
    .filter((a) => a.startsWith("--"))
    .map((a) => {
      const [k, v = "true"] = a.replace(/^--/, "").split("=");
      return [k, v];
    })
);

const counts = (args.counts ?? "1,4,10")
  .split(",")
  .map((s) => Number(s.trim()))
  .filter((n) => Number.isInteger(n) && n > 0);

const lineup = [
  // nano-banana-2 — 3 tiers by resolution.
  {
    label: "nano-banana-2 1K",
    payload: {
      model: "nano-banana-2",
      input: { prompt: "x", resolution: "1K" },
    },
  },
  {
    label: "nano-banana-2 2K",
    payload: {
      model: "nano-banana-2",
      input: { prompt: "x", resolution: "2K" },
    },
  },
  {
    label: "nano-banana-2 4K",
    payload: {
      model: "nano-banana-2",
      input: { prompt: "x", resolution: "4K" },
    },
  },
  // gpt-image-2 — 3 tiers by resolution, t2i and i2i share the same rates.
  {
    label: "gpt-image-2 t2i 1K",
    payload: {
      model: "gpt-image-2-text-to-image",
      input: { prompt: "x", resolution: "1K" },
    },
  },
  {
    label: "gpt-image-2 t2i 2K",
    payload: {
      model: "gpt-image-2-text-to-image",
      input: { prompt: "x", resolution: "2K" },
    },
  },
  {
    label: "gpt-image-2 t2i 4K",
    payload: {
      model: "gpt-image-2-text-to-image",
      input: { prompt: "x", resolution: "4K" },
    },
  },
  {
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
    label: "wan-2.7 image",
    payload: { model: "wan/2-7-image", input: { prompt: "x" } },
  },
  {
    label: "wan-2.7 image pro",
    payload: { model: "wan/2-7-image-pro", input: { prompt: "x" } },
  },
  // qwen2 / seedream — flat per-image rates, no tiers.
  {
    label: "qwen2 t2i",
    payload: { model: "qwen2/text-to-image", input: { prompt: "x" } },
  },
  {
    label: "qwen2 image-edit",
    payload: {
      model: "qwen2/image-edit",
      input: { prompt: "x", image_url: ["https://example.com/x.jpg"] },
    },
  },
  {
    label: "seedream/5-lite t2i",
    payload: {
      model: "seedream/5-lite-text-to-image",
      input: { prompt: "xxx", quality: "basic" },
    },
  },
  {
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

const c = cost();

// Patches `n` into a kie image payload when the upstream schema accepts it
// (currently wan/2-7-image and wan/2-7-image-pro). Other kie image schemas
// don't expose a batch field — for those we leave the payload alone and the
// rate-table multiplier (units = 1 per call) is multiplied externally.
function withKieN(payload, n) {
  const supportsN =
    payload.model === "wan/2-7-image" || payload.model === "wan/2-7-image-pro";
  if (!supportsN) return payload;
  return { ...payload, input: { ...payload.input, n } };
}

const rows = [];
for (const entry of lineup) {
  const cells = {};
  let source = null;
  const warnings = new Set();
  for (const n of counts) {
    const supportsN =
      entry.payload.model === "wan/2-7-image" ||
      entry.payload.model === "wan/2-7-image-pro";
    let est = c.estimate({
      provider: "kie",
      payload: withKieN(entry.payload, n),
    });
    if (!supportsN) est = { ...est, usd: est.usd * n };
    cells[n] = { usd: est.usd };
    source = est.source;
    for (const w of est.warnings) warnings.add(w);
  }
  rows.push({ label: entry.label, source, cells, warnings: [...warnings] });
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

renderTable({ rows, counts });

function renderTable({ rows, counts }) {
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
  console.log(head);
  console.log(sep);
  for (const r of rows) {
    const cells = counts
      .map((n) => {
        const cell = r.cells[n];
        if (!cell) return "—".padStart(colWidth);
        return ("$" + cell.usd.toFixed(4)).padStart(colWidth);
      })
      .join(" | ");
    console.log(
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
    console.log("\nwarnings:");
    for (const w of allWarnings) console.log("  · " + w);
  }
}
