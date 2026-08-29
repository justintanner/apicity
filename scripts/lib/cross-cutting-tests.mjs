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
 * The registry-parity guards compare cross-provider registries for key parity.
 * `tests/unit/cost-slugs.test.ts` requires `MODEL_SLUGS.fal` and `PRICING.fal`
 * to have identical key sets, a `MODEL_DISPLAY` entry for every slug in every
 * provider, every `PRICING.kie` key to resolve through both `modelSlug` and
 * `modelDisplay`, and `MODEL_SLUGS.googleflow` to key exactly to
 * `MODEL_DISPLAY.googleflow`. Those span providers, but the file is named after
 * none of them, so only the `cost` scope selects it: a `fal` bead that prices a
 * model without slugging it passes `dev:preflight:fast -- fal` and goes red only
 * in full CI (ac-y39i64). `tests/unit/cost-pricing.test.ts` asserts the mirror
 * direction — every registered `MODEL_SLUGS` entry has a `PRICING` entry, under
 * an explicit unpriced allowlist — and has the identical selection gap, so a
 * provider-scoped diff that registers a slug with no rate would otherwise still
 * pass the fast gate (ac-kabm2y).
 *
 * Credential-wiring guards assert that a recording's request host and the
 * credential its replaying test is wired to agree.
 * `tests/unit/recording-credential-hosts.test.ts` requires every `api.fal.ai`
 * recording to be replayed by a call site using `process.env.FAL_ADMIN_API_KEY`
 * and every `fal.run` / `queue.fal.run` / `rest.fal.ai` / `v3b.fal.media`
 * recording to use `process.env.FAL_API_KEY`. Replay never contacts fal, so a
 * miswired credential passes every gate and only fails the next `dev:record`
 * against a paid account. Association is file-scoped, so a fal test file must
 * use exactly one `FAL_*` credential; a file with zero or two distinct
 * expressions fails loudly rather than being guessed at. The file is
 * deliberately not named after a provider, so no provider scope selects it and
 * this registry entry is what runs it (ac-wt8fzl).
 *
 * The doc-inventory guards pin agent-facing prose to the repository itself.
 * `tests/unit/provider-inventory-docs.test.ts` derives the provider list and
 * the `build:*` / `doc-gen:*` alias sets from disk and fails `CLAUDE.md`,
 * `AGENTS.md`, or `README.md` when any of them stops naming what ships. Adding
 * a provider is a provider-scoped diff, so no provider scope selects this
 * guard; without the entry the overview drifted to naming 23 of 29 providers
 * and `googleflow` shipped with no `build:` alias at all (ac-gk1mlr,
 * ac-qclky0, ac-e1h1yj).
 *
 * The export-surface guard pins what each provider actually publishes.
 * `tests/unit/provider-export-surface.test.ts` walks every `src/*.ts` module of
 * every provider and fails an exported `*Namespace` interface that the same
 * provider's `src/index.ts` never re-exports, under an explicit per-type
 * baseline that goes stale in both directions. `RR-2` was exactly
 * that: `FalRunNanoBanana2LiteNamespace` was declared public and unreachable
 * from `@apicity/fal`, and passed lint, `tsc --noEmit` and the whole replay
 * suite — no gate in this repository observed a declared-but-unexported public
 * type, so review caught it by eye (`ac-c2cc4j` finding `G2`, filed as
 * `ac-gvqa18`). The file is named after no provider, so no provider scope
 * selects it. It is parse-only — `ts.createSourceFile`, never a `ts.Program`,
 * which the two `*request-input-types.test.ts` files need and pay 120s of
 * timeout for.
 *
 * Widening it from `types.ts` alone to every `src/*.ts` module (`ac-9at9f2.8`)
 * grew the walk from 29 files / 0.96 MB to 216 / 4.72 MB and cost, on one
 * machine, +0.40s per walk parse-only (74.8ms to 470.9ms, medians of three
 * timed runs after a warm-up) and +1.5s on the guard file run alone (1.86s to
 * 3.37s wall, which pays for two walks). The block itself did not move: nine
 * files over parallel workers measured 5.720s before and 5.480s after (medians
 * of three), because this guard is not the block's critical path. So
 * `CROSS_CUTTING_COST_SECONDS` stays put — as does the divergence between it
 * and the 8.533s/9.878s recorded below, which predates this work and is not
 * reconciled by it.
 *
 * The fast gates run these guards so a broken repo-wide invariant cannot pass
 * the local merge gate. They are filesystem- and source-parse-only (no Polly,
 * no network); `CROSS_CUTTING_COST_SECONDS` records their measured cost.
 *
 * Add any whole-repo guard that provider scopes do not select consistently to
 * this list.
 */

/**
 * Measured wall-clock cost of the cross-cutting block, in seconds.
 *
 * This number was restated by hand in three places — this module,
 * `scripts/preflight-provider.mjs`, and the `CLAUDE.md` paragraph — with
 * nothing keeping them in agreement (ac-vsx186). It now lives here only;
 * the script prints `crossCuttingCostNote()` and the `CLAUDE.md` prose is
 * pinned to this value by `tests/unit/cross-cutting-tests.test.ts`.
 *
 * The value is the reference-machine figure recorded when the block held five
 * entries. The four entries added since have not been re-measured on that
 * machine: the nine-entry block measures 9.878s on the machine that added the
 * ninth (8.533s at eight), which confirms this is a reference-machine constant
 * rather than a live figure — re-measure the whole block on the reference
 * machine at the next addition rather than appending again. It is
 * deliberately left at the reference measurement rather than overwritten with a
 * figure from a different machine. Every entry stays filesystem- and
 * source-parse-only; the credential guard's dominant cost is one JSON parse of
 * the fal HAR corpus plus a single pass over `tests/**\/*.test.ts`.
 *
 * Re-measure and update it here when the block's membership changes
 * materially; the guard test will name the prose that has to follow.
 */
export const CROSS_CUTTING_COST_SECONDS = 5.7;

/**
 * The one sentence describing the block's cost, built from the single source.
 *
 * @returns {string}
 */
export function crossCuttingCostNote() {
  return (
    "filesystem- and source-parse-only (no Polly, no network); about " +
    `${CROSS_CUTTING_COST_SECONDS}s on the reference machine`
  );
}
export const CROSS_CUTTING_TESTS = [
  "tests/integration/upload-recordings.test.ts",
  "tests/integration/multipart-recordings.test.ts",
  "tests/unit/endpoint-cost-tiers.test.ts",
  "tests/unit/kie-pricing-reconciliation.test.ts",
  "tests/unit/cost-slugs.test.ts",
  "tests/unit/cost-pricing.test.ts",
  "tests/unit/provider-inventory-docs.test.ts",
  "tests/unit/recording-credential-hosts.test.ts",
  "tests/unit/provider-export-surface.test.ts",
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
