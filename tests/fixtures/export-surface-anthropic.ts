/**
 * Compile-time proof that every `*Namespace` type `ac-9at9f2.4` promoted out of
 * `EXPORT_SURFACE_BASELINE` is nameable from `@apicity/anthropic` (REQ-009,
 * AC-5, D-9).
 *
 * The `import type` fails compilation if the name is not re-exported from
 * `packages/provider/anthropic/src/index.ts`; the annotated assignment
 * additionally proves the exported name and the live `AnthropicProvider`
 * property are the same type, which an import alone would not.
 *
 * The tests project compiles every `.ts` file under `tests/` and resolves
 * `@apicity/anthropic` to that package's `src`, so `pnpm run typecheck:tests`
 * compiles this file at no test-runtime cost — deliberately not a
 * `ts.createProgram` wrapper like
 * `tests/unit/fal-request-input-types.test.ts`, whose cost would land in a
 * cross-cutting block whose runtime is pinned.
 */
import type {
  AnthropicPostStreamV1Namespace,
  AnthropicPostV1Namespace,
  AnthropicGetV1Namespace,
  AnthropicDeleteV1Namespace,
  AnthropicProvider,
} from "@apicity/anthropic";

declare const anthropic: AnthropicProvider;

const postStreamV1: AnthropicPostStreamV1Namespace = anthropic.post.stream.v1;
const postV1: AnthropicPostV1Namespace = anthropic.post.v1;
const getV1: AnthropicGetV1Namespace = anthropic.get.v1;
const deleteV1: AnthropicDeleteV1Namespace = anthropic.delete.v1;

void [postStreamV1, postV1, getV1, deleteV1];
