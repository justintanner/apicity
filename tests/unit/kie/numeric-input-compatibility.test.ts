import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { KIE_MEDIA_MODELS } from "@apicity/kie/zod";
import { CREATE_TASK_GUARDS } from "../../../packages/provider/kie/src/kie";
import {
  type JsonSchema,
  zodToJsonSchema,
} from "../../../packages/mcp-server/src/schema";

const AUDIT_PATH = resolve(
  import.meta.dirname,
  "../../../docs/kie-numeric-input-compatibility.md"
);
const INVENTORY_START = "<!-- numeric-inventory:start -->";
const INVENTORY_END = "<!-- numeric-inventory:end -->";

type NumericKind =
  | "integer"
  | "number"
  | "numeric-string-enum"
  | "numeric-string-pattern";

interface NumericVariant {
  kind: NumericKind;
  minimum?: number;
  maximum?: number;
  defaultValue?: unknown;
  values?: string[];
  pattern?: string;
}

interface DerivedRow {
  model: string;
  path: string;
  required: boolean;
  variants: NumericVariant[];
}

interface AuditRow {
  model: string;
  path: string;
  localContract: string;
  officialSource: string;
  declaredType: string;
  exampleType: string;
  observation: string;
  classification: string;
  confidence: string;
  decision: string;
}

const CLASSIFICATIONS = new Set([
  "number-only",
  "numeric-string-only",
  "both",
  "unknown",
]);
const CONFIDENCE_LEVELS = new Set(["high", "medium", "low"]);

function isRecord(value: unknown): value is JsonSchema {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asRecord(value: unknown, location: string): JsonSchema {
  if (!isRecord(value)) {
    throw new Error(
      `Unrecognized JSON Schema branch at ${location}: expected an object, ` +
        `received ${JSON.stringify(value)}`
    );
  }
  return value;
}

function asSchemaArray(value: unknown, location: string): JsonSchema[] {
  if (!Array.isArray(value)) {
    throw new Error(
      `Unrecognized JSON Schema branch at ${location}: expected an array, ` +
        `received ${JSON.stringify(value)}`
    );
  }
  return value.map((entry, index) => asRecord(entry, `${location}[${index}]`));
}

function isNumericString(value: unknown): value is string {
  return (
    typeof value === "string" && /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value)
  );
}

function isNumericStringPattern(pattern: string): boolean {
  let expression: RegExp;
  try {
    expression = new RegExp(pattern);
  } catch {
    return false;
  }

  const numericSamples = [
    "-1",
    "0",
    "1",
    "3",
    "4",
    "5",
    "6",
    "8",
    "10",
    "15",
    "30",
    "720",
    "1080",
    "1.5",
  ];
  const nonNumericSamples = ["", "x", "x1", "1x", "1:1", "1x1"];

  return (
    numericSamples.some((sample) => expression.test(sample)) &&
    nonNumericSamples.every((sample) => !expression.test(sample))
  );
}

function numericVariant(schema: JsonSchema): NumericVariant | undefined {
  if (schema.type === "integer" || schema.type === "number") {
    return {
      kind: schema.type,
      ...(typeof schema.minimum === "number"
        ? { minimum: schema.minimum }
        : {}),
      ...(typeof schema.maximum === "number"
        ? { maximum: schema.maximum }
        : {}),
      ...(Object.hasOwn(schema, "default")
        ? { defaultValue: schema.default }
        : {}),
    };
  }

  if (schema.type !== "string") return undefined;

  if (
    Array.isArray(schema.enum) &&
    schema.enum.length > 0 &&
    schema.enum.every(isNumericString)
  ) {
    return {
      kind: "numeric-string-enum",
      values: [...schema.enum],
      ...(Object.hasOwn(schema, "default")
        ? { defaultValue: schema.default }
        : {}),
    };
  }

  if (
    typeof schema.pattern === "string" &&
    isNumericStringPattern(schema.pattern)
  ) {
    return {
      kind: "numeric-string-pattern",
      pattern: schema.pattern,
      ...(Object.hasOwn(schema, "default")
        ? { defaultValue: schema.default }
        : {}),
    };
  }

  return undefined;
}

