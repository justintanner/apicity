import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { beforeAll, describe, expect, it } from "vitest";
import { PRICING } from "../../packages/provider/cost/src";
import {
  KIE_PRICING_METADATA_PATH,
  KIE_PRICING_SNAPSHOT_PATH,
} from "../../scripts/lib/kie-pricing-evidence-paths.mjs";
import { buildReconciliationManifest } from "../../scripts/lib/kie-pricing-reconciliation.mjs";
import { feedDrift } from "../../scripts/lib/kie-feed-drift.mjs";

// scripts/kie-feed-drift.mjs compares the table with a live pull, which CI cannot
// make. These hold its comparator to the frozen pull and to the rows one live pull
// printed, tests/fixtures/kie-pricing-evidence/feed-drift-2026-11-05.json, so a
// table edit that contradicts that dated reading fails here too.
const FIXTURE =
  "tests/fixtures/kie-pricing-evidence/feed-drift-2026-11-05.json";

interface Row {
  official: { modelDescription: string; usdPrice: string; creditPrice: string };
  rateBasis?: { usdPrice: string };
  disposition: string;
}

interface Manifest {
  rows: Row[];
}

interface Cell {
  description: string;
  key: string;
  variant: string;
  tableUsd: number | null;
  feedUsd: number[];
}

interface Report {
  compared: number;
  same: number;
  differ: Cell[];
  notCompared: Array<{ description: string; reason: string }>;
  uncoveredKeys: string[];
}

const build = async (options: {
  snapshotPath: string;
  metadataPath: string;
  live?: boolean;
}) =>
  (await buildReconciliationManifest({
    root: process.cwd(),
    generatedAt: "2026-11-04T00:00:00.000Z",
    ...options,
  })) as unknown as Manifest;

const report = (manifest: Manifest) =>
  feedDrift({ manifest, pricing: PRICING.kie }) as unknown as Report;

const cellsOf = (result: Report, description: string) =>
  result.differ.filter((cell) => cell.description === description);

function withPrice(
  manifest: Manifest,
  description: string,
  usd: string,
  credits: string
): Manifest {
  const copy = structuredClone(manifest);
  const row = copy.rows.find(
    (candidate) => candidate.official.modelDescription.trim() === description
  );
  if (!row) throw new Error(`no feed row: ${description}`);
  row.official.usdPrice = usd;
  row.official.creditPrice = credits;
  if (row.rateBasis) row.rateBasis.usdPrice = usd;
  return copy;
}

