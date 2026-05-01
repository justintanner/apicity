#!/usr/bin/env node
// Compare per-image USD across image generators.
//
//   pnpm run compare:image                   # fal + kie (kie offline; fal needs key)
//   pnpm run compare:image -- --provider=kie # kie-only (instant, no key)
//   pnpm run compare:image -- --provider=fal # fal-only (live API)
//   pnpm run compare:image -- --counts=1,4,10
//
// kie rows come from the bundled rate table in @apicity/cost (PRICING_AS_OF
// in packages/provider/cost/src/pricing.ts) — instant, no API key required.
// fal rows hit fal's pricing.estimate endpoint live (FAL_API_KEY required;
// resolved automatically when launched via `op run --env-file=.env.tpl`).
// fal rows are skipped with a warning if the key is absent.

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

// kie rows carry the *exact* JSON body the caller would POST to kie's
// /api/v1/jobs/createTask endpoint. The cost extractor reads model +
// input.resolution (where applicable) and looks up the per-image rate.
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
  // kie image lineup — verified rates 2026-04-30 from kie.ai/market.
  {
    provider: "kie",
    label: "kie · nano-banana-2 1K",
    payload: {
      model: "nano-banana-2",
      input: { prompt: "x", resolution: "1K" },
    },
  },
  {
    provider: "kie",
    label: "kie · nano-banana-2 2K",
    payload: {
      model: "nano-banana-2",
      input: { prompt: "x", resolution: "2K" },
    },
  },
  {
    provider: "kie",
    label: "kie · nano-banana-2 4K",
    payload: {
      model: "nano-banana-2",
      input: { prompt: "x", resolution: "4K" },
    },
  },
  {
    provider: "kie",
    label: "kie · gpt-image-2 t2i 1K",
    payload: {
      model: "gpt-image-2-text-to-image",
      input: { prompt: "x", resolution: "1K" },
    },
  },
  {
    provider: "kie",
    label: "kie · gpt-image-2 t2i 2K",
    payload: {
      model: "gpt-image-2-text-to-image",
      input: { prompt: "x", resolution: "2K" },
    },
  },
  {
    provider: "kie",
    label: "kie · gpt-image-2 t2i 4K",
    payload: {
      model: "gpt-image-2-text-to-image",
      input: { prompt: "x", resolution: "4K" },
    },
  },
  {
    provider: "kie",
    label: "kie · gpt-image-2 i2i 1K",
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
    provider: "kie",
    label: "kie · gpt-image-2 i2i 2K",
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
    provider: "kie",
    label: "kie · gpt-image-2 i2i 4K",
    payload: {
      model: "gpt-image-2-image-to-image",
      input: {
        prompt: "x",
        input_urls: ["https://example.com/x.jpg"],
        resolution: "4K",
      },
    },
  },
  {
    provider: "kie",
    label: "kie · wan-2.7 image",
    payload: { model: "wan/2-7-image", input: { prompt: "x" } },
  },
  {
    provider: "kie",
    label: "kie · wan-2.7 image pro",
    payload: { model: "wan/2-7-image-pro", input: { prompt: "x" } },
  },
  {
    provider: "kie",
    label: "kie · qwen2 t2i",
    payload: { model: "qwen2/text-to-image", input: { prompt: "x" } },
  },
  {
    provider: "kie",
    label: "kie · qwen2 image-edit",
    payload: {
      model: "qwen2/image-edit",
      input: { prompt: "x", image_url: ["https://example.com/x.jpg"] },
    },
  },
  {
    provider: "kie",
    label: "kie · seedream/5-lite t2i",
    payload: {
      model: "seedream/5-lite-text-to-image",
      input: { prompt: "xxx", quality: "basic" },
    },
  },
  {
    provider: "kie",
    label: "kie · seedream/5-lite i2i",
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

const filtered = onlyProvider
  ? lineup.filter((r) => r.provider === onlyProvider)
  : lineup;

if (filtered.length === 0) {
  console.error(
    `no rows match --provider=${onlyProvider}. Known providers: kie, fal.`
  );
  process.exit(1);
}

const apiKey = process.env.FAL_API_KEY;
const c = cost({ fal: apiKey ? { apiKey } : undefined });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const skipFal = !apiKey;
if (skipFal && filtered.some((r) => r.provider === "fal")) {
  console.error(
    "warning: FAL_API_KEY missing — skipping fal rows. " +
      "Run via `op run --env-file=.env.tpl -- pnpm run compare:image` " +
      "(or pass --provider=kie) for full output."
  );
}

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
      c.estimate({
        provider: "fal",
        endpoint_id,
        payload: { unit_quantity: n },
      })
    );
  } catch {
    try {
      return await withBackoff(() =>
        c.estimate({
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
  if (entry.provider === "fal" && skipFal) continue;
  const cells = {};
  let source = null;
  const warnings = new Set();
  for (const n of counts) {
    let est;
    try {
      if (entry.provider === "kie") {
        const supportsN =
          entry.payload.model === "wan/2-7-image" ||
          entry.payload.model === "wan/2-7-image-pro";
        est = await c.estimate({
          provider: "kie",
          payload: withKieN(entry.payload, n),
        });
        // kie schemas without an `n` field bill per call; multiply by n so
        // the displayed cell reflects N images at the per-image rate.
        if (!supportsN) est = { ...est, usd: est.usd * n };
      } else {
        est = await estimate(entry.endpoint_id, n);
        await sleep(4000);
      }
    } catch (err) {
      cells[n] = { error: err.message };
      if (entry.provider === "fal") await sleep(2500);
      continue;
    }
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
