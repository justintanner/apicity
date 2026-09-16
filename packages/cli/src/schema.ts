// Minimal Zod 3/4 -> JSON Schema converter. We deliberately do not import zod:
// providers carry different Zod majors, so this reads schema internals through
// duck-typing. Anything unrecognized degrades to `{}` (any JSON value), which
// is still useful documentation.

export type JsonSchema = Record<string, unknown>;

interface ZodDef {
  typeName?: string;
  type?: unknown;
  element?: unknown;
  innerType?: unknown;
  shape?: unknown;
  values?: unknown;
  entries?: unknown;
  options?: unknown;
  value?: unknown;
  items?: unknown;
  valueType?: unknown;
  keyType?: unknown;
  schema?: unknown;
  left?: ZodSchemaLike;
  right?: ZodSchemaLike;
  in?: ZodSchemaLike;
  out?: ZodSchemaLike;
  description?: string;
  checks?: readonly ZodCheckLike[];
  defaultValue?: unknown;
  minLength?: unknown;
  maxLength?: unknown;
  exactLength?: unknown;
}

interface ZodCheckDef {
  check?: string;
  type?: string;
  value?: number;
  minimum?: number;
  maximum?: number;
  length?: number;
  inclusive?: boolean;
  pattern?: RegExp;
  format?: string;
}

interface ZodCheckLike extends ZodCheckDef {
  kind?: string;
  regex?: RegExp;
  _zod?: { def?: ZodCheckDef };
  def?: ZodCheckDef;
  isInt?: boolean;
}

export interface ZodSchemaLike {
  _def?: ZodDef;
  def?: ZodDef;
  description?: string;
  enum?: Record<string, unknown>;
  format?: string | null;
  isInt?: boolean;
  isOptional?: () => boolean;
  options?: readonly unknown[];
  shape?: Record<string, ZodSchemaLike>;
}

const ZOD_KIND_BY_TYPE: Record<string, string> = {
  ZodAny: "any",
  ZodArray: "array",
  ZodBigInt: "bigint",
  ZodBoolean: "boolean",
  ZodBranded: "branded",
  ZodCatch: "catch",
  ZodDefault: "default",
  ZodDiscriminatedUnion: "discriminatedUnion",
  ZodEffects: "effects",
  ZodEnum: "enum",
  ZodIntersection: "intersection",
  ZodLiteral: "literal",
  ZodMap: "map",
  ZodNativeEnum: "nativeEnum",
  ZodNever: "never",
  ZodNull: "null",
  ZodNullable: "nullable",
  ZodNumber: "number",
  ZodObject: "object",
  ZodOptional: "optional",
  ZodPipeline: "pipe",
  ZodPipe: "pipe",
  ZodReadonly: "readonly",
  ZodRecord: "record",
  ZodString: "string",
  ZodTuple: "tuple",
  ZodUndefined: "undefined",
  ZodUnion: "union",
  ZodUnknown: "unknown",
  ZodVoid: "void",
};

