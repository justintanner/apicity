# @apicity/free-media-upload

[![npm](https://img.shields.io/npm/v/@apicity/free-media-upload?color=cb0000)](https://www.npmjs.com/package/@apicity/free-media-upload)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)

Zero-auth file hosting wrapper for catbox, gofile, uguu, filebin, litterbox, tempsh, tflink, and tmpfiles — eight providers behind one typed surface.

## Installation

```bash
npm install @apicity/free-media-upload
# or
pnpm add @apicity/free-media-upload
```

## Quick Start

```typescript
import { free-media-upload as createFree-media-upload } from "@apicity/free-media-upload";

const free-media-upload = createFree-media-upload({ apiKey: process.env.FREE-MEDIA-UPLOAD_API_KEY! });
```

## Real-world example: race a portrait across four free hosts

`@apicity/free-media-upload` wraps eight zero-auth, no-account file-hosting endpoints
behind one typed surface — the win is being able to fan the same `Blob`
out to multiple hosts in parallel, then pick whichever URL came back
first (or any survivor) without rewriting four different multipart
callers. The snippet below uploads a single 84 KB JPEG to the four
richest response shapes — catbox (plain string), gofile (rich bundle
metadata), uguu (random-rename + dupe detection), filebin (md5/sha256 +
expiry) — and shows how to normalise them under one `toUrl()` helper.

Every URL, byte count, and hash below is mined verbatim from
[`tests/recordings/free_2578706139/`](../../../tests/recordings/free_2578706139/),
replayed by
[`tests/integration/free-catbox.test.ts`](../../../tests/integration/free-catbox.test.ts),
[`tests/integration/free-gofile.test.ts`](../../../tests/integration/free-gofile.test.ts),
[`tests/integration/free-uguu.test.ts`](../../../tests/integration/free-uguu.test.ts),
[`tests/integration/free-filebin.test.ts`](../../../tests/integration/free-filebin.test.ts),
and [`tests/integration/free-litterbox.test.ts`](../../../tests/integration/free-litterbox.test.ts).

```typescript
import { readFileSync } from "node:fs";
import { freeMediaUpload as createFreeMediaUpload } from "@apicity/free-media-upload";
import type { GofileUploadResponse, UguuUploadResponse, FilebinUploadResponse } from "@apicity/free-media-upload";

// 1. The factory takes no api key — every host below is genuinely
//    auth-free and account-free. Pass `{ timeout: 60_000 }` or a
//    custom `fetch` if you need to override the defaults.
const freeMediaUpload = createFreeMediaUpload();

const bytes = readFileSync("./cat1.jpg"); // 83,558 bytes
const file = new Blob([bytes], { type: "image/jpeg" });

// 2. Race four hosts in parallel via Promise.all. Each returns a
//    different shape: catbox/litterbox/tempsh hand back a plain
//    `string` URL, gofile/tflink return a metadata bundle, uguu's
//    payload nests under `files[]`, and filebin splits things into
//    `bin` + `file` blocks. The factory keeps these distinctions in
//    the type system so the destructure below is statically checked.
const [catboxUrl, gofile, uguu, filebin] = (await Promise.all([
  free.catbox.upload({ file, filename: "cat1.jpg" }),
  free.gofile.upload({ file, filename: "cat1.jpg" }),
  free.uguu.upload({ file, filename: "cat1.jpg" }),
  free.filebin.upload({ file, filename: "cat1.jpg", bin: "apicity-test-img" }),
])) as [string, GofileUploadResponse, UguuUploadResponse, FilebinUploadResponse];

// 3. catbox is the simplest UX: text/plain response, just the URL,
//    permanent until the operator deletes it. Good for a 'host once,
//    forget' public asset.
console.log(catboxUrl);
// → "https://files.catbox.moe/0ufdor.jpg"

// 4. gofile is the only host that gives you a sharable download page
//    (suitable for human consumption) plus a CDN-direct id you can use
//    to build APIs against. The `parentFolderCode` is a 6-char folder
//    handle — every upload lands in a fresh anonymous folder unless
//    you authenticate.
console.log(gofile.data.downloadPage);
// → "https://gofile.io/d/hmoMxW"
console.log(gofile.data.id, gofile.data.md5, gofile.data.size);
// → "a7feccb4-96b4-4b2c-923a-832106388ad6" "391a26048ce697ba072acd83209923f7" 83558

// 5. uguu rewrites filenames to a random 8-char slug to stop URL
//    enumeration, and tells you whether your bytes were already on
//    the host (`dupe: true`) so you can skip a re-upload next time.
//    Note the `files[]` array — uguu accepts batched uploads via the
//    same endpoint, even though @apicity/free-media-upload only ships single-file.
console.log(uguu.files[0].url, uguu.files[0].dupe);
// → "https://n.uguu.se/GeNMsbBp.jpg" false

// 6. filebin verifies content integrity for you — it returns both
//    md5 and sha256, plus an expiry. The `bin` is a namespace you can
//    re-upload into to grow a multi-file bundle (omit `bin` and you
//    get an auto-generated one). Files in a bin expire together on
//    `bin.expired_at`.
console.log(filebin.file.md5, filebin.file.sha256);
// → "ORomBIzml7oHKs2DIJkj9w==" "561dbe5dcd0c931cd3b41705ebe00df9181560967cea8b17128373a06ab911a3"
console.log(`bin "${filebin.bin.id}" expires ${filebin.bin.expired_at}`);
// → 'bin "apicity-test-img" expires 2026-04-23T07:19:25.458442Z'

// 7. Hosts that return strings already give you a URL; hosts that
//    return JSON bury it under different keys. A tiny normaliser lets
//    downstream code stop caring which host won the race.
function toUrl(
  res: string | GofileUploadResponse | UguuUploadResponse | FilebinUploadResponse,
  bin?: string,
  filename?: string,
): string {
  if (typeof res === "string") return res;
  if ("data" in res) return res.data.downloadPage;       // gofile
  if ("files" in res) return res.files[0].url;           // uguu
  return `https://filebin.net/${bin}/${filename}`;       // filebin
}

console.log([
  toUrl(catboxUrl),
  toUrl(gofile),
  toUrl(uguu),
  toUrl(filebin, "apicity-test-img", "cat1.jpg"),
]);
// → [
//     "https://files.catbox.moe/0ufdor.jpg",
//     "https://gofile.io/d/hmoMxW",
//     "https://n.uguu.se/GeNMsbBp.jpg",
//     "https://filebin.net/apicity-test-img/cat1.jpg",
//   ]
```

### Failover across ephemeral hosts

When you only need a URL to live for a few hours — typically because a
downstream model is about to GET it once and then forget — `@apicity/free-media-upload`
ships a `uploadToAnyHost` helper that walks a randomised host list and
returns the first successful URL, raising a single `FreeMediaUploadError` only if
every host fails. Useful when one provider is flaky (uguu's CDN can 502
during traffic spikes) but you don't care which one wins.

```typescript
import { free as createFree, uploadToAnyHost, FreeMediaUploadError } from "@apicity/free-media-upload";

const freeMediaUpload = createFreeMediaUpload();
const file = new Blob([bytes], { type: "image/jpeg" });

// litterbox accepts a TTL; uguu and tflink are best-effort permanent.
// uploadToAnyHost shuffles the list and tries each host sequentially,
// so a single 502 from uguu falls through to tflink without your code
// ever seeing it. The returned URL is already normalised — string in,
// string out, regardless of which host responded.
try {
  const url = await uploadToAnyHost(free, {
    file,
    filename: "cat1.jpg",
    hosts: ["litterbox", "uguu", "tflink"],
    time: "12h", // forwarded to litterbox if it wins the shuffle
  });
  console.log(url);
  // → "https://litter.catbox.moe/04obtk.jpg"  // example: litterbox won
} catch (err) {
  if (err instanceof FreeMediaUploadError) {
    // err.body.failures is a string[] of `<host>: <message>` lines —
    // useful for surfacing exactly which hosts misbehaved.
    console.error(err.status, err.body);
  }
}
```

**Notes**

- All eight endpoints take `{ file: Blob, filename?: string }`. catbox
  and litterbox respond with `text/plain` (the URL itself); tmpfiles,
  uguu, gofile, filebin, and tflink return JSON; tempsh returns plain
  text. The factory parses each correctly so you never see the raw
  body — just the typed shape.
- `litterbox.upload` is the only endpoint with a `time` field —
  `"1h" | "12h" | "24h" | "72h"`. Anything longer than 72h needs the
  permanent-host siblings (catbox, gofile, filebin).
- `filebin.upload` is the odd one out: it's a binary `POST` (no
  multipart wrapper), so the `Blob` goes on the wire as-is and the
  server treats `<bin>/<filename>` as the upload target. Re-uploading
  to the same `bin` adds the file to the bundle rather than replacing
  it; pre-create a stable `bin` slug to grow a multi-file collection.
- gofile's `guestToken` is the closest thing this provider has to an
  auth handle — save it if you want to delete the upload later via
  the gofile API. Without it, anonymous uploads are write-only.
- Every endpoint exposes a Zod schema:
  `free.catbox.upload.schema.safeParse(input)` validates the payload
  before the network call, which catches the most common mistake
  (passing a `Buffer` or `string` instead of a `Blob`).
- All endpoints accept an `AbortSignal` second argument and compose
  with `withRetry` / `withFallback` from `@apicity/free-media-upload`'s middleware
  re-exports — useful for ride-out 429s on uguu or chaining gofile →
  catbox as a fallback pair.
- Errors throw `FreeMediaUploadError` with `status` and the parsed body attached:
  `try { ... } catch (e) { if (e instanceof FreeMediaUploadError) console.error(e.status, e.body); }`.

## API Reference

8 endpoints across 8 groups. Each method mirrors an upstream URL path.

### catbox

<details>
<summary><code>POST</code> <b><code>free-media-upload.catbox.upload</code></b></summary>

<code>POST https://catbox.moe/user/api.php</code>

[Upstream docs ↗](https://catbox.moe/tools.php)

```typescript
const res = await free-media-upload.catbox.upload({ /* ... */ });
```

Source: [`packages/provider/free-media-upload/src/freeMediaUpload.ts`](src/freeMediaUpload.ts)

</details>

### filebin

<details>
<summary><code>POST</code> <b><code>free-media-upload.filebin.upload</code></b></summary>

<code>POST https://filebin.net/{bin}/{filename}</code>

[Upstream docs ↗](https://filebin.net/)

```typescript
const res = await free-media-upload.filebin.upload({ /* ... */ });
```

Source: [`packages/provider/free-media-upload/src/freeMediaUpload.ts`](src/freeMediaUpload.ts)

</details>

### gofile

<details>
<summary><code>POST</code> <b><code>free-media-upload.gofile.upload</code></b></summary>

<code>POST https://upload.gofile.io/uploadfile</code>

[Upstream docs ↗](https://gofile.io/api)

```typescript
const res = await free-media-upload.gofile.upload({ /* ... */ });
```

Source: [`packages/provider/free-media-upload/src/freeMediaUpload.ts`](src/freeMediaUpload.ts)

</details>

### litterbox

<details>
<summary><code>POST</code> <b><code>free-media-upload.litterbox.upload</code></b></summary>

<code>POST https://litterbox.catbox.moe/resources/internals/api.php</code>

[Upstream docs ↗](https://litterbox.catbox.moe/)

```typescript
const res = await free-media-upload.litterbox.upload({ /* ... */ });
```

Source: [`packages/provider/free-media-upload/src/freeMediaUpload.ts`](src/freeMediaUpload.ts)

</details>

### tempsh

<details>
<summary><code>POST</code> <b><code>free-media-upload.tempsh.upload</code></b></summary>

<code>POST https://temp.sh/upload</code>

[Upstream docs ↗](https://temp.sh/)

```typescript
const res = await free-media-upload.tempsh.upload({ /* ... */ });
```

Source: [`packages/provider/free-media-upload/src/freeMediaUpload.ts`](src/freeMediaUpload.ts)

</details>

### tflink

<details>
<summary><code>POST</code> <b><code>free-media-upload.tflink.upload</code></b></summary>

<code>POST https://tmpfile.link/api/upload</code>

[Upstream docs ↗](https://tmpfile.link/)

```typescript
const res = await free-media-upload.tflink.upload({ /* ... */ });
```

Source: [`packages/provider/free-media-upload/src/freeMediaUpload.ts`](src/freeMediaUpload.ts)

</details>

### tmpfiles

<details>
<summary><code>POST</code> <b><code>free-media-upload.tmpfiles.api.v1.upload</code></b></summary>

<code>POST https://tmpfiles.org/api/v1/upload</code>

[Upstream docs ↗](https://tmpfiles.org/)

```typescript
const res = await free-media-upload.tmpfiles.api.v1.upload({ /* ... */ });
```

Source: [`packages/provider/free-media-upload/src/freeMediaUpload.ts`](src/freeMediaUpload.ts)

</details>

### uguu

<details>
<summary><code>POST</code> <b><code>free-media-upload.uguu.upload</code></b></summary>

<code>POST https://uguu.se/upload</code>

[Upstream docs ↗](https://uguu.se/)

```typescript
const res = await free-media-upload.uguu.upload({ /* ... */ });
```

Source: [`packages/provider/free-media-upload/src/freeMediaUpload.ts`](src/freeMediaUpload.ts)

</details>

## Middleware

```typescript
import { free-media-upload as createFree-media-upload, withRetry } from "@apicity/free-media-upload";

const free-media-upload = createFree-media-upload({ apiKey: process.env.FREE-MEDIA-UPLOAD_API_KEY! });
const models = withRetry(free-media-upload.get.v1.models, { retries: 3 });
```

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
