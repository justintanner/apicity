#!/usr/bin/env node
/**
 * Documentation Generator for NakedAPI Providers
 *
 * Generates README.md files with collapsible method documentation
 * extracted from provider source files.
 */

import fs from "node:fs/promises";
import path from "node:path";

/**
 * Parse schema object from text content
 */
function parseSchemaObject(schemaBody) {
  const schema = {};

  // Extract method
  const methodMatch = schemaBody.match(
    /method:\s*"(POST|DELETE|PUT|GET|PATCH)"/
  );
  if (methodMatch) schema.method = methodMatch[1];

  // Extract path
  const pathMatch = schemaBody.match(/path:\s*"([^"]+)"/);
  if (pathMatch) schema.path = pathMatch[1];

  // Extract contentType
  const contentTypeMatch = schemaBody.match(/contentType:\s*"([^"]+)"/);
  if (contentTypeMatch) schema.contentType = contentTypeMatch[1];

  // Extract fields - find the fields property and parse its content
  const fieldsMatch = schemaBody.match(/fields:\s*\{/);
  if (fieldsMatch) {
    schema.fields = {};

    // Find the content of the fields object
    const fieldsStartIndex = schemaBody.indexOf("fields:") + "fields:".length;
    let braceCount = 0;
    let inFields = false;
    let fieldsContent = "";

    for (let i = fieldsStartIndex; i < schemaBody.length; i++) {
      const char = schemaBody[i];

      if (char === "{") {
        braceCount++;
        inFields = true;
      } else if (char === "}") {
        braceCount--;
        if (braceCount === 0 && inFields) {
          fieldsContent = schemaBody.slice(fieldsStartIndex + 1, i);
          break;
        }
      }
    }

    // Parse individual field definitions
    const fieldPattern = /(\w+):\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/g;
    let fieldMatch;
    while ((fieldMatch = fieldPattern.exec(fieldsContent)) !== null) {
      const fieldName = fieldMatch[1];
      const fieldBody = fieldMatch[2];

      const field = {};

      // Extract type
      const typeMatch = fieldBody.match(/type:\s*"([^"]+)"/);
      if (typeMatch) field.type = typeMatch[1];

      // Extract required
      const requiredMatch = fieldBody.match(/required:\s*(true|false)/);
      if (requiredMatch) field.required = requiredMatch[1] === "true";

      // Extract description
      const descMatch = fieldBody.match(/description:\s*"([^"]+)"/);
      if (descMatch) field.description = descMatch[1];

      // Extract enum values
      const enumMatch = fieldBody.match(/enum:\s*\[\s*([^\]]+)\s*\]/);
      if (enumMatch) {
        field.enum = enumMatch[1]
          .split(",")
          .map((s) => s.trim().replace(/"/g, "").replace(/'/g, ""))
          .filter(Boolean);
      }

      // Extract items for arrays
      const itemsMatch = fieldBody.match(
        /items:\s*\{\s*type:\s*"([^"]+)"\s*\}/
      );
      if (itemsMatch) {
        field.items = { type: itemsMatch[1] };
      }

      schema.fields[fieldName] = field;
    }
  }

  return schema;
}

/**
 * Extract schemas from TypeScript source using regex
 */
