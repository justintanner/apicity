// Minimal Zod 3 → JSON Schema converter. We deliberately do not import zod —
// providers ship with zod ^3.24 as a peer dep, and we read the schema's
// internal `_def` at runtime via duck-typing. Anything we can't recognize
// degrades to `{}` (any JSON value), which is still useful documentation.

export type JsonSchema = Record<string, unknown>;

interface ZodDef {
  typeName?: string;
  type?: ZodSchemaLike;
  innerType?: ZodSchemaLike;
  shape?: () => Record<string, ZodSchemaLike>;
  values?: readonly string[] | Record<string, string | number>;
  options?: readonly ZodSchemaLike[];
  value?: unknown;
  valueType?: ZodSchemaLike;
  keyType?: ZodSchemaLike;
  schema?: ZodSchemaLike;
  description?: string;
  checks?: ReadonlyArray<{ kind: string; value?: number; regex?: RegExp }>;
}

export interface ZodSchemaLike {
  _def?: ZodDef;
  description?: string;
}

function isZodLike(x: unknown): x is ZodSchemaLike {
  return (
    typeof x === "object" &&
    x !== null &&
    "_def" in (x as Record<string, unknown>)
  );
}

export function zodToJsonSchema(schema: unknown): JsonSchema {
  if (!isZodLike(schema)) return {};
  const def = schema._def;
  if (!def) return {};
  const desc =
    schema.description || def.description
      ? { description: schema.description ?? def.description }
      : {};

  switch (def.typeName) {
    case "ZodObject": {
      const shape = typeof def.shape === "function" ? def.shape() : {};
      const properties: Record<string, JsonSchema> = {};
      const required: string[] = [];
      for (const [key, val] of Object.entries(shape)) {
        properties[key] = zodToJsonSchema(val);
        if (!isOptional(val)) required.push(key);
      }
      return {
        type: "object",
        properties,
        ...(required.length > 0 ? { required } : {}),
        ...desc,
      };
    }
    case "ZodString": {
      const out: JsonSchema = { type: "string", ...desc };
      for (const c of def.checks ?? []) {
        if (c.kind === "min") out.minLength = c.value;
        if (c.kind === "max") out.maxLength = c.value;
        if (c.kind === "url") out.format = "uri";
        if (c.kind === "email") out.format = "email";
        if (c.kind === "regex" && c.regex) out.pattern = c.regex.source;
      }
      return out;
    }
    case "ZodNumber": {
      const out: JsonSchema = { type: "number", ...desc };
      let isInt = false;
      for (const c of def.checks ?? []) {
        if (c.kind === "int") isInt = true;
        if (c.kind === "min") out.minimum = c.value;
        if (c.kind === "max") out.maximum = c.value;
      }
      if (isInt) out.type = "integer";
      return out;
    }
    case "ZodBigInt":
      return { type: "integer", ...desc };
    case "ZodBoolean":
      return { type: "boolean", ...desc };
    case "ZodNull":
      return { type: "null", ...desc };
    case "ZodArray":
      return { type: "array", items: zodToJsonSchema(def.type), ...desc };
    case "ZodTuple":
      return {
        type: "array",
        items: (def.options ?? []).map((o) => zodToJsonSchema(o)),
        ...desc,
      };
    case "ZodEnum":
    case "ZodNativeEnum": {
      const values = Array.isArray(def.values)
        ? def.values
        : Object.values(def.values ?? {});
      return { type: "string", enum: values, ...desc };
    }
    case "ZodLiteral":
      return { const: def.value, ...desc };
    case "ZodUnion":
    case "ZodDiscriminatedUnion":
      return {
        anyOf: (def.options ?? []).map((o) => zodToJsonSchema(o)),
        ...desc,
      };
    case "ZodIntersection": {
      const left = zodToJsonSchema(
        (def as unknown as { left: ZodSchemaLike }).left
      );
      const right = zodToJsonSchema(
        (def as unknown as { right: ZodSchemaLike }).right
      );
      return { allOf: [left, right], ...desc };
    }
    case "ZodOptional":
    case "ZodNullable":
    case "ZodReadonly":
    case "ZodBranded":
      return { ...zodToJsonSchema(def.innerType), ...desc };
    case "ZodDefault":
      return {
        ...zodToJsonSchema(def.innerType),
        default: (
          def as unknown as { defaultValue?: () => unknown }
        ).defaultValue?.(),
        ...desc,
      };
    case "ZodEffects":
      return { ...zodToJsonSchema(def.schema), ...desc };
    case "ZodRecord":
      return {
        type: "object",
        additionalProperties: zodToJsonSchema(def.valueType),
        ...desc,
      };
    case "ZodMap":
      return {
        type: "object",
        additionalProperties: zodToJsonSchema(def.valueType),
        ...desc,
      };
    case "ZodAny":
    case "ZodUnknown":
      return { ...desc };
    case "ZodNever":
      return { not: {}, ...desc };
    case "ZodVoid":
    case "ZodUndefined":
      return { type: "null", ...desc };
    case "ZodPipeline":
      return zodToJsonSchema((def as unknown as { in: ZodSchemaLike }).in);
    default:
      return { ...desc };
  }
}

function isOptional(schema: unknown): boolean {
  if (!isZodLike(schema)) return true;
  const t = schema._def?.typeName;
  if (t === "ZodOptional" || t === "ZodDefault") return true;
  if ((t === "ZodNullable" || t === "ZodReadonly") && schema._def?.innerType) {
    return isOptional(schema._def.innerType);
  }
  return false;
}
