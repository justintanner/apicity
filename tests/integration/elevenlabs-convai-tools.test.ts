import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createElevenLabs,
  type ElevenLabsCreateToolRequest,
  type ElevenLabsUpdateToolRequest,
} from "@apicity/elevenlabs";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("elevenlabs v1.convai.tools", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("elevenlabs/convai-tools");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("creates, reads, lists, updates, and deletes a tool", async () => {
    const provider = createElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY ?? "elevenlabs-test-key",
    });

    // Endpoints are exposed both on the ergonomic `v1` tree and the
    // method-grouped trees — they must be the same function references.
    expect(provider.post.v1.convai.tools.create).toBe(
      provider.v1.convai.tools.create
    );
    expect(provider.get.v1.convai.tools.list).toBe(
      provider.v1.convai.tools.list
    );
    expect(provider.get.v1.convai.tools.get).toBe(provider.v1.convai.tools.get);
    expect(provider.patch.v1.convai.tools.update).toBe(
      provider.v1.convai.tools.update
    );
    expect(provider.delete.v1.convai.tools.delete).toBe(
      provider.v1.convai.tools.delete
    );

    const createReq: ElevenLabsCreateToolRequest = {
      tool_config: {
        type: "webhook",
        name: "apicity_route_test_tool",
        description: "Apicity tools route test webhook.",
        api_schema: {
          url: "https://example.com/apicity/route-test",
          method: "GET",
        },
      },
    };
    expect(
      provider.v1.convai.tools.create.schema.safeParse(createReq).success
    ).toBe(true);

    // 1. Create
    const created = await provider.v1.convai.tools.create(createReq);
    expect(typeof created.id).toBe("string");
    expect(created.id.length).toBeGreaterThan(0);
    expect(typeof created.tool_config).toBe("object");
    const toolId = created.id;

    // 2. Get
    const fetched = await provider.v1.convai.tools.get(toolId);
    expect(fetched.id).toBe(toolId);
    expect(typeof fetched.tool_config).toBe("object");

    // 3. List
    const listed = await provider.v1.convai.tools.list({ page_size: 30 });
    expect(Array.isArray(listed.tools)).toBe(true);

    // 4. Update
    const updateReq: ElevenLabsUpdateToolRequest = {
      tool_config: {
        type: "webhook",
        name: "apicity_route_test_tool",
        description: "Apicity tools route test webhook (updated).",
        api_schema: {
          url: "https://example.com/apicity/route-test",
          method: "GET",
        },
      },
    };
    expect(
      provider.v1.convai.tools.update.schema.safeParse(updateReq).success
    ).toBe(true);
    const updated = await provider.v1.convai.tools.update(toolId, updateReq);
    expect(updated.id).toBe(toolId);
    expect(typeof updated.tool_config).toBe("object");

    // 5. Delete
    await expect(
      provider.v1.convai.tools.delete(toolId)
    ).resolves.toBeDefined();
  });
});
