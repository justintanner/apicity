import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createElevenLabs,
  type ElevenLabsCreateAgentRequest,
  type ElevenLabsListAgentBranchesRequest,
} from "@apicity/elevenlabs";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("elevenlabs v1.convai.agents.branches", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("elevenlabs/convai-agent-branches");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("lists the branches of an agent", async () => {
    const provider = createElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY ?? "elevenlabs-test-key",
    });

    // Exposed both on the ergonomic `v1` tree and the method-grouped `get`
    // tree — they must be the same function reference.
    expect(provider.get.v1.convai.agents.branches).toBe(
      provider.v1.convai.agents.branches
    );

    const createReq: ElevenLabsCreateAgentRequest = {
      name: "Apicity agent-branches route test",
      conversation_config: {
        agent: {
          prompt: { prompt: "You are a helpful Apicity route-test assistant." },
          first_message: "Hello from Apicity.",
          language: "en",
        },
      },
      tags: ["apicity-test"],
    };

    // 1. Create an agent so we have something to list branches for.
    const created = await provider.v1.convai.agents.create(createReq);
    const agentId = created.agent_id;
    expect(typeof agentId).toBe("string");
    expect(agentId.length).toBeGreaterThan(0);

    // 2. List branches.
    const listReq: ElevenLabsListAgentBranchesRequest = {
      include_archived: true,
      limit: 50,
    };
    expect(
      provider.v1.convai.agents.branches.schema.safeParse(listReq).success
    ).toBe(true);

    const branches = await provider.v1.convai.agents.branches(agentId, listReq);
    expect(Array.isArray(branches.results)).toBe(true);
    expect(typeof branches.meta).toBe("object");
    for (const branch of branches.results) {
      expect(typeof branch.id).toBe("string");
      expect(branch.agent_id).toBe(agentId);
      expect(typeof branch.name).toBe("string");
    }

    // 3. Clean up.
    await expect(
      provider.v1.convai.agents.delete(agentId)
    ).resolves.toBeDefined();
  });
});
