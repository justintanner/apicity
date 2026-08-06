import { createKieTransport, kieRequest } from "./request";
import { SunoGenerateRequestSchema, SunoModelAliasSchema } from "./zod";
import { z } from "zod";
import type { ApicitySchema } from "./types";

export type SunoModel =
  | "V3_5"
  | "V4"
  | "V4_5"
  | "V4_5PLUS"
  | "V4_5ALL"
  | "V5"
  | "V5_5";

export interface SunoGenerateRequest {
  prompt: string;
  // Open enum: SunoGenerateRequestSchema unions the listed ids with
  // SunoModelAliasSchema (zod.ts), so a not-yet-listed Suno version id such as
  // `V6` validates. `string & {}` mirrors that hatch here without collapsing
  // the union, so editors still autocomplete SunoModel. The sibling Suno
  // request schemas in suno.ts likewise union SunoModelAliasSchema, so their
  // `model` accepts the same version aliases as zod.ts.
  model: SunoModel | (string & {});
  instrumental: boolean;
  customMode: boolean;
  callBackUrl: string;
  style?: string;
  negativeTags?: string;
  title?: string;
  vocalGender?: "m" | "f";
  styleWeight?: number;
  weirdnessConstraint?: number;
  audioWeight?: number;
  personaId?: string;
}

export interface SunoExtendRequest {
  defaultParamFlag: boolean;
  audioId: string;
  prompt: string;
  model: SunoModel | (string & {});
  callBackUrl: string;
  style?: string;
  title?: string;
  continueAt?: number;
  negativeTags?: string;
  vocalGender?: "m" | "f";
  styleWeight?: number;
  weirdnessConstraint?: number;
  audioWeight?: number;
  personaId?: string;
}

export type SunoTaskStatus =
  | "PENDING"
  | "TEXT_SUCCESS"
  | "FIRST_SUCCESS"
  | "SUCCESS"
  | "CREATE_TASK_FAILED"
  | "GENERATE_AUDIO_FAILED"
  | "CALLBACK_EXCEPTION"
  | "SENSITIVE_WORD_ERROR";

export type SunoOperationType =
  | "generate"
  | "extend"
  | "upload_cover"
  | "upload_extend";

export interface SunoTrack {
  id: string;
  audioUrl: string;
  streamAudioUrl: string;
  imageUrl: string;
  prompt: string;
  modelName: string;
  title: string;
  tags: string;
  createTime: string;
  duration: number;
}

export interface SunoRecordInfoResponse {
  code: number;
  msg?: string;
  // Kie returns `data: null` (not a 4xx) when the taskId doesn't exist.
  data?: {
    taskId: string;
    parentMusicId?: string;
    param?: string;
    response?: {
      taskId: string;
      sunoData?: SunoTrack[];
    };
    status?: SunoTaskStatus;
    type?: "chirp-v3-5" | "chirp-v4";
    operationType?: SunoOperationType;
    errorCode?: number | null;
    errorMessage?: string | null;
  } | null;
}

export interface SunoWavRequest {
  taskId: string;
  audioId: string;
  callBackUrl: string;
}

export interface SunoWavRecordInfoRequest {
  taskId: string;
}

export type SunoWavTaskStatus =
  | "PENDING"
  | "SUCCESS"
  | "CREATE_TASK_FAILED"
  | "GENERATE_WAV_FAILED"
  | "CALLBACK_EXCEPTION";

export interface SunoWavRecordInfoData {
  taskId: string;
  musicId: string;
  callbackUrl: string;
  musicIndex: number;
  completeTime?: string | null;
  response?: {
    audioWavUrl: string;
    [key: string]: unknown;
  } | null;
  successFlag: SunoWavTaskStatus;
  createTime: string;
  errorCode: number | null;
  errorMessage: string | null;
  [key: string]: unknown;
}

export interface SunoWavRecordInfoResponse {
  code: number;
  msg?: string;
  data?: SunoWavRecordInfoData | null;
  [key: string]: unknown;
}

export interface SunoVocalRemovalRequest {
  taskId: string;
  audioId: string;
  callBackUrl: string;
  type?: "separate_vocal" | "split_stem";
}

export interface SunoVocalRemovalRecordInfoRequest {
  taskId: string;
}

export type SunoVocalRemovalTaskStatus =
  | "PENDING"
  | "SUCCESS"
  | "CREATE_TASK_FAILED"
  | "GENERATE_AUDIO_FAILED"
  | "CALLBACK_EXCEPTION";

export interface SunoVocalRemovalOriginDataItem {
  duration?: number;
  audio_url?: string;
  stem_type_group_name?: string;
  id?: string;
  [key: string]: unknown;
}

export interface SunoVocalRemovalRecordInfoResult {
  id?: string | null;
  originUrl?: string | null;
  originData?: SunoVocalRemovalOriginDataItem[];
  instrumentalUrl?: string | null;
  vocalUrl?: string | null;
  backingVocalsUrl?: string | null;
  drumsUrl?: string | null;
  bassUrl?: string | null;
  guitarUrl?: string | null;
  pianoUrl?: string | null;
  keyboardUrl?: string | null;
  percussionUrl?: string | null;
  stringsUrl?: string | null;
  synthUrl?: string | null;
  fxUrl?: string | null;
  brassUrl?: string | null;
  woodwindsUrl?: string | null;
  [key: string]: unknown;
}

export interface SunoVocalRemovalRecordInfoData {
  taskId: string;
  musicId?: string;
  callbackUrl?: string;
  musicIndex?: number;
  completeTime?: string | number | null;
  response?: SunoVocalRemovalRecordInfoResult | null;
  successFlag?: SunoVocalRemovalTaskStatus;
  createTime?: string | number;
  errorCode?: number | null;
  errorMessage?: string | null;
  [key: string]: unknown;
}

