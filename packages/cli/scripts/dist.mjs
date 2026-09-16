import fs from "node:fs/promises";
import path from "node:path";

const PKG_DIR = process.cwd();
const BUILD = path.join(PKG_DIR, "dist/build");
const OUT = path.join(PKG_DIR, "dist");

const SRC_IN = path.join(BUILD, "src");
const SRC_OUT = path.join(OUT, "src");

async function rmrf(p) {
  await fs.rm(p, { recursive: true, force: true });
}
async function mkdirp(p) {
  await fs.mkdir(p, { recursive: true });
}
async function moveDir(src, dst) {
  await mkdirp(path.dirname(dst));
  try {
    await fs.rename(src, dst);
  } catch {
    const entries = await fs.readdir(src, { withFileTypes: true });
    await mkdirp(dst);
    for (const e of entries) {
      const s = path.join(src, e.name),
        d = path.join(dst, e.name);
      if (e.isDirectory()) await moveDir(s, d);
      else await fs.copyFile(s, d);
    }
  }
}

async function addJsExtensions(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await addJsExtensions(fullPath);
    } else if (entry.name.endsWith(".js")) {
      const content = await fs.readFile(fullPath, "utf8");
      const updatedContent = content.replace(
        /from\s+["'](\.\/[^"']+)["']/g,
        (match, importPath) => {
          if (!importPath.endsWith(".js") && !importPath.endsWith(".json")) {
            return match.replace(importPath, importPath + ".js");
          }
          return match;
        }
      );
      await fs.writeFile(fullPath, updatedContent);
    }
  }
}

async function fixSourcemaps(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await fixSourcemaps(fullPath);
    } else if (entry.name.endsWith(".map")) {
      const content = await fs.readFile(fullPath, "utf8");
      const map = JSON.parse(content);
      if (Array.isArray(map.sources)) {
        map.sources = map.sources.map((s) =>
          s.startsWith("../../../") ? s.replace("../../../", "../../") : s
        );
        await fs.writeFile(fullPath, JSON.stringify(map));
      }
    }
  }
}

async function copyEndpointTsv() {
  const src = path.join(PKG_DIR, "../../scripts/endpoint-docs.tsv");
  const dst = path.join(OUT, "endpoint-docs.tsv");
  await fs.copyFile(src, dst);
}

async function chmodBins() {
  for (const name of ["bin.js", "mcp-bin.js"]) {
    try {
      await fs.chmod(path.join(SRC_OUT, name), 0o755);
    } catch {
      /* no bin yet — fine */
    }
  }
}

/**
 * Stage the agent skill next to `dist` so npm publishes it (the `skills` entry
 * in package.json `files`). The source lives at the repository root because
 * `apicity skill` and the Claude Code plugin read the same copy.
 *
 * A missing source is a build failure, deliberately. The staged directory is
 * gitignored and the repository copy is what every test reads, so a build that
 * skipped this step would pass CI and the whole replay suite and still publish
 * a tarball where `apicity skill`, `skill install` and `setup` all fail. The
 * copy throwing is the only place that catches it.
 */
async function copySkill() {
  const src = path.join(PKG_DIR, "../../skills/apicity/SKILL.md");
  const dst = path.join(PKG_DIR, "skills/apicity/SKILL.md");
  await mkdirp(path.dirname(dst));
  await fs.copyFile(src, dst);
}

(async function main() {
  await rmrf(SRC_OUT);
  await moveDir(SRC_IN, SRC_OUT);
  await addJsExtensions(SRC_OUT);
  await fixSourcemaps(SRC_OUT);
  await copyEndpointTsv();
  await copySkill();
  await chmodBins();
  await rmrf(BUILD);
  console.log("✅ Build completed successfully!");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
