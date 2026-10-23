/**
 * The frontier registry is a committed leaderboard snapshot, one directory
 * per task type. Mapped endpoints have to keep resolving, every board is
 * pinned, the derived r2v list has to match its sources, and the generated
 * registry and docs/frontier.md have to match a fresh render. Nothing here
 * contacts the network.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  FRONTIER,
  PRICING,
  PRICING_AS_OF,
  frontier,
  frontierType,
} from "@apicity/cost";
import { createFal } from "@apicity/fal";
import { GoogleFlowVideosRequestSchema } from "@apicity/googleflow/zod";
import { VeoGenerateRequestSchema } from "@apicity/kie/zod";
import { MACHGEN_VIDEO_MODEL_TASK_TYPES } from "@apicity/machgen";
import {
  XAI_GROK_IMAGINE_VIDEO,
  XAI_GROK_IMAGINE_VIDEO_1_5,
  XaiVideoGenerateRequestSchema,
} from "@apicity/xai/zod";
import { resolveEndpointFn } from "../../packages/cli/src/registry";
import {
  zodToJsonSchema,
  type JsonSchema,
} from "../../packages/cli/src/schema";
import {
  formatFrontierPrice,
  formatFrontierRate,
  frontierPrice,
} from "../../packages/provider/cost/src/frontier/price";
import { FAL_DYNAMIC_PRICING_ENDPOINTS } from "../../packages/provider/cost/src/pricing/fal";
import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";
import {
  DOCS_PATH,
  ENDPOINT_DOCS_PATH,
  FRONTIER_DATA_PATH,
  TYPE_KEYWORDS,
  catalogProblems,
  derivedProblems,
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

const T2V_SEED: ReadonlyArray<readonly [number, string, string, number]> = [
  [1, "Wan 3.0", "Alibaba", 1175],
  [2, "Utopai X", "Utopai Studios", 1167],
  [3, "HeyGen Video (ultraquality)", "HeyGen", 1160],
  [4, "MiniMax H3 (768p)", "MiniMax", 1158],
  [5, "Dreamina Seedance 2.5", "ByteDance Seed", 1158],
  [6, "FLUX 3 Max (720p)", "Black Forest Labs", 1155],
  [7, "MiniMax H3 Max", "MiniMax", 1154],
  [8, "FLUX 3", "Black Forest Labs", 1145],
  [9, "Dreamina Seedance 2.0", "ByteDance Seed", 1136],
  [10, "Gemini Omni Flash 1.1", "Google", 1130],
];

/** The video-editing board has nine models, so all nine are listed. */
const V2V_SEED: ReadonlyArray<readonly [number, string, string, number]> = [
  [1, "Wan 3.0", "Alibaba", 1198],
  [2, "Dreamina Seedance 2.5", "ByteDance Seed", 1155],
  [3, "Gemini Omni Flash 1.1", "Google", 1148],
  [4, "MiniMax H3 (768p)", "MiniMax", 1124],
  [5, "HappyHorse-1.0", "Alibaba-ATH", 1090],
  [6, "Dreamina Seedance 2.0", "ByteDance Seed", 1082],
  [7, "Wan 2.7", "Alibaba", 1077],
  [8, "Aleph 2.0", "Runway", 1012],
  [9, "Kling 3.0 Omni 1080p (Pro)", "KlingAI", 1000],
];

/** Derived: each Elo is the better of the model's t2v and i2v Elos. */
const R2V_SEED: ReadonlyArray<readonly [number, string, string, number]> = [
  [1, "Wan 3.0", "Alibaba", 1175],
  [2, "HeyGen Video (ultraquality)", "HeyGen", 1160],
  [3, "MiniMax H3 (768p)", "MiniMax", 1158],
  [4, "Dreamina Seedance 2.5", "ByteDance Seed", 1158],
  [5, "MiniMax H3 Max", "MiniMax", 1154],
  [6, "Dreamina Seedance 2.0", "ByteDance Seed", 1136],
  [7, "Gemini Omni Flash 1.1", "Google", 1132],
  [8, "Grok Imagine Video 1.5", "SpaceXAI", 1067],
  [9, "HappyHorse-1.1", "Alibaba", 1061],
];

const T2V_UNMAPPED = ["Utopai X"];
const V2V_UNMAPPED = [
  "Wan 3.0",
  "MiniMax H3 (768p)",
  "Dreamina Seedance 2.0",
  "Aleph 2.0",
];

/** t2v and i2v top-10 models with no reference-to-video endpoint. */
const R2V_LEFT_OUT = ["Utopai X", "FLUX 3 Max (720p)", "FLUX 3"];

/** KIE field names that carry media rather than a setting. */
const KIE_MEDIA_FIELD =
  /(_url|_urls|_list|_ids|_references|task_id)$|^reference_/;

/** KIE fields that take a source or reference video. */
const KIE_VIDEO_INPUT_FIELDS = [
  "video_url",
  "video_urls",
  "video_list",
  "reference_video",
  "reference_video_urls",
] as const;

/** A KIE id named for an image or reference operation is not text-to-video. */
const KIE_NOT_TEXT_TO_VIDEO = /image-to-video|reference-to-video|r2v/;

/** Extend, reframe, upscale, lip-sync and motion transfer are not edits. */
const KIE_NOT_AN_EDIT =
  /extend|reframe|upscale|lip-sync|motion-control|animate/;

