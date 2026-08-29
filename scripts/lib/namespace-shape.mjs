import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { REPO_ROOT, readProviderNames } from "./provider-inventory.mjs";

/**
 * The namespace shape inventory: which dot paths a provider factory declares
 * in its return tree, and what shape each one resolves to — a callable, a
 * plain object, or the `Object.assign` callable-with-children idiom this
 * repository uses for dual-purpose namespaces.
 *
 * Four sibling slices of `ac-c2cc4j` each declared `fal`'s `geminiOmniFlash`
 * namespace: one as a callable, three as plain objects. Every slice passed its
 * own gate, because the defect exists only BETWEEN the branches — no single
 * tree holds it — and the run reached publish unflagged (`RF-1` / `RR-5`,
 * follow-up `ac-j4z1t1`). Every guard in this repository reads one tree; this
 * module compares several without merging them.
 *
 * Reading and checking are kept apart, following
 * `scripts/lib/provider-inventory.mjs` — and `scripts/lib/export-surface.mjs`,
 * which is on no merged ref: it lands with
 * `gc/ac-fxwes2-provider-export-surface`. `read*` touch the filesystem or
 * shell `git show`, `parse*` and `check*` are pure source-in / report-out.
 * That split is what lets the guard drive every rule from synthetic committed
 * fixtures instead of from four worktrees and a pair of unmerged branches.
 *
 * Four things this module deliberately does NOT do:
 *
 *   - It never builds a `ts.Program`. It runs in the cross-cutting block of
 *     every provider's fast gate, where `tests/unit/request-input-types.test.ts`
 *     and its 120s program-building timeout are the counter-example to avoid.
 *     Parse-only `ts.createSourceFile` over all 29 providers is what keeps
 *     `CROSS_CUTTING_COST_SECONDS` affordable.
 *   - It does not reuse `scripts/lib/endpoint-walk.mjs`, which already walks
 *     factory return trees. That module resolves entry files against a
 *     module-level `REPO_ROOT` and so cannot be pointed at another ref, it
 *     builds a whole type-aware project rather than parsing one file, and its
 *     dot paths deliberately drop the `METHOD_KEYS` and `STREAM_KEYS` segments
 *     that shape comparison needs. The gate for this module greps its source
 *     for that project builder by name, so the name stays out of it.
 *   - It resolves no symbol outside the provider's own `src/`. The specifier
 *     resolver rejects anything containing `..` or not starting with `.`, so
 *     composition is followed to a sibling file and no further; another
 *     workspace package is out of scope by construction rather than by
 *     convention.
 *   - It does not follow an imported identifier in plain property position.
 *     `schema: GhostRequestSchema` stays `unresolved` on purpose: a zod schema
 *     is metadata rather than a namespace, and following it would grow all 29
 *     inventories with schema members and leave the ratchet's baseline
 *     documenting nothing. That line is enforced by WHERE the resolution
 *     primitive is called from — spreads, calls and member bases — not by a
 *     name filter.
 *
 * The one honest failure mode: a call whose callee this module cannot reach —
 * an import from another package, a value built by a loop — is classified
 * `callable`, so a call that returns a plain object reads as a callable. That
 * is deliberate (never degrade a resolved path to `unresolved` just because
 * resolution got further and then stopped); it is a false positive rather than
 * a miss; it matters only when another ref declares the same dot path
 * incompatibly; and the in-tree ratchet in
 * `tests/unit/provider-namespace-shape.test.ts` pins every current
 * classification, so a surprising one arrives as a reviewable diff rather than
 * at merge time.
 */

/**
 * How many module hops one resolution may take.
 *
 * The deepest real chain in this repository is three — `b2.ts` → `s3.ts`, and
 * `kie.ts` → `with-paid-gate.ts` → `veo.ts` — so six is headroom rather than a
 * constraint anything is written against. It exists so a cycle or a pathology
 * terminates by arithmetic and not by luck.
 */
const MODULE_DEPTH_LIMIT = 6;

/**
 * Node budget for one derivation's resolution work, as a backstop.
 *
 * The visited set already terminates cycles; this bounds the other shape of
 * runaway — a wide fan-out re-resolving the same expressions — so the guard
 * cannot become the slow test in the cross-cutting block by accident.
 */
const RESOLUTION_LIMIT = 200000;

/** Where the baseline the ratchet problems point at actually lives. */
const BASELINE_FILE = "tests/unit/provider-namespace-shape.test.ts";

/**
 * @typedef {"callable"|"object"|"callable-with-children"|"unresolved"} Shape
 */

/** The closed shape vocabulary, in report order. */
export const SHAPES = Object.freeze([
  "callable",
  "object",
  "callable-with-children",
  "unresolved",
]);

/**
 * Dot path standing for the provider object itself.
 *
 * It is emitted only when the factory's return value is not a reachable object
 * literal, so it always carries `unresolved` and never participates in a
 * comparison. The angle brackets are not identifier characters, so it cannot
 * collide with a real property path — the same trick `<spread:n>` and
 * `<computed:n>` use for the members inside a literal that have no static name.
 */
export const ROOT_PATH = "<root>";

/** @type {{ shape: Shape, children: ts.ObjectLiteralExpression[] }} */
const UNRESOLVED = { shape: "unresolved", children: [] };

/**
 * The factory name of a provider, as a case-insensitive comparison target.
 *
 * The primary factory of provider `p` is the exported `create*` function whose
 * name, lowercased, equals `"create" + p` with dashes removed. This was
 * executed over all 29 providers on disk: 29 unique matches, 0 mismatches,
 * including `createOpenAi`, `createGoogleFlow`, `createFreeMediaUpload`,
 * `createTheSportsDB`, `createOpenLigaDB`, `createDoltHub`, and `createX`,
 * which `createXOAuth` does not shadow. No hand-maintained table, so a
 * provider added tomorrow is covered the day it lands.
 *
 * @param {string} provider
 * @returns {string}
 */
export function factoryNameFor(provider) {
  return `create${provider.replace(/-/g, "")}`;
}

/**
 * Parse source text with parent pointers, which `node.getStart` needs.
 *
 * @param {string} fileName Used for line reporting only; it need not exist on
 *   disk, which is what lets the guard run synthetic fixtures through the real
 *   parser.
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
 * Strip the wrappers that carry no shape information.
 *
 * `as unknown as ElevenLabsProvider`, a parenthesised expression and a `!`
 * assertion all describe the same value; unwrapping them here keeps every
 * classification rule below written against real expressions.
 *
 * @param {ts.Node} node
 * @returns {ts.Node}
 */
function unwrap(node) {
  let current = node;
  while (
    ts.isParenthesizedExpression(current) ||
    ts.isAsExpression(current) ||
    ts.isSatisfiesExpression(current) ||
    ts.isTypeAssertionExpression(current) ||
    ts.isNonNullExpression(current)
  ) {
    current = current.expression;
  }
  return current;
}

