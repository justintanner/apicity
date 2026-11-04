import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { PRICING } from "@apicity/cost";
import {
  harCostCalls,
  type HarCostCall,
} from "../../packages/cli/src/har-cost";

// A rate edit that contradicts a recorded bill fails here. Every committed call
// where a provider stated a charge and the tables price the request must agree
// within har cost's tolerance, or be listed below with a reason from
// docs/cost-learning-pass-1.md. A listed call that now agrees fails too.
//
// The walk reads only recordings holding a stated-charge field: 190 of 1,057 at
// this writing, which find the same calls as a walk over them all. That walk
// takes 12 s of CPU, which would grow the cross-cutting block by more than the
// 5 s its bead allows. "the field list" below pins the fields to the extractors,
// so a new stated charge cannot go unread here.
const RECORDINGS = "tests/recordings";
const STATED_CHARGE_FIELDS = [
  "cost_in_usd_ticks",
  "credits_consumed",
  "creditsConsumed",
  "net_cost_micros",
  "generation_cost_micros",
  "fiat-cost-before-overages",
  // Only a whole-word `cost`, in a usage object: Fireworks and others state it.
  String.raw`\"cost\"`,
];

interface Allowed {
  recording: string;
  model: string;
  reason: string;
}

const MINIMAX_PROMOTION =
  "Promotion: 0.01/s when recorded. The pricebook today is 0.015/s to 2027-01-01, the table's";
const SEEDANCE_CAPTURE =
  "Old capture (10-22). The pricebook today is 0.1028/s, the table's rate";

// Each reason quotes the model's row in the verdict table of
// docs/cost-learning-pass-1.md, and "quotes each listed call's reason" below
// holds it to that row.
const ALLOWED: readonly Allowed[] = [
  {
    recording: "kie_2079838932/bytedance-seedance-2-mini-i2v_84052838",
    model: "bytedance/seedance-2-mini",
    reason:
      "Old capture (06-24). Feed today is 3.8 credits/s, the table's rate",
  },
  {
    recording: "kie_2079838932/grok-imagine-video-1-5-preview_2288294560",
    model: "grok-imagine-video-1-5-preview",
    reason: "Old capture (06-05). The three October recordings match exactly",
  },
  {
    recording: "kie_2079838932/happyhorse-1-1-text-to-video_1147442478",
    model: "happyhorse-1-1/text-to-video",
    reason:
      "Old capture (06-24). The page today is 22.5 credits/s, the table's rate",
  },
  {
    recording: "machgen_3663587242/minimax-h3-turbo-i2v-end-frame_3059935473",
    model: "MiniMax-H3-Turbo",
    reason: MINIMAX_PROMOTION,
  },
  {
    recording:
      "machgen_3663587242/minimax-h3-turbo-i2v-lone-end-frame_566416708",
    model: "MiniMax-H3-Turbo",
    reason: MINIMAX_PROMOTION,
  },
  {
    recording: "machgen_3663587242/minimax-h3-turbo-i2v_2997309401",
    model: "MiniMax-H3-Turbo",
    reason: MINIMAX_PROMOTION,
  },
  {
    recording: "machgen_3663587242/minimax-h3-turbo-r2v_2672030892",
    model: "MiniMax-H3-Turbo",
    reason: MINIMAX_PROMOTION,
  },
  {
    recording: "machgen_3663587242/seedance-2-5-i2v_2930448892",
    model: "Seedance-2.5",
    reason: SEEDANCE_CAPTURE,
  },
  {
    recording: "machgen_3663587242/seedance-2-5-r2v_1581689097",
    model: "Seedance-2.5",
    reason: SEEDANCE_CAPTURE,
  },
  {
    recording: "machgen_3663587242/seedance-2-5-t2v_3519105807",
    model: "Seedance-2.5",
    reason: SEEDANCE_CAPTURE,
  },
  {
    recording: "xai_3613880225/vision-analysis-json_243984103",
    model: "grok-4",
    reason:
      "Tokens x rates equal the stated bill exactly. The estimate cannot see a vision input",
  },
];

function recordingOf(file: string): string {
  return relative(RECORDINGS, file).replace(/\/recording\.har$/, "");
}

function statedChargeFiles(root = RECORDINGS): string[] {
  const files: string[] = [];
  for (const name of readdirSync(root)) {
    const path = join(root, name);
    if (statSync(path).isDirectory()) {
      files.push(...statedChargeFiles(path));
    } else if (name.endsWith(".har")) {
      const text = readFileSync(path, "utf8");
      if (STATED_CHARGE_FIELDS.some((field) => text.includes(field))) {
        files.push(path);
      }
    }
  }
  return files;
}

const describeCall = (call: HarCostCall) =>
  `${recordingOf(call.file)} ${call.model}: estimate ${call.estimateUsd} USD, stated ${call.statedUsd} USD, ratio ${call.ratio?.toPrecision(4)}`;

