---
name: apicity
description: |
  Call any supported provider API (OpenAI, Anthropic, xAI, fal, KIE, ElevenLabs,
  S3, Telegram, Polymarket and 19 more) through the apicity CLI. Use for ANY
  task that needs a provider API: generation, upload, lookup, posting, trading
  data, or checking what an endpoint expects.
triggers:
  - apicity
  - /apicity
  - apicity commands
  - apicity describe
  - apicity providers
  - apicity doctor
  - call a provider api
  - generate an image or video
  - text to speech
  - upload a file
  - post to telegram
  - post to x
---

# apicity — one command line for 28 provider APIs

`apicity` calls any endpoint of any supported provider. There is no tool list to
load and no catalog to memorise: three offline commands discover what exists,
and every endpoint is then addressed the same way.

```bash
apicity providers                          # who exists, and what is configured
apicity commands --provider anthropic      # that provider's endpoints
apicity describe anthropic v1.messages     # one endpoint, in full
apicity anthropic v1.messages --data '{"model":"claude-sonnet-4-5","max_tokens":1024,"messages":[{"role":"user","content":"hi"}]}'
```

The shape never changes: **`apicity <provider> <dotPath> [flags]`**, where
`<dotPath>` mirrors the upstream URL path (`/v1/chat/completions` is
`v1.chat.completions`, `/api/v1/common/download-url` is
`api.v1.common.downloadUrl`).

## Agent Invariants

**MUST follow these rules:**

1. **Never print, request, or read credentials.** Do not `cat` a `.env` file,
   do not echo `$OPENAI_API_KEY` or any other variable's value, do not run
   `op read`, and never put a key in a command line, a log, a commit, or a
   message. `apicity` reads its own credentials from the environment; your job
   is to call the endpoint, not to handle the secret. Naming a variable is
   fine, printing its value never is.
2. **Never mint an OTP and never ask for the pay-gate secret.** Paid endpoints
   are gated by a one-time token a human operator mints out of band. If a call
   answers `paygate`, report that it needs an operator-minted `--otp` and stop.
   Do not read the secret file, do not run the minting command, do not retry.
3. **Prefer `--json`.** It selects the machine envelope on every command, so
   you parse one predictable document instead of a rendered table. Add
   `--quiet` when you want the data with no envelope around it.
4. **Discover before calling.** `apicity providers`, then
   `apicity commands --provider <provider> --json`, then
   `apicity describe <provider> <dotPath> --json`. All three are offline: they
   read a generated catalog, need no credential, and cost nothing. Never guess
   a dotPath — if `describe` says `not_found`, list the provider's commands.
5. **Treat exit 3 and exit 4 as blocked.** `auth` (3) means the credential is
   missing or rejected; `forbidden` and `paygate` (4) mean it is valid but not
   allowed to make this call. Report the block, name what the operator must
   set or mint, and move on. Do not retry, do not hunt for another key, do not
   switch providers to work around a credential you were not given.
6. **Paid endpoints need an operator-minted `--otp`.** `apicity describe` shows
   `paid: true` for exactly these. Say so before spending: state the endpoint
   and that it bills, and pass the `--otp` value the operator gives you.
7. **Never pass `--token`, `--apiKey`, or any credential-shaped flag.** Some
   endpoints carry a credential inside the URL (`bot{token}`, `json/{apiKey}`).
   The provider substitutes those from the configured environment; they are not
   flags, and the CLI rejects them with a `usage` error. Pass only the
   parameters `describe` lists.
8. **Let the CLI save media.** Binary results and media URLs are written to the
   output directory and reported as a path; never pipe bytes through the shell
   or re-download a URL the CLI already saved.

## Output and exit codes

Every invocation prints **exactly one JSON document**, and success and failure
never share a stream: success goes to stdout, failure to stderr.

A **call** answers the success envelope, and so does `skill install`:

