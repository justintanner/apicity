import { describe, it, expect } from "vitest";

import {
  zodToJsonSchema,
  type JsonSchema,
} from "../../packages/mcp-server/src/schema";
import {
  AlibabaChatRequestSchema,
  AlibabaVideoSynthesisModelSchema,
  AlibabaVideoSynthesisRequestObjectSchema,
  AlibabaVideoSynthesisRequestSchema,
  AlibabaImageGenerationRequestSchema,
  AlibabaQwenImageGenerationModelSchema,
  AlibabaQwenImageGenerationStableModelSchema,
  AlibabaQwenImageEditModelSchema,
  AlibabaQwenImageEditStableModelSchema,
  AlibabaQwenImageModelSchema,
  AlibabaQwenImageStableModelSchema,
  AlibabaQwenImageGenerationSlotsSchema,
  AlibabaQwenImageEditSlotsSchema,
  AlibabaMultimodalGenerationRequestSchema,
  AlibabaOptionsSchema,
} from "../../packages/provider/alibaba/src/zod";
import {
  AlibabaVideoSynthesisModelSchema as PublicAlibabaVideoSynthesisModelSchema,
  AlibabaVideoSynthesisRequestObjectSchema as PublicAlibabaVideoSynthesisRequestObjectSchema,
} from "../../packages/provider/alibaba/src/index";

// The Wan and Qwen model enums are open: each is `z.enum([...]).or(<alias>)`,
// so `.options` yields branch *schemas* rather than id strings. The enumerated
// ids are read back out of the JSON Schema the MCP server emits instead, the
// same way tests/unit/elevenlabs-zod.test.ts pins its opened enum.
function enumBranchOf(schema: unknown): unknown[] {
  const branches = zodToJsonSchema(schema).anyOf as JsonSchema[];
  expect(branches).toHaveLength(2);
  // The second branch is the hatch; without it the enum would be closed.
  expect(branches[1].type).toBe("string");
  expect(branches[1].pattern).toBeDefined();
  return branches[0].enum as unknown[];
}

