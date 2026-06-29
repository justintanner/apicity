import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createElevenLabs,
  type ElevenLabsBulkMoveAgentTestsRequest,
  type ElevenLabsCreateAgentRequest,
  type ElevenLabsCreateAgentTestFolderRequest,
  type ElevenLabsCreateAgentTestRequest,
  type ElevenLabsGetAgentTestSummariesRequest,
  type ElevenLabsListAgentTestsRequest,
  type ElevenLabsListTestInvocationsRequest,
  type ElevenLabsResubmitTestsRequest,
  type ElevenLabsRunAgentTestsRequest,
  type ElevenLabsUpdateAgentTestFolderRequest,
  type ElevenLabsUpdateAgentTestRequest,
} from "@apicity/elevenlabs";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("elevenlabs v1.convai agentTesting and testInvocations", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("elevenlabs/convai-agent-testing");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("manages agent tests, folders, and test invocations", async () => {
    const provider = createElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY ?? "elevenlabs-test-key",
    });

    expect(provider.post.v1.convai.agentTesting.create).toBe(
      provider.v1.convai.agentTesting.create
    );
    expect(provider.get.v1.convai.agentTesting.list).toBe(
      provider.v1.convai.agentTesting.list
    );
    expect(provider.get.v1.convai.agentTesting.get).toBe(
      provider.v1.convai.agentTesting.get
    );
    expect(provider.put.v1.convai.agentTesting.update).toBe(
      provider.v1.convai.agentTesting.update
    );
    expect(provider.delete.v1.convai.agentTesting.delete).toBe(
      provider.v1.convai.agentTesting.delete
    );
    expect(provider.post.v1.convai.agentTesting.summaries).toBe(
      provider.v1.convai.agentTesting.summaries
    );
    expect(provider.post.v1.convai.agentTesting.bulkMove).toBe(
      provider.v1.convai.agentTesting.bulkMove
    );
    expect(provider.post.v1.convai.agentTesting.folders.create).toBe(
      provider.v1.convai.agentTesting.folders.create
    );
    expect(provider.get.v1.convai.agentTesting.folders.get).toBe(
      provider.v1.convai.agentTesting.folders.get
    );
    expect(provider.patch.v1.convai.agentTesting.folders.update).toBe(
      provider.v1.convai.agentTesting.folders.update
    );
    expect(provider.delete.v1.convai.agentTesting.folders.delete).toBe(
      provider.v1.convai.agentTesting.folders.delete
    );
    expect(provider.post.v1.convai.agents.runTests).toBe(
      provider.v1.convai.agents.runTests
    );
    expect(provider.get.v1.convai.testInvocations.list).toBe(
      provider.v1.convai.testInvocations.list
    );
    expect(provider.get.v1.convai.testInvocations.get).toBe(
      provider.v1.convai.testInvocations.get
    );
    expect(provider.post.v1.convai.testInvocations.resubmit).toBe(
      provider.v1.convai.testInvocations.resubmit
    );

    let agentId: string | undefined;
    let folderId: string | undefined;
    let testId: string | undefined;

    try {
      const createAgentReq: ElevenLabsCreateAgentRequest = {
        name: "Apicity agent testing route test",
        conversation_config: {
          agent: {
            prompt: {
              prompt: "You are a concise Apicity route-test assistant.",
            },
            first_message: "Hello from Apicity.",
            language: "en",
          },
        },
        tags: ["apicity-test"],
      };
      const agent = await provider.v1.convai.agents.create(createAgentReq);
      agentId = agent.agent_id;
      expect(agentId.length).toBeGreaterThan(0);

      const createFolderReq: ElevenLabsCreateAgentTestFolderRequest = {
        name: "Apicity route test folder",
      };
      expect(
        provider.v1.convai.agentTesting.folders.create.schema.safeParse(
          createFolderReq
        ).success
      ).toBe(true);
      const folder =
        await provider.v1.convai.agentTesting.folders.create(createFolderReq);
      folderId = folder.id;
      expect(folder.name).toBe("Apicity route test folder");

      const createTestReq: ElevenLabsCreateAgentTestRequest = {
        name: "Apicity route response test",
        type: "llm",
        chat_history: [
          {
            role: "user",
            message: "Say hello from Apicity in one short sentence.",
            time_in_call_secs: 0,
          },
        ],
        success_condition:
          "The agent responds with a short greeting that mentions Apicity.",
      };
      expect(
        provider.v1.convai.agentTesting.create.schema.safeParse(createTestReq)
          .success
      ).toBe(true);
      const test = await provider.v1.convai.agentTesting.create(createTestReq);
      testId = test.id;
      expect(testId.length).toBeGreaterThan(0);

      const bulkMoveReq: ElevenLabsBulkMoveAgentTestsRequest = {
        entity_ids: [testId],
        move_to: folderId,
      };
      expect(
        provider.v1.convai.agentTesting.bulkMove.schema.safeParse(bulkMoveReq)
          .success
      ).toBe(true);
      await expect(
        provider.v1.convai.agentTesting.bulkMove(bulkMoveReq)
      ).resolves.toBeDefined();

      const fetchedFolder =
        await provider.v1.convai.agentTesting.folders.get(folderId);
      expect(fetchedFolder.id).toBe(folderId);

      const updateFolderReq: ElevenLabsUpdateAgentTestFolderRequest = {
        name: "Apicity route test folder updated",
      };
      expect(
        provider.v1.convai.agentTesting.folders.update.schema.safeParse(
          updateFolderReq
        ).success
      ).toBe(true);
      const updatedFolder =
        await provider.v1.convai.agentTesting.folders.update(
          folderId,
          updateFolderReq
        );
      expect(updatedFolder.id).toBe(folderId);

      const updateTestReq: ElevenLabsUpdateAgentTestRequest = {
        ...createTestReq,
        name: "Apicity route response test updated",
        parent_folder_id: folderId,
      };
      expect(
        provider.v1.convai.agentTesting.update.schema.safeParse(updateTestReq)
          .success
      ).toBe(true);
      const updatedTest = await provider.v1.convai.agentTesting.update(
        testId,
        updateTestReq
      );
      expect(updatedTest.id).toBe(testId);

      const fetchedTest = await provider.v1.convai.agentTesting.get(testId);
      expect(fetchedTest.id).toBe(testId);

      const summariesReq: ElevenLabsGetAgentTestSummariesRequest = {
        test_ids: [testId],
      };
      expect(
        provider.v1.convai.agentTesting.summaries.schema.safeParse(summariesReq)
          .success
      ).toBe(true);
      const summaries =
        await provider.v1.convai.agentTesting.summaries(summariesReq);
      expect(typeof summaries.tests).toBe("object");

      const listReq: ElevenLabsListAgentTestsRequest = {
        page_size: 30,
        parent_folder_id: folderId,
        types: ["llm", "folder"],
        sort_mode: "folders_first",
        sharing_mode: "all",
      };
      expect(
        provider.v1.convai.agentTesting.list.schema.safeParse(listReq).success
      ).toBe(true);
      const listed = await provider.v1.convai.agentTesting.list(listReq);
      expect(Array.isArray(listed.tests)).toBe(true);
      expect(typeof listed.has_more).toBe("boolean");

      const runReq: ElevenLabsRunAgentTestsRequest = {
        tests: [{ test_id: testId }],
        repeat_count: 1,
      };
      expect(
        provider.v1.convai.agents.runTests.schema.safeParse(runReq).success
      ).toBe(true);
      const invocation = await provider.v1.convai.agents.runTests(
        agentId,
        runReq
      );
      expect(typeof invocation.id).toBe("string");
      expect(invocation.id.length).toBeGreaterThan(0);

      const invocationsReq: ElevenLabsListTestInvocationsRequest = {
        agent_id: agentId,
        page_size: 30,
      };
      expect(
        provider.v1.convai.testInvocations.list.schema.safeParse(invocationsReq)
          .success
      ).toBe(true);
      const invocations =
        await provider.v1.convai.testInvocations.list(invocationsReq);
      expect(Array.isArray(invocations.results)).toBe(true);
      expect(typeof invocations.has_more).toBe("boolean");

      const fetchedInvocation = await provider.v1.convai.testInvocations.get(
        invocation.id
      );
      expect(fetchedInvocation.id).toBe(invocation.id);
      expect(Array.isArray(fetchedInvocation.test_runs)).toBe(true);

      const testRunIds = fetchedInvocation.test_runs.map(
        (run) => run.test_run_id
      );
      expect(testRunIds.length).toBeGreaterThan(0);
      const resubmitReq: ElevenLabsResubmitTestsRequest = {
        test_run_ids: testRunIds,
        agent_id: agentId,
      };
      expect(
        provider.v1.convai.testInvocations.resubmit.schema.safeParse(
          resubmitReq
        ).success
      ).toBe(true);
      await expect(
        provider.v1.convai.testInvocations.resubmit(invocation.id, resubmitReq)
      ).resolves.toBeDefined();
    } finally {
      if (testId) {
        await provider.v1.convai.agentTesting.delete(testId);
      }
      if (folderId) {
        await provider.v1.convai.agentTesting.folders.delete(folderId, {
          force: true,
        });
      }
      if (agentId) {
        await provider.v1.convai.agents.delete(agentId);
      }
    }
  });
});
