// Shared payload validation engine (same pattern across all @nakedapi providers)
import type {
  PayloadFieldSchema,
  PayloadSchema,
  ValidationResult,
} from "./types";

function checkType(value: unknown, expected: string): boolean {
  if (expected === "array") return Array.isArray(value);
  if (expected === "object")
    return typeof value === "object" && value !== null && !Array.isArray(value);
  return typeof value === expected;
}

function validateFields(
  data: Record<string, unknown>,
  fields: Record<string, PayloadFieldSchema>,
  prefix: string
): string[] {
  const errors: string[] = [];

  for (const [key, field] of Object.entries(fields)) {
    const value = data[key];
    const path = prefix ? `${prefix}.${key}` : key;

    if (value === undefined || value === null) {
      if (field.required) {
        errors.push(`${path} is required`);
      }
      continue;
    }

    if (!checkType(value, field.type)) {
      errors.push(`${path} must be of type ${field.type}`);
      continue;
    }

    if (
      field.enum &&
      !field.enum.includes(value as string | number | boolean)
    ) {
      errors.push(`${path} must be one of: ${field.enum.join(", ")}`);
    }

    if (field.type === "object" && field.properties) {
      errors.push(
        ...validateFields(
          value as Record<string, unknown>,
          field.properties,
          path
        )
      );
    }

    if (field.type === "array" && field.items && Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        const item = value[i];
        const itemPath = `${path}[${i}]`;
        if (!checkType(item, field.items.type)) {
          errors.push(`${itemPath} must be of type ${field.items.type}`);
        } else if (field.items.type === "object" && field.items.properties) {
          errors.push(
            ...validateFields(
              item as Record<string, unknown>,
              field.items.properties,
              itemPath
            )
          );
        }
      }
    }
  }

  return errors;
}

export function validatePayload(
  data: unknown,
  schema: PayloadSchema
): ValidationResult {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return { valid: false, errors: ["payload must be a non-null object"] };
  }

  const errors = validateFields(
    data as Record<string, unknown>,
    schema.fields,
    ""
  );

  return { valid: errors.length === 0, errors };
}
