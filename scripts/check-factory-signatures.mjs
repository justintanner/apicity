#!/usr/bin/env node
/**
 * Enforce the standard provider factory shape:
 *
 *   export function create<Provider>(opts: <Provider>Options): <Provider>Provider
 *
 *   1. Exactly one parameter — a single options object.
 *   2. That parameter is annotated with a named options type (not inline/any).
 *   3. The factory declares a named provider return type (the provider tree).
 *   4. The options type exposes the transport hooks `timeout?` and `fetch?`,
 *      both optional and correctly typed (number / fetch-like).
 *   5. Where present, `baseURL?` is optional and a string.
 *
 * A factory that intentionally deviates can be acknowledged with a
 * `// factory-ok: <reason>` comment on the line(s) above it. Exits non-zero on
 * any unacknowledged violation.
 *
 * Usage:
 *   node scripts/check-factory-signatures.mjs [--provider openai,xai]
 */
import { SyntaxKind } from "ts-morph";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PROVIDERS, TSV_ONLY_PROVIDERS, loadProject } from "./lib/endpoint-walk.mjs";
import { hasAckComment } from "./lib/endpoint-convention.mjs";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

function parseArgs(argv) {
  const providers = new Set();
  let help = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      help = true;
      continue;
    }
    if (arg === "--provider" || arg === "--providers") {
      if (i + 1 >= argv.length) {
        throw new Error(`${arg} requires a comma-separated provider list`);
      }
      for (const p of argv[++i].split(",")) if (p.trim()) providers.add(p.trim());
      continue;
    }
    if (arg.startsWith("--provider=") || arg.startsWith("--providers=")) {
      for (const p of arg.slice(arg.indexOf("=") + 1).split(","))
        if (p.trim()) providers.add(p.trim());
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }
  const known = new Set([...PROVIDERS.map((p) => p.name), ...TSV_ONLY_PROVIDERS]);
  const unknown = [...providers].filter((p) => !known.has(p));
  if (unknown.length) {
    throw new Error(
      `Unknown provider(s): ${unknown.join(", ")}. Known: ${[...known].join(", ")}`
    );
  }
  return { providers: [...providers], help };
}

function findFactory(project, provider, name) {
  for (const file of provider.entryFiles) {
    const sf = project.getSourceFile(path.join(REPO_ROOT, file));
    if (!sf) continue;
    const fn = sf.getFunction(name);
    if (fn) return { fn, anchor: fn, sf };
    const v = sf.getVariableDeclaration(name);
    const init = v?.getInitializer();
    if (
      init &&
      (init.getKind() === SyntaxKind.ArrowFunction ||
        init.getKind() === SyntaxKind.FunctionExpression)
    ) {
      return {
        fn: init,
        anchor: v.getFirstAncestorByKind(SyntaxKind.VariableStatement) ?? v,
        sf,
      };
    }
  }
  return null;
}

function fieldOf(optionsType, name, location) {
  const sym = optionsType.getProperty(name);
  if (!sym) return null;
  const optional = sym.isOptional?.() ?? false;
  let type = null;
  try {
    type = sym.getTypeAtLocation(location);
  } catch {
    type = sym.getDeclarations?.()[0]?.getType?.() ?? null;
  }
  if (type && type.isUnion()) type = type.getNonNullableType();
  return { optional, type };
}

function checkFactory(provider, project, errors) {
  const name = provider.factoryNames[0];
  const found = findFactory(project, provider, name);
  if (!found) {
    errors.push(`${provider.name}: factory ${name}() not found`);
    return;
  }
  const { fn, anchor } = found;
  if (hasAckComment(anchor, "factory-ok")) return;

  const rel = path.relative(process.cwd(), fn.getSourceFile().getFilePath());
  const at = (msg) => `${rel}: ${provider.name} ${name}(): ${msg}`;

  // (1) Exactly one parameter.
  const params = fn.getParameters();
  if (params.length !== 1) {
    errors.push(
      at(`must take exactly one options-object parameter (has ${params.length})`)
    );
    return;
  }
  const param = params[0];

  // (2) Parameter annotated with a named options type.
  const typeNode = param.getTypeNode();
  if (!typeNode || typeNode.getKind() !== SyntaxKind.TypeReference) {
    errors.push(
      at("options parameter must be annotated with a named options type")
    );
    return;
  }

  // (3) Declared named provider return type.
  const retNode = fn.getReturnTypeNode?.();
  if (!retNode || retNode.getKind() !== SyntaxKind.TypeReference) {
    errors.push(at("must declare a named provider return type (the provider tree)"));
  }

  // (4)/(5) Transport-hook shape on the resolved options type.
  let optionsType = param.getType();
  if (optionsType.isUnion()) optionsType = optionsType.getNonNullableType();

  const fetchField = fieldOf(optionsType, "fetch", param);
  if (!fetchField) {
    errors.push(at("options type must expose a `fetch?` hook"));
  } else {
    if (!fetchField.optional) errors.push(at("`fetch` must be optional"));
    if (fetchField.type && fetchField.type.getCallSignatures().length === 0) {
      errors.push(at("`fetch` must be a fetch-like function type"));
    }
  }

  const timeoutField = fieldOf(optionsType, "timeout", param);
  if (!timeoutField) {
    errors.push(at("options type must expose a `timeout?` hook"));
  } else {
    if (!timeoutField.optional) errors.push(at("`timeout` must be optional"));
    if (timeoutField.type && !timeoutField.type.isNumber()) {
      errors.push(at("`timeout` must be a number"));
    }
  }

  const baseURLField = fieldOf(optionsType, "baseURL", param);
  if (baseURLField) {
    if (!baseURLField.optional) errors.push(at("`baseURL` must be optional"));
    if (baseURLField.type && !baseURLField.type.isString()) {
      errors.push(at("`baseURL` must be a string"));
    }
  }
}

async function main() {
  const { providers, help } = parseArgs(process.argv.slice(2));
  if (help) {
    console.log(
      "Usage: node scripts/check-factory-signatures.mjs [--provider openai,xai]"
    );
    return;
  }

  const selected =
    providers.length > 0
      ? PROVIDERS.filter((p) => providers.includes(p.name))
      : PROVIDERS;
  const project = loadProject(providers);
  const errors = [];

  for (const provider of selected) checkFactory(provider, project, errors);

  const scope =
    providers.length > 0
      ? ` for ${providers.join(", ")}`
      : ` across ${PROVIDERS.length} providers`;

  if (errors.length) {
    for (const e of errors) console.error(e);
    console.error(`\n${errors.length} factory shape violation(s)${scope}.`);
    process.exit(1);
  }
  console.log(
    `Checked ${selected.length} provider factories${scope} — all conform to the standard shape.`
  );
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
