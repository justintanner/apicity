import { describe, it, expect, afterEach } from "vitest";
import {
  setupPolly,
  teardownPolly,
  getPollyMode,
  recordingExists,
  type PollyContext,
} from "../harness";
import { x } from "@apicity/x";

const recordingName = "x/tweets-create";

describe("x post.v2.tweets", () => {
  let ctx: PollyContext | undefined;

  afterEach(async () => {
    if (ctx) {
      await teardownPolly(ctx);
      ctx = undefined;
    }
  });

  it("creates a text-only post and returns the new id", async () => {
    if (getPollyMode() === "replay" && !recordingExists(recordingName)) {
      return;
    }

    ctx = setupPolly(recordingName);

    const provider = x({
      accessToken: process.env.X_ACCESS_TOKEN ?? "x-test-token",
    });

    const res = await provider.post.v2.tweets({
      text: "hello from @apicity/x",
    });

    expect(res.data).toBeDefined();
    expect(typeof res.data.id).toBe("string");
    expect(res.data.id).toMatch(/^[0-9]+$/);
    expect(typeof res.data.text).toBe("string");
  });

  it("exposes a Zod schema with safeParse", () => {
    const provider = x({ accessToken: "x-test-token" });
    const endpoint = provider.post.v2.tweets;
    expect(endpoint.schema).toBeDefined();
    expect(typeof endpoint.schema.safeParse).toBe("function");

    const textOnly = endpoint.schema.safeParse({ text: "hi" });
    expect(textOnly.success).toBe(true);

    const withMedia = endpoint.schema.safeParse({
      text: "video post",
      media: { media_ids: ["1880028106020515840"] },
    });
    expect(withMedia.success).toBe(true);

    const tooManyMedia = endpoint.schema.safeParse({
      media: {
        media_ids: ["1", "2", "3", "4", "5"],
      },
    });
    expect(tooManyMedia.success).toBe(false);

    const badPoll = endpoint.schema.safeParse({
      text: "vote",
      poll: { options: ["only one"], duration_minutes: 60 },
    });
    expect(badPoll.success).toBe(false);

    const badReplyTarget = endpoint.schema.safeParse({
      text: "reply",
      reply: { in_reply_to_tweet_id: "not-a-number" },
    });
    expect(badReplyTarget.success).toBe(false);

    // `everyone` is the implicit default and NOT an accepted enum value
    // per docs.x.com/x-api/posts/create-post.
    const replySettingsEveryone = endpoint.schema.safeParse({
      text: "hi",
      reply_settings: "everyone",
    });
    expect(replySettingsEveryone.success).toBe(false);

    const replySettingsValid = endpoint.schema.safeParse({
      text: "hi",
      reply_settings: "following",
    });
    expect(replySettingsValid.success).toBe(true);

    // tagged_user_ids is capped at 10 per docs
    const tooManyTags = endpoint.schema.safeParse({
      media: {
        media_ids: ["1"],
        tagged_user_ids: Array.from({ length: 11 }, (_, i) => String(i + 1)),
      },
    });
    expect(tooManyTags.success).toBe(false);

    // Poll option strings cap at 25 chars per docs
    const longPollOption = endpoint.schema.safeParse({
      text: "vote",
      poll: {
        options: ["ok", "x".repeat(26)],
        duration_minutes: 60,
      },
    });
    expect(longPollOption.success).toBe(false);

    // call_to_actions accepts exactly one variant
    const ctaTwoVariants = endpoint.schema.safeParse({
      media: {
        media_ids: ["1"],
        call_to_actions: {
          visit_site: { url: "https://example.com" },
          watch_now: { url: "https://example.com" },
        },
      },
    });
    expect(ctaTwoVariants.success).toBe(false);

    // Newly added top-level fields parse cleanly
    const fullKitchenSink = endpoint.schema.safeParse({
      text: "hi",
      card_uri: "card://abc",
      community_id: "1234567890",
      made_with_ai: true,
      paid_partnership: true,
      share_with_followers: true,
      edit_options: { previous_post_id: "1234567890" },
    });
    expect(fullKitchenSink.success).toBe(true);
  });
});
