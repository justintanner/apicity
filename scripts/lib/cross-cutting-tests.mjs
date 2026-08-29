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
 * The namespace-shape guard reads every provider factory's return tree and
 * pins the shape each namespace dot path resolves to. A shape disagreement
 * between sibling slices is invisible to every single-tree gate: four slices of
 * `ac-c2cc4j` each declared `fal`'s `geminiOmniFlash` namespace, one as a
 * callable and three as plain objects, and the incompatibility existed only
 * BETWEEN the branches, so each slice passed its own gate and the run reached
 * publish unflagged (`RF-1`, review finding `RR-5`, follow-up `ac-j4z1t1`).
 * `tests/unit/provider-namespace-shape.test.ts` runs the in-tree half — a dot
 * path the detector can no longer resolve, or one declared twice in a single
 * literal — and, like the rest of this list, is named after no provider, so no
 * provider scope selects it.
 *
 * `scripts/compare-namespace-shapes.mjs` is the cross-ref half of that same
 * invariant, and nothing in the repository imports it, so
 * `tests/unit/compare-namespace-shapes-cli.test.ts` is the only thing holding
 * its argument handling, base resolution and 0/1/2 exit contract. Both of the
 * command's input guards — an unresolvable `--ref` that read as an empty tree,
 * an explicit `--base` that degraded into the unbased mode — were false greens
 * caught by review rather than by a gate, which is why the CLI's own regression
 * cover is registered here rather than left to full CI.
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
 * The value is the median of three runs of the WHOLE block at its current
 * ten-entry membership — 715 tests — on an Intel i7-8700 (12 threads, Linux
 * 6.8.0-124, Node 22.23.2): 6.91s, 6.60s and 6.36s wall, taken at 1-minute
 * load averages of 10.61, 10.32 and 11.90 after one discarded warm-up run. It
 * supersedes the 5.8 figure, the same host's median at the previous nine-entry
 * membership — 684 tests — at an unrecorded load (ac-j4z1t1, ac-nvlymt).
 *
 * The load averages are recorded because on this host they are the dominant
 * term. `ac-wojr6j` re-measured a fixed ten-entry list of its own, on this same
 * i7-8700 from a different branch, and found whole-block runs spanning roughly
 * 4.8s to 9.5s purely tracking concurrent agent load; its 8.6s median was taken
 * at 1-minute load averages of 9.67, 11.52 and 12.28. A figure without its load
 * average is comparable to neither predecessor, and the two ten-entry figures
 * are each correct for their own branch. The delta from 5.8 is therefore NOT
 * attributed to the added entry: at n=3 that entry's cost is not separable from
 * load noise here. Every entry stays filesystem- and source-parse-only; the
 * credential guard's dominant cost is one JSON parse of the fal HAR corpus plus
 * a single pass over the test tree, the namespace-shape guard parses all 29
 * provider factories in about 0.3s, and the namespace-shape CLI guard writes
 * and removes three temporary directories and makes a handful of read-only
 * `git rev-parse` and `git show` calls.
 *
 * Re-measure the whole block and update it here when the block's membership
 * changes; the guard test will name the prose that has to follow.
 */
export const CROSS_CUTTING_COST_SECONDS = 6.6;

/**
 * The one sentence describing the block's cost, built from the single source.
 *
 * @returns {string}
 */
export function crossCuttingCostNote() {
  return (
    "filesystem- and source-parse-only (no Polly, no network); about " +
    `${CROSS_CUTTING_COST_SECONDS}s, last measured on an Intel i7-8700`
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
  "tests/unit/provider-namespace-shape.test.ts",
  "tests/unit/compare-namespace-shapes-cli.test.ts",
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
