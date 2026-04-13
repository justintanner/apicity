import { Project, SyntaxKind } from "ts-morph";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..", "..");

/**
 * Per-provider configuration for the walker.
 * `entryFiles` are absolute paths to factory source files.
 * `factoryNames` are the names of the exported functions whose `return { ... }`
 * is the root of the endpoint tree.
 * `defaultBaseURL` is the fallback if the factory doesn't have a local
 * `baseURL = opts.baseURL ?? "..."` pattern.
 */
const PROVIDERS = [
  {
    name: "openai",
    entryFiles: ["packages/provider/openai/src/openai.ts"],
    factoryNames: ["openai"],
  },
  {
    name: "xai",
    entryFiles: ["packages/provider/xai/src/xai.ts"],
    factoryNames: ["xai"],
  },
  {
    name: "anthropic",
    entryFiles: ["packages/provider/anthropic/src/anthropic.ts"],
    factoryNames: ["anthropic"],
  },
  {
    name: "fireworks",
    entryFiles: ["packages/provider/fireworks/src/fireworks.ts"],
    factoryNames: ["fireworks"],
  },
  {
    name: "fal",
    entryFiles: ["packages/provider/fal/src/fal.ts"],
    factoryNames: ["fal"],
  },
  {
    name: "kimicoding",
    entryFiles: ["packages/provider/kimicoding/src/kimicoding.ts"],
    factoryNames: ["kimicoding"],
  },
  {
    name: "alibaba",
    entryFiles: ["packages/provider/alibaba/src/alibaba.ts"],
    factoryNames: ["alibaba"],
  },
  {
    name: "kie",
    entryFiles: [
      "packages/provider/kie/src/kie.ts",
      "packages/provider/kie/src/chat.ts",
      "packages/provider/kie/src/claude.ts",
      "packages/provider/kie/src/suno.ts",
      "packages/provider/kie/src/veo.ts",
    ],
    factoryNames: [
      "kie",
      "createChatProvider",
      "createClaudeProvider",
      "createSunoProvider",
      "createVeoProvider",
    ],
  },
  {
    name: "free",
    entryFiles: ["packages/provider/free/src/free.ts"],
    factoryNames: ["free"],
  },
];

const METHOD_KEYS = new Set([
  "post",
  "get",
  "put",
  "delete",
  "patch",
  "head",
  "options",
]);

const STREAM_KEYS = new Set(["stream", "ws", "run"]);

function loadProject() {
  const project = new Project({
    useInMemoryFileSystem: false,
    skipAddingFilesFromTsConfig: true,
    compilerOptions: {
      target: 99, // ES2022+
      module: 99, // ESNext
      moduleResolution: 2, // Node
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      allowJs: false,
    },
  });
  for (const p of PROVIDERS) {
    for (const f of p.entryFiles) {
      project.addSourceFileAtPath(path.join(REPO_ROOT, f));
    }
  }
  return project;
}

function findFactory(sourceFile, name) {
  for (const fn of sourceFile.getFunctions()) {
    if (fn.getName() === name && fn.isExported()) return fn;
  }
  for (const v of sourceFile.getVariableDeclarations()) {
    if (v.getName() !== name) continue;
    const init = v.getInitializer();
    if (
      init &&
      (init.getKind() === SyntaxKind.ArrowFunction ||
        init.getKind() === SyntaxKind.FunctionExpression)
    ) {
      return init;
    }
  }
  return null;
}

function extractBaseURL(factoryFn) {
  const body = factoryFn.getBody();
  if (!body) return null;
  for (const stmt of body.getStatements()) {
    if (stmt.getKind() !== SyntaxKind.VariableStatement) continue;
    for (const decl of stmt.getDeclarations()) {
      if (decl.getName() !== "baseURL") continue;
      const init = decl.getInitializer();
      if (!init) continue;
      const base = evalUrlExpr(init);
      if (base) return base;
    }
  }
  return null;
}

/**
 * Best-effort evaluation of a URL-like TS expression. Recognizes:
 *   "literal"
 *   (x ?? "literal")
 *   expr + "suffix"
 *   "prefix" + expr
 *   (x ?? "a") + "/v1"
 */
