import { kieRequest } from "./request";
import {
  ElevenLabsDialogueRequestSchema,
  ElevenLabsSfxRequestSchema,
  ElevenLabsSttRequestSchema,
  ElevenLabsAudioIsolationRequestSchema,
  ElevenLabsTtsMultilingualRequestSchema,
  ElevenLabsTtsTurboRequestSchema,
} from "./zod";
import type { z } from "zod";

export type ElevenLabsModel =
  | "elevenlabs/sound-effect-v2"
  | "elevenlabs/text-to-dialogue-v3"
  | "elevenlabs/speech-to-text"
  | "elevenlabs/audio-isolation"
  | "elevenlabs/text-to-speech-multilingual-v2"
  | "elevenlabs/text-to-speech-turbo-2-5";

export interface ElevenLabsDialogueRequest {
  dialogue: Array<{
    text: string;
    voice:
      | "Adam"
      | "Alice"
      | "Bill"
      | "Brian"
      | "Callum"
      | "Charlie"
      | "Chris"
      | "Daniel"
      | "Eric"
      | "George"
      | "Harry"
      | "Jessica"
      | "Laura"
      | "Liam"
      | "Lily"
      | "Matilda"
      | "River"
      | "Roger"
      | "Sarah"
      | "Will";
  }>;
  stability?: 0 | 0.5 | 1.0;
  language_code?: string;
}

export interface ElevenLabsSfxRequest {
  text: string;
  output_format?: string;
  prompt_influence?: number;
  loop?: boolean;
  duration_seconds?: number;
}

export interface ElevenLabsSttRequest {
  audio_url: string;
  tag_audio_events?: boolean;
  diarize?: boolean;
  language_code?: string;
}

export interface ElevenLabsAudioIsolationRequest {
  audio_url: string;
  output_format?: string;
}

export interface ElevenLabsTtsMultilingualRequest {
  text: string;
  voice:
    | "Adam"
    | "Alice"
    | "Bill"
    | "Brian"
    | "Callum"
    | "Charlie"
    | "Chris"
    | "Daniel"
    | "Eric"
    | "George"
    | "Harry"
    | "Jessica"
    | "Laura"
    | "Liam"
    | "Lily"
    | "Matilda"
    | "River"
    | "Roger"
    | "Sarah"
    | "Will";
  output_format?: string;
  stability?: 0 | 0.5 | 1.0;
  similarity_boost?: number;
  style?: number;
  use_speaker_boost?: boolean;
  speed?: number;
  language_code?: string;
}

export interface ElevenLabsTtsTurboRequest {
  text: string;
  voice:
    | "Adam"
    | "Alice"
    | "Bill"
    | "Brian"
    | "Callum"
    | "Charlie"
    | "Chris"
    | "Daniel"
    | "Eric"
    | "George"
    | "Harry"
    | "Jessica"
    | "Laura"
    | "Liam"
    | "Lily"
    | "Matilda"
    | "River"
    | "Roger"
    | "Sarah"
    | "Will";
  output_format?: string;
  stability?: 0 | 0.5 | 1.0;
  similarity_boost?: number;
  style?: number;
  use_speaker_boost?: boolean;
  speed?: number;
  language_code?: string;
}

interface ElevenLabsSubmitResponse {
  code: number;
  msg?: string;
  data?: {
    taskId?: string;
  };
}

interface ElevenLabsTaskInfoResponse {
  code: number;
  msg?: string;
  data?: {
    taskId?: string;
    model?: string;
    state?: string;
    param?: string;
    resultJson?: string;
    failCode?: string;
    failMsg?: string;
    costTime?: number;
    completeTime?: number;
    createTime?: number;
    updateTime?: number;
    progress?: number;
  };
}

interface ElevenLabsDialogueMethod {
  (req: ElevenLabsDialogueRequest): Promise<ElevenLabsSubmitResponse>;
  schema: z.ZodType<{
    model: "elevenlabs/text-to-dialogue-v3";
    input: unknown;
  }>;
}

interface ElevenLabsSfxMethod {
  (req: ElevenLabsSfxRequest): Promise<ElevenLabsSubmitResponse>;
  schema: z.ZodType<{ model: "elevenlabs/sound-effect-v2"; input: unknown }>;
}

interface ElevenLabsSttMethod {
  (req: ElevenLabsSttRequest): Promise<ElevenLabsSubmitResponse>;
  schema: z.ZodType<{ model: "elevenlabs/speech-to-text"; input: unknown }>;
}

interface ElevenLabsAudioIsolationMethod {
  (req: ElevenLabsAudioIsolationRequest): Promise<ElevenLabsSubmitResponse>;
  schema: z.ZodType<{ model: "elevenlabs/audio-isolation"; input: unknown }>;
}

interface ElevenLabsTtsMultilingualMethod {
  (req: ElevenLabsTtsMultilingualRequest): Promise<ElevenLabsSubmitResponse>;
  schema: z.ZodType<{
    model: "elevenlabs/text-to-speech-multilingual-v2";
    input: unknown;
  }>;
}

interface ElevenLabsTtsTurboMethod {
  (req: ElevenLabsTtsTurboRequest): Promise<ElevenLabsSubmitResponse>;
  schema: z.ZodType<{
    model: "elevenlabs/text-to-speech-turbo-2-5";
    input: unknown;
  }>;
}

