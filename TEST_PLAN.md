# Missing Test Coverage Plan for NakedAPI

## Executive Summary

This document identifies gaps in test coverage across all AI provider packages in the nakedapi monorepo. The goal is to achieve comprehensive coverage of all API endpoints, schema validations, error handling paths, and utility functions.

**Current Coverage Overview:**
| Provider | Estimated API Methods | Existing Tests | Coverage % | Priority |
|----------|----------------------|----------------|------------|----------|
| OpenAI | ~45 | 18 | ~75% | Medium |
| XAI | ~55 | 26 | ~65% | Medium |
| Anthropic | ~65 | 17 | ~50% | High |
| Fireworks | ~95 | 22 | ~35% | Critical |
| Fal | ~50 | 12 | ~45% | High |
| KimiCoding | ~8 | 6 | ~90% | Low |
| Kie | ~25 | 18 | ~85% | Low |

---

## P0: Critical Missing Tests (Fireworks, Fal, Anthropic)

### Fireworks Provider - Critical Gaps

The Fireworks provider has the most extensive API surface but the lowest test coverage (~35%). These tests are prioritized as P0:

#### 1. Model Management Endpoints

- **fireworks-models-create.test.ts** - POST /v1/models (create custom model)
- **fireworks-models-update.test.ts** - PATCH /v1/models/{modelId} (update model)
- **fireworks-models-delete.test.ts** - DELETE /v1/models/{modelId}
- **fireworks-models-prepare.test.ts** - POST /v1/models/{modelId}/prepare
- **fireworks-models-upload-endpoint.test.ts** - POST /v1/models/{modelId}/uploadEndpoint
- **fireworks-models-download-endpoint.test.ts** - POST /v1/models/{modelId}/downloadEndpoint
- **fireworks-models-validate-upload.test.ts** - POST /v1/models/{modelId}/validateUpload

#### 2. Audio Features

- **fireworks-audio-streaming.test.ts** - WebSocket streaming at wss://audio-streaming.api.fireworks.ai
  - Tests streaming transcription session establishment
  - Tests message exchange format
  - Tests session termination
- **fireworks-audio-batch.test.ts** - POST /v1/audio/batch/transcriptions and /translations
  - Tests batch job creation for audio processing
  - Tests batch status retrieval
  - Tests batch results download

#### 3. Training & Fine-tuning (RFT/DPO/RLOR)

- **fireworks-rft.test.ts** - POST /v1/rft and GET /v1/rft/{jobId}
  - Tests reward fine-tuning job creation
  - Tests job status monitoring
  - Tests job cancellation
- **fireworks-rft-list.test.ts** - GET /v1/rft (list jobs)
- **fireworks-dpo.test.ts** - POST /v1/dpo and GET /v1/dpo/{jobId}
  - Tests direct preference optimization jobs
- **fireworks-dpo-list.test.ts** - GET /v1/dpo (list jobs)
- **fireworks-rlor.test.ts** - POST /v1/rlor/trainer/jobs
  - Tests RLOR trainer job creation
  - Tests GET /v1/rlor/trainer/jobs/{jobId}
  - Tests POST /v1/rlor/trainer/jobs/{jobId}/execute_step
- **fireworks-rlor-list.test.ts** - GET /v1/rlor/trainer/jobs

#### 4. Administration (Accounts/Users/API Keys/Secrets)

- **fireworks-accounts-get.test.ts** - GET /v1/accounts/{accountId}
- **fireworks-users-crud.test.ts** - POST /v1/users, GET /v1/users/{userId}, PATCH /v1/users/{userId}
- **fireworks-api-keys-create.test.ts** - POST /v1/api_keys
- **fireworks-api-keys-delete.test.ts** - DELETE /v1/api_keys/{apiKeyId}
- **fireworks-secrets-create.test.ts** - POST /v1/secrets
- **fireworks-secrets-update.test.ts** - PATCH /v1/secrets/{secretId}

#### 5. Advanced Model Features

- **fireworks-chat-kontext.test.ts** - POST /v1/{modelId} (kontext endpoint)
  - Tests Fireworks proprietary Kontext API
- **fireworks-messages-text-to-image.test.ts** - POST /v1/messages with textToImage

---

### Fal Provider - Critical Gaps

#### 1. Compute Instances

- **fal-compute-instances-list.test.ts** - GET /v1/compute/instances
- **fal-compute-instances-get.test.ts** - GET /v1/compute/instances/{id}
- **fal-compute-instances-terminate.test.ts** - DELETE /v1/compute/instances/{id}
- **fal-compute-instances-post.test.ts** - POST /v1/compute/instances (via instances.post accessor)