/**
 * Is this call the `Object.assign` house idiom?
 *
 * @param {ts.CallExpression} call
 * @returns {boolean}
 */
function isObjectAssign(call) {
  const callee = unwrap(call.expression);
  return (
    ts.isPropertyAccessExpression(callee) &&
    ts.isIdentifier(callee.expression) &&
    callee.expression.text === "Object" &&
    callee.name.text === "assign"
  );
}

/**
 * 1-based line of a node, so a report can cite `fal.ts:1772`.
 *
 * The line is read from the node's OWN source file, which is not always the
 * entry file: a path reached through a sibling module is defined where it is
 * written, and citing the entry file's line numbering for it would print a
 * number that points at unrelated source.
 *
 * @param {ts.Node} node
 * @returns {number}
 */
function lineOf(node) {
  const sourceFile = node.getSourceFile();
  return (
    sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1
  );
}

/**
 * The exported factory, by case-insensitive name.
 *
 * Both declaration forms are accepted — `export function createFal(...)`, which
 * is what all 29 providers use today, and an exported `const` bound to an
 * arrow or function expression — so a provider that switches form keeps its
 * coverage instead of silently dropping to `unresolved`.
 *
 * @param {ts.SourceFile} sourceFile
 * @param {string} factoryName
 * @returns {{ name: string, fn: ts.SignatureDeclaration } | null}
 */
function findFactory(sourceFile, factoryName) {
  const target = factoryName.toLowerCase();
  /** @type {{ name: string, fn: ts.SignatureDeclaration } | null} */
  let found = null;

  ts.forEachChild(sourceFile, (node) => {
    if (found) return;

    if (ts.isFunctionDeclaration(node) && node.name) {
      if (node.name.text.toLowerCase() !== target) return;
      if (node.body) found = { name: node.name.text, fn: node };
      return;
    }

    if (!ts.isVariableStatement(node)) return;
    for (const declaration of node.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name)) continue;
      if (declaration.name.text.toLowerCase() !== target) continue;
      const initializer = declaration.initializer
        ? unwrap(declaration.initializer)
        : undefined;
      if (
        initializer &&
        (ts.isArrowFunction(initializer) ||
          ts.isFunctionExpression(initializer))
      ) {
        found = { name: declaration.name.text, fn: initializer };
      }
    }
  });

  return found;
}

/**
 * Is this node something a call can name and this module can read a return from?
 *
 * @param {ts.Node} node
 * @returns {boolean}
 */
function isCallableNode(node) {
  return (
    ts.isArrowFunction(node) ||
    ts.isFunctionExpression(node) ||
    ts.isFunctionDeclaration(node) ||
    ts.isMethodDeclaration(node)
  );
}

/**
 * Collect the `const` and `function` declarations of one statement list.
 *
 * Function declarations count. `anthropic` and `fireworks` build most of their
 * surface as `async function getFilesContent(...)` inside the factory and name
 * it by shorthand from both the path layer and the verb layer; reading only
 * `const` would report 134 endpoint leaves across those two providers as
 * unresolved, which is most of what they ship.
 *
 * @param {ts.NodeArray<ts.Statement>} statements
 * @param {Map<string, ts.Node>} into Later declarations shadow earlier ones,
 *   so callers pass the scopes outermost first.
 * @returns {void}
 */
function collectStatementBindings(statements, into) {
  for (const statement of statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name) {
      into.set(statement.name.text, statement);
      continue;
    }
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name)) continue;
      if (!declaration.initializer) continue;
      into.set(declaration.name.text, declaration.initializer);
    }
  }
}

/**
 * The bindings an identifier can name, from where it is written.
 *
 * The scope chain is the node's own module top level followed by every
 * enclosing function body, outermost first, so an inner declaration shadows an
 * outer one. That is where the repository actually puts them — `fal.ts` builds
 * `const qwenImage = Object.assign(...)` inside `createFal` and names it by
 * shorthand in the returned literal, and the `kie` sub-factories do the same.
 *
 * Deriving the chain from the node rather than passing one map down is what
 * makes cross-file composition correct: a literal reached through a sibling
 * module names that module's bindings, not the entry file's. `kie.ts` walking
 * `claude.ts`'s returned literal resolves `Object.assign(submitMessage, …)`
 * against `createClaudeProvider`'s body, which is the only place that name
 * exists.
 *
 * @param {ts.Node} node
 * @param {ResolutionContext} ctx
 * @returns {Map<string, ts.Node>}
 */
function bindingsFor(node, ctx) {
  /** @type {ts.Node[]} Outermost first. */
  const chain = [];
  for (let current = node; current; current = current.parent) {
    if (ts.isSourceFile(current)) {
      chain.unshift(current);
      break;
    }
    if (isCallableNode(current) && current.body && ts.isBlock(current.body)) {
      chain.unshift(current.body);
    }
  }
  if (chain.length === 0) return new Map();

  // The parent chain of a node is fixed, so the innermost scope identifies the
  // whole chain and one cache entry serves every node inside it.
  const innermost = chain[chain.length - 1];
  const cached = ctx.scopes.get(innermost);
  if (cached) return cached;

  /** @type {Map<string, ts.Node>} */
  const bindings = new Map();
  for (const scope of chain)
    collectStatementBindings(scope.statements, bindings);
  ctx.scopes.set(innermost, bindings);
  return bindings;
}

/**
 * The relative imports of one module, by the local name each binds.
 *
 * Only `import { a, b as c } from "./x"` and a default import are collected —
 * the two forms the providers use. A namespace import (`import * as x`) is not,
 * because nothing in this repository composes a provider through one and
 * guessing at it would be a resolution rule with no fixture behind it.
 *
 * @param {ts.SourceFile} sourceFile
 * @param {ResolutionContext} ctx
 * @returns {Map<string, { specifier: string, exported: string }>}
 */
function importsFor(sourceFile, ctx) {
  const cached = ctx.imports.get(sourceFile);
  if (cached) return cached;

  /** @type {Map<string, { specifier: string, exported: string }>} */
  const imports = new Map();
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    // `import type { … }` is a type-only edge; it binds no value.
    if (statement.importClause && statement.importClause.isTypeOnly) continue;
    if (!ts.isStringLiteral(statement.moduleSpecifier)) continue;
    const specifier = statement.moduleSpecifier.text;
    const clause = statement.importClause;
    if (!clause) continue;

    if (clause.name) {
      imports.set(clause.name.text, { specifier, exported: "default" });
    }
    const bindings = clause.namedBindings;
    if (!bindings || !ts.isNamedImports(bindings)) continue;
    for (const element of bindings.elements) {
      if (element.isTypeOnly) continue;
      imports.set(element.name.text, {
        specifier,
        exported: (element.propertyName ?? element.name).text,
      });
    }
  }

  ctx.imports.set(sourceFile, imports);
  return imports;
}

