import { z } from "zod";

// ---------------------------------------------------------------------------
// Sub-schemas (composable building blocks)
// ---------------------------------------------------------------------------

export const FireworksMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  tool_calls: z
    .array(
      z.object({
        id: z.string(),
        type: z.literal("function"),
        function: z.object({
          name: z.string(),
          arguments: z.string(),
        }),
      })
    )
    .optional(),
  tool_call_id: z.string().optional(),
  name: z.string().optional(),
});

export const FireworksToolFunctionSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  parameters: z.record(z.string(), z.unknown()).optional(),
});

export const FireworksToolSchema = z.object({
  type: z.literal("function"),
  function: FireworksToolFunctionSchema,
});

export const FireworksResponseFormatSchema = z.object({
  type: z.enum(["text", "json_object", "json_schema", "grammar"]),
  json_schema: z.record(z.string(), z.unknown()).optional(),
  grammar: z.record(z.string(), z.unknown()).optional(),
});

// ---------------------------------------------------------------------------
// Chat completions
// ---------------------------------------------------------------------------

export const FireworksChatRequestSchema = z.object({
  model: z.string(),
  messages: z.array(FireworksMessageSchema),
  temperature: z.number().optional(),
  top_p: z.number().optional(),
  top_k: z.number().optional(),
  max_tokens: z.number().optional(),
  max_completion_tokens: z.number().optional(),
  n: z.number().optional(),
  stop: z.union([z.string(), z.array(z.string())]).optional(),
  stream: z.boolean().optional(),
  tools: z.array(FireworksToolSchema).optional(),
  tool_choice: z
    .union([
      z.enum(["auto", "none", "required"]),
      z.object({
        type: z.literal("function"),
        function: z.object({ name: z.string() }),
      }),
    ])
    .optional(),
  response_format: FireworksResponseFormatSchema.optional(),
  frequency_penalty: z.number().optional(),
  presence_penalty: z.number().optional(),
  logprobs: z.boolean().optional(),
  top_logprobs: z.number().optional(),
  reasoning_effort: z.enum(["low", "medium", "high", "none"]).optional(),
  user: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Completions
// ---------------------------------------------------------------------------

export const FireworksCompletionRequestSchema = z.object({
  model: z.string(),
  prompt: z.union([
    z.string(),
    z.array(z.string()),
    z.array(z.number()),
    z.array(z.array(z.number())),
  ]),
  max_tokens: z.number().optional(),
  max_completion_tokens: z.number().optional(),
  temperature: z.number().optional(),
  top_p: z.number().optional(),
  top_k: z.number().optional(),
  n: z.number().optional(),
  stop: z.union([z.string(), z.array(z.string())]).optional(),
  stream: z.boolean().optional(),
  echo: z.boolean().optional(),
  echo_last: z.number().optional(),
  frequency_penalty: z.number().optional(),
  presence_penalty: z.number().optional(),
  repetition_penalty: z.number().optional(),
  logprobs: z.union([z.boolean(), z.number()]).optional(),
  top_logprobs: z.number().optional(),
  response_format: FireworksResponseFormatSchema.optional(),
  reasoning_effort: z.enum(["low", "medium", "high", "none"]).optional(),
  seed: z.number().optional(),
  user: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Embeddings
// ---------------------------------------------------------------------------

export const FireworksEmbeddingRequestSchema = z.object({
  model: z.string(),
  input: z.union([
    z.string(),
    z.array(z.string()),
    z.array(z.number()),
    z.array(z.array(z.number())),
  ]),
  dimensions: z.number().optional(),
  prompt_template: z.string().optional(),
  return_logits: z.array(z.number()).optional(),
  normalize: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Rerank
// ---------------------------------------------------------------------------

export const FireworksRerankRequestSchema = z.object({
  model: z.string(),
  query: z.string(),
  documents: z.array(z.string()),
  top_n: z.number().optional(),
  return_documents: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Anthropic Messages (via Fireworks)
// ---------------------------------------------------------------------------

export const AnthropicInputContentBlockSchema = z.union([
  z.object({ type: z.literal("text"), text: z.string() }),
  z.object({
    type: z.literal("image"),
    source: z.union([
      z.object({
        type: z.literal("base64"),
        media_type: z.enum([
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/webp",
        ]),
        data: z.string(),
      }),
      z.object({ type: z.literal("url"), url: z.string() }),
    ]),
  }),
  z.object({
    type: z.literal("thinking"),
    thinking: z.string(),
    signature: z.string(),
  }),
  z.object({
    type: z.literal("redacted_thinking"),
    data: z.string(),
  }),
  z.object({
    type: z.literal("tool_use"),
    id: z.string(),
    name: z.string(),
    input: z.record(z.string(), z.unknown()),
  }),
  z.object({
    type: z.literal("tool_result"),
    tool_use_id: z.string(),
    content: z
      .union([z.string(), z.array(z.record(z.string(), z.unknown()))])
      .optional(),
    is_error: z.boolean().optional(),
  }),
]);

export const AnthropicInputMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.union([z.string(), z.array(AnthropicInputContentBlockSchema)]),
});

export const AnthropicToolDefinitionSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  input_schema: z.record(z.string(), z.unknown()),
  strict: z.boolean().optional(),
});

export const AnthropicThinkingConfigSchema = z.object({
  type: z.enum(["enabled", "disabled"]),
  budget_tokens: z.number().optional(),
});

export const AnthropicMessagesRequestSchema = z.object({
  model: z.string(),
  messages: z.array(AnthropicInputMessageSchema),
  max_tokens: z.number().optional(),
  system: z
    .union([
      z.string(),
      z.array(z.object({ type: z.literal("text"), text: z.string() })),
    ])
    .optional(),
  temperature: z.number().optional(),
  top_p: z.number().optional(),
  top_k: z.number().optional(),
  stop_sequences: z.array(z.string()).optional(),
  stream: z.boolean().optional(),
  metadata: z.object({ user_id: z.string().optional() }).optional(),
  thinking: AnthropicThinkingConfigSchema.optional(),
  tools: z.array(AnthropicToolDefinitionSchema).optional(),
  tool_choice: z
    .union([
      z.object({
        type: z.literal("auto"),
        disable_parallel_tool_use: z.boolean().optional(),
      }),
      z.object({
        type: z.literal("any"),
        disable_parallel_tool_use: z.boolean().optional(),
      }),
      z.object({ type: z.literal("none") }),
      z.object({
        type: z.literal("tool"),
        name: z.string(),
        disable_parallel_tool_use: z.boolean().optional(),
      }),
    ])
    .optional(),
  raw_output: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Audio
// ---------------------------------------------------------------------------

export const FireworksTranscriptionRequestSchema = z.object({
  file: z.union([z.instanceof(Blob), z.string()]),
  model: z.string().optional(),
  vad_model: z.enum(["silero", "whisperx-pyannet"]).optional(),
  alignment_model: z.enum(["mms_fa", "tdnn_ffn"]).optional(),
  language: z.string().optional(),
  prompt: z.string().optional(),
  temperature: z.union([z.number(), z.array(z.number())]).optional(),
  response_format: z
    .enum(["json", "text", "srt", "verbose_json", "vtt"])
    .optional(),
  timestamp_granularities: z
    .union([z.string(), z.array(z.string())])
    .optional(),
  diarize: z.enum(["true", "false"]).optional(),
  min_speakers: z.number().optional(),
  max_speakers: z.number().optional(),
  preprocessing: z
    .enum(["none", "dynamic", "soft_dynamic", "bass_dynamic"])
    .optional(),
});

export const FireworksTranslationRequestSchema = z.object({
  file: z.union([z.instanceof(Blob), z.string()]),
  model: z.string().optional(),
  vad_model: z.enum(["silero", "whisperx-pyannet"]).optional(),
  alignment_model: z.enum(["mms_fa", "tdnn_ffn"]).optional(),
  language: z.string().optional(),
  prompt: z.string().optional(),
  temperature: z.union([z.number(), z.array(z.number())]).optional(),
  response_format: z
    .enum(["json", "text", "srt", "verbose_json", "vtt"])
    .optional(),
  timestamp_granularities: z
    .union([z.string(), z.array(z.string())])
    .optional(),
  preprocessing: z
    .enum(["none", "dynamic", "soft_dynamic", "bass_dynamic"])
    .optional(),
});

export const FireworksStreamingTranscriptionOptionsSchema = z.object({
  language: z.string().optional(),
  prompt: z.string().optional(),
  temperature: z.number().optional(),
  response_format: z.literal("verbose_json").optional(),
  timestamp_granularities: z.array(z.string()).optional(),
  baseURL: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Audio batch
// ---------------------------------------------------------------------------

export const FireworksAudioBatchTranscriptionRequestSchema = z.object({
  file: z.union([z.instanceof(Blob), z.string()]),
  endpoint_id: z.string(),
  model: z.string().optional(),
  vad_model: z.enum(["silero", "whisperx-pyannet"]).optional(),
  alignment_model: z.enum(["mms_fa", "tdnn_ffn"]).optional(),
  language: z.string().optional(),
  prompt: z.string().optional(),
  temperature: z.union([z.number(), z.array(z.number())]).optional(),
  response_format: z
    .enum(["json", "text", "srt", "verbose_json", "vtt"])
    .optional(),
  timestamp_granularities: z
    .union([z.string(), z.array(z.string())])
    .optional(),
  diarize: z.enum(["true", "false"]).optional(),
  min_speakers: z.number().optional(),
  max_speakers: z.number().optional(),
  preprocessing: z
    .enum(["none", "dynamic", "soft_dynamic", "bass_dynamic"])
    .optional(),
});

export const FireworksAudioBatchTranslationRequestSchema = z.object({
  file: z.union([z.instanceof(Blob), z.string()]),
  endpoint_id: z.string(),
  model: z.string().optional(),
  vad_model: z.enum(["silero", "whisperx-pyannet"]).optional(),
  alignment_model: z.enum(["mms_fa", "tdnn_ffn"]).optional(),
  language: z.string().optional(),
  prompt: z.string().optional(),
  temperature: z.union([z.number(), z.array(z.number())]).optional(),
  response_format: z
    .enum(["json", "text", "srt", "verbose_json", "vtt"])
    .optional(),
  timestamp_granularities: z
    .union([z.string(), z.array(z.string())])
    .optional(),
  preprocessing: z
    .enum(["none", "dynamic", "soft_dynamic", "bass_dynamic"])
    .optional(),
});

// ---------------------------------------------------------------------------
// Workflows (text-to-image, kontext, getResult)
// ---------------------------------------------------------------------------

export const FireworksTextToImageRequestSchema = z.object({
  prompt: z.string(),
  aspect_ratio: z
    .enum([
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
    ])
    .optional(),
  guidance_scale: z.number().optional(),
  num_inference_steps: z.number().optional(),
  seed: z.number().optional(),
});

export const FireworksKontextRequestSchema = z.object({
  prompt: z.string(),
  input_image: z.string().nullable().optional(),
  seed: z.number().nullable().optional(),
  aspect_ratio: z.string().nullable().optional(),
  output_format: z.enum(["png", "jpeg"]).optional(),
  webhook_url: z.string().nullable().optional(),
  webhook_secret: z.string().nullable().optional(),
  prompt_upsampling: z.boolean().optional(),
  safety_tolerance: z.number().optional(),
});

export const FireworksGetResultRequestSchema = z.object({
  id: z.string(),
});

// ---------------------------------------------------------------------------
// Models CRUD
// ---------------------------------------------------------------------------

export const FireworksCreateModelRequestSchema = z.object({
  modelId: z.string(),
  model: z.record(z.string(), z.unknown()),
  cluster: z.string().optional(),
});

export const FireworksUpdateModelRequestSchema = z.object({
  displayName: z.string().optional(),
  description: z.string().optional(),
  kind: z.string().optional(),
  public: z.boolean().optional(),
  contextLength: z.number().optional(),
  supportsImageInput: z.boolean().optional(),
  supportsTools: z.boolean().optional(),
});

export const FireworksPrepareModelRequestSchema = z.object({
  precision: z.string(),
  readMask: z.string().optional(),
});

export const FireworksGetUploadEndpointRequestSchema = z.object({
  filenameToSize: z.record(z.string(), z.number()),
  enableResumableUpload: z.boolean().optional(),
  readMask: z.string().optional(),
});

export const FireworksValidateUploadRequestSchema = z.object({
  skipHfConfigValidation: z.boolean().optional(),
  trustRemoteCode: z.boolean().optional(),
  configOnly: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Batch inference
// ---------------------------------------------------------------------------

export const FireworksBatchInferenceParametersSchema = z.object({
  maxTokens: z.number().optional(),
  temperature: z.number().optional(),
  topP: z.number().optional(),
  n: z.number().optional(),
  topK: z.number().optional(),
  extraBody: z.string().optional(),
});

export const FireworksBatchJobCreateRequestSchema = z.object({
  model: z.string(),
  inputDatasetId: z.string(),
  displayName: z.string().optional(),
  outputDatasetId: z.string().optional(),
  inferenceParameters: FireworksBatchInferenceParametersSchema.optional(),
  precision: z.string().optional(),
  continuedFromJobName: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Training shared sub-schemas
// ---------------------------------------------------------------------------

export const FireworksBaseTrainingConfigSchema = z.object({
  baseModel: z.string().optional(),
  warmStartFrom: z.string().optional(),
  outputModel: z.string().optional(),
  learningRate: z.number().optional(),
  epochs: z.number().optional(),
  batchSize: z.number().optional(),
  batchSizeSamples: z.number().optional(),
  gradientAccumulationSteps: z.number().optional(),
  learningRateWarmupSteps: z.number().optional(),
  maxContextLength: z.number().optional(),
  loraRank: z.number().optional(),
  optimizerWeightDecay: z.number().optional(),
  jinjaTemplate: z.string().optional(),
  region: z.string().optional(),
});

export const FireworksRLLossConfigSchema = z.object({
  method: z
    .enum(["METHOD_UNSPECIFIED", "GRPO", "DAPO", "DPO", "ORPO", "GSPO_TOKEN"])
    .optional(),
  klBeta: z.number().optional(),
});

export const FireworksWandbConfigSchema = z.object({
  enabled: z.boolean().optional(),
  apiKey: z.string().optional(),
  project: z.string().optional(),
  entity: z.string().optional(),
  runId: z.string().optional(),
  url: z.string().optional(),
});

export const FireworksAwsS3ConfigSchema = z.object({
  credentialsSecret: z.string().optional(),
  iamRoleArn: z.string().optional(),
});

export const FireworksAzureBlobStorageConfigSchema = z.object({
  credentialsSecret: z.string().optional(),
  managedIdentityClientId: z.string().optional(),
  tenantId: z.string().optional(),
});

export const FireworksRFTInferenceParamsSchema = z.object({
  maxTokens: z.number().optional(),
  temperature: z.number().optional(),
  topP: z.number().optional(),
  topK: z.number().optional(),
});

// ---------------------------------------------------------------------------
// SFT (Supervised Fine-Tuning)
// ---------------------------------------------------------------------------

export const FireworksSFTCreateRequestSchema = z.object({
  accountId: z.string(),
  dataset: z.string(),
  displayName: z.string().optional(),
  baseModel: z.string().optional(),
  warmStartFrom: z.string().optional(),
  outputModel: z.string().optional(),
  jinjaTemplate: z.string().optional(),
  epochs: z.number().optional(),
  learningRate: z.number().optional(),
  maxContextLength: z.number().optional(),
  loraRank: z.number().optional(),
  earlyStop: z.boolean().optional(),
  evaluationDataset: z.string().optional(),
  isTurbo: z.boolean().optional(),
  evalAutoCarveout: z.boolean().optional(),
  region: z.string().optional(),
  nodes: z.number().optional(),
  batchSize: z.number().optional(),
  batchSizeSamples: z.number().optional(),
  gradientAccumulationSteps: z.number().optional(),
  learningRateWarmupSteps: z.number().optional(),
  mtpEnabled: z.boolean().optional(),
  mtpNumDraftTokens: z.number().optional(),
  mtpFreezeBaseModel: z.boolean().optional(),
  optimizerWeightDecay: z.number().optional(),
  usePurpose: z.string().optional(),
  awsS3Config: FireworksAwsS3ConfigSchema.optional(),
  azureBlobStorageConfig: FireworksAzureBlobStorageConfigSchema.optional(),
  wandbConfig: FireworksWandbConfigSchema.optional(),
  supervisedFineTuningJobId: z.string().optional(),
});

// ---------------------------------------------------------------------------
// DPO Fine-Tuning
// ---------------------------------------------------------------------------

export const FireworksDpoJobCreateRequestSchema = z.object({
  dataset: z.string(),
  displayName: z.string().optional(),
  trainingConfig: FireworksBaseTrainingConfigSchema.optional(),
  lossConfig: FireworksRLLossConfigSchema.optional(),
  wandbConfig: FireworksWandbConfigSchema.optional(),
  awsS3Config: FireworksAwsS3ConfigSchema.optional(),
  azureBlobStorageConfig: FireworksAzureBlobStorageConfigSchema.optional(),
});

// ---------------------------------------------------------------------------
// RFT (Reinforcement Fine-Tuning)
// ---------------------------------------------------------------------------

export const FireworksRFTCreateRequestSchema = z.object({
  dataset: z.string(),
  evaluator: z.string(),
  displayName: z.string().optional(),
  trainingConfig: FireworksBaseTrainingConfigSchema.optional(),
  inferenceParams: FireworksRFTInferenceParamsSchema.optional(),
  lossConfig: FireworksRLLossConfigSchema.optional(),
  wandbConfig: FireworksWandbConfigSchema.optional(),
  awsS3Config: FireworksAwsS3ConfigSchema.optional(),
  azureBlobStorageConfig: FireworksAzureBlobStorageConfigSchema.optional(),
  reinforcementFineTuningJobId: z.string().optional(),
});

// ---------------------------------------------------------------------------
// RLOR Trainer Jobs
// ---------------------------------------------------------------------------

export const FireworksRlorRewardWeightSchema = z.object({
  name: z.string().optional(),
  weight: z.number().optional(),
});

export const FireworksRlorTrainerJobCreateRequestSchema = z.object({
  dataset: z.string(),
  evaluator: z.string(),
  displayName: z.string().optional(),
  trainingConfig: FireworksBaseTrainingConfigSchema.optional(),
  inferenceParams: FireworksRFTInferenceParamsSchema.optional(),
  lossConfig: FireworksRLLossConfigSchema.optional(),
  rewardWeights: z.array(FireworksRlorRewardWeightSchema).optional(),
  wandbConfig: FireworksWandbConfigSchema.optional(),
  awsS3Config: FireworksAwsS3ConfigSchema.optional(),
  azureBlobStorageConfig: FireworksAzureBlobStorageConfigSchema.optional(),
});

export const FireworksRlorTrainerJobExecuteStepRequestSchema = z.object({
  dataset: z.string(),
  outputModel: z.string(),
});

// ---------------------------------------------------------------------------
// Deployments
// ---------------------------------------------------------------------------

const acceleratorTypeEnum = z.enum([
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
]);

const precisionEnum = z.enum([
  "PRECISION_UNSPECIFIED",
  "FP16",
  "FP8",
  "FP8_MM",
  "BF16",
  "NF4",
  "FP4",
]);

export const FireworksCreateDeploymentRequestSchema = z.object({
  baseModel: z.string(),
  displayName: z.string().optional(),
  description: z.string().optional(),
  minReplicaCount: z.number().optional(),
  maxReplicaCount: z.number().optional(),
  acceleratorCount: z.number().optional(),
  acceleratorType: acceleratorTypeEnum.optional(),
  precision: precisionEnum.optional(),
  enableAddons: z.boolean().optional(),
  draftTokenCount: z.number().optional(),
  draftModel: z.string().optional(),
  maxContextLength: z.number().optional(),
  deploymentShape: z.string().optional(),
});

export const FireworksUpdateDeploymentRequestSchema = z.object({
  baseModel: z.string().optional(),
  displayName: z.string().optional(),
  description: z.string().optional(),
  minReplicaCount: z.number().optional(),
  maxReplicaCount: z.number().optional(),
  acceleratorCount: z.number().optional(),
  acceleratorType: acceleratorTypeEnum.optional(),
  precision: precisionEnum.optional(),
  enableAddons: z.boolean().optional(),
  maxContextLength: z.number().optional(),
  deploymentShape: z.string().optional(),
});

export const FireworksScaleDeploymentRequestSchema = z.object({
  replicaCount: z.number(),
});

// ---------------------------------------------------------------------------
// Deployed Models (LoRA)
// ---------------------------------------------------------------------------

export const FireworksCreateDeployedModelRequestSchema = z.object({
  model: z.string(),
  deployment: z.string(),
  displayName: z.string().optional(),
  description: z.string().optional(),
  default: z.boolean().optional(),
  serverless: z.boolean().optional(),
  public: z.boolean().optional(),
});

export const FireworksUpdateDeployedModelRequestSchema = z.object({
  displayName: z.string().optional(),
  description: z.string().optional(),
  model: z.string().optional(),
  deployment: z.string().optional(),
  default: z.boolean().optional(),
  serverless: z.boolean().optional(),
  public: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Datasets
// ---------------------------------------------------------------------------

export const FireworksCreateDatasetRequestSchema = z.object({
  dataset: z.record(z.string(), z.unknown()),
  datasetId: z.string(),
  sourceDatasetId: z.string().optional(),
  filter: z.string().optional(),
});

export const FireworksUpdateDatasetRequestSchema = z.object({
  displayName: z.string().optional(),
  exampleCount: z.number().optional(),
  externalUrl: z.string().optional(),
  format: z.enum(["FORMAT_UNSPECIFIED", "CHAT", "COMPLETION", "RL"]).optional(),
  sourceJobName: z.string().optional(),
});

export const FireworksDatasetGetUploadEndpointRequestSchema = z.object({
  filenameToSize: z.record(z.string(), z.number()),
  readMask: z.string().optional(),
});

export const FireworksDatasetValidateUploadRequestSchema = z
  .object({})
  .passthrough();

// ---------------------------------------------------------------------------
// Account management — users, API keys, secrets
// ---------------------------------------------------------------------------

export const FireworksCreateUserRequestSchema = z.object({
  role: z.enum(["admin", "user", "contributor", "inference-user"]),
  displayName: z.string().optional(),
  email: z.string().optional(),
  serviceAccount: z.boolean().optional(),
});

export const FireworksUpdateUserRequestSchema = z.object({
  role: z.enum(["admin", "user", "contributor", "inference-user"]),
  displayName: z.string().optional(),
  email: z.string().optional(),
  serviceAccount: z.boolean().optional(),
});

export const FireworksCreateApiKeyRequestSchema = z.object({
  apiKey: z.object({
    displayName: z.string().optional(),
    expireTime: z.string().optional(),
  }),
});

export const FireworksDeleteApiKeyRequestSchema = z.object({
  keyId: z.string(),
});

export const FireworksCreateSecretRequestSchema = z.object({
  keyName: z.string(),
  value: z.string(),
  name: z.string().optional(),
});

export const FireworksUpdateSecretRequestSchema = z.object({
  keyName: z.string(),
  value: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Evaluators
// ---------------------------------------------------------------------------

export const FireworksCriterionSchema = z.object({
  type: z.enum(["TYPE_UNSPECIFIED", "CODE_SNIPPETS"]).optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  codeSnippets: z
    .object({
      language: z.string().optional(),
      fileContents: z.record(z.string(), z.string()).optional(),
      entryFile: z.string().optional(),
      entryFunc: z.string().optional(),
    })
    .optional(),
});

export const FireworksEvaluatorSourceSchema = z.object({
  type: z
    .enum(["TYPE_UNSPECIFIED", "TYPE_UPLOAD", "TYPE_GITHUB", "TYPE_TEMPORARY"])
    .optional(),
  githubRepositoryName: z.string().optional(),
});

export const FireworksCreateEvaluatorRequestSchema = z.object({
  evaluatorId: z.string().optional(),
  evaluator: z.object({
    displayName: z.string().optional(),
    description: z.string().optional(),
    requirements: z.string().optional(),
    entryPoint: z.string().optional(),
    commitHash: z.string().optional(),
    defaultDataset: z.string().optional(),
    criteria: z.array(FireworksCriterionSchema).optional(),
    source: FireworksEvaluatorSourceSchema.optional(),
  }),
});

export const FireworksUpdateEvaluatorRequestSchema = z.object({
  displayName: z.string().optional(),
  description: z.string().optional(),
  requirements: z.string().optional(),
  entryPoint: z.string().optional(),
  commitHash: z.string().optional(),
  defaultDataset: z.string().optional(),
  criteria: z.array(FireworksCriterionSchema).optional(),
  source: FireworksEvaluatorSourceSchema.optional(),
});

export const FireworksGetUploadEndpointEvaluatorRequestSchema = z.object({
  filenameToSize: z.record(z.string(), z.string()),
  readMask: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Evaluation Jobs
// ---------------------------------------------------------------------------

export const FireworksCreateEvaluationJobRequestSchema = z.object({
  evaluationJobId: z.string().optional(),
  leaderboardIds: z.array(z.string()).optional(),
  evaluationJob: z.object({
    displayName: z.string().optional(),
    evaluator: z.string(),
    inputDataset: z.string(),
    outputDataset: z.string(),
    outputStats: z.string().optional(),
    awsS3Config: FireworksAwsS3ConfigSchema.optional(),
  }),
});

// ---------------------------------------------------------------------------
// Empty schema (for delete endpoints with no payload)
// ---------------------------------------------------------------------------

export const FireworksEmptySchema = z.object({}).passthrough();

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export const FireworksOptionsSchema = z.object({
  apiKey: z.string().min(1),
  baseURL: z.string().optional(),
  audioBaseURL: z.string().optional(),
  audioStreamingBaseURL: z.string().optional(),
  timeout: z.number().int().positive().optional(),
  fetch: z
    .custom<
      (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
    >()
    .optional(),
  WebSocket: z
    .custom<
      new (url: string | URL, protocols?: string | string[]) => WebSocket
    >()
    .optional(),
});

// ---------------------------------------------------------------------------
// Inferred types (source of truth -- replaces hand-written interfaces)
// ---------------------------------------------------------------------------

export type FireworksChatRequest = z.infer<typeof FireworksChatRequestSchema>;
export type FireworksCompletionRequest = z.infer<
  typeof FireworksCompletionRequestSchema
>;
export type FireworksEmbeddingRequest = z.infer<
  typeof FireworksEmbeddingRequestSchema
>;
export type FireworksRerankRequest = z.infer<
  typeof FireworksRerankRequestSchema
>;
export type AnthropicMessagesRequest = z.infer<
  typeof AnthropicMessagesRequestSchema
>;
export type FireworksTranscriptionRequest = z.infer<
  typeof FireworksTranscriptionRequestSchema
>;
export type FireworksTranslationRequest = z.infer<
  typeof FireworksTranslationRequestSchema
>;
export type FireworksStreamingTranscriptionOptions = z.infer<
  typeof FireworksStreamingTranscriptionOptionsSchema
>;
export type FireworksAudioBatchTranscriptionRequest = z.infer<
  typeof FireworksAudioBatchTranscriptionRequestSchema
>;
export type FireworksAudioBatchTranslationRequest = z.infer<
  typeof FireworksAudioBatchTranslationRequestSchema
>;
export type FireworksTextToImageRequest = z.infer<
  typeof FireworksTextToImageRequestSchema
>;
export type FireworksKontextRequest = z.infer<
  typeof FireworksKontextRequestSchema
>;
export type FireworksGetResultRequest = z.infer<
  typeof FireworksGetResultRequestSchema
>;
export type FireworksCreateModelRequest = z.infer<
  typeof FireworksCreateModelRequestSchema
>;
export type FireworksUpdateModelRequest = z.infer<
  typeof FireworksUpdateModelRequestSchema
>;
export type FireworksPrepareModelRequest = z.infer<
  typeof FireworksPrepareModelRequestSchema
>;
export type FireworksGetUploadEndpointRequest = z.infer<
  typeof FireworksGetUploadEndpointRequestSchema
>;
export type FireworksValidateUploadRequest = z.infer<
  typeof FireworksValidateUploadRequestSchema
>;
export type FireworksBatchJobCreateRequest = z.infer<
  typeof FireworksBatchJobCreateRequestSchema
>;
export type FireworksSFTCreateRequest = z.infer<
  typeof FireworksSFTCreateRequestSchema
>;
export type FireworksDpoJobCreateRequest = z.infer<
  typeof FireworksDpoJobCreateRequestSchema
>;
export type FireworksRFTCreateRequest = z.infer<
  typeof FireworksRFTCreateRequestSchema
>;
export type FireworksRlorTrainerJobCreateRequest = z.infer<
  typeof FireworksRlorTrainerJobCreateRequestSchema
>;
export type FireworksRlorTrainerJobExecuteStepRequest = z.infer<
  typeof FireworksRlorTrainerJobExecuteStepRequestSchema
>;
export type FireworksCreateDeploymentRequest = z.infer<
  typeof FireworksCreateDeploymentRequestSchema
>;
export type FireworksUpdateDeploymentRequest = z.infer<
  typeof FireworksUpdateDeploymentRequestSchema
>;
export type FireworksScaleDeploymentRequest = z.infer<
  typeof FireworksScaleDeploymentRequestSchema
>;
export type FireworksCreateDeployedModelRequest = z.infer<
  typeof FireworksCreateDeployedModelRequestSchema
>;
export type FireworksUpdateDeployedModelRequest = z.infer<
  typeof FireworksUpdateDeployedModelRequestSchema
>;
export type FireworksCreateDatasetRequest = z.infer<
  typeof FireworksCreateDatasetRequestSchema
>;
export type FireworksUpdateDatasetRequest = z.infer<
  typeof FireworksUpdateDatasetRequestSchema
>;
export type FireworksDatasetGetUploadEndpointRequest = z.infer<
  typeof FireworksDatasetGetUploadEndpointRequestSchema
>;
export type FireworksDatasetValidateUploadRequest = z.infer<
  typeof FireworksDatasetValidateUploadRequestSchema
>;
export type FireworksCreateUserRequest = z.infer<
  typeof FireworksCreateUserRequestSchema
>;
export type FireworksUpdateUserRequest = z.infer<
  typeof FireworksUpdateUserRequestSchema
>;
export type FireworksCreateApiKeyRequest = z.infer<
  typeof FireworksCreateApiKeyRequestSchema
>;
export type FireworksDeleteApiKeyRequest = z.infer<
  typeof FireworksDeleteApiKeyRequestSchema
>;
export type FireworksCreateSecretRequest = z.infer<
  typeof FireworksCreateSecretRequestSchema
>;
export type FireworksUpdateSecretRequest = z.infer<
  typeof FireworksUpdateSecretRequestSchema
>;
export type FireworksCreateEvaluatorRequest = z.infer<
  typeof FireworksCreateEvaluatorRequestSchema
>;
export type FireworksUpdateEvaluatorRequest = z.infer<
  typeof FireworksUpdateEvaluatorRequestSchema
>;
export type FireworksGetUploadEndpointEvaluatorRequest = z.infer<
  typeof FireworksGetUploadEndpointEvaluatorRequestSchema
>;
export type FireworksCreateEvaluationJobRequest = z.infer<
  typeof FireworksCreateEvaluationJobRequestSchema
>;
export type FireworksOptions = z.infer<typeof FireworksOptionsSchema>;