export interface SunoVocalRemovalRecordInfoResponse {
  code: number;
  msg?: string;
  data?: SunoVocalRemovalRecordInfoData | null;
  [key: string]: unknown;
}

export interface SunoMp4Request {
  taskId: string;
  audioId: string;
  callBackUrl: string;
  author?: string;
  domainName?: string;
}

export interface SunoMp4RecordInfoRequest {
  taskId: string;
}

export type SunoMp4TaskStatus =
  | "PENDING"
  | "SUCCESS"
  | "CREATE_TASK_FAILED"
  | "GENERATE_MP4_FAILED";

export interface SunoMp4RecordInfoResult {
  videoUrl?: string;
}

export interface SunoMp4RecordInfoData {
  taskId: string;
  musicId: string;
  callbackUrl: string;
  musicIndex: number;
  completeTime?: string | null;
  response?: SunoMp4RecordInfoResult | null;
  successFlag: SunoMp4TaskStatus;
  createTime: string;
  errorCode?: number | null;
  errorMessage?: string | null;
}

export interface SunoMp4RecordInfoResponse {
  code: number;
  msg?: string;
  data?: SunoMp4RecordInfoData | null;
}

export interface SunoLyricsRequest {
  prompt: string;
  callBackUrl: string;
}

export interface SunoLyricsRecordInfoRequest {
  taskId: string;
}

export type SunoLyricsTaskStatus =
  | "PENDING"
  | "SUCCESS"
  | "CREATE_TASK_FAILED"
  | "GENERATE_LYRICS_FAILED"
  | "CALLBACK_EXCEPTION"
  | "SENSITIVE_WORD_ERROR";

export interface SunoLyricsVariation {
  text: string;
  title: string;
  status?: string;
  errorMessage?: string;
}

export interface SunoLyricsRecordInfoResponse {
  code: number;
  msg?: string;
  data?: {
    taskId: string;
    param?: string;
    response?: {
      taskId?: string;
      data?: SunoLyricsVariation[];
    } | null;
    status?: SunoLyricsTaskStatus;
    errorCode?: number | null;
    errorMessage?: string | null;
  } | null;
}

export interface SunoBoostStyleRequest {
  content: string;
}

export interface SunoUploadCoverRequest {
  uploadUrl: string;
  prompt: string;
  customMode: boolean;
  instrumental: boolean;
  model: SunoModel | (string & {});
  callBackUrl: string;
  style?: string;
  title?: string;
  negativeTags?: string;
  vocalGender?: "m" | "f";
  styleWeight?: number;
  weirdnessConstraint?: number;
  audioWeight?: number;
  personaId?: string;
}

export interface SunoUploadExtendRequest {
  uploadUrl: string;
  defaultParamFlag: boolean;
  instrumental: boolean;
  continueAt: number;
  model: SunoModel | (string & {});
  callBackUrl: string;
  prompt?: string;
  style?: string;
  title?: string;
  negativeTags?: string;
  vocalGender?: "m" | "f";
  styleWeight?: number;
  weirdnessConstraint?: number;
  audioWeight?: number;
  personaId?: string;
}

export interface SunoMidiRequest {
  taskId: string;
  callBackUrl: string;
  audioId?: string;
}

export interface SunoMidiRecordInfoRequest {
  taskId: string;
}

// 0 pending, 1 success, 2 task creation failed, 3 MIDI generation failed.
export type SunoMidiSuccessFlag = 0 | 1 | 2 | 3;

export interface SunoMidiNote {
  pitch: number;
  start: number;
  end: number;
  velocity: number;
}

export interface SunoMidiInstrument {
  name: string;
  notes: SunoMidiNote[];
}

export interface SunoMidiData {
  // Kie returns an empty `midiData` object when the source track was separated
  // with `type: split_stem`, so both fields are optional.
  state?: string;
  instruments?: SunoMidiInstrument[];
}

export interface SunoMidiRecordInfoData {
  taskId: string;
  successFlag: SunoMidiSuccessFlag;
  recordTaskId?: number;
  audioId?: string;
  callbackUrl?: string;
  createTime?: number;
  completeTime?: number | null;
  // Documented as a nullable string; the sibling Suno pollers return numeric
  // codes, so both are accepted rather than rejected.
  errorCode?: string | number | null;
  errorMessage?: string | null;
  midiData?: SunoMidiData | null;
}

export interface SunoMidiRecordInfoResponse {
  code: number;
  msg?: string;
  // Kie returns `data: null` (not a 4xx) when the taskId doesn't exist.
  data?: SunoMidiRecordInfoData | null;
}

export type SunoMashupModel =
  | "V4"
  | "V4_5"
  | "V4_5PLUS"
  | "V4_5ALL"
  | "V5"
  | "V5_5";

export interface SunoMashupRequest {
  uploadUrlList: [string, string];
  customMode: boolean;
  model: SunoMashupModel | (string & {});
  callBackUrl: string;
  prompt?: string;
  style?: string;
  title?: string;
  instrumental?: boolean;
  vocalGender?: "m" | "f";
  styleWeight?: number;
  weirdnessConstraint?: number;
  audioWeight?: number;
}

export interface SunoReplaceSectionRequest {
  taskId: string;
  audioId: string;
  prompt: string;
  tags: string;
  title: string;
  infillStartS: number;
  infillEndS: number;
  negativeTags?: string;
  fullLyrics?: string;
  callBackUrl?: string;
}

export type SunoSoundsModel = "V5" | "V5_5";

export type SunoSoundsKey =
  | "Cm"
  | "C#m"
  | "Dm"
  | "D#m"
  | "Em"
  | "Fm"
  | "F#m"
  | "Gm"
  | "G#m"
  | "Am"
  | "A#m"
  | "Bm"
  | "C"
  | "C#"
  | "D"
  | "D#"
  | "E"
  | "F"
  | "F#"
  | "G"
  | "G#"
  | "A"
  | "A#"
  | "B";

