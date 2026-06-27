import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const formulaPath = ".beads/formulas/mol-apicity-add.formula.toml";

function readFormula(): string {
  return fs.readFileSync(formulaPath, "utf8");
}

function readStepIds(): string[] {
  return readFormula()
    .split(/\n\[\[steps\]\]\n/)
    .slice(1)
    .map((block) => block.match(/^id = "([^"]+)"/m)?.[1])
    .filter((id): id is string => id !== undefined);
}

function launcherFormulaNames(): string[] {
  return fs
    .readdirSync("formulas")
    .filter((name) => name.endsWith(".formula.toml"))
    .sort();
}

function catalogFormulaNames(): string[] {
  return fs
    .readdirSync(".beads/formulas")
    .filter((name) => name.endsWith(".toml"))
    .sort();
}

function varBlock(name: string): string {
  const formula = readFormula();
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = formula.match(
    new RegExp(
      `\\[vars\\.${escaped}\\]([\\s\\S]*?)(?=\\n\\[vars\\.|\\n\\[\\[steps\\]\\]|$)`
    )
  );

  if (!match) {
    throw new Error(`Could not find variable block for ${name}`);
  }

  return match[1];
}

describe("mol-apicity-add formula catalog", () => {
  it("exposes one Apicity ad-hoc work launcher", () => {
    const launcherNames = launcherFormulaNames();
    const catalogNames = catalogFormulaNames();

    expect(launcherNames).toContain("mol-apicity-add.formula.toml");
    expect(launcherNames).not.toContain("mol-apicity-work.formula.toml");
    expect(launcherNames).not.toContain(
      "mol-apicity-breakdown-work.formula.toml"
    );
    expect(catalogNames).not.toContain("mol-apicity-work.formula.toml");
    expect(catalogNames).not.toContain(
      "mol-apicity-breakdown-work.formula.toml"
    );
    expect(catalogNames).not.toContain("mol-do-work.formula.toml");
    expect(catalogNames).not.toContain("mol-do-work.toml");
  });

  it("uses a description-driven launch surface", () => {
    const formula = readFormula();
    const launcher = path.join("formulas", "mol-apicity-add.formula.toml");

    expect(formula).toContain('formula = "mol-apicity-add"');
    // v2-graph workflow root is now declared via [requires] formula_compiler (>=2.0.0),
    // replacing the deprecated `contract = "graph.v2"` (gc doctor formula-requirements).
    expect(formula).toContain('formula_compiler = ">=2.0.0"');
    expect(fs.lstatSync(launcher).isSymbolicLink()).toBe(true);
    expect(fs.readlinkSync(launcher)).toBe(
      "../.beads/formulas/mol-apicity-add.formula.toml"
    );
    expect(varBlock("work_description")).toContain("required = true");
    expect(formula).not.toMatch(/\[vars\.title\]/);
    expect(formula).not.toMatch(/\[vars\.route_target\]/);
    expect(formula).not.toMatch(/\[vars\.tracking_bead\]/);
    expect(formula).not.toMatch(/\[vars\.operations_json\]/);
  });

  it("documents classification, routing, and dependency creation", () => {
    const formula = readFormula();

    expect(readStepIds()).toEqual([
      "load-work-description",
      "classify-work",
      "create-routed-work",
      "verify-routing",
      "handoff",
    ]);
    expect(formula).toContain("standalone");
    expect(formula).toContain("multi");
    expect(formula).toContain("epic");
    expect(formula).toContain('const ROUTE_TARGET = "apicity/gastown.polecat"');
    expect(formula).toContain('"gc.routed_to": ROUTE_TARGET');
    expect(formula).toContain("depends_on");
    expect(formula).toContain(
      'run(["dep", created.get(dependency), "--blocks", created.get(bead.key)])'
    );
  });
});
