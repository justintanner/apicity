import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createElevenLabs,
  type ElevenLabsCreateConversationTagRequest,
  type ElevenLabsUpdateConversationTagRequest,
} from "@apicity/elevenlabs";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("elevenlabs v1.convai.tags", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("elevenlabs/convai-tags");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("creates, reads, lists, updates, and deletes a conversation tag", async () => {
    const provider = createElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY ?? "elevenlabs-test-key",
    });

    expect(provider.post.v1.convai.tags.create).toBe(
      provider.v1.convai.tags.create
    );
    expect(provider.get.v1.convai.tags.list).toBe(provider.v1.convai.tags.list);
    expect(provider.get.v1.convai.tags.get).toBe(provider.v1.convai.tags.get);
    expect(provider.patch.v1.convai.tags.update).toBe(
      provider.v1.convai.tags.update
    );
    expect(provider.delete.v1.convai.tags.delete).toBe(
      provider.v1.convai.tags.delete
    );

    const createReq: ElevenLabsCreateConversationTagRequest = {
      title: "apicity_route_test_mqzetota",
      description: "Apicity route coverage tag.",
    };
    expect(
      provider.v1.convai.tags.create.schema.safeParse(createReq).success
    ).toBe(true);
    expect(
      provider.v1.convai.tags.create.schema.safeParse({ title: "" }).success
    ).toBe(false);

    const created = await provider.v1.convai.tags.create(createReq);
    expect(typeof created.tag_id).toBe("string");
    expect(created.title).toBe(createReq.title);
    expect(created.description).toBe(createReq.description);
    const tagId = created.tag_id;

    const fetched = await provider.v1.convai.tags.get(tagId);
    expect(fetched.tag_id).toBe(tagId);
    expect(fetched.title).toBe(createReq.title);

    expect(
      provider.v1.convai.tags.list.schema.safeParse({
        page_size: 1,
        cursor: null,
      }).success
    ).toBe(true);
    expect(
      provider.v1.convai.tags.list.schema.safeParse({ page_size: 101 }).success
    ).toBe(false);
    const listed = await provider.v1.convai.tags.list({ page_size: 30 });
    expect(Array.isArray(listed.conversation_tags)).toBe(true);
    expect(typeof listed.has_more).toBe("boolean");

    const updateReq: ElevenLabsUpdateConversationTagRequest = {
      title: `${createReq.title}_updated`,
      description: null,
    };
    expect(
      provider.v1.convai.tags.update.schema.safeParse(updateReq).success
    ).toBe(true);
    const updated = await provider.v1.convai.tags.update(tagId, updateReq);
    expect(updated.tag_id).toBe(tagId);
    expect(updated.title).toBe(updateReq.title);
    expect(updated.description).toBeNull();

    await expect(provider.v1.convai.tags.delete(tagId)).resolves.toBeDefined();
  });
});
