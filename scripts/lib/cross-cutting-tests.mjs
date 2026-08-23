import { existsSync } from "node:fs";
import path from "node:path";
import { repoRoot } from "./provider-scope.mjs";

/**
 * Cross-cutting repo-wide guards cover invariants that provider-scoped fast
 * gates do not select consistently. Recording-enumeration guards walk the
 * ENTIRE tests/recordings corpus and compare it with a hardcoded allowlist.
 * Because they are not named after a single provider, provider-scoped runs skip
 * them:
 *
 *   - `test:provider <name>` resolves only `<name>*.test.ts`, in the top level
 *     of `tests/integration`, `tests/functional`, and `tests/unit`
 *   - `dev:preflight:fast` runs `test:provider` for one provider
 *   - `test:affected` runs `test:provider` per touched provider in providers mode
 *
 * So a recording added/removed under ONE provider (which classifies as a
 * provider-scoped diff) slips past the fast gate even though it can break these
 * whole-corpus assertions — exactly how a new googleflow upload recording that
 * was missing from the allowlist reached main and went red in full CI, which in
 * turn suppressed the endpoint-telegram notification (ac-05hrc / ac-stb7o).
 *
 * Surface-inventory guards compare committed TSV artifacts against the live
 * endpoint surface (e.g. endpoint-cost-tiers). Those are not provider-named
 * either, so without this list a bead that adds an endpoint can ship without its
 * cost-tier row and only go red in full CI on main (ac-t2gfln).
 *
 * Source-pin guards hash cross-provider files into a frozen manifest.
 * `tests/unit/kie-pricing-reconciliation.test.ts` pins
 * `packages/provider/cost/src/slugs.ts` and `scripts/endpoint-docs.tsv` among
 * six source files. A diff confined to `packages/provider/cost/**` classifies as
 * the `cost` scope, whose 13 tests do not include this guard, so the pin can go
 * stale and fail only in full CI on main — exactly what `92323c18` repaired by
 * hand (ac-bwk953).
 *
 * Documentation-inventory guards compare agent-facing prose with live package
 * sources. Adding `packages/provider/<new>/` is a provider-only diff, but its
 * name-prefix scope cannot select a guard named after no provider. Without this
 * registry entry, provider docs can drift until full CI.
 *
 * The fast gates run these guards so a broken repo-wide invariant cannot pass
 * the local merge gate. They are filesystem- and source-parse-only (no Polly,
 * no network) and cost about 5.5s on the reference machine.
 *
 * Add any whole-repo guard that provider scopes do not select consistently to
 * this list.
 */
export const CROSS_CUTTING_TESTS = [
  "tests/integration/upload-recordings.test.ts",
  "tests/integration/multipart-recordings.test.ts",
  "tests/unit/endpoint-cost-tiers.test.ts",
  "tests/unit/kie-pricing-reconciliation.test.ts",
  "tests/unit/provider-inventory-docs.test.ts",
];

/**
 * Return the cross-cutting test paths, failing loudly if any listed file is
 * missing so a rename/removal cannot silently reopen the gate gap.
 *
 * @param {{ alreadySelected?: string[] }} [options]
 * @returns {string[]}
 */
export function listCrossCuttingTests({ alreadySelected = [] } = {}) {
  for (const relativePath of CROSS_CUTTING_TESTS) {
    if (!existsSync(path.join(repoRoot, relativePath))) {
      throw new Error(
        `Cross-cutting test "${relativePath}" is listed in ` +
          "scripts/lib/cross-cutting-tests.mjs but does not exist. Update " +
          "CROSS_CUTTING_TESTS after renaming or removing it."
      );
    }
  }

  const selected = new Set(alreadySelected);
  const remaining = CROSS_CUTTING_TESTS.filter((path) => !selected.has(path));

  // `pnpm run test:run` with zero file arguments runs the entire suite. Fall
  // back to the full list instead of turning a fully de-duplicated selection
  // into the gate's most expensive step.
  return remaining.length > 0 ? remaining : [...CROSS_CUTTING_TESTS];
}
