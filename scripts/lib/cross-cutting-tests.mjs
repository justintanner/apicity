import { existsSync } from "node:fs";
import path from "node:path";
import { repoRoot } from "./provider-scope.mjs";

/**
 * Cross-cutting integration tests enumerate the ENTIRE tests/recordings corpus
 * and assert the discovered set matches a hardcoded allowlist. Because they are
 * not named after a single provider, the provider-scoped fast gates never run
 * them:
 *
 *   - `test:provider <name>` resolves only `tests/integration/<name>*.test.ts`
 *   - `dev:preflight:fast` runs `test:provider` for one provider
 *   - `test:affected` runs `test:provider` per touched provider in providers mode
 *
 * So a recording added/removed under ONE provider (which classifies as a
 * provider-scoped diff) slips past the fast gate even though it can break these
 * whole-corpus assertions — exactly how a new googleflow upload recording that
 * was missing from the allowlist reached main and went red in full CI, which in
 * turn suppressed the endpoint-telegram notification (ac-05hrc / ac-stb7o).
 *
 * The fast gates run these tests unconditionally so a broken recording allowlist
 * cannot pass the local merge gate. They are pure filesystem/JSON assertions (no
 * Polly, no network, ~1s), so the cost is negligible.
 *
 * Add any new test that walks the whole `tests/recordings` tree to this list.
 */
export const CROSS_CUTTING_TESTS = [
  "tests/integration/upload-recordings.test.ts",
  "tests/integration/multipart-recordings.test.ts",
  "tests/integration/quo-recordings-privacy.test.ts",
];

/**
 * Return the cross-cutting test paths, failing loudly if any listed file is
 * missing so a rename/removal cannot silently reopen the gate gap.
 */
export function listCrossCuttingTests() {
  for (const relativePath of CROSS_CUTTING_TESTS) {
    if (!existsSync(path.join(repoRoot, relativePath))) {
      throw new Error(
        `Cross-cutting test "${relativePath}" is listed in ` +
          "scripts/lib/cross-cutting-tests.mjs but does not exist. Update " +
          "CROSS_CUTTING_TESTS after renaming or removing it."
      );
    }
  }

  return [...CROSS_CUTTING_TESTS];
}
