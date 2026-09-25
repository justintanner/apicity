# @apicity/cli

One command per upstream endpoint, for every `@apicity/*` provider package —
plus the agent skill that teaches a coding agent to find and call them.

The endpoint list is the monorepo's `scripts/endpoint-docs.tsv` (bundled as
`dist/endpoint-docs.tsv` for installed users), so the command surface stays in
lockstep with the providers: no curated subset, no new abstractions.

Renamed from `@apicity/mcp-server`. MCP support was removed in September 2026;
[MCP.md](../../MCP.md) is the migration note.

## Install

```bash
npm install -g @apicity/cli
# or run it without installing
npx -y @apicity/cli@latest commands --provider openai
```

Use `@latest` with `npx`; bare `npx -y @apicity/cli` can reuse an older cached
package that does not know newer flags. Node.js 20 or newer.

## Calling an endpoint

```text
apicity <provider> <dotPath> [--method M] [--<param> <value>…] [--data <json>] [global flags]
```

`<dotPath>` is the endpoint's path in the provider tree, exactly as
`scripts/endpoint-docs.tsv` and the provider READMEs spell it:

```bash
apicity xai v1.tokenizeText --data '{"model":"grok-3","text":"Hello, world!"}'
apicity openai v1.models --method GET
apicity binance api.v3.time
```

Discovery comes first and costs nothing — no credential, no network, no
provider package loaded:

```bash
apicity providers                     # every provider, its env vars, whether set
apicity commands --provider openligadb # that provider's endpoints
apicity describe xai v1.tokenizeText  # one endpoint: schema, example, call shape
apicity xai v1.tokenizeText --help    # the same description, from the call form
```

A dotPath that carries more than one HTTP method exits `ambiguous` (8) until
`--method` picks one. `apicity <provider>` on its own is shorthand for
`apicity commands --provider <provider>`.

### Parameters: three kinds, one grammar

Every value is passed as `--<name> <value>` (or `--<name>=<value>`), and what
the CLI does with it comes from the generated call-shape table, never from the
URL:

- **Path parameters** are passed to the endpoint function as arguments.
  `apicity describe` lists them as `pathParams`.

  ```bash
  apicity openai v1.files.content --method GET --id file-abc123
  ```

- **Request fields** are merged into the request object, so a flag and `--data`
  are interchangeable. `apicity describe` lists them as `requestParams`.

  ```bash
  apicity s3 objects.get --bucket my-bucket --key photo.png
  apicity s3 objects.get --data '{"bucket":"my-bucket","key":"photo.png"}'
  ```

- **Provider-supplied placeholders** are not flags at all. Telegram's
  `{token}` and thesportsdb's `{apiKey}` are substituted by the factory from
  the credential, so naming one is a usage error rather than a token silently
  forwarded or ignored.

Both spellings of a name work: the URL's placeholder (`--vector_store_id`) and
the property the endpoint declares (`--vectorStoreId`).

### The request body

`--data '<json>'`, `--data-file <path>`, or `--data -` to read stdin — that
last one is the only stdin the CLI ever reads, and nothing prompts. Passing
both `--data` and `--data-file` is a usage error, as is a body that is not
valid JSON.

## Global flags

Every flag below works on the **endpoint form**. An endpoint's own parameter
flags come from its call shape, so a provider that ships a `--json` parameter
tomorrow cannot collide with this table.

The built-ins read their own smaller sets, because each has argv the shared
table has no business interpreting: `commands`, `describe` and `providers` take
`--json` and `--quiet` plus `--provider` and `--method`, and `--env-file`,
`--op-vault` and `--op-token`, which decide what they count as configured;
`skill`, `setup` and `doctor` take `--json` and `--remove`, and
`setup 1password` also `--no-verify`. Passing one of the flags below to a
built-in that does not know it is a usage error (`--verbose needs a value`,
exit 1) rather than a silent no-op, and `doctor` names an argument it ignored
on stderr.