/**
 * The value declarations one module exports, by exported name.
 *
 * Both `export function createS3(…)` and `export const createS3 = …` count, as
 * does a re-export list `export { createS3 }` naming a local declaration. An
 * unexported declaration is deliberately not reachable: the import told us
 * which name to ask for, and answering with a private one that happens to share
 * it would be a resolution this module cannot justify.
 *
 * @param {ts.SourceFile} sourceFile
 * @param {ResolutionContext} ctx
 * @returns {Map<string, ts.Node>}
 */
function exportsFor(sourceFile, ctx) {
  const cached = ctx.exports.get(sourceFile);
  if (cached) return cached;

  /** @type {Map<string, ts.Node>} */
  const local = new Map();
  collectStatementBindings(sourceFile.statements, local);

  /** @type {Map<string, ts.Node>} */
  const exported = new Map();
  const isExported = (statement) =>
    (ts.canHaveModifiers(statement)
      ? ts.getModifiers(statement)
      : undefined
    )?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) ??
    false;

  for (const statement of sourceFile.statements) {
    if (
      ts.isExportDeclaration(statement) &&
      !statement.moduleSpecifier &&
      statement.exportClause &&
      ts.isNamedExports(statement.exportClause)
    ) {
      for (const element of statement.exportClause.elements) {
        const declaration = local.get(
          (element.propertyName ?? element.name).text
        );
        if (declaration) exported.set(element.name.text, declaration);
      }
      continue;
    }
    if (!isExported(statement)) continue;
    if (ts.isFunctionDeclaration(statement) && statement.name) {
      exported.set(statement.name.text, statement);
      continue;
    }
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name)) continue;
      if (!declaration.initializer) continue;
      exported.set(declaration.name.text, declaration.initializer);
    }
  }

  ctx.exports.set(sourceFile, exported);
  return exported;
}

/**
 * The object literal a factory returns, or `null`.
 *
 * Call expressions are unwrapped REPEATEDLY, and the rule is "the first
 * argument that is an object literal", not "the first argument". One unwrap is
 * not enough and neither is taking argument zero: `kie.ts` and `xai.ts` both
 * return `attachExamples(withPaidGate("<name>", { ... }, { config }))`, so a
 * shallower rule leaves the two providers under the heaviest fan-out — the two
 * most likely to trigger this detector — entirely `unresolved`.
 *
 * Identifiers are deliberately NOT resolved here. `elevenlabs` returns
 * `attachExamples(provider as unknown as ElevenLabsProvider)` where `provider`
 * is an empty literal filled by a loop; following the binding would report an
 * empty inventory, which reads as "this provider declares nothing" rather than
 * "this provider was not analysed".
 *
 * @param {ts.Node} node
 * @returns {ts.ObjectLiteralExpression | null}
 */
function resolveRootLiteral(node) {
  const expr = unwrap(node);
  if (ts.isObjectLiteralExpression(expr)) return expr;
  if (!ts.isCallExpression(expr)) return null;

  for (const argument of expr.arguments) {
    const literal = resolveRootLiteral(argument);
    if (literal) return literal;
  }
  return null;
}

/**
 * @typedef {object} ResolutionContext
 * @property {((specifier: string) => { fileName: string, source: string } | null) | null} loadModule
 *   Supplied by {@link inventoryFrom}; `null` in the three-argument form of
 *   {@link parseNamespaceShapes}, which resolves inside one file and nowhere
 *   else.
 * @property {number} maxDepth Module hops, see {@link MODULE_DEPTH_LIMIT}.
 * @property {{ left: number }} budget See {@link RESOLUTION_LIMIT}.
 * @property {Map<ts.Node, Map<string, ts.Node>>} scopes
 * @property {Map<ts.SourceFile, Map<string, { specifier: string, exported: string }>>} imports
 * @property {Map<ts.SourceFile, Map<string, ts.Node>>} exports
 * @property {Map<string, { sourceFile: ts.SourceFile } | null>} moduleBySpecifier
 * @property {Map<string, { sourceFile: ts.SourceFile }>} moduleByFile
 */

/**
 * The mutable state one derivation carries while resolving.
 *
 * Every cache lives here rather than at module level, so two derivations of one
 * tree cannot observe each other and `it("derives the same inventory twice,
 * byte for byte")` stays a real assertion.
 *
 * @param {{ modules?: (specifier: string) => { fileName: string, source: string } | null, maxDepth?: number }} options
 * @returns {ResolutionContext}
 */
function createResolutionContext(options) {
  return {
    loadModule: typeof options.modules === "function" ? options.modules : null,
    maxDepth: options.maxDepth ?? MODULE_DEPTH_LIMIT,
    budget: { left: RESOLUTION_LIMIT },
    scopes: new Map(),
    imports: new Map(),
    exports: new Map(),
    moduleBySpecifier: new Map(),
    moduleByFile: new Map(),
  };
}

/**
 * Parse the sibling module a specifier names, or `null`.
 *
 * Resolution is string work over the file list the reader already holds, which
 * is what keeps this off the filesystem: `readNamespaceShapesFromDir` answers
 * out of `readdirSync` and `readNamespaceShapesFromRef` out of `git show`, and
 * both go through the same closure, which is why the two produce equal
 * inventories for equal content.
 *
 * @param {string} specifier
 * @param {ResolutionContext} ctx
 * @returns {{ sourceFile: ts.SourceFile } | null}
 */
function moduleFor(specifier, ctx) {
  if (!ctx.loadModule) return null;
  const cached = ctx.moduleBySpecifier.get(specifier);
  if (cached !== undefined) return cached;

  const loaded = ctx.loadModule(specifier);
  /** @type {{ sourceFile: ts.SourceFile } | null} */
  let info = null;
  if (loaded && typeof loaded.source === "string") {
    info = ctx.moduleByFile.get(loaded.fileName) ?? {
      sourceFile: parseSourceFile(loaded.fileName, loaded.source),
    };
    ctx.moduleByFile.set(loaded.fileName, info);
  }
  ctx.moduleBySpecifier.set(specifier, info);
  return info;
}

/**
 * Where an identifier's declaration is, following one import hop if it takes one.
 *
 * @param {ts.Identifier} identifier
 * @param {ResolutionContext} ctx
 * @param {Set<string>} seen Keyed `<file>::<name>`, not by name alone, so the
 *   same name in two modules does not shadow itself into a false cycle.
 * @param {number} depth
 * @returns {{ node: ts.Node, seen: Set<string>, depth: number } | null}
 */
function resolveIdentifierDeclaration(identifier, ctx, seen, depth) {
  const sourceFile = identifier.getSourceFile();
  const key = `${sourceFile.fileName}::${identifier.text}`;
  if (seen.has(key)) return null;
  const next = new Set([...seen, key]);

  const local = bindingsFor(identifier, ctx).get(identifier.text);
  if (local) return { node: local, seen: next, depth };

  const imported = importsFor(sourceFile, ctx).get(identifier.text);
  if (!imported) return null;
  if (depth >= ctx.maxDepth) return null;
  const module = moduleFor(imported.specifier, ctx);
  if (!module) return null;
  const declaration = exportsFor(module.sourceFile, ctx).get(imported.exported);
  if (!declaration) return null;
  return { node: declaration, seen: next, depth: depth + 1 };
}

