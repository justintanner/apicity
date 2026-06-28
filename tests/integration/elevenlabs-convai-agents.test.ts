import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createElevenLabs,
  type ElevenLabsCreateAgentRequest,
  type ElevenLabsUpdateAgentRequest,
} from "@apicity/elevenlabs";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("elevenlabs v1.convai.agents", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("elevenlabs/convai-agents");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("creates, reads, lists, updates, and deletes an agent", async () => {
    const provider = createElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY ?? "elevenlabs-test-key",
    });

    // Endpoints are exposed both on the ergonomic `v1` tree and the
    // method-grouped trees — they must be the same function references.
    expect(provider.post.v1.convai.agents.create).toBe(
      provider.v1.convai.agents.create
    );
    expect(provider.get.v1.convai.agents.list).toBe(
      provider.v1.convai.agents.list
    );
    expect(provider.get.v1.convai.agents.get).toBe(
      provider.v1.convai.agents.get
    );
    expect(provider.patch.v1.convai.agents.update).toBe(
      provider.v1.convai.agents.update
    );
    expect(provider.delete.v1.convai.agents.delete).toBe(
      provider.v1.convai.agents.delete
    );

    const createReq: ElevenLabsCreateAgentRequest = {
      name: "Apicity agents route test",
      conversation_config: {
        agent: {
          prompt: { prompt: "You are a helpful Apicity route-test assistant." },
          first_message: "Hello from Apicity.",
          language: "en",
        },
      },
      tags: ["apicity-test"],
    };
    expect(
      provider.v1.convai.agents.create.schema.safeParse(createReq).success
    ).toBe(true);

    // 1. Create
    const created = await provider.v1.convai.agents.create(createReq);
    expect(typeof created.agent_id).toBe("string");
    expect(created.agent_id.length).toBeGreaterThan(0);
    const agentId = created.agent_id;

    // 2. Get
    const fetched = await provider.v1.convai.agents.get(agentId);
    expect(fetched.agent_id).toBe(agentId);
    expect(typeof fetched.name).toBe("string");
    expect(typeof fetched.conversation_config).toBe("object");
    expect(typeof fetched.metadata.created_at_unix_secs).toBe("number");

    // 3. List
    const listed = await provider.v1.convai.agents.list({ page_size: 30 });
    expect(Array.isArray(listed.agents)).toBe(true);
    expect(typeof listed.has_more).toBe("boolean");

    // 4. Update
    const updateReq: ElevenLabsUpdateAgentRequest = {
      name: "Apicity agents route test (updated)",
    };
    expect(
      provider.v1.convai.agents.update.schema.safeParse(updateReq).success
    ).toBe(true);
    const updated = await provider.v1.convai.agents.update(agentId, updateReq);
    expect(updated.agent_id).toBe(agentId);
    expect(updated.name).toBe("Apicity agents route test (updated)");

    // 5. Widget config
    const widget = await provider.v1.convai.agents.widget(agentId);
    expect(widget.agent_id).toBe(agentId);
    expect(typeof widget.widget_config).toBe("object");

    // 6. Link
    const link = await provider.v1.convai.agents.link(agentId);
    expect(link.agent_id).toBe(agentId);

    // 7. Delete
    await expect(
      provider.v1.convai.agents.delete(agentId)
    ).resolves.toBeDefined();
  });
});
