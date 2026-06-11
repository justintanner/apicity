import { describe, it, expect } from "vitest";

import {
  XMediaUploadInitializeRequestSchema,
  XMediaUploadAppendRequestSchema,
  XTweetCreateRequestSchema,
  XOAuthTokenRequestSchema,
} from "../../packages/provider/x/src/zod";

describe("X Zod schema validation", () => {
  describe("media upload initialize schema", () => {
    it("should validate with empty object", () => {
      const result = XMediaUploadInitializeRequestSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("should validate with all fields", () => {
      const result = XMediaUploadInitializeRequestSchema.safeParse({
        media_type: "video/mp4",
        total_bytes: 1048576,
        media_category: "tweet_video",
        shared: false,
        additional_owners: ["123456789", "987654321"],
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid media_type", () => {
      const result = XMediaUploadInitializeRequestSchema.safeParse({
        media_type: "application/pdf",
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("media_type"))
      ).toBe(true);
    });

    it("should reject total_bytes exceeding max", () => {
      const result = XMediaUploadInitializeRequestSchema.safeParse({
        total_bytes: 17_179_869_185,
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("total_bytes"))
      ).toBe(true);
    });

    it("should reject negative total_bytes", () => {
      const result = XMediaUploadInitializeRequestSchema.safeParse({
        total_bytes: -1,
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("total_bytes"))
      ).toBe(true);
    });

    it("should reject invalid media_category", () => {
      const result = XMediaUploadInitializeRequestSchema.safeParse({
        media_category: "invalid_category",
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("media_category"))
      ).toBe(true);
    });

    it("should reject invalid additional_owners entry", () => {
      const result = XMediaUploadInitializeRequestSchema.safeParse({
        additional_owners: ["abc"],
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("additional_owners"))
      ).toBe(true);
    });

    it("should reject additional_owners exceeding max length", () => {
      const result = XMediaUploadInitializeRequestSchema.safeParse({
        additional_owners: ["1".repeat(20)],
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("additional_owners"))
      ).toBe(true);
    });
  });

  describe("media upload append schema", () => {
    it("should validate with required fields", () => {
      const result = XMediaUploadAppendRequestSchema.safeParse({
        media: new Blob(["chunk"]),
        segment_index: 0,
      });
      expect(result.success).toBe(true);
    });

    it("should validate missing media due to z.custom<Blob>() accepting any value", () => {
      const result = XMediaUploadAppendRequestSchema.safeParse({
        segment_index: 0,
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing segment_index", () => {
      const result = XMediaUploadAppendRequestSchema.safeParse({
        media: new Blob(["chunk"]),
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("segment_index"))
      ).toBe(true);
    });

    it("should reject negative segment_index", () => {
      const result = XMediaUploadAppendRequestSchema.safeParse({
        media: new Blob(["chunk"]),
        segment_index: -1,
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("segment_index"))
      ).toBe(true);
    });

    it("should reject segment_index above maximum", () => {
      const result = XMediaUploadAppendRequestSchema.safeParse({
        media: new Blob(["chunk"]),
        segment_index: 1000,
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("segment_index"))
      ).toBe(true);
    });

    it("should reject null payload", () => {
      const result = XMediaUploadAppendRequestSchema.safeParse(null);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should reject undefined payload", () => {
      const result = XMediaUploadAppendRequestSchema.safeParse(undefined);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });
  });

  describe("tweet create schema", () => {
    it("should validate with text only", () => {
      const result = XTweetCreateRequestSchema.safeParse({
        text: "Hello world",
      });
      expect(result.success).toBe(true);
    });

    it("should validate with all optional fields", () => {
      const result = XTweetCreateRequestSchema.safeParse({
        text: "Hello world",
        card_uri: "card://123",
        community_id: "123456789",
        direct_message_deep_link: "https://x.com/messages/compose",
        edit_options: { previous_post_id: "987654321" },
        for_super_followers_only: false,
        geo: { place_id: "place-123" },
        made_with_ai: true,
        media: {
          media_ids: ["123456789"],
          description: "My media",
          title: "Media title",
        },
        nullcast: false,
        paid_partnership: false,
        poll: {
          options: ["Yes", "No"],
          duration_minutes: 60,
        },
        quote_tweet_id: "123456789",
        reply: {
          in_reply_to_tweet_id: "987654321",
          auto_populate_reply_metadata: true,
        },
        reply_settings: "following",
        share_with_followers: true,
      });
      expect(result.success).toBe(true);
    });

    it("should validate empty object", () => {
      const result = XTweetCreateRequestSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("should reject invalid reply_settings", () => {
      const result = XTweetCreateRequestSchema.safeParse({
        text: "Hello",
        reply_settings: "everyone",
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("reply_settings"))
      ).toBe(true);
    });

    it("should reject invalid community_id", () => {
      const result = XTweetCreateRequestSchema.safeParse({
        text: "Hello",
        community_id: "abc",
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("community_id"))
      ).toBe(true);
    });

    it("should reject media with too many media_ids", () => {
      const result = XTweetCreateRequestSchema.safeParse({
        text: "Hello",
        media: {
          media_ids: [
            "123456789",
            "987654321",
            "111111111",
            "222222222",
            "333333333",
          ],
        },
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("media_ids"))
      ).toBe(true);
    });

    it("should reject media with empty media_ids array", () => {
      const result = XTweetCreateRequestSchema.safeParse({
        text: "Hello",
        media: {
          media_ids: [],
        },
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("media_ids"))
      ).toBe(true);
    });

    it("should reject media with invalid media_id", () => {
      const result = XTweetCreateRequestSchema.safeParse({
        text: "Hello",
        media: {
          media_ids: ["abc"],
        },
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("media_ids"))
      ).toBe(true);
    });

    it("should reject media with too many tagged_user_ids", () => {
      const result = XTweetCreateRequestSchema.safeParse({
        text: "Hello",
        media: {
          media_ids: ["123456789"],
          tagged_user_ids: Array(11).fill("123456789"),
        },
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("tagged_user_ids"))
      ).toBe(true);
    });

    it("should reject poll with too few options", () => {
      const result = XTweetCreateRequestSchema.safeParse({
        text: "Hello",
        poll: {
          options: ["Yes"],
          duration_minutes: 60,
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("options"))).toBe(
        true
      );
    });

    it("should reject poll with too many options", () => {
      const result = XTweetCreateRequestSchema.safeParse({
        text: "Hello",
        poll: {
          options: ["A", "B", "C", "D", "E"],
          duration_minutes: 60,
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("options"))).toBe(
        true
      );
    });

    it("should reject poll with option exceeding max length", () => {
      const result = XTweetCreateRequestSchema.safeParse({
        text: "Hello",
        poll: {
          options: ["a".repeat(26), "b"],
          duration_minutes: 60,
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("options"))).toBe(
        true
      );
    });

    it("should reject poll with duration below minimum", () => {
      const result = XTweetCreateRequestSchema.safeParse({
        text: "Hello",
        poll: {
          options: ["Yes", "No"],
          duration_minutes: 4,
        },
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("duration_minutes"))
      ).toBe(true);
    });

    it("should reject poll with duration above maximum", () => {
      const result = XTweetCreateRequestSchema.safeParse({
        text: "Hello",
        poll: {
          options: ["Yes", "No"],
          duration_minutes: 10081,
        },
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("duration_minutes"))
      ).toBe(true);
    });

    it("should reject invalid quote_tweet_id", () => {
      const result = XTweetCreateRequestSchema.safeParse({
        text: "Hello",
        quote_tweet_id: "abc",
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("quote_tweet_id"))
      ).toBe(true);
    });

    it("should reject invalid reply in_reply_to_tweet_id", () => {
      const result = XTweetCreateRequestSchema.safeParse({
        text: "Hello",
        reply: {
          in_reply_to_tweet_id: "abc",
        },
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) =>
          i.path.includes("in_reply_to_tweet_id")
        )
      ).toBe(true);
    });

    it("should reject invalid edit_options previous_post_id", () => {
      const result = XTweetCreateRequestSchema.safeParse({
        text: "Hello",
        edit_options: {
          previous_post_id: "abc",
        },
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("previous_post_id"))
      ).toBe(true);
    });

    it("should reject null payload", () => {
      const result = XTweetCreateRequestSchema.safeParse(null);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should reject undefined payload", () => {
      const result = XTweetCreateRequestSchema.safeParse(undefined);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });
  });

  describe("oauth token schema", () => {
    it("should validate an authorization_code grant", () => {
      const result = XOAuthTokenRequestSchema.safeParse({
        grant_type: "authorization_code",
        code: "abc",
        redirect_uri: "http://127.0.0.1:8765/callback",
        code_verifier: "verifier",
      });
      expect(result.success).toBe(true);
    });

    it("should validate a refresh_token grant", () => {
      const result = XOAuthTokenRequestSchema.safeParse({
        grant_type: "refresh_token",
        refresh_token: "rt-1",
      });
      expect(result.success).toBe(true);
    });

    it("should reject an authorization_code grant missing code_verifier", () => {
      const result = XOAuthTokenRequestSchema.safeParse({
        grant_type: "authorization_code",
        code: "abc",
        redirect_uri: "http://127.0.0.1:8765/callback",
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("code_verifier"))
      ).toBe(true);
    });

    it("should reject a refresh_token grant with empty refresh_token", () => {
      const result = XOAuthTokenRequestSchema.safeParse({
        grant_type: "refresh_token",
        refresh_token: "",
      });
      expect(result.success).toBe(false);
    });

    it("should reject unknown grant types", () => {
      const result = XOAuthTokenRequestSchema.safeParse({
        grant_type: "client_credentials",
      });
      expect(result.success).toBe(false);
    });
  });
});
