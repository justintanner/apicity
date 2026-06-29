import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createElevenLabs,
  type ElevenLabsCalculateLlmUsageRequest,
  type ElevenLabsListConversationUsersRequest,
} from "@apicity/elevenlabs";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("elevenlabs v1.convai misc", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("elevenlabs/convai-misc");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("lists users and LLMs and calculates expected LLM usage", async () => {
    const provider = createElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY ?? "elevenlabs-test-key",
    });

    expect(provider.get.v1.convai.users.list).toBe(
      provider.v1.convai.users.list
    );
    expect(provider.post.v1.convai.llmUsage.calculate).toBe(
      provider.v1.convai.llmUsage.calculate
    );
    expect(provider.get.v1.convai.llm.list).toBe(provider.v1.convai.llm.list);

    const usersReq: ElevenLabsListConversationUsersRequest = {
      page_size: 1,
      sort_by: "last_contact_unix_secs",
      agent_id: null,
      branch_id: null,
      search: null,
      cursor: null,
      call_start_after_unix: null,
      call_start_before_unix: null,
    };
    expect(
      provider.v1.convai.users.list.schema.safeParse(usersReq).success
    ).toBe(true);
    expect(
      provider.v1.convai.users.list.schema.safeParse({ page_size: 101 }).success
    ).toBe(false);
    expect(
      provider.v1.convai.users.list.schema.safeParse({
        sort_by: "last_contact_agent_id",
      }).success
    ).toBe(false);

    const users = await provider.v1.convai.users.list(usersReq);
    expect(Array.isArray(users.users)).toBe(true);
    expect(typeof users.has_more).toBe("boolean");

    const llms = await provider.v1.convai.llm.list();
    expect(Array.isArray(llms.llms)).toBe(true);
    expect(llms.llms.length).toBeGreaterThan(0);
    expect(typeof llms.llms[0]?.llm).toBe("string");
    expect(typeof llms.default_deprecation_config).toBe("object");

    const usageReq: ElevenLabsCalculateLlmUsageRequest = {
      prompt_length: 1200,
      number_of_pages: 2,
      rag_enabled: true,
    };
    expect(
      provider.v1.convai.llmUsage.calculate.schema.safeParse(usageReq).success
    ).toBe(true);
    expect(
      provider.v1.convai.llmUsage.calculate.schema.safeParse({
        prompt_length: 1200,
        number_of_pages: 2,
      }).success
    ).toBe(false);

    const usage = await provider.v1.convai.llmUsage.calculate(usageReq);
    expect(Array.isArray(usage.llm_prices)).toBe(true);
    expect(usage.llm_prices.length).toBeGreaterThan(0);
    expect(typeof usage.llm_prices[0]?.llm).toBe("string");
    expect(typeof usage.llm_prices[0]?.price_per_minute).toBe("number");
  });
});
