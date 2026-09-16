export { startServer, type StartServerOptions } from "./mcp/server.js";
export {
  parseMcpArgs,
  printMcpHelp,
  runMcp,
  resolveOpServiceToken,
  resolveOpVault,
  resolveOutputDir,
  resolveOnePasswordOptions,
  type ParsedArgs,
  type ResolvedOnePasswordOptions,
} from "./mcp/cli.js";
/**
 * Pre-rename aliases for the two `apicity-mcp` entrypoints, kept so external
 * callers that imported `@apicity/mcp-server` survive the move to
 * `@apicity/cli`. In-repo callers use the `Mcp` names.
 */
export { parseMcpArgs as parseArgs, runMcp as runCli } from "./mcp/cli.js";
export { readPackageVersion } from "./version.js";
export { loadEnvFile, parseEnvFile } from "./env-file.js";
export {
  fillOnePasswordEnv,
  getProviderEnvVars,
  injectOnePasswordSecrets,
  listOnePasswordItemTitles,
  onePasswordRef,
  readOnePasswordSecret,
  type OnePasswordEnvOptions,
  type OpInject,
  type OpListItemTitles,
  type OpRead,
} from "./one-password.js";
export {
  buildRegistry,
  loadTsv,
  makeToolName,
  toSnakeCase,
  type Endpoint,
  type EndpointTsvRow,
  type BuildRegistryOptions,
} from "./registry.js";
export { PROVIDERS, type ProviderSpec } from "./providers.js";
export {
  getZodDefaultValue,
  getZodEnumValues,
  getZodObjectShape,
  isOptionalZodSchema,
  unwrapZodSchema,
  zodToJsonSchema,
  type JsonSchema,
} from "./schema.js";
export {
  writeBinary,
  downloadUrlsInResult,
  guessExtension,
  isBinary,
} from "./output.js";
export {
  CALL_SHAPES,
  callShapeKey,
  type CallShape,
  type CallShapeField,
  type CallShapePositional,
} from "./call-shapes.js";
export {
  callShapeFor,
  findEntries,
  loadCatalog,
  selectEntry,
  type CatalogEntry,
  type LoadCatalogOptions,
} from "./catalog.js";
export {
  isProviderConfigured,
  providerEnvVars,
  providerNames,
} from "./credentials.js";
export {
  describeEndpoint,
  instantiateForIntrospection,
  listProviders,
  runCommands,
  runDescribe,
  runProviders,
  type CommandsOptions,
  type DescribeOptions,
  type DiscoveryOptions,
  type EndpointDescription,
  type ProviderLoader,
  type ProviderSummary,
} from "./discovery.js";
export {
  exitCodeTable,
  helpTopicText,
  helpTopicsLine,
  isHelpTopic,
  printHelpTopic,
  HELP_TOPICS,
  type HelpTopic,
} from "./help.js";
export { EXIT_CODES, CliError, type CliErrorCode } from "./errors.js";
export { BUILTIN_COMMANDS, type BuiltinCommand } from "./commands.js";
export { runMain } from "./main.js";
export { usageText, type CliWriter } from "./envelope.js";
