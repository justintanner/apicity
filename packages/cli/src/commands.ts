export interface BuiltinCommand {
  name: string;
  summary: string;
}

/**
 * Every built-in the dispatcher answers, in the order usage prints them. A
 * first word that is neither one of these nor a provider is `not_found`.
 *
 * W1 ships the three the move needs; later slices append their own entries
 * here rather than declaring a second list.
 */
export const BUILTIN_COMMANDS: readonly BuiltinCommand[] = [
  {
    name: "commands",
    summary: "List every endpoint, or one provider's with --provider.",
  },
  {
    name: "describe",
    summary: "Show one endpoint's schema, example and call shape.",
  },
  { name: "providers", summary: "List providers, their env vars and status." },
  { name: "mcp", summary: "Serve every provider endpoint over MCP on stdio." },
  { name: "help", summary: "Print this message." },
  { name: "version", summary: "Print the @apicity/cli version." },
];