| Flag                           | Description                                                                                                                                                                                     |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--json`                       | Force the machine envelope, even at a terminal. With `--quiet`, force compact JSON.                                                                                                             |
| `--quiet`                      | Print the data alone, without the envelope.                                                                                                                                                     |
| `--verbose`                    | One line per HTTP call on stderr: method, URL, status, elapsed. Never a header or a body.                                                                                                       |
| `--method <M>`                 | Pick one method when a dotPath answers several.                                                                                                                                                 |
| `--data <json>`                | The request body; `-` reads stdin.                                                                                                                                                              |
| `--data-file <path>`           | The request body, read from a file; `-` reads stdin.                                                                                                                                            |
| `--otp <token>`                | A paid endpoint's single-use approval, needed only when the operator armed the gate; refused with no secret ([Paid endpoints](#paid-endpoints)).                                                |
| `--output-dir <path>`          | Where binary results and downloaded media land. Also `APICITY_OUTPUT_DIR`.                                                                                                                      |
| `--env-file <path>`            | Load provider settings from a dotenv file. Set env vars win; `op://` references resolve (see [1Password](#1password)).                                                                          |
| `--op-vault <vault>`           | The vault convention: fill missing credentials from `op://<vault>/<ENV_VAR>/password`. Also `APICITY_OP_VAULT`.                                                                                 |
| `--op-token <token>`           | 1Password service-account token: a literal, `env:VAR`, `$VAR`, or a variable name. It also authenticates `op://` references. `--op-service-token` is an alias. Also `APICITY_OP_SERVICE_TOKEN`. |
| `--paygate-secret-file <path>` | Arms the pay gate: the shared HMAC secret that verifies paid-endpoint OTPs. Unset, the gate is off. Also `APICITY_PAYGATE_SECRET_FILE`.                                                         |
| `--base-url <url>`             | Override the provider's base URL (see the note below).                                                                                                                                          |
| `--timeout <ms>`               | Override the provider's request timeout, in milliseconds.                                                                                                                                       |
| `--help`, `-h`                 | On the endpoint form, describe the endpoint; otherwise print usage.                                                                                                                             |
| `--version`                    | Print the package version.                                                                                                                                                                      |

**`--base-url` and `--timeout` reach the addressed factory, and support is not
uniform.** They are merged into the factory's options as `baseURL` (`baseUrl`
for zaicoding, the one factory that spells it that way) and `timeout` in
milliseconds. A factory that reads neither ignores them silently rather than
failing; a few — alibaba, for one — compose a second upstream base from the
origin of what you pass rather than its whole path; and an endpoint whose
upstream lives on its own host (xai's management API, fireworks' inference
base) keeps that host whatever `--base-url` says. `--verbose` prints the URL
each call actually requested, which is how to check rather than guess.

## Built-in commands

| Command                          | What it does                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `apicity commands`               | Every endpoint, or one provider's with `--provider`. `--json` for a catalog.                                          |
| `apicity describe <p> <dotPath>` | One endpoint: method, URL, docs URL, path parameters, request parameters, whether it is paid, and the request schema. |
| `apicity providers`              | Every provider, the env vars it reads (names only) and whether it is configured.                                      |
| `apicity skill`                  | Print the agent skill this package ships, byte for byte.                                                              |
| `apicity skill install`          | Install that skill into `~/.agents/skills/apicity`. `--remove` undoes it.                                             |
| `apicity setup claude`           | Install the skill and the Claude Code plugin.                                                                         |
| `apicity setup codex`            | Install the skill Codex reads.                                                                                        |
| `apicity setup agents`           | Install the skill; connect an agent when exactly one is unambiguous.                                                  |
| `apicity setup 1password`        | Save `--op-vault` and `--op-token` to the env file and check them once; `--no-verify`, `--remove`.                    |
| `apicity setup`                  | `setup agents`. `--remove` removes the plugin and everything this CLI wrote.                                          |
| `apicity doctor`                 | Twelve rows about this host's install, always exit 0.                                                                 |
| `apicity help [topic]`           | Usage, or one of the topics `output`, `exit-codes`, `environment`, `agents`.                                          |
| `apicity version`                | The package version.                                                                                                  |

## Environment variables

