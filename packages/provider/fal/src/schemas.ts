import type { PayloadSchema } from "./types";

export const pricingEstimateSchema: PayloadSchema = {
  method: "POST",
  path: "/models/pricing/estimate",
  contentType: "application/json",
  fields: {
    estimate_type: {
      type: "string",
      required: true,
      enum: ["historical_api_price", "unit_price"],
      description: "Type of cost estimate",
    },
    endpoints: {
      type: "object",
      required: true,
      description:
        "Map of endpoint IDs to quantity objects ({ call_quantity } or { unit_quantity })",
    },
  },
};

export const queueSubmitSchema: PayloadSchema = {
  method: "POST",
  path: "/{endpoint_id}",
  contentType: "application/json",
  fields: {
    endpoint_id: {
      type: "string",
      required: true,
      description: "Model endpoint ID (e.g. fal-ai/flux/schnell)",
    },
    input: {
      type: "object",
      required: true,
      description: "Model-specific input payload",
    },
    webhook: {
      type: "string",
      description: "Webhook URL for async notification",
    },
    priority: {
      type: "string",
      enum: ["normal", "low"],
      description: "Queue priority (defaults to normal)",
    },
    timeout: {
      type: "number",
      description: "Server-side request timeout in seconds",
    },
    no_retry: {
      type: "boolean",
      description: "Disable automatic retries",
    },
  },
};

export const logsStreamSchema: PayloadSchema = {
  method: "POST",
  path: "/serverless/logs/stream",
  contentType: "application/json",
  fields: {
    start: {
      type: "string",
      description: "Start date in ISO8601 (defaults to 24h ago)",
    },
    end: {
      type: "string",
      description: "End date in ISO8601, exclusive (defaults to now)",
    },
    app_id: {
      type: "array",
      items: { type: "string" },
      description: "Filter by app IDs",
    },
    revision: {
      type: "string",
      description: "Filter by revision",
    },
    run_source: {
      type: "string",
      enum: ["grpc-run", "grpc-register", "gateway", "cron"],
      description: "Filter by run source",
    },
    search: {
      type: "string",
      description: "Free-text search",
    },
    level: {
      type: "string",
      description: "Minimum log level",
    },
    job_id: {
      type: "string",
      description: "Filter by job ID",
    },
    request_id: {
      type: "string",
      description: "Filter by request ID",
    },
  },
};

export const filesUploadUrlSchema: PayloadSchema = {
  method: "POST",
  path: "/serverless/files/file/url/{file}",
  contentType: "application/json",
  fields: {
    file: {
      type: "string",
      required: true,
      description: "Target file path on fal storage",
    },
    url: {
      type: "string",
      required: true,
      description: "Publicly accessible URL to download the file from",
    },
  },
};

export const filesUploadLocalSchema: PayloadSchema = {
  method: "POST",
  path: "/serverless/files/file/local/{target_path}",
  contentType: "multipart/form-data",
  fields: {
    target_path: {
      type: "string",
      required: true,
      description: "Target file path on fal storage",
    },
    file: {
      type: "object",
      required: true,
      description: "Binary file content (Blob)",
    },
    filename: {
      type: "string",
      description: "Optional filename for the upload",
    },
    unzip: {
      type: "boolean",
      description: "If true and file is a ZIP, extract after upload",
    },
  },
};

export const deletePayloadsSchema: PayloadSchema = {
  method: "DELETE",
  path: "/models/requests/{request_id}/payloads",
  contentType: "application/json",
  fields: {
    request_id: {
      type: "string",
      required: true,
      description: "Request ID whose payloads to delete",
    },
    idempotency_key: {
      type: "string",
      description: "Optional idempotency key",
    },
  },
};