function extractSchemas(sourceText) {
  const schemas = [];

  // Match exported const schema declarations - use a more robust pattern
  // that finds the starting pattern and then extracts the full object
  const schemaStartPattern =
    /export\s+const\s+(\w+Schema)\s*:\s*PayloadSchema\s*=\s*\{/g;

  let match;
  while ((match = schemaStartPattern.exec(sourceText)) !== null) {
    const schemaName = match[1];
    const startIndex = match.index + match[0].length - 1; // Position at the opening brace

    // Find the matching closing brace
    let braceCount = 1;
    let endIndex = startIndex + 1;
    while (braceCount > 0 && endIndex < sourceText.length) {
      if (sourceText[endIndex] === "{") braceCount++;
      else if (sourceText[endIndex] === "}") braceCount--;
      endIndex++;
    }

    const schemaBody = sourceText.slice(startIndex + 1, endIndex - 1);
    const schema = parseSchemaObject(schemaBody);
    if (schema && schema.method) {
      schema.name = schemaName;
      schemas.push(schema);
    }
  }

  return schemas;
}

/**
 * Generate markdown table for schema fields
 */
function generateFieldsTable(fields) {
  if (!fields || Object.keys(fields).length === 0) {
    return "*No parameters*";
  }

  const rows = Object.entries(fields).map(([name, field]) => {
    const type = field.type || "unknown";
    const required = field.required ? "Yes" : "No";
    const description = field.description || "";
    const enumVals = field.enum
      ? `<br>Enum: \`${field.enum.join("`, `")}\``
      : "";
    return `| \`${name}\` | ${type} | ${required} | ${description}${enumVals} |`;
  });

  return [
    "| Field | Type | Required | Description |",
    "|-------|------|----------|-------------|",
    ...rows,
  ].join("\n");
}

/**
 * Extract provider metadata from package.json and README
 */
async function extractProviderMetadata(providerDir) {
  const pkgPath = path.join(providerDir, "package.json");
  const readmePath = path.join(providerDir, "README.md");

  let pkg = {};
  let existingReadme = "";

  try {
    pkg = JSON.parse(await fs.readFile(pkgPath, "utf8"));
  } catch {
    // Ignore
  }

  try {
    existingReadme = await fs.readFile(readmePath, "utf8");
  } catch {
    // Ignore
  }

  return { pkg, existingReadme };
}

/**
 * Generate the full README content
 */
async function generateReadme(providerDir, providerName) {
  const srcDir = path.join(providerDir, "src");
  const schemasPath = path.join(srcDir, "schemas.ts");

  // Parse schemas.ts
  const sourceText = await fs.readFile(schemasPath, "utf8");
  const schemas = extractSchemas(sourceText);

  const { pkg } = await extractProviderMetadata(providerDir);

  // Group schemas by HTTP method
  const byMethod = { GET: [], POST: [], DELETE: [], PUT: [], PATCH: [] };
  schemas.forEach((schema) => {
    const method = schema.method?.toUpperCase();
    if (byMethod[method]) {
      byMethod[method].push(schema);
    }
  });

  // Generate method name from schema path
  function getMethodName(schema) {
    // Convert path like /models/pricing/estimate to models.pricing.estimate
    return schema.path
      .replace(/^\//, "")
      .replace(/\//g, ".")
      .replace(/\{([^}]+)\}/g, "$1")
      .replace(/-/g, "");
  }

  // Generate markdown
  const sections = [];

  // Header
  sections.push(`# ${pkg.name || `@nakedapi/${providerName}`}`);
  sections.push("");
  sections.push(
    `[![npm](https://img.shields.io/npm/v/${pkg.name || "@nakedapi/" + providerName}?color=cb0000)](https://www.npmjs.com/package/${pkg.name || "@nakedapi/" + providerName})`
  );
  sections.push(
    "[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](package.json)"
  );
  sections.push(
    "[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)"
  );
  sections.push("");
  sections.push(pkg.description || `${providerName} provider for nakedapi.`);
  sections.push("");

  // Installation
  sections.push("## Installation");
  sections.push("");
  sections.push("```bash");
  sections.push(`npm install ${pkg.name || `@nakedapi/${providerName}`}`);
  sections.push("# or");
  sections.push(`pnpm add ${pkg.name || `@nakedapi/${providerName}`}`);
  sections.push("```");
  sections.push("");

  // Quick Start
  sections.push("## Quick Start");
  sections.push("");
  sections.push("```typescript");
  sections.push(
    `import { ${providerName} as create${providerName.charAt(0).toUpperCase() + providerName.slice(1)} } from "${pkg.name || `@nakedapi/${providerName}`}";`
  );
  sections.push("");
  sections.push(
    `const ${providerName} = create${providerName.charAt(0).toUpperCase() + providerName.slice(1)}({ apiKey: process.env.${providerName.toUpperCase()}_API_KEY! });`
  );
  sections.push("```");
  sections.push("");

  // API Reference
  sections.push("## API Reference");
  sections.push("");
  sections.push(
    "All methods include their payload schema and a `validatePayload()` function for runtime validation."
  );
  sections.push("");

  // Generate sections for each HTTP method
  Object.entries(byMethod).forEach(([method, methodSchemas]) => {
    if (methodSchemas.length === 0) return;

    sections.push(`### ${method} Endpoints`);
    sections.push("");

    methodSchemas.forEach((schema) => {
      const methodName = getMethodName(schema);
      const summaryLine = `<b><code>${methodName}</code></b> — <code>${schema.method} ${schema.path}</code>`;

      sections.push(`<details>`);
      sections.push(`<summary>${summaryLine}</summary>`);
      sections.push("");

      if (Object.keys(schema.fields || {}).length > 0) {
        sections.push("**Parameters:**");
        sections.push("");
        sections.push(generateFieldsTable(schema.fields));
        sections.push("");
      }

      sections.push("**Validation:**");
      sections.push("");
      sections.push("```typescript");
      sections.push(`// Access the schema`);
      sections.push(
        `${providerName}.${schema.name
          .replace("Schema", "")
          .replace(/([A-Z])/g, ".$1")
          .toLowerCase()
          .replace(/^\./, "")}.payloadSchema`
      );
      sections.push("");
      sections.push(`// Validate data`);
      sections.push(
        `${providerName}.${schema.name
          .replace("Schema", "")
          .replace(/([A-Z])/g, ".$1")
          .toLowerCase()
          .replace(/^\./, "")}.validatePayload(data)`
      );
      sections.push("```");
      sections.push("");
      sections.push(`</details>`);
      sections.push("");
    });
  });

  // Middleware section (if exists)
  sections.push("## Middleware");
  sections.push("");
  sections.push("```typescript");
  sections.push(
    `import { ${providerName} as create${providerName.charAt(0).toUpperCase() + providerName.slice(1)}, withRetry } from "${pkg.name || `@nakedapi/${providerName}`}";`
  );
  sections.push("");
  sections.push(
    `const ${providerName} = create${providerName.charAt(0).toUpperCase() + providerName.slice(1)}({ apiKey: process.env.${providerName.toUpperCase()}_API_KEY! });`
  );
  sections.push(
    `const models = withRetry(${providerName}.get.v1.models, { retries: 3 });`
  );
  sections.push("```");
  sections.push("");

  // Rate Limiting section for xai provider
  if (providerName === "xai") {
    sections.push("## Rate Limiting");
    sections.push("");
    sections.push(
      "Client-side rate limiting that queues requests to stay within xAI API limits."
    );
    sections.push("");
    sections.push("```typescript");
    sections.push("import {");
    sections.push("  xai as createXai,");
    sections.push("  withRateLimit,");
    sections.push("  withRetry,");
    sections.push("  createRateLimiter,");
    sections.push("  XAI_RATE_LIMITS,");
    sections.push('} from "@nakedapi/xai";');
    sections.push("");
    sections.push(
      "const xai = createXai({ apiKey: process.env.XAI_API_KEY! });"
    );
    sections.push("```");
    sections.push("");
    sections.push("### Using xAI tier presets");
    sections.push("");
    sections.push("```typescript");
    sections.push(
      "// Use built-in tier presets (free, tier1, tier2, tier3, tier4)"
    );
    sections.push("const limiter = createRateLimiter(XAI_RATE_LIMITS.tier1);");
    sections.push("// => { rpm: 60, concurrent: 10 }");
    sections.push("");
    sections.push(
      "const chat = withRateLimit(xai.post.v1.chat.completions, limiter);"
    );
    sections.push("```");
    sections.push("");
    sections.push("### Custom limits");
    sections.push("");
    sections.push("```typescript");
    sections.push(
      "const limiter = createRateLimiter({ rpm: 30, concurrent: 5 });"
    );
    sections.push(
      "const chat = withRateLimit(xai.post.v1.chat.completions, limiter);"
    );
    sections.push("```");
    sections.push("");
    sections.push("### Shared limiter across endpoints");
    sections.push("");
    sections.push(
      "RPM limits apply globally, so share a single limiter across all endpoints:"
    );
    sections.push("");
    sections.push("```typescript");
    sections.push("const limiter = createRateLimiter(XAI_RATE_LIMITS.tier2);");
    sections.push("");
    sections.push(
      "const chat = withRateLimit(xai.post.v1.chat.completions, limiter);"
    );
    sections.push(
      "const responses = withRateLimit(xai.post.v1.responses, limiter);"
    );
    sections.push(
      "const images = withRateLimit(xai.post.v1.images.generations, limiter);"
    );
    sections.push("```");
    sections.push("");
    sections.push("### Composing with retry");
    sections.push("");
    sections.push(
      "Place `withRateLimit` innermost so retries count against the limit:"
    );
    sections.push("");
    sections.push("```typescript");
    sections.push("const limiter = createRateLimiter(XAI_RATE_LIMITS.tier1);");
    sections.push("");
    sections.push("const chat = withRetry(");
    sections.push("  withRateLimit(xai.post.v1.chat.completions, limiter),");
    sections.push("  { retries: 2 }");
    sections.push(");");
    sections.push("```");
    sections.push("");
    sections.push("### Batch processing");
    sections.push("");
    sections.push(
      "Fire requests in parallel — the limiter handles pacing automatically:"
    );
    sections.push("");
    sections.push("```typescript");
    sections.push("const limiter = createRateLimiter(XAI_RATE_LIMITS.tier1);");
    sections.push(
      "const chat = withRateLimit(xai.post.v1.chat.completions, limiter);"
    );
    sections.push("");
    sections.push("const results = await Promise.all(");
    sections.push("  prompts.map((p) =>");
    sections.push("    chat({");
    sections.push('      model: "grok-3",');
    sections.push('      messages: [{ role: "user", content: p }],');
    sections.push("    })");
    sections.push("  )");
    sections.push(");");
    sections.push("```");
    sections.push("");
    sections.push("### xAI rate limit tiers");
    sections.push("");
    sections.push("| Preset | RPM | Concurrent | Spend threshold |");
    sections.push("|--------|-----|------------|-----------------|");
    sections.push("| `free` | 5 | 2 | $0 |");
    sections.push("| `tier1` | 60 | 10 | $0+ |");
    sections.push("| `tier2` | 200 | 25 | $100+ |");
    sections.push("| `tier3` | 500 | 50 | $500+ |");
    sections.push("| `tier4` | 1000 | 100 | $1,000+ |");
    sections.push("");
  }

  // License
  sections.push("## License");
  sections.push("");
  sections.push(pkg.license || "MIT");
  sections.push("");

  return sections.join("\n");
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const providerName = args[0] || path.basename(process.cwd());

  // Determine provider directory
  let providerDir;
  if (args[0] && args[0].startsWith("packages/")) {
    providerDir = path.resolve(args[0]);
  } else if (args[0]) {
    providerDir = path.resolve("packages/provider", args[0]);
  } else {
    providerDir = process.cwd();
  }

  console.log(`Generating docs for ${providerName}...`);
  console.log(`Provider directory: ${providerDir}`);

  const readmePath = path.join(providerDir, "README.md");

  try {
    const readme = await generateReadme(providerDir, providerName);
    await fs.writeFile(readmePath, readme, "utf8");
    console.log(`✅ Generated ${readmePath}`);
  } catch (error) {
    console.error(`❌ Error generating docs: ${error.message}`);
    process.exit(1);
  }
}

main();
