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
  { name: "mcp", summary: "Serve every provider endpoint over MCP on stdio." },
  { name: "help", summary: "Print this message." },
  { name: "version", summary: "Print the @apicity/cli version." },
];
