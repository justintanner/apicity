/**
 * Suno callback payloads — bodies kie POSTs to callBackUrl.
 *
 * Dedicated callback pages under https://docs.kie.ai/suno-api/ (15):
 * - generate-music-callbacks
 * - extend-music-callbacks
 * - upload-and-cover-audio-callbacks
 * - upload-and-extend-audio-callbacks
 * - add-instrumental-callbacks
 * - add-vocals-callbacks
 * - cover-suno-callbacks
 * - replace-section-callbacks
 * - separate-vocals-callbacks
 * - generate-midi-callbacks
 * - convert-to-wav-callbacks
 * - generate-lyrics-callbacks
 * - create-music-video-callbacks
 * - suno-voice-generate-callback
 * - suno-voice-validate-callback
 *
 * Type-surface only (not request endpoints). Pair with
 * `verifyKieWebhookRequest` for HMAC verification of the inbound POST.
 */
import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared music-track family
// (generate, extend, add-instrumental, add-vocals, replace-section)
// ---------------------------------------------------------------------------

export const SunoMusicCallbackTypeSchema = z
  .enum(["text", "first", "complete", "error"])
  .or(z.string());

export const SunoMusicTrackSchema = z
  .object({
    id: z.string().optional(),
    audio_url: z.string().optional(),
    stream_audio_url: z.string().optional(),
    image_url: z.string().optional(),
    prompt: z.string().optional(),
    model_name: z.string().optional(),
    title: z.string().optional(),
    tags: z.string().optional(),
    createTime: z.string().optional(),
    duration: z.number().optional(),
  })
  .passthrough();

export const SunoMusicCallbackDataSchema = z
  .object({
    callbackType: SunoMusicCallbackTypeSchema,
    task_id: z.string(),
    /** Present on success stages; null or [] on failure (docs vary). */
    data: z.array(SunoMusicTrackSchema).nullable().optional(),
    /** replace-section failure example includes a string error. */
    error: z.string().optional(),
  })
  .passthrough();

export const SunoMusicCallbackPayloadSchema = z
  .object({
    code: z.number().int(),
    msg: z.string(),
    data: SunoMusicCallbackDataSchema,
  })
  .passthrough();

/** Generate music — docs: /suno-api/generate-music-callbacks */
export const SunoGenerateCallbackDataSchema = SunoMusicCallbackDataSchema;
export const SunoGenerateCallbackPayloadSchema = SunoMusicCallbackPayloadSchema;
export const SunoGenerateCallbackTrackSchema = SunoMusicTrackSchema;

/** Extend music — docs: /suno-api/extend-music-callbacks */
export const SunoExtendCallbackDataSchema = SunoMusicCallbackDataSchema;
export const SunoExtendCallbackPayloadSchema = SunoMusicCallbackPayloadSchema;
export const SunoExtendCallbackTrackSchema = SunoMusicTrackSchema;

/** Add instrumental — docs: /suno-api/add-instrumental-callbacks */
export const SunoAddInstrumentalCallbackDataSchema =
  SunoMusicCallbackDataSchema;
export const SunoAddInstrumentalCallbackPayloadSchema =
  SunoMusicCallbackPayloadSchema;
export const SunoAddInstrumentalCallbackTrackSchema = SunoMusicTrackSchema;

/** Add vocals — docs: /suno-api/add-vocals-callbacks */
export const SunoAddVocalsCallbackDataSchema = SunoMusicCallbackDataSchema;
export const SunoAddVocalsCallbackPayloadSchema =
  SunoMusicCallbackPayloadSchema;
export const SunoAddVocalsCallbackTrackSchema = SunoMusicTrackSchema;

/** Replace section — docs: /suno-api/replace-section-callbacks */
export const SunoReplaceSectionCallbackDataSchema = SunoMusicCallbackDataSchema;
export const SunoReplaceSectionCallbackPayloadSchema =
  SunoMusicCallbackPayloadSchema;
export const SunoReplaceSectionCallbackTrackSchema = SunoMusicTrackSchema;

// ---------------------------------------------------------------------------
// Upload family (cover / extend) — includes source_* URL fields
// ---------------------------------------------------------------------------

export const SunoUploadTrackSchema = z
  .object({
    id: z.string().optional(),
    audio_url: z.string().optional(),
    source_audio_url: z.string().optional(),
    stream_audio_url: z.string().optional(),
    source_stream_audio_url: z.string().optional(),
    image_url: z.string().optional(),
    source_image_url: z.string().optional(),
    prompt: z.string().optional(),
    model_name: z.string().optional(),
    title: z.string().optional(),
    tags: z.string().optional(),
    createTime: z.string().optional(),
    duration: z.number().optional(),
  })
  .passthrough();

