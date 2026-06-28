import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createElevenLabs,
  ElevenLabsError,
  type ElevenLabsGetSignedUrlRequest,
} from "@apicity/elevenlabs";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("elevenlabs v1.convai.conversations", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("elevenlabs/convai-conversations");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("lists, reads, fetches audio, signs a url, and rejects a missing conversation", async () => {
    const provider = createElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY ?? "elevenlabs-test-key",
    });

    // Endpoints are exposed both on the ergonomic `v1` tree and the
    // method-grouped trees — they must be the same function references.
    expect(provider.get.v1.convai.conversations.list).toBe(
      provider.v1.convai.conversations.list
    );
    expect(provider.get.v1.convai.conversations.get).toBe(
      provider.v1.convai.conversations.get
    );
    expect(provider.get.v1.convai.conversations.audio).toBe(
      provider.v1.convai.conversations.audio
    );
    expect(provider.get.v1.convai.conversation.getSignedUrl).toBe(
      provider.v1.convai.conversation.getSignedUrl
    );
    expect(provider.delete.v1.convai.conversations.delete).toBe(
      provider.v1.convai.conversations.delete
    );

    expect(
      provider.v1.convai.conversations.list.schema.safeParse({ page_size: 3 })
        .success
    ).toBe(true);

    // 1. List
    const listed = await provider.v1.convai.conversations.list({
      page_size: 3,
    });
    expect(Array.isArray(listed.conversations)).toBe(true);
    expect(typeof listed.has_more).toBe("boolean");
    expect(listed.conversations.length).toBeGreaterThan(0);
    const first = listed.conversations[0];
    expect(typeof first.conversation_id).toBe("string");
    const conversationId = first.conversation_id;
    const agentId = first.agent_id;

    // 2. Get
    const convo = await provider.v1.convai.conversations.get(conversationId);
    expect(convo.conversation_id).toBe(conversationId);
    expect(convo.agent_id).toBe(agentId);
    expect(Array.isArray(convo.transcript)).toBe(true);

    // 3. Audio (raw audio/mpeg bytes)
    const audio = await provider.v1.convai.conversations.audio(conversationId);
    expect(audio).toBeInstanceOf(ArrayBuffer);
    expect(audio.byteLength).toBeGreaterThan(0);

    // 4. Signed URL for live conversation start
    const signReq: ElevenLabsGetSignedUrlRequest = { agent_id: agentId };
    expect(
      provider.v1.convai.conversation.getSignedUrl.schema.safeParse(signReq)
        .success
    ).toBe(true);
    const signed = await provider.v1.convai.conversation.getSignedUrl(signReq);
    expect(typeof signed.signed_url).toBe("string");
    expect(signed.signed_url.length).toBeGreaterThan(0);

    // 5. Delete — verify the DELETE wiring against a non-existent conversation.
    // There is no create-conversation REST endpoint, so we never delete a real
    // user conversation; a missing id exercises the route and surfaces the
    // typed ElevenLabsError (HTTP 404).
    await expect(
      provider.v1.convai.conversations.delete("conv_does_not_exist_apicity")
    ).rejects.toBeInstanceOf(ElevenLabsError);
  });
});
