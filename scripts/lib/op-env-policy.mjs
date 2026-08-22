export const OP_ENV_CLASSIFICATIONS = Object.freeze({
  CREDENTIAL: "credential",
  SENSITIVE_METADATA: "sensitive_metadata",
  PUBLIC_METADATA: "public_metadata",
});

export const OP_ENV_SOURCES = Object.freeze({
  ONE_PASSWORD: "one_password",
  PUBLIC_LITERAL: "public_literal",
});

/**
 * @typedef {"credential" | "sensitive_metadata" | "public_metadata"}
 *   OpEnvClassification
 */

/**
 * @typedef {object} OnePasswordPolicy
 * @property {OpEnvClassification} classification
 * @property {"one_password"} source
 */

/**
 * @typedef {object} PublicLiteralPolicy
 * @property {"public_metadata"} classification
 * @property {"public_literal"} source
 * @property {readonly string[]} allowedValues
 */

/** @typedef {OnePasswordPolicy | PublicLiteralPolicy} OpEnvPolicyEntry */

/**
 * @param {OpEnvClassification} classification
 * @returns {Readonly<OnePasswordPolicy>}
 */
function onePassword(classification) {
  return Object.freeze({
    classification,
    source: OP_ENV_SOURCES.ONE_PASSWORD,
  });
}

/**
 * @param {readonly string[]} allowedValues
 * @returns {Readonly<PublicLiteralPolicy>}
 */
function publicLiteral(allowedValues) {
  return Object.freeze({
    classification: OP_ENV_CLASSIFICATIONS.PUBLIC_METADATA,
    source: OP_ENV_SOURCES.PUBLIC_LITERAL,
    allowedValues: Object.freeze([...allowedValues]),
  });
}

const credential = () => onePassword(OP_ENV_CLASSIFICATIONS.CREDENTIAL);
const sensitiveMetadata = () =>
  onePassword(OP_ENV_CLASSIFICATIONS.SENSITIVE_METADATA);
const publicMetadata = () =>
  onePassword(OP_ENV_CLASSIFICATIONS.PUBLIC_METADATA);

/**
 * Fail-closed policy for every active assignment in the tracked `.env`.
 *
 * Public metadata may remain 1Password-backed when it is account-specific and
 * not known to cause concealment. A public literal is allowed only when this
 * policy also provides its complete set of accepted values.
 *
 * @type {Readonly<Record<string, Readonly<OpEnvPolicyEntry>>>}
 */
export const OP_ENV_POLICY = Object.freeze({
  OPENAI_API_KEY: credential(),
  KIE_API_KEY: credential(),
  XAI_API_KEY: credential(),
  XAI_MANAGEMENT_API_KEY: credential(),
  KIMI_CODING_API_KEY: credential(),
  ZAI_CODING_PLAN_API_KEY: credential(),
  FAL_API_KEY: credential(),
  FAL_ADMIN_API_KEY: credential(),
  FIREWORKS_API_KEY: credential(),
  FIREWORKS_ACCOUNT_ID: sensitiveMetadata(),
  GOOGLE_API_KEY: credential(),
  GEMINI_API_KEY: credential(),
  ANTHROPIC_API_KEY: credential(),
  DASHSCOPE_API_KEY: credential(),
  ELEVENLABS_API_KEY: credential(),
  DROPBOX_OAUTH_TOKEN: credential(),
  QUO_API_KEY: credential(),

  S3_ACCESS_KEY_ID: credential(),
  S3_SECRET_ACCESS_KEY: credential(),
  S3_REGION: publicMetadata(),
  S3_BUCKET: sensitiveMetadata(),
  S3_ENDPOINT: publicMetadata(),

  B2_ACCESS_KEY_ID: credential(),
  B2_SECRET_ACCESS_KEY: credential(),
  B2_REGION: publicMetadata(),
  B2_BUCKET: sensitiveMetadata(),
  B2_ENDPOINT: publicMetadata(),

  YOUTUBE_ACCESS_TOKEN: credential(),

  IG_CLIENT_ID: sensitiveMetadata(),
  IG_CLIENT_SECRET: credential(),
  IG_ACCESS_TOKEN: credential(),
  IG_USER_ID: sensitiveMetadata(),

  X_CLIENT_ID: sensitiveMetadata(),
  X_CLIENT_SECRET: credential(),

  TELEGRAM_BOT_KEY: credential(),
  TELEGRAM_CHAT_ID: sensitiveMetadata(),

  DOLT_CREDS_JWK: credential(),

  POLYMARKET_ADDRESS: sensitiveMetadata(),
  POLYMARKET_CLOB_API_KEY: credential(),
  POLYMARKET_CLOB_API_SECRET: credential(),
  POLYMARKET_CLOB_API_PASSPHRASE: credential(),
  POLYMARKET_PRIVATE_KEY: credential(),
  POLYMARKET_SIGNATURE_TYPE: publicLiteral(["0", "1", "2", "3"]),
  POLYMARKET_FUNDER_ADDRESS: sensitiveMetadata(),
  DOLTHUB_API_KEY: credential(),
});