export const SunoUploadCallbackDataSchema = z
  .object({
    callbackType: SunoMusicCallbackTypeSchema,
    task_id: z.string(),
    data: z.array(SunoUploadTrackSchema).nullable().optional(),
  })
  .passthrough();

export const SunoUploadCallbackPayloadSchema = z
  .object({
    code: z.number().int(),
    msg: z.string(),
    data: SunoUploadCallbackDataSchema,
  })
  .passthrough();

/** Upload-and-cover — docs: /suno-api/upload-and-cover-audio-callbacks */
export const SunoUploadCoverCallbackDataSchema = SunoUploadCallbackDataSchema;
export const SunoUploadCoverCallbackPayloadSchema =
  SunoUploadCallbackPayloadSchema;
export const SunoUploadCoverCallbackTrackSchema = SunoUploadTrackSchema;

/** Upload-and-extend — docs: /suno-api/upload-and-extend-audio-callbacks */
export const SunoUploadExtendCallbackDataSchema = SunoUploadCallbackDataSchema;
export const SunoUploadExtendCallbackPayloadSchema =
  SunoUploadCallbackPayloadSchema;
export const SunoUploadExtendCallbackTrackSchema = SunoUploadTrackSchema;

// ---------------------------------------------------------------------------
// Cover image generation (suno/cover) — different shape: taskId + images
// ---------------------------------------------------------------------------

export const SunoCoverCallbackDataSchema = z
  .object({
    taskId: z.string(),
    images: z.array(z.string()).nullable().optional(),
  })
  .passthrough();

export const SunoCoverCallbackPayloadSchema = z
  .object({
    code: z.number().int(),
    msg: z.string(),
    data: SunoCoverCallbackDataSchema,
  })
  .passthrough();

// ---------------------------------------------------------------------------
// Vocal / stem separation
// ---------------------------------------------------------------------------

export const SunoVocalSeparationInfoSchema = z
  .object({
    origin_url: z.string().optional(),
    vocal_url: z.string().optional(),
    instrumental_url: z.string().optional(),
    backing_vocals_url: z.string().optional(),
    bass_url: z.string().optional(),
    brass_url: z.string().optional(),
    drums_url: z.string().optional(),
    fx_url: z.string().optional(),
    guitar_url: z.string().optional(),
    keyboard_url: z.string().optional(),
    percussion_url: z.string().optional(),
    strings_url: z.string().optional(),
    synth_url: z.string().optional(),
    woodwinds_url: z.string().optional(),
  })
  .passthrough();

export const SunoVocalRemovalCallbackStemPartSchema = z
  .object({
    duration: z.number().optional(),
    audio_url: z.string().optional(),
    stem_type_group_name: z.string().optional(),
    id: z.string().optional(),
  })
  .passthrough();

export const SunoVocalRemovalCallbackOriginDataItemSchema = z
  .object({
    extract: SunoVocalRemovalCallbackStemPartSchema.optional(),
    remove: SunoVocalRemovalCallbackStemPartSchema.optional(),
  })
  .passthrough();

export const SunoVocalRemovalCallbackInfoSchema = z
  .object({
    origin_data: z
      .array(SunoVocalRemovalCallbackOriginDataItemSchema)
      .optional(),
  })
  .passthrough();

export const SunoVocalSeparationCallbackDataSchema = z
  .object({
    task_id: z.string(),
    /** separate_vocal / split_stem success; null on failure. */
    vocal_separation_info: SunoVocalSeparationInfoSchema.nullable().optional(),
    /** split_stem_advanced success. */
    vocal_removal_info:
      SunoVocalRemovalCallbackInfoSchema.nullable().optional(),
  })
  .passthrough();

export const SunoVocalSeparationCallbackPayloadSchema = z
  .object({
    code: z.number().int(),
    msg: z.string(),
    data: SunoVocalSeparationCallbackDataSchema,
  })
  .passthrough();

// ---------------------------------------------------------------------------
// MIDI generation
// ---------------------------------------------------------------------------

export const SunoMidiCallbackNoteSchema = z
  .object({
    pitch: z.number().optional(),
    /** Docs: start/end may be number or string. */
    start: z.union([z.number(), z.string()]).optional(),
    end: z.union([z.number(), z.string()]).optional(),
    velocity: z.number().optional(),
  })
  .passthrough();

