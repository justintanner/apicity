import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { REPO_ROOT, readProviderNames } from "./provider-inventory.mjs";

/**
 * The provider export surface: which `*Namespace` types a provider declares as
 * public in its `src/*.ts` modules, and which of them its `src/index.ts`
 * actually re-exports.
 *
 * `FalRunNanoBanana2LiteNamespace` was declared `export interface` in
 * `packages/provider/fal/src/types.ts` and never named in `index.ts`, so no
 * consumer of `@apicity/fal` could reach it. It passed lint, passed
 * `tsc --noEmit` (the declaration is used inside `types.ts`), and passed the
 * whole Polly replay suite; it was caught by eye in review (`ac-c2cc4j`
 * finding `G2` / `RR-2`, follow-up `FU-1`, filed as `ac-gvqa18`). No gate in
 * this repository observes a declared-but-unexported public type, and the same
 * defect was live on `main` in the same model family.
 *
 * Reading and checking are kept apart, following the
 * `scripts/lib/provider-inventory.mjs` precedent: `read*` touches the
 * filesystem, `checkExportSurface` is pure surfaces-in/problems-out. That is
 * what lets the guard drive the ratchet from synthetic surfaces instead of
 * depending on whichever defect happens to be live in the tree.
 *
 * A surface is one declaring *file*, not one provider. The first cut read
 * `src/types.ts` alone, which holds 407 of the 414 exported namespaces in the
 * tree; the other seven — four in b2's `s3-types.ts`, three in kie's
 * `responses.ts` — are all public today, so that reading hid no live defect.
 * What it hid was the *reachability* of one: a new namespace added to
 * `kie/src/responses.ts` and left out of `index.ts` reproduces `RR-2` exactly
 * while the guard stays green, in a file the guard never opened. Widening the
 * file set forces the star-export skip to become per module as well — b2's
 * star is at `./s3-types`, so skipping the whole provider would drop its
 * `types.ts` from the guard, and checking the whole provider would report four
 * public names as missing.
 *
 * Three things this module deliberately does NOT do:
 *
 *   - It never builds a `ts.Program`. Both `tests/unit/request-input-types.test.ts`
 *     and `tests/unit/fal-request-input-types.test.ts` do, under a 120s
 *     timeout, and this checker runs in the cross-cutting block of every
 *     provider's fast gate. Parse-only `ts.createSourceFile` stays cheap enough
 *     that widening the file set from 29 files to 216 costs 0.40s (measured
 *     in `scripts/lib/cross-cutting-tests.mjs`), which keeps
 *     `CROSS_CUTTING_COST_SECONDS` unmoved. The
 *     importability proof that genuinely needs a program lives in the
 *     fal-scoped `tests/fixtures/fal-request-input-types.ts` fixture instead.
 *   - It parses each module exactly once. Declarations, named re-exports and
 *     star re-exports come out of a single `walkModule` pass, because with 216
 *     modules in the walk a second parse would cost as much again as the
 *     widening itself.
 *   - It does not recurse into `src/` subdirectories. At `ad829cc0` the only
 *     provider that has any is `cost` (`src/extract`, `src/pricing`), and it
 *     declares no `*Namespace` at all, so recursion would widen the walk
 *     without widening coverage. A provider that later declares one under
 *     `src/<dir>/` reopens this gap one directory down: a follow-up bead to
 *     file, not silent scope.
 */

/**
 * One declaring file's export surface.
 *
 * @typedef {{
 *   provider: string,
 *   sourcePath: string,
 *   indexPath: string,
 *   declarations: { name: string, line: number }[] | null,
 *   exportedNames: string[] | null,
 *   starExportedModules: string[],
 * }} ExportSurface
 */

/** Where the baseline the problem messages point at actually lives. */
const BASELINE_FILE = "tests/unit/provider-export-surface.test.ts";

/** The extensions a module specifier may carry and a module key may not. */
const MODULE_EXTENSION = /\.(m?[jt]s)$/;

/**
 * Parse source text with parent pointers, which `ts.getCombinedModifierFlags`
 * and `node.getStart` both need.
 *
 * @param {string} fileName Used for line reporting and for resolving a star
 *   export's module specifier; it need not exist on disk.
 * @param {string} source
 * @returns {ts.SourceFile}
 */
function parseSourceFile(fileName, source) {
  return ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    ts.ScriptKind.TS
  );
}

/**
 * The identity a file and a module specifier are compared under: the path
 * without its extension. `packages/provider/b2/src/s3-types.ts` and the
 * `"./s3-types"` in `b2/src/index.ts` both reduce to
 * `packages/provider/b2/src/s3-types`.
 *
 * @param {string} filePath
 * @returns {string}
 */
function moduleKey(filePath) {
  return filePath.replace(MODULE_EXTENSION, "");
}