```jsonc
// stdout
{ "ok": true, "data": { ... }, "summary": "apicity skill installed" }
```

`summary` appears only where a command has a one-liner. Read the result under
`data`.

The **discovery commands are the exception**: `commands`, `providers` and
`describe` print their document directly with `--json` — an array of rows, or
one endpoint object — with no envelope around it. Read those at the top level,
not under `data`.

```bash
apicity providers --json | jq '.[] | select(.configured) | .provider'
apicity commands --provider kie --json | jq '.[] | select(.paid) | .dotPath'
apicity describe kie api.v1.jobs.createTask --json | jq '.paid'
```

**Failure is always the error envelope**, on stderr, from every command:

```jsonc
// stderr
{
  "ok": false,
  "error": "no endpoint at openai v1.chat.completion",
  "code": "not_found",
  "hint": "run: apicity commands --provider openai",
}
```

`meta` appears only where the failure carries structure — a provider's HTTP
`status`, the `methods` behind an `ambiguous`.

**The envelope is automatic when you are not a terminal.** A piped or captured
stdout selects the machine form on its own, so an agent gets JSON without
asking. `--json` forces it anyway (do pass it: it is explicit, and it also
switches discovery output from a rendered table to JSON). `--quiet` prints the
`data` alone — with `--json` it is one compact line.

**`code` is the contract, not the number.** Branch on `code`; the exit status
is for shells, and several codes share one.

| Exit | Code               | When                                                                                            |
| ---- | ------------------ | ----------------------------------------------------------------------------------------------- |
| 0    | —                  | success                                                                                         |
| 1    | `usage`            | unknown flag, missing `--<param>`, invalid `--data`, missing `--data-file`, refused combination |
| 1    | `skill_unmanaged`  | a skill directory or link apicity did not write occupies the install path                       |
| 2    | `not_found`        | unknown provider or dotPath, or the upstream answered HTTP 404                                  |
| 3    | `auth`             | no credential configured, a 1Password read failed, or the upstream answered HTTP 401            |
| 4    | `forbidden`        | upstream HTTP 403                                                                               |
| 4    | `paygate`          | a paid endpoint was called without a valid `--otp`                                              |
| 5    | `rate_limit`       | upstream HTTP 429                                                                               |
| 6    | `network`          | fetch failure, DNS failure, timeout                                                             |
| 7    | `api`              | any other upstream failure, or a local operational failure such as an unwritable output dir     |
| 7    | `setup_incomplete` | an agent was not detected or a setup step failed                                                |
| 8    | `ambiguous`        | the dotPath carries more than one method and `--method` is absent                               |

Media never comes back as bytes on stdout. A binary result is written to the
output directory and reported as `{"savedTo": "<path>", "bytes": 12345}`; a JSON
result carrying media URLs is returned with a sibling `<key>_savedTo` beside
each one. The directory is `--output-dir`, else `$APICITY_OUTPUT_DIR`, else
`$CLAUDE_PROJECT_DIR`, else the working directory.

## Quick Reference