function addNumericRow(
  rows: Map<string, DerivedRow>,
  model: string,
  path: string,
  required: boolean,
  variant: NumericVariant
): void {
  const key = `${model}::${path}`;
  const row = rows.get(key) ?? {
    model,
    path,
    required,
    variants: [],
  };
  row.required = row.required && required;

  const serialized = JSON.stringify(variant);
  if (!row.variants.some((current) => JSON.stringify(current) === serialized)) {
    row.variants.push(variant);
  }
  rows.set(key, row);
}

function walkInputSchema(
  rows: Map<string, DerivedRow>,
  model: string,
  schema: JsonSchema,
  path: string,
  required: boolean
): void {
  const branchKeys = ["anyOf", "oneOf"].filter((key) =>
    Object.hasOwn(schema, key)
  );
  if (branchKeys.length > 1) {
    throw new Error(
      `Unrecognized JSON Schema branch at ${model}.${path}: both anyOf and ` +
        `oneOf are present`
    );
  }
  if (branchKeys.length === 1) {
    const key = branchKeys[0];
    for (const branch of asSchemaArray(
      schema[key],
      `${model}.${path}.${key}`
    )) {
      walkInputSchema(rows, model, branch, path, required);
    }
    return;
  }

  if (schema.type === "object") {
    const properties = asRecord(
      schema.properties,
      `${model}.${path}.properties`
    );
    const requiredFields = new Set(
      Array.isArray(schema.required)
        ? schema.required.filter(
            (value): value is string => typeof value === "string"
          )
        : []
    );
    for (const [name, child] of Object.entries(properties)) {
      walkInputSchema(
        rows,
        model,
        asRecord(child, `${model}.${path}.properties.${name}`),
        `${path}.${name}`,
        required && requiredFields.has(name)
      );
    }
    return;
  }

  if (schema.type === "array") {
    const items = Array.isArray(schema.items)
      ? asSchemaArray(schema.items, `${model}.${path}.items`)
      : [asRecord(schema.items, `${model}.${path}.items`)];
    for (const item of items) {
      walkInputSchema(rows, model, item, `${path}[]`, required);
    }
    return;
  }

  const variant = numericVariant(schema);
  if (variant) {
    addNumericRow(rows, model, path, required, variant);
    return;
  }

  if (
    schema.type === "string" ||
    schema.type === "boolean" ||
    schema.type === "null" ||
    Object.hasOwn(schema, "const") ||
    Array.isArray(schema.enum) ||
    Object.keys(schema).every((key) => key === "description")
  ) {
    return;
  }

  throw new Error(
    `Unrecognized JSON Schema branch at ${model}.${path}: ` +
      JSON.stringify(schema)
  );
}

function deriveNumericRows(): DerivedRow[] {
  const rows = new Map<string, DerivedRow>();

  for (const model of KIE_MEDIA_MODELS) {
    const guard = CREATE_TASK_GUARDS[model];
    if (!guard) {
      throw new Error(
        `KIE_MEDIA_MODELS entry ${model} has no CREATE_TASK_GUARDS schema`
      );
    }
    const requestSchema = zodToJsonSchema(guard);
    const properties = asRecord(
      requestSchema.properties,
      `${model}.properties`
    );
    const input = asRecord(properties.input, `${model}.properties.input`);
    walkInputSchema(rows, model, input, "input", true);
  }

  return [...rows.values()];
}

function formatValue(value: unknown): string {
  return typeof value === "string" ? JSON.stringify(value) : String(value);
}

function escapeMarkdownCell(value: string): string {
  return value.replaceAll("|", "&#124;").replaceAll("*", "\\*");
}

function formatVariant(variant: NumericVariant): string {
  const details: string[] = [];

  if (variant.kind === "numeric-string-enum") {
    details.push(
      `numeric-string enum=${variant.values?.map(formatValue).join(",")}`
    );
  } else if (variant.kind === "numeric-string-pattern") {
    details.push(`numeric-string pattern=${variant.pattern}`);
  } else {
    details.push(variant.kind);
  }

  if (variant.minimum !== undefined) {
    details.push(`min=${variant.minimum}`);
  }
  if (variant.maximum !== undefined) {
    details.push(`max=${variant.maximum}`);
  }
  if (variant.defaultValue !== undefined) {
    details.push(`default=${formatValue(variant.defaultValue)}`);
  }

  return escapeMarkdownCell(details.join(" "));
}