/** What a set of calls says against a list: the two ways the guard fails. */
function review(calls: readonly HarCostCall[], allowed: readonly Allowed[]) {
  const key = (recording: string, model: string | null) =>
    `${recording} ${model}`;
  const listed = new Set(allowed.map((a) => key(a.recording, a.model)));
  const beyond = calls.filter(
    (call) =>
      call.statedUsd !== null &&
      (call.verdict === "over" || call.verdict === "under")
  );
  const off = new Set(beyond.map((c) => key(recordingOf(c.file), c.model)));
  return {
    unlisted: beyond
      .filter((c) => !listed.has(key(recordingOf(c.file), c.model)))
      .map(describeCall),
    stale: allowed
      .filter((a) => !off.has(key(a.recording, a.model)))
      .map((a) => `${a.recording} ${a.model}`),
  };
}

describe("a call against the list", () => {
  const recording = "kie_1/some-render_1";
  const entry: Allowed = { recording, model: "some-model", reason: "listed" };
  const off: HarCostCall = {
    file: join(RECORDINGS, recording, "recording.har"),
    provider: "kie",
    endpoint: "api.v1.jobs.createTask",
    model: "some-model",
    statedUsd: 0.5,
    estimateUsd: 0.2,
    ratio: 0.4,
    verdict: "under",
  };

  it("passes a listed call beyond tolerance", () => {
    expect(review([off], [entry])).toEqual({ unlisted: [], stale: [] });
  });

  it("fails on a call the list does not hold, naming it and its ratio", () => {
    const { unlisted, stale } = review([off], []);
    expect(stale).toEqual([]);
    expect(unlisted).toHaveLength(1);
    expect(unlisted[0]).toContain(recording);
    expect(unlisted[0]).toContain("ratio 0.4000");
  });

  it("fails on a listed call that now agrees", () => {
    const agrees: HarCostCall = {
      ...off,
      estimateUsd: 0.5,
      ratio: 1,
      verdict: "match",
    };
    expect(review([agrees], [entry])).toEqual({
      unlisted: [],
      stale: [`${recording} some-model`],
    });
  });

  it("fails on a listed call whose recording is gone", () => {
    expect(review([], [entry]).stale).toEqual([`${recording} some-model`]);
  });

  it("leaves a call with no stated charge alone", () => {
    expect(review([{ ...off, statedUsd: null }], [])).toEqual({
      unlisted: [],
      stale: [],
    });
  });
});

describe("committed recordings against the tables", () => {
  let calls: HarCostCall[];

  beforeAll(async () => {
    calls = await harCostCalls(statedChargeFiles());
  }, 120_000);

  it("reads the recorded bills, so a broken walk cannot pass", () => {
    const compared = calls.filter(
      (c) => c.statedUsd !== null && c.ratio !== null
    );
    expect(compared.length).toBeGreaterThan(100);
    expect([...new Set(compared.map((c) => c.provider))]).toEqual(
      expect.arrayContaining(["kie", "machgen", "xai"])
    );
  });

  it("holds every recorded bill within tolerance, or lists it with a reason", () => {
    expect(review(calls, ALLOWED)).toEqual({ unlisted: [], stale: [] });
  });

  it("fails on a rate that contradicts a bill, naming the recording and the ratio", async () => {
    const recording =
      "kie_2079838932/pixverse-v6-reference-to-video_2396754018";
    const row = PRICING.kie["pixverse-v6/reference-to-video"] as unknown as {
      rates: Record<string, number>;
    };
    const rate = row.rates["360p|no-audio"]!;
    row.rates["360p|no-audio"] = rate * 2;
    try {
      const moved = await harCostCalls([
        join(RECORDINGS, recording, "recording.har"),
      ]);
      const { unlisted } = review(moved, []);
      expect(unlisted).toHaveLength(1);
      expect(unlisted[0]).toContain(recording);
      expect(unlisted[0]).toContain("ratio 2.000");
    } finally {
      row.rates["360p|no-audio"] = rate;
    }
  }, 60_000);

  it("quotes each listed call's reason from its row in the learning pass", () => {
    const rows = readFileSync("docs/cost-learning-pass-1.md", "utf8").split(
      "\n"
    );
    for (const { recording, model, reason } of ALLOWED) {
      const quoted = rows.some(
        (row) =>
          row.includes(`\`${model}\``) &&
          row.includes("NO-ACTION") &&
          row.includes(reason)
      );
      expect(quoted, `${recording}: ${reason}`).toBe(true);
    }
  });

  it("the field list covers every place an extractor states a charge", () => {
    const families = readFileSync(
      "packages/provider/cost/src/actual/families.ts",
      "utf8"
    );
    // One line per site that sets a figure. A new one must add its field above.
    expect(families.match(/out\.statedUsd = /g)).toHaveLength(6);
    expect(families.match(/out\.statedListUsd = /g)).toHaveLength(1);
    for (const field of STATED_CHARGE_FIELDS) {
      const name = field === String.raw`\"cost\"` ? `"cost"` : field;
      expect(families, field).toContain(name);
    }
  });
});
