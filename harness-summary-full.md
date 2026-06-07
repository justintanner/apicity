# Apicity Harness Report

## fal/bytedance-seed-speech-tts-v2

- Recording: `tests/recordings/fal_2801268556/bytedance-seed-speech-tts-v2_817081260/recording.har`
- Endpoint: `POST https://fal.run/fal-ai/bytedance/seed-speech/tts/v2`
- Apicity path: `fal.run.bytedance.seedSpeech.tts.v2`
- Status: `200 OK`

### Request

```json
{
  "text": "Hello from Apicity.",
  "voice": "stokie_en",
  "output_format": "mp3",
  "sample_rate": 24000,
  "speed": 1,
  "volume": 1,
  "pitch": 0,
  "language": "en",
  "voice_instruction": "Speak in a warm, cheerful tone."
}
```

### Response

```json
{
  "audio": {
    "url": "https://v3b.fal.media/files/b/0a9d47ac/FT2DYcvcYoYcmnlBb4vbK_audio.mp3",
    "content_type": "audio/mpeg",
    "file_name": "audio.mp3",
    "file_size": 26157
  }
}
```

Audio: https://v3b.fal.media/files/b/0a9d47ac/FT2DYcvcYoYcmnlBb4vbK_audio.mp3
