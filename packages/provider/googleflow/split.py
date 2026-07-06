import os
import re

googleflow_dir = "/gc/.gc/worktrees/apicity/polecats/gastown.polecat/ac-73y5f-new-module-googleflow/packages/provider/googleflow/src"
google_dir = "/gc/.gc/worktrees/apicity/polecats/gastown.polecat/ac-73y5f-new-module-googleflow/packages/provider/google/src"

# --- GOOGLEFLOW ---

# 1. Update googleflow/src/zod.ts
with open(os.path.join(googleflow_dir, "zod.ts"), "r") as f:
    zod_content = f.read()

# Remove GoogleRetrieveUserQuotaRequestSchema to GoogleCountTokensRequestSchema
zod_content = re.sub(r'export const GoogleRetrieveUserQuotaRequestSchema.*?export const GoogleCountTokensRequestSchema.*?\.passthrough\(\);\n', '', zod_content, flags=re.DOTALL)
# Update Options schema
zod_content = re.sub(r'export const GoogleOptionsSchema = z\.object\(\{(.*?)\}\);', 
                     'export const GoogleFlowOptionsSchema = z.object({\n  apiKey: z.string(),\n  baseURL: z.string().url().optional(),\n  timeout: z.number().optional(),\n  fetch: z.custom<typeof fetch>().optional(),\n});', 
                     zod_content, flags=re.DOTALL)
# Remove GoogleRetrieveUserQuotaRequest to GoogleCountTokensParsedRequest
zod_content = re.sub(r'export type GoogleRetrieveUserQuotaRequest.*?export type GoogleCountTokensParsedRequest.*?;\n', '', zod_content, flags=re.DOTALL)
# Rename GoogleOptions to GoogleFlowOptions
zod_content = zod_content.replace('export type GoogleOptions = z.infer<typeof GoogleOptionsSchema>;', 'export type GoogleFlowOptions = z.infer<typeof GoogleFlowOptionsSchema>;')

with open(os.path.join(googleflow_dir, "zod.ts"), "w") as f:
    f.write(zod_content)

# 2. Update googleflow/src/types.ts
with open(os.path.join(googleflow_dir, "types.ts"), "r") as f:
    types_content = f.read()

types_content = types_content.replace('GoogleOptions', 'GoogleFlowOptions')
types_content = types_content.replace('GoogleProvider', 'GoogleFlowProvider')
types_content = types_content.replace('GoogleError', 'GoogleFlowError')

# Keep only Flow-related types
types_content = re.sub(r'export interface GoogleCountTokensRequest.*?export interface GoogleRetrieveUserQuotaSummaryResponse.*?\}\n', '', types_content, flags=re.DOTALL)
types_content = re.sub(r'export interface GooglePostV1PublishersGoogleModelsNamespace.*?\}\n\n', '', types_content, flags=re.DOTALL)
types_content = re.sub(r'export interface GooglePostV1PublishersGoogleNamespace.*?\}\n\n', '', types_content, flags=re.DOTALL)
types_content = re.sub(r'export interface GooglePostV1PublishersNamespace.*?\}\n\n', '', types_content, flags=re.DOTALL)
types_content = re.sub(r'export interface GooglePostV1Namespace \{\n  publishers: GooglePostV1PublishersNamespace;\n  googleFlow: GoogleFlowPostV1Namespace;\n\}', 'export interface GooglePostV1Namespace {\n  googleFlow: GoogleFlowPostV1Namespace;\n}', types_content)
types_content = re.sub(r'export interface GoogleV1InternalNamespace.*?\}\n\n', '', types_content, flags=re.DOTALL)
types_content = re.sub(r'export interface GoogleFlowProvider \{\n  v1: GooglePostV1Namespace;\n  v1internal: GoogleV1InternalNamespace;\n  post: GooglePostNamespace;\n  get: GoogleGetNamespace;\n  delete: GoogleDeleteNamespace;\n\}', 'export interface GoogleFlowProvider {\n  v1: GooglePostV1Namespace;\n  post: GooglePostNamespace;\n  get: GoogleGetNamespace;\n  delete: GoogleDeleteNamespace;\n}', types_content)

with open(os.path.join(googleflow_dir, "types.ts"), "w") as f:
    f.write(types_content)

# 3. Update googleflow/src/google.ts
with open(os.path.join(googleflow_dir, "google.ts"), "r") as f:
    google_content = f.read()

