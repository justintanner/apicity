import fs from "node:fs/promises";
import path from "node:path";

const PKG_DIR = process.cwd();
const BUILD = path.join(PKG_DIR, "dist/build");
const OUT = path.join(PKG_DIR, "dist");
const SRC_IN = path.join(BUILD, "src");
const SRC_OUT = path.join(OUT, "src");

async function rmrf(target) {
  await fs.rm(target, { recursive: true, force: true });
}

async function mkdirp(target) {
  await fs.mkdir(target, { recursive: true });
}

async function moveDir(source, destination) {
  await mkdirp(path.dirname(destination));
  try {
    await fs.rename(source, destination);
  } catch {
    const entries = await fs.readdir(source, { withFileTypes: true });
    await mkdirp(destination);
    for (const entry of entries) {
      const from = path.join(source, entry.name);
      const to = path.join(destination, entry.name);
      if (entry.isDirectory()) await moveDir(from, to);
      else await fs.copyFile(from, to);
    }
  }
}

async function addJsExtensions(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await addJsExtensions(fullPath);
    } else if (entry.name.endsWith(".js") || entry.name.endsWith(".d.ts")) {
      const content = await fs.readFile(fullPath, "utf8");
      const updated = content.replace(
        /from\s+["'](\.\/[^"']+)["']/g,
        (match, importPath) => {
          if (!importPath.endsWith(".js") && !importPath.endsWith(".json")) {
            return match.replace(importPath, `${importPath}.js`);
          }
          return match;
        }
      );
      await fs.writeFile(fullPath, updated);
    }
  }
}

async function fixSourcemaps(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await fixSourcemaps(fullPath);
    } else if (entry.name.endsWith(".map")) {
      const content = await fs.readFile(fullPath, "utf8");
      const map = JSON.parse(content);
      if (Array.isArray(map.sources)) {
        map.sources = map.sources.map((source) =>
          source.startsWith("../../../")
            ? source.replace("../../../", "../../")
            : source
        );
        await fs.writeFile(fullPath, JSON.stringify(map));
      }
    }
  }
}

(async function main() {
  await rmrf(SRC_OUT);
  await moveDir(SRC_IN, SRC_OUT);
  await addJsExtensions(SRC_OUT);
  await fixSourcemaps(SRC_OUT);
  await rmrf(BUILD);
  console.log("Build completed successfully!");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
