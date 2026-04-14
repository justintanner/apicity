# @apicity/fireworks

[![npm](https://img.shields.io/npm/v/@apicity/fireworks?color=cb0000)](https://www.npmjs.com/package/@apicity/fireworks)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)

Fireworks AI provider for chat completions, completions, and embeddings.

## Installation

```bash
npm install @apicity/fireworks
# or
pnpm add @apicity/fireworks
```

## Quick Start

```typescript
import { fireworks as createFireworks } from "@apicity/fireworks";

const fireworks = createFireworks({ apiKey: process.env.FIREWORKS_API_KEY! });
```

## API Reference

101 endpoints across 1 group. Each method mirrors an upstream URL path.

### inference

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.accounts.apiKeys.create</code></b></summary>

<code>POST https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/users/{userId}/apiKeys</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.apiKeys.create({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>fireworks.inference.v1.accounts.apiKeys</code></b></summary>

<code>DELETE https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/users/{userId}/apiKeys:delete</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.apiKeys({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.apiKeys.list</code></b></summary>

<code>GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/users/{userId}/apiKeys</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.apiKeys.list({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.accounts.batchInferenceJobs.create</code></b></summary>

<code>POST https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/batchInferenceJobs</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.batchInferenceJobs.create({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>fireworks.inference.v1.accounts.batchInferenceJobs</code></b></summary>

<code>DELETE https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/batchInferenceJobs/{jobId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.batchInferenceJobs({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.batchInferenceJobs</code></b></summary>

<code>GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/batchInferenceJobs/{jobId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.batchInferenceJobs({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.batchInferenceJobs.list</code></b></summary>

<code>GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/batchInferenceJobs</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.batchInferenceJobs.list({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.accounts.datasets.create</code></b></summary>

<code>POST https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/datasets</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.datasets.create({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>fireworks.inference.v1.accounts.datasets</code></b></summary>

<code>DELETE https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/datasets/{datasetId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.datasets({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.datasets</code></b></summary>

<code>GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/datasets/{datasetId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.datasets({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.datasets.getDownloadEndpoint</code></b></summary>

<code>GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/datasets/{datasetId}:getDownloadEndpoint</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.datasets.getDownloadEndpoint({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.accounts.datasets.getUploadEndpoint</code></b></summary>

<code>POST https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/datasets/{datasetId}:getUploadEndpoint</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.datasets.getUploadEndpoint({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.datasets.list</code></b></summary>

<code>GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/datasets</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.datasets.list({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>PATCH</code> <b><code>fireworks.inference.v1.accounts.datasets.update</code></b></summary>

<code>PATCH https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/datasets/{datasetId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.datasets.update({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.accounts.datasets.validateUpload</code></b></summary>

<code>POST https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/datasets/{datasetId}:validateUpload</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.datasets.validateUpload({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.accounts.deployedModels.create</code></b></summary>

<code>POST https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/deployedModels</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.deployedModels.create({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>fireworks.inference.v1.accounts.deployedModels</code></b></summary>

<code>DELETE https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/deployedModels/{deployedModelId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.deployedModels({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.deployedModels</code></b></summary>

<code>GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/deployedModels/{deployedModelId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.deployedModels({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.deployedModels.list</code></b></summary>

<code>GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/deployedModels</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.deployedModels.list({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>PATCH</code> <b><code>fireworks.inference.v1.accounts.deployedModels.update</code></b></summary>

<code>PATCH https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/deployedModels/{deployedModelId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.deployedModels.update({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.deploymentShapes</code></b></summary>

<code>GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/deploymentShapes/{shapeId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.deploymentShapes({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.deploymentShapes.versions</code></b></summary>

<code>GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/deploymentShapes/{shapeId}/versions/{versionId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.deploymentShapes.versions({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.deploymentShapes.versions.list</code></b></summary>

<code>GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/deploymentShapes/{shapeId}/versions</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.deploymentShapes.versions.list({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.accounts.deployments.create</code></b></summary>

<code>POST https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/deployments</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.deployments.create({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>fireworks.inference.v1.accounts.deployments</code></b></summary>

<code>DELETE https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/deployments/{deploymentId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.deployments({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.deployments</code></b></summary>

<code>GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/deployments/{deploymentId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.deployments({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.deployments.list</code></b></summary>

<code>GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/deployments</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.deployments.list({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>PATCH</code> <b><code>fireworks.inference.v1.accounts.deployments.scale</code></b></summary>

<code>PATCH https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/deployments/{deploymentId}:scale</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.deployments.scale({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.accounts.deployments.undelete</code></b></summary>

<code>POST https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/deployments/{deploymentId}:undelete</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.deployments.undelete({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>PATCH</code> <b><code>fireworks.inference.v1.accounts.deployments.update</code></b></summary>

<code>PATCH https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/deployments/{deploymentId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.deployments.update({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.accounts.dpoJobs.create</code></b></summary>

<code>POST https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/dpoJobs</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.dpoJobs.create({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>fireworks.inference.v1.accounts.dpoJobs</code></b></summary>

<code>DELETE https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/dpoJobs/{jobId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.dpoJobs({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.dpoJobs</code></b></summary>

<code>GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/dpoJobs/{jobId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.dpoJobs({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.dpoJobs.getMetricsFileEndpoint</code></b></summary>

<code>GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/dpoJobs/{jobId}:getMetricsFileEndpoint</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.dpoJobs.getMetricsFileEndpoint({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.dpoJobs.list</code></b></summary>

<code>GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/dpoJobs</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.dpoJobs.list({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.accounts.dpoJobs.resume</code></b></summary>

<code>POST https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/dpoJobs/{jobId}:resume</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.dpoJobs.resume({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.accounts.evaluationJobs.create</code></b></summary>

<code>POST https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/evaluationJobs</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.evaluationJobs.create({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>fireworks.inference.v1.accounts.evaluationJobs</code></b></summary>

<code>DELETE https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/evaluationJobs/{evaluationJobId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.evaluationJobs({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.evaluationJobs</code></b></summary>

<code>GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/evaluationJobs/{evaluationJobId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.evaluationJobs({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.evaluationJobs.getExecutionLogEndpoint</code></b></summary>

<code>GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/evaluationJobs/{evaluationJobId}:getExecutionLogEndpoint</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.evaluationJobs.getExecutionLogEndpoint({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.evaluationJobs.list</code></b></summary>

<code>GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/evaluationJobs</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.evaluationJobs.list({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.accounts.evaluators.create</code></b></summary>

<code>POST https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/evaluatorsV2</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.evaluators.create({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>fireworks.inference.v1.accounts.evaluators</code></b></summary>

<code>DELETE https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/evaluators/{evaluatorId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.evaluators({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.evaluators</code></b></summary>

<code>GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/evaluators/{evaluatorId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.evaluators({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.evaluators.getBuildLogEndpoint</code></b></summary>

<code>GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/evaluators/{evaluatorId}:getBuildLogEndpoint</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.evaluators.getBuildLogEndpoint({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.evaluators.getSourceCodeSignedUrl</code></b></summary>

<code>GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/evaluators/{evaluatorId}:getSourceCodeSignedUrl</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.evaluators.getSourceCodeSignedUrl({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.accounts.evaluators.getUploadEndpoint</code></b></summary>

<code>POST https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/evaluators/{evaluatorId}:getUploadEndpoint</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.evaluators.getUploadEndpoint({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.evaluators.list</code></b></summary>

<code>GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/evaluators</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.evaluators.list({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>PATCH</code> <b><code>fireworks.inference.v1.accounts.evaluators.update</code></b></summary>

<code>PATCH https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/evaluators/{evaluatorId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.evaluators.update({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.accounts.evaluators.validateUpload</code></b></summary>

<code>POST https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/evaluators/{evaluatorId}:validateUpload</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.evaluators.validateUpload({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts</code></b></summary>

<code>GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.list</code></b></summary>

<code>GET https://api.fireworks.ai/inference/v1/v1/accounts</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.list({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.accounts.models.create</code></b></summary>

<code>POST https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/models</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.models.create({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>fireworks.inference.v1.accounts.models</code></b></summary>

<code>DELETE https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/models/{modelId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.models({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.models</code></b></summary>

<code>GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/models/{modelId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.models({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.models.getDownloadEndpoint</code></b></summary>

<code>GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/models/{modelId}:getDownloadEndpoint</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.models.getDownloadEndpoint({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.accounts.models.getUploadEndpoint</code></b></summary>

<code>POST https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/models/{modelId}:getUploadEndpoint</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.models.getUploadEndpoint({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.models.list</code></b></summary>

<code>GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/models</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.models.list({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.accounts.models.prepare</code></b></summary>

<code>POST https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/models/{modelId}:prepare</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.models.prepare({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>PATCH</code> <b><code>fireworks.inference.v1.accounts.models.update</code></b></summary>

<code>PATCH https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/models/{modelId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.models.update({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.models.validateUpload</code></b></summary>

<code>GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/models/{modelId}:validateUpload</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.models.validateUpload({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.accounts.reinforcementFineTuningJobs.create</code></b></summary>

<code>POST https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/reinforcementFineTuningJobs</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.reinforcementFineTuningJobs.create({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>fireworks.inference.v1.accounts.reinforcementFineTuningJobs</code></b></summary>

<code>DELETE https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/reinforcementFineTuningJobs/{jobId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.reinforcementFineTuningJobs({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.reinforcementFineTuningJobs</code></b></summary>

<code>GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/reinforcementFineTuningJobs/{jobId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.reinforcementFineTuningJobs({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.reinforcementFineTuningJobs.list</code></b></summary>

<code>GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/reinforcementFineTuningJobs</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.reinforcementFineTuningJobs.list({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.accounts.reinforcementFineTuningJobs.resume</code></b></summary>

<code>POST https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/reinforcementFineTuningJobs/{jobId}:resume</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.reinforcementFineTuningJobs.resume({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.accounts.rlorTrainerJobs.create</code></b></summary>

<code>POST https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/rlorTrainerJobs</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.rlorTrainerJobs.create({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>fireworks.inference.v1.accounts.rlorTrainerJobs</code></b></summary>

<code>DELETE https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/rlorTrainerJobs/{jobId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.rlorTrainerJobs({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.accounts.rlorTrainerJobs.executeTrainStep</code></b></summary>

<code>POST https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/rlorTrainerJobs/{jobId}:executeTrainStep</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.rlorTrainerJobs.executeTrainStep({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.rlorTrainerJobs</code></b></summary>

<code>GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/rlorTrainerJobs/{jobId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.rlorTrainerJobs({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.rlorTrainerJobs.list</code></b></summary>

<code>GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/rlorTrainerJobs</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.rlorTrainerJobs.list({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.accounts.rlorTrainerJobs.resume</code></b></summary>

<code>POST https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/rlorTrainerJobs/{jobId}:resume</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.rlorTrainerJobs.resume({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.accounts.secrets.create</code></b></summary>

<code>POST https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/secrets</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.secrets.create({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>fireworks.inference.v1.accounts.secrets</code></b></summary>

<code>DELETE https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/secrets/{secretId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.secrets({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.secrets</code></b></summary>

<code>GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/secrets/{secretId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.secrets({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.secrets.list</code></b></summary>

<code>GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/secrets</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.secrets.list({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>PATCH</code> <b><code>fireworks.inference.v1.accounts.secrets.update</code></b></summary>

<code>PATCH https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/secrets/{secretId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.secrets.update({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.accounts.supervisedFineTuningJobs.create</code></b></summary>

<code>POST https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/supervisedFineTuningJobs</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.supervisedFineTuningJobs.create({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>fireworks.inference.v1.accounts.supervisedFineTuningJobs</code></b></summary>

<code>DELETE https://api.fireworks.ai/inference/v1/v1/accounts/{param}/supervisedFineTuningJobs/{param}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.supervisedFineTuningJobs({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.supervisedFineTuningJobs</code></b></summary>

<code>GET https://api.fireworks.ai/inference/v1/v1/accounts/{param}/supervisedFineTuningJobs/{param}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.supervisedFineTuningJobs({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.supervisedFineTuningJobs.list</code></b></summary>

<code>GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/supervisedFineTuningJobs</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.supervisedFineTuningJobs.list({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.accounts.supervisedFineTuningJobs.resume</code></b></summary>

<code>POST https://api.fireworks.ai/inference/v1/v1/accounts/{param}/supervisedFineTuningJobs/{param}:resume</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.supervisedFineTuningJobs.resume({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.accounts.users.create</code></b></summary>

<code>POST https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/users</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.users.create({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.users</code></b></summary>

<code>GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/users/{userId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.users({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.users.list</code></b></summary>

<code>GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/users</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.users.list({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>PATCH</code> <b><code>fireworks.inference.v1.accounts.users.update</code></b></summary>

<code>PATCH https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/users/{userId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.users.update({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.audio.batch</code></b></summary>

<code>GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/batch_job/{batchId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.audio.batch({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.audio.batch.transcriptions</code></b></summary>

<code>POST https://api.fireworks.ai/inference/v1/audio/transcriptions</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.audio.batch.transcriptions({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.audio.batch.translations</code></b></summary>

<code>POST https://api.fireworks.ai/inference/v1/audio/translations</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.audio.batch.translations({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.audio.transcriptions</code></b></summary>

<code>POST https://api.fireworks.ai/inference/v1/audio/transcriptions</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.audio.transcriptions({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.audio.translations</code></b></summary>

<code>POST https://api.fireworks.ai/inference/v1/audio/translations</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.audio.translations({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.chat.completions</code></b></summary>

<code>POST https://api.fireworks.ai/inference/v1/chat/completions</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.chat.completions({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.completions</code></b></summary>

<code>POST https://api.fireworks.ai/inference/v1/completions</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.completions({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.embeddings</code></b></summary>

<code>POST https://api.fireworks.ai/inference/v1/embeddings</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.embeddings({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.messages</code></b></summary>

<code>POST https://api.fireworks.ai/inference/v1/messages</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.messages({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.rerank</code></b></summary>

<code>POST https://api.fireworks.ai/inference/v1/rerank</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.rerank({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.accounts.users.update</code></b></summary>

<code>POST https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/users/{userId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.users.update({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.workflows.getResult</code></b></summary>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.workflows.getResult({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.workflows.kontext</code></b></summary>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.workflows.kontext({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.workflows.textToImage</code></b></summary>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.workflows.textToImage({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.messages</code></b></summary>

<code>POST https://api.fireworks.ai/inference/v1/messages</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.messages({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

## Middleware

```typescript
import { fireworks as createFireworks, withRetry } from "@apicity/fireworks";

const fireworks = createFireworks({ apiKey: process.env.FIREWORKS_API_KEY! });
const models = withRetry(fireworks.get.v1.models, { retries: 3 });
```

## License

MIT