function evalUrlExpr(node) {
  if (!node) return null;
  const k = node.getKind();
  if (
    k === SyntaxKind.StringLiteral ||
    k === SyntaxKind.NoSubstitutionTemplateLiteral
  ) {
    return node.getLiteralText();
  }
  if (k === SyntaxKind.ParenthesizedExpression) {
    return evalUrlExpr(node.getExpression());
  }
  if (k === SyntaxKind.BinaryExpression) {
    const op = node.getOperatorToken().getText();
    if (op === "??" || op === "||") {
      // Prefer the right-hand fallback literal when the left is opts.baseURL
      return evalUrlExpr(node.getRight()) ?? evalUrlExpr(node.getLeft());
    }
    if (op === "+") {
      const l = evalUrlExpr(node.getLeft()) ?? "";
      const r = evalUrlExpr(node.getRight()) ?? "";
      if (!l && !r) return null;
      return l + r;
    }
  }
  // Fallback: any string literal descendant
  const literal = node.getFirstDescendantByKind(SyntaxKind.StringLiteral);
  if (literal) return literal.getLiteralText();
  return null;
}

function getReturnObject(factoryFn) {
  const body = factoryFn.getBody();
  if (!body) return null;
  for (const stmt of body.getStatements()) {
    if (stmt.getKind() !== SyntaxKind.ReturnStatement) continue;
    const expr = stmt.getExpression();
    if (!expr) continue;
    return expr;
  }
  return null;
}

/**
 * Resolve a node to its "endpoint-or-object" form.
 * - If it's an identifier, follow to the variable's initializer.
 * - If it's `Object.assign(base, extra, ...)`, unwrap to merge all args.
 * - Returns a list of nodes that represent the effective contents at this position:
 *   either ObjectLiteralExpressions (to descend into) or callable nodes (endpoints).
 */
function resolveNode(node, visited = new Set()) {
  if (!node || visited.has(node)) return [];
  visited.add(node);

  const kind = node.getKind();

  if (kind === SyntaxKind.ParenthesizedExpression) {
    return resolveNode(node.getExpression(), visited);
  }

  if (kind === SyntaxKind.AsExpression) {
    return resolveNode(node.getExpression(), visited);
  }

  if (kind === SyntaxKind.Identifier) {
    const name = node.getText();
    const out = [];
    // Try ts-morph's definition resolution first
    let defs = [];
    try {
      defs = node.getDefinitionNodes();
    } catch {
      defs = [];
    }
    // Fallback: syntactic name lookup in the enclosing source file
    if (!defs.length) {
      defs = findDeclarationsByName(node, name);
    }
    for (const def of defs) {
      if (def.getKind() === SyntaxKind.VariableDeclaration) {
        const init = def.getInitializer();
        if (init) out.push(...resolveNode(init, visited));
      } else if (
        def.getKind() === SyntaxKind.FunctionDeclaration ||
        def.getKind() === SyntaxKind.FunctionExpression ||
        def.getKind() === SyntaxKind.ArrowFunction
      ) {
        out.push(def);
      } else if (def.getKind() === SyntaxKind.Parameter) {
        // Parameter reference (e.g., baseURL in a sub-factory) — opaque.
      }
    }
    return out;
  }

  if (kind === SyntaxKind.PropertyAccessExpression) {
    // e.g., postV1.chat.completions — follow to the referenced leaf
    const sym = node.getSymbol();
    if (!sym) return [node];
    const decls = sym.getDeclarations();
    const out = [];
    for (const d of decls) {
      if (d.getKind() === SyntaxKind.PropertyAssignment) {
        const init = d.getInitializer();
        if (init) out.push(...resolveNode(init, visited));
      } else if (d.getKind() === SyntaxKind.ShorthandPropertyAssignment) {
        out.push(d);
      } else {
        out.push(d);
      }
    }
    return out.length ? out : [node];
  }

  if (kind === SyntaxKind.CallExpression) {
    const expr = node.getExpression();
    // Object.assign(base, { extra... })
    if (
      expr.getKind() === SyntaxKind.PropertyAccessExpression &&
      expr.getName() === "assign" &&
      expr.getExpression().getText() === "Object"
    ) {
      const args = node.getArguments();
      const merged = [];
      for (const a of args) {
        merged.push(...resolveNode(a, visited));
      }
      return merged;
    }
    // Spread factory call like `...createClaudeProvider(...)` — handled by caller
    // via spread expression resolution; here we treat as opaque.
    return [node];
  }

  if (
    kind === SyntaxKind.ArrowFunction ||
    kind === SyntaxKind.FunctionExpression ||
    kind === SyntaxKind.FunctionDeclaration
  ) {
    return [node];
  }

  if (kind === SyntaxKind.ObjectLiteralExpression) {
    return [node];
  }

  return [node];
}