| Variable                      | Effect                                                                     |
| ----------------------------- | -------------------------------------------------------------------------- |
| `APICITY_ENV_FILE`            | The dotenv file to load when `--env-file` is absent.                       |
| `APICITY_OP_VAULT`            | The 1Password vault, as `--op-vault`; `apicity setup 1password` saves it.  |
| `APICITY_OP_SERVICE_TOKEN`    | The 1Password token, as `--op-token`; `apicity setup 1password` saves it.  |
| `APICITY_PAYGATE_SECRET_FILE` | The pay-gate secret file that arms the gate, as `--paygate-secret-file`.   |
| `APICITY_OUTPUT_DIR`          | Where results land, as `--output-dir`.                                     |
| `APICITY_SETUP_AGENT`         | `claude`, `codex`, `all` or `none` — what `apicity setup agents` connects. |
| `CLAUDE_PROJECT_DIR`          | Read by Claude Code sessions; the output directory when nothing else says. |
| Provider variables            | One or more per provider; see [Credentials](#credentials).                 |

With no `--env-file` and no `APICITY_ENV_FILE`, a call loads
`~/.config/apicity/.env` when that file exists. For each variable of the
addressed provider — that provider alone, never all 28 — the first source that
has one wins:

1. a value already set in the environment;
2. a literal in the env file;
3. an `op://` reference, the environment's before the env file's, resolved
   through `op` (see [1Password](#1password));
4. the vault convention, `op://<vault>/<VAR>/password`, when a vault and a
   token are both configured.

## Exit codes

`apicity help exit-codes` prints this table. Branch on the `code` field of the
error envelope rather than on the number: several codes share a status and the
numbers may gain siblings.

```text
code                    exit
0                       0
usage, skill_unmanaged  1
not_found               2
auth                    3
forbidden, paygate      4
rate_limit              5
network                 6
api, setup_incomplete   7
ambiguous               8
```

| `code`             | Raised when                                                                                                                                                                  |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `usage`            | An unknown flag, a missing required `--<param>`, invalid `--data`, an unreadable `--data-file`, or a refused flag combination.                                               |
| `skill_unmanaged`  | A skill directory exists that this CLI did not write, so it will not be overwritten.                                                                                         |
| `not_found`        | An unknown provider, command or dotPath; a `--method` naming a method the dotPath does not answer (exit 2; `hint` lists the methods it does); or upstream answered HTTP 404. |
| `auth`             | The addressed provider has no credential configured, a 1Password read failed, or upstream answered HTTP 401.                                                                 |
| `forbidden`        | Upstream answered HTTP 403.                                                                                                                                                  |
| `paygate`          | The operator's armed gate refused a missing, malformed, expired, mismatched or replayed OTP, or an `--otp` reached a host with no secret. Its code is in `hint`.             |
| `rate_limit`       | Upstream answered HTTP 429.                                                                                                                                                  |
| `network`          | The request never landed: DNS failure, refused connection, abort or timeout.                                                                                                 |
| `api`              | Any other upstream non-2xx status or provider exception, and local operational failures such as an unwritable output directory.                                              |
| `setup_incomplete` | An agent that was asked for explicitly is not installed, or the packaged skill is missing.                                                                                   |
| `ambiguous`        | The dotPath answers several methods and `--method` was not given.                                                                                                            |

## Credentials

Every provider reads its credential from the environment. The CLI prints
variable **names** and whether they are set — never a value, on any command, in
any mode.

| Provider            | Env var                                                                                                                                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openai`            | `OPENAI_API_KEY`                                                                                                                                                                                              |
| `xai`               | `XAI_API_KEY`                                                                                                                                                                                                 |
| `anthropic`         | `ANTHROPIC_API_KEY`                                                                                                                                                                                           |
| `fireworks`         | `FIREWORKS_API_KEY`                                                                                                                                                                                           |
| `fal`               | `FAL_API_KEY`                                                                                                                                                                                                 |
| `google`            | `GOOGLE_API_KEY`                                                                                                                                                                                              |
| `googleflow`        | `GOOGLE_FLOW_API_KEY`                                                                                                                                                                                         |
| `dolthub`           | `DOLTHUB_API_KEY`                                                                                                                                                                                             |
| `dropbox`           | `DROPBOX_OAUTH_TOKEN`                                                                                                                                                                                         |
| `simplefunctions`   | `SIMPLEFUNCTIONS_API_KEY` _(optional — keyless endpoints work without it)_                                                                                                                                    |
| `kie`               | `KIE_API_KEY`                                                                                                                                                                                                 |
| `kimicoding`        | `KIMI_CODING_API_KEY`                                                                                                                                                                                         |
| `alibaba`           | `DASHSCOPE_API_KEY`                                                                                                                                                                                           |
| `zaicoding`         | `ZAI_CODING_PLAN_API_KEY`                                                                                                                                                                                     |
| `binance`           | _(none — public API)_                                                                                                                                                                                         |
| `openligadb`        | _(none — public API)_                                                                                                                                                                                         |
| `openf1`            | _(none — public API)_                                                                                                                                                                                         |
| `elevenlabs`        | `ELEVENLABS_API_KEY`                                                                                                                                                                                          |
| `s3`                | `S3_ACCESS_KEY_ID` + `S3_SECRET_ACCESS_KEY`                                                                                                                                                                   |
| `b2`                | `B2_ACCESS_KEY_ID` + `B2_SECRET_ACCESS_KEY` + `B2_REGION`                                                                                                                                                     |
| `x`                 | `X_ACCESS_TOKEN`                                                                                                                                                                                              |
| `meta`              | `IG_ACCESS_TOKEN`                                                                                                                                                                                             |
| `polymarket`        | `POLYMARKET_CLOB_API_KEY` + `POLYMARKET_CLOB_API_SECRET` + `POLYMARKET_CLOB_API_PASSPHRASE` + `POLYMARKET_ADDRESS` + `POLYMARKET_PRIVATE_KEY` + `POLYMARKET_FUNDER_ADDRESS` _(public market data needs none)_ |
| `free-media-upload` | _(none — public API)_                                                                                                                                                                                         |
| `youtube`           | `YOUTUBE_ACCESS_TOKEN` _(optional — keyless endpoints work without it)_                                                                                                                                       |
| `telegram`          | `TELEGRAM_BOT_KEY`                                                                                                                                                                                            |
| `quo`               | `QUO_API_KEY`                                                                                                                                                                                                 |
| `thesportsdb`       | `THESPORTSDB_API_KEY` _(optional — keyless endpoints work without it)_                                                                                                                                        |

`apicity providers` prints this table for the machine you are on, with a
`configured` column. `POLYMARKET_SIGNATURE_TYPE` is public configuration rather
than a secret: set it to the account's verified value (`0`, `1`, `2` or `3`)
alongside the credential bundle — 1Password mode deliberately does not resolve
it, and polymarket refuses to load a credential bundle without it.

### 1Password

An env file can hold `op://<vault>/<item>/<field>` references instead of
literals. That is the format `op run --env-file` reads, and the one this
repository's own `.env` uses, where an item's title need not match its
variable:

```bash
FIREWORKS_API_KEY=op://Apicity/FIREWORKS_AI_API_KEY/password
```

A call resolves the references of the provider it addresses, and only those,
in one `op inject` however many there are. `op` authenticates with the
configured service-account token when there is one (`--op-token`,
`APICITY_OP_SERVICE_TOKEN` or the env file), and otherwise with its own
sign-in: `OP_SERVICE_ACCOUNT_TOKEN`, the desktop app, or `op signin`. A
reference names its own vault, so it needs no `--op-vault`. One that cannot be
resolved is exit 3 `auth`, naming the variable and the reference, never a
value. Settings a factory reads outside its credential variables, such as
`S3_REGION`, `S3_ENDPOINT` or `B2_ENDPOINT`, are never resolved: keep those
literal.

The vault convention fills what is still missing from
`op://<vault>/<VAR>/password`, once a vault and a token are both configured.
Save the pair once, and every later call on this host uses it:

```bash
apicity setup 1password --op-vault Apicity --op-token env:OP_SERVICE_ACCOUNT_TOKEN
```

That writes `APICITY_OP_VAULT` and `APICITY_OP_SERVICE_TOKEN` to the env file
a call loads, replacing those two lines in place and leaving every other line
as it was. The token is saved exactly as given, so the `env:VAR` form keeps
the secret itself off disk: prefer it to a literal. A directory the command
creates is `0700` and a file `0600`; an existing file keeps its mode. It asks
nothing: the vault and token come from the flags, else from those two
variables in the environment, never from the file. It then checks the pair
once with `op item list`, with the token in `op`'s environment rather than on
its command line, and answers exit 7 when `op` is missing, 3 when 1Password
refuses the pair and 6 on a timeout; the lines stay written either way.
`--no-verify` skips that check, and `apicity setup 1password --remove` deletes
the two lines and nothing else.

In `apicity providers`, `commands` and `describe`, `configured` means the CLI
knows where each credential comes from: a variable in the environment, a
literal or `op://` reference in the env file, or the vault convention when a
vault and a token are both configured. Those commands never run `op`, so
whether the vault really holds an item shows at call time and in
`apicity doctor`.

## Output

One rule decides everything the CLI prints: `--json`, **or** a stdout that is
not a terminal, selects the machine envelopes; a terminal without `--json`
selects the pretty form. Both carry the same data.

```jsonc
// success, on stdout
{ "ok": true, "data": { … }, "summary": "…", "meta": { … } }

// failure, on stderr — one line, and nothing on stdout
{ "ok": false, "error": "…", "code": "…", "hint": "…", "meta": { … } }
```

**The discovery commands answer the same envelope.** `commands`, `describe`
and `providers` — and the `apicity <provider>` and `--help` forms that reuse
them — put their result under `data` like every other command (`skill install`,
`setup`, `doctor`, and any endpoint call), so a `jq` filter reads it there:

```bash
apicity commands --provider openligadb --json | jq '.data | length'
apicity describe kie api.v1.jobs.createTask --json | jq '.data.paid'
```

At a terminal without `--json`, `commands` and `providers` print an aligned
table and `describe` a text block instead. A **failure** follows the one rule
above on every path, discovery included: the error envelope whenever stdout is
a pipe or `--json` is passed, and `Error:` plus `hint:` lines at a terminal
without it.

Success goes to stdout and failure to stderr, never both for one invocation.
`--quiet` prints the data alone — compactly with `--json`, so
`apicity … --json --quiet` is one line a shell can hand to another program.

**Media and binary results are persisted, not printed.** A binary response
(`openai v1.audio.speech`, say) is written to the output directory and the data
becomes `{ savedTo, bytes }`. A JSON response is walked for `https://` strings
under the media keys `url`, `downloadUrl`, `download_url`, `audio_url`,
`audioUrl`, `video_url`, `videoUrl`, `image_url`, `imageUrl`, `fileUrl` and
`file_url`; each is downloaded and a sibling `<key>_savedTo` added next to it.
A download that fails is inlined as `<key>_savedTo: "error: …"` and never fails
the call. The directory is `--output-dir`, else `APICITY_OUTPUT_DIR`, else
`CLAUDE_PROJECT_DIR`, else the working directory.

Streaming endpoints are buffered into an array rather than streamed: the CLI
prints one document.

## Paid endpoints

A few endpoints cost money on the provider's side: the rows `apicity describe`
marks paid (`paid: yes`, or `"paid": true` with `--json`), which is also the
`paid` column of `apicity commands`. Whether or not this host gates them, that
flag is the cue to say a call bills before making it.

The pay gate in front of them is **opt-in**. With no `--paygate-secret-file`
and no `APICITY_PAYGATE_SECRET_FILE`, the gate is off and a paid call goes
upstream directly, with no `--otp`. An `--otp` given on such a host exits 4
`paygate`, with `paygate-not-configured` repeated in `hint`: it is refused
rather than silently dropped, because whoever passes one believes a gate
exists. A secret file that reads as empty is exit 1 `usage`
(`<path> is empty`), raised before any provider is built, never a disarmed
gate.

Naming a secret file arms the gate, and its guarantees are unchanged. The CLI
is then the **code client**: it holds the shared HMAC secret to _verify_ an
OTP, every paid call needs one, and each OTP is single-use and bound to the
exact request. The CLI never mints one, and
`grep -rn mintOtp packages/cli/src` finds nothing. On a host whose operator
armed the gate, a human mints the OTP out-of-band from the same secret, and
the caller passes it unchanged:

```bash
apicity-paygate otp mint \
  --secret-file ./paygate.secret \
  --dot-path api.v1.jobs.createTask \
  --payload-file request.json \
  --ttl 10m

apicity kie api.v1.jobs.createTask --data-file request.json --otp <token>
```

On an armed host a missing or bad OTP fails closed with exit 4 and the gate's
own code (`otp-missing`, `otp-expired`, `otp-replayed`, …) repeated in `hint`.
The agent driving the CLI never sees the secret, so it cannot self-approve.
See [@apicity/cost](../provider/cost) for the full spec.

## The skill and the Claude Code plugin

`apicity skill` prints the agent skill this package ships — the guide that
teaches an agent the three discovery steps and the call. `apicity skill
install` writes it to `~/.agents/skills/apicity`, the location Codex and other
agents read directly, and links `~/.claude/skills/apicity` at it for Claude
Code.

Every directory this CLI writes carries `.managed-by-apicity` and an
`.installed-version` stamp. **Shape is not ownership**: a skill directory
without that marker was written by someone else, so the CLI refuses to
overwrite or remove it (`skill_unmanaged`, exit 1) and `--remove` reports it
under `kept`.

```bash
apicity setup claude   # skill + marketplace + plugin install
apicity setup codex    # skill; nothing is ever written under ~/.codex
apicity setup agents   # skill, plus whichever agent is unambiguous here
apicity setup --remove # uninstall the plugin, remove only what this CLI wrote
```

`apicity setup 1password` is the fourth form, and it touches only the env
file: see [1Password](#1password). Its `--remove` deletes the two lines it
wrote, `--no-verify` skips its `op item list` check, and no other form's
`--remove` ever opens the env file.

`setup claude` installs the skill first and unconditionally — the half that
works on every host — then runs `claude plugin marketplace add`,
`marketplace update` and `plugin install`, and decides the outcome by re-reading
`installed_plugins.json` rather than by trusting an exit status. It is
idempotent. `APICITY_SETUP_AGENT` (`claude`, `codex`, `all`, `none`) overrides
detection for `setup agents`; a typo warns and falls back to detection, because
that command's whole contract is that it finishes without asking anybody
anything.

`apicity doctor` reports twelve fixed rows — CLI and Node versions, env file,
1Password CLI and vault, pay-gate secret, output directory, providers
configured, skill install, skill freshness, Claude plugin and Codex — each
`ok`, `warning` or `error` with a `hint`. A check that does not apply to this
host says so at `ok` rather than disappearing, so `.data` has the same twelve
indices everywhere. It always exits 0: it is a report, not a gate. A skill
older than the installed CLI is a warning that names `apicity skill install`;
nothing re-syncs itself behind your back. The pay-gate secret row is `ok` when
no secret file is named, because the gate is then off; it is `error` for a
file that is unreadable or empty, and it never prints the file's contents.

The 1Password row finds the vault and the token as a call does, flag first,
then the environment, then the env file, and names where the token came from:
`env:VAR`, `$VAR` or a set variable name is shown, and a literal is only ever
called one. A token alone is `ok`, since `op://` references resolve with it. A
vault alone is an `error`, because every call then exits `usage`. With both,
doctor runs `op item list` on the vault once and warns, by name, about each
provider variable that nothing else supplies and the vault has no item for.
The Providers row counts providers the way `apicity providers` does, offline.

## What we took from hey-cli

This CLI is modelled on [basecamp/hey-cli](https://github.com/basecamp/hey-cli),
and the debt is worth naming precisely. **Adopted:** one binary whose
subcommands document themselves through `--help`; the success envelope
`{ok, data, summary, meta}` and the error envelope `{ok, error, code, hint,
meta}` with the same field names and semantics; `--quiet` for the data alone;
stable exit codes 0–8 printed by `apicity help exit-codes` as `hey help
exit-codes` prints hey's; a `commands --json` catalog, here derived from
`endpoint-docs.tsv`; the help topics, as `output`, `exit-codes`, `environment`
and `agents` (hey's `linked-accounts` has no apicity equivalent); `doctor` with
its `{name, status, message, hint}` rows; `skill` and `skill install` with an
ownership marker and a version stamp, spelled `.managed-by-apicity`;
`setup claude`, `setup codex` and `setup agents` with `--remove` and an
`APICITY_SETUP_AGENT` override where hey reads `HEY_SETUP_AGENT`; the
`.claude-plugin/` layout — `plugin.json`, the skills link and the SessionStart
liveness hook — plus a marketplace manifest so the repository installs; and
the README-and-`AGENTS.md` guidance for agents, here as the root README's
"CLI and coding agents", this file, and the `apicity CLI` sections in
`.claude/CLAUDE.md` and `AGENTS.md`. **Adapted:** hey's styled
terminal output and JSON-when-piped rule, which here prints pretty data at a
terminal and the envelope everywhere else, with `--json` forcing it; hey's
`.surface` snapshot and `check-surface-compat`, replaced by a catalog-parity
test against `endpoint-docs.tsv` plus a pinned list of built-in commands; and
hey's automatic once-per-release skill re-sync, replaced by `doctor` reporting
a stale install for `apicity skill install` to refresh. hey's `API-COVERAGE.md`
and `STYLE.md` needed no equivalent: `scripts/endpoint-docs.tsv` already is the
inventory, and this repository's conventions live in `.claude/CLAUDE.md`.

**Not adopted, and why.** `--jq`: `--quiet` piped into real `jq` does the job,
so the built-in filter can wait. `--ids-only`, `--count`, `--markdown`,
`--html`, `--styled` and `--stats`: results here are arbitrary provider JSON
with no common list or id shape to shape. The first-run wizard, the interactive
sign-in offer and `HEY_NONINTERACTIVE`: apicity authenticates with API keys the
operator configures, there is nothing to sign into, nothing prompts, and bare
`apicity` prints help. Browser OAuth, the system keyring and the `auth` command
family: environment variables, a `.env` file and 1Password are the credential
story. The TUI, `watch`, `upgrade`, the installer scripts and the packaging
matrix (Homebrew, mise, Nix, deb, Scoop, Omarchy), the `.size-budget` and the
separate skills-sync repository: npm distributes this package, and the skill
ships inside it. hey's `mcp` subcommand: the operator removed MCP support
entirely on 2026-09-17, so there is no server to expose.

### Switching from `@apicity/mcp-server`

`@apicity/mcp-server` was renamed `@apicity/cli`, and MCP support ended with
`@apicity/mcp-server` 0.11.2: the CLI has no server to register.

1. **Install the CLI.** `npm install -g @apicity/cli` (or run it through
   `npx -y @apicity/cli@latest`).
2. **Check the host.** `apicity doctor` reports the CLI and Node versions, the
   env file, 1Password, the pay-gate secret, the output directory, how many
   providers are configured, and the skill and plugin install — one row each,
   `--json` for a machine.
3. **Connect the agents.** `apicity setup claude` installs the skill and the
   Claude Code plugin; `apicity setup codex` installs the skill Codex reads.
   `apicity setup agents` does whichever is unambiguous on this host.
4. **Remove the old MCP registration.** `claude mcp remove apicity`,
   `codex mcp remove apicity`, or delete the `mcpServers.apicity` entry from
   the client's config file. Agents reach the endpoints through the CLI and the
   skill from here on.
5. **Retire a launcher script.** A launcher that execs the old server bin from
   `node_modules/.bin` has nothing left to launch: remove it together with its
   `@apicity/mcp-server` dependency rather than repointing it. This
   repository's own city launcher is one such script.
6. **Tell the agents that cannot install plugins.** Add a short section to the
   project's `AGENTS.md` (and `CLAUDE.md` or `.claude/CLAUDE.md`, for Claude Code):

   > apicity is driven through the `apicity` CLI on PATH, never an MCP server.
   > Run `apicity --help` for the command set and `apicity skill` for the agent
   > guide (`apicity commands`, `apicity describe`, then the call). Credentials
   > are configured by the operator; never request, copy, or read them.

7. **After the release, the operator deprecates the old package** — a manual,
   post-publish step no part of the build performs:

   ```bash
   npm deprecate @apicity/mcp-server "Replaced by @apicity/cli; MCP support was removed, use the apicity CLI and agent skill"
   ```

## Programmatic use

```ts
import { loadCatalog } from "@apicity/cli";

const endpoints = await loadCatalog();
console.log(endpoints.filter((e) => e.provider === "openai").length);
```

`runMain()`, `zodToJsonSchema()`, `loadEnvFile()` and the 1Password helpers
are exported too. For diagnostics and bulk checks, `buildRegistry()` resolves
the tsv in one pass against every provider it can instantiate, skipping any
whose required credential is unset; `loadCatalog()` above is the cheap path.

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
