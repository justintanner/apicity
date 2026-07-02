export const SCHEMA_FRAGMENT_EXCLUDED = ["kie", "fal", "xai"];

export const sharedSrcEntries = [
  {
    id: "provider-middleware",
    class: "helper",
    source: "shared/provider-src/middleware.ts",
    targets: [
      "packages/provider/alibaba/src/middleware.ts",
      "packages/provider/anthropic/src/middleware.ts",
      "packages/provider/fal/src/middleware.ts",
      "packages/provider/fireworks/src/middleware.ts",
      "packages/provider/free-media-upload/src/middleware.ts",
      "packages/provider/kie/src/middleware.ts",
      "packages/provider/kimicoding/src/middleware.ts",
      "packages/provider/openai/src/middleware.ts",
      "packages/provider/s3/src/middleware.ts",
      "packages/provider/xai/src/middleware.ts",
      "packages/provider/zaicoding/src/middleware.ts",
    ],
  },
];
