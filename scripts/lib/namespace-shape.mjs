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
 * `scripts/lib/provider-inventory.mjs` and `scripts/lib/export-surface.mjs`:
 * `read*` touch the filesystem or shell `git show`, `parse*` and `check*` are
 * pure source-in / report-out. That split is what lets the guard drive every
 * rule from synthetic committed fixtures instead of from four worktrees and a
 * pair of unmerged branches.
 *
 * Three things this module deliberately does NOT do:
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
 *   - It resolves no symbol across files. An identifier is looked up among the
 *     `const` bindings of the same source file and nowhere else, so a leaf
 *     composed elsewhere — `b2`'s `s3.buckets.create` member accesses,
 *     `elevenlabs`'s loop-merged root — is reported `unresolved` rather than
 *     guessed at.
 *
 * The one honest failure mode: a call expression is classified `callable`, so
 * a call that returns a plain object reads as a callable. It is a false
 * positive rather than a miss, it matters only when another ref declares the
 * same dot path incompatibly, and the in-tree ratchet in
 * `tests/unit/provider-namespace-shape.test.ts` pins every current
 * classification, so a surprising one arrives as a reviewable diff rather than
 * at merge time.
 */

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
 * @param {ts.SourceFile} sourceFile
 * @param {ts.Node} node
 * @returns {number}
 */
function lineOf(sourceFile, node) {
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
 * The bindings an identifier in the return tree can name.
 *
 * Two scopes, in this order: the module's own top level, then the factory
 * body's top level, which shadows it. That is where the repository actually
 * puts them — `fal.ts` builds `const qwenImage = Object.assign(...)` inside
 * `createFal` and names it by shorthand in the returned literal, and the `kie`
 * sub-factories do the same. Nothing deeper is collected: a binding declared
 * inside a nested block is not reachable from the returned literal by name.
 *
 * Function declarations count. `anthropic` and `fireworks` build most of their
 * surface as `async function getFilesContent(...)` inside the factory and name
 * it by shorthand from both the path layer and the verb layer; reading only
 * `const` would report 134 endpoint leaves across those two providers as
 * unresolved, which is most of what they ship.
 *
 * @param {ts.SourceFile} sourceFile
 * @param {ts.SignatureDeclaration | null} factory
 * @returns {Map<string, ts.Node>}
 */
function collectBindings(sourceFile, factory) {
  /** @type {Map<string, ts.Node>} */
  const bindings = new Map();

  const collect = (statements) => {
    for (const statement of statements) {
      if (ts.isFunctionDeclaration(statement) && statement.name) {
        bindings.set(statement.name.text, statement);
        continue;
      }
      if (!ts.isVariableStatement(statement)) continue;
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name)) continue;
        if (!declaration.initializer) continue;
        bindings.set(declaration.name.text, declaration.initializer);
      }
    }
  };

  collect(sourceFile.statements);
  if (factory && factory.body && ts.isBlock(factory.body)) {
    collect(factory.body.statements);
  }

  return bindings;
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
 * @param {Map<string, ts.Node>} bindings
 * @param {Set<string>} seen Identifiers already being resolved.
 * @returns {{ shape: Shape, children: ts.ObjectLiteralExpression[] }}
 */
function classify(node, bindings, seen) {
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
    const base = classify(target, bindings, seen);
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
    if (seen.has(expr.text)) return UNRESOLVED;
    const binding = bindings.get(expr.text);
    if (!binding) return UNRESOLVED;
    return classify(binding, bindings, new Set([...seen, expr.text]));
  }
  if (ts.isPropertyAccessExpression(expr)) {
    const base = classify(expr.expression, bindings, seen);
    for (const literal of base.children) {
      const value = memberValue(literal, expr.name.text);
      if (value) return classify(value, bindings, seen);
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
  state.lines.set(dotPath, lineOf(state.sourceFile, node));
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
 * Members with no static name keep their place in the inventory under a
 * bracketed sentinel rather than vanishing from it: a spread is the honest
 * statement that this namespace's children are composed elsewhere — `kie` and
 * `polymarket` spread composed sub-providers into their root literal, and
 * `telegram`'s root is `{ ...post, post }` — and dropping it would quietly
 * shrink what the detector claims to cover.
 *
 * A name repeated inside ONE literal is collected as a duplicate: that is the
 * in-tree half of `RF-1`, the shape an unreconciled fan-out merges to. A name
 * repeated across the arguments of an `Object.assign` is not — later arguments
 * win by definition, and `fireworks` uses that deliberately three times to
 * re-point an inherited `post` alias at its own endpoint.
 *
 * @param {ts.ObjectLiteralExpression} literal
 * @param {string} prefix
 * @param {object} state
 * @returns {void}
 */
function walkLiteral(literal, prefix, state) {
  /** @type {Set<string>} */
  const declared = new Set();

  literal.properties.forEach((property, index) => {
    const join = (segment) => (prefix ? `${prefix}.${segment}` : segment);

    if (ts.isSpreadAssignment(property)) {
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

    const { shape, children } = classify(value, state.bindings, new Set());
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
 * @returns {{
 *   factory: string | null,
 *   paths: Record<string, Shape>,
 *   lines: Record<string, number>,
 *   unresolved: string[],
 *   duplicates: string[],
 * }} `factory` is the name as declared, so a reader scanning candidate files
 *   can tell "this file holds the factory" from "this file merely mentions it".
 */
export function parseNamespaceShapes(fileName, source, factoryName) {
  const sourceFile = parseSourceFile(fileName, source);
  const factory = findFactory(sourceFile, factoryName);
  const state = {
    sourceFile,
    bindings: collectBindings(sourceFile, factory ? factory.fn : null),
    paths: new Map(),
    lines: new Map(),
    duplicates: new Set(),
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
 * Pick the factory file out of a provider's `src` directory and parse it.
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

  for (const file of orderCandidates(files, provider)) {
    const source = readFile(file);
    if (source === null) continue;
    // Cheap pre-filter: the AST below is the authority, this only decides
    // which candidates are worth parsing.
    if (!source.toLowerCase().includes(needle)) continue;

    const filePath = path.posix.join(
      "packages",
      "provider",
      provider,
      "src",
      file
    );
    const parsed = parseNamespaceShapes(filePath, source, factoryName);
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
 * is a claim about the tree, so it ratchets in both directions, as
 * `checkExportSurface` does: a pattern that no longer matches anything
 * unresolved is itself a failure. Without that, the baseline would quietly
 * absorb coverage loss — the failure mode this whole module is a response to.
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
