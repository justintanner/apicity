/**
 * Checked-in Artificial Analysis image-to-video leaderboard.
 *
 * The snapshot and the endpoint map are hand-maintained JSON. This module
 * renders them into the root README and checks that every mapped id still
 * exists in the provider registries. It never downloads the leaderboard.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as prettier from "prettier";

const HERE = path.dirname(fileURLToPath(import.meta.url));

/** Repository root, resolved from this module's own location. */
export const REPO_ROOT = path.resolve(HERE, "..", "..");

export const FRONTIER_DIR = path.join(REPO_ROOT, "scripts", "frontier");

export const LEADERBOARD_PATH = path.join(
  FRONTIER_DIR,
  "image-to-video-leaderboard.json"
);

export const ENDPOINT_MAP_PATH = path.join(
  FRONTIER_DIR,
  "image-to-video-endpoints.json"
);

export const ROOT_README_PATH = path.join(REPO_ROOT, "README.md");

export const ENDPOINT_DOCS_PATH = path.join(
  REPO_ROOT,
  "scripts",
  "endpoint-docs.tsv"
);

export const FRONTIER_START = "<!-- frontier-models:image-to-video:start -->";

export const FRONTIER_END = "<!-- frontier-models:image-to-video:end -->";

const UNMAPPED_LABEL = "not yet in apicity";

const PROSE_WIDTH = 80;

/**
 * Wrap a paragraph on spaces. Markdown links stay intact so Prettier cannot
 * split `[label](url)` across a line break inside the label.
 */
function wrapProse(text, width = PROSE_WIDTH) {
  const tokens = text.match(/\[[^\]]+\]\([^)]+\)|\S+/g) ?? [];
  const lines = [];
  let line = "";
  for (const token of tokens) {
    if (line.length === 0) {
      line = token;
      continue;
    }
    if (line.length + 1 + token.length > width) {
      lines.push(line);
      line = token;
    } else {
      line += ` ${token}`;
    }
  }
  if (line.length > 0) lines.push(line);
  return lines.join("\n");
}

const VERBS = new Set(["get", "post", "put", "patch", "delete", "head"]);

/**
 * Shared callables whose README label is not the endpoint-docs dot path.
 * Every other `endpoint` value is the tsv dot path itself.
 */
const TSV_DOT_PATH = {
  "kie\tpost.api.v1.jobs.createTask": "api.v1.jobs.createTask",
  "kie\tveo.post.api.v1.veo.generate": "api.v1.veo.generate",
};

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function loadFrontierData(
  leaderboardPath = LEADERBOARD_PATH,
  endpointMapPath = ENDPOINT_MAP_PATH
) {
  return {
    snapshot: readJson(leaderboardPath),
    endpointMap: readJson(endpointMapPath),
  };
}

export function loadEndpointDocRows(tsvPath = ENDPOINT_DOCS_PATH) {
  const lines = fs.readFileSync(tsvPath, "utf8").split("\n").filter(Boolean);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const [provider, dotPath, method, fullUrl, docsUrl] = lines[i].split("\t");
    rows.push({
      provider,
      dotPath,
      method,
      fullUrl,
      docsUrl: docsUrl ?? "",
    });
  }
  return rows;
}

/**
 * Concatenate a provider's TypeScript sources. The URL comment above each
 * factory leaf is the live endpoint record the comment lint already requires.
 */
export function providerSourceText(provider, repoRoot = REPO_ROOT) {
  const dir = path.join(repoRoot, "packages", "provider", provider, "src");
  const parts = [];
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const child = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(child);
      } else if (entry.name.endsWith(".ts")) {
        parts.push(fs.readFileSync(child, "utf8"));
      }
    }
  };
  walk(dir);
  return parts.join("\n");
}

/**
 * True when `url` occurs in `source` and is not only a prefix of a longer
 * path (`…/videos` must not match `…/videos/upscale`).
 */
export function sourceHasExactUrl(source, url) {
  const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`${escaped}(?![A-Za-z0-9_./-])`).test(source);
}

