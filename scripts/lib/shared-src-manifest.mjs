export const SCHEMA_FRAGMENT_EXCLUDED = ["kie", "fal", "xai"];

export const sharedSrcEntries = [
  {
    id: "provider-middleware",
    class: "helper",
    source: "shared/provider-src/middleware.ts",
    targets: [
      "packages/provider/alibaba/src/middleware.ts",
      "packages/provider/fal/src/middleware.ts",
      "packages/provider/fireworks/src/middleware.ts",
      "packages/provider/free-media-upload/src/middleware.ts",
      "packages/provider/kie/src/middleware.ts",
      "packages/provider/openai/src/middleware.ts",
    ],
  },
];
