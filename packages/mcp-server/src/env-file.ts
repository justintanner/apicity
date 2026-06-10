import { readFileSync } from "node:fs";

export function loadEnvFile(
  path: string,
  env: NodeJS.ProcessEnv = process.env
): void {
  const content = readEnvFile(path);
  for (const [key, value] of parseEnvFile(content)) {
    if (hasResolvedEnvValue(env[key])) continue;
    if (value.startsWith("op://")) continue;
    env[key] = value;
  }
}

export function parseEnvFile(content: string): Array<[string, string]> {
  const entries: Array<[string, string]> = [];
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === "" || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    const value = stripQuotes(line.slice(eq + 1).trim());
    if (key === "") continue;
    entries.push([key, value]);
  }
  return entries;
}

function readEnvFile(path: string): string {
  try {
    return readFileSync(path, "utf8");
  } catch (err) {
    throw new Error(
      `--env-file ${path} could not be read: ${errorMessage(err)}`
    );
  }
}

function stripQuotes(value: string): string {
  if (value.length < 2) return value;
  const first = value[0];
  const last = value[value.length - 1];
  if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
    return value.slice(1, -1);
  }
  return value;
}

function hasResolvedEnvValue(value: string | undefined): boolean {
  return value !== undefined && value !== "" && !value.startsWith("op://");
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
