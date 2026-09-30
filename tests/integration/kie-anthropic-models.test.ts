import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie, KieError } from "@apicity/kie";

/**
 * `GET https://api.kie.ai/anthropic/v1/models`, the listing of the models
 * Claude Code can run on through KIE
 * (https://docs.kie.ai/ai-agent/claude-code). Both recordings are free: the
 * invalid-key case is rejected at KIE's auth, and a listing calls no model.
 * The invalid-key case comes first so `dev:record` records it first.
 */
describe("kie anthropic v1 models", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("rejects an invalid API key with KieError", async () => {
    ctx = setupPolly("kie/anthropic-models-auth-error");
    const provider = createKie({
      // Intentionally invalid: free 401 path for the HAR fixture.
      apiKey: "sk-invalid-kie-anthropic-models",
    });

    await expect(provider.get.anthropic.v1.models()).rejects.toMatchObject({
      name: "KieError",
      status: 401,
    } satisfies Partial<KieError>);
  });

  it("lists every model Claude Code can run on, page by page", async () => {
    ctx = setupPolly("kie/anthropic-models");
    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "sk-test-key",
    });

    // Follow `has_more` so the recording holds the whole listing: the model
    // enum of `post.anthropic.v1.messages` is filled from every page of it.
    const ids: string[] = [];
    let page = await provider.get.anthropic.v1.models();
    ids.push(...page.data.map((model) => model.id));
    for (let n = 1; page.has_more && page.last_id && n < 10; n++) {
      page = await provider.get.anthropic.v1.models({
        after_id: page.last_id,
      });
      ids.push(...page.data.map((model) => model.id));
    }

    expect(page.has_more ?? false).toBe(false);
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) {
      expect(typeof id).toBe("string");
      expect(id.length).toBeGreaterThan(0);
    }
  });
});
