import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import * as prettier from "prettier";
import { Project, SyntaxKind } from "ts-morph";
import { canonicalJson, readJson, sha256Bytes } from "./kie-pricing-pull.mjs";
import {
  applyPayloadRules,
  applySelectorRules,
  endpointPayloadOverrides,
  explicitOperationKey as registryExplicitOperationKey,
  familyMappingCandidates,
  knownFalseMapping as registryKnownFalseMapping,
  MODEL_FAMILY_REGISTRATIONS,
  representativePayloadOverride,
  RUNTIME_VARIANT_EXCEPTIONS as registryRuntimeVariantExceptions,
  validateFamilyRegistrations,
} from "./kie-pricing-reconciliation-rules.mjs";

export const RECONCILIATION_SCHEMA = "gc.kie-pricing-reconciliation.v1";
export const RAW_DISPOSITIONS = Object.freeze([
  "implemented",
  "canonical-alias",
  "duplicate",
  "free-nonbillable",
  "unsupported-endpoint",
  "token-billed",
  "upstream-unmappable",
]);
export const API_CITY_DISPOSITIONS = Object.freeze([
  "supported",
  "free-nonbillable",
  "unsupported-endpoint",
  "token-billed",
  "upstream-unmappable",
]);

validateFamilyRegistrations();
export { MODEL_FAMILY_REGISTRATIONS };

const SOURCE_FILES = Object.freeze({
  models: "packages/provider/kie/src/zod.ts",
  descriptors: "packages/provider/kie/src/model-schemas.ts",
  guards: "packages/provider/kie/src/kie.ts",
  pricing: "packages/provider/cost/src/pricing/kie.ts",
  slugs: "packages/provider/cost/src/slugs.ts",
  endpoints: "scripts/endpoint-docs.tsv",
});

const REQUIRED_SEEDANCE_RATES = Object.freeze({
  "480p|no-audio": "0.140",
  "480p|audio": "0.085",
  "720p|no-audio": "0.315",
  "720p|audio": "0.190",
  "1080p|no-audio": "0.570",
  "1080p|audio": "0.3425",
});

const FINAL_FOLLOW_UP_BEADS = new Set(["ac-huxfmb", "ac-flqhcu", "ac-7r282y"]);

const INVENTORY_BASELINE = Object.freeze({
  models: 127,
  pricingKeys: 135,
  slugKeys: 137,
  displayKeys: 137,
  schemaWithoutPricing: 23,
  pricingOnly: 31,
  endpoints: 71,
});

const DIRECT_ENDPOINT_FIELDS = new Set([
  "aspect_ratio",
  "duration",
  "generate_audio",
  "image_resolution",
  "mode",
  "model",
  "output_format",
  "quality",
  "resolution",
  "rendering_speed",
  "upscale_factor",
  "size",
  "speed",
  "type",
  "version",
]);

export const RUNTIME_VARIANT_EXCEPTIONS = registryRuntimeVariantExceptions;

export class KiePricingReconciliationError extends Error {
  constructor(code, message, details = {}) {
    super(`${code}: ${message}`);
    this.name = "KiePricingReconciliationError";
    this.code = code;
    this.details = details;
  }
}

function fail(code, message, details = {}) {
  throw new KiePricingReconciliationError(code, message, details);
}

function unwrap(expression) {
  let current = expression;
  while (
    [
      SyntaxKind.AsExpression,
      SyntaxKind.SatisfiesExpression,
      SyntaxKind.ParenthesizedExpression,
    ].includes(current.getKind())
  ) {
    current = current.getExpression();
  }
  return current;
}

