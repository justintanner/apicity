import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createElevenLabs,
  type ElevenLabsCreateKnowledgeBaseDocumentFromTextRequest,
  type ElevenLabsCreateKnowledgeBaseDocumentFromUrlRequest,
  type ElevenLabsListKnowledgeBaseDocumentsRequest,
} from "@apicity/elevenlabs";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("elevenlabs v1.convai.knowledgeBase", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("elevenlabs/convai-knowledge-base");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("creates documents (text/url/file), reads, lists, and deletes them", async () => {
    const provider = createElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY ?? "elevenlabs-test-key",
    });

    // Endpoints are exposed both on the ergonomic `v1` tree and the
    // method-grouped trees — they must be the same function references.
    expect(provider.post.v1.convai.knowledgeBase.url).toBe(
      provider.v1.convai.knowledgeBase.url
    );
    expect(provider.post.v1.convai.knowledgeBase.text).toBe(
      provider.v1.convai.knowledgeBase.text
    );
    expect(provider.post.v1.convai.knowledgeBase.file).toBe(
      provider.v1.convai.knowledgeBase.file
    );
    expect(provider.get.v1.convai.knowledgeBase.list).toBe(
      provider.v1.convai.knowledgeBase.list
    );
    expect(provider.get.v1.convai.knowledgeBase.get).toBe(
      provider.v1.convai.knowledgeBase.get
    );
    expect(provider.delete.v1.convai.knowledgeBase.delete).toBe(
      provider.v1.convai.knowledgeBase.delete
    );

    // 1. Create from text
    const textReq: ElevenLabsCreateKnowledgeBaseDocumentFromTextRequest = {
      name: "Apicity KB route test (text)",
      text: "Apicity is a TypeScript monorepo of standalone API provider packages.",
    };
    expect(
      provider.v1.convai.knowledgeBase.text.schema.safeParse(textReq).success
    ).toBe(true);
    const fromText = await provider.v1.convai.knowledgeBase.text(textReq);
    expect(typeof fromText.id).toBe("string");
    expect(fromText.id.length).toBeGreaterThan(0);
    expect(typeof fromText.name).toBe("string");

    // 2. Create from URL
    const urlReq: ElevenLabsCreateKnowledgeBaseDocumentFromUrlRequest = {
      name: "Apicity KB route test (url)",
      url: "https://elevenlabs.io/docs/api-reference/introduction",
    };
    expect(
      provider.v1.convai.knowledgeBase.url.schema.safeParse(urlReq).success
    ).toBe(true);
    const fromUrl = await provider.v1.convai.knowledgeBase.url(urlReq);
    expect(typeof fromUrl.id).toBe("string");
    expect(fromUrl.id.length).toBeGreaterThan(0);

    // 3. Create from file (multipart upload)
    const file = new File(
      ["Apicity knowledge base file upload route test."],
      "apicity-kb-route-test.txt",
      { type: "text/plain" }
    );
    const fromFile = await provider.v1.convai.knowledgeBase.file({
      name: "Apicity KB route test (file)",
      file,
    });
    expect(typeof fromFile.id).toBe("string");
    expect(fromFile.id.length).toBeGreaterThan(0);

    // 4. Get one of the created documents
    const fetched = await provider.v1.convai.knowledgeBase.get(fromText.id);
    expect(fetched.id).toBe(fromText.id);
    expect(typeof fetched.name).toBe("string");
    expect(typeof fetched.type).toBe("string");
    expect(typeof fetched.metadata.created_at_unix_secs).toBe("number");

    // 5. List
    const listReq: ElevenLabsListKnowledgeBaseDocumentsRequest = {
      page_size: 30,
    };
    expect(
      provider.v1.convai.knowledgeBase.list.schema.safeParse(listReq).success
    ).toBe(true);
    const listed = await provider.v1.convai.knowledgeBase.list(listReq);
    expect(Array.isArray(listed.documents)).toBe(true);
    expect(typeof listed.has_more).toBe("boolean");

    // 6. Delete all three created documents
    await expect(
      provider.v1.convai.knowledgeBase.delete(fromText.id, { force: true })
    ).resolves.toBeDefined();
    await expect(
      provider.v1.convai.knowledgeBase.delete(fromUrl.id, { force: true })
    ).resolves.toBeDefined();
    await expect(
      provider.v1.convai.knowledgeBase.delete(fromFile.id, { force: true })
    ).resolves.toBeDefined();
  });
});
