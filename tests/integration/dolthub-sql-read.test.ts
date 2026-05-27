import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { dolthub } from "@apicity/dolthub";

describe("dolthub sql read integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should read from a public database", async () => {
    ctx = setupPolly("dolthub/sql-read-show-tables");
    const provider = dolthub();
    const result = await provider.v1alpha1.sql.read({
      owner: "dolthub",
      database: "ip-to-country",
      ref: "master",
      query: "SHOW TABLES",
    });
    expect(result.query_execution_status).toBe("Success");
    expect(result.repository_owner).toBe("dolthub");
    expect(result.repository_name).toBe("ip-to-country");
    expect(result.rows.length).toBeGreaterThan(0);
  });

  it("should read with a SELECT query", async () => {
    ctx = setupPolly("dolthub/sql-read-select");
    const provider = dolthub();
    const result = await provider.v1alpha1.sql.read({
      owner: "dolthub",
      database: "ip-to-country",
      ref: "master",
      query:
        "SELECT * FROM IPv4ToCountry WHERE CountryCode2Letter = 'AU' LIMIT 1",
    });
    expect(result.query_execution_status).toBe("Success");
    expect(result.rows.length).toBe(1);
    expect(result.schema.length).toBeGreaterThan(0);
  });
});