/**
 * The expression a function returns, or `null`.
 *
 * The last top-level `return` — the same rule {@link parseNamespaceShapes} uses
 * for the factory itself — plus the concise arrow body, which has no `return`
 * statement to find.
 *
 * @param {ts.Node} fn
 * @returns {ts.Node | null}
 */
function returnExpressionOf(fn) {
  const body = fn.body;
  if (!body) return null;
  if (!ts.isBlock(body)) return body;
  const returned = [...body.statements].reverse().find(ts.isReturnStatement);
  return returned && returned.expression ? returned.expression : null;
}

/**
 * The object literal a function's return names, or `null`.
 *
 * {@link resolveRootLiteral} is applied to the return statement's expression
 * and to nothing else. That narrowness is the whole rule: `resolveRootLiteral`
 * scans EVERY argument of a call and accepts an inline object literal, so
 * calling it on a call in property or argument position would return the
 * options bag of `withPaidGate("kie", createSunoProvider(…), { config })` and
 * invent a `kie.suno.config` namespace. It also does not follow identifiers,
 * which is what makes `withPaidGate`'s `return out as T` correctly yield
 * nothing and fall through to the argument pass-through below.
 *
 * @param {ts.Node} fn
 * @returns {ts.ObjectLiteralExpression | null}
 */
function functionReturnLiteral(fn) {
  const returned = returnExpressionOf(fn);
  return returned ? resolveRootLiteral(returned) : null;
}

/**
 * The function a call names — inline, local, or one import hop away.
 *
 * @param {ts.CallExpression} call
 * @param {ResolutionContext} ctx
 * @param {Set<string>} seen
 * @param {number} depth
 * @returns {{ fn: ts.Node, seen: Set<string>, depth: number } | null}
 */
function calleeFunction(call, ctx, seen, depth) {
  const callee = unwrap(call.expression);
  // `(() => { … })()` — kie's `post` builds its tree in an IIFE.
  if (isCallableNode(callee)) return { fn: callee, seen, depth };
  if (!ts.isIdentifier(callee)) return null;
  const target = resolveIdentifierDeclaration(callee, ctx, seen, depth);
  if (!target) return null;
  const declaration = unwrap(target.node);
  return isCallableNode(declaration)
    ? { fn: declaration, seen: target.seen, depth: target.depth }
    : null;
}

/**
 * The object literal an expression names, across sibling files, or `null`.
 *
 * This is the one primitive the composition rules share, and the only door out
 * of the entry file. It is called from three places and no others: a spread's
 * expression (R1, R2), a non-`Object.assign` call in value position (R3), and
 * the base of a member access reached from those. An imported identifier in
 * plain property position never reaches it, which is how REQ-006 keeps
 * `schema: GhostRequestSchema` opaque without a name filter.
 *
 * Nothing here throws. A missing file, an unresolvable specifier, an export
 * that is not a function, a cycle, an exhausted budget — every one of them
 * returns `null`, and the caller falls back to what it recorded before this
 * module could see across files.
 *
 * @param {ts.Node} node
 * @param {ResolutionContext} ctx
 * @param {Set<string>} seen
 * @param {number} depth
 * @returns {ts.ObjectLiteralExpression | null}
 */
function resolveToLiteral(node, ctx, seen, depth) {
  if (ctx.budget.left-- <= 0) return null;
  const expr = unwrap(node);

  if (ts.isObjectLiteralExpression(expr)) return expr;

  if (ts.isIdentifier(expr)) {
    const target = resolveIdentifierDeclaration(expr, ctx, seen, depth);
    return target
      ? resolveToLiteral(target.node, ctx, target.seen, target.depth)
      : null;
  }

  if (ts.isPropertyAccessExpression(expr)) {
    const base = resolveToLiteral(expr.expression, ctx, seen, depth);
    if (!base) return null;
    const value = memberValue(base, expr.name.text);
    return value ? resolveToLiteral(value, ctx, seen, depth) : null;
  }

  if (ts.isCallExpression(expr)) {
    const callee = calleeFunction(expr, ctx, seen, depth);
    if (!callee) return null;
    const literal = functionReturnLiteral(callee.fn);
    if (literal) return literal;

    // The shape-preserving wrapper pass-through. `withPaidGate` returns a
    // variable it filled in a loop, so its own return names no literal; the
    // tree it was handed is argument two. Arguments that are inline object
    // literals are NEVER tried: `{ config: paygate }` and `{ roots: [...] }`
    // are options bags, and accepting one would report it as a namespace.
    for (const argument of expr.arguments) {
      const inner = unwrap(argument);
      if (!ts.isCallExpression(inner) && !ts.isIdentifier(inner)) continue;
      const resolved = resolveToLiteral(inner, ctx, callee.seen, callee.depth);
      if (resolved) return resolved;
    }
    return null;
  }

  return null;
}

/**
 * Classify one property value, and say which literals to descend into.
 *
 *   - an arrow or function expression, or a call that is not `Object.assign`
 *     (the `jsonBody<...>(...)` endpoint-builder idiom) is `callable`;
 *   - an object literal is `object`;
 *   - `Object.assign(<callable>, { ... })` is `callable-with-children`, and its
 *     trailing object-literal arguments are the children. When the first
 *     argument is itself an object literal the result has no call signature, so
 *     it stays `object`;
 *   - an identifier resolves against {@link collectBindings}, guarded against
 *     a cycle;
 *   - a member access resolves when its base resolves to a literal this file
 *     holds. `fireworks` and `googleflow` compose their verb layer that way —
 *     `create: postV1.accounts.apiKeys.create` — and 104 endpoint leaves across
 *     the two would otherwise read as unresolved. A base that is not a
 *     reachable literal, such as `b2`'s `s3.buckets.create` where `s3` is
 *     another provider's factory call, stays unresolved;
 *   - anything else — a template expression, an `await`, an unresolvable
 *     binding — is `unresolved`.
 *
 * @param {ts.Node} node
 * @param {ResolutionContext} ctx
 * @param {Set<string>} seen Identifiers already being resolved, keyed
 *   `<file>::<name>` so a name that exists in two modules does not shadow
 *   itself into a false cycle.
 * @returns {{ shape: Shape, children: ts.ObjectLiteralExpression[] }}
 */
