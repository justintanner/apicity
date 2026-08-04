import { describe, expect, it, vi } from "vitest";

import {
  createKie,
  KieError,
  type MediaGenerationRequest,
  type MiniMaxH3FixedAspectRatio,
  type MiniMaxH3ImageToVideoInput,
  type MiniMaxH3ImageToVideoRequest,
  type MiniMaxH3ReferenceAspectRatio,
  type MiniMaxH3ReferenceToVideoInput,
  type MiniMaxH3ReferenceToVideoRequest,
  type MiniMaxH3TextToVideoRequest,
} from "@apicity/kie";
import {
  CreateTaskRequestSchema,
  MiniMaxH3ImageToVideoRequestSchema,
  MiniMaxH3ReferenceToVideoRequestSchema,
  MiniMaxH3TextToVideoRequestSchema,
} from "@apicity/kie/zod";

import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";
import { mintKieCreateTaskOtp, TEST_PAYGATE_SECRET } from "../harness";

const PROMPT = "A paper kite glides above a quiet beach at sunrise.";
const MAX_PROMPT = "p".repeat(7000);
const TOO_LONG_PROMPT = "p".repeat(7001);
const HTTPS_IMAGE = "https://example.com/reference.png";
const HTTP_IMAGE = "http://example.com/reference.png";
const OSS_IMAGE = "oss://minimax-h3/reference.png";
const HTTPS_VIDEO = "https://example.com/reference.mp4";
const OSS_VIDEO = "oss://minimax-h3/reference.mp4";
const HTTPS_AUDIO = "https://example.com/reference.mp3";
const OSS_AUDIO = "oss://minimax-h3/reference.mp3";

const FIXED_ASPECT_RATIOS = [
  "21:9",
  "16:9",
  "4:3",
  "1:1",
  "3:4",
  "9:16",
] as const satisfies readonly MiniMaxH3FixedAspectRatio[];

const REFERENCE_ASPECT_RATIOS = [
  "adaptive",
  ...FIXED_ASPECT_RATIOS,
] as const satisfies readonly MiniMaxH3ReferenceAspectRatio[];

interface PositiveInputCase<TInput> {
  label: string;
  input: TInput;
}

interface NegativeCase {
  label: string;
  request: Record<string, unknown>;
  expectedPath: string;
}

interface IssueBody {
  issues: Array<{ path: PropertyKey[] }>;
}

function expectAccepted(request: MediaGenerationRequest): void {
  const result = CreateTaskRequestSchema.safeParse(request);

  expect(result.success).toBe(true);
  if (!result.success) throw result.error;
  expect(result.data).toEqual(request);
}

function malformedRequest(
  model:
    | "minimax-h3/text-to-video"
    | "minimax-h3/image-to-video"
    | "minimax-h3/reference-to-video",
  input: Record<string, unknown>
): Record<string, unknown> {
  return { model, input };
}

const IMAGE_COMBINATIONS = [
  {
    label: "an HTTPS first frame",
    input: {
      prompt: "p",
      first_frame_url: HTTPS_IMAGE,
      duration: 4,
      resolution: "768P",
    },
  },
  {
    label: "an OSS last frame",
    input: {
      prompt: MAX_PROMPT,
      last_frame_url: OSS_IMAGE,
      duration: 15,
      resolution: "2K",
    },
  },
  {
    label: "both HTTP and HTTPS boundary frames",
    input: {
      prompt: PROMPT,
      first_frame_url: HTTP_IMAGE,
      last_frame_url: HTTPS_IMAGE,
      duration: 6,
    },
  },
] satisfies Array<PositiveInputCase<MiniMaxH3ImageToVideoInput>>;

