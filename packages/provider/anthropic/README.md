# @nakedapi/anthropic

[![npm](https://img.shields.io/npm/v/@nakedapi/anthropic?color=cb0000)](https://www.npmjs.com/package/@nakedapi/anthropic)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)

Anthropic provider — messages (streaming, token counting), batches, files, models, skills (beta), and organization admin APIs. Completely standalone with zero external dependencies.

## Installation

```bash
npm install @nakedapi/anthropic
# or
pnpm add @nakedapi/anthropic
```

## Quick Start

```typescript
import { anthropic as createAnthropic } from "@nakedapi/anthropic";

const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const response = await anthropic.v1.messages({
  model: "claude-sonnet-4-20250514",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Hello!" }],
});
console.log(response.content[0].text);
```

## Endpoints

Base URL: `https://api.anthropic.com/v1`

### Messages

| URL                           | Method                                   |
| ----------------------------- | ---------------------------------------- |
| `POST /messages`              | `anthropic.v1.messages(req)`             |
| `POST /messages` (stream)     | `anthropic.v1.messages.stream(req)`      |
| `POST /messages/count_tokens` | `anthropic.v1.messages.countTokens(req)` |

### Batches

| URL                                  | Method                                        |
| ------------------------------------ | --------------------------------------------- |
| `POST /messages/batches`             | `anthropic.v1.messages.batches(req)`          |
| `GET /messages/batches`              | `anthropic.v1.messages.batches.list(params?)` |
| `GET /messages/batches/{id}`         | `anthropic.v1.messages.batches.retrieve(id)`  |
| `POST /messages/batches/{id}/cancel` | `anthropic.v1.messages.batches.cancel(id)`    |
| `GET /messages/batches/{id}/results` | `anthropic.v1.messages.batches.results(id)`   |
| `DELETE /messages/batches/{id}`      | `anthropic.v1.messages.batches.del(id)`       |

### Models

| URL                | Method                              |
| ------------------ | ----------------------------------- |
| `GET /models`      | `anthropic.v1.models.list(params?)` |
| `GET /models/{id}` | `anthropic.v1.models.retrieve(id)`  |

### Files

| URL                       | Method                             |
| ------------------------- | ---------------------------------- |
| `POST /files`             | `anthropic.v1.files.upload(file)`  |
| `GET /files`              | `anthropic.v1.files.list(params?)` |
| `GET /files/{id}`         | `anthropic.v1.files.retrieve(id)`  |
| `GET /files/{id}/content` | `anthropic.v1.files.content(id)`   |
| `DELETE /files/{id}`      | `anthropic.v1.files.del(id)`       |

### Skills (Beta)

| URL                                      | Method                                           |
| ---------------------------------------- | ------------------------------------------------ |
| `POST /skills`                           | `anthropic.v1.skills.create(title, files)`       |
| `GET /skills`                            | `anthropic.v1.skills.list(params?)`              |
| `GET /skills/{id}`                       | `anthropic.v1.skills.retrieve(id)`               |
| `DELETE /skills/{id}`                    | `anthropic.v1.skills.del(id)`                    |
| `POST /skills/{id}/versions`             | `anthropic.v1.skills.versions.create(id, files)` |
| `GET /skills/{id}/versions`              | `anthropic.v1.skills.versions.list(id, params?)` |
| `DELETE /skills/{id}/versions/{version}` | `anthropic.v1.skills.versions.del(id, version)`  |

### Admin — Organization

| URL                     | Method                            |
| ----------------------- | --------------------------------- |
| `GET /organizations/me` | `anthropic.v1.organizations.me()` |

### Admin — Users

| URL                                | Method                                             |
| ---------------------------------- | -------------------------------------------------- |
| `GET /organizations/users`         | `anthropic.v1.organizations.users.list(params?)`   |
| `GET /organizations/users/{id}`    | `anthropic.v1.organizations.users.retrieve(id)`    |
| `POST /organizations/users/{id}`   | `anthropic.v1.organizations.users.update(id, req)` |
| `DELETE /organizations/users/{id}` | `anthropic.v1.organizations.users.del(id)`         |

### Admin — Invites

| URL                                  | Method                                             |
| ------------------------------------ | -------------------------------------------------- |
| `POST /organizations/invites`        | `anthropic.v1.organizations.invites.create(req)`   |
| `GET /organizations/invites`         | `anthropic.v1.organizations.invites.list(params?)` |
| `GET /organizations/invites/{id}`    | `anthropic.v1.organizations.invites.retrieve(id)`  |
| `DELETE /organizations/invites/{id}` | `anthropic.v1.organizations.invites.del(id)`       |

### Admin — Workspaces

| URL                                           | Method                                                  |
| --------------------------------------------- | ------------------------------------------------------- |
| `POST /organizations/workspaces`              | `anthropic.v1.organizations.workspaces.create(req)`     |
| `GET /organizations/workspaces`               | `anthropic.v1.organizations.workspaces.list(params?)`   |
| `GET /organizations/workspaces/{id}`          | `anthropic.v1.organizations.workspaces.retrieve(id)`    |
| `POST /organizations/workspaces/{id}`         | `anthropic.v1.organizations.workspaces.update(id, req)` |
| `POST /organizations/workspaces/{id}/archive` | `anthropic.v1.organizations.workspaces.archive(id)`     |

### Admin — Workspace Members

| URL                                                      | Method                                                                  |
| -------------------------------------------------------- | ----------------------------------------------------------------------- |
| `POST /organizations/workspaces/{id}/members`            | `anthropic.v1.organizations.workspaces.members.add(id, req)`            |
| `GET /organizations/workspaces/{id}/members`             | `anthropic.v1.organizations.workspaces.members.list(id, params?)`       |
| `GET /organizations/workspaces/{id}/members/{userId}`    | `anthropic.v1.organizations.workspaces.members.retrieve(id, userId)`    |
| `POST /organizations/workspaces/{id}/members/{userId}`   | `anthropic.v1.organizations.workspaces.members.update(id, userId, req)` |
| `DELETE /organizations/workspaces/{id}/members/{userId}` | `anthropic.v1.organizations.workspaces.members.del(id, userId)`         |

### Admin — API Keys

| URL                                 | Method                                                |
| ----------------------------------- | ----------------------------------------------------- |
| `GET /organizations/api_keys`       | `anthropic.v1.organizations.api_keys.list(params?)`   |
| `GET /organizations/api_keys/{id}`  | `anthropic.v1.organizations.api_keys.retrieve(id)`    |
| `POST /organizations/api_keys/{id}` | `anthropic.v1.organizations.api_keys.update(id, req)` |

## Usage Examples

### Messages

```typescript
const response = await anthropic.v1.messages({
  model: "claude-sonnet-4-20250514",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Explain monads in one sentence." }],
});
console.log(response.content[0].text);
```

### Streaming

```typescript
const stream = await anthropic.v1.messages.stream({
  model: "claude-sonnet-4-20250514",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Write a haiku about TypeScript." }],
});

for await (const event of stream) {
  if (
    event.type === "content_block_delta" &&
    event.delta.type === "text_delta"
  ) {
    process.stdout.write(event.delta.text);
  }
}
```

### Token Counting

```typescript
const result = await anthropic.v1.messages.countTokens({
  model: "claude-sonnet-4-20250514",
  messages: [{ role: "user", content: "Hello, world!" }],
});
console.log(result.input_tokens);
```

### Batches

```typescript
// Create a batch
const batch = await anthropic.v1.messages.batches({
  requests: [
    {
      custom_id: "req-1",
      params: {
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [{ role: "user", content: "Hello!" }],
      },
    },
  ],
});

// List batches
const list = await anthropic.v1.messages.batches.list();

// Retrieve, cancel, get results, delete
const status = await anthropic.v1.messages.batches.retrieve(batch.id);
const results = await anthropic.v1.messages.batches.results(batch.id);
await anthropic.v1.messages.batches.cancel(batch.id);
await anthropic.v1.messages.batches.del(batch.id);
```

### Files

```typescript
// Upload a file
const file = await anthropic.v1.files.upload(
  new Blob([content], { type: "text/plain" })
);

// List, retrieve, download, delete
const files = await anthropic.v1.files.list();
const info = await anthropic.v1.files.retrieve(file.id);
const content = await anthropic.v1.files.content(file.id);
await anthropic.v1.files.del(file.id);
```

### Models

```typescript
const models = await anthropic.v1.models.list();
const model = await anthropic.v1.models.retrieve("claude-sonnet-4-20250514");
```

### Skills

```typescript
// Create a skill with files
const skill = await anthropic.v1.skills.create("My Skill", [
  { data: new Blob([content]), path: "context.txt" },
]);

// List and retrieve
const skills = await anthropic.v1.skills.list();
const skillInfo = await anthropic.v1.skills.retrieve(skill.id);

// Manage versions
await anthropic.v1.skills.versions.create(skill.id, [
  { data: new Blob([content]), path: "v2.txt" },
]);
const versions = await anthropic.v1.skills.versions.list(skill.id);
await anthropic.v1.skills.versions.del(skill.id, "1.0.0");

// Delete skill
await anthropic.v1.skills.del(skill.id);
```

### Admin APIs

Admin endpoints use `adminApiKey` if provided, otherwise fall back to `apiKey`.

```typescript
const admin = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  adminApiKey: process.env.ANTHROPIC_ADMIN_KEY!,
});

// Organization info
const org = await admin.v1.organizations.me();

// User management
const users = await admin.v1.organizations.users.list();
const user = await admin.v1.organizations.users.retrieve("user-123");
await admin.v1.organizations.users.update("user-123", {
  role: "workspace_admin",
});
await admin.v1.organizations.users.del("user-123");

// Invites
const invite = await admin.v1.organizations.invites.create({
  email: "new@example.com",
  role: "user",
});
const invites = await admin.v1.organizations.invites.list();
await admin.v1.organizations.invites.del(invite.id);

// Workspaces
const workspace = await admin.v1.organizations.workspaces.create({
  name: "Engineering",
});
const workspaces = await admin.v1.organizations.workspaces.list();
await admin.v1.organizations.workspaces.update(workspace.id, {
  name: "Platform",
});
await admin.v1.organizations.workspaces.archive(workspace.id);

// Workspace members
const member = await admin.v1.organizations.workspaces.members.add(
  workspace.id,
  {
    user_id: "user-123",
    role: "workspace_admin",
  }
);
const members = await admin.v1.organizations.workspaces.members.list(
  workspace.id
);
await admin.v1.organizations.workspaces.members.update(
  workspace.id,
  "user-123",
  {
    role: "user",
  }
);
await admin.v1.organizations.workspaces.members.del(workspace.id, "user-123");

// API keys
const apiKeys = await admin.v1.organizations.api_keys.list();
const apiKey = await admin.v1.organizations.api_keys.retrieve("key-123");
await admin.v1.organizations.api_keys.update("key-123", { status: "archived" });
```

## Data Shaping

These endpoints transform input before sending (all others are pure pass-through):

| Method                                     | What happens                            |
| ------------------------------------------ | --------------------------------------- |
| `v1.messages.stream()`                     | Sets `stream: true` in the request body |
| `v1.files.upload()`                        | Builds FormData from Blob               |
| `v1.skills.create()`, `.versions.create()` | Builds FormData from title + file array |

## Configuration

```typescript
const anthropic = createAnthropic({
  apiKey: "your-api-key", // required
  baseURL: "https://...", // optional, custom base URL
  timeout: 30000, // optional, ms (default: 30000)
  fetch: customFetch, // optional, custom fetch implementation
  defaultVersion: "2023-06-01", // optional, anthropic-version header (default)
  defaultBeta: ["skills-2025-10-02"], // optional, anthropic-beta header
  adminApiKey: "your-admin-key", // optional, for admin endpoints
});
```

## Middleware

```typescript
import {
  anthropic as createAnthropic,
  withRetry,
  withFallback,
} from "@nakedapi/anthropic";

const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// Retry on transient errors (429, 5xx)
const messages = withRetry(anthropic.v1.messages, { retries: 3 });

// Failover across accounts
const primary = createAnthropic({ apiKey: process.env.ANTHROPIC_KEY_PRIMARY! });
const backup = createAnthropic({ apiKey: process.env.ANTHROPIC_KEY_BACKUP! });
const resilient = withFallback([primary.v1.messages, backup.v1.messages]);
```

## License

MIT
