# @apicity/google

[![npm](https://img.shields.io/npm/v/@apicity/google?color=cb0000)](https://www.npmjs.com/package/@apicity/google)
[![dependencies](https://img.shields.io/badge/dependencies-1-blue)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)
[![docs](https://img.shields.io/badge/docs-docs.cloud.google.com-blue)](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/reference/express-mode/rest/v1/publishers.models/generateContent)

Google Gemini provider for express-mode generateContent.

Runtime dependencies:

- `zod@^4.4.3` — request schemas attached to every POST endpoint as `.schema`

## Installation

```bash
npm install @apicity/google
# or
pnpm add @apicity/google
```

## Quick Start

```typescript
import { createGoogle } from "@apicity/google";

const google = createGoogle({ apiKey: process.env.GOOGLE_API_KEY! });
```

## API Reference

30 endpoints across 3 groups. Each method mirrors an upstream URL path.

### googleFlow

<details>
<summary><code>DELETE</code> <b><code>google.v1.googleFlow.accounts</code></b></summary>

<code>DELETE https://api.useapi.net/v1/google-flow/accounts/{email}</code>

[Upstream docs ↗](https://useapi.net/docs/api-google-flow-v1/delete-google-flow-accounts-email)

```typescript
const res = await google.v1.googleFlow.accounts({ /* ... */ });
```

Source: [`packages/provider/google/src/google.ts`](src/google.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>google.v1.googleFlow.characters</code></b></summary>

<code>DELETE https://api.useapi.net/v1/google-flow/characters/{ref}</code>

[Upstream docs ↗](https://useapi.net/docs/api-google-flow-v1/delete-google-flow-characters-ref)

```typescript
const res = await google.v1.googleFlow.characters({ /* ... */ });
```

Source: [`packages/provider/google/src/google.ts`](src/google.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>google.v1.googleFlow.voices</code></b></summary>

<code>DELETE https://api.useapi.net/v1/google-flow/voices/{ref}</code>

[Upstream docs ↗](https://useapi.net/docs/api-google-flow-v1/delete-google-flow-voices-ref)

```typescript
const res = await google.v1.googleFlow.voices({ /* ... */ });
```

Source: [`packages/provider/google/src/google.ts`](src/google.ts)

</details>

<details>
<summary><code>GET</code> <b><code>google.v1.googleFlow.accounts</code></b></summary>

<code>GET https://api.useapi.net/v1/google-flow/accounts</code>

[Upstream docs ↗](https://useapi.net/docs/api-google-flow-v1/get-google-flow-accounts)

```typescript
const res = await google.v1.googleFlow.accounts({ /* ... */ });
```

Source: [`packages/provider/google/src/google.ts`](src/google.ts)

</details>

<details>
<summary><code>GET</code> <b><code>google.v1.googleFlow.accounts.captchaProviders</code></b></summary>

<code>GET https://api.useapi.net/v1/google-flow/accounts/captcha-providers</code>

[Upstream docs ↗](https://useapi.net/docs/api-google-flow-v1/get-google-flow-accounts-captcha-providers)

```typescript
const res = await google.v1.googleFlow.accounts.captchaProviders({ /* ... */ });
```

Source: [`packages/provider/google/src/google.ts`](src/google.ts)

</details>

<details>
<summary><code>GET</code> <b><code>google.v1.googleFlow.accounts.captchaStats</code></b></summary>

<code>GET https://api.useapi.net/v1/google-flow/accounts/captcha-stats{query}</code>

[Upstream docs ↗](https://useapi.net/docs/api-google-flow-v1/get-google-flow-accounts-captcha-stats)

```typescript
const res = await google.v1.googleFlow.accounts.captchaStats({ /* ... */ });
```

Source: [`packages/provider/google/src/google.ts`](src/google.ts)

</details>

<details>
<summary><code>GET</code> <b><code>google.v1.googleFlow.accounts.retrieve</code></b></summary>

<code>GET https://api.useapi.net/v1/google-flow/accounts/{email}</code>

[Upstream docs ↗](https://useapi.net/docs/api-google-flow-v1/get-google-flow-accounts-email)

```typescript
const res = await google.v1.googleFlow.accounts.retrieve({ /* ... */ });
```

Source: [`packages/provider/google/src/google.ts`](src/google.ts)

</details>

<details>
<summary><code>GET</code> <b><code>google.v1.googleFlow.assets.retrieve</code></b></summary>

<code>GET https://api.useapi.net/v1/google-flow/assets/{mediaGenerationId}</code>

[Upstream docs ↗](https://useapi.net/docs/api-google-flow-v1/get-google-flow-assets-mediagenerationid)

```typescript
const res = await google.v1.googleFlow.assets.retrieve({ /* ... */ });
```

Source: [`packages/provider/google/src/google.ts`](src/google.ts)

</details>

<details>
<summary><code>GET</code> <b><code>google.v1.googleFlow.characters</code></b></summary>

<code>GET https://api.useapi.net/v1/google-flow/characters{query}</code>

[Upstream docs ↗](https://useapi.net/docs/api-google-flow-v1/get-google-flow-characters)

```typescript
const res = await google.v1.googleFlow.characters({ /* ... */ });
```

Source: [`packages/provider/google/src/google.ts`](src/google.ts)

</details>

<details>
<summary><code>GET</code> <b><code>google.v1.googleFlow.characters.retrieve</code></b></summary>

<code>GET https://api.useapi.net/v1/google-flow/characters/{ref}</code>

[Upstream docs ↗](https://useapi.net/docs/api-google-flow-v1/get-google-flow-characters-ref)

```typescript
const res = await google.v1.googleFlow.characters.retrieve({ /* ... */ });
```

Source: [`packages/provider/google/src/google.ts`](src/google.ts)

</details>

<details>
<summary><code>GET</code> <b><code>google.v1.googleFlow.jobs</code></b></summary>

<code>GET https://api.useapi.net/v1/google-flow/jobs{query}</code>

[Upstream docs ↗](https://useapi.net/docs/api-google-flow-v1/get-google-flow-jobs)

```typescript
const res = await google.v1.googleFlow.jobs({ /* ... */ });
```

Source: [`packages/provider/google/src/google.ts`](src/google.ts)

</details>

<details>
<summary><code>GET</code> <b><code>google.v1.googleFlow.jobs.retrieve</code></b></summary>

<code>GET https://api.useapi.net/v1/google-flow/jobs/{jobId}</code>

[Upstream docs ↗](https://useapi.net/docs/api-google-flow-v1/get-google-flow-jobs-jobid)

```typescript
const res = await google.v1.googleFlow.jobs.retrieve({ /* ... */ });
```

Source: [`packages/provider/google/src/google.ts`](src/google.ts)

</details>

<details>
<summary><code>GET</code> <b><code>google.v1.googleFlow.voices</code></b></summary>

<code>GET https://api.useapi.net/v1/google-flow/voices{query}</code>

[Upstream docs ↗](https://useapi.net/docs/api-google-flow-v1/get-google-flow-voices)

```typescript
const res = await google.v1.googleFlow.voices({ /* ... */ });
```

Source: [`packages/provider/google/src/google.ts`](src/google.ts)

</details>

<details>
<summary><code>GET</code> <b><code>google.v1.googleFlow.voices.retrieve</code></b></summary>

<code>GET https://api.useapi.net/v1/google-flow/voices/{ref}</code>

[Upstream docs ↗](https://useapi.net/docs/api-google-flow-v1/get-google-flow-voices-ref)

```typescript
const res = await google.v1.googleFlow.voices.retrieve({ /* ... */ });
```

Source: [`packages/provider/google/src/google.ts`](src/google.ts)

</details>

<details>
<summary><code>POST</code> <b><code>google.v1.googleFlow.accounts</code></b></summary>

<code>POST https://api.useapi.net/v1/google-flow/accounts</code>

[Upstream docs ↗](https://useapi.net/docs/api-google-flow-v1/post-google-flow-accounts)

```typescript
const res = await google.v1.googleFlow.accounts({ /* ... */ });
```

Source: [`packages/provider/google/src/google.ts`](src/google.ts)

</details>

<details>
<summary><code>POST</code> <b><code>google.v1.googleFlow.accounts.captchaProviders</code></b></summary>

<code>POST https://api.useapi.net/v1/google-flow/accounts/captcha-providers</code>

[Upstream docs ↗](https://useapi.net/docs/api-google-flow-v1/post-google-flow-accounts-captcha-providers)

```typescript
const res = await google.v1.googleFlow.accounts.captchaProviders({ /* ... */ });
```

Source: [`packages/provider/google/src/google.ts`](src/google.ts)

</details>

<details>
<summary><code>POST</code> <b><code>google.v1.googleFlow.assets</code></b></summary>

<code>POST https://api.useapi.net/v1/google-flow/assets</code>

[Upstream docs ↗](https://useapi.net/docs/api-google-flow-v1/post-google-flow-assets-email)

```typescript
const res = await google.v1.googleFlow.assets({ /* ... */ });
```

Source: [`packages/provider/google/src/google.ts`](src/google.ts)

</details>

<details>
<summary><code>POST</code> <b><code>google.v1.googleFlow.characters</code></b></summary>

<code>POST https://api.useapi.net/v1/google-flow/characters</code>

[Upstream docs ↗](https://useapi.net/docs/api-google-flow-v1/post-google-flow-characters)

```typescript
const res = await google.v1.googleFlow.characters({ /* ... */ });
```

Source: [`packages/provider/google/src/google.ts`](src/google.ts)

</details>

<details>
<summary><code>POST</code> <b><code>google.v1.googleFlow.images</code></b></summary>

<code>POST https://api.useapi.net/v1/google-flow/images</code>

[Upstream docs ↗](https://useapi.net/docs/api-google-flow-v1/post-google-flow-images)

```typescript
const res = await google.v1.googleFlow.images({ /* ... */ });
```

Source: [`packages/provider/google/src/google.ts`](src/google.ts)

</details>

<details>
<summary><code>POST</code> <b><code>google.v1.googleFlow.images.upscale</code></b></summary>

<code>POST https://api.useapi.net/v1/google-flow/images/upscale</code>

[Upstream docs ↗](https://useapi.net/docs/api-google-flow-v1/post-google-flow-images-upscale)

```typescript
const res = await google.v1.googleFlow.images.upscale({ /* ... */ });
```

Source: [`packages/provider/google/src/google.ts`](src/google.ts)

</details>

<details>
<summary><code>POST</code> <b><code>google.v1.googleFlow.videos</code></b></summary>

<code>POST https://api.useapi.net/v1/google-flow/videos</code>

[Upstream docs ↗](https://useapi.net/docs/api-google-flow-v1/post-google-flow-videos)

```typescript
const res = await google.v1.googleFlow.videos({ /* ... */ });
```

Source: [`packages/provider/google/src/google.ts`](src/google.ts)

</details>

<details>
<summary><code>POST</code> <b><code>google.v1.googleFlow.videos.concatenate</code></b></summary>

<code>POST https://api.useapi.net/v1/google-flow/videos/concatenate</code>

[Upstream docs ↗](https://useapi.net/docs/api-google-flow-v1/post-google-flow-videos-concatenate)

```typescript
const res = await google.v1.googleFlow.videos.concatenate({ /* ... */ });
```

Source: [`packages/provider/google/src/google.ts`](src/google.ts)

</details>

<details>
<summary><code>POST</code> <b><code>google.v1.googleFlow.videos.extend</code></b></summary>

<code>POST https://api.useapi.net/v1/google-flow/videos/extend</code>

[Upstream docs ↗](https://useapi.net/docs/api-google-flow-v1/post-google-flow-videos-extend)

```typescript
const res = await google.v1.googleFlow.videos.extend({ /* ... */ });
```

Source: [`packages/provider/google/src/google.ts`](src/google.ts)

</details>

<details>
<summary><code>POST</code> <b><code>google.v1.googleFlow.videos.gif</code></b></summary>

<code>POST https://api.useapi.net/v1/google-flow/videos/gif</code>

[Upstream docs ↗](https://useapi.net/docs/api-google-flow-v1/post-google-flow-videos-gif)

```typescript
const res = await google.v1.googleFlow.videos.gif({ /* ... */ });
```

Source: [`packages/provider/google/src/google.ts`](src/google.ts)

</details>

<details>
<summary><code>POST</code> <b><code>google.v1.googleFlow.videos.upscale</code></b></summary>

<code>POST https://api.useapi.net/v1/google-flow/videos/upscale</code>

[Upstream docs ↗](https://useapi.net/docs/api-google-flow-v1/post-google-flow-videos-upscale)

```typescript
const res = await google.v1.googleFlow.videos.upscale({ /* ... */ });
```

Source: [`packages/provider/google/src/google.ts`](src/google.ts)

</details>

<details>
<summary><code>POST</code> <b><code>google.v1.googleFlow.voices</code></b></summary>

<code>POST https://api.useapi.net/v1/google-flow/voices</code>

[Upstream docs ↗](https://useapi.net/docs/api-google-flow-v1/post-google-flow-voices)

```typescript
const res = await google.v1.googleFlow.voices({ /* ... */ });
```

Source: [`packages/provider/google/src/google.ts`](src/google.ts)

</details>

### publishers

<details>
<summary><code>POST</code> <b><code>google.v1.publishers.google.models.countTokens</code></b></summary>

<code>POST https://aiplatform.googleapis.com/v1/publishers/google/models/{model}:countTokens</code>

[Upstream docs ↗](https://docs.cloud.google.com/gemini-enterprise-agent-platform/reference/express-mode/rest/v1/publishers.models/countTokens)

```typescript
const res = await google.v1.publishers.google.models.countTokens(
  "gemini-2.5-flash",
  {
    contents: [{ role: "user", parts: [{ text: "How does AI work?" }] }],
  }
);
```

Source: [`packages/provider/google/src/google.ts`](src/google.ts)

</details>

<details>
<summary><code>POST</code> <b><code>google.v1.publishers.google.models.generateContent</code></b></summary>

<code>POST https://aiplatform.googleapis.com/v1/publishers/google/models/{model}:generateContent</code>

[Upstream docs ↗](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/reference/express-mode/rest/v1/publishers.models/generateContent)

```typescript
const res = await google.v1.publishers.google.models.generateContent(
  "gemini-2.5-flash",
  {
    contents: [{ role: "user", parts: [{ text: "How does AI work?" }] }],
  }
);
```

Source: [`packages/provider/google/src/google.ts`](src/google.ts)

</details>

### v1internal

<details>
<summary><code>POST</code> <b><code>google.v1internal.retrieveUserQuota</code></b></summary>

<code>POST https://cloudcode-pa.googleapis.com/v1internal:retrieveUserQuota</code>

[Upstream docs ↗](https://cloud.google.com/gemini/docs/quotas)

```typescript
const res = await google.v1internal.retrieveUserQuota({ /* ... */ });
```

Source: [`packages/provider/google/src/google.ts`](src/google.ts)

</details>

<details>
<summary><code>POST</code> <b><code>google.v1internal.retrieveUserQuotaSummary</code></b></summary>

<code>POST https://cloudcode-pa.googleapis.com/v1internal:retrieveUserQuotaSummary</code>

[Upstream docs ↗](https://cloud.google.com/gemini/docs/quotas)

```typescript
const res = await google.v1internal.retrieveUserQuotaSummary({ /* ... */ });
```

Source: [`packages/provider/google/src/google.ts`](src/google.ts)

</details>

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
