import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const libDir = path.dirname(fileURLToPath(import.meta.url));

export const repoRoot = path.resolve(libDir, "..", "..");
export const providerRoot = path.join(repoRoot, "packages", "provider");
export const mcpServerDir = path.join("packages", "mcp-server");
export const integrationDir = path.join("tests", "integration");

// The top level of every directory `tests/vitest.integration.ts` includes. The
// provider gates resolve tests by filename, so a provider-named test is just as
// reachable in `tests/unit` as in `tests/integration` — scanning only the latter
// silently skipped files like `tests/unit/fal-zod.test.ts` and
// `tests/functional/xai-validate.test.ts`, handing a green
// `dev:preflight:fast` from tests that never executed. `listProviderTests` also
// descends exactly one level into an immediate subdirectory named after the
// provider (`tests/unit/kie/…`), so provider suites nested one directory deep are
// reachable too. Keep the directory list in sync with the `include` list in that
// config.
export const providerTestDirs = [
  integrationDir,
  path.join("tests", "functional"),
  path.join("tests", "unit"),
];

export function listProviderNames() {
  const providers = readdirSync(providerRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  if (existsSync(path.join(repoRoot, mcpServerDir))) {
    providers.push("mcp-server");
  }

  return providers.sort();
}

export function listProviderTests(provider) {
  const prefixes = provider === "mcp-server" ? ["mcp"] : [provider];

  const matchesPrefix = (name) =>
    prefixes.some(
      (prefix) => name === `${prefix}.test.ts` || name.startsWith(`${prefix}-`)
    );

  return providerTestDirs.flatMap((dir) => {
    const testDir = path.join(repoRoot, dir);

    // A repo checkout is not required to carry every optional test directory.
    if (!existsSync(testDir)) return [];

    const entries = readdirSync(testDir, { withFileTypes: true });

    // Flat scan: top-level `<prefix>.test.ts` / `<prefix>-*.test.ts` files. The
    // `isFile()` guard keeps a directory that merely ends in `.test.ts` from
    // being mistaken for a test file.
    const flat = entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((name) => name.endsWith(".test.ts"))
      .filter(matchesPrefix)
      .map((name) => path.posix.join(dir, name));

    // Nested scan: descend exactly one level into an immediate subdirectory
    // named after the provider (one of `prefixes`) and take EVERY `*.test.ts`
    // inside it. The filename-prefix filter is deliberately NOT re-applied
    // here — nested suites are attributed by their directory name, not their
    // filename — so `tests/unit/kie/validate.test.ts` and
    // `tests/unit/anthropic/schemas.test.ts`, which do not carry the provider
    // prefix, are still selected. Recursion stops at depth one: no directory
    // below the matched subdirectory is walked.
    const nested = entries
      .filter((entry) => entry.isDirectory() && prefixes.includes(entry.name))
      .flatMap((entry) =>
        readdirSync(path.join(testDir, entry.name))
          .filter((name) => name.endsWith(".test.ts"))
          .map((name) => path.posix.join(dir, entry.name, name))
      );

    return [...flat, ...nested];
  });
}

export function resolveProviderScope(rawValue) {
  const providers = listProviderNames();
  const candidates = buildCandidates(rawValue);

  for (const candidate of candidates) {
    const provider = resolveProvider(candidate.value, providers);

    if (provider) {
      return {
        provider,
        packageDir:
          provider === "mcp-server"
            ? mcpServerDir
            : path.posix.join("packages", "provider", provider),
        tests: listProviderTests(provider),
        source: candidate.source,
        input: candidate.value,
      };
    }
  }

  throw new Error(formatUsage(providers));
}

function buildCandidates(rawValue) {
  if (rawValue) {
    return [{ source: "argument", value: rawValue }];
  }

  return [
    process.env.APICITY_PROVIDER_PATH
      ? {
          source: "APICITY_PROVIDER_PATH",
          value: process.env.APICITY_PROVIDER_PATH,
        }
      : null,
    process.env.INIT_CWD
      ? { source: "initial working directory", value: process.env.INIT_CWD }
      : null,
    { source: "current working directory", value: process.cwd() },
  ].filter(Boolean);
}

function resolveProvider(value, providers) {
  const providerName = resolveProviderName(value, providers);

  if (providerName) {
    return providerName;
  }

  return resolveProviderPath(value, providers);
}

function resolveProviderName(value, providers) {
  const normalized = value.trim().replace(/^@apicity\//, "");

  return providers.includes(normalized) ? normalized : "";
}

function resolveProviderPath(value, providers) {
  const normalized = value.replace(/\\/g, "/");
  const directProvider = resolveNormalizedProviderPath(normalized, providers);

  if (directProvider) {
    return directProvider;
  }

  const pathCandidates = [
    path.resolve(process.cwd(), value),
    path.resolve(repoRoot, value),
  ];

  for (const candidate of pathCandidates) {
    const relative = path.relative(repoRoot, candidate).replace(/\\/g, "/");
    const provider = resolveNormalizedProviderPath(relative, providers);

    if (provider) {
      return provider;
    }
  }

  return "";
}

function resolveNormalizedProviderPath(normalized, providers) {
  if (
    providers.includes("mcp-server") &&
    /(?:^|\/)packages\/mcp-server(?:\/|$)/.test(normalized)
  ) {
    return "mcp-server";
  }

  const packageMatch = normalized.match(/(?:^|\/)packages\/provider\/([^/]+)/);

  if (packageMatch && providers.includes(packageMatch[1])) {
    return packageMatch[1];
  }

  const testMatch = normalized.match(/(?:^|\/)tests\/integration\/([^/]+)$/);

  if (testMatch) {
    return resolveProviderTestName(testMatch[1], providers);
  }

  return "";
}

function resolveProviderTestName(fileName, providers) {
  const longestFirst = [...providers].sort((a, b) => b.length - a.length);

  return (
    longestFirst.find(
      (provider) =>
        fileName === `${provider}.test.ts` ||
        fileName.startsWith(`${provider}-`)
    ) ?? ""
  );
}

function formatUsage(providers) {
  return [
    "Could not resolve a provider scope.",
    "",
    "Pass a provider name or a path under packages/provider/<provider>.",
    "Integration test paths like tests/integration/openai-chat.test.ts work too.",
    "",
    "Examples:",
    "  pnpm run test:provider -- openai",
    "  pnpm run test:provider -- packages/provider/openai/src/openai.ts",
    "  pnpm run dev:preflight:fast -- tests/integration/openai-chat.test.ts",
    "",
    `Known providers: ${providers.join(", ")}`,
  ].join("\n");
}

export function hasEndpointDocsRows(provider) {
  const tsv = readFileSync(
    path.join(repoRoot, "scripts", "endpoint-docs.tsv"),
    "utf8"
  );

  return tsv
    .split("\n")
    .slice(1)
    .some((line) => line.split("\t", 1)[0] === provider);
}
