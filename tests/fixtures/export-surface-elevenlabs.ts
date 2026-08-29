/**
 * Compile-time proof that every `*Namespace` type `ac-9at9f2.5` promoted out of
 * `EXPORT_SURFACE_BASELINE` is nameable from `@apicity/elevenlabs` (REQ-009,
 * AC-5, D-9).
 *
 * The `import type` fails compilation if the name is not re-exported from
 * `packages/provider/elevenlabs/src/index.ts`; the annotated assignment
 * additionally proves the exported name and the live `ElevenLabsProvider`
 * property are the same type, which an import alone would not.
 *
 * The tests project compiles every `.ts` file under `tests/` and resolves
 * `@apicity/elevenlabs` to that package's `src`, so `pnpm run typecheck:tests`
 * compiles this file at no test-runtime cost — deliberately not a
 * `ts.createProgram` wrapper like
 * `tests/unit/fal-request-input-types.test.ts`, whose cost would land in a
 * cross-cutting block whose runtime is pinned.
 */
import type {
  ElevenLabsUsageNamespace,
  ElevenLabsPostConvaiAgentNamespace,
  ElevenLabsGetConvaiAgentNamespace,
  ElevenLabsGetConvaiAnalyticsNamespace,
  ElevenLabsProvider,
} from "@apicity/elevenlabs";

declare const elevenlabs: ElevenLabsProvider;

const usage: ElevenLabsUsageNamespace = elevenlabs.v1.usage;
const postConvaiAgent: ElevenLabsPostConvaiAgentNamespace =
  elevenlabs.post.v1.convai.agent;
const getConvaiAgent: ElevenLabsGetConvaiAgentNamespace =
  elevenlabs.get.v1.convai.agent;
const getConvaiAnalytics: ElevenLabsGetConvaiAnalyticsNamespace =
  elevenlabs.get.v1.convai.analytics;

void [usage, postConvaiAgent, getConvaiAgent, getConvaiAnalytics];
