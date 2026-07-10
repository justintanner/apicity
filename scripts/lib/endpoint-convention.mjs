/**
 * Shared helpers for the provider-convention lints:
 *
 *   - dotPath ↔ URL drift        (check-endpoint-signatures.mjs)
 *   - camelCase endpoint keys    (check-endpoint-signatures.mjs)
 *   - POST endpoints expose .schema (check-endpoint-signatures.mjs)
 *   - factory-shape acknowledgment (check-factory-signatures.mjs)
 *
 * Keeping the detection here means the enforcing checks and the
 * `apply-*-comments` fixers can never disagree about what counts as a
 * violation or how it is acknowledged.
 */
import { SyntaxKind } from "ts-morph";
import { urlToDotPath } from "./url-to-dotpath.mjs";

/* ------------------------------------------------------------------ *
 * Acknowledgment comments (// sig-ok:, // schema-ok:, // factory-ok:)
 * ------------------------------------------------------------------ */

/**
 * Scan the contiguous `//` comment block immediately above `anchorNode` for a
 * `// <token>` acknowledgment line (optionally followed by `: <reason>`).
 */
export function hasAckComment(anchorNode, token) {
  if (!anchorNode) return false;
  const sourceFile = anchorNode.getSourceFile();
  const fullText = sourceFile.getFullText();
  const start = anchorNode.getStart(false);
  const re = new RegExp(`^//\\s*${token}\\b`);
  let cursor = fullText.lastIndexOf("\n", start - 1) + 1;
  while (cursor > 0) {
    const prevLineEnd = cursor - 1;
    if (prevLineEnd <= 0) break;
    const prevLineStart = fullText.lastIndexOf("\n", prevLineEnd - 1) + 1;
    const lineText = fullText.slice(prevLineStart, prevLineEnd).trim();
    if (!lineText.startsWith("//")) break;
    if (re.test(lineText)) return true;
    cursor = prevLineStart;
  }
  return false;
}

/* ------------------------------------------------------------------ *
 * dotPath ↔ URL drift
 * ------------------------------------------------------------------ */

const REST_ALIASES = new Set([
  "list",
  "retrieve",
  "create",
  "del",
  "delete",
  "update",
  "cancel",
  "get",
  "results",
]);

function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function matches(actual, expected) {
  if (arraysEqual(actual, expected)) return true;
  if (
    actual.length === expected.length + 1 &&
    REST_ALIASES.has(actual[actual.length - 1]) &&
    arraysEqual(actual.slice(0, -1), expected)
  ) {
    return true;
  }
  return false;
}

/**
 * Per-provider options for `urlToDotPath`. Providers that wrap several hosts or
 * expose vendor-owned host aliases need the URL→dotPath derivation tuned so the
 * comparison is apples-to-apples.
 */
export function signatureOptions(provider) {
  return {
    keepFullHostname: provider === "free-media-upload",
    ignoredHostLabels:
      provider === "binance"
        ? ["eapi", "fapi"]
        : provider === "kie"
          ? ["kieai"]
          : [],
  };
}

/**
 * Compare an endpoint's factory dotPath with the path derived from its URL.
 * Returns `{ drifts, actual, expected }`, or `null` when the endpoint can't be
 * compared (no URL, no dotPath, or an underivable URL).
 */
export function computeDrift(ep) {
  if (!ep.fullUrl || ep.fullUrl === "?" || !ep.dotPath) return null;
  const expected = urlToDotPath(ep.fullUrl, signatureOptions(ep.provider));
  if (!expected) return null;
  const actual = ep.dotPath.split(".").filter(Boolean);
  return {
    drifts: !matches(actual, expected),
    actual: actual.join("."),
    expected: expected.join("."),
  };
}

/* ------------------------------------------------------------------ *
 * camelCase endpoint keys
 * ------------------------------------------------------------------ */

const CAMEL_SEGMENT_RE = /^[a-z$_][A-Za-z0-9$_]*$/;

/**
 * Endpoint property keys must be camelCase identifiers, never bracket-notation
 * kebab-case (CLAUDE.md endpoint-naming convention). Returns the list of
 * offending segments in the endpoint's user-facing dotPath (empty when clean).
 */
export function camelCaseIssues(ep) {
  if (!ep.dotPath) return [];
  return ep.dotPath
    .split(".")
    .filter(Boolean)
    .filter((seg) => !CAMEL_SEGMENT_RE.test(seg));
}

/* ------------------------------------------------------------------ *
 * POST endpoints expose .schema
 * ------------------------------------------------------------------ */

function unwrap(node) {
  while (
    node &&
    (node.getKind() === SyntaxKind.ParenthesizedExpression ||
      node.getKind() === SyntaxKind.AsExpression)
  ) {
    node = node.getExpression();
  }
  return node;
}

function isObjectAssign(call) {
  const expr = call.getExpression();
  return (
    expr.getKind() === SyntaxKind.PropertyAccessExpression &&
    expr.getName() === "assign" &&
    expr.getExpression().getText() === "Object"
  );
}

function objectLiteralHasSchemaKey(obj) {
  for (const p of obj.getProperties()) {
    if (p.getName?.() === "schema") return true;
  }
  return false;
}