export interface SunoSoundsRequest {
  prompt: string;
  model: SunoSoundsModel | (string & {});
  soundLoop?: boolean;
  soundTempo?: number;
  soundKey?: SunoSoundsKey;
  grabLyrics?: boolean;
  callBackUrl?: string;
}

export interface SunoAddInstrumentalRequest {
  uploadUrl: string;
  title: string;
  tags: string;
  callBackUrl: string;
  model: SunoModel | (string & {});
  negativeTags?: string;
  vocalGender?: "m" | "f";
  styleWeight?: number;
  weirdnessConstraint?: number;
  audioWeight?: number;
}

export interface SunoAddVocalsRequest {
  uploadUrl: string;
  prompt: string;
  title: string;
  style: string;
  negativeTags: string;
  callBackUrl: string;
  model: SunoModel | (string & {});
  vocalGender?: "m" | "f";
  styleWeight?: number;
  weirdnessConstraint?: number;
  audioWeight?: number;
}

interface SunoSubmitResponse {
  code: number;
  msg?: string;
  data?: {
    taskId?: string;
    audioId?: string;
  };
}

interface SunoGenerateCallable {
  (req: SunoGenerateRequest): Promise<SunoSubmitResponse>;
  schema: ApicitySchema<SunoGenerateRequest>;
  extend: SunoExtendMethod;
  uploadCover: SunoUploadCoverMethod;
  uploadExtend: SunoUploadExtendMethod;
  mashup: SunoMashupMethod;
  replaceSection: SunoReplaceSectionMethod;
  sounds: SunoSoundsMethod;
  addInstrumental: SunoAddInstrumentalMethod;
  addVocals: SunoAddVocalsMethod;
}

interface SunoExtendMethod {
  (req: SunoExtendRequest): Promise<SunoSubmitResponse>;
  schema: ApicitySchema<SunoExtendRequest>;
}

interface SunoWavMethod {
  (req: SunoWavRequest): Promise<SunoSubmitResponse>;
  schema: ApicitySchema<SunoWavRequest>;
}

interface SunoWavRecordInfoMethod {
  (taskId: string): Promise<SunoWavRecordInfoResponse>;
  schema: ApicitySchema<SunoWavRecordInfoRequest>;
  responseSchema: ApicitySchema<SunoWavRecordInfoResponse>;
}

interface SunoVocalRemovalMethod {
  (req: SunoVocalRemovalRequest): Promise<SunoSubmitResponse>;
  schema: ApicitySchema<SunoVocalRemovalRequest>;
}

interface SunoVocalRemovalRecordInfoMethod {
  (taskId: string): Promise<SunoVocalRemovalRecordInfoResponse>;
  schema: ApicitySchema<SunoVocalRemovalRecordInfoRequest>;
  responseSchema: ApicitySchema<SunoVocalRemovalRecordInfoResponse>;
}

interface SunoMp4Method {
  (req: SunoMp4Request): Promise<SunoSubmitResponse>;
  schema: ApicitySchema<SunoMp4Request>;
}

interface SunoMp4RecordInfoMethod {
  (taskId: string): Promise<SunoMp4RecordInfoResponse>;
  schema: ApicitySchema<SunoMp4RecordInfoRequest>;
  responseSchema: ApicitySchema<SunoMp4RecordInfoResponse>;
}

interface SunoLyricsMethod {
  (req: SunoLyricsRequest): Promise<SunoSubmitResponse>;
  schema: ApicitySchema<SunoLyricsRequest>;
}

interface SunoLyricsRecordInfoMethod {
  (taskId: string): Promise<SunoLyricsRecordInfoResponse>;
  schema: ApicitySchema<SunoLyricsRecordInfoRequest>;
  responseSchema: ApicitySchema<SunoLyricsRecordInfoResponse>;
}

interface SunoBoostStyleMethod {
  (req: SunoBoostStyleRequest): Promise<SunoSubmitResponse>;
  schema: ApicitySchema<SunoBoostStyleRequest>;
}

interface SunoUploadCoverMethod {
  (req: SunoUploadCoverRequest): Promise<SunoSubmitResponse>;
  schema: ApicitySchema<SunoUploadCoverRequest>;
}

interface SunoUploadExtendMethod {
  (req: SunoUploadExtendRequest): Promise<SunoSubmitResponse>;
  schema: ApicitySchema<SunoUploadExtendRequest>;
}

interface SunoMidiMethod {
  (req: SunoMidiRequest): Promise<SunoSubmitResponse>;
  schema: ApicitySchema<SunoMidiRequest>;
}

interface SunoMidiRecordInfoMethod {
  (taskId: string): Promise<SunoMidiRecordInfoResponse>;
  schema: ApicitySchema<SunoMidiRecordInfoRequest>;
  responseSchema: ApicitySchema<SunoMidiRecordInfoResponse>;
}

interface SunoMashupMethod {
  (req: SunoMashupRequest): Promise<SunoSubmitResponse>;
  schema: ApicitySchema<SunoMashupRequest>;
}

interface SunoReplaceSectionMethod {
  (req: SunoReplaceSectionRequest): Promise<SunoSubmitResponse>;
  schema: ApicitySchema<SunoReplaceSectionRequest>;
}

interface SunoSoundsMethod {
  (req: SunoSoundsRequest): Promise<SunoSubmitResponse>;
  schema: ApicitySchema<SunoSoundsRequest>;
}

interface SunoAddInstrumentalMethod {
  (req: SunoAddInstrumentalRequest): Promise<SunoSubmitResponse>;
  schema: ApicitySchema<SunoAddInstrumentalRequest>;
}

interface SunoAddVocalsMethod {
  (req: SunoAddVocalsRequest): Promise<SunoSubmitResponse>;
  schema: ApicitySchema<SunoAddVocalsRequest>;
}