#### 2. Workflows

- **fal-workflows-create.test.ts** - POST /v1/workflows
  - Tests workflow creation endpoint

---

### Anthropic Provider - Critical Gaps

#### 1. Skills Management

- **anthropic-skills.test.ts** - POST /v1/skills (create)
  - Tests skill creation with files
  - Tests GET /v1/skills (list)
  - Tests GET /v1/skills/{skillId} (retrieve)
- **anthropic-skill-versions.test.ts** - POST /v1/skills/{skillId}/versions
  - Tests skill version creation
  - Tests GET /v1/skills/{skillId}/versions (list)
- **anthropic-skills-delete.test.ts** - DELETE /v1/skills/{skillId}
  - Tests skill deletion
  - Tests DELETE /v1/skills/{skillId}/versions/{version}

#### 2. Organization Admin (requires adminApiKey)

- **anthropic-admin-invites-create.test.ts** - POST /v1/organizations/invites
- **anthropic-admin-invites-delete.test.ts** - DELETE /v1/organizations/invites/{inviteId}
- **anthropic-admin-users-update.test.ts** - POST /v1/organizations/users/{userId}
- **anthropic-admin-users-delete.test.ts** - DELETE /v1/organizations/users/{userId}
- **anthropic-admin-workspaces-archive.test.ts** - POST /v1/organizations/workspaces/{workspaceId}/archive
- **anthropic-admin-workspace-members-add.test.ts** - POST /v1/organizations/workspaces/{workspaceId}/members
- **anthropic-admin-workspace-members-update.test.ts** - POST /v1/organizations/workspaces/{workspaceId}/members/{userId}
- **anthropic-admin-api-keys-update.test.ts** - POST /v1/organizations/api_keys/{apiKeyId}

---

## P1: Important Missing Tests (OpenAI, XAI)

### OpenAI Provider - Important Gaps

#### 1. Responses API - Additional Methods

- **openai-responses-compact.test.ts** - POST /v1/responses/compact
  - Tests response compaction endpoint
- **openai-responses-input-tokens.test.ts** - POST /v1/responses/input_tokens
  - Tests input token calculation
- **openai-responses-cancel.test.ts** - POST /v1/responses/{responseId}/cancel
  - Tests canceling an in-progress response

#### 2. Fine-tuning - Advanced Features

- **openai-fine-tuning-jobs-cancel.test.ts** - POST /v1/fine_tuning/jobs/{jobId}/cancel
- **openai-fine-tuning-jobs-pause.test.ts** - POST /v1/fine_tuning/jobs/{jobId}/pause
- **openai-fine-tuning-jobs-resume.test.ts** - POST /v1/fine_tuning/jobs/{jobId}/resume
- **openai-fine-tuning-checkpoints.test.ts** - GET /v1/fine_tuning/jobs/{jobId}/checkpoints
- **openai-fine-tuning-permissions.test.ts** - POST/GET/DELETE checkpoint permissions

#### 3. Chat Completions - Advanced

- **openai-chat-update.test.ts** - POST /v1/chat/completions/{completionId} (update stored completion)
- **openai-chat-messages.test.ts** - GET /v1/chat/completions/{id}/messages

---

### XAI Provider - Important Gaps

#### 1. Management API (requires managementApiKey)

- **xai-auth-api-keys-rotation.test.ts** - POST /auth/api-keys/{id}/rotate
- **xai-auth-api-keys-propagation.test.ts** - GET /auth/api-keys/{id}/propagation
- **xai-auth-teams-models.test.ts** - GET /auth/teams/{teamId}/models
- **xai-auth-teams-endpoints.test.ts** - GET /auth/teams/{teamId}/endpoints
- **xai-auth-management-keys-validation.test.ts** - GET /auth/management-keys/validation

#### 2. Collections - Advanced

- **xai-collections-documents-batchget.test.ts** - GET /v1/collections/{id}/documents:batchGet
- **xai-patch-collections-documents.test.ts** - PATCH /v1/collections/{collectionId}/documents/{fileId}

#### 3. Batches - Results

- **xai-batches-results.test.ts** - GET /v1/batches/{batchId}/results

#### 4. WebSocket Real-time

- **xai-realtime-websocket.test.ts** - ws.v1.realtime.connect()
  - Tests WebSocket connection establishment
  - Tests sending client events
  - Tests receiving server events
  - Tests async iterator interface

---

## P2: Functional & Unit Tests

