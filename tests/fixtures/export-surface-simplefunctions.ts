/**
 * Compile-time proof that every `*Namespace` type `ac-9at9f2.3` promoted out of
 * `EXPORT_SURFACE_BASELINE` is nameable from `@apicity/simplefunctions`
 * (REQ-009, AC-5, D-9).
 *
 * The `import type` fails compilation if the name is not re-exported from
 * `packages/provider/simplefunctions/src/index.ts`; the annotated assignment
 * additionally proves the exported name and the live `SimpleFunctionsProvider`
 * property are the same type, which an import alone would not.
 *
 * The tests project compiles every `.ts` file under `tests/` and resolves
 * `@apicity/simplefunctions` to that package's `src`, so
 * `pnpm run typecheck:tests` compiles this file at no test-runtime cost —
 * deliberately not a `ts.createProgram` wrapper like
 * `tests/unit/fal-request-input-types.test.ts`, whose cost would land in a
 * cross-cutting block whose runtime is pinned.
 */
import type {
  SimpleFunctionsDashboard2Namespace,
  SimpleFunctionsDeleteNamespace,
  SimpleFunctionsPatchNamespace,
  SimpleFunctionsPortfolioLedgerImportNamespace,
  SimpleFunctionsPortfolioNamespace,
  SimpleFunctionsPostNamespace,
  SimpleFunctionsProvider,
  SimpleFunctionsProxyNamespace,
  SimpleFunctionsPutNamespace,
  SimpleFunctionsThesisHeartbeatNamespace,
  SimpleFunctionsThesisPositionsNamespace,
  SimpleFunctionsThesisStrategiesNamespace,
  SimpleFunctionsThesisVideosNamespace,
  SimpleFunctionsXNamespace,
} from "@apicity/simplefunctions";

declare const sf: SimpleFunctionsProvider;

const dashboard2: SimpleFunctionsDashboard2Namespace = sf.api.dashboard2;
const del: SimpleFunctionsDeleteNamespace = sf.delete;
const patch: SimpleFunctionsPatchNamespace = sf.patch;
const ledgerImport: SimpleFunctionsPortfolioLedgerImportNamespace =
  sf.api.portfolio.ledger.import;
const portfolio: SimpleFunctionsPortfolioNamespace = sf.api.portfolio;
const post: SimpleFunctionsPostNamespace = sf.post;
const proxy: SimpleFunctionsProxyNamespace = sf.api.proxy;
const put: SimpleFunctionsPutNamespace = sf.put;
const thesisHeartbeat: SimpleFunctionsThesisHeartbeatNamespace =
  sf.api.thesis.heartbeat;
const thesisPositions: SimpleFunctionsThesisPositionsNamespace =
  sf.api.thesis.positions;
const thesisStrategies: SimpleFunctionsThesisStrategiesNamespace =
  sf.api.thesis.strategies;
const thesisVideos: SimpleFunctionsThesisVideosNamespace = sf.api.thesis.videos;
const x: SimpleFunctionsXNamespace = sf.api.x;

void [
  dashboard2,
  del,
  patch,
  ledgerImport,
  portfolio,
  post,
  proxy,
  put,
  thesisHeartbeat,
  thesisPositions,
  thesisStrategies,
  thesisVideos,
  x,
];
