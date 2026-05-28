import { describe, it, expect } from "vitest";
import {
  YouTubeOptionsSchema,
  YouTubeChannelsListRequestSchema,
  YouTubeVideoSnippetInputSchema,
  YouTubeVideoStatusInputSchema,
  YouTubeRecordingDetailsInputSchema,
  YouTubeLocalizationsInputSchema,
  YouTubeVideosInsertRequestSchema,
  YouTubeGetTranscriptRequestSchema,
  YouTubeGetVideoMetadataRequestSchema,
} from "../../packages/provider/youtube/src/zod";

describe("YouTube Zod schemas", () => {
  describe("YouTubeOptionsSchema", () => {
    it("accepts valid options with all fields", () => {
      const result = YouTubeOptionsSchema.safeParse({
        accessToken: "token123",
        baseURL: "https://custom.example.com",
        timeout: 5000,
        fetch: globalThis.fetch,
      });
      expect(result.success).toBe(true);
    });

    it("accepts empty options", () => {
      const result = YouTubeOptionsSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("rejects invalid timeout type", () => {
      const result = YouTubeOptionsSchema.safeParse({
        timeout: "not-a-number",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("YouTubeChannelsListRequestSchema", () => {
    it("accepts valid request", () => {
      const result = YouTubeChannelsListRequestSchema.safeParse({
        part: "snippet,contentDetails",
        id: "UC123",
        maxResults: 10,
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing required part", () => {
      const result = YouTubeChannelsListRequestSchema.safeParse({
        id: "UC123",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty part", () => {
      const result = YouTubeChannelsListRequestSchema.safeParse({
        part: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects maxResults below 1", () => {
      const result = YouTubeChannelsListRequestSchema.safeParse({
        part: "snippet",
        maxResults: 0,
      });
      expect(result.success).toBe(false);
    });

    it("rejects maxResults above 50", () => {
      const result = YouTubeChannelsListRequestSchema.safeParse({
        part: "snippet",
        maxResults: 51,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("YouTubeVideoSnippetInputSchema", () => {
    it("accepts valid snippet", () => {
      const result = YouTubeVideoSnippetInputSchema.safeParse({
        title: "My Video",
        description: "A description",
        tags: ["tag1", "tag2"],
        categoryId: "22",
        defaultLanguage: "en",
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing title", () => {
      const result = YouTubeVideoSnippetInputSchema.safeParse({
        description: "A description",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty title", () => {
      const result = YouTubeVideoSnippetInputSchema.safeParse({
        title: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("YouTubeVideoStatusInputSchema", () => {
    it("accepts valid status", () => {
      const result = YouTubeVideoStatusInputSchema.safeParse({
        privacyStatus: "public",
        license: "youtube",
        embeddable: true,
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid privacyStatus", () => {
      const result = YouTubeVideoStatusInputSchema.safeParse({
        privacyStatus: "secret",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid license", () => {
      const result = YouTubeVideoStatusInputSchema.safeParse({
        license: "proprietary",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("YouTubeRecordingDetailsInputSchema", () => {
    it("accepts valid recording details", () => {
      const result = YouTubeRecordingDetailsInputSchema.safeParse({
        recordingDate: "2024-01-01T00:00:00Z",
      });
      expect(result.success).toBe(true);
    });

    it("accepts empty object", () => {
      const result = YouTubeRecordingDetailsInputSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe("YouTubeLocalizationsInputSchema", () => {
    it("accepts valid localizations", () => {
      const result = YouTubeLocalizationsInputSchema.safeParse({
        en: { title: "English Title", description: "English Desc" },
        es: { title: "Spanish Title" },
      });
      expect(result.success).toBe(true);
    });

    it("rejects localization without required title", () => {
      const result = YouTubeLocalizationsInputSchema.safeParse({
        en: { description: "Missing title" },
      });
      expect(result.success).toBe(false);
    });
  });

  describe("YouTubeVideosInsertRequestSchema", () => {
    it("accepts valid request with video", () => {
      const result = YouTubeVideosInsertRequestSchema.safeParse({
        snippet: { title: "My Video" },
        video: new Blob(["video-data"], { type: "video/mp4" }),
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing video", () => {
      const result = YouTubeVideosInsertRequestSchema.safeParse({
        snippet: { title: "My Video" },
      });
      expect(result.success).toBe(false);
    });

    it("rejects non-blob video", () => {
      const result = YouTubeVideosInsertRequestSchema.safeParse({
        snippet: { title: "My Video" },
        video: "not-a-blob",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("YouTubeGetTranscriptRequestSchema", () => {
    it("accepts valid request", () => {
      const result = YouTubeGetTranscriptRequestSchema.safeParse({
        videoId: "dQw4w9WgXcQ",
        lang: "en",
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing videoId", () => {
      const result = YouTubeGetTranscriptRequestSchema.safeParse({
        lang: "en",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty videoId", () => {
      const result = YouTubeGetTranscriptRequestSchema.safeParse({
        videoId: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("YouTubeGetVideoMetadataRequestSchema", () => {
    it("accepts valid request", () => {
      const result = YouTubeGetVideoMetadataRequestSchema.safeParse({
        videoId: "dQw4w9WgXcQ",
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing videoId", () => {
      const result = YouTubeGetVideoMetadataRequestSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("rejects empty videoId", () => {
      const result = YouTubeGetVideoMetadataRequestSchema.safeParse({
        videoId: "",
      });
      expect(result.success).toBe(false);
    });
  });
});