/**
 * Given an async-function leaf node, find the node that should carry the URL
 * comment. The comment belongs at the endpoint's DEFINITION site. Priority:
 *
 *   1. The innermost enclosing PropertyAssignment (inline definition inside
 *      an object literal — e.g., `completions: Object.assign(async (...), ...)`)
 *   2. The enclosing standalone FunctionDeclaration (e.g., `async function chatImpl`)
 *   3. The enclosing standalone VariableStatement (e.g., `const messages = Object.assign(...)`)
 *
 * (1) takes precedence over (3) so we don't collapse dozens of endpoints that
 * live inside a single `const postV1 = { ... }` onto the same anchor.
 */
function findCommentAnchor(leafNode) {
  let cur = leafNode;
  let innerPropertyAssignment = null;
  while (cur) {
    const k = cur.getKind();
    if (k === SyntaxKind.PropertyAssignment && !innerPropertyAssignment) {
      innerPropertyAssignment = cur;
      // Keep walking — want the innermost property assignment but also want
      // to know if we exit without finding one at all.
    }
    if (k === SyntaxKind.FunctionDeclaration) {
      return innerPropertyAssignment ?? cur;
    }
    if (k === SyntaxKind.VariableStatement) {
      return innerPropertyAssignment ?? cur;
    }
    cur = cur.getParent?.();
  }
  return innerPropertyAssignment ?? leafNode;
}

function findDeclarationsByName(fromNode, name) {
  const results = [];
  const sourceFile = fromNode.getSourceFile();
  const seen = new Set();
  const visit = (stmt) => {
    const k = stmt.getKind();
    if (k === SyntaxKind.VariableStatement) {
      for (const decl of stmt.getDeclarations()) {
        if (decl.getName() === name && !seen.has(decl)) {
          results.push(decl);
          seen.add(decl);
        }
      }
    } else if (
      k === SyntaxKind.FunctionDeclaration &&
      stmt.getName() === name &&
      !seen.has(stmt)
    ) {
      results.push(stmt);
      seen.add(stmt);
    }
  };
  // 1) Walk enclosing blocks from innermost out
  let ancestor = fromNode.getParent();
  while (ancestor) {
    if (ancestor.getKind() === SyntaxKind.Block) {
      for (const s of ancestor.getStatements()) visit(s);
    }
    ancestor = ancestor.getParent();
  }
  // 2) Top-level source file statements
  for (const s of sourceFile.getStatements()) visit(s);
  return results;
}

function isAsyncCallable(node) {
  if (!node) return false;
  const k = node.getKind();
  if (
    k === SyntaxKind.ArrowFunction ||
    k === SyntaxKind.FunctionExpression ||
    k === SyntaxKind.FunctionDeclaration
  ) {
    return node.isAsync
      ? node.isAsync()
      : !!node.getModifier?.(SyntaxKind.AsyncKeyword);
  }
  return false;
}

const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD"];

