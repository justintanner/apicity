import {
  ElevenLabsAddPvcSamplesRequest,
  ElevenLabsAddPvcSamplesResponse,
  ElevenLabsAddSharedVoiceRequest,
  ElevenLabsAddSharedVoiceResponse,
  ElevenLabsAddVoiceRequest,
  ElevenLabsAddVoiceResponse,
  ElevenLabsCreatePvcVoiceRequest,
  ElevenLabsCreatePvcVoiceResponse,
  ElevenLabsDeleteVoiceResponse,
  ElevenLabsDeleteVoiceSampleResponse,
  ElevenLabsEditPvcVoiceRequest,
  ElevenLabsEditPvcVoiceResponse,
  ElevenLabsEditVoiceRequest,
  ElevenLabsEditVoiceResponse,
  ElevenLabsEditVoiceSettingsRequest,
  ElevenLabsEditVoiceSettingsResponse,
  ElevenLabsGetPvcSampleAudioRequest,
  ElevenLabsGetPvcVoiceCaptchaResponse,
  ElevenLabsGetVoiceRequest,
  ElevenLabsLibraryVoicesResponse,
  ElevenLabsListV1VoicesRequest,
  ElevenLabsListV1VoicesResponse,
  ElevenLabsListVoicesRequest,
  ElevenLabsListVoicesResponse,
  ElevenLabsPvcManualVerificationRequest,
  ElevenLabsPvcManualVerificationResponse,
  ElevenLabsPvcTrainRequest,
  ElevenLabsPvcTrainResponse,
  ElevenLabsPvcVoiceCaptchaRequest,
  ElevenLabsPvcVoiceCaptchaResponse,
  ElevenLabsPvcVoiceSampleWaveformResponse,
  ElevenLabsSharedVoicesRequest,
  ElevenLabsSimilarVoicesRequest,
  ElevenLabsSpeakerAudioResponse,
  ElevenLabsSpeakerSeparation,
  ElevenLabsStartSpeakerSeparationResponse,
  ElevenLabsUpdatePvcVoiceSampleRequest,
  ElevenLabsUpdatePvcVoiceSampleResponse,
  ElevenLabsVoice,
  ElevenLabsVoiceSamplePreviewResponse,
  ElevenLabsVoiceSettings,
} from "./types";
import {
  ElevenLabsAddPvcSamplesRequestSchema,
  ElevenLabsAddSharedVoiceRequestSchema,
  ElevenLabsAddVoiceRequestSchema,
  ElevenLabsCreatePvcVoiceRequestSchema,
  ElevenLabsEditPvcVoiceRequestSchema,
  ElevenLabsEditVoiceRequestSchema,
  ElevenLabsEditVoiceSettingsRequestSchema,
  ElevenLabsGetPvcSampleAudioRequestSchema,
  ElevenLabsGetVoiceRequestSchema,
  ElevenLabsListV1VoicesRequestSchema,
  ElevenLabsListVoicesRequestSchema,
  ElevenLabsPvcManualVerificationRequestSchema,
  ElevenLabsPvcTrainRequestSchema,
  ElevenLabsPvcVoiceCaptchaRequestSchema,
  ElevenLabsSharedVoicesRequestSchema,
  ElevenLabsSimilarVoicesRequestSchema,
  ElevenLabsUpdatePvcVoiceSampleRequestSchema,
} from "./zod";
import type { ElevenLabsContext } from "./transport";

