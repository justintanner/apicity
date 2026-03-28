import type { PayloadSchema } from "./types";

export const chatCompletionsSchema: PayloadSchema = {
  method: "POST",
  path: "/chat/completions",
  contentType: "application/json",
  fields: {
    model: {
      type: "string",
      required: true,
      description:
        "Model ID (e.g. accounts/fireworks/models/llama-v3p1-70b-instruct)",
    },
    messages: {
      type: "array",
      required: true,
      description: "Array of chat messages",
      items: {
        type: "object",
        properties: {
          role: {
            type: "string",
            required: true,
            enum: ["user", "assistant", "system"],
          },
          content: { type: "string", required: true },
        },
      },
    },
    temperature: {
      type: "number",
      description: "Sampling temperature 0-2",
    },
    top_p: { type: "number", description: "Nucleus sampling 0-1" },
    top_k: { type: "number", description: "Top-k token filtering 0-100" },
    max_tokens: { type: "number", description: "Max tokens to generate" },
    max_completion_tokens: {
      type: "number",
      description: "Max completion tokens",
    },
    n: { type: "number", description: "Number of completions to generate" },
    stop: {
      type: "string",
      description: "Stop sequences (string or array, up to 4)",
    },
    stream: { type: "boolean", description: "Enable streaming" },
    tools: {
      type: "array",
      description: "Tool definitions for function calling",
      items: {
        type: "object",
        properties: {
          type: { type: "string", required: true, enum: ["function"] },
          function: {
            type: "object",
            required: true,
            properties: {
              name: { type: "string", required: true },
              description: { type: "string" },
              parameters: { type: "object" },
            },
          },
        },
      },
    },
    tool_choice: { type: "string", description: "Tool choice strategy" },
    response_format: {
      type: "object",
      description: "Response format configuration",
      properties: {
        type: {
          type: "string",
          required: true,
          enum: ["text", "json_object", "json_schema", "grammar"],
        },
        json_schema: { type: "object" },
        grammar: { type: "object" },
      },
    },
    frequency_penalty: {
      type: "number",
      description: "Frequency penalty -2 to 2",
    },
    presence_penalty: {
      type: "number",
      description: "Presence penalty -2 to 2",
    },
    logprobs: {
      type: "boolean",
      description: "Include log probabilities",
    },
    top_logprobs: {
      type: "number",
      description: "Top token alternatives 0-5",
    },
    reasoning_effort: {
      type: "string",
      description: "Reasoning effort level",
      enum: ["low", "medium", "high", "none"],
    },
    user: {
      type: "string",
      description: "End-user identifier for abuse monitoring",
    },
  },
};

export const completionsSchema: PayloadSchema = {
  method: "POST",
  path: "/completions",
  contentType: "application/json",
  fields: {
    model: {
      type: "string",
      required: true,
      description: "Model ID",
    },
    prompt: {
      type: "string",
      required: true,
      description:
        "Prompt to generate completions for (string, string[], number[], or number[][])",
    },
    max_tokens: { type: "number", description: "Max tokens to generate" },
    max_completion_tokens: {
      type: "number",
      description: "Max completion tokens",
    },
    temperature: {
      type: "number",
      description: "Sampling temperature 0-2",
    },
    top_p: { type: "number", description: "Nucleus sampling 0-1" },
    top_k: { type: "number", description: "Top-k token filtering 0-100" },
    n: {
      type: "number",
      description: "Number of completions to generate (1-128)",
    },
    stop: {
      type: "string",
      description: "Stop sequences (string or array, up to 4)",
    },
    stream: { type: "boolean", description: "Enable streaming" },
    echo: {
      type: "boolean",
      description: "Include prompt in response",
    },
    echo_last: {
      type: "number",
      description: "Echo last N prompt tokens",
    },
    frequency_penalty: {
      type: "number",
      description: "Frequency penalty -2 to 2",
    },
    presence_penalty: {
      type: "number",
      description: "Presence penalty -2 to 2",
    },
    repetition_penalty: {
      type: "number",
      description: "Repetition penalty 0-2",
    },
    logprobs: {
      type: "boolean",
      description: "Include log probabilities",
    },
    top_logprobs: {
      type: "number",
      description: "Top token alternatives 0-5",
    },
    response_format: {
      type: "object",
      description: "Response format configuration",
      properties: {
        type: {
          type: "string",
          required: true,
          enum: ["text", "json_object", "json_schema", "grammar"],
        },
        json_schema: { type: "object" },
        grammar: { type: "object" },
      },
    },
    reasoning_effort: {
      type: "string",
      description: "Reasoning effort level",
      enum: ["low", "medium", "high", "none"],
    },
    seed: {
      type: "number",
      description: "Random seed for deterministic sampling",
    },
    user: {
      type: "string",
      description: "End-user identifier for abuse monitoring",
    },
  },
};

