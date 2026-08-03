import type {
  ElevenLabsTextToDialogueV3ParsedRequest,
  ElevenLabsTextToDialogueV3Request,
  ElevenLabsTextToDialogueV3RequestInput,
  ElevenLabsTextToSpeechMultilingualV2ParsedRequest,
  ElevenLabsTextToSpeechMultilingualV2Request,
  ElevenLabsTextToSpeechMultilingualV2RequestInput,
  ElevenLabsTextToSpeechTurbo25ParsedRequest,
  ElevenLabsTextToSpeechTurbo25Request,
  ElevenLabsTextToSpeechTurbo25RequestInput,
  GrokImageToVideoParsedRequest,
  GrokImageToVideoRequest,
  HappyHorse11ImageToVideoParsedRequest,
  HappyHorse11ImageToVideoRequest,
  KieProvider,
} from "@apicity/kie";
import type {
  OpenAiImageGenerationParsedRequest,
  OpenAiImageGenerationRequest,
  OpenAiProvider,
} from "@apicity/openai";

const kieGrokImageToVideoInput: GrokImageToVideoRequest = {
  model: "grok-imagine/image-to-video",
  input: {
    image_urls: ["https://example.com/input.png"],
  },
};

const kieGrokImageToVideoParsed: GrokImageToVideoParsedRequest = {
  model: "grok-imagine/image-to-video",
  input: {
    image_urls: ["https://example.com/input.png"],
    index: 0,
    mode: "normal",
    duration: 6,
    resolution: "480p",
    aspect_ratio: "16:9",
    nsfw_checker: false,
  },
};

const kieHappyHorse11ImageToVideoInput: HappyHorse11ImageToVideoRequest = {
  model: "happyhorse-1-1/image-to-video",
  input: {
    image_urls: ["https://example.com/frame.png"],
  },
};

const kieHappyHorse11ImageToVideoParsed: HappyHorse11ImageToVideoParsedRequest =
  {
    model: "happyhorse-1-1/image-to-video",
    input: {
      prompt: "",
      image_urls: ["https://example.com/frame.png"],
      resolution: "1080p",
      duration: 5,
    },
  };

const kieElevenLabsMultilingualRequest: ElevenLabsTextToSpeechMultilingualV2Request =
  {
    model: "elevenlabs/text-to-speech-multilingual-v2",
    input: { text: "Caller input omits defaults.", voice: "Rachel" },
  };

const kieElevenLabsMultilingualRequestInput: ElevenLabsTextToSpeechMultilingualV2RequestInput =
  {
    model: "elevenlabs/text-to-speech-multilingual-v2",
    input: { text: "RequestInput also omits defaults.", voice: "Rachel" },
  };

const kieElevenLabsMultilingualParsed: ElevenLabsTextToSpeechMultilingualV2ParsedRequest =
  {
    model: "elevenlabs/text-to-speech-multilingual-v2",
    input: {
      text: "Parsed output requires defaults.",
      voice: "Rachel",
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0,
      speed: 1,
    },
  };

const kieElevenLabsTurboRequest: ElevenLabsTextToSpeechTurbo25Request = {
  model: "elevenlabs/text-to-speech-turbo-2-5",
  input: { text: "Caller input omits defaults.", voice: "Rachel" },
};

const kieElevenLabsTurboRequestInput: ElevenLabsTextToSpeechTurbo25RequestInput =
  {
    model: "elevenlabs/text-to-speech-turbo-2-5",
    input: { text: "RequestInput also omits defaults.", voice: "Rachel" },
  };

const kieElevenLabsTurboParsed: ElevenLabsTextToSpeechTurbo25ParsedRequest = {
  model: "elevenlabs/text-to-speech-turbo-2-5",
  input: {
    text: "Parsed output requires defaults.",
    voice: "Rachel",
    stability: 0.5,
    similarity_boost: 0.75,
    style: 0,
    speed: 1,
  },
};

const kieElevenLabsDialogueRequest: ElevenLabsTextToDialogueV3Request = {
  model: "elevenlabs/text-to-dialogue-v3",
  input: {
    dialogue: [{ text: "Caller input omits stability.", voice: "Rachel" }],
  },
};

const kieElevenLabsDialogueRequestInput: ElevenLabsTextToDialogueV3RequestInput =
  {
    model: "elevenlabs/text-to-dialogue-v3",
    input: {
      dialogue: [{ text: "RequestInput omits stability.", voice: "Rachel" }],
    },
  };

const kieElevenLabsDialogueParsed: ElevenLabsTextToDialogueV3ParsedRequest = {
  model: "elevenlabs/text-to-dialogue-v3",
  input: {
    dialogue: [{ text: "Parsed output requires stability.", voice: "Rachel" }],
    stability: 0.5,
  },
};

const kieElevenLabsMultilingualStability: number =
  kieElevenLabsMultilingualParsed.input.stability;
const kieElevenLabsMultilingualSimilarityBoost: number =
  kieElevenLabsMultilingualParsed.input.similarity_boost;
const kieElevenLabsMultilingualStyle: number =
  kieElevenLabsMultilingualParsed.input.style;
const kieElevenLabsMultilingualSpeed: number =
  kieElevenLabsMultilingualParsed.input.speed;
const kieElevenLabsTurboStability: number =
  kieElevenLabsTurboParsed.input.stability;
const kieElevenLabsTurboSimilarityBoost: number =
  kieElevenLabsTurboParsed.input.similarity_boost;
const kieElevenLabsTurboStyle: number = kieElevenLabsTurboParsed.input.style;
const kieElevenLabsTurboSpeed: number = kieElevenLabsTurboParsed.input.speed;
const kieElevenLabsDialogueStability: number =
  kieElevenLabsDialogueParsed.input.stability;

const openAiImageGenerationInput: OpenAiImageGenerationRequest = {
  prompt: "A small red square",
};

const openAiImageGenerationParsed: OpenAiImageGenerationParsedRequest = {
  prompt: "A small red square",
};

declare const kie: KieProvider;
declare const openai: OpenAiProvider;

void kie.post.api.v1.jobs.createTask(kieGrokImageToVideoInput);
void kie.post.api.v1.jobs.createTask(kieHappyHorse11ImageToVideoInput);
void kie.post.api.v1.jobs.createTask(kieElevenLabsMultilingualRequest);
void kie.post.api.v1.jobs.createTask(kieElevenLabsMultilingualRequestInput);
void kie.post.api.v1.jobs.createTask(kieElevenLabsTurboRequest);
void kie.post.api.v1.jobs.createTask(kieElevenLabsTurboRequestInput);
void kie.post.api.v1.jobs.createTask(kieElevenLabsDialogueRequest);
void kie.post.api.v1.jobs.createTask(kieElevenLabsDialogueRequestInput);
void openai.post.v1.images.generations(openAiImageGenerationInput);
void [
  kieGrokImageToVideoParsed,
  kieHappyHorse11ImageToVideoParsed,
  kieElevenLabsMultilingualParsed,
  kieElevenLabsTurboParsed,
  kieElevenLabsDialogueParsed,
  kieElevenLabsMultilingualStability,
  kieElevenLabsMultilingualSimilarityBoost,
  kieElevenLabsMultilingualStyle,
  kieElevenLabsMultilingualSpeed,
  kieElevenLabsTurboStability,
  kieElevenLabsTurboSimilarityBoost,
  kieElevenLabsTurboStyle,
  kieElevenLabsTurboSpeed,
  kieElevenLabsDialogueStability,
  openAiImageGenerationParsed,
];