// Helper-function name → implied HTTP method when first arg is a path.
const HELPER_METHOD_HINTS = {
  // GET family
  makeGetRequest: "GET",
  makeGetTextRequest: "GET",
  makeGetBinaryRequest: "GET",
  getRequest: "GET",
  // DELETE family
  makeDeleteRequest: "DELETE",
  deleteRequest: "DELETE",
  // PUT / PATCH family
  makePutRequest: "PUT",
  makePatchRequest: "PATCH",
  // POST family (default)
  makeRequest: "POST",
  makeBinaryRequest: "POST",
  makeEmptyPostRequest: "POST",
  makeJsonRequest: "POST",
  makeFormRequest: "POST",
  makeFormRequestText: "POST",
  makeBinaryPostRequest: "POST",
  makeManagementRequest: "POST",
  makeStreamRequest: "POST",
  makeSSERequest: "POST",
  makeAudioRequest: "POST",
  makeAudioBatchRequest: "POST",
  makeStreamPostWithQuery: "POST",
  makeStreamPost: "POST",
  makePostWithQuery: "POST",
  streamRequest: "POST",
  sseRequest: "POST",
  jsonRequest: "POST",
  postRequest: "POST",
  makeMultipartRequest: "POST",
};

// Helpers whose first arg is always a full absolute URL (free only).
// `makeFormRequest` means something different per-provider — some pass a
// relative path, some pass an absolute URL — so we DON'T hard-code it here and
// instead inspect the argument: if it starts with `http(s)://`, it's absolute.
const ABSOLUTE_URL_HELPERS = new Set([]);

/**
 * Extract (method, path) from an async function body by scanning call
 * expressions. Returns the first confident match.
 */
function extractMethodAndPath(fnNode, visited = new Set()) {
  if (visited.has(fnNode)) return { method: null, path: null };
  visited.add(fnNode);
  const body = fnNode.getBody?.();
  if (!body) return { method: null, path: null };

  const calls = body.getDescendantsOfKind(SyntaxKind.CallExpression);
  // First pass: known request helpers
  for (const call of calls) {
    const expr = call.getExpression();
    const name = expr.getText();
    const args = call.getArguments();
    if (!args.length) continue;

    // Shape A: helper("METHOD", "/path", ...) — method is first arg string literal
    if (args[0].getKind() === SyntaxKind.StringLiteral) {
      const first = args[0].getLiteralText().toUpperCase();
      if (HTTP_METHODS.includes(first) && args.length > 1) {
        const p = extractPath(args[1]);
        if (p) return { method: first, path: p };
      }
    }

    // Shape B: doFetch(`${baseURL}/path`, { method: "POST", ... })
    //  or:     kieRequest(`${baseURL}/path`, { method: "POST", body, ... })
    if (name === "doFetch" || name === "fetch" || name === "kieRequest") {
      const p = extractPath(args[0]);
      const m = extractMethodFromOptions(args[1]);
      if (p) return { method: m || "POST", path: p };
    }

    // Shape C: helper("/path", body, signal) — method inferred from helper name
    if (HELPER_METHOD_HINTS[name]) {
      const p = extractPath(args[0]);
      if (p) {
        return {
          method: HELPER_METHOD_HINTS[name],
          path: p,
          absolute: ABSOLUTE_URL_HELPERS.has(name) || /^https?:\/\//i.test(p),
        };
      }
    }

    // Shape D: absolute URL passed to any fetch-like helper
    if (args.length >= 1) {
      const p = extractPath(args[0]);
      if (p && /^https?:\/\//i.test(p)) {
        const m = extractMethodFromOptions(args[1]) || "POST";
        return { method: m, path: p, absolute: true };
      }
    }
  }

  // Second pass: proxy calls — `return await someLocalFn(...)` where the
  // local function is itself an endpoint. Recursively resolve.
  for (const call of calls) {
    const expr = call.getExpression();
    const ek = expr.getKind();
    let targetName = null;
    if (ek === SyntaxKind.Identifier) {
      targetName = expr.getText();
    } else if (
      ek === SyntaxKind.PropertyAccessExpression &&
      expr.getExpression().getKind() === SyntaxKind.Identifier
    ) {
      // `postMessages.countTokens(req, signal)` — follow to the base identifier
      targetName = expr.getExpression().getText();
    }
    if (!targetName) continue;
    // Skip helper-like names (they're handled above)
    if (
      HELPER_METHOD_HINTS[targetName] ||
      targetName === "doFetch" ||
      targetName === "fetch"
    ) {
      continue;
    }
    const decls = findDeclarationsByName(fnNode, targetName);
    for (const d of decls) {
      let candidate = null;
      if (d.getKind() === SyntaxKind.FunctionDeclaration) {
        candidate = d;
      } else if (d.getKind() === SyntaxKind.VariableDeclaration) {
        const init = d.getInitializer();
        if (!init) continue;
        const resolved = resolveNode(init, new Set());
        candidate = resolved.find((n) => isAsyncCallable(n));
      }
      if (!candidate || !isAsyncCallable(candidate)) continue;
      const sub = extractMethodAndPath(candidate, visited);
      if (sub.method && sub.path) {
        // For property-access proxies (`postMessages.countTokens`), we want
        // the nested endpoint — but resolving only the base function gives us
        // the TOP-level endpoint. In that case, try to resolve the child.
        if (
          ek === SyntaxKind.PropertyAccessExpression &&
          d.getKind() === SyntaxKind.VariableDeclaration
        ) {
          const childName = expr.getName();
          const subEndpoint = findChildEndpoint(d, childName);
          if (subEndpoint) {
            const sub2 = extractMethodAndPath(subEndpoint, visited);
            if (sub2.method && sub2.path) return sub2;
          }
        }
        return sub;
      }
    }
  }

  return { method: null, path: null };
}

