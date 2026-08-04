/**
 * The single definition of the `dev:preflight:fast` checklist, plus the pure
 * checking logic the documentation guard consumes.
 *
 * The gate's five steps were spelled out in four places — the script that runs
 * them and three prose surfaces — so a step could be added, removed, or
 * reordered in one and left stale in the others. `scripts/preflight-provider.mjs`
 * prints from `FAST_GATE_STEPS`, and `checkFastGateDocs` fails a documented
 * surface that no longer matches it, in either direction.
 *
 * Dependency-free by design, inheriting the constraint
 * `scripts/lib/tests-project.mjs` documents for itself: no filesystem access
 * and no import of `provider-scope.mjs`, so the guard test can import this
 * module cheaply and stay filesystem-only. The one import is
 * `TESTS_TYPECHECK_STEP`, which keeps the `typecheck-tests` step's title
 * single-sourced where it already lives.
 *
 * Steps are referred to by `id` here and in `scripts/preflight-provider.mjs`,
 * never by position. The banner numbers itself from this array, so a written-down
 * ordinal goes stale the moment a step is inserted anywhere but the end — the
 * drift this module exists to prevent, one layer down.
 */
import { TESTS_TYPECHECK_STEP } from "./tests-project.mjs";

/**
 * Documentation surfaces the guard checks. Each must carry one marked region
 * naming every step in `FAST_GATE_STEPS`.
 */
export const FAST_GATE_DOC_SURFACES = Object.freeze([
  "CLAUDE.md",
  "README.md",
  "AGENTS.md",
]);

/**
 * One step in the fast provider gate and its required documentation prose.
 *
 * @typedef {object} FastGateStep
 * @property {string} id
 * @property {string} title
 * @property {Readonly<Record<string, string>>} prose
 */

/**
 * The gate's steps, in the order `scripts/preflight-provider.mjs` runs them.
 *
 * - `id` — stable identity, `[a-z0-9-]+`. It is what the documentation markers
 *   name and what every failure message quotes, so renaming one is a visible,
 *   guarded change rather than a silent drift.
 * - `title` — the exact string the script prints after `  N. `. Every step but
 *   `typecheck-tests` carries the literal the script printed before it was
 *   rewired; `typecheck-tests` takes `TESTS_TYPECHECK_STEP.title`, so the
 *   printed checklist stays byte-identical.
 * - `prose` — one required substring per surface. The surfaces legitimately
 *   paraphrase (`scoped format` in `CLAUDE.md` against `Prettier on the
 *   provider package/tests` in `README.md`), so printed titles cannot be
 *   matched against prose directly. Every step declares an entry for every
 *   surface in `FAST_GATE_DOC_SURFACES`; the guard asserts that completeness,
 *   so adding a step without its evidence is itself red.
 *
 * The named collection-level contract is load-bearing, not decoration.
 * `tests/tsconfig.json` sets `allowJs: true, checkJs: false`, so this module is
 * never type-checked itself but its *inferred* types are enforced at every TS
 * call site. Without the contract, `Object.freeze({"CLAUDE.md": "...", ...})`
 * infers a literal-keyed `Readonly<{...}>`, and the guard's natural
 * completeness assertion — iterate `FAST_GATE_DOC_SURFACES`, read
 * `step.prose[surface]` — fails `typecheck:tests` with TS7053. Typing the
 * collection fixes every call site at once and states the contract where new
 * steps enter the list.
 */
/** @type {ReadonlyArray<FastGateStep>} */
export const FAST_GATE_STEPS = Object.freeze([
  Object.freeze({
    id: "format",
    title: "prettier --write (provider package + tests)",
    prose: Object.freeze({
      "CLAUDE.md": "scoped format",
      "README.md": "Prettier on the provider package/tests",
      "AGENTS.md": "scoped format",
    }),
  }),
  Object.freeze({
    id: "lint",
    title: "lint:provider",
    prose: Object.freeze({
      "CLAUDE.md": "scoped lint",
      "README.md": "`lint:provider`",
      "AGENTS.md": "scoped lint",
    }),
  }),
  Object.freeze({
    id: "typecheck-tests",
    title: TESTS_TYPECHECK_STEP.title,
    prose: Object.freeze({
      "CLAUDE.md": "whole tests-project typecheck",
      "README.md": "whole tests-project typecheck",
      "AGENTS.md": "whole tests-project typecheck",
    }),
  }),
  Object.freeze({
    id: "test-provider",
    title: "test:provider (provider typecheck + replay)",
    prose: Object.freeze({
      "CLAUDE.md": "provider typecheck and replay",
      "README.md": "`test:provider` for provider typecheck + replay",
      "AGENTS.md": "provider typecheck and replay",
    }),
  }),
  Object.freeze({
    id: "cross-cutting",
    title: "cross-cutting recording-enumeration tests",
    prose: Object.freeze({
      "CLAUDE.md": "cross-cutting recording-enumeration tests",
      "README.md": "cross-cutting recording-enumeration tests",
      "AGENTS.md": "cross-cutting recording-enumeration tests",
    }),
  }),
]);

