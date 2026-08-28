import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { REPO_ROOT, readProviderNames } from "./provider-inventory.mjs";

/**
 * The provider export surface: which `*Namespace` types a provider declares as
 * public in `src/types.ts`, and which of them its `src/index.ts` actually
 * re-exports.
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
 * `scripts/lib/provider-inventory.mjs` precedent: `read*` touch the
 * filesystem, `checkExportSurface` is pure surfaces-in/problems-out. That is
 * what lets the guard drive the ratchet from synthetic surfaces instead of
 * depending on whichever defect happens to be live in the tree.
 *
 * Two things this module deliberately does NOT do:
 *
 *   - It never builds a `ts.Program`. Both `tests/unit/request-input-types.test.ts`
 *     and `tests/unit/fal-request-input-types.test.ts` do, under a 120s
 *     timeout, and this checker runs in the cross-cutting block of every
 *     provider's fast gate. Parse-only `ts.createSourceFile` over all 29
 *     providers measures 0.9-1.0s wall including node startup — 0.899s and
 *     0.927s on the machines that planned and reviewed this, 1.0s over three
 *     runs on the one that implemented it — which keeps
 *     `CROSS_CUTTING_COST_SECONDS` unmoved. The importability proof that
 *     genuinely needs a program lives in the fal-scoped
 *     `tests/fixtures/fal-request-input-types.ts` fixture instead.
 *   - It does not look beyond `src/types.ts`. Seven exported `*Namespace`
 *     interfaces live in `b2/src/s3-types.ts` and `kie/src/responses.ts`; all
 *     seven are public today. 407 of the 414 namespaces in the tree are in
 *     `types.ts`, which is where the defect happened; widening the rule is the
 *     burn-down bead's job.
 */

/** Where the baseline the problem messages point at actually lives. */
const BASELINE_FILE = "tests/unit/provider-export-surface.test.ts";

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
 * Read the exported, top-level `*Namespace` interfaces a provider declares.
 *
 * `export` on the declaration is the signal of public intent; a module-private
 * helper such as fal's bare `type FalNanoBanana2LiteTextToImageFn` is not one
 * and is correctly out of reach. The walk is top-level only — all 407
 * namespaces in the tree are declared at file scope, so `ts.forEachChild` at
 * that depth loses nothing.
 *
 * @param {string} typesPath Absolute path to a provider's `src/types.ts`.
 * @returns {{ name: string, line: number }[]} Declarations in file order, with
 *   1-based line numbers so a problem message can cite `types.ts:1810`.
 */
export function readNamespaceDeclarations(typesPath) {
  return parseNamespaceDeclarations(
    typesPath,
    fs.readFileSync(typesPath, "utf8")
  );
}

/**
 * The pure half of {@link readNamespaceDeclarations}: same walk, source text
 * instead of a path, so the guard can assert the rule against synthetic files
 * that do not exist on disk — a `Namespace` name inside a comment or a string
 * literal, an interface with no `export` modifier (REQ-011).
 *
 * @param {string} typesPath Repo-relative or absolute; used only for labelling.
 * @param {string} source
 * @returns {{ name: string, line: number }[]}
 */
export function parseNamespaceDeclarations(typesPath, source) {
  const sourceFile = parseSourceFile(typesPath, source);
  /** @type {{ name: string, line: number }[]} */
  const declarations = [];

  ts.forEachChild(sourceFile, (node) => {
    if (!ts.isInterfaceDeclaration(node)) return;
    if (!node.name.text.endsWith("Namespace")) return;
    const flags = ts.getCombinedModifierFlags(node);
    if (!(flags & ts.ModifierFlags.Export)) return;

    const { line } = sourceFile.getLineAndCharacterOfPosition(
      node.getStart(sourceFile)
    );
    declarations.push({ name: node.name.text, line: line + 1 });
  });

  return declarations;
}

/**
 * Read what a provider's `src/index.ts` publishes.
 *
 * Both re-export forms the repository actually uses are handled:
 *
 *   - a `NamedExports` clause — 27 providers hand-list every name;
 *   - no export clause at all with a module specifier, i.e.
 *     `export * from ...` / `export type * from ...`. `telegram/src/index.ts:3`
 *     is `export type * from "./types"`, which publishes every declaration in
 *     its own `types.ts`; a `NamedExports`-only reading calls
 *     `TelegramPostNamespace` unexported and is wrong. A star at any *other*
 *     module — `b2/src/index.ts:12`, `export type * from "./s3-types"` — says
 *     nothing about `types.ts` and is correctly ignored.
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
 * @param {string} indexPath Absolute path to a provider's `src/index.ts`.
 * @returns {{ names: string[], starExportsTypes: boolean }} `starExportsTypes`
 *   means every declaration in the sibling `types.ts` is already public, so a
 *   name set would be the wrong answer rather than an incomplete one.
 */
export function readExportedNames(indexPath) {
  return parseExportedNames(indexPath, fs.readFileSync(indexPath, "utf8"));
}

/**
 * The pure half of {@link readExportedNames}.
 *
 * @param {string} indexPath Repo-relative or absolute; the star-export check
 *   resolves the module specifier against its directory, so both sides of that
 *   comparison come from this argument and agree either way.
 * @param {string} source
 * @returns {{ names: string[], starExportsTypes: boolean }}
 */