/**
 * Given a VariableDeclaration whose initializer is an Object.assign(fn, {kids}),
 * find the child callable with the given name.
 */
function findChildEndpoint(varDecl, childName) {
  const init = varDecl.getInitializer();
  if (!init || init.getKind() !== SyntaxKind.CallExpression) return null;
  const expr = init.getExpression();
  if (
    expr.getKind() !== SyntaxKind.PropertyAccessExpression ||
    expr.getName() !== "assign" ||
    expr.getExpression().getText() !== "Object"
  ) {
    return null;
  }
  for (const arg of init.getArguments().slice(1)) {
    if (arg.getKind() !== SyntaxKind.ObjectLiteralExpression) continue;
    for (const prop of arg.getProperties()) {
      if (prop.getKind() !== SyntaxKind.PropertyAssignment) continue;
      if (prop.getName() !== childName) continue;
      const pi = prop.getInitializer();
      if (!pi) continue;
      const resolved = resolveNode(pi, new Set());
      const callable = resolved.find((n) => isAsyncCallable(n));
      if (callable) return callable;
    }
  }
  return null;
}

// Identifier names that represent a factory-level base URL (should NOT be
// emitted as path placeholders — the URL constructor will prepend baseURL).
const BASE_URL_IDENTIFIERS = new Set([
  "baseURL",
  "base",
  "baseUrl",
  "apiBase",
  "apiBaseURL",
  "uploadBaseURL",
  "uploadBase",
]);

function extractPath(argNode) {
  if (!argNode) return null;
  const k = argNode.getKind();
  if (k === SyntaxKind.StringLiteral) {
    return argNode.getLiteralText();
  }
  if (k === SyntaxKind.NoSubstitutionTemplateLiteral) {
    return argNode.getLiteralText();
  }
  if (k === SyntaxKind.TemplateExpression) {
    let result = "";
    const head = argNode.getHead().getLiteralText();
    result += head;
    const spans = argNode.getTemplateSpans();
    for (let i = 0; i < spans.length; i++) {
      const span = spans[i];
      const expr = span.getExpression();
      // Skip the `baseURL` placeholder when it appears as the first span with
      // an empty head — the URL builder will re-prepend baseURL itself.
      if (
        i === 0 &&
        head === "" &&
        expr.getKind() === SyntaxKind.Identifier &&
        BASE_URL_IDENTIFIERS.has(expr.getText())
      ) {
        result += span.getLiteral().getLiteralText();
        continue;
      }
      result += synthesizePlaceholder(expr);
      result += span.getLiteral().getLiteralText();
    }
    return result || null;
  }
  return null;
}

function synthesizePlaceholder(expr) {
  const text = expr.getText();
  // encodeURIComponent(foo) → {foo}
  const m = text.match(/^encodeURIComponent\(([^)]+)\)$/);
  if (m) return `{${m[1].trim()}}`;
  // Simple identifier like `id` → {id}
  if (expr.getKind() === SyntaxKind.Identifier) {
    return `{${text}}`;
  }
  // Otherwise generic placeholder
  return `{param}`;
}