function classify(node, ctx, seen) {
  const expr = unwrap(node);

  if (ts.isObjectLiteralExpression(expr)) {
    return { shape: "object", children: [expr] };
  }
  if (
    ts.isArrowFunction(expr) ||
    ts.isFunctionExpression(expr) ||
    ts.isFunctionDeclaration(expr)
  ) {
    return { shape: "callable", children: [] };
  }
  if (ts.isCallExpression(expr)) {
    if (!isObjectAssign(expr)) return { shape: "callable", children: [] };

    const [target, ...rest] = expr.arguments;
    if (!target) return UNRESOLVED;
    const base = classify(target, ctx, seen);
    if (base.shape === "unresolved") return UNRESOLVED;

    const children = rest
      .map(unwrap)
      .filter((argument) => ts.isObjectLiteralExpression(argument));
    return {
      shape: base.shape === "object" ? "object" : "callable-with-children",
      children: [...base.children, ...children],
    };
  }
  if (ts.isMethodDeclaration(expr)) {
    return { shape: "callable", children: [] };
  }
  if (ts.isIdentifier(expr)) {
    const key = `${expr.getSourceFile().fileName}::${expr.text}`;
    if (seen.has(key)) return UNRESOLVED;
    // Bindings only, never imports: an imported identifier in plain property
    // position is metadata rather than a namespace (REQ-006).
    const binding = bindingsFor(expr, ctx).get(expr.text);
    if (!binding) return UNRESOLVED;
    return classify(binding, ctx, new Set([...seen, key]));
  }
  if (ts.isPropertyAccessExpression(expr)) {
    const base = classify(expr.expression, ctx, seen);
    for (const literal of base.children) {
      const value = memberValue(literal, expr.name.text);
      if (value) return classify(value, ctx, seen);
    }
    return UNRESOLVED;
  }

  return UNRESOLVED;
}

/**
 * The value a literal binds to one member name, or `null`.
 *
 * Last declaration wins, the way JavaScript itself resolves a repeated key.
 *
 * @param {ts.ObjectLiteralExpression} literal
 * @param {string} name
 * @returns {ts.Node | null}
 */
function memberValue(literal, name) {
  /** @type {ts.Node | null} */
  let value = null;
  for (const property of literal.properties) {
    if (staticName(property) !== name) continue;
    value = propertyValue(property) ?? value;
  }
  return value;
}

/**
 * The value expression of a named literal member, or `null` when it has none.
 *
 * @param {ts.ObjectLiteralElementLike} property
 * @returns {ts.Node | null}
 */
function propertyValue(property) {
  if (ts.isMethodDeclaration(property)) return property;
  if (ts.isPropertyAssignment(property)) return property.initializer;
  if (ts.isShorthandPropertyAssignment(property)) return property.name;
  return null;
}

/**
 * Record one dot path, keeping the last declaration the way JavaScript does.
 *
 * @param {object} state
 * @param {string} dotPath
 * @param {Shape} shape
 * @param {ts.Node} node
 * @returns {void}
 */
function record(state, dotPath, shape, node) {
  state.paths.set(dotPath, shape);
  state.lines.set(dotPath, lineOf(node));
}

/**
 * The static name of a literal member, or `null` when it has none.
 *
 * @param {ts.ObjectLiteralElementLike} property
 * @returns {string | null}
 */
function staticName(property) {
  const name = property.name;
  if (!name) return null;
  if (ts.isIdentifier(name) || ts.isStringLiteral(name)) return name.text;
  return null;
}

/**
 * Walk one object literal, recording a dot path per member.
 *
 * A spread contributes its members to the ENCLOSING namespace, so a resolved
 * one recurses into the same prefix and adds no segment (R1, R2). `kie` spreads
 * ten sub-provider factory calls into its root, `polymarket` six member
 * accesses into a sub-factory's return, and `telegram`'s root is
 * `{ ...post, post }`. A spread this module still cannot follow keeps its place
 * in the inventory under a bracketed sentinel rather than vanishing from it:
 * dropping it would quietly shrink what the detector claims to cover.
 *
 * A name repeated inside ONE literal is collected as a duplicate: that is the
 * in-tree half of `RF-1`, the shape an unreconciled fan-out merges to. Members
 * a resolved spread contributes are NOT duplicates of the enclosing literal's
 * own names (R5): `declared` is local to one invocation, and the spread's
 * members are recorded by a nested call with a set of its own. That is
 * `Object.assign` semantics, and `record` is last-write-wins with no shape
 * comparison — so two contributors declaring one dot path with DIFFERENT shapes
 * resolve silently to the last. It is the intended reading, and it is the one
 * in-provider case this module will not report. A name repeated across the
 * arguments of an `Object.assign` is likewise not a duplicate — later arguments
 * win by definition, and `fireworks` uses that deliberately three times to
 * re-point an inherited `post` alias at its own endpoint.
 *
 * @param {ts.ObjectLiteralExpression} literal
 * @param {string} prefix
 * @param {object} state
 * @returns {void}
 */
function walkLiteral(literal, prefix, state) {
  // One literal legitimately appears at several prefixes — the verb-layer
  // idiom reaches one endpoint object from two paths — so the guard is keyed by
  // the pair. Repeating a pair can only re-record what is already there, and a
  // spread cycle across two files would otherwise not terminate.
  const walked = state.walking.get(literal) ?? new Set();
  if (walked.has(prefix)) return;
  walked.add(prefix);
  state.walking.set(literal, walked);

  /** @type {Set<string>} */
  const declared = new Set();

  literal.properties.forEach((property, index) => {
    const join = (segment) => (prefix ? `${prefix}.${segment}` : segment);

    if (ts.isSpreadAssignment(property)) {
      const spread = resolveToLiteral(
        property.expression,
        state.ctx,
        new Set(),
        0
      );
      if (spread) {
        walkLiteral(spread, prefix, state);
        return;
      }
      record(state, join(`<spread:${index}>`), "unresolved", property);
      return;
    }

    const name = staticName(property);
    if (name === null) {
      record(state, join(`<computed:${index}>`), "unresolved", property);
      return;
    }

    const dotPath = join(name);
    if (declared.has(name)) state.duplicates.add(dotPath);
    declared.add(name);

    const value = propertyValue(property);
    if (value === null) {
      record(state, dotPath, "unresolved", property.name);
      return;
    }

    const { shape, children } = classify(value, state.ctx, new Set());
    record(state, dotPath, shape, property.name);
    for (const child of children) walkLiteral(child, dotPath, state);
  });
}

/**
 * Derive the namespace shape inventory of one provider factory, from source.
 *
 * Pure: no filesystem, no subprocess, no repository root. Every path is
 * emitted from a sorted key list, so two derivations of one tree are
 * byte-identical under `JSON.stringify` and a diff between two refs shows only
 * real differences.
 *
 * @param {string} fileName Repo-relative or absolute; used only for labelling.
 * @param {string} source
 * @param {string} factoryName Matched case-insensitively; see
 *   {@link factoryNameFor}.
 * @param {{
 *   modules?: (specifier: string) => { fileName: string, source: string } | null,
 *   maxDepth?: number,
 * }} [options] The door to the provider's sibling files. Omitting it — the
 *   three-argument form every existing caller and every parsing fixture uses —
 *   resolves inside this one file and nowhere else, so `parse*` stays pure and
 *   a synthetic fixture supplies a virtual module map instead of touching disk.
 * @returns {{
 *   factory: string | null,
 *   paths: Record<string, Shape>,
 *   lines: Record<string, number>,
 *   unresolved: string[],
 *   duplicates: string[],
 * }} `factory` is the name as declared, so a reader scanning candidate files
 *   can tell "this file holds the factory" from "this file merely mentions it".
 */
