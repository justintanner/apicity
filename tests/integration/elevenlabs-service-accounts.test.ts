import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createElevenLabs,
  ElevenLabsError,
  type ElevenLabsCreateServiceAccountApiKeyRequest,
  type ElevenLabsUpdateServiceAccountApiKeyRequest,
} from "@apicity/elevenlabs";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

async function expectServiceAccountError(
  request: Promise<unknown>
): Promise<void> {
  try {
    await request;
    throw new Error("Expected the ElevenLabs service account request to fail");
  } catch (error) {
    expect(error).toBeInstanceOf(ElevenLabsError);
    expect([400, 401, 403, 404, 422]).toContain(
      (error as ElevenLabsError).status
    );
  }
}

describe("elevenlabs v1.serviceAccounts", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("elevenlabs/service-accounts");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("routes service account endpoints and validates API key schemas", async () => {
    const provider = createElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY ?? "elevenlabs-test-key",
    });
    const serviceAccountUserId = "apicity-nonexistent-service-account";
    const apiKeyId = "apicity-nonexistent-api-key";
    const createReq: ElevenLabsCreateServiceAccountApiKeyRequest = {
      name: "apicity-route-test",
      permissions: ["workspace_read", "service_account_write"],
      character_limit: null,
      allowed_ips: ["203.0.113.10"],
      third_party_disable_allowed: null,
    };
    const updateReq: ElevenLabsUpdateServiceAccountApiKeyRequest = {
      is_enabled: "no_update",
      name: null,
      permissions: "no_update",
      character_limit: "no_update",
      allowed_ips: "clear",
      third_party_disable_allowed: "no_update",
    };

    expect(provider.get.v1.serviceAccounts.list).toBe(
      provider.v1.serviceAccounts.list
    );
    expect(provider.get.v1.serviceAccounts.apiKeys.list).toBe(
      provider.v1.serviceAccounts.apiKeys.list
    );
    expect(provider.post.v1.serviceAccounts.apiKeys.create).toBe(
      provider.v1.serviceAccounts.apiKeys.create
    );
    expect(provider.patch.v1.serviceAccounts.apiKeys.update).toBe(
      provider.v1.serviceAccounts.apiKeys.update
    );
    expect(provider.delete.v1.serviceAccounts.apiKeys.delete).toBe(
      provider.v1.serviceAccounts.apiKeys.delete
    );
    expect(provider.v1.serviceAccounts.list.schema).toBeUndefined();
    expect(provider.v1.serviceAccounts.apiKeys.list.schema).toBeUndefined();
    expect(provider.v1.serviceAccounts.apiKeys.delete.schema).toBeUndefined();
    expect(
      provider.v1.serviceAccounts.apiKeys.create.schema.safeParse(createReq)
        .success
    ).toBe(true);
    expect(
      provider.v1.serviceAccounts.apiKeys.create.schema.safeParse({
        ...createReq,
        permissions: "all",
      }).success
    ).toBe(true);
    expect(
      provider.v1.serviceAccounts.apiKeys.create.schema.safeParse({
        ...createReq,
        permissions: ["not-a-permission"],
      }).success
    ).toBe(false);
    expect(
      provider.v1.serviceAccounts.apiKeys.update.schema.safeParse(updateReq)
        .success
    ).toBe(true);
    expect(
      provider.v1.serviceAccounts.apiKeys.update.schema.safeParse({
        allowed_ips: "no_update",
        third_party_disable_allowed: "clear",
      }).success
    ).toBe(true);
    expect(
      provider.v1.serviceAccounts.apiKeys.update.schema.safeParse({
        allowed_ips: null,
      }).success
    ).toBe(false);

    try {
      const serviceAccounts = await provider.v1.serviceAccounts.list();
      expect(Array.isArray(serviceAccounts["service-accounts"])).toBe(true);
    } catch (error) {
      expect(error).toBeInstanceOf(ElevenLabsError);
      expect([401, 403]).toContain((error as ElevenLabsError).status);
    }

    await expectServiceAccountError(
      provider.v1.serviceAccounts.apiKeys.list(serviceAccountUserId)
    );
    await expectServiceAccountError(
      provider.v1.serviceAccounts.apiKeys.create(
        serviceAccountUserId,
        createReq
      )
    );
    await expectServiceAccountError(
      provider.v1.serviceAccounts.apiKeys.update(
        serviceAccountUserId,
        apiKeyId,
        updateReq
      )
    );
    await expectServiceAccountError(
      provider.v1.serviceAccounts.apiKeys.delete(serviceAccountUserId, apiKeyId)
    );
  });
});
