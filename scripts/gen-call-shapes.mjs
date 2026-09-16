#!/usr/bin/env node
/**
 * Generate `packages/cli/src/call-shapes.ts` — the CLI's binding table.
 *
 * `scripts/endpoint-docs.tsv` says which URL each endpoint calls, but not how
 * that URL's `{placeholder}` segments reach the function: a leading positional
 * argument, a property of the request object, or a credential the factory
 * substitutes. The MCP server binds every placeholder positionally, which is
 * right for well under half of them. Rather than repeat that guess, the CLI
 * reads a table generated here from the endpoint sources themselves.
 *
 * The walk is the same ts-morph walker `pnpm run lint:endpoints` uses, loaded
 * once. Request-object properties are read syntactically — interfaces, type
 * aliases and the `z.infer<typeof Schema>` aliases most providers use — so no
 * type checker and no provider import is needed.
 *
 * Usage:
 *   node scripts/gen-call-shapes.mjs           # write the file
 *   node scripts/gen-call-shapes.mjs --check   # exit 1 on drift or on any
 *                                              # row that does not classify
 */

import { readFile, writeFile } from "node:fs/promises";
import { argv } from "node:process";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Project, SyntaxKind } from "ts-morph";
import prettier from "prettier";
import { loadProject, walkAllEndpoints } from "./lib/endpoint-walk.mjs";
import {
  OVERRIDES,
  PROVIDER_SOURCE_ALIASES,
  callShapeKey,
  classifyAll,
} from "./lib/call-shapes.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TSV_PATH = join(ROOT, "scripts/endpoint-docs.tsv");
const OUT_PATH = join(ROOT, "packages/cli/src/call-shapes.ts");
const PROVIDER_SOURCE_GLOB = join(ROOT, "packages/provider/*/src/**/*.ts");

const CHECK = process.argv.slice(2).includes("--check");

// ---------------------------------------------------------------------------
// tsv
// ---------------------------------------------------------------------------

async function loadRows() {
  const text = await readFile(TSV_PATH, "utf8");
  const lines = text.split("\n").filter((line) => line.trim().length > 0);
  return lines.slice(1).map((line) => {
    const [provider, dotPath, method, fullUrl, docsUrl] = line.split("\t");
    return { provider, dotPath, method, fullUrl, docsUrl };
  });
}

// ---------------------------------------------------------------------------
// Request-object property resolution (syntactic; no type checker)
// ---------------------------------------------------------------------------

// Zod builder methods that keep their receiver's key set.
const SCHEMA_PASSTHROUGH = new Set([
  "partial",
  "strict",
  "strip",
  "passthrough",
  "optional",
  "nullable",
  "nullish",
  "describe",
  "refine",
  "superRefine",
  "transform",
  "default",
  "catch",
  "readonly",
  "deepPartial",
  "brand",
  "catchall",
]);

