# Cost coverage survey

Every endpoint in `scripts/endpoint-cost-tiers.tsv` now has a checked billing
record, so later work knows which rows bill, how, and where the rate comes from.
Read on 2026-11-04 against `63ee15d4` (0.25.0) and videobook `c9983c05` (0.4.2).
This is the survey for epic `ac-0lt830` (child `ac-b83eph`). It spent 0 USD: public
pages and free reads only, no recording and no generation call.

The tier file answers a different question. Its tiers are provider-wide defaults
for gating examples, so `expensive` and `prohibitive` overstate what bills: of
1,894 rows, 517 bill per call, and 1,289 are free.

The working files live in the rig's gitignored `plans/ac-0lt830/`, not in this
repo:

| File                               | Holds                                                                                       |
| ---------------------------------- | ------------------------------------------------------------------------------------------- |
| `survey/endpoint-disposition.tsv`  | One row per tier row: kind, unit, pricing key, rate status, reason, source, videobook use   |
| `survey/rates/<family>.json`       | Structured rates for 17 families, with source URL and fetch date                            |
| `survey/price-sources-2026-11-04/` | The raw copy of every page and feed, with `SHA256SUMS`                                      |
| `survey/actual-fields.tsv`         | Each usage or billing field per endpoint, its `ActualUsage` key, its scale, a recording pin |
| `survey/fal-billable-ratio.tsv`    | `x-fal-billable-units` against the table's units, for each fal recording                    |
| `survey/videobook-inventory.md`    | What videobook calls, with models, operations, corpus counts and call sites                 |
| `survey/gaps-by-child.md`          | For each price child, the rows to add and the registry rows to flip                         |
| `evidence/S0/`                     | Check scripts, the list of free reads, free claims checked, rows moved, refused pages       |

## How the inventory was built

The planner's first pass classified each row by rule. This pass replaced those
rules with per-family ones and checked each family against its upstream page:

1. Fetched each price page and free feed with a logged fetcher, one row per read.
2. Wrote `rates/<family>.json` from each source. OpenAI's come from the page's
   Astro props, cross-checked against its markdown variant with no mismatch. xAI's
   were checked against the free `v1.languageModels`, also with no mismatch.
3. Read the docs behind each free claim: Files APIs, management surfaces, uploads,
   storage, plan terms. `evidence/S0/free-claims-checked.md` records each claim,
   its source and the result.
4. Assigned every row a kind in `tools/build-disposition.py`. A script then
   confirmed the row set against the tier file at the base commit: 0 missing, 0
   extra, 0 duplicates.
5. Walked the 1,057 committed recordings for usage and billing fields, and scanned
   videobook's server for the leaf behind each constructor in
   `server/src/usage-providers.ts`.

## Kinds

| Kind           | Meaning                                   | Rows  |
| -------------- | ----------------------------------------- | ----- |
| `metered`      | Bills per unit                            | 517   |
| `free`         | Documented free, or no charge published   | 1,289 |
| `followup`     | Poll or result, billed on its submit      | 42    |
| `accrual`      | Accrues while running, no per-call figure | 39    |
| `subscription` | Flat plan, zero marginal USD              | 7     |

`hasRate` applies to metered and accrual rows: `yes`, a bundled row prices it;
`some`, a route exists but some models lack a row, or it prices only after the
call; `no`, nothing yet. Of the 517 metered rows, 235 are `yes`, 115 `some` and 167
`no`.

## Counts per family

