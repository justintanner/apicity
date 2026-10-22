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

/** Image inputs on a KIE image model. Size and count fields are not inputs. */
const KIE_IMAGE_INPUT_FIELDS = [
  "image",
  "image_input",
  "image_url",
  "image_urls",
  "input_urls",
  "reference_image_urls",
] as const;

const T2I_SEED: ReadonlyArray<readonly [number, string, string, number]> = [
  [1, "GPT Image 2.5 Sunburst (max)", "OpenAI", 1222],
  [2, "GPT Image 2.5 Flare (max)", "OpenAI", 1207],
  [3, "GPT Image 2 (high)", "OpenAI", 1186],
  [4, "Nano Banana 2.1", "Google", 1176],
  [5, "MAI-Image-2.6", "Microsoft AI", 1166],
  [6, "Grok Imagine Image 2.0", "SpaceXAI", 1166],
  [7, "Nano Banana 2 (Gemini 3.1 Flash Image)", "Google", 1140],
  [8, "Muse Image", "Meta", 1127],
  [9, "GPT Image 1.5 (high)", "OpenAI", 1123],
  [10, "MAI-Image-2.6-Flash", "Microsoft AI", 1119],
];

const I2I_SEED: ReadonlyArray<readonly [number, string, string, number]> = [
  [1, "GPT Image 2.5 Sunburst (max)", "OpenAI", 1200],
  [2, "GPT Image 2.5 Flare (max)", "OpenAI", 1183],
  [3, "MAI-Image-2.6", "Microsoft AI", 1153],
  [4, "Nano Banana 2.1", "Google", 1152],
  [5, "Krea 3 (Ultra)", "Krea", 1152],
  [6, "MAI-Image-2.6-Flash", "Microsoft AI", 1144],
  [7, "GPT Image 2 (high)", "OpenAI", 1137],
  [8, "Seedream 5.0 Pro", "ByteDance Seed", 1132],
  [9, "Muse Image", "Meta", 1131],
  [10, "MAI-Image-2.5", "Microsoft AI", 1128],
];

const T2I_UNMAPPED = ["MAI-Image-2.6", "MAI-Image-2.6-Flash"];
const I2I_UNMAPPED = ["MAI-Image-2.6", "Krea 3 (Ultra)", "MAI-Image-2.6-Flash"];

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

