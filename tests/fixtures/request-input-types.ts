import type {
  GrokImageToVideoParsedRequest,
  GrokImageToVideoRequest,
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

const openAiImageGenerationInput: OpenAiImageGenerationRequest = {
  prompt: "A small red square",
};

const openAiImageGenerationParsed: OpenAiImageGenerationParsedRequest = {
  prompt: "A small red square",
};

declare const kie: KieProvider;
declare const openai: OpenAiProvider;

void kie.post.api.v1.jobs.createTask(kieGrokImageToVideoInput);
void openai.post.v1.images.generations(openAiImageGenerationInput);
void [kieGrokImageToVideoParsed, openAiImageGenerationParsed];