export function snapshotProblems(snapshot) {
  const problems = [];
  if (!isObject(snapshot)) {
    return ["snapshot must be an object"];
  }
  if (
    typeof snapshot.leaderboardId !== "string" ||
    snapshot.leaderboardId.trim() === ""
  ) {
    problems.push("snapshot.leaderboardId must be a non-empty string");
  }
  if (
    typeof snapshot.sourceUrl !== "string" ||
    !snapshot.sourceUrl.startsWith("https://")
  ) {
    problems.push("snapshot.sourceUrl must be an https URL");
  }
  if (
    typeof snapshot.capturedOn !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(snapshot.capturedOn)
  ) {
    problems.push("snapshot.capturedOn must be YYYY-MM-DD");
  }
  if (
    typeof snapshot.methodology !== "string" ||
    snapshot.methodology.trim() === ""
  ) {
    problems.push("snapshot.methodology must be a non-empty string");
  }
  if (!Array.isArray(snapshot.entries) || snapshot.entries.length === 0) {
    problems.push("snapshot.entries must be a non-empty array");
    return problems;
  }

  const seenRanks = new Set();
  const seenModels = new Set();
  snapshot.entries.forEach((entry, index) => {
    const where = `snapshot.entries[${index}]`;
    if (!isObject(entry)) {
      problems.push(`${where} must be an object`);
      return;
    }
    if (!Number.isInteger(entry.rank) || entry.rank < 1) {
      problems.push(`${where}.rank must be a positive integer`);
    } else if (seenRanks.has(entry.rank)) {
      problems.push(`${where}.rank ${entry.rank} is duplicated`);
    } else {
      seenRanks.add(entry.rank);
    }
    if (typeof entry.model !== "string" || entry.model.trim() === "") {
      problems.push(`${where}.model must be a non-empty string`);
    } else if (seenModels.has(entry.model)) {
      problems.push(
        `${where}.model ${JSON.stringify(entry.model)} is duplicated`
      );
    } else {
      seenModels.add(entry.model);
    }
    if (typeof entry.creator !== "string" || entry.creator.trim() === "") {
      problems.push(`${where}.creator must be a non-empty string`);
    }
    if (!Number.isInteger(entry.elo)) {
      problems.push(`${where}.elo must be an integer`);
    }
  });

  const count = snapshot.entries.length;
  for (let rank = 1; rank <= count; rank++) {
    if (!seenRanks.has(rank)) {
      problems.push(`snapshot ranks must be contiguous; missing ${rank}`);
    }
  }
  for (const rank of seenRanks) {
    if (rank > count) {
      problems.push(
        `snapshot ranks must be contiguous 1..${count}; found ${rank}`
      );
    }
  }
  return problems;
}

export function endpointMapProblems(snapshot, endpointMap) {
  const problems = [];
  if (!isObject(endpointMap)) {
    return ["endpoint map must be an object"];
  }
  const models = Array.isArray(snapshot?.entries)
    ? snapshot.entries
        .filter((entry) => isObject(entry) && typeof entry.model === "string")
        .map((entry) => entry.model)
    : [];
  const expected = new Set(models);
  for (const model of expected) {
    if (!Object.prototype.hasOwnProperty.call(endpointMap, model)) {
      problems.push(
        `endpoint map is missing ${JSON.stringify(model)} (use [] when unmapped)`
      );
    }
  }
  for (const model of Object.keys(endpointMap)) {
    if (!expected.has(model)) {
      problems.push(
        `endpoint map has ${JSON.stringify(model)}, which is not in the snapshot`
      );
    }
    const list = endpointMap[model];
    if (!Array.isArray(list)) {
      problems.push(`endpoint map ${JSON.stringify(model)} must be an array`);
      continue;
    }
    const seen = new Set();
    list.forEach((entry, index) => {
      const where = `endpoint map ${JSON.stringify(model)}[${index}]`;
      if (!isObject(entry)) {
        problems.push(`${where} must be an object`);
        return;
      }
      if (typeof entry.provider !== "string" || entry.provider === "") {
        problems.push(`${where}.provider must be a non-empty string`);
      }
      if (typeof entry.id !== "string" || entry.id === "") {
        problems.push(`${where}.id must be a non-empty string`);
      }
      if (
        entry.endpoint !== undefined &&
        (typeof entry.endpoint !== "string" || entry.endpoint === "")
      ) {
        problems.push(`${where}.endpoint must be a non-empty string`);
      }
      const key = `${entry.provider}\t${entry.endpoint ?? ""}\t${entry.id}`;
      if (seen.has(key)) {
        problems.push(`${where} duplicates ${entry.provider} ${entry.id}`);
      } else {
        seen.add(key);
      }
    });
  }
  return problems;
}

function tsvDotPath(entry) {
  if (entry.endpoint === undefined) return entry.id;
  return TSV_DOT_PATH[`${entry.provider}\t${entry.endpoint}`] ?? entry.endpoint;
}

