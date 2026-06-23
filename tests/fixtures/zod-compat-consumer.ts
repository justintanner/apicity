import { createKie } from "../../packages/provider/kie/dist/src/index.js";
import { createOpenAi } from "../../packages/provider/openai/dist/src/index.js";
import { createXai } from "../../packages/provider/xai/dist/src/index.js";

function useValue(value: unknown): void {
  void value;
}

const openai = createOpenAi({ apiKey: "sk-test" });
const openaiResult = openai.post.v1.chat.completions.schema.safeParse({
  messages: [{ role: "user", content: "Hello" }],
});
if (openaiResult.success) {
  useValue(openaiResult.data.messages);
} else {
  openaiResult.error.issues.map((issue) => issue.path);
}

const kie = createKie({ apiKey: "kie-test" });
const kieResult = kie.post.api.v1.jobs.createTask.schema.safeParse({
  model: "gpt-image-2-text-to-image",
  input: {
    prompt: "A serene mountain lake at sunrise.",
    aspect_ratio: "1:1",
    resolution: "2K",
  },
});
if (kieResult.success) {
  useValue(kieResult.data.model);
} else {
  kieResult.error.issues.map((issue) => issue.message);
}

const xai = createXai({ apiKey: "xai-test" });
const xaiResult = xai.post.v1.chat.completions.schema.safeParse({
  model: "grok-3",
  messages: [{ role: "user", content: "Hello" }],
});
if (xaiResult.success) {
  useValue(xaiResult.data.messages);
} else {
  xaiResult.error.issues.map((issue) => issue.code);
}