function formatLocalContract(row: DerivedRow): string {
  const variants = [...row.variants]
    .sort((left, right) => left.kind.localeCompare(right.kind))
    .map(formatVariant)
    .join(" + ");
  return `${row.required ? "required" : "optional"}; ${variants}`;
}

function parseInventory(): AuditRow[] {
  const audit = readFileSync(AUDIT_PATH, "utf8");
  const start = audit.indexOf(INVENTORY_START);
  const end = audit.indexOf(INVENTORY_END);
  if (start < 0 || end < 0 || end <= start) {
    throw new Error(
      `${AUDIT_PATH} must contain ${INVENTORY_START} and ${INVENTORY_END} ` +
        `in that order`
    );
  }

  const table = audit.slice(start + INVENTORY_START.length, end);
  const parsed = table
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|") && line.endsWith("|"))
    .map((line) =>
      line
        .slice(1, -1)
        .split("|")
        .map((cell) => cell.trim())
    );

  const header = parsed.shift();
  expect(header).toEqual([
    "Model",
    "Input path",
    "Local contract",
    "Official source",
    "Declared JSON type",
    "Example JSON type",
    "Observation",
    "Classification",
    "Confidence",
    "Decision",
  ]);

  const separator = parsed.shift();
  expect(separator).toHaveLength(10);
  expect(separator?.every((cell) => /^:?-+:?$/.test(cell))).toBe(true);

  return parsed.map((cells, index) => {
    if (cells.length !== 10) {
      throw new Error(
        `Inventory row ${index + 1} has ${cells.length} columns; expected 10: ` +
          JSON.stringify(cells)
      );
    }
    const [
      model,
      path,
      localContract,
      officialSource,
      declaredType,
      exampleType,
      observation,
      classification,
      confidence,
      decision,
    ] = cells;
    return {
      model,
      path,
      localContract,
      officialSource,
      declaredType,
      exampleType,
      observation,
      classification,
      confidence,
      decision,
    };
  });
}

describe("KIE numeric input compatibility inventory", () => {
  it("matches every catalogue-linked numeric input path exactly", () => {
    const expected = deriveNumericRows();
    const actual = parseInventory();
    const expectedByKey = new Map(
      expected.map((row) => [`${row.model}::${row.path}`, row])
    );
    const actualByKey = new Map(
      actual.map((row) => [`${row.model}::${row.path}`, row])
    );

    const duplicateKeys = actual
      .map((row) => `${row.model}::${row.path}`)
      .filter((key, index, keys) => keys.indexOf(key) !== index);
    expect(duplicateKeys, "Duplicate model/path inventory rows").toEqual([]);

    const missing = [...expectedByKey.keys()].filter(
      (key) => !actualByKey.has(key)
    );
    const extra = [...actualByKey.keys()].filter(
      (key) => !expectedByKey.has(key)
    );
    expect(
      { missing, extra },
      `Numeric inventory drift. Add missing rows and remove stale rows in ` +
        `docs/kie-numeric-input-compatibility.md.`
    ).toEqual({ missing: [], extra: [] });

    const contractMismatches = expected.flatMap((row) => {
      const key = `${row.model}::${row.path}`;
      const documented = actualByKey.get(key)?.localContract;
      const derived = formatLocalContract(row);
      return documented === derived
        ? []
        : [`${key}: documented=${documented}; derived=${derived}`];
    });
    expect(
      contractMismatches,
      "Local contract facts must be updated when a linked schema changes"
    ).toEqual([]);
  });

  it("records evidence, classification, confidence, and a decision per row", () => {
    const rows = parseInventory();

    for (const row of rows) {
      const key = `${row.model}::${row.path}`;
      expect(row.officialSource, `${key} official source`).not.toBe("");
      expect(row.declaredType, `${key} declared JSON type`).not.toBe("");
      expect(row.exampleType, `${key} example JSON type`).not.toBe("");
      expect(row.observation, `${key} observation`).not.toBe("");
      expect(
        CLASSIFICATIONS.has(row.classification),
        `${key} classification ${row.classification}`
      ).toBe(true);
      expect(
        CONFIDENCE_LEVELS.has(row.confidence),
        `${key} confidence ${row.confidence}`
      ).toBe(true);
      expect(row.decision, `${key} decision`).not.toBe("");
    }
  });
});