| Task                                  | Command                                                                                       |
| ------------------------------------- | --------------------------------------------------------------------------------------------- |
| List providers and what is configured | `apicity providers --json`                                                                    |
| List every endpoint                   | `apicity commands --json`                                                                     |
| List one provider's endpoints         | `apicity commands --provider openai --json`                                                   |
| Same, shorthand                       | `apicity openai`                                                                              |
| Describe one endpoint                 | `apicity describe anthropic v1.messages --json`                                               |
| Describe one method of it             | `apicity describe openai v1.chat.completions --method GET --json`                             |
| Describe from the call form           | `apicity openai v1.chat.completions --help`                                                   |
| Call an endpoint                      | `apicity openai v1.embeddings --data '{"model":"text-embedding-3-small","input":"hello"}'`    |
| Call with the body in a file          | `apicity openai v1.embeddings --data-file ./req.json`                                         |
| Call with the body on stdin           | `cat req.json \| apicity openai v1.embeddings --data -`                                       |
| Pass a path or field parameter        | `apicity elevenlabs v1.textToSpeech --voiceId 21m00Tcm4TlvDq8ikWAM --data '{"text":"hello"}'` |
| Choose a method                       | `apicity openai v1.chat.completions --method GET`                                             |
| Save media somewhere                  | `apicity openai v1.audio.speech --data-file ./speech.json --output-dir ./out`                 |
| Call a paid endpoint                  | `apicity kie api.v1.jobs.createTask --otp <token> --data-file ./job.json`                     |
| See the raw HTTP exchange             | `apicity anthropic v1.models.list --verbose`                                                  |
| Explain the envelope                  | `apicity help output`                                                                         |
| Explain the exit codes                | `apicity help exit-codes`                                                                     |
| Explain the environment               | `apicity help environment`                                                                    |
| Guidance for agents                   | `apicity help agents`                                                                         |
| Print this skill                      | `apicity skill`                                                                               |
| Install this skill for your agents    | `apicity skill install`                                                                       |
| Print the version                     | `apicity version`                                                                             |

## Decision Tree

1. **Find the provider.** `apicity providers --json` answers every provider,
   its credential variable names, and whether it is configured. Unconfigured
   providers still describe; they just cannot be called.
2. **Find the endpoint.** `apicity commands --provider <provider> --json`. Each
   row carries `method`, `dotPath`, `pathParams`, `requestParams`, `paid` and
   `configured`. Search that list rather than guessing a name.
3. **Describe it.** `apicity describe <provider> <dotPath> --json` adds the
   request JSON Schema, a recorded example payload when one exists, and the
   call shape. Read `pathParams` and `requestParams`: both are passed as
   `--<name>` flags, and everything else belongs in `--data`.
4. **Call it.** `apicity <provider> <dotPath> [--<param> <value>] --data '{…}'`.
   If the dotPath answers more than one method you get `ambiguous` (8) until
   you add `--method`.
5. **Read the result.** On a call, `data` holds the provider's response (the
   discovery commands print theirs unwrapped). Media is already on disk — use
   the `savedTo` path or the `<key>_savedTo` sibling rather than fetching the
   URL again.

If a step fails, the `code` tells you which step to go back to: `not_found`
sends you to step 2, `ambiguous` to `--method`, `usage` to step 3, and `auth`
or `paygate` stops the task with a report.

## Provider Reference

One entry per provider. The invocations are real catalog rows; run
`apicity commands --provider <provider> --json` for the rest, and
`apicity describe` before filling in a payload.

### openai — chat, images, audio, embeddings, files, batches

`v1.chat.completions` answers DELETE, GET and POST, so a call names one.

```bash
apicity openai v1.chat.completions --method POST --data '{"model":"gpt-5","messages":[{"role":"user","content":"Summarise this."}]}'
apicity openai v1.images.generations --data '{"model":"gpt-image-1","prompt":"a red bicycle"}'
apicity openai v1.audio.speech --data '{"model":"gpt-4o-mini-tts","voice":"alloy","input":"Good morning."}'
```

### anthropic — messages, batches, files, models, skills

```bash
apicity anthropic v1.messages --data '{"model":"claude-sonnet-4-5","max_tokens":1024,"messages":[{"role":"user","content":"Draft a reply."}]}'
apicity anthropic v1.models.list --json
apicity anthropic v1.messages.countTokens --data '{"model":"claude-sonnet-4-5","messages":[{"role":"user","content":"How long is this?"}]}'
```

### xai — Grok chat, images, video, collections, batches

Image and video generation here are **paid**: they need `--otp`.

```bash
apicity xai v1.chat.completions --data '{"model":"grok-4","messages":[{"role":"user","content":"What changed today?"}]}'
apicity xai v1.languageModels --json
apicity xai v1.images.generations --otp <token> --data '{"model":"grok-2-image","prompt":"a lighthouse at dusk"}'
```

