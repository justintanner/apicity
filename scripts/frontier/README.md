# Refreshing a frontier snapshot

Each task type lives in its own directory under `scripts/frontier/<type>/`.

- `leaderboard.json` — leaderboard id, source URL, capture date, methodology,
  and each entry's rank, model, creator, and Elo. Ranks are contiguous from 1
  and stop at 10. A board with fewer than 10 models lists all of them.
- `endpoints.json` — every leaderboard model, mapped to
  `{ provider, dotPath, modelId?, pricingKey?, adapter?, note? }` or to `[]`
  when apicity does not serve it. `dotPath` is the `scripts/endpoint-docs.tsv`
  path. A dedicated leaf has no `modelId` and sets `pricingKey` to the
  `PRICING[provider]` key (for fal, the upstream endpoint id) or to
  `"unpriced"`. A shared callable carries the provider model id, which is the
  pricing key when that id is in the table. `adapter` is an upstream selector
  on that shared call, and `note` is the limitation that selector carries.
- `catalog.json` — the six type codes, names, aliases, and leaderboard
  identities. A type with no directory yet ships as an empty registry entry.

All six types have directories. `r2v` is derived, because Artificial Analysis
publishes no reference-to-video leaderboard. Its `leaderboard.json` carries
`derived: true` and `sources` (the `t2v` and `i2v` leaderboard ids) in place of
a `leaderboardId`, and links the first source. Its entries are the models of
both top 10 that have a reference-to-video endpoint, ordered by the better of
their two Elos; equal Elos keep source order, then rank. Each entry carries
that Elo and that board's creator, and needs at least one endpoint.

Run `pnpm run fetch:frontier` to refresh every type from its `sourceUrl` in
`catalog.json`, or name the types to refresh (`pnpm run fetch:frontier -- i2v
v2v`). `--dry-run` prints the changes and writes nothing. For each type the
script reads the page's overall top 10, keeps the snapshot's `leaderboardId`
and `methodology`, sets the capture date, and rewrites `leaderboard.json` and
`endpoints.json`: a model new to the board gets `[]`, to be filled in by hand,
and a model that left the board is dropped with its endpoints. It stops,
writing nothing, when a page no longer names the catalog's `leaderboardId`;
update `catalog.json` and the snapshot first. Pasting the JSON by hand and
bumping the capture date still works.

Then run `pnpm run gen:frontier` and `pnpm run doc-gen`. Commit the JSON with
the regenerated `packages/provider/cost/src/frontier/data.ts` and
`docs/frontier.md`. A `t2v` or `i2v` refresh also re-derives `r2v`, from the
models that already have an entry in `r2v/endpoints.json`; the script lists the
source models it left out so a newly served one can be added by hand and
re-derived with `pnpm run fetch:frontier -- r2v`. The generator refuses a
derived list that no longer matches its sources.

`scripts/fetch-frontier.mjs` is the only code that downloads a leaderboard, and
only when a person runs it. Nothing in the build, tests, or CI may download a
leaderboard or a price; the parsing in
`scripts/lib/frontier-leaderboard-parse.mjs` takes page text and never reaches
the network.
