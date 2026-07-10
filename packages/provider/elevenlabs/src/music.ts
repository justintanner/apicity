import {
  ElevenLabsComposeMusicDetailedRequest,
  ElevenLabsComposeMusicRequest,
  ElevenLabsComposeMusicStreamRequest,
  ElevenLabsMusicPlanRequest,
  ElevenLabsMusicPlanResponse,
  ElevenLabsMusicStemSeparationRequest,
  ElevenLabsMusicUploadRequest,
  ElevenLabsMusicUploadResponse,
  ElevenLabsVideoToMusicRequest,
} from "./types";
import {
  ElevenLabsComposeMusicDetailedRequestSchema,
  ElevenLabsComposeMusicRequestSchema,
  ElevenLabsComposeMusicStreamRequestSchema,
  ElevenLabsMusicPlanRequestSchema,
  ElevenLabsMusicStemSeparationRequestSchema,
  ElevenLabsMusicUploadRequestSchema,
  ElevenLabsVideoToMusicRequestSchema,
} from "./zod";
import type { ElevenLabsContext } from "./transport";

export function createMusicEndpoints(ctx: ElevenLabsContext) {
  const {
    makeBinaryRequest,
    makeJsonRequest,
    makeMultipartJsonRequest,
    makeMultipartBinaryRequest,
    appendFormField,
  } = ctx;

  // POST https://api.elevenlabs.io/v1/music/detailed
  // Docs: https://elevenlabs.io/docs/api-reference/music/compose-detailed
  const composeMusicDetailed = Object.assign(
    async (
      req: ElevenLabsComposeMusicDetailedRequest,
      signal?: AbortSignal
    ): Promise<ArrayBuffer> => {
      const { output_format, ...body } = req;
      const query = output_format ? { output_format } : undefined;
      return makeBinaryRequest("/v1/music/detailed", body, query, signal);
    },
    { schema: ElevenLabsComposeMusicDetailedRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/music/plan
  // Docs: https://elevenlabs.io/docs/api-reference/music/compose-plan
  const musicPlan = Object.assign(
    async (
      req: ElevenLabsMusicPlanRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsMusicPlanResponse> => {
      return makeJsonRequest<ElevenLabsMusicPlanResponse>(
        "POST",
        "/v1/music/plan",
        req,
        signal
      );
    },
    { schema: ElevenLabsMusicPlanRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/music/stream
  // Docs: https://elevenlabs.io/docs/api-reference/music/compose-stream
  const composeMusicStream = Object.assign(
    async (
      req: ElevenLabsComposeMusicStreamRequest,
      signal?: AbortSignal
    ): Promise<ArrayBuffer> => {
      const { output_format, ...body } = req;
      const query = output_format ? { output_format } : undefined;
      return makeBinaryRequest("/v1/music/stream", body, query, signal);
    },
    { schema: ElevenLabsComposeMusicStreamRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/music/stem-separation
  // Docs: https://elevenlabs.io/docs/api-reference/music/stem-separation
  const musicStemSeparation = Object.assign(
    async (
      req: ElevenLabsMusicStemSeparationRequest,
      signal?: AbortSignal
    ): Promise<ArrayBuffer> => {
      const { output_format, ...body } = req;
      const form = new FormData();
      for (const [key, value] of Object.entries(body)) {
        appendFormField(form, key, value);
      }
      const query = output_format ? { output_format } : undefined;
      return makeMultipartBinaryRequest(
        "/v1/music/stem-separation",
        form,
        query,
        signal
      );
    },
    { schema: ElevenLabsMusicStemSeparationRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/music/upload
  // Docs: https://elevenlabs.io/docs/api-reference/music/upload
  const musicUpload = Object.assign(
    async (
      req: ElevenLabsMusicUploadRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsMusicUploadResponse> => {
      const form = new FormData();
      for (const [key, value] of Object.entries(req)) {
        appendFormField(form, key, value);
      }
      return makeMultipartJsonRequest<ElevenLabsMusicUploadResponse>(
        "/v1/music/upload",
        form,
        undefined,
        signal
      );
    },
    { schema: ElevenLabsMusicUploadRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/music/video-to-music
  // Docs: https://elevenlabs.io/docs/api-reference/music/video-to-music
  const videoToMusic = Object.assign(
    async (
      req: ElevenLabsVideoToMusicRequest,
      signal?: AbortSignal
    ): Promise<ArrayBuffer> => {
      const { output_format, videos, tags, ...rest } = req;
      const form = new FormData();
      for (const video of videos) {
        form.append("videos", video);
      }
      if (tags) {
        for (const tag of tags) {
          form.append("tags", tag);
        }
      }
      for (const [key, value] of Object.entries(rest)) {
        appendFormField(form, key, value);
      }
      const query = output_format ? { output_format } : undefined;
      return makeMultipartBinaryRequest(
        "/v1/music/video-to-music",
        form,
        query,
        signal
      );
    },
    { schema: ElevenLabsVideoToMusicRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/music
  // Docs: https://elevenlabs.io/docs/api-reference/music/compose
  const music = Object.assign(
    async (
      req: ElevenLabsComposeMusicRequest,
      signal?: AbortSignal
    ): Promise<ArrayBuffer> => {
      const { output_format, ...body } = req;
      const query = output_format ? { output_format } : undefined;
      return makeBinaryRequest("/v1/music", body, query, signal);
    },
    {
      schema: ElevenLabsComposeMusicRequestSchema,
      detailed: composeMusicDetailed,
      plan: musicPlan,
      stream: composeMusicStream,
      stemSeparation: musicStemSeparation,
      upload: musicUpload,
      videoToMusic: videoToMusic,
    }
  );

  return {
    v1: { music },
    post: { v1: { music } },
  };
}