### fal — hosted model endpoints, queue, pricing and usage

```bash
apicity fal v1.models.pricing --json
apicity fal veo3p1.textToVideo --data '{"prompt":"a paper plane over a city"}'
apicity fal v1.models.usage --json
```

### kie — video, image, audio and music generation

Most generation rows here are **paid**: create a task, then poll it.

```bash
apicity kie api.v1.jobs.createTask --otp <token> --data-file ./job.json
apicity kie api.v1.jobs.recordInfo --taskId <taskId> --json
apicity kie api.v1.chat.credit --json
```

### google — Gemini generateContent (express mode)

```bash
apicity google v1.publishers.google.models.generateContent --model gemini-2.5-flash --data '{"contents":[{"role":"user","parts":[{"text":"Hello"}]}]}'
apicity google v1.publishers.google.models.countTokens --model gemini-2.5-flash --data '{"contents":[{"role":"user","parts":[{"text":"Hello"}]}]}'
```

### googleflow — Google Flow video and image jobs

```bash
apicity googleflow v1.videos --data '{"prompt":"a slow pan over rooftops"}'
apicity googleflow v1.jobs.retrieve --jobId <jobId> --json
apicity googleflow v1.images --data '{"prompt":"a cat wearing sunglasses"}'
```

### fireworks — open-model inference, audio, deployments, training

```bash
apicity fireworks inference.v1.chat.completions --data '{"model":"accounts/fireworks/models/kimi-k2-instruct","messages":[{"role":"user","content":"hi"}]}'
apicity fireworks inference.v1.embeddings --data '{"model":"nomic-ai/nomic-embed-text-v1.5","input":"hello"}'
apicity fireworks inference.v1.audio.transcriptions --data-file ./audio.json
```

### alibaba — Qwen chat, image and video generation

```bash
apicity alibaba compatibleMode.v1.chat.completions --data '{"model":"qwen3-max","messages":[{"role":"user","content":"hi"}]}'
apicity alibaba api.v1.services.aigc.imageGeneration.generation --data-file ./image.json
apicity alibaba api.v1.tasks --taskId <taskId> --json
```

### kimicoding — Kimi coding-plan chat, messages, embeddings

```bash
apicity kimicoding coding.v1.messages --data '{"model":"kimi-k2-thinking","max_tokens":1024,"messages":[{"role":"user","content":"Explain this stack trace."}]}'
apicity kimicoding coding.v1.models --json
```

### zaicoding — Z.ai coding-plan chat and usage

```bash
apicity zaicoding api.coding.paas.v4.chat.completions --data '{"model":"glm-4.6","messages":[{"role":"user","content":"hi"}]}'
apicity zaicoding api.monitor.usage.quota.limit --json
```

### elevenlabs — text to speech, sound effects, voices, transcription

```bash
apicity elevenlabs v1.textToSpeech --voiceId 21m00Tcm4TlvDq8ikWAM --data '{"text":"Your build is green.","model_id":"eleven_multilingual_v2"}'
apicity elevenlabs v1.soundGeneration --data '{"text":"distant thunder"}'
apicity elevenlabs v1.voices.list --json
```

### s3 — any S3-compatible object storage

`bucket` and `key` are request fields, so they are flags.

```bash
apicity s3 buckets.list --json
apicity s3 objects.put --bucket my-bucket --key reports/q3.pdf --data-file ./upload.json
apicity s3 objects.get --bucket my-bucket --key reports/q3.pdf --output-dir ./out
```

### b2 — Backblaze B2 through its S3-compatible API

```bash
apicity b2 buckets.list --json
apicity b2 objects.put --bucket my-bucket --key clips/take-1.mp4 --data-file ./upload.json
```

### dropbox — files, folders and shared links

