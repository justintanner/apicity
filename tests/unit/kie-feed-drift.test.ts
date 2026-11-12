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

  // KIE added Kimi K3.1 Pro as its own row after the 2026-11-05 pull. With its
  // separators gone it contains `kimi-k3`, so it read as a move on that key, and
  // the drift gate stopped the v0.27.0 release over a price that never changed.
  it("does not read a later version's row as a move on the key it contains", async () => {
    const chatRow = (
      modelDescription: string,
      creditPrice: string,
      usdPrice: string,
      anchor: string
    ) => ({
      occurrenceId: `sha256:${modelDescription}#1`,
      rowHash: `sha256:${modelDescription}`,
      semanticKey: `sha256:${modelDescription}`,
      raw: {
        modelDescription,
        interfaceType: "chat",
        provider: "Moonshot",
        creditPrice,
        creditUnit: "per million tokens",
        usdPrice,
        anchor,
      },
    });
    const k3 = "https://kie.ai/kimi-k3";
    const k31 = "https://kie.ai/kimi-k3-1-pro";
    const dir = await mkdtemp(path.join(tmpdir(), "kie-feed-drift-test-"));
    try {
      const file = path.join(dir, "snapshot.json");
      await writeFile(
        file,
        JSON.stringify({
          ...JSON.parse(await readFile(FIXTURE, "utf8")),
          records: [
            chatRow("Kimi K3, Chat, Input", "480", "2.40", k3),
            chatRow("Kimi K3, Chat, Cached Input", "48", "0.24", k3),
            chatRow("Kimi K3, Chat, Output", "2400", "12.00", k3),
            chatRow("Kimi K3.1 Pro, Chat, Input", "160", "0.80", k31),
            chatRow("Kimi K3.1 Pro, Chat, Cached Input", "16", "0.08", k31),
            chatRow("Kimi K3.1 Pro, Chat, Output", "800", "4.00", k31),
          ],
        })
      );
      const result = report(
        await build({ snapshotPath: file, metadataPath: file, live: true })
      );
      expect(result.differ).toEqual([]);
      // Kimi K3's own three cells are still compared, so the gate still watches them.
      expect(result.same).toBe(3);
      expect(result.compared).toBe(3);
      expect(result.notCompared.map(({ description }) => description)).toEqual([
        "Kimi K3.1 Pro, Chat, Input",
        "Kimi K3.1 Pro, Chat, Cached Input",
        "Kimi K3.1 Pro, Chat, Output",
      ]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  // The 2026-11-07 feed added gpt-image-2-6 SVG rows whose text-model clause is
  // a chat pricing key. Those rates are not the chat rates (luna output stays
  // 0.336; the SVG output cell is 1.08). "SVG output" is the operation, so an
  // Input row is still the input cell when the row really is that chat model.
  it("does not price gpt-image-2-6 SVG rows as the chat model they name", async () => {
    const row = (
      modelDescription: string,
      interfaceType: string,
      creditPrice: string,
      usdPrice: string,
      anchor: string
    ) => ({
      occurrenceId: `sha256:${modelDescription}#1`,
      rowHash: `sha256:${modelDescription}`,
      semanticKey: `sha256:${modelDescription}`,
      raw: {
        modelDescription,
        interfaceType,
        provider: "OpenAI",
        creditPrice,
        creditUnit: "per million tokens",
        usdPrice,
        anchor,
      },
    });
    const luna = "https://kie.ai/gpt-5-6?model=gpt-5-6-luna";
    const sunburst =
      "https://kie.ai/gpt-image-2-6?model=gpt-image-2-6%2Fsunburst-text-to-image";
    const flare =
      "https://kie.ai/gpt-image-2-6?model=gpt-image-2-6%2Fflare-text-to-image";
    const svg = (
      product: "sunburst" | "flare",
      model: string,
      role: "Input" | "Output",
      credits: string,
      usd: string
    ) =>
      row(
        `gpt-image-2-6-${product}, SVG output, ${model} ${role}`,
        "image",
        credits,
        usd,
        product === "sunburst" ? sunburst : flare
      );
    const dir = await mkdtemp(path.join(tmpdir(), "kie-feed-drift-test-"));
    try {
      const file = path.join(dir, "snapshot.json");
      await writeFile(
        file,
        JSON.stringify({
          ...JSON.parse(await readFile(FIXTURE, "utf8")),
          records: [
            row("gpt-5.6-luna, chat, Input", "chat", "11.2", "0.056", luna),
            row("gpt-5.6-luna, chat, Output", "chat", "67.2", "0.336", luna),
            row(
              "gpt-5.6-luna, chat, Cached Input",
              "chat",
              "1.12",
              "0.0056",
              luna
            ),
            row("gpt-5.6-luna, chat, Cache Writes", "chat", "14", "0.07", luna),
            // The operation says output. The role is the last clause.
            row(
              "gpt-5-2, SVG output, Input",
              "chat",
              "87.5",
              "0.4375",
              "https://kie.ai/gpt-5-2"
            ),
            svg("sunburst", "gpt-5.6-luna", "Input", "36", "0.18"),
            svg("sunburst", "gpt-5.6-luna", "Output", "216", "1.08"),
            svg("sunburst", "gpt-6-sol", "Input", "360", "1.8"),
            svg("sunburst", "gpt-6-sol", "Output", "1800", "9"),
            svg("sunburst", "gpt-5.6-terra", "Input", "360", "1.8"),
            svg("sunburst", "gpt-5.6-terra", "Output", "2160", "10.8"),
            svg("flare", "gpt-5.6-luna", "Input", "36", "0.18"),
            svg("flare", "gpt-5.6-luna", "Output", "216", "1.08"),
            svg("flare", "gpt-6-sol", "Input", "360", "1.8"),
            svg("flare", "gpt-6-sol", "Output", "1800", "9"),
            svg("flare", "gpt-5.6-terra", "Input", "360", "1.8"),
            svg("flare", "gpt-5.6-terra", "Output", "2160", "10.8"),
          ],
        })
      );
      const result = report(
        await build({ snapshotPath: file, metadataPath: file, live: true })
      );
      expect(result.differ).toEqual([]);
      // Luna's four chat cells, plus the labeled gpt-5-2 input cell.
      expect(result.same).toBe(5);
      expect(result.compared).toBe(5);
      expect(PRICING.kie["gpt-5-6-luna"]).toMatchObject({
        rate: { input: 0.056, output: 0.336 },
      });
      expect(PRICING.kie["gpt-6-sol"]).toMatchObject({
        rate: { input: 0.6, output: 3 },
      });
      expect(PRICING.kie["gpt-5-6-terra"]).toMatchObject({
        rate: { input: 0.56, output: 3.36 },
      });
      const parked = result.notCompared.map(({ description }) => description);
      expect(parked).toHaveLength(12);
      expect(
        parked.every((description) => /SVG output/.test(description))
      ).toBe(true);
      expect(
        result.notCompared.every(({ reason }) =>
          reason.includes("bill on top of the image tokens")
        )
      ).toBe(true);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  // GPT Image 2.6 bills text and image tokens at different rates. The row's
  // last clause names the modality, so an Image row reads the entry's image
  // rate and a Text row its text rate (2026-11-12 feed, ac-ag1t5r).
  it("compares gpt-image-2-6 text and image token rows with the matching modality rate", async () => {
    const anchor =
      "https://kie.ai/gpt-image-2-6?model=gpt-image-2-6%2Fsunburst-text-to-image";
    const row = (role: string, creditPrice: string, usdPrice: string) => {
      const modelDescription = `gpt-image-2-6-sunburst, text-to-image / image-to-image, ${role}`;
      return {
        occurrenceId: `sha256:${modelDescription}#1`,
        rowHash: `sha256:${modelDescription}`,
        semanticKey: `sha256:${modelDescription}`,
        raw: {
          modelDescription,
          interfaceType: "image",
          provider: "OpenAI",
          creditPrice,
          creditUnit: "per million tokens",
          usdPrice,
          anchor,
        },
      };
    };
    const records = [
      row("Text Input", "900", "4.5"),
      row("Cached Text Input", "225", "1.125"),
      row("Image Input", "1440", "7.2"),
      row("Cached Image Input", "360", "1.8"),
      row("Image Output", "5400", "27"),
    ];
    const dir = await mkdtemp(path.join(tmpdir(), "kie-feed-drift-test-"));
    try {
      const write = async (rows: typeof records) => {
        const file = path.join(dir, "snapshot.json");
        await writeFile(
          file,
          JSON.stringify({
            ...JSON.parse(await readFile(FIXTURE, "utf8")),
            records: rows,
          })
        );
        return report(
          await build({ snapshotPath: file, metadataPath: file, live: true })
        );
      };
      const result = await write(records);
      expect(result.differ).toEqual([]);
      expect(result.same).toBe(5);
      expect(result.compared).toBe(5);

      const moved = await write([
        ...records.slice(0, 2),
        row("Image Input", "1600", "8"),
        ...records.slice(3),
      ]);
      expect(moved.differ).toEqual([
        expect.objectContaining({
          key: "gpt-image-2-6/sunburst-text-to-image",
          variant: "image input",
          tableUsd: 7.2,
        }),
      ]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  // Seedream 5.5 image-to-image bills each output image by size and every
  // input image on top. The input-image row is the extra for one image, not a
  // size cell (2026-11-12 feed, ac-7z7wn9).
  it("compares the seedream 5.5 input-image row with the per-image extra", async () => {
    const anchor =
      "https://kie.ai/seedream-5-5?model=seedream%2F5-5-image-to-image";
    const row = (
      modelDescription: string,
      creditPrice: string,
      usdPrice: string
    ) => ({
      occurrenceId: `sha256:${modelDescription}#1`,
      rowHash: `sha256:${modelDescription}`,
      semanticKey: `sha256:${modelDescription}`,
      raw: {
        modelDescription,
        interfaceType: "image",
        provider: "ByteDance",
        creditPrice,
        creditUnit: "per image",
        usdPrice,
        anchor,
      },
    });
    const sizes = [
      row("seedream 5.5, Image to image, 1K", "3.6", "0.018"),
      row("seedream 5.5, Image to image, 1.5K", "3.6", "0.018"),
      row("seedream 5.5, Image to image, 2K", "6.3", "0.0315"),
    ];
    const inputRow = (creditPrice: string, usdPrice: string) =>
      row(
        "seedream 5.5, input image, Image to image / layer decomposition",
        creditPrice,
        usdPrice
      );
    const dir = await mkdtemp(path.join(tmpdir(), "kie-feed-drift-test-"));
    try {
      const write = async (rows: ReturnType<typeof row>[]) => {
        const file = path.join(dir, "snapshot.json");
        await writeFile(
          file,
          JSON.stringify({
            ...JSON.parse(await readFile(FIXTURE, "utf8")),
            records: rows,
          })
        );
        return report(
          await build({ snapshotPath: file, metadataPath: file, live: true })
        );
      };
      const result = await write([...sizes, inputRow("1.44", "0.0072")]);
      expect(result.differ).toEqual([]);
      expect(result.same).toBe(4);
      expect(result.compared).toBe(4);

      const moved = await write([...sizes, inputRow("2", "0.01")]);
      expect(moved.differ).toEqual([
        expect.objectContaining({
          key: "seedream/5-5-image-to-image",
          variant: "extra",
          tableUsd: 0.0072,
        }),
      ]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  // MiniMax H3 Image edit bills each output image by tier and every
  // reference image on top. The reference-image row is the extra for one
  // image, not a tier cell (2026-11-12 feed, ac-urxhp1).
  it("compares the minimax-h3 image-edit reference-image row with the per-image extra", async () => {
    const anchor =
      "https://kie.ai/minimax-h3-image?model=minimax-h3%2Fimage-edit";
    const row = (
      modelDescription: string,
      creditPrice: string,
      usdPrice: string
    ) => ({
      occurrenceId: `sha256:${modelDescription}#1`,
      rowHash: `sha256:${modelDescription}`,
      semanticKey: `sha256:${modelDescription}`,
      raw: {
        modelDescription,
        interfaceType: "image",
        provider: "Hailuo",
        creditPrice,
        creditUnit: "per image",
        usdPrice,
        anchor,
      },
    });
    const tiers = [
      row("MiniMax H3 Image, image edit, 1K / 2K (≤4.5 MP)", "1.8", "0.009"),
      row("MiniMax H3 Image, image edit, 4K (≤20 MP)", "5.5", "0.0275"),
    ];
    const referenceRow = (creditPrice: string, usdPrice: string) =>
      row(
        "MiniMax H3 Image, image edit, reference image (each)",
        creditPrice,
        usdPrice
      );
    const dir = await mkdtemp(path.join(tmpdir(), "kie-feed-drift-test-"));
    try {
      const write = async (rows: ReturnType<typeof row>[]) => {
        const file = path.join(dir, "snapshot.json");
        await writeFile(
          file,
          JSON.stringify({
            ...JSON.parse(await readFile(FIXTURE, "utf8")),
            records: rows,
          })
        );
        return report(
          await build({ snapshotPath: file, metadataPath: file, live: true })
        );
      };
      const result = await write([...tiers, referenceRow("0.5", "0.0025")]);
      expect(result.differ).toEqual([]);
      expect(result.same).toBe(3);
      expect(result.compared).toBe(3);

      const moved = await write([...tiers, referenceRow("1", "0.005")]);
      expect(moved.differ).toEqual([
        expect.objectContaining({
          key: "minimax-h3/image-edit",
          variant: "extra",
          tableUsd: 0.0025,
        }),
      ]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
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
