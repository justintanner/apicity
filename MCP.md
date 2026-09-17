# MCP support was removed

apicity no longer ships an MCP server. The `apicity mcp` subcommand, the
`apicity-mcp` compatibility bin and the stdio server that `@apicity/mcp-server`
used to be were removed on 2026-09-17 by the operator's decision
(remove-mcp-entirely). No published `@apicity/cli` ever carried them:
`npm view @apicity/cli` answered `E404` on 2026-09-17. The last release with an
MCP server is `@apicity/mcp-server` 0.11.2 (2026-09-02); that package receives
no further releases.

## Use the CLI and the agent skill instead

```bash
npm install -g @apicity/cli
apicity setup claude     # or: apicity setup codex, apicity setup agents
apicity doctor
```

Agents then call `apicity <provider> <dotPath>` after `apicity commands` and
`apicity describe`. The reference is [packages/cli/README.md](packages/cli/README.md);
the "CLI and coding agents" section of the [root README](README.md) covers the
host setup.

## If the server was registered

- Claude Code: `claude mcp remove apicity`.
- Codex: `codex mcp remove apicity`.
- Any other client: delete the `apicity` entry from its MCP configuration file.
- A launcher script that execs the old `apicity-mcp` bin is retired, not
  repointed; this repository's own city launcher is one such script.
- Agents that cannot install plugins read the standard `AGENTS.md` sentence:
  "apicity is driven through the `apicity` CLI on PATH, never an MCP server.
  Run `apicity --help` for the command set and `apicity skill` for the agent
  guide."