google_content = google_content.replace('import { GoogleError }', 'import { GoogleFlowError }')
google_content = google_content.replace('import type {', 'import type {\n  GoogleFlowOptions,\n  GoogleFlowProvider,')
google_content = re.sub(r'GoogleCountTokensRequest,.*?GoogleCountTokensResponse,', '', google_content, flags=re.DOTALL)
google_content = re.sub(r'GoogleGenerateContentRequest,.*?GoogleGenerateContentResponse,', '', google_content, flags=re.DOTALL)
google_content = re.sub(r'GoogleOptions,.*?GoogleProvider,', '', google_content, flags=re.DOTALL)
google_content = re.sub(r'GoogleRetrieveUserQuotaRequest,.*?GoogleRetrieveUserQuotaSummaryResponse,', '', google_content, flags=re.DOTALL)
google_content = google_content.replace('GoogleCountTokensRequestSchema,', '')
google_content = google_content.replace('GoogleRetrieveUserQuotaRequestSchema,', '')
google_content = google_content.replace('GoogleRetrieveUserQuotaSummaryRequestSchema,', '')
google_content = google_content.replace('GoogleGenerateContentRequestSchema,', '')
google_content = google_content.replace('GoogleError', 'GoogleFlowError')

# Replace createGoogle with createGoogleFlow
create_google_replacement = """export function createGoogleFlow(opts: GoogleFlowOptions): GoogleFlowProvider {
  const baseURL = opts.baseURL ?? GOOGLE_FLOW_API_URL;
  const normalizedFlowBaseURL = baseURL.replace(/\\/+$/, "");
  const flowApiKey = opts.apiKey;
  const doFetch = opts.fetch ?? fetch;
  const timeout = opts.timeout ?? 30000;"""

google_content = re.sub(r'export function createGoogle\(opts: GoogleOptions\): GoogleProvider \{.*?const timeout = opts\.timeout \?\? 30000;', create_google_replacement, google_content, flags=re.DOTALL)

# Remove makeCloudCodeRequest
google_content = re.sub(r'  // POST against the Cloud Code backend.*?async function makeCloudCodeRequest.*?  \}\n', '', google_content, flags=re.DOTALL)
# Remove makeRequest
google_content = re.sub(r'  async function makeRequest.*?  \}\n', '', google_content, flags=re.DOTALL)

# Remove v1internal
google_content = re.sub(r'  const v1internal = \{.*?  \};\n', '', google_content, flags=re.DOTALL)
# Remove publishers from postV1
google_content = re.sub(r'    publishers: \{.*?    \},\n    googleFlow:', '    googleFlow:', google_content, flags=re.DOTALL)

# Remove v1internal from return
google_content = google_content.replace('    v1internal,\n', '')

with open(os.path.join(googleflow_dir, "google.ts"), "w") as f:
    f.write(google_content)

# 4. Update googleflow/src/index.ts
with open(os.path.join(googleflow_dir, "index.ts"), "r") as f:
    index_content = f.read()

index_content = index_content.replace('export { createGoogle } from "./google";', 'export { createGoogleFlow } from "./google";')
index_content = index_content.replace('export { GoogleError } from "./types";', 'export { GoogleFlowError } from "./types";')
index_content = index_content.replace('GoogleProvider,', 'GoogleFlowProvider,')
index_content = re.sub(r'  GooglePostV1PublishersNamespace,.*?  GoogleCountTokensResponse,\n', '', index_content, flags=re.DOTALL)
index_content = re.sub(r'  GoogleGenerateContentMethod,.*?  GoogleQuotaSummaryBucket,\n', '', index_content, flags=re.DOTALL)
index_content = index_content.replace('GoogleOptions,', 'GoogleFlowOptions,')
index_content = re.sub(r'  GoogleBlob,.*?  GoogleCountTokensParsedRequest,\n', '', index_content, flags=re.DOTALL)
index_content = re.sub(r'  GoogleRetrieveUserQuotaRequest,\n  GoogleRetrieveUserQuotaSummaryRequest,\n', '', index_content, flags=re.DOTALL)
index_content = index_content.replace('GoogleOptionsSchema,', 'GoogleFlowOptionsSchema,')
index_content = re.sub(r'  GoogleRetrieveUserQuotaRequestSchema,.*?  GoogleCountTokensRequestSchema,\n', '', index_content, flags=re.DOTALL)

with open(os.path.join(googleflow_dir, "index.ts"), "w") as f:
    f.write(index_content)

print("GoogleFlow processed successfully.")
