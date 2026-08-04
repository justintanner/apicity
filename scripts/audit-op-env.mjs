#!/usr/bin/env node

import { readFile } from "node:fs/promises";

import {
  auditOpEnv,
  renderAuditErrors,
  renderAuditResult,
} from "./lib/audit-op-env.mjs";

try {
  const envFile = await readFile(".env", "utf8");
  const result = await auditOpEnv(envFile);

  console.log(renderAuditResult(result));

  for (const error of renderAuditErrors(result)) {
    console.error(error);
  }

  if (!result.ok) {
    process.exitCode = 1;
  }
} catch {
  console.error("1Password environment audit failed");
  process.exitCode = 1;
}
