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
  { name: "skill", summary: "Print the agent skill this CLI ships." },
  {
    name: "skill install",
    summary: "Install that skill into ~/.agents/skills/apicity.",
  },
  {
    name: "setup",
    summary: "Install the skill and connect the agents on this host.",
  },
  {
    name: "setup claude",
    summary: "Install the skill and the Claude Code plugin.",
  },
  { name: "setup codex", summary: "Install the skill Codex reads." },
  {
    name: "setup agents",
    summary: "Install the skill; connect an agent when one is unambiguous.",
  },
  {
    name: "setup 1password",
    summary: "Save a 1Password vault and token to the CLI's env file.",
  },
  { name: "doctor", summary: "Check this host's apicity install, row by row." },
  { name: "help", summary: "Print this message." },
  { name: "version", summary: "Print the @apicity/cli version." },
];