export function parseExportedNames(indexPath, source) {
  const sourceFile = parseSourceFile(indexPath, source);
  const ownTypesModule = path.resolve(path.dirname(indexPath), "types");
  /** @type {string[]} */
  const names = [];
  let starExportsTypes = false;

  ts.forEachChild(sourceFile, (node) => {
    if (!ts.isExportDeclaration(node)) return;

    if (node.exportClause === undefined) {
      if (!node.moduleSpecifier || !ts.isStringLiteral(node.moduleSpecifier)) {
        return;
      }
      const specifier = node.moduleSpecifier.text.replace(/\.(m?[jt]s)$/, "");
      const resolved = path.resolve(path.dirname(indexPath), specifier);
      if (resolved === ownTypesModule) starExportsTypes = true;
      return;
    }

    if (!ts.isNamedExports(node.exportClause)) return;
    for (const element of node.exportClause.elements) {
      names.push(element.name.text);
      if (element.propertyName) names.push(element.propertyName.text);
    }
  });

  return { names, starExportsTypes };
}

/**
 * Read one export surface per provider directory on disk.
 *
 * Provider discovery is `readProviderNames`, so a new package is covered the
 * day it lands rather than when someone remembers a list. A provider missing
 * either file yields a surface with a `null` side; `checkExportSurface` skips
 * those rather than treating them as violations (REQ-003). No provider is in
 * that state today — all 29 ship both files — but the shape is what the guard
 * asserts against instead of assuming.
 *
 * @param {string} [repoRoot]
 * @returns {{
 *   provider: string,
 *   typesPath: string,
 *   indexPath: string,
 *   declarations: { name: string, line: number }[] | null,
 *   exportedNames: string[] | null,
 *   starExportsTypes: boolean,
 * }[]} Surfaces with repo-relative paths, so problem messages read the same
 *   from any checkout and synthetic surfaces can be written by hand.
 */
export function readProviderExportSurfaces(repoRoot = REPO_ROOT) {
  return readProviderNames(repoRoot).map((provider) => {
    const relative = (file) =>
      path.posix.join("packages", "provider", provider, "src", file);
    const absolute = (file) =>
      path.join(repoRoot, "packages", "provider", provider, "src", file);

    const typesFile = absolute("types.ts");
    const indexFile = absolute("index.ts");
    const hasTypes = fs.existsSync(typesFile);
    const hasIndex = fs.existsSync(indexFile);
    const exports = hasIndex
      ? readExportedNames(indexFile)
      : { names: null, starExportsTypes: false };

    return {
      provider,
      typesPath: relative("types.ts"),
      indexPath: relative("index.ts"),
      declarations: hasTypes ? readNamespaceDeclarations(typesFile) : null,
      exportedNames: exports.names,
      starExportsTypes: exports.starExportsTypes,
    };
  });
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
 * @param {ReturnType<typeof readProviderExportSurfaces>} surfaces
 * @param {Record<string, Record<string, string>>} baseline Provider to type
 *   name to rationale.
 * @returns {string[]} Problem descriptions, empty when the surface is clean.
 */
export function checkExportSurface(surfaces, baseline) {
  /** @type {string[]} */
  const problems = [];
  const byProvider = new Map(
    surfaces.map((surface) => [surface.provider, surface])
  );

  for (const surface of surfaces) {
    if (!isCheckable(surface)) continue;
    // Every declaration in this file is already public; a name set would be
    // the wrong answer here rather than an incomplete one (DC-4).
    if (surface.starExportsTypes) continue;

    const exported = new Set(surface.exportedNames);
    const allowed = baseline[surface.provider] ?? {};
    for (const declaration of surface.declarations) {
      if (exported.has(declaration.name)) continue;
      if (Object.hasOwn(allowed, declaration.name)) continue;

      problems.push(
        `${surface.provider}: ${declaration.name} is declared at\n` +
          `  ${surface.typesPath}:${declaration.line} but never re-exported from\n` +
          `  ${surface.indexPath}.\n` +
          '  Fix: add it to the `export type { ... } from "./types"` list in index.ts,\n' +
          `  or add a baseline entry in ${BASELINE_FILE}\n` +
          "  with a rationale."
      );
    }
  }

  const stale = (provider, name, because) =>
    `${provider}: stale baseline entry ${name} — ${because}\n` +
    `  Remove it from EXPORT_SURFACE_BASELINE in ${BASELINE_FILE}.`;

  for (const provider of Object.keys(baseline).sort()) {
    for (const name of Object.keys(baseline[provider]).sort()) {
      const surface = byProvider.get(provider);

      if (!surface || !isCheckable(surface)) {
        problems.push(
          stale(
            provider,
            name,
            `${provider} has no src/types.ts + src/index.ts pair under\n  packages/provider/.`
          )
        );
        continue;
      }
      if (surface.starExportsTypes) {
        problems.push(
          stale(
            provider,
            name,
            `${surface.indexPath} star-exports ./types, so every\n` +
              `  declaration in ${surface.typesPath} is already public.`
          )
        );
        continue;
      }
      if (!surface.declarations.some((entry) => entry.name === name)) {
        problems.push(
          stale(
            provider,
            name,
            `no exported interface by that name is declared in\n  ${surface.typesPath}.`
          )
        );
        continue;
      }
      if (surface.exportedNames.includes(name)) {
        problems.push(
          stale(
            provider,
            name,
            `it is now re-exported from ${surface.indexPath}.`
          )
        );
      }
    }
  }

  return problems;
}
