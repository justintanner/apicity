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
// `dev:preflight:fast` from tests that never executed. The scan below is flat,
// so provider-named files nested in subdirectories (`tests/unit/kie/…`) stay
// unreachable from the provider gates. Keep the directory list in sync with the
// `include` list in that config.
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

  return providerTestDirs.flatMap((dir) => {
    const testDir = path.join(repoRoot, dir);

    // A repo checkout is not required to carry every optional test directory.
    if (!existsSync(testDir)) return [];

    return readdirSync(testDir)
      .filter((name) => name.endsWith(".test.ts"))
      .filter((name) =>
        prefixes.some(
          (prefix) =>
            name === `${prefix}.test.ts` || name.startsWith(`${prefix}-`)
        )
      )
      .map((name) => path.posix.join(dir, name));
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