export function createVoicesEndpoints(ctx: ElevenLabsContext) {
  const {
    makeGetBinaryRequest,
    makeJsonRequest,
    makeJsonRequestAllowEmpty,
    makeMultipartJsonRequest,
    appendFormField,
    buildQueryString,
  } = ctx;

  // GET https://api.elevenlabs.io/v1/voices/{voiceId}
  // Docs: https://elevenlabs.io/docs/api-reference/voices/get
  const getVoice = Object.assign(
    async (
      voiceId: string,
      req: ElevenLabsGetVoiceRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsVoice> => {
      return makeJsonRequest<ElevenLabsVoice>(
        "GET",
        `/v1/voices/${encodeURIComponent(voiceId)}`,
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsGetVoiceRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/voices/{voiceId}/settings
  // Docs: https://elevenlabs.io/docs/api-reference/voices/get-settings
  const getVoiceSettings = Object.assign(
    async (
      voiceId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsVoiceSettings> => {
      return makeJsonRequest<ElevenLabsVoiceSettings>(
        "GET",
        `/v1/voices/${encodeURIComponent(voiceId)}/settings`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/voices
  // Docs: https://elevenlabs.io/docs/api-reference/voices/get-all
  const listV1Voices = Object.assign(
    async (
      req: ElevenLabsListV1VoicesRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsListV1VoicesResponse> => {
      return makeJsonRequest<ElevenLabsListV1VoicesResponse>(
        "GET",
        "/v1/voices",
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsListV1VoicesRequestSchema }
  );

  // DELETE https://api.elevenlabs.io/v1/voices/{voiceId}
  // Docs: https://elevenlabs.io/docs/api-reference/voices/delete
  const deleteVoice = Object.assign(
    async (
      voiceId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsDeleteVoiceResponse> => {
      return makeJsonRequest<ElevenLabsDeleteVoiceResponse>(
        "DELETE",
        `/v1/voices/${encodeURIComponent(voiceId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/voices/add
  // Docs: https://elevenlabs.io/docs/api-reference/voices/ivc/create
  const addVoice = async (
    req: ElevenLabsAddVoiceRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsAddVoiceResponse> => {
    const { files, ...rest } = req;
    const form = new FormData();
    for (const file of files) {
      form.append("files", file);
    }
    for (const [key, value] of Object.entries(rest)) {
      appendFormField(form, key, value);
    }

    return makeMultipartJsonRequest<ElevenLabsAddVoiceResponse>(
      "/v1/voices/add",
      form,
      undefined,
      signal
    );
  };

  // POST https://api.elevenlabs.io/v1/voices/add/{publicUserId}/{voiceId}
  // Docs: https://elevenlabs.io/docs/api-reference/voices/share
  const addSharedVoice = Object.assign(
    async (
      publicUserId: string,
      voiceId: string,
      req: ElevenLabsAddSharedVoiceRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsAddSharedVoiceResponse> => {
      return makeJsonRequest<ElevenLabsAddSharedVoiceResponse>(
        "POST",
        `/v1/voices/add/${encodeURIComponent(
          publicUserId
        )}/${encodeURIComponent(voiceId)}`,
        req,
        signal
      );
    },
    { schema: ElevenLabsAddSharedVoiceRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/voices/{voiceId}/edit
  // Docs: https://elevenlabs.io/docs/api-reference/voices/edit
  const editVoice = Object.assign(
    async (
      voiceId: string,
      req: ElevenLabsEditVoiceRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsEditVoiceResponse> => {
      const { files, ...rest } = req;
      const form = new FormData();
      if (files) {
        for (const file of files) {
          form.append("files", file);
        }
      }
      for (const [key, value] of Object.entries(rest)) {
        appendFormField(form, key, value);
      }

      return makeMultipartJsonRequest<ElevenLabsEditVoiceResponse>(
        `/v1/voices/${encodeURIComponent(voiceId)}/edit`,
        form,
        undefined,
        signal
      );
    },
    { schema: ElevenLabsEditVoiceRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/voices/{voiceId}/settings/edit
  // Docs: https://elevenlabs.io/docs/api-reference/voices/settings/update
  const editVoiceSettings = Object.assign(
    async (
      voiceId: string,
      req: ElevenLabsEditVoiceSettingsRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsEditVoiceSettingsResponse> => {
      return makeJsonRequest<ElevenLabsEditVoiceSettingsResponse>(
        "POST",
        `/v1/voices/${encodeURIComponent(voiceId)}/settings/edit`,
        req,
        signal
      );
    },
    { schema: ElevenLabsEditVoiceSettingsRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/voices/settings/default
  // Docs: https://elevenlabs.io/docs/api-reference/voices/settings/get-default
  const getDefaultVoiceSettings = Object.assign(
    async (signal?: AbortSignal): Promise<ElevenLabsVoiceSettings> => {
      return makeJsonRequest<ElevenLabsVoiceSettings>(
        "GET",
        "/v1/voices/settings/default",
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // DELETE https://api.elevenlabs.io/v1/voices/{voiceId}/samples/{sampleId}
  // Docs: https://elevenlabs.io/docs/api-reference/samples/delete
  const deleteVoiceSample = Object.assign(
    async (
      voiceId: string,
      sampleId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsDeleteVoiceSampleResponse> => {
      return makeJsonRequest<ElevenLabsDeleteVoiceSampleResponse>(
        "DELETE",
        `/v1/voices/${encodeURIComponent(voiceId)}/samples/${encodeURIComponent(
          sampleId
        )}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/voices/{voiceId}/samples/{sampleId}/audio
  // Docs: https://elevenlabs.io/docs/api-reference/samples/audio
  const getVoiceSampleAudio = Object.assign(
    async (
      voiceId: string,
      sampleId: string,
      signal?: AbortSignal
    ): Promise<ArrayBuffer> => {
      return makeGetBinaryRequest(
        `/v1/voices/${encodeURIComponent(voiceId)}/samples/${encodeURIComponent(
          sampleId
        )}/audio`,
        "",
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/shared-voices
  // Docs: https://elevenlabs.io/docs/api-reference/voices/get-shared
  const getSharedVoices = Object.assign(
    async (
      req: ElevenLabsSharedVoicesRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsLibraryVoicesResponse> => {
      return makeJsonRequest<ElevenLabsLibraryVoicesResponse>(
        "GET",
        "/v1/shared-voices",
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsSharedVoicesRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/similar-voices
  // Docs: https://elevenlabs.io/docs/api-reference/voices/find-similar-voices
  const getSimilarVoices = Object.assign(
    async (
      req: ElevenLabsSimilarVoicesRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsLibraryVoicesResponse> => {
      const form = new FormData();
      for (const [key, value] of Object.entries(req)) {
        appendFormField(form, key, value);
      }

      return makeMultipartJsonRequest<ElevenLabsLibraryVoicesResponse>(
        "/v1/similar-voices",
        form,
        undefined,
        signal
      );
    },
    { schema: ElevenLabsSimilarVoicesRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/voices/pvc
  // Docs: https://elevenlabs.io/docs/api-reference/voices/pvc/create
  const createPvcVoice = Object.assign(
    async (
      req: ElevenLabsCreatePvcVoiceRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsCreatePvcVoiceResponse> => {
      return makeJsonRequest<ElevenLabsCreatePvcVoiceResponse>(
        "POST",
        "/v1/voices/pvc",
        req,
        signal
      );
    },
    { schema: ElevenLabsCreatePvcVoiceRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/voices/pvc/{voiceId}
  // Docs: https://elevenlabs.io/docs/api-reference/voices/pvc/edit
  const editPvcVoice = Object.assign(
    async (
      voiceId: string,
      req: ElevenLabsEditPvcVoiceRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsEditPvcVoiceResponse> => {
      return makeJsonRequestAllowEmpty<ElevenLabsEditPvcVoiceResponse>(
        "POST",
        `/v1/voices/pvc/${encodeURIComponent(voiceId)}`,
        req,
        signal
      );
    },
    { schema: ElevenLabsEditPvcVoiceRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/captcha
  // Docs: https://elevenlabs.io/docs/api-reference/voices/pvc/verification/captcha/verify
  const pvcVoiceCaptcha = Object.assign(
    async (
      voiceId: string,
      req: ElevenLabsPvcVoiceCaptchaRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsPvcVoiceCaptchaResponse> => {
      const form = new FormData();
      appendFormField(form, "recording", req.recording);

      return makeMultipartJsonRequest<ElevenLabsPvcVoiceCaptchaResponse>(
        `/v1/voices/pvc/${encodeURIComponent(voiceId)}/captcha`,
        form,
        undefined,
        signal
      );
    },
    { schema: ElevenLabsPvcVoiceCaptchaRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/captcha
  // Docs: https://elevenlabs.io/docs/api-reference/voices/pvc/verification/captcha
  const getPvcVoiceCaptcha = Object.assign(
    async (
      voiceId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsGetPvcVoiceCaptchaResponse> => {
      return makeJsonRequest<ElevenLabsGetPvcVoiceCaptchaResponse>(
        "GET",
        `/v1/voices/pvc/${encodeURIComponent(voiceId)}/captcha`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/samples/{sampleId}
  // Docs: https://elevenlabs.io/docs/api-reference/voices/pvc/samples/update
  const updatePvcVoiceSample = Object.assign(
    async (
      voiceId: string,
      sampleId: string,
      req: ElevenLabsUpdatePvcVoiceSampleRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsUpdatePvcVoiceSampleResponse> => {
      return makeJsonRequest<ElevenLabsUpdatePvcVoiceSampleResponse>(
        "POST",
        `/v1/voices/pvc/${encodeURIComponent(
          voiceId
        )}/samples/${encodeURIComponent(sampleId)}`,
        req,
        signal
      );
    },
    { schema: ElevenLabsUpdatePvcVoiceSampleRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/samples
  // Docs: https://elevenlabs.io/docs/api-reference/voices/pvc/samples/create
  const addPvcSamples = Object.assign(
    async (
      voiceId: string,
      req: ElevenLabsAddPvcSamplesRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsAddPvcSamplesResponse> => {
      const { files, ...rest } = req;
      const form = new FormData();
      for (const file of files) {
        form.append("files", file);
      }
      for (const [key, value] of Object.entries(rest)) {
        appendFormField(form, key, value);
      }

      return makeMultipartJsonRequest<ElevenLabsAddPvcSamplesResponse>(
        `/v1/voices/pvc/${encodeURIComponent(voiceId)}/samples`,
        form,
        undefined,
        signal
      );
    },
    { schema: ElevenLabsAddPvcSamplesRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/samples/{sampleId}/audio
  // Docs: https://elevenlabs.io/docs/api-reference/voices/pvc/samples/audio
  const getPvcSampleAudio = Object.assign(
    async (
      voiceId: string,
      sampleId: string,
      req: ElevenLabsGetPvcSampleAudioRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsVoiceSamplePreviewResponse> => {
      return makeJsonRequest<ElevenLabsVoiceSamplePreviewResponse>(
        "GET",
        `/v1/voices/pvc/${encodeURIComponent(
          voiceId
        )}/samples/${encodeURIComponent(sampleId)}/audio`,
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsGetPvcSampleAudioRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/samples/{sampleId}/speakers
  // Docs: https://elevenlabs.io/docs/api-reference/voices/pvc/samples/speakers
  const getPvcSampleSpeakers = Object.assign(
    async (
      voiceId: string,
      sampleId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsSpeakerSeparation> => {
      return makeJsonRequest<ElevenLabsSpeakerSeparation>(
        "GET",
        `/v1/voices/pvc/${encodeURIComponent(
          voiceId
        )}/samples/${encodeURIComponent(sampleId)}/speakers`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/samples/{sampleId}/separate-speakers
  // Docs: https://elevenlabs.io/docs/api-reference/voices/pvc/samples/separate-speakers
  const startSpeakerSeparation = Object.assign(
    async (
      voiceId: string,
      sampleId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsStartSpeakerSeparationResponse> => {
      return makeJsonRequest<ElevenLabsStartSpeakerSeparationResponse>(
        "POST",
        `/v1/voices/pvc/${encodeURIComponent(
          voiceId
        )}/samples/${encodeURIComponent(sampleId)}/separate-speakers`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/samples/{sampleId}/speakers/{speakerId}/audio
  // Docs: https://elevenlabs.io/docs/api-reference/voices/pvc/samples/get-separated-speaker-audio
  const getSeparatedSpeakerAudio = Object.assign(
    async (
      voiceId: string,
      sampleId: string,
      speakerId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsSpeakerAudioResponse> => {
      return makeJsonRequest<ElevenLabsSpeakerAudioResponse>(
        "GET",
        `/v1/voices/pvc/${encodeURIComponent(
          voiceId
        )}/samples/${encodeURIComponent(
          sampleId
        )}/speakers/${encodeURIComponent(speakerId)}/audio`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/samples/{sampleId}/waveform
  // Docs: https://elevenlabs.io/docs/api-reference/voices/pvc/samples/get-waveform
  const getPvcVoiceSampleWaveform = Object.assign(
    async (
      voiceId: string,
      sampleId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsPvcVoiceSampleWaveformResponse> => {
      return makeJsonRequest<ElevenLabsPvcVoiceSampleWaveformResponse>(
        "GET",
        `/v1/voices/pvc/${encodeURIComponent(
          voiceId
        )}/samples/${encodeURIComponent(sampleId)}/waveform`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // DELETE https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/samples/{sampleId}
  // Docs: https://elevenlabs.io/docs/api-reference/voices/pvc/samples/delete
  const deletePvcVoiceSample = Object.assign(
    async (
      voiceId: string,
      sampleId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsDeleteVoiceSampleResponse> => {
      return makeJsonRequest<ElevenLabsDeleteVoiceSampleResponse>(
        "DELETE",
        `/v1/voices/pvc/${encodeURIComponent(
          voiceId
        )}/samples/${encodeURIComponent(sampleId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/train
  // Docs: https://elevenlabs.io/docs/api-reference/voices/pvc/train
  const pvcTrain = Object.assign(
    async (
      voiceId: string,
      req: ElevenLabsPvcTrainRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsPvcTrainResponse> => {
      return makeJsonRequest<ElevenLabsPvcTrainResponse>(
        "POST",
        `/v1/voices/pvc/${encodeURIComponent(voiceId)}/train`,
        req,
        signal
      );
    },
    { schema: ElevenLabsPvcTrainRequestSchema }
  );

  // GET https://api.elevenlabs.io/v2/voices
  // Docs: https://elevenlabs.io/docs/api-reference/voices/search
  const voices = Object.assign(
    async (
      req: ElevenLabsListVoicesRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsListVoicesResponse> => {
      return makeJsonRequest<ElevenLabsListVoicesResponse>(
        "GET",
        "/v2/voices",
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsListVoicesRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/verification
  // Docs: https://elevenlabs.io/docs/api-reference/voices/pvc/verification/request
  const pvcManualVerification = Object.assign(
    async (
      voiceId: string,
      req: ElevenLabsPvcManualVerificationRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsPvcManualVerificationResponse> => {
      const form = new FormData();
      for (const file of req.files) {
        form.append("files", file);
      }
      appendFormField(form, "extra_text", req.extra_text);

      return makeMultipartJsonRequest<ElevenLabsPvcManualVerificationResponse>(
        `/v1/voices/pvc/${encodeURIComponent(voiceId)}/verification`,
        form,
        undefined,
        signal
      );
    },
    { schema: ElevenLabsPvcManualVerificationRequestSchema }
  );

  const pvcSamplesSpeakers = Object.assign(getPvcSampleSpeakers, {
    audio: getSeparatedSpeakerAudio,
  });
  const pvcVoiceSamples = Object.assign(updatePvcVoiceSample, {
    add: addPvcSamples,
    audio: getPvcSampleAudio,
    delete: deletePvcVoiceSample,
    separateSpeakers: startSpeakerSeparation,
    speakers: pvcSamplesSpeakers,
    waveform: getPvcVoiceSampleWaveform,
  });
  const postPvcVoiceSamples = Object.assign(updatePvcVoiceSample, {
    add: addPvcSamples,
    separateSpeakers: startSpeakerSeparation,
  });
  const pvcVoiceCaptchaWithGet = Object.assign(pvcVoiceCaptcha, {
    get: getPvcVoiceCaptcha,
  });
  const pvcVoices = Object.assign(createPvcVoice, {
    edit: editPvcVoice,
    captcha: pvcVoiceCaptchaWithGet,
    samples: pvcVoiceSamples,
    train: pvcTrain,
    verification: pvcManualVerification,
  });
  const postPvcVoices = Object.assign(createPvcVoice, {
    edit: editPvcVoice,
    captcha: pvcVoiceCaptchaWithGet,
    samples: postPvcVoiceSamples,
    train: pvcTrain,
    verification: pvcManualVerification,
  });

  const v1VoicesAdd = Object.assign(addVoice, {
    schema: ElevenLabsAddVoiceRequestSchema,
    share: addSharedVoice,
  });
  const v1VoiceSettings = Object.assign(getVoiceSettings, {
    default: getDefaultVoiceSettings,
    edit: editVoiceSettings,
  });
  const v1VoiceSamples = {
    delete: deleteVoiceSample,
    audio: getVoiceSampleAudio,
  };
  const v1Voices = Object.assign(getVoice, {
    list: listV1Voices,
    delete: deleteVoice,
    add: v1VoicesAdd,
    edit: editVoice,
    settings: v1VoiceSettings,
    samples: v1VoiceSamples,
    pvc: pvcVoices,
  });

  return {
    v1: {
      voices: v1Voices,
      sharedVoices: getSharedVoices,
      similarVoices: getSimilarVoices,
    },
    v2: { voices },
    get: {
      v1: { voices: v1Voices, sharedVoices: getSharedVoices },
      v2: { voices },
    },
    post: {
      v1: {
        similarVoices: getSimilarVoices,
        voices: {
          add: v1VoicesAdd,
          edit: editVoice,
          settings: { edit: editVoiceSettings },
          pvc: postPvcVoices,
        },
      },
    },
    delete: {
      v1: {
        voices: {
          delete: deleteVoice,
          samples: { delete: deleteVoiceSample },
          pvc: { samples: { delete: deletePvcVoiceSample } },
        },
      },
    },
  };
}
