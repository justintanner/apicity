import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  createElevenLabs,
  ElevenLabsError,
  type ElevenLabsSingleUseTokenType,
} from "@apicity/elevenlabs";

describe("elevenlabs v1 user and single-use token", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("elevenlabs/user-token");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  function makeProvider() {
    return createElevenLabs({ apiKey: "elevenlabs-invalid-key" });
  }

  async function expectAuthError(promise: Promise<unknown>): Promise<void> {
    try {
      await promise;
      throw new Error("Expected the ElevenLabs request to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(ElevenLabsError);
      expect([401, 403]).toContain((error as ElevenLabsError).status);
    }
  }

  it("routes user and single-use token endpoints", async () => {
    const provider = makeProvider();
    const tokenType: ElevenLabsSingleUseTokenType = "realtime_scribe";

    expect(provider.get.v1.user).toBe(provider.v1.user);
    expect(provider.get.v1.user.subscription).toBe(
      provider.v1.user.subscription
    );
    expect(provider.post.v1.singleUseToken).toBe(provider.v1.singleUseToken);
    expect(provider.v1.user.schema).toBeUndefined();
    expect(provider.v1.singleUseToken.schema).toBeUndefined();

    await expectAuthError(provider.v1.user());
    await expectAuthError(provider.v1.singleUseToken(tokenType));
  });
});
