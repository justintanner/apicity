# Coverage Comparison: KIE vs FAL

The premise that both cover the same models isn't quite right — **KIE covers far more model families than FAL** in this repo. But there's also gaps the other direction.

## Missing on FAL (exists on KIE)

### Video

- Veo 3 (text/image-to-video, extend)
- Kling 3.0 (video, motion-control)
- Grok Imagine (t2v, i2v, extend, upscale)
- Wan 2.7 video (t2v, i2v, r2v, edit) — FAL only has Wan 2.7 _image_
- Bytedance Seedance 2.0 i2v — KIE has it; FAL also has a similar endpoint, worth verifying naming parity

### Image

- Grok Imagine (t2i, i2i)
- Qwen2 (t2i, edit)
- GPT-image 1.5 (i2i)
- Nano Banana 2 (FAL has Pro only)

### Audio

- Suno V4 / V4.5 / V5
- ElevenLabs TTS (text-to-dialogue v3)
- ElevenLabs SFX (sound-effect v2)
- ElevenLabs STT v1 (FAL only has scribe-v2)

### Misc

- Sora watermark remover
- File upload (stream / URL / base64)

## Missing on KIE (exists on FAL)

- ElevenLabs STT **scribe-v2** (KIE has v1 STT but not scribe-v2)
- FAL's queue / pricing / usage / analytics admin surface — not really "model" endpoints; these are FAL platform APIs with no KIE equivalent

## Shared (both have it)

- Wan 2.7 image (t2i + edit, standard + pro)
- Nano Banana Pro (t2i + edit)
- Seedream v5 Lite (t2i + edit)

## Detailed endpoint tables

### Video Generation

| Model              | Endpoint Path                          | KIE | FAL |
| ------------------ | -------------------------------------- | --- | --- |
| Veo 3              | `veo/generate` (text/reference/frames) | Yes | No  |
| Veo 3              | `veo/extend`                           | Yes | No  |
| Kling 3.0          | `kling-3.0/video`                      | Yes | No  |
| Kling 3.0          | `kling-3.0/motion-control`             | Yes | No  |
| Grok Imagine       | `grok-imagine/text-to-video`           | Yes | No  |
| Grok Imagine       | `grok-imagine/image-to-video`          | Yes | No  |
| Grok Imagine       | `grok-imagine/extend`                  | Yes | No  |
| Grok Imagine       | `grok-imagine/upscale`                 | Yes | No  |
| Wan 2.7            | `wan/2-7-text-to-video`                | Yes | No  |
| Wan 2.7            | `wan/2-7-image-to-video`               | Yes | No  |
| Wan 2.7            | `wan/2-7-r2v`                          | Yes | No  |
| Wan 2.7            | `wan/2-7-videoedit`                    | Yes | No  |
| Seedance 2.0 (KIE) | `bytedance/seedance-2`                 | Yes | No  |
| Seedance 2.0 (FAL) | `fal-ai/bytedance/seedance-2.0/i2v`    | No  | Yes |

### Image Generation

| Model           | Endpoint             | KIE | FAL |
| --------------- | -------------------- | --- | --- |
| Wan 2.7         | text-to-image        | Yes | Yes |
| Wan 2.7 Pro     | text-to-image        | Yes | Yes |
| Wan 2.7         | edit                 | Yes | Yes |
| Wan 2.7 Pro     | edit                 | Yes | Yes |
| Grok Imagine    | text-to-image        | Yes | No  |
| Grok Imagine    | image-to-image       | Yes | No  |
| Nano Banana Pro | text-to-image / edit | Yes | Yes |
| Nano Banana 2   | text-to-image        | Yes | No  |
| Seedream 5 Lite | text-to-image / edit | Yes | Yes |
| Qwen2           | text-to-image / edit | Yes | No  |
| GPT-image 1.5   | image-to-image       | Yes | No  |

### Audio / Music

| Model          | Endpoint                         | KIE | FAL |
| -------------- | -------------------------------- | --- | --- |
| Suno V4 / V5   | `api/v1/generate`                | Yes | No  |
| ElevenLabs TTS | `elevenlabs/text-to-dialogue-v3` | Yes | No  |
| ElevenLabs SFX | `elevenlabs/sound-effect-v2`     | Yes | No  |
| ElevenLabs STT | `elevenlabs/speech-to-text` (v1) | Yes | No  |
| ElevenLabs STT | `scribe-v2`                      | No  | Yes |

### Special Endpoints

| Feature                         | KIE                | FAL                  |
| ------------------------------- | ------------------ | -------------------- |
| Sora Watermark Remover          | Yes                | No                   |
| File Upload (stream/URL/base64) | Yes (3 endpoints)  | No                   |
| Job Status Polling              | Yes (`recordInfo`) | Yes (`queue/status`) |
| Credits / Usage                 | Yes (`credit`)     | Yes (`models/usage`) |
