import { describe, expect, it } from "vitest";

import {
  PAID_ENDPOINTS,
  canonicalHash,
  endpointBilling,
  isPaidEndpoint,
  mintOtp,
} from "@apicity/cost";

import {
  isBilledKind,
  loadCatalog,
  type CatalogEntry,
} from "../../packages/cli/src/catalog";
import { loadCostHelpers } from "../../packages/cli/src/cost";
import {
  dispatchThroughGate,
  gateRequest,
} from "../../packages/cli/src/paygate";

const SECRET = "coverage-test-secret";

function samplePositional(entry: CatalogEntry): Record<string, string> {
  return Object.fromEntries(entry.pathParams.map((p) => [p, `sample-${p}`]));
}

describe("catalog-wide CLI pay-gate coverage", () => {
  it("keeps the SDK registry scoped to kie and xai", () => {
    const providers = new Set(PAID_ENDPOINTS.map((e) => e.key.provider));
    expect([...providers].sort()).toEqual(["kie", "xai"]);
  });

  it("derives paid, gated and gate consistently with PAID_ENDPOINTS and endpointBilling on every row", async () => {
    const catalog = await loadCatalog({ env: {} });
    const mismatches: string[] = [];

    for (const entry of catalog) {
      const inRegistry = isPaidEndpoint(
        entry.provider,
        entry.method,
        entry.dotPath
      );
      const billing = endpointBilling(
        entry.provider,
        entry.method,
        entry.dotPath
      ).kind;
      const expectedPaid = inRegistry || isBilledKind(billing);
      const expectedGate = inRegistry ? "sdk" : expectedPaid ? "cli" : "none";

      if (
        entry.billing !== billing ||
        entry.paid !== expectedPaid ||
        entry.gated !== expectedPaid ||
        entry.gate !== expectedGate
      ) {
        mismatches.push(`${entry.provider} ${entry.method} ${entry.dotPath}`);
      }
    }

    expect(mismatches).toEqual([]);
  });

  it("refuses every gate: cli row on an armed host without an OTP before dispatch", async () => {
    const catalog = await loadCatalog({ env: {} });
    const helpers = await loadCostHelpers();
    const cliRows = catalog.filter((entry) => entry.gate === "cli");
    expect(cliRows.length).toBeGreaterThan(0);

    for (const entry of cliRows) {
      let dispatched = 0;
      const request = gateRequest(entry, samplePositional(entry), {});
      await expect(
        dispatchThroughGate(
          {
            entry,
            request,
            secret: SECRET,
            dispatch: () => {
              dispatched++;
              return Promise.resolve("ok");
            },
          },
          helpers
        ),
        `${entry.provider} ${entry.method} ${entry.dotPath}`
      ).rejects.toMatchObject({ name: "PayGateError", code: "otp-missing" });
      expect(
        dispatched,
        `${entry.provider} ${entry.method} ${entry.dotPath}`
      ).toBe(0);
    }
  });

  it("lets every gate: cli row pass on an armed host with a valid minted OTP", async () => {
    const catalog = await loadCatalog({ env: {} });
    const helpers = await loadCostHelpers();
    const cliRows = catalog.filter((entry) => entry.gate === "cli");

    for (const entry of cliRows) {
      let dispatched = 0;
      const request = gateRequest(entry, samplePositional(entry), {});
      const otp = mintOtp(SECRET, {
        provider: entry.provider,
        method: entry.method,
        dotPath: entry.dotPath,
        requestHash: canonicalHash(request),
      });
      const result = await dispatchThroughGate(
        {
          entry,
          request,
          otp,
          secret: SECRET,
          dispatch: () => {
            dispatched++;
            return Promise.resolve("ok");
          },
        },
        helpers
      );
      expect(result).toBe("ok");
      expect(
        dispatched,
        `${entry.provider} ${entry.method} ${entry.dotPath}`
      ).toBe(1);
    }
  });

  it("leaves every row that does not bill alone even with the gate armed", async () => {
    const catalog = await loadCatalog({ env: {} });
    const helpers = await loadCostHelpers();
    const freeRows = catalog.filter((entry) => entry.gate === "none");
    expect(freeRows.length).toBeGreaterThan(0);

    for (const entry of freeRows) {
      let dispatched = 0;
      const request = gateRequest(entry, samplePositional(entry), {});
      const result = await dispatchThroughGate(
        {
          entry,
          request,
          secret: SECRET,
          dispatch: () => {
            dispatched++;
            return Promise.resolve("ok");
          },
        },
        helpers
      );
      expect(result).toBe("ok");
      expect(
        dispatched,
        `${entry.provider} ${entry.method} ${entry.dotPath}`
      ).toBe(1);
    }
  });

  it("lets every catalog row run without an OTP on a host with no secret", async () => {
    const catalog = await loadCatalog({ env: {} });
    const helpers = await loadCostHelpers();

    for (const entry of catalog) {
      let dispatched = 0;
      const request = gateRequest(entry, samplePositional(entry), {});
      const result = await dispatchThroughGate(
        {
          entry,
          request,
          dispatch: () => {
            dispatched++;
            return Promise.resolve("ok");
          },
        },
        helpers
      );
      expect(result).toBe("ok");
      expect(
        dispatched,
        `${entry.provider} ${entry.method} ${entry.dotPath}`
      ).toBe(1);
    }
  });

  it("refuses --otp on every gate: cli row when no secret is configured", async () => {
    const catalog = await loadCatalog({ env: {} });
    const helpers = await loadCostHelpers();
    const cliRows = catalog.filter((entry) => entry.gate === "cli");

    for (const entry of cliRows) {
      let dispatched = 0;
      const request = gateRequest(entry, samplePositional(entry), {});
      await expect(
        dispatchThroughGate(
          {
            entry,
            request,
            otp: "not-a-token",
            dispatch: () => {
              dispatched++;
              return Promise.resolve("ok");
            },
          },
          helpers
        ),
        `${entry.provider} ${entry.method} ${entry.dotPath}`
      ).rejects.toMatchObject({
        name: "PayGateError",
        code: "paygate-not-configured",
      });
      expect(dispatched).toBe(0);
    }
  });
});
