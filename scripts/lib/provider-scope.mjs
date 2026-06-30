import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const libDir = path.dirname(fileURLToPath(import.meta.url));

export const repoRoot = path.resolve(libDir, "..", "..");
export const providerRoot = path.join(repoRoot, "packages", "provider");
export const integrationDir = path.join("tests", "integration");

export function listProviderNames() {
  return readdirSync(providerRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

export function listProviderTests(provider) {
  const testDir = path.join(repoRoot, integrationDir);

  return readdirSync(testDir)
    .filter((name) => name.endsWith(".test.ts"))
    .filter(
      (name) =>
        name === `${provider}.test.ts` || name.startsWith(`${provider}-`)
    )
    .map((name) => path.posix.join(integrationDir, name));
}

export function resolveProviderScope(rawValue) {
  const providers = listProviderNames();
  const candidates = buildCandidates(rawValue);

  for (const candidate of candidates) {
    const provider = resolveProvider(candidate.value, providers);

    if (provider) {
      return {
        provider,
        packageDir: path.posix.join("packages", "provider", provider),
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
