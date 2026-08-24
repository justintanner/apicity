#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";
import * as prettier from "prettier";

import {
  KIE_PRICING_MANIFEST_PATH,
  KIE_PRICING_METADATA_PATH,
  KIE_PRICING_SNAPSHOT_PATH,
} from "./lib/kie-pricing-evidence-paths.mjs";
import {
  buildReconciliationManifest,
  KiePricingReconciliationError,
  renderReconciliationMarkdown,
  writeReconciliationArtifacts,
} from "./lib/kie-pricing-reconciliation.mjs";
import { repoRoot } from "./lib/provider-scope.mjs";

const VALUE_OPTIONS = new Set([
  "snapshot",
  "metadata",
  "manifest",
  "markdown",
  "generated-at",
]);

function parseOptions(tokens) {
  const options = {};
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token === "--check") continue;

    const name = token.startsWith("--") ? token.slice(2) : "";
    const value = tokens[index + 1];
    if (!VALUE_OPTIONS.has(name) || !value || value.startsWith("--")) {
      throw new KiePricingReconciliationError(
        "invalid-argument",
        `expected --name value, got ${token ?? "<end>"}`
      );
    }
    options[name] = value;
    index += 1;
  }
  return options;
}

async function readExistingManifest(manifestPath) {
  try {
    return JSON.parse(await readFile(manifestPath, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") return undefined;
    throw error;
  }
}

async function formatArtifact(contents, filepath) {
  const config = (await prettier.resolveConfig(filepath)) ?? {};
  return prettier.format(contents, { ...config, filepath });
}

async function renderExpectedArtifacts(manifest, manifestPath, markdownPath) {
  const [manifestContents, markdownContents] = await Promise.all([
    formatArtifact(`${JSON.stringify(manifest, null, 2)}\n`, manifestPath),
    formatArtifact(renderReconciliationMarkdown(manifest), markdownPath),
  ]);
  return { manifestContents, markdownContents };
}

async function readCurrentArtifact(filepath) {
  try {
    return await readFile(filepath, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") return undefined;
    throw error;
  }
}

async function assertArtifactsCurrent(expected, manifestPath, markdownPath) {
  const [currentManifest, currentMarkdown] = await Promise.all([
    readCurrentArtifact(manifestPath),
    readCurrentArtifact(markdownPath),
  ]);
  const stale = [];
  if (currentManifest !== expected.manifestContents) stale.push(manifestPath);
  if (currentMarkdown !== expected.markdownContents) stale.push(markdownPath);
  if (stale.length === 0) return;

  throw new KiePricingReconciliationError(
    "generated-artifact-stale",
    `regenerate with pnpm run gen:kie-pricing-manifest: ${stale
      .map((filepath) => path.relative(repoRoot, filepath))
      .join(", ")}`,
    {
      stale: stale.map((filepath) => path.relative(repoRoot, filepath)),
    }
  );
}

async function main() {
  const check = process.argv.includes("--check");
  const options = parseOptions(process.argv.slice(2));
  const snapshotPath = options.snapshot ?? KIE_PRICING_SNAPSHOT_PATH;
  const metadataPath = options.metadata ?? KIE_PRICING_METADATA_PATH;
  const manifest = options.manifest ?? KIE_PRICING_MANIFEST_PATH;
  const markdown = options.markdown ?? manifest.replace(/\.json$/i, ".md");
  const manifestPath = path.resolve(repoRoot, manifest);
  const markdownPath = path.resolve(repoRoot, markdown);
  const existingManifest = await readExistingManifest(manifestPath);

  // generatedAt is a stable pin identity, not a refresh clock. A real evidence
  // re-pull can opt into a new identity with --generated-at.
  const generatedAt =
    options["generated-at"] ??
    existingManifest?.generatedAt ??
    new Date().toISOString();
  const nextManifest = await buildReconciliationManifest({
    root: repoRoot,
    snapshotPath,
    metadataPath,
    generatedAt,
  });

  if (check) {
    const expected = await renderExpectedArtifacts(
      nextManifest,
      manifestPath,
      markdownPath
    );
    await assertArtifactsCurrent(expected, manifestPath, markdownPath);
  } else {
    await writeReconciliationArtifacts({
      manifest: nextManifest,
      manifestPath,
      markdownPath,
    });
  }

  console.log(
    JSON.stringify(
      {
        status: "ok",
        command: check ? "check" : "generate",
        manifestPath,
        markdownPath,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        status: "error",
        code: error.code ?? "unexpected-error",
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
      },
      null,
      2
    )
  );
  process.exitCode = 1;
});
