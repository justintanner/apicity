import { ALIBABA_CHAT, type AlibabaScope } from "./pricing/alibaba-chat";
import type { CostHints } from "./types";
import type { TokenPricing } from "./pricing/types";

const scopes: readonly string[] = [
  "International",
  "Chinese mainland",
  "Global",
  "US",
  "EU",
  "Japan",
  "Hong Kong",
];
export function alibabaScope(
  baseURL?: string,
  hints?: CostHints
): { scope?: AlibabaScope; warning?: string; notes: string[] } {
  const hint = hints?.alibabaDeploymentScope;
  const notes: string[] = [];
  if (hint !== undefined && !scopes.includes(hint))
    return {
      warning: "alibaba: invalid costHints.alibabaDeploymentScope",
      notes,
    };
  let mapped: AlibabaScope | undefined;
  if (baseURL === undefined) {
    if (hint === undefined) {
      mapped = "Chinese mainland";
      notes.push(
        "Alibaba assumes Chinese mainland, the provider factory default baseURL scope."
      );
    }
  } else {
    let host: string;
    try {
      host = new URL(baseURL).hostname;
    } catch {
      return {
        warning:
          "alibaba: invalid baseURL; supply a valid URL and costHints.alibabaDeploymentScope",
        notes,
      };
    }
    if (
      host === "dashscope.aliyuncs.com" ||
      /^[^.]+\.cn-beijing\.maas\.aliyuncs\.com$/.test(host)
    )
      mapped = "Chinese mainland";
    if (
      host === "dashscope-intl.aliyuncs.com" ||
      /^[^.]+\.ap-southeast-1\.maas\.aliyuncs\.com$/.test(host)
    )
      mapped = "International";
  }
  if (hint !== undefined && mapped !== undefined && hint !== mapped)
    return {
      warning:
        "alibaba: costHints.alibabaDeploymentScope conflicts with baseURL",
      notes,
    };
  const scope = hint ?? mapped;
  return scope
    ? { scope, notes }
    : {
        warning:
          "alibaba: pass costHints.alibabaDeploymentScope for an ambiguous or unknown baseURL",
        notes,
      };
}

export function alibabaTokenEntry(
  model: string,
  scope: AlibabaScope,
  payload: Record<string, unknown>,
  hints?: CostHints
): { entry?: TokenPricing; warning?: string } {
  const rows = ALIBABA_CHAT[model]?.[scope];
  if (!rows)
    return {
      warning: `alibaba '${model}': no bundled rate for scope '${scope}'`,
    };
  const input = hints?.inputTokens;
  if (input === undefined || !Number.isSafeInteger(input) || input < 0)
    return {
      warning:
        "alibaba: pass non-negative integer costHints.inputTokens to select the whole-request tier",
    };
  const matches = rows.filter(
    ([low, high]) =>
      (input > low || (input === 0 && low === 0)) && input <= high
  );
  const row = matches[0];
  if (matches.length > 1)
    return {
      warning: `alibaba '${model}': published regional rates disagree within scope '${scope}'; no figure is quoted`,
    };
  if (!row)
    return {
      warning: `alibaba '${model}': costHints.inputTokens exceeds the published tiers for '${scope}'`,
    };
  const thinking = payload.enable_thinking;
  if (thinking !== undefined && typeof thinking !== "boolean")
    return { warning: "alibaba: enable_thinking must be boolean" };
  if (row[3] !== row[4] && thinking === undefined)
    return {
      warning:
        "alibaba: enable_thinking is required to select the published output rate",
    };
  if (
    (row[5] === "thinking" && thinking === false) ||
    (row[5] === "non-thinking" && thinking === true)
  )
    return {
      warning:
        "alibaba: enable_thinking conflicts with the published model mode",
    };
  return {
    entry: {
      kind: "tokens",
      rate: { input: row[2], output: thinking ? row[4] : row[3] },
      source: {
        url: "https://www.alibabacloud.com/help/en/model-studio/model-pricing",
        asOf: "2026-11-04",
      },
    },
  };
}

export function scopedPayloadProblem(
  provider: "alibaba" | "google",
  payload: Record<string, unknown>,
  hints?: CostHints
): string | undefined {
  const textOnly = (value: unknown): boolean => {
    if (Array.isArray(value)) return value.every(textOnly);
    if (!value || typeof value !== "object") return true;
    return Object.entries(value).every(
      ([key, child]) =>
        ![
          "inlineData",
          "fileData",
          "inline_data",
          "file_data",
          "image_url",
          "video_url",
          "audio_url",
          "input_audio",
          "audio",
          "video",
          "image",
        ].includes(key) && textOnly(child)
    );
  };
  if (
    !textOnly(payload) ||
    [
      hints?.audioInputTokens,
      hints?.audioOutputTokens,
      hints?.imageInputTokens,
      hints?.imageOutputTokens,
    ].some((v) => v !== undefined && v !== 0)
  )
    return `${provider}: non-text modality pricing is not bundled for this route`;
  const config = payload.generationConfig as
    | Record<string, unknown>
    | undefined;
  const modalities = config?.responseModalities ?? payload.modalities;
  if (
    modalities !== undefined &&
    (!Array.isArray(modalities) ||
      modalities.some((v) => v !== "TEXT" && v !== "text"))
  )
    return `${provider}: response modalities other than text are not bundled`;
  if (hints?.serviceTier === "batch")
    return `${provider}: batch pricing is not bundled for this route`;
  return undefined;
}