export function parseNamespaceShapes(
  fileName,
  source,
  factoryName,
  options = {}
) {
  const sourceFile = parseSourceFile(fileName, source);
  const factory = findFactory(sourceFile, factoryName);
  const state = {
    ctx: createResolutionContext(options),
    paths: new Map(),
    lines: new Map(),
    duplicates: new Set(),
    walking: new Map(),
  };

  const body = factory && factory.fn.body;
  const statements = body && ts.isBlock(body) ? [...body.statements] : [];
  const returned = statements.reverse().find(ts.isReturnStatement);
  const literal =
    returned && returned.expression
      ? resolveRootLiteral(returned.expression)
      : null;

  if (literal) {
    walkLiteral(literal, "", state);
  } else {
    record(state, ROOT_PATH, "unresolved", returned ?? sourceFile);
  }

  const sorted = [...state.paths.keys()].sort();
  return {
    factory: factory ? factory.name : null,
    paths: Object.fromEntries(sorted.map((key) => [key, state.paths.get(key)])),
    lines: Object.fromEntries(sorted.map((key) => [key, state.lines.get(key)])),
    unresolved: sorted.filter((key) => state.paths.get(key) === "unresolved"),
    duplicates: [...state.duplicates].sort(),
  };
}

/**
 * @typedef {object} NamespaceInventory
 * @property {string} provider
 * @property {string} ref Label for the tree this was read from — a git ref, a
 *   directory, whatever the caller compared. It appears verbatim in reports.
 * @property {string | null} filePath Repo-relative path of the factory file.
 * @property {string | null} factory
 * @property {Record<string, Shape>} paths
 * @property {Record<string, number>} lines
 * @property {string[]} unresolved
 * @property {string[]} duplicates
 */

/** TypeScript sources, minus declaration files. */
function isSourceFileName(name) {
  return name.endsWith(".ts") && !name.endsWith(".d.ts");
}

/**
 * Candidate factory files, likeliest first.
 *
 * The file name is not derivable from the provider name — `googleflow` keeps
 * its factory in `src/google.ts` and `free-media-upload` in
 * `src/freeMediaUpload.ts` — so the search is a scan, not a lookup. Putting the
 * conventional name first makes it a one-file scan for 27 of 29 providers
 * while keeping the order, and therefore the result, deterministic.
 *
 * @param {string[]} files
 * @param {string} provider
 * @returns {string[]}
 */
function orderCandidates(files, provider) {
  const preferred = provider.replace(/-/g, "").toLowerCase();
  const rank = (file) =>
    path.basename(file, ".ts").toLowerCase() === preferred ? 0 : 1;
  return [...files]
    .filter(isSourceFileName)
    .sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}

/**
 * The inventory of a provider whose factory could not be located at all.
 *
 * @param {string} provider
 * @param {string} ref
 * @returns {NamespaceInventory}
 */
function missingFactory(provider, ref) {
  return {
    provider,
    ref,
    filePath: null,
    factory: null,
    paths: { [ROOT_PATH]: "unresolved" },
    lines: {},
    unresolved: [ROOT_PATH],
    duplicates: [],
  };
}

/**
 * The file a relative specifier names, or `null`.
 *
 * Relative specifiers only: anything containing `..`, or not starting with
 * `.`, is rejected, which keeps resolution inside the provider's own `src` and
 * out of every other package by construction rather than by convention.
 * Candidates are tried in a fixed order against a list the caller has already
 * sorted, so the result does not depend on directory order.
 *
 * `<spec>/index.ts`, and any `./x/y` specifier, are unreachable today: both
 * readers list only top-level files — `readdirSync` filtered to
 * `entry.isFile()`, and `git show` tree lines ending in `/` dropped — so
 * `files` holds bare names with no separator. The candidate is kept for the day
 * the listings widen, and until then it fails safe: a subdirectory import
 * degrades to `unresolved`, which the ratchet reports as an uncovered path.
 *
 * @param {string} specifier
 * @param {string[]} files
 * @returns {string | null}
 */
