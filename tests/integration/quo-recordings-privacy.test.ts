import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const FICTIONAL_SENDER = "+15555550101";
const FICTIONAL_RECIPIENT = "+15555550102";
const APPROVED_PHONE_VALUES = new Set([FICTIONAL_SENDER, FICTIONAL_RECIPIENT]);
const E164_PATTERN = /\+[1-9]\d{7,14}/g;

interface HarHeader {
  name?: string;
  value?: string;
}

interface HarEntry {
  request?: {
    headers?: HarHeader[];
  };
}

interface HarRecording {
  log?: {
    entries?: HarEntry[];
  };
}

function collectHarFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectHarFiles(fullPath));
      continue;
    }
    if (entry.name === "recording.har") {
      results.push(fullPath);
    }
  }
  return results;
}

function configuredQuoSecrets(): string[] {
  return Object.entries(process.env)
    .filter(([name, value]) => {
      if (!value || value.startsWith("op://")) {
        return false;
      }
      return (
        name === "QUO_API_KEY" ||
        /^QUO_(?:FROM|TO|SENDER|RECIPIENT)(?:_|$)/.test(name)
      );
    })
    .map(([, value]) => value as string)
    .filter((value) => !APPROVED_PHONE_VALUES.has(value));
}

function assertPrivateQuoValuesAreAbsent(
  serialized: string,
  label: string,
  secrets: string[]
): void {
  for (const secret of secrets) {
    expect(
      serialized,
      `${label} contains a configured live Quo value`
    ).not.toContain(secret);
  }
}

function assertOnlyApprovedPhones(serialized: string, label: string): void {
  const phoneValues = new Set(serialized.match(E164_PATTERN) ?? []);

  expect(phoneValues, `${label} contains unapproved phone values`).toEqual(
    APPROVED_PHONE_VALUES
  );
  expect(serialized, `${label} is missing the fictional sender`).toContain(
    FICTIONAL_SENDER
  );
  expect(serialized, `${label} is missing the fictional recipient`).toContain(
    FICTIONAL_RECIPIENT
  );
}

function assertAuthorizationIsRedacted(har: HarRecording, label: string): void {
  const authorizationHeaders = (har.log?.entries ?? []).flatMap((entry) =>
    (entry.request?.headers ?? []).filter(
      (header) => header.name?.toLowerCase() === "authorization"
    )
  );

  expect(
    authorizationHeaders.length,
    `${label} is missing the recorded Authorization header`
  ).toBeGreaterThan(0);
  for (const header of authorizationHeaders) {
    expect(
      header.value,
      `${label} has an unredacted Authorization header`
    ).toBe("Bearer ***");
  }
}

function assertPrivacySafeHar(
  har: HarRecording,
  label: string,
  secrets = configuredQuoSecrets()
): void {
  const serialized = JSON.stringify(har);
  assertPrivateQuoValuesAreAbsent(serialized, label, secrets);
  assertOnlyApprovedPhones(serialized, label);
  assertAuthorizationIsRedacted(har, label);
}

const safeHar: HarRecording = {
  log: {
    entries: [
      {
        request: {
          headers: [
            { name: "authorization", value: "Bearer ***" },
            {
              name: "x-quo-fixture-values",
              value: `${FICTIONAL_SENDER} ${FICTIONAL_RECIPIENT}`,
            },
          ],
        },
      },
    ],
  },
};

describe("Quo HAR privacy", () => {
  it("keeps the complete committed Quo recording corpus sanitized", () => {
    const recordingsRoot = path.resolve(import.meta.dirname, "../recordings");
    const quoDirectories = fs
      .readdirSync(recordingsRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && entry.name.startsWith("quo_"))
      .map((entry) => path.join(recordingsRoot, entry.name));
    const harFiles = quoDirectories.flatMap(collectHarFiles).sort();
    const quoPackageExists = fs.existsSync(
      path.resolve(import.meta.dirname, "../../packages/provider/quo")
    );

    if (quoPackageExists) {
      expect(
        harFiles.length,
        "the Quo provider must have a committed HAR"
      ).toBeGreaterThan(0);
    }

    for (const filePath of harFiles) {
      const har = JSON.parse(fs.readFileSync(filePath, "utf8")) as HarRecording;
      assertPrivacySafeHar(har, path.relative(recordingsRoot, filePath));
    }
  });

  it("rejects configured secrets and unapproved phone values", () => {
    expect(() => assertPrivacySafeHar(safeHar, "safe.har", [])).not.toThrow();

    const secretHar = structuredClone(safeHar);
    secretHar.log!.entries!.push({
      request: {
        headers: [{ name: "x-test", value: "live-quo-key" }],
      },
    });
    expect(() =>
      assertPrivacySafeHar(secretHar, "secret.har", ["live-quo-key"])
    ).toThrow();

    const phoneHar = structuredClone(safeHar);
    phoneHar.log!.entries!.push({
      request: {
        headers: [{ name: "x-test", value: "+15555550103" }],
      },
    });
    expect(() => assertPrivacySafeHar(phoneHar, "phone.har", [])).toThrow();
  });
});