const REFERENCE_COMBINATIONS = [
  {
    label: "an image only",
    input: {
      prompt: "p",
      reference_image_urls: [HTTPS_IMAGE],
      aspect_ratio: "adaptive",
      duration: 4,
      resolution: "768P",
    },
  },
  {
    label: "an OSS video only",
    input: {
      prompt: MAX_PROMPT,
      reference_video_urls: [OSS_VIDEO],
      aspect_ratio: "21:9",
      duration: 15,
      resolution: "2K",
    },
  },
  {
    label: "both visual reference types",
    input: {
      prompt: PROMPT,
      reference_image_urls: [HTTP_IMAGE],
      reference_video_urls: [HTTPS_VIDEO],
      duration: 6,
    },
  },
  {
    label: "an image with audio",
    input: {
      prompt: PROMPT,
      reference_image_urls: [HTTPS_IMAGE],
      reference_audio_urls: [OSS_AUDIO],
      duration: 6,
    },
  },
  {
    label: "a video with audio",
    input: {
      prompt: PROMPT,
      reference_video_urls: [HTTPS_VIDEO],
      reference_audio_urls: [HTTPS_AUDIO],
      duration: 6,
    },
  },
  {
    label: "an empty image list with a video",
    input: {
      prompt: PROMPT,
      reference_image_urls: [],
      reference_video_urls: [HTTPS_VIDEO],
      duration: 6,
    },
  },
  {
    label: "an image with an empty video list",
    input: {
      prompt: PROMPT,
      reference_image_urls: [HTTPS_IMAGE],
      reference_video_urls: [],
      duration: 6,
    },
  },
  {
    label: "the 9/3/3 list caps",
    input: {
      prompt: PROMPT,
      reference_image_urls: Array.from(
        { length: 9 },
        (_, index) => `https://example.com/image-${index}.png`
      ),
      reference_video_urls: Array.from(
        { length: 3 },
        (_, index) => `https://example.com/video-${index}.mp4`
      ),
      reference_audio_urls: Array.from(
        { length: 3 },
        (_, index) => `https://example.com/audio-${index}.mp3`
      ),
      duration: 6,
    },
  },
] satisfies Array<PositiveInputCase<MiniMaxH3ReferenceToVideoInput>>;

