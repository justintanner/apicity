/**
 * Compile-time proof that every `*Namespace` type `ac-9at9f2.6` promoted out of
 * `EXPORT_SURFACE_BASELINE` is nameable from `@apicity/dolthub` (REQ-009, AC-5,
 * D-9).
 *
 * The `import type` fails compilation if the name is not re-exported from
 * `packages/provider/dolthub/src/index.ts`; the annotated assignment
 * additionally proves the exported name and the live `DoltHubProvider` property
 * are the same type, which an import alone would not.
 *
 * The tests project compiles every `.ts` file under `tests/` and resolves
 * `@apicity/dolthub` to that package's `src`, so `pnpm run typecheck:tests`
 * compiles this file at no test-runtime cost — deliberately not a
 * `ts.createProgram` wrapper like
 * `tests/unit/fal-request-input-types.test.ts`, whose cost would land in a
 * cross-cutting block whose runtime is pinned.
 */
import type {
  DoltHubBranchesNamespace,
  DoltHubPullsNamespace,
  DoltHubProvider,
} from "@apicity/dolthub";

declare const dolthub: DoltHubProvider;

const branches: DoltHubBranchesNamespace = dolthub.v1alpha1.branches;
const pulls: DoltHubPullsNamespace = dolthub.v1alpha1.pulls;

void [branches, pulls];
