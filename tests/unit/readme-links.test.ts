import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { repoRoot } from "../../scripts/lib/provider-scope.mjs";

// A moved README section used to leave a relative link aimed at a heading
// that no longer exists. Anchors are not checked — a heading rename inside a
// file that still exists is a separate edit — but the path must resolve.
// Cheap on purpose: read the markdown, stat the target, nothing else.

const DOC_FILES = [
  "README.md",
  "CONTRIBUTING.md",
  "MCP.md",
  ...readdirSync(path.join(repoRoot, "docs"))
    .filter((name) => name.endsWith(".md"))
    .map((name) => path.join("docs", name)),
];

const LINK = /\[[^\]]*\]\(([^)]+)\)/g;

function linkTargets(text: string): string[] {
  const targets: string[] = [];
  for (const match of text.matchAll(LINK)) {
    let url = match[1].trim();
    if (url.startsWith("<") && url.endsWith(">")) url = url.slice(1, -1);
    url = url.split(/\s+/)[0] ?? "";
    if (url.length === 0 || url.startsWith("#")) continue;
    if (/^[a-z][a-z0-9+.-]*:/i.test(url)) continue;
    const file = decodeURIComponent(url.split("#")[0] ?? "");
    if (file.length === 0) continue;
    targets.push(file);
  }
  return targets;
}

describe("readme and docs links", () => {
  it("keeps the root README under 150 lines", () => {
    const readme = readFileSync(path.join(repoRoot, "README.md"), "utf8");
    const lines = readme.trimEnd().split("\n").length;
    expect(lines).toBeGreaterThan(80);
    expect(lines).toBeLessThan(150);
  });

  it("resolves every relative link in the README, contributing notes and docs", () => {
    const missing: string[] = [];
    for (const file of DOC_FILES) {
      const text = readFileSync(path.join(repoRoot, file), "utf8");
      for (const target of linkTargets(text)) {
        const resolved = path.resolve(repoRoot, path.dirname(file), target);
        const exists = statSync(resolved, { throwIfNoEntry: false });
        if (exists === undefined) missing.push(`${file} -> ${target}`);
      }
    }
    expect(missing, missing.join("\n")).toEqual([]);
  });
});
