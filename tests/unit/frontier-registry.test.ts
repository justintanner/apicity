/**
 * The frontier registry is a committed leaderboard snapshot, one directory
 * per task type. Mapped endpoints have to keep resolving, the i2v top 10 is
 * pinned, and the generated registry and docs/frontier.md have to match a
 * fresh render. Nothing here contacts the network.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { frontier, frontierType, FRONTIER } from "@apicity/cost";
import { VeoGenerateRequestSchema } from "@apicity/kie/zod";
import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";
import {
  DOCS_PATH,
  ENDPOINT_DOCS_PATH,
  FRONTIER_DATA_PATH,
  TYPE_KEYWORDS,
  catalogProblems,
  endpointMapProblems,
  formatEndpoints,
  loadCatalog,
  loadEndpointDocRows,
  loadFrontierModel,
  providerSourceText,
  renderFrontierDocument,
  renderFrontierModule,
  resolutionProblems,
  snapshotProblems,
  sourceHasExactUrl,
  structuralProblems,
  textCarriesTypeKeyword,
} from "../../scripts/lib/frontier-models.mjs";
import { repoRoot } from "../../scripts/lib/provider-scope.mjs";

const KIE_IMAGE_FIELDS = [
  "image_urls",
  "first_frame_url",
  "image_url",
  "start_image_url",
  "first_frame",
] as const;

const I2V_SEED: ReadonlyArray<readonly [number, string, string, number]> = [
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
    if (schema.type !== "image" && schema.type !== "video") continue;
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
  const kieCreateTask = kieCreateTaskModels();
  const googleflowVideos = new Set(
    readConstArray(googleflowZod, "VIDEOS_ENUMERATED_MODELS")
  );
  const alibabaVideo = new Set(
    readConstArray(alibabaZod, "WAN_VIDEO_SYNTHESIS_MODELS").filter((model) =>
      model.includes("i2v")
    )
  );
  const sources = new Map<string, string>();
  const sourceHasUrl = (provider: string, url: string) => {
    let source = sources.get(provider);
    if (source === undefined) {
      source = providerSourceText(provider);
      sources.set(provider, source);
    }
    return sourceHasExactUrl(source, url);
  };
  const registryHas = (
    type: string,
    entry: { provider: string; dotPath: string; modelId?: string }
  ) => {
    if (type !== "i2v" || entry.modelId === undefined) return false;
    if (
      entry.provider === "kie" &&
      entry.dotPath === "api.v1.jobs.createTask"
    ) {
      return kieCreateTask.has(entry.modelId);
    }
    if (entry.provider === "kie" && entry.dotPath === "api.v1.veo.generate") {
      return kieVeo.has(entry.modelId);
    }
    if (entry.provider === "googleflow" && entry.dotPath === "v1.videos") {
      return googleflowVideos.has(entry.modelId);
    }
    if (
      entry.provider === "alibaba" &&
      entry.dotPath === "api.v1.services.aigc.videoGeneration.videoSynthesis"
    ) {
      return alibabaVideo.has(entry.modelId);
    }
    return false;
  };
  return {
    docsRows: loadEndpointDocRows(),
    sourceHasUrl,
    registryHas,
  };
}

function i2vFiles() {
  const dir = path.join(repoRoot, "scripts/frontier/i2v");
  return {
    snapshot: JSON.parse(
      readFileSync(path.join(dir, "leaderboard.json"), "utf8")
    ) as {
      leaderboardId: string;
      sourceUrl: string;
      capturedOn: string;
      methodology: string;
      entries: Array<{
        rank: number;
        model: string;
        creator: string;
        elo: number;
      }>;
    },
    endpointMap: JSON.parse(
      readFileSync(path.join(dir, "endpoints.json"), "utf8")
    ) as Record<string, unknown[]>,
  };
}

function listFiles(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir)) {
    const child = path.join(dir, entry);
    if (statSync(child).isDirectory()) found.push(...listFiles(child));
    else found.push(child);
  }
  return found;
}

/** Drop fenced examples so provider README snippets are not this guard. */
function withoutFences(source: string): string {
  return source.replace(/```[\s\S]*?```/g, "");
}

