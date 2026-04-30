#!/usr/bin/env node
// Compare per-image USD across image generators.
//
//   pnpm run compare:image
//   pnpm run compare:image -- --provider=fal
//   pnpm run compare:image -- --counts=1,4,10
//
// All rows hit fal's pricing.estimate endpoint live (FAL_API_KEY required;
// resolved automatically when launched via `op run --env-file=.env.tpl`).
// The bundled rate table in @apicity/cost has no image rows yet, so there is
// no offline path. To add a kie or openai-images row, extend `lineup` below
// and route through `c.usd({ provider, ... })`.

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

const onlyProvider = args.provider; // "fal" | undefined
const counts = (args.counts ?? "1,4,10")
  .split(",")
  .map((s) => Number(s.trim()))
  .filter((n) => Number.isInteger(n) && n > 0);

const lineup = [
  {
    provider: "fal",
    label: "fal · flux schnell",
    endpoint_id: "fal-ai/flux/schnell",
  },
  { provider: "fal", label: "fal · flux dev", endpoint_id: "fal-ai/flux/dev" },
  {
    provider: "fal",
    label: "fal · flux 1.1 pro",
    endpoint_id: "fal-ai/flux-pro/v1.1",
  },
  {
    provider: "fal",
    label: "fal · flux 1.1 pro ultra",
    endpoint_id: "fal-ai/flux-pro/v1.1-ultra",
  },
  {
    provider: "fal",
    label: "fal · flux kontext",
    endpoint_id: "fal-ai/flux-pro/kontext",
  },
  {
    provider: "fal",
    label: "fal · recraft v3",
    endpoint_id: "fal-ai/recraft-v3",
  },
  { provider: "fal", label: "fal · imagen3", endpoint_id: "fal-ai/imagen3" },
  {
    provider: "fal",
    label: "fal · ideogram v3",
    endpoint_id: "fal-ai/ideogram/v3",
  },
  {
    provider: "fal",
    label: "fal · nano-banana",
    endpoint_id: "fal-ai/nano-banana",
  },
  {
    provider: "fal",
    label: "fal · seedream 3",
    endpoint_id: "fal-ai/bytedance/seedream-3",
  },
];

const filtered = onlyProvider
  ? lineup.filter((r) => r.provider === onlyProvider)
  : lineup;

if (filtered.length === 0) {
  console.error(
    `no rows match --provider=${onlyProvider}. Known providers: fal.`
  );
  process.exit(1);
}

const apiKey = process.env.FAL_API_KEY;
if (!apiKey) {
  console.error(
    "FAL_API_KEY missing. Run `op run --env-file=.env.tpl -- pnpm run compare:image`."
  );
  process.exit(1);
}
const c = cost({ fal: { apiKey } });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Try unit_quantity first (matches fal's published unit-price contract for
// most image endpoints); fall back to num_images if the estimate rejects.
// Retries 429 with exponential backoff before giving up on either payload.
async function withBackoff(fn) {
  const delays = [4000, 8000, 16000];
  let lastErr;
  for (let attempt = 0; attempt <= delays.length; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const is429 = String(err.message ?? "").includes("429");
      if (!is429 || attempt === delays.length) throw err;
      await sleep(delays[attempt]);
    }
  }
  throw lastErr;
}

async function estimate(endpoint_id, n) {
  try {
    return await withBackoff(() =>
      c.usd({
        provider: "fal",
        endpoint_id,
        payload: { unit_quantity: n },
      })
    );
  } catch {
    try {
      return await withBackoff(() =>
        c.usd({
          provider: "fal",
          endpoint_id,
          payload: { num_images: n },
        })
      );
    } catch (err2) {
      const msg = err2.message ?? String(err2);
      throw new Error(`unit_quantity + num_images both rejected: ${msg}`);
    }
  }
}

const rows = [];
for (const entry of filtered) {
  const cells = {};
  let source = null;
  const warnings = new Set();
  for (const n of counts) {
    let est;
    try {
      est = await estimate(entry.endpoint_id, n);
    } catch (err) {
      cells[n] = { error: err.message };
      await sleep(2500);
      continue;
    }
    cells[n] = { usd: est.usd };
    source = est.source;
    for (const w of est.warnings) warnings.add(w);
    await sleep(4000);
  }
  rows.push({ label: entry.label, source, cells, warnings: [...warnings] });
}

const sortKey = counts[0];
rows.sort((a, b) => {
  const av = a.cells[sortKey];
  const bv = b.cells[sortKey];
  const aHas = av && !av.error && Number.isFinite(av.usd);
  const bHas = bv && !bv.error && Number.isFinite(bv.usd);
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
        if (cell.error) return "ERR".padStart(colWidth);
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
  const errs = rows.flatMap((r) =>
    Object.entries(r.cells)
      .filter(([, v]) => v.error)
      .map(([k, v]) => `${r.label} @ ${k}×: ${v.error}`)
  );
  if (errs.length) {
    console.log("\nerrors:");
    for (const e of errs) console.log("  · " + e);
  }
  const suspicious = rows.filter((r) => {
    const cell = r.cells[counts[0]];
    return cell && !cell.error && cell.usd > 0 && cell.usd < 0.001;
  });
  if (suspicious.length) {
    console.log(
      "\nnote: rows under $0.001/image likely reflect fal's compute-second " +
        "(GPU-time) pricing rather than per-output-image pricing. The estimate " +
        "endpoint accepted unit_quantity but the model bills by GPU time, so the " +
        "number is the rate × quantity floor — not what you'd pay for N images. " +
        "Cross-check the model's fal page (Pricing tab) for the per-image USD."
    );
  }
}