export const rerankSchema: PayloadSchema = {
  method: "POST",
  path: "/rerank",
  contentType: "application/json",
  fields: {
    model: {
      type: "string",
      required: true,
      description: "Reranker model ID (e.g. fireworks/qwen3-reranker-8b)",
    },
    query: {
      type: "string",
      required: true,
      description: "The search query to rerank documents against",
    },
    documents: {
      type: "array",
      required: true,
      description: "List of document strings to be ranked",
      items: { type: "string" },
    },
    top_n: {
      type: "number",
      description: "Number of top results to return",
    },
    return_documents: {
      type: "boolean",
      description: "Whether to include document text in the response",
    },
  },
};

export const messagesSchema: PayloadSchema = {
  method: "POST",
  path: "/v1/messages",
  contentType: "application/json",
  fields: {
    model: {
      type: "string",
      required: true,
      description:
        "Model ID (e.g. accounts/fireworks/models/llama-v3p1-70b-instruct)",
    },
    messages: {
      type: "array",
      required: true,
      description: "Array of messages (Anthropic Messages format)",
      items: {
        type: "object",
        properties: {
          role: {
            type: "string",
            required: true,
            enum: ["user", "assistant"],
          },
          content: { type: "string", required: true },
        },
      },
    },
    max_tokens: {
      type: "number",
      description: "Maximum tokens to generate",
    },
    system: { type: "string", description: "System prompt" },
    temperature: {
      type: "number",
      description: "Sampling temperature 0-1",
    },
    top_p: { type: "number", description: "Nucleus sampling threshold" },
    top_k: { type: "number", description: "Top-K sampling" },
    stop_sequences: {
      type: "array",
      description: "Custom stop sequences",
      items: { type: "string" },
    },
    stream: { type: "boolean", description: "Enable SSE streaming" },
    metadata: {
      type: "object",
      description: "Request metadata",
      properties: {
        user_id: { type: "string" },
      },
    },
    thinking: {
      type: "object",
      description: "Extended thinking configuration",
      properties: {
        type: {
          type: "string",
          required: true,
          enum: ["enabled", "disabled"],
        },
        budget_tokens: { type: "number" },
      },
    },
    tools: {
      type: "array",
      description: "Tool definitions",
      items: {
        type: "object",
        properties: {
          name: { type: "string", required: true },
          description: { type: "string" },
          input_schema: { type: "object", required: true },
        },
      },
    },
    tool_choice: {
      type: "object",
      description: "Tool choice strategy",
      properties: {
        type: {
          type: "string",
          required: true,
          enum: ["auto", "any", "none", "tool"],
        },
        name: { type: "string" },
      },
    },
    raw_output: {
      type: "boolean",
      description: "Return raw model output details (Fireworks extension)",
    },
  },
};

export const audioTranscriptionsSchema: PayloadSchema = {
  method: "POST",
  path: "/audio/transcriptions",
  contentType: "multipart/form-data",
  fields: {
    file: {
      type: "object",
      required: true,
      description: "Audio file (Blob) or public URL string",
    },
    model: {
      type: "string",
      description: "ASR model (whisper-v3 or whisper-v3-turbo)",
      enum: ["whisper-v3", "whisper-v3-turbo"],
    },
    vad_model: {
      type: "string",
      description: "Voice activity detection model",
      enum: ["silero", "whisperx-pyannet"],
    },
    alignment_model: {
      type: "string",
      description: "Alignment model for timestamps",
      enum: ["mms_fa", "tdnn_ffn"],
    },
    language: { type: "string", description: "Target language code" },
    prompt: {
      type: "string",
      description: "Custom prompt for style or vocabulary",
    },
    temperature: {
      type: "number",
      description: "Sampling temperature 0-1",
    },
    response_format: {
      type: "string",
      description: "Output format",
      enum: ["json", "text", "srt", "verbose_json", "vtt"],
    },
    timestamp_granularities: {
      type: "string",
      description: "Timestamp detail level (word, segment, or both)",
    },
    diarize: {
      type: "string",
      description: "Enable speaker diarization",
      enum: ["true", "false"],
    },
    min_speakers: {
      type: "number",
      description: "Minimum speaker count for diarization",
    },
    max_speakers: {
      type: "number",
      description: "Maximum speaker count for diarization",
    },
    preprocessing: {
      type: "string",
      description: "Audio preprocessing mode",
      enum: ["none", "dynamic", "soft_dynamic", "bass_dynamic"],
    },
  },
};