| Family                 | Rows  | Metered | Follow-up | Free  | Plan | Accrual | Yes | Some | No  |
| ---------------------- | ----- | ------- | --------- | ----- | ---- | ------- | --- | ---- | --- |
| alibaba                | 7     | 4       | 1         | 2     | 0    | 0       | 0   | 4    | 0   |
| anthropic              | 23    | 2       | 2         | 19    | 0    | 0       | 0   | 1    | 1   |
| b2                     | 39    | 0       | 0         | 39    | 0    | 0       | 0   | 0    | 0   |
| binance                | 94    | 0       | 0         | 94    | 0    | 0       | 0   | 0    | 0   |
| dolthub                | 23    | 0       | 0         | 23    | 0    | 0       | 0   | 0    | 0   |
| dropbox                | 17    | 0       | 0         | 17    | 0    | 0       | 0   | 0    | 0   |
| elevenlabs             | 291   | 29      | 4         | 244   | 0    | 14      | 0   | 5    | 24  |
| endless                | 2     | 0       | 0         | 2     | 0    | 0       | 0   | 0    | 0   |
| fal                    | 284   | 263     | 2         | 19    | 0    | 0       | 179 | 84   | 0   |
| fireworks              | 100   | 11      | 2         | 72    | 0    | 15      | 0   | 3    | 8   |
| free-media-upload      | 8     | 0       | 0         | 8     | 0    | 0       | 0   | 0    | 0   |
| google                 | 4     | 1       | 0         | 3     | 0    | 0       | 0   | 0    | 1   |
| googleflow             | 26    | 3       | 2         | 21    | 0    | 0       | 1   | 1    | 1   |
| kie                    | 84    | 49      | 16        | 19    | 0    | 0       | 26  | 6    | 17  |
| kimicoding             | 5     | 0       | 0         | 2     | 3    | 0       | 0   | 0    | 0   |
| machgen                | 5     | 1       | 3         | 1     | 0    | 0       | 0   | 1    | 0   |
| meta                   | 3     | 0       | 0         | 3     | 0    | 0       | 0   | 0    | 0   |
| omkar                  | 3     | 0       | 0         | 0     | 3    | 0       | 0   | 0    | 0   |
| openai                 | 64    | 12      | 2         | 43    | 0    | 7       | 0   | 7    | 5   |
| openf1                 | 19    | 0       | 0         | 19    | 0    | 0       | 0   | 0    | 0   |
| openligadb             | 23    | 0       | 0         | 23    | 0    | 0       | 0   | 0    | 0   |
| polymarket             | 108   | 0       | 0         | 108   | 0    | 0       | 0   | 0    | 0   |
| quo                    | 1     | 1       | 0         | 0     | 0    | 0       | 0   | 0    | 1   |
| s3                     | 112   | 93      | 0         | 19    | 0    | 0       | 0   | 0    | 93  |
| simplefunctions        | 188   | 0       | 0         | 188   | 0    | 0       | 0   | 0    | 0   |
| telegram               | 180   | 5       | 0         | 175   | 0    | 0       | 0   | 0    | 5   |
| thesportsdb            | 84    | 0       | 0         | 84    | 0    | 0       | 0   | 0    | 0   |
| tiktok-creative-center | 2     | 0       | 0         | 2     | 0    | 0       | 0   | 0    | 0   |
| wavespeed              | 24    | 23      | 1         | 0     | 0    | 0       | 23  | 0    | 0   |
| x                      | 7     | 7       | 0         | 0     | 0    | 0       | 0   | 0    | 7   |
| xai                    | 55    | 13      | 7         | 32    | 0    | 3       | 6   | 3    | 4   |
| youtube                | 5     | 0       | 0         | 5     | 0    | 0       | 0   | 0    | 0   |
| zaicoding              | 4     | 0       | 0         | 3     | 1    | 0       | 0   | 0    | 0   |
| **Total**              | 1,894 | 517     | 42        | 1,289 | 7    | 39      | 235 | 115  | 167 |

The last three columns count metered rows only.

## What the check changed

81 rows moved from the first pass. The ones later work depends on:

- **KIE:** the docs call `api.v1.voice.validate`, `api.v1.voice.generate`,
  `api.v1.voice.regenerate`, `api.v1.omni.audio.create` and
  `api.v1.omni.character.create` free, yet `PAID_ENDPOINTS` lists all five. They
  are `free` here, and the billing registry needs a named exception or a change to
  that list.
- **ElevenLabs:** Studio conversions and Productions orders bill; agent calls,
  simulations, tests and re-analysis accrue. The bundled text-to-speech rates are
  stale: the card reads 0.08 and 0.04 USD per 1K characters, against 0.12 and 0.06
  in the table. `eleven_multilingual_v3` is not in the live model list; `eleven_v3`
  is.