### Error Handling Tests

- **errors-timeout.test.ts** - Timeout handling across all providers
- **errors-network.test.ts** - Network failure scenarios
- **errors-auth.test.ts** - Authentication/authorization failures
- **errors-rate-limit.test.ts** - Rate limiting responses
- **errors-malformed.test.ts** - Malformed API responses

### Schema Tests

- **schemas-fireworks-comprehensive.test.ts** - All Fireworks schemas
- **schemas-edge-cases.test.ts** - Edge case validation (null, undefined, empty arrays)
- **schemas-nested-validation.test.ts** - Deeply nested object validation

### SSE/Streaming Tests

- **sse-edge-cases.test.ts** - Malformed SSE data
- **sse-connection-loss.test.ts** - Connection interruption handling
- **streaming-backpressure.test.ts** - Consumer backpressure handling

### Helper Functions

- **helpers-openai-image.test.ts** - textPart, imageUrlPart, imageBase64Part, firstContent
- **helpers-kie-mime.test.ts** - inferMimeType function
- **helpers-query-builders.test.ts** - Query parameter building across providers

---

## Test Priority Matrix

### By Provider

```
Fireworks:    ████████████████████████████████████████░░░░░░░░░░ 35% → Target: 80%
Anthropic:    ████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░ 50% → Target: 80%
Fal:          ██████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 45% → Target: 80%
XAI:          ███████████████████████████████░░░░░░░░░░░░░░░░░░░ 65% → Target: 85%
OpenAI:       █████████████████████████████████████░░░░░░░░░░░░░ 75% → Target: 90%
KimiCoding:   █████████████████████████████████████████░░░░░░░░░ 90% → Target: 95%
Kie:          ███████████████████████████████████████░░░░░░░░░░░ 85% → Target: 95%
```

### By Category

| Category         | Existing | Missing | Priority |
| ---------------- | -------- | ------- | -------- |
| Chat/Completions | 15       | 2       | Low      |
| Audio            | 5        | 4       | High     |
| Images/Videos    | 8        | 1       | Low      |
| Embeddings       | 4        | 0       | Done     |
| Files            | 8        | 2       | Medium   |
| Batches          | 6        | 4       | Medium   |
| Fine-tuning      | 3        | 8       | High     |
| Admin/Org        | 5        | 15      | Critical |
| Streaming        | 4        | 3       | Medium   |
| Skills/Tools     | 2        | 4       | High     |
| Compute/Infra    | 4        | 6       | High     |

---

## Implementation Guidelines

### Test File Naming Convention

```
{provider}-{resource}-{action}.test.ts

Examples:
- fireworks-rft-create.test.ts
- anthropic-skills-delete.test.ts
- openai-fine-tuning-jobs-pause.test.ts
```

### Test Structure Template

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { provider } from "@nakedapi/{provider}";

describe("{provider} {feature} integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("{provider}/{feature}-{action}");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should {expected behavior}", async () => {
    const client = provider({
      apiKey: process.env.{PROVIDER}_API_KEY ?? "test-key",
    });

    const result = await client.{namespace}.{method}({
      // request params
    });

    expect(result.{property}).to{matcher}();
  });
});
```

---

## Estimated Effort

| Priority  | Tests  | Est. Hours  | Provider Focus                         |
| --------- | ------ | ----------- | -------------------------------------- |
| P0        | 25     | 50-60       | Fireworks (15), Fal (6), Anthropic (4) |
| P1        | 20     | 35-45       | OpenAI (8), XAI (12)                   |
| P2        | 15     | 25-30       | Cross-cutting                          |
| **Total** | **60** | **110-135** | All providers                          |

---

## Success Criteria

1. **Coverage Targets Met**:
   - All providers >= 80% coverage
   - KimiCoding/Kie >= 95% coverage
   - No untested public API methods

2. **Test Quality**:
   - All tests use Polly for recording/replay
   - Tests validate both success and error paths
   - Schema validation tests for all POST endpoints

3. **CI Integration**:
   - All tests pass in replay mode
   - Harness report generated for PR review
   - No sensitive data in recordings

---

## Next Steps

1. **Immediate (Week 1)**: Begin P0 Fireworks tests (models, audio streaming, rft/dpo)
2. **Short-term (Week 2-3)**: Complete P0 Fal and Anthropic tests
3. **Medium-term (Week 4-5)**: P1 OpenAI and XAI missing tests
4. **Ongoing**: P2 functional tests as needed

---

_Generated: April 2026_
_Last Updated: April 2026_