export const audioTranslationsSchema: PayloadSchema = {
  method: "POST",
  path: "/audio/translations",
  contentType: "multipart/form-data",
  fields: {
    file: {
      type: "object",
      required: true,
      description: "Audio file (Blob) or public URL string",
    },
    model: {
      type: "string",
      description: "ASR model (whisper-v3 or whisper-v3-turbo)",
      enum: ["whisper-v3", "whisper-v3-turbo"],
    },
    vad_model: {
      type: "string",
      description: "Voice activity detection model",
      enum: ["silero", "whisperx-pyannet"],
    },
    alignment_model: {
      type: "string",
      description: "Alignment model for timestamps",
      enum: ["mms_fa", "tdnn_ffn"],
    },
    language: { type: "string", description: "Source language code" },
    prompt: {
      type: "string",
      description: "Custom prompt for style or vocabulary",
    },
    temperature: {
      type: "number",
      description: "Sampling temperature 0-1",
    },
    response_format: {
      type: "string",
      description: "Output format",
      enum: ["json", "text", "srt", "verbose_json", "vtt"],
    },
    timestamp_granularities: {
      type: "string",
      description: "Timestamp detail level (word, segment, or both)",
    },
    preprocessing: {
      type: "string",
      description: "Audio preprocessing mode",
      enum: ["none", "dynamic", "soft_dynamic", "bass_dynamic"],
    },
  },
};

export const audioStreamingTranscriptionsSchema: PayloadSchema = {
  method: "GET",
  path: "/v1/audio/transcriptions/streaming",
  contentType: "application/json",
  fields: {
    language: {
      type: "string",
      description: "Language code (e.g. en, fr, ja)",
    },
    prompt: {
      type: "string",
      description: "Context hint for transcription",
    },
    temperature: {
      type: "number",
      description: "Sampling temperature for token decoding",
    },
    response_format: {
      type: "string",
      description: "Response format (only verbose_json for streaming)",
      enum: ["verbose_json"],
    },
    timestamp_granularities: {
      type: "array",
      description: "Timestamp granularity (word, segment)",
      items: {
        type: "string",
        enum: ["word", "segment"],
      },
    },
  },
};

export const textToImageSchema: PayloadSchema = {
  method: "POST",
  path: "/workflows/accounts/fireworks/models/{model}/text_to_image",
  contentType: "application/json",
  fields: {
    prompt: {
      type: "string",
      required: true,
      description: "Text prompt for image generation",
    },
    aspect_ratio: {
      type: "string",
      description: "Image aspect ratio",
      enum: [
        "1:1",
        "21:9",
        "16:9",
        "3:2",
        "5:4",
        "4:5",
        "2:3",
        "9:16",
        "9:21",
        "4:3",
        "3:4",
      ],
    },
    guidance_scale: {
      type: "number",
      description: "Classifier-free guidance scale (default 3.5)",
    },
    num_inference_steps: {
      type: "number",
      description: "Number of denoising steps (default 4)",
    },
    seed: {
      type: "number",
      description: "Random seed (0 = random)",
    },
  },
};

export const kontextSchema: PayloadSchema = {
  method: "POST",
  path: "/workflows/accounts/fireworks/models/{model}",
  contentType: "application/json",
  fields: {
    prompt: {
      type: "string",
      required: true,
      description: "Text prompt for image generation or editing",
    },
    input_image: {
      type: "string",
      description: "Base64-encoded image or URL for image-to-image editing",
    },
    seed: {
      type: "number",
      description: "Seed for reproducibility (default 42)",
    },
    aspect_ratio: {
      type: "string",
      description: "Aspect ratio (range 21:9 to 9:21)",
    },
    output_format: {
      type: "string",
      description: "Output image format",
      enum: ["png", "jpeg"],
    },
    webhook_url: {
      type: "string",
      description: "URL for webhook notifications",
    },
    webhook_secret: {
      type: "string",
      description: "Secret for webhook signature verification",
    },
    prompt_upsampling: {
      type: "boolean",
      description: "Auto-modify prompt for creative generation",
    },
    safety_tolerance: {
      type: "number",
      description: "Moderation level 0-6 (0=strictest)",
    },
  },
};

export const getResultSchema: PayloadSchema = {
  method: "POST",
  path: "/workflows/accounts/fireworks/models/{model}/get_result",
  contentType: "application/json",
  fields: {
    id: {
      type: "string",
      required: true,
      description: "Request ID from the create request",
    },
  },
};

