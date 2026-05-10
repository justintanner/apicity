import fs from "fs";
import path from "path";

const packagesDir = "packages/provider";
const mcpDir = "packages/mcp-server";

const packages = fs
  .readdirSync(packagesDir)
  .sort()
  .map((p) => [p, path.join(packagesDir, p)]);
const allPkgs = [...packages, ["mcp-server", mcpDir]];

const MONOREPO_URL = "https://github.com/justintanner/apicity";
const BUGS_URL = "https://github.com/justintanner/apicity/issues";

function fixPackageJson(name, pkgPath) {
  const pkgJsonPath = path.join(pkgPath, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
  let changed = false;

  if (typeof pkg.repository === "string") {
    pkg.repository = {
      type: "git",
      url: "git+" + MONOREPO_URL + ".git",
      directory: pkgPath.replace("packages/", ""),
    };
    changed = true;
  } else if (typeof pkg.repository === "object" && pkg.repository !== null) {
    const expectedDir = pkgPath.replace("packages/", "");
    if (pkg.repository.directory !== expectedDir) {
      pkg.repository.directory = expectedDir;
      changed = true;
    }
    if (!pkg.repository.url) {
      pkg.repository.url = "git+" + MONOREPO_URL + ".git";
      changed = true;
    }
  }

  if (!pkg.homepage) {
    pkg.homepage = MONOREPO_URL + "#readme";
    changed = true;
  }

  if (!pkg.bugs) {
    pkg.bugs = { url: BUGS_URL };
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(pkgJsonPath, JSON.stringify(pkg, null, 2) + "\n");
    console.log("Updated package.json for " + name);
  }
}

function fixReadme(name, pkgPath) {
  const readmePath = path.join(pkgPath, "README.md");
  let readme = fs.readFileSync(readmePath, "utf8");
  let changed = false;

  const hasNpm = readme.includes("npm install") || readme.includes("npm i ");
  const hasPnpm = readme.includes("pnpm add");

  if (!hasNpm || !hasPnpm) {
    const installMatch = readme.match(/##\s+(Install|Installation)\s*\n/i);
    if (installMatch) {
      const idx = installMatch.index + installMatch[0].length;
      let insert = "";
      if (!hasNpm)
        insert += "\n\n```bash\nnpm install @apicity/" + name + "\n```";
      if (!hasPnpm)
        insert += "\n\n```bash\npnpm add @apicity/" + name + "\n```";
      readme = readme.slice(0, idx) + insert + "\n" + readme.slice(idx);
      changed = true;
    }
  }

  if (!readme.includes(MONOREPO_URL)) {
    const licenseMatch = readme.match(/##\s+License\s*\n/i);
    if (licenseMatch) {
      const idx = licenseMatch.index;
      readme =
        readme.slice(0, idx) +
        "Part of the [apicity](" +
        MONOREPO_URL +
        ") monorepo.\n\n" +
        readme.slice(idx);
      changed = true;
    }
  }

  if (!readme.includes("[LICENSE]") && !readme.includes("(LICENSE)")) {
    readme = readme.replace(
      /##\s+License\s*\n\n*MIT\s*$/i,
      "## License\n\nMIT — see [LICENSE](LICENSE)."
    );
    changed = true;
  }

  if (name === "free-media-upload") {
    readme = readme.replace(
      /createFree-media-upload/g,
      "createFreeMediaUpload"
    );
    readme = readme.replace(
      /free-media-upload = createFreeMediaUpload/g,
      "freeMediaUpload = createFreeMediaUpload"
    );
    readme = readme.replace(/free-media-upload\.get/g, "freeMediaUpload.get");
    readme = readme.replace(
      /free-media-upload, withRetry/g,
      "freeMediaUpload, withRetry"
    );
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(readmePath, readme);
    console.log("Updated README.md for " + name);
  }
}

function createChangelog(pkgPath) {
  const changelogPath = path.join(pkgPath, "CHANGELOG.md");
  if (fs.existsSync(changelogPath)) return;

  const lines = [
    "# Changelog",
    "",
    "All notable changes to this project will be documented in this file.",
    "",
    "The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),",
    "and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).",
    "",
    "## [Unreleased]",
    "",
    "### Added",
    "- Initial release.",
    "",
  ];

  fs.writeFileSync(changelogPath, lines.join("\n"));
  console.log("Created CHANGELOG.md for " + path.basename(pkgPath));
}

for (const [name, pkgPath] of allPkgs) {
  fixPackageJson(name, pkgPath);
  fixReadme(name, pkgPath);
  createChangelog(pkgPath);
}

const rootChangelogPath = "CHANGELOG.md";
if (!fs.existsSync(rootChangelogPath)) {
  const rootLines = [
    "# Changelog",
    "",
    "All notable changes to this project will be documented in this file.",
    "",
    "The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),",
    "and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).",
    "",
    "## [Unreleased]",
    "",
    "### Added",
    "- 15 scoped provider packages with zero runtime dependencies.",
    "- Type-safe factories mirroring upstream API URL paths.",
    "- Zod schema validation on every POST endpoint.",
    "- Middleware composition (retry, fallback, rate-limit).",
    "- `@apicity/cost` for local token/image/video spend estimation.",
    "- `@apicity/mcp-server` exposing all endpoints as MCP tools.",
    "- Integration-test harness with Polly.js record/replay.",
    "- Endpoint documentation with upstream docs links.",
    "",
    "## 0.1.0-alpha.0 - 2026-05-09",
    "",
    "### Added",
    "- First alpha release of the @apicity/* monorepo.",
    "",
  ];
  fs.writeFileSync(rootChangelogPath, rootLines.join("\n"));
  console.log("Created root CHANGELOG.md");
}

console.log("\nDone preparing release artifacts.");
