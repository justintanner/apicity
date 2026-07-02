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
  {
    id: "provider-sse",
    class: "helper",
    source: "shared/provider-src/sse.ts",
    targets: [
      "packages/provider/alibaba/src/sse.ts",
      "packages/provider/anthropic/src/sse.ts",
      "packages/provider/fireworks/src/sse.ts",
      "packages/provider/free-media-upload/src/sse.ts",
      "packages/provider/kie/src/sse.ts",
      "packages/provider/kimicoding/src/sse.ts",
    ],
  },
  {
    id: "paygate",
    class: "helper",
    source: "packages/provider/cost/src/paygate.ts",
    targets: [
      "packages/provider/kie/src/paygate.ts",
      "packages/provider/xai/src/paygate.ts",
    ],
  },
  {
    id: "with-paid-gate",
    class: "helper",
    source: "packages/provider/cost/src/with-paid-gate.ts",
    targets: [
      "packages/provider/kie/src/with-paid-gate.ts",
      "packages/provider/xai/src/with-paid-gate.ts",
    ],
  },
];