```bash
apicity dropbox files.listFolder --data '{"path":""}'
apicity dropbox files.upload --data-file ./upload.json
apicity dropbox sharing.createSharedLinkWithSettings --data '{"path":"/reports/q3.pdf"}'
```

### free-media-upload — anonymous file hosts, no credential

Useful when a provider needs a public URL for a local file.

```bash
apicity free-media-upload tmpfiles.api.v1.upload --data-file ./upload.json
apicity free-media-upload catbox.upload --data-file ./upload.json
apicity free-media-upload litterbox.upload --data-file ./upload.json
```

### telegram — send messages, photos, video and audio from a bot

The `{token}` in the URL is supplied from the environment. Never pass it.

```bash
apicity telegram sendMessage --data '{"chat_id":123456789,"text":"Deploy finished."}'
apicity telegram sendPhoto --data '{"chat_id":123456789,"photo":"https://example.com/chart.png"}'
apicity telegram sendVideo --data '{"chat_id":123456789,"video":"https://example.com/clip.mp4"}'
```

### x — post to X, upload media, read the authenticated user

```bash
apicity x v2.users.me --json
apicity x v2.tweets --data '{"text":"Shipping today."}'
apicity x v2.media.upload.initialize --data '{"media_type":"video/mp4","total_bytes":1048576}'
```

### meta — post Instagram reels through the public-URL flow

```bash
apicity meta v25.media --igUserId <igUserId> --data '{"media_type":"REELS","video_url":"https://example.com/clip.mp4"}'
apicity meta v25.mediaPublish --igUserId <igUserId> --data '{"creation_id":"<containerId>"}'
apicity meta v25.container --containerId <containerId> --json
```

### youtube — upload videos and read channel data

```bash
apicity youtube videos.insert --data-file ./video.json
apicity youtube videos.list --data '{"part":"snippet,statistics","id":"<videoId>"}'
apicity youtube channels.list --data '{"part":"snippet","mine":true}'
```

### quo — business text messaging

```bash
apicity quo v1.messages --data '{"to":"+15555550123","body":"Your order is ready."}'
```

### binance — public spot market data, no credential

```bash
apicity binance api.v3.ticker.price --data '{"symbol":"BTCUSDT"}'
apicity binance api.v3.klines --data '{"symbol":"BTCUSDT","interval":"1h","limit":24}'
apicity binance api.v3.depth --data '{"symbol":"ETHUSDT","limit":50}'
```

### polymarket — prediction-market data and CLOB trading

Public market data needs no credential; trading needs the CLOB bundle.

```bash
apicity polymarket gamma.markets --json
apicity polymarket clob.book --data '{"token_id":"<tokenId>"}'
apicity polymarket data.trades --data '{"limit":20}'
```

### simplefunctions — market, portfolio and news data

```bash
apicity simplefunctions api.public.markets --json
apicity simplefunctions api.public.market.candles --data '{"marketId":"<marketId>"}'
apicity simplefunctions api.x.news --json
```

### dolthub — run SQL against a Dolt database

```bash
apicity dolthub api.v2.databases.sql.read --owner dolthub --database SHAQ --data '{"q":"select 1"}'
apicity dolthub api.v2.databases.sql.write --owner me --database mydb --data '{"q":"insert into t values (1)"}'
apicity dolthub api.v2.user.get --json
```

### openligadb — German football fixtures, tables and scorers

```bash
apicity openligadb getmatchdata.byLeagueSeason --leagueShortcut bl1 --leagueSeason 2025
apicity openligadb getbltable --leagueShortcut bl1 --leagueSeason 2025
apicity openligadb getgoalgetters --leagueShortcut bl1 --leagueSeason 2025
```

### openf1 — Formula 1 timing, telemetry and session data

```bash
apicity openf1 v1.sessions --data '{"year":2025}'
apicity openf1 v1.drivers --data '{"session_key":"latest"}'
apicity openf1 v1.laps --data '{"session_key":"latest","driver_number":1}'
```