function readGoogleFlowImageModels(source: string): string[] {
  const match = source.match(
    /export const GoogleFlowImagesRequestSchema = z[\s\S]*?model: z\s*\.enum\(\[([\s\S]*?)\]\)/
  );
  if (!match?.[1]) throw new Error("missing googleflow image model enum");
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

/**
 * A KIE image id is edit-only when it cannot run from a prompt alone: a
 * required image input, or a name that is an edit / image-to-image operation.
 * An optional image field keeps the id in both registries.
 */
function isKieEditOnly(
  id: string,
  imageFields: ReadonlyArray<readonly [string, { required?: boolean }]>
): boolean {
  if (imageFields.some(([, field]) => field.required === true)) return true;
  return (
    id.includes("image-to-image") ||
    id.includes("image-edit") ||
    id.endsWith("/edit") ||
    id.endsWith("-edit")
  );
}

function kieImageTaskModels(): { t2i: Set<string>; i2i: Set<string> } {
  const t2i = new Set<string>();
  const i2i = new Set<string>();
  for (const [id, schema] of Object.entries(modelInputSchemas)) {
    if (schema.type !== "image") continue;
    const imageFields = Object.entries(schema.fields).filter(([name]) =>
      (KIE_IMAGE_INPUT_FIELDS as readonly string[]).includes(name)
    );
    if (!isKieEditOnly(id, imageFields)) t2i.add(id);
    if (imageFields.length > 0) i2i.add(id);
  }
  return { t2i, i2i };
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
  const kieImage = kieImageTaskModels();
  const googleflowVideos = new Set(
    readConstArray(googleflowZod, "VIDEOS_ENUMERATED_MODELS")
  );
  const googleflowImages = new Set(readGoogleFlowImageModels(googleflowZod));
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
    if (type === "t2i" || type === "i2i") {
      if (entry.modelId === undefined) return false;
      if (
        entry.provider === "kie" &&
        entry.dotPath === "api.v1.jobs.createTask"
      ) {
        const ids = type === "t2i" ? kieImage.t2i : kieImage.i2i;
        return ids.has(entry.modelId);
      }
      if (entry.provider === "googleflow" && entry.dotPath === "v1.images") {
        return googleflowImages.has(entry.modelId);
      }
      return false;
    }
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

function frontierFiles(type: string) {
  const dir = path.join(repoRoot, "scripts/frontier", type);
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
  const { snapshot, endpointMap } = frontierFiles("i2v");

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
    expect(textCarriesTypeKeyword("t2i", "nanoBanana2.textToImage")).toBe(true);
    expect(textCarriesTypeKeyword("t2i", "gptImage1p5")).toBe(false);
    expect(textCarriesTypeKeyword("i2i", "models.edit")).toBe(true);
    expect(textCarriesTypeKeyword("i2i", "microsoft.maiImage2p5Pro.edit")).toBe(
      true
    );
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

function unmappedNames(endpointMap: Record<string, unknown[]>): string[] {
  return Object.entries(endpointMap)
    .filter(([, list]) => Array.isArray(list) && list.length === 0)
    .map(([model]) => model);
}

function mappedCount(endpointMap: Record<string, unknown[]>): number {
  return Object.values(endpointMap).filter(
    (list) => Array.isArray(list) && list.length > 0
  ).length;
}

describe("frontier image snapshots", () => {
  const t2i = frontierFiles("t2i");
  const i2i = frontierFiles("i2i");

  it("commits the AA-Image-T2I v2.1 top 10 verbatim", () => {
    expect(t2i.snapshot.leaderboardId).toBe("AA-Image-T2I v2.1");
    expect(t2i.snapshot.sourceUrl).toBe(
      "https://artificialanalysis.ai/image/leaderboard/text-to-image"
    );
    expect(t2i.snapshot.capturedOn).toBe("2026-10-22");
    expect(t2i.snapshot.methodology).toBe(
      "Models are ranked using an Elo rating system derived from blind comparisons judged by our validated private evaluators."
    );
    expect(
      t2i.snapshot.entries.map((entry) => [
        entry.rank,
        entry.model,
        entry.creator,
        entry.elo,
      ])
    ).toEqual(T2I_SEED.map((row) => [...row]));
    expect(snapshotProblems(t2i.snapshot)).toEqual([]);
    expect(unmappedNames(t2i.endpointMap)).toEqual(T2I_UNMAPPED);
    expect(mappedCount(t2i.endpointMap)).toBe(8);
    expect(Object.keys(t2i.endpointMap)).toHaveLength(10);
  });

  it("commits the AA-Image-Editing v2.1 top 10 verbatim", () => {
    expect(i2i.snapshot.leaderboardId).toBe("AA-Image-Editing v2.1");
    expect(i2i.snapshot.sourceUrl).toBe(
      "https://artificialanalysis.ai/image/leaderboard/editing"
    );
    expect(i2i.snapshot.capturedOn).toBe("2026-10-22");
    expect(i2i.snapshot.methodology).toBe(
      "Ranks image models on editing an image from a text instruction, by Elo from pairwise human preference votes."
    );
    expect(
      i2i.snapshot.entries.map((entry) => [
        entry.rank,
        entry.model,
        entry.creator,
        entry.elo,
      ])
    ).toEqual(I2I_SEED.map((row) => [...row]));
    expect(snapshotProblems(i2i.snapshot)).toEqual([]);
    expect(unmappedNames(i2i.endpointMap)).toEqual(I2I_UNMAPPED);
    expect(mappedCount(i2i.endpointMap)).toBe(7);
    expect(Object.keys(i2i.endpointMap)).toHaveLength(10);
  });

  it("keeps text-to-image ids out of the edit-only registry", () => {
    const { t2i: text, i2i: edit } = kieImageTaskModels();
    expect(text.has("nano-banana-2-1")).toBe(true);
    expect(edit.has("nano-banana-2-1")).toBe(true);
    expect(text.has("gpt-image-2-text-to-image")).toBe(true);
    expect(edit.has("gpt-image-2-text-to-image")).toBe(false);
    expect(text.has("gpt-image-2-image-to-image")).toBe(false);
    expect(edit.has("gpt-image-2-image-to-image")).toBe(true);
    expect(text.has("grok-imagine-image-2-0/image-edit")).toBe(false);
    expect(edit.has("grok-imagine-image-2-0/text-to-image")).toBe(false);
    expect(edit.has("seedream/5-pro-image-to-image")).toBe(true);
    expect(text.has("seedream/5-pro-text-to-image")).toBe(true);
  });

  it("resolves every mapped t2i and i2i endpoint", () => {
    expect(resolutionProblems("t2i", t2i.endpointMap, liveRegistry())).toEqual(
      []
    );
    expect(resolutionProblems("i2i", i2i.endpointMap, liveRegistry())).toEqual(
      []
    );
  });

  it("refuses an edit-only id on t2i and a text-only id on i2i", () => {
    const ctx = liveRegistry();
    const kie = {
      provider: "kie",
      dotPath: "api.v1.jobs.createTask",
    };
    expect(
      resolutionProblems(
        "t2i",
        {
          Demo: [{ ...kie, modelId: "gpt-image-2-image-to-image" }],
        },
        ctx
      ).some((problem) => problem.includes("t2i model registry"))
    ).toBe(true);
    expect(
      resolutionProblems(
        "i2i",
        {
          Demo: [{ ...kie, modelId: "gpt-image-2-text-to-image" }],
        },
        ctx
      ).some((problem) => problem.includes("i2i model registry"))
    ).toBe(true);
    expect(
      resolutionProblems(
        "t2i",
        {
          Demo: [
            {
              provider: "googleflow",
              dotPath: "v1.images",
              modelId: "nano-banana-2.1",
            },
          ],
        },
        ctx
      ).some((problem) => problem.includes("t2i model registry"))
    ).toBe(true);
  });

  it("maps GPT Image 1.5 through the KIE text-to-image id", () => {
    expect(t2i.endpointMap["GPT Image 1.5 (high)"]).toEqual([
      {
        provider: "kie",
        dotPath: "api.v1.jobs.createTask",
        modelId: "gpt-image/1.5-text-to-image",
      },
    ]);
  });
});

describe("frontier generated registry", () => {
  it("keeps data.ts equal to a fresh render and FRONTIER equal to the JSON", async () => {
    const rendered = await renderFrontierModule();
    expect(readFileSync(FRONTIER_DATA_PATH, "utf8")).toBe(rendered);
    expect(rendered).toContain("Generated by pnpm run gen:frontier");
    expect(rendered).toContain("Do not edit");

    const { snapshot, endpointMap } = frontierFiles("i2v");
    expect(FRONTIER.i2v.entries.map((entry) => entry.model)).toEqual(
      snapshot.entries.map((entry) => entry.model)
    );
    for (const entry of FRONTIER.i2v.entries) {
      expect(entry.endpoints).toEqual(endpointMap[entry.model]);
    }
    for (const type of ["t2i", "i2i"] as const) {
      const files = frontierFiles(type);
      expect(FRONTIER[type].entries.map((entry) => entry.model)).toEqual(
        files.snapshot.entries.map((entry) => entry.model)
      );
      for (const entry of FRONTIER[type].entries) {
        expect(entry.endpoints).toEqual(files.endpointMap[entry.model]);
      }
    }
    expect(FRONTIER.t2v.entries).toEqual([]);
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
    expect(doc).toContain("text-to-image),\ncaptured 2026-10-22");
    expect(doc).toContain("editing),\ncaptured 2026-10-22");
    expect(doc).toContain("not yet in apicity");
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