export const SunoMidiCallbackInstrumentSchema = z
  .object({
    name: z.string().optional(),
    notes: z.array(SunoMidiCallbackNoteSchema).optional(),
  })
  .passthrough();

export const SunoMidiCallbackDataSchema = z
  .object({
    taskId: z.string(),
    state: z.string().optional(),
    instruments: z.array(SunoMidiCallbackInstrumentSchema).optional(),
  })
  .passthrough();

export const SunoMidiCallbackPayloadSchema = z
  .object({
    code: z.number().int(),
    msg: z.string(),
    data: SunoMidiCallbackDataSchema,
  })
  .passthrough();

// ---------------------------------------------------------------------------
// WAV conversion
// ---------------------------------------------------------------------------

export const SunoWavCallbackDataSchema = z
  .object({
    task_id: z.string(),
    audioWavUrl: z.string().nullable().optional(),
  })
  .passthrough();

export const SunoWavCallbackPayloadSchema = z
  .object({
    code: z.number().int(),
    msg: z.string(),
    data: SunoWavCallbackDataSchema,
  })
  .passthrough();

// ---------------------------------------------------------------------------
// Lyrics generation
// ---------------------------------------------------------------------------

export const SunoLyricsItemSchema = z
  .object({
    text: z.string().optional(),
    title: z.string().optional(),
    status: z.string().optional(),
    error_message: z.string().optional(),
  })
  .passthrough();

export const SunoLyricsCallbackDataSchema = z
  .object({
    callbackType: z.string(),
    task_id: z.string(),
    data: z.array(SunoLyricsItemSchema).nullable().optional(),
  })
  .passthrough();

export const SunoLyricsCallbackPayloadSchema = z
  .object({
    code: z.number().int(),
    msg: z.string(),
    data: SunoLyricsCallbackDataSchema,
  })
  .passthrough();

// ---------------------------------------------------------------------------
// Music video (MP4)
// ---------------------------------------------------------------------------

export const SunoMp4CallbackDataSchema = z
  .object({
    task_id: z.string(),
    video_url: z.string().nullable().optional(),
  })
  .passthrough();

export const SunoMp4CallbackPayloadSchema = z
  .object({
    code: z.number().int(),
    msg: z.string(),
    data: SunoMp4CallbackDataSchema,
  })
  .passthrough();

// ---------------------------------------------------------------------------
// Custom voice — generate
// ---------------------------------------------------------------------------

export const SunoVoiceGenerateCallbackDataSchema = z
  .object({
    taskId: z.string(),
    voiceId: z.string().nullable().optional(),
    status: z.string().optional(),
    errorCode: z.number().int().nullable().optional(),
    errorMessage: z.string().optional(),
  })
  .passthrough();

export const SunoVoiceGenerateCallbackPayloadSchema = z
  .object({
    code: z.number().int(),
    msg: z.string(),
    data: SunoVoiceGenerateCallbackDataSchema,
  })
  .passthrough();

// ---------------------------------------------------------------------------
// Custom voice — validation phrase
// ---------------------------------------------------------------------------

export const SunoVoiceValidateCallbackDataSchema = z
  .object({
    taskId: z.string(),
    validateInfo: z.string().nullable().optional(),
    status: z.string().optional(),
    errorCode: z.number().int().nullable().optional(),
    errorMessage: z.string().optional(),
  })
  .passthrough();

export const SunoVoiceValidateCallbackPayloadSchema = z
  .object({
    code: z.number().int(),
    msg: z.string(),
    data: SunoVoiceValidateCallbackDataSchema,
  })
  .passthrough();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SunoMusicCallbackType = z.infer<typeof SunoMusicCallbackTypeSchema>;
export type SunoMusicTrack = z.infer<typeof SunoMusicTrackSchema>;
export type SunoMusicCallbackData = z.infer<typeof SunoMusicCallbackDataSchema>;
export type SunoMusicCallbackPayload = z.infer<
  typeof SunoMusicCallbackPayloadSchema
>;

export type SunoGenerateCallbackTrack = SunoMusicTrack;
export type SunoGenerateCallbackData = SunoMusicCallbackData;
export type SunoGenerateCallbackPayload = SunoMusicCallbackPayload;

