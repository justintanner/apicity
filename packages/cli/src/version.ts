import { readFileSync } from "node:fs";

/**
 * Read this package's version for the MCP server handshake and `apicity
 * version`.
 *
 * Two candidates because the module runs from two depths: `src/version.ts`
 * during tests and `dist/src/version.js` once built. The first URL resolves
 * against the source tree, the second against the published layout.
 */
export function readPackageVersion(): string {
  for (const path of [
    new URL("../package.json", import.meta.url),
    new URL("../../package.json", import.meta.url),
  ]) {
    try {
      const pkg = JSON.parse(readFileSync(path, "utf8")) as unknown;
      if (typeof pkg === "object" && pkg !== null) {
        const version = (pkg as Record<string, unknown>).version;
        if (typeof version === "string") return version;
      }
    } catch {
      /* try source/dist fallback */
    }
  }
  return "0.0.0";
}