/**
 * How a module would be written as a sibling specifier, for problem messages:
 * `packages/provider/kie/src/responses.ts` reads back as `./responses`.
 *
 * @param {string} filePath
 * @returns {string}
 */
function moduleSpecifier(filePath) {
  return `./${path.posix.basename(moduleKey(filePath))}`;
}

/**
 * Walk one module for everything the guard reads out of it, in a single parse.
 *
 * The `*Namespace` walk is top-level only — all 414 namespaces in the tree are
 * declared at file scope, so `ts.forEachChild` at that depth loses nothing.
 * `export` on the declaration is the signal of public intent; a module-private
 * helper such as fal's bare `type FalNanoBanana2LiteTextToImageFn` is not one
 * and is correctly out of reach.
 *
 * Both re-export forms the repository actually uses are handled:
 *
 *   - a `NamedExports` clause — 27 providers hand-list every name;
 *   - no export clause at all with a module specifier, i.e.
 *     `export * from ...` / `export type * from ...`, which publishes every
 *     declaration in the named module. Only relative specifiers are collected:
 *     `export * from "some-package"` republishes that package's names and says
 *     nothing about any file in this walk.
 *
 * Reading the AST rather than the text satisfies REQ-011: a name inside a
 * comment, a string literal, or a disabled block is not an export element and
 * can neither satisfy nor trip the rule.
 *
 * Aliases contribute both sides (`element.name.text` and
 * `element.propertyName?.text`). This is deliberately over-permissive: for
 * `export type { BarNamespace as FooNamespace }` a declared `FooNamespace`
 * would count as exported although only `BarNamespace` escapes. The tree holds
 * exactly one aliased re-export (`kie/src/index.ts:421`,
 * `sseDataToIterable as sseToIterable`) and it is not a namespace, so the
 * false negative is hypothetical; collecting both keeps a renamed re-export
 * from being reported as a missing export, which is the likelier mistake.
 *
 * @param {string} modulePath Repo-relative or absolute; used for line
 *   reporting and as the base a relative specifier resolves against, so both
 *   sides of a module comparison come from this argument and agree either way.
 * @param {string} source
 * @returns {{
 *   declarations: { name: string, line: number }[],
 *   names: string[],
 *   starExportedModules: string[],
 * }} Declarations in file order, with 1-based line numbers so a problem
 *   message can cite `types.ts:1810`.
 */
function walkModule(modulePath, source) {
  const sourceFile = parseSourceFile(modulePath, source);
  const directory = path.posix.dirname(modulePath);
  /** @type {{ name: string, line: number }[]} */
  const declarations = [];
  /** @type {string[]} */
  const names = [];
  /** @type {string[]} */
  const starExportedModules = [];

  ts.forEachChild(sourceFile, (node) => {
    if (ts.isInterfaceDeclaration(node)) {
      if (!node.name.text.endsWith("Namespace")) return;
      const flags = ts.getCombinedModifierFlags(node);
      if (!(flags & ts.ModifierFlags.Export)) return;

      const { line } = sourceFile.getLineAndCharacterOfPosition(
        node.getStart(sourceFile)
      );
      declarations.push({ name: node.name.text, line: line + 1 });
      return;
    }

    if (!ts.isExportDeclaration(node)) return;

    if (node.exportClause === undefined) {
      if (!node.moduleSpecifier || !ts.isStringLiteral(node.moduleSpecifier)) {
        return;
      }
      const specifier = node.moduleSpecifier.text;
      if (!specifier.startsWith(".")) return;
      starExportedModules.push(
        path.posix.normalize(
          path.posix.join(directory, specifier.replace(MODULE_EXTENSION, ""))
        )
      );
      return;
    }

    if (!ts.isNamedExports(node.exportClause)) return;
    for (const element of node.exportClause.elements) {
      names.push(element.name.text);
      if (element.propertyName) names.push(element.propertyName.text);
    }
  });

  return { declarations, names, starExportedModules };
}

/**
 * The exported, top-level `*Namespace` interfaces one module declares.
 *
 * Pure — source text instead of a path — so the guard can assert the rule
 * against synthetic files that do not exist on disk: a `Namespace` name inside
 * a comment or a string literal, an interface with no `export` modifier
 * (REQ-011).
 *
 * @param {string} modulePath Repo-relative or absolute; used only for labelling.
 * @param {string} source
 * @returns {{ name: string, line: number }[]}
 */
export function parseNamespaceDeclarations(modulePath, source) {
  return walkModule(modulePath, source).declarations;
}

