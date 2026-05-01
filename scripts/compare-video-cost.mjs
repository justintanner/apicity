#!/usr/bin/env node
// Compare per-duration USD across video generators.
//
//   pnpm run compare:video                   # kie-only (default; instant, no key)
//   pnpm run compare:video -- --provider=all # also include fal upstream rows
//   pnpm run compare:video -- --provider=fal # fal upstream rows only
//   pnpm run compare:video -- --durations=4,6,8
//
// Each lineup row carries the *exact* JSON payload a caller would POST to the
// upstream provider — kie createTask body for kie rows, fal endpoint body for
// fal rows. The duration is patched in per-iteration. This means the same
// payload object is what you'd pass to the real generation API; the cost
// extractor reads the pricing-relevant fields (model, resolution, direction,
// duration) from it.
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

const providerArg = args.provider ?? "kie";
const onlyProvider = providerArg === "all" ? undefined : providerArg;
const durations = (args.durations ?? "5,8,10")
  .split(",")
  .map((s) => Number(s.trim()))
  .filter((n) => Number.isFinite(n) && n > 0);

// `audio` derived from each model's zod schema in @apicity/kie:
//   - "yes" = no audio toggle in the schema → audio is on by default
//   - "opt" = schema exposes an audio toggle (sound / generate_audio /
//     audio_setting) → caller chooses on or off per request
const lineup = [
  {
    provider: "kie",
    label: "kie · veo3 (4K)",
    payload: { model: "veo3", prompt: "x" },
    audio: "yes",
  },
  {
    provider: "kie",
    label: "kie · veo3-fast (720p)",
    payload: { model: "veo3_fast", prompt: "x" },
    audio: "yes",
  },
  // Kling 3.0 video — kie publishes 6 rates split by mode
  // (std=720P / pro=1080P / 4K) × audio (sound on/off). 4K is the same
  // with or without audio. The kie zod schema's `sound` field is the
  // audio toggle; `mode` selects the resolution tier.
  {
    provider: "kie",
    label: "kie · kling 3.0 std (720p) silent",
    payload: {
      model: "kling-3.0/video",
      input: { prompt: "x", sound: false, mode: "std", multi_shots: false },
    },
    audio: "opt",
  },
  {
    provider: "kie",
    label: "kie · kling 3.0 std (720p) audio",
    payload: {
      model: "kling-3.0/video",
      input: { prompt: "x", sound: true, mode: "std", multi_shots: false },
    },
    audio: "opt",
  },
  {
    provider: "kie",
    label: "kie · kling 3.0 pro (1080p) silent",
    payload: {
      model: "kling-3.0/video",
      input: { prompt: "x", sound: false, mode: "pro", multi_shots: false },
    },
    audio: "opt",
  },
  {
    provider: "kie",
    label: "kie · kling 3.0 pro (1080p) audio",
    payload: {
      model: "kling-3.0/video",
      input: { prompt: "x", sound: true, mode: "pro", multi_shots: false },
    },
    audio: "opt",
  },
  {
    provider: "kie",
    label: "kie · kling 3.0 4K",
    payload: {
      model: "kling-3.0/video",
      input: { prompt: "x", sound: false, mode: "4K", multi_shots: false },
    },
    audio: "opt",
  },
  // Kling 3.0 motion-control (video-to-video). Duration is derived from
  // the input video length upstream; kie has no duration field in the
  // schema, so we pass it as a top-level hint for the cost estimate.
  {
    provider: "kie",
    label: "kie · kling 3.0 motion-control 720p",
    payload: {
      model: "kling-3.0/motion-control",
      input: {
        prompt: "x",
        input_urls: ["https://example.com/img.jpg"],
        video_urls: ["https://example.com/v.mp4"],
        mode: "720p",
      },
    },
    audio: "—",
  },
  {
    provider: "kie",
    label: "kie · kling 3.0 motion-control 1080p",
    payload: {
      model: "kling-3.0/motion-control",
      input: {
        prompt: "x",
        input_urls: ["https://example.com/img.jpg"],
        video_urls: ["https://example.com/v.mp4"],
        mode: "1080p",
      },
    },
    audio: "—",
  },
  // Seedance 2 — kie publishes 6 rates (3 resolutions × i2v vs t2v); only
  // i2v is shown here. The t2v rows are still in @apicity/cost's pricing
  // table for callers that need them. Seedance 2 Fast supports only 480p
  // and 720p (no 1080p).
  {
    provider: "kie",
    label: "kie · seedance 2 fast 480p i2v",
    payload: {
      model: "bytedance/seedance-2-fast",
      input: {
        prompt: "x",
        first_frame_url: "https://example.com/img.jpg",
        resolution: "480p",
        web_search: false,
      },
    },
    audio: "opt",
  },
  {
    provider: "kie",
    label: "kie · seedance 2 fast 720p i2v",
    payload: {
      model: "bytedance/seedance-2-fast",
      input: {
        prompt: "x",
        first_frame_url: "https://example.com/img.jpg",
        resolution: "720p",
        web_search: false,
      },
    },
    audio: "opt",
  },
  {
    provider: "kie",
    label: "kie · seedance 2 480p i2v",
    payload: {
      model: "bytedance/seedance-2",
      input: {
        prompt: "x",
        first_frame_url: "https://example.com/img.jpg",
        resolution: "480p",
        web_search: false,
      },
    },
    audio: "opt",
  },
  {
    provider: "kie",
    label: "kie · seedance 2 720p i2v",
    payload: {
      model: "bytedance/seedance-2",
      input: {
        prompt: "x",
        first_frame_url: "https://example.com/img.jpg",
        resolution: "720p",
        web_search: false,
      },
    },
    audio: "opt",
  },
  {
    provider: "kie",
    label: "kie · seedance 2 1080p i2v",
    payload: {
      model: "bytedance/seedance-2",
      input: {
        prompt: "x",
        first_frame_url: "https://example.com/img.jpg",
        resolution: "1080p",
        web_search: false,
      },
    },
    audio: "opt",
  },
  {
    provider: "kie",
    label: "kie · wan 2.7",
    payload: {
      model: "wan/2-7-text-to-video",
      input: { prompt: "x" },
    },
    audio: "yes",
  },
  // grok-imagine: kie charges by resolution only (no i2v/t2v split, no
  // 1080p tier); audio always included.
  {
    provider: "kie",
    label: "kie · grok-imagine 480p",
    payload: {
      model: "grok-imagine/text-to-video",
      input: { prompt: "x", resolution: "480p" },
    },
    audio: "yes",
  },
  {
    provider: "kie",
    label: "kie · grok-imagine 720p",
    payload: {
      model: "grok-imagine/text-to-video",
      input: { prompt: "x", resolution: "720p" },
    },
    audio: "yes",
  },
  // happyhorse: kie charges by resolution only (720p / 1080p; no i2v/t2v
  // split). Audio always on for the generation modes.
  {
    provider: "kie",
    label: "kie · happyhorse 720p",
    payload: {
      model: "happyhorse/text-to-video",
      input: { prompt: "x", resolution: "720p" },
    },
    audio: "yes",
  },
  {
    provider: "kie",
    label: "kie · happyhorse 1080p",
    payload: {
      model: "happyhorse/text-to-video",
      input: { prompt: "x", resolution: "1080p" },
    },
    audio: "yes",
  },
  {
    provider: "fal",
    label: "fal · seedance 2.0 fast i2v",
    endpoint_id: "fal-ai/bytedance/seedance-2.0/fast/image-to-video",
    audio: "opt",
  },
  {
    provider: "fal",
    label: "fal · seedance 2.0 i2v",
    endpoint_id: "fal-ai/bytedance/seedance-2.0/image-to-video",
    audio: "opt",
  },
  {
    provider: "fal",
    label: "fal · kling 3.0 std i2v",
    endpoint_id: "fal-ai/kling-video/v3/standard/image-to-video",
    audio: "opt",
  },
  {
    provider: "fal",
    label: "fal · kling 3.0 4K i2v",
    endpoint_id: "fal-ai/kling-video/o3/4k/image-to-video",
    audio: "opt",
  },
  {
    provider: "fal",
    label: "fal · wan 2.7 i2v",
    endpoint_id: "fal-ai/wan/v2.7/image-to-video",
    audio: "yes",
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
      "Run via `op run --env-file=.env.tpl -- pnpm run compare:video` " +
      "(or pass --provider=kie) for full output."
  );
}

