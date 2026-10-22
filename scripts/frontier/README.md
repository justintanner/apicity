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

`t2i`, `i2i`, and `i2v` have directories. `t2v`, `v2v`, and `r2v` stay in the
catalog until their own snapshots land.

Paste the new JSON, bump the capture date, then run `pnpm run gen:frontier`
and `pnpm run doc-gen`. Commit the JSON with the regenerated
`packages/provider/cost/src/frontier/data.ts` and `docs/frontier.md`. Nothing
in code, tests, or CI may download a leaderboard or a price.
