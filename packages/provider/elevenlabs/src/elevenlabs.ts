import { ElevenLabsOptions, ElevenLabsProvider } from "./types";
import { createElevenLabsContext } from "./transport";
import { attachExamples } from "./example";
import { createPronunciationDictionariesEndpoints } from "./pronunciation-dictionaries";
import { createModelsEndpoints } from "./models";
import { createVoicesEndpoints } from "./voices";
import { createAudioEndpoints } from "./audio";
import { createSpeechToTextEndpoints } from "./speech-to-text";
import { createMusicEndpoints } from "./music";
import { createSpeechEngineEndpoints } from "./speech-engine";
import { createProductionsEndpoints } from "./productions";
import { createTextToSpeechEndpoints } from "./text-to-speech";
import { createDubbingEndpoints } from "./dubbing";
import { createStudioEndpoints } from "./studio";
import { createSpeechToSpeechEndpoints } from "./speech-to-speech";
import { createUserEndpoints } from "./user";
import { createWorkspaceEndpoints } from "./workspace";
import { createServiceAccountsEndpoints } from "./service-accounts";
import { createConvaiEndpoints } from "./convai";
import { createHistoryEndpoints } from "./history";

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return (
    typeof v === "object" &&
    v !== null &&
    !Array.isArray(v) &&
    (Object.getPrototypeOf(v) === Object.prototype ||
      Object.getPrototypeOf(v) === null)
  );
}

// Deep-merge per-area provider subtrees. Endpoint leaves are area-exclusive, so
// only the shared intermediate namespaces (v1, get.v1, post.v1, ...) recurse;
// callable endpoint namespaces are assigned as-is.
function mergeInto(
  target: Record<string, unknown>,
  source: Record<string, unknown>
): void {
  for (const key of Object.keys(source)) {
    const s = source[key];
    const t = target[key];
    if (isPlainObject(s) && isPlainObject(t)) {
      mergeInto(t, s);
    } else {
      target[key] = s;
    }
  }
}

export function createElevenLabs(opts: ElevenLabsOptions): ElevenLabsProvider {
  const baseURL = opts.baseURL ?? "https://api.elevenlabs.io";
  const doFetch = opts.fetch ?? fetch;
  const timeout = opts.timeout ?? 30000;

  const ctx = createElevenLabsContext({
    apiKey: opts.apiKey,
    baseURL,
    doFetch,
    timeout,
  });

  const parts: Array<Record<string, unknown>> = [
    createPronunciationDictionariesEndpoints(ctx),
    createModelsEndpoints(ctx),
    createVoicesEndpoints(ctx),
    createAudioEndpoints(ctx),
    createSpeechToTextEndpoints(ctx),
    createMusicEndpoints(ctx),
    createSpeechEngineEndpoints(ctx),
    createProductionsEndpoints(ctx),
    createTextToSpeechEndpoints(ctx),
    createDubbingEndpoints(ctx),
    createStudioEndpoints(ctx),
    createSpeechToSpeechEndpoints(ctx),
    createUserEndpoints(ctx),
    createWorkspaceEndpoints(ctx),
    createServiceAccountsEndpoints(ctx),
    createConvaiEndpoints(ctx),
    createHistoryEndpoints(ctx),
  ];

  const provider: Record<string, unknown> = {};
  for (const part of parts) mergeInto(provider, part);

  return attachExamples(provider as unknown as ElevenLabsProvider);
}