const ALIBABA_VIDEO_SYNTHESIS =
  "api.v1.services.aigc.videoGeneration.videoSynthesis";

/** MachGen task types per frontier type. It has no image or V2V task type. */
const MACHGEN_TASK: Readonly<Record<string, string>> = {
  t2v: "T2V",
  i2v: "I2V",
  r2v: "R2V",
};

/** The MachGen model ids per frontier model, one shared generate call. */
const MACHGEN_IDS: Readonly<Record<string, string>> = {
  "MiniMax H3 (768p)": "MiniMax-H3",
  "Dreamina Seedance 2.5": "Seedance-2.5",
  "Wan 3.0": "Alibaba-Wan-3.0",
  "Dreamina Seedance 2.0": "Seedance-2.0",
  "Grok Imagine Video 1.5": "Grok-Imagine-Video-1.5",
  "HappyHorse-1.1": "HappyHorse-1.1",
};

/** True when MachGen lists the frontier type's task for this model id. */
function machgenHas(type: string, modelId: string): boolean {
  const tasks: Readonly<Record<string, readonly string[]>> =
    MACHGEN_VIDEO_MODEL_TASK_TYPES;
  const task = MACHGEN_TASK[type];
  return task !== undefined && (tasks[modelId] ?? []).includes(task);
}

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

/**
 * KIE video ids per type. A t2v id runs from a prompt alone: no required
 * media and no image or reference operation in its name. A v2v id takes a
 * video and is not an extend, reframe, upscale, lip-sync or motion transfer.
 * An r2v id takes a reference: a field named for one or described as one.
 */
function kieVideoTaskModels(): Record<"t2v" | "v2v" | "r2v", Set<string>> {
  const registry = {
    t2v: new Set<string>(),
    v2v: new Set<string>(),
    r2v: new Set<string>(),
  };
  for (const [id, schema] of Object.entries(modelInputSchemas)) {
    if (schema.type !== "video") continue;
    const fields = Object.entries(schema.fields);
    const needsMedia = fields.some(
      ([name, field]) => field.required === true && KIE_MEDIA_FIELD.test(name)
    );
    if (!needsMedia && !KIE_NOT_TEXT_TO_VIDEO.test(id)) registry.t2v.add(id);
    const takesVideo = fields.some(([name]) =>
      (KIE_VIDEO_INPUT_FIELDS as readonly string[]).includes(name)
    );
    if (takesVideo && !KIE_NOT_AN_EDIT.test(id)) registry.v2v.add(id);
    const takesReference = fields.some(
      ([name, field]) =>
        name.startsWith("reference_") ||
        name.endsWith("_references") ||
        /^reference\b/i.test(field.description ?? "")
    );
    if (takesReference) registry.r2v.add(id);
  }
  return registry;
}

/**
 * Google Flow models whose POST /videos branch declares a reference image
 * slot (R2V) or a source video slot (the Omni Flash V2V edit).
 */
function googleflowVideoModes(): Record<"r2v" | "v2v", Set<string>> {
  const schema = zodToJsonSchema(GoogleFlowVideosRequestSchema);
  const modes = { r2v: new Set<string>(), v2v: new Set<string>() };
  for (const branch of (schema.anyOf ?? []) as JsonSchema[]) {
    const properties = (branch.properties ?? {}) as Record<string, JsonSchema>;
    const model = properties.model?.const;
    if (typeof model !== "string") continue;
    if ("referenceImage_1" in properties) modes.r2v.add(model);
    if ("referenceVideo_1" in properties) modes.v2v.add(model);
  }
  return modes;
}

/**
 * A fal leaf documents a video edit when the request schema `apicity
 * describe` prints takes a source video and says "edit": an edit leaf, or a
 * task mode such as Seedance 2.5's `task: "editing"`.
 */
