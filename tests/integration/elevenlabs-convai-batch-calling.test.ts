import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createElevenLabs,
  type ElevenLabsSubmitBatchCallRequest,
  type ElevenLabsListWorkspaceBatchCallsRequest,
} from "@apicity/elevenlabs";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("elevenlabs v1.convai.batchCalling", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("elevenlabs/convai-batch-calling");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("lists workspace batch calls and exposes the full namespace", async () => {
    const provider = createElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY ?? "elevenlabs-test-key",
    });

    expect(provider.post.v1.convai.batchCalling.submit).toBe(
      provider.v1.convai.batchCalling.submit
    );
    expect(provider.get.v1.convai.batchCalling.workspace).toBe(
      provider.v1.convai.batchCalling.workspace
    );
    expect(provider.get.v1.convai.batchCalling.get).toBe(
      provider.v1.convai.batchCalling.get
    );
    expect(provider.delete.v1.convai.batchCalling.delete).toBe(
      provider.v1.convai.batchCalling.delete
    );
    expect(provider.post.v1.convai.batchCalling.cancel).toBe(
      provider.v1.convai.batchCalling.cancel
    );
    expect(provider.post.v1.convai.batchCalling.retry).toBe(
      provider.v1.convai.batchCalling.retry
    );

    const submitReq: ElevenLabsSubmitBatchCallRequest = {
      call_name: "apicity_batch_route_test",
      agent_id: "agent_apicity_route_test",
      recipients: [
        {
          phone_number: "+15555550123",
          conversation_initiation_client_data: {
            dynamic_variables: {
              city: "apicity",
            },
          },
        },
      ],
      scheduled_time_unix: null,
      agent_phone_number_id: "phone_number_apicity_route_test",
      timezone: "UTC",
      branch_id: null,
      environment: null,
      telephony_call_config: {
        ringing_timeout_secs: 60,
      },
      target_concurrency_limit: 1,
    };
    expect(
      provider.v1.convai.batchCalling.submit.schema.safeParse(submitReq).success
    ).toBe(true);

    const workspaceReq: ElevenLabsListWorkspaceBatchCallsRequest = {
      limit: 3,
      last_doc: null,
      agent_id: null,
    };
    expect(
      provider.v1.convai.batchCalling.workspace.schema.safeParse(workspaceReq)
        .success
    ).toBe(true);

    const listed = await provider.v1.convai.batchCalling.workspace({
      limit: 3,
    });
    expect(Array.isArray(listed.batch_calls)).toBe(true);
  });
});