- **xAI:** file storage, collection storage and downloads bill, so `POST v1.files`
  accrues and `GET v1.files.content` is metered.
- **S3:** DELETE rows are free.
- **B2:** class D covers only Backblaze's outbound event notifications, so no
  endpoint row is class D. All 39 rows are free, each mapped to its class.
- **Omkar:** a monthly plan quota, so `subscription`, not `free`.
- **Google Flow:** images, image upscale, GIF and concatenate draw no published
  credits. Video upscale is free up to 1080p and 50 credits at 4K.
- **Telegram:** gift and Stars-transfer rows spend Stars from the bot's balance.
  No price child owns them.

Claims the survey could not support:

- **Fireworks** prices neither audio nor image workflows on its page or docs today,
  so those rows stay `metered` with no rate.
- **X** publishes no class for its media-upload rows, and its console needs a login.
  They fail closed.
- **KIE `elevenlabs/sound-effect-v2`**, named by videobook's catalog, has no feed
  row, and KIE's price route answers 404 for it.
- **`simplefunctions.dev`** answered 503 to every fetch, so those 188 rows rest on
  the README and recordings. Each row's reason says so.

`evidence/S0/rows-moved.tsv` lists every move, and `gaps-by-child.md` names the rows
that no child owns.

## Price sources

Every source was fetched on 2026-11-04.

| Family     | Source                                                                        | How a call maps to a price                                                            |
| ---------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| openai     | `developers.openai.com/api/docs/pricing`                                      | `payload.model`; input, cached, 30-minute write, 12-hour write, output per 1M         |
| anthropic  | `platform.claude.com/docs/en/about-claude/pricing.md`                         | `payload.model`; input, 5-minute and 1-hour write, cache read, output per 1M          |
| xai        | `docs.x.ai/developers/pricing.md`, free `v1.languageModels`                   | `payload.model`; input, cached, output per 1M, repriced at 200K prompt tokens         |
| google     | `cloud.google.com/vertex-ai/generative-ai/pricing`, `ai.google.dev` markdown  | Model in the path; per 1M, by tier and region                                         |
| kie        | Public `POST api.kie.ai/client/v1/model-pricing/page`                         | `payload.model` or a fixed key such as `suno/extend`; credits at 0.005 USD            |
| elevenlabs | `elevenlabs.io/pricing/api`, `elevenlabs.io/pricing/agents`, free `v1.models` | `payload.model_id` per 1K characters, or a fixed key per minute                       |
| fal        | Free admin `GET api.fal.ai/v1/models/pricing`, 260 of 262 ids                 | Endpoint id; unit price, with billed units in a response header                       |
| machgen    | `api.machgen.ai/api/v0/billing/pricebook/public`                              | `payload.model`; micro-USD per second or image, with promotions in the same feed      |
| wavespeed  | `wavespeed.ai/models/<id>` for all 23 models                                  | Endpoint id; the page's embedded formula, in micro-USD                                |
| fireworks  | `fireworks.ai/pricing`, `docs.fireworks.ai/serverless/pricing.md`             | `payload.model`; named rates, then size bands per 1M                                  |
| alibaba    | `alibabacloud.com/help/en/model-studio/model-pricing`                         | `payload.model`; per 1M by scope, media per image or second                           |
| kimi       | `platform.kimi.ai/docs/pricing/chat`, `kimi.com/code/docs`                    | Coding plan is flat; the list rate is for comparison                                  |
| z.ai       | `docs.z.ai/guides/overview/pricing`, `docs.z.ai/devpack/overview`             | Coding plan is flat; the list rate is for comparison                                  |
| s3         | AWS price list JSON for `us-east-1`, `aws.amazon.com/s3/pricing`              | Request class: 0.005 USD per 1K PUT, COPY, POST, LIST; 0.0004 per 1K GET; DELETE free |
| b2         | `backblaze.com/cloud-storage/transaction-pricing`                             | Classes A, B and C are free                                                           |
| quo        | `quo.com/pricing`, `quo.com/docs/mdx/pricing-support/pricing-overview`        | 0.01 USD per US or Canada segment                                                     |
| x          | `docs.x.com/x-api/getting-started/pricing.md`                                 | Per request on writes, per returned resource on reads                                 |

