# Cost learning pass 1 — 2026-11-04

Source: ac-dcshsu (L1 of epic ac-0lt830). Model: `docs/har-learning-pass-1.md`, a
separate loop that this one does not touch.

The pass compares what `@apicity/cost` estimates with what calls actually cost. It
applied six rate corrections and removed an invented 0.75 USD from the recordings.
Of the 16 groups beyond tolerance, 13 remain, and this pass found no wrong rate among
them, though a later check did ([below](#found-after-this-pass)). No paid call was made
and no recording was re-recorded.

## Reproduce and evidence

The installed CLI lags this repository, so use the one built from a checkout:

```bash
pnpm install --frozen-lockfile
pnpm run build
node packages/cli/dist/src/bin.js har cost tests/recordings --json
node packages/cli/dist/src/bin.js har cost <copy of the captures> --json
```

Full outputs, which stay out of the repository because the captures are private:
`/gc/apicity/plans/ac-0lt830/reports/2026-11-04-{recordings,captures}.{md,json}`.
Evidence and tools: `/gc/apicity/plans/ac-0lt830/evidence/L1/`.

| Corpus               | Files | Calls | Settled | Groups | Beyond tolerance |
| -------------------- | ----: | ----: | ------: | -----: | ---------------: |
| `tests/recordings`   | 1,057 | 1,440 |   1,396 |  1,035 |               13 |
| Captures (videobook) |   459 |   459 |     205 |     21 |                0 |

The captures are videobook's own, from its host. All 459 pass
`apicity har scrub --check`. They carry no quotes yet and
their requests predate the kept request text, so they show what calls cost but give
no estimate to compare. `apicity har cost` proposes no correction on either corpus.

## Method

Tolerance is 2%. Every group beyond it gets one verdict:

- **CORRECTION:** a stated charge or today's published price contradicts the table,
  the sources agree, and no promotion explains it.
- **CAPTURE-GAP:** a missing field or truncation.
- **NO-ACTION:** an old capture, a promotion, a rounding limit, one call with no second
  witness, or an estimate that cannot know the figure before the call.

A capture older than a rate's `asOf` is a price change, not an error, so today's feed
decides those rows. A stated charge is treated as a claim until its recording looks
real: two recordings here were hand-written.

## Verdicts

These are the 16 groups in the first report, with 25 calls over and 7 under. In the
saved report 13 groups remain, with 21 calls over and 7 under. The first two rows left
because of this pass. Anthropic's left because the estimator now refuses a chars/4
figure on that model.

| Provider  | Model                            | Over | Under | Ratio | Verdict    | Why                                                                                                         |
| --------- | -------------------------------- | ---: | ----: | ----: | ---------- | ----------------------------------------------------------------------------------------------------------- |
| kie       | `pixverse-v6/reference-to-video` |    1 |     0 | 1.125 | CORRECTION | Recording billed 4 credits/s, and today's feed agrees. Applied below                                        |
| kie       | `kling/v3-turbo-text-to-video`   |    2 |     0 |   1.8 | NO-ACTION  | Hand-written cassettes. The feed confirms the table, and their charge is gone (see below)                   |
| kie       | `bytedance/seedance-2-mini`      |    0 |     1 |   0.4 | NO-ACTION  | Old capture (06-24). Feed today is 3.8 credits/s, the table's rate                                          |
| kie       | `grok-imagine-video-1-5-preview` |    0 |     1 |  0.16 | NO-ACTION  | Old capture (06-05). The three October recordings match exactly                                             |
| kie       | `happyhorse-1-1/text-to-video`   |    0 |     1 |  0.68 | NO-ACTION  | Old capture (06-24). The page today is 22.5 credits/s, the table's rate                                     |
| machgen   | `MiniMax-H3-Turbo`               |    4 |     0 |   1.5 | NO-ACTION  | Promotion: 0.01/s when recorded. The pricebook today is 0.015/s to 2027-01-01, the table's                  |
| machgen   | `Seedance-2.5`                   |    3 |     0 | 1.028 | NO-ACTION  | Old capture (10-22). The pricebook today is 0.1028/s, the table's rate                                      |
| xai       | `grok-4` (`v1.responses`)        |    0 |     1 |  0.28 | NO-ACTION  | Tokens x rates equal the stated bill exactly. The estimate cannot see a vision input                        |
| alibaba   | `wan2.7-videoedit`               |    0 |     1 |  0.50 | NO-ACTION  | No stated charge. The estimate assumes 5 s, and an edit follows its source. `ac-nr7mpd`                     |
| anthropic | `claude-sonnet-4-6`              |    1 |     0 |  3.40 | NO-ACTION  | Usage only: the ratio measured the before-call chars/4, not a rate. The estimator now quotes no figure here |
| fireworks | `llama-v3p3-70b-instruct` (chat) |    2 |     0 |  1.06 | NO-ACTION  | Usage only, as above                                                                                        |
| fireworks | `llama-v3p3-70b-instruct` (text) |    0 |     1 |  0.97 | NO-ACTION  | Usage only, as above                                                                                        |
| fireworks | `llama-v3p3-70b-instruct` (msgs) |    2 |     0 |  1.06 | NO-ACTION  | Usage only, as above                                                                                        |
| fireworks | `nomic-embed-text-v1.5`          |    1 |     0 |   1.5 | NO-ACTION  | Usage only, 2 tokens, as above                                                                              |
| openai    | `gpt-4o-mini`                    |    8 |     1 |  5.55 | NO-ACTION  | Usage only, as above                                                                                        |
| openai    | `o4-mini`                        |    1 |     0 |  3.93 | NO-ACTION  | Usage only, as above                                                                                        |

There is no CAPTURE-GAP verdict: nothing beyond tolerance turned on a missing field.
Reconciling usage-only families against provider cost APIs is RC1 (`ac-q1v7y1`).

### Leads named in the plan

| Lead                                 | Finding                                                                                                                                                                                      |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| kie `kling/v3-turbo-text-to-video`   | Hand-written, not a lead. See below                                                                                                                                                          |
| kie `grok-imagine-video-1-5-preview` | Old capture                                                                                                                                                                                  |
| kie `seedance-2-5` draft (0.18x)     | Two tasks in one recording, now apart. The draft matches at 0.56 USD. Its 632-credit render has no estimate, because it needs `costHints` from the draft task, so it is not beyond tolerance |
| kie `seedance-2-mini`                | Old capture                                                                                                                                                                                  |
| kie `happyhorse-1-1` t2v             | Old capture                                                                                                                                                                                  |
| machgen `MiniMax-H3` upscale (0.4x)  | The first step matches. The upscale step has no estimate, as its length follows its source                                                                                                   |
| machgen `MiniMax-H3-Turbo`           | Promotion                                                                                                                                                                                    |
| machgen `Seedance-2.5`               | Old capture                                                                                                                                                                                  |

## Corrections applied

Six, under the cap of ten. Each row's `source.asOf` is now 2026-11-04, and
`tests/unit/cost-learning-pass-1.test.ts` pins each to its recording: the estimate
must equal the billed units at the price read today.

| Row                                                                                                         | Was                              | Now               | Evidence                                                                                              |
| ----------------------------------------------------------------------------------------------------------- | -------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------- |
| fal `minimax/h3/t2v/trainer`                                                                                | `max(1, steps)`                  | `max(100, steps)` | Card states the floor. `minimax-h3-t2v-trainer_2342852863` billed 100 steps for 1                     |
| fal `minimax/h3-max/{text,image}-to-video`, `camera-controls`, `minimax/h3-max-turbo/{text,image}-to-video` | 0.0325, 0.05 and 0.01625 at 480P | 0.035 and 0.0175  | October promotion ended. Card and price list today. List from 11-16 (`ac-cukhhs`)                     |
| fal `heygen/heygen-video/{text,image,reference}-to-video`                                                   | 0.01/0.03                        | 0.02/0.06         | 50% promotion ended 10-31. Card's regular price and the price list                                    |
| fal `mureka/api/generate/{lyrics,song}`                                                                     | 0.0135; 0.045-0.75               | 0.009; 0.03-0.50  | Card and price list agree, with no promotion stated                                                   |
| fal `fal-ai/nano-banana`, `/edit`                                                                           | 0.039                            | 0.0398            | Card and price list, 1 unit on each recording                                                         |
| kie `pixverse-v6/reference-to-video`                                                                        | 0.0225-0.1035                    | 0.02-0.092        | Today's feed prints the shared ladder. `pixverse-v6-reference-to-video_2396754018` billed 4 credits/s |

**The hand-written KIE cassettes.** `kling-v3-turbo-text-to-video_1058703467` and
`kling-v3-turbo-text-to-video-1080p_717102705` were written by hand in 4467fd2a: their
task ids end in `_apicity`, their results are on example.com, and the poll is in the
submit's millisecond. They stated 50 and 100 credits that were never billed. Those
fields are gone, and each cassette's `log.comment` says why. The paid total over
`tests/recordings` falls by exactly that invented 0.75 USD, from 32.45 to 31.70, and
`tests/unit/cli-har-cost.test.ts` pins that they count no charge.

## The 22 fal rows

These are the rows in the survey's `fal-billable-ratio.tsv` where header units x list
price differ from the estimate, read again today. fal states no USD, so header units x
price is the witness, and the survey found it sound on 133 of 155 rows.

| Rows                                                 |     Ratio | Verdict    | Why                                                                           |
| ---------------------------------------------------- | --------: | ---------- | ----------------------------------------------------------------------------- |
| `minimax/h3/t2v/trainer`                             |       100 | CORRECTION | Applied                                                                       |
| `minimax/h3-max/*` (3), `minimax/h3-max-turbo/*` (2) | 1.08, 0.7 | CORRECTION | Applied                                                                       |
| `heygen/heygen-video/*` (3)                          |         2 | CORRECTION | Applied                                                                       |
| `mureka/api/generate/*` (2)                          |      0.67 | CORRECTION | Applied                                                                       |
| `fal-ai/nano-banana`, `/edit`                        |      1.02 | CORRECTION | Applied                                                                       |
| `fal-ai/vidu/q4/*` (2)                               |       0.7 | NO-ACTION  | Promotion to 11-30. The table holds list rates on purpose; see `ac-cukhhs`    |
| `krea/v3/edit`                                       |      0.88 | NO-ACTION  | The table counts each reference at output size, the card's maximum, and warns |
| `xai/grok-imagine-image/edit`                        |       1.1 | NO-ACTION  | Old capture (04-18). The price list today has the flat 0.02 the table uses    |
| `bytedance/seedance-2.0/us/*` (2)                    |      0.83 | NO-ACTION  | The card and the table say 0.0168, and only the price list says 0.014         |
| `bytedance/seedance-2.5/us/text-to-video`            |      0.83 | NO-ACTION  | Held at the last bill, 0.02568, against 0.0214 today. See below               |
| `xai/grok-imagine-video/extend-video`                |       1.4 | CORRECTION | Applied later, with two hints. See below                                      |
| `fal-ai/gpt-image-1.5`                               |      2.22 | NO-ACTION  | Tokens no call states. The estimate now warns it is a floor. See below        |

The usage API would settle the Seedance rows, but the configured key answers 403 on it.

`fal-ai/sora-2/text-to-video` and `image-to-video` answered 404 on the price list. OpenAI
removed Sora 2 from its API on 2026-09-24, and fal's gateway now says the application is
not found, so `ac-jgqanj` removed both here. `vb-olmxr` takes them out of videobook's catalog.

## MachGen models outside the table

The pricebook lists 51 models and the table prices 28 of them. The 23 others are
unpriced by policy, since the catalog follows the top-10 rule in `docs/frontier.md`.

- **Through the free quote (5):** `Topaz-Video-Generative`,
  `Topaz-Video-Generative-Fast`, `Topaz-Video-Precision`,
  `Topaz-Video-Precision-Animation`, `Vidu-Upscale-Pro`. These use
  `POST api.v0.upscale.quote` and `resolveMachGenUpscaleEstimate`.
- **Names the API resolves to a priced row (3):** `MiniMax-H3-MultiMax` is
  `MiniMax-H3-Turbo`, and `Wan2.2-I2V-A14B` and `Wan2.2-T2V-A14B` are `Wan2.2-A14B`.
- **Not in the catalog (15):** `Eleven-Music-v2`, `Eleven-SFX-v2`, `Eleven-v3`,
  `Eleven-v4`, `FLUX.2-dev`, `Grok-Imagine-Image`, `Grok-Imagine-Image-Quality`,
  `HiDream-O1-Image`, `Kling-v4`, `Nano-Banana-Pro`, `Seedream-5.0-lite`,
  `Topaz-Image-Generative`, `Topaz-Image-Precision`, `Vidu-S1`, `YuE2-3B`.

An estimate for any of them fails closed rather than guessing.

## What videobook's calls actually used

Totals over the captures, for every model with usage or a charge. The rest of the
catalog has no capture yet. `derived` is reported usage x the bundled rate, and `stated`
is the provider's own figure.

| Provider and endpoint            | Model             | Calls (settled) | Input tokens | Cached | Cache write | Output tokens (reasoning) | Other         |      USD | Basis      |
| -------------------------------- | ----------------- | --------------: | -----------: | -----: | ----------: | ------------------------: | ------------- | -------: | ---------- |
| openai `v1.responses`            | `gpt-5.6-sol`     |         60 (60) |    1,087,337 | 50,544 |   1,035,912 |           64,927 (22,082) |               | 6.501842 | derived    |
| openai `v1.responses`            | `gpt-6-astra`     |           5 (5) |       72,739 |      0 |      72,724 |                  383 (27) |               | 0.928350 | derived    |
| openai `v1.audio.transcriptions` | `gpt-transcribe`  |           6 (6) |              |        |             |                           | 91 s          | 0.006825 | derived    |
| elevenlabs `v1.speechToText`     | `scribe_v2`       |           5 (5) |              |        |             |                           | 72.8 s, 33 cr | 0.007260 | stated     |
| machgen `api.v0.tasks`           | `Alibaba-Wan-3.0` |         197 (1) |              |        |             |                           | 13 s          |     none | usage only |
| machgen `api.v0.tasks`           | `MiniMax-H3`      |          57 (2) |              |        |             |                           | 30 s          |     none | usage only |
| machgen `api.v0.generate`        | `Alibaba-Wan-3.0` |           1 (0) |              |        |             |                           |               |     none | submit     |
| machgen `api.v0.generate`        | `MiniMax-H3`      |           2 (0) |              |        |             |                           |               |     none | submit     |

Input tokens include cached and cache-write tokens. MachGen shows no USD because
videobook never reads the free `api.v0.tasks.billing` receipt that states the charge.
The other captured calls are free: `v1.responses.inputTokens`, `v1.tokenizeText`,
`v1.user.subscription`, KIE `chat.credit`, TikTok Creative Center, Endless and the upload
hosts.

## Follow-up work

| Bead        | Family | What                                                                       |
| ----------- | ------ | -------------------------------------------------------------------------- |
| `ac-89cvvz` | fal    | Settled 2026-11-07: US 2.5 billed $0.0214/1K tokens; US base rates aligned |
| `ac-cukhhs` | fal    | Timed: MiniMax H3 Max's promotion ends 11-15, and which promo policy       |
| `ac-eue5ej` | fal    | Settled 2026-11-09: FLUX 3 Max's promotion rolled into 50% off, to 11-22   |
| `ac-f9aih6` | fal    | Timed: FLUX 3 Max's 50% promotion ends 11-22; list $0.17/$0.29 from 11-23  |
| `vb-olmxr`  | fal    | `sora-2` is retired, and videobook's catalog still names it                |

Filing WaveSpeed's `billings/search` as an endpoint was left to this pass if the deltas
justified it. They do not: no WaveSpeed group is beyond tolerance.

## Found after this pass

A later reconcile against xAI's own bill (`ac-q1v7y1`) found what this pass could not see.
xAI's [2026-05-15 retirement](https://docs.x.ai/developers/migration/may-15-retirement.md)
left `grok-4-fast`, `grok-4-1-fast`, `grok-4` and `grok-3` resolving, but billing as
`grok-4.3`. Every recording of them that states a charge predates it, so nothing in the
recordings contradicted the old rates. The `grok-4` row above measured a real effect, the
vision input, but its rate was stale too. `ac-t1isrq` moved all four rows to `grok-4.3`.
Those April calls now read `no-estimate`, so `grok-4` left the guard's list below.

`ac-1m1poe` closed the three fal rows this pass left open, with no paid call:

- **`xai/grok-imagine-video/extend-video` is corrected.** The recorded call's input is
  now confirmed. `tests/fixtures/jump.mp4` has 193 frames at 848x480 (8.042 s), and 4 s at
  24 fps gives the 289 frames returned, so its 5.6 units at 0.05 USD are 4 x 0.05 + 8 x 0.01.
  A 720p source bills 0.07/s. Neither the source's length nor its resolution is in the
  request, so the estimate needs `costHints.inputDurationSeconds` and
  `costHints.inputResolution`, and fails closed without them.
- **`fal-ai/gpt-image-1.5` and `/edit` stay at the card's image rates, as a floor.** Text
  tokens and an edit's input image tokens bill on top, the response reports no counts,
  and the output tokens depend on the model's reasoning, so no request can price them.
  The recorded generation and edit each billed exactly 0.02 USD, on different prompts and
  with an input image on one, so the header may round to a cent. The estimate now warns.
- **Seedance US base rates now match the standard rates (2026-11-07).**
  `ac-89cvvz` made one approved 480p, four-second, square 2.5 US text-to-video
  request. The client hit its 30-second timeout, but the server completed with
  HTTP 200 after 174 seconds. Free request-history and usage reads recovered the
  result: 38.8 thousand tokens at $0.0214 per thousand, totaling $0.83032.
  No second generation request was made. The initial usage read had no US bills
  after October 16, so the new daily US row belongs to this request.
  [The receipt](receipts/fal-seedance-us-2026-11-07.json) preserves the request ID,
  timestamps, usage row, and current price-list entries.

  This settles the lower 2.5 US base rate directly. Following the approved
  reconciliation, 2.0 US also moves from $0.0168 to the current listed $0.014;
  its existing unsupported-resolution behavior remains unchanged. The 2.5 US
  1080p estimate uses the standard effective $0.0234116 rate (base x 1.094),
  including draft completion. Those US 1080p paths were not measured by this
  call; the multiplier remains inferred from the standard route. October's
  historical bills at the former US premium remain valid for their dates.

  That read also checked the table against fal's bill, per UTC day and endpoint. Recorded
  units agree on 253 pairs, with none above the bill. Where the traffic is the same,
  estimates agree within 1% on 121 of 134 pairs, 45.79 of 46.18 USD. The other 13 are older
  rates that today's list has moved past, and Vidu Q4's promotion, so there is nothing to
  correct. Another 96 pairs (30.14 USD) carry no per-call estimate, so they are not checked
  in dollars.

`ac-nr7mpd` closed Alibaba's `wan2.7-videoedit`, also with no paid call. This pass read
its ratio as the output following its source, but the recording's 10.04 s is 5.02 s in and
5.02 s out, and Alibaba bills both: the API reference's billing formula says so, and so does
the price page's rule above that table. An estimate now takes the source's length from
`costHints.inputDurationSeconds` and fails closed without it. The same read found 1080P at
0.15 USD/s, which is the default, so `wan2.7-i2v` and `wan2.7-videoedit` now price it. The
two recordings ran on the mainland host, whose media rates are not bundled, so neither
report figure moves.

`ac-xk7p41` gave every row a `source.asOf`, and the type now requires one. The 46 rows this
pass counted were down to 29 KIE rows by then. All 29 agree with the feed read on 2026-11-05,
so they carry that date. Calls captured before it now count in `capturedBeforeRate`.

`ac-p3e0c6` closed the two KIE items this pass could not, also with no paid call:

- **The MiniMax H3 rows never moved.** The frozen 2026-09-11 pull and the 2026-11-04 feed
  both print 4 credits per image, and the table already charges that past the fifth image.
  The first tool read the row's 8 credits from the pull's metadata, where it sits among the
  rows removed since August. The second read the per-image row against the 0.04 per-second
  cell.
- **Wan 2.6 had moved, and is corrected.** 5 s and 10 s at 1080p went from 104.5 and 209.5
  credits to 105 and 210, on the feed and the page, so `wan/2-6-*` now read 0.525 and 1.05
  USD. They were 0.5% and 0.2% low. Pins: `tests/unit/kie-feed-drift.test.ts`.
- **`pnpm run check:kie-feed-drift` now does this comparison.** It pulls the free public
  feed and runs each row through the reconciliation's own mapping, so a multi-axis row
  reaches its own cell. Its first run, after the Wan 2.6 correction, compared 603 cells and
  all agree. It lists 14 rows with no comparable cell, each with its reason, and 16 table
  keys with no feed row. One of those keys was `bytedance/seedance-1.5-pro`. KIE has since
  retired it, so `ac-x0qlnu` removed it here.

- **KIE repriced the whole Kling family on 2026-11-05.** `check:kie-feed-drift` went
  from clean at 07:43Z to 60 differing cells at 08:41Z, across 19 keys, all up, 1.08x to
  2.02x. `discountRate` fell on those rows, 42.86 to 10 on Kling 2.1 Master, so this looks
  like a promotion ending. `ac-6jp17g` re-pinned all 60 from the dated pull,
  `tests/fixtures/kie-pricing-evidence/feed-drift-2026-11-05.json`. Five recordings billed
  at the old rates, and those bills were right on their day:

| Provider | Model                               | Verdict   | Why                                                                                                         |
| -------- | ----------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------- |
| kie      | `kling-3.0-omni/text-to-video`      | NO-ACTION | Old capture (08-20), billed before KIE repriced Kling on 2026-11-05. The feed today prints the table's rate |
| kie      | `kling-3.0-omni/image-to-video`     | NO-ACTION | Old capture (08-20), billed before KIE repriced Kling on 2026-11-05. The feed today prints the table's rate |
| kie      | `kling-3.0-omni/reference-to-video` | NO-ACTION | Old capture (08-20), billed before KIE repriced Kling on 2026-11-05. The feed today prints the table's rate |
| kie      | `kling-3.0/video`                   | NO-ACTION | Old capture (06-28), billed before KIE repriced Kling on 2026-11-05. The feed today prints the table's rate |
| kie      | `kling/v3-turbo-image-to-video`     | NO-ACTION | Old capture (06-28), billed before KIE repriced Kling on 2026-11-05. The feed today prints the table's rate |

## What keeps this honest

`tests/unit/cost-recording-accuracy.test.ts` holds every committed call with a stated
charge and a priced estimate to the 2% tolerance, or lists it with a reason from the
verdict table above. A rate edit that contradicts a recorded bill fails it, naming the
recording and the ratio, and a listed call that now agrees fails too. It quotes the Why
column, so rewording a listed row fails it as well. Calls that only report usage are not
covered, since a chars/4 estimate says nothing about a rate.

## When to repeat

Repeat the pass when any of these holds:

- a promotion named in a table comment has ended (the next are 2026-11-15 and
  2026-11-22);
- `apicity har cost` over the captures shows a group beyond tolerance whose captures are
  all on or after the rate's `asOf`, or proposes a correction;
- videobook starts writing quotes, which gives the captures their first estimates;
- 30 days have passed since the last pass.

Between passes a rate can drift with no recording to show it, as
`pixverse-v6/reference-to-video` did. For KIE, run `pnpm run check:kie-feed-drift` at
every pass. The release formula also runs it before the version bump, and a differing cell
stops the release. It is free and needs no key, but it reads the live feed, so CI cannot
run it. It exits 1 and names the cell when one differs. If the row's words
are what it cannot read, add a rule to `SELECTOR_RULES` or `PAYLOAD_RULES`; if the price
moved, correct the cell as Wan 2.6 was.