function propertyName(property) {
  const nameNode = property.getNameNode?.();
  if (!nameNode) return undefined;
  if (
    nameNode.getKind() === SyntaxKind.StringLiteral ||
    nameNode.getKind() === SyntaxKind.NumericLiteral
  ) {
    return nameNode.getLiteralValue();
  }
  if (nameNode.getKind() === SyntaxKind.Identifier) return nameNode.getText();
  return nameNode.getText().replace(/^['"]|['"]$/g, "");
}

function objectInitializer(sourceFile, variableName, nestedProperty) {
  const variable = sourceFile.getVariableDeclarationOrThrow(variableName);
  let initializer = unwrap(variable.getInitializerOrThrow());
  if (nestedProperty) {
    const object = initializer.asKindOrThrow(
      SyntaxKind.ObjectLiteralExpression
    );
    initializer = unwrap(
      object.getPropertyOrThrow(nestedProperty).getInitializerOrThrow()
    );
  }
  return initializer.asKindOrThrow(SyntaxKind.ObjectLiteralExpression);
}

function sourceFile(project, root, relativePath) {
  try {
    return project.addSourceFileAtPath(path.join(root, relativePath));
  } catch (error) {
    fail(
      "source-file-missing",
      `cannot read ${relativePath}: ${error.message}`,
      { relativePath }
    );
  }
}

function objectPropertyNames(object) {
  return object
    .getProperties()
    .filter((property) =>
      [
        SyntaxKind.PropertyAssignment,
        SyntaxKind.ShorthandPropertyAssignment,
        SyntaxKind.MethodDeclaration,
      ].includes(property.getKind())
    )
    .map(propertyName)
    .filter((name) => typeof name === "string");
}

function literalValue(expression) {
  const value = unwrap(expression);
  switch (value.getKind()) {
    case SyntaxKind.StringLiteral:
      return value.getLiteralValue();
    case SyntaxKind.NumericLiteral:
      return Number(value.getLiteralValue());
    case SyntaxKind.TrueKeyword:
      return true;
    case SyntaxKind.FalseKeyword:
      return false;
    default:
      return undefined;
  }
}

function descriptorFieldInventory(source) {
  const schemas = objectInitializer(source, "modelInputSchemas");
  const fieldsByModel = {};
  for (const modelProperty of schemas.getProperties()) {
    const modelId = propertyName(modelProperty);
    if (!modelId || !modelProperty.getInitializer) continue;
    const modelInitializer = unwrap(modelProperty.getInitializer());
    if (modelInitializer.getKind() !== SyntaxKind.ObjectLiteralExpression)
      continue;
    const fieldsProperty = modelInitializer.getProperty("fields");
    if (!fieldsProperty?.getInitializer) continue;
    const fieldsInitializer = unwrap(fieldsProperty.getInitializer());
    if (fieldsInitializer.getKind() !== SyntaxKind.ObjectLiteralExpression)
      continue;
    const fields = {};
    for (const fieldProperty of fieldsInitializer.getProperties()) {
      const fieldName = propertyName(fieldProperty);
      if (!fieldName || !fieldProperty.getInitializer) continue;
      const fieldInitializer = unwrap(fieldProperty.getInitializer());
      const typeProperty =
        fieldInitializer.getKind() === SyntaxKind.ObjectLiteralExpression
          ? fieldInitializer.getProperty("type")
          : undefined;
      const requiredProperty =
        fieldInitializer.getKind() === SyntaxKind.ObjectLiteralExpression
          ? fieldInitializer.getProperty("required")
          : undefined;
      const enumProperty =
        fieldInitializer.getKind() === SyntaxKind.ObjectLiteralExpression
          ? fieldInitializer.getProperty("enum")
          : undefined;
      let enumValues = null;
      if (enumProperty?.getInitializer) {
        const enumInitializer = unwrap(enumProperty.getInitializer());
        if (enumInitializer.getKind() === SyntaxKind.ArrayLiteralExpression) {
          const values = enumInitializer.getElements().map(literalValue);
          if (values.every((value) => value !== undefined)) enumValues = values;
        }
      }
      fields[fieldName] = {
        enum: enumValues,
        type: typeProperty?.getInitializer
          ? literalValue(unwrap(typeProperty.getInitializer()))
          : null,
        required: requiredProperty?.getInitializer
          ? literalValue(unwrap(requiredProperty.getInitializer())) === true
          : false,
      };
    }
    fieldsByModel[modelId] = fields;
  }
  return fieldsByModel;
}

function sortedUnique(values) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function assertUnique(values, label) {
  const seen = new Set();
  const duplicates = [];
  for (const value of values) {
    if (seen.has(value)) duplicates.push(value);
    seen.add(value);
  }
  if (duplicates.length) {
    fail("duplicate-source-key", `${label} contains duplicate keys`, {
      label,
      duplicates,
    });
  }
}

function parseEndpointRows(contents) {
  const rows = [];
  for (const [index, line] of contents.split(/\r?\n/).entries()) {
    if (!line.trim() || line.startsWith("#")) continue;
    const fields = line.split("\t");
    if (fields[0] === "provider") continue;
    if (fields.length < 4 || fields.length > 5) {
      fail(
        "invalid-endpoint-inventory",
        `endpoint-docs.tsv line ${index + 1} has ${fields.length} fields`,
        {
          line: index + 1,
        }
      );
    }
    const [provider, dotPath, method, fullUrl, docsUrl = ""] = fields;
    if (provider !== "kie") continue;
    rows.push({ provider, dotPath, method, fullUrl, docsUrl });
  }
  assertUnique(
    rows.map((row) => `${row.method} ${row.dotPath}`),
    "Kie endpoints"
  );
  return rows;
}

export function extractApiCityInventories(root = process.cwd()) {
  const project = new Project({ skipAddingFilesFromTsConfig: true });
  const zod = sourceFile(project, root, SOURCE_FILES.models);
  const modelArray = unwrap(
    zod
      .getVariableDeclarationOrThrow("KIE_MEDIA_MODELS")
      .getInitializerOrThrow()
  ).asKindOrThrow(SyntaxKind.ArrayLiteralExpression);
  const models = modelArray.getElements().map((element) => {
    const value = unwrap(element);
    if (value.getKind() !== SyntaxKind.StringLiteral) {
      fail(
        "invalid-model-inventory",
        "KIE_MEDIA_MODELS contains a non-string entry"
      );
    }
    return value.getLiteralValue();
  });

  const descriptorsSource = sourceFile(project, root, SOURCE_FILES.descriptors);
  const descriptors = objectPropertyNames(
    objectInitializer(descriptorsSource, "modelInputSchemas")
  );
  const descriptorFields = descriptorFieldInventory(descriptorsSource);
  const guardsSource = sourceFile(project, root, SOURCE_FILES.guards);
  const guards = objectPropertyNames(
    objectInitializer(guardsSource, "CREATE_TASK_GUARDS")
  );
  const pricingSource = sourceFile(project, root, SOURCE_FILES.pricing);
  const pricingKeys = objectPropertyNames(
    objectInitializer(pricingSource, "kie")
  );
  const slugsSource = sourceFile(project, root, SOURCE_FILES.slugs);
  const slugKeys = objectPropertyNames(
    objectInitializer(slugsSource, "MODEL_SLUGS", "kie")
  );
  const displayKeys = objectPropertyNames(
    objectInitializer(slugsSource, "MODEL_DISPLAY", "kie")
  );

  for (const [label, values] of [
    ["KIE_MEDIA_MODELS", models],
    ["modelInputSchemas", descriptors],
    ["CREATE_TASK_GUARDS", guards],
    ["PRICING.kie", pricingKeys],
    ["MODEL_SLUGS.kie", slugKeys],
    ["MODEL_DISPLAY.kie", displayKeys],
  ]) {
    assertUnique(values, label);
  }

  if (models.length !== descriptors.length || models.length !== guards.length) {
    fail(
      "registry-drift",
      "Kie model, descriptor, and guard registries differ",
      {
        models: models.length,
        descriptors: descriptors.length,
        guards: guards.length,
      }
    );
  }

  return {
    root: path.resolve(root),
    models,
    descriptors,
    descriptorFields,
    guards,
    pricingKeys,
    slugKeys,
    displayKeys,
    endpoints: [],
    files: { ...SOURCE_FILES },
  };
}

export async function collectApiCityInventories(root = process.cwd()) {
  const inventories = extractApiCityInventories(root);
  const endpointContents = await readFile(
    path.join(root, SOURCE_FILES.endpoints),
    "utf8"
  );
  inventories.endpoints = parseEndpointRows(endpointContents);
  return inventories;
}

export const extractSourceInventories = collectApiCityInventories;

async function sourceHashes(root, files) {
  const hashes = {};
  for (const relativePath of Object.values(files)) {
    const contents = await readFile(path.join(root, relativePath));
    hashes[relativePath] = sha256Bytes(contents);
  }
  return hashes;
}

function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function queryModel(anchor) {
  if (!anchor) return undefined;
  try {
    return new URL(anchor).searchParams.get("model") ?? undefined;
  } catch {
    return undefined;
  }
}

function explicitOperationKey(description, pricing) {
  return registryExplicitOperationKey(description, pricing);
}

function queryOperation(query) {
  const operation = String(query).split("/").at(-1) ?? "";
  const semanticOperation = operation.match(
    /(text-to-image|image-to-image|text-to-video|image-to-video)/i
  );
  if (semanticOperation) return semanticOperation[1].toLowerCase();
  if (/get-1080p-video/i.test(operation)) return "get-1080p-video";
  if (/get-4k-video/i.test(operation)) return "get-4k-video";
  for (const suffix of [
    "extend",
    "upscale",
    "fast",
    "ultra",
    "lite",
    "quality",
  ]) {
    if (operation.toLowerCase().endsWith(suffix)) return suffix;
  }
  return undefined;
}

function queryDescriptionConflict(raw, inventories) {
  const query = queryModel(raw.anchor);
  if (!query || !inventories.pricingKeys.includes(query)) return undefined;
  const operation = queryOperation(query);
  if (!operation) return undefined;
  const description = String(raw.modelDescription ?? "");
  const normalizedDescription = normalize(description);
  const operationNeedle = normalize(operation);
  const matches =
    operation === "get-1080p-video"
      ? normalizedDescription.includes("get1080p")
      : operation === "get-4k-video"
        ? normalizedDescription.includes("get4k")
        : normalizedDescription.includes(operationNeedle);
  if (matches) return undefined;
  return {
    kind: "query-description-operation-conflict",
    queryModel: query,
    queryOperation: operation,
    modelDescription: description,
    message: `Supported query model ${query} conflicts with the operation named by the official description ${description}.`,
  };
}

function currentKeyCandidates(raw, inventories) {
  const description = String(raw.modelDescription ?? "");
  const anchor = String(raw.anchor ?? "");
  const query = queryModel(anchor);
  const pricing = new Set(inventories.pricingKeys);
  const normalizedDescription = normalize(description);
  const explicitKey = explicitOperationKey(description, pricing);
  if (explicitKey) return [explicitKey];
  if (query && pricing.has(query)) return [query];
  const exactDescriptionKeys = inventories.pricingKeys
    .filter((key) => normalizedDescription.includes(normalize(key)))
    .sort((left, right) => {
      const lengthDifference = normalize(right).length - normalize(left).length;
      return lengthDifference || left.localeCompare(right);
    });
  // A marketplace description can contain a family name and several model
  // names (for example nano-banana-2-lite). Pick the longest exact model name
  // before considering a URL query or a family-pattern alias, so one official
  // occurrence always has one canonical pricing key.
  if (exactDescriptionKeys.length) return [exactDescriptionKeys[0]];

  const registeredCandidates = familyMappingCandidates({
    description,
    anchor,
    pricing,
  });
  return registeredCandidates.slice(0, 1);
}

function unitInfo(raw) {
  const unit = String(raw.creditUnit ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  const direct = new Map([
    ["per second", { unit: "seconds", quantity: 1 }],
    ["per image", { unit: "images", quantity: 1 }],
    ["per video", { unit: "generations", quantity: 1 }],
    ["per request", { unit: "generations", quantity: 1 }],
    ["per million tokens", { unit: "tokens", quantity: 1_000_000 }],
    ["per million", { unit: "tokens", quantity: 1_000_000 }],
    ["per 1000 characters", { unit: "characters", quantity: 1_000 }],
    ["per megapixel", { unit: "megapixels", quantity: 1 }],
  ]);
  if (direct.has(unit)) return direct.get(unit);
  const batchImages = unit.match(/^per (\d+(?:\.\d+)?) images?$/);
  if (batchImages) {
    return { unit: "images", quantity: Number(batchImages[1]) };
  }
  return undefined;
}

function numericString(value) {
  return /^\d+(?:\.\d+)?$/.test(String(value ?? "").trim());
}

function cellIssues(raw, key) {
  const issues = [];
  if (!numericString(raw.creditPrice)) issues.push("credit-price-format");
  if (!numericString(raw.usdPrice)) issues.push("usd-price-format");
  if (!auditedUnitInfo(raw, key)) issues.push("credit-unit-format");
  return issues;
}

function selectorValues(raw, key, inventories) {
  const text = String(raw.modelDescription ?? "");
  const candidates = {};
  const resolution = text.match(
    /(?:^|[-,\s])(1k|1\.5k|480p|512p|580p|720p|768p|1080p|2k|4k|8k)(?:$|[-,\s])/i
  );
  if (resolution) candidates.resolution = resolution[1].toLowerCase();
  const duration = text.match(/(?:^|[-,\s])(\d+(?:\.\d+)?)s(?:$|[-,\s])/i);
  if (duration) candidates.duration = Number(duration[1]);
  const size = text.match(/(?:^|[-,\s])(1k|1\.5k|2k|4k|8k)(?:$|[-,\s])/i);
  if (size) candidates.size = size[1];
  const modelFields = inventories.descriptorFields[key];
  applySelectorRules({
    key,
    text,
    candidates,
    context: { resolution, duration },
  });
  const values = {};
  const isCreateTask = inventories.models.includes(key);
  for (const [field, value] of Object.entries(candidates)) {
    if (value === undefined) continue;
    const fieldSpec = modelFields?.[field];
    const grokExtendMetadata =
      key === "grok-imagine/extend" && field === "resolution";
    if (isCreateTask && !fieldSpec && !grokExtendMetadata) continue;
    if (!isCreateTask && !fieldSpec && !DIRECT_ENDPOINT_FIELDS.has(field))
      continue;
    const enumValue = fieldSpec?.enum?.find(
      (allowed) => String(allowed).toLowerCase() === String(value).toLowerCase()
    );
    if (fieldSpec?.enum && enumValue === undefined) continue;
    values[field] = enumValue ?? value;
    if (key.startsWith("minimax-h3/") && field === "resolution") {
      values[field] = String(value).toLowerCase() === "768p" ? "768P" : "2K";
    }
  }
  return values;
}

function seedanceValues(raw) {
  const text = String(raw.modelDescription ?? "");
  const resolution = /1080p/i.test(text)
    ? "1080p"
    : /480p/i.test(text)
      ? "480p"
      : "720p";
  const generate_audio = /with video/i.test(text);
  return { resolution, generate_audio };
}

function selectorSources(key, selectors, inventories) {
  const modelFields = inventories.descriptorFields[key];
  return Object.fromEntries(
    Object.keys(selectors).map((field) => [
      field,
      key === "grok-imagine/extend" && field === "resolution"
        ? "cost-only-metadata:grok-imagine/extend"
        : modelFields && Object.hasOwn(modelFields, field)
          ? `modelInputSchemas:${key}`
          : `direct-endpoint:${key}`,
    ])
  );
}

function representativeFieldValue(field, spec) {
  if (Array.isArray(spec.enum) && spec.enum.length) return spec.enum[0];
  if (spec.type === "array" || /(?:^|_)urls$/.test(field)) {
    return ["https://example.com/a.png"];
  }
  if (spec.type === "boolean") return false;
  if (spec.type === "number" || spec.type === "integer") return 1;
  if (/prompt|text|dialogue/i.test(field)) return "audit";
  if (/url|image|audio|video|task/i.test(field)) {
    return "https://example.com/a.png";
  }
  return "audit";
}

function populateRequiredInput(input, fields) {
  for (const [field, spec] of Object.entries(fields)) {
    if (spec.required && !Object.hasOwn(input, field)) {
      input[field] = representativeFieldValue(field, spec);
    }
  }
}

function representativePayload(
  key,
  selectors,
  isCreateTask,
  official,
  inventories,
  auditedUnit
) {
  const input = { ...selectors };
  const text = String(official.modelDescription ?? "");
  const fields = inventories.descriptorFields[key] ?? {};
  const registeredOverride = representativePayloadOverride(key, selectors);
  if (registeredOverride) return registeredOverride;
  if (key === "bytedance/seedance-2-5") {
    return {
      model: key,
      input: {
        prompt: "audit",
        resolution: selectors.resolution,
        generate_audio: selectors.generate_audio,
        duration: 5,
      },
    };
  }
  if (key === "wan/2-2-a14b-speech-to-video-turbo") {
    input.num_frames = 80;
    input.frames_per_second = 16;
  }
  if (auditedUnit.unit === "seconds" && !Object.hasOwn(input, "duration")) {
    if (Object.hasOwn(fields, "duration")) {
      input.duration = fields.duration.enum?.includes("5") ? "5" : 5;
    }
  }
  if (auditedUnit.unit === "characters") {
    if (key === "elevenlabs/text-to-dialogue-v3") {
      input.dialogue = [{ text: "a".repeat(1_000), voice: "Rachel" }];
    } else {
      input.text = "a".repeat(1_000);
    }
  }
  applyPayloadRules({ key, text, input });
  populateRequiredInput(input, fields);
  if (isCreateTask) {
    if (Object.hasOwn(fields, "prompt") && !Object.hasOwn(input, "prompt")) {
      input.prompt = "audit";
    }
    return key === "grok-imagine/extend"
      ? { model: key, resolution: selectors.resolution, input }
      : { model: key, input };
  }
  const payload = { ...selectors, ...endpointPayloadOverrides(key, selectors) };
  return { endpoint: key, ...payload };
}

function representativeCostHints(key, inventories, auditedUnit) {
  if (auditedUnit.unit !== "seconds") return undefined;
  if (key === "wan/2-2-a14b-speech-to-video-turbo") return undefined;
  const fields = inventories.descriptorFields[key] ?? {};
  return Object.hasOwn(fields, "duration") ? undefined : { durationSeconds: 5 };
}

function representativePricingMetadata(official, key) {
  if (key !== "grok-imagine/extend") return undefined;
  const resolution = String(official.modelDescription ?? "").match(
    /(?:^|[-,\s])(480p|720p)(?:$|[-,\s])/i
  );
  return resolution ? { resolution: resolution[1].toLowerCase() } : undefined;
}

function explicitZero(value) {
  return numericString(value) && Number(value) === 0;
}

function architectureBlocker(official) {
  const description = String(official.modelDescription ?? "unknown model");
  const interfaceType = String(official.interfaceType ?? "unknown interface");
  return `No current ApiCity model schema, runtime guard, pricing key, or documented endpoint identifies a callable operation for ${description} (${interfaceType}).`;
}

const IDEOGRAM_V3_REFRAME_TECHNICAL_BLOCKER =
  "Kie advertises and prices Ideogram V3 Reframe, but no current official API model slug or complete request/response contract is published for a callable ApiCity mapping.";

function auditedUnitInfo(official, key) {
  const raw = unitInfo(official);
  if (raw) return raw;
  if (key === "grok-imagine/extend") {
    return { unit: "generations", quantity: 1, audit: "blank-per-generation" };
  }
  if (key === "seedream/5-pro-layer-decomposition") {
    return { unit: "images", quantity: 1, audit: "blank-per-image" };
  }
  if (key === "gemini-omni-video" && /vedio/i.test(official.creditUnit ?? "")) {
    return {
      unit: "generations",
      quantity: 1,
      audit: "upstream-typo-per-video",
    };
  }
  return undefined;
}

function knownFalseMapping(official, key) {
  const description = String(official.modelDescription ?? "");
  return registryKnownFalseMapping({ description, key, official });
}

function runtimeRateConflict(official, key) {
  if (
    key === "bytedance/seedance-2" &&
    /bytedance\/seedance-2,\s*480p with video/i.test(
      String(official.modelDescription ?? "")
    ) &&
    String(official.usdPrice) === "0.057"
  ) {
    return {
      kind: "rate-conflict",
      runtimeKey: key,
      runtimeVariant: "480p|video",
      officialUsd: official.usdPrice,
      runtimeUsd: "0.0575",
      officialUnit: official.creditUnit,
      runtimeUnit: "per second",
      message:
        "The official Seedance 2 480p reference-video cell and live runtime rate disagree.",
    };
  }
  if (
    key === "grok-imagine/image-to-video" &&
    /grok-imagine,\s*image-to-video,\s*1080p/i.test(
      String(official.modelDescription ?? "")
    ) &&
    String(official.usdPrice) === "0.004"
  ) {
    return {
      kind: "rate-conflict",
      runtimeKey: key,
      runtimeVariant: "1080p",
      officialUsd: official.usdPrice,
      runtimeUsd: "0.04",
      officialUnit: official.creditUnit,
      runtimeUnit: "per second",
      message:
        "The official Grok image-to-video 1080p cell and live runtime rate disagree.",
    };
  }
  return undefined;
}

function pricingCellBlocker(issues) {
  return `The official pricing cell cannot be reconciled until upstream fixes or documents: ${issues.join(", ")}.`;
}

function classifyRawRow(raw, inventories) {
  const official = raw.raw ?? raw;
  const queryConflict = queryDescriptionConflict(official, inventories);
  const mappedKeys = queryConflict
    ? []
    : currentKeyCandidates(official, inventories);
  const seedance = /bytedance\/seedance-2-5/i.test(
    String(official.modelDescription ?? "")
  );
  const mappedKey = mappedKeys[0];
  const auditedUnit = auditedUnitInfo(official, mappedKey);
  const issues = cellIssues(official, mappedKey);
  const falseMapping = knownFalseMapping(official, mappedKey);
  const rateConflict = runtimeRateConflict(official, mappedKey);
  const isFree =
    explicitZero(official.creditPrice) && explicitZero(official.usdPrice);
  const canonicalAlias =
    Boolean(mappedKey) &&
    !falseMapping &&
    !normalize(String(official.modelDescription ?? "")).includes(
      normalize(mappedKey)
    );
  let disposition;
  let rationale;
  let technicalBlocker;
  let followUpBead;

  if (falseMapping) {
    mappedKeys.length = 0;
    disposition = "upstream-unmappable";
    rationale = falseMapping;
    technicalBlocker = falseMapping;
  } else if (seedance) {
    disposition = "implemented";
    for (const key of [
      "bytedance/seedance-2",
      "bytedance/seedance-2-fast",
      "bytedance/seedance-2-mini",
    ]) {
      const index = mappedKeys.indexOf(key);
      if (index >= 0) mappedKeys.splice(index, 1);
    }
    mappedKeys.push("bytedance/seedance-2-5");
    rationale =
      "Mandatory Seedance 2.5 row; the final cost table contains the supported pricing key and all four official cells.";
  } else if (queryConflict) {
    disposition = "upstream-unmappable";
    rationale =
      "The official description and supported URL query identify different operations; no pricing key is guessed until upstream evidence is corrected.";
    technicalBlocker = queryConflict.message;
  } else if (isFree) {
    disposition = "free-nonbillable";
    rationale = "The official snapshot reports an explicit zero USD price.";
  } else if (mappedKeys.length && !issues.length && auditedUnit) {
    disposition = canonicalAlias ? "canonical-alias" : "implemented";
    rationale = canonicalAlias
      ? "The official label is an upstream alias for one canonical ApiCity pricing key with a complete official cell."
      : "The row maps to an existing ApiCity pricing key with a complete official cell.";
  } else if (String(official.interfaceType).toLowerCase() === "chat") {
    disposition = "token-billed";
    rationale =
      "The official row is token-billed; the Kie pricing table is a per-unit estimator and does not own token extraction.";
  } else if (!mappedKeys.length) {
    disposition = "upstream-unmappable";
    rationale =
      "The fresh official row has no current ApiCity pricing key or callable model mapping; retain it as an explicit final audit disposition.";
    technicalBlocker = architectureBlocker(official);
    if (/Qwen image 3\.0/i.test(String(official.modelDescription ?? ""))) {
      disposition = "unsupported-endpoint";
      followUpBead = "ac-huxfmb";
    } else if (
      /Ideogram V3 Reframe/i.test(String(official.modelDescription ?? ""))
    ) {
      disposition = "unsupported-endpoint";
      technicalBlocker = IDEOGRAM_V3_REFRAME_TECHNICAL_BLOCKER;
      followUpBead = "ac-flqhcu";
    } else if (
      /Wan 2\.2 A14B Turbo API/i.test(String(official.modelDescription ?? ""))
    ) {
      disposition = "unsupported-endpoint";
      followUpBead = "ac-7r282y";
    }
  } else if (issues.length) {
    disposition = "upstream-unmappable";
    rationale = `The official row is retained, but its pricing cell needs upstream clarification (${issues.join(", ")}).`;
    technicalBlocker = pricingCellBlocker(issues);
  } else if (mappedKeys.length) {
    disposition = "upstream-unmappable";
    rationale =
      "The row resembles an existing key, but its published unit or selector vocabulary is not safely expressible by the current estimator.";
    technicalBlocker =
      "The published unit or selector vocabulary is not represented by the current ApiCity estimator contract.";
  }

  const key = seedance ? "bytedance/seedance-2-5" : mappedKey;
  const result = {
    occurrenceId: raw.occurrenceId,
    rowHash: raw.rowHash,
    semanticKey: raw.semanticKey,
    official,
    disposition,
    mappedApiCityKeys: sortedUnique(mappedKeys),
    evidence: {
      url: official.anchor || null,
      source: "frozen official Kie snapshot",
    },
    rationale,
  };
  if (issues.length) result.officialCellIssues = issues;
  if (queryConflict) result.evidenceConflict = queryConflict;
  if (rateConflict) result.evidenceConflict = rateConflict;
  if (technicalBlocker) result.technicalBlocker = technicalBlocker;
  if (followUpBead) result.followUpBead = followUpBead;
  if (canonicalAlias) {
    result.canonicalKey = mappedKey;
  }
  if (
    disposition === "implemented" ||
    disposition === "canonical-alias" ||
    (disposition === "free-nonbillable" && mappedKeys.length && auditedUnit)
  ) {
    result.unit = auditedUnit.unit;
    const rawUnit = unitInfo(official);
    if (rawUnit) {
      result.officialUnit = rawUnit.unit;
      result.officialUnitQuantity = rawUnit.quantity;
    }
    if (auditedUnit.audit) result.unitAudit = auditedUnit.audit;
    if (key === "grok-imagine/text-to-image" && rawUnit?.quantity > 1) {
      result.billingBasis = "fixed-bundle";
    }
    if (
      key === "minimax-h3/image-to-video" &&
      /image input/i.test(String(official.modelDescription ?? ""))
    ) {
      result.billingComponent = "extra";
    }
    if (
      key === "seedream/5-pro-image-to-image" &&
      /input image/i.test(String(official.modelDescription ?? ""))
    ) {
      result.billingComponent = "extra";
    }
    result.rateBasis = {
      kind: "official-usd-price",
      creditPrice: official.creditPrice,
      creditUnit: official.creditUnit,
      usdPrice: official.usdPrice,
      rounding: "official value retained as published",
    };
    result.selectorValues =
      key === "bytedance/seedance-2-5"
        ? seedanceValues(official)
        : selectorValues(official, key, inventories);
    result.selectorSources = selectorSources(
      key,
      result.selectorValues,
      inventories
    );
    const pricingMetadata = representativePricingMetadata(official, key);
    const costHints = representativeCostHints(key, inventories, auditedUnit);
    if (pricingMetadata || costHints) {
      result.representativePricingMetadata = {
        ...(pricingMetadata ?? {}),
        ...(costHints ? { costHints } : {}),
      };
    }
    result.representativePayload = representativePayload(
      key,
      result.selectorValues,
      inventories.models.includes(key),
      official,
      inventories,
      auditedUnit
    );
    if (
      key === "nano-banana-pro" &&
      /1\/2k/i.test(String(official.modelDescription ?? ""))
    ) {
      result.representativeCases = [
        {
          ...result.representativePayload,
          input: {
            ...result.representativePayload.input,
            resolution: "2K",
          },
        },
      ];
    }
    if (
      key === "topaz/video-upscale" &&
      /upscale factor 1x\/2x/i.test(String(official.modelDescription ?? ""))
    ) {
      result.representativeCases = [
        {
          ...result.representativePayload,
          input: {
            ...result.representativePayload.input,
            upscale_factor: "2",
          },
        },
      ];
    }
  }
  return result;
}

function apiModelDisposition(id, linkedRows, inventories) {
  if (id === "bytedance/seedance-2-5") return "supported";
  if (linkedRows.length && inventories.pricingKeys.includes(id))
    return "supported";
  if (!inventories.pricingKeys.includes(id)) return "upstream-unmappable";
  return "upstream-unmappable";
}

function endpointPricingKeys(dotPath, inventories) {
  const mappings = {
    "api.v1.veo.generate": ["veo3", "veo3_fast", "veo3_lite"],
    "api.v1.veo.extend": ["veo/extend"],
    "api.v1.veo.get1080pVideo": ["veo/get-1080p-video"],
    "api.v1.veo.get4kVideo": ["veo/get-4k-video"],
    "api.v1.runway.generate": ["runway/generate"],
    "api.v1.runway.extend": ["runway/extend"],
    "api.v1.aleph.generate": ["aleph/generate"],
    "api.v1.generate": ["suno/generate"],
    "api.v1.generate.extend": ["suno/extend"],
    "api.v1.generate.generatePersona": ["suno/persona-generate"],
    "api.v1.mp4.generate": ["suno/mp4-generate"],
    "api.v1.wav.generate": ["suno/wav-generate"],
    "api.v1.vocalRemoval.generate": ["suno/vocal-removal-generate"],
    "api.v1.midi.generate": ["suno/midi-generate"],
  };
  return (mappings[dotPath] ?? []).filter((key) =>
    inventories.pricingKeys.includes(key)
  );
}

function linkedRowsByKey(rows) {
  const links = new Map();
  for (const row of rows) {
    for (const key of row.mappedApiCityKeys) {
      const ids = links.get(key) ?? [];
      ids.push(row.occurrenceId);
      links.set(key, ids);
    }
  }
  return links;
}

function countDispositions(entries, allowed) {
  const counts = Object.fromEntries(allowed.map((key) => [key, 0]));
  for (const entry of entries) {
    if (entry.disposition in counts) counts[entry.disposition] += 1;
  }
  return counts;
}

function mismatch(left, right) {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  return {
    missing: left.filter((value) => !rightSet.has(value)),
    extra: right.filter((value) => !leftSet.has(value)),
  };
}

function inventoryEntries(inventories, rows) {
  const links = linkedRowsByKey(rows);
  const models = inventories.models.map((id) => {
    const linkedRows = links.get(id) ?? [];
    const pricingKey = inventories.pricingKeys.includes(id) ? id : undefined;
    const disposition = apiModelDisposition(id, linkedRows, inventories);
    return {
      id,
      descriptor: inventories.descriptors.includes(id),
      guard: inventories.guards.includes(id),
      pricingKey: pricingKey ?? null,
      linkedRows,
      disposition,
      rationale:
        id === "bytedance/seedance-2-5"
          ? "WI6 reconciles the required Seedance 2.5 matrix against all six official cells."
          : linkedRows.length && pricingKey
            ? "Current schema, runtime guard, and pricing key are reconciled to frozen official evidence."
            : "WI6 records this model as an explicit schema audit membership because no usable runtime pricing key is evidenced.",
      ...(disposition === "upstream-unmappable"
        ? {
            rationale: linkedRows.length
              ? "The final source tree exposes the model, but no independently evidenced runtime pricing key covers it."
              : "The final WI6 inventory records the model without a current runtime pricing key as an explicit audit membership.",
          }
        : {}),
    };
  });

  const endpoints = inventories.endpoints.map((endpoint) => {
    const pricingKeys = endpointPricingKeys(endpoint.dotPath, inventories);
    const informational =
      /(?:recordInfo|credit|download|Upload|upload|validateInfo|checkVoice|file)/i.test(
        endpoint.dotPath
      );
    return {
      ...endpoint,
      linkedPricingKeys: pricingKeys,
      disposition: informational ? "free-nonbillable" : "supported",
      rationale: informational
        ? "Documented transport or account operation has no Kie model-pricing estimator key."
        : pricingKeys.length
          ? "Documented callable endpoint has one or more reconciled pricing keys."
          : "Documented callable endpoint is retained for architecture review even when its pricing is model-keyed.",
    };
  });

  const pricingKeys = inventories.pricingKeys.map((key) => ({
    key,
    linkedRows: links.get(key) ?? [],
    disposition: links.has(key) ? "supported" : "upstream-unmappable",
    rationale: links.has(key)
      ? "Current runtime pricing key is linked to one or more frozen official occurrences."
      : "Legacy/current pricing key has no matching row in the frozen official pull and requires a later evidence decision.",
  }));

  const slugEntries = inventories.slugKeys.map((key) => ({
    key,
    disposition:
      inventories.pricingKeys.includes(key) ||
      key.startsWith("kling-3.0/video/")
        ? "supported"
        : "upstream-unmappable",
  }));
  const displayEntries = inventories.displayKeys.map((key) => ({
    key,
    disposition:
      inventories.pricingKeys.includes(key) ||
      key.startsWith("kling-3.0/video/")
        ? "supported"
        : "upstream-unmappable",
  }));

  const schemaWithoutPricing = models
    .filter((entry) => !entry.pricingKey)
    .map((entry) => ({
      id: entry.id,
      disposition: entry.disposition,
      linkedRows: entry.linkedRows,
      rationale: entry.rationale,
      ...(entry.technicalBlocker
        ? { technicalBlocker: entry.technicalBlocker }
        : {}),
      ...(entry.followUpBead ? { followUpBead: entry.followUpBead } : {}),
    }));
  const pricingOnly = pricingKeys
    .filter((entry) => !inventories.models.includes(entry.key))
    .map((entry) => ({
      key: entry.key,
      linkedRows: entry.linkedRows,
      disposition: entry.disposition,
      rationale: entry.rationale,
    }));

  return {
    models,
    endpoints,
    pricingKeys,
    slugs: slugEntries,
    displays: displayEntries,
    schemaWithoutPricing,
    pricingOnly,
    plannedPricingKeys: [],
  };
}

function summaryFor(rows, apiCity, snapshot) {
  const rawDispositionCounts = countDispositions(rows, RAW_DISPOSITIONS);
  const modelCounts = countDispositions(apiCity.models, API_CITY_DISPOSITIONS);
  const endpointCounts = countDispositions(
    apiCity.endpoints,
    API_CITY_DISPOSITIONS
  );
  const pricingCounts = countDispositions(
    apiCity.pricingKeys,
    API_CITY_DISPOSITIONS
  );
  const slugCounts = countDispositions(apiCity.slugs, API_CITY_DISPOSITIONS);
  const displayCounts = countDispositions(
    apiCity.displays,
    API_CITY_DISPOSITIONS
  );
  const unclassifiedRows = rows.filter(
    (row) => !RAW_DISPOSITIONS.includes(row.disposition)
  ).length;
  const apiEntries = [
    ...apiCity.models,
    ...apiCity.endpoints,
    ...apiCity.pricingKeys,
    ...apiCity.slugs,
    ...apiCity.displays,
    ...apiCity.schemaWithoutPricing,
    ...apiCity.pricingOnly,
  ];
  const unclassifiedApiCityKeys = apiEntries.filter(
    (entry) => !API_CITY_DISPOSITIONS.includes(entry.disposition)
  ).length;
  const evidenceConflictRows = rows.filter((row) => row.evidenceConflict);
  const evidenceConflictsByKind = Object.fromEntries(
    [...new Set(evidenceConflictRows.map((row) => row.evidenceConflict.kind))]
      .sort()
      .map((kind) => [
        kind,
        evidenceConflictRows.filter((row) => row.evidenceConflict.kind === kind)
          .length,
      ])
  );
  return {
    rows: {
      captured: snapshot.records.length,
      unique: new Set(snapshot.records.map((row) => row.rowHash)).size,
      duplicateOccurrences:
        snapshot.records.length -
        new Set(snapshot.records.map((row) => row.rowHash)).size,
      dispositionCounts: rawDispositionCounts,
      unclassified: unclassifiedRows,
      evidenceConflicts: {
        count: evidenceConflictRows.length,
        byKind: evidenceConflictsByKind,
        occurrenceIds: evidenceConflictRows.map((row) => row.occurrenceId),
      },
    },
    apiCity: {
      models: {
        count: apiCity.models.length,
        descriptors: new Set(
          apiCity.models
            .filter((model) => model.descriptor)
            .map((model) => model.id)
        ).size,
        guards: new Set(
          apiCity.models.filter((model) => model.guard).map((model) => model.id)
        ).size,
        withoutPricing: apiCity.models.filter((model) => !model.pricingKey)
          .length,
        dispositionCounts: modelCounts,
        unclassified: apiCity.models.filter(
          (entry) => !API_CITY_DISPOSITIONS.includes(entry.disposition)
        ).length,
      },
      endpoints: {
        count: apiCity.endpoints.length,
        POST: apiCity.endpoints.filter((entry) => entry.method === "POST")
          .length,
        GET: apiCity.endpoints.filter((entry) => entry.method === "GET").length,
        dispositionCounts: endpointCounts,
        unclassified: apiCity.endpoints.filter(
          (entry) => !API_CITY_DISPOSITIONS.includes(entry.disposition)
        ).length,
      },
      pricingKeys: {
        count: apiCity.pricingKeys.length,
        dispositionCounts: pricingCounts,
        unclassified: apiCity.pricingKeys.filter(
          (entry) => !API_CITY_DISPOSITIONS.includes(entry.disposition)
        ).length,
      },
      slugs: {
        count: apiCity.slugs.length,
        dispositionCounts: slugCounts,
        unclassified: apiCity.slugs.filter(
          (entry) => !API_CITY_DISPOSITIONS.includes(entry.disposition)
        ).length,
      },
      displays: {
        count: apiCity.displays.length,
        dispositionCounts: displayCounts,
        unclassified: apiCity.displays.filter(
          (entry) => !API_CITY_DISPOSITIONS.includes(entry.disposition)
        ).length,
      },
      schemaWithoutPricing: {
        count: apiCity.schemaWithoutPricing.length,
        dispositionCounts: countDispositions(
          apiCity.schemaWithoutPricing,
          API_CITY_DISPOSITIONS
        ),
        unclassified: apiCity.schemaWithoutPricing.filter(
          (entry) => !API_CITY_DISPOSITIONS.includes(entry.disposition)
        ).length,
      },
      pricingOnly: {
        count: apiCity.pricingOnly.length,
        dispositionCounts: countDispositions(
          apiCity.pricingOnly,
          API_CITY_DISPOSITIONS
        ),
        unclassified: apiCity.pricingOnly.filter(
          (entry) => !API_CITY_DISPOSITIONS.includes(entry.disposition)
        ).length,
      },
      unclassified: unclassifiedApiCityKeys,
    },
    assertions: {
      zeroUnclassifiedRows: unclassifiedRows === 0,
      zeroUnclassifiedApiCityKeys: unclassifiedApiCityKeys === 0,
    },
  };
}

export async function buildReconciliationManifest({
  root = process.cwd(),
  snapshotPath,
  metadataPath,
  generatedAt = new Date().toISOString(),
}) {
  if (!snapshotPath || !metadataPath) {
    fail(
      "invalid-reconciliation-input",
      "snapshotPath and metadataPath are required"
    );
  }
  const absoluteSnapshotPath = path.resolve(root, snapshotPath);
  const absoluteMetadataPath = path.resolve(root, metadataPath);
  const snapshotBytes = await readFile(absoluteSnapshotPath);
  const snapshot = JSON.parse(snapshotBytes);
  const metadataBytes = await readFile(absoluteMetadataPath);
  const metadata = JSON.parse(metadataBytes);
  const metadataSha256 = sha256Bytes(metadataBytes);
  if (!Array.isArray(snapshot.records)) {
    fail("invalid-snapshot", "snapshot.records must be an array");
  }
  const inventories = await collectApiCityInventories(root);
  const rowInputs = snapshot.records.map((record) => ({
    occurrenceId: record.occurrenceId,
    rowHash: record.rowHash,
    semanticKey: record.semanticKey,
    raw: record.raw,
  }));
  const rows = rowInputs.map((row) => classifyRawRow(row, inventories));
  const apiCity = inventoryEntries(inventories, rows);
  const inventory = {
    baseline: INVENTORY_BASELINE,
    final: {
      models: inventories.models.length,
      pricingKeys: inventories.pricingKeys.length,
      slugKeys: inventories.slugKeys.length,
      displayKeys: inventories.displayKeys.length,
      schemaWithoutPricing: apiCity.schemaWithoutPricing.length,
      pricingOnly: apiCity.pricingOnly.length,
      endpoints: inventories.endpoints.length,
    },
  };
  const source = {
    files: inventories.files,
    hashes: await sourceHashes(root, inventories.files),
  };
  const snapshotRelative = path.relative(root, absoluteSnapshotPath);
  const metadataRelative = path.relative(root, absoluteMetadataPath);
  const manifest = {
    schema: RECONCILIATION_SCHEMA,
    version: 1,
    generatedAt,
    snapshot: {
      path: snapshotRelative,
      metadataPath: metadataRelative,
      sha256: sha256Bytes(snapshotBytes),
      reportedTotal: snapshot.reported?.total,
      capturedTotal: snapshot.records.length,
      pageCount: snapshot.pages?.length,
      metadataSha256,
    },
    comparison: metadata.comparison ?? null,
    inventory,
    source,
    rows,
    apiCity,
    summary: summaryFor(rows, apiCity, snapshot),
    runtimeCoverage: {
      exceptions: RUNTIME_VARIANT_EXCEPTIONS,
    },
    trace: {
      requirements: [
        "REQ-001",
        "REQ-002",
        "REQ-003",
        "REQ-004",
        "REQ-005",
        "REQ-006",
        "REQ-007",
        "REQ-008",
        "REQ-009",
        "REQ-010",
        "REQ-011",
        "REQ-012",
      ],
      workItem: "WI-6",
      upstream: [
        { path: snapshotRelative, hash: sha256Bytes(snapshotBytes) },
        { path: metadataRelative, hash: metadataSha256 },
      ],
    },
  };
  return manifest;
}

function assertArray(value, field) {
  if (!Array.isArray(value))
    fail("invalid-manifest", `${field} must be an array`);
}

function assertSameKeys(actual, expected, label) {
  const difference = mismatch(expected, actual);
  if (difference.missing.length || difference.extra.length) {
    fail(
      "stale-inventory",
      `${label} does not match the current source inventory`,
      {
        label,
        ...difference,
      }
    );
  }
}

function checkDisposition(entry, allowed, label) {
  if (!allowed.includes(entry.disposition)) {
    fail(
      "unclassified-entry",
      `${label} has invalid disposition ${entry.disposition ?? "<missing>"}`,
      {
        label,
        entry,
      }
    );
  }
}

function validateSelectorValues(row, inventories) {
  const keys = row.mappedApiCityKeys ?? [];
  if (keys.length !== 1) {
    fail(
      "canonical-key-count",
      `${row.occurrenceId} must have exactly one canonical pricing key`,
      { occurrenceId: row.occurrenceId, keys }
    );
  }
  const key = keys[0];
  if (row.canonicalKey && row.canonicalKey !== key) {
    fail(
      "canonical-key-mismatch",
      `${row.occurrenceId} canonicalKey disagrees with mappedApiCityKeys`
    );
  }
  if (!row.selectorValues || typeof row.selectorValues !== "object") {
    fail("selector-schema-missing", `${row.occurrenceId} lacks selectorValues`);
  }
  if (!row.selectorSources || typeof row.selectorSources !== "object") {
    fail(
      "selector-schema-missing",
      `${row.occurrenceId} lacks selectorSources`
    );
  }
  const modelFields = inventories.descriptorFields[key];
  const isCreateTask = inventories.models.includes(key);
  for (const [field, value] of Object.entries(row.selectorValues)) {
    const fieldSpec = modelFields?.[field];
    const grokExtendMetadata =
      key === "grok-imagine/extend" && field === "resolution";
    const expectedSource = fieldSpec
      ? `modelInputSchemas:${key}`
      : grokExtendMetadata
        ? "cost-only-metadata:grok-imagine/extend"
        : !isCreateTask && DIRECT_ENDPOINT_FIELDS.has(field)
          ? `direct-endpoint:${key}`
          : null;
    if (!expectedSource) {
      fail(
        "selector-field-unmapped",
        `${row.occurrenceId} selector ${field} is not in modelInputSchemas or the named direct-endpoint field set`,
        { occurrenceId: row.occurrenceId, key, field }
      );
    }
    if (row.selectorSources[field] !== expectedSource) {
      fail(
        "selector-source-mismatch",
        `${row.occurrenceId} selector ${field} has an invalid schema source`,
        {
          occurrenceId: row.occurrenceId,
          field,
          expectedSource,
          actualSource: row.selectorSources[field],
        }
      );
    }
    if (
      fieldSpec?.enum &&
      !fieldSpec.enum.some((allowed) => String(allowed) === String(value))
    ) {
      fail(
        "selector-value-unmapped",
        `${row.occurrenceId} selector ${field} has a value outside its schema enum`,
        { occurrenceId: row.occurrenceId, key, field, value }
      );
    }
  }
  const extraSources = Object.keys(row.selectorSources).filter(
    (field) => !Object.hasOwn(row.selectorValues, field)
  );
  if (extraSources.length) {
    fail(
      "selector-source-mismatch",
      `${row.occurrenceId} has selector sources without selector values`,
      { occurrenceId: row.occurrenceId, extraSources }
    );
  }
}

function validateRepresentativePayload(row, inventories) {
  const key = row.mappedApiCityKeys?.[0];
  if (!key || !row.representativePayload) return;
  if (!inventories.models.includes(key)) return;
  if (row.representativePayload.model !== key) {
    fail(
      "representative-payload-model-mismatch",
      `${row.occurrenceId} representative payload model does not match its pricing key`
    );
  }
  const input = row.representativePayload.input;
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    fail(
      "representative-payload-schema-missing",
      `${row.occurrenceId} representative payload lacks an input object`
    );
  }
  const fields = inventories.descriptorFields[key] ?? {};
  const topLevelUndeclared = Object.keys(row.representativePayload).filter(
    (field) =>
      !["model", "input"].includes(field) &&
      !(key === "grok-imagine/extend" && field === "resolution")
  );
  if (topLevelUndeclared.length) {
    fail(
      "representative-payload-field-unmapped",
      `${row.occurrenceId} representative payload contains undeclared top-level fields`,
      { occurrenceId: row.occurrenceId, key, undeclared: topLevelUndeclared }
    );
  }
  const undeclared = Object.keys(input).filter(
    (field) => !Object.hasOwn(fields, field)
  );
  if (undeclared.length) {
    fail(
      "representative-payload-field-unmapped",
      `${row.occurrenceId} representative payload contains fields absent from its model schema`,
      { occurrenceId: row.occurrenceId, key, undeclared }
    );
  }
}

function validateMembershipInventories(apiCity, inventories) {
  assertSameKeys(
    apiCity.schemaWithoutPricing.map((entry) => entry.id),
    inventories.models.filter((id) => !inventories.pricingKeys.includes(id)),
    "schemaWithoutPricing inventory"
  );
  assertSameKeys(
    apiCity.pricingOnly.map((entry) => entry.key),
    inventories.pricingKeys.filter((key) => !inventories.models.includes(key)),
    "pricingOnly inventory"
  );
  for (const entry of [
    ...apiCity.schemaWithoutPricing,
    ...apiCity.pricingOnly,
  ]) {
    checkDisposition(
      entry,
      API_CITY_DISPOSITIONS,
      `membership entry ${entry.id ?? entry.key}`
    );
  }
}

function validateEvidenceConflict(row) {
  const conflict = row.evidenceConflict;
  if (!conflict || typeof conflict !== "object") return;
  if (conflict.kind === "query-description-operation-conflict") {
    if (
      typeof conflict.queryModel !== "string" ||
      typeof conflict.queryOperation !== "string" ||
      typeof conflict.modelDescription !== "string" ||
      typeof conflict.message !== "string"
    ) {
      fail(
        "invalid-evidence-conflict",
        `${row.occurrenceId} query conflict lacks structured query evidence`
      );
    }
    return;
  }
  if (conflict.kind === "rate-conflict") {
    if (
      typeof conflict.runtimeKey !== "string" ||
      typeof conflict.runtimeVariant !== "string" ||
      typeof conflict.officialUsd !== "string" ||
      typeof conflict.runtimeUsd !== "string" ||
      typeof conflict.officialUnit !== "string" ||
      typeof conflict.runtimeUnit !== "string" ||
      typeof conflict.message !== "string"
    ) {
      fail(
        "invalid-evidence-conflict",
        `${row.occurrenceId} rate conflict lacks official/runtime evidence`
      );
    }
    return;
  }
  fail(
    "invalid-evidence-conflict",
    `${row.occurrenceId} has an unknown evidence conflict kind`,
    { kind: conflict.kind }
  );
}

const CLASSIFICATION_FIELDS = Object.freeze([
  "disposition",
  "mappedApiCityKeys",
  "evidence",
  "rationale",
  "officialCellIssues",
  "evidenceConflict",
  "technicalBlocker",
  "followUpBead",
  "canonicalKey",
  "unit",
  "officialUnit",
  "officialUnitQuantity",
  "unitAudit",
  "billingBasis",
  "billingComponent",
  "rateBasis",
  "selectorValues",
  "selectorSources",
  "representativePricingMetadata",
  "representativeCases",
  "representativePayload",
]);

function classificationProjection(row) {
  return Object.fromEntries(
    CLASSIFICATION_FIELDS.filter((field) => Object.hasOwn(row, field)).map(
      (field) => [field, row[field]]
    )
  );
}

function recomputeSummary(manifest, snapshot) {
  const summary = summaryFor(manifest.rows, manifest.apiCity, snapshot);
  if (canonicalJson(summary) !== canonicalJson(manifest.summary)) {
    fail(
      "summary-mismatch",
      "manifest summary does not reproduce from its entries",
      {
        expected: summary,
        actual: manifest.summary,
      }
    );
  }
}

function validateSeedance(rows) {
  const seedance = rows.filter((row) =>
    row.mappedApiCityKeys.includes("bytedance/seedance-2-5")
  );
  const requiredCellCount = Object.keys(REQUIRED_SEEDANCE_RATES).length;
  if (seedance.length !== requiredCellCount) {
    fail(
      "seedance-coverage-mismatch",
      `the manifest must contain exactly ${requiredCellCount} Seedance 2.5 rows`,
      {
        count: seedance.length,
      }
    );
  }
  const seen = new Set();
  for (const row of seedance) {
    if (row.disposition !== "implemented") {
      fail(
        "seedance-not-implemented",
        `${row.occurrenceId} is not implemented`
      );
    }
    const key = `${row.selectorValues?.resolution}|${row.selectorValues?.generate_audio ? "audio" : "no-audio"}`;
    const expectedRate = REQUIRED_SEEDANCE_RATES[key];
    if (!expectedRate || String(row.rateBasis?.usdPrice) !== expectedRate) {
      fail(
        "seedance-rate-mismatch",
        `${row.occurrenceId} does not match the required Seedance rate`,
        {
          key,
          expectedRate,
          actualRate: row.rateBasis?.usdPrice,
        }
      );
    }
    if (seen.has(key))
      fail(
        "seedance-duplicate-cell",
        `Seedance cell ${key} appears more than once`
      );
    seen.add(key);
  }
  if (seen.size !== Object.keys(REQUIRED_SEEDANCE_RATES).length) {
    fail(
      "seedance-cell-mismatch",
      "Seedance 2.5 does not cover all required cells",
      {
        expected: Object.keys(REQUIRED_SEEDANCE_RATES),
        actual: [...seen],
      }
    );
  }
}

export async function checkReconciliation({
  root = process.cwd(),
  manifest = undefined,
  manifestPath = undefined,
  snapshotPath = undefined,
  metadataPath = undefined,
}) {
  if (!manifest) {
    if (!manifestPath)
      fail(
        "invalid-reconciliation-input",
        "manifest or manifestPath is required"
      );
    manifest = await readJson(path.resolve(root, manifestPath));
  }
  if (manifest.schema !== RECONCILIATION_SCHEMA || manifest.version !== 1) {
    fail("invalid-manifest", "unsupported reconciliation manifest schema");
  }
  const resolvedSnapshotPath = path.resolve(
    root,
    snapshotPath ?? manifest.snapshot?.path ?? ""
  );
  const resolvedMetadataPath = path.resolve(
    root,
    metadataPath ?? manifest.snapshot?.metadataPath ?? ""
  );
  const snapshotBytes = await readFile(resolvedSnapshotPath);
  const snapshot = JSON.parse(snapshotBytes);
  const metadataBytes = await readFile(resolvedMetadataPath);
  const metadata = JSON.parse(metadataBytes);
  const metadataSha256 = sha256Bytes(metadataBytes);
  if (sha256Bytes(snapshotBytes) !== manifest.snapshot.sha256) {
    fail(
      "snapshot-checksum-mismatch",
      "manifest snapshot hash does not match snapshot bytes"
    );
  }
  if (metadata.snapshot?.sha256 !== manifest.snapshot.sha256) {
    fail(
      "metadata-checksum-mismatch",
      "pull metadata does not reference the manifest snapshot hash"
    );
  }
  if (manifest.snapshot.metadataSha256 !== metadataSha256) {
    fail(
      "metadata-bytes-checksum-mismatch",
      "manifest metadataSha256 does not match metadata bytes"
    );
  }
  const metadataTrace = manifest.trace?.upstream?.find(
    (entry) => entry.path === manifest.snapshot.metadataPath
  );
  if (metadataTrace?.hash !== metadataSha256) {
    fail(
      "metadata-trace-checksum-mismatch",
      "manifest metadata trace hash does not match metadata bytes"
    );
  }
  if (manifest.snapshot.reportedTotal !== snapshot.reported?.total) {
    fail("snapshot-count-mismatch", "manifest reported total is stale");
  }
  if (manifest.snapshot.capturedTotal !== snapshot.records?.length) {
    fail("snapshot-count-mismatch", "manifest captured total is stale");
  }
  assertArray(manifest.rows, "rows");
  assertArray(manifest.apiCity?.models, "apiCity.models");
  assertArray(manifest.apiCity?.endpoints, "apiCity.endpoints");
  assertArray(manifest.apiCity?.pricingKeys, "apiCity.pricingKeys");
  assertArray(manifest.apiCity?.slugs, "apiCity.slugs");
  assertArray(manifest.apiCity?.displays, "apiCity.displays");
  assertArray(
    manifest.apiCity?.schemaWithoutPricing,
    "apiCity.schemaWithoutPricing"
  );
  assertArray(manifest.apiCity?.pricingOnly, "apiCity.pricingOnly");
  assertArray(
    manifest.runtimeCoverage?.exceptions,
    "runtimeCoverage.exceptions"
  );
  if (
    canonicalJson(manifest.runtimeCoverage.exceptions) !==
    canonicalJson(RUNTIME_VARIANT_EXCEPTIONS)
  ) {
    fail(
      "runtime-coverage-drift",
      "runtime variant exceptions do not reproduce the audited exception list"
    );
  }
  for (const exception of manifest.runtimeCoverage.exceptions) {
    if (
      !exception.key ||
      typeof exception.variant !== "string" ||
      !["pricing-only", "legacy", "unreachable"].includes(exception.status) ||
      !exception.provenance ||
      !exception.rationale
    ) {
      fail(
        "runtime-coverage-exception-invalid",
        "runtime variant exception lacks status, provenance, or rationale",
        { exception }
      );
    }
  }
  const inventories = await collectApiCityInventories(root);
  const expectedFinalInventory = {
    models: inventories.models.length,
    pricingKeys: inventories.pricingKeys.length,
    slugKeys: inventories.slugKeys.length,
    displayKeys: inventories.displayKeys.length,
    schemaWithoutPricing: inventories.models.filter(
      (id) => !inventories.pricingKeys.includes(id)
    ).length,
    pricingOnly: inventories.pricingKeys.filter(
      (key) => !inventories.models.includes(key)
    ).length,
    endpoints: inventories.endpoints.length,
  };
  if (
    canonicalJson(manifest.inventory?.baseline) !==
    canonicalJson(INVENTORY_BASELINE)
  ) {
    fail(
      "inventory-baseline-mismatch",
      "manifest inventory baseline does not reproduce the frozen pre-WI5 counts"
    );
  }
  if (
    canonicalJson(manifest.inventory?.final) !==
    canonicalJson(expectedFinalInventory)
  ) {
    fail(
      "inventory-final-mismatch",
      "manifest final inventory counts do not reproduce the current source registries"
    );
  }

  const snapshotById = new Map(
    snapshot.records.map((record) => [record.occurrenceId, record])
  );
  const manifestIds = manifest.rows.map((row) => row.occurrenceId);
  assertUnique(manifestIds, "manifest rows");
  if (manifest.rows.length !== snapshot.records.length) {
    fail(
      "row-coverage-count-mismatch",
      "manifest rows do not cover every snapshot record"
    );
  }
  for (const row of manifest.rows) {
    const source = snapshotById.get(row.occurrenceId);
    if (!source)
      fail(
        "orphaned-manifest-row",
        `${row.occurrenceId} is not present in the snapshot`
      );
    if (
      row.rowHash !== source.rowHash ||
      row.semanticKey !== source.semanticKey ||
      canonicalJson(row.official) !== canonicalJson(source.raw)
    ) {
      fail(
        "manifest-row-drift",
        `${row.occurrenceId} does not reproduce its snapshot row`
      );
    }
    checkDisposition(row, RAW_DISPOSITIONS, `row ${row.occurrenceId}`);
    validateEvidenceConflict(row);
    if (
      row.evidenceConflict &&
      (row.disposition !== "upstream-unmappable" ||
        row.mappedApiCityKeys?.length)
    ) {
      fail(
        "invalid-evidence-conflict",
        `${row.occurrenceId} has a query/description conflict but is mapped or not upstream-unmappable`
      );
    }
    if (
      row.disposition === "implemented" ||
      row.disposition === "canonical-alias"
    ) {
      if (!row.unit || !row.rateBasis || !row.representativePayload) {
        fail(
          "incomplete-implemented-row",
          `${row.occurrenceId} lacks implementation evidence`
        );
      }
      validateSelectorValues(row, inventories);
      validateRepresentativePayload(row, inventories);
      if (row.representativeCases !== undefined) {
        if (!Array.isArray(row.representativeCases)) {
          fail(
            "representative-cases-invalid",
            `${row.occurrenceId} representativeCases must be an array`
          );
        }
        for (const representativePayload of row.representativeCases) {
          validateRepresentativePayload(
            { ...row, representativePayload },
            inventories
          );
        }
      }
    } else if (row.disposition === "free-nonbillable") {
      if (
        !explicitZero(row.official?.creditPrice) ||
        !explicitZero(row.official?.usdPrice)
      ) {
        fail(
          "invalid-free-row",
          `${row.occurrenceId} free-nonbillable row lacks explicit numeric zero credit and USD prices`
        );
      }
    } else if (row.disposition === "unsupported-endpoint") {
      if (
        typeof row.technicalBlocker !== "string" ||
        !row.technicalBlocker ||
        !FINAL_FOLLOW_UP_BEADS.has(row.followUpBead)
      ) {
        fail(
          "unsupported-without-blocker",
          `${row.occurrenceId} unsupported endpoint lacks a specific blocker and final follow-up handoff`
        );
      }
    }
    const expectedClassification = classifyRawRow(
      {
        occurrenceId: source.occurrenceId,
        rowHash: source.rowHash,
        semanticKey: source.semanticKey,
        raw: source.raw,
      },
      inventories
    );
    if (
      canonicalJson(classificationProjection(row)) !==
      canonicalJson(classificationProjection(expectedClassification))
    ) {
      fail(
        "classification-drift",
        `${row.occurrenceId} does not reproduce the canonical operation classification`
      );
    }
  }
  validateSeedance(manifest.rows);

  assertSameKeys(
    manifest.apiCity.models.map((entry) => entry.id),
    inventories.models,
    "ApiCity models"
  );
  assertSameKeys(
    manifest.apiCity.models
      .filter((entry) => entry.descriptor)
      .map((entry) => entry.id),
    inventories.descriptors,
    "ApiCity model descriptors"
  );
  assertSameKeys(
    manifest.apiCity.models
      .filter((entry) => entry.guard)
      .map((entry) => entry.id),
    inventories.guards,
    "ApiCity runtime guards"
  );
  assertSameKeys(
    manifest.apiCity.endpoints.map(
      (entry) => `${entry.method} ${entry.dotPath}`
    ),
    inventories.endpoints.map((entry) => `${entry.method} ${entry.dotPath}`),
    "ApiCity endpoints"
  );
  assertSameKeys(
    manifest.apiCity.pricingKeys.map((entry) => entry.key),
    inventories.pricingKeys,
    "ApiCity pricing keys"
  );
  assertSameKeys(
    manifest.apiCity.slugs.map((entry) => entry.key),
    inventories.slugKeys,
    "ApiCity slugs"
  );
  assertSameKeys(
    manifest.apiCity.displays.map((entry) => entry.key),
    inventories.displayKeys,
    "ApiCity displays"
  );
  validateMembershipInventories(manifest.apiCity, inventories);

  const hashes = await sourceHashes(root, inventories.files);
  for (const [relativePath, hash] of Object.entries(hashes)) {
    if (manifest.source?.hashes?.[relativePath] !== hash) {
      fail(
        "source-checksum-mismatch",
        `${relativePath} changed since manifest generation`,
        {
          relativePath,
          expected: manifest.source?.hashes?.[relativePath],
          actual: hash,
        }
      );
    }
  }
  for (const entry of [
    ...manifest.apiCity.models,
    ...manifest.apiCity.endpoints,
    ...manifest.apiCity.pricingKeys,
    ...manifest.apiCity.slugs,
    ...manifest.apiCity.displays,
    ...manifest.apiCity.schemaWithoutPricing,
    ...manifest.apiCity.pricingOnly,
  ]) {
    checkDisposition(
      entry,
      API_CITY_DISPOSITIONS,
      `ApiCity entry ${entry.id ?? entry.key ?? entry.dotPath}`
    );
    if (
      entry.disposition === "upstream-unmappable" &&
      (!entry.rationale || typeof entry.rationale !== "string")
    ) {
      fail(
        "unsupported-without-rationale",
        "unsupported ApiCity entry has no rationale",
        { entry }
      );
    }
    if (
      entry.disposition === "unsupported-endpoint" &&
      (typeof entry.technicalBlocker !== "string" ||
        !entry.technicalBlocker ||
        !FINAL_FOLLOW_UP_BEADS.has(entry.followUpBead))
    ) {
      fail(
        "unsupported-without-blocker",
        "unsupported ApiCity entry has no specific blocker and final follow-up handoff",
        { entry }
      );
    }
  }
  recomputeSummary(manifest, snapshot);
  if (
    !manifest.summary.assertions.zeroUnclassifiedRows ||
    !manifest.summary.assertions.zeroUnclassifiedApiCityKeys
  ) {
    fail(
      "unclassified-coverage",
      "manifest does not assert zero unclassified coverage"
    );
  }
  return {
    status: "ok",
    manifestPath: manifestPath ? path.resolve(root, manifestPath) : null,
    snapshotPath: resolvedSnapshotPath,
    metadataPath: resolvedMetadataPath,
    rows: snapshot.records.length,
    models: inventories.models.length,
    endpoints: inventories.endpoints.length,
    pricingKeys: inventories.pricingKeys.length,
    slugs: inventories.slugKeys.length,
    displays: inventories.displayKeys.length,
    zeroUnclassifiedRows: true,
    zeroUnclassifiedApiCityKeys: true,
  };
}

export const validateReconciliation = checkReconciliation;

function markdownList(values) {
  return values.length ? values.join(", ") : "none";
}

export function renderReconciliationMarkdown(manifest) {
  const counts = manifest.summary;
  const dispositions = counts.rows.dispositionCounts;
  const seedance = manifest.rows.filter((row) =>
    row.mappedApiCityKeys.includes("bytedance/seedance-2-5")
  );
  const malformed = manifest.rows.filter(
    (row) => row.officialCellIssues?.length
  );
  const conflicts = manifest.rows.filter((row) => row.evidenceConflict);
  const queryConflicts = conflicts.filter(
    (row) =>
      row.evidenceConflict.kind === "query-description-operation-conflict"
  );
  const rateConflicts = conflicts.filter(
    (row) => row.evidenceConflict.kind === "rate-conflict"
  );
  const unsupportedModels = manifest.apiCity.models.filter(
    (entry) => entry.disposition !== "supported"
  );
  const reframeRows = manifest.rows.filter((row) =>
    /^Ideogram V3 Reframe, image to image, /i.test(
      String(row.official.modelDescription ?? "")
    )
  );
  const runtimeExceptions = manifest.runtimeCoverage?.exceptions ?? [];
  const baseline = manifest.inventory?.baseline ?? INVENTORY_BASELINE;
  const lines = [
    `# Kie Pricing Reconciliation — ${manifest.snapshot.path}`,
    "",
    "## Scope",
    "",
    "This WI6 executable reconciliation joins the frozen official Kie pricing pull to the current ApiCity Kie model, endpoint, pricing, slug, and display registries. Every raw occurrence and every inventory key has exactly one explicit disposition.",
    "",
    "## Frozen Evidence",
    "",
    `- Snapshot: \`${manifest.snapshot.path}\``,
    `- Snapshot SHA-256: \`${manifest.snapshot.sha256}\``,
    `- Reported/captured rows: **${manifest.snapshot.reportedTotal}/${manifest.snapshot.capturedTotal}**`,
    `- Unique/duplicate occurrences: **${counts.rows.unique}/${counts.rows.duplicateOccurrences}**`,
    manifest.comparison
      ? `- Comparison baseline: **${manifest.comparison.baselineRows}** rows; added **${manifest.comparison.added}**, removed **${manifest.comparison.removed}**, changed **${manifest.comparison.changed}**.`
      : "- Comparison baseline: none recorded.",
    "",
    "## Inventory Counts",
    "",
    "| Surface | Baseline | Final | Detail |",
    "| --- | ---: | ---: | --- |",
    `| Schema model IDs | ${baseline.models} | ${counts.apiCity.models.count} | descriptors ${counts.apiCity.models.descriptors}; guards ${counts.apiCity.models.guards} |`,
    `| Documented endpoints | ${baseline.endpoints} | ${counts.apiCity.endpoints.count} | ${counts.apiCity.endpoints.POST} POST; ${counts.apiCity.endpoints.GET} GET |`,
    `| Runtime pricing keys | ${baseline.pricingKeys} | ${counts.apiCity.pricingKeys.count} | current Kie table |`,
    `| Schema-without-pricing inventory | ${baseline.schemaWithoutPricing} | ${counts.apiCity.schemaWithoutPricing.count} | explicit model memberships |`,
    `| Pricing-only inventory | ${baseline.pricingOnly} | ${counts.apiCity.pricingOnly.count} | explicit runtime-key memberships |`,
    `| Slug keys | ${baseline.slugKeys} | ${counts.apiCity.slugs.count} | Kie model metadata |`,
    `| Display keys | ${baseline.displayKeys} | ${counts.apiCity.displays.count} | Kie model metadata |`,
    "",
    "## Row Dispositions",
    "",
    "| Disposition | Count |",
    "| --- | ---: |",
    ...Object.entries(dispositions).map(
      ([key, value]) => `| ${key} | ${value} |`
    ),
    "",
    `Malformed or conflicting cells explicitly classified by WI6: **${malformed.length}**.`,
    malformed.length
      ? `Examples: ${markdownList(malformed.slice(0, 8).map((row) => `${row.occurrenceId} (${row.officialCellIssues.join(", ")})`))}`
      : "",
    "Derived USD values: none; implemented cells retain the official published USD field and do not apply an inferred credit conversion.",
    "",
    "## Evidence Conflicts",
    "",
    `Structured evidence conflicts: **${conflicts.length}** (${queryConflicts.length} query/operation; ${rateConflicts.length} official/runtime rate).`,
    "",
    "| Kind | Occurrence | Description | Official USD | Runtime USD | Query model | Disposition |",
    "| --- | --- | --- | ---: | ---: | --- | --- |",
    ...conflicts.map((row) => {
      const conflict = row.evidenceConflict;
      return `| ${conflict.kind} | ${row.occurrenceId} | ${row.official.modelDescription} | ${conflict.officialUsd ?? "—"} | ${conflict.runtimeUsd ?? "—"} | ${conflict.queryModel ?? "—"} | ${row.disposition} |`;
    }),
    "",
    "## Seedance 2.5",
    "",
    "The mandatory four official cells are executable against the integrated WI6 cost table:",
    "",
    "| Resolution | Generate audio | USD/sec | Occurrence |",
    "| --- | --- | ---: | --- |",
    ...seedance.map(
      (row) =>
        `| ${row.selectorValues.resolution} | ${row.selectorValues.generate_audio ? "audio" : "no-audio"} | ${row.rateBasis.usdPrice} | ${row.occurrenceId} |`
    ),
    "",
    "## Explicit Audit Queue",
    "",
    `Schema models without a current usable pricing key: **${counts.apiCity.schemaWithoutPricing.count}**; pricing-only runtime keys: **${counts.apiCity.pricingOnly.count}**.`,
    "",
    "| Model | Disposition | Technical blocker | Follow-up |",
    "| --- | --- | --- | --- |",
    ...unsupportedModels.map(
      (entry) =>
        `| \`${entry.id}\` | ${entry.disposition} | ${entry.technicalBlocker ?? entry.rationale} | ${entry.followUpBead ?? "none"} |`
    ),
    "",
    "### Ideogram V3 Reframe pricing rows",
    "",
    "The official Reframe pricing rows remain explicit unsupported-endpoint dispositions until Kie publishes a callable contract:",
    "",
    "| Official row | USD | Disposition | Technical blocker | Follow-up | Evidence |",
    "| --- | ---: | --- | --- | --- | --- |",
    ...reframeRows.map(
      (row) =>
        `| ${row.official.modelDescription} | ${row.official.usdPrice} | ${row.disposition} | ${row.technicalBlocker ?? row.rationale} | ${row.followUpBead ?? "none"} | ${row.evidence.url ?? "none"} |`
    ),
    "",
    "## Runtime Variant Coverage",
    "",
    `Every live Kie per-unit rate variant is covered by an executable official case or one of **${runtimeExceptions.length}** explicit exceptions below. Zero-rate Grok and Topaz entries are unreachable sentinels, not free variants.`,
    "",
    "| Runtime identity | Status | Provenance | Rationale |",
    "| --- | --- | --- | --- |",
    ...runtimeExceptions.map(
      (exception) =>
        `| \`${exception.key}|${exception.variant}\` | ${exception.status} | ${exception.provenance} | ${exception.rationale} |`
    ),
    "",
    "## Verification Contract",
    "",
    "- Snapshot bytes, pull metadata, and all six source registries are checksum-checked.",
    "- Manifest row IDs, row hashes, semantic keys, and official fields must reproduce the snapshot exactly.",
    "- Registry keys are derived from the current TypeScript/TSV source files; stale or missing entries fail the checker.",
    `- Zero unclassified raw rows: **${counts.assertions.zeroUnclassifiedRows}**.`,
    `- Zero unclassified ApiCity keys: **${counts.assertions.zeroUnclassifiedApiCityKeys}**.`,
  ];
  return lines.join("\n").replace(/\n{3,}/g, "\n\n");
}

export async function writeReconciliationArtifacts({
  manifest,
  manifestPath,
  markdownPath,
}) {
  if (!manifest || !manifestPath || !markdownPath) {
    fail(
      "invalid-reconciliation-output",
      "manifest, manifestPath, and markdownPath are required"
    );
  }
  const formatArtifact = async (contents, filepath) => {
    const config = (await prettier.resolveConfig(filepath)) ?? {};
    return prettier.format(contents, { ...config, filepath });
  };
  const [formattedManifest, formattedMarkdown] = await Promise.all([
    formatArtifact(`${JSON.stringify(manifest, null, 2)}\n`, manifestPath),
    formatArtifact(renderReconciliationMarkdown(manifest), markdownPath),
  ]);
  await writeFile(manifestPath, formattedManifest, "utf8");
  await writeFile(markdownPath, formattedMarkdown, "utf8");
  return { manifestPath, markdownPath };
}

function cliOptions(tokens) {
  const options = {};
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (!token.startsWith("--") || !tokens[index + 1]) {
      fail(
        "invalid-argument",
        `expected --name value, got ${token ?? "<end>"}`
      );
    }
    options[token.slice(2)] = tokens[index + 1];
    index += 1;
  }
  return options;
}

async function main() {
  const [command = "help", ...tokens] = process.argv.slice(2);
  const options = cliOptions(tokens);
  const root = path.resolve(options.root ?? process.cwd());
  if (command === "generate") {
    const manifest = await buildReconciliationManifest({
      root,
      snapshotPath: options.snapshot,
      metadataPath: options.metadata,
      generatedAt: options["generated-at"],
    });
    const manifestPath = path.resolve(root, options.manifest);
    const markdownPath = path.resolve(
      root,
      options.markdown ?? options.manifest.replace(/\.json$/i, ".md")
    );
    await writeReconciliationArtifacts({
      manifest,
      manifestPath,
      markdownPath,
    });
    console.log(
      JSON.stringify(
        { status: "ok", command, manifestPath, markdownPath },
        null,
        2
      )
    );
    return;
  }
  if (command === "check") {
    const result = await checkReconciliation({
      root,
      manifestPath: options.manifest,
      snapshotPath: options.snapshot,
      metadataPath: options.metadata,
    });
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  console.log(`Usage:
  node scripts/lib/kie-pricing-reconciliation.mjs generate --snapshot PATH --metadata PATH --manifest PATH [--markdown PATH]
  node scripts/lib/kie-pricing-reconciliation.mjs check --manifest PATH [--snapshot PATH] [--metadata PATH]`);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    await main();
  } catch (error) {
    console.error(
      JSON.stringify(
        {
          status: "error",
          code: error.code ?? "unexpected-error",
          message: error.message,
          ...(error.details ? { details: error.details } : {}),
        },
        null,
        2
      )
    );
    process.exitCode = 1;
  }
}