function resolveSpecifier(specifier, files) {
  if (!specifier.startsWith(".")) return null;
  if (specifier.includes("..")) return null;
  const bare = specifier.replace(/^\.\//, "");
  if (bare === "") return null;
  for (const candidate of [`${bare}.ts`, `${bare}/index.ts`]) {
    if (files.includes(candidate)) return candidate;
  }
  return null;
}

/**
 * Pick the factory file out of a provider's `src` directory and parse it.
 *
 * The module map handed to the parser is built from the two things this
 * function already holds — the `files` list and the `readFile` closure — so
 * following composition into a sibling file adds NO filesystem surface to
 * `readNamespaceShapesFromDir` and NO git surface to
 * `readNamespaceShapesFromRef`. That shared closure is exactly what makes the
 * two readers agree on identical content (AC-11).
 *
 * @param {string} provider
 * @param {string} ref
 * @param {string[]} files File names in the provider's `src` directory.
 * @param {(file: string) => string | null} readFile
 * @returns {NamespaceInventory}
 */
function inventoryFrom(provider, ref, files, readFile) {
  const factoryName = factoryNameFor(provider);
  const needle = factoryName.toLowerCase();
  const srcPath = (file) =>
    path.posix.join("packages", "provider", provider, "src", file);
  const modules = (specifier) => {
    const candidate = resolveSpecifier(specifier, files);
    if (candidate === null) return null;
    const source = readFile(candidate);
    if (source === null) return null;
    return { fileName: srcPath(candidate), source };
  };

  for (const file of orderCandidates(files, provider)) {
    const source = readFile(file);
    if (source === null) continue;
    // Cheap pre-filter: the AST below is the authority, this only decides
    // which candidates are worth parsing.
    if (!source.toLowerCase().includes(needle)) continue;

    const filePath = srcPath(file);
    const parsed = parseNamespaceShapes(filePath, source, factoryName, {
      modules,
    });
    if (parsed.factory === null) continue;
    return { provider, ref, filePath, ...parsed };
  }

  return missingFactory(provider, ref);
}

/**
 * Read one provider's inventory from a checkout on disk.
 *
 * Read-only: `readdirSync` plus `readFileSync`, no index, no worktree, no
 * network (`AC-02`).
 *
 * @param {string} dir Repository root of the checkout — this repo, a git
 *   worktree, or any other checkout of it.
 * @param {string} provider
 * @returns {NamespaceInventory}
 */
export function readNamespaceShapesFromDir(dir, provider) {
  const srcDir = path.join(dir, "packages", "provider", provider, "src");
  if (!fs.existsSync(srcDir)) return missingFactory(provider, dir);

  const files = fs.readdirSync(srcDir, { withFileTypes: true });
  return inventoryFrom(
    provider,
    dir,
    files.filter((entry) => entry.isFile()).map((entry) => entry.name),
    (file) => fs.readFileSync(path.join(srcDir, file), "utf8")
  );
}

/**
 * `git show <spec>` as text, or `null` when the object does not exist.
 *
 * The whole git surface of this module. It never checks out, never writes the
 * index, and never touches a worktree, which is what makes comparing N refs
 * safe to run against a repository someone else is working in (`AC-02`).
 *
 * @param {string} repoRoot
 * @param {string} spec A `<ref>:<path>` object specifier.
 * @returns {string | null}
 */
function gitShow(repoRoot, spec) {
  const result = spawnSync(
    "git",
    ["-C", repoRoot, "--no-pager", "show", spec],
    {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    }
  );
  if (result.status !== 0) return null;
  return result.stdout;
}

/**
 * Read one provider's inventory at a git ref, without checking it out.
 *
 * `git show <ref>:<dir>` prints a tree listing, so one extra `git show`
 * enumerates the provider's `src` directory at that ref and the file carrying
 * the matching `create` export is selected from it. Still `git show` and
 * nothing else — no ref enumeration, no branch discovery, no `origin`.
 *
 * Known limitation: {@link readTreeNamespaceShapes} discovers provider names
 * from the working tree, not from the ref, so a provider package that exists
 * only on a sibling branch is not enumerated for you. Name it explicitly and
 * this reader will still read it.
 *
 * @param {string} ref
 * @param {string} provider
 * @param {string} [repoRoot]
 * @returns {NamespaceInventory}
 */
export function readNamespaceShapesFromRef(
  ref,
  provider,
  repoRoot = REPO_ROOT
) {
  const srcDir = `packages/provider/${provider}/src`;
  const listing = gitShow(repoRoot, `${ref}:${srcDir}`);
  if (listing === null) return missingFactory(provider, ref);

  // `tree <ref>:<dir>` then a blank line then one entry per line, with a
  // trailing slash on subdirectories.
  const files = listing
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "" && !line.startsWith("tree "))
    .filter((line) => !line.endsWith("/"));

  return inventoryFrom(provider, ref, files, (file) =>
    gitShow(repoRoot, `${ref}:${srcDir}/${file}`)
  );
}

/**
 * Every provider's inventory, from the working tree.
 *
 * Provider discovery is `readProviderNames`, so a package added tomorrow is
 * covered the day it lands rather than when someone remembers a list.
 *
 * @param {string} [repoRoot]
 * @returns {NamespaceInventory[]}
 */
export function readTreeNamespaceShapes(repoRoot = REPO_ROOT) {
  return readProviderNames(repoRoot).map((provider) =>
    readNamespaceShapesFromDir(repoRoot, provider)
  );
}

/**
 * The two shape pairs that merge cleanly, keyed by their sorted names.
 *
 *   - `object` + `object` — declaration merging, children are additive. This is
 *     the `minimax` case of `ac-c2cc4j` that merged by luck rather than by
 *     design; it is still reported as a shared namespace.
 *   - `callable` + `callable-with-children` — the `Object.assign` house idiom,
 *     and exactly the resolution the publish slice adopted for
 *     `geminiOmniFlash`. Reporting it would be a false positive (`BR-04`).
 *
 * Every other pair collides: `callable` against `object` is `RF-1` verbatim
 * (`TS2717` plus duplicate keys in one literal); `object` against
 * `callable-with-children` has no call signature to merge into; two callables
 * or two scaffolds at one path are two owners, not an owner plus leaves.
 */
const COMPATIBLE_PAIRS = new Set([
  "object|object",
  "callable|callable-with-children",
]);

/**
 * @param {Shape} a
 * @param {Shape} b
 * @returns {boolean}
 */
function areCompatible(a, b) {
  return COMPATIBLE_PAIRS.has([a, b].sort().join("|"));
}

/**
 * Index base inventories by provider.
 *
 * A single inventory, an array of them, or nothing at all: comparing one
 * provider across refs wants one base, and the CLI comparing every provider
 * wants one per provider. A provider with no base entry compares against an
 * empty tree, which is the right answer for a package that does not exist on
 * the base ref.
 *
 * @param {NamespaceInventory | NamespaceInventory[] | null | undefined} base
 * @returns {Map<string, Record<string, Shape>>}
 */
function indexBases(base) {
  if (!base) return new Map();
  const list = Array.isArray(base) ? base : [base];
  return new Map(list.map((entry) => [entry.provider, entry.paths]));
}

/**
 * @typedef {object} CollisionRef
 * @property {string} ref
 * @property {Shape} shape
 * @property {number | null} line
 */

/**
 * @typedef {object} Collision
 * @property {string} provider
 * @property {string} dotPath
 * @property {CollisionRef[]} refs
 */

/**
 * @typedef {object} SharedNamespace
 * @property {string} provider
 * @property {string} dotPath
 * @property {Shape | "mixed"} shape `"mixed"` is a report label rather than a
 *   member of the vocabulary: the contributing refs do not agree, which is
 *   true of every collision and of nothing else.
 * @property {string[]} refs
 */

/**
 * Compare N inventories of the same providers against a common base.
 *
 * The comparison is BASE-RELATIVE, and that is load-bearing rather than an
 * optimisation. Every ref in a fan-out branches from one baseline and carries
 * the whole tree: `main`'s `fal.ts` is 2649 lines and each `geminiOmniFlash`
 * slice is that plus one addition. Without a base, every pre-existing path is
 * "shared by fifteen refs" — the report becomes the entire `fal` namespace
 * tree — and the `callable` against `callable` row fires on every pre-existing
 * leaf, so the one real collision arrives buried in hundreds of false ones.
 * That is a different route to the same unflagged publish this module exists to
 * prevent. Only dot paths whose presence or shape differs from the base
 * participate.
 *
 * `unresolved` never participates: a ref that could not be analysed at a path
 * is not evidence of anything at that path, and false positives are what a
 * planning-stage report cannot afford. Those paths surface in each inventory's
 * `unresolved` list and in the in-tree ratchet instead.
 *
 * @param {NamespaceInventory[]} inventories
 * @param {NamespaceInventory | NamespaceInventory[] | null} [baseInventory]
 * @returns {{ collisions: Collision[], shared: SharedNamespace[] }}
 */