function extractMethodFromOptions(argNode) {
  if (!argNode) return null;
  if (argNode.getKind() !== SyntaxKind.ObjectLiteralExpression) return null;
  for (const prop of argNode.getProperties()) {
    if (prop.getKind() !== SyntaxKind.PropertyAssignment) continue;
    const name = prop.getName?.();
    if (name !== "method") continue;
    const init = prop.getInitializer();
    if (init && init.getKind() === SyntaxKind.StringLiteral) {
      return init.getLiteralText().toUpperCase();
    }
  }
  return null;
}

/**
 * Walk an object literal or resolved-endpoint node, yielding { dotPath, leafNode } pairs.
 * - Descends through nested ObjectLiteralExpressions.
 * - Resolves identifier references via resolveNode.
 * - Treats async callables as leaves.
 */
function* walkReturnTree(node, pathStack, visited) {
  const resolved = resolveNode(node, new Set(visited));
  for (const n of resolved) {
    const k = n.getKind();
    if (
      k === SyntaxKind.ArrowFunction ||
      k === SyntaxKind.FunctionExpression ||
      k === SyntaxKind.FunctionDeclaration
    ) {
      yield { dotPath: pathStack.slice(), leafNode: n };
      continue;
    }
    if (k === SyntaxKind.ObjectLiteralExpression) {
      for (const prop of n.getProperties()) {
        const pk = prop.getKind();
        if (pk === SyntaxKind.PropertyAssignment) {
          const name = prop.getName();
          // Skip attached metadata (schema, payloadSchema, validatePayload) on Object.assign endpoints
          if (
            name === "schema" ||
            name === "payloadSchema" ||
            name === "validatePayload" ||
            name === "modelInputSchemas"
          ) {
            continue;
          }
          const init = prop.getInitializer();
          if (!init) continue;
          yield* walkReturnTree(
            init,
            [...pathStack, { key: name, propNode: prop }],
            visited
          );
        } else if (pk === SyntaxKind.ShorthandPropertyAssignment) {
          const name = prop.getName();
          // Resolve the identifier to its declaration (prefer syntactic lookup)
          const decls = findDeclarationsByName(prop, name);
          for (const d of decls) {
            if (d.getKind() === SyntaxKind.VariableDeclaration) {
              const init = d.getInitializer();
              if (init) {
                yield* walkReturnTree(
                  init,
                  [...pathStack, { key: name, propNode: prop }],
                  visited
                );
              }
            } else if (d.getKind() === SyntaxKind.FunctionDeclaration) {
              yield {
                dotPath: [...pathStack, { key: name, propNode: prop }],
                leafNode: d,
              };
            }
          }
        } else if (pk === SyntaxKind.SpreadAssignment) {
          const expr = prop.getExpression();
          yield* walkReturnTree(expr, pathStack, visited);
        } else if (pk === SyntaxKind.MethodDeclaration) {
          const name = prop.getName();
          yield {
            dotPath: [...pathStack, { key: name, propNode: prop }],
            leafNode: prop,
          };
        }
      }
      continue;
    }
    // Unknown node shape — skip silently
  }
}

function methodFromPathStack(pathStack) {
  // Look for the first top-level key that matches a method name exactly,
  // or a "postV1" / "getApiV1" style intermediate-namespace name.
  for (const seg of pathStack) {
    const k = String(seg.key);
    const lower = k.toLowerCase();
    if (METHOD_KEYS.has(lower)) return lower.toUpperCase();
    // Match `postV1`, `getApiV1`, `deleteV1ModelsRequests`, `postStreamV1`,
    // etc. — only when the verb is followed by a namespace marker like
    // `V<digit>` or `Api`/`Stream`. Avoid false matches like `getResult`.
    const m = k.match(
      /^(post|get|put|delete|patch)(?=(V\d|Api|Stream|Ws|Sse|Management|Binary|Empty|Form|Json|Multipart|Get|Post))/
    );
    if (m) return m[1].toUpperCase();
  }
  return null;
}

