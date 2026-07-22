import { describe, it, expect } from "vitest";

// Helper functions
import {
  textBlock,
  imageBase64,
  imageUrl,
} from "../../packages/provider/kimicoding/src/kimicoding";

// Types for verification
import type {
  TextContentBlock,
  ImageContentBlock,
} from "../../packages/provider/kimicoding/src/types";

describe("kimicoding helpers", () => {
  describe("textBlock", () => {
    it("should create a text content block", () => {
      const result = textBlock("Hello world");

      expect(result).toEqual({
        type: "text",
        text: "Hello world",
      });
    });

    it("should create a text block with empty string", () => {
      const result = textBlock("");

      expect(result).toEqual({
        type: "text",
        text: "",
      });
    });

    it("should create a text block with special characters", () => {
      const text = "Hello! @#$%^&*()\n\t😀";
      const result = textBlock(text);

      expect(result).toEqual({
        type: "text",
        text: "Hello! @#$%^&*()\n\t😀",
      });
    });

    it("should create a text block with long text", () => {
      const longText = "a".repeat(10000);
      const result = textBlock(longText);

      expect(result).toEqual({
        type: "text",
        text: longText,
      });
    });

    it("should create a text block with multiline text", () => {
      const multilineText = `Line 1
Line 2
Line 3`;
      const result = textBlock(multilineText);

      expect(result).toEqual({
        type: "text",
        text: multilineText,
      });
    });

    it("should return correct type for text block", () => {
      const result = textBlock("test");

      // Type verification
      const typedResult: TextContentBlock = result;
      expect(typedResult.type).toBe("text");
      expect(typeof typedResult.text).toBe("string");
    });
  });

  describe("imageBase64", () => {
    it("should create an image block with base64 data (jpeg)", () => {
      const base64Data = "/9j/4AAQSkZJRgABAQEASABIAAD";
      const result = imageBase64(base64Data, "image/jpeg");

      expect(result).toEqual({
        type: "image",
        source: {
          type: "base64",
          media_type: "image/jpeg",
          data: base64Data,
        },
      });
    });

    it("should create an image block with base64 data (png)", () => {
      const base64Data =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
      const result = imageBase64(base64Data, "image/png");

      expect(result).toEqual({
        type: "image",
        source: {
          type: "base64",
          media_type: "image/png",
          data: base64Data,
        },
      });
    });

    it("should create an image block with base64 data (gif)", () => {
      const base64Data =
        "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
      const result = imageBase64(base64Data, "image/gif");

      expect(result).toEqual({
        type: "image",
        source: {
          type: "base64",
          media_type: "image/gif",
          data: base64Data,
        },
      });
    });

    it("should create an image block with base64 data (webp)", () => {
      const base64Data =
        "UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA";
      const result = imageBase64(base64Data, "image/webp");

      expect(result).toEqual({
        type: "image",
        source: {
          type: "base64",
          media_type: "image/webp",
          data: base64Data,
        },
      });
    });

    it("should create an image block with empty base64 data", () => {
      const result = imageBase64("", "image/png");

      expect(result).toEqual({
        type: "image",
        source: {
          type: "base64",
          media_type: "image/png",
          data: "",
        },
      });
    });

    it("should create an image block with large base64 data", () => {
      const largeData = "A".repeat(100000);
      const result = imageBase64(largeData, "image/jpeg");

      if (result.source.type !== "base64") {
        throw new Error("expected base64 source");
      }
      expect(result.source.data).toBe(largeData);
      expect(result.source.data).toHaveLength(100000);
    });

    it("should return correct type for image base64 block", () => {
      const result = imageBase64("data", "image/png");

      // Type verification
      const typedResult: ImageContentBlock = result;
      expect(typedResult.type).toBe("image");
      expect(typedResult.source.type).toBe("base64");
    });
  });

  describe("imageUrl", () => {
    it("should create an image block from URL", () => {
      const url = "https://example.com/image.png";
      const result = imageUrl(url);

      expect(result).toEqual({
        type: "image",
        source: {
          type: "url",
          url: "https://example.com/image.png",
        },
      });
    });

    it("should create an image block from HTTP URL", () => {
      const url = "http://example.com/image.jpg";
      const result = imageUrl(url);

      expect(result).toEqual({
        type: "image",
        source: {
          type: "url",
          url: "http://example.com/image.jpg",
        },
      });
    });

    it("should create an image block from URL with query parameters", () => {
      const url = "https://example.com/image.png?w=800&h=600&format=webp";
      const result = imageUrl(url);

      expect(result).toEqual({
        type: "image",
        source: {
          type: "url",
          url: "https://example.com/image.png?w=800&h=600&format=webp",
        },
      });
    });

    it("should create an image block from URL with fragment", () => {
      const url = "https://example.com/image.png#section";
      const result = imageUrl(url);

      expect(result).toEqual({
        type: "image",
        source: {
          type: "url",
          url: "https://example.com/image.png#section",
        },
      });
    });

    it("should create an image block from data URL", () => {
      const dataUrl = "data:image/png;base64,iVBORw0KGgo=";
      const result = imageUrl(dataUrl);

      expect(result).toEqual({
        type: "image",
        source: {
          type: "url",
          url: dataUrl,
        },
      });
    });

    it("should create an image block from S3 URL", () => {
      const url =
        "https://s3.amazonaws.com/bucket/image.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256";
      const result = imageUrl(url);

      expect(result).toEqual({
        type: "image",
        source: {
          type: "url",
          url: url,
        },
      });
    });

    it("should return correct type for image URL block", () => {
      const result = imageUrl("https://example.com/img.png");

      // Type verification
      const typedResult: ImageContentBlock = result;
      expect(typedResult.type).toBe("image");
      expect(typedResult.source.type).toBe("url");
    });
  });

  describe("helper integration", () => {
    it("should work together to create a multi-modal message", () => {
      const text = textBlock("Describe this image:");
      const image = imageUrl("https://example.com/photo.jpg");

      // Simulate message content array
      const content = [text, image];

      expect(content).toHaveLength(2);
      expect(content[0].type).toBe("text");
      expect(content[1].type).toBe("image");
    });

    it("should support multiple images in a message", () => {
      const images = [
        imageUrl("https://example.com/img1.jpg"),
        imageBase64("base64data1", "image/png"),
        imageUrl("https://example.com/img2.jpg"),
      ];

      expect(images).toHaveLength(3);
      expect(images[0].source.type).toBe("url");
      expect(images[1].source.type).toBe("base64");
      expect(images[2].source.type).toBe("url");
    });

    it("should preserve exact text content", () => {
      const testCases = [
        "Simple text",
        'Text with "quotes"',
        "Text with 'apostrophes'",
        "Text with <html> tags",
        "Text with {braces} and [brackets]",
        "Unicode: 你好世界 🌍 émojis",
        "Special: \n\r\t\\",
        "Numbers: 123 45.67 -89",
        "",
      ];

      testCases.forEach((text) => {
        const result = textBlock(text);
        expect(result.text).toBe(text);
      });
    });
  });
});
