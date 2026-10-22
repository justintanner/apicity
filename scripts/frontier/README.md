# Refreshing the image-to-video frontier snapshot

Paste a new leaderboard into `image-to-video-leaderboard.json` (leaderboard id, source URL, capture date, and each entry's rank, model, creator, and Elo), then update `image-to-video-endpoints.json` so every model has an endpoint list or an explicit empty list. Bump the capture date, run `pnpm run doc-gen`, and commit the data files with the regenerated root `README.md`. Nothing in code, tests, or CI may download the leaderboard.
