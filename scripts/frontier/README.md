# Refreshing a frontier snapshot

Each task type lives in its own directory under `scripts/frontier/<type>/`.

- `leaderboard.json` — leaderboard id, source URL, capture date, methodology,
  and each entry's rank, model, creator, and Elo. Ranks are contiguous from 1
  and stop at 10. A board with fewer than 10 models lists all of them.
- `endpoints.json` — every leaderboard model, mapped to
  `{ provider, dotPath, modelId? }` or to `[]` when apicity does not serve it.
  `dotPath` is the `scripts/endpoint-docs.tsv` path. A dedicated leaf has no
  `modelId`. A shared callable carries the provider model id.
- `catalog.json` — the six type codes, names, aliases, and leaderboard
  identities. A type with no directory yet ships as an empty registry entry.

All six types have directories. `r2v` is derived, because Artificial Analysis
publishes no reference-to-video leaderboard. Its `leaderboard.json` carries
`derived: true` and `sources` (the `t2v` and `i2v` leaderboard ids) in place of
a `leaderboardId`, and links the first source. Its entries are the models of
both top 10 that have a reference-to-video endpoint, ordered by the better of
their two Elos; equal Elos keep source order, then rank. Each entry carries
that Elo and that board's creator, and needs at least one endpoint.

Paste the new JSON, bump the capture date, then run `pnpm run gen:frontier`
and `pnpm run doc-gen`. Commit the JSON with the regenerated
`packages/provider/cost/src/frontier/data.ts` and `docs/frontier.md`. A `t2v`
or `i2v` refresh also re-derives `r2v`; the generator refuses a derived list
that no longer matches its sources. Nothing in code, tests, or CI may download
a leaderboard or a price.
