import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createElevenLabs,
  type ElevenLabsCreateEnvironmentVariableRequest,
  type ElevenLabsCreateWorkspaceSecretRequest,
  type ElevenLabsListEnvironmentVariablesRequest,
  type ElevenLabsListWorkspaceSecretsRequest,
  type ElevenLabsUpdateConvaiDashboardSettingsRequest,
  type ElevenLabsUpdateConvaiSettingsRequest,
  type ElevenLabsUpdateEnvironmentVariableRequest,
  type ElevenLabsUpdateWorkspaceSecretRequest,
} from "@apicity/elevenlabs";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("elevenlabs v1.convai settings, secrets, and env variables", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("elevenlabs/convai-settings-secrets-env");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("manages ConvAI workspace settings, secrets, and environment variables", async () => {
    const provider = createElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY ?? "elevenlabs-test-key",
    });

    expect(provider.get.v1.convai.settings).toBe(provider.v1.convai.settings);
    expect(provider.patch.v1.convai.settings.update).toBe(
      provider.v1.convai.settings.update
    );
    expect(provider.get.v1.convai.settings.dashboard).toBe(
      provider.v1.convai.settings.dashboard
    );
    expect(provider.patch.v1.convai.settings.dashboard.update).toBe(
      provider.v1.convai.settings.dashboard.update
    );
    expect(provider.post.v1.convai.secrets.create).toBe(
      provider.v1.convai.secrets.create
    );
    expect(provider.get.v1.convai.secrets.list).toBe(
      provider.v1.convai.secrets.list
    );
    expect(provider.get.v1.convai.secrets.get).toBe(
      provider.v1.convai.secrets.get
    );
    expect(provider.get.v1.convai.secrets.dependencies).toBe(
      provider.v1.convai.secrets.dependencies
    );
    expect(provider.patch.v1.convai.secrets.update).toBe(
      provider.v1.convai.secrets.update
    );
    expect(provider.delete.v1.convai.secrets.delete).toBe(
      provider.v1.convai.secrets.delete
    );
    expect(provider.post.v1.convai.environmentVariables.create).toBe(
      provider.v1.convai.environmentVariables.create
    );
    expect(provider.get.v1.convai.environmentVariables.list).toBe(
      provider.v1.convai.environmentVariables.list
    );
    expect(provider.get.v1.convai.environmentVariables.get).toBe(
      provider.v1.convai.environmentVariables.get
    );
    expect(provider.patch.v1.convai.environmentVariables.update).toBe(
      provider.v1.convai.environmentVariables.update
    );

    const settingsPatch: ElevenLabsUpdateConvaiSettingsRequest = {
      conversation_initiation_client_data_webhook: {
        url: "https://example.com/apicity/convai-settings",
        request_headers: {
          "x-api-key": { secret_id: "secret_apicity_route_test" },
        },
      },
      webhooks: {
        post_call_webhook_id: null,
        events: ["transcript", "call_initiation_failure"],
        transcript_format: "json",
      },
      rag_retention_period_days: 10,
      conversation_embedding_retention_days: null,
      default_livekit_stack: "standard",
    };
    expect(
      provider.v1.convai.settings.update.schema.safeParse(settingsPatch).success
    ).toBe(true);
    expect(
      provider.v1.convai.settings.update.schema.safeParse({
        rag_retention_period_days: 31,
      }).success
    ).toBe(false);

    const dashboardPatch: ElevenLabsUpdateConvaiDashboardSettingsRequest = {
      charts: [
        {
          type: "call_success",
          name: "Call success",
        },
      ],
    };
    expect(
      provider.v1.convai.settings.dashboard.update.schema.safeParse(
        dashboardPatch
      ).success
    ).toBe(true);
    expect(
      provider.v1.convai.settings.dashboard.update.schema.safeParse({
        charts: [
          { type: "call_success", name: "one" },
          { type: "call_success", name: "two" },
          { type: "call_success", name: "three" },
          { type: "call_success", name: "four" },
          { type: "call_success", name: "five" },
        ],
      }).success
    ).toBe(false);

    const settings = await provider.v1.convai.settings();
    expect(settings).toBeTypeOf("object");
    const dashboard = await provider.v1.convai.settings.dashboard();
    expect(Array.isArray(dashboard.charts ?? [])).toBe(true);

    const secretName = "apicity_route_test_secret_ac292ev28";
    const createSecretReq: ElevenLabsCreateWorkspaceSecretRequest = {
      type: "new",
      name: secretName,
      value: "initial-secret-value",
    };
    expect(
      provider.v1.convai.secrets.create.schema.safeParse(createSecretReq)
        .success
    ).toBe(true);
    expect(
      provider.v1.convai.secrets.create.schema.safeParse({
        type: "update",
        name: secretName,
        value: "bad",
      }).success
    ).toBe(false);

    const createdSecret =
      await provider.v1.convai.secrets.create(createSecretReq);
    expect(createdSecret.type).toBe("stored");
    expect(createdSecret.name).toBe(secretName);
    const secretId = createdSecret.secret_id;

    const fetchedSecret = await provider.v1.convai.secrets.get(secretId);
    expect(fetchedSecret.secret_id).toBe(secretId);
    expect(fetchedSecret.name).toBe(secretName);

    const listSecretsReq: ElevenLabsListWorkspaceSecretsRequest = {
      page_size: 30,
      dependency_limit: 5,
      search: "apicity_route_test_secret",
      cursor: null,
    };
    expect(
      provider.v1.convai.secrets.list.schema.safeParse(listSecretsReq).success
    ).toBe(true);
    const listedSecrets = await provider.v1.convai.secrets.list(listSecretsReq);
    expect(Array.isArray(listedSecrets.secrets)).toBe(true);

    expect(
      provider.v1.convai.secrets.dependencies.schema.safeParse({
        page_size: 20,
        cursor: null,
      }).success
    ).toBe(true);
    const secretDependencies = await provider.v1.convai.secrets.dependencies(
      secretId,
      "tools",
      { page_size: 20 }
    );
    expect(Array.isArray(secretDependencies.dependencies)).toBe(true);

    const updateSecretReq: ElevenLabsUpdateWorkspaceSecretRequest = {
      type: "update",
      name: secretName,
      value: "updated-secret-value",
    };
    expect(
      provider.v1.convai.secrets.update.schema.safeParse(updateSecretReq)
        .success
    ).toBe(true);
    const updatedSecret = await provider.v1.convai.secrets.update(
      secretId,
      updateSecretReq
    );
    expect(updatedSecret.secret_id).toBe(secretId);
    expect(updatedSecret.name).toBe(secretName);

    await expect(
      provider.v1.convai.secrets.delete(secretId)
    ).resolves.toBeDefined();

    const envLabel = "apicity_route_test_env_ac292ev28";
    const createEnvReq: ElevenLabsCreateEnvironmentVariableRequest = {
      type: "string",
      label: envLabel,
      values: {
        production: "apicity-route-test",
      },
    };
    expect(
      provider.v1.convai.environmentVariables.create.schema.safeParse(
        createEnvReq
      ).success
    ).toBe(true);
    expect(
      provider.v1.convai.environmentVariables.create.schema.safeParse({
        ...createEnvReq,
        label: "APICITY_ROUTE_TEST_ENV_AC292EV28",
      }).success
    ).toBe(false);

    const listEnvReq: ElevenLabsListEnvironmentVariablesRequest = {
      label: envLabel,
      page_size: 30,
      type: "string",
      cursor: null,
    };
    expect(
      provider.v1.convai.environmentVariables.list.schema.safeParse(listEnvReq)
        .success
    ).toBe(true);
    expect(
      provider.v1.convai.environmentVariables.list.schema.safeParse({
        page_size: 101,
      }).success
    ).toBe(false);

    const initialEnvList =
      await provider.v1.convai.environmentVariables.list(listEnvReq);
    let envVariable = initialEnvList.environment_variables[0];

    if (!envVariable) {
      envVariable =
        await provider.v1.convai.environmentVariables.create(createEnvReq);
    }

    expect(envVariable.label).toBe(envLabel);
    expect(envVariable.type).toBe("string");

    const fetchedEnv = await provider.v1.convai.environmentVariables.get(
      envVariable.id
    );
    expect(fetchedEnv.id).toBe(envVariable.id);

    const productionValue =
      typeof fetchedEnv.values.production === "string"
        ? fetchedEnv.values.production
        : "apicity-route-test";
    const updateEnvReq: ElevenLabsUpdateEnvironmentVariableRequest = {
      values: {
        production: productionValue,
      },
    };
    expect(
      provider.v1.convai.environmentVariables.update.schema.safeParse(
        updateEnvReq
      ).success
    ).toBe(true);
    const updatedEnv = await provider.v1.convai.environmentVariables.update(
      envVariable.id,
      updateEnvReq
    );
    expect(updatedEnv.id).toBe(envVariable.id);
    expect(updatedEnv.label).toBe(envLabel);
  });
});