function assignAttachesSchema(call) {
  for (const a of call.getArguments()) {
    if (
      a.getKind() === SyntaxKind.ObjectLiteralExpression &&
      objectLiteralHasSchemaKey(a)
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Collect the names of local helper functions whose body returns
 * `Object.assign(fn, { schema })`. Endpoints created by calling one of these
 * helpers (e.g. `jsonBody`, `makePost`) carry a `.schema` even though it is not
 * attached at the call site.
 */
function collectSchemaBindingHelpers(sf) {
  const names = new Set();
  const bodyReturnsSchema = (owner) => {
    const body = owner.getBody?.();
    if (!body) return false;
    if (body.getKind() !== SyntaxKind.Block) {
      const e = unwrap(body);
      return (
        !!e &&
        e.getKind() === SyntaxKind.CallExpression &&
        isObjectAssign(e) &&
        assignAttachesSchema(e)
      );
    }
    for (const ret of body.getDescendantsOfKind(SyntaxKind.ReturnStatement)) {
      const e = unwrap(ret.getExpression());
      if (
        e &&
        e.getKind() === SyntaxKind.CallExpression &&
        isObjectAssign(e) &&
        assignAttachesSchema(e)
      ) {
        return true;
      }
    }
    return false;
  };
  for (const fn of sf.getDescendantsOfKind(SyntaxKind.FunctionDeclaration)) {
    if (fn.getName() && bodyReturnsSchema(fn)) names.add(fn.getName());
  }
  for (const v of sf.getDescendantsOfKind(SyntaxKind.VariableDeclaration)) {
    const init = v.getInitializer();
    if (
      init &&
      (init.getKind() === SyntaxKind.ArrowFunction ||
        init.getKind() === SyntaxKind.FunctionExpression) &&
      bodyReturnsSchema(init)
    ) {
      names.add(v.getName());
    }
  }
  return names;
}

const helperCache = new WeakMap();
function schemaHelpersFor(sf) {
  let names = helperCache.get(sf);
  if (!names) {
    names = collectSchemaBindingHelpers(sf);
    helperCache.set(sf, names);
  }
  return names;
}

function expressionYieldsSchema(expr, helpers, depth = 0) {
  expr = unwrap(expr);
  if (!expr || depth > 5) return false;
  if (expr.getKind() === SyntaxKind.CallExpression) {
    if (isObjectAssign(expr)) {
      if (assignAttachesSchema(expr)) return true;
      return expressionYieldsSchema(expr.getArguments()[0], helpers, depth + 1);
    }
    const callee = expr.getExpression();
    if (
      callee.getKind() === SyntaxKind.Identifier &&
      helpers.has(callee.getText())
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Fast, false-positive-free static confirmation that an endpoint attaches a
 * `.schema`. A `true` result is authoritative; a `false` result only means
 * "not statically provable" — fall back to {@link typeHasSchema}.
 */
export function staticConfirmSchema(ep) {
  const leaf = ep.leafNode;
  const sf = leaf.getSourceFile();
  const helpers = schemaHelpersFor(sf);

  // `Object.assign(async () => {}, { schema })` — leaf is the direct first arg.
  let parent = leaf.getParent?.();
  while (parent && parent.getKind() === SyntaxKind.ParenthesizedExpression) {
    parent = parent.getParent?.();
  }
  if (
    parent &&
    parent.getKind() === SyntaxKind.CallExpression &&
    isObjectAssign(parent) &&
    unwrap(parent.getArguments()[0]) === unwrap(leaf) &&
    assignAttachesSchema(parent)
  ) {
    return true;
  }

  const prop = ep.propNode;
  if (prop && prop.getKind() === SyntaxKind.PropertyAssignment) {
    if (expressionYieldsSchema(prop.getInitializer(), helpers)) return true;
  }
  if (prop && prop.getKind() === SyntaxKind.ShorthandPropertyAssignment) {
    for (const v of sf.getDescendantsOfKind(SyntaxKind.VariableDeclaration)) {
      if (
        v.getName() === prop.getName() &&
        expressionYieldsSchema(v.getInitializer(), helpers)
      ) {
        return true;
      }
    }
  }

  // `const messages = Object.assign(chatImpl, { schema })` — leaf is a named
  // function referenced by identifier in the wrapping Object.assign.
  const leafName = leaf.getName?.();
  if (leafName) {
    for (const c of sf.getDescendantsOfKind(SyntaxKind.CallExpression)) {
      if (!isObjectAssign(c) || !assignAttachesSchema(c)) continue;
      const first = unwrap(c.getArguments()[0]);
      if (
        first &&
        first.getKind() === SyntaxKind.Identifier &&
        first.getText() === leafName
      ) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Authoritative (but slower) schema check via the TypeScript type checker. Sees
 * through arbitrary helper indirection because it inspects the endpoint value's
 * resolved type for a `schema` member.
 */
export function typeHasSchema(ep) {
  try {
    const prop = ep.propNode;
    let t = null;
    if (prop && prop.getKind() === SyntaxKind.PropertyAssignment) {
      const init = prop.getInitializer();
      if (init) t = init.getType();
    } else if (
      prop &&
      prop.getKind() === SyntaxKind.ShorthandPropertyAssignment
    ) {
      t = prop.getType();
    }
    if (!t) t = ep.leafNode.getType();
    if (t.isUnion()) t = t.getNonNullableType();
    return t.getProperty("schema") != null;
  } catch {
    return false;
  }
}

/**
 * Does an endpoint expose a `.schema`? Fast static confirmation first, then the
 * type checker as a fallback for helper-attached schemas.
 */
export function endpointHasSchema(ep) {
  return staticConfirmSchema(ep) || typeHasSchema(ep);
}
