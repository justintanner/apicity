import { listProviderNames } from "./provider-scope.mjs";

export function normalizeProjectPath(filePath) {
  return filePath.trim().replace(/\\/g, "/").replace(/^\.\//, "");
}

export function classifyChangedFiles(files, providers = listProviderNames()) {
  const providerNames = [...providers].sort();
  const scopedProviders = new Set();
  const fullReasons = [];

  for (const file of files) {
    const normalized = normalizeProjectPath(file);

    if (!normalized) continue;

    const provider = detectProviderForChangedFile(normalized, providerNames);

    if (provider) {
      scopedProviders.add(provider);
    } else {
      fullReasons.push(normalized);
    }
  }

  return {
    mode:
      fullReasons.length === 0 && scopedProviders.size > 0
        ? "providers"
        : "full",
    providers: [...scopedProviders].sort(),
    fullReasons,
  };
}

export function detectProviderForChangedFile(filePath, providers) {
  const normalized = normalizeProjectPath(filePath);
  const packageMatch = normalized.match(/^packages\/provider\/([^/]+)(?:\/|$)/);

  if (packageMatch && providers.includes(packageMatch[1])) {
    return packageMatch[1];
  }

  const testMatch = normalized.match(/^tests\/integration\/([^/]+)$/);

  if (testMatch) {
    return providerFromSlug(stripTestSuffix(testMatch[1]), providers);
  }

  const recordingMatch = normalized.match(/^tests\/recordings\/([^/]+)/);

  if (recordingMatch) {
    return providerFromSlug(stripRecordingHash(recordingMatch[1]), providers);
  }

  return "";
}

function stripTestSuffix(fileName) {
  return fileName.replace(/\.test\.tsx?$/, "");
}

function stripRecordingHash(dirName) {
  return dirName.replace(/_[^_]+$/, "");
}

function providerFromSlug(slug, providers) {
  const longestFirst = [...providers].sort((a, b) => b.length - a.length);

  return (
    longestFirst.find(
      (provider) => slug === provider || slug.startsWith(`${provider}-`)
    ) ?? ""
  );
}
