#!/usr/bin/env node
/**
 * Enforce the provider endpoint-method conventions across every factory:
 *
 *   1. camelCase segment paths — endpoint keys are camelCase identifiers,
 *      never bracket-notation kebab-case (CLAUDE.md endpoint naming).
 *   2. dotPath mirrors the URL — where an endpoint lives in the factory tree
 *      matches its upstream URL path, segment-by-segment. Intentional
 *      divergences are acknowledged with a `// sig-ok: <reason>` comment.
 *   3. POST endpoints expose a `.schema` — the zod request schema attached via
 *      `Object.assign`. Genuinely body-less/multipart POSTs are acknowledged
 *      with a `// schema-ok: <reason>` comment.
 *
 * Exits non-zero on any unacknowledged violation. Acknowledgment comments are
 * inserted by `pnpm run lint:signatures:fix`.
 *
 * Usage:
 *   node scripts/check-endpoint-signatures.mjs [--provider openai,xai]
 */
import {
  loadProject,
  walkAllEndpoints,
  PROVIDERS,
  TSV_ONLY_PROVIDERS,
} from "./lib/endpoint-walk.mjs";
import {
  computeDrift,
  camelCaseIssues,
  staticConfirmSchema,
  typeHasSchema,
  hasAckComment,
} from "./lib/endpoint-convention.mjs";
import path from "node:path";

function parseArgs(argv) {
  const options = { providers: new Set(), help: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }
    if (arg === "--provider" || arg === "--providers") {
      if (i + 1 >= argv.length) {
        throw new Error(`${arg} requires a comma-separated provider list`);
      }
      addProviders(options.providers, argv[++i]);
      continue;
    }
    if (arg.startsWith("--provider=") || arg.startsWith("--providers=")) {
      addProviders(options.providers, arg.slice(arg.indexOf("=") + 1));
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }
  validateProviders(options.providers);
  return options;
}

function addProviders(providers, value) {
  for (const provider of value.split(",")) {
    const normalized = provider.trim();
    if (normalized) providers.add(normalized);
  }
}

function validateProviders(providers) {
  const known = new Set([
    ...PROVIDERS.map((p) => p.name),
    ...TSV_ONLY_PROVIDERS,
  ]);
  const unknown = [...providers].filter((p) => !known.has(p));
  if (unknown.length) {
    throw new Error(
      `Unknown provider(s): ${unknown.join(", ")}. ` +
        `Known providers: ${[...known].join(", ")}`
    );
  }
}

function usage() {
  console.log(`Usage: node scripts/check-endpoint-signatures.mjs [options]

  --provider <list>    Comma-separated provider filter, e.g. "openai,xai"
  --providers <list>   Alias for --provider
  --help, -h           Show this help`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    usage();
    return;
  }

  const providers = [...options.providers];
  const project = loadProject(providers);
  const errors = [];
  let total = 0;
  let checkedDrift = 0;
  let checkedSchema = 0;
  const seen = new Set();

  for await (const ep of walkAllEndpoints(project, { providers })) {
    const anchor = ep.commentNode ?? ep.propNode;
    const key = anchor
      ? `${anchor.getSourceFile().getFilePath()}:${anchor.getStart()}`
      : `${ep.file}:${ep.fullDotPath}:${ep.method}`;
    if (seen.has(key)) continue;
    seen.add(key);
    total++;

    const relFile = path.relative(process.cwd(), ep.file);
    const label = `${ep.provider}.${ep.dotPath} (${ep.method ?? "?"})`;

    // (1) camelCase segment keys — always enforced.
    const badSegments = camelCaseIssues(ep);
    if (badSegments.length) {
      errors.push(
        `${relFile}: ${label}: endpoint key(s) not camelCase: ${badSegments.join(", ")}`
      );
    }

    // (2) dotPath mirrors URL — sig-ok acknowledges intentional divergence.
    const drift = computeDrift(ep);
    if (drift) {
      checkedDrift++;
      if (drift.drifts && !(anchor && hasAckComment(anchor, "sig-ok"))) {
        errors.push(
          `${relFile}: ${label}: dotPath "${drift.actual}" drifts from url-derived "${drift.expected}" — fix the path or add \`// sig-ok: <reason>\``
        );
      }
    }

    // (3) POST endpoints expose .schema — schema-ok acknowledges body-less POSTs.
    if (ep.method === "POST") {
      checkedSchema++;
      const hasSchema = staticConfirmSchema(ep) || typeHasSchema(ep);
      if (!hasSchema && !(anchor && hasAckComment(anchor, "schema-ok"))) {
        errors.push(
          `${relFile}: ${label}: POST endpoint has no \`.schema\` — attach a zod request schema via Object.assign or add \`// schema-ok: <reason>\``
        );
      }
    }
  }

  const scope =
    providers.length > 0
      ? ` for ${providers.join(", ")}`
      : ` across ${PROVIDERS.length} providers`;

  if (errors.length) {
    for (const e of errors) console.error(e);
    console.error(
      `\n${errors.length} endpoint convention violation(s) across ${total} endpoints${scope}.`
    );
    process.exit(1);
  }

  console.log(
    `Checked ${total} endpoints${scope} — camelCase keys, ${checkedDrift} URL dotPaths, ${checkedSchema} POST schemas all conform.`
  );
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