/**
 * What one module publishes: hand-listed names, and the modules it re-exports
 * wholesale.
 *
 * `starExportedModules` holds module keys resolved against `indexPath`'s own
 * directory, so they compare directly against a surface's `sourcePath`. It is
 * the direct, one-hop set; {@link resolveStarExportedModules} closes it.
 *
 * @param {string} indexPath Repo-relative or absolute.
 * @param {string} source
 * @returns {{ names: string[], starExportedModules: string[] }}
 */
export function parseExportedNames(indexPath, source) {
  const { names, starExportedModules } = walkModule(indexPath, source);
  return { names, starExportedModules };
}

/**
 * The filesystem half: parse one module on disk, labelled by its repo-relative
 * path so problem messages and module keys read the same from any checkout.
 *
 * @param {string} absolutePath
 * @param {string} label Repo-relative path, used for reporting and resolution.
 * @returns {ReturnType<typeof walkModule>}
 */
function readModule(absolutePath, label) {
  return walkModule(label, fs.readFileSync(absolutePath, "utf8"));
}

/**
 * Close a star-export seed under the star exports of the modules it reaches.
 *
 * One hop is not enough, and the tree already proves it:
 * `telegram/src/index.ts:3` is `export type * from "./types"` and
 * `telegram/src/types.ts:4` is `export type * from "./zod"`, so every
 * declaration in `telegram/src/zod.ts` is public two hops out. Stopping at one
 * would report such a declaration as unexported while it is fully reachable —
 * a false positive that reds a correct change, the mirror image of the false
 * negative this guard exists to catch.
 *
 * The walk is over modules that were parsed anyway, so it reads no files. The
 * `reached` guard is also what terminates a cycle.
 *
 * @param {string[]} seed Module keys `index.ts` star-exports directly.
 * @param {Map<string, string[]>} starsByModule Module key to the module keys
 *   that module itself star-exports.
 * @returns {string[]} The fixed point, sorted.
 */
export function resolveStarExportedModules(seed, starsByModule) {
  const reached = new Set(seed);
  const queue = [...reached];

  while (queue.length > 0) {
    const current = queue.pop();
    for (const next of starsByModule.get(current) ?? []) {
      if (reached.has(next)) continue;
      reached.add(next);
      queue.push(next);
    }
  }

  return [...reached].sort();
}

/**
 * Read one export surface per declaring file on disk.
 *
 * Provider discovery is `readProviderNames` and module discovery is the
 * directory listing, so both a new package and a new file inside an existing
 * one are covered the day they land rather than when someone remembers a list.
 * `index.ts` is not itself a surface: a namespace declared there is exported by
 * construction.
 *
 * A provider whose `src/index.ts` is missing yields surfaces with a `null`
 * `exportedNames`; `checkExportSurface` skips those rather than treating them
 * as violations (REQ-003). One whose `src/` holds nothing but `index.ts`
 * yields no surface at all, which is the same answer by a shorter route. No
 * provider is in either state today — all 29 ship both files — but the shape is
 * what the guard asserts against instead of assuming.
 *
 * @param {string} [repoRoot]
 * @returns {ExportSurface[]} Surfaces with repo-relative paths, so problem
 *   messages read the same from any checkout and synthetic surfaces can be
 *   written by hand.
 */
export function readProviderExportSurfaces(repoRoot = REPO_ROOT) {
  /** @type {ExportSurface[]} */
  const surfaces = [];

  for (const provider of readProviderNames(repoRoot)) {
    const sourceDirectory = path.join(
      repoRoot,
      "packages",
      "provider",
      provider,
      "src"
    );
    if (!fs.existsSync(sourceDirectory)) continue;

    const relative = (file) =>
      path.posix.join("packages", "provider", provider, "src", file);
    const indexPath = relative("index.ts");
    const indexFile = path.join(sourceDirectory, "index.ts");
    const index = fs.existsSync(indexFile)
      ? readModule(indexFile, indexPath)
      : null;

    const modules = fs
      .readdirSync(sourceDirectory, { withFileTypes: true })
      .filter(
        (entry) =>
          entry.isFile() &&
          entry.name.endsWith(".ts") &&
          entry.name !== "index.ts"
      )
      .map((entry) => entry.name)
      .sort()
      .map((name) => ({
        sourcePath: relative(name),
        parsed: readModule(path.join(sourceDirectory, name), relative(name)),
      }));

    const starExportedModules = index
      ? resolveStarExportedModules(
          index.starExportedModules,
          new Map(
            modules.map((module) => [
              moduleKey(module.sourcePath),
              module.parsed.starExportedModules,
            ])
          )
        )
      : [];

    for (const module of modules) {
      surfaces.push({
        provider,
        sourcePath: module.sourcePath,
        indexPath,
        declarations: module.parsed.declarations,
        exportedNames: index ? index.names : null,
        starExportedModules,
      });
    }
  }

  return surfaces;
}