const NEGATIVE_CASES: NegativeCase[] = [
  {
    label: "text missing prompt",
    request: malformedRequest("minimax-h3/text-to-video", {
      aspect_ratio: "16:9",
      duration: 6,
    }),
    expectedPath: "input.prompt",
  },
  {
    label: "text empty prompt",
    request: malformedRequest("minimax-h3/text-to-video", {
      prompt: "",
      aspect_ratio: "16:9",
      duration: 6,
    }),
    expectedPath: "input.prompt",
  },
  {
    label: "text 7001-character prompt",
    request: malformedRequest("minimax-h3/text-to-video", {
      prompt: TOO_LONG_PROMPT,
      aspect_ratio: "16:9",
      duration: 6,
    }),
    expectedPath: "input.prompt",
  },
  {
    label: "text adaptive aspect ratio",
    request: malformedRequest("minimax-h3/text-to-video", {
      prompt: PROMPT,
      aspect_ratio: "adaptive",
      duration: 6,
    }),
    expectedPath: "input.aspect_ratio",
  },
  {
    label: "text duration below 4",
    request: malformedRequest("minimax-h3/text-to-video", {
      prompt: PROMPT,
      aspect_ratio: "16:9",
      duration: 3,
    }),
    expectedPath: "input.duration",
  },
  {
    label: "text duration above 15",
    request: malformedRequest("minimax-h3/text-to-video", {
      prompt: PROMPT,
      aspect_ratio: "16:9",
      duration: 16,
    }),
    expectedPath: "input.duration",
  },
  {
    label: "text fractional duration",
    request: malformedRequest("minimax-h3/text-to-video", {
      prompt: PROMPT,
      aspect_ratio: "16:9",
      duration: 4.5,
    }),
    expectedPath: "input.duration",
  },
  {
    label: "text missing duration despite its documented default",
    request: malformedRequest("minimax-h3/text-to-video", {
      prompt: PROMPT,
      aspect_ratio: "16:9",
    }),
    expectedPath: "input.duration",
  },
  {
    label: "text unknown resolution",
    request: malformedRequest("minimax-h3/text-to-video", {
      prompt: PROMPT,
      aspect_ratio: "16:9",
      duration: 6,
      resolution: "1080P",
    }),
    expectedPath: "input.resolution",
  },
  {
    label: "text cross-mode first frame",
    request: malformedRequest("minimax-h3/text-to-video", {
      prompt: PROMPT,
      aspect_ratio: "16:9",
      duration: 6,
      first_frame_url: HTTPS_IMAGE,
    }),
    expectedPath: "input",
  },
  {
    label: "image missing prompt",
    request: malformedRequest("minimax-h3/image-to-video", {
      first_frame_url: HTTPS_IMAGE,
      duration: 6,
    }),
    expectedPath: "input.prompt",
  },
  {
    label: "image without either frame",
    request: malformedRequest("minimax-h3/image-to-video", {
      prompt: PROMPT,
      duration: 6,
    }),
    expectedPath: "input.first_frame_url",
  },
  {
    label: "image FTP first frame",
    request: malformedRequest("minimax-h3/image-to-video", {
      prompt: PROMPT,
      first_frame_url: "ftp://example.com/frame.png",
      duration: 6,
    }),
    expectedPath: "input.first_frame_url",
  },
  {
    label: "image file-protocol last frame",
    request: malformedRequest("minimax-h3/image-to-video", {
      prompt: PROMPT,
      last_frame_url: "file:///tmp/frame.png",
      duration: 6,
    }),
    expectedPath: "input.last_frame_url",
  },
  {
    label: "image duration below 4",
    request: malformedRequest("minimax-h3/image-to-video", {
      prompt: PROMPT,
      first_frame_url: HTTPS_IMAGE,
      duration: 3,
    }),
    expectedPath: "input.duration",
  },
  {
    label: "image duration above 15",
    request: malformedRequest("minimax-h3/image-to-video", {
      prompt: PROMPT,
      first_frame_url: HTTPS_IMAGE,
      duration: 16,
    }),
    expectedPath: "input.duration",
  },
  {
    label: "image fractional duration",
    request: malformedRequest("minimax-h3/image-to-video", {
      prompt: PROMPT,
      first_frame_url: HTTPS_IMAGE,
      duration: 4.5,
    }),
    expectedPath: "input.duration",
  },
  {
    label: "image missing duration despite its documented default",
    request: malformedRequest("minimax-h3/image-to-video", {
      prompt: PROMPT,
      first_frame_url: HTTPS_IMAGE,
    }),
    expectedPath: "input.duration",
  },
  {
    label: "image unknown resolution",
    request: malformedRequest("minimax-h3/image-to-video", {
      prompt: PROMPT,
      first_frame_url: HTTPS_IMAGE,
      duration: 6,
      resolution: "1080P",
    }),
    expectedPath: "input.resolution",
  },
  {
    label: "image cross-mode aspect ratio",
    request: malformedRequest("minimax-h3/image-to-video", {
      prompt: PROMPT,
      first_frame_url: HTTPS_IMAGE,
      aspect_ratio: "16:9",
      duration: 6,
    }),
    expectedPath: "input",
  },
  {
    label: "reference missing prompt",
    request: malformedRequest("minimax-h3/reference-to-video", {
      reference_image_urls: [HTTPS_IMAGE],
      duration: 6,
    }),
    expectedPath: "input.prompt",
  },
  {
    label: "reference without any references",
    request: malformedRequest("minimax-h3/reference-to-video", {
      prompt: PROMPT,
      duration: 6,
    }),
    expectedPath: "input.reference_image_urls",
  },
  {
    label: "reference with audio only",
    request: malformedRequest("minimax-h3/reference-to-video", {
      prompt: PROMPT,
      reference_audio_urls: [HTTPS_AUDIO],
      duration: 6,
    }),
    expectedPath: "input.reference_image_urls",
  },
  {
    label: "reference with empty visual arrays",
    request: malformedRequest("minimax-h3/reference-to-video", {
      prompt: PROMPT,
      reference_image_urls: [],
      reference_video_urls: [],
      duration: 6,
    }),
    expectedPath: "input.reference_image_urls",
  },
  {
    label: "reference with 10 images",
    request: malformedRequest("minimax-h3/reference-to-video", {
      prompt: PROMPT,
      reference_image_urls: Array.from(
        { length: 10 },
        (_, index) => `https://example.com/image-${index}.png`
      ),
      duration: 6,
    }),
    expectedPath: "input.reference_image_urls",
  },
  {
    label: "reference with 4 videos",
    request: malformedRequest("minimax-h3/reference-to-video", {
      prompt: PROMPT,
      reference_video_urls: Array.from(
        { length: 4 },
        (_, index) => `https://example.com/video-${index}.mp4`
      ),
      duration: 6,
    }),
    expectedPath: "input.reference_video_urls",
  },
  {
    label: "reference with 4 audios",
    request: malformedRequest("minimax-h3/reference-to-video", {
      prompt: PROMPT,
      reference_image_urls: [HTTPS_IMAGE],
      reference_audio_urls: Array.from(
        { length: 4 },
        (_, index) => `https://example.com/audio-${index}.mp3`
      ),
      duration: 6,
    }),
    expectedPath: "input.reference_audio_urls",
  },
  {
    label: "reference with an FTP image",
    request: malformedRequest("minimax-h3/reference-to-video", {
      prompt: PROMPT,
      reference_image_urls: ["ftp://example.com/reference.png"],
      duration: 6,
    }),
    expectedPath: "input.reference_image_urls.0",
  },
  {
    label: "reference with a file-protocol video",
    request: malformedRequest("minimax-h3/reference-to-video", {
      prompt: PROMPT,
      reference_video_urls: ["file:///tmp/reference.mp4"],
      duration: 6,
    }),
    expectedPath: "input.reference_video_urls.0",
  },
  {
    label: "reference with a data-protocol audio",
    request: malformedRequest("minimax-h3/reference-to-video", {
      prompt: PROMPT,
      reference_image_urls: [HTTPS_IMAGE],
      reference_audio_urls: ["data:audio/mp3;base64,AAAA"],
      duration: 6,
    }),
    expectedPath: "input.reference_audio_urls.0",
  },
  {
    label: "reference unknown aspect ratio",
    request: malformedRequest("minimax-h3/reference-to-video", {
      prompt: PROMPT,
      reference_image_urls: [HTTPS_IMAGE],
      aspect_ratio: "2:1",
      duration: 6,
    }),
    expectedPath: "input.aspect_ratio",
  },
  {
    label: "reference duration below 4",
    request: malformedRequest("minimax-h3/reference-to-video", {
      prompt: PROMPT,
      reference_image_urls: [HTTPS_IMAGE],
      duration: 3,
    }),
    expectedPath: "input.duration",
  },
  {
    label: "reference duration above 15",
    request: malformedRequest("minimax-h3/reference-to-video", {
      prompt: PROMPT,
      reference_image_urls: [HTTPS_IMAGE],
      duration: 16,
    }),
    expectedPath: "input.duration",
  },
  {
    label: "reference fractional duration",
    request: malformedRequest("minimax-h3/reference-to-video", {
      prompt: PROMPT,
      reference_image_urls: [HTTPS_IMAGE],
      duration: 4.5,
    }),
    expectedPath: "input.duration",
  },
  {
    label: "reference missing duration despite its documented default",
    request: malformedRequest("minimax-h3/reference-to-video", {
      prompt: PROMPT,
      reference_image_urls: [HTTPS_IMAGE],
    }),
    expectedPath: "input.duration",
  },
  {
    label: "reference unknown resolution",
    request: malformedRequest("minimax-h3/reference-to-video", {
      prompt: PROMPT,
      reference_image_urls: [HTTPS_IMAGE],
      duration: 6,
      resolution: "1080P",
    }),
    expectedPath: "input.resolution",
  },
  {
    label: "reference cross-mode first frame",
    request: malformedRequest("minimax-h3/reference-to-video", {
      prompt: PROMPT,
      reference_image_urls: [HTTPS_IMAGE],
      first_frame_url: HTTPS_IMAGE,
      duration: 6,
    }),
    expectedPath: "input",
  },
];