export const modelsListSchema: PayloadSchema = {
  method: "GET",
  path: "/v1/accounts/{account_id}/models",
  contentType: "application/json",
  fields: {
    pageSize: {
      type: "number",
      description: "Maximum number of models to return (max 200)",
    },
    pageToken: {
      type: "string",
      description: "Pagination token from a previous list response",
    },
    filter: {
      type: "string",
      description: "Google AIP-160 filter expression",
    },
    orderBy: {
      type: "string",
      description: "Comma-separated fields for ordering",
    },
    readMask: {
      type: "string",
      description: 'Fields to return ("*" returns all)',
    },
  },
};

export const modelsCreateSchema: PayloadSchema = {
  method: "POST",
  path: "/v1/accounts/{account_id}/models",
  contentType: "application/json",
  fields: {
    modelId: {
      type: "string",
      required: true,
      description: "ID for the new model",
    },
    model: {
      type: "object",
      required: true,
      description: "Model properties",
    },
    cluster: {
      type: "string",
      description: "BYOC cluster resource name",
    },
  },
};

export const modelsGetSchema: PayloadSchema = {
  method: "GET",
  path: "/v1/accounts/{account_id}/models/{model_id}",
  contentType: "application/json",
  fields: {
    readMask: {
      type: "string",
      description: 'Fields to return ("*" returns all)',
    },
  },
};

export const modelsUpdateSchema: PayloadSchema = {
  method: "PATCH",
  path: "/v1/accounts/{account_id}/models/{model_id}",
  contentType: "application/json",
  fields: {
    displayName: {
      type: "string",
      description: "Display name (max 64 chars)",
    },
    description: {
      type: "string",
      description: "Model description (max 1000 chars)",
    },
    kind: {
      type: "string",
      description: "Model kind",
    },
    public: {
      type: "boolean",
      description: "Whether the model is publicly accessible",
    },
    contextLength: {
      type: "number",
      description: "Context length in tokens",
    },
    supportsImageInput: {
      type: "boolean",
      description: "Whether the model supports image input",
    },
    supportsTools: {
      type: "boolean",
      description: "Whether the model supports tool use",
    },
  },
};

export const modelsDeleteSchema: PayloadSchema = {
  method: "DELETE",
  path: "/v1/accounts/{account_id}/models/{model_id}",
  contentType: "application/json",
  fields: {},
};

export const modelsPrepareSchema: PayloadSchema = {
  method: "POST",
  path: "/v1/accounts/{account_id}/models/{model_id}:prepare",
  contentType: "application/json",
  fields: {
    precision: {
      type: "string",
      required: true,
      description: "Target deployment precision",
    },
    readMask: {
      type: "string",
      description: "Fields to return",
    },
  },
};

export const modelsGetUploadEndpointSchema: PayloadSchema = {
  method: "POST",
  path: "/v1/accounts/{account_id}/models/{model_id}:getUploadEndpoint",
  contentType: "application/json",
  fields: {
    filenameToSize: {
      type: "object",
      required: true,
      description: "Mapping of filename to size in bytes",
    },
    enableResumableUpload: {
      type: "boolean",
      description: "Enable resumable upload",
    },
    readMask: {
      type: "string",
      description: "Fields to return",
    },
  },
};

export const modelsGetDownloadEndpointSchema: PayloadSchema = {
  method: "GET",
  path: "/v1/accounts/{account_id}/models/{model_id}:getDownloadEndpoint",
  contentType: "application/json",
  fields: {
    readMask: {
      type: "string",
      description: "Fields to return",
    },
  },
};

export const modelsValidateUploadSchema: PayloadSchema = {
  method: "GET",
  path: "/v1/accounts/{account_id}/models/{model_id}:validateUpload",
  contentType: "application/json",
  fields: {
    skipHfConfigValidation: {
      type: "boolean",
      description: "Skip HuggingFace config validation",
    },
    trustRemoteCode: {
      type: "boolean",
      description: "Trust remote code",
    },
    configOnly: {
      type: "boolean",
      description: "Skip tokenizer and parameter name validation",
    },
  },
};

