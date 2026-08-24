import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  KIE_PRICING_CHECK_COMMAND,
  KIE_PRICING_MANIFEST_PATH,
  KIE_PRICING_METADATA_PATH,
  KIE_PRICING_REFRESH_COMMAND,
  KIE_PRICING_SNAPSHOT_PATH,
} from "../../scripts/lib/kie-pricing-evidence-paths.mjs";
import { checkReconciliation } from "../../scripts/lib/kie-pricing-reconciliation.mjs";
import { repoRoot } from "../../scripts/lib/provider-scope.mjs";

interface PackageJson {
  scripts: Record<string, string>;
}

interface ReconciliationManifest {
  source: {
    hashes: Record<string, string>;
  };
}

interface CheckOptions {
  root: string;
  manifest?: ReconciliationManifest;
}

const runCheck = checkReconciliation as unknown as (
  options: CheckOptions
) => Promise<Record<string, unknown>>;

const packageJson = JSON.parse(
  fs.readFileSync(path.join(repoRoot, "package.json"), "utf8")
) as PackageJson;

function scriptName(command: string): string {
  const match = /^pnpm run ([a-z0-9:-]+)$/.exec(command);
  if (!match) throw new Error(`invalid pnpm command: ${command}`);
  return match[1];
}

function runRefresh(...args: string[]) {
  return spawnSync(
    process.execPath,
    [path.join(repoRoot, "scripts/refresh-kie-pricing-manifest.mjs"), ...args],
    {
      cwd: repoRoot,
      encoding: "utf8",
    }
  );
}

describe("Kie pricing manifest refresh aliases", () => {
  it("wires the generate and check aliases to the refresh entrypoint", () => {
    expect(packageJson.scripts).toMatchObject({
      "gen:kie-pricing-manifest":
        "node scripts/refresh-kie-pricing-manifest.mjs",
      "gen:kie-pricing-manifest:check":
        "node scripts/refresh-kie-pricing-manifest.mjs --check",
    });
  });

  it("keeps the exported command names backed by package scripts", () => {
    expect(packageJson.scripts[scriptName(KIE_PRICING_REFRESH_COMMAND)]).toBe(
      "node scripts/refresh-kie-pricing-manifest.mjs"
    );
    expect(packageJson.scripts[scriptName(KIE_PRICING_CHECK_COMMAND)]).toBe(
      "node scripts/refresh-kie-pricing-manifest.mjs --check"
    );
  });

  it("includes the refresh command in a real source checksum failure", async () => {
    const manifest = JSON.parse(
      fs.readFileSync(path.resolve(repoRoot, KIE_PRICING_MANIFEST_PATH), "utf8")
    ) as ReconciliationManifest;
    const relativePath = "scripts/endpoint-docs.tsv";
    expect(manifest.source.hashes[relativePath]).toBeDefined();
    manifest.source.hashes[relativePath] = "sha256:changed";

    await expect(runCheck({ root: repoRoot, manifest })).rejects.toMatchObject({
      code: "source-checksum-mismatch",
      message: expect.stringContaining(KIE_PRICING_REFRESH_COMMAND),
    });
  });

  it("points every shared evidence path at a committed file", () => {
    for (const relativePath of [
      KIE_PRICING_SNAPSHOT_PATH,
      KIE_PRICING_METADATA_PATH,
      KIE_PRICING_MANIFEST_PATH,
    ]) {
      expect(
        fs.existsSync(path.resolve(repoRoot, relativePath)),
        relativePath
      ).toBe(true);
    }
  });

  it("checks regenerated artifacts and rejects a stale artifact", () => {
    const temporaryRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), "apicity-kie-pricing-refresh-")
    );
    const manifestPath = path.join(temporaryRoot, "manifest.json");
    const markdownPath = path.join(temporaryRoot, "manifest.md");
    const artifactOptions = [
      "--manifest",
      manifestPath,
      "--markdown",
      markdownPath,
    ];

    try {
      const generated = runRefresh(...artifactOptions);
      expect(generated.status, generated.stderr).toBe(0);

      const current = runRefresh("--check", ...artifactOptions);
      expect(current.status, current.stderr).toBe(0);

      fs.appendFileSync(markdownPath, "\n<!-- stale -->\n");
      const stale = runRefresh("--check", ...artifactOptions);
      expect(stale.status, stale.stderr).toBe(1);
      expect(stale.stderr).toContain('"code": "generated-artifact-stale"');
    } finally {
      fs.rmSync(temporaryRoot, { recursive: true, force: true });
    }
  });
});