### thesportsdb — teams, leagues, events and results

The `{apiKey}` is part of the URL and is supplied for you.

```bash
apicity thesportsdb v1.lookup.team --data '{"id":"133604"}'
apicity thesportsdb v1.lookup.table --data '{"l":"4328","s":"2025-2026"}'
apicity thesportsdb v1.eventsnext --data '{"id":"133604"}'
```

## Credentials and configuration

Credentials are the operator's, not yours. `apicity` resolves them itself, in
this order, for the addressed provider only:

1. variables already set in the environment;
2. an env file — `--env-file <path>`, else `$APICITY_ENV_FILE`, else
   `~/.config/apicity/.env` when it exists;
3. 1Password, when both `--op-vault <vault>` and `--op-token <token>` (or
   `$APICITY_OP_VAULT` and `$APICITY_OP_SERVICE_TOKEN`) are configured.

`apicity providers --json` reports which providers are configured, by variable
**name**, and `apicity doctor` checks the whole setup. Neither prints a value,
and neither should you.

Other variables the CLI reads: `$APICITY_OUTPUT_DIR` and `$CLAUDE_PROJECT_DIR`
(where media lands), `$APICITY_PAYGATE_SECRET_FILE` (the operator's pay-gate
secret — never read it yourself). `apicity help environment` lists them.

