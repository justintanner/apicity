// Cost tier definitions and endpoint-to-tier mapping.
//
// Tiers:
// - free:     No marginal cost (e.g., GET /models, health checks)
// - cheap:    Low cost, safe for automated use (e.g., simple embeddings,
//             cheap text-to-image)
// - expensive: Significant cost, gated by budget tokens or explicit approval
//              (e.g., LLM inference, video generation)
// - prohibitive: Extremely high cost, blocked by default
//                (e.g., large batch jobs, fine-tuning)

export type CostTier = "free" | "cheap" | "expensive" | "prohibitive";

export interface TieredEndpoint {
  provider: string;
  dotPath: string;
  method: string;
  tier: CostTier;
  // Optional: why this tier was assigned
  reason?: string;
}

// Static tier assignments for known endpoints.
// This table is intentionally conservative: when in doubt, tier UP.
//
// Generated from scripts/endpoint-docs.tsv + pricing knowledge.
// GET requests that only read metadata are generally free.
// POST requests that generate content (images, video, audio, text)
// are expensive unless they are tiny/cheap models.
// PUT/PATCH/DELETE that mutate state are cheap (admin ops).

export const TIERED_ENDPOINTS: TieredEndpoint[] = [
  // ─── openai ───
  { provider: "openai", dotPath: "v1.models", method: "GET", tier: "free" },
  { provider: "openai", dotPath: "v1.chat.completions", method: "POST", tier: "expensive", reason: "LLM inference" },
  { provider: "openai", dotPath: "v1.embeddings", method: "POST", tier: "cheap", reason: "cheaper than chat" },
  { provider: "openai", dotPath: "v1.audio.speech", method: "POST", tier: "cheap", reason: "TTS per-character" },
  { provider: "openai", dotPath: "v1.audio.transcriptions", method: "POST", tier: "cheap", reason: "STT per-second" },
  { provider: "openai", dotPath: "v1.audio.translations", method: "POST", tier: "cheap" },
  { provider: "openai", dotPath: "v1.images.generations", method: "POST", tier: "expensive", reason: "image generation" },
  { provider: "openai", dotPath: "v1.images.edits", method: "POST", tier: "expensive", reason: "image generation" },
  { provider: "openai", dotPath: "v1.images.variations", method: "POST", tier: "expensive", reason: "image generation" },
  { provider: "openai", dotPath: "v1.files", method: "POST", tier: "cheap" },
  { provider: "openai", dotPath: "v1.files", method: "GET", tier: "free" },
  { provider: "openai", dotPath: "v1.files.content", method: "GET", tier: "free" },
  { provider: "openai", dotPath: "v1.batches", method: "POST", tier: "prohibitive", reason: "batch inference at scale" },
  { provider: "openai", dotPath: "v1.fineTuning.jobs", method: "POST", tier: "prohibitive", reason: "fine-tuning is expensive" },
  { provider: "openai", dotPath: "v1.responses", method: "POST", tier: "expensive", reason: "LLM inference" },
  { provider: "openai", dotPath: "v1.moderations", method: "POST", tier: "cheap" },

  // ─── anthropic ───
  { provider: "anthropic", dotPath: "v1.models.list", method: "GET", tier: "free" },
  { provider: "anthropic", dotPath: "v1.models.retrieve", method: "GET", tier: "free" },
  { provider: "anthropic", dotPath: "v1.messages", method: "POST", tier: "expensive", reason: "LLM inference" },
  { provider: "anthropic", dotPath: "v1.messages.countTokens", method: "POST", tier: "cheap" },
  { provider: "anthropic", dotPath: "v1.messages.batches", method: "POST", tier: "prohibitive", reason: "batch inference" },
  { provider: "anthropic", dotPath: "v1.files", method: "POST", tier: "cheap" },
  { provider: "anthropic", dotPath: "v1.files", method: "GET", tier: "free" },
  { provider: "anthropic", dotPath: "v1.files.content", method: "GET", tier: "free" },
  { provider: "anthropic", dotPath: "v1.skills.create", method: "POST", tier: "prohibitive", reason: "skill training" },

  // ─── xai ───
  { provider: "xai", dotPath: "v1.models", method: "GET", tier: "free" },
  { provider: "xai", dotPath: "v1.languageModels", method: "GET", tier: "free" },
  { provider: "xai", dotPath: "v1.imageGenerationModels", method: "GET", tier: "free" },
  { provider: "xai", dotPath: "v1.videoGenerationModels", method: "GET", tier: "free" },
  { provider: "xai", dotPath: "v1.chat.completions", method: "POST", tier: "expensive", reason: "LLM inference" },
  { provider: "xai", dotPath: "v1.responses", method: "POST", tier: "expensive", reason: "LLM inference" },
  { provider: "xai", dotPath: "v1.images.generations", method: "POST", tier: "expensive", reason: "image generation" },
  { provider: "xai", dotPath: "v1.images.edits", method: "POST", tier: "expensive", reason: "image generation" },
  { provider: "xai", dotPath: "v1.videos.generations", method: "POST", tier: "expensive", reason: "video generation" },
  { provider: "xai", dotPath: "v1.videos.edits", method: "POST", tier: "expensive", reason: "video generation" },
  { provider: "xai", dotPath: "v1.videos.extensions", method: "POST", tier: "expensive", reason: "video generation" },
  { provider: "xai", dotPath: "v1.tts", method: "POST", tier: "cheap" },
  { provider: "xai", dotPath: "v1.stt", method: "POST", tier: "cheap" },
  { provider: "xai", dotPath: "v1.customVoices", method: "POST", tier: "cheap" },
  { provider: "xai", dotPath: "v1.batches", method: "POST", tier: "prohibitive" },
  { provider: "xai", dotPath: "v1.collections", method: "POST", tier: "cheap" },
  { provider: "xai", dotPath: "v1.collections.documents", method: "POST", tier: "cheap" },
  { provider: "xai", dotPath: "v1.documents.search", method: "POST", tier: "cheap" },

  // ─── fal ───
  { provider: "fal", dotPath: "v1.models", method: "GET", tier: "free" },
  { provider: "fal", dotPath: "v1.models.pricing", method: "GET", tier: "free" },
  { provider: "fal", dotPath: "v1.models.pricing.estimate", method: "GET", tier: "free" },
  { provider: "fal", dotPath: "v1.models.pricing.estimate", method: "POST", tier: "free" },
  // All image/video generation endpoints on Fal are expensive
  { provider: "fal", dotPath: "nanoBanana.textToImage", method: "POST", tier: "expensive", reason: "image generation" },
  { provider: "fal", dotPath: "nanoBanana.edit", method: "POST", tier: "expensive", reason: "image generation" },
  { provider: "fal", dotPath: "nanoBanana2.textToImage", method: "POST", tier: "expensive", reason: "image generation" },
  { provider: "fal", dotPath: "nanoBanana2.edit", method: "POST", tier: "expensive", reason: "image generation" },
  { provider: "fal", dotPath: "nanoBananaPro.textToImage", method: "POST", tier: "expensive", reason: "image generation" },
  { provider: "fal", dotPath: "nanoBananaPro.edit", method: "POST", tier: "expensive", reason: "image generation" },
  { provider: "fal", dotPath: "qwenImage", method: "POST", tier: "expensive", reason: "image generation" },
  { provider: "fal", dotPath: "qwenImage.edit", method: "POST", tier: "expensive", reason: "image generation" },
  { provider: "fal", dotPath: "gptImage1p5", method: "POST", tier: "expensive", reason: "image generation" },
  { provider: "fal", dotPath: "gptImage1p5.edit", method: "POST", tier: "expensive", reason: "image generation" },
  { provider: "fal", dotPath: "bytedance.seedream.v5.lite.textToImage", method: "POST", tier: "expensive", reason: "image generation" },
  { provider: "fal", dotPath: "bytedance.seedream.v5.lite.edit", method: "POST", tier: "expensive", reason: "image generation" },
  { provider: "fal", dotPath: "xai.grokImagineImage", method: "POST", tier: "expensive", reason: "image generation" },
  { provider: "fal", dotPath: "xai.grokImagineImage.edit", method: "POST", tier: "expensive", reason: "image generation" },
  { provider: "fal", dotPath: "wan.v2p7.textToImage", method: "POST", tier: "expensive", reason: "image generation" },
  { provider: "fal", dotPath: "wan.v2p7.pro.textToImage", method: "POST", tier: "expensive", reason: "image generation" },
  { provider: "fal", dotPath: "wan.v2p7.edit", method: "POST", tier: "expensive", reason: "image/video generation" },
  { provider: "fal", dotPath: "wan.v2p7.pro.edit", method: "POST", tier: "expensive", reason: "image/video generation" },
  { provider: "fal", dotPath: "bytedance.seedance2p0.textToVideo", method: "POST", tier: "expensive", reason: "video generation" },
  { provider: "fal", dotPath: "bytedance.seedance2p0.imageToVideo", method: "POST", tier: "expensive", reason: "video generation" },
  { provider: "fal", dotPath: "bytedance.seedance2p0.fast.textToVideo", method: "POST", tier: "expensive", reason: "video generation" },
  { provider: "fal", dotPath: "bytedance.seedance2p0.fast.imageToVideo", method: "POST", tier: "expensive", reason: "video generation" },
  { provider: "fal", dotPath: "klingVideo.v3.pro.textToVideo", method: "POST", tier: "expensive", reason: "video generation" },
  { provider: "fal", dotPath: "klingVideo.v3.pro.imageToVideo", method: "POST", tier: "expensive", reason: "video generation" },
  { provider: "fal", dotPath: "klingVideo.v3.standard.textToVideo", method: "POST", tier: "expensive", reason: "video generation" },
  { provider: "fal", dotPath: "klingVideo.v3.standard.imageToVideo", method: "POST", tier: "expensive", reason: "video generation" },
  { provider: "fal", dotPath: "klingVideo.o3p4k.textToVideo", method: "POST", tier: "expensive", reason: "video generation" },
  { provider: "fal", dotPath: "klingVideo.o3p4k.imageToVideo", method: "POST", tier: "expensive", reason: "video generation" },
  { provider: "fal", dotPath: "klingVideo.o3p4k.referenceToVideo", method: "POST", tier: "expensive", reason: "video generation" },
  { provider: "fal", dotPath: "sora2.textToVideo", method: "POST", tier: "expensive", reason: "video generation" },
  { provider: "fal", dotPath: "sora2.imageToVideo", method: "POST", tier: "expensive", reason: "video generation" },
  { provider: "fal", dotPath: "veo3p1.textToVideo", method: "POST", tier: "expensive", reason: "video generation" },
  { provider: "fal", dotPath: "veo3p1.imageToVideo", method: "POST", tier: "expensive", reason: "video generation" },
  { provider: "fal", dotPath: "wan.v2p7.textToVideo", method: "POST", tier: "expensive", reason: "video generation" },
  { provider: "fal", dotPath: "wan.v2p7.imageToVideo", method: "POST", tier: "expensive", reason: "video generation" },
  { provider: "fal", dotPath: "xai.grokImagineVideo.imageToVideo", method: "POST", tier: "expensive", reason: "video generation" },
  { provider: "fal", dotPath: "xai.grokImagineVideo.referenceToVideo", method: "POST", tier: "expensive", reason: "video generation" },
  { provider: "fal", dotPath: "xai.grokImagineVideo.extendVideo", method: "POST", tier: "expensive", reason: "video generation" },
  { provider: "fal", dotPath: "xai.grokImagineVideo.editVideo", method: "POST", tier: "expensive", reason: "video generation" },
  { provider: "fal", dotPath: "hunyuan.v3.instructEdit", method: "POST", tier: "expensive", reason: "image generation" },
  { provider: "fal", dotPath: "falAi.elevenlabs.speechToText.scribeV2", method: "POST", tier: "cheap", reason: "STT" },
  { provider: "fal", dotPath: "v1.queue.submit", method: "POST", tier: "cheap", reason: "queue submission" },
  { provider: "fal", dotPath: "v1.workflows", method: "GET", tier: "free" },
  { provider: "fal", dotPath: "storage.upload.initiate", method: "POST", tier: "cheap" },
  { provider: "fal", dotPath: "storage.upload.initiateMultipart", method: "POST", tier: "cheap" },
  { provider: "fal", dotPath: "storage.upload.completeMultipart", method: "POST", tier: "cheap" },

  // ─── fireworks ───
  { provider: "fireworks", dotPath: "inference.v1.chat.completions", method: "POST", tier: "expensive", reason: "LLM inference" },
  { provider: "fireworks", dotPath: "inference.v1.completions", method: "POST", tier: "expensive", reason: "LLM inference" },
  { provider: "fireworks", dotPath: "inference.v1.embeddings", method: "POST", tier: "cheap" },
  { provider: "fireworks", dotPath: "inference.v1.messages", method: "POST", tier: "expensive", reason: "LLM inference" },
  { provider: "fireworks", dotPath: "inference.v1.rerank", method: "POST", tier: "cheap" },
  { provider: "fireworks", dotPath: "inference.v1.audio.transcriptions", method: "POST", tier: "cheap" },
  { provider: "fireworks", dotPath: "inference.v1.audio.translations", method: "POST", tier: "cheap" },
  { provider: "fireworks", dotPath: "inference.v1.audio.batch.transcriptions", method: "POST", tier: "cheap" },
  { provider: "fireworks", dotPath: "inference.v1.audio.batch.translations", method: "POST", tier: "cheap" },
  { provider: "fireworks", dotPath: "inference.v1.workflows.textToImage", method: "POST", tier: "expensive", reason: "image generation" },
  { provider: "fireworks", dotPath: "inference.v1.workflows.getResult", method: "POST", tier: "cheap" },
  { provider: "fireworks", dotPath: "inference.v1.workflows.kontext", method: "POST", tier: "expensive", reason: "LLM inference" },
  // All account/model admin endpoints are cheap or free
  { provider: "fireworks", dotPath: "inference.v1.accounts", method: "GET", tier: "free" },
  { provider: "fireworks", dotPath: "inference.v1.accounts.list", method: "GET", tier: "free" },
  { provider: "fireworks", dotPath: "inference.v1.accounts.models", method: "GET", tier: "free" },
  { provider: "fireworks", dotPath: "inference.v1.accounts.models.list", method: "GET", tier: "free" },
  { provider: "fireworks", dotPath: "inference.v1.accounts.deployments", method: "GET", tier: "free" },
  { provider: "fireworks", dotPath: "inference.v1.accounts.deployments.list", method: "GET", tier: "free" },
  { provider: "fireworks", dotPath: "inference.v1.accounts.batchInferenceJobs", method: "POST", tier: "prohibitive", reason: "batch inference" },
  { provider: "fireworks", dotPath: "inference.v1.accounts.datasets", method: "POST", tier: "cheap" },
  { provider: "fireworks", dotPath: "inference.v1.accounts.deployedModels", method: "POST", tier: "prohibitive", reason: "model deployment" },
  { provider: "fireworks", dotPath: "inference.v1.accounts.dpoJobs", method: "POST", tier: "prohibitive", reason: "training job" },
  { provider: "fireworks", dotPath: "inference.v1.accounts.evaluationJobs", method: "POST", tier: "prohibitive", reason: "training job" },
  { provider: "fireworks", dotPath: "inference.v1.accounts.evaluators", method: "POST", tier: "prohibitive", reason: "training job" },
  { provider: "fireworks", dotPath: "inference.v1.accounts.reinforcementFineTuningJobs", method: "POST", tier: "prohibitive", reason: "training job" },
  { provider: "fireworks", dotPath: "inference.v1.accounts.rlorTrainerJobs", method: "POST", tier: "prohibitive", reason: "training job" },
  { provider: "fireworks", dotPath: "inference.v1.accounts.supervisedFineTuningJobs", method: "POST", tier: "prohibitive", reason: "training job" },
  { provider: "fireworks", dotPath: "inference.v1.accounts.secrets", method: "POST", tier: "cheap" },

  // ─── alibaba ───
  { provider: "alibaba", dotPath: "compatibleMode.v1.models", method: "GET", tier: "free" },
  { provider: "alibaba", dotPath: "compatibleMode.v1.chat.completions", method: "POST", tier: "expensive", reason: "LLM inference" },
  { provider: "alibaba", dotPath: "api.v1.services.aigc.multimodalGeneration.generation", method: "POST", tier: "expensive", reason: "image generation" },
  { provider: "alibaba", dotPath: "api.v1.services.aigc.videoGeneration.videoSynthesis", method: "POST", tier: "expensive", reason: "video generation" },
  { provider: "alibaba", dotPath: "api.v1.tasks", method: "GET", tier: "free" },
  { provider: "alibaba", dotPath: "api.v1.uploads", method: "GET", tier: "free" },

  // ─── kimicoding ───
  { provider: "kimicoding", dotPath: "coding.v1.models", method: "GET", tier: "free" },
  { provider: "kimicoding", dotPath: "coding.v1.messages", method: "POST", tier: "expensive", reason: "LLM inference" },
  { provider: "kimicoding", dotPath: "coding.v1.embeddings", method: "POST", tier: "cheap" },
  { provider: "kimicoding", dotPath: "coding.v1.countTokens", method: "POST", tier: "cheap" },

  // ─── kie ───
  { provider: "kie", dotPath: "api.v1.chat.credit", method: "GET", tier: "free" },
  { provider: "kie", dotPath: "api.v1.common.downloadUrl", method: "POST", tier: "cheap" },
  { provider: "kie", dotPath: "claude.v1.messages", method: "POST", tier: "expensive", reason: "LLM inference" },
  { provider: "kie", dotPath: "api.v1.generate", method: "POST", tier: "expensive", reason: "music generation" },
  { provider: "kie", dotPath: "api.v1.generate.addInstrumental", method: "POST", tier: "expensive", reason: "music generation" },
  { provider: "kie", dotPath: "api.v1.generate.addVocals", method: "POST", tier: "expensive", reason: "music generation" },
  { provider: "kie", dotPath: "api.v1.generate.mashup", method: "POST", tier: "expensive", reason: "music generation" },
  { provider: "kie", dotPath: "api.v1.generate.replaceSection", method: "POST", tier: "expensive", reason: "music generation" },
  { provider: "kie", dotPath: "api.v1.generate.sounds", method: "POST", tier: "expensive", reason: "sound generation" },
  { provider: "kie", dotPath: "api.v1.veo.generate", method: "POST", tier: "expensive", reason: "video generation" },
  { provider: "kie", dotPath: "api.v1.veo.extend", method: "POST", tier: "expensive", reason: "video generation" },
  { provider: "kie", dotPath: "api.v1.jobs.createTask", method: "POST", tier: "cheap" },
  { provider: "kie", dotPath: "api.v1.jobs.recordInfo", method: "GET", tier: "free" },
  { provider: "kie", dotPath: "api.fileBase64Upload", method: "POST", tier: "cheap" },
  { provider: "kie", dotPath: "api.fileStreamUpload", method: "POST", tier: "cheap" },
  { provider: "kie", dotPath: "api.fileUrlUpload", method: "POST", tier: "cheap" },

  // ─── elevenlabs ───
  { provider: "elevenlabs", dotPath: "v1.soundGeneration", method: "POST", tier: "cheap", reason: "sound generation per-second" },
  { provider: "elevenlabs", dotPath: "v1.speechToText", method: "POST", tier: "cheap", reason: "STT per-second" },

  // ─── x ───
  { provider: "x", dotPath: "v2.tweets", method: "POST", tier: "cheap" },
  { provider: "x", dotPath: "v2.media.upload.initialize", method: "POST", tier: "cheap" },
  { provider: "x", dotPath: "v2.media.upload.append", method: "POST", tier: "cheap" },
  { provider: "x", dotPath: "v2.media.upload.finalize", method: "POST", tier: "cheap" },
  { provider: "x", dotPath: "v2.media.upload", method: "GET", tier: "free" },

  // ─── meta ───
  { provider: "meta", dotPath: "v25.media", method: "POST", tier: "cheap" },
  { provider: "meta", dotPath: "v25.mediaPublish", method: "POST", tier: "cheap" },
  { provider: "meta", dotPath: "v25.container", method: "GET", tier: "free" },

  // ─── polymarket ───
  // All Polymarket endpoints are GET-based market data — free
  { provider: "polymarket", dotPath: "clob.time", method: "GET", tier: "free" },
  { provider: "polymarket", dotPath: "clob.book", method: "GET", tier: "free" },
  { provider: "polymarket", dotPath: "clob.price", method: "GET", tier: "free" },
  { provider: "polymarket", dotPath: "clob.midpoint", method: "GET", tier: "free" },
  { provider: "polymarket", dotPath: "clob.spread", method: "GET", tier: "free" },
  { provider: "polymarket", dotPath: "clob.lastTradePrice", method: "GET", tier: "free" },
  { provider: "polymarket", dotPath: "clob.tickSize", method: "GET", tier: "free" },
  { provider: "polymarket", dotPath: "clob.feeRate", method: "GET", tier: "free" },
  { provider: "polymarket", dotPath: "clob.pricesHistory", method: "GET", tier: "free" },
  { provider: "polymarket", dotPath: "clob.markets", method: "GET", tier: "free" },
  { provider: "polymarket", dotPath: "clob.samplingMarkets", method: "GET", tier: "free" },
  { provider: "polymarket", dotPath: "clob.simplifiedMarkets", method: "GET", tier: "free" },
  { provider: "polymarket", dotPath: "clob.samplingSimplifiedMarkets", method: "GET", tier: "free" },
  { provider: "polymarket", dotPath: "clob.marketsByToken", method: "GET", tier: "free" },
  { provider: "polymarket", dotPath: "clob.clobMarkets", method: "GET", tier: "free" },
  { provider: "polymarket", dotPath: "clob.books", method: "POST", tier: "free" },
  { provider: "polymarket", dotPath: "clob.prices", method: "POST", tier: "free" },
  { provider: "polymarket", dotPath: "clob.midpoints", method: "POST", tier: "free" },
  { provider: "polymarket", dotPath: "clob.spreads", method: "POST", tier: "free" },
  { provider: "polymet", dotPath: "clob.lastTradesPrices", method: "POST", tier: "free" },
  { provider: "polymarket", dotPath: "clob.batchPricesHistory", method: "POST", tier: "free" },
  { provider: "polymarket", dotPath: "gamma.events", method: "GET", tier: "free" },
  { provider: "polymarket", dotPath: "gamma.events.keyset", method: "GET", tier: "free" },
  { provider: "polymarket", dotPath: "gamma.events.slug", method: "GET", tier: "free" },
  { provider: "polymarket", dotPath: "gamma.events.tags", method: "GET", tier: "free" },
  { provider: "polymarket", dotPath: "gamma.markets", method: "GET", tier: "free" },
  { provider: "polymarket", dotPath: "gamma.markets.keyset", method: "GET", tier: "free" },
  { provider: "polymarket", dotPath: "gamma.markets.slug", method: "GET", tier: "free" },
  { provider: "polymarket", dotPath: "gamma.markets.tags", method: "GET", tier: "free" },
  { provider: "polymarket", dotPath: "gamma.series", method: "GET", tier: "free" },
  { provider: "polymarket", dotPath: "gamma.tags", method: "GET", tier: "free" },
  { provider: "polymarket", dotPath: "gamma.tags.relatedTags", method: "GET", tier: "free" },
  { provider: "polymarket", dotPath: "gamma.tags.relatedTags.slug", method: "GET", tier: "free" },
  { provider: "polymarket", dotPath: "gamma.comments", method: "GET", tier: "free" },
  { provider: "polymarket", dotPath: "gamma.comments.byUser", method: "GET", tier: "free" },
  { provider: "polymarket", dotPath: "gamma.search", method: "GET", tier: "free" },
  { provider: "polymarket", dotPath: "gamma.sports", method: "GET", tier: "free" },
  { provider: "polymarket", dotPath: "gamma.sports.marketTypes", method: "GET", tier: "free" },
  { provider: "polymarket", dotPath: "data.positions", method: "GET", tier: "free" },
  { provider: "polymarket", dotPath: "data.value", method: "GET", tier: "free" },
  { provider: "polymarket", dotPath: "data.holders", method: "GET", tier: "free" },
  { provider: "polymarket", dotPath: "data.activity", method: "GET", tier: "free" },
  { provider: "polymarket", dotPath: "data.trades", method: "GET", tier: "free" },
  { provider: "polymarket", dotPath: "data.oi", method: "GET", tier: "free" },
  { provider: "polymarket", dotPath: "data.liveVolume", method: "GET", tier: "free" },

  // ─── free-media-upload ───
  // All free-media-upload endpoints are free (no API keys, no metering)
  { provider: "free-media-upload", dotPath: "catbox.upload", method: "POST", tier: "free" },
  { provider: "free-media-upload", dotPath: "filebin.upload", method: "POST", tier: "free" },
  { provider: "free-media-upload", dotPath: "gofile.upload", method: "POST", tier: "free" },
  { provider: "free-media-upload", dotPath: "litterbox.upload", method: "POST", tier: "free" },
  { provider: "free-media-upload", dotPath: "tempsh.upload", method: "POST", tier: "free" },
  { provider: "free-media-upload", dotPath: "tflink.upload", method: "POST", tier: "free" },
  { provider: "free-media-upload", dotPath: "tmpfiles.api.v1.upload", method: "POST", tier: "free" },
  { provider: "free-media-upload", dotPath: "uguu.upload", method: "POST", tier: "free" },

  // ─── youtube ───
  { provider: "youtube", dotPath: "videos.list", method: "GET", tier: "free" },
  { provider: "youtube", dotPath: "videos.insert", method: "POST", tier: "cheap" },
  { provider: "youtube", dotPath: "channels.list", method: "GET", tier: "free" },
  { provider: "youtube", dotPath: "transcripts.get", method: "GET", tier: "free" },
  { provider: "youtube", dotPath: "videoMetadata", method: "GET", tier: "free" },

  // ─── dolthub ───
  { provider: "dolthub", dotPath: "v1alpha1.sql.read", method: "GET", tier: "free" },
  { provider: "dolthub", dotPath: "v1alpha1.sql.write", method: "POST", tier: "cheap" },
  { provider: "dolthub", dotPath: "v1alpha1.sql.writePoll", method: "GET", tier: "free" },
  { provider: "dolthub", dotPath: "v1alpha1.database.create", method: "POST", tier: "cheap" },
  { provider: "dolthub", dotPath: "v1alpha1.branches.list", method: "GET", tier: "free" },
  { provider: "dolthub", dotPath: "v1alpha1.branches.create", method: "POST", tier: "cheap" },
  { provider: "dolthub", dotPath: "v1alpha1.pulls.list", method: "GET", tier: "free" },
  { provider: "dolthub", dotPath: "v1alpha1.pulls.create", method: "POST", tier: "cheap" },
  { provider: "dolthub", dotPath: "v1alpha1.pulls.get", method: "GET", tier: "free" },
  { provider: "dolthub", dotPath: "v1alpha1.pulls.merge", method: "POST", tier: "cheap" },
  { provider: "dolthub", dotPath: "v1alpha1.user.get", method: "GET", tier: "free" },
];

// Lookup function: exact match on (provider, dotPath, method).
// Falls back to provider-level default if no exact match.
// When in doubt, tier UP (expensive > cheap > free).
export function lookupTier(
  provider: string,
  dotPath: string,
  method: string
): CostTier {
  const exact = TIERED_ENDPOINTS.find(
    (e) =>
      e.provider === provider && e.dotPath === dotPath && e.method === method
  );
  if (exact) return exact.tier;

  // Conservative fallback: GET is free, anything else is cheap
  if (method === "GET") return "free";
  return "cheap";
}

// Return all endpoints for a given provider.
export function providerTiers(provider: string): TieredEndpoint[] {
  return TIERED_ENDPOINTS.filter((e) => e.provider === provider);
}
