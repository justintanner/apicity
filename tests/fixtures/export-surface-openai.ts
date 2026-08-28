/**
 * Compile-time proof that every `*Namespace` type `ac-9at9f2.1` promoted out of
 * `EXPORT_SURFACE_BASELINE` is nameable from `@apicity/openai`
 * (REQ-009, AC-5, D-9).
 *
 * The `import type` fails compilation if the name is not re-exported from
 * `packages/provider/openai/src/index.ts`; the annotated assignment
 * additionally proves the exported name and the live `OpenAiProvider` property
 * are the same type, which an import alone would not.
 *
 * The tests project compiles every `.ts` file under `tests/` and resolves
 * `@apicity/openai` to that package's `src`, so `pnpm run typecheck:tests`
 * compiles this file at no test-runtime cost — deliberately not a
 * `ts.createProgram` wrapper like `tests/unit/fal-request-input-types.test.ts`,
 * whose cost would land in a cross-cutting block whose runtime is pinned.
 */
import type {
  OpenAiDeleteV1ChatNamespace,
  OpenAiDeleteV1FilesNamespace,
  OpenAiDeleteV1FineTuningNamespace,
  OpenAiDeleteV1ModelsNamespace,
  OpenAiDeleteV1Namespace,
  OpenAiDeleteV1ResponsesNamespace,
  OpenAiGetCodexNamespace,
  OpenAiGetV1BatchesNamespace,
  OpenAiGetV1ChatNamespace,
  OpenAiGetV1ConversationsNamespace,
  OpenAiGetV1FilesNamespace,
  OpenAiGetV1FineTuningNamespace,
  OpenAiGetV1ModelsNamespace,
  OpenAiGetV1Namespace,
  OpenAiGetV1OrganizationNamespace,
  OpenAiGetV1ResponsesNamespace,
  OpenAiGetV1VectorStoresNamespace,
  OpenAiPostV1AudioNamespace,
  OpenAiPostV1ChatNamespace,
  OpenAiPostV1FineTuningNamespace,
  OpenAiPostV1ImagesNamespace,
  OpenAiPostV1Namespace,
  OpenAiPostV1RealtimeNamespace,
  OpenAiPostV1ResponsesNamespace,
  OpenAiProvider,
} from "@apicity/openai";

declare const openai: OpenAiProvider;

const postV1Audio: OpenAiPostV1AudioNamespace = openai.post.v1.audio;
const postV1Chat: OpenAiPostV1ChatNamespace = openai.post.v1.chat;
const postV1Images: OpenAiPostV1ImagesNamespace = openai.post.v1.images;
const postV1Responses: OpenAiPostV1ResponsesNamespace =
  openai.post.v1.responses;
const postV1FineTuning: OpenAiPostV1FineTuningNamespace =
  openai.post.v1.fineTuning;
const postV1Realtime: OpenAiPostV1RealtimeNamespace = openai.post.v1.realtime;
const postV1: OpenAiPostV1Namespace = openai.post.v1;
const getV1Chat: OpenAiGetV1ChatNamespace = openai.get.v1.chat;
const getV1Files: OpenAiGetV1FilesNamespace = openai.get.v1.files;
const getV1Models: OpenAiGetV1ModelsNamespace = openai.get.v1.models;
const getV1Responses: OpenAiGetV1ResponsesNamespace = openai.get.v1.responses;
const getV1Conversations: OpenAiGetV1ConversationsNamespace =
  openai.get.v1.conversations;
const getV1Batches: OpenAiGetV1BatchesNamespace = openai.get.v1.batches;
const getV1VectorStores: OpenAiGetV1VectorStoresNamespace =
  openai.get.v1.vectorStores;
const getV1FineTuning: OpenAiGetV1FineTuningNamespace =
  openai.get.v1.fineTuning;
const getV1Organization: OpenAiGetV1OrganizationNamespace =
  openai.get.v1.organization;
const getV1: OpenAiGetV1Namespace = openai.get.v1;
const deleteV1Chat: OpenAiDeleteV1ChatNamespace = openai.delete.v1.chat;
const deleteV1Files: OpenAiDeleteV1FilesNamespace = openai.delete.v1.files;
const deleteV1Models: OpenAiDeleteV1ModelsNamespace = openai.delete.v1.models;
const deleteV1Responses: OpenAiDeleteV1ResponsesNamespace =
  openai.delete.v1.responses;
const deleteV1FineTuning: OpenAiDeleteV1FineTuningNamespace =
  openai.delete.v1.fineTuning;
const deleteV1: OpenAiDeleteV1Namespace = openai.delete.v1;
const getCodex: OpenAiGetCodexNamespace = openai.get.codex;

void [
  postV1Audio,
  postV1Chat,
  postV1Images,
  postV1Responses,
  postV1FineTuning,
  postV1Realtime,
  postV1,
  getV1Chat,
  getV1Files,
  getV1Models,
  getV1Responses,
  getV1Conversations,
  getV1Batches,
  getV1VectorStores,
  getV1FineTuning,
  getV1Organization,
  getV1,
  deleteV1Chat,
  deleteV1Files,
  deleteV1Models,
  deleteV1Responses,
  deleteV1FineTuning,
  deleteV1,
  getCodex,
];