// The alias branch of an opened schema, read back as a RegExp so a test can
// ask what the hatch actually accepts.
function hatchPatternOf(schema: unknown): RegExp {
  const branches = zodToJsonSchema(schema).anyOf as JsonSchema[];
  expect(branches).toHaveLength(2);
  const pattern = branches[1].pattern;
  expect(typeof pattern).toBe("string");
  return new RegExp(pattern as string);
}

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
      expect(enumBranchOf(AlibabaVideoSynthesisModelSchema)).toEqual([
        "wan2.7-i2v",
        "wan2.7-videoedit",
      ]);
      expect(enumBranchOf(PublicAlibabaVideoSynthesisModelSchema)).toEqual(
        enumBranchOf(AlibabaVideoSynthesisModelSchema)
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
      ).toBe(false);
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

    it("should accept wan2.7-i2v request with negative prompt", () => {
      const result = AlibabaVideoSynthesisRequestSchema.safeParse({
        model: "wan2.7-i2v",
        input: {
          prompt: "A cat playing",
          negative_prompt: "low resolution, blurry",
          media: [{ type: "first_frame", url: "https://example.com/img.jpg" }],
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

    it("should reject wan2.7-i2v without media input", () => {
      const missingInput = AlibabaVideoSynthesisRequestSchema.safeParse({
        model: "wan2.7-i2v",
      });
      expect(missingInput.success).toBe(false);

      const missingMedia = AlibabaVideoSynthesisRequestSchema.safeParse({
        model: "wan2.7-i2v",
        input: { prompt: "hi" },
      });
      expect(missingMedia.success).toBe(false);
      expect(
        missingMedia.error?.issues.some((i) => i.path.includes("media"))
      ).toBe(true);

      const emptyMedia = AlibabaVideoSynthesisRequestSchema.safeParse({
        model: "wan2.7-i2v",
        input: {
          prompt: "hi",
          media: [],
        },
      });
      expect(emptyMedia.success).toBe(false);
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

    it("should reject legacy img_url video input", () => {
      const result = AlibabaVideoSynthesisRequestSchema.safeParse({
        model: "wan2.7-i2v",
        input: {
          prompt: "hi",
          img_url: "https://example.com/cat.jpg",
        },
      });
      expect(result.success).toBe(false);
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

    it("should reject wan2.7-videoedit without media input", () => {
      const result = AlibabaVideoSynthesisRequestSchema.safeParse({
        model: "wan2.7-videoedit",
        input: {
          prompt: "Convert the entire scene to a claymation style",
        },
        parameters: {
          resolution: "720P",
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

    it("should reject invalid wan2.7-i2v parameter bounds", () => {
      const resolution480 = AlibabaVideoSynthesisRequestSchema.safeParse({
        model: "wan2.7-i2v",
        input: {
          prompt: "hi",
          media: [{ type: "first_frame", url: "https://example.com/a.jpg" }],
        },
        parameters: { resolution: "480P" },
      });
      expect(resolution480.success).toBe(false);

      const durationOutOfRange = AlibabaVideoSynthesisRequestSchema.safeParse({
        model: "wan2.7-i2v",
        input: {
          prompt: "hi",
          media: [{ type: "first_frame", url: "https://example.com/a.jpg" }],
        },
        parameters: { duration: 20 },
      });
      expect(durationOutOfRange.success).toBe(false);

      const promptTooLong = AlibabaVideoSynthesisRequestSchema.safeParse({
        model: "wan2.7-i2v",
        input: {
          prompt: "a".repeat(5001),
          media: [{ type: "first_frame", url: "https://example.com/a.jpg" }],
        },
      });
      expect(promptTooLong.success).toBe(false);
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

    it("should accept prompt extension and validate negative prompt bounds", () => {
      const valid = AlibabaImageGenerationRequestSchema.safeParse({
        model: "wan2.7-image-pro",
        input: {
          messages: [{ role: "user", content: [{ text: "A cat" }] }],
        },
        parameters: {
          negative_prompt: "blurry, low quality, watermark",
          prompt_extend: true,
        },
      });
      expect(valid.success).toBe(true);

      const tooLong = AlibabaImageGenerationRequestSchema.safeParse({
        model: "wan2.7-image-pro",
        input: {
          messages: [{ role: "user", content: [{ text: "A cat" }] }],
        },
        parameters: {
          negative_prompt: "x".repeat(501),
        },
      });
      expect(tooLong.success).toBe(false);
    });

    it("should reject image generation missing input", () => {
      const result = AlibabaImageGenerationRequestSchema.safeParse({
        model: "wan2.7-image-pro",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("input"))).toBe(
        true
      );
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
      expect(enumBranchOf(AlibabaQwenImageGenerationModelSchema)).toEqual([
        "qwen-image-2.0-pro",
        "qwen-image-2.0-pro-2026-03-03",
        "qwen-image-2.0",
        "qwen-image-2.0-2026-03-03",
      ]);
      expect(enumBranchOf(AlibabaQwenImageEditModelSchema)).toEqual([
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

  // The Wan and Qwen model enums used to be closed, so an id upstream shipped
  // before this package caught up failed validation even though the API served
  // it. Each enum now carries a narrow per-family alias hatch. These pin the
  // three things a hatch has to do at once: keep every listed id valid, accept
  // a plausible unlisted id from the same family, and still reject near-miss
  // typos and ids belonging to another family.
  describe("model alias hatches", () => {
    const imageGenerationBase = {
      input: {
        messages: [{ role: "user", content: [{ text: "A koi pond" }] }],
      },
    };

    describe("AlibabaVideoSynthesisModelSchema", () => {
      it.each(["wan2.7-i2v", "wan2.7-videoedit"])(
        "accepts the listed id %j",
        (model) => {
          expect(
            AlibabaVideoSynthesisModelSchema.safeParse(model).success
          ).toBe(true);
        }
      );

      it.each(["wan3.0-i2v", "wan2.8-image-pro"])(
        "accepts the Wan alias %j",
        (model) => {
          expect(
            AlibabaVideoSynthesisModelSchema.safeParse(model).success
          ).toBe(true);
        }
      );

      it.each(["wan2.7", "wan-2.7-i2v", "wan2.7-", "qwen-image-2.0"])(
        "rejects %j",
        (model) => {
          expect(
            AlibabaVideoSynthesisModelSchema.safeParse(model).success
          ).toBe(false);
        }
      );
    });

    describe("AlibabaImageGenerationRequestSchema.model", () => {
      it.each(["wan2.7-image-pro", "wan2.7-image"])(
        "accepts the listed id %j",
        (model) => {
          expect(
            AlibabaImageGenerationRequestSchema.safeParse({
              ...imageGenerationBase,
              model,
            }).success
          ).toBe(true);
        }
      );

      it.each(["wan2.8-image-pro", "wan3.0-image"])(
        "accepts the Wan alias %j",
        (model) => {
          expect(
            AlibabaImageGenerationRequestSchema.safeParse({
              ...imageGenerationBase,
              model,
            }).success
          ).toBe(true);
        }
      );

      it.each(["wan2.7", "wan-2.7-image", "wan2.7-", "qwen-image-2.0"])(
        "rejects %j",
        (model) => {
          expect(
            AlibabaImageGenerationRequestSchema.safeParse({
              ...imageGenerationBase,
              model,
            }).success
          ).toBe(false);
        }
      );

      // Video synthesis and image generation are the same Wan family — the ids
      // differ only by task segment — so they deliberately share one alias
      // const rather than defining two identical ones. This is the only shared
      // alias in the provider; anything that widens it widens both endpoints,
      // which is why the sharing is pinned rather than left implicit.
      it("shares one Wan alias with the video synthesis enum", () => {
        expect(hatchPatternOf(AlibabaVideoSynthesisModelSchema).source).toBe(
          hatchPatternOf(AlibabaImageGenerationRequestSchema.shape.model).source
        );
      });
    });

    describe("AlibabaQwenImageGenerationModelSchema", () => {
      it.each([
        "qwen-image-2.0-pro",
        "qwen-image-2.0-pro-2026-03-03",
        "qwen-image-2.0",
        "qwen-image-2.0-2026-03-03",
      ])("accepts the listed id %j", (model) => {
        expect(
          AlibabaQwenImageGenerationModelSchema.safeParse(model).success
        ).toBe(true);
      });

      it.each(["qwen-image-3.0", "qwen-image-2.1-pro"])(
        "accepts the qwen-image alias %j",
        (model) => {
          expect(
            AlibabaQwenImageGenerationModelSchema.safeParse(model).success
          ).toBe(true);
        }
      );

      // `qwen-image-edit-max` is a real upstream id — just not a generation
      // one. Requiring a digit right after `qwen-image-` is what keeps the two
      // capability surfaces apart.
      it.each([
        "qwen-image-edit-max",
        "qwen-image",
        "qwen-image-pro",
        "wan2.7-image",
      ])("rejects %j", (model) => {
        expect(
          AlibabaQwenImageGenerationModelSchema.safeParse(model).success
        ).toBe(false);
      });
    });

    describe("AlibabaQwenImageEditModelSchema", () => {
      it.each([
        "qwen-image-edit-max",
        "qwen-image-edit-max-2026-01-16",
        "qwen-image-edit-plus",
        "qwen-image-edit-plus-2025-12-15",
        "qwen-image-edit-plus-2025-10-30",
        "qwen-image-edit",
      ])("accepts the listed id %j", (model) => {
        expect(AlibabaQwenImageEditModelSchema.safeParse(model).success).toBe(
          true
        );
      });

      it("accepts the qwen-image-edit alias qwen-image-edit-ultra", () => {
        expect(
          AlibabaQwenImageEditModelSchema.safeParse("qwen-image-edit-ultra")
            .success
        ).toBe(true);
      });

      it.each(["qwen-image-2.0", "qwen-image-editx", "qwen-image-edi"])(
        "rejects %j",
        (model) => {
          expect(AlibabaQwenImageEditModelSchema.safeParse(model).success).toBe(
            false
          );
        }
      );
    });

    // AlibabaQwenImageModelSchema is a union of the two enums above and has no
    // direct edit of its own — it opens purely as a consequence of them. Its
    // closed twin AlibabaQwenImageStableModelSchema is a union of the two
    // curated *stable* subsets and must stay closed for the same reason: an
    // alias there would readmit precisely the preview and dated-snapshot ids
    // those subsets exist to exclude.
    describe("union model schemas", () => {
      it.each(["qwen-image-3.0", "qwen-image-edit-ultra"])(
        "AlibabaQwenImageModelSchema opens transitively for %j",
        (model) => {
          expect(AlibabaQwenImageModelSchema.safeParse(model).success).toBe(
            true
          );
        }
      );

      it.each(["qwen-image-editx", "wan2.7-image"])(
        "AlibabaQwenImageModelSchema still rejects %j",
        (model) => {
          expect(AlibabaQwenImageModelSchema.safeParse(model).success).toBe(
            false
          );
        }
      );

      it.each([
        "qwen-image-2.0-pro",
        "qwen-image-2.0",
        "qwen-image-edit-max",
        "qwen-image-edit-plus",
        "qwen-image-edit",
      ])("AlibabaQwenImageStableModelSchema accepts %j", (model) => {
        expect(AlibabaQwenImageStableModelSchema.safeParse(model).success).toBe(
          true
        );
      });

      it.each([
        "qwen-image-3.0",
        "qwen-image-edit-ultra",
        "qwen-image-2.0-2026-03-03",
        "qwen-image-edit-plus-2025-12-15",
      ])("AlibabaQwenImageStableModelSchema still rejects %j", (model) => {
        expect(AlibabaQwenImageStableModelSchema.safeParse(model).success).toBe(
          false
        );
      });

      it.each(["qwen-image-3.0", "qwen-image-2.0-2026-03-03"])(
        "AlibabaQwenImageGenerationStableModelSchema still rejects %j",
        (model) => {
          expect(
            AlibabaQwenImageGenerationStableModelSchema.safeParse(model).success
          ).toBe(false);
        }
      );

      it.each(["qwen-image-edit-ultra", "qwen-image-edit-plus-2025-12-15"])(
        "AlibabaQwenImageEditStableModelSchema still rejects %j",
        (model) => {
          expect(
            AlibabaQwenImageEditStableModelSchema.safeParse(model).success
          ).toBe(false);
        }
      );
    });

    // Every listed id also matches its family's alias regex, so the enum branch
    // carries no validation weight — its only job is MCP client autocomplete.
    // Nothing else pins that, so a future "dead code" cleanup could delete the
    // enum branch and leave the suite green while silently dropping every
    // completion. These are that pin.
    describe("enum branches are autocomplete-only", () => {
      it.each([
        ["AlibabaVideoSynthesisModelSchema", AlibabaVideoSynthesisModelSchema],
        [
          "AlibabaQwenImageGenerationModelSchema",
          AlibabaQwenImageGenerationModelSchema,
        ],
        ["AlibabaQwenImageEditModelSchema", AlibabaQwenImageEditModelSchema],
      ])("%s: the alias alone accepts every listed id", (_name, schema) => {
        const hatch = hatchPatternOf(schema);
        const listed = enumBranchOf(schema) as string[];

        expect(listed.length).toBeGreaterThan(0);
        for (const id of listed) {
          expect(hatch.test(id)).toBe(true);
        }
      });

      it("AlibabaImageGenerationRequestSchema.model: the alias alone accepts every listed id", () => {
        const modelSchema = AlibabaImageGenerationRequestSchema.shape.model;
        const hatch = hatchPatternOf(modelSchema);

        expect(enumBranchOf(modelSchema)).toEqual([
          "wan2.7-image-pro",
          "wan2.7-image",
        ]);
        for (const id of ["wan2.7-image-pro", "wan2.7-image"]) {
          expect(hatch.test(id)).toBe(true);
        }
      });
    });

    // The eight model-keyed refinements on AlibabaVideoSynthesisRequestSchema
    // are the reason opening this enum is more than a type change. Six of them
    // require a media shape and skip for a hatched id; that skip is deliberate
    // — the hatch asserts an id is well-formed, not that upstream serves it, so
    // upstream stays the authority on what shape a new model accepts. The
    // other two *deny* a parameter, so they had to be re-keyed on the listed
    // ids or they would have denied it to every hatched id too.
    describe("model-keyed refinements under a hatched Wan id", () => {
      it("lets a hatched videoedit id set ratio and audio_setting", () => {
        const result = AlibabaVideoSynthesisRequestSchema.safeParse({
          model: "wan3.0-videoedit",
          input: {
            media: [{ type: "video", url: "https://example.com/vid.mp4" }],
          },
          parameters: { ratio: "16:9", audio_setting: "auto" },
        });
        expect(result.success).toBe(true);
      });

      it("still denies ratio and audio_setting to the listed wan2.7-i2v", () => {
        const result = AlibabaVideoSynthesisRequestSchema.safeParse({
          model: "wan2.7-i2v",
          input: {
            media: [{ type: "first_frame", url: "https://example.com/a.jpg" }],
          },
          parameters: { ratio: "16:9", audio_setting: "auto" },
        });
        expect(result.success).toBe(false);
        expect(result.error?.issues.some((i) => i.path.includes("ratio"))).toBe(
          true
        );
        expect(
          result.error?.issues.some((i) => i.path.includes("audio_setting"))
        ).toBe(true);
      });

      it("skips the i2v media-shape rules for a hatched i2v id", () => {
        // A listed wan2.7-i2v rejects this media set twice over: it has no
        // first_frame/last_frame/first_clip, and it uses `video`.
        const media = [{ type: "video", url: "https://example.com/vid.mp4" }];

        expect(
          AlibabaVideoSynthesisRequestSchema.safeParse({
            model: "wan2.7-i2v",
            input: { media },
          }).success
        ).toBe(false);
        expect(
          AlibabaVideoSynthesisRequestSchema.safeParse({
            model: "wan3.0-i2v",
            input: { media },
          }).success
        ).toBe(true);
      });

      it("skips the videoedit media-shape rules for a hatched videoedit id", () => {
        // A listed wan2.7-videoedit needs exactly one `video` entry and accepts
        // only video/reference_image.
        const media = [
          { type: "first_frame", url: "https://example.com/a.jpg" },
        ];

        expect(
          AlibabaVideoSynthesisRequestSchema.safeParse({
            model: "wan2.7-videoedit",
            input: { media },
          }).success
        ).toBe(false);
        expect(
          AlibabaVideoSynthesisRequestSchema.safeParse({
            model: "wan3.0-videoedit",
            input: { media },
          }).success
        ).toBe(true);
      });

      it("keeps the model-independent media rules for a hatched id", () => {
        // The unique-`type` rule is not keyed on the model, so it still fires.
        const result = AlibabaVideoSynthesisRequestSchema.safeParse({
          model: "wan3.0-i2v",
          input: {
            media: [
              { type: "first_frame", url: "https://example.com/a.jpg" },
              { type: "first_frame", url: "https://example.com/b.jpg" },
            ],
          },
        });
        expect(result.success).toBe(false);
        expect(result.error?.issues.some((i) => i.path.includes("media"))).toBe(
          true
        );
      });
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
