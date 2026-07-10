import {
  ElevenLabsSingleUseTokenResponse,
  ElevenLabsSingleUseTokenType,
  ElevenLabsUserResponse,
  ElevenLabsUserSubscriptionResponse,
} from "./types";
import type { ElevenLabsContext } from "./transport";

interface ElevenLabsSubscriptionPayload extends Record<string, unknown> {
  tier: string;
  character_count: number;
  character_limit: number;
  remaining_character_count?: number;
}

export function createUserEndpoints(ctx: ElevenLabsContext) {
  const { makeJsonRequest } = ctx;

  // GET https://api.elevenlabs.io/v1/user
  // Docs: https://elevenlabs.io/docs/api-reference/user/get
  const getUser = Object.assign(
    async (signal?: AbortSignal): Promise<ElevenLabsUserResponse> => {
      return makeJsonRequest<ElevenLabsUserResponse>(
        "GET",
        "/v1/user",
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/user/subscription
  // Docs: https://elevenlabs.io/docs/api-reference/user/subscription/get
  const userSubscription = Object.assign(
    async (
      signal?: AbortSignal
    ): Promise<ElevenLabsUserSubscriptionResponse> => {
      const subscription = await makeJsonRequest<ElevenLabsSubscriptionPayload>(
        "GET",
        "/v1/user/subscription",
        undefined,
        signal
      );

      return {
        ...subscription,
        remaining_character_count: Math.max(
          0,
          subscription.character_limit - subscription.character_count
        ),
      };
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/single-use-token/{tokenType}
  // Docs: https://elevenlabs.io/docs/api-reference/tokens/create
  const singleUseToken = Object.assign(
    async (
      tokenType: ElevenLabsSingleUseTokenType,
      signal?: AbortSignal
    ): Promise<ElevenLabsSingleUseTokenResponse> => {
      return makeJsonRequest<ElevenLabsSingleUseTokenResponse>(
        "POST",
        `/v1/single-use-token/${encodeURIComponent(tokenType)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  const user = Object.assign(getUser, {
    subscription: userSubscription,
  });

  return {
    v1: { user, singleUseToken },
    get: { v1: { user } },
    post: { v1: { singleUseToken } },
  };
}
