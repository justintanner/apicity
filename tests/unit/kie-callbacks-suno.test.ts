import { describe, it, expect } from "vitest";
import {
  SunoGenerateCallbackPayloadSchema,
  SunoExtendCallbackPayloadSchema,
  SunoUploadCoverCallbackPayloadSchema,
  SunoUploadExtendCallbackPayloadSchema,
  SunoAddInstrumentalCallbackPayloadSchema,
  SunoAddVocalsCallbackPayloadSchema,
  SunoCoverCallbackPayloadSchema,
  SunoReplaceSectionCallbackPayloadSchema,
  SunoVocalSeparationCallbackPayloadSchema,
  SunoMidiCallbackPayloadSchema,
  SunoWavCallbackPayloadSchema,
  SunoLyricsCallbackPayloadSchema,
  SunoMp4CallbackPayloadSchema,
  SunoVoiceGenerateCallbackPayloadSchema,
  SunoVoiceValidateCallbackPayloadSchema,
} from "../../packages/provider/kie/src/callbacks-suno";

describe("Suno callback payloads (ac-wv1mga)", () => {
  it("parses generate music success and failure", () => {
    expect(
      SunoGenerateCallbackPayloadSchema.safeParse({
        code: 200,
        msg: "All generated successfully.",
        data: {
          callbackType: "complete",
          task_id: "2fac****9f72",
          data: [
            {
              id: "e231****-****-****-****-****8cadc7dc",
              audio_url: "https://example.cn/****.mp3",
              stream_audio_url: "https://example.cn/****",
              image_url: "https://example.cn/****.jpeg",
              prompt: "[Verse] Night city lights shining bright",
              model_name: "chirp-v3-5",
              title: "Iron Man",
              tags: "electrifying, rock",
              createTime: "2025-01-01 00:00:00",
              duration: 198.44,
            },
          ],
        },
      }).success
    ).toBe(true);

    expect(
      SunoGenerateCallbackPayloadSchema.safeParse({
        code: 501,
        msg: "Audio generation failed",
        data: {
          callbackType: "error",
          task_id: "2fac****9f72",
          data: null,
        },
      }).success
    ).toBe(true);
  });

  it("parses extend music staged and failure callbacks", () => {
    expect(
      SunoExtendCallbackPayloadSchema.safeParse({
        code: 200,
        msg: "Text generation completed.",
        data: {
          callbackType: "text",
          task_id: "2fac****9f72",
          data: [],
        },
      }).success
    ).toBe(true);

    expect(
      SunoExtendCallbackPayloadSchema.safeParse({
        code: 501,
        msg: "Audio generation failed.",
        data: {
          callbackType: "error",
          task_id: "2fac****9f72",
          data: [],
        },
      }).success
    ).toBe(true);
  });

  it("parses upload-and-cover success and failure with source_* fields", () => {
    expect(
      SunoUploadCoverCallbackPayloadSchema.safeParse({
        code: 200,
        msg: "All generated successfully.",
        data: {
          callbackType: "complete",
          task_id: "2fac****9f72",
          data: [
            {
              id: "e231****-****-****-****-****8cadc7dc",
              audio_url: "https://example.cn/****.mp3",
              source_audio_url: "https://example.cn/****.mp3",
              stream_audio_url: "https://example.cn/****",
              source_stream_audio_url: "https://example.cn/****",
              image_url: "https://example.cn/****.jpeg",
              source_image_url: "https://example.cn/****.jpeg",
              prompt: "[Verse] Night city lights shining bright",
              model_name: "chirp-v3-5",
              title: "Iron Man",
              tags: "electrifying, rock",
              createTime: "2025-01-01 00:00:00",
              duration: 198.44,
            },
          ],
        },
      }).success
    ).toBe(true);

    expect(
      SunoUploadCoverCallbackPayloadSchema.safeParse({
        code: 501,
        msg: "Audio generation failed.",
        data: {
          callbackType: "error",
          task_id: "2fac****9f72",
          data: [],
        },
      }).success
    ).toBe(true);
  });

  it("parses upload-and-extend callbacks", () => {
    expect(
      SunoUploadExtendCallbackPayloadSchema.safeParse({
        code: 200,
        msg: "First track generated successfully.",
        data: {
          callbackType: "first",
          task_id: "2fac****9f72",
          data: [
            {
              id: "e231****-****-****-****-****8cadc7dc",
              audio_url: "https://example.cn/****.mp3",
              source_audio_url: "https://example.cn/****.mp3",
              stream_audio_url: "https://example.cn/****",
              source_stream_audio_url: "https://example.cn/****",
              image_url: "https://example.cn/****.jpeg",
              source_image_url: "https://example.cn/****.jpeg",
              prompt: "[Verse] Night city lights shining bright",
              model_name: "chirp-v3-5",
              title: "Iron Man",
              tags: "electrifying, rock",
              createTime: "2025-01-01 00:00:00",
              duration: 198.44,
            },
          ],
        },
      }).success
    ).toBe(true);
  });

  it("parses add-instrumental and add-vocals success and failure", () => {
    const success = {
      code: 200,
      msg: "All generated successfully.",
      data: {
        callbackType: "complete",
        task_id: "2fac****9f72",
        data: [
          {
            id: "e231****-****-****-****-****8cadc7dc",
            audio_url: "https://example.cn/****.mp3",
            stream_audio_url: "https://example.cn/****",
            image_url: "https://example.cn/****.jpeg",
            prompt: "[Verse] Night city lights shining bright",
            model_name: "chirp-v4-5",
            title: "Iron Man",
            tags: "electrifying, rock",
            createTime: "2025-01-01 00:00:00",
            duration: 198.44,
          },
        ],
      },
    };
    const failure = {
      code: 501,
      msg: "Audio generation failed",
      data: {
        callbackType: "error",
        task_id: "2fac****9f72",
        data: null,
      },
    };

    expect(
      SunoAddInstrumentalCallbackPayloadSchema.safeParse(success).success
    ).toBe(true);
    expect(
      SunoAddInstrumentalCallbackPayloadSchema.safeParse(failure).success
    ).toBe(true);
    expect(SunoAddVocalsCallbackPayloadSchema.safeParse(success).success).toBe(
      true
    );
    expect(SunoAddVocalsCallbackPayloadSchema.safeParse(failure).success).toBe(
      true
    );
  });

  it("parses cover image generation success and failure", () => {
    expect(
      SunoCoverCallbackPayloadSchema.safeParse({
        code: 200,
        data: {
          images: [
            "https://tempfile.aiquickdraw.com/s/1753958521_6c1b3015141849d1a9bf17b738ce9347.png",
            "https://tempfile.aiquickdraw.com/s/1753958524_c153143acc6340908431cf0e90cbce9e.png",
          ],
          taskId: "21aee3c3c2a01fa5e030b3799fa4dd56",
        },
        msg: "success",
      }).success
    ).toBe(true);

    expect(
      SunoCoverCallbackPayloadSchema.safeParse({
        code: 501,
        msg: "Cover generation failed",
        data: {
          taskId: "21aee3c3c2a01fa5e030b3799fa4dd56",
          images: null,
        },
      }).success
    ).toBe(true);
  });

  it("parses replace-section success and failure with error string", () => {
    expect(
      SunoReplaceSectionCallbackPayloadSchema.safeParse({
        code: 200,
        msg: "All generated successfully.",
        data: {
          callbackType: "complete",
          task_id: "2fac****9f72",
          data: [
            {
              id: "e231****-****-****-****-****8cadc7dc",
              audio_url: "https://example.cn/****.mp3",
              stream_audio_url: "https://example.cn/****",
              image_url: "https://example.cn/****.jpeg",
              prompt: "A calm and relaxing piano track.",
              model_name: "chirp-v3-5",
              title: "Relaxing Piano",
              tags: "Jazz",
              createTime: "2025-01-01 00:00:00",
              duration: 198.44,
            },
          ],
        },
      }).success
    ).toBe(true);

    expect(
      SunoReplaceSectionCallbackPayloadSchema.safeParse({
        code: 501,
        msg: "Audio generation failed.",
        data: {
          callbackType: "error",
          task_id: "2fac****9f72",
          error: "Generation failed due to technical issues",
        },
      }).success
    ).toBe(true);
  });

  it("parses vocal separation separate_vocal, split_stem, and advanced", () => {
    expect(
      SunoVocalSeparationCallbackPayloadSchema.safeParse({
        code: 200,
        msg: "vocal separation generated successfully.",
        data: {
          task_id: "3e63b4cc88d52611159371f6af5571e7",
          vocal_separation_info: {
            instrumental_url:
              "https://file.aiquickdraw.com/s/d92a13bf-c6f4-4ade-bb47-f69738435528_Instrumental.mp3",
            origin_url: "",
            vocal_url:
              "https://file.aiquickdraw.com/s/3d7021c9-fa8b-4eda-91d1-3b9297ddb172_Vocals.mp3",
          },
        },
      }).success
    ).toBe(true);

    expect(
      SunoVocalSeparationCallbackPayloadSchema.safeParse({
        code: 200,
        msg: "vocal separation generated successfully.",
        data: {
          task_id: "e649edb7abfd759285bd41a47a634b10",
          vocal_separation_info: {
            origin_url: "",
            backing_vocals_url:
              "https://file.aiquickdraw.com/s/aadc51a3-4c88-4c8e-a4c8-e867c539673d_Backing_Vocals.mp3",
            bass_url:
              "https://file.aiquickdraw.com/s/a3c2da5a-b364-4422-adb5-2692b9c26d33_Bass.mp3",
            brass_url:
              "https://file.aiquickdraw.com/s/334b2d23-0c65-4a04-92c7-22f828afdd44_Brass.mp3",
            drums_url:
              "https://file.aiquickdraw.com/s/ac75c5ea-ac77-4ad2-b7d9-66e140b78e44_Drums.mp3",
            fx_url:
              "https://file.aiquickdraw.com/s/a8822c73-6629-4089-8f2a-d19f41f0007d_FX.mp3",
            guitar_url:
              "https://file.aiquickdraw.com/s/064dd08e-d5d2-4201-9058-c5c40fb695b4_Guitar.mp3",
            keyboard_url:
              "https://file.aiquickdraw.com/s/adc934e0-df7d-45da-8220-1dba160d74e0_Keyboard.mp3",
            percussion_url:
              "https://file.aiquickdraw.com/s/0f70884d-047c-41f1-a6d0-7044618b7dc6_Percussion.mp3",
            strings_url:
              "https://file.aiquickdraw.com/s/49829425-a5b0-424e-857a-75d4c63a426b_Strings.mp3",
            synth_url:
              "https://file.aiquickdraw.com/s/56b2d94a-eb92-4d21-bc43-3460de0c8348_Synth.mp3",
            vocal_url:
              "https://file.aiquickdraw.com/s/07420749-29a2-4054-9b62-e6a6f8b90ccb_Vocals.mp3",
            woodwinds_url:
              "https://file.aiquickdraw.com/s/d81545b1-6f94-4388-9785-1aaa6ecabb02_Woodwinds.mp3",
          },
        },
      }).success
    ).toBe(true);

    expect(
      SunoVocalSeparationCallbackPayloadSchema.safeParse({
        code: 200,
        msg: "vocal Removal generated successfully.",
        data: {
          task_id: "7220be2955295dda60de46ec6e4ead4c",
          vocal_removal_info: {
            origin_data: [
              {
                extract: {
                  duration: 194.92,
                  audio_url:
                    "https://tempfile.aiquickdraw.com/r/eb7d0f18-8349-4735-a65e-1812705d5ddf_Lead Vocal.mp3",
                  stem_type_group_name: "Lead Vocal",
                  id: "eb7d0f18-8349-4735-a65e-1812705d5ddf",
                },
                remove: {
                  duration: 194.92,
                  audio_url:
                    "https://tempfile.aiquickdraw.com/r/706d32df-e988-412e-bce4-42c9302e5478_Lead Vocal.mp3",
                  stem_type_group_name: "Lead Vocal",
                  id: "706d32df-e988-412e-bce4-42c9302e5478",
                },
              },
            ],
          },
        },
      }).success
    ).toBe(true);

    expect(
      SunoVocalSeparationCallbackPayloadSchema.safeParse({
        code: 500,
        msg: "Vocal separation failed",
        data: {
          task_id: "3e63b4cc88d52611159371f6af5571e7",
          vocal_separation_info: null,
        },
      }).success
    ).toBe(true);
  });

  it("parses MIDI success (string|number note times) and failure", () => {
    const result = SunoMidiCallbackPayloadSchema.safeParse({
      code: 200,
      msg: "success",
      data: {
        taskId: "5c79****be8e",
        state: "complete",
        instruments: [
          {
            name: "Drums",
            notes: [
              {
                pitch: 73,
                start: "0.036458333333333336",
                end: "0.18229166666666666",
                velocity: 1,
              },
              {
                pitch: 61,
                start: 0.046875,
                end: "0.19270833333333334",
                velocity: 1,
              },
            ],
          },
        ],
      },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.data.instruments?.[0]?.notes?.length).toBe(2);
    }

    expect(
      SunoMidiCallbackPayloadSchema.safeParse({
        code: 500,
        msg: "MIDI generation failed",
        data: {
          taskId: "5c79****be8e",
        },
      }).success
    ).toBe(true);
  });

  it("parses WAV conversion success and failure", () => {
    expect(
      SunoWavCallbackPayloadSchema.safeParse({
        code: 200,
        msg: "success",
        data: {
          audioWavUrl: "https://example.com/s/04e6****e727.wav",
          task_id: "988e****c8d3",
        },
      }).success
    ).toBe(true);

    expect(
      SunoWavCallbackPayloadSchema.safeParse({
        code: 500,
        msg: "Internal Error - Please try again later",
        data: {
          audioWavUrl: null,
          task_id: "988e****c8d3",
        },
      }).success
    ).toBe(true);
  });

  it("parses lyrics success and failure", () => {
    expect(
      SunoLyricsCallbackPayloadSchema.safeParse({
        code: 200,
        msg: "All generated successfully.",
        data: {
          callbackType: "complete",
          task_id: "3b66882fde0a5d398bd269cab6d9542b",
          data: [
            {
              error_message: "",
              status: "complete",
              text: "[Verse]\nMoonlight spreads across the windowsill",
              title: "Starry Night Dreams",
            },
          ],
        },
      }).success
    ).toBe(true);

    expect(
      SunoLyricsCallbackPayloadSchema.safeParse({
        code: 400,
        msg: "Song Description flagged for moderation",
        data: {
          callbackType: "complete",
          task_id: "3b66882fde0a5d398bd269cab6d9542b",
          data: null,
        },
      }).success
    ).toBe(true);
  });

  it("parses music video (mp4) success and failure", () => {
    expect(
      SunoMp4CallbackPayloadSchema.safeParse({
        code: 200,
        msg: "success",
        data: {
          task_id: "task_id_5bbe7721119d",
          video_url: "video_url_847715e66259",
        },
      }).success
    ).toBe(true);

    expect(
      SunoMp4CallbackPayloadSchema.safeParse({
        code: 500,
        msg: "Internal Error - Please try again later",
        data: {
          task_id: "task_id_5bbe7721119d",
          video_url: null,
        },
      }).success
    ).toBe(true);
  });

  it("parses voice generate success and failure", () => {
    expect(
      SunoVoiceGenerateCallbackPayloadSchema.safeParse({
        code: 200,
        msg: "success",
        data: {
          taskId: "xxx_task_id_xxx",
          voiceId: "voice_xxx",
          status: "success",
          errorCode: null,
          errorMessage: "",
        },
      }).success
    ).toBe(true);

    expect(
      SunoVoiceGenerateCallbackPayloadSchema.safeParse({
        code: 500,
        msg: "Voice generation failed",
        data: {
          taskId: "xxx_task_id_xxx",
          voiceId: null,
          status: "fail",
          errorCode: 500,
          errorMessage: "Voice generation failed",
        },
      }).success
    ).toBe(true);
  });

  it("parses voice validate success and failure", () => {
    expect(
      SunoVoiceValidateCallbackPayloadSchema.safeParse({
        code: 200,
        msg: "success",
        data: {
          taskId: "xxx_task_id_xxx",
          validateInfo: "Harmonies fill the air with joyful melodies tonight",
          status: "wait_validating",
          errorCode: null,
          errorMessage: "",
        },
      }).success
    ).toBe(true);

    expect(
      SunoVoiceValidateCallbackPayloadSchema.safeParse({
        code: 500,
        msg: "Validation phrase generation failed",
        data: {
          taskId: "xxx_task_id_xxx",
          validateInfo: null,
          status: "processing_validate_fail",
          errorCode: 500,
          errorMessage: "Failed to generate validation phrase",
        },
      }).success
    ).toBe(true);
  });
});
