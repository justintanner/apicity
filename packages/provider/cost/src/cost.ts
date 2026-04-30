import { anthropic } from "@apicity/anthropic";
import { fal } from "@apicity/fal";
import { kimicoding } from "@apicity/kimicoding";
import { openai } from "@apicity/openai";
import { xai } from "@apicity/xai";

import type {
  AnthropicCostNamespace,
  CostOptions,
  CostProvider,
  FalCostNamespace,
  KimicodingCostNamespace,
  OpenAiCostNamespace,
  XaiCostNamespace,
} from "./types";

export function cost(opts: CostOptions): CostProvider {
  const provider: CostProvider = {};

  if (opts.openai) {
    const client = openai(opts.openai);
    const ns: OpenAiCostNamespace = {
      estimate: (req, signal) =>
        client.post.v1.responses.inputTokens(req, signal),
    };
    provider.openai = ns;
  }

  if (opts.anthropic) {
    const client = anthropic(opts.anthropic);
    const ns: AnthropicCostNamespace = {
      estimate: (req, signal) => client.v1.messages.countTokens(req, signal),
    };
    provider.anthropic = ns;
  }

  if (opts.xai) {
    const client = xai(opts.xai);
    const ns: XaiCostNamespace = {
      estimate: (req, signal) => client.post.v1.tokenizeText(req, signal),
    };
    provider.xai = ns;
  }

  if (opts.kimicoding) {
    const client = kimicoding(opts.kimicoding);
    const ns: KimicodingCostNamespace = {
      estimate: (req, signal) => client.post.coding.v1.countTokens(req, signal),
    };
    provider.kimicoding = ns;
  }

  if (opts.fal) {
    const client = fal(opts.fal);
    const ns: FalCostNamespace = {
      estimate: (req, signal) => client.v1.models.pricing.estimate(req, signal),
      pricing: (req, signal) => client.v1.models.pricing(req, signal),
    };
    provider.fal = ns;
  }

  return provider;
}