function falLeafEditsVideo(
  fal: Record<string, unknown>,
  dotPath: string
): boolean {
  const schema = resolveEndpointFn(fal, "POST", dotPath)?.schema;
  if (schema === undefined) return false;
  const json = zodToJsonSchema(schema);
  const inputs = Object.keys((json.properties ?? {}) as JsonSchema);
  return (
    inputs.some((name) => /^(video_urls?|reference_video_urls)$/.test(name)) &&
    /\bedit/i.test(JSON.stringify(json))
  );
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
  const kieVideo = kieVideoTaskModels();
  const googleflowVideos = new Set(
    readConstArray(googleflowZod, "VIDEOS_ENUMERATED_MODELS")
  );
  const googleflowModes = googleflowVideoModes();
  const googleflowImages = new Set(readGoogleFlowImageModels(googleflowZod));
  const alibabaModels = readConstArray(
    alibabaZod,
    "WAN_VIDEO_SYNTHESIS_MODELS"
  );
  const alibabaVideo = new Set(
    alibabaModels.filter((model) => model.includes("i2v"))
  );
  const alibabaVideoEdit = new Set(
    alibabaModels.filter((model) => model.includes("videoedit"))
  );
  const xaiReferenceVideo = new Set(
    [XAI_GROK_IMAGINE_VIDEO, XAI_GROK_IMAGINE_VIDEO_1_5].filter(
      (model) =>
        XaiVideoGenerateRequestSchema.safeParse({
          model,
          prompt: "frontier",
          reference_images: [{ url: "https://example.com/reference.png" }],
        }).success
    )
  );
  const fal = createFal({ apiKey: "frontier" }) as unknown as Record<
    string,
    unknown
  >;
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
    if (entry.provider === "machgen" && entry.dotPath === "api.v0.generate") {
      return entry.modelId !== undefined && machgenHas(type, entry.modelId);
    }
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
    if (type === "t2v" || type === "v2v" || type === "r2v") {
      if (entry.modelId === undefined) return false;
      if (
        entry.provider === "kie" &&
        entry.dotPath === "api.v1.jobs.createTask"
      ) {
        return kieVideo[type].has(entry.modelId);
      }
      if (entry.provider === "googleflow" && entry.dotPath === "v1.videos") {
        const ids = type === "t2v" ? googleflowVideos : googleflowModes[type];
        return ids.has(entry.modelId);
      }
      if (
        entry.provider === "alibaba" &&
        entry.dotPath === ALIBABA_VIDEO_SYNTHESIS
      ) {
        return type === "v2v" && alibabaVideoEdit.has(entry.modelId);
      }
      if (
        entry.provider === "xai" &&
        entry.dotPath === "v1.videos.generations"
      ) {
        return type === "r2v" && xaiReferenceVideo.has(entry.modelId);
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
      entry.dotPath === ALIBABA_VIDEO_SYNTHESIS
    ) {
      return alibabaVideo.has(entry.modelId);
    }
    return false;
  };
  const leafDocuments = (
    type: string,
    entry: { provider: string; dotPath: string }
  ) =>
    type === "v2v" &&
    entry.provider === "fal" &&
    falLeafEditsVideo(fal, entry.dotPath);
  return {
    docsRows: loadEndpointDocRows(),
    sourceHasUrl,
    registryHas,
    leafDocuments,
  };
}

interface EndpointRecord {
  provider: string;
  dotPath: string;
  modelId?: string;
  pricingKey?: string;
}

function frontierFiles(type: string) {
  const dir = path.join(repoRoot, "scripts/frontier", type);
  return {
    snapshot: JSON.parse(
      readFileSync(path.join(dir, "leaderboard.json"), "utf8")
    ) as {
      leaderboardId?: string;
      derived?: boolean;
      sources?: string[];
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
    ) as Record<string, EndpointRecord[]>,
  };
}

type VideoType = "t2v" | "i2v" | "r2v";

/** The leaf name and KIE id suffix of each video operation. */
const VIDEO_OPERATION: Record<VideoType, { leaf: string; kie: string }> = {
  t2v: { leaf: "textToVideo", kie: "/text-to-video" },
  i2v: { leaf: "imageToVideo", kie: "/image-to-video" },
  r2v: { leaf: "referenceToVideo", kie: "/reference-to-video" },
};

function endpointLabel(entry: EndpointRecord): string {
  return `${entry.provider} ${entry.modelId ?? entry.dotPath}`;
}

/**
 * The `to` endpoint a `from` endpoint implies for the same model: the
 * sibling leaf or KIE id of the other operation, or the same shared callable
 * when its model id is in the `to` registry.
 */
function impliedEndpoint(
  entry: EndpointRecord,
  from: VideoType,
  to: VideoType,
  ctx: ReturnType<typeof liveRegistry>
): EndpointRecord | undefined {
  if (entry.modelId === undefined) {
    const segments = entry.dotPath.split(".");
    if (segments[segments.length - 1] !== VIDEO_OPERATION[from].leaf) {
      return undefined;
    }
    const dotPath = [...segments.slice(0, -1), VIDEO_OPERATION[to].leaf].join(
      "."
    );
    const listed = ctx.docsRows.some(
      (row) =>
        row.provider === entry.provider &&
        row.dotPath === dotPath &&
        row.method === "POST"
    );
    return listed ? { provider: entry.provider, dotPath } : undefined;
  }
  const suffix = VIDEO_OPERATION[from].kie;
  if (entry.modelId.endsWith(suffix)) {
    const modelId =
      entry.modelId.slice(0, -suffix.length) + VIDEO_OPERATION[to].kie;
    return Object.prototype.hasOwnProperty.call(modelInputSchemas, modelId)
      ? { ...entry, modelId }
      : undefined;
  }
  if (entry.modelId.endsWith("-to-video")) return undefined;
  return ctx.registryHas(to, entry) ? entry : undefined;
}

/**
 * Endpoints one video type implies for another and the map leaves out. A
 * model off a board is simply unranked there, but r2v is derived: a t2v or
 * i2v model that implies an r2v endpoint belongs on it.
 */