describe("KIE MiniMax H3 createTask contracts", () => {
  describe("accepted payloads", () => {
    it.each(FIXED_ASPECT_RATIOS)(
      "accepts text-to-video fixed aspect ratio %s",
      (aspectRatio) => {
        const request = {
          model: "minimax-h3/text-to-video",
          input: {
            prompt: PROMPT,
            aspect_ratio: aspectRatio,
            duration: 6,
          },
        } satisfies MiniMaxH3TextToVideoRequest;

        expectAccepted(request);
      }
    );

    it.each([
      {
        label: "minimum prompt/duration and 768P",
        prompt: "p",
        duration: 4,
        resolution: "768P",
      },
      {
        label: "maximum prompt/duration and 2K",
        prompt: MAX_PROMPT,
        duration: 15,
        resolution: "2K",
      },
    ] as const)(
      "accepts text-to-video $label boundaries",
      ({ prompt, duration, resolution }) => {
        const request = {
          model: "minimax-h3/text-to-video",
          input: {
            prompt,
            aspect_ratio: "16:9",
            duration,
            resolution,
          },
        } satisfies MiniMaxH3TextToVideoRequest;

        expectAccepted(request);
      }
    );

    it.each(IMAGE_COMBINATIONS)(
      "accepts image-to-video with $label",
      ({ input }) => {
        const request = {
          model: "minimax-h3/image-to-video",
          input,
        } satisfies MiniMaxH3ImageToVideoRequest;

        expectAccepted(request);
      }
    );

    it.each(REFERENCE_COMBINATIONS)(
      "accepts reference-to-video with $label",
      ({ input }) => {
        const request = {
          model: "minimax-h3/reference-to-video",
          input,
        } satisfies MiniMaxH3ReferenceToVideoRequest;

        expectAccepted(request);
      }
    );

    it.each(REFERENCE_ASPECT_RATIOS)(
      "accepts reference-to-video aspect ratio %s",
      (aspectRatio) => {
        const request = {
          model: "minimax-h3/reference-to-video",
          input: {
            prompt: PROMPT,
            reference_image_urls: [HTTPS_IMAGE],
            aspect_ratio: aspectRatio,
            duration: 6,
          },
        } satisfies MiniMaxH3ReferenceToVideoRequest;

        expectAccepted(request);
      }
    );
  });

  it("keeps documented defaults in metadata without injecting parse output", () => {
    const textRequest = {
      model: "minimax-h3/text-to-video",
      input: { prompt: PROMPT, aspect_ratio: "16:9", duration: 6 },
    } satisfies MiniMaxH3TextToVideoRequest;
    const imageRequest = {
      model: "minimax-h3/image-to-video",
      input: { prompt: PROMPT, first_frame_url: HTTPS_IMAGE, duration: 6 },
    } satisfies MiniMaxH3ImageToVideoRequest;
    const referenceRequest = {
      model: "minimax-h3/reference-to-video",
      input: {
        prompt: PROMPT,
        reference_image_urls: [HTTPS_IMAGE],
        duration: 6,
      },
    } satisfies MiniMaxH3ReferenceToVideoRequest;

    const parsedText = MiniMaxH3TextToVideoRequestSchema.parse(textRequest);
    const parsedImage = MiniMaxH3ImageToVideoRequestSchema.parse(imageRequest);
    const parsedReference =
      MiniMaxH3ReferenceToVideoRequestSchema.parse(referenceRequest);

    expect(parsedText.input).not.toHaveProperty("resolution");
    expect(parsedImage.input).not.toHaveProperty("resolution");
    expect(parsedReference.input).not.toHaveProperty("aspect_ratio");
    expect(parsedReference.input).not.toHaveProperty("resolution");

    expect(
      modelInputSchemas["minimax-h3/text-to-video"].fields.duration.default
    ).toBe(6);
    expect(
      modelInputSchemas["minimax-h3/image-to-video"].fields.duration.default
    ).toBe(6);
    expect(
      modelInputSchemas["minimax-h3/reference-to-video"].fields.duration.default
    ).toBe(6);
    expect(
      modelInputSchemas["minimax-h3/text-to-video"].fields.resolution.default
    ).toBe("2K");
    expect(
      modelInputSchemas["minimax-h3/image-to-video"].fields.resolution.default
    ).toBe("2K");
    expect(
      modelInputSchemas["minimax-h3/reference-to-video"].fields.resolution
        .default
    ).toBe("2K");
    expect(
      modelInputSchemas["minimax-h3/reference-to-video"].fields.aspect_ratio
        .default
    ).toBe("adaptive");
  });

  it.each(NEGATIVE_CASES)(
    "rejects $label at the provider boundary before fetch",
    async ({ label, request, expectedPath }) => {
      const mockFetch = vi.fn<typeof globalThis.fetch>(() => {
        throw new Error(`MiniMax H3 validation reached fetch for ${label}`);
      });
      const provider = createKie({
        apiKey: "test-key",
        fetch: mockFetch,
        paygate: { secret: TEST_PAYGATE_SECRET },
      });

      const rejection: unknown = await provider.post.api.v1.jobs
        .createTask(
          request as unknown as MediaGenerationRequest,
          mintKieCreateTaskOtp(request)
        )
        .catch((error: unknown) => error);

      expect(rejection).toBeInstanceOf(KieError);
      if (!(rejection instanceof KieError)) throw rejection;
      expect(rejection.status).toBe(400);
      expect(rejection.message).toContain("Invalid Kie createTask request");
      expect(rejection.message).toContain(expectedPath);

      const { issues } = rejection.body as IssueBody;
      expect(issues.length).toBeGreaterThan(0);
      expect(issues.some((issue) => issue.path.length > 0)).toBe(true);
      expect(
        issues.some((issue) => issue.path.join(".") === expectedPath)
      ).toBe(true);
      expect(mockFetch).not.toHaveBeenCalled();
    }
  );
});