export const batchInferenceJobCreateSchema: PayloadSchema = {
  method: "POST",
  path: "/v1/accounts/{account_id}/batchInferenceJobs",
  contentType: "application/json",
  fields: {
    model: {
      type: "string",
      required: true,
      description:
        "Model resource name (e.g. accounts/fireworks/models/llama-v3p1-8b-instruct)",
    },
    inputDatasetId: {
      type: "string",
      required: true,
      description:
        "Input dataset resource name (e.g. accounts/{account_id}/datasets/{dataset_id})",
    },
    displayName: {
      type: "string",
      description: "Human-readable display name for the job",
    },
    outputDatasetId: {
      type: "string",
      description: "Output dataset resource name",
    },
    inferenceParameters: {
      type: "object",
      description: "Inference parameters for the batch job",
      properties: {
        maxTokens: {
          type: "number",
          description: "Maximum tokens to generate per response",
        },
        temperature: {
          type: "number",
          description: "Sampling temperature (0-2)",
        },
        topP: { type: "number", description: "Top-p sampling (0-1)" },
        n: {
          type: "number",
          description: "Number of response candidates per input",
        },
        topK: { type: "number", description: "Top-k token selection limit" },
        extraBody: {
          type: "string",
          description: "Additional parameters as JSON string",
        },
      },
    },
    precision: {
      type: "string",
      description: "Model precision (e.g. FP16, FP8)",
    },
    continuedFromJobName: {
      type: "string",
      description: "Resource name of a previous job to continue from",
    },
  },
};

export const sftCreateSchema: PayloadSchema = {
  method: "POST",
  path: "/v1/accounts/{account_id}/supervisedFineTuningJobs",
  contentType: "application/json",
  fields: {
    accountId: {
      type: "string",
      required: true,
      description: "Fireworks account ID",
    },
    dataset: {
      type: "string",
      required: true,
      description: "Training dataset name",
    },
    displayName: {
      type: "string",
      description: "Display name for the job",
    },
    baseModel: {
      type: "string",
      description:
        "Base model to fine-tune (mutually exclusive with warmStartFrom)",
    },
    warmStartFrom: {
      type: "string",
      description:
        "PEFT addon model to fine-tune from (mutually exclusive with baseModel)",
    },
    outputModel: {
      type: "string",
      description: "Model ID for the output; defaults to job ID",
    },
    jinjaTemplate: {
      type: "string",
      description: "Jinja template for conversation formatting",
    },
    epochs: {
      type: "number",
      description: "Number of training epochs",
    },
    learningRate: {
      type: "number",
      description: "Training learning rate",
    },
    maxContextLength: {
      type: "number",
      description: "Maximum context length",
    },
    loraRank: {
      type: "number",
      description: "LoRA layer rank",
    },
    earlyStop: {
      type: "boolean",
      description: "Stop early if validation loss does not improve",
    },
    evaluationDataset: {
      type: "string",
      description: "Separate evaluation dataset",
    },
    isTurbo: {
      type: "boolean",
      description: "Enable turbo mode",
    },
    evalAutoCarveout: {
      type: "boolean",
      description: "Auto-carve dataset for evaluation",
    },
    region: {
      type: "string",
      description: "Execution region",
    },
    nodes: {
      type: "number",
      description: "Number of compute nodes",
    },
    batchSize: {
      type: "number",
      description: "Batch size for sequence packing",
    },
    batchSizeSamples: {
      type: "number",
      description: "Number of samples per gradient batch",
    },
    gradientAccumulationSteps: {
      type: "number",
      description: "Gradient accumulation steps",
    },
    learningRateWarmupSteps: {
      type: "number",
      description: "Learning rate warm-up steps",
    },
    mtpEnabled: {
      type: "boolean",
      description: "Enable Model-Token-Prediction mode",
    },
    mtpNumDraftTokens: {
      type: "number",
      description: "Number of draft tokens in MTP mode",
    },
    mtpFreezeBaseModel: {
      type: "boolean",
      description: "Freeze base model during MTP training",
    },
    optimizerWeightDecay: {
      type: "number",
      description: "Weight decay (L2 regularization)",
    },
    usePurpose: {
      type: "string",
      description: 'Dedicated resources; only supported value is "pilot"',
    },
    awsS3Config: {
      type: "object",
      description: "AWS S3 access configuration",
      properties: {
        credentialsSecret: {
          type: "string",
          description: "Reference to Secret resource with AWS credentials",
        },
        iamRoleArn: {
          type: "string",
          description: "IAM role ARN for S3 via GCP OIDC",
        },
      },
    },
    azureBlobStorageConfig: {
      type: "object",
      description: "Azure Blob Storage configuration",
      properties: {
        credentialsSecret: {
          type: "string",
          description: "Reference to Secret resource with Azure credentials",
        },
        managedIdentityClientId: {
          type: "string",
          description: "Managed Identity Client ID",
        },
        tenantId: {
          type: "string",
          description: "Azure tenant ID (UUID)",
        },
      },
    },
    wandbConfig: {
      type: "object",
      description: "Weights & Biases logging configuration",
      properties: {
        enabled: { type: "boolean", description: "Enable wandb logging" },
        apiKey: { type: "string", description: "Wandb API key" },
        project: { type: "string", description: "Wandb project name" },
        entity: { type: "string", description: "Wandb entity name" },
        runId: { type: "string", description: "Wandb run identifier" },
      },
    },
    supervisedFineTuningJobId: {
      type: "string",
      description: "Client-specified job ID; system generates UUID if omitted",
    },
  },
};