// Patches `duration` into the kie payload at either the top level (veo) or
// nested under `input` (marketplace shape). Returns a fresh object so the
// per-iteration mutation doesn't leak back into the lineup.
function withDuration(payload, sec) {
  if (payload.input) {
    return { ...payload, input: { ...payload.input, duration: sec } };
  }
  return { ...payload, duration: sec };
}

async function falWithBackoff(endpoint_id, sec) {
  const delays = [4000, 8000, 16000];
  let lastErr;
  for (let attempt = 0; attempt <= delays.length; attempt++) {
    try {
      return await c.estimate({
        provider: "fal",
        endpoint_id,
        payload: { unit_quantity: sec },
      });
    } catch (err) {
      lastErr = err;
      const is429 = String(err.message ?? "").includes("429");
      if (!is429 || attempt === delays.length) throw err;
      await sleep(delays[attempt]);
    }
  }
  throw lastErr;
}

const rows = [];
for (const entry of filtered) {
  if (entry.provider === "fal" && skipFal) continue;
  const cells = {};
  let source = null;
  const warnings = new Set();
  for (const sec of durations) {
    let est;
    try {
      if (entry.provider === "kie") {
        est = await c.estimate({
          provider: "kie",
          payload: withDuration(entry.payload, sec),
        });
      } else {
        est = await falWithBackoff(entry.endpoint_id, sec);
        await sleep(4000); // fal rate-limit cushion
      }
    } catch (err) {
      cells[sec] = { error: err.message };
      continue;
    }
    cells[sec] = { usd: est.usd };
    source = est.source;
    for (const w of est.warnings) warnings.add(w);
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
  const aHas = av && !av.error && Number.isFinite(av.usd);
  const bHas = bv && !bv.error && Number.isFinite(bv.usd);
  if (aHas && bHas) return av.usd - bv.usd;
  if (aHas) return -1;
  if (bHas) return 1;
  return 0;
});

renderTable({ rows, durations });

function renderTable({ rows, durations }) {
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
  console.log(head);
  console.log(sep);
  for (const r of rows) {
    const cells = durations
      .map((d) => {
        const cell = r.cells[d];
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
    console.log("\nwarnings:");
    for (const w of allWarnings) console.log("  · " + w);
  }
  const errs = rows.flatMap((r) =>
    Object.entries(r.cells)
      .filter(([, v]) => v.error)
      .map(([k, v]) => `${r.label} @ ${k}s: ${v.error}`)
  );
  if (errs.length) {
    console.log("\nerrors:");
    for (const e of errs) console.log("  · " + e);
  }
  const hasFalSeedance = rows.some(
    (r) => r.label.startsWith("fal · seedance") && r.source === "upstream-usd"
  );
  if (hasFalSeedance) {
    console.log(
      "\nnote: fal seedance rows look ~5× too low because fal prices seedance per GPU-second " +
        '("compute seconds"), not per output-second. unit_quantity = output-seconds is rejected ' +
        "by the unit-price model; the kie rows reflect verified output-second rates."
    );
  }
}