export function checkNamespaceCollisions(inventories, baseInventory = null) {
  const bases = indexBases(baseInventory);
  /** @type {Map<string, NamespaceInventory[]>} */
  const byProvider = new Map();
  for (const inventory of inventories) {
    const group = byProvider.get(inventory.provider) ?? [];
    group.push(inventory);
    byProvider.set(inventory.provider, group);
  }

  /** @type {Collision[]} */
  const collisions = [];
  /** @type {SharedNamespace[]} */
  const shared = [];

  for (const provider of [...byProvider.keys()].sort()) {
    const group = byProvider.get(provider);
    const base = bases.get(provider) ?? {};
    const dotPaths = new Set();
    for (const inventory of group) {
      for (const dotPath of Object.keys(inventory.paths)) dotPaths.add(dotPath);
    }

    for (const dotPath of [...dotPaths].sort()) {
      /** @type {CollisionRef[]} */
      const participants = [];
      for (const inventory of group) {
        const shape = inventory.paths[dotPath];
        if (shape === undefined || shape === "unresolved") continue;
        if (shape === base[dotPath]) continue;
        participants.push({
          ref: inventory.ref,
          shape,
          line: inventory.lines[dotPath] ?? null,
        });
      }
      if (participants.length < 2) continue;

      const shapes = new Set(participants.map((entry) => entry.shape));
      shared.push({
        provider,
        dotPath,
        shape: shapes.size === 1 ? [...shapes][0] : "mixed",
        refs: participants.map((entry) => entry.ref),
      });

      const collides = participants.some((a, index) =>
        participants
          .slice(index + 1)
          .some((b) => !areCompatible(a.shape, b.shape))
      );
      if (collides) collisions.push({ provider, dotPath, refs: participants });
    }
  }

  return { collisions, shared };
}

/**
 * Provider key of a baseline entry that applies to every provider.
 *
 * One entry rather than 25 near-identical ones, and — more importantly — a new
 * provider package does not fail this guard on the day it lands for carrying
 * the same repository-wide convention every other provider carries.
 */
export const ANY_PROVIDER = "*";

/**
 * Does a baseline pattern cover this dot path?
 *
 * A pattern is an exact dot path unless it contains `*`, which matches any run
 * of characters. One rule covers all three shapes the baseline needs: a
 * repository-wide suffix (`*.schema`), a whole opaque subtree
 * (`buckets.*`), and the indexed sentinels (`<spread:*>`). The guard pins that
 * no pattern is a bare `*`, which would switch the ratchet off wholesale.
 *
 * @param {string} pattern
 * @param {string} dotPath
 * @returns {boolean}
 */
function matchesPattern(pattern, dotPath) {
  if (!pattern.includes("*")) return pattern === dotPath;
  const source = pattern
    .split("*")
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  return new RegExp(`^${source}$`).test(dotPath);
}

/**
 * The baseline patterns that apply to one provider, with their rationales.
 *
 * @param {Record<string, Record<string, string>>} baseline
 * @param {string} provider
 * @returns {string[]}
 */
function patternsFor(baseline, provider) {
  return [
    ...Object.keys(baseline[ANY_PROVIDER] ?? {}),
    ...Object.keys(baseline[provider] ?? {}),
  ];
}

/**
 * Ratchet one tree's inventories against a committed baseline.
 *
 * Pure, so the guard can drive it with synthetic inventories. A baseline entry
 * is a claim about the tree, so it ratchets in both directions: a pattern that
 * no longer matches anything unresolved is itself a failure. Without that, the
 * baseline would quietly absorb coverage loss — the failure mode this whole
 * module is a response to.
 *
 * A duplicate dot path is never baselined. One tree declaring the same path
 * twice is the in-tree half of `RF-1`: the merged shape of a fan-out that
 * nobody reconciled.
 *
 * @param {NamespaceInventory | NamespaceInventory[]} inventory
 * @param {Record<string, Record<string, string>>} baseline Provider — or `"*"`
 *   for every provider — to dot path pattern to rationale. See
 *   {@link matchesPattern}.
 * @returns {string[]} Problem descriptions, empty when the tree is clean.
 */
export function checkNamespaceShapeRatchet(inventory, baseline) {
  const inventories = Array.isArray(inventory) ? inventory : [inventory];
  /** @type {string[]} */
  const problems = [];
  const byProvider = new Map(
    inventories.map((entry) => [entry.provider, entry])
  );
  const where = (entry, dotPath) =>
    `${entry.filePath ?? "<no factory file>"}:${entry.lines[dotPath] ?? "?"}`;

  for (const entry of inventories) {
    const allowed = patternsFor(baseline, entry.provider);

    for (const dotPath of Object.keys(entry.paths).sort()) {
      const shape = entry.paths[dotPath];
      if (!SHAPES.includes(shape)) {
        problems.push(
          `${entry.provider}: ${dotPath} has shape ${shape}, which is not in\n` +
            `  the vocabulary (${SHAPES.join(", ")}).`
        );
        continue;
      }
      if (shape !== "unresolved") continue;
      if (allowed.some((pattern) => matchesPattern(pattern, dotPath))) continue;

      problems.push(
        `${entry.provider}: ${dotPath} is unresolved at\n` +
          `  ${where(entry, dotPath)}, so the shape detector cannot see it.\n` +
          "  Fix: resolve it in scripts/lib/namespace-shape.mjs, or add a\n" +
          `  baseline entry in ${BASELINE_FILE} with a rationale.`
      );
    }

    for (const dotPath of entry.duplicates) {
      problems.push(
        `${entry.provider}: ${dotPath} is declared twice in\n` +
          `  ${entry.filePath ?? "<no factory file>"}. Two declarations of one\n` +
          "  dot path in a single tree is a duplicate key, which is what an\n" +
          "  unreconciled fan-out merges to (ac-c2cc4j RF-1)."
      );
    }
  }

  const stale = (provider, pattern, because) =>
    `${provider}: stale baseline entry ${pattern} — ${because}\n` +
    `  Remove it from NAMESPACE_SHAPE_BASELINE in ${BASELINE_FILE}.`;

  for (const provider of Object.keys(baseline).sort()) {
    const scope =
      provider === ANY_PROVIDER
        ? inventories
        : [byProvider.get(provider)].filter(Boolean);

    for (const pattern of Object.keys(baseline[provider]).sort()) {
      if (scope.length === 0) {
        problems.push(
          stale(provider, pattern, `${provider} has no inventory in this tree.`)
        );
        continue;
      }
      if (
        scope.some((entry) =>
          entry.unresolved.some((dotPath) => matchesPattern(pattern, dotPath))
        )
      ) {
        continue;
      }

      // An exact pattern that now resolves is the interesting case: the
      // detector gained coverage and the baseline is what would hide it.
      const resolved = scope
        .map((entry) => entry.paths[pattern])
        .find((shape) => shape !== undefined);
      problems.push(
        stale(
          provider,
          pattern,
          resolved === undefined
            ? "no unresolved dot path matches it any more."
            : `it now resolves as ${resolved}.`
        )
      );
    }
  }

  return problems;
}
