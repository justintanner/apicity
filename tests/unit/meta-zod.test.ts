import { describe, it, expect } from "vitest";

import {
  MetaMediaCreateRequestSchema,
  MetaMediaPublishRequestSchema,
} from "../../packages/provider/meta/src/zod";

describe("Meta Zod schema validation", () => {
  describe("media create schema", () => {
    it("should validate with required media_type only", () => {
      const result = MetaMediaCreateRequestSchema.safeParse({
        media_type: "IMAGE",
      });
      expect(result.success).toBe(true);
    });

    it("should validate with all optional fields", () => {
      const result = MetaMediaCreateRequestSchema.safeParse({
        media_type: "REELS",
        video_url: "https://example.com/video.mp4",
        image_url: "https://example.com/image.jpg",
        caption: "My awesome post",
        thumb_offset: 0,
        share_to_feed: true,
        location_id: "123456789",
        user_tags: [
          { username: "friend1", x: 0.5, y: 0.5 },
          { username: "friend2" },
        ],
        collaborators: ["collab1", "collab2"],
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing required media_type", () => {
      const result = MetaMediaCreateRequestSchema.safeParse({
        video_url: "https://example.com/video.mp4",
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("media_type"))
      ).toBe(true);
    });

    it("should reject invalid media_type", () => {
      const result = MetaMediaCreateRequestSchema.safeParse({
        media_type: "AUDIO",
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("media_type"))
      ).toBe(true);
    });

    it("should reject caption exceeding max length", () => {
      const result = MetaMediaCreateRequestSchema.safeParse({
        media_type: "IMAGE",
        caption: "a".repeat(2201),
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("caption"))).toBe(
        true
      );
    });

    it("should reject invalid image_url type", () => {
      const result = MetaMediaCreateRequestSchema.safeParse({
        media_type: "IMAGE",
        image_url: 123,
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("image_url"))
      ).toBe(true);
    });

    it("should reject invalid location_id", () => {
      const result = MetaMediaCreateRequestSchema.safeParse({
        media_type: "IMAGE",
        location_id: "abc",
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("location_id"))
      ).toBe(true);
    });

    it("should reject location_id exceeding max length", () => {
      const result = MetaMediaCreateRequestSchema.safeParse({
        media_type: "IMAGE",
        location_id: "1".repeat(20),
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("location_id"))
      ).toBe(true);
    });

    it("should reject user_tags exceeding max count", () => {
      const result = MetaMediaCreateRequestSchema.safeParse({
        media_type: "IMAGE",
        user_tags: Array(21).fill({ username: "user" }),
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("user_tags"))
      ).toBe(true);
    });

    it("should reject user_tag with invalid x coordinate", () => {
      const result = MetaMediaCreateRequestSchema.safeParse({
        media_type: "IMAGE",
        user_tags: [{ username: "user", x: 1.5 }],
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("user_tags"))
      ).toBe(true);
    });

    it("should reject user_tag with invalid y coordinate", () => {
      const result = MetaMediaCreateRequestSchema.safeParse({
        media_type: "IMAGE",
        user_tags: [{ username: "user", y: -0.1 }],
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("user_tags"))
      ).toBe(true);
    });

    it("should reject collaborators exceeding max count", () => {
      const result = MetaMediaCreateRequestSchema.safeParse({
        media_type: "IMAGE",
        collaborators: ["a", "b", "c", "d"],
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("collaborators"))
      ).toBe(true);
    });

    it("should reject empty collaborator string", () => {
      const result = MetaMediaCreateRequestSchema.safeParse({
        media_type: "IMAGE",
        collaborators: [""],
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("collaborators"))
      ).toBe(true);
    });

    it("should accept all valid media types", () => {
      const types = ["REELS", "VIDEO", "IMAGE", "CAROUSEL"] as const;
      for (const media_type of types) {
        const result = MetaMediaCreateRequestSchema.safeParse({ media_type });
        expect(result.success).toBe(true);
      }
    });
  });

  describe("media publish schema", () => {
    it("should validate with required creation_id", () => {
      const result = MetaMediaPublishRequestSchema.safeParse({
        creation_id: "123456789",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing creation_id", () => {
      const result = MetaMediaPublishRequestSchema.safeParse({});
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("creation_id"))
      ).toBe(true);
    });

    it("should reject invalid creation_id", () => {
      const result = MetaMediaPublishRequestSchema.safeParse({
        creation_id: "abc",
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("creation_id"))
      ).toBe(true);
    });

    it("should reject creation_id exceeding max length", () => {
      const result = MetaMediaPublishRequestSchema.safeParse({
        creation_id: "1".repeat(20),
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("creation_id"))
      ).toBe(true);
    });

    it("should reject null payload", () => {
      const result = MetaMediaPublishRequestSchema.safeParse(null);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should reject undefined payload", () => {
      const result = MetaMediaPublishRequestSchema.safeParse(undefined);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });
  });
});
