# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial release.
- `apicity setup 1password --op-vault <vault> --op-token <token>` saves the
  1Password vault and service-account token to the CLI's env file
  (`APICITY_OP_VAULT` and `APICITY_OP_SERVICE_TOKEN`, the token as given, so
  `env:VAR` keeps it off disk) and checks the pair once with `op item list`.
  `--no-verify` skips the check, and `--remove` deletes the two lines. A new
  directory is created `0700` and a new file `0600`.
- `op://vault/item/field` references in the env file or the environment
  resolve for the provider a call addresses, all of them in one `op inject`,
  with the configured token or `op`'s own sign-in.

### Changed

- **Breaking:** the pay gate is opt-in. With no `--paygate-secret-file` and no
  `APICITY_PAYGATE_SECRET_FILE`, a paid endpoint call now goes upstream
  directly. Naming a secret file arms the OTP gate, whose behavior is
  unchanged. An `--otp` given with no secret configured exits 4 `paygate`, and
  its `hint` names `paygate-not-configured`, `--paygate-secret-file` and
  `APICITY_PAYGATE_SECRET_FILE`. A secret file that is empty after trimming is
  exit 1 `usage` (`<path> is empty`) before any provider is built, where it
  used to exit 4. `apicity doctor`'s Paygate Secret File row reports an unset
  file at `ok` ("the pay gate is off") rather than as a warning, and an empty
  file as an `error`. Migration: if you relied on paid calls failing closed by
  default, set `--paygate-secret-file` or `APICITY_PAYGATE_SECRET_FILE`.
- Env-file `op://` lines now resolve, for the addressed provider's variables,
  instead of being skipped. References outside a provider's credential
  variables (`S3_REGION`, `B2_ENDPOINT`, …) are still neither resolved nor
  exported, and a reference that cannot be resolved is exit 3 `auth`, naming
  the variable and the reference.
- A 1Password token without a vault is accepted: it authenticates `op://`
  references, and only the vault convention needs both. A vault without a
  token is still exit 1 `usage`.
- `configured` in `apicity providers`, `commands` and `describe`, and doctor's
  Providers row, now counts an env-file literal, an `op://` reference and the
  vault convention (vault and token both configured), including a pair saved
  in the env file. Those commands still never run `op`.
- `apicity doctor`'s 1Password CLI row reads the vault and token from flags,
  the environment and the env file. It reports a token alone as `ok`, a vault
  alone as an `error`, and with both lists the vault once and warns, by name,
  about provider variables it lacks. It names where the token came from and
  never prints a literal one.
- `SETUP_FORMS` gains `"1password"`; `apicity setup --remove` and the other
  forms' `--remove` never open the env file.
- The Claude Code plugin's SessionStart hook reads `apicity providers --json`
  instead of `apicity doctor --json`, so it never reaches 1Password. The line
  it prints is unchanged.
- `isProviderConfigured(name, env, sources?)`: with `sources` from the new
  `readCredentialSources`, it applies the meaning above; without, it answers
  exactly as before.
- `resolveCredentials` resolves `op://` references ahead of the vault
  convention, accepts a token without a vault, and takes two more seams,
  `listItemTitles` and `injectSecrets`, which `EndpointOptions` passes through.
- `OpInject` takes an optional second parameter, the token the `op` child
  receives as `OP_SERVICE_ACCOUNT_TOKEN`.
- `SubprocessOptions` gains an optional `env`, the variables layered over the
  child's inherited environment, and `SubprocessResult` an optional
  `notFound`, set when the binary is missing.
- `loadCatalog`, `listProviders`, `describeEndpoint`, `runCommands`,
  `runProviders` and `runDescribe` take a `flags` option (`envFile`,
  `opVault`, `opToken`), and their `configured` field now reads the env file
  and counts `op://` references and the vault convention.

### Fixed

- Endpoint descriptions shown by `apicity describe` include root
  request-schema guidance, including the ElevenLabs text-to-speech limit that
  applies when `model_id` is omitted.
