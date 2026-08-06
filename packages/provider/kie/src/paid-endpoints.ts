// AUTO-GENERATED from packages/provider/cost/src/paid-endpoints.ts; do not edit.
// Edit the canonical file and run `pnpm run gen:shared`.
/**
 * Exact paid-endpoint registry.
 *
 * Only endpoints listed here are considered paid. All unlisted endpoints
 * are assumed free and must preserve current behavior with no caller changes.
 *
 * Matching is exact: provider + method + dotPath. No regex, prefix,
 * wildcard, path-family, generated broad match, or fallback-by-method logic.
 */

export interface PaidEndpointKey {
  provider: string;
  method: string;
  dotPath: string;
}

export interface PaidEndpointInfo {
  /** Human-readable reason why this endpoint is paid. */
  reason: string;
  /** Optional estimator identifier for cost computation. */
  estimatorId?: string;
  /** Optional known cost notes (e.g. per-unit billing details). */
  costNotes?: string;
}

export interface PaidEndpointEntry {
  key: PaidEndpointKey;
  info: PaidEndpointInfo;
}

/**
 * The canonical list of paid endpoints. Add new entries here only after
 * review. Keep the list small and explicit.
 */
export const PAID_ENDPOINTS: readonly PaidEndpointEntry[] = [
  {
    key: {
      provider: "kie",
      method: "POST",
      dotPath: "api.v1.jobs.createTask",
    },
    info: {
      reason:
        "Media generation task that incurs direct marginal compute cost per job",
      estimatorId: "kie-per-unit",
      costNotes:
        "Billed per unit (seconds/images/songs) based on model and resolution",
    },
  },
  {
    key: {
      provider: "kie",
      method: "POST",
      dotPath: "api.v1.veo.generate",
    },
    info: {
      reason:
        "Direct VEO video generation task that incurs direct marginal compute cost",
      estimatorId: "kie-per-unit",
      costNotes: "Billed per video generation based on model and duration",
    },
  },
  {
    key: {
      provider: "kie",
      method: "POST",
      dotPath: "api.v1.veo.extend",
    },
    info: {
      reason:
        "Direct VEO video extension task that incurs direct marginal compute cost",
      estimatorId: "kie-per-unit",
      costNotes: "Billed per video extension based on model and duration",
    },
  },
  {
    key: {
      provider: "kie",
      method: "GET",
      dotPath: "api.v1.veo.get1080pVideo",
    },
    info: {
      reason:
        "Direct VEO 1080p render request that can incur direct marginal compute cost",
      estimatorId: "kie-per-unit",
      costNotes: "Billed per 1080p render request when processing is required",
    },
  },
  {
    key: {
      provider: "kie",
      method: "POST",
      dotPath: "api.v1.veo.get4kVideo",
    },
    info: {
      reason:
        "Direct VEO 4K render request that can incur direct marginal compute cost",
      estimatorId: "kie-per-unit",
      costNotes:
        "Billed per 4K render request; extra cost ~2x Fast mode generation",
    },
  },
  {
    key: {
      provider: "kie",
      method: "POST",
      dotPath: "api.v1.flux.kontext.generate",
    },
    info: {
      reason:
        "Flux Kontext image generation/edit task that incurs direct marginal compute cost",
      estimatorId: "kie-per-unit",
      costNotes: "Billed per image generation based on model (pro/max)",
    },
  },
  {
    key: {
      provider: "kie",
      method: "POST",
      dotPath: "api.v1.gpt4oImage.generate",
    },
    info: {
      reason:
        "4o Image generation/edit task that incurs direct marginal compute cost",
      estimatorId: "kie-per-unit",
      costNotes: "Billed per image generation based on size and fallback model",
    },
  },
  {
    key: {
      provider: "kie",
      method: "POST",
      dotPath: "api.v1.mj.generate",
    },
    info: {
      reason:
        "Midjourney image/video generation task that incurs direct marginal compute cost",
      estimatorId: "kie-per-unit",
      costNotes: "Billed per generation based on task type, speed, and version",
    },
  },
  {
    key: {
      provider: "kie",
      method: "POST",
      dotPath: "api.v1.runway.generate",
    },
    info: {
      reason:
        "Runway video generation task that incurs direct marginal compute cost",
      estimatorId: "kie-per-unit",
      costNotes: "Billed per video generation based on duration and quality",
    },
  },
  {
    key: {
      provider: "kie",
      method: "POST",
      dotPath: "api.v1.runway.extend",
    },
    info: {
      reason:
        "Runway video extension task that incurs direct marginal compute cost",
      estimatorId: "kie-per-unit",
      costNotes: "Billed per video extension based on quality",
    },
  },
  {
    key: {
      provider: "kie",
      method: "POST",
      dotPath: "api.v1.aleph.generate",
    },
    info: {
      reason:
        "Runway Aleph video-to-video generation task that incurs direct marginal compute cost",
      estimatorId: "kie-per-unit",
      costNotes: "Billed per Aleph video-to-video generation",
    },
  },
  // Operator ruling ac-y1s96b / ask ac-ua82k5: gate all seven task-creating
  // Suno + omni routes (exact match; no wildcards).
  {
    key: {
      provider: "kie",
      method: "POST",
      dotPath: "api.v1.generate",
    },
    info: {
      reason:
        "Suno music generation task that incurs direct marginal compute cost",
      estimatorId: "kie-per-unit",
      costNotes: "Billed per song generation based on model",
    },
  },
  {
    key: {
      provider: "kie",
      method: "POST",
      // Exact match only — sibling leaves like mashup/replaceSection are not
      // gated by the parent `api.v1.generate` entry above.
      dotPath: "api.v1.generate.generatePersona",
    },
    info: {
      reason: "Suno persona creation that incurs direct marginal compute cost",
      estimatorId: "kie-per-unit",
      costNotes: "Billed per persona create from completed audio",
    },
  },
  {
    key: {
      provider: "kie",
      method: "POST",
      dotPath: "api.v1.mp4.generate",
    },
    info: {
      reason:
        "Suno music-video generation task that incurs direct marginal compute cost",
      estimatorId: "kie-per-unit",
      costNotes: "Billed per mp4 conversion",
    },
  },
  {
    key: {
      provider: "kie",
      method: "POST",
      dotPath: "api.v1.wav.generate",
    },
    info: {
      reason:
        "Suno WAV conversion task that incurs direct marginal compute cost",
      estimatorId: "kie-per-unit",
      costNotes: "Billed per wav conversion",
    },
  },
  {
    key: {
      provider: "kie",
      method: "POST",
      dotPath: "api.v1.vocalRemoval.generate",
    },
    info: {
      reason:
        "Suno vocal-separation task that incurs direct marginal compute cost",
      estimatorId: "kie-per-unit",
      costNotes:
        "Billed per separation based on type (separate_vocal/split_stem)",
    },
  },
  {
    key: {
      provider: "kie",
      method: "POST",
      dotPath: "api.v1.midi.generate",
    },
    info: {
      reason:
        "Suno MIDI extraction task that incurs direct marginal compute cost",
      estimatorId: "kie-per-unit",
      costNotes: "Billed per midi extraction",
    },
  },
  {
    key: {
      provider: "kie",
      method: "POST",
      dotPath: "api.v1.voice.generate",
    },
    info: {
      reason:
        "Suno custom-voice generation task that incurs direct marginal compute cost",
      estimatorId: "kie-per-unit",
      costNotes: "Billed per custom voice create",
    },
  },
  {
    key: {
      provider: "kie",
      method: "POST",
      dotPath: "api.v1.suno.cover.generate",
    },
    info: {
      reason:
        "Suno cover-image generation task that incurs direct marginal compute cost",
      estimatorId: "kie-per-unit",
      costNotes: "Billed per cover image generation for a music task",
    },
  },
  {
    key: {
      provider: "kie",
      method: "POST",
      dotPath: "api.v1.voice.validate",
    },
    info: {
      reason:
        "Suno custom-voice validation-phrase task that incurs direct marginal compute cost",
      estimatorId: "kie-per-unit",
      costNotes: "Billed per validation-phrase generation",
    },
  },
  {
    key: {
      provider: "kie",
      method: "POST",
      dotPath: "api.v1.voice.regenerate",
    },
    info: {
      reason:
        "Suno custom-voice validation-phrase regenerate task that incurs direct marginal compute cost",
      estimatorId: "kie-per-unit",
      costNotes: "Billed per validation-phrase regeneration",
    },
  },
  {
    key: {
      provider: "kie",
      method: "POST",
      dotPath: "api.v1.omni.audio.create",
    },
    info: {
      reason:
        "Gemini Omni audio voice-preset creation that incurs direct marginal compute cost",
      estimatorId: "kie-per-unit",
      costNotes: "Billed per omni audio voice create",
    },
  },
  {
    key: {
      provider: "kie",
      method: "POST",
      dotPath: "api.v1.omni.character.create",
    },
    info: {
      reason:
        "Gemini Omni character creation that incurs direct marginal compute cost",
      estimatorId: "kie-per-unit",
      costNotes: "Billed per omni character create",
    },
  },
  {
    key: {
      provider: "xai",
      method: "POST",
      dotPath: "v1.images.generations",
    },
    info: {
      reason: "Image generation task that incurs direct compute cost",
      costNotes: "Billed per image based on model and resolution",
    },
  },
  {
    key: {
      provider: "xai",
      method: "POST",
      dotPath: "v1.images.edits",
    },
    info: {
      reason: "Image edit task that incurs direct compute cost",
      costNotes: "Billed per image edit based on model and resolution",
    },
  },
  {
    key: {
      provider: "xai",
      method: "POST",
      dotPath: "v1.videos.generations",
    },
    info: {
      reason: "Video generation task that incurs direct compute cost",
      costNotes: "Billed per video generation based on duration and model",
    },
  },
  {
    key: {
      provider: "xai",
      method: "POST",
      dotPath: "v1.videos.generations.imageToVideo",
    },
    info: {
      reason:
        "Grok Imagine image-to-video generation incurs direct compute cost",
      costNotes:
        "Billed per video generation based on duration, resolution, and input image",
    },
  },
  {
    key: {
      provider: "xai",
      method: "POST",
      dotPath: "v1.videos.edits",
    },
    info: {
      reason: "Video edit task that incurs direct compute cost",
      costNotes: "Billed per video edit based on duration and model",
    },
  },
  {
    key: {
      provider: "xai",
      method: "POST",
      dotPath: "v1.videos.extensions",
    },
    info: {
      reason: "Video extension task that incurs direct compute cost",
      costNotes: "Billed per video extension based on duration and model",
    },
  },
];

/**
 * Look up a paid endpoint by exact key match.
 *
 * Returns `PaidEndpointInfo` only when provider, method, and dotPath all match
 * an entry in `PAID_ENDPOINTS` exactly. Returns `undefined` for every
 * unlisted endpoint, which callers must treat as free.
 */
export function lookupPaidEndpoint(
  provider: string,
  method: string,
  dotPath: string
): PaidEndpointInfo | undefined {
  for (const entry of PAID_ENDPOINTS) {
    if (
      entry.key.provider === provider &&
      entry.key.method === method &&
      entry.key.dotPath === dotPath
    ) {
      return entry.info;
    }
  }
  return undefined;
}

/**
 * Predicate: is this exact endpoint paid?
 *
 * Unlisted endpoints return `false` (assumed free).
 */
export function isPaidEndpoint(
  provider: string,
  method: string,
  dotPath: string
): boolean {
  return lookupPaidEndpoint(provider, method, dotPath) !== undefined;
}