interface SunoWavNamespace {
  generate: SunoWavMethod;
}

interface SunoVocalRemovalNamespace {
  generate: SunoVocalRemovalMethod;
}

interface SunoVocalRemovalGetNamespace {
  recordInfo: SunoVocalRemovalRecordInfoMethod;
}

interface SunoMp4Namespace {
  generate: SunoMp4Method;
}

interface SunoStyleNamespace {
  generate: SunoBoostStyleMethod;
}

interface SunoMidiNamespace {
  generate: SunoMidiMethod;
}

interface SunoV1PostNamespace {
  generate: SunoGenerateCallable;
  wav: SunoWavNamespace;
  vocalRemoval: SunoVocalRemovalNamespace;
  mp4: SunoMp4Namespace;
  lyrics: SunoLyricsMethod;
  style: SunoStyleNamespace;
  midi: SunoMidiNamespace;
}

interface SunoV1GetNamespace {
  generate: {
    recordInfo: (taskId: string) => Promise<SunoRecordInfoResponse>;
  };
  mp4: {
    recordInfo: SunoMp4RecordInfoMethod;
  };
  lyrics: {
    recordInfo: SunoLyricsRecordInfoMethod;
  };
  midi: {
    recordInfo: SunoMidiRecordInfoMethod;
  };
  wav: {
    recordInfo: SunoWavRecordInfoMethod;
  };
  vocalRemoval: SunoVocalRemovalGetNamespace;
}

interface SunoPostApiNamespace {
  v1: SunoV1PostNamespace;
}

interface SunoGetApiNamespace {
  v1: SunoV1GetNamespace;
}

export interface SunoProvider {
  post: { api: SunoPostApiNamespace };
  get: { api: SunoGetApiNamespace };
}

// Zod schemas for new request types (hardcoded inline for simplicity)
const SunoExtendRequestSchema = z.object({
  defaultParamFlag: z.boolean(),
  audioId: z.string().min(1),
  prompt: z.string().min(1),
  model: z
    .enum(["V3_5", "V4", "V4_5", "V4_5PLUS", "V4_5ALL", "V5", "V5_5"])
    .or(SunoModelAliasSchema),
  callBackUrl: z.string().min(1),
  style: z.string().optional(),
  title: z.string().optional(),
  continueAt: z.number().optional(),
  negativeTags: z.string().optional(),
  vocalGender: z.enum(["m", "f"]).optional(),
  styleWeight: z.number().min(0).max(1).optional(),
  weirdnessConstraint: z.number().min(0).max(1).optional(),
  audioWeight: z.number().min(0).max(1).optional(),
  personaId: z.string().optional(),
});

const SunoWavRequestSchema = z.object({
  taskId: z.string().min(1),
  audioId: z.string().min(1),
  callBackUrl: z.string().min(1),
});

const SunoWavRecordInfoRequestSchema = z
  .object({
    taskId: z.string().min(1),
  })
  .passthrough();

const SunoWavTaskStatusSchema = z.enum([
  "PENDING",
  "SUCCESS",
  "CREATE_TASK_FAILED",
  "GENERATE_WAV_FAILED",
  "CALLBACK_EXCEPTION",
]);

const SunoWavRecordInfoDataSchema = z
  .object({
    taskId: z.string(),
    musicId: z.string(),
    callbackUrl: z.string(),
    musicIndex: z.number().int(),
    completeTime: z.string().nullable().optional(),
    response: z
      .object({
        audioWavUrl: z.string(),
      })
      .passthrough()
      .nullable()
      .optional(),
    successFlag: SunoWavTaskStatusSchema,
    createTime: z.string(),
    errorCode: z.number().int().nullable(),
    errorMessage: z.string().nullable(),
  })
  .passthrough();

const SunoWavRecordInfoResponseSchema = z
  .object({
    code: z.number().int(),
    msg: z.string().optional(),
    data: SunoWavRecordInfoDataSchema.nullable().optional(),
  })
  .passthrough();

const SunoVocalRemovalRequestSchema = z.object({
  taskId: z.string().min(1),
  audioId: z.string().min(1),
  callBackUrl: z.string().min(1),
  type: z.enum(["separate_vocal", "split_stem"]).optional(),
});

const SunoVocalRemovalRecordInfoRequestSchema = z
  .object({
    taskId: z.string().min(1),
  })
  .passthrough();

const SunoVocalRemovalTaskStatusSchema = z.enum([
  "PENDING",
  "SUCCESS",
  "CREATE_TASK_FAILED",
  "GENERATE_AUDIO_FAILED",
  "CALLBACK_EXCEPTION",
]);

const SunoVocalRemovalOriginDataItemSchema = z
  .object({
    duration: z.number().optional(),
    audio_url: z.string().optional(),
    stem_type_group_name: z.string().optional(),
    id: z.string().optional(),
  })
  .passthrough();

const SunoVocalRemovalRecordInfoResultSchema = z
  .object({
    id: z.string().nullable().optional(),
    originUrl: z.string().nullable().optional(),
    originData: z.array(SunoVocalRemovalOriginDataItemSchema).optional(),
    instrumentalUrl: z.string().nullable().optional(),
    vocalUrl: z.string().nullable().optional(),
    backingVocalsUrl: z.string().nullable().optional(),
    drumsUrl: z.string().nullable().optional(),
    bassUrl: z.string().nullable().optional(),
    guitarUrl: z.string().nullable().optional(),
    pianoUrl: z.string().nullable().optional(),
    keyboardUrl: z.string().nullable().optional(),
    percussionUrl: z.string().nullable().optional(),
    stringsUrl: z.string().nullable().optional(),
    synthUrl: z.string().nullable().optional(),
    fxUrl: z.string().nullable().optional(),
    brassUrl: z.string().nullable().optional(),
    woodwindsUrl: z.string().nullable().optional(),
  })
  .passthrough();