function unquote(name) {
  return name.replace(/^["'`]|["'`]$/g, "");
}

function mergeKeySets(sets) {
  const out = new Set();
  let resolvedAny = false;
  for (const set of sets) {
    if (!set) continue;
    resolvedAny = true;
    for (const key of set) out.add(key);
  }
  return resolvedAny ? out : null;
}

/**
 * Keys of an object literal, following `...spread` members and identifiers.
 * Zod shapes are routinely composed this way (`z.object(objectFieldsSchema)`
 * over `const objectFieldsSchema = { bucket, key, ...ownerFields }`), so a
 * reader that only saw inline members would miss most of s3's request shapes.
 */
function shapeKeys(node, index, seen = new Set()) {
  if (!node || seen.has(node)) return null;
  seen.add(node);

  const kind = node.getKind();
  if (
    kind === SyntaxKind.ParenthesizedExpression ||
    kind === SyntaxKind.AsExpression
  ) {
    return shapeKeys(node.getExpression(), index, seen);
  }
  if (kind === SyntaxKind.Identifier) {
    return shapeKeys(index.values.get(node.getText()), index, seen);
  }
  if (kind !== SyntaxKind.ObjectLiteralExpression) return null;

  const keys = new Set();
  for (const prop of node.getProperties()) {
    if (prop.getKind() === SyntaxKind.SpreadAssignment) {
      const spread = shapeKeys(prop.getExpression(), index, seen);
      if (!spread) return null;
      for (const key of spread) keys.add(key);
      continue;
    }
    const name = prop.getName?.();
    if (name) keys.add(unquote(name));
  }
  return keys;
}

/** Index every interface, type alias and const in the provider sources. */
function buildDeclarationIndex() {
  const project = new Project({
    skipAddingFilesFromTsConfig: true,
    compilerOptions: {
      target: 99,
      module: 99,
      moduleResolution: 2,
      strict: true,
      skipLibCheck: true,
      allowJs: false,
    },
  });
  project.addSourceFilesAtPaths(PROVIDER_SOURCE_GLOB);

  const types = new Map();
  const values = new Map();
  for (const sourceFile of project.getSourceFiles()) {
    for (const decl of sourceFile.getInterfaces())
      types.set(decl.getName(), decl);
    for (const decl of sourceFile.getTypeAliases())
      types.set(decl.getName(), decl);
    for (const decl of sourceFile.getVariableDeclarations()) {
      const init = decl.getInitializer();
      if (init) values.set(decl.getName(), init);
    }
  }
  return { types, values };
}

/** Top-level keys of a zod schema expression, or null when unreadable. */
function schemaKeys(node, index, seen = new Set()) {
  if (!node || seen.has(node)) return null;
  seen.add(node);

  const kind = node.getKind();
  if (
    kind === SyntaxKind.ParenthesizedExpression ||
    kind === SyntaxKind.AsExpression
  ) {
    return schemaKeys(node.getExpression(), index, seen);
  }
  if (kind === SyntaxKind.Identifier) {
    return schemaKeys(index.values.get(node.getText()), index, seen);
  }
  if (kind !== SyntaxKind.CallExpression) return null;

  const callee = node.getExpression();
  if (callee.getKind() !== SyntaxKind.PropertyAccessExpression) return null;
  const name = callee.getName();
  const receiver = callee.getExpression();
  const args = node.getArguments();

  if (
    receiver.getKind() === SyntaxKind.Identifier &&
    receiver.getText() === "z"
  ) {
    if (
      name === "object" ||
      name === "strictObject" ||
      name === "looseObject"
    ) {
      return shapeKeys(args[0], index, new Set());
    }
    if (name === "union" || name === "discriminatedUnion") {
      const array = args.find(
        (arg) => arg.getKind() === SyntaxKind.ArrayLiteralExpression
      );
      if (!array) return null;
      return mergeKeySets(
        array.getElements().map((el) => schemaKeys(el, index, seen))
      );
    }
    if (name === "intersection") {
      return mergeKeySets(args.map((arg) => schemaKeys(arg, index, seen)));
    }
    if (name === "lazy") {
      const body = args[0]?.getBody?.();
      return body ? schemaKeys(body, index, seen) : null;
    }
    return null;
  }

  if (name === "extend" || name === "merge") {
    const added =
      shapeKeys(args[0], index, new Set()) ?? schemaKeys(args[0], index, seen);
    return mergeKeySets([schemaKeys(receiver, index, seen), added]);
  }
  // `.pick({a: true})` keeps only the listed keys; `.omit({a: true})` drops them.
  if (name === "pick" || name === "omit") {
    const listed = shapeKeys(args[0], index, new Set());
    if (!listed) return null;
    if (name === "pick") return listed;
    const base = schemaKeys(receiver, index, seen);
    if (!base) return null;
    return new Set([...base].filter((key) => !listed.has(key)));
  }
  if (name === "or" || name === "and") {
    return mergeKeySets([
      schemaKeys(receiver, index, seen),
      schemaKeys(args[0], index, seen),
    ]);
  }
  if (SCHEMA_PASSTHROUGH.has(name)) {
    return schemaKeys(receiver, index, seen);
  }
  return null;
}

const GENERIC_WRAPPERS = new Set([
  "Partial",
  "Readonly",
  "Required",
  "NonNullable",
  "Omit",
  "Pick",
]);

function typeNameKeys(name, index, seen) {
  if (!name || seen.has(name)) return null;
  seen.add(name);
  const decl = index.types.get(name);
  if (!decl) return null;

  if (decl.getKind() === SyntaxKind.InterfaceDeclaration) {
    const keys = new Set(
      decl.getProperties().map((prop) => unquote(prop.getName()))
    );
    for (const base of decl.getExtends()) {
      const inherited = typeNameKeys(
        base
          .getText()
          .replace(/<[\s\S]*$/, "")
          .trim(),
        index,
        seen
      );
      if (inherited) for (const key of inherited) keys.add(key);
    }
    return keys;
  }
  return typeNodeKeys(decl.getTypeNode(), index, seen);
}

/** Keys of a type node, or null when the shape cannot be read syntactically. */
function typeNodeKeys(node, index, seen = new Set()) {
  if (!node) return null;
  const kind = node.getKind();

  if (kind === SyntaxKind.TypeLiteral) {
    return new Set(node.getProperties().map((prop) => unquote(prop.getName())));
  }
  if (kind === SyntaxKind.ParenthesizedType) {
    return typeNodeKeys(node.getTypeNode(), index, seen);
  }
  if (kind === SyntaxKind.UnionType || kind === SyntaxKind.IntersectionType) {
    return mergeKeySets(
      node.getTypeNodes().map((child) => typeNodeKeys(child, index, seen))
    );
  }
  // `import("./zod").YouTubeGetTranscriptRequest` — an inline import type.
  if (kind === SyntaxKind.ImportType) {
    const qualifier = node.getQualifier();
    return qualifier ? typeNameKeys(qualifier.getText(), index, seen) : null;
  }
  if (kind !== SyntaxKind.TypeReference) return null;

  const name = node.getTypeName().getText();
  if (name === "z.infer" || name === "z.input" || name === "z.output") {
    const arg = node.getTypeArguments()[0];
    if (arg?.getKind() !== SyntaxKind.TypeQuery) return null;
    return schemaKeys(
      index.values.get(arg.getExprName().getText()),
      index,
      new Set()
    );
  }
  if (GENERIC_WRAPPERS.has(name)) {
    return typeNodeKeys(node.getTypeArguments()[0], index, seen);
  }
  return typeNameKeys(name, index, seen);
}

// ---------------------------------------------------------------------------
// Leaf signatures
// ---------------------------------------------------------------------------

/**
 * The trailing `signal?: AbortSignal` every endpoint takes. Matched on the type
 * being *exactly* the signal — several overloaded endpoints declare a union
 * that merely includes it (`paramsOrIdOrSignal?: Opts | string | AbortSignal`),
 * and those are real inputs, not the signal slot.
 */
function isSignalParam(param) {
  const typeText = (param.getTypeNode()?.getText() ?? "").trim();
  if (typeText === "AbortSignal" || typeText === "AbortSignal | undefined") {
    return true;
  }
  return param.getName() === "signal" && typeText === "";
}

function isStringMember(node) {
  const kind = node.getKind();
  if (kind === SyntaxKind.StringKeyword) return true;
  return kind === SyntaxKind.LiteralType;
}

/**
 * An overloaded endpoint declares its two calling conventions as one
 * `string | Request` parameter and branches on `typeof x === "string"`: the
 * string arm is the URL placeholder, the object arm is the ordinary request.
 * Such a parameter is always an optional positional slot.
 */
function isStringOrObjectUnion(typeNode, index) {
  if (typeNode?.getKind() !== SyntaxKind.UnionType) return false;
  const members = typeNode.getTypeNodes();
  const hasString = members.some(isStringMember);
  const hasObject = members.some(
    (member) => !isStringMember(member) && typeNodeKeys(member, index) !== null
  );
  return hasString && hasObject;
}

/** The parameter facts the classifier needs, for one walked leaf. */
function leafParams(leaf, index) {
  const node = leaf.leafNode;
  if (!node) return null;

  // Helper-built leaf: `jsonBody<TReq, TResp>(...)`. The effective signature is
  // `(params: TReq, signal?)`, and TReq is the helper's first type argument.
  if (node.getKind() === SyntaxKind.CallExpression) {
    const typeArg = node.getTypeArguments?.()[0];
    if (!typeArg) return null;
    const properties = typeNodeKeys(typeArg, index);
    return [
      {
        name: "params",
        optional: false,
        isRequestObject: properties !== null,
        isStringUnion: false,
        properties: properties ? [...properties] : undefined,
      },
    ];
  }

  if (!node.getParameters) return null;
  const params = [];
  for (const param of node.getParameters()) {
    if (isSignalParam(param)) continue;
    const typeNode = param.getTypeNode();
    const properties = typeNodeKeys(typeNode, index);
    const stringUnion = isStringOrObjectUnion(typeNode, index);
    params.push({
      name: param.getName(),
      optional:
        param.hasQuestionToken() || param.hasInitializer() || stringUnion,
      isRequestObject: properties !== null && !stringUnion,
      isStringUnion: stringUnion,
      properties: properties ? [...properties] : undefined,
    });
  }
  return params;
}

// ---------------------------------------------------------------------------
// Leaf lookup
// ---------------------------------------------------------------------------

/** Strip the `{query}` marker and any trailing slash before comparing URLs. */
function normalizeUrl(url) {
  return String(url ?? "")
    .replace(/\{query\}/g, "")
    .replace(/\/$/, "");
}

function pushInto(map, key, value) {
  const bucket = map.get(key);
  if (bucket) bucket.push(value);
  else map.set(key, [value]);
}

async function buildLeafIndex(index) {
  const project = loadProject();
  // Keyed both ways: the tsv's dotPath column is the walker's *logical* path
  // (HTTP-method segments dropped), but a handful of trees name a leaf after
  // its method (`api.v2.user.get`), where only the full path matches.
  const byMethod = new Map();
  const byPath = new Map();

  for await (const leaf of walkAllEndpoints(project)) {
    const params = leafParams(leaf, index);
    if (!params) continue;
    const entry = { fullUrl: leaf.fullUrl, params };
    for (const path of new Set([leaf.dotPath, leaf.fullDotPath])) {
      if (leaf.method) {
        pushInto(byMethod, `${leaf.provider}\t${path}\t${leaf.method}`, entry);
      }
      pushInto(byPath, `${leaf.provider}\t${path}`, entry);
    }
  }
  return { byMethod, byPath };
}

function sameParams(a, b) {
  return JSON.stringify(a.params) === JSON.stringify(b.params);
}

/**
 * Pick one leaf from the candidates under a key. A tsv row names the default
 * path of an overloaded endpoint, so an exact URL match wins; failing that,
 * candidates that agree on their parameters are interchangeable (providers
 * declare the same leaf under several aliased namespaces).
 */
function pickLeaf(candidates, row) {
  if (!candidates || candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];
  const exact = candidates.filter(
    (candidate) => normalizeUrl(candidate.fullUrl) === normalizeUrl(row.fullUrl)
  );
  if (exact.length === 1) return exact[0];
  const pool = exact.length > 1 ? exact : candidates;
  return pool.every((candidate) => sameParams(candidate, pool[0]))
    ? pool[0]
    : null;
}

function makeLookup(leafIndex) {
  return (row) => {
    const alias = PROVIDER_SOURCE_ALIASES[row.provider]?.donor;
    for (const provider of alias ? [row.provider, alias] : [row.provider]) {
      const exact = pickLeaf(
        leafIndex.byMethod.get(`${provider}\t${row.dotPath}\t${row.method}`),
        row
      );
      if (exact) return exact;
      const loose = pickLeaf(
        leafIndex.byPath.get(`${provider}\t${row.dotPath}`),
        row
      );
      if (loose) return loose;
    }
    return null;
  };
}

// ---------------------------------------------------------------------------
// Emit
// ---------------------------------------------------------------------------

const HEADER = `// GENERATED by scripts/gen-call-shapes.mjs — do not edit.
//
// How each endpoint's URL {placeholder} segments reach its function: as a
// leading positional argument, as a property of the request object, or as a
// credential the factory substitutes. Regenerate with:
//
//   pnpm run gen:call-shapes
//
// \`pnpm run gen:call-shapes:check\` fails on drift and is wired into ci:local.`;

/**
 * Render the module source for a classified table. Pure apart from Prettier,
 * so a test can compare a fresh render against the committed file without
 * loading the walker.
 */
export async function render(shapes) {
  const entries = [...shapes.values()].map((shape) => {
    const key = callShapeKey(shape.provider, shape.method, shape.dotPath);
    return `  ${JSON.stringify(key)}: ${JSON.stringify(shape)},`;
  });

  const source = `${HEADER}

export interface CallShapePositional {
  /** The {placeholder} this argument fills. */
  placeholder: string;
  /** The parameter name the endpoint declares. */
  param: string;
  /** True when the endpoint may be called without it. */
  optional: boolean;
  /** Set when the URL spells the placeholder differently from the parameter. */
  alias?: string;
}

export interface CallShapeField {
  placeholder: string;
  /** The request-object property that carries it. */
  property: string;
}

export interface CallShape {
  provider: string;
  method: string;
  dotPath: string;
  /** Leading positional arguments, in URL order. */
  positional: CallShapePositional[];
  /** Placeholders carried by the request object. */
  fields: CallShapeField[];
  /** Placeholders the factory substitutes from its credential. */
  injected: string[];
  /** Placeholders the endpoint derives internally. */
  derived: string[];
}

/** \`provider\\tMETHOD\\tdotPath\` — the key every lookup in this table uses. */
export function callShapeKey(
  provider: string,
  method: string,
  dotPath: string
): string {
  return \`\${provider}\\t\${method}\\t\${dotPath}\`;
}

/** Only endpoints whose URL carries a placeholder other than {query}. */
export const CALL_SHAPES: Record<string, CallShape> = {
${entries.join("\n")}
};
`;

  // Resolve the repo's .prettierrc: `filepath` alone only infers the parser,
  // so formatting without this emits Prettier defaults and every
  // `pnpm run format` would then re-write the file the check just approved.
  const config = await prettier.resolveConfig(OUT_PATH);
  return prettier.format(source, {
    ...config,
    parser: "typescript",
    filepath: OUT_PATH,
  });
}

function reportUnresolved(unresolved) {
  console.error(
    `gen-call-shapes: ${unresolved.length} endpoint row(s) did not classify.\n` +
      "Read the leaf and add an OVERRIDES entry (with a `why`) in " +
      "scripts/lib/call-shapes.mjs, then regenerate.\n"
  );
  for (const item of unresolved) {
    const [provider, method, dotPath] = item.key.split("\t");
    console.error(
      `  ${provider} ${method} ${dotPath}\n` +
        `    reason: ${item.reason}\n` +
        `    placeholders: ${item.placeholders.join(", ")}` +
        (item.params ? `\n    params: ${item.params.join(", ")}` : "")
    );
  }
}

async function main() {
  const rows = await loadRows();
  const index = buildDeclarationIndex();
  const leafIndex = await buildLeafIndex(index);
  const { shapes, unresolved } = classifyAll(rows, makeLookup(leafIndex));

  if (unresolved.length > 0) {
    reportUnresolved(unresolved);
    process.exit(1);
  }

  const source = await render(shapes);
  const current = await readFile(OUT_PATH, "utf8").catch(() => null);

  if (CHECK) {
    if (current === source) {
      console.log(
        `gen-call-shapes: up to date (${shapes.size} endpoints, ${Object.keys(OVERRIDES).length} overrides).`
      );
      return;
    }
    console.error(
      "gen-call-shapes: packages/cli/src/call-shapes.ts is out of date. " +
        "Run: pnpm run gen:call-shapes"
    );
    process.exit(1);
  }

  if (current === source) {
    console.log(`gen-call-shapes: unchanged (${shapes.size} endpoints).`);
    return;
  }
  await writeFile(OUT_PATH, source, "utf8");
  console.log(
    `gen-call-shapes: wrote packages/cli/src/call-shapes.ts (${shapes.size} endpoints).`
  );
}

// Importable for tests: only the CLI invocation runs the walk.
if (argv[1] && resolve(argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
