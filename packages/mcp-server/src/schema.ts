// Minimal Zod → JSON Schema converter. We deliberately do not import zod:
// providers can bring different Zod majors, so we read schema internals via
// duck-typing. Anything we can't recognize degrades to `{}` (any JSON value),
// which is still useful documentation.

export type JsonSchema = Record<string, unknown>;

interface ZodCheckDef {
  check?: string;
  format?: string;
  inclusive?: boolean;
  maximum?: number;
  minimum?: number;
  pattern?: RegExp;
  value?: number;
}

interface ZodCheck {
  def?: ZodCheckDef;
  format?: string;
  isInt?: boolean;
  kind?: string;
  regex?: RegExp;
  value?: number;
  _zod?: {
    def?: ZodCheckDef;
  };
}

interface ZodDef {
  typeName?: string;
  type?: string | ZodSchemaLike;
  element?: ZodSchemaLike;
  innerType?: ZodSchemaLike;
  shape?: (() => Record<string, ZodSchemaLike>) | Record<string, ZodSchemaLike>;
  values?: readonly unknown[] | Record<string, unknown>;
  entries?: Record<string, unknown>;
  options?: readonly ZodSchemaLike[];
  value?: unknown;
  items?: readonly ZodSchemaLike[];
  valueType?: ZodSchemaLike;
  keyType?: ZodSchemaLike;
  schema?: ZodSchemaLike;
  left?: ZodSchemaLike;
  right?: ZodSchemaLike;
  in?: ZodSchemaLike;
  description?: string;
  defaultValue?: unknown | (() => unknown);
  checks?: ReadonlyArray<ZodCheck>;
}

export interface ZodSchemaLike {
  _def?: ZodDef;
  def?: ZodDef;
  description?: string;
  enum?: Record<string, unknown>;
  isOptional?: () => boolean;
  options?: readonly unknown[];
  shape?: Record<string, ZodSchemaLike>;
}

function isZodLike(x: unknown): x is ZodSchemaLike {
  return (
    isRecord(x) &&
    ("_def" in (x as Record<string, unknown>) ||
      "def" in (x as Record<string, unknown>))
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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
    if (kind === "pipe" && def.in) {
      current = def.in;
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
  if (typeof def?.shape === "function") return def.shape();
  if (def?.shape && typeof def.shape === "object") return def.shape;
  if (isZodLike(unwrapped) && unwrapped.shape) return unwrapped.shape;
  return undefined;
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
  if (def?.entries) return enumObjectValues(def.entries);
  if (isRecord(def?.values)) {
    return enumObjectValues(def.values);
  }
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
    if (kind === "default") return resolveDefaultValue(def.defaultValue);
    if (TRANSPARENT_WRAPPER_KINDS.has(kind) && def.innerType) {
      current = def.innerType;
      continue;
    }
    if (kind === "effects" && def.schema) {
      current = def.schema;
      continue;
    }
    if (kind === "pipe" && def.in) {
      current = def.in;
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
  if (kind === "pipe" && def?.in) return isOptionalZodSchema(def.in);
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
      applyStringChecks(out, def.checks);
      return out;
    }
    case "number": {
      const out: JsonSchema = { type: "number", ...desc };
      applyNumberChecks(out, def.checks);
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
      applyArrayChecks(out, def.checks);
      return out;
    }
    case "tuple":
      return {
        type: "array",
        items: (def.items ?? def.options ?? []).map((o) => zodToJsonSchema(o)),
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
        anyOf: (def.options ?? []).map((o) => zodToJsonSchema(o)),
        ...desc,
      };
    case "intersection": {
      const left = zodToJsonSchema(def.left);
      const right = zodToJsonSchema(def.right);
      return { allOf: [left, right], ...desc };
    }
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
        default: resolveDefaultValue(def.defaultValue),
        ...desc,
      };
    case "effects":
      return { ...zodToJsonSchema(def.schema), ...desc };
    case "record":
      return {
        type: "object",
        additionalProperties: zodToJsonSchema(def.valueType),
        ...desc,
      };
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
      return zodToJsonSchema(def.in);
    default:
      return { ...desc };
  }
}

function getArrayElement(def: ZodDef): unknown {
  return isZodLike(def.type) ? def.type : def.element;
}

function getLiteralValues(def: ZodDef): readonly unknown[] {
  if (Array.isArray(def.values)) return [...def.values];
  return [def.value];
}

function enumObjectValues(values: Record<string, unknown>): readonly unknown[] {
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

function resolveDefaultValue(defaultValue: unknown): unknown {
  return typeof defaultValue === "function"
    ? (defaultValue as () => unknown)()
    : defaultValue;
}

function applyStringChecks(
  out: JsonSchema,
  checks: ReadonlyArray<ZodCheck> | undefined
): void {
  for (const check of checks ?? []) {
    const def = getCheckDef(check);
    if (check.kind === "min" || def.check === "min_length") {
      out.minLength = check.value ?? def.minimum;
    }
    if (check.kind === "max" || def.check === "max_length") {
      out.maxLength = check.value ?? def.maximum;
    }
    if (check.kind === "url" || def.format === "url") out.format = "uri";
    if (check.kind === "email" || def.format === "email") out.format = "email";
    if (check.kind === "regex" && check.regex) out.pattern = check.regex.source;
    if (def.format === "regex" && def.pattern) out.pattern = def.pattern.source;
  }
}

function applyNumberChecks(
  out: JsonSchema,
  checks: ReadonlyArray<ZodCheck> | undefined
): void {
  for (const check of checks ?? []) {
    const def = getCheckDef(check);
    if (
      check.kind === "int" ||
      check.isInt === true ||
      def.format === "safeint"
    ) {
      out.type = "integer";
    }
    if (check.kind === "min") out.minimum = check.value;
    if (check.kind === "max") out.maximum = check.value;
    if (def.check === "greater_than") {
      if (def.inclusive === false) out.exclusiveMinimum = def.value;
      else out.minimum = def.value;
    }
    if (def.check === "less_than") {
      if (def.inclusive === false) out.exclusiveMaximum = def.value;
      else out.maximum = def.value;
    }
  }
}

function applyArrayChecks(
  out: JsonSchema,
  checks: ReadonlyArray<ZodCheck> | undefined
): void {
  for (const check of checks ?? []) {
    const def = getCheckDef(check);
    if (def.check === "min_length") out.minItems = def.minimum;
    if (def.check === "max_length") out.maxItems = def.maximum;
  }
}

function getCheckDef(check: ZodCheck): ZodCheckDef {
  return check._zod?.def ?? check.def ?? {};
}
