import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createElevenLabs,
  type ElevenLabsBulkMoveKnowledgeBaseDocumentsRequest,
  type ElevenLabsComputeKnowledgeBaseDocumentRagIndexRequest,
  type ElevenLabsComputeKnowledgeBaseRagIndexesRequest,
  type ElevenLabsCreateKnowledgeBaseFolderRequest,
  type ElevenLabsCreateKnowledgeBaseDocumentFromTextRequest,
  type ElevenLabsCreateKnowledgeBaseDocumentFromUrlRequest,
  type ElevenLabsGetKnowledgeBaseDependentAgentsRequest,
  type ElevenLabsGetKnowledgeBaseDocumentChunkRequest,
  type ElevenLabsGetKnowledgeBaseSummariesRequest,
  type ElevenLabsListKnowledgeBaseDocumentChunksRequest,
  type ElevenLabsListKnowledgeBaseDocumentsRequest,
  type ElevenLabsMoveKnowledgeBaseEntityRequest,
  type ElevenLabsSearchKnowledgeBaseContentRequest,
  type ElevenLabsUpdateKnowledgeBaseDocumentRequest,
  type ElevenLabsUpdateKnowledgeBaseFileDocumentRequest,
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

  it("exposes the remaining knowledge base routes and schemas", () => {
    const provider = createElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY ?? "elevenlabs-test-key",
    });

    expect(provider.get.v1.convai.knowledgeBase.summaries).toBe(
      provider.v1.convai.knowledgeBase.summaries
    );
    expect(provider.get.v1.convai.knowledgeBase.search).toBe(
      provider.v1.convai.knowledgeBase.search
    );
    expect(provider.patch.v1.convai.knowledgeBase.update).toBe(
      provider.v1.convai.knowledgeBase.update
    );
    expect(provider.get.v1.convai.knowledgeBase.content).toBe(
      provider.v1.convai.knowledgeBase.content
    );
    expect(provider.get.v1.convai.knowledgeBase.chunks).toBe(
      provider.v1.convai.knowledgeBase.chunks
    );
    expect(provider.get.v1.convai.knowledgeBase.chunks.get).toBe(
      provider.v1.convai.knowledgeBase.chunks.get
    );
    expect(provider.get.v1.convai.knowledgeBase.dependentAgents).toBe(
      provider.v1.convai.knowledgeBase.dependentAgents
    );
    expect(provider.get.v1.convai.knowledgeBase.sourceFileUrl).toBe(
      provider.v1.convai.knowledgeBase.sourceFileUrl
    );
    expect(provider.post.v1.convai.knowledgeBase.refresh).toBe(
      provider.v1.convai.knowledgeBase.refresh
    );
    expect(provider.patch.v1.convai.knowledgeBase.updateFile).toBe(
      provider.v1.convai.knowledgeBase.updateFile
    );
    expect(provider.get.v1.convai.knowledgeBase.ragIndex.overview).toBe(
      provider.v1.convai.knowledgeBase.ragIndex
    );
    expect(provider.post.v1.convai.knowledgeBase.ragIndex.batch).toBe(
      provider.v1.convai.knowledgeBase.ragIndex.batch
    );
    expect(provider.get.v1.convai.knowledgeBase.ragIndex.get).toBe(
      provider.v1.convai.knowledgeBase.ragIndex.get
    );
    expect(provider.post.v1.convai.knowledgeBase.ragIndex.compute).toBe(
      provider.v1.convai.knowledgeBase.ragIndex.compute
    );
    expect(provider.delete.v1.convai.knowledgeBase.ragIndex.delete).toBe(
      provider.v1.convai.knowledgeBase.ragIndex.delete
    );
    expect(provider.post.v1.convai.knowledgeBase.folder).toBe(
      provider.v1.convai.knowledgeBase.folder
    );
    expect(provider.post.v1.convai.knowledgeBase.bulkMove).toBe(
      provider.v1.convai.knowledgeBase.bulkMove
    );
    expect(provider.post.v1.convai.knowledgeBase.move).toBe(
      provider.v1.convai.knowledgeBase.move
    );

    const summariesReq: ElevenLabsGetKnowledgeBaseSummariesRequest = {
      document_ids: ["doc_1"],
    };
    expect(
      provider.v1.convai.knowledgeBase.summaries.schema.safeParse(summariesReq)
        .success
    ).toBe(true);

    const searchReq: ElevenLabsSearchKnowledgeBaseContentRequest = {
      query: "apicity",
      types: ["text"],
    };
    expect(
      provider.v1.convai.knowledgeBase.search.schema.safeParse(searchReq)
        .success
    ).toBe(true);

    const updateReq: ElevenLabsUpdateKnowledgeBaseDocumentRequest = {
      name: "Updated Apicity KB route test",
      content: "Updated content",
    };
    expect(
      provider.v1.convai.knowledgeBase.update.schema.safeParse(updateReq)
        .success
    ).toBe(true);

    const chunksReq: ElevenLabsListKnowledgeBaseDocumentChunksRequest = {
      embedding_model: "multilingual_e5_large_instruct",
      page_size: 10,
    };
    expect(
      provider.v1.convai.knowledgeBase.chunks.schema.safeParse(chunksReq)
        .success
    ).toBe(true);

    const chunkReq: ElevenLabsGetKnowledgeBaseDocumentChunkRequest = {
      embedding_model: "e5_mistral_7b_instruct",
    };
    expect(
      provider.v1.convai.knowledgeBase.chunks.get.schema.safeParse(chunkReq)
        .success
    ).toBe(true);

    const dependentsReq: ElevenLabsGetKnowledgeBaseDependentAgentsRequest = {
      dependent_type: "all",
      page_size: 10,
    };
    expect(
      provider.v1.convai.knowledgeBase.dependentAgents.schema.safeParse(
        dependentsReq
      ).success
    ).toBe(true);

    const updateFileReq: ElevenLabsUpdateKnowledgeBaseFileDocumentRequest = {
      file: new File(["updated"], "updated.txt", { type: "text/plain" }),
    };
    expect(
      provider.v1.convai.knowledgeBase.updateFile.schema.safeParse(
        updateFileReq
      ).success
    ).toBe(true);

    const batchRagReq: ElevenLabsComputeKnowledgeBaseRagIndexesRequest = {
      items: [
        {
          document_id: "doc_1",
          create_if_missing: true,
          model: "multilingual_e5_large_instruct",
        },
      ],
    };
    expect(
      provider.v1.convai.knowledgeBase.ragIndex.batch.schema.safeParse(
        batchRagReq
      ).success
    ).toBe(true);

    const documentRagReq: ElevenLabsComputeKnowledgeBaseDocumentRagIndexRequest =
      {
        model: "e5_mistral_7b_instruct",
      };
    expect(
      provider.v1.convai.knowledgeBase.ragIndex.compute.schema.safeParse(
        documentRagReq
      ).success
    ).toBe(true);

    const folderReq: ElevenLabsCreateKnowledgeBaseFolderRequest = {
      name: "Apicity KB folder route test",
      parent_folder_id: null,
    };
    expect(
      provider.v1.convai.knowledgeBase.folder.schema.safeParse(folderReq)
        .success
    ).toBe(true);

    const bulkMoveReq: ElevenLabsBulkMoveKnowledgeBaseDocumentsRequest = {
      document_ids: ["doc_1"],
      move_to: null,
    };
    expect(
      provider.v1.convai.knowledgeBase.bulkMove.schema.safeParse(bulkMoveReq)
        .success
    ).toBe(true);

    const moveReq: ElevenLabsMoveKnowledgeBaseEntityRequest = {
      move_to: null,
    };
    expect(
      provider.v1.convai.knowledgeBase.move.schema.safeParse(moveReq).success
    ).toBe(true);
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
