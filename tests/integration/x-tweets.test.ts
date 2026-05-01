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
  });
});