describe("KIE feed drift", () => {
  let live: Manifest;

  beforeAll(async () => {
    live = await build({
      snapshotPath: FIXTURE,
      metadataPath: FIXTURE,
      live: true,
    });
  });

  it("finds the table agreeing with every row of the 2026-11-05 pull", () => {
    const result = report(live);
    expect(result.differ).toEqual([]);
    expect(result.compared).toBe(result.same);
    // 134 rows, and the 8 pixverse-v6-max rows each price two tabs.
    expect(result.compared).toBe(142);
    expect(result.notCompared).toEqual([]);
  });

  it("catches the drift that prompted it, which the frozen guard could not see", async () => {
    const frozen = {
      snapshotPath: KIE_PRICING_SNAPSHOT_PATH,
      metadataPath: KIE_PRICING_METADATA_PATH,
    };
    const key = "pixverse-v6/reference-to-video";
    const cells = (manifest: Manifest) =>
      report(manifest).differ.filter((cell) => cell.key === key);

    expect(cells(await build(frozen))).toEqual([]);

    const caught = cells(await build({ ...frozen, live: true }));
    expect(caught).toHaveLength(8);
    expect(caught).toContainEqual(
      expect.objectContaining({
        description: "pixverse-v6, Reference To Video, 360p(no audio)",
        variant: "360p|no-audio",
        tableUsd: 0.02,
        feedUsd: [0.0225, 0.0225],
      })
    );
  });

  // The rough first version of this check read MiniMax H3's image row against the
  // per-second cell and reported 0.04 against 0.02.
  it.each([
    [
      "MiniMax H3, image input, 768p, 2k",
      "0.01",
      "2",
      "minimax-h3/reference-to-video",
      "extra",
      0.02,
    ],
    [
      "MiniMax H3, text to video, 768p",
      "0.03",
      "6",
      "minimax-h3/text-to-video",
      "768P",
      0.04,
    ],
    // Each axis of a multi-axis row reaches its own cell.
    [
      "kling 3.0 omni, reference-to-video, 1080p with video input",
      "0.15",
      "30",
      "kling-3.0-omni/reference-to-video",
      "1080p|video",
      0.151,
    ],
    [
      "kling 3.0 omni, text-to-video, 720p with native audio",
      "0.1",
      "20",
      "kling-3.0-omni/text-to-video",
      "720p|audio",
      0.101,
    ],
    [
      "kling 4.0, reference-to-video, 1080P with video input",
      "0.15",
      "30",
      "kling-4.0/reference-to-video",
      "1080p|video",
      0.1275,
    ],
    [
      "pixverse-v6-max, Text /Image to Video, 540p(with audio)",
      "0.05",
      "10",
      "pixverse-v6-max/image-to-video",
      "540p|audio",
      0.044,
    ],
    [
      "Vidu Q4, image-to-video, 540p",
      "0.05",
      "10",
      "vidu-q4/image-to-video",
      "540p",
      0.036,
    ],
    [
      "wan 2.6, text to video, 10.0s-1080p",
      "1.1",
      "220",
      "wan/2-6-text-to-video",
      "10|1080p",
      1.05,
    ],
    // Input tokens, at a rate the table states per million.
    ["gpt-5-2, Chat, Input", "0.5", "100", "gpt-5-2", "input", 0.4375],
  ])(
    "reports a move in %s against its own cell",
    (description, usd, credits, key, variant, tableUsd) => {
      const [cell] = cellsOf(
        report(withPrice(live, description, usd, credits)),
        description
      );
      expect(cell).toMatchObject({ key, variant, tableUsd });
    }
  );

  it("reports a move on both tabs of a row that prices a text and image pair", () => {
    const description =
      "pixverse-v6-max, Text /Image to Video, 540p(with audio)";
    expect(
      cellsOf(report(withPrice(live, description, "0.05", "10")), description)
        .map((cell) => cell.key)
        .sort()
    ).toEqual([
      "pixverse-v6-max/image-to-video",
      "pixverse-v6-max/text-to-video",
    ]);
  });

  it("reads Wan 2.2 Turbo's per-second row against its 5 s per-video cell", () => {
    const description = "Wan 2.2 A14B Turbo API text to Video, 720p";
    expect(cellsOf(report(live), description)).toEqual([]);
    expect(
      cellsOf(report(withPrice(live, description, "0.09", "18")), description)
    ).toEqual([
      expect.objectContaining({
        key: "wan/2-2-a14b-text-to-video-turbo",
        variant: "720p",
        tableUsd: 0.4,
      }),
    ]);
  });

  it("takes a cell that matches a row's credits or its USD, and neither is drift", () => {
    // The feed rounds gpt-5-2's 87.5 credits (0.4375 USD) to 0.44.
    const description = "gpt-5-2, Chat, Input";
    expect(
      live.rows.find(
        (row) => row.official.modelDescription.trim() === description
      )?.official
    ).toMatchObject({ creditPrice: "87.5", usdPrice: "0.44" });
    expect(cellsOf(report(live), description)).toEqual([]);
  });

  it("prices the Wan 2.6 1080p cells at this pull's figures, on all three tabs", () => {
    for (const tab of ["text", "image", "video"]) {
      expect(PRICING.kie[`wan/2-6-${tab}-to-video`]).toMatchObject({
        rates: { "5|1080p": 0.525, "10|1080p": 1.05 },
        source: { asOf: "2026-11-04" },
      });
    }
  });

  it("prices the Kling cells KIE repriced at this pull's figures", () => {
    expect(PRICING.kie["kling/v2-1-standard"]).toMatchObject({
      rates: { "5": 0.2525, "10": 0.505 },
      source: { asOf: "2026-11-05" },
    });
    expect(PRICING.kie["kling/v2-1-master-text-to-video"]).toMatchObject({
      rates: { "5": 1.26, "10": 2.52 },
      source: { asOf: "2026-11-05" },
    });
    expect(PRICING.kie["kling-3.0/video"]).toMatchObject({
      rates: { std: 0.0755, pro: 0.101, "4K": 0.3775 },
      source: { asOf: "2026-11-05" },
    });
  });

  it("keeps the first five MiniMax H3 images free, as the page and feed say", () => {
    // Never halved here: the frozen pull already printed the 4 credits per image
    // that the 2026-11-04 feed prints. ac-p3e0c6 read an older before-value as a
    // move, and no table figure changed.
    const row = live.rows.find(
      (candidate) =>
        candidate.official.modelDescription.trim() ===
        "MiniMax H3, image input, 768p, 2k"
    );
    expect(row?.official).toMatchObject({ creditPrice: "4", usdPrice: "0.02" });
    const entry = PRICING.kie["minimax-h3/reference-to-video"];
    if (entry?.kind !== "perUnit") throw new Error("expected a per-unit entry");
    const images = (count: number) => ({
      input: { reference_image_urls: Array(count).fill("https://x/a.png") },
    });
    expect(entry.extra?.(images(5))).toBe(0);
    expect(entry.extra?.(images(6))).toBe(0.02);
  });

  describe("the command", () => {
    const run = (args: string[]) =>
      promisify(execFile)(
        process.execPath,
        ["--import", "tsx", "scripts/kie-feed-drift.mjs", ...args],
        { timeout: 25_000 }
      ).then(
        ({ stdout }) => ({ code: 0, stdout }),
        (error: { code: number; stdout: string; stderr: string }) => ({
          code: error.code,
          stdout: error.stdout + error.stderr,
        })
      );

    it("exits 0 when every cell agrees", async () => {
      const { code, stdout } = await run([
        "--snapshot",
        FIXTURE,
        "--metadata",
        FIXTURE,
      ]);
      expect(stdout).toContain("142 agree, 0 differ");
      expect(code).toBe(0);
    }, 30_000);

    it("exits 1 and names the cell when one differs", async () => {
      const dir = await mkdtemp(path.join(tmpdir(), "kie-feed-drift-test-"));
      try {
        const snapshot = JSON.parse(await readFile(FIXTURE, "utf8")) as {
          records: Array<{ raw: Row["official"] }>;
        };
        const row = snapshot.records.find(
          ({ raw }) =>
            raw.modelDescription.trim() === "Vidu Q4, image-to-video, 540p"
        );
        if (!row) throw new Error("fixture lost its Vidu Q4 row");
        row.raw.usdPrice = "0.05";
        row.raw.creditPrice = "10";
        const file = path.join(dir, "snapshot.json");
        await writeFile(file, JSON.stringify(snapshot));
        const { code, stdout } = await run([
          "--snapshot",
          file,
          "--metadata",
          file,
        ]);
        expect(stdout).toContain(
          "DIFFER Vidu Q4, image-to-video, 540p | vidu-q4/image-to-video 540p | table 0.036 | feed 0.05"
        );
        expect(code).toBe(1);
      } finally {
        await rm(dir, { recursive: true, force: true });
      }
    }, 30_000);

    it("exits 2 when it cannot run", async () => {
      const { code, stdout } = await run(["--snapshot", FIXTURE]);
      expect(stdout).toContain("--snapshot and --metadata go together");
      expect(code).toBe(2);
    }, 30_000);
  });
});
