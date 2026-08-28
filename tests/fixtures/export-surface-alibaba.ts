/**
 * Compile-time proof that every `*Namespace` type `ac-9at9f2.2` promoted out of
 * `EXPORT_SURFACE_BASELINE` is nameable from `@apicity/alibaba`
 * (REQ-009, AC-5, D-9).
 *
 * The `import type` fails compilation if the name is not re-exported from
 * `packages/provider/alibaba/src/index.ts`; the annotated assignment
 * additionally proves the exported name and the live `AlibabaProvider` property
 * are the same type, which an import alone would not.
 *
 * The tests project compiles every `.ts` file under `tests/` and resolves
 * `@apicity/alibaba` to that package's `src`, so `pnpm run typecheck:tests`
 * compiles this file at no test-runtime cost — deliberately not a
 * `ts.createProgram` wrapper like `tests/unit/fal-request-input-types.test.ts`,
 * whose cost would land in a cross-cutting block whose runtime is pinned.
 */
import type {
  AlibabaGetApiNamespace,
  AlibabaGetApiV1Namespace,
  AlibabaGetNamespace,
  AlibabaGetV1Namespace,
  AlibabaPostApiNamespace,
  AlibabaPostApiV1AigcNamespace,
  AlibabaPostApiV1ImageGenerationNamespace,
  AlibabaPostApiV1MultimodalGenerationNamespace,
  AlibabaPostApiV1Namespace,
  AlibabaPostApiV1ServicesNamespace,
  AlibabaPostApiV1VideoGenerationNamespace,
  AlibabaPostNamespace,
  AlibabaPostStreamV1ChatNamespace,
  AlibabaPostStreamV1Namespace,
  AlibabaPostV1ChatNamespace,
  AlibabaPostV1Namespace,
  AlibabaProvider,
} from "@apicity/alibaba";

declare const alibaba: AlibabaProvider;

const postV1Chat: AlibabaPostV1ChatNamespace =
  alibaba.post.compatibleMode.v1.chat;
const postV1: AlibabaPostV1Namespace = alibaba.post.compatibleMode.v1;
const postStreamV1Chat: AlibabaPostStreamV1ChatNamespace =
  alibaba.post.stream.compatibleMode.v1.chat;
const postStreamV1: AlibabaPostStreamV1Namespace =
  alibaba.post.stream.compatibleMode.v1;
const postVideoGeneration: AlibabaPostApiV1VideoGenerationNamespace =
  alibaba.post.api.v1.services.aigc.videoGeneration;
const postImageGeneration: AlibabaPostApiV1ImageGenerationNamespace =
  alibaba.post.api.v1.services.aigc.imageGeneration;
const postMultimodalGeneration: AlibabaPostApiV1MultimodalGenerationNamespace =
  alibaba.post.api.v1.services.aigc.multimodalGeneration;
const postAigc: AlibabaPostApiV1AigcNamespace =
  alibaba.post.api.v1.services.aigc;
const postServices: AlibabaPostApiV1ServicesNamespace =
  alibaba.post.api.v1.services;
const postApiV1: AlibabaPostApiV1Namespace = alibaba.post.api.v1;
const postApi: AlibabaPostApiNamespace = alibaba.post.api;
const post: AlibabaPostNamespace = alibaba.post;
const getV1: AlibabaGetV1Namespace = alibaba.get.compatibleMode.v1;
const getApiV1: AlibabaGetApiV1Namespace = alibaba.get.api.v1;
const getApi: AlibabaGetApiNamespace = alibaba.get.api;
const get: AlibabaGetNamespace = alibaba.get;

void [
  postV1Chat,
  postV1,
  postStreamV1Chat,
  postStreamV1,
  postVideoGeneration,
  postImageGeneration,
  postMultimodalGeneration,
  postAigc,
  postServices,
  postApiV1,
  postApi,
  post,
  getV1,
  getApiV1,
  getApi,
  get,
];
