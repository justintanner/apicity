#!/usr/bin/env node
// Validate every tracked compare-*-cost lineup against its declared public
// provider schema. The module is intentionally dependency-free and import-safe:
// tests inject source-resolved schemas, while the CLI loads built KIE output
// only after callers have run the explicit build command.

import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath, pathToFileURL } from "node:url";

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const discoveryPathspec = "scripts/compare-*-cost.mjs";
const trackedScriptPattern = /^scripts\/compare-[^/]+-cost\.mjs$/;

export const createTaskAssociationKey = "kie:post.api.v1.jobs.createTask";
export const veoGenerateAssociationKey = "kie:veo.post.api.v1.veo.generate";

function compareText(left, right) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function formatError(error) {
  return error instanceof Error ? error.message : String(error);
}

function safeText(value) {
  return String(value)
    .replace(/[\r\n\t]+/g, " ")
    .trim();
}

async function runGit(args, options) {
  return execFileAsync("git", args, {
    ...options,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
}

function gitStdout(result) {
  if (typeof result === "string" || Buffer.isBuffer(result)) {
    return String(result);
  }
  if (result && (typeof result.stdout === "string" || result.stdout)) {
    return String(result.stdout);
  }
  throw new Error("Git discovery returned no stdout value");
}

function normalizeTrackedScript(value) {
  const normalized = path.posix.normalize(value.replace(/\\/g, "/"));
  if (
    path.posix.isAbsolute(normalized) ||
    normalized.startsWith("../") ||
    !trackedScriptPattern.test(normalized)
  ) {
    throw new Error(`Git returned an unexpected comparison path: ${value}`);
  }
  return normalized;
}

/** Discover tracked comparison scripts without maintaining a filename list. */
export async function discoverCompareCostScripts(
  root = repoRoot,
  dependencies = {}
) {
  const executeGit = dependencies.runGit ?? runGit;
  let output;
  try {
    output = await executeGit(["ls-files", "-z", "--", discoveryPathspec], {
      cwd: root,
    });
  } catch (error) {
    throw new Error(
      `Git comparison-script discovery failed: ${formatError(error)}`
    );
  }

  const discovered = gitStdout(output)
    .split("\0")
    .filter(Boolean)
    .map(normalizeTrackedScript);
  const files = [...new Set(discovered)].sort(compareText);

  if (files.length !== discovered.length) {
    throw new Error("Git comparison-script discovery returned duplicate paths");
  }
  if (files.length === 0) {
    throw new Error(
      `Git comparison-script discovery found no tracked ${discoveryPathspec}`
    );
  }
  return files;
}

function displayPath(value) {
  return String(value).replace(/\\/g, "/");
}

/** Dynamically import and validate one comparison module's public contract. */
export async function loadCompareCostModule(filePath, dependencies = {}) {
  const sourcePath = displayPath(dependencies.sourcePath ?? filePath);
  const importModule =
    dependencies.importModule ?? ((specifier) => import(specifier));
  let loaded;
  try {
    loaded = await importModule(pathToFileURL(path.resolve(filePath)).href);
  } catch (error) {
    throw new Error(
      `${sourcePath}: unable to load comparison module: ${formatError(error)}`
    );
  }

  if (!Array.isArray(loaded?.lineup)) {
    throw new Error(`${sourcePath}: missing non-empty array export \`lineup\``);
  }
  if (loaded.lineup.length === 0) {
    throw new Error(`${sourcePath}: exported \`lineup\` must not be empty`);
  }
  if (typeof loaded.schemaValidationCases !== "function") {
    throw new Error(
      `${sourcePath}: missing function export \`schemaValidationCases\``
    );
  }

  return {
    sourcePath,
    lineup: loaded.lineup,
    schemaValidationCases: loaded.schemaValidationCases,
  };
}

/** Map declared row associations to the exact shipped public schemas. */
export function createSchemaRegistry(kie) {
  return new Map([
    [createTaskAssociationKey, kie?.post?.api?.v1?.jobs?.createTask?.schema],
    [veoGenerateAssociationKey, kie?.veo?.post?.api?.v1?.veo?.generate?.schema],
  ]);
}

export function associationKey(provider, endpoint) {
  return `${provider}:${endpoint}`;
}

export function formatIssuePath(issuePath) {
  if (!Array.isArray(issuePath) || issuePath.length === 0) return "<root>";
  return issuePath.map((part) => String(part)).join(".");
}

function combineIssuePath(parentPath, issuePath) {
  const child = Array.isArray(issuePath) ? issuePath : [];
  if (parentPath.length === 0) return child;
  const alreadyPrefixed = parentPath.every(
    (part, index) => child[index] === part
  );
  return alreadyPrefixed ? child : [...parentPath, ...child];
}

function unionAlternatives(issue) {
  if (Array.isArray(issue?.errors)) {
    return issue.errors.filter((alternative) => Array.isArray(alternative));
  }
  if (Array.isArray(issue?.unionErrors)) {
    return issue.unionErrors
      .map((error) => error?.issues)
      .filter((alternative) => Array.isArray(alternative));
  }
  return [];
}

function issueSignature(issues) {
  return issues
    .map(
      (issue) =>
        `${formatIssuePath(issue.path)}\0${issue.code}\0${issue.message}`
    )
    .sort(compareText)
    .join("\0");
}

function modelMismatchCount(issues) {
  return issues.filter(
    (issue) =>
      issue.path.includes("model") &&
      (issue.code === "invalid_value" || issue.code === "invalid_literal")
  ).length;
}

function selectUnionAlternative(alternatives, parentPath) {
  const candidates = alternatives.map((alternative, index) => {
    const issues = flattenZodIssues(alternative, parentPath);
    return {
      index,
      issues,
      modelMismatches: modelMismatchCount(issues),
      signature: issueSignature(issues),
    };
  });

  candidates.sort((left, right) => {
    const leftHasMismatch = left.modelMismatches > 0 ? 1 : 0;
    const rightHasMismatch = right.modelMismatches > 0 ? 1 : 0;
    return (
      leftHasMismatch - rightHasMismatch ||
      left.modelMismatches - right.modelMismatches ||
      left.issues.length - right.issues.length ||
      compareText(left.signature, right.signature) ||
      left.index - right.index
    );
  });
  return candidates[0]?.issues ?? [];
}

function flattenZodIssues(issues, parentPath = []) {
  const flattened = [];
  for (const rawIssue of Array.isArray(issues) ? issues : []) {
    if (!rawIssue || typeof rawIssue !== "object") {
      flattened.push({
        code: "invalid_issue",
        path: parentPath,
        message: "Schema returned a malformed issue",
      });
      continue;
    }

    const issuePath = combineIssuePath(parentPath, rawIssue.path);
    const alternatives = unionAlternatives(rawIssue);
    if (rawIssue.code === "invalid_union" && alternatives.length > 0) {
      flattened.push(...selectUnionAlternative(alternatives, issuePath));
      continue;
    }

    flattened.push({
      code: typeof rawIssue.code === "string" ? rawIssue.code : "invalid",
      path: issuePath,
      message:
        typeof rawIssue.message === "string"
          ? rawIssue.message
          : "Invalid input",
    });
  }
  return flattened;
}

/** Normalize Zod 3/4 issues, selecting the matching model's union branch. */
export function normalizeZodIssues(issues) {
  const normalized = flattenZodIssues(issues).map((issue) => ({
    path: formatIssuePath(issue.path),
    message: issue.message,
  }));
  const unique = new Map();
  for (const issue of normalized) {
    unique.set(`${issue.path}\0${issue.message}`, issue);
  }
  return [...unique.values()].sort((left, right) => {
    return (
      compareText(left.path, right.path) ||
      compareText(left.message, right.message)
    );
  });
}

function moduleSource(moduleRecord, index) {
  for (const candidate of [
    moduleRecord?.sourcePath,
    moduleRecord?.file,
    moduleRecord?.path,
  ]) {
    if (typeof candidate === "string" && candidate.trim()) {
      return displayPath(candidate);
    }
  }
  return `<comparison module ${index}>`;
}

function rowIdentity(row, index) {
  if (
    row &&
    typeof row === "object" &&
    typeof row.label === "string" &&
    row.label.trim()
  ) {
    return `row "${safeText(row.label)}"`;
  }
  return `row index ${index}`;
}

function diagnosticContext({ sourcePath, identity, caseName, association }) {
  const parts = [sourcePath];
  if (identity) parts.push(identity);
  if (caseName) parts.push(`case "${safeText(caseName)}"`);
  if (association) parts.push(association);
  return parts.join(" :: ");
}

function registryEntry(registry, key) {
  if (registry && typeof registry.has === "function") {
    return {
      known: registry.has(key),
      schema:
        typeof registry.get === "function" ? registry.get(key) : undefined,
    };
  }
  if (registry && typeof registry === "object") {
    return {
      known: Object.prototype.hasOwnProperty.call(registry, key),
      schema: registry[key],
    };
  }
  return { known: false, schema: undefined };
}

function validateCase({
  caseValue,
  caseIndex,
  seenNames,
  schema,
  context,
  diagnostics,
}) {
  const fallbackName = `index ${caseIndex}`;
  const hasValidName =
    caseValue &&
    typeof caseValue === "object" &&
    typeof caseValue.name === "string" &&
    caseValue.name.trim();
  const caseName = hasValidName ? caseValue.name.trim() : fallbackName;
  const caseContext = diagnosticContext({ ...context, caseName });

  if (!hasValidName) {
    diagnostics.push(`${caseContext} :: setup: case name must be non-empty`);
  } else if (seenNames.has(caseName)) {
    diagnostics.push(`${caseContext} :: setup: duplicate case name`);
  }
  seenNames.add(caseName);

  if (
    !caseValue ||
    typeof caseValue !== "object" ||
    !Object.prototype.hasOwnProperty.call(caseValue, "payload") ||
    caseValue.payload === undefined
  ) {
    diagnostics.push(`${caseContext} :: setup: case is missing a payload`);
    return;
  }
  if (!schema) return;

  let parsed;
  try {
    parsed = schema.safeParse(caseValue.payload);
  } catch (error) {
    diagnostics.push(
      `${caseContext} :: <root>: schema safeParse threw: ${formatError(error)}`
    );
    return;
  }

  if (!parsed || typeof parsed.success !== "boolean") {
    diagnostics.push(
      `${caseContext} :: <root>: schema safeParse returned an invalid result`
    );
    return;
  }
  if (parsed.success) return;

  const issues = normalizeZodIssues(parsed.error?.issues);
  if (issues.length === 0) {
    diagnostics.push(
      `${caseContext} :: <root>: schema rejected payload without issues`
    );
    return;
  }
  for (const issue of issues) {
    diagnostics.push(`${caseContext} :: ${issue.path}: ${issue.message}`);
  }
}

function validateRow({
  row,
  rowIndex,
  sourcePath,
  materialize,
  registry,
  diagnostics,
}) {
  const identity = rowIdentity(row, rowIndex);
  const baseContext = { sourcePath, identity };
  if (!row || typeof row !== "object" || Array.isArray(row)) {
    diagnostics.push(
      `${diagnosticContext(baseContext)} :: setup: lineup row must be an object`
    );
    return 0;
  }

  if (
    !Object.prototype.hasOwnProperty.call(row, "payload") ||
    row.payload === undefined
  ) {
    diagnostics.push(
      `${diagnosticContext(baseContext)} :: setup: lineup row is missing a payload`
    );
  }

  const provider =
    typeof row.provider === "string" && row.provider.trim()
      ? row.provider.trim()
      : "";
  const endpoint =
    typeof row.endpoint === "string" && row.endpoint.trim()
      ? row.endpoint.trim()
      : "";
  const association = associationKey(
    provider || "<missing-provider>",
    endpoint || "<missing-endpoint>"
  );
  const context = { ...baseContext, association };

  let schema;
  if (!provider || !endpoint) {
    diagnostics.push(
      `${diagnosticContext(context)} :: setup: row must declare non-empty ` +
        "provider and endpoint fields"
    );
  } else {
    const entry = registryEntry(registry, association);
    if (!entry.known) {
      diagnostics.push(
        `${diagnosticContext(context)} :: setup: unknown provider/endpoint ` +
          "association; register its public schema in createSchemaRegistry"
      );
    } else if (!entry.schema || typeof entry.schema.safeParse !== "function") {
      diagnostics.push(
        `${diagnosticContext(context)} :: setup: registered public schema ` +
          "is unavailable or does not expose safeParse"
      );
    } else {
      schema = entry.schema;
    }
  }

  let cases;
  try {
    cases = materialize(row);
  } catch (error) {
    diagnostics.push(
      `${diagnosticContext(context)} :: setup: schemaValidationCases threw: ` +
        formatError(error)
    );
    return 0;
  }
  if (!Array.isArray(cases) || cases.length === 0) {
    diagnostics.push(
      `${diagnosticContext(context)} :: setup: schemaValidationCases must ` +
        "return a non-empty array"
    );
    return 0;
  }

  const seenNames = new Set();
  for (let caseIndex = 0; caseIndex < cases.length; caseIndex++) {
    validateCase({
      caseValue: cases[caseIndex],
      caseIndex,
      seenNames,
      schema,
      context,
      diagnostics,
    });
  }
  return cases.length;
}

/** Validate every row and case while aggregating deterministic diagnostics. */
export function validateCompareCostModules(modules, schemaRegistry) {
  const diagnostics = [];
  let rows = 0;
  let cases = 0;

  if (!Array.isArray(modules) || modules.length === 0) {
    diagnostics.push(
      "<discovery> :: setup: no comparison modules were provided for validation"
    );
    return { ok: false, files: 0, rows, cases, skips: 0, diagnostics };
  }

  for (let moduleIndex = 0; moduleIndex < modules.length; moduleIndex++) {
    const moduleRecord = modules[moduleIndex];
    const sourcePath = moduleSource(moduleRecord, moduleIndex);
    if (!Array.isArray(moduleRecord?.lineup)) {
      diagnostics.push(
        `${sourcePath} :: setup: module lineup must be a non-empty array`
      );
      continue;
    }
    if (moduleRecord.lineup.length === 0) {
      diagnostics.push(
        `${sourcePath} :: setup: module lineup must not be empty`
      );
      continue;
    }
    if (typeof moduleRecord.schemaValidationCases !== "function") {
      diagnostics.push(
        `${sourcePath} :: setup: module is missing schemaValidationCases`
      );
      continue;
    }

    for (let rowIndex = 0; rowIndex < moduleRecord.lineup.length; rowIndex++) {
      rows++;
      cases += validateRow({
        row: moduleRecord.lineup[rowIndex],
        rowIndex,
        sourcePath,
        materialize: moduleRecord.schemaValidationCases,
        registry: schemaRegistry,
        diagnostics,
      });
    }
  }

  return {
    ok: diagnostics.length === 0,
    files: modules.length,
    rows,
    cases,
    skips: 0,
    diagnostics,
  };
}

async function loadCliSchemaRegistry(dependencies) {
  if (dependencies.schemaRegistry !== undefined) {
    return dependencies.schemaRegistry;
  }
  if (dependencies.kie !== undefined) {
    return createSchemaRegistry(dependencies.kie);
  }

  let createKie = dependencies.createKie;
  if (!createKie) {
    const importKie =
      dependencies.importKie ??
      (() => import("../packages/provider/kie/dist/src/index.js"));
    const kieModule = await importKie();
    createKie = kieModule?.createKie;
  }
  if (typeof createKie !== "function") {
    throw new Error("built @apicity/kie does not export createKie");
  }
  return createSchemaRegistry(createKie({ apiKey: "offline-schema-check" }));
}

function withSource(error, sourcePath) {
  const message = formatError(error);
  return message.includes(sourcePath)
    ? message
    : `${sourcePath} :: setup: ${message}`;
}

function resultSummary(result, status) {
  const errors = result.diagnostics.length;
  const errorSuffix = status === "fail" ? `, ${errors} errors` : "";
  return (
    `compare-cost payload schemas: ${status} — ${result.files} files, ` +
    `${result.rows} rows, ${result.cases} cases, ${result.skips} skips` +
    `${errorSuffix}.`
  );
}

function writeLine(stream, value) {
  stream.write(`${value}\n`);
}

/** CLI seam. Returns a status; only the direct wrapper sets process.exitCode. */
export async function main(dependencies = {}) {
  const root = dependencies.root ?? repoRoot;
  const stdout = dependencies.stdout ?? process.stdout;
  const stderr = dependencies.stderr ?? process.stderr;
  const discover =
    dependencies.discoverCompareCostScripts ?? discoverCompareCostScripts;
  const load = dependencies.loadCompareCostModule ?? loadCompareCostModule;
  const setupDiagnostics = [];
  let files;

  try {
    files = await discover(root, dependencies.discoveryDependencies);
  } catch (error) {
    const result = {
      files: 0,
      rows: 0,
      cases: 0,
      skips: 0,
      diagnostics: [formatError(error)],
    };
    writeLine(stderr, resultSummary(result, "fail"));
    writeLine(stderr, `- ${result.diagnostics[0]}`);
    return 1;
  }

  const modules = [];
  for (const sourcePath of files) {
    try {
      modules.push(
        await load(path.resolve(root, sourcePath), {
          sourcePath,
          importModule: dependencies.importModule,
        })
      );
    } catch (error) {
      setupDiagnostics.push(withSource(error, sourcePath));
    }
  }

  let schemaRegistry;
  try {
    schemaRegistry = await loadCliSchemaRegistry(dependencies);
  } catch (error) {
    setupDiagnostics.push(
      "schema registry :: setup: unable to load built @apicity/kie; run " +
        `\`pnpm run build:kie --silent\` first: ${formatError(error)}`
    );
  }

  const validation =
    modules.length > 0
      ? validateCompareCostModules(modules, schemaRegistry)
      : { files: 0, rows: 0, cases: 0, skips: 0, diagnostics: [] };
  const result = {
    ...validation,
    files: files.length,
    diagnostics: [...setupDiagnostics, ...validation.diagnostics],
  };

  if (result.diagnostics.length === 0) {
    writeLine(stdout, resultSummary(result, "pass"));
    return 0;
  }

  writeLine(stderr, resultSummary(result, "fail"));
  for (const diagnostic of result.diagnostics) {
    writeLine(stderr, `- ${diagnostic}`);
  }
  return 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().then(
    (status) => {
      process.exitCode = status;
    },
    (error) => {
      process.stderr.write(
        `compare-cost payload schemas: fail — ${formatError(error)}\n`
      );
      process.exitCode = 1;
    }
  );
}
