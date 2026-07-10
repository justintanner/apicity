# @apicity/googleflow

[![npm](https://img.shields.io/npm/v/@apicity/googleflow?color=cb0000)](https://www.npmjs.com/package/@apicity/googleflow)
[![dependencies](https://img.shields.io/badge/dependencies-1-blue)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)

useapi.net Google Flow proxy.

Runtime dependencies:

- `zod@^4.4.3` — request schemas attached to every POST endpoint as `.schema`

## Installation

```bash
npm install @apicity/googleflow
# or
pnpm add @apicity/googleflow
```

## Quick Start

```typescript
import { createGoogleFlow } from "@apicity/googleflow";

const googleflow = createGoogleFlow({ apiKey: process.env.GOOGLE_FLOW_API_KEY! });
```

## API Reference

26 endpoints across 7 groups. Each method mirrors an upstream URL path.

### accounts

<details>
<summary><code>DELETE</code> <b><code>googleflow.v1.accounts</code></b></summary>

<code>DELETE https://api.useapi.net/v1/google-flow/accounts/{email}</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://useapi.net/docs/api-google-flow-v1/delete-google-flow-accounts-email)

```typescript
const res = await googleflow.v1.accounts({ /* ... */ });
```

Source: [`packages/provider/googleflow/src/google.ts`](src/google.ts)

</details>

<details>
<summary><code>GET</code> <b><code>googleflow.v1.accounts</code></b></summary>

<code>GET https://api.useapi.net/v1/google-flow/accounts</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://useapi.net/docs/api-google-flow-v1/get-google-flow-accounts)

```typescript
const res = await googleflow.v1.accounts({ /* ... */ });
```

Source: [`packages/provider/googleflow/src/google.ts`](src/google.ts)

</details>

<details>
<summary><code>GET</code> <b><code>googleflow.v1.accounts.captchaProviders</code></b></summary>

<code>GET https://api.useapi.net/v1/google-flow/accounts/captcha-providers</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://useapi.net/docs/api-google-flow-v1/get-google-flow-accounts-captcha-providers)

```typescript
const res = await googleflow.v1.accounts.captchaProviders({ /* ... */ });
```

Source: [`packages/provider/googleflow/src/google.ts`](src/google.ts)

</details>

<details>
<summary><code>GET</code> <b><code>googleflow.v1.accounts.captchaStats</code></b></summary>

<code>GET https://api.useapi.net/v1/google-flow/accounts/captcha-stats{query}</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://useapi.net/docs/api-google-flow-v1/get-google-flow-accounts-captcha-stats)

```typescript
const res = await googleflow.v1.accounts.captchaStats({ /* ... */ });
```

Source: [`packages/provider/googleflow/src/google.ts`](src/google.ts)

</details>

<details>
<summary><code>GET</code> <b><code>googleflow.v1.accounts.retrieve</code></b></summary>

<code>GET https://api.useapi.net/v1/google-flow/accounts/{email}</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://useapi.net/docs/api-google-flow-v1/get-google-flow-accounts-email)

```typescript
const res = await googleflow.v1.accounts.retrieve({ /* ... */ });
```

Source: [`packages/provider/googleflow/src/google.ts`](src/google.ts)

</details>

<details>
<summary><code>POST</code> <b><code>googleflow.v1.accounts</code></b></summary>

<code>POST https://api.useapi.net/v1/google-flow/accounts</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://useapi.net/docs/api-google-flow-v1/post-google-flow-accounts)

```typescript
const res = await googleflow.v1.accounts({ /* ... */ });
```

Source: [`packages/provider/googleflow/src/google.ts`](src/google.ts)

</details>

<details>
<summary><code>POST</code> <b><code>googleflow.v1.accounts.captchaProviders</code></b></summary>

<code>POST https://api.useapi.net/v1/google-flow/accounts/captcha-providers</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://useapi.net/docs/api-google-flow-v1/post-google-flow-accounts-captcha-providers)

```typescript
const res = await googleflow.v1.accounts.captchaProviders({ /* ... */ });
```

Source: [`packages/provider/googleflow/src/google.ts`](src/google.ts)

</details>

### assets

<details>
<summary><code>GET</code> <b><code>googleflow.v1.assets.retrieve</code></b></summary>

<code>GET https://api.useapi.net/v1/google-flow/assets/{mediaGenerationId}</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://useapi.net/docs/api-google-flow-v1/get-google-flow-assets-mediagenerationid)

```typescript
const res = await googleflow.v1.assets.retrieve({ /* ... */ });
```

Source: [`packages/provider/googleflow/src/google.ts`](src/google.ts)

</details>

<details>
<summary><code>POST</code> <b><code>googleflow.v1.assets</code></b></summary>

<code>POST https://api.useapi.net/v1/google-flow/assets</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://useapi.net/docs/api-google-flow-v1/post-google-flow-assets-email)

```typescript
const res = await googleflow.v1.assets({ /* ... */ });
```

Source: [`packages/provider/googleflow/src/google.ts`](src/google.ts)

</details>

### characters

<details>
<summary><code>DELETE</code> <b><code>googleflow.v1.characters</code></b></summary>

<code>DELETE https://api.useapi.net/v1/google-flow/characters/{ref}</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://useapi.net/docs/api-google-flow-v1/delete-google-flow-characters-ref)

```typescript
const res = await googleflow.v1.characters({ /* ... */ });
```

Source: [`packages/provider/googleflow/src/google.ts`](src/google.ts)

</details>

<details>
<summary><code>GET</code> <b><code>googleflow.v1.characters</code></b></summary>

<code>GET https://api.useapi.net/v1/google-flow/characters{query}</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://useapi.net/docs/api-google-flow-v1/get-google-flow-characters)

```typescript
const res = await googleflow.v1.characters({ /* ... */ });
```

Source: [`packages/provider/googleflow/src/google.ts`](src/google.ts)

</details>

<details>
<summary><code>GET</code> <b><code>googleflow.v1.characters.retrieve</code></b></summary>

<code>GET https://api.useapi.net/v1/google-flow/characters/{ref}</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://useapi.net/docs/api-google-flow-v1/get-google-flow-characters-ref)

```typescript
const res = await googleflow.v1.characters.retrieve({ /* ... */ });
```

Source: [`packages/provider/googleflow/src/google.ts`](src/google.ts)

</details>

<details>
<summary><code>POST</code> <b><code>googleflow.v1.characters</code></b></summary>

<code>POST https://api.useapi.net/v1/google-flow/characters</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://useapi.net/docs/api-google-flow-v1/post-google-flow-characters)

```typescript
const res = await googleflow.v1.characters({ /* ... */ });
```

Source: [`packages/provider/googleflow/src/google.ts`](src/google.ts)

</details>

### images

<details>
<summary><code>POST</code> <b><code>googleflow.v1.images</code></b></summary>

<code>POST https://api.useapi.net/v1/google-flow/images</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://useapi.net/docs/api-google-flow-v1/post-google-flow-images)

```typescript
const res = await googleflow.v1.images({ /* ... */ });
```

Source: [`packages/provider/googleflow/src/google.ts`](src/google.ts)

</details>

<details>
<summary><code>POST</code> <b><code>googleflow.v1.images.upscale</code></b></summary>

<code>POST https://api.useapi.net/v1/google-flow/images/upscale</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://useapi.net/docs/api-google-flow-v1/post-google-flow-images-upscale)

```typescript
const res = await googleflow.v1.images.upscale({ /* ... */ });
```

Source: [`packages/provider/googleflow/src/google.ts`](src/google.ts)

</details>

### jobs

<details>
<summary><code>GET</code> <b><code>googleflow.v1.jobs</code></b></summary>

<code>GET https://api.useapi.net/v1/google-flow/jobs{query}</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://useapi.net/docs/api-google-flow-v1/get-google-flow-jobs)

```typescript
const res = await googleflow.v1.jobs({ /* ... */ });
```

Source: [`packages/provider/googleflow/src/google.ts`](src/google.ts)

</details>

<details>
<summary><code>GET</code> <b><code>googleflow.v1.jobs.retrieve</code></b></summary>

<code>GET https://api.useapi.net/v1/google-flow/jobs/{jobId}</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://useapi.net/docs/api-google-flow-v1/get-google-flow-jobs-jobid)

```typescript
const res = await googleflow.v1.jobs.retrieve({ /* ... */ });
```

Source: [`packages/provider/googleflow/src/google.ts`](src/google.ts)

</details>

### videos

<details>
<summary><code>POST</code> <b><code>googleflow.v1.videos</code></b></summary>

<code>POST https://api.useapi.net/v1/google-flow/videos</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://useapi.net/docs/api-google-flow-v1/post-google-flow-videos)

```typescript
const res = await googleflow.v1.videos({ /* ... */ });
```

Source: [`packages/provider/googleflow/src/google.ts`](src/google.ts)

</details>

<details>
<summary><code>POST</code> <b><code>googleflow.v1.videos.concatenate</code></b></summary>

<code>POST https://api.useapi.net/v1/google-flow/videos/concatenate</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://useapi.net/docs/api-google-flow-v1/post-google-flow-videos-concatenate)

```typescript
const res = await googleflow.v1.videos.concatenate({ /* ... */ });
```

Source: [`packages/provider/googleflow/src/google.ts`](src/google.ts)

</details>

<details>
<summary><code>POST</code> <b><code>googleflow.v1.videos.extend</code></b></summary>

<code>POST https://api.useapi.net/v1/google-flow/videos/extend</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://useapi.net/docs/api-google-flow-v1/post-google-flow-videos-extend)

```typescript
const res = await googleflow.v1.videos.extend({ /* ... */ });
```

Source: [`packages/provider/googleflow/src/google.ts`](src/google.ts)

</details>

<details>
<summary><code>POST</code> <b><code>googleflow.v1.videos.gif</code></b></summary>

<code>POST https://api.useapi.net/v1/google-flow/videos/gif</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://useapi.net/docs/api-google-flow-v1/post-google-flow-videos-gif)

```typescript
const res = await googleflow.v1.videos.gif({ /* ... */ });
```

Source: [`packages/provider/googleflow/src/google.ts`](src/google.ts)

</details>

<details>
<summary><code>POST</code> <b><code>googleflow.v1.videos.upscale</code></b></summary>

<code>POST https://api.useapi.net/v1/google-flow/videos/upscale</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://useapi.net/docs/api-google-flow-v1/post-google-flow-videos-upscale)

```typescript
const res = await googleflow.v1.videos.upscale({ /* ... */ });
```

Source: [`packages/provider/googleflow/src/google.ts`](src/google.ts)

</details>

### voices

<details>
<summary><code>DELETE</code> <b><code>googleflow.v1.voices</code></b></summary>

<code>DELETE https://api.useapi.net/v1/google-flow/voices/{ref}</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://useapi.net/docs/api-google-flow-v1/delete-google-flow-voices-ref)

```typescript
const res = await googleflow.v1.voices({ /* ... */ });
```

Source: [`packages/provider/googleflow/src/google.ts`](src/google.ts)

</details>

<details>
<summary><code>GET</code> <b><code>googleflow.v1.voices</code></b></summary>

<code>GET https://api.useapi.net/v1/google-flow/voices{query}</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://useapi.net/docs/api-google-flow-v1/get-google-flow-voices)

```typescript
const res = await googleflow.v1.voices({ /* ... */ });
```

Source: [`packages/provider/googleflow/src/google.ts`](src/google.ts)

</details>

<details>
<summary><code>GET</code> <b><code>googleflow.v1.voices.retrieve</code></b></summary>

<code>GET https://api.useapi.net/v1/google-flow/voices/{ref}</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://useapi.net/docs/api-google-flow-v1/get-google-flow-voices-ref)

```typescript
const res = await googleflow.v1.voices.retrieve({ /* ... */ });
```

Source: [`packages/provider/googleflow/src/google.ts`](src/google.ts)

</details>

<details>
<summary><code>POST</code> <b><code>googleflow.v1.voices</code></b></summary>

<code>POST https://api.useapi.net/v1/google-flow/voices</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://useapi.net/docs/api-google-flow-v1/post-google-flow-voices)

```typescript
const res = await googleflow.v1.voices({ /* ... */ });
```

Source: [`packages/provider/googleflow/src/google.ts`](src/google.ts)

</details>

## Middleware

```typescript
import { createGoogleFlow, withRetry } from "@apicity/googleflow";

const googleflow = createGoogleFlow({ apiKey: process.env.GOOGLE_FLOW_API_KEY! });
const models = withRetry(googleflow.get.v1.models, { retries: 3 });
```

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