export type SunoExtendCallbackTrack = SunoMusicTrack;
export type SunoExtendCallbackData = SunoMusicCallbackData;
export type SunoExtendCallbackPayload = SunoMusicCallbackPayload;

export type SunoAddInstrumentalCallbackTrack = SunoMusicTrack;
export type SunoAddInstrumentalCallbackData = SunoMusicCallbackData;
export type SunoAddInstrumentalCallbackPayload = SunoMusicCallbackPayload;

export type SunoAddVocalsCallbackTrack = SunoMusicTrack;
export type SunoAddVocalsCallbackData = SunoMusicCallbackData;
export type SunoAddVocalsCallbackPayload = SunoMusicCallbackPayload;

export type SunoReplaceSectionCallbackTrack = SunoMusicTrack;
export type SunoReplaceSectionCallbackData = SunoMusicCallbackData;
export type SunoReplaceSectionCallbackPayload = SunoMusicCallbackPayload;

export type SunoUploadTrack = z.infer<typeof SunoUploadTrackSchema>;
export type SunoUploadCallbackData = z.infer<
  typeof SunoUploadCallbackDataSchema
>;
export type SunoUploadCallbackPayload = z.infer<
  typeof SunoUploadCallbackPayloadSchema
>;

export type SunoUploadCoverCallbackTrack = SunoUploadTrack;
export type SunoUploadCoverCallbackData = SunoUploadCallbackData;
export type SunoUploadCoverCallbackPayload = SunoUploadCallbackPayload;

export type SunoUploadExtendCallbackTrack = SunoUploadTrack;
export type SunoUploadExtendCallbackData = SunoUploadCallbackData;
export type SunoUploadExtendCallbackPayload = SunoUploadCallbackPayload;

export type SunoCoverCallbackData = z.infer<typeof SunoCoverCallbackDataSchema>;
export type SunoCoverCallbackPayload = z.infer<
  typeof SunoCoverCallbackPayloadSchema
>;

export type SunoVocalSeparationInfo = z.infer<
  typeof SunoVocalSeparationInfoSchema
>;
export type SunoVocalRemovalCallbackStemPart = z.infer<
  typeof SunoVocalRemovalCallbackStemPartSchema
>;
export type SunoVocalRemovalCallbackOriginDataItem = z.infer<
  typeof SunoVocalRemovalCallbackOriginDataItemSchema
>;
export type SunoVocalRemovalCallbackInfo = z.infer<
  typeof SunoVocalRemovalCallbackInfoSchema
>;
export type SunoVocalSeparationCallbackData = z.infer<
  typeof SunoVocalSeparationCallbackDataSchema
>;
export type SunoVocalSeparationCallbackPayload = z.infer<
  typeof SunoVocalSeparationCallbackPayloadSchema
>;

export type SunoMidiCallbackNote = z.infer<typeof SunoMidiCallbackNoteSchema>;
export type SunoMidiCallbackInstrument = z.infer<
  typeof SunoMidiCallbackInstrumentSchema
>;
export type SunoMidiCallbackData = z.infer<typeof SunoMidiCallbackDataSchema>;
export type SunoMidiCallbackPayload = z.infer<
  typeof SunoMidiCallbackPayloadSchema
>;

export type SunoWavCallbackData = z.infer<typeof SunoWavCallbackDataSchema>;
export type SunoWavCallbackPayload = z.infer<
  typeof SunoWavCallbackPayloadSchema
>;

export type SunoLyricsItem = z.infer<typeof SunoLyricsItemSchema>;
export type SunoLyricsCallbackData = z.infer<
  typeof SunoLyricsCallbackDataSchema
>;
export type SunoLyricsCallbackPayload = z.infer<
  typeof SunoLyricsCallbackPayloadSchema
>;

export type SunoMp4CallbackData = z.infer<typeof SunoMp4CallbackDataSchema>;
export type SunoMp4CallbackPayload = z.infer<
  typeof SunoMp4CallbackPayloadSchema
>;

export type SunoVoiceGenerateCallbackData = z.infer<
  typeof SunoVoiceGenerateCallbackDataSchema
>;
export type SunoVoiceGenerateCallbackPayload = z.infer<
  typeof SunoVoiceGenerateCallbackPayloadSchema
>;

export type SunoVoiceValidateCallbackData = z.infer<
  typeof SunoVoiceValidateCallbackDataSchema
>;
export type SunoVoiceValidateCallbackPayload = z.infer<
  typeof SunoVoiceValidateCallbackPayloadSchema
>;