| Provider            | Credential variables (names only)                                                                                                                                                                                                       |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openai`            | `OPENAI_API_KEY`                                                                                                                                                                                                                        |
| `xai`               | `XAI_API_KEY`                                                                                                                                                                                                                           |
| `anthropic`         | `ANTHROPIC_API_KEY`                                                                                                                                                                                                                     |
| `fireworks`         | `FIREWORKS_API_KEY`                                                                                                                                                                                                                     |
| `fal`               | `FAL_API_KEY`                                                                                                                                                                                                                           |
| `google`            | `GOOGLE_API_KEY`                                                                                                                                                                                                                        |
| `googleflow`        | `GOOGLE_FLOW_API_KEY`                                                                                                                                                                                                                   |
| `dolthub`           | `DOLTHUB_API_KEY`                                                                                                                                                                                                                       |
| `dropbox`           | `DROPBOX_OAUTH_TOKEN`                                                                                                                                                                                                                   |
| `simplefunctions`   | `SIMPLEFUNCTIONS_API_KEY` (optional; public rows work without it)                                                                                                                                                                       |
| `kie`               | `KIE_API_KEY`                                                                                                                                                                                                                           |
| `kimicoding`        | `KIMI_CODING_API_KEY`                                                                                                                                                                                                                   |
| `alibaba`           | `DASHSCOPE_API_KEY`                                                                                                                                                                                                                     |
| `zaicoding`         | `ZAI_CODING_PLAN_API_KEY`                                                                                                                                                                                                               |
| `binance`           | none — public market data                                                                                                                                                                                                               |
| `openligadb`        | none — public data                                                                                                                                                                                                                      |
| `openf1`            | none — public data                                                                                                                                                                                                                      |
| `elevenlabs`        | `ELEVENLABS_API_KEY`                                                                                                                                                                                                                    |
| `s3`                | `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`                                                                                                                                                                                              |
| `b2`                | `B2_ACCESS_KEY_ID`, `B2_SECRET_ACCESS_KEY`, `B2_REGION`                                                                                                                                                                                 |
| `x`                 | `X_ACCESS_TOKEN`                                                                                                                                                                                                                        |
| `meta`              | `IG_ACCESS_TOKEN`                                                                                                                                                                                                                       |
| `polymarket`        | none for public data; trading needs `POLYMARKET_CLOB_API_KEY`, `POLYMARKET_CLOB_API_SECRET`, `POLYMARKET_CLOB_API_PASSPHRASE`, `POLYMARKET_ADDRESS`, `POLYMARKET_PRIVATE_KEY`, `POLYMARKET_FUNDER_ADDRESS`, `POLYMARKET_SIGNATURE_TYPE` |
| `free-media-upload` | none — anonymous hosts                                                                                                                                                                                                                  |
| `youtube`           | `YOUTUBE_ACCESS_TOKEN` (optional; public reads work without it)                                                                                                                                                                         |
| `telegram`          | `TELEGRAM_BOT_KEY`                                                                                                                                                                                                                      |
| `quo`               | `QUO_API_KEY`                                                                                                                                                                                                                           |
| `thesportsdb`       | `THESPORTSDB_API_KEY` (optional; the free tier works without it)                                                                                                                                                                        |

## Paid endpoints

A small set of endpoints bills real money — media generation on `kie` and image
and video generation on `xai`. The set is read at runtime, so trust the CLI
rather than this list:

```bash
apicity describe kie api.v1.jobs.createTask --json   # "paid": true
apicity commands --provider xai --json               # each row carries "paid"
```

Calling one without a valid one-time token fails closed with `code: "paygate"`
and exit 4. **The operator mints the token; you never do.** They run, once, out
of band:

```bash
apicity-paygate otp mint --secret-file <path> --dot-path <api.path> --payload-file <path>
```

and hand you the token, which you pass unchanged:

```bash
apicity kie api.v1.jobs.createTask --otp <token> --data-file ./job.json
```

The token is bound to that exact payload file, so `--data-file` and `--otp`
travel together: change the payload and the operator has to mint again. If you
have no token, say the call is blocked on an operator-minted OTP and stop —
do not read the secret file, and do not run the minting command yourself.

## Troubleshooting

| Code               | Exit | What to do                                                                                                                       |
| ------------------ | ---- | -------------------------------------------------------------------------------------------------------------------------------- |
| `usage`            | 1    | Read the `hint` — it names the flag. Then `apicity describe <provider> <dotPath> --json` and pass exactly the listed parameters. |
| `not_found`        | 2    | The provider or dotPath does not exist: `apicity commands --provider <provider> --json` and pick the real row.                   |
| `ambiguous`        | 8    | The dotPath answers several methods; add `--method GET` (the `hint` and `meta.methods` list them).                               |
| `auth`             | 3    | Blocked. Report which variable the operator must set; never look for the key yourself.                                           |
| `forbidden`        | 4    | The credential is valid but not allowed this call. Report it; do not retry.                                                      |
| `paygate`          | 4    | Paid endpoint without a valid `--otp`. Ask the operator to mint one.                                                             |
| `rate_limit`       | 5    | Wait out the provider's window, then retry once. Do not loop.                                                                    |
| `network`          | 6    | The request never landed. Retry once; if it persists, report it with the `error` text.                                           |
| `api`              | 7    | The upstream failed, or a local step did. `meta.status` carries the HTTP status when there was one.                              |
| `setup_incomplete` | 7    | A package or agent is missing; the `hint` names the step to run.                                                                 |
| `skill_unmanaged`  | 1    | Something apicity did not write occupies the skill path. Report it; do not delete the user's files.                              |

Other things worth knowing:

- **`--verbose` prints the HTTP exchange to stderr** without touching the
  document on stdout, which is the fastest way to see what a provider actually
  received.
- **A missing parameter is a `usage` error, not a silent default.** The hint
  distinguishes the two kinds: `--taskId is required (path parameter {taskId})`
  versus `--bucket is required (request field bucket)`.
- **`--data`, `--data-file` and `--data -` are alternatives**, and flags merge
  over the body: `--bucket x` and `--data '{"bucket":"x"}'` are the same
  request.
- **Media is already saved.** Use the `savedTo` path or the `<key>_savedTo`
  sibling; re-downloading the URL wastes a round trip and can fail, because
  many providers expire those links within hours.
- **Nothing reads stdin except `--data -`**, so a command never hangs waiting
  for input.