interface ElevenLabsJobsNamespace {
  createTask: {
    dialogue: ElevenLabsDialogueMethod;
    sfx: ElevenLabsSfxMethod;
    stt: ElevenLabsSttMethod;
    audioIsolation: ElevenLabsAudioIsolationMethod;
    ttsMultilingual: ElevenLabsTtsMultilingualMethod;
    ttsTurbo: ElevenLabsTtsTurboMethod;
  };
  recordInfo: (taskId: string) => Promise<ElevenLabsTaskInfoResponse>;
}

interface ElevenLabsV1Namespace {
  jobs: ElevenLabsJobsNamespace;
}

interface ElevenLabsPostApiNamespace {
  v1: ElevenLabsV1Namespace;
}

export interface ElevenLabsProvider {
  post: { api: ElevenLabsPostApiNamespace };
  get: {
    api: {
      v1: {
        jobs: {
          recordInfo: (taskId: string) => Promise<ElevenLabsTaskInfoResponse>;
        };
      };
    };
  };
}

export function createElevenLabsProvider(
  baseURL: string,
  apiKey: string,
  doFetch: typeof fetch,
  timeout: number
): ElevenLabsProvider {
  const requestOpts = { apiKey, doFetch, timeout };

  // POST https://api.kie.ai/api/v1/jobs/createTask
  // Docs: https://docs.kie.ai
  async function submitDialogue(
    req: ElevenLabsDialogueRequest
  ): Promise<ElevenLabsSubmitResponse> {
    return kieRequest<ElevenLabsSubmitResponse>(
      `${baseURL}/api/v1/jobs/createTask`,
      {
        method: "POST",
        body: { model: "elevenlabs/text-to-dialogue-v3", input: req },
        ...requestOpts,
      }
    );
  }

  // POST https://api.kie.ai/api/v1/jobs/createTask
  // Docs: https://docs.kie.ai
  async function submitSfx(
    req: ElevenLabsSfxRequest
  ): Promise<ElevenLabsSubmitResponse> {
    return kieRequest<ElevenLabsSubmitResponse>(
      `${baseURL}/api/v1/jobs/createTask`,
      {
        method: "POST",
        body: { model: "elevenlabs/sound-effect-v2", input: req },
        ...requestOpts,
      }
    );
  }

  // POST https://api.kie.ai/api/v1/jobs/createTask
  // Docs: https://docs.kie.ai
  async function submitStt(
    req: ElevenLabsSttRequest
  ): Promise<ElevenLabsSubmitResponse> {
    return kieRequest<ElevenLabsSubmitResponse>(
      `${baseURL}/api/v1/jobs/createTask`,
      {
        method: "POST",
        body: { model: "elevenlabs/speech-to-text", input: req },
        ...requestOpts,
      }
    );
  }

  // POST https://api.kie.ai/api/v1/jobs/createTask
  // Docs: https://docs.kie.ai
  async function submitAudioIsolation(
    req: ElevenLabsAudioIsolationRequest
  ): Promise<ElevenLabsSubmitResponse> {
    return kieRequest<ElevenLabsSubmitResponse>(
      `${baseURL}/api/v1/jobs/createTask`,
      {
        method: "POST",
        body: { model: "elevenlabs/audio-isolation", input: req },
        ...requestOpts,
      }
    );
  }

  // POST https://api.kie.ai/api/v1/jobs/createTask
  // Docs: https://docs.kie.ai
  async function submitTtsMultilingual(
    req: ElevenLabsTtsMultilingualRequest
  ): Promise<ElevenLabsSubmitResponse> {
    return kieRequest<ElevenLabsSubmitResponse>(
      `${baseURL}/api/v1/jobs/createTask`,
      {
        method: "POST",
        body: {
          model: "elevenlabs/text-to-speech-multilingual-v2",
          input: req,
        },
        ...requestOpts,
      }
    );
  }

  // POST https://api.kie.ai/api/v1/jobs/createTask
  // Docs: https://docs.kie.ai
  async function submitTtsTurbo(
    req: ElevenLabsTtsTurboRequest
  ): Promise<ElevenLabsSubmitResponse> {
    return kieRequest<ElevenLabsSubmitResponse>(
      `${baseURL}/api/v1/jobs/createTask`,
      {
        method: "POST",
        body: { model: "elevenlabs/text-to-speech-turbo-2-5", input: req },
        ...requestOpts,
      }
    );
  }

  // GET https://api.kie.ai/api/v1/jobs/recordInfo?taskId={taskId}
  // Docs: https://docs.kie.ai
  async function recordInfo(
    taskId: string
  ): Promise<ElevenLabsTaskInfoResponse> {
    return kieRequest<ElevenLabsTaskInfoResponse>(
      `${baseURL}/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`,
      {
        method: "GET",
        ...requestOpts,
      }
    );
  }

  return {
    post: {
      api: {
        v1: {
          jobs: {
            createTask: {
              dialogue: Object.assign(submitDialogue, {
                schema: ElevenLabsDialogueRequestSchema,
              }),
              sfx: Object.assign(submitSfx, {
                schema: ElevenLabsSfxRequestSchema,
              }),
              stt: Object.assign(submitStt, {
                schema: ElevenLabsSttRequestSchema,
              }),
              audioIsolation: Object.assign(submitAudioIsolation, {
                schema: ElevenLabsAudioIsolationRequestSchema,
              }),
              ttsMultilingual: Object.assign(submitTtsMultilingual, {
                schema: ElevenLabsTtsMultilingualRequestSchema,
              }),
              ttsTurbo: Object.assign(submitTtsTurbo, {
                schema: ElevenLabsTtsTurboRequestSchema,
              }),
            },
            recordInfo,
          },
        },
      },
    },
    get: {
      api: {
        v1: {
          jobs: {
            recordInfo,
          },
        },
      },
    },
  };
}
