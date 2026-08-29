/**
 * Compile-time proof that every `*Namespace` type `ac-9at9f2.7` promoted out of
 * `EXPORT_SURFACE_BASELINE` is nameable from `@apicity/youtube` (REQ-009, AC-5,
 * D-9).
 *
 * The `import type` fails compilation if the name is not re-exported from
 * `packages/provider/youtube/src/index.ts`; the annotated assignment additionally
 * proves the exported name and the live `YouTubeProvider` property are the same
 * type, which an import alone would not.
 *
 * The tests project compiles every `.ts` file under `tests/` and resolves
 * `@apicity/youtube` to that package's `src`, so `pnpm run typecheck:tests`
 * compiles this file at no test-runtime cost — deliberately not a
 * `ts.createProgram` wrapper like
 * `tests/unit/fal-request-input-types.test.ts`, whose cost would land in a
 * cross-cutting block whose runtime is pinned.
 */
import type {
  YouTubeChannelsNamespace,
  YouTubeProvider,
} from "@apicity/youtube";

declare const youtube: YouTubeProvider;

const channels: YouTubeChannelsNamespace = youtube.channels;

void [channels];