export const bytedanceSeedance2p0ImageToVideoSchema: PayloadSchema = {
  method: "POST",
  path: "/bytedance/seedance-2.0/image-to-video",
  contentType: "application/json",
  fields: {
    prompt: {
      type: "string",
      required: true,
      description: "Text prompt describing desired motion and action",
    },
    image_url: {
      type: "string",
      required: true,
      description:
        "URL or data URL of the starting frame image (JPEG, PNG, WebP, max 30 MB)",
    },
    end_image_url: {
      type: "string",
      description: "Optional URL of the ending frame image",
    },
    resolution: {
      type: "string",
      enum: ["480p", "720p"],
      description: "Video resolution (default 720p)",
    },
    duration: {
      type: "string",
      enum: [
        "auto",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
      ],
      description: "Duration in seconds, 4-15 or auto (default auto)",
    },
    aspect_ratio: {
      type: "string",
      enum: ["auto", "21:9", "16:9", "4:3", "1:1", "3:4", "9:16"],
      description: "Aspect ratio of the generated video (default auto)",
    },
    generate_audio: {
      type: "boolean",
      description:
        "Whether to generate synchronized audio (default true). Cost is identical either way.",
    },
    seed: {
      type: "number",
      description: "Random seed for reproducibility",
    },
    end_user_id: {
      type: "string",
      description: "Unique end-user ID",
    },
  },
};

export const nanoBananaProEditSchema: PayloadSchema = {
  method: "POST",
  path: "/fal-ai/nano-banana-pro/edit",
  contentType: "application/json",
  fields: {
    prompt: {
      type: "string",
      required: true,
      description: "The prompt for image editing",
    },
    image_urls: {
      type: "array",
      required: true,
      items: { type: "string" },
      description:
        "URLs of the images to use for image-to-image generation or editing",
    },
    num_images: {
      type: "number",
      description: "The number of images to generate (1-4, default 1)",
    },
    seed: {
      type: "number",
      description: "The seed for the random number generator",
    },
    aspect_ratio: {
      type: "string",
      enum: [
        "auto",
        "21:9",
        "16:9",
        "3:2",
        "4:3",
        "5:4",
        "1:1",
        "4:5",
        "3:4",
        "2:3",
        "9:16",
      ],
      description: "Aspect ratio of the generated image (default auto)",
    },
    output_format: {
      type: "string",
      enum: ["jpeg", "png", "webp"],
      description: "Format of the generated image (default png)",
    },
    safety_tolerance: {
      type: "string",
      enum: ["1", "2", "3", "4", "5", "6"],
      description:
        "Content moderation level: 1 strictest, 6 most permissive (default 4)",
    },
    sync_mode: {
      type: "boolean",
      description:
        "If true, media is returned as a data URI and not recorded in request history",
    },
    resolution: {
      type: "string",
      enum: ["1K", "2K", "4K"],
      description:
        "Resolution of the generated image; 4K costs double (default 1K)",
    },
    limit_generations: {
      type: "boolean",
      description:
        "Experimental: limit generations to 1 per prompt regardless of prompt instructions",
    },
    enable_web_search: {
      type: "boolean",
      description:
        "Enable web search to use the latest web information (adds $0.015 per call)",
    },
  },
};

export const seedreamV5LiteEditSchema: PayloadSchema = {
  method: "POST",
  path: "/fal-ai/bytedance/seedream/v5/lite/edit",
  contentType: "application/json",
  fields: {
    prompt: {
      type: "string",
      required: true,
      description: "The text prompt used to edit the image",
    },
    image_urls: {
      type: "array",
      required: true,
      items: { type: "string" },
      description:
        "List of URLs of input images for editing. Up to 10 images allowed.",
    },
    image_size: {
      type: "string",
      enum: ["auto_2K", "auto_4K"],
      description:
        "The size of the generated image. Default: auto_2K. Can also be an object with width/height.",
    },
    num_images: {
      type: "number",
      description:
        "Number of separate model generations to run. Range: 1-6, default: 1",
    },
    max_images: {
      type: "number",
      description:
        "Enables multi-image generation. Total images will be between num_images and max_images*num_images. Range: 1-6, default: 1",
    },
    sync_mode: {
      type: "boolean",
      description:
        "If true, media is returned as a data URI and not available in request history. Default: false",
    },
    enable_safety_checker: {
      type: "boolean",
      description:
        "If set to true, the safety checker will be enabled. Default: true",
    },
  },
};