Pages that refused a plain fetch, and the fallback for each, are in
`evidence/S0/refused-pages.md`. `openai.com/api/pricing` answers 403, and existing
rows that cite it should move to the developer page. Kimi's table markup is empty,
so its rows come from the page's compiled source.

## Field map

Field paths and pins are per endpoint in `actual-fields.tsv`, 535 rows over 138
unique paths.

| Family     | States the charge                                                                      | Usage fields                                                                  |
| ---------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| xai        | `usage.cost_in_usd_ticks`, 1e-10 USD                                                   | OpenAI-shaped tokens; `video.duration` on videos, which state no ticks        |
| kie        | `data.creditsConsumed` on polls, `credits_consumed` on chat, at 0.005 USD per credit   | Tokens by route shape, including Anthropic and Gemini shapes                  |
| machgen    | `generation_cost_micros` (list) and `net_cost_micros` (paid) on `api.v0.tasks.billing` | `metadata.duration_secs`                                                      |
| elevenlabs | `fiat-cost-before-overages` on speech to text. `character-cost` is credits, not USD    | `audio_duration_secs`; `metadata.charging.*` on agent conversations           |
| fal        | `usage.cost` on openrouter routes only                                                 | `x-fal-billable-units` on sync calls and the queue result                     |
| wavespeed  | Nothing in responses                                                                   | `timings.inference`, not a charge                                             |
| openai     | Nothing per call                                                                       | Tokens, cached, cache write, audio, image; `usage.seconds` on transcription   |
| anthropic  | Nothing per call                                                                       | `usage.input_tokens`, cache read, cache creation by 5-minute and 1-hour       |
| alibaba    | Nothing                                                                                | Tokens; `usage.duration`, input and output video seconds, `usage.image_count` |
| fireworks  | Nothing                                                                                | Tokens, cached, also in `fireworks-*` headers; GPU seconds on jobs            |
| kimi, z.ai | Nothing, flat plans                                                                    | Tokens, cached, thinking                                                      |
| google     | Nothing                                                                                | `usageMetadata.*`; `totalBillableCharacters` on `countTokens`                 |
| s3, x, quo | Nothing                                                                                | One request or returned resource is the unit                                  |

Three traps for the extractors:

- **Anthropic-shaped `usage.input_tokens` is the uncached remainder.** `ActualUsage.inputTokens`
  is the total, so add `cache_read_input_tokens` and `cache_creation_input_tokens`.
  This holds on Anthropic, KIE's Claude routes, Kimi `coding.v1.messages` and Fireworks
  `inference.v1.messages`. OpenAI-shaped totals already include cached tokens.
- **Two OpenAI paths appear in no committed recording:**
  `usage.input_tokens_details.cache_write_tokens` and `usage.seconds`. They come from
  the capture corpus, so the extractor's test needs an inline fixture for them.
- **KIE's xAI routes pass through `usage.cost_in_usd_ticks`,** which is xAI's figure,
  not KIE's bill. KIE's charge is `credits_consumed`.

**fal.** Of 260 fal recordings, 157 give a table unit count, and 81 of those match
the header exactly. On the 155 rows with a list price to compare, header units times
that price equals the table's estimate within 1% on 133, including 65 whose header
unit differs from the table's. So the header is a sound basis for an actual even when
the units look wrong: `flux-3/extend-video` reports 10 against a 5 s table figure and
still agrees on price, and `1000 tokens` rows report thousands. The 22 rows that
disagree are named in `fal-billable-ratio.tsv` for the learning pass. Another 81 are
dynamic rows with no table units, and 22 give no table units for the recorded payload.

## Videobook