function findDocRow(docsRows, provider, dotPath) {
  return docsRows.filter(
    (row) =>
      row.provider === provider &&
      row.dotPath === dotPath &&
      row.method === "POST"
  );
}

function modelRegistryHas(entry, registry) {
  if (
    entry.provider === "kie" &&
    entry.endpoint === "post.api.v1.jobs.createTask"
  ) {
    return registry.kieCreateTask.has(entry.id);
  }
  if (
    entry.provider === "kie" &&
    entry.endpoint === "veo.post.api.v1.veo.generate"
  ) {
    return registry.kieVeo.has(entry.id);
  }
  if (entry.provider === "googleflow" && entry.endpoint === "v1.videos") {
    return registry.googleflowVideos.has(entry.id);
  }
  if (
    entry.provider === "alibaba" &&
    entry.endpoint === "api.v1.services.aigc.videoGeneration.videoSynthesis"
  ) {
    return registry.alibabaVideo.has(entry.id);
  }
  return false;
}

function isDedicatedImageToVideo(entry, fullUrl) {
  return (
    fullUrl.includes("/image-to-video") || entry.id.includes("imageToVideo")
  );
}

/**
 * Every mapped id must resolve, and a dedicated leaf must be image-to-video.
 *
 * `registry` holds the image-to-video model ids of the shared callables.
 * `sourceHasUrl(provider, url)` is true when that provider's sources still
 * contain the endpoint URL.
 */
export function resolutionProblems(endpointMap, ctx) {
  const problems = [];
  if (!isObject(endpointMap)) return problems;
  const { docsRows, registry, sourceHasUrl } = ctx;
  if (
    !registry ||
    typeof sourceHasUrl !== "function" ||
    !Array.isArray(docsRows)
  ) {
    return [
      "resolution context is missing docsRows, registry, or sourceHasUrl",
    ];
  }

  for (const [model, list] of Object.entries(endpointMap)) {
    if (!Array.isArray(list)) continue;
    list.forEach((entry, index) => {
      if (!isObject(entry) || typeof entry.provider !== "string") return;
      if (typeof entry.id !== "string" || entry.id === "") return;
      const where = `${JSON.stringify(model)}[${index}] ${entry.provider} ${entry.id}`;
      const dotPath = tsvDotPath(entry);
      const rows = findDocRow(docsRows, entry.provider, dotPath);
      if (rows.length !== 1) {
        problems.push(
          `${where} expected one POST endpoint-docs row for ${dotPath}, found ${rows.length}`
        );
        return;
      }
      const fullUrl = rows[0].fullUrl ?? "";
      if (!sourceHasUrl(entry.provider, fullUrl)) {
        problems.push(
          `${where} URL ${fullUrl} is not in packages/provider/${entry.provider}/src`
        );
      }
      if (entry.endpoint === undefined) {
        if (!isDedicatedImageToVideo(entry, fullUrl)) {
          problems.push(`${where} is not an image-to-video endpoint`);
        }
        return;
      }
      if (!modelRegistryHas(entry, registry)) {
        problems.push(
          `${where} is not in the ${entry.provider} image-to-video model registry for ${entry.endpoint}`
        );
      }
    });
  }
  return problems;
}

export function frontierProblems(snapshot, endpointMap, ctx) {
  return [
    ...snapshotProblems(snapshot),
    ...endpointMapProblems(snapshot, endpointMap),
    ...resolutionProblems(endpointMap, ctx),
  ];
}

/**
 * First README group heading for a dot path, matching doc-gen's `sectionKey`
 * after HTTP verbs are removed. The anchor is that heading lowercased.
 */
export function readmeGroup(dotPath) {
  const segments = dotPath.split(".").filter((segment) => !VERBS.has(segment));
  for (const segment of segments) {
    if (/^v\d+$/i.test(segment)) continue;
    if (segment === "api") continue;
    return segment;
  }
  return "general";
}

function endpointHref(entry, readmes) {
  const dotPath = entry.endpoint ?? entry.id;
  const group = readmeGroup(dotPath);
  const readme = readmes.get(entry.provider) ?? "";
  const base = `packages/provider/${entry.provider}/README.md`;
  if (
    readme.includes(`\n### ${group}\n`) ||
    readme.startsWith(`### ${group}\n`)
  ) {
    return `${base}#${group.toLowerCase()}`;
  }
  return base;
}