export const createDeploymentSchema: PayloadSchema = {
  method: "POST",
  path: "/v1/accounts/{account_id}/deployments",
  contentType: "application/json",
  fields: {
    baseModel: {
      type: "string",
      required: true,
      description:
        "Model name (e.g. accounts/fireworks/models/llama-v3p1-70b-instruct)",
    },
    displayName: {
      type: "string",
      description: "Human-readable name, max 64 chars",
    },
    description: {
      type: "string",
      description: "Deployment description",
    },
    minReplicaCount: {
      type: "number",
      description: "Minimum replicas (default: 0)",
    },
    maxReplicaCount: {
      type: "number",
      description: "Maximum replicas",
    },
    acceleratorCount: {
      type: "number",
      description: "Accelerators per replica",
    },
    acceleratorType: {
      type: "string",
      description: "GPU/accelerator type",
      enum: [
        "ACCELERATOR_TYPE_UNSPECIFIED",
        "NVIDIA_A100_80GB",
        "NVIDIA_H100_80GB",
        "AMD_MI300X_192GB",
        "NVIDIA_A10G_24GB",
        "NVIDIA_A100_40GB",
        "NVIDIA_L4_24GB",
        "NVIDIA_H200_141GB",
        "NVIDIA_B200_180GB",
        "AMD_MI325X_256GB",
        "AMD_MI350X_288GB",
      ],
    },
    precision: {
      type: "string",
      description: "Serving precision",
      enum: [
        "PRECISION_UNSPECIFIED",
        "FP16",
        "FP8",
        "FP8_MM",
        "BF16",
        "NF4",
        "FP4",
      ],
    },
    enableAddons: {
      type: "boolean",
      description: "Enable PEFT addons",
    },
    draftTokenCount: {
      type: "number",
      description: "Speculative decoding tokens per step",
    },
    draftModel: {
      type: "string",
      description: "Draft model for speculative decoding",
    },
    maxContextLength: {
      type: "number",
      description: "Context window (0 = model default)",
    },
    deploymentShape: {
      type: "string",
      description: "Deployment shape name",
    },
  },
};

export const updateDeploymentSchema: PayloadSchema = {
  method: "PATCH",
  path: "/v1/accounts/{account_id}/deployments/{deployment_id}",
  contentType: "application/json",
  fields: {
    baseModel: {
      type: "string",
      description: "Model name",
    },
    displayName: {
      type: "string",
      description: "Human-readable name, max 64 chars",
    },
    description: {
      type: "string",
      description: "Deployment description",
    },
    minReplicaCount: {
      type: "number",
      description: "Minimum replicas",
    },
    maxReplicaCount: {
      type: "number",
      description: "Maximum replicas",
    },
    acceleratorCount: {
      type: "number",
      description: "Accelerators per replica",
    },
    acceleratorType: {
      type: "string",
      description: "GPU/accelerator type",
      enum: [
        "ACCELERATOR_TYPE_UNSPECIFIED",
        "NVIDIA_A100_80GB",
        "NVIDIA_H100_80GB",
        "AMD_MI300X_192GB",
        "NVIDIA_A10G_24GB",
        "NVIDIA_A100_40GB",
        "NVIDIA_L4_24GB",
        "NVIDIA_H200_141GB",
        "NVIDIA_B200_180GB",
        "AMD_MI325X_256GB",
        "AMD_MI350X_288GB",
      ],
    },
    precision: {
      type: "string",
      description: "Serving precision",
      enum: [
        "PRECISION_UNSPECIFIED",
        "FP16",
        "FP8",
        "FP8_MM",
        "BF16",
        "NF4",
        "FP4",
      ],
    },
    enableAddons: {
      type: "boolean",
      description: "Enable PEFT addons",
    },
    maxContextLength: {
      type: "number",
      description: "Context window (0 = model default)",
    },
    deploymentShape: {
      type: "string",
      description: "Deployment shape name",
    },
  },
};