function logicalDotPath(pathStack) {
  // Drop HTTP-method segments from the user-facing dotted path.
  // Also drop "stream"/"ws"/"run" pseudo-method segments.
  const keys = pathStack.map((s) => String(s.key));
  const filtered = keys.filter((k) => {
    const l = k.toLowerCase();
    if (METHOD_KEYS.has(l)) return false;
    if (STREAM_KEYS.has(l)) return false;
    return true;
  });
  return filtered.join(".");
}

function fullDotPath(pathStack) {
  return pathStack.map((s) => String(s.key)).join(".");
}

/**
 * Wrapper that dedupes walker output by (file, anchor node start position),
 * preferring the emission with the most complete metadata (method + fullUrl).
 * The raw walker can visit the same endpoint via multiple alias paths in the
 * return tree (e.g., `postV1.messages` and `legacyV1.messages`); this collapses
 * them to a single record per definition site.
 */
export async function* walkAllEndpoints(project) {
  const byAnchor = new Map();
  for await (const ep of walkAllEndpointsRaw(project)) {
    const anchor = ep.commentNode ?? ep.propNode;
    if (!anchor) {
      yield ep;
      continue;
    }
    const key = `${anchor.getSourceFile().getFilePath()}:${anchor.getStart()}`;
    const prev = byAnchor.get(key);
    if (!prev) {
      byAnchor.set(key, ep);
      continue;
    }
    // Prefer the emission with method AND fullUrl set
    const score = (e) =>
      (e.method ? 2 : 0) + (e.fullUrl && e.fullUrl !== "?" ? 1 : 0);
    if (score(ep) > score(prev)) byAnchor.set(key, ep);
  }
  for (const ep of byAnchor.values()) yield ep;
}

async function* walkAllEndpointsRaw(project) {
  for (const provider of PROVIDERS) {
    const providerBaseURLs = new Map(); // factoryName → baseURL literal
    // First pass: resolve baseURL per factory
    for (const file of provider.entryFiles) {
      const sf = project.getSourceFile(path.join(REPO_ROOT, file));
      if (!sf) continue;
      for (const name of provider.factoryNames) {
        const fn = findFactory(sf, name);
        if (!fn) continue;
        const base = extractBaseURL(fn);
        if (base) providerBaseURLs.set(name, base);
      }
    }

    for (const file of provider.entryFiles) {
      const sf = project.getSourceFile(path.join(REPO_ROOT, file));
      if (!sf) continue;
      for (const name of provider.factoryNames) {
        const fn = findFactory(sf, name);
        if (!fn) continue;
        const retExpr = getReturnObject(fn);
        if (!retExpr) continue;
        const baseURL =
          providerBaseURLs.get(name) ??
          [...providerBaseURLs.values()][0] ??
          null;
        for (const { dotPath, leafNode } of walkReturnTree(
          retExpr,
          [],
          new Set()
        )) {
          if (!isAsyncCallable(leafNode)) continue;
          const {
            method: methodFromBody,
            path: rawPath,
            absolute,
          } = extractMethodAndPath(leafNode);
          const methodFromPath = methodFromPathStack(dotPath);
          const method = methodFromPath || methodFromBody;
          const pth = rawPath;
          const logical = logicalDotPath(dotPath);
          const full = fullDotPath(dotPath);
          let fullUrl;
          if (!pth) {
            fullUrl = null;
          } else if (absolute || /^https?:\/\//i.test(pth)) {
            fullUrl = pth;
          } else if (baseURL) {
            const b = baseURL.replace(/\/$/, "");
            const p = pth.startsWith("/") ? pth : "/" + pth;
            fullUrl = b + p;
          } else {
            fullUrl = pth;
          }
          const commentNode = findCommentAnchor(leafNode);
          yield {
            provider: provider.name,
            file: path.relative(REPO_ROOT, sf.getFilePath()),
            factory: name,
            dotPath: logical,
            fullDotPath: full,
            method: method || null,
            path: pth || null,
            fullUrl,
            propNode: dotPath[dotPath.length - 1]?.propNode ?? null,
            commentNode,
            leafNode,
          };
        }
      }
    }
  }
}

export { loadProject, PROVIDERS };
