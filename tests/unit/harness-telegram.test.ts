import { describe, expect, it } from "vitest";
import type { ChangedRecording } from "../har-data";
import {
  buildTelegramHarnessMessages,
  type EndpointDocRow,
} from "../harness-telegram";

const endpointDocs: EndpointDocRow[] = [
  {
    provider: "fal",
    dotPath: "bytedance.seedSpeech.tts.v2",
    method: "POST",
    fullUrl: "https://api.fal.ai/v1/fal-ai/bytedance/seed-speech/tts/v2",
    docsUrl: "https://fal.ai/models/fal-ai/bytedance/seed-speech/tts/v2/api",
  },
];

function seedSpeechRecording(): ChangedRecording {
  return {
    provider: "fal",
    recordingName: "fal/bytedance-seed-speech-tts-v2",
    changeType: "new",
    filePath:
      "tests/recordings/fal_2801268556/" +
      "bytedance-seed-speech-tts-v2_817081260/recording.har",
    entries: [
      {
        request: {
          method: "POST",
          url: "https://fal.run/fal-ai/bytedance/seed-speech/tts/v2",
          headers: [{ name: "content-type", value: "application/json" }],
          postData: {
            mimeType: "application/json",
            text: JSON.stringify({
              text: "Hello from Apicity.",
              voice: "stokie_en",
              output_format: "mp3",
            }),
          },
        },
        response: {
          status: 200,
          statusText: "OK",
          headers: [{ name: "content-type", value: "application/json" }],
          content: {
            mimeType: "application/json",
            text: JSON.stringify({
              audio: {
                url: "https://v3b.fal.media/files/b/audio.mp3",
                content_type: "audio/mpeg",
              },
            }),
          },
        },
      },
    ],
  };
}

describe("harness Telegram messages", () => {
  it("renders endpoint recordings as Telegram HTML instead of raw Markdown", () => {
    const [message] = buildTelegramHarnessMessages(
      [seedSpeechRecording()],
      endpointDocs
    );

    expect(message.parse_mode).toBe("HTML");
    expect(message.endpoint).toBe(
      "POST https://fal.run/fal-ai/bytedance/seed-speech/tts/v2"
    );
    expect(message.apicityPath).toBe("fal.run.bytedance.seedSpeech.tts.v2");
    expect(message.text).toContain("<b>Apicity endpoint</b>");
    expect(message.text).toContain(
      "<code>fal.run.bytedance.seedSpeech.tts.v2</code>"
    );
    expect(message.text).toContain("<pre>{");
    expect(message.text).toContain(
      '<a href="https://v3b.fal.media/files/b/audio.mp3">audio</a>'
    );
    expect(message.text).not.toContain("```");
    expect(message.text).not.toContain("###");
  });
});