`videobook-inventory.md` covers all 19 constructors in
`server/src/usage-providers.ts`. The capture corpus holds 451 calls from 2026-10-29
to 2026-11-03, mostly MachGen polls and OpenAI `v1.responses`. Of 316 catalog models,
248 have a rate, 57 are fal dynamic and 11 have no row: 6 MachGen upscale models that
price through the free quote, 4 ElevenLabs entries, and the KIE entry above. Before a
call, `gpt-5.6-sol`, `gpt-6-astra`, `gpt-transcribe` and `gpt-4o-mini-transcribe` have
no figure, and X has no route. The price children fix those.

## Re-run

All from the rig root. Tools take their inputs as arguments, and anything reading a
downloaded file runs under `python3 -I`. Set `W` to a worktree at the commit you are
surveying. Nothing here calls a billed endpoint.

```bash
EV=plans/ac-0lt830/evidence/S0; SV=plans/ac-0lt830/survey
SD=$SV/price-sources-$(date +%F)   # fetch.sh takes this as its fourth argument; rates scripts stamp the date, so update it there

# 1. Sources. Each read appends a row to $EV/free-reads.tsv.
ACCEPT=text/html $EV/tools/fetch.sh openai openai-pricing https://developers.openai.com/api/docs/pricing "$SD"
python3 -I $EV/tools/kie-feed.py "$SD" $EV/free-reads.tsv
python3 -I $EV/tools/fal-pricing-read.py $W/scripts/endpoint-docs.tsv $W/.env "$SD" $EV/free-reads.tsv "$(mktemp -d)"

# 2. Rates, one script per family or group.
python3 -I $EV/tools/rates-openai.py "$SD" $SV/rates/openai.json

# 3. Bundle the cost package, dump the tables, derive the fal ratios and the field map.
E=$(ls -d node_modules/.pnpm/esbuild@*/node_modules/esbuild/bin/esbuild | head -1)
$E $W/packages/provider/cost/src/index.ts --bundle --platform=node --format=esm --outfile=$EV/tools/.build/cost.mjs
node $EV/tools/pricing-dump.mjs "$PWD/$EV/tools/.build/cost.mjs" > $EV/pricing-dump.json
node $EV/tools/fal-ratio.mjs "$PWD/$EV/tools/.build/cost.mjs" $W/tests/recordings $W/scripts/endpoint-docs.tsv "$SD/fal-pricing-api.body" $EV/fal-ratio-raw.tsv
python3 -I $EV/tools/actual-fields.py $W/tests/recordings $W/scripts/endpoint-docs.tsv $EV/fal-ratio-raw.tsv /root/.videobook/har $SV/actual-fields.tsv $EV/actual-fields-unmapped.tsv

# 4. Disposition, gaps, inventory.
python3 -I $EV/tools/vb-call-sites.py /gc/videobook/server/src $W/scripts/endpoint-docs.tsv $EV/vb-call-sites.json
python3 -I $EV/tools/build-disposition.py $W $EV $SV plans/ac-0lt830/planning/survey/endpoint-disposition-first-pass.tsv plans/ac-0lt830/planning/survey/vb-catalog-coverage.json /root/.videobook/har/index.jsonl
python3 -I $EV/tools/build-gaps.py $SV $EV
python3 -I $EV/tools/vb-inventory.py /root/.videobook/har /gc/videobook/server/src plans/ac-0lt830/planning/survey/vb-catalog-coverage.json $EV/vb-call-sites.json $SV/videobook-inventory.md $EV/vb-corpus-counts.json

# 5. Checks. Each exits 1 on a failure.
python3 -I $EV/tools/check-disposition.py .git "$(git -C $W rev-parse HEAD)" $SV
python3 -I $EV/tools/check-actual-pins.py $W/tests/recordings /root/.videobook/har $SV/actual-fields.tsv
python3 -I $EV/tools/check-price-sources.py $SV $EV
python3 -I $EV/tools/check-no-capture-content.py /gc/videobook/server/src/usage-providers.ts /root/.videobook/har $SV/videobook-inventory.md $W/docs/cost-coverage.md
```

`evidence/S0/README.md` lists the other rate scripts and maps each check to its
acceptance criterion. A new tier row fails `check-disposition.py` until
`build-disposition.py` gives it a kind. Prices move, so treat these rates as of the
fetch date and re-read a page before writing a row from it.
