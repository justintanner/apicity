import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createElevenLabs,
  type ElevenLabsCreateMcpServerRequest,
  type ElevenLabsUpdateMcpServerRequest,
  type ElevenLabsCreateMcpServerToolApprovalRequest,
  type ElevenLabsCreateMcpToolConfigOverrideRequest,
  type ElevenLabsUpdateMcpToolConfigOverrideRequest,
} from "@apicity/elevenlabs";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("elevenlabs v1.convai.mcpServers", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("elevenlabs/convai-mcp-servers");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("lists MCP servers and exposes the full MCP namespace", async () => {
    const provider = createElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY ?? "elevenlabs-test-key",
    });

    expect(provider.post.v1.convai.mcpServers.create).toBe(
      provider.v1.convai.mcpServers.create
    );
    expect(provider.get.v1.convai.mcpServers.list).toBe(
      provider.v1.convai.mcpServers.list
    );
    expect(provider.get.v1.convai.mcpServers.get).toBe(
      provider.v1.convai.mcpServers.get
    );
    expect(provider.patch.v1.convai.mcpServers.update).toBe(
      provider.v1.convai.mcpServers.update
    );
    expect(provider.delete.v1.convai.mcpServers.delete).toBe(
      provider.v1.convai.mcpServers.delete
    );
    expect(provider.get.v1.convai.mcpServers.tools).toBe(
      provider.v1.convai.mcpServers.tools
    );
    expect(provider.post.v1.convai.mcpServers.toolApprovals.create).toBe(
      provider.v1.convai.mcpServers.toolApprovals.create
    );
    expect(provider.delete.v1.convai.mcpServers.toolApprovals.delete).toBe(
      provider.v1.convai.mcpServers.toolApprovals.delete
    );
    expect(provider.post.v1.convai.mcpServers.toolConfigs.create).toBe(
      provider.v1.convai.mcpServers.toolConfigs.create
    );
    expect(provider.get.v1.convai.mcpServers.toolConfigs.get).toBe(
      provider.v1.convai.mcpServers.toolConfigs.get
    );
    expect(provider.patch.v1.convai.mcpServers.toolConfigs.update).toBe(
      provider.v1.convai.mcpServers.toolConfigs.update
    );
    expect(provider.delete.v1.convai.mcpServers.toolConfigs.delete).toBe(
      provider.v1.convai.mcpServers.toolConfigs.delete
    );

    const createReq: ElevenLabsCreateMcpServerRequest = {
      config: {
        name: "apicity_mcp_route_test",
        url: "https://example.com/apicity/mcp",
        transport: "SSE",
        approval_policy: "require_approval_per_tool",
        pre_tool_speech: "auto",
        disable_interruptions: false,
        tool_call_sound_behavior: "auto",
        execution_mode: "immediate",
        response_timeout_secs: 30,
        disable_compression: true,
      },
    };
    expect(
      provider.v1.convai.mcpServers.create.schema.safeParse(createReq).success
    ).toBe(true);

    const updateReq: ElevenLabsUpdateMcpServerRequest = {
      approval_policy: "require_approval_all",
      pre_tool_speech: "off",
      response_timeout_secs: 45,
      request_headers: {
        "x-apicity-test": "mcp",
      },
      secret_token: { secret_id: "test-secret" },
      auth_connection: { auth_connection_id: "test-auth-connection" },
    };
    expect(
      provider.v1.convai.mcpServers.update.schema.safeParse(updateReq).success
    ).toBe(true);

    const approvalReq: ElevenLabsCreateMcpServerToolApprovalRequest = {
      tool_name: "apicity_test_tool",
      tool_description: "A test MCP tool used for request schema validation.",
      input_schema: {
        type: "object",
        properties: {},
      },
      approval_policy: "auto_approved",
    };
    expect(
      provider.v1.convai.mcpServers.toolApprovals.create.schema.safeParse(
        approvalReq
      ).success
    ).toBe(true);

    const createConfigReq: ElevenLabsCreateMcpToolConfigOverrideRequest = {
      tool_name: "apicity_test_tool",
      pre_tool_speech: "force",
      execution_mode: "post_tool_speech",
      response_timeout_secs: 20,
      assignments: [
        {
          dynamic_variable: "last_tool_status",
          value_path: "status",
        },
      ],
      input_overrides: {
        city: {
          source: "constant",
          constant_value: "apicity",
        },
      },
      response_mocks: [
        {
          mock_result: "ok",
        },
      ],
    };
    expect(
      provider.v1.convai.mcpServers.toolConfigs.create.schema.safeParse(
        createConfigReq
      ).success
    ).toBe(true);

    const updateConfigReq: ElevenLabsUpdateMcpToolConfigOverrideRequest = {
      pre_tool_speech: "auto",
      disable_interruptions: true,
      response_timeout_secs: 25,
    };
    expect(
      provider.v1.convai.mcpServers.toolConfigs.update.schema.safeParse(
        updateConfigReq
      ).success
    ).toBe(true);

    const listed = await provider.v1.convai.mcpServers.list();
    expect(Array.isArray(listed.mcp_servers)).toBe(true);
  });
});
