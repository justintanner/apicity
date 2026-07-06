import os
import re

googleflow_dir = "/gc/.gc/worktrees/apicity/polecats/gastown.polecat/ac-73y5f-new-module-googleflow/packages/provider/googleflow/src"

with open(os.path.join(googleflow_dir, "types.ts"), "r") as f:
    types_content = f.read()

# Remove non-flow stuff from imports
types_content = re.sub(r'  GoogleCountTokensRequest,\n', '', types_content)
types_content = re.sub(r'  GoogleGenerateContentRequest,\n  GoogleRetrieveUserQuotaRequest,\n  GoogleRetrieveUserQuotaSummaryRequest,\n', '', types_content)

types_content = re.sub(r'  GoogleRetrieveUserQuotaRequest,\n  GoogleRetrieveUserQuotaSummaryRequest,\n  GoogleBlob,\n  GoogleFileData,\n  GoogleFunctionCall,\n  GoogleFunctionResponse,\n  GooglePart,\n  GoogleContent,\n  GoogleSafetySetting,\n  GoogleGenerationConfig,\n  GoogleFunctionDeclaration,\n  GoogleTool,\n  GoogleToolConfig,\n  GoogleGenerateContentRequest,\n  GoogleGenerateContentRequestInput,\n  GoogleGenerateContentParsedRequest,\n  GoogleCountTokensRequest,\n  GoogleCountTokensRequestInput,\n  GoogleCountTokensParsedRequest,\n', '', types_content)

# Remove interfaces from 88 to 156
types_content = re.sub(r'export interface GoogleCandidate \{.*?\nexport interface GoogleCountTokensMethod \{\n.*?\}\n', '', types_content, flags=re.DOTALL)

# Update namespaces
types_content = types_content.replace('export interface GooglePostV1Namespace {\n  googleFlow: GoogleFlowPostV1Namespace;\n}', 'export interface GoogleFlowPostNamespace {\n  v1: GoogleFlowPostV1Namespace;\n}')
types_content = types_content.replace('export interface GooglePostNamespace {\n  v1: GooglePostV1Namespace;\n}', '')
types_content = types_content.replace('export interface GoogleGetV1Namespace {\n  googleFlow: GoogleFlowGetV1Namespace;\n}', 'export interface GoogleFlowGetNamespace {\n  v1: GoogleFlowGetV1Namespace;\n}')
types_content = types_content.replace('export interface GoogleGetNamespace {\n  v1: GoogleGetV1Namespace;\n}', '')
types_content = types_content.replace('export interface GoogleDeleteV1Namespace {\n  googleFlow: GoogleFlowDeleteV1Namespace;\n}', 'export interface GoogleFlowDeleteNamespace {\n  v1: GoogleFlowDeleteV1Namespace;\n}')
types_content = types_content.replace('export interface GoogleDeleteNamespace {\n  v1: GoogleDeleteV1Namespace;\n}', '')

# Antigravity / Cloud Code usage
types_content = re.sub(r'// ---------- Antigravity / Cloud Code usage \(rate-limit utilization\) ----------.*?\nexport interface GoogleProvider \{\n.*?\}\n', '', types_content, flags=re.DOTALL)

# Provider
provider = """export interface GoogleFlowProvider {
  v1: GoogleFlowPostV1Namespace;
  post: GoogleFlowPostNamespace;
  get: GoogleFlowGetNamespace;
  delete: GoogleFlowDeleteNamespace;
}
"""
types_content += provider

with open(os.path.join(googleflow_dir, "types.ts"), "w") as f:
    f.write(types_content)

with open(os.path.join(googleflow_dir, "index.ts"), "r") as f:
    index_content = f.read()

index_content = re.sub(r'  GoogleCountTokensMethod,\n  GoogleCountTokensResponse,\n', '', index_content)
index_content = re.sub(r'  GoogleGenerateContentMethod,\n  GoogleGenerateContentResponse,\n  GoogleCandidate,\n  GoogleModalityTokenCount,\n  GooglePromptFeedback,\n  GoogleUsageMetadata,\n  GoogleV1InternalNamespace,\n  GoogleRetrieveUserQuotaMethod,\n  GoogleRetrieveUserQuotaResponse,\n  GoogleRetrieveUserQuotaSummaryMethod,\n  GoogleRetrieveUserQuotaSummaryResponse,\n  GoogleQuotaGroup,\n  GoogleQuotaBucket,\n  GoogleQuotaSummaryBucket,\n', '', index_content)
index_content = re.sub(r'  GoogleBlob,\n  GoogleFileData,\n  GoogleFunctionCall,\n  GoogleFunctionResponse,\n  GooglePart,\n  GoogleContent,\n  GoogleSafetySetting,\n  GoogleGenerationConfig,\n  GoogleFunctionDeclaration,\n  GoogleTool,\n  GoogleToolConfig,\n  GoogleGenerateContentRequest,\n  GoogleGenerateContentRequestInput,\n  GoogleGenerateContentParsedRequest,\n  GoogleCountTokensRequest,\n  GoogleCountTokensRequestInput,\n  GoogleCountTokensParsedRequest,\n  GoogleRetrieveUserQuotaRequest,\n  GoogleRetrieveUserQuotaSummaryRequest,\n', '', index_content)
index_content = re.sub(r'  GoogleRetrieveUserQuotaRequestSchema,\n  GoogleRetrieveUserQuotaSummaryRequestSchema,\n  GoogleBlobSchema,\n  GoogleFileDataSchema,\n  GoogleFunctionCallSchema,\n  GoogleFunctionResponseSchema,\n  GooglePartSchema,\n  GoogleContentSchema,\n  GoogleSafetySettingSchema,\n  GoogleGenerationConfigSchema,\n  GoogleFunctionDeclarationSchema,\n  GoogleToolSchema,\n  GoogleToolConfigSchema,\n  GoogleGenerateContentRequestSchema,\n  GoogleCountTokensRequestSchema,\n', '', index_content)

index_content = index_content.replace('GooglePostV1PublishersNamespace,', '')
index_content = index_content.replace('GooglePostV1PublishersGoogleNamespace,', '')
index_content = index_content.replace('GooglePostV1PublishersGoogleModelsNamespace,', '')
index_content = index_content.replace('GooglePostNamespace,', 'GoogleFlowPostNamespace,')
index_content = index_content.replace('GooglePostV1Namespace,', '')
index_content = index_content.replace('GoogleGetNamespace,', 'GoogleFlowGetNamespace,')
index_content = index_content.replace('GoogleGetV1Namespace,', '')
index_content = index_content.replace('GoogleDeleteNamespace,', 'GoogleFlowDeleteNamespace,')
index_content = index_content.replace('GoogleDeleteV1Namespace,', '')

with open(os.path.join(googleflow_dir, "index.ts"), "w") as f:
    f.write(index_content)

with open(os.path.join(googleflow_dir, "google.ts"), "r") as f:
    google_content = f.read()

# Fix duplicates
google_content = google_content.replace('import type {\n  GoogleFlowOptions,\n  GoogleFlowProvider, z } from "zod";\n', '')
google_content = google_content.replace('import {\n  \n  \n  \n  GoogleFlowAccountsCreateRequestSchema,', 'import {\n  GoogleFlowAccountsCreateRequestSchema,')

with open(os.path.join(googleflow_dir, "google.ts"), "w") as f:
    f.write(google_content)

print("googleflow clean")