function crossTypeProblems(
  maps: Record<VideoType, Record<string, EndpointRecord[]>>,
  ctx: ReturnType<typeof liveRegistry>
): string[] {
  const problems: string[] = [];
  const types: VideoType[] = ["t2v", "i2v", "r2v"];
  for (const from of types) {
    for (const to of types) {
      if (from === to) continue;
      for (const [model, list] of Object.entries(maps[from])) {
        const target = maps[to][model];
        if (target === undefined && to !== "r2v") continue;
        for (const entry of list) {
          const implied = impliedEndpoint(entry, from, to, ctx);
          if (implied === undefined) continue;
          const listed = (target ?? []).some(
            (candidate) =>
              candidate.provider === implied.provider &&
              candidate.dotPath === implied.dotPath &&
              candidate.modelId === implied.modelId
          );
          if (!listed) {
            problems.push(
              `${model}: ${from} ${endpointLabel(entry)} implies ${to} ${endpointLabel(implied)}`
            );
          }
        }
      }
    }
  }
  return problems;
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

function seedRows(snapshot: {
  entries: Array<{ rank: number; model: string; creator: string; elo: number }>;
}) {
  return snapshot.entries.map((entry) => [
    entry.rank,
    entry.model,
    entry.creator,
    entry.elo,
  ]);
}

describe("frontier video snapshots", () => {
  const t2v = frontierFiles("t2v");
  const i2v = frontierFiles("i2v");
  const v2v = frontierFiles("v2v");
  const r2v = frontierFiles("r2v");
  const kie = { provider: "kie", dotPath: "api.v1.jobs.createTask" };
  /** The boards r2v re-ranks, in the order its snapshot names them. */
  const sources = [t2v.snapshot, i2v.snapshot].map((snapshot) => ({
    leaderboardId: snapshot.leaderboardId ?? "",
    entries: snapshot.entries,
  }));

  it("commits the AA-Video-T2V v2.1 top 10 verbatim", () => {
    expect(t2v.snapshot.leaderboardId).toBe("AA-Video-T2V v2.1");
    expect(t2v.snapshot.sourceUrl).toBe(
      "https://artificialanalysis.ai/video/leaderboard/text-to-video"
    );
    expect(t2v.snapshot.capturedOn).toBe("2026-10-22");
    expect(t2v.snapshot.methodology).toBe(
      "Elo from blind comparisons by validated private evaluators."
    );
    expect(seedRows(t2v.snapshot)).toEqual(T2V_SEED.map((row) => [...row]));
    expect(snapshotProblems(t2v.snapshot)).toEqual([]);
    expect(unmappedNames(t2v.endpointMap)).toEqual(T2V_UNMAPPED);
    expect(mappedCount(t2v.endpointMap)).toBe(9);
    expect(Object.keys(t2v.endpointMap)).toHaveLength(10);
  });

  it("commits all nine AA-Video-Editing v1.1 models verbatim", () => {
    expect(v2v.snapshot.leaderboardId).toBe("AA-Video-Editing v1.1");
    expect(v2v.snapshot.sourceUrl).toBe(
      "https://artificialanalysis.ai/video/leaderboard/video-editing"
    );
    expect(v2v.snapshot.capturedOn).toBe("2026-10-22");
    expect(v2v.snapshot.methodology).toBe(
      "Ranks video models on editing a video from a text instruction, audio kept, by Elo from pairwise human preference votes."
    );
    expect(seedRows(v2v.snapshot)).toEqual(V2V_SEED.map((row) => [...row]));
    expect(snapshotProblems(v2v.snapshot)).toEqual([]);
    expect(unmappedNames(v2v.endpointMap)).toEqual(V2V_UNMAPPED);
    expect(mappedCount(v2v.endpointMap)).toBe(5);
    expect(Object.keys(v2v.endpointMap)).toHaveLength(9);
  });

  it("derives r2v from the t2v and i2v top 10", () => {
    expect(r2v.snapshot.derived).toBe(true);
    expect(r2v.snapshot.sources).toEqual([
      "AA-Video-T2V v2.1",
      "AA-Video-I2V v1.1",
    ]);
    expect(r2v.snapshot).not.toHaveProperty("leaderboardId");
    expect(r2v.snapshot.sourceUrl).toBe(t2v.snapshot.sourceUrl);
    expect(r2v.snapshot.capturedOn).toBe("2026-10-22");
    expect(r2v.snapshot.methodology).toBe(
      "Derived: models from the text-to-video and image-to-video top 10 with a reference-to-video endpoint, ordered by the better of their two Elos; Artificial Analysis publishes no reference-to-video leaderboard."
    );
    expect(seedRows(r2v.snapshot)).toEqual(R2V_SEED.map((row) => [...row]));
    expect(snapshotProblems(r2v.snapshot)).toEqual([]);
    expect(derivedProblems(r2v.snapshot, r2v.endpointMap, sources)).toEqual([]);
    expect(unmappedNames(r2v.endpointMap)).toEqual([]);
    expect(mappedCount(r2v.endpointMap)).toBe(9);

    const ranked = [
      ...new Set([
        ...Object.keys(t2v.endpointMap),
        ...Object.keys(i2v.endpointMap),
      ]),
    ];
    expect(ranked.filter((model) => !(model in r2v.endpointMap))).toEqual(
      R2V_LEFT_OUT
    );
  });

  it("refuses a derived entry out of order, off its sources, or unmapped", () => {
    const entries = r2v.snapshot.entries;
    const problemsFor = (
      changed: Array<(typeof entries)[number]>,
      endpointMap = r2v.endpointMap
    ) =>
      derivedProblems(
        { ...r2v.snapshot, entries: changed },
        endpointMap,
        sources
      );

    const swapped = [entries[2], entries[1], ...entries.slice(3)];
    expect(
      problemsFor([entries[0], ...swapped]).some((problem) =>
        problem.includes("best Elo down")
      )
    ).toBe(true);
    expect(
      problemsFor(
        entries.map((entry) =>
          entry.model === "Gemini Omni Flash 1.1"
            ? { ...entry, elo: 1130 }
            : entry
        )
      ).some((problem) => problem.includes("elo must be 1132"))
    ).toBe(true);
    expect(
      problemsFor(
        entries.map((entry) =>
          entry.model === "Dreamina Seedance 2.5"
            ? { ...entry, creator: "ByteDance" }
            : entry
        )
      ).some((problem) => problem.includes("AA-Video-T2V v2.1 gives it"))
    ).toBe(true);
    expect(
      problemsFor([
        ...entries,
        {
          rank: 9,
          model: "Kling 3.0 Omni 1080p (Pro)",
          creator: "KlingAI",
          elo: 1000,
        },
      ]).some((problem) => problem.includes("is in no source snapshot"))
    ).toBe(true);
    expect(
      problemsFor(entries, { ...r2v.endpointMap, "MiniMax H3 Max": [] }).some(
        (problem) => problem.includes("has no endpoint")
      )
    ).toBe(true);
  });

  it("refuses a derived snapshot with a leaderboardId or without sources", () => {
    expect(
      snapshotProblems({ ...r2v.snapshot, leaderboardId: "AA-Video-R2V" })
    ).toContain(
      "a derived snapshot names its sources instead of a leaderboardId"
    );
    expect(snapshotProblems({ ...r2v.snapshot, sources: [] })).toContain(
      "snapshot.sources must list the source leaderboard ids"
    );
    expect(
      snapshotProblems({ ...t2v.snapshot, sources: ["AA-Video-I2V v1.1"] })
    ).toContain("snapshot.sources belongs to a derived snapshot");
  });

  it("matches t2v, v2v and r2v leaves by their type keywords", () => {
    expect(textCarriesTypeKeyword("t2v", "minimax.h3.textToVideo")).toBe(true);
    expect(textCarriesTypeKeyword("t2v", "minimax.h3.imageToVideo")).toBe(
      false
    );
    expect(textCarriesTypeKeyword("v2v", "wan.v2p7.editVideo")).toBe(true);
    expect(
      textCarriesTypeKeyword(
        "v2v",
        "https://fal.run/fal-ai/wan/v2.7/edit-video"
      )
    ).toBe(true);
    expect(textCarriesTypeKeyword("v2v", "geminiOmniFlash.v1p1.edit")).toBe(
      false
    );
    expect(textCarriesTypeKeyword("v2v", "minimax.h3Max.extendVideo")).toBe(
      false
    );
    expect(textCarriesTypeKeyword("r2v", "minimax.h3.referenceToVideo")).toBe(
      true
    );
    expect(
      textCarriesTypeKeyword(
        "r2v",
        "https://fal.run/minimax/h3/reference-to-video"
      )
    ).toBe(true);
    expect(textCarriesTypeKeyword("r2v", "minimax.h3.imageToVideo")).toBe(
      false
    );
  });

  it("sorts KIE video ids into the t2v, v2v and r2v registries", () => {
    const { t2v: text, v2v: edit, r2v: reference } = kieVideoTaskModels();
    for (const id of [
      "wan/3-0-video",
      "minimax-h3/text-to-video",
      "bytedance/seedance-2-5",
      "google/gemini-omni-flash-1-1",
    ]) {
      expect(text.has(id), id).toBe(true);
    }
    for (const id of [
      "minimax-h3/image-to-video",
      "minimax-h3/reference-to-video",
      "grok-imagine-video-1-5-preview",
      "kling-3.0-omni/transformation",
      "bytedance/seedance-2-5-draft",
    ]) {
      expect(text.has(id), id).toBe(false);
    }
    for (const id of [
      "happyhorse/video-edit",
      "wan/2-7-videoedit",
      "kling-3.0-omni/transformation",
    ]) {
      expect(edit.has(id), id).toBe(true);
    }
    for (const id of [
      "minimax-h3/text-to-video",
      "topaz/video-upscale",
      "volcengine/video-to-video-lip-sync",
      "pixverse-v6/extend",
    ]) {
      expect(edit.has(id), id).toBe(false);
    }
    for (const id of [
      "minimax-h3/reference-to-video",
      "happyhorse-1-1/reference-to-video",
      "wan/3-0-video",
      "google/gemini-omni-flash-1-1",
    ]) {
      expect(reference.has(id), id).toBe(true);
    }
    for (const id of [
      "grok-imagine/image-to-video",
      "happyhorse-1-1/image-to-video",
      "minimax-h3/text-to-video",
    ]) {
      expect(reference.has(id), id).toBe(false);
    }
  });

  it("resolves every mapped t2v, v2v and r2v endpoint", () => {
    const ctx = liveRegistry();
    expect(resolutionProblems("t2v", t2v.endpointMap, ctx)).toEqual([]);
    expect(resolutionProblems("v2v", v2v.endpointMap, ctx)).toEqual([]);
    expect(resolutionProblems("r2v", r2v.endpointMap, ctx)).toEqual([]);
  });

  it("takes an unnamed v2v leaf only when its schema documents a video edit", () => {
    const ctx = liveRegistry();
    for (const dotPath of [
      "geminiOmniFlash.v1p1.edit",
      "bytedance.seedance2p5.referenceToVideo",
      "bytedance.seedance2p5.us.referenceToVideo",
    ]) {
      expect(ctx.leafDocuments("v2v", { provider: "fal", dotPath })).toBe(true);
    }
    for (const dotPath of [
      "bytedance.seedance2p0.referenceToVideo",
      "minimax.h3Max.extendVideo",
      "wan.v2p7.edit",
    ]) {
      expect(ctx.leafDocuments("v2v", { provider: "fal", dotPath })).toBe(
        false
      );
      expect(
        resolutionProblems("v2v", { Demo: [{ provider: "fal", dotPath }] }, ctx)
      ).toEqual([`"Demo"[0] fal ${dotPath} is not a v2v endpoint`]);
    }
    expect(
      ctx.leafDocuments("r2v", {
        provider: "fal",
        dotPath: "geminiOmniFlash.v1p1.edit",
      })
    ).toBe(false);
  });

  it("refuses an id outside each video registry", () => {
    const ctx = liveRegistry();
    const refused = (type: string, entry: EndpointRecord) =>
      resolutionProblems(type, { Demo: [entry] }, ctx).some((problem) =>
        problem.includes(`${type} model registry`)
      );
    expect(
      refused("t2v", { ...kie, modelId: "minimax-h3/image-to-video" })
    ).toBe(true);
    expect(
      refused("v2v", { ...kie, modelId: "minimax-h3/text-to-video" })
    ).toBe(true);
    expect(refused("v2v", { ...kie, modelId: "topaz/video-upscale" })).toBe(
      true
    );
    expect(
      refused("r2v", { ...kie, modelId: "grok-imagine/image-to-video" })
    ).toBe(true);
    const googleflow = { provider: "googleflow", dotPath: "v1.videos" };
    expect(refused("r2v", { ...googleflow, modelId: "veo-3.1-quality" })).toBe(
      true
    );
    expect(refused("v2v", { ...googleflow, modelId: "veo-3.1-fast" })).toBe(
      true
    );
    expect(
      refused("v2v", {
        provider: "alibaba",
        dotPath: ALIBABA_VIDEO_SYNTHESIS,
        modelId: "wan2.7-i2v",
      })
    ).toBe(true);
    expect(
      refused("r2v", {
        provider: "xai",
        dotPath: "v1.videos.generations",
        modelId: "grok-imagine-image-quality",
      })
    ).toBe(true);
  });

  it("lists MachGen through its generate call for t2v, i2v and r2v", () => {
    const machgenRows = (map: Record<string, EndpointRecord[]>) =>
      Object.fromEntries(
        Object.entries(map)
          .map(
            ([model, list]) =>
              [
                model,
                list.filter((entry) => entry.provider === "machgen"),
              ] as const
          )
          .filter(([, list]) => list.length > 0)
      );
    const expected = (models: string[]) =>
      Object.fromEntries(
        models.map((model) => [
          model,
          [
            {
              provider: "machgen",
              dotPath: "api.v0.generate",
              modelId: MACHGEN_IDS[model],
            },
          ],
        ])
      );
    expect(machgenRows(t2v.endpointMap)).toEqual(
      expected([
        "Wan 3.0",
        "MiniMax H3 (768p)",
        "Dreamina Seedance 2.5",
        "Dreamina Seedance 2.0",
      ])
    );
    expect(machgenRows(i2v.endpointMap)).toEqual(
      expected(Object.keys(MACHGEN_IDS))
    );
    expect(machgenRows(r2v.endpointMap)).toEqual(
      expected([
        "Wan 3.0",
        "MiniMax H3 (768p)",
        "Dreamina Seedance 2.5",
        "Dreamina Seedance 2.0",
        "HappyHorse-1.1",
      ])
    );
    for (const type of ["t2i", "i2i", "v2v"]) {
      expect(machgenRows(frontierFiles(type).endpointMap), type).toEqual({});
    }
  });

  it("refuses a MachGen id on a type MachGen does not run it for", () => {
    const ctx = liveRegistry();
    const refused = (type: string, modelId: string) =>
      resolutionProblems(
        type,
        {
          Demo: [{ provider: "machgen", dotPath: "api.v0.generate", modelId }],
        },
        ctx
      ).some((problem) => problem.includes(`machgen ${type} model registry`));
    expect(refused("i2v", "Grok-Imagine-Video-1.5")).toBe(false);
    expect(refused("t2v", "Grok-Imagine-Video-1.5")).toBe(true);
    expect(refused("r2v", "Grok-Imagine-Video-1.5")).toBe(true);
    for (const type of ["t2v", "i2v", "r2v"]) {
      expect(refused(type, "MiniMax-H3-Turbo"), type).toBe(true);
    }
    expect(refused("v2v", "Seedance-2.5")).toBe(true);
    expect(refused("t2i", "MiniMax-H3")).toBe(true);
  });

  it("lists the same model's endpoints across t2v, i2v and r2v", () => {
    const ctx = liveRegistry();
    const maps = {
      t2v: t2v.endpointMap,
      i2v: i2v.endpointMap,
      r2v: r2v.endpointMap,
    };
    expect(crossTypeProblems(maps, ctx)).toEqual([]);

    const withoutTwin = {
      ...maps,
      r2v: {
        ...maps.r2v,
        "Dreamina Seedance 2.0": maps.r2v["Dreamina Seedance 2.0"].filter(
          (entry) => !entry.dotPath.includes(".us.")
        ),
      },
    };
    expect(crossTypeProblems(withoutTwin, ctx)).toContain(
      "Dreamina Seedance 2.0: t2v fal bytedance.seedance2p0.us.textToVideo implies r2v fal bytedance.seedance2p0.us.referenceToVideo"
    );
    const withoutModel = { ...maps, r2v: { ...maps.r2v } };
    delete withoutModel.r2v["HappyHorse-1.1"];
    expect(crossTypeProblems(withoutModel, ctx)).toContain(
      "HappyHorse-1.1: i2v kie happyhorse-1-1/image-to-video implies r2v kie happyhorse-1-1/reference-to-video"
    );
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
    for (const type of ["t2i", "i2i", "t2v", "v2v", "r2v"] as const) {
      const files = frontierFiles(type);
      expect(FRONTIER[type].entries.map((entry) => entry.model)).toEqual(
        files.snapshot.entries.map((entry) => entry.model)
      );
      for (const entry of FRONTIER[type].entries) {
        expect(entry.endpoints).toEqual(files.endpointMap[entry.model]);
      }
    }
    expect(FRONTIER.r2v).toMatchObject({
      leaderboardId: "",
      sourceUrl:
        "https://artificialanalysis.ai/video/leaderboard/text-to-video",
      capturedOn: "2026-10-22",
    });
    expect(frontier("video-editing")).toEqual(frontier("v2v"));
    expect(
      frontier("v2v", { provider: "googleflow" }).map((row) => row.model)
    ).toEqual(["Gemini Omni Flash 1.1"]);
    expect([...new Set(frontier("r2v").map((row) => row.model))]).toEqual(
      R2V_SEED.map((row) => row[1])
    );

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
    expect(doc).toContain("text-to-video),\ncaptured 2026-10-22");
    expect(doc).toContain("video-editing),\ncaptured 2026-10-22");
    expect(doc).toContain("not yet in apicity");
    expect(doc).not.toMatch(/^, captured /m);
    expect(doc).not.toContain("no data yet");
    for (const heading of [
      "## text-to-image (`t2i`)",
      "## image-to-image (`i2i`)",
      "## text-to-video (`t2v`)",
      "## image-to-video (`i2v`)",
      "## video-to-video (`v2v`)",
      "## reference-to-video (`r2v`)",
    ]) {
      expect(doc).toContain(heading);
    }
    const derived = doc.slice(doc.indexOf("## reference-to-video"));
    expect(derived).toContain(
      "[AA-Video-T2V v2.1](https://artificialanalysis.ai/video/leaderboard/text-to-video)\nand\n[AA-Video-I2V v1.1](https://artificialanalysis.ai/video/leaderboard/image-to-video),\ncaptured 2026-10-22. Derived:"
    );
    expect(doc).toContain("fal `minimax.h3.imageToVideo`");
    expect(doc).toContain("kie `minimax-h3/image-to-video`");
    expect(doc).toContain("fal `geminiOmniFlash.v1p1.edit`");
    expect(doc).toContain("xai `grok-imagine-video-1.5`");
    expect(doc).toContain("machgen `Alibaba-Wan-3.0`");
    expect(doc).toContain("## Refresh");
    expect(doc).toContain("re-derives `r2v`");
    expect(doc).toMatch(
      /\| Rank \| Model +\| Creator +\| Elo +\| Price +\| apicity endpoints +\|/
    );
    expect(doc).toContain("Prices as of");
    expect(doc).toContain("dynamic, 0.04-0.065 USD/s, 0.035-0.15 USD/s");
    expect(doc).toContain("or a price");
  });

  it("points the root README at the doc and drops the old table", () => {
    const readme = readFileSync(path.join(repoRoot, "README.md"), "utf8");
    const using = readme.indexOf("## Using the CLI");
    const section = readme.indexOf("## Frontier models");
    const library = readme.indexOf("\n## Library\n");
    expect(using).toBeGreaterThan(-1);
    expect(section).toBeGreaterThan(using);
    expect(library).toBeGreaterThan(section);
    expect(readme).toContain("apicity frontier");
    expect(readme).toContain('frontier("i2v")');
    expect(readme).toContain('import { frontier } from "@apicity/cost"');
    expect(readme).toContain("docs/frontier.md");
    expect(readme).not.toContain("## Features");
    expect(readme).not.toContain("\n## Example\n");
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
      path.join(repoRoot, "scripts/lib/frontier-price-catalog.ts"),
      path.join(repoRoot, "packages/provider/cost/src/frontier/index.ts"),
      path.join(repoRoot, "packages/provider/cost/src/frontier/price.ts"),
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

const RATE_SUFFIX: Record<string, string> = {
  seconds: "s",
  images: "image",
  generations: "generation",
  megapixels: "megapixel",
  songs: "song",
  characters: "character",
  tokens: "token",
};

interface LooseRate {
  kind: string;
  unit: string;
  rates: Record<string, number>;
  source: { asOf?: string; url: string };
}

describe("frontier prices", () => {
  const dynamic = new Set<string>(FAL_DYNAMIC_PRICING_ENDPOINTS);
  const docs = loadEndpointDocRows();
  const tables = PRICING as unknown as Record<
    string,
    Record<string, LooseRate>
  >;

  function postUrl(provider: string, dotPath: string): string {
    const rows = docs.filter(
      (row) =>
        row.provider === provider &&
        row.dotPath === dotPath &&
        row.method === "POST"
    );
    expect(rows, `${provider} ${dotPath}`).toHaveLength(1);
    return rows[0]?.fullUrl ?? "";
  }

  it("requires pricingKey on a dedicated leaf", () => {
    const snapshot = { entries: [{ model: "Demo" }] };
    expect(
      endpointMapProblems(snapshot, {
        Demo: [{ provider: "fal", dotPath: "minimax.h3.imageToVideo" }],
      }).some((problem) => problem.includes("pricingKey"))
    ).toBe(true);
    expect(
      endpointMapProblems(snapshot, {
        Demo: [
          {
            provider: "fal",
            dotPath: "minimax.h3.imageToVideo",
            pricingKey: "unpriced",
          },
        ],
      })
    ).toEqual([]);
  });

  it("renders the design examples and the token and unpriced cases", () => {
    expect(formatFrontierPrice(null)).toBe("-");
    expect(formatFrontierPrice({ unit: "dynamic" })).toBe("dynamic");
    expect(
      formatFrontierPrice({
        unit: "seconds",
        min: 0.04,
        max: 0.16,
        asOf: "2026-01-01",
        url: "https://example.invalid",
      })
    ).toBe("0.04-0.16 USD/s");
    expect(
      formatFrontierPrice({
        unit: "images",
        min: 0.08,
        max: 0.08,
        asOf: "2026-01-01",
        url: "https://example.invalid",
      })
    ).toBe("0.08 USD/image");
    expect(
      frontierPrice({
        provider: "xai",
        dotPath: "v1.chat.completions",
        modelId: "grok-4",
      })
    ).toBeNull();
    expect(
      frontierPrice({
        provider: "fal",
        dotPath: "example.leaf",
        pricingKey: "unpriced",
      })
    ).toBeNull();
    expect(() =>
      frontierPrice({
        provider: "kie",
        dotPath: "api.v1.jobs.createTask",
        modelId: "not-a-model",
      })
    ).toThrow(/unpriced/);
  });

  it("resolves every frontier key and matches the rendered rate", () => {
    const types = ["t2i", "i2i", "t2v", "i2v", "v2v", "r2v"] as const;
    for (const type of types) {
      const { endpointMap } = frontierFiles(type);
      for (const [model, list] of Object.entries(endpointMap)) {
        list.forEach((entry, index) => {
          const where = `${type} ${model}[${index}] ${entry.provider}`;
          const table = tables[entry.provider];
          if (
            (entry.provider === "kie" || entry.provider === "machgen") &&
            entry.modelId !== undefined &&
            table?.[entry.modelId] !== undefined
          ) {
            expect(entry.pricingKey, where).toBeUndefined();
          }
          if (entry.provider === "fal") {
            const id = new URL(
              postUrl(entry.provider, entry.dotPath)
            ).pathname.replace(/^\//, "");
            expect(entry.pricingKey, where).toBe(id);
            expect(
              dynamic.has(id) || table?.[id] !== undefined || id === "unpriced",
              where
            ).toBe(true);
          }
        });
      }

      for (const row of frontier(type)) {
        const entry = endpointMap[row.model]?.find(
          (candidate) =>
            candidate.provider === row.provider &&
            candidate.dotPath === row.dotPath &&
            candidate.modelId === row.modelId
        );
        expect(entry, `${type} ${row.model} ${row.provider}`).toBeDefined();
        if (entry === undefined) continue;
        const key = entry.pricingKey ?? entry.modelId ?? "";
        const where = `${type} ${row.model} ${row.provider} ${key}`;
        const rendered = formatFrontierPrice(row.price);
        if (key === "unpriced") {
          expect(row.price, where).toBeNull();
          expect(rendered).toBe("-");
          continue;
        }
        if (row.provider === "fal" && dynamic.has(key)) {
          expect(row.price, where).toEqual({ unit: "dynamic" });
          expect(rendered).toBe("dynamic");
          continue;
        }
        const priced = tables[row.provider]?.[key];
        expect(priced, where).toBeDefined();
        if (priced === undefined) continue;
        if (priced.kind === "tokens") {
          expect(row.price, where).toBeNull();
          expect(rendered).toBe("-");
          continue;
        }
        const values = Object.values(priced.rates);
        expect(row.price, where).toMatchObject({
          unit: priced.unit,
          min: Number(Math.min(...values).toFixed(10)),
          max: Number(Math.max(...values).toFixed(10)),
          asOf: priced.source.asOf ?? PRICING_AS_OF,
          url: priced.source.url,
        });
        if (row.price === null || row.price.unit === "dynamic") {
          throw new Error(`${where} should be a per-unit price`);
        }
        const suffix = RATE_SUFFIX[row.price.unit];
        const min = formatFrontierRate(row.price.min);
        const max = formatFrontierRate(row.price.max);
        const expected =
          min === max ? `${min} USD/${suffix}` : `${min}-${max} USD/${suffix}`;
        expect(rendered, where).toBe(expected);
      }
    }

    for (const row of frontier("i2v")) {
      if (row.provider !== "kie" && row.provider !== "fal") continue;
      expect(row.price, `${row.provider} ${row.dotPath}`).not.toBeNull();
      if (row.provider === "fal" && row.price?.unit !== "dynamic") {
        expect(row.price).toMatchObject({ unit: expect.any(String) });
        expect(typeof row.price?.min).toBe("number");
      }
    }

    const xai = frontierFiles("i2v").endpointMap[
      "Grok Imagine Video 1.5"
    ]?.find((entry) => entry.provider === "xai");
    expect(xai?.pricingKey).toBe(`${XAI_GROK_IMAGINE_VIDEO_1_5}-preview`);
  });
});