/**
 * A surface can only be checked when both halves of the rule are present.
 *
 * @param {{ declarations: unknown, exportedNames: unknown }} surface
 * @returns {boolean}
 */
function isCheckable(surface) {
  return surface.declarations !== null && surface.exportedNames !== null;
}

/**
 * Whether this surface's own module is republished wholesale, in which case
 * every declaration in it is already public and a name set would be the wrong
 * answer rather than an incomplete one (DC-4).
 *
 * Per module, not per provider: b2 star-exports `./s3-types` and hand-lists
 * everything else, so its `s3-types.ts` is skipped while its `types.ts` stays
 * checked (DC-7).
 *
 * @param {{ sourcePath: string, starExportedModules: string[] }} surface
 * @returns {boolean}
 */
function isStarExported(surface) {
  return surface.starExportedModules.includes(moduleKey(surface.sourcePath));
}

/**
 * Compare declared namespaces against re-exported names.
 *
 * Pure: everything it needs is in `surfaces` and `baseline`, which is what
 * lets the guard assert the ratchet over synthetic input instead of over
 * whichever defect is live in the tree today.
 *
 * Three problem classes, the last two being REQ-005's reverse ratchet — a
 * baseline entry is a claim about the tree, and a claim that stopped being
 * true is itself a failure:
 *
 *   1. declared, not exported, not baselined;
 *   2. baselined but no longer declared;
 *   3. baselined but now exported (including "already public by star export").
 *
 * A provider now contributes several surfaces, so a baseline entry is stale
 * only once *every* module that declares it has stopped needing it.
 *
 * @param {ExportSurface[]} surfaces
 * @param {Record<string, Record<string, string>>} baseline Provider to type
 *   name to rationale.
 * @returns {string[]} Problem descriptions, empty when the surface is clean.
 */
export function checkExportSurface(surfaces, baseline) {
  /** @type {string[]} */
  const problems = [];
  /** @type {Map<string, ExportSurface[]>} */
  const byProvider = new Map();

  for (const surface of surfaces) {
    const known = byProvider.get(surface.provider);
    if (known) known.push(surface);
    else byProvider.set(surface.provider, [surface]);
  }

  for (const surface of surfaces) {
    if (!isCheckable(surface)) continue;
    if (isStarExported(surface)) continue;

    const exported = new Set(surface.exportedNames);
    const allowed = baseline[surface.provider] ?? {};
    for (const declaration of surface.declarations) {
      if (exported.has(declaration.name)) continue;
      if (Object.hasOwn(allowed, declaration.name)) continue;

      problems.push(
        `${surface.provider}: ${declaration.name} is declared at\n` +
          `  ${surface.sourcePath}:${declaration.line} but never re-exported from\n` +
          `  ${surface.indexPath}.\n` +
          "  Fix: add it to the `export type { ... } from " +
          `"${moduleSpecifier(surface.sourcePath)}"\` list in index.ts,\n` +
          `  or add a baseline entry in ${BASELINE_FILE}\n` +
          "  with a rationale."
      );
    }
  }

  const stale = (provider, name, because) =>
    `${provider}: stale baseline entry ${name} — ${because}\n` +
    `  Remove it from EXPORT_SURFACE_BASELINE in ${BASELINE_FILE}.`;

  for (const provider of Object.keys(baseline).sort()) {
    const checkable = (byProvider.get(provider) ?? []).filter(isCheckable);

    for (const name of Object.keys(baseline[provider]).sort()) {
      if (checkable.length === 0) {
        problems.push(
          stale(
            provider,
            name,
            `${provider} has no src/*.ts + src/index.ts pair under\n  packages/provider/.`
          )
        );
        continue;
      }

      const declaring = checkable.filter((surface) =>
        surface.declarations.some((entry) => entry.name === name)
      );
      if (declaring.length === 0) {
        problems.push(
          stale(
            provider,
            name,
            "no exported interface by that name is declared in\n" +
              `  ${path.posix.dirname(checkable[0].sourcePath)}/*.ts.`
          )
        );
        continue;
      }

      // The entry still earns its place while any module that declares the
      // name is checked and does not export it.
      const live = declaring.some(
        (surface) =>
          !isStarExported(surface) && !surface.exportedNames.includes(name)
      );
      if (live) continue;

      const starred = declaring.find(isStarExported);
      if (starred) {
        problems.push(
          stale(
            provider,
            name,
            `${starred.indexPath} star-exports ` +
              `${moduleSpecifier(starred.sourcePath)} (directly or\n` +
              `  transitively), so every declaration in ${starred.sourcePath}\n` +
              "  is already public."
          )
        );
        continue;
      }

      problems.push(
        stale(
          provider,
          name,
          `it is now re-exported from ${declaring[0].indexPath}.`
        )
      );
    }
  }

  return problems;
}
