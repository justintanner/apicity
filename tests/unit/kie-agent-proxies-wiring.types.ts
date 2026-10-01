// Type-level pins beside kie-agent-proxies-wiring.test.ts (ac-wma4p9 review
// R-2, follow-up ac-efccei). Compiled by `pnpm run typecheck:tests`, never
// run: each alias fails `AssertTrue` when a public model type, or the model
// field of the request a leaf method takes, loses its listed literals. Uses
// the StaysAutocompletable idiom of packages/provider/kie/src/zod.ts.
import type {
  KieAnthropicMessagesMethod,
  KieAnthropicMessagesModel,
  KieOpenAiResponsesMethod,
  KieOpenAiResponsesModel,
  KieXaiResponsesMethod,
  KieXaiResponsesModel,
} from "@apicity/kie";

type LiteralPart<T> = T extends string ? (string extends T ? never : T) : never;
type StaysAutocompletable<T> = [LiteralPart<T>] extends [never] ? false : true;
type AssertTrue<T extends true> = T;
type Lists<T, U extends string> = [U] extends [LiteralPart<T>] ? true : false;

export type ProbeXaiKeepsLiterals = AssertTrue<
  StaysAutocompletable<KieXaiResponsesModel>
>;
export type ProbeAnthropicKeepsLiterals = AssertTrue<
  StaysAutocompletable<KieAnthropicMessagesModel>
>;
export type ProbeOpenAiKeepsLiterals = AssertTrue<
  StaysAutocompletable<KieOpenAiResponsesModel>
>;
export type ProbeXaiListsIds = AssertTrue<
  Lists<KieXaiResponsesModel, "grok-4-7" | "grok-4-6" | "grok-4-5" | "grok-4-3">
>;
export type ProbeAnthropicListsIds = AssertTrue<
  Lists<KieAnthropicMessagesModel, "claude-fable-5" | "claude-haiku-4-5">
>;
export type ProbeOpenAiListsIds = AssertTrue<
  Lists<KieOpenAiResponsesModel, "kimi-k3" | "gpt-5.5" | "gpt-6.1-sol">
>;
// The model field of the request each leaf METHOD takes keeps the literals
// too. (The public `KieXaiResponsesRequest` / `KieOpenAiResponsesRequest`
// names are the zod-inferred inputs, re-exported through types.ts, as the
// shipped Grok and Codex ones are; their model field is `string` by
// construction, so they are not what an editor completes against.)
export type ProbeXaiMethodModel = AssertTrue<
  StaysAutocompletable<Parameters<KieXaiResponsesMethod>[0]["model"]>
>;
export type ProbeAnthropicMethodModel = AssertTrue<
  StaysAutocompletable<Parameters<KieAnthropicMessagesMethod>[0]["model"]>
>;
export type ProbeOpenAiMethodModel = AssertTrue<
  StaysAutocompletable<Parameters<KieOpenAiResponsesMethod>[0]["model"]>
>;

// ...and list the ids themselves, so a method whose model type falls back to
// an older hand-kept union (D-7 reverted) is caught, not only a collapse.
export type ProbeXaiMethodListsIds = AssertTrue<
  Lists<
    Parameters<KieXaiResponsesMethod>[0]["model"],
    "grok-4-7" | "grok-4-6" | "grok-4-5" | "grok-4-3"
  >
>;
export type ProbeAnthropicMethodListsIds = AssertTrue<
  Lists<
    Parameters<KieAnthropicMessagesMethod>[0]["model"],
    "claude-fable-5" | "claude-haiku-4-5"
  >
>;
export type ProbeOpenAiMethodListsIds = AssertTrue<
  Lists<
    Parameters<KieOpenAiResponsesMethod>[0]["model"],
    "kimi-k3" | "gpt-5.5" | "gpt-6.1-sol"
  >
>;