const REGION_START = /<!--\s*fast-gate-steps:start\s*-->/g;
const REGION_END = /<!--\s*fast-gate-steps:end\s*-->/g;

// Cannot match the region markers: after `fast-gate-step` in
// `fast-gate-steps:start` comes `s`, not `:`.
const STEP_MARKER = /<!--\s*fast-gate-step:([a-z0-9-]+)\s*-->/g;

function collapseWhitespace(text) {
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Check one documentation surface against the step definition.
 *
 * Pure: string in, array of human-readable problem strings out — empty when
 * clean. It never reads a file; the caller passes the text, which is what keeps
 * the guard test filesystem-only apart from its own two `readFileSync` calls.
 *
 * `steps` is injectable on purpose. It is what turns "adding a step fails the
 * docs" and "removing a step fails the docs" from manual procedures into
 * assertions: a test passes a synthetic six- or four-step list against the real
 * `CLAUDE.md` and asserts the reported problem.
 *
 * Every problem names the surface, the step id where there is one, and the
 * direction of the drift.
 *
 * @param {string} surface - Repo-relative path, for the problem messages.
 * @param {string} text - That file's full contents.
 * @param {ReadonlyArray<FastGateStep>} [steps]
 * @returns {string[]}
 */
export function checkFastGateDocs(surface, text, steps = FAST_GATE_STEPS) {
  const problems = [];

  const starts = [...text.matchAll(REGION_START)];
  const ends = [...text.matchAll(REGION_END)];

  // An absent anchor fails rather than silently checking nothing.
  if (starts.length !== 1) {
    problems.push(
      `${surface}: expected exactly one <!-- fast-gate-steps:start --> marker, found ${starts.length}`
    );
  }
  if (ends.length !== 1) {
    problems.push(
      `${surface}: expected exactly one <!-- fast-gate-steps:end --> marker, found ${ends.length}`
    );
  }
  if (problems.length > 0) return problems;

  const start = starts[0];
  const end = ends[0];
  const regionStart = start.index + start[0].length;
  if (end.index < regionStart) {
    problems.push(
      `${surface}: the <!-- fast-gate-steps:end --> marker appears before <!-- fast-gate-steps:start -->`
    );
    return problems;
  }

  const region = text.slice(regionStart, end.index);
  const markers = [...region.matchAll(STEP_MARKER)];

  // First occurrence wins for span purposes; a repeat is reported on its own.
  const firstMarkerIndex = new Map();
  for (const [position, marker] of markers.entries()) {
    const id = marker[1];
    if (firstMarkerIndex.has(id)) {
      problems.push(
        `${surface}: step '${id}' is documented more than once inside the region`
      );
      continue;
    }
    firstMarkerIndex.set(id, position);
  }

  const definedIds = new Set(steps.map((step) => step.id));

  for (const step of steps) {
    if (!firstMarkerIndex.has(step.id)) {
      problems.push(
        `${surface}: step '${step.id}' is run by the fast gate but not documented here`
      );
    }
  }
  for (const id of firstMarkerIndex.keys()) {
    if (!definedIds.has(id)) {
      problems.push(
        `${surface}: step '${id}' is documented here but the fast gate no longer runs it`
      );
    }
  }

  // Evidence is bound to the step's own span — the region text since the
  // previous step marker — not to the region as a whole. That is what makes
  // moving a marker onto unrelated text, or deleting the sentence while
  // leaving the marker, both fail.
  for (const step of steps) {
    const position = firstMarkerIndex.get(step.id);
    if (position === undefined) continue;

    const marker = markers[position];
    const previous = position > 0 ? markers[position - 1] : null;
    const spanStart = previous ? previous.index + previous[0].length : 0;
    // Whitespace collapse is required, not cosmetic: README.md wraps at 80
    // columns, so `Prettier on the provider package/tests` is split across a
    // line break and an indent in the raw file.
    const span = collapseWhitespace(region.slice(spanStart, marker.index));

    const expected = step.prose?.[surface];
    if (typeof expected !== "string" || expected.length === 0) {
      problems.push(
        `${surface}: step '${step.id}' declares no required prose for this surface in scripts/lib/fast-gate-steps.mjs`
      );
      continue;
    }

    if (!span.includes(collapseWhitespace(expected))) {
      problems.push(
        `${surface}: step '${step.id}' is marked here but its text is missing the expected "${expected}"; marker '<!-- fast-gate-step:${step.id} -->' must directly follow the phrase it binds`
      );
    }
  }

  return problems;
}
