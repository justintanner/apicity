# @apicity/dropbox

[![npm](https://img.shields.io/npm/v/@apicity/dropbox?color=cb0000)](https://www.npmjs.com/package/@apicity/dropbox)
[![dependencies](https://img.shields.io/badge/dependencies-1-blue)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)
[![docs](https://img.shields.io/badge/docs-dropbox.com-blue)](https://www.dropbox.com/developers/documentation/http/documentation)

Dropbox HTTP API provider for users, files, content upload/download, and sharing endpoints.

Runtime dependencies:

- `zod@^4.4.3` — request schemas attached to Dropbox endpoint methods as `.schema`

## Installation

```bash
npm install @apicity/dropbox
# or
pnpm add @apicity/dropbox
```

## Quick Start

```typescript
import { createDropbox } from "@apicity/dropbox";

const dropbox = createDropbox({ oauthToken: process.env.DROPBOX_OAUTH_TOKEN! });
```

If `oauthToken` is omitted, the provider reads `DROPBOX_OAUTH_TOKEN` at request time.
Tokens are only sent in the `Authorization: Bearer ...` header.

## API Reference

13 endpoints across 4 groups. Each method mirrors an upstream URL path.

### check

<details>
<summary><code>POST</code> <b><code>dropbox.check.user</code></b></summary>

<code>POST https://api.dropboxapi.com/2/check/user</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://www.dropbox.com/developers/documentation/http/documentation#check-user)

```typescript
const res = await dropbox.check.user({ /* ... */ });
```

Source: [`packages/provider/dropbox/src/dropbox.ts`](src/dropbox.ts)

</details>

### files

<details>
<summary><code>POST</code> <b><code>dropbox.files.copyV2</code></b></summary>

<code>POST https://api.dropboxapi.com/2/files/copy_v2</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://www.dropbox.com/developers/documentation/http/documentation#files-copy_v2)

```typescript
const res = await dropbox.files.copyV2({ /* ... */ });
```

Source: [`packages/provider/dropbox/src/dropbox.ts`](src/dropbox.ts)

</details>

<details>
<summary><code>POST</code> <b><code>dropbox.files.createFolderV2</code></b></summary>

<code>POST https://api.dropboxapi.com/2/files/create_folder_v2</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://www.dropbox.com/developers/documentation/http/documentation#files-create_folder_v2)

```typescript
const res = await dropbox.files.createFolderV2({ /* ... */ });
```

Source: [`packages/provider/dropbox/src/dropbox.ts`](src/dropbox.ts)

</details>

<details>
<summary><code>POST</code> <b><code>dropbox.files.deleteV2</code></b></summary>

<code>POST https://api.dropboxapi.com/2/files/delete_v2</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://www.dropbox.com/developers/documentation/http/documentation#files-delete_v2)

```typescript
const res = await dropbox.files.deleteV2({ /* ... */ });
```

Source: [`packages/provider/dropbox/src/dropbox.ts`](src/dropbox.ts)

</details>

<details>
<summary><code>POST</code> <b><code>dropbox.files.download</code></b></summary>

<code>POST https://content.dropboxapi.com/2/files/download</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://www.dropbox.com/developers/documentation/http/documentation#files-download)

```typescript
const res = await dropbox.files.download({ /* ... */ });
```

Source: [`packages/provider/dropbox/src/dropbox.ts`](src/dropbox.ts)

</details>

<details>
<summary><code>POST</code> <b><code>dropbox.files.getMetadata</code></b></summary>

<code>POST https://api.dropboxapi.com/2/files/get_metadata</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://www.dropbox.com/developers/documentation/http/documentation#files-get_metadata)

```typescript
const res = await dropbox.files.getMetadata({ /* ... */ });
```

Source: [`packages/provider/dropbox/src/dropbox.ts`](src/dropbox.ts)

</details>

<details>
<summary><code>POST</code> <b><code>dropbox.files.listFolder</code></b></summary>

<code>POST https://api.dropboxapi.com/2/files/list_folder</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://www.dropbox.com/developers/documentation/http/documentation#files-list_folder)

```typescript
const res = await dropbox.files.listFolder({ /* ... */ });
```

Source: [`packages/provider/dropbox/src/dropbox.ts`](src/dropbox.ts)

</details>

<details>
<summary><code>POST</code> <b><code>dropbox.files.listFolderContinue</code></b></summary>

<code>POST https://api.dropboxapi.com/2/files/list_folder/continue</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://www.dropbox.com/developers/documentation/http/documentation#files-list_folder-continue)

```typescript
const res = await dropbox.files.listFolderContinue({ /* ... */ });
```

Source: [`packages/provider/dropbox/src/dropbox.ts`](src/dropbox.ts)

</details>

<details>
<summary><code>POST</code> <b><code>dropbox.files.moveV2</code></b></summary>

<code>POST https://api.dropboxapi.com/2/files/move_v2</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://www.dropbox.com/developers/documentation/http/documentation#files-move_v2)

```typescript
const res = await dropbox.files.moveV2({ /* ... */ });
```

Source: [`packages/provider/dropbox/src/dropbox.ts`](src/dropbox.ts)

</details>

<details>
<summary><code>POST</code> <b><code>dropbox.files.upload</code></b></summary>

<code>POST https://content.dropboxapi.com/2/files/upload</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://www.dropbox.com/developers/documentation/http/documentation#files-upload)

```typescript
const res = await dropbox.files.upload({ /* ... */ });
```

Source: [`packages/provider/dropbox/src/dropbox.ts`](src/dropbox.ts)

</details>

### sharing

<details>
<summary><code>POST</code> <b><code>dropbox.sharing.createSharedLinkWithSettings</code></b></summary>

<code>POST https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://www.dropbox.com/developers/documentation/http/documentation#sharing-create_shared_link_with_settings)

```typescript
const res = await dropbox.sharing.createSharedLinkWithSettings({ /* ... */ });
```

Source: [`packages/provider/dropbox/src/dropbox.ts`](src/dropbox.ts)

</details>

<details>
<summary><code>POST</code> <b><code>dropbox.sharing.listSharedLinks</code></b></summary>

<code>POST https://api.dropboxapi.com/2/sharing/list_shared_links</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://www.dropbox.com/developers/documentation/http/documentation#sharing-list_shared_links)

```typescript
const res = await dropbox.sharing.listSharedLinks({ /* ... */ });
```

Source: [`packages/provider/dropbox/src/dropbox.ts`](src/dropbox.ts)

</details>

### users

<details>
<summary><code>POST</code> <b><code>dropbox.users.getCurrentAccount</code></b></summary>

<code>POST https://api.dropboxapi.com/2/users/get_current_account</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://www.dropbox.com/developers/documentation/http/documentation#users-get_current_account)

```typescript
const res = await dropbox.users.getCurrentAccount({ /* ... */ });
```

Source: [`packages/provider/dropbox/src/dropbox.ts`](src/dropbox.ts)

</details>

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