describe("frontier snapshots", () => {
  const { snapshot, endpointMap } = i2vFiles();

  it("accepts the catalog and every present type directory", () => {
    expect(catalogProblems(loadCatalog())).toEqual([]);
    expect(structuralProblems()).toEqual([]);
  });

  it("commits the AA-Video-I2V v1.1 top 10 verbatim", () => {
    expect(snapshot.leaderboardId).toBe("AA-Video-I2V v1.1");
    expect(snapshot.sourceUrl).toBe(
      "https://artificialanalysis.ai/video/leaderboard/image-to-video"
    );
    expect(snapshot.capturedOn).toBe("2026-10-22");
    expect(snapshot.methodology).toBe(
      "Elo from blind comparisons by validated private evaluators."
    );
    expect(
      snapshot.entries.map((entry) => [
        entry.rank,
        entry.model,
        entry.creator,
        entry.elo,
      ])
    ).toEqual(I2V_SEED.map((row) => [...row]));
    expect(snapshotProblems(snapshot)).toEqual([]);
    const unmapped = Object.entries(endpointMap).filter(
      ([, list]) => Array.isArray(list) && list.length === 0
    );
    expect(unmapped).toEqual([]);
    expect(Object.keys(endpointMap)).toHaveLength(10);
  });

  it("rejects a snapshot whose ranks skip, repeat, or pass 10", () => {
    const broken = {
      ...snapshot,
      entries: snapshot.entries.map((entry, index) =>
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

    const extra = {
      ...snapshot,
      entries: [
        ...snapshot.entries,
        { rank: 11, model: "Eleventh", creator: "Nobody", elo: 1 },
      ],
    };
    expect(
      snapshotProblems(extra).some((problem) => problem.includes("top 10"))
    ).toBe(true);
  });

  it("requires an explicit endpoint list for every leaderboard model", () => {
    const dropped = { ...endpointMap };
    delete dropped["FLUX 3"];
    expect(
      endpointMapProblems(snapshot, dropped).some((problem) =>
        problem.includes("FLUX 3")
      )
    ).toBe(true);
    expect(
      endpointMapProblems(snapshot, { ...endpointMap, Extra: [] }).some(
        (problem) => problem.includes("Extra")
      )
    ).toBe(true);
  });

  it("resolves every mapped i2v endpoint in the live registries", () => {
    const problems = resolutionProblems("i2v", endpointMap, liveRegistry());
    expect(problems).toEqual([]);
  });

  it("reports an endpoint URL that has left the provider source", () => {
    const problems = resolutionProblems("i2v", endpointMap, {
      ...liveRegistry(),
      sourceHasUrl: () => false,
    });
    expect(problems.length).toBeGreaterThan(0);
    expect(problems.every((problem) => problem.includes("is not in"))).toBe(
      true
    );
  });

  it("matches a dedicated leaf by the type keyword and not by editVideo", () => {
    expect(textCarriesTypeKeyword("i2v", "minimax.h3.imageToVideo")).toBe(true);
    expect(textCarriesTypeKeyword("i2i", "models.edit")).toBe(true);
    expect(textCarriesTypeKeyword("i2i", "models.editVideo")).toBe(false);
    expect(textCarriesTypeKeyword("t2v", "textToVideo")).toBe(true);
    expect(Object.keys(TYPE_KEYWORDS)).toEqual([
      "t2i",
      "i2i",
      "t2v",
      "i2v",
      "v2v",
      "r2v",
    ]);

    const ctx = {
      docsRows: [
        {
          provider: "fal",
          dotPath: "demo.editVideo",
          method: "POST",
          fullUrl: "https://example.com/editVideo",
          docsUrl: "",
        },
      ],
      sourceHasUrl: () => true,
      registryHas: () => false,
    };
    expect(
      resolutionProblems(
        "i2i",
        { Demo: [{ provider: "fal", dotPath: "demo.editVideo" }] },
        ctx
      ).some((problem) => problem.includes("is not a i2i endpoint"))
    ).toBe(true);
  });

  it("renders an empty endpoint list as not yet in apicity", () => {
    expect(formatEndpoints([])).toBe("not yet in apicity");
  });
});

describe("frontier generated registry", () => {
  it("keeps data.ts equal to a fresh render and FRONTIER equal to the JSON", async () => {
    const rendered = await renderFrontierModule();
    expect(readFileSync(FRONTIER_DATA_PATH, "utf8")).toBe(rendered);
    expect(rendered).toContain("Generated by pnpm run gen:frontier");
    expect(rendered).toContain("Do not edit");

    const { snapshot, endpointMap } = i2vFiles();
    expect(FRONTIER.i2v.entries.map((entry) => entry.model)).toEqual(
      snapshot.entries.map((entry) => entry.model)
    );
    for (const entry of FRONTIER.i2v.entries) {
      expect(entry.endpoints).toEqual(endpointMap[entry.model]);
    }
    expect(FRONTIER.t2i.entries).toEqual([]);
    expect(FRONTIER.r2v.entries).toEqual([]);

    const rows = frontier("i2v");
    expect([...new Set(rows.map((row) => row.model))]).toEqual(
      I2V_SEED.map((row) => row[1])
    );
    expect(frontier("image-to-video")).toEqual(rows);
    expect(frontierType("image-editing")).toBe("i2i");
    expect(frontierType("nope")).toBeUndefined();
    expect(() => frontier("nope")).toThrow(RangeError);
    expect(() => frontier("nope")).toThrow(/t2i, i2i, t2v, i2v, v2v, r2v/);

    const model = loadFrontierModel();
    expect(model.frontier.i2v.entries).toEqual(FRONTIER.i2v.entries);
  });

  it("keeps docs/frontier.md equal to a fresh render", async () => {
    const rendered = await renderFrontierDocument();
    const doc = readFileSync(DOCS_PATH, "utf8");
    expect(doc).toBe(rendered);
    expect(doc).toContain("Coverage policy (2026-10-22)");
    expect(doc).toContain(
      "reference-to-video is derived because no leaderboard"
    );
    expect(doc).toContain("leaderboard\nexists.");
    expect(doc).toContain("image-to-video),\ncaptured 2026-10-22");
    expect(doc).not.toMatch(/^, captured /m);
    expect(doc).toContain("no data yet");
    expect(doc).toContain("fal `minimax.h3.imageToVideo`");
    expect(doc).toContain("kie `minimax-h3/image-to-video`");
    expect(doc).toContain("## Refresh");
  });

  it("points the root README at the doc and drops the old table", () => {
    const readme = readFileSync(path.join(repoRoot, "README.md"), "utf8");
    const features = readme.indexOf("## Features");
    const section = readme.indexOf("## Frontier models");
    const example = readme.indexOf("\n## Example\n");
    expect(features).toBeGreaterThan(-1);
    expect(section).toBeGreaterThan(features);
    expect(example).toBeGreaterThan(section);
    expect(readme).toContain("apicity frontier");
    expect(readme).toContain('import { frontier } from "@apicity/cost"');
    expect(readme).toContain("docs/frontier.md");
    expect(readme).not.toContain("frontier-models:");
    expect(readme).not.toContain("| Rank |");
    expect(readme).not.toContain("Frontier image-to-video models");
  });

  it("does not download the leaderboard from authored code", () => {
    const authored = [
      ...listFiles(path.join(repoRoot, "scripts/lib")).filter((file) =>
        file.endsWith(".mjs")
      ),
      path.join(repoRoot, "scripts/gen-frontier.mjs"),
      path.join(repoRoot, "packages/provider/cost/src/frontier/index.ts"),
    ];
    for (const file of authored) {
      const text = readFileSync(file, "utf8");
      expect(text, file).not.toMatch(/\bfetch\s*\(/);
      expect(text, file).not.toContain("node:http");
      expect(text, file).not.toContain("artificialanalysis.ai");
    }

    const docGen = readFileSync(
      path.join(repoRoot, "scripts/doc-gen.mjs"),
      "utf8"
    );
    const docGenCode = withoutFences(docGen);
    expect(docGenCode).toContain("syncFrontierDoc");
    expect(docGenCode).not.toMatch(/\bfetch\s*\(/);
    expect(docGenCode).not.toContain("node:http");
    expect(docGen).not.toContain("artificialanalysis.ai");
    expect(docGen).toContain(
      'import { syncFrontierDoc } from "./lib/frontier-models.mjs"'
    );
    expect(docGen).toContain("syncFrontierDoc({ check })");

    const data = readFileSync(FRONTIER_DATA_PATH, "utf8");
    expect(data).not.toMatch(/\bfetch\s*\(/);
    expect(data).not.toContain("node:http");
    expect(readFileSync(ENDPOINT_DOCS_PATH, "utf8")).not.toContain(
      "artificialanalysis.ai"
    );
    const frontierDir = path.join(repoRoot, "scripts/frontier");
    for (const file of listFiles(frontierDir)) {
      const text = readFileSync(file, "utf8");
      const isSnapshot =
        file.endsWith("leaderboard.json") || file.endsWith("catalog.json");
      if (isSnapshot) {
        expect(text).toContain("artificialanalysis.ai");
      } else {
        expect(text, file).not.toContain("artificialanalysis.ai");
      }
    }
  });
});
