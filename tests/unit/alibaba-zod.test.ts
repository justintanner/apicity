import { describe, it, expect } from "vitest";

import {
  AlibabaChatRequestSchema,
  AlibabaVideoSynthesisModelSchema,
  AlibabaVideoSynthesisRequestObjectSchema,
  AlibabaVideoSynthesisRequestSchema,
  AlibabaImageGenerationRequestSchema,
  AlibabaQwenImageGenerationModelSchema,
  AlibabaQwenImageEditModelSchema,
  AlibabaQwenImageGenerationSlotsSchema,
  AlibabaQwenImageEditSlotsSchema,
  AlibabaMultimodalGenerationRequestSchema,
  AlibabaOptionsSchema,
} from "../../packages/provider/alibaba/src/zod";
import {
  AlibabaVideoSynthesisModelSchema as PublicAlibabaVideoSynthesisModelSchema,
  AlibabaVideoSynthesisRequestObjectSchema as PublicAlibabaVideoSynthesisRequestObjectSchema,
} from "../../packages/provider/alibaba/src/index";

describe("Alibaba Zod schema validation", () => {
  describe("null and undefined handling", () => {
    it("should reject null payload for chat", () => {
      const result = AlibabaChatRequestSchema.safeParse(null);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should reject undefined payload for chat", () => {
      const result = AlibabaChatRequestSchema.safeParse(undefined);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should reject array as payload for chat", () => {
      const result = AlibabaChatRequestSchema.safeParse([]);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should reject string as payload for chat", () => {
      const result = AlibabaChatRequestSchema.safeParse("string");
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should reject number as payload for chat", () => {
      const result = AlibabaChatRequestSchema.safeParse(123);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });
  });

  describe("AlibabaChatRequestSchema", () => {
    it("should accept minimal valid chat request", () => {
      const result = AlibabaChatRequestSchema.safeParse({
        model: "qwen-turbo",
        messages: [{ role: "user", content: "Hello" }],
      });
      expect(result.success).toBe(true);
    });

    it("should accept chat request with all optional fields", () => {
      const result = AlibabaChatRequestSchema.safeParse({
        model: "qwen-plus",
        messages: [
          { role: "system", content: "Be helpful" },
          { role: "user", content: [{ type: "text", text: "Hi" }] },
          {
            role: "assistant",
            content: "Hello!",
            tool_calls: [
              {
                id: "call_1",
                type: "function",
                function: { name: "get_weather", arguments: "{}" },
              },
            ],
          },
        ],
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 512,
        n: 1,
        stop: ["end"],
        stream: true,
        seed: 42,
        presence_penalty: 0.5,
        tools: [
          {
            type: "function",
            function: {
              name: "get_weather",
              description: "Get weather",
              parameters: { type: "object" },
            },
          },
        ],
        tool_choice: "auto",
        stream_options: { include_usage: true },
        response_format: { type: "json_object" },
        enable_search: true,
      });
      expect(result.success).toBe(true);
    });

    it("should reject chat request missing model", () => {
      const result = AlibabaChatRequestSchema.safeParse({
        messages: [{ role: "user", content: "Hello" }],
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("model"))).toBe(
        true
      );
    });

    it("should reject chat request missing messages", () => {
      const result = AlibabaChatRequestSchema.safeParse({
        model: "qwen-turbo",
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("messages"))
      ).toBe(true);
    });

    it("should reject invalid message role", () => {
      const result = AlibabaChatRequestSchema.safeParse({
        model: "qwen-turbo",
        messages: [{ role: "bot", content: "Hello" }],
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should reject invalid tool type", () => {
      const result = AlibabaChatRequestSchema.safeParse({
        model: "qwen-turbo",
        messages: [{ role: "user", content: "Hello" }],
        tools: [
          {
            type: "invalid",
            function: { name: "test" },
          },
        ],
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should reject invalid content part type", () => {
      const result = AlibabaChatRequestSchema.safeParse({
        model: "qwen-turbo",
        messages: [
          {
            role: "user",
            content: [{ type: "video", url: "http://example.com" }],
          },
        ],
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should accept image_url content part", () => {
      const result = AlibabaChatRequestSchema.safeParse({
        model: "qwen-vl",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: "https://example.com/img.jpg",
                  detail: "high",
                },
              },
              { type: "text", text: "Describe this" },
            ],
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("should reject string where number expected for temperature", () => {
      const result = AlibabaChatRequestSchema.safeParse({
        model: "qwen-turbo",
        messages: [{ role: "user", content: "Hello" }],
        temperature: "hot",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should accept empty messages array", () => {
      const result = AlibabaChatRequestSchema.safeParse({
        model: "qwen-turbo",
        messages: [],
      });
      expect(result.success).toBe(true);
    });
  });

  describe("AlibabaVideoSynthesisRequestSchema", () => {
    it("should expose video model options without unwrapping refinements", () => {
      expect(AlibabaVideoSynthesisModelSchema.options).toEqual([
        "wan2.7-i2v",
        "wan2.7-videoedit",
      ]);
      expect(PublicAlibabaVideoSynthesisModelSchema.options).toEqual(
        AlibabaVideoSynthesisModelSchema.options
      );

      const shape = AlibabaVideoSynthesisRequestObjectSchema.shape;
      expect(Object.keys(shape)).toEqual(["model", "input", "parameters"]);
      expect(shape.model).toBe(AlibabaVideoSynthesisModelSchema);
      expect(PublicAlibabaVideoSynthesisRequestObjectSchema.shape.model).toBe(
        AlibabaVideoSynthesisModelSchema
      );
    });

    it("should keep media and duration business rules on the refined schema", () => {
      const invalidI2vMedia = {
        model: "wan2.7-i2v",
        input: {
          media: [{ type: "video", url: "https://example.com/vid.mp4" }],
        },
      };
      const invalidVideoEditDuration = {
        model: "wan2.7-videoedit",
        input: {
          media: [{ type: "video", url: "https://example.com/vid.mp4" }],
        },
        parameters: { duration: 12 },
      };

      expect(
        AlibabaVideoSynthesisRequestObjectSchema.safeParse(invalidI2vMedia)
          .success
      ).toBe(true);
      expect(
        AlibabaVideoSynthesisRequestSchema.safeParse(invalidI2vMedia).success
      ).toBe(false);
      expect(
        AlibabaVideoSynthesisRequestObjectSchema.safeParse(
          invalidVideoEditDuration
        ).success
      ).toBe(true);
      expect(
        AlibabaVideoSynthesisRequestSchema.safeParse(invalidVideoEditDuration)
          .success
      ).toBe(false);
    });

    it("should accept valid wan2.7-i2v request with first_frame", () => {
      const result = AlibabaVideoSynthesisRequestSchema.safeParse({
        model: "wan2.7-i2v",
        input: {
          prompt: "A cat playing",
          media: [{ type: "first_frame", url: "https://example.com/img.jpg" }],
        },
        parameters: {
          resolution: "720P",
          duration: 5,
          seed: 123,
        },
      });
      expect(result.success).toBe(true);
    });

    it("should accept valid wan2.7-i2v request with last_frame", () => {
      const result = AlibabaVideoSynthesisRequestSchema.safeParse({
        model: "wan2.7-i2v",
        input: {
          media: [{ type: "last_frame", url: "https://example.com/img.jpg" }],
        },
      });
      expect(result.success).toBe(true);
    });

    it("should accept valid wan2.7-i2v request with first_clip", () => {
      const result = AlibabaVideoSynthesisRequestSchema.safeParse({
        model: "wan2.7-i2v",
        input: {
          media: [{ type: "first_clip", url: "https://example.com/clip.mp4" }],
        },
      });
      expect(result.success).toBe(true);
    });

    it("should reject wan2.7-i2v with video type", () => {
      const result = AlibabaVideoSynthesisRequestSchema.safeParse({
        model: "wan2.7-i2v",
        input: {
          media: [{ type: "video", url: "https://example.com/vid.mp4" }],
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("media"))).toBe(
        true
      );
    });

    it("should reject wan2.7-i2v with reference_image", () => {
      const result = AlibabaVideoSynthesisRequestSchema.safeParse({
        model: "wan2.7-i2v",
        input: {
          media: [
            { type: "first_frame", url: "https://example.com/img.jpg" },
            { type: "reference_image", url: "https://example.com/ref.jpg" },
          ],
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("media"))).toBe(
        true
      );
    });

    it("should reject wan2.7-i2v with first_clip and first_frame combined", () => {
      const result = AlibabaVideoSynthesisRequestSchema.safeParse({
        model: "wan2.7-i2v",
        input: {
          media: [
            { type: "first_clip", url: "https://example.com/clip.mp4" },
            { type: "first_frame", url: "https://example.com/img.jpg" },
          ],
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("media"))).toBe(
        true
      );
    });

    it("should reject wan2.7-i2v without required media types", () => {
      const result = AlibabaVideoSynthesisRequestSchema.safeParse({
        model: "wan2.7-i2v",
        input: {
          media: [
            { type: "driving_audio", url: "https://example.com/audio.mp3" },
          ],
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("media"))).toBe(
        true
      );
    });

    it("should reject duplicate non-reference media types", () => {
      const result = AlibabaVideoSynthesisRequestSchema.safeParse({
        model: "wan2.7-i2v",
        input: {
          media: [
            { type: "first_frame", url: "https://example.com/img1.jpg" },
            { type: "first_frame", url: "https://example.com/img2.jpg" },
          ],
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("media"))).toBe(
        true
      );
    });

    it("should accept valid wan2.7-videoedit request", () => {
      const result = AlibabaVideoSynthesisRequestSchema.safeParse({
        model: "wan2.7-videoedit",
        input: {
          prompt: "Make it blue",
          media: [
            { type: "video", url: "https://example.com/vid.mp4" },
            { type: "reference_image", url: "https://example.com/ref1.jpg" },
          ],
        },
        parameters: {
          ratio: "16:9",
          duration: 8,
          audio_setting: "auto",
        },
      });
      expect(result.success).toBe(true);
    });

    it("should reject wan2.7-videoedit without video", () => {
      const result = AlibabaVideoSynthesisRequestSchema.safeParse({
        model: "wan2.7-videoedit",
        input: {
          media: [
            { type: "reference_image", url: "https://example.com/ref.jpg" },
          ],
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("media"))).toBe(
        true
      );
    });

    it("should reject wan2.7-videoedit with more than one video", () => {
      const result = AlibabaVideoSynthesisRequestSchema.safeParse({
        model: "wan2.7-videoedit",
        input: {
          media: [
            { type: "video", url: "https://example.com/vid1.mp4" },
            { type: "video", url: "https://example.com/vid2.mp4" },
          ],
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("media"))).toBe(
        true
      );
    });

    it("should reject wan2.7-videoedit with more than 4 reference images", () => {
      const result = AlibabaVideoSynthesisRequestSchema.safeParse({
        model: "wan2.7-videoedit",
        input: {
          media: [
            { type: "video", url: "https://example.com/vid.mp4" },
            { type: "reference_image", url: "https://example.com/ref1.jpg" },
            { type: "reference_image", url: "https://example.com/ref2.jpg" },
            { type: "reference_image", url: "https://example.com/ref3.jpg" },
            { type: "reference_image", url: "https://example.com/ref4.jpg" },
            { type: "reference_image", url: "https://example.com/ref5.jpg" },
          ],
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("media"))).toBe(
        true
      );
    });

    it("should reject wan2.7-videoedit with invalid media type", () => {
      const result = AlibabaVideoSynthesisRequestSchema.safeParse({
        model: "wan2.7-videoedit",
        input: {
          media: [
            { type: "video", url: "https://example.com/vid.mp4" },
            { type: "first_frame", url: "https://example.com/img.jpg" },
          ],
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("media"))).toBe(
        true
      );
    });

    it("should reject wan2.7-videoedit with duration > 10", () => {
      const result = AlibabaVideoSynthesisRequestSchema.safeParse({
        model: "wan2.7-videoedit",
        input: {
          media: [{ type: "video", url: "https://example.com/vid.mp4" }],
        },
        parameters: { duration: 12 },
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("duration"))
      ).toBe(true);
    });

    it("should reject ratio on wan2.7-i2v", () => {
      const result = AlibabaVideoSynthesisRequestSchema.safeParse({
        model: "wan2.7-i2v",
        input: {
          media: [{ type: "first_frame", url: "https://example.com/img.jpg" }],
        },
        parameters: { ratio: "16:9" },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("ratio"))).toBe(
        true
      );
    });

    it("should reject audio_setting on wan2.7-i2v", () => {
      const result = AlibabaVideoSynthesisRequestSchema.safeParse({
        model: "wan2.7-i2v",
        input: {
          media: [{ type: "first_frame", url: "https://example.com/img.jpg" }],
        },
        parameters: { audio_setting: "auto" },
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("audio_setting"))
      ).toBe(true);
    });

    it("should reject invalid model", () => {
      const result = AlibabaVideoSynthesisRequestSchema.safeParse({
        model: "invalid-model",
        input: {
          media: [{ type: "video", url: "https://example.com/vid.mp4" }],
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });
  });

  describe("AlibabaImageGenerationRequestSchema", () => {
    it("should accept valid image generation request", () => {
      const result = AlibabaImageGenerationRequestSchema.safeParse({
        model: "wan2.7-image-pro",
        input: {
          messages: [
            {
              role: "user",
              content: [{ text: "A beautiful landscape" }],
            },
          ],
        },
        parameters: {
          size: "2K",
          n: 4,
          seed: 42,
        },
      });
      expect(result.success).toBe(true);
    });

    it("should accept valid image generation request with custom size", () => {
      const result = AlibabaImageGenerationRequestSchema.safeParse({
        model: "wan2.7-image",
        input: {
          messages: [
            {
              role: "user",
              content: [
                { text: "A portrait" },
                { image: "https://example.com/ref.jpg" },
              ],
            },
          ],
        },
        parameters: {
          size: "1024*1024",
          n: 1,
          color_palette: [
            { hex: "#FF0000", ratio: "0.3" },
            { hex: "#00FF00", ratio: "0.3" },
            { hex: "#0000FF", ratio: "0.4" },
          ],
        },
      });
      expect(result.success).toBe(true);
    });

    it("should reject image generation with invalid model", () => {
      const result = AlibabaImageGenerationRequestSchema.safeParse({
        model: "invalid-model",
        input: {
          messages: [
            {
              role: "user",
              content: [{ text: "A landscape" }],
            },
          ],
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should reject image generation with wrong message role", () => {
      const result = AlibabaImageGenerationRequestSchema.safeParse({
        model: "wan2.7-image",
        input: {
          messages: [
            {
              role: "assistant",
              content: [{ text: "A landscape" }],
            },
          ],
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should reject image generation with more than one message", () => {
      const result = AlibabaImageGenerationRequestSchema.safeParse({
        model: "wan2.7-image",
        input: {
          messages: [
            { role: "user", content: [{ text: "A" }] },
            { role: "user", content: [{ text: "B" }] },
          ],
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should reject n > 12", () => {
      const result = AlibabaImageGenerationRequestSchema.safeParse({
        model: "wan2.7-image",
        input: {
          messages: [{ role: "user", content: [{ text: "A landscape" }] }],
        },
        parameters: { n: 13 },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should reject invalid size format", () => {
      const result = AlibabaImageGenerationRequestSchema.safeParse({
        model: "wan2.7-image",
        input: {
          messages: [{ role: "user", content: [{ text: "A landscape" }] }],
        },
        parameters: { size: "invalid" },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should reject color palette with too few items", () => {
      const result = AlibabaImageGenerationRequestSchema.safeParse({
        model: "wan2.7-image",
        input: {
          messages: [{ role: "user", content: [{ text: "A landscape" }] }],
        },
        parameters: {
          color_palette: [{ hex: "#FF0000", ratio: "1.0" }],
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should reject color palette with too many items", () => {
      const result = AlibabaImageGenerationRequestSchema.safeParse({
        model: "wan2.7-image",
        input: {
          messages: [{ role: "user", content: [{ text: "A landscape" }] }],
        },
        parameters: {
          color_palette: Array.from({ length: 11 }, (_, _i) => ({
            hex: "#FF0000",
            ratio: "0.1",
          })),
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });
  });

  describe("AlibabaMultimodalGenerationRequestSchema", () => {
    it("should expose separate qwen generation and edit model sets", () => {
      expect(AlibabaQwenImageGenerationModelSchema.options).toEqual([
        "qwen-image-2.0-pro",
        "qwen-image-2.0-pro-2026-03-03",
        "qwen-image-2.0",
        "qwen-image-2.0-2026-03-03",
      ]);
      expect(AlibabaQwenImageEditModelSchema.options).toEqual([
        "qwen-image-edit-max",
        "qwen-image-edit-max-2026-01-16",
        "qwen-image-edit-plus",
        "qwen-image-edit-plus-2025-12-15",
        "qwen-image-edit-plus-2025-10-30",
        "qwen-image-edit",
      ]);
    });

    it("should expose qwen generation and edit slot limits", () => {
      expect(
        AlibabaQwenImageGenerationSlotsSchema.safeParse({
          text: ["Draw a lantern"],
          images: [],
        }).success
      ).toBe(true);
      expect(
        AlibabaQwenImageGenerationSlotsSchema.safeParse({
          text: ["Draw a lantern"],
          images: ["1", "2", "3", "4"],
        }).success
      ).toBe(false);
      expect(
        AlibabaQwenImageEditSlotsSchema.safeParse({
          text: ["Make it blue"],
          images: ["1"],
        }).success
      ).toBe(true);
      expect(
        AlibabaQwenImageEditSlotsSchema.safeParse({
          text: ["Make it blue"],
          images: [],
        }).success
      ).toBe(false);
      expect(
        AlibabaQwenImageEditSlotsSchema.safeParse({
          text: ["First", "Second"],
          images: ["1"],
        }).success
      ).toBe(false);
    });

    it("should accept valid qwen-image-2.0-pro request", () => {
      const result = AlibabaMultimodalGenerationRequestSchema.safeParse({
        model: "qwen-image-2.0-pro",
        input: {
          messages: [
            {
              role: "user",
              content: [
                { text: "Make it blue" },
                { image: "https://example.com/img.jpg" },
              ],
            },
          ],
        },
        parameters: {
          n: 3,
          size: "1024x1024",
          seed: 42,
        },
      });
      expect(result.success).toBe(true);
    });

    it("should accept qwen-image generation with no images", () => {
      const result = AlibabaMultimodalGenerationRequestSchema.safeParse({
        model: "qwen-image-2.0",
        input: {
          messages: [
            {
              role: "user",
              content: [{ text: "A watercolor koi pond" }],
            },
          ],
        },
      });
      expect(result.success).toBe(true);
    });

    it("should accept dated qwen-image generation snapshot IDs", () => {
      const result = AlibabaMultimodalGenerationRequestSchema.safeParse({
        model: "qwen-image-2.0-pro-2026-03-03",
        input: {
          messages: [
            {
              role: "user",
              content: [{ text: "A cyberpunk storefront" }],
            },
          ],
        },
      });
      expect(result.success).toBe(true);
    });

    it("should accept valid qwen-image-edit request", () => {
      const result = AlibabaMultimodalGenerationRequestSchema.safeParse({
        model: "qwen-image-edit",
        input: {
          messages: [
            {
              role: "user",
              content: [
                { text: "Remove the background" },
                { image: "https://example.com/img.jpg" },
              ],
            },
          ],
        },
      });
      expect(result.success).toBe(true);
    });

    it("should accept dated qwen-image-edit snapshot IDs with images", () => {
      const result = AlibabaMultimodalGenerationRequestSchema.safeParse({
        model: "qwen-image-edit-plus-2025-12-15",
        input: {
          messages: [
            {
              role: "user",
              content: [
                { text: "Replace the sign text" },
                { image: "https://example.com/img.jpg" },
              ],
            },
          ],
        },
      });
      expect(result.success).toBe(true);
    });

    it("should accept 3 images for qwen-image-edit models", () => {
      const result = AlibabaMultimodalGenerationRequestSchema.safeParse({
        model: "qwen-image-edit-max",
        input: {
          messages: [
            {
              role: "user",
              content: [
                { text: "Blend these references" },
                { image: "https://example.com/img1.jpg" },
                { image: "https://example.com/img2.jpg" },
                { image: "https://example.com/img3.jpg" },
              ],
            },
          ],
        },
      });
      expect(result.success).toBe(true);
    });

    it("should reject qwen-image-edit without image", () => {
      const result = AlibabaMultimodalGenerationRequestSchema.safeParse({
        model: "qwen-image-edit",
        input: {
          messages: [
            {
              role: "user",
              content: [{ text: "Remove the background" }],
            },
          ],
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("content"))).toBe(
        true
      );
    });

    it("should reject qwen-image-edit with n > 1", () => {
      const result = AlibabaMultimodalGenerationRequestSchema.safeParse({
        model: "qwen-image-edit",
        input: {
          messages: [
            {
              role: "user",
              content: [
                { text: "Remove the background" },
                { image: "https://example.com/img.jpg" },
              ],
            },
          ],
        },
        parameters: { n: 2 },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("n"))).toBe(true);
    });

    it("should reject qwen-image-edit with custom size", () => {
      const result = AlibabaMultimodalGenerationRequestSchema.safeParse({
        model: "qwen-image-edit",
        input: {
          messages: [
            {
              role: "user",
              content: [
                { text: "Remove the background" },
                { image: "https://example.com/img.jpg" },
              ],
            },
          ],
        },
        parameters: { size: "1024x1024" },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("size"))).toBe(
        true
      );
    });

    it("should reject qwen-image-edit with prompt_extend", () => {
      const result = AlibabaMultimodalGenerationRequestSchema.safeParse({
        model: "qwen-image-edit",
        input: {
          messages: [
            {
              role: "user",
              content: [
                { text: "Remove the background" },
                { image: "https://example.com/img.jpg" },
              ],
            },
          ],
        },
        parameters: { prompt_extend: true },
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("prompt_extend"))
      ).toBe(true);
    });

    it("should reject more than 3 images in content", () => {
      const result = AlibabaMultimodalGenerationRequestSchema.safeParse({
        model: "qwen-image-2.0-pro",
        input: {
          messages: [
            {
              role: "user",
              content: [
                { text: "Make it blue" },
                { image: "https://example.com/img1.jpg" },
                { image: "https://example.com/img2.jpg" },
                { image: "https://example.com/img3.jpg" },
                { image: "https://example.com/img4.jpg" },
              ],
            },
          ],
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("content"))).toBe(
        true
      );
    });

    it("should reject more than 3 images for qwen-image-edit models", () => {
      const result = AlibabaMultimodalGenerationRequestSchema.safeParse({
        model: "qwen-image-edit-plus",
        input: {
          messages: [
            {
              role: "user",
              content: [
                { text: "Blend these references" },
                { image: "https://example.com/img1.jpg" },
                { image: "https://example.com/img2.jpg" },
                { image: "https://example.com/img3.jpg" },
                { image: "https://example.com/img4.jpg" },
              ],
            },
          ],
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("content"))).toBe(
        true
      );
    });

    it("should reject content with no text part", () => {
      const result = AlibabaMultimodalGenerationRequestSchema.safeParse({
        model: "qwen-image-2.0-pro",
        input: {
          messages: [
            {
              role: "user",
              content: [
                { image: "https://example.com/img1.jpg" },
                { image: "https://example.com/img2.jpg" },
              ],
            },
          ],
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("content"))).toBe(
        true
      );
    });

    it("should reject content with more than one text part", () => {
      const result = AlibabaMultimodalGenerationRequestSchema.safeParse({
        model: "qwen-image-2.0-pro",
        input: {
          messages: [
            {
              role: "user",
              content: [
                { text: "First" },
                { text: "Second" },
                { image: "https://example.com/img.jpg" },
              ],
            },
          ],
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("content"))).toBe(
        true
      );
    });

    it("should reject invalid model", () => {
      const result = AlibabaMultimodalGenerationRequestSchema.safeParse({
        model: "invalid-model",
        input: {
          messages: [
            {
              role: "user",
              content: [
                { text: "Hello" },
                { image: "https://example.com/img.jpg" },
              ],
            },
          ],
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });
  });

  describe("AlibabaOptionsSchema", () => {
    it("should accept minimal valid options", () => {
      const result = AlibabaOptionsSchema.safeParse({
        apiKey: "sk-test",
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty apiKey", () => {
      const result = AlibabaOptionsSchema.safeParse({
        apiKey: "",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should accept options with baseURL", () => {
      const result = AlibabaOptionsSchema.safeParse({
        apiKey: "sk-test",
        baseURL: "https://api.example.com",
        timeout: 30000,
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid baseURL", () => {
      const result = AlibabaOptionsSchema.safeParse({
        apiKey: "sk-test",
        baseURL: "not-a-url",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should reject negative timeout", () => {
      const result = AlibabaOptionsSchema.safeParse({
        apiKey: "sk-test",
        timeout: -1,
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });
  });
});