export const scaleDeploymentSchema: PayloadSchema = {
  method: "PATCH",
  path: "/v1/accounts/{account_id}/deployments/{deployment_id}:scale",
  contentType: "application/json",
  fields: {
    replicaCount: {
      type: "number",
      required: true,
      description: "Desired number of replicas",
    },
  },
};

export const audioBatchTranscriptionsSchema: PayloadSchema = {
  method: "POST",
  path: "/v1/audio/transcriptions",
  contentType: "multipart/form-data",
  fields: {
    file: {
      type: "string",
      required: true,
      description: "Audio file to transcribe (Blob or URL string)",
    },
    endpoint_id: {
      type: "string",
      required: true,
      description: "Batch endpoint identifier",
    },
    model: {
      type: "string",
      description: "Whisper model ID (e.g. whisper-v3, whisper-v3-turbo)",
    },
    vad_model: {
      type: "string",
      description: "Voice activity detection model",
      enum: ["silero", "whisperx-pyannet"],
    },
    alignment_model: {
      type: "string",
      description: "Forced alignment model",
      enum: ["mms_fa", "tdnn_ffn"],
    },
    language: {
      type: "string",
      description: "ISO-639-1 language code",
    },
    prompt: {
      type: "string",
      description: "Optional text prompt to guide transcription",
    },
    temperature: {
      type: "number",
      description: "Sampling temperature (0-1)",
    },
    response_format: {
      type: "string",
      description: "Output format",
      enum: ["json", "text", "srt", "verbose_json", "vtt"],
    },
    timestamp_granularities: {
      type: "string",
      description: "Timestamp detail level (segment, word)",
    },
    diarize: {
      type: "string",
      description: "Enable speaker diarization",
      enum: ["true", "false"],
    },
    min_speakers: {
      type: "number",
      description: "Minimum number of speakers for diarization",
    },
    max_speakers: {
      type: "number",
      description: "Maximum number of speakers for diarization",
    },
    preprocessing: {
      type: "string",
      description: "Audio preprocessing mode",
      enum: ["none", "dynamic", "soft_dynamic", "bass_dynamic"],
    },
  },
};

export const audioBatchTranslationsSchema: PayloadSchema = {
  method: "POST",
  path: "/v1/audio/translations",
  contentType: "multipart/form-data",
  fields: {
    file: {
      type: "string",
      required: true,
      description: "Audio file to translate (Blob or URL string)",
    },
    endpoint_id: {
      type: "string",
      required: true,
      description: "Batch endpoint identifier",
    },
    model: {
      type: "string",
      description: "Whisper model ID (e.g. whisper-v3, whisper-v3-turbo)",
    },
    vad_model: {
      type: "string",
      description: "Voice activity detection model",
      enum: ["silero", "whisperx-pyannet"],
    },
    alignment_model: {
      type: "string",
      description: "Forced alignment model",
      enum: ["mms_fa", "tdnn_ffn"],
    },
    language: {
      type: "string",
      description: "ISO-639-1 source language code",
    },
    prompt: {
      type: "string",
      description: "Optional text prompt to guide translation",
    },
    temperature: {
      type: "number",
      description: "Sampling temperature (0-1)",
    },
    response_format: {
      type: "string",
      description: "Output format",
      enum: ["json", "text", "srt", "verbose_json", "vtt"],
    },
    timestamp_granularities: {
      type: "string",
      description: "Timestamp detail level (segment, word)",
    },
    preprocessing: {
      type: "string",
      description: "Audio preprocessing mode",
      enum: ["none", "dynamic", "soft_dynamic", "bass_dynamic"],
    },
  },
};