const SunoVocalRemovalRecordInfoDataSchema = z
  .object({
    taskId: z.string(),
    musicId: z.string().optional(),
    callbackUrl: z.string().optional(),
    musicIndex: z.number().int().optional(),
    // Upstream examples send epoch millis; docs also mention date-time strings.
    completeTime: z.union([z.string(), z.number()]).nullable().optional(),
    response: SunoVocalRemovalRecordInfoResultSchema.nullable().optional(),
    successFlag: SunoVocalRemovalTaskStatusSchema.optional(),
    createTime: z.union([z.string(), z.number()]).optional(),
    errorCode: z.number().nullable().optional(),
    errorMessage: z.string().nullable().optional(),
  })
  .passthrough();

const SunoVocalRemovalRecordInfoResponseSchema = z
  .object({
    code: z.number().int(),
    msg: z.string().optional(),
    data: SunoVocalRemovalRecordInfoDataSchema.nullable().optional(),
  })
  .passthrough();

const SunoMp4RequestSchema = z.object({
  taskId: z.string().min(1),
  audioId: z.string().min(1),
  callBackUrl: z.string().min(1),
  author: z.string().max(50).optional(),
  domainName: z.string().max(50).optional(),
});

const SunoMp4RecordInfoRequestSchema = z.object({
  taskId: z.string().min(1),
});

const SunoMp4TaskStatusSchema = z.enum([
  "PENDING",
  "SUCCESS",
  "CREATE_TASK_FAILED",
  "GENERATE_MP4_FAILED",
]);

const SunoMp4RecordInfoResultSchema = z
  .object({
    videoUrl: z.string().optional(),
  })
  .passthrough();

const SunoMp4RecordInfoDataSchema = z
  .object({
    taskId: z.string(),
    musicId: z.string(),
    callbackUrl: z.string(),
    musicIndex: z.number().int(),
    completeTime: z.string().nullable().optional(),
    response: SunoMp4RecordInfoResultSchema.nullable().optional(),
    successFlag: SunoMp4TaskStatusSchema,
    createTime: z.string(),
    errorCode: z.number().int().nullable().optional(),
    errorMessage: z.string().nullable().optional(),
  })
  .passthrough();

const SunoMp4RecordInfoResponseSchema = z.object({
  code: z.number().int(),
  msg: z.string().optional(),
  data: SunoMp4RecordInfoDataSchema.nullable().optional(),
});

const SunoLyricsRequestSchema = z.object({
  prompt: z.string().min(1).max(200),
  callBackUrl: z.string().min(1),
});

const SunoLyricsRecordInfoRequestSchema = z.object({
  taskId: z.string().min(1),
});

const SunoLyricsTaskStatusSchema = z.enum([
  "PENDING",
  "SUCCESS",
  "CREATE_TASK_FAILED",
  "GENERATE_LYRICS_FAILED",
  "CALLBACK_EXCEPTION",
  "SENSITIVE_WORD_ERROR",
]);

const SunoLyricsVariationSchema = z
  .object({
    text: z.string(),
    title: z.string(),
    status: z.string().optional(),
    errorMessage: z.string().optional(),
  })
  .passthrough();

const SunoLyricsRecordInfoResponseSchema = z.object({
  code: z.number().int(),
  msg: z.string().optional(),
  data: z
    .object({
      taskId: z.string(),
      param: z.string().optional(),
      response: z
        .object({
          taskId: z.string().optional(),
          data: z.array(SunoLyricsVariationSchema).optional(),
        })
        .passthrough()
        .nullable()
        .optional(),
      status: SunoLyricsTaskStatusSchema.optional(),
      errorCode: z.number().int().nullable().optional(),
      errorMessage: z.string().nullable().optional(),
    })
    .passthrough()
    .nullable()
    .optional(),
});

const SunoBoostStyleRequestSchema = z.object({
  content: z.string().min(1),
});

const SunoUploadCoverRequestSchema = z.object({
  uploadUrl: z.string().min(1),
  prompt: z.string().min(1),
  customMode: z.boolean(),
  instrumental: z.boolean(),
  model: z
    .enum(["V3_5", "V4", "V4_5", "V4_5PLUS", "V4_5ALL", "V5", "V5_5"])
    .or(SunoModelAliasSchema),
  callBackUrl: z.string().min(1),
  style: z.string().optional(),
  title: z.string().optional(),
  negativeTags: z.string().optional(),
  vocalGender: z.enum(["m", "f"]).optional(),
  styleWeight: z.number().min(0).max(1).optional(),
  weirdnessConstraint: z.number().min(0).max(1).optional(),
  audioWeight: z.number().min(0).max(1).optional(),
  personaId: z.string().optional(),
});

const SunoUploadExtendRequestSchema = z.object({
  uploadUrl: z.string().min(1),
  defaultParamFlag: z.boolean(),
  instrumental: z.boolean(),
  continueAt: z.number(),
  model: z
    .enum(["V3_5", "V4", "V4_5", "V4_5PLUS", "V4_5ALL", "V5", "V5_5"])
    .or(SunoModelAliasSchema),
  callBackUrl: z.string().min(1),
  prompt: z.string().optional(),
  style: z.string().optional(),
  title: z.string().optional(),
  negativeTags: z.string().optional(),
  vocalGender: z.enum(["m", "f"]).optional(),
  styleWeight: z.number().min(0).max(1).optional(),
  weirdnessConstraint: z.number().min(0).max(1).optional(),
  audioWeight: z.number().min(0).max(1).optional(),
  personaId: z.string().optional(),
});

const SunoMidiRequestSchema = z.object({
  taskId: z.string().min(1),
  callBackUrl: z.string().min(1),
  audioId: z.string().optional(),
});

