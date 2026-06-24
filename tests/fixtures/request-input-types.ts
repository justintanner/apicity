import type {
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
void openai.post.v1.images.generations(openAiImageGenerationInput);
void [
  kieGrokImageToVideoParsed,
  kieHappyHorse11ImageToVideoParsed,
  openAiImageGenerationParsed,
];