export const dpoJobCreateSchema: PayloadSchema = {
  method: "POST",
  path: "/v1/accounts/{account_id}/dpoJobs",
  contentType: "application/json",
  fields: {
    dataset: {
      type: "string",
      required: true,
      description:
        "Dataset resource name (e.g. accounts/{account_id}/datasets/{dataset_id})",
    },
    displayName: {
      type: "string",
      description: "Human-readable display name for the job",
    },
    trainingConfig: {
      type: "object",
      description: "Training configuration",
      properties: {
        baseModel: {
          type: "string",
          description: "Model to fine-tune",
        },
        warmStartFrom: {
          type: "string",
          description: "PEFT addon model (mutually exclusive with baseModel)",
        },
        outputModel: {
          type: "string",
          description: "Resulting model ID",
        },
        learningRate: {
          type: "number",
          description: "Training learning rate",
        },
        epochs: {
          type: "number",
          description: "Number of training iterations",
        },
        batchSize: {
          type: "number",
          description: "Max tokens per batch",
        },
        maxContextLength: {
          type: "number",
          description: "Model context window size",
        },
        loraRank: {
          type: "number",
          description: "LoRA layer rank (0 for service-mode)",
        },
        jinjaTemplate: {
          type: "string",
          description: "Conversation format Jinja2 template",
        },
        region: {
          type: "string",
          description: "Training region",
        },
      },
    },
    lossConfig: {
      type: "object",
      description: "Reinforcement learning loss configuration",
      properties: {
        method: {
          type: "string",
          description: "Loss algorithm",
          enum: [
            "METHOD_UNSPECIFIED",
            "GRPO",
            "DAPO",
            "DPO",
            "ORPO",
            "GSPO_TOKEN",
          ],
        },
        klBeta: {
          type: "number",
          description: "KL coefficient (beta) override",
        },
      },
    },
    wandbConfig: {
      type: "object",
      description: "Weights & Biases integration config",
      properties: {
        enabled: { type: "boolean", description: "Enable W&B logging" },
        apiKey: { type: "string", description: "W&B API key" },
        project: { type: "string", description: "W&B project name" },
        entity: { type: "string", description: "W&B entity/team name" },
        runId: { type: "string", description: "W&B run ID" },
      },
    },
    awsS3Config: {
      type: "object",
      description: "AWS S3 configuration for dataset storage",
      properties: {
        credentialsSecret: {
          type: "string",
          description: "Secret resource name with AWS credentials",
        },
        iamRoleArn: {
          type: "string",
          description: "AWS IAM role ARN for GCP federation",
        },
      },
    },
    azureBlobStorageConfig: {
      type: "object",
      description: "Azure Blob Storage configuration",
      properties: {
        credentialsSecret: {
          type: "string",
          description: "Secret resource name with Azure credentials",
        },
        managedIdentityClientId: {
          type: "string",
          description: "Managed identity client UUID",
        },
        tenantId: {
          type: "string",
          description: "Azure tenant UUID",
        },
      },
    },
  },
};

export const embeddingsSchema: PayloadSchema = {
  method: "POST",
  path: "/embeddings",
  contentType: "application/json",
  fields: {
    model: {
      type: "string",
      required: true,
      description: "Embedding model ID (e.g. nomic-ai/nomic-embed-text-v1.5)",
    },
    input: {
      type: "string",
      required: true,
      description:
        "Input text to embed (string, string[], number[], or number[][])",
    },
    dimensions: {
      type: "number",
      description: "Output embedding dimensionality",
    },
    prompt_template: {
      type: "string",
      description: "Jinja2 template for processing structured input",
    },
    return_logits: {
      type: "array",
      description: "Token indices for raw logits output",
      items: { type: "number" },
    },
    normalize: {
      type: "boolean",
      description:
        "Enable L2 normalization for embeddings or softmax for logits",
    },
  },
};

// Deployed Models (LoRA management)
export const createDeployedModelSchema: PayloadSchema = {
  method: "POST",
  path: "/v1/accounts/{account_id}/deployedModels",
  contentType: "application/json",
  fields: {
    model: {
      type: "string",
      required: true,
      description:
        "Model resource name (e.g. accounts/my-account/models/my-lora)",
    },
    deployment: {
      type: "string",
      required: true,
      description:
        "Base deployment resource name (e.g. accounts/my-account/deployments/my-deployment)",
    },
    displayName: {
      type: "string",
      description: "Human-readable display name",
    },
    description: {
      type: "string",
      description: "Description of the deployed model",
    },
    default: {
      type: "boolean",
      description:
        "If true, default target when querying without #<deployment> suffix",
    },
    serverless: {
      type: "boolean",
      description: "Whether to deploy as serverless (not applicable for LoRA)",
    },
    public: {
      type: "boolean",
      description: "Whether the deployed model is publicly reachable",
    },
  },
};

export const updateDeployedModelSchema: PayloadSchema = {
  method: "PATCH",
  path: "/v1/accounts/{account_id}/deployedModels/{deployed_model_id}",
  contentType: "application/json",
  fields: {
    displayName: {
      type: "string",
      description: "Human-readable display name",
    },
    description: {
      type: "string",
      description: "Description of the deployed model",
    },
    model: {
      type: "string",
      description: "Model resource name",
    },
    deployment: {
      type: "string",
      description: "Base deployment resource name",
    },
    default: {
      type: "boolean",
      description:
        "If true, default target when querying without #<deployment> suffix",
    },
    serverless: {
      type: "boolean",
      description: "Whether to deploy as serverless",
    },
    public: {
      type: "boolean",
      description: "Whether the deployed model is publicly reachable",
    },
  },
};