function endpointLink(entry, readmes) {
  return `[${entry.provider} \`${entry.id}\`](${endpointHref(entry, readmes)})`;
}

function endpointCell(entries, readmes) {
  if (entries.length === 0) return UNMAPPED_LABEL;
  return entries.map((entry) => endpointLink(entry, readmes)).join(", ");
}

export function renderFrontierSection(snapshot, endpointMap, readmes) {
  const prose = wrapProse(
    `Image-to-video models ranked by the [${snapshot.leaderboardId}](${snapshot.sourceUrl}) leaderboard (Artificial Analysis), captured ${snapshot.capturedOn}. ${snapshot.methodology} The leaderboard page publishes no last-updated date, so the capture date is the day this snapshot was taken. The snapshot is committed data: this repository never downloads the leaderboard. Models with no mapped endpoint are listed as ${UNMAPPED_LABEL}.`
  );

  const lines = [
    FRONTIER_START,
    "## Frontier models",
    "",
    prose,
    "",
    "| Rank | Model | Creator | Elo | apicity endpoints |",
    "| ---- | ----- | ------- | --- | ----------------- |",
  ];
  for (const entry of snapshot.entries) {
    const mapped = endpointMap[entry.model] ?? [];
    lines.push(
      `| ${entry.rank} | ${entry.model} | ${entry.creator} | ${entry.elo} | ${endpointCell(mapped, readmes)} |`
    );
  }
  lines.push("", FRONTIER_END);
  return `${lines.join("\n")}\n`;
}

export function applyFrontierSection(readme, block) {
  const blockText = block.endsWith("\n") ? block : `${block}\n`;
  const start = readme.indexOf(FRONTIER_START);
  const end = readme.indexOf(FRONTIER_END);
  if (start !== -1 || end !== -1) {
    if (start === -1 || end < start) {
      throw new Error("README.md frontier markers are missing or inverted");
    }
    const after = end + FRONTIER_END.length;
    const prefix = readme.slice(0, start).replace(/\n*$/, "\n\n");
    const suffix = readme.slice(after).replace(/^\n*/, "\n");
    return `${prefix}${blockText.replace(/\n+$/, "\n")}${suffix}`;
  }

  const features = readme.search(/^## Features\n/m);
  if (features === -1) {
    throw new Error("README.md is missing ## Features");
  }
  const rest = readme.slice(features + 1);
  const nextRel = rest.search(/^## /m);
  if (nextRel === -1) {
    throw new Error("README.md has no heading after ## Features");
  }
  const next = features + 1 + nextRel;
  const prefix = readme.slice(0, next).replace(/\n*$/, "\n\n");
  const suffix = readme.slice(next);
  return `${prefix}${blockText.replace(/\n+$/, "\n")}\n${suffix}`;
}

function providerReadmes(providers, repoRoot) {
  const readmes = new Map();
  for (const provider of providers) {
    const readmePath = path.join(
      repoRoot,
      "packages",
      "provider",
      provider,
      "README.md"
    );
    readmes.set(
      provider,
      fs.existsSync(readmePath) ? fs.readFileSync(readmePath, "utf8") : ""
    );
  }
  return readmes;
}

export async function renderRootReadme(current, repoRoot = REPO_ROOT) {
  const { snapshot, endpointMap } = loadFrontierData();
  const providers = new Set();
  for (const list of Object.values(endpointMap)) {
    if (!Array.isArray(list)) continue;
    for (const entry of list) {
      if (isObject(entry) && typeof entry.provider === "string") {
        providers.add(entry.provider);
      }
    }
  }
  const section = renderFrontierSection(
    snapshot,
    endpointMap,
    providerReadmes(providers, repoRoot)
  );
  const spliced = applyFrontierSection(current, section);
  const config = (await prettier.resolveConfig(ROOT_README_PATH)) ?? {};
  return prettier.format(spliced, { ...config, filepath: ROOT_README_PATH });
}

/**
 * Write or compare the root README frontier section.
 *
 * @returns {Promise<string | null>} `README.md` when `--check` finds drift
 */
export async function syncRootFrontier({ check, repoRoot = REPO_ROOT }) {
  const readmePath = path.join(repoRoot, "README.md");
  const current = fs.readFileSync(readmePath, "utf8");
  const next = await renderRootReadme(current, repoRoot);
  if (next === current) return null;
  if (check) return "README.md";
  fs.writeFileSync(readmePath, next);
  return null;
}
