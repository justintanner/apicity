/**
 * The root README frontier section is a committed leaderboard snapshot.
 * Mapped endpoint ids have to keep resolving in the provider registries, the
 * ranks have to stay contiguous, and doc-gen's render has to match README.md.
 * Nothing here contacts the network.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { VeoGenerateRequestSchema } from "@apicity/kie/zod";
import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";
import {
  ENDPOINT_MAP_PATH,
  LEADERBOARD_PATH,
  ROOT_README_PATH,
  applyFrontierSection,
  endpointMapProblems,
  frontierProblems,
  loadEndpointDocRows,
  loadFrontierData,
  providerSourceText,
  renderFrontierSection,
  renderRootReadme,
  snapshotProblems,
  sourceHasExactUrl,
} from "../../scripts/lib/frontier-models.mjs";
import { repoRoot } from "../../scripts/lib/provider-scope.mjs";

const KIE_IMAGE_FIELDS = [
  "image_urls",
  "first_frame_url",
  "image_url",
  "start_image_url",
  "first_frame",
] as const;

const SEED: ReadonlyArray<readonly [number, string, string, number]> = [
  [1, "MiniMax H3 (768p)", "MiniMax", 1140],
  [2, "FLUX 3 Max (720p)", "Black Forest Labs", 1138],
  [3, "Dreamina Seedance 2.5", "ByteDance", 1138],
  [4, "Gemini Omni Flash 1.1", "Google", 1132],
  [5, "Wan 3.0", "Alibaba", 1127],
  [6, "MiniMax H3 Max", "MiniMax", 1125],
  [7, "Dreamina Seedance 2.0", "ByteDance", 1121],
  [8, "FLUX 3", "Black Forest Labs", 1086],
  [9, "Grok Imagine Video 1.5", "SpaceXAI", 1067],
  [10, "HappyHorse-1.1", "Alibaba", 1061],
  [11, "MAGI-2 Preview", "Sand.ai", 1046],
  [12, "HappyHorse-1.0", "Alibaba", 1042],
  [13, "Wan 2.7", "Alibaba", 1034],
  [14, "Veo 3.1", "Google", 1028],
  [15, "PixVerse V6", "PixVerse", 1024],
  [16, "Veo 3.1 Fast", "Google", 1017],
  [17, "Vidu Q3 Pro", "Vidu", 1016],
  [18, "Kling 3.0 Omni 1080p (Pro)", "KlingAI", 1004],
  [19, "Kling 3.0 1080p (Pro)", "KlingAI", 1000],
  [20, "LTX-2.5 Fast", "Lightricks", 984],
  [21, "Vidu Q3 Turbo", "Vidu", 967],
  [22, "LTX-2.5 Pro", "Lightricks", 958],
  [23, "LTX-2.3 Pro", "Lightricks", 903],
  [24, "LTX-2.3 Fast", "Lightricks", 888],
];

const UNMAPPED = [
  "MAGI-2 Preview",
  "Vidu Q3 Pro",
  "Vidu Q3 Turbo",
  "LTX-2.3 Pro",
  "LTX-2.3 Fast",
];

function readQuoted(block: string): string[] {
  return [...block.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
}

function readConstArray(source: string, name: string): string[] {
  const match = source.match(
    new RegExp(`const ${name} = \\[([\\s\\S]*?)\\] as const`)
  );
  if (!match?.[1]) throw new Error(`missing ${name}`);
  return readQuoted(match[1]);
}

function readVeoModels(source: string): string[] {
  const match = source.match(
    /export const VeoGenerateRequestSchema = z\.object\(\{[\s\S]*?\.enum\(\[([\s\S]*?)\]\)\s*\.or\(KieVeoModelAliasSchema\)/
  );
  if (!match?.[1]) throw new Error("missing kie Veo model enum");
  return readQuoted(match[1]);
}

function kieCreateTaskModels(): Set<string> {
  const ids = new Set<string>();
  for (const [id, schema] of Object.entries(modelInputSchemas)) {
    if (schema.type !== "video") continue;
    const imageBacked =
      id.includes("image-to-video") ||
      KIE_IMAGE_FIELDS.some((name) => name in schema.fields);
    if (imageBacked) ids.add(id);
  }
  return ids;
}

function liveRegistry() {
  const kieZod = readFileSync(
    path.join(repoRoot, "packages/provider/kie/src/zod.ts"),
    "utf8"
  );
  const googleflowZod = readFileSync(
    path.join(repoRoot, "packages/provider/googleflow/src/zod.ts"),
    "utf8"
  );
  const alibabaZod = readFileSync(
    path.join(repoRoot, "packages/provider/alibaba/src/zod.ts"),
    "utf8"
  );
  const kieVeo = new Set(readVeoModels(kieZod));
  for (const model of kieVeo) {
    const parsed = VeoGenerateRequestSchema.safeParse({
      prompt: "frontier",
      model,
      imageUrls: ["https://example.com/frame.png"],
      generationType: "FIRST_AND_LAST_FRAMES_2_VIDEO",
    });
    if (!parsed.success) {
      throw new Error(`kie Veo model ${model} does not accept an image`);
    }
  }
  const sources = new Map<string, string>();
  const sourceHasUrl = (provider: string, url: string) => {
    let source = sources.get(provider);
    if (source === undefined) {
      source = providerSourceText(provider);
      sources.set(provider, source);
    }
    return sourceHasExactUrl(source, url);
  };
  return {
    docsRows: loadEndpointDocRows(),
    sourceHasUrl,
    registry: {
      kieCreateTask: kieCreateTaskModels(),
      kieVeo,
      googleflowVideos: new Set(
        readConstArray(googleflowZod, "VIDEOS_ENUMERATED_MODELS")
      ),
      alibabaVideo: new Set(
        readConstArray(alibabaZod, "WAN_VIDEO_SYNTHESIS_MODELS").filter(
          (model) => model.includes("i2v")
        )
      ),
    },
  };
}

describe("frontier image-to-video snapshot", () => {
  const { snapshot, endpointMap } = loadFrontierData();

  it("commits the AA-Video-I2V v1.1 seed verbatim", () => {
    expect(snapshot.leaderboardId).toBe("AA-Video-I2V v1.1");
    expect(snapshot.sourceUrl).toBe(
      "https://artificialanalysis.ai/video/leaderboard/image-to-video"
    );
    expect(snapshot.capturedOn).toBe("2026-10-22");
    expect(snapshot.methodology).toBe(
      "Elo from blind comparisons by validated private evaluators."
    );
    expect(
      snapshot.entries.map(
        (entry: {
          rank: number;
          model: string;
          creator: string;
          elo: number;
        }) => [entry.rank, entry.model, entry.creator, entry.elo]
      )
    ).toEqual(SEED.map((row) => [...row]));
    expect(snapshotProblems(snapshot)).toEqual([]);
  });

  it("rejects a snapshot whose ranks skip or repeat", () => {
    const broken = {
      ...snapshot,
      entries: snapshot.entries.map((entry: { rank: number }, index: number) =>
        index === 2 ? { ...entry, rank: 2 } : entry
      ),
    };
    const problems = snapshotProblems(broken);
    expect(problems.some((problem) => problem.includes("duplicated"))).toBe(
      true
    );
    expect(problems.some((problem) => problem.includes("missing 3"))).toBe(
      true
    );
  });

  it("requires an explicit empty mapping for every leaderboard model", () => {
    const dropped = { ...endpointMap };
    delete dropped["MAGI-2 Preview"];
    expect(
      endpointMapProblems(snapshot, dropped).some((problem) =>
        problem.includes("MAGI-2 Preview")
      )
    ).toBe(true);
  });

  it("resolves every mapped id in the live provider registries", () => {
    const problems = frontierProblems(snapshot, endpointMap, liveRegistry());
    expect(problems).toEqual([]);

    const unmapped = Object.entries(endpointMap)
      .filter(([, list]) => Array.isArray(list) && list.length === 0)
      .map(([model]) => model);
    expect(unmapped).toEqual(UNMAPPED);

    const mapped = SEED.length - unmapped.length;
    expect(mapped).toBe(19);
  });

  it("reports an endpoint id that has left the provider source", () => {
    const ctx = liveRegistry();
    const problems = frontierProblems(snapshot, endpointMap, {
      ...ctx,
      sourceHasUrl: () => false,
    });
    expect(problems.length).toBeGreaterThan(0);
    expect(problems.every((problem) => problem.includes("is not in"))).toBe(
      true
    );
  });

  it("keeps the rendered section equal to the committed README", async () => {
    const readme = readFileSync(ROOT_README_PATH, "utf8");
    expect(await renderRootReadme(readme)).toBe(readme);

    const features = readme.indexOf("## Features");
    const frontier = readme.indexOf("## Frontier models");
    const example = readme.indexOf("\n## Example\n");
    expect(features).toBeGreaterThan(-1);
    expect(frontier).toBeGreaterThan(features);
    expect(example).toBeGreaterThan(frontier);
    expect(readme).toContain("[Frontier models ↓](#frontier-models)");
    expect(readme).toContain("not yet in apicity");
    expect(readme).toContain("fal `minimax.h3.imageToVideo`");
    expect(readme).toContain("kie `minimax-h3/image-to-video`");
  });

  it("does not download the leaderboard from the generator", () => {
    const lib = readFileSync(
      path.join(repoRoot, "scripts/lib/frontier-models.mjs"),
      "utf8"
    );
    const docGen = readFileSync(
      path.join(repoRoot, "scripts/doc-gen.mjs"),
      "utf8"
    );
    expect(lib).not.toMatch(/\bfetch\s*\(/);
    expect(lib).not.toMatch(/from\s+["']node:(?:https|http)["']/);
    expect(lib).not.toContain("artificialanalysis.ai");
    expect(docGen).not.toContain("artificialanalysis.ai");
    expect(docGen).toContain(
      'import { syncRootFrontier } from "./lib/frontier-models.mjs"'
    );
    expect(docGen).toContain("syncRootFrontier({ check })");
    expect(readFileSync(LEADERBOARD_PATH, "utf8")).toContain(
      "artificialanalysis.ai"
    );
    expect(readFileSync(ENDPOINT_MAP_PATH, "utf8")).not.toContain(
      "artificialanalysis.ai"
    );
  });

  it("renders an unmapped model as not yet in apicity", () => {
    const section = renderFrontierSection(
      {
        leaderboardId: "AA-Video-I2V v1.1",
        sourceUrl: "https://example.com/leaderboard",
        capturedOn: "2026-10-22",
        methodology: "Elo from blind comparisons.",
        entries: [{ rank: 1, model: "Missing", creator: "Nobody", elo: 1 }],
      },
      { Missing: [] },
      new Map()
    );
    const readme = applyFrontierSection("## Features\n\n## Example\n", section);
    expect(section).toContain(
      "| 1 | Missing | Nobody | 1 | not yet in apicity |"
    );
    expect(readme.indexOf("## Frontier models")).toBeGreaterThan(
      readme.indexOf("## Features")
    );
    expect(readme.indexOf("## Example")).toBeGreaterThan(
      readme.indexOf("## Frontier models")
    );
  });
});