const SunoMidiRecordInfoRequestSchema = z.object({
  taskId: z.string().min(1),
});

const SunoMidiSuccessFlagSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
]);

const SunoMidiNoteSchema = z
  .object({
    pitch: z.number(),
    start: z.number(),
    end: z.number(),
    velocity: z.number(),
  })
  .passthrough();

const SunoMidiInstrumentSchema = z
  .object({
    name: z.string(),
    notes: z.array(SunoMidiNoteSchema),
  })
  .passthrough();

const SunoMidiDataSchema = z
  .object({
    state: z.string().optional(),
    instruments: z.array(SunoMidiInstrumentSchema).optional(),
  })
  .passthrough();

const SunoMidiRecordInfoResponseSchema = z
  .object({
    code: z.number().int(),
    msg: z.string().optional(),
    data: z
      .object({
        taskId: z.string(),
        successFlag: SunoMidiSuccessFlagSchema,
        recordTaskId: z.number().int().optional(),
        audioId: z.string().optional(),
        callbackUrl: z.string().optional(),
        createTime: z.number().int().optional(),
        completeTime: z.number().int().nullable().optional(),
        errorCode: z
          .union([z.string(), z.number().int()])
          .nullable()
          .optional(),
        errorMessage: z.string().nullable().optional(),
        midiData: SunoMidiDataSchema.nullable().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
  })
  .passthrough();

const SunoMashupRequestSchema = z.object({
  uploadUrlList: z.tuple([z.string().min(1), z.string().min(1)]),
  customMode: z.boolean(),
  model: z
    .enum(["V4", "V4_5", "V4_5PLUS", "V4_5ALL", "V5", "V5_5"])
    .or(SunoModelAliasSchema),
  callBackUrl: z.string().min(1),
  prompt: z.string().optional(),
  style: z.string().optional(),
  title: z.string().optional(),
  instrumental: z.boolean().optional(),
  vocalGender: z.enum(["m", "f"]).optional(),
  styleWeight: z.number().min(0).max(1).optional(),
  weirdnessConstraint: z.number().min(0).max(1).optional(),
  audioWeight: z.number().min(0).max(1).optional(),
});

const SunoReplaceSectionRequestSchema = z.object({
  taskId: z.string().min(1),
  audioId: z.string().min(1),
  prompt: z.string().min(1),
  tags: z.string().min(1),
  title: z.string().min(1),
  infillStartS: z.number().min(0),
  infillEndS: z.number().min(0),
  negativeTags: z.string().optional(),
  fullLyrics: z.string().optional(),
  callBackUrl: z.string().optional(),
});

const SunoSoundsRequestSchema = z.object({
  prompt: z.string().min(1),
  model: z.enum(["V5", "V5_5"]).or(SunoModelAliasSchema),
  soundLoop: z.boolean().optional(),
  soundTempo: z.number().min(1).max(300).optional(),
  soundKey: z
    .enum([
      "Cm",
      "C#m",
      "Dm",
      "D#m",
      "Em",
      "Fm",
      "F#m",
      "Gm",
      "G#m",
      "Am",
      "A#m",
      "Bm",
      "C",
      "C#",
      "D",
      "D#",
      "E",
      "F",
      "F#",
      "G",
      "G#",
      "A",
      "A#",
      "B",
    ])
    .optional(),
  grabLyrics: z.boolean().optional(),
  callBackUrl: z.string().optional(),
});

const SunoAddInstrumentalRequestSchema = z.object({
  uploadUrl: z.string().min(1),
  title: z.string().min(1),
  tags: z.string().min(1),
  callBackUrl: z.string().min(1),
  model: z
    .enum(["V3_5", "V4", "V4_5", "V4_5PLUS", "V4_5ALL", "V5", "V5_5"])
    .or(SunoModelAliasSchema),
  negativeTags: z.string().optional(),
  vocalGender: z.enum(["m", "f"]).optional(),
  styleWeight: z.number().min(0).max(1).optional(),
  weirdnessConstraint: z.number().min(0).max(1).optional(),
  audioWeight: z.number().min(0).max(1).optional(),
});

const SunoAddVocalsRequestSchema = z.object({
  uploadUrl: z.string().min(1),
  prompt: z.string().min(1),
  title: z.string().min(1),
  style: z.string().min(1),
  negativeTags: z.string().min(1),
  callBackUrl: z.string().min(1),
  model: z
    .enum(["V3_5", "V4", "V4_5", "V4_5PLUS", "V4_5ALL", "V5", "V5_5"])
    .or(SunoModelAliasSchema),
  vocalGender: z.enum(["m", "f"]).optional(),
  styleWeight: z.number().min(0).max(1).optional(),
  weirdnessConstraint: z.number().min(0).max(1).optional(),
  audioWeight: z.number().min(0).max(1).optional(),
});

export function createSunoProvider(
  baseURL: string,
  apiKey: string,
  doFetch: typeof fetch,
  timeout: number
): SunoProvider {
  const transport = createKieTransport({
    baseURL,
    apiKey,
    doFetch,
    timeout,
    requestFailedPrefix: "Kie request failed",
  });

  // POST https://api.kie.ai/api/v1/generate
  // Docs: https://docs.kie.ai/suno-api/generate-music
  async function createTask(
    req: SunoGenerateRequest
  ): Promise<SunoSubmitResponse> {
    return kieRequest<SunoSubmitResponse>(transport, {
      method: "POST",
      path: "/api/v1/generate",
      body: req,
    });
  }

  // POST https://api.kie.ai/api/v1/generate/extend
  // Docs: https://docs.kie.ai/suno-api/extend-music
  async function extendTask(
    req: SunoExtendRequest
  ): Promise<SunoSubmitResponse> {
    return kieRequest<SunoSubmitResponse>(transport, {
      method: "POST",
      path: "/api/v1/generate/extend",
      body: req,
    });
  }

  // GET https://api.kie.ai/api/v1/generate/record-info?taskId={taskId}
  // Docs: https://docs.kie.ai/suno-api/get-music-details
  async function recordInfo(taskId: string): Promise<SunoRecordInfoResponse> {
    return kieRequest<SunoRecordInfoResponse>(transport, {
      method: "GET",
      path: `/api/v1/generate/record-info?taskId=${encodeURIComponent(taskId)}`,
    });
  }

  // POST https://api.kie.ai/api/v1/wav/generate
  // Docs: https://docs.kie.ai/suno-api/convert-to-wav
  async function wavGenerate(req: SunoWavRequest): Promise<SunoSubmitResponse> {
    return kieRequest<SunoSubmitResponse>(transport, {
      method: "POST",
      path: "/api/v1/wav/generate",
      body: req,
    });
  }

  // GET https://api.kie.ai/api/v1/wav/record-info?taskId={taskId}
  // Docs: https://docs.kie.ai/suno-api/get-wav-details
  async function wavRecordInfo(
    taskId: string
  ): Promise<SunoWavRecordInfoResponse> {
    return kieRequest<SunoWavRecordInfoResponse>(transport, {
      method: "GET",
      path: `/api/v1/wav/record-info?taskId=${encodeURIComponent(taskId)}`,
    });
  }

  // POST https://api.kie.ai/api/v1/vocal-removal/generate
  // Docs: https://docs.kie.ai/suno-api/separate-vocals
  async function vocalRemovalGenerate(
    req: SunoVocalRemovalRequest
  ): Promise<SunoSubmitResponse> {
    return kieRequest<SunoSubmitResponse>(transport, {
      method: "POST",
      path: "/api/v1/vocal-removal/generate",
      body: req,
    });
  }

  // GET https://api.kie.ai/api/v1/vocal-removal/record-info?taskId={taskId}
  // Docs: https://docs.kie.ai/suno-api/get-vocal-separation-details
  async function vocalRemovalRecordInfo(
    taskId: string
  ): Promise<SunoVocalRemovalRecordInfoResponse> {
    return kieRequest<SunoVocalRemovalRecordInfoResponse>(transport, {
      method: "GET",
      path: `/api/v1/vocal-removal/record-info?taskId=${encodeURIComponent(taskId)}`,
    });
  }

  // POST https://api.kie.ai/api/v1/mp4/generate
  // Docs: https://docs.kie.ai/suno-api/create-music-video
  async function mp4Generate(req: SunoMp4Request): Promise<SunoSubmitResponse> {
    return kieRequest<SunoSubmitResponse>(transport, {
      method: "POST",
      path: "/api/v1/mp4/generate",
      body: req,
    });
  }

  // GET https://api.kie.ai/api/v1/mp4/record-info?taskId={taskId}
  // Docs: https://docs.kie.ai/suno-api/get-music-video-details
  async function mp4RecordInfo(
    taskId: string
  ): Promise<SunoMp4RecordInfoResponse> {
    return kieRequest<SunoMp4RecordInfoResponse>(transport, {
      method: "GET",
      path: `/api/v1/mp4/record-info?taskId=${encodeURIComponent(taskId)}`,
    });
  }

  // POST https://api.kie.ai/api/v1/lyrics
  // Docs: https://docs.kie.ai/suno-api/generate-lyrics
  async function lyricsGenerate(
    req: SunoLyricsRequest
  ): Promise<SunoSubmitResponse> {
    return kieRequest<SunoSubmitResponse>(transport, {
      method: "POST",
      path: "/api/v1/lyrics",
      body: req,
    });
  }

  // GET https://api.kie.ai/api/v1/lyrics/record-info?taskId={taskId}
  // Docs: https://docs.kie.ai/suno-api/get-lyrics-details
  async function lyricsRecordInfo(
    taskId: string
  ): Promise<SunoLyricsRecordInfoResponse> {
    return kieRequest<SunoLyricsRecordInfoResponse>(transport, {
      method: "GET",
      path: `/api/v1/lyrics/record-info?taskId=${encodeURIComponent(taskId)}`,
    });
  }

  // POST https://api.kie.ai/api/v1/style/generate
  // Docs: https://docs.kie.ai/suno-api/boost-music-style
  async function boostStyle(
    req: SunoBoostStyleRequest
  ): Promise<SunoSubmitResponse> {
    return kieRequest<SunoSubmitResponse>(transport, {
      method: "POST",
      path: "/api/v1/style/generate",
      body: req,
    });
  }

  // POST https://api.kie.ai/api/v1/generate/upload-cover
  // Docs: https://docs.kie.ai/suno-api/upload-and-cover-audio
  async function uploadCover(
    req: SunoUploadCoverRequest
  ): Promise<SunoSubmitResponse> {
    return kieRequest<SunoSubmitResponse>(transport, {
      method: "POST",
      path: "/api/v1/generate/upload-cover",
      body: req,
    });
  }

  // POST https://api.kie.ai/api/v1/generate/upload-extend
  // Docs: https://docs.kie.ai/suno-api/upload-and-extend-audio
  async function uploadExtend(
    req: SunoUploadExtendRequest
  ): Promise<SunoSubmitResponse> {
    return kieRequest<SunoSubmitResponse>(transport, {
      method: "POST",
      path: "/api/v1/generate/upload-extend",
      body: req,
    });
  }

  // POST https://api.kie.ai/api/v1/midi/generate
  // Docs: https://docs.kie.ai/suno-api/generate-midi
  async function midiGenerate(
    req: SunoMidiRequest
  ): Promise<SunoSubmitResponse> {
    return kieRequest<SunoSubmitResponse>(transport, {
      method: "POST",
      path: "/api/v1/midi/generate",
      body: req,
    });
  }

  // GET https://api.kie.ai/api/v1/midi/record-info?taskId={taskId}
  // Docs: https://docs.kie.ai/suno-api/get-midi-details
  async function midiRecordInfo(
    taskId: string
  ): Promise<SunoMidiRecordInfoResponse> {
    return kieRequest<SunoMidiRecordInfoResponse>(transport, {
      method: "GET",
      path: `/api/v1/midi/record-info?taskId=${encodeURIComponent(taskId)}`,
    });
  }

  // POST https://api.kie.ai/api/v1/generate/mashup
  // Docs: https://docs.kie.ai/suno-api/generate-mashup
  async function mashupGenerate(
    req: SunoMashupRequest
  ): Promise<SunoSubmitResponse> {
    return kieRequest<SunoSubmitResponse>(transport, {
      method: "POST",
      path: "/api/v1/generate/mashup",
      body: req,
    });
  }

  // POST https://api.kie.ai/api/v1/generate/replace-section
  // Docs: https://docs.kie.ai/suno-api/replace-section
  async function replaceSectionGenerate(
    req: SunoReplaceSectionRequest
  ): Promise<SunoSubmitResponse> {
    return kieRequest<SunoSubmitResponse>(transport, {
      method: "POST",
      path: "/api/v1/generate/replace-section",
      body: req,
    });
  }

  // POST https://api.kie.ai/api/v1/generate/sounds
  // Docs: https://docs.kie.ai/suno-api/generate-sounds
  async function soundsGenerate(
    req: SunoSoundsRequest
  ): Promise<SunoSubmitResponse> {
    return kieRequest<SunoSubmitResponse>(transport, {
      method: "POST",
      path: "/api/v1/generate/sounds",
      body: req,
    });
  }

  // POST https://api.kie.ai/api/v1/generate/add-instrumental
  // Docs: https://docs.kie.ai/suno-api/add-instrumental
  async function addInstrumentalGenerate(
    req: SunoAddInstrumentalRequest
  ): Promise<SunoSubmitResponse> {
    return kieRequest<SunoSubmitResponse>(transport, {
      method: "POST",
      path: "/api/v1/generate/add-instrumental",
      body: req,
    });
  }

  // POST https://api.kie.ai/api/v1/generate/add-vocals
  // Docs: https://docs.kie.ai/suno-api/add-vocals
  async function addVocalsGenerate(
    req: SunoAddVocalsRequest
  ): Promise<SunoSubmitResponse> {
    return kieRequest<SunoSubmitResponse>(transport, {
      method: "POST",
      path: "/api/v1/generate/add-vocals",
      body: req,
    });
  }

  const extendMethod = Object.assign(extendTask, {
    schema: SunoExtendRequestSchema,
  });

  const generateCallable = Object.assign(createTask, {
    schema: SunoGenerateRequestSchema,
    extend: extendMethod,
    uploadCover: Object.assign(uploadCover, {
      schema: SunoUploadCoverRequestSchema,
    }),
    uploadExtend: Object.assign(uploadExtend, {
      schema: SunoUploadExtendRequestSchema,
    }),
    mashup: Object.assign(mashupGenerate, {
      schema: SunoMashupRequestSchema,
    }),
    replaceSection: Object.assign(replaceSectionGenerate, {
      schema: SunoReplaceSectionRequestSchema,
    }),
    sounds: Object.assign(soundsGenerate, {
      schema: SunoSoundsRequestSchema,
    }),
    addInstrumental: Object.assign(addInstrumentalGenerate, {
      schema: SunoAddInstrumentalRequestSchema,
    }),
    addVocals: Object.assign(addVocalsGenerate, {
      schema: SunoAddVocalsRequestSchema,
    }),
  });

  return {
    post: {
      api: {
        v1: {
          generate: generateCallable,
          wav: {
            generate: Object.assign(wavGenerate, {
              schema: SunoWavRequestSchema,
            }),
          },
          vocalRemoval: {
            generate: Object.assign(vocalRemovalGenerate, {
              schema: SunoVocalRemovalRequestSchema,
            }),
          },
          mp4: {
            generate: Object.assign(mp4Generate, {
              schema: SunoMp4RequestSchema,
            }),
          },
          lyrics: Object.assign(lyricsGenerate, {
            schema: SunoLyricsRequestSchema,
          }),
          style: {
            generate: Object.assign(boostStyle, {
              schema: SunoBoostStyleRequestSchema,
            }),
          },
          midi: {
            generate: Object.assign(midiGenerate, {
              schema: SunoMidiRequestSchema,
            }),
          },
        },
      },
    },
    get: {
      api: {
        v1: {
          generate: {
            recordInfo,
          },
          mp4: {
            recordInfo: Object.assign(mp4RecordInfo, {
              schema: SunoMp4RecordInfoRequestSchema,
              responseSchema: SunoMp4RecordInfoResponseSchema,
            }),
          },
          lyrics: {
            recordInfo: Object.assign(lyricsRecordInfo, {
              schema: SunoLyricsRecordInfoRequestSchema,
              responseSchema: SunoLyricsRecordInfoResponseSchema,
            }),
          },
          midi: {
            recordInfo: Object.assign(midiRecordInfo, {
              schema: SunoMidiRecordInfoRequestSchema,
              responseSchema: SunoMidiRecordInfoResponseSchema,
            }),
          },
          wav: {
            recordInfo: Object.assign(wavRecordInfo, {
              schema: SunoWavRecordInfoRequestSchema,
              responseSchema: SunoWavRecordInfoResponseSchema,
            }),
          },
          vocalRemoval: {
            recordInfo: Object.assign(vocalRemovalRecordInfo, {
              schema: SunoVocalRemovalRecordInfoRequestSchema,
              responseSchema: SunoVocalRemovalRecordInfoResponseSchema,
            }),
          },
        },
      },
    },
  };
}