const TRANSPARENT_WRAPPER_KINDS = new Set([
  "branded",
  "catch",
  "default",
  "effects",
  "nullable",
  "optional",
  "readonly",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isZodLike(value: unknown): value is ZodSchemaLike {
  return isRecord(value) && ("_def" in value || "def" in value);
}

function getDef(schema: unknown): ZodDef | undefined {
  if (!isZodLike(schema)) return undefined;
  return schema._def ?? schema.def;
}

function getKind(schema: unknown): string | undefined {
  const def = getDef(schema);
  const type = def?.typeName ?? def?.type;
  if (typeof type !== "string") return undefined;
  return ZOD_KIND_BY_TYPE[type] ?? type;
}

/**
 * Return the schema used for introspection after peeling Zod wrappers that do
 * not change the underlying field vocabulary.
 */
export function unwrapZodSchema(schema: unknown): unknown {
  let current = schema;
  const seen = new Set<unknown>();

  while (isZodLike(current) && !seen.has(current)) {
    seen.add(current);
    const def = getDef(current);
    const kind = getKind(current);
    if (!def || !kind) break;

    if (TRANSPARENT_WRAPPER_KINDS.has(kind) && def.innerType) {
      current = def.innerType;
      continue;
    }
    if (kind === "effects" && def.schema) {
      current = def.schema;
      continue;
    }
    if (kind === "pipe" && (def.in ?? def.out)) {
      current = def.in ?? def.out;
      continue;
    }
    break;
  }

  return current;
}

export function getZodObjectShape(
  schema: unknown
): Record<string, ZodSchemaLike> | undefined {
  const unwrapped = unwrapZodSchema(schema);
  const def = getDef(unwrapped);
  if (getKind(unwrapped) !== "object") return undefined;
  return getShape(def, unwrapped);
}

export function getZodEnumValues(schema: unknown): readonly unknown[] {
  const unwrapped = unwrapZodSchema(schema);
  const def = getDef(unwrapped);
  const kind = getKind(unwrapped);
  if (kind !== "enum" && kind !== "nativeEnum") return [];

  if (isZodLike(unwrapped) && Array.isArray(unwrapped.options)) {
    return [...unwrapped.options];
  }
  if (Array.isArray(def?.values)) return [...def.values];
  if (def?.values instanceof Set) return [...def.values];
  if (def?.entries) return enumObjectValues(def.entries);
  if (isRecord(def?.values)) return enumObjectValues(def.values);
  if (isZodLike(unwrapped) && unwrapped.enum) {
    return enumObjectValues(unwrapped.enum);
  }
  return [];
}

export function getZodDefaultValue(schema: unknown): unknown {
  let current = schema;
  const seen = new Set<unknown>();

  while (isZodLike(current) && !seen.has(current)) {
    seen.add(current);
    const def = getDef(current);
    const kind = getKind(current);
    if (!def || !kind) return undefined;
    if (kind === "default") return readDefaultValue(def.defaultValue);
    if (TRANSPARENT_WRAPPER_KINDS.has(kind) && def.innerType) {
      current = def.innerType;
      continue;
    }
    if (kind === "effects" && def.schema) {
      current = def.schema;
      continue;
    }
    if (kind === "pipe" && (def.in ?? def.out)) {
      current = def.in ?? def.out;
      continue;
    }
    return undefined;
  }

  return undefined;
}

export function isOptionalZodSchema(schema: unknown): boolean {
  if (!isZodLike(schema)) return true;
  const kind = getKind(schema);
  const def = getDef(schema);
  if (kind === "optional" || kind === "default" || kind === "catch") {
    return true;
  }
  if (
    (kind === "nullable" || kind === "readonly" || kind === "branded") &&
    def?.innerType
  ) {
    return isOptionalZodSchema(def.innerType);
  }
  if (kind === "effects" && def?.schema) return isOptionalZodSchema(def.schema);
  if (kind === "pipe" && (def?.in ?? def?.out)) {
    return isOptionalZodSchema(def.in ?? def.out);
  }
  try {
    return schema.isOptional?.() === true;
  } catch {
    return false;
  }
}

export function zodToJsonSchema(schema: unknown): JsonSchema {
  if (!isZodLike(schema)) return {};
  const def = getDef(schema);
  if (!def) return {};
  const desc =
    schema.description || def.description
      ? { description: schema.description ?? def.description }
      : {};

  switch (getKind(schema)) {
    case "object": {
      const shape = getZodObjectShape(schema) ?? {};
      const properties: Record<string, JsonSchema> = {};
      const required: string[] = [];
      for (const [key, val] of Object.entries(shape)) {
        properties[key] = zodToJsonSchema(val);
        if (!isOptionalZodSchema(val)) required.push(key);
      }
      return {
        type: "object",
        properties,
        ...(required.length > 0 ? { required } : {}),
        ...desc,
      };
    }
    case "string": {
      const out: JsonSchema = { type: "string", ...desc };
      applyStringChecks(out, def.checks, schema.format ?? undefined);
      return out;
    }
    case "number": {
      const out: JsonSchema = { type: "number", ...desc };
      applyNumberChecks(out, def.checks, schema.isInt);
      return out;
    }
    case "bigint":
      return { type: "integer", ...desc };
    case "boolean":
      return { type: "boolean", ...desc };
    case "null":
      return { type: "null", ...desc };
    case "array": {
      const out: JsonSchema = {
        type: "array",
        items: zodToJsonSchema(getArrayElement(def)),
        ...desc,
      };
      applyArrayChecks(out, def);
      return out;
    }
    case "tuple":
      return {
        type: "array",
        items: getSchemaArray(def.items ?? def.options).map((item) =>
          zodToJsonSchema(item)
        ),
        ...desc,
      };
    case "enum":
    case "nativeEnum": {
      const values = getZodEnumValues(schema);
      return { ...jsonSchemaTypeForValues(values), enum: values, ...desc };
    }
    case "literal": {
      const values = getLiteralValues(def);
      if (values.length === 1) return { const: values[0], ...desc };
      return { ...jsonSchemaTypeForValues(values), enum: values, ...desc };
    }
    case "union":
    case "discriminatedUnion":
      return {
        anyOf: getSchemaArray(def.options).map((option) =>
          zodToJsonSchema(option)
        ),
        ...desc,
      };
    case "intersection":
      return {
        allOf: [zodToJsonSchema(def.left), zodToJsonSchema(def.right)],
        ...desc,
      };
    case "optional":
    case "readonly":
    case "branded":
    case "catch":
      return { ...zodToJsonSchema(def.innerType), ...desc };
    case "nullable":
      return {
        anyOf: [zodToJsonSchema(def.innerType), { type: "null" }],
        ...desc,
      };
    case "default":
      return {
        ...zodToJsonSchema(def.innerType),
        default: readDefaultValue(def.defaultValue),
        ...desc,
      };
    case "effects":
      return { ...zodToJsonSchema(def.schema ?? def.innerType), ...desc };
    case "record":
    case "map":
      return {
        type: "object",
        additionalProperties: zodToJsonSchema(def.valueType),
        ...desc,
      };
    case "any":
    case "unknown":
      return { ...desc };
    case "never":
      return { not: {}, ...desc };
    case "void":
    case "undefined":
      return { type: "null", ...desc };
    case "pipe":
      return mergePipelineSchemas(
        zodToJsonSchema(def.in),
        zodToJsonSchema(def.out),
        desc
      );
    default:
      return { ...desc };
  }
}

function getShape(
  def: ZodDef | undefined,
  schema?: unknown
): Record<string, ZodSchemaLike> | undefined {
  const rawShape = typeof def?.shape === "function" ? def.shape() : def?.shape;
  if (isRecord(rawShape)) return pickZodShape(rawShape);
  if (isZodLike(schema) && isRecord(schema.shape)) {
    return pickZodShape(schema.shape);
  }
  return undefined;
}

function pickZodShape(
  shape: Record<string, unknown>
): Record<string, ZodSchemaLike> {
  return Object.fromEntries(
    Object.entries(shape).filter(([, value]) => isZodLike(value))
  ) as Record<string, ZodSchemaLike>;
}

function getArrayElement(def: ZodDef): unknown {
  return isZodLike(def.type) ? def.type : def.element;
}

function getSchemaArray(value: unknown): ZodSchemaLike[] {
  if (Array.isArray(value)) return value.filter(isZodLike);
  if (value instanceof Map) return Array.from(value.values()).filter(isZodLike);
  return [];
}

function getLiteralValues(def: ZodDef): readonly unknown[] {
  if (Array.isArray(def.values)) return [...def.values];
  if (def.values instanceof Set) return [...def.values];
  return "value" in def ? [def.value] : [];
}

function enumObjectValues(values: unknown): readonly unknown[] {
  if (!isRecord(values)) return [];
  const out: unknown[] = [];
  for (const [key, value] of Object.entries(values)) {
    if (/^\d+$/.test(key) && typeof value === "string") continue;
    if (!out.includes(value)) out.push(value);
  }
  return out;
}

function jsonSchemaTypeForValues(values: readonly unknown[]): JsonSchema {
  if (values.length === 0) return {};
  const types = new Set(values.map(jsonTypeForValue).filter(Boolean));
  if (types.size === 1) return { type: [...types][0] };
  return {};
}

function jsonTypeForValue(value: unknown): string | undefined {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  const type = typeof value;
  if (
    type === "string" ||
    type === "number" ||
    type === "boolean" ||
    type === "object"
  ) {
    return type;
  }
  return undefined;
}

function applyStringChecks(
  out: JsonSchema,
  checks: readonly ZodCheckLike[] | undefined,
  format: string | undefined
): void {
  if (format === "url") out.format = "uri";
  if (format === "email") out.format = "email";

  for (const check of checks ?? []) {
    const details = checkDetails(check);
    if (check.kind === "min" || details.check === "min_length") {
      setNumber(out, "minLength", details.minimum ?? check.value);
    }
    if (check.kind === "max" || details.check === "max_length") {
      setNumber(out, "maxLength", details.maximum ?? check.value);
    }
    if (details.check === "length_equals") {
      setNumber(out, "minLength", details.length);
      setNumber(out, "maxLength", details.length);
    }
    if (check.kind === "url" || details.format === "url") {
      out.format = "uri";
    }
    if (check.kind === "email" || details.format === "email") {
      out.format = "email";
    }
    const pattern = check.regex ?? details.pattern;
    if (
      (check.kind === "regex" || details.format === "regex") &&
      pattern instanceof RegExp
    ) {
      out.pattern = pattern.source;
    }
  }
}

function applyNumberChecks(
  out: JsonSchema,
  checks: readonly ZodCheckLike[] | undefined,
  isInt: boolean | undefined
): void {
  if (isInt) out.type = "integer";

  for (const check of checks ?? []) {
    const details = checkDetails(check);
    const format = details.format ?? check.format;
    if (
      check.kind === "int" ||
      check.isInt === true ||
      details.check === "number_format" ||
      format === "safeint" ||
      format === "int32" ||
      format === "int64"
    ) {
      out.type = "integer";
    }
    if (check.kind === "min") {
      setNumericBound(out, "minimum", "exclusiveMinimum", check.value, check);
    }
    if (check.kind === "max") {
      setNumericBound(out, "maximum", "exclusiveMaximum", check.value, check);
    }
    if (details.check === "greater_than") {
      setNumericBound(
        out,
        "minimum",
        "exclusiveMinimum",
        details.value,
        details
      );
    }
    if (details.check === "less_than") {
      setNumericBound(
        out,
        "maximum",
        "exclusiveMaximum",
        details.value,
        details
      );
    }
  }
}

function applyArrayChecks(out: JsonSchema, def: ZodDef): void {
  setNumber(out, "minItems", readLimit(def, "minLength"));
  setNumber(out, "maxItems", readLimit(def, "maxLength"));
  const exactLength = readLimit(def, "exactLength");
  if (exactLength !== undefined) {
    out.minItems = exactLength;
    out.maxItems = exactLength;
  }
  for (const check of def.checks ?? []) {
    const details = checkDetails(check);
    if (details.check === "min_length") {
      setNumber(out, "minItems", details.minimum);
    }
    if (details.check === "max_length") {
      setNumber(out, "maxItems", details.maximum);
    }
    if (details.check === "length_equals") {
      setNumber(out, "minItems", details.length);
      setNumber(out, "maxItems", details.length);
    }
  }
}

function checkDetails(check: ZodCheckLike): ZodCheckDef {
  return check._zod?.def ?? check.def ?? check;
}

function readLimit(def: ZodDef, key: string): number | undefined {
  const value = (def as Record<string, unknown>)[key];
  if (typeof value === "number") return value;
  if (isRecord(value) && typeof value.value === "number") return value.value;
  return undefined;
}

function setNumber(
  out: JsonSchema,
  key: string,
  value: number | undefined
): void {
  if (typeof value === "number") out[key] = value;
}

function setNumericBound(
  out: JsonSchema,
  inclusiveKey: string,
  exclusiveKey: string,
  value: number | undefined,
  check: { inclusive?: boolean }
): void {
  if (typeof value !== "number") return;
  if (check.inclusive === false) {
    out[exclusiveKey] = value;
  } else {
    out[inclusiveKey] = value;
  }
}

function readDefaultValue(value: unknown): unknown {
  return typeof value === "function" ? (value as () => unknown)() : value;
}

function mergePipelineSchemas(
  input: JsonSchema,
  output: JsonSchema,
  desc: JsonSchema
): JsonSchema {
  const hasComposition =
    "anyOf" in output || "oneOf" in output || "allOf" in output;
  if (input.type === "object" && hasComposition) {
    return { ...input, ...output, type: "object", ...desc };
  }
  if (Object.keys(output).length > 0) return { ...output, ...desc };
  return { ...input, ...desc };
}
