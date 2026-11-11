// Reviewed from the ac-0lt830 S0 survey (2026-11-04). Exact row membership
// is intentional: a newly added endpoint must never inherit a free policy.
import type { EndpointBilling } from "./types";
import type { EndpointCostPolicyMatch } from "./endpoint-cost-policy";

export interface EndpointBillingPolicy {
  match: EndpointCostPolicyMatch;
  billing: Omit<EndpointBilling, "provider" | "method" | "dotPath">;
}

function rows(
  provider: string,
  billing: EndpointBillingPolicy["billing"],
  endpoints: readonly string[]
): EndpointBillingPolicy[] {
  return endpoints.map((row) => {
    const [method, dotPath] = row.split(" ");
    return { match: { provider, method, dotPath }, billing };
  });
}

export const ENDPOINT_BILLING: readonly EndpointBillingPolicy[] = [
  {
    match: { provider: "alibaba" },
    billing: {
      kind: "unpriced",
      reason: "No reviewed billing record for this endpoint",
    },
  },
  {
    match: { provider: "anthropic" },
    billing: {
      kind: "unpriced",
      reason: "No reviewed billing record for this endpoint",
    },
  },
  {
    match: { provider: "b2" },
    billing: {
      kind: "unpriced",
      reason: "No reviewed billing record for this endpoint",
    },
  },
  {
    match: { provider: "binance" },
    billing: {
      kind: "unpriced",
      reason: "No reviewed billing record for this endpoint",
    },
  },
  {
    match: { provider: "dolthub" },
    billing: {
      kind: "unpriced",
      reason: "No reviewed billing record for this endpoint",
    },
  },
  {
    match: { provider: "dropbox" },
    billing: {
      kind: "unpriced",
      reason: "No reviewed billing record for this endpoint",
    },
  },
  {
    match: { provider: "elevenlabs" },
    billing: {
      kind: "unpriced",
      reason: "No reviewed billing record for this endpoint",
    },
  },
  {
    match: { provider: "endless" },
    billing: {
      kind: "unpriced",
      reason: "No reviewed billing record for this endpoint",
    },
  },
  {
    match: { provider: "fal" },
    billing: {
      kind: "unpriced",
      reason: "No reviewed billing record for this endpoint",
    },
  },
  {
    match: { provider: "fireworks" },
    billing: {
      kind: "unpriced",
      reason: "No reviewed billing record for this endpoint",
    },
  },
  {
    match: { provider: "free-media-upload" },
    billing: {
      kind: "unpriced",
      reason: "No reviewed billing record for this endpoint",
    },
  },
  {
    match: { provider: "google" },
    billing: {
      kind: "unpriced",
      reason: "No reviewed billing record for this endpoint",
    },
  },
  {
    match: { provider: "googleflow" },
    billing: {
      kind: "unpriced",
      reason: "No reviewed billing record for this endpoint",
    },
  },
  {
    match: { provider: "kie" },
    billing: {
      kind: "unpriced",
      reason: "No reviewed billing record for this endpoint",
    },
  },
  {
    match: { provider: "kimicoding" },
    billing: {
      kind: "unpriced",
      reason: "No reviewed billing record for this endpoint",
    },
  },
  {
    match: { provider: "machgen" },
    billing: {
      kind: "unpriced",
      reason: "No reviewed billing record for this endpoint",
    },
  },
  {
    match: { provider: "meta" },
    billing: {
      kind: "unpriced",
      reason: "No reviewed billing record for this endpoint",
    },
  },
  {
    match: { provider: "omkar" },
    billing: {
      kind: "unpriced",
      reason: "No reviewed billing record for this endpoint",
    },
  },
  {
    match: { provider: "openai" },
    billing: {
      kind: "unpriced",
      reason: "No reviewed billing record for this endpoint",
    },
  },
  {
    match: { provider: "openf1" },
    billing: {
      kind: "unpriced",
      reason: "No reviewed billing record for this endpoint",
    },
  },
  {
    match: { provider: "openligadb" },
    billing: {
      kind: "unpriced",
      reason: "No reviewed billing record for this endpoint",
    },
  },
  {
    match: { provider: "polymarket" },
    billing: {
      kind: "unpriced",
      reason: "No reviewed billing record for this endpoint",
    },
  },
  {
    match: { provider: "quo" },
    billing: {
      kind: "unpriced",
      reason: "No reviewed billing record for this endpoint",
    },
  },
  {
    match: { provider: "s3" },
    billing: {
      kind: "unpriced",
      reason: "No reviewed billing record for this endpoint",
    },
  },
  {
    match: { provider: "simplefunctions" },
    billing: {
      kind: "unpriced",
      reason: "No reviewed billing record for this endpoint",
    },
  },
  {
    match: { provider: "telegram" },
    billing: {
      kind: "unpriced",
      reason: "No reviewed billing record for this endpoint",
    },
  },
  {
    match: { provider: "thesportsdb" },
    billing: {
      kind: "unpriced",
      reason: "No reviewed billing record for this endpoint",
    },
  },
  {
    match: { provider: "tiktok-creative-center" },
    billing: {
      kind: "unpriced",
      reason: "No reviewed billing record for this endpoint",
    },
  },
  {
    match: { provider: "wavespeed" },
    billing: {
      kind: "unpriced",
      reason: "No reviewed billing record for this endpoint",
    },
  },
  {
    match: { provider: "x" },
    billing: {
      kind: "unpriced",
      reason: "No reviewed billing record for this endpoint",
    },
  },
  {
    match: { provider: "xai" },
    billing: {
      kind: "unpriced",
      reason: "No reviewed billing record for this endpoint",
    },
  },
  {
    match: { provider: "youtube" },
    billing: {
      kind: "unpriced",
      reason: "No reviewed billing record for this endpoint",
    },
  },
  {
    match: { provider: "zaicoding" },
    billing: {
      kind: "unpriced",
      reason: "No reviewed billing record for this endpoint",
    },
  },
  ...rows(
    "alibaba",
    {
      kind: "metered",
      unit: "images",
      source: {
        url: "https://www.alibabacloud.com/help/en/model-studio/model-pricing",
        asOf: "2026-11-04",
      },
    },
    [
      "POST api.v1.services.aigc.imageGeneration.generation",
      "POST api.v1.services.aigc.multimodalGeneration.generation",
    ]
  ),
  ...rows(
    "alibaba",
    {
      kind: "metered",
      unit: "seconds",
      source: {
        url: "https://www.alibabacloud.com/help/en/model-studio/model-pricing",
        asOf: "2026-11-04",
      },
    },
    ["POST api.v1.services.aigc.videoGeneration.videoSynthesis"]
  ),
  ...rows(
    "alibaba",
    {
      kind: "followup",
      reason:
        "Task poll; billed on the submit it follows. usage.duration states billed seconds.",
      source: {
        url: "https://www.alibabacloud.com/help/en/model-studio/model-pricing",
        asOf: "2026-11-04",
      },
    },
    ["GET api.v1.tasks"]
  ),
  ...rows(
    "alibaba",
    {
      kind: "free",
      reason:
        "Issues a temporary upload slot; the pricing page has no row for it",
      source: {
        url: "https://www.alibabacloud.com/help/en/model-studio/model-pricing",
        asOf: "2026-11-04",
      },
    },
    ["GET api.v1.uploads"]
  ),
  ...rows(
    "alibaba",
    {
      kind: "metered",
      unit: "tokens",
      reason:
        "Dated model rates selected by deployment scope and input-token tier",
      source: {
        url: "https://www.alibabacloud.com/help/en/model-studio/model-pricing",
        asOf: "2026-11-04",
      },
    },
    ["POST compatibleMode.v1.chat.completions"]
  ),
  ...rows(
    "alibaba",
    {
      kind: "free",
      reason: "Model list; no charge",
      source: {
        url: "https://www.alibabacloud.com/help/en/model-studio/model-pricing",
        asOf: "2026-11-04",
      },
    },
    ["GET compatibleMode.v1.models"]
  ),
  ...rows(
    "anthropic",
    {
      kind: "free",
      reason: "Reads a plan's usage windows; no charge",
      source: {
        url: "https://platform.claude.com/docs/en/about-claude/pricing.md",
        asOf: "2026-11-04",
      },
    },
    ["GET api.oauth.usage"]
  ),
  ...rows(
    "anthropic",
    {
      kind: "free",
      reason: "Docs: Files API operations are free",
      source: {
        url: "https://platform.claude.com/docs/en/build-with-claude/files.md",
        asOf: "2026-11-04",
      },
    },
    [
      "POST v1.files",
      "GET v1.files.content",
      "DELETE v1.files.del",
      "GET v1.files.list",
      "GET v1.files.retrieve",
    ]
  ),
  ...rows(
    "anthropic",
    {
      kind: "metered",
      unit: "tokens",
      reason:
        "Dated model rates include both cache-write TTLs. Server tools bill apart: web search 10 USD per 1k.",
      source: {
        url: "https://platform.claude.com/docs/en/about-claude/pricing.md",
        asOf: "2026-11-04",
      },
    },
    ["POST v1.messages"]
  ),
  ...rows(
    "anthropic",
    {
      kind: "metered",
      unit: "tokens",
      reason:
        "Forecast per item at 50 percent of model and cache rates; strict requires per-item usage. Errored, canceled and expired requests are not billed",
      source: {
        url: "https://platform.claude.com/docs/en/build-with-claude/batch-processing.md",
        asOf: "2026-11-04",
      },
    },
    ["POST v1.messages.batches"]
  ),
  ...rows(
    "anthropic",
    {
      kind: "free",
      reason:
        "Model list or batch list, cancel or delete; the pricing page bills none of these",
      source: {
        url: "https://platform.claude.com/docs/en/about-claude/pricing.md",
        asOf: "2026-11-04",
      },
    },
    [
      "POST v1.messages.batches.cancel",
      "DELETE v1.messages.batches.del",
      "GET v1.messages.batches.list",
      "GET v1.models.list",
      "GET v1.models.retrieve",
    ]
  ),
  ...rows(
    "anthropic",
    {
      kind: "followup",
      reason: "Batch poll or result; billed as the batch's requests complete",
      source: {
        url: "https://platform.claude.com/docs/en/about-claude/pricing.md",
        asOf: "2026-11-04",
      },
    },
    ["GET v1.messages.batches.results", "GET v1.messages.batches.retrieve"]
  ),
  ...rows(
    "anthropic",
    {
      kind: "free",
      reason: "Docs: token counting is free to use",
      source: {
        url: "https://platform.claude.com/docs/en/build-with-claude/token-counting.md",
        asOf: "2026-11-04",
      },
    },
    ["POST v1.messages.countTokens"]
  ),
  ...rows(
    "anthropic",
    {
      kind: "free",
      reason:
        "Skill management has no pricing row; execution bills as code execution and tokens",
      source: {
        url: "https://platform.claude.com/docs/en/build-with-claude/skills-guide.md",
        asOf: "2026-11-04",
      },
    },
    [
      "POST v1.skills.create",
      "DELETE v1.skills.del",
      "GET v1.skills.list",
      "GET v1.skills.retrieve",
      "POST v1.skills.versions.create",
      "DELETE v1.skills.versions.del",
      "GET v1.skills.versions.list",
    ]
  ),
  ...rows(
    "b2",
    {
      kind: "free",
      reason:
        "CreateBucket is a Class C transaction, free. Class D covers only Backblaze's outbound event notifications, so no row here is class D. Storage and egress beyond 3x storage bill apart.",
      source: {
        url: "https://www.backblaze.com/cloud-storage/transaction-pricing",
        asOf: "2026-11-04",
      },
    },
    ["PUT buckets.create"]
  ),
  ...rows(
    "b2",
    {
      kind: "free",
      reason:
        "DeleteBucket is a Class A transaction, free. Class D covers only Backblaze's outbound event notifications, so no row here is class D. Storage and egress beyond 3x storage bill apart.",
      source: {
        url: "https://www.backblaze.com/cloud-storage/transaction-pricing",
        asOf: "2026-11-04",
      },
    },
    ["DELETE buckets.del"]
  ),
  ...rows(
    "b2",
    {
      kind: "free",
      reason:
        "DeleteBucketCors is a Class C transaction, free. Class D covers only Backblaze's outbound event notifications, so no row here is class D. Storage and egress beyond 3x storage bill apart.",
      source: {
        url: "https://www.backblaze.com/cloud-storage/transaction-pricing",
        asOf: "2026-11-04",
      },
    },
    ["DELETE buckets.delCors"]
  ),
  ...rows(
    "b2",
    {
      kind: "free",
      reason:
        "DeleteBucketEncryption is a Class C transaction, free. Class D covers only Backblaze's outbound event notifications, so no row here is class D. Storage and egress beyond 3x storage bill apart.",
      source: {
        url: "https://www.backblaze.com/cloud-storage/transaction-pricing",
        asOf: "2026-11-04",
      },
    },
    ["DELETE buckets.delEncryption"]
  ),
  ...rows(
    "b2",
    {
      kind: "free",
      reason:
        "GetBucketAcl is a Class C transaction, free. Class D covers only Backblaze's outbound event notifications, so no row here is class D. Storage and egress beyond 3x storage bill apart.",
      source: {
        url: "https://www.backblaze.com/cloud-storage/transaction-pricing",
        asOf: "2026-11-04",
      },
    },
    ["GET buckets.getAcl"]
  ),
  ...rows(
    "b2",
    {
      kind: "free",
      reason:
        "GetBucketCors is a Class C transaction, free. Class D covers only Backblaze's outbound event notifications, so no row here is class D. Storage and egress beyond 3x storage bill apart.",
      source: {
        url: "https://www.backblaze.com/cloud-storage/transaction-pricing",
        asOf: "2026-11-04",
      },
    },
    ["GET buckets.getCors"]
  ),
  ...rows(
    "b2",
    {
      kind: "free",
      reason:
        "GetBucketEncryption is a Class C transaction, free. Class D covers only Backblaze's outbound event notifications, so no row here is class D. Storage and egress beyond 3x storage bill apart.",
      source: {
        url: "https://www.backblaze.com/cloud-storage/transaction-pricing",
        asOf: "2026-11-04",
      },
    },
    ["GET buckets.getEncryption"]
  ),
  ...rows(
    "b2",
    {
      kind: "free",
      reason:
        "GetObjectLockConfiguration is a Class B transaction, free. Class D covers only Backblaze's outbound event notifications, so no row here is class D. Storage and egress beyond 3x storage bill apart.",
      source: {
        url: "https://www.backblaze.com/cloud-storage/transaction-pricing",
        asOf: "2026-11-04",
      },
    },
    ["GET buckets.getObjectLockConfiguration"]
  ),
  ...rows(
    "b2",
    {
      kind: "free",
      reason:
        "GetBucketVersioning is a Class C transaction, free. Class D covers only Backblaze's outbound event notifications, so no row here is class D. Storage and egress beyond 3x storage bill apart.",
      source: {
        url: "https://www.backblaze.com/cloud-storage/transaction-pricing",
        asOf: "2026-11-04",
      },
    },
    ["GET buckets.getVersioning"]
  ),
  ...rows(
    "b2",
    {
      kind: "free",
      reason:
        "HeadBucket is a Class C transaction, free. Class D covers only Backblaze's outbound event notifications, so no row here is class D. Storage and egress beyond 3x storage bill apart.",
      source: {
        url: "https://www.backblaze.com/cloud-storage/transaction-pricing",
        asOf: "2026-11-04",
      },
    },
    ["HEAD buckets.head"]
  ),
  ...rows(
    "b2",
    {
      kind: "free",
      reason:
        "ListBuckets is a Class C transaction, free. Class D covers only Backblaze's outbound event notifications, so no row here is class D. Storage and egress beyond 3x storage bill apart.",
      source: {
        url: "https://www.backblaze.com/cloud-storage/transaction-pricing",
        asOf: "2026-11-04",
      },
    },
    ["GET buckets.list"]
  ),
  ...rows(
    "b2",
    {
      kind: "free",
      reason:
        "GetBucketLocation is a Class C transaction, free. Class D covers only Backblaze's outbound event notifications, so no row here is class D. Storage and egress beyond 3x storage bill apart.",
      source: {
        url: "https://www.backblaze.com/cloud-storage/transaction-pricing",
        asOf: "2026-11-04",
      },
    },
    ["GET buckets.location"]
  ),
  ...rows(
    "b2",
    {
      kind: "free",
      reason:
        "PutBucketAcl is a Class C transaction, free. Class D covers only Backblaze's outbound event notifications, so no row here is class D. Storage and egress beyond 3x storage bill apart.",
      source: {
        url: "https://www.backblaze.com/cloud-storage/transaction-pricing",
        asOf: "2026-11-04",
      },
    },
    ["PUT buckets.putAcl"]
  ),
  ...rows(
    "b2",
    {
      kind: "free",
      reason:
        "PutBucketCors is a Class C transaction, free. Class D covers only Backblaze's outbound event notifications, so no row here is class D. Storage and egress beyond 3x storage bill apart.",
      source: {
        url: "https://www.backblaze.com/cloud-storage/transaction-pricing",
        asOf: "2026-11-04",
      },
    },
    ["PUT buckets.putCors"]
  ),
  ...rows(
    "b2",
    {
      kind: "free",
      reason:
        "PutBucketEncryption is a Class C transaction, free. Class D covers only Backblaze's outbound event notifications, so no row here is class D. Storage and egress beyond 3x storage bill apart.",
      source: {
        url: "https://www.backblaze.com/cloud-storage/transaction-pricing",
        asOf: "2026-11-04",
      },
    },
    ["PUT buckets.putEncryption"]
  ),
  ...rows(
    "b2",
    {
      kind: "free",
      reason:
        "PutObjectLockConfiguration is a Class A transaction, free. Class D covers only Backblaze's outbound event notifications, so no row here is class D. Storage and egress beyond 3x storage bill apart.",
      source: {
        url: "https://www.backblaze.com/cloud-storage/transaction-pricing",
        asOf: "2026-11-04",
      },
    },
    ["PUT buckets.putObjectLockConfiguration"]
  ),
  ...rows(
    "b2",
    {
      kind: "free",
      reason:
        "AbortMultipartUpload is a Class A transaction, free. Class D covers only Backblaze's outbound event notifications, so no row here is class D. Storage and egress beyond 3x storage bill apart.",
      source: {
        url: "https://www.backblaze.com/cloud-storage/transaction-pricing",
        asOf: "2026-11-04",
      },
    },
    ["DELETE objects.abortMultipartUpload"]
  ),
  ...rows(
    "b2",
    {
      kind: "free",
      reason:
        "CompleteMultipartUpload is a Class A transaction, free. Class D covers only Backblaze's outbound event notifications, so no row here is class D. Storage and egress beyond 3x storage bill apart.",
      source: {
        url: "https://www.backblaze.com/cloud-storage/transaction-pricing",
        asOf: "2026-11-04",
      },
    },
    ["POST objects.completeMultipartUpload"]
  ),
  ...rows(
    "b2",
    {
      kind: "free",
      reason:
        "CopyObject is a Class C transaction, free. Class D covers only Backblaze's outbound event notifications, so no row here is class D. Storage and egress beyond 3x storage bill apart.",
      source: {
        url: "https://www.backblaze.com/cloud-storage/transaction-pricing",
        asOf: "2026-11-04",
      },
    },
    ["PUT objects.copy"]
  ),
  ...rows(
    "b2",
    {
      kind: "free",
      reason:
        "CreateMultipartUpload is a Class A transaction, free. Class D covers only Backblaze's outbound event notifications, so no row here is class D. Storage and egress beyond 3x storage bill apart.",
      source: {
        url: "https://www.backblaze.com/cloud-storage/transaction-pricing",
        asOf: "2026-11-04",
      },
    },
    ["POST objects.createMultipartUpload"]
  ),
  ...rows(
    "b2",
    {
      kind: "free",
      reason:
        "DeleteObject is a Class A transaction, free. Class D covers only Backblaze's outbound event notifications, so no row here is class D. Storage and egress beyond 3x storage bill apart.",
      source: {
        url: "https://www.backblaze.com/cloud-storage/transaction-pricing",
        asOf: "2026-11-04",
      },
    },
    ["DELETE objects.del"]
  ),
  ...rows(
    "b2",
    {
      kind: "free",
      reason:
        "DeleteObjects is a Class A transaction, free. Class D covers only Backblaze's outbound event notifications, so no row here is class D. Storage and egress beyond 3x storage bill apart.",
      source: {
        url: "https://www.backblaze.com/cloud-storage/transaction-pricing",
        asOf: "2026-11-04",
      },
    },
    ["POST objects.delMany"]
  ),
  ...rows(
    "b2",
    {
      kind: "free",
      reason:
        "GetObject is a Class B transaction, free. Class D covers only Backblaze's outbound event notifications, so no row here is class D. Storage and egress beyond 3x storage bill apart.",
      source: {
        url: "https://www.backblaze.com/cloud-storage/transaction-pricing",
        asOf: "2026-11-04",
      },
    },
    ["GET objects.get", "GET objects.getStream"]
  ),
  ...rows(
    "b2",
    {
      kind: "free",
      reason:
        "GetObjectAcl is a Class C transaction, free. Class D covers only Backblaze's outbound event notifications, so no row here is class D. Storage and egress beyond 3x storage bill apart.",
      source: {
        url: "https://www.backblaze.com/cloud-storage/transaction-pricing",
        asOf: "2026-11-04",
      },
    },
    ["GET objects.getAcl"]
  ),
  ...rows(
    "b2",
    {
      kind: "free",
      reason:
        "GetObjectLegalHold is a Class B transaction, free. Class D covers only Backblaze's outbound event notifications, so no row here is class D. Storage and egress beyond 3x storage bill apart.",
      source: {
        url: "https://www.backblaze.com/cloud-storage/transaction-pricing",
        asOf: "2026-11-04",
      },
    },
    ["GET objects.getLegalHold"]
  ),
  ...rows(
    "b2",
    {
      kind: "free",
      reason:
        "GetObjectRetention is a Class B transaction, free. Class D covers only Backblaze's outbound event notifications, so no row here is class D. Storage and egress beyond 3x storage bill apart.",
      source: {
        url: "https://www.backblaze.com/cloud-storage/transaction-pricing",
        asOf: "2026-11-04",
      },
    },
    ["GET objects.getRetention"]
  ),
  ...rows(
    "b2",
    {
      kind: "free",
      reason:
        "HeadObject is a Class B transaction, free. Class D covers only Backblaze's outbound event notifications, so no row here is class D. Storage and egress beyond 3x storage bill apart.",
      source: {
        url: "https://www.backblaze.com/cloud-storage/transaction-pricing",
        asOf: "2026-11-04",
      },
    },
    ["HEAD objects.head"]
  ),
  ...rows(
    "b2",
    {
      kind: "free",
      reason:
        "ListObjectsV2 is a Class C transaction, free. Class D covers only Backblaze's outbound event notifications, so no row here is class D. Storage and egress beyond 3x storage bill apart.",
      source: {
        url: "https://www.backblaze.com/cloud-storage/transaction-pricing",
        asOf: "2026-11-04",
      },
    },
    ["GET objects.list"]
  ),
  ...rows(
    "b2",
    {
      kind: "free",
      reason:
        "ListObjects is a Class C transaction, free. Class D covers only Backblaze's outbound event notifications, so no row here is class D. Storage and egress beyond 3x storage bill apart.",
      source: {
        url: "https://www.backblaze.com/cloud-storage/transaction-pricing",
        asOf: "2026-11-04",
      },
    },
    ["GET objects.listLegacy"]
  ),
  ...rows(
    "b2",
    {
      kind: "free",
      reason:
        "ListMultipartUploads is a Class C transaction, free. Class D covers only Backblaze's outbound event notifications, so no row here is class D. Storage and egress beyond 3x storage bill apart.",
      source: {
        url: "https://www.backblaze.com/cloud-storage/transaction-pricing",
        asOf: "2026-11-04",
      },
    },
    ["GET objects.listMultipartUploads"]
  ),
  ...rows(
    "b2",
    {
      kind: "free",
      reason:
        "ListParts is a Class C transaction, free. Class D covers only Backblaze's outbound event notifications, so no row here is class D. Storage and egress beyond 3x storage bill apart.",
      source: {
        url: "https://www.backblaze.com/cloud-storage/transaction-pricing",
        asOf: "2026-11-04",
      },
    },
    ["GET objects.listParts"]
  ),
  ...rows(
    "b2",
    {
      kind: "free",
      reason:
        "ListObjectVersions is a Class C transaction, free. Class D covers only Backblaze's outbound event notifications, so no row here is class D. Storage and egress beyond 3x storage bill apart.",
      source: {
        url: "https://www.backblaze.com/cloud-storage/transaction-pricing",
        asOf: "2026-11-04",
      },
    },
    ["GET objects.listVersions"]
  ),
  ...rows(
    "b2",
    {
      kind: "free",
      reason:
        "PutObject is a Class A transaction, free. Class D covers only Backblaze's outbound event notifications, so no row here is class D. Storage and egress beyond 3x storage bill apart.",
      source: {
        url: "https://www.backblaze.com/cloud-storage/transaction-pricing",
        asOf: "2026-11-04",
      },
    },
    ["PUT objects.put"]
  ),
  ...rows(
    "b2",
    {
      kind: "free",
      reason:
        "PutObjectAcl is a Class C transaction, free. Class D covers only Backblaze's outbound event notifications, so no row here is class D. Storage and egress beyond 3x storage bill apart.",
      source: {
        url: "https://www.backblaze.com/cloud-storage/transaction-pricing",
        asOf: "2026-11-04",
      },
    },
    ["PUT objects.putAcl"]
  ),
  ...rows(
    "b2",
    {
      kind: "free",
      reason:
        "PutObjectLegalHold is a Class A transaction, free. Class D covers only Backblaze's outbound event notifications, so no row here is class D. Storage and egress beyond 3x storage bill apart.",
      source: {
        url: "https://www.backblaze.com/cloud-storage/transaction-pricing",
        asOf: "2026-11-04",
      },
    },
    ["PUT objects.putLegalHold"]
  ),
  ...rows(
    "b2",
    {
      kind: "free",
      reason:
        "PutObjectRetention is a Class A transaction, free. Class D covers only Backblaze's outbound event notifications, so no row here is class D. Storage and egress beyond 3x storage bill apart.",
      source: {
        url: "https://www.backblaze.com/cloud-storage/transaction-pricing",
        asOf: "2026-11-04",
      },
    },
    ["PUT objects.putRetention"]
  ),
  ...rows(
    "b2",
    {
      kind: "free",
      reason:
        "UploadPart is a Class A transaction, free. Class D covers only Backblaze's outbound event notifications, so no row here is class D. Storage and egress beyond 3x storage bill apart.",
      source: {
        url: "https://www.backblaze.com/cloud-storage/transaction-pricing",
        asOf: "2026-11-04",
      },
    },
    ["PUT objects.uploadPart"]
  ),
  ...rows(
    "b2",
    {
      kind: "free",
      reason:
        "UploadPartCopy is a Class C transaction, free. Class D covers only Backblaze's outbound event notifications, so no row here is class D. Storage and egress beyond 3x storage bill apart.",
      source: {
        url: "https://www.backblaze.com/cloud-storage/transaction-pricing",
        asOf: "2026-11-04",
      },
    },
    ["PUT objects.uploadPartCopy"]
  ),
  ...rows(
    "binance",
    {
      kind: "free",
      reason:
        "Public spot market data; no API charge, weight limits only. binance.com answered the plain fetch with an empty 202, so the row rests on the public-endpoint contract.",
      source: {
        url: "https://developers.binance.com/docs/binance-spot-api-docs/rest-api/limits",
        asOf: "2026-11-04",
      },
    },
    [
      "GET api.v3.aggTrades",
      "GET api.v3.avgPrice",
      "GET api.v3.depth",
      "GET api.v3.exchangeInfo",
      "GET api.v3.executionRules",
      "GET api.v3.historicalBlockTrades",
      "GET api.v3.historicalTrades",
      "GET api.v3.klines",
      "GET api.v3.ping",
      "GET api.v3.referencePrice",
      "GET api.v3.referencePrice.calculation",
      "GET api.v3.ticker",
      "GET api.v3.ticker.bookTicker",
      "GET api.v3.ticker.price",
      "GET api.v3.ticker.tradingDay",
      "GET api.v3.ticker.twentyFourHr",
      "GET api.v3.time",
      "GET api.v3.trades",
      "GET api.v3.uiKlines",
      "GET coinMFutures.data.basis",
      "GET coinMFutures.data.deliveryPrice",
      "GET coinMFutures.data.globalLongShortAccountRatio",
      "GET coinMFutures.data.openInterestHist",
      "GET coinMFutures.data.takerBuySellVol",
      "GET coinMFutures.data.topLongShortAccountRatio",
      "GET coinMFutures.data.topLongShortPositionRatio",
      "GET dapi.v1.aggTrades",
      "GET dapi.v1.constituents",
      "GET dapi.v1.continuousKlines",
      "GET dapi.v1.depth",
      "GET dapi.v1.exchangeInfo",
      "GET dapi.v1.fundingInfo",
      "GET dapi.v1.fundingRate",
      "GET dapi.v1.indexPriceKlines",
      "GET dapi.v1.klines",
      "GET dapi.v1.markPriceKlines",
      "GET dapi.v1.openInterest",
      "GET dapi.v1.ping",
      "GET dapi.v1.premiumIndex",
      "GET dapi.v1.premiumIndexKlines",
      "GET dapi.v1.ticker.bookTicker",
      "GET dapi.v1.ticker.price",
      "GET dapi.v1.ticker.twentyFourHr",
      "GET dapi.v1.time",
      "GET dapi.v1.trades",
      "GET eapi.v1.blockTrades",
      "GET eapi.v1.depth",
      "GET eapi.v1.exchangeInfo",
      "GET eapi.v1.exerciseHistory",
      "GET eapi.v1.index",
      "GET eapi.v1.klines",
      "GET eapi.v1.mark",
      "GET eapi.v1.openInterest",
      "GET eapi.v1.ping",
      "GET eapi.v1.ticker",
      "GET eapi.v1.time",
      "GET eapi.v1.trades",
      "GET fapi.v1.aggTrades",
      "GET fapi.v1.assetIndex",
      "GET fapi.v1.constituents",
      "GET fapi.v1.continuousKlines",
      "GET fapi.v1.depth",
      "GET fapi.v1.exchangeInfo",
      "GET fapi.v1.fundingInfo",
      "GET fapi.v1.fundingRate",
      "GET fapi.v1.indexInfo",
      "GET fapi.v1.indexPriceKlines",
      "GET fapi.v1.insuranceBalance",
      "GET fapi.v1.klines",
      "GET fapi.v1.markPriceKlines",
      "GET fapi.v1.openInterest",
      "GET fapi.v1.ping",
      "GET fapi.v1.premiumIndex",
      "GET fapi.v1.premiumIndexKlines",
      "GET fapi.v1.rpiDepth",
      "GET fapi.v1.symbolAdlRisk",
      "GET fapi.v1.ticker.bookTicker",
      "GET fapi.v1.ticker.twentyFourHr",
      "GET fapi.v1.time",
      "GET fapi.v1.trades",
      "GET fapi.v1.tradingSchedule",
      "GET fapi.v2.ticker.price",
      "GET futures.data.basis",
      "GET futures.data.deliveryPrice",
      "GET futures.data.globalLongShortAccountRatio",
      "GET futures.data.openInterestHist",
      "GET futures.data.takerlongshortRatio",
      "GET futures.data.topLongShortAccountRatio",
      "GET futures.data.topLongShortPositionRatio",
      "GET public.coinMFutures.dapi.v1.ping",
      "GET public.options.eapi.v1.ping",
      "GET public.spot.api.v3.ping",
      "GET public.spotData.api.v3.ping",
      "GET public.usdMFutures.fapi.v1.ping",
    ]
  ),
  ...rows(
    "dolthub",
    {
      kind: "free",
      reason:
        "DoltHub bills database storage plans, not API calls; the client-rendered pricing page names no per-call price",
      source: { url: "https://www.dolthub.com/pricing", asOf: "2026-11-04" },
    },
    [
      "POST api.v2.databases.branches.create",
      "GET api.v2.databases.branches.list",
      "POST api.v2.databases.create",
      "POST api.v2.databases.forks.create",
      "POST api.v2.databases.pulls.create",
      "GET api.v2.databases.pulls.get",
      "GET api.v2.databases.pulls.list",
      "POST api.v2.databases.pulls.merge",
      "GET api.v2.databases.sql.read",
      "POST api.v2.databases.sql.write",
      "GET api.v2.operations.get",
      "GET api.v2.user.get",
      "POST v1alpha1.branches.create",
      "GET v1alpha1.branches.list",
      "POST v1alpha1.database.create",
      "GET v1alpha1.pulls",
      "POST v1alpha1.pulls.create",
      "GET v1alpha1.pulls.list",
      "POST v1alpha1.pulls.merge",
      "GET v1alpha1.sql.read",
      "POST v1alpha1.sql.write",
      "GET v1alpha1.sql.writePoll",
      "GET v1alpha1.user",
    ]
  ),
  ...rows(
    "dropbox",
    {
      kind: "free",
      reason:
        "Dropbox plans are flat and bill storage; the API has rate limits and, on business plans, a data transport limit, with no per-call price",
      source: {
        url: "https://www.dropbox.com/developers/reference/data-ingress-guide",
        asOf: "2026-11-04",
      },
    },
    [
      "POST check.user",
      "POST files.copyV2",
      "POST files.createFolderV2",
      "POST files.deleteV2",
      "POST files.download",
      "POST files.getMetadata",
      "POST files.listFolder",
      "POST files.listFolderContinue",
      "POST files.moveV2",
      "POST files.upload",
      "POST files.uploadSession.appendV2",
      "POST files.uploadSession.finish",
      "POST files.uploadSession.start",
      "POST oauth2.token",
      "POST sharing.createSharedLinkWithSettings",
      "POST sharing.listSharedLinks",
      "POST users.getCurrentAccount",
    ]
  ),
  ...rows(
    "elevenlabs",
    {
      kind: "free",
      reason:
        "Voice, workspace, usage or account call; the price card bills none of these",
      source: { url: "https://elevenlabs.io/pricing/api", asOf: "2026-11-04" },
    },
    [
      "GET docs",
      "DELETE v1.audioIsolation.history.delete",
      "GET v1.audioIsolation.history.list",
      "DELETE v1.dubbing.delete",
      "GET v1.dubbing.list",
      "GET v1.dubbing.resource.get",
      "GET v1.models",
      "GET v1.pronunciationDictionaries",
      "POST v1.pronunciationDictionaries.addFromFile",
      "POST v1.pronunciationDictionaries.addFromRules",
      "POST v1.pronunciationDictionaries.addRules",
      "GET v1.pronunciationDictionaries.download",
      "GET v1.pronunciationDictionaries.list",
      "POST v1.pronunciationDictionaries.removeRules",
      "POST v1.pronunciationDictionaries.setRules",
      "PATCH v1.pronunciationDictionaries.update",
      "POST v1.serviceAccounts.apiKeys.create",
      "DELETE v1.serviceAccounts.apiKeys.delete",
      "GET v1.serviceAccounts.apiKeys.list",
      "PATCH v1.serviceAccounts.apiKeys.update",
      "GET v1.serviceAccounts.list",
      "GET v1.sharedVoices",
      "POST v1.similarVoices",
      "POST v1.singleUseToken",
      "DELETE v1.speechToText.transcripts.delete",
      "GET v1.textToVoice.stream",
      "GET v1.usage.characterStats",
      "GET v1.user",
      "GET v1.user.subscription",
      "GET v1.voices",
      "POST v1.voices.add.share",
      "DELETE v1.voices.delete",
      "POST v1.voices.edit",
      "GET v1.voices.list",
      "GET v1.voices.samples.audio",
      "DELETE v1.voices.samples.delete",
      "GET v1.voices.settings",
      "GET v1.voices.settings.default",
      "POST v1.voices.settings.edit",
      "POST v1.workspace.analytics.query.usageByProductOverTime",
      "POST v1.workspace.analytics.requests",
      "GET v1.workspace.auditLogs",
      "POST v1.workspace.authConnections.create",
      "DELETE v1.workspace.authConnections.delete",
      "GET v1.workspace.authConnections.list",
      "PATCH v1.workspace.authConnections.update",
      "GET v1.workspace.groups.list",
      "POST v1.workspace.groups.members.add",
      "POST v1.workspace.groups.members.remove",
      "GET v1.workspace.groups.search",
      "POST v1.workspace.invites.add",
      "POST v1.workspace.invites.addBulk",
      "DELETE v1.workspace.invites.delete",
      "POST v1.workspace.members.update",
      "GET v1.workspace.resources.get",
      "POST v1.workspace.resources.share",
      "POST v1.workspace.resources.unshare",
      "POST v1.workspace.webhooks.create",
      "DELETE v1.workspace.webhooks.delete",
      "GET v1.workspace.webhooks.list",
      "PATCH v1.workspace.webhooks.update",
      "POST v1.workspaces.apiKeys.disable",
      "POST v1.workspaces.apiKeys.thirdPartyDisabling",
      "GET v2.voices",
    ]
  ),
  ...rows(
    "elevenlabs",
    {
      kind: "metered",
      unit: "seconds",
      reason: "0.12 USD per minute",
      source: { url: "https://elevenlabs.io/pricing/api", asOf: "2026-11-04" },
    },
    [
      "POST v1.audioIsolation",
      "POST v1.audioIsolation.stream",
      "POST v1.speechToSpeech",
      "POST v1.speechToSpeech.stream",
    ]
  ),
  ...rows(
    "elevenlabs",
    {
      kind: "metered",
      unit: "characters",
      reason:
        "Conditional: bills only when payload.auto_convert is true, as a conversion would; otherwise no charge.",
      source: {
        url: "https://elevenlabs.io/docs/api-reference/studio-api-information.md",
        asOf: "2026-11-04",
      },
    },
    [
      "POST v1.audioNative",
      "POST v1.audioNative.content.update",
      "POST v1.studio.projects.content.update",
      "POST v1.studio.projects.create",
    ]
  ),
  ...rows(
    "elevenlabs",
    {
      kind: "free",
      reason:
        "Audio Native settings or content source; conversion is what bills",
      source: {
        url: "https://elevenlabs.io/docs/eleven-creative/audio-tools/audio-native.md",
        asOf: "2026-11-04",
      },
    },
    ["POST v1.audioNative.content.fromUrl", "GET v1.audioNative.settings"]
  ),
  ...rows(
    "elevenlabs",
    {
      kind: "free",
      reason:
        "Agent, knowledge-base, telephony or workspace management; agents bill by call minute and LLM, not per management call",
      source: {
        url: "https://elevenlabs.io/pricing/agents",
        asOf: "2026-11-04",
      },
    },
    [
      "GET v1.convai.agent.knowledgeBase.size",
      "POST v1.convai.agentTesting.bulkMove",
      "POST v1.convai.agentTesting.create",
      "DELETE v1.convai.agentTesting.delete",
      "POST v1.convai.agentTesting.folders.create",
      "DELETE v1.convai.agentTesting.folders.delete",
      "GET v1.convai.agentTesting.folders.get",
      "PATCH v1.convai.agentTesting.folders.update",
      "GET v1.convai.agentTesting.get",
      "GET v1.convai.agentTesting.list",
      "POST v1.convai.agentTesting.summaries",
      "PUT v1.convai.agentTesting.update",
      "POST v1.convai.agents.avatar",
      "GET v1.convai.agents.branches",
      "POST v1.convai.agents.branches.create",
      "GET v1.convai.agents.branches.get",
      "POST v1.convai.agents.branches.merge",
      "GET v1.convai.agents.branches.mergePreview",
      "POST v1.convai.agents.branches.rebase",
      "GET v1.convai.agents.branches.rebasePreview",
      "PATCH v1.convai.agents.branches.update",
      "POST v1.convai.agents.create",
      "DELETE v1.convai.agents.delete",
      "POST v1.convai.agents.deployments",
      "POST v1.convai.agents.drafts.create",
      "DELETE v1.convai.agents.drafts.delete",
      "POST v1.convai.agents.duplicate",
      "GET v1.convai.agents.get",
      "GET v1.convai.agents.link",
      "GET v1.convai.agents.list",
      "GET v1.convai.agents.summaries",
      "GET v1.convai.agents.topics",
      "PATCH v1.convai.agents.update",
      "GET v1.convai.agents.versions.get",
      "GET v1.convai.agents.widget",
      "GET v1.convai.analytics.liveCount",
      "POST v1.convai.batchCalling.cancel",
      "DELETE v1.convai.batchCalling.delete",
      "GET v1.convai.batchCalling.get",
      "GET v1.convai.batchCalling.workspace",
      "GET v1.convai.conversations.audio",
      "DELETE v1.convai.conversations.delete",
      "POST v1.convai.conversations.feedback",
      "POST v1.convai.conversations.files",
      "DELETE v1.convai.conversations.files.delete",
      "GET v1.convai.conversations.get",
      "GET v1.convai.conversations.list",
      "GET v1.convai.conversations.messages.smartSearch",
      "GET v1.convai.conversations.messages.textSearch",
      "GET v1.convai.conversations.sipMessages",
      "POST v1.convai.conversations.tags",
      "DELETE v1.convai.conversations.tags.unassign",
      "POST v1.convai.environmentVariables.create",
      "GET v1.convai.environmentVariables.get",
      "GET v1.convai.environmentVariables.list",
      "PATCH v1.convai.environmentVariables.update",
      "POST v1.convai.knowledgeBase.bulkMove",
      "GET v1.convai.knowledgeBase.chunks",
      "GET v1.convai.knowledgeBase.chunks.get",
      "GET v1.convai.knowledgeBase.content",
      "DELETE v1.convai.knowledgeBase.delete",
      "GET v1.convai.knowledgeBase.dependentAgents",
      "POST v1.convai.knowledgeBase.file",
      "POST v1.convai.knowledgeBase.folder",
      "GET v1.convai.knowledgeBase.get",
      "GET v1.convai.knowledgeBase.list",
      "POST v1.convai.knowledgeBase.move",
      "GET v1.convai.knowledgeBase.ragIndex",
      "DELETE v1.convai.knowledgeBase.ragIndex.delete",
      "GET v1.convai.knowledgeBase.ragIndex.get",
      "POST v1.convai.knowledgeBase.refresh",
      "GET v1.convai.knowledgeBase.search",
      "GET v1.convai.knowledgeBase.sourceFileUrl",
      "GET v1.convai.knowledgeBase.summaries",
      "POST v1.convai.knowledgeBase.text",
      "PATCH v1.convai.knowledgeBase.update",
      "PATCH v1.convai.knowledgeBase.updateFile",
      "POST v1.convai.knowledgeBase.url",
      "GET v1.convai.llm.list",
      "POST v1.convai.mcpServers.create",
      "DELETE v1.convai.mcpServers.delete",
      "GET v1.convai.mcpServers.get",
      "GET v1.convai.mcpServers.list",
      "POST v1.convai.mcpServers.toolApprovals.create",
      "DELETE v1.convai.mcpServers.toolApprovals.delete",
      "POST v1.convai.mcpServers.toolConfigs.create",
      "DELETE v1.convai.mcpServers.toolConfigs.delete",
      "GET v1.convai.mcpServers.toolConfigs.get",
      "PATCH v1.convai.mcpServers.toolConfigs.update",
      "GET v1.convai.mcpServers.tools",
      "PATCH v1.convai.mcpServers.update",
      "POST v1.convai.phoneNumbers.create",
      "DELETE v1.convai.phoneNumbers.delete",
      "GET v1.convai.phoneNumbers.get",
      "GET v1.convai.phoneNumbers.list",
      "GET v1.convai.phoneNumbers.sipMessages",
      "PATCH v1.convai.phoneNumbers.update",
      "POST v1.convai.secrets.create",
      "DELETE v1.convai.secrets.delete",
      "GET v1.convai.secrets.dependencies",
      "GET v1.convai.secrets.get",
      "GET v1.convai.secrets.list",
      "PATCH v1.convai.secrets.update",
      "GET v1.convai.settings",
      "GET v1.convai.settings.dashboard",
      "PATCH v1.convai.settings.dashboard.update",
      "PATCH v1.convai.settings.update",
      "POST v1.convai.tags.create",
      "DELETE v1.convai.tags.delete",
      "GET v1.convai.tags.get",
      "GET v1.convai.tags.list",
      "PATCH v1.convai.tags.update",
      "GET v1.convai.testInvocations.get",
      "GET v1.convai.testInvocations.list",
      "POST v1.convai.tools.create",
      "DELETE v1.convai.tools.delete",
      "GET v1.convai.tools.dependentAgents",
      "GET v1.convai.tools.executions",
      "GET v1.convai.tools.get",
      "GET v1.convai.tools.list",
      "PATCH v1.convai.tools.update",
      "GET v1.convai.users.list",
      "DELETE v1.convai.whatsappAccounts.delete",
      "GET v1.convai.whatsappAccounts.get",
      "GET v1.convai.whatsappAccounts.list",
      "PATCH v1.convai.whatsappAccounts.update",
    ]
  ),
  ...rows(
    "elevenlabs",
    {
      kind: "free",
      reason: "LLM cost calculator; no charge",
      source: {
        url: "https://elevenlabs.io/pricing/agents",
        asOf: "2026-11-04",
      },
    },
    [
      "POST v1.convai.agent.llmUsage.calculate",
      "POST v1.convai.llmUsage.calculate",
    ]
  ),
  ...rows(
    "elevenlabs",
    {
      kind: "accrual",
      unit: "tokens",
      reason:
        "Runs the agent's LLM, billed at cost by model. The docs state no free allowance and no per-call figure, so this must not read as zero.",
      source: {
        url: "https://elevenlabs.io/pricing/agents",
        asOf: "2026-11-04",
      },
    },
    [
      "POST v1.convai.agents.runTests",
      "POST v1.convai.agents.simulateConversation",
      "POST v1.convai.agents.simulateConversation.stream",
      "POST v1.convai.conversations.analysis",
      "POST v1.convai.conversations.analysis.evaluations",
      "POST v1.convai.testInvocations.resubmit",
    ]
  ),
  ...rows(
    "elevenlabs",
    {
      kind: "accrual",
      unit: "minutes",
      reason:
        "Starts agent calls: 0.08 USD per call minute plus LLM at cost, as the call runs; no per-call amount. metadata.charging reports it after.",
      source: {
        url: "https://elevenlabs.io/pricing/agents",
        asOf: "2026-11-04",
      },
    },
    [
      "POST v1.convai.batchCalling.retry",
      "POST v1.convai.batchCalling.submit",
      "POST v1.convai.exotel.outboundCall",
      "POST v1.convai.sipTrunk.outboundCall",
      "POST v1.convai.twilio.outboundCall",
      "POST v1.convai.twilio.registerCall",
      "POST v1.convai.whatsapp.outboundCall",
    ]
  ),
  ...rows(
    "elevenlabs",
    {
      kind: "free",
      reason:
        "Mints a signed URL or token; the conversation bills on the socket",
      source: {
        url: "https://elevenlabs.io/pricing/agents",
        asOf: "2026-11-04",
      },
    },
    [
      "GET v1.convai.conversation.getSignedUrl",
      "GET v1.convai.conversation.token",
    ]
  ),
  ...rows(
    "elevenlabs",
    {
      kind: "free",
      reason:
        "RAG is under Included Features on the agents pricing page; index size is capped by plan",
      source: {
        url: "https://elevenlabs.io/pricing/agents",
        asOf: "2026-11-04",
      },
    },
    [
      "POST v1.convai.knowledgeBase.ragIndex.batch",
      "POST v1.convai.knowledgeBase.ragIndex.compute",
    ]
  ),
  ...rows(
    "elevenlabs",
    {
      kind: "accrual",
      unit: "tokens",
      reason:
        "Opens a WhatsApp agent conversation whose LLM usage accrues; Meta bills template messages directly",
      source: {
        url: "https://elevenlabs.io/docs/eleven-agents/whatsapp/outbound.md",
        asOf: "2026-11-04",
      },
    },
    ["POST v1.convai.whatsapp.outboundMessage"]
  ),
  ...rows(
    "elevenlabs",
    {
      kind: "followup",
      reason: "Status or result of a billed job",
      source: { url: "https://elevenlabs.io/pricing/api", asOf: "2026-11-04" },
    },
    [
      "GET v1.dubbing.audio.get",
      "GET v1.dubbing.get",
      "GET v1.dubbing.transcripts.get",
      "GET v1.speechToText.transcripts.get",
    ]
  ),
  ...rows(
    "elevenlabs",
    {
      kind: "metered",
      unit: "seconds",
      reason:
        "Per source minute: v1 0.33 USD with watermark, 0.50 without; v2 2.20",
      source: { url: "https://elevenlabs.io/pricing/api", asOf: "2026-11-04" },
    },
    ["POST v1.dubbing.create"]
  ),
  ...rows(
    "elevenlabs",
    {
      kind: "metered",
      unit: "seconds",
      reason: "Docs: same rate as speech to text, read from the audio length",
      source: {
        url: "https://elevenlabs.io/docs/overview/capabilities/forced-alignment.md",
        asOf: "2026-11-04",
      },
    },
    ["POST v1.forcedAlignment"]
  ),
  ...rows(
    "elevenlabs",
    {
      kind: "metered",
      unit: "seconds",
      reason: "0.15 USD per minute",
      source: { url: "https://elevenlabs.io/pricing/api", asOf: "2026-11-04" },
    },
    [
      "POST v1.music",
      "POST v1.music.detailed",
      "POST v1.music.stream",
      "POST v1.music.videoToMusic",
    ]
  ),
  ...rows(
    "elevenlabs",
    {
      kind: "free",
      reason:
        "Docs: this endpoint does not cost any credits; rate limited by tier",
      source: {
        url: "https://elevenlabs.io/docs/api-reference/music/create-composition-plan.md",
        asOf: "2026-11-04",
      },
    },
    ["POST v1.music.plan"]
  ),
  ...rows(
    "elevenlabs",
    {
      kind: "metered",
      unit: "seconds",
      reason:
        "Runs a paid model but no price is published, so P2 fails it closed",
      source: {
        url: "https://elevenlabs.io/docs/api-reference/music/separate-stems.md",
        asOf: "2026-11-04",
      },
    },
    ["POST v1.music.stemSeparation"]
  ),
  ...rows(
    "elevenlabs",
    {
      kind: "metered",
      unit: "seconds",
      reason:
        "Docs: priced as song generation; half the cost is still charged if copyright is detected",
      source: {
        url: "https://elevenlabs.io/docs/api-reference/music/upload.md",
        asOf: "2026-11-04",
      },
    },
    ["POST v1.music.upload"]
  ),
  ...rows(
    "elevenlabs",
    {
      kind: "free",
      reason: "Order setup or read; only submit charges",
      source: {
        url: "https://elevenlabs.io/docs/eleven-creative/services/productions/overview.md",
        asOf: "2026-11-04",
      },
    },
    [
      "POST v1.productions.orders.create",
      "GET v1.productions.orders.deliverables",
      "GET v1.productions.orders.get",
      "DELETE v1.productions.orders.items.remove",
      "POST v1.productions.orders.items.upsert",
      "GET v1.productions.orders.languages",
      "GET v1.productions.orders.list",
      "GET v1.productions.orders.media.get",
      "POST v1.productions.orders.media.register",
      "PATCH v1.productions.orders.update",
    ]
  ),
  ...rows(
    "elevenlabs",
    {
      kind: "metered",
      unit: "minutes",
      reason:
        "Human-edited order: USD per source minute by asset, language and options, quoted per order with no list rate",
      source: {
        url: "https://elevenlabs.io/docs/eleven-creative/services/productions/overview.md",
        asOf: "2026-11-04",
      },
    },
    ["POST v1.productions.orders.submit"]
  ),
  ...rows(
    "elevenlabs",
    {
      kind: "metered",
      unit: "seconds",
      reason:
        "0.12 USD per minute; duration comes from the payload or the output",
      source: { url: "https://elevenlabs.io/pricing/api", asOf: "2026-11-04" },
    },
    ["POST v1.soundGeneration"]
  ),
  ...rows(
    "elevenlabs",
    {
      kind: "free",
      reason:
        "Speech Engine management; sessions bill per minute on the socket",
      source: { url: "https://elevenlabs.io/pricing/api", asOf: "2026-11-04" },
    },
    [
      "POST v1.speechEngine.create",
      "DELETE v1.speechEngine.delete",
      "GET v1.speechEngine.get",
      "GET v1.speechEngine.list",
      "PATCH v1.speechEngine.update",
    ]
  ),
  ...rows(
    "elevenlabs",
    {
      kind: "metered",
      unit: "seconds",
      reason:
        "Scribe v2 rows exist; character-cost and fiat-cost-before-overages come back in headers",
      source: { url: "https://elevenlabs.io/pricing/api", asOf: "2026-11-04" },
    },
    ["POST v1.speechToText"]
  ),
  ...rows(
    "elevenlabs",
    {
      kind: "metered",
      unit: "characters",
      reason:
        "Docs: audio generation is charged, LLM cost is covered for now; auto-converts on create",
      source: {
        url: "https://elevenlabs.io/docs/api-reference/studio/create-podcast.md",
        asOf: "2026-11-04",
      },
    },
    ["POST v1.studio.podcasts.create"]
  ),
  ...rows(
    "elevenlabs",
    {
      kind: "metered",
      unit: "characters",
      reason:
        "Converting bills the generated audio at the project's TTS model; up to two regenerations of unchanged text are free",
      source: {
        url: "https://elevenlabs.io/docs/api-reference/studio-api-information.md",
        asOf: "2026-11-04",
      },
    },
    [
      "POST v1.studio.projects.chapters.convert",
      "POST v1.studio.projects.convert",
    ]
  ),
  ...rows(
    "elevenlabs",
    {
      kind: "free",
      reason: "Studio project management or read; conversion is what bills",
      source: {
        url: "https://elevenlabs.io/docs/api-reference/studio-api-information.md",
        asOf: "2026-11-04",
      },
    },
    [
      "POST v1.studio.projects.chapters.create",
      "DELETE v1.studio.projects.chapters.delete",
      "GET v1.studio.projects.chapters.get",
      "GET v1.studio.projects.chapters.list",
      "GET v1.studio.projects.chapters.snapshots.get",
      "GET v1.studio.projects.chapters.snapshots.list",
      "POST v1.studio.projects.chapters.snapshots.stream",
      "POST v1.studio.projects.chapters.update",
      "DELETE v1.studio.projects.delete",
      "GET v1.studio.projects.get",
      "GET v1.studio.projects.list",
      "GET v1.studio.projects.mutedTracks.get",
      "POST v1.studio.projects.pronunciationDictionaries.create",
      "POST v1.studio.projects.snapshots.archive",
      "GET v1.studio.projects.snapshots.get",
      "GET v1.studio.projects.snapshots.list",
      "POST v1.studio.projects.snapshots.stream",
      "POST v1.studio.projects.update",
    ]
  ),
  ...rows(
    "elevenlabs",
    {
      kind: "metered",
      unit: "characters",
      reason: "Eleven v3 rate per 1K characters",
      source: { url: "https://elevenlabs.io/pricing/api", asOf: "2026-11-04" },
    },
    ["POST v1.textToDialogue"]
  ),
  ...rows(
    "elevenlabs",
    {
      kind: "metered",
      unit: "characters",
      reason: "API list price by TTS model; plan credits may cost less",
      source: { url: "https://elevenlabs.io/pricing/api", asOf: "2026-11-04" },
    },
    [
      "POST v1.textToSpeech",
      "POST v1.textToSpeech.stream",
      "POST v1.textToSpeech.stream.withTimestamps",
      "POST v1.textToSpeech.withTimestamps",
    ]
  ),
  ...rows(
    "elevenlabs",
    {
      kind: "free",
      reason:
        "Saves a designed preview as a voice; the design call already billed",
      source: { url: "https://elevenlabs.io/pricing/api", asOf: "2026-11-04" },
    },
    ["POST v1.textToVoice"]
  ),
  ...rows(
    "elevenlabs",
    {
      kind: "metered",
      unit: "characters",
      reason: "Bills the preview text's characters",
      source: { url: "https://elevenlabs.io/pricing/api", asOf: "2026-11-04" },
    },
    ["POST v1.textToVoice.design"]
  ),
  ...rows(
    "elevenlabs",
    {
      kind: "metered",
      unit: "characters",
      reason: "Docs: priced by the length of the test script",
      source: {
        url: "https://elevenlabs.io/docs/overview/capabilities/voice-remixing.md",
        asOf: "2026-11-04",
      },
    },
    ["POST v1.textToVoice.remix"]
  ),
  ...rows(
    "elevenlabs",
    {
      kind: "free",
      reason:
        "Voice creation is gated by plan (Creator and up for PVC), with no per-call charge; committed recordings show no cost header",
      source: {
        url: "https://elevenlabs.io/docs/eleven-api/guides/how-to/voices/professional-voice-cloning.md",
        asOf: "2026-11-04",
      },
    },
    [
      "POST v1.voices.add",
      "POST v1.voices.pvc",
      "POST v1.voices.pvc.captcha",
      "GET v1.voices.pvc.captcha.get",
      "POST v1.voices.pvc.samples",
      "DELETE v1.voices.pvc.samples.delete",
      "POST v1.voices.pvc.samples.separateSpeakers",
      "GET v1.voices.pvc.samples.speakers.audio",
      "GET v1.voices.pvc.samples.waveform",
      "POST v1.voices.pvc.train",
      "POST v1.voices.pvc.verification",
    ]
  ),
  ...rows(
    "endless",
    {
      kind: "free",
      reason:
        "Public trend reads; the client sends no key and recordings show no charge field. The product's credit plans bill other features.",
      source: {
        url: "https://endless.app/docs/api/social/public-tiktok-trends",
        asOf: "2026-11-04",
      },
    },
    ["GET social.tiktokTrends.public", "GET social.trends.public"]
  ),
  ...rows(
    "fal",
    {
      kind: "metered",
      unit: "units",
      source: {
        url: "https://api.fal.ai/v1/models/pricing",
        asOf: "2026-11-04",
      },
    },
    [
      "POST alibaba.happyHorse.imageToVideo",
      "POST alibaba.happyHorse.videoEdit",
      "POST blackforestlabs.flux3.klein.base.trainer",
      "POST creatify.boreal",
      "POST gptImage1p5",
      "POST gptImage1p5.edit",
      "POST ideogram.v4p5",
      "POST ideogram.v4p5.edit",
      "POST ideogram.vector.imageToVector",
      "POST ideogram.vector.textToVector",
      "POST lightricks.ltx2p5.audioToVideo.fast",
      "POST lightricks.ltx2p5.audioToVideo.pro",
      "POST lightricks.ltx2p5.textToVideo.fast",
      "POST lightricks.ltx2p5.textToVideo.pro",
      "POST minimax.h3Max.recast",
      "POST minimax.h3Max.relight",
      "POST mureka.api.generate.song",
      "POST vidu.q4.imageToVideo",
      "POST vidu.q4.referenceToVideo",
      "POST xai.grokImagineVideo.v1p5.lite.imageToVideo",
      "POST xai.grokImagineVideo.v1p5.lite.textToVideo",
    ]
  ),
  ...rows(
    "fal",
    {
      kind: "metered",
      unit: "seconds",
      source: {
        url: "https://api.fal.ai/v1/models/pricing",
        asOf: "2026-11-04",
      },
    },
    [
      "POST alibaba.happyHorse.referenceToVideo",
      "POST alibaba.happyHorse.textToVideo",
      "POST alibaba.happyHorse.v1p1.imageToVideo",
      "POST alibaba.happyHorse.v1p1.referenceToVideo",
      "POST alibaba.happyHorse.v1p1.textToVideo",
      "POST alibaba.wan3p0.imageToVideo",
      "POST alibaba.wan3p0.referenceToVideo",
      "POST alibaba.wan3p0.textToVideo",
      "POST alibaba.wan3p0Prime.imageToVideo",
      "POST alibaba.wan3p0Prime.referenceToVideo",
      "POST alibaba.wan3p0Prime.textToVideo",
      "POST blackforestlabs.flux3.draftEnhance",
      "POST blackforestlabs.flux3.editVideo",
      "POST blackforestlabs.flux3.extendVideo",
      "POST blackforestlabs.flux3.extendVideo.draft",
      "POST blackforestlabs.flux3.firstLastFrameToVideo",
      "POST blackforestlabs.flux3.firstLastFrameToVideo.draft",
      "POST blackforestlabs.flux3.imageToVideo",
      "POST blackforestlabs.flux3.imageToVideo.draft",
      "POST blackforestlabs.flux3.keyframesToVideo",
      "POST blackforestlabs.flux3.keyframesToVideo.draft",
      "POST blackforestlabs.flux3.textToVideo",
      "POST blackforestlabs.flux3.textToVideo.draft",
      "POST blackforestlabs.flux3Max.imageToVideo",
      "POST blackforestlabs.flux3Max.keyframesToVideo",
      "POST blackforestlabs.flux3Max.textToVideo",
      "POST heygen.heygenVideo.imageToVideo",
      "POST heygen.heygenVideo.referenceToVideo",
      "POST heygen.heygenVideo.textToVideo",
      "POST kling.v4.imageToVideo",
      "POST kling.v4.referenceToVideo",
      "POST kling.v4.textToVideo",
      "POST klingVideo.o3.pro.imageToVideo",
      "POST klingVideo.o3.pro.referenceToVideo",
      "POST klingVideo.o3.pro.textToVideo",
      "POST klingVideo.o3.pro.videoToVideo.edit",
      "POST klingVideo.o3.pro.videoToVideo.reference",
      "POST klingVideo.o3.standard.imageToVideo",
      "POST klingVideo.o3p4k.imageToVideo",
      "POST klingVideo.o3p4k.referenceToVideo",
      "POST klingVideo.o3p4k.textToVideo",
      "POST klingVideo.v3.pro.imageToVideo",
      "POST klingVideo.v3.pro.textToVideo",
      "POST klingVideo.v3.standard.imageToVideo",
      "POST klingVideo.v3.standard.textToVideo",
      "POST klingVideo.v3.turbo.pro.imageToVideo",
      "POST klingVideo.v3.turbo.pro.textToVideo",
      "POST klingVideo.v3.turbo.standard.imageToVideo",
      "POST klingVideo.v3.turbo.standard.textToVideo",
      "POST luma.agent.ray.v3p2.imageToVideo",
      "POST luma.agent.ray.v3p2.videoToVideo",
      "POST minimax.h3.imageToVideo",
      "POST minimax.h3.imageToVideo.lora",
      "POST minimax.h3.referenceToVideo",
      "POST minimax.h3.referenceToVideo.lora",
      "POST minimax.h3.textToVideo",
      "POST minimax.h3.textToVideo.lora",
      "POST minimax.h3Max.cameraControls",
      "POST minimax.h3Max.imageToVideo",
      "POST minimax.h3Max.styles.handDrawn",
      "POST minimax.h3Max.styles.lowPoly",
      "POST minimax.h3Max.styles.retroToon70s",
      "POST minimax.h3Max.styles.sixteenBitPixel",
      "POST minimax.h3Max.styles.vhs",
      "POST minimax.h3Max.textToVideo",
      "POST minimax.h3MaxTurbo.extendVideo",
      "POST minimax.h3MaxTurbo.imageToVideo",
      "POST minimax.h3MaxTurbo.textToVideo",
      "POST nvidia.cosmos3Super.imageToVideo",
      "POST pixelcut.loopingVideo",
      "POST pixverse.musicVideo.vibemv",
      "POST veo3p1.imageToVideo",
      "POST veo3p1.textToVideo",
      "POST wan.v2p7.editVideo",
      "POST wan.v2p7.imageToVideo",
      "POST wan.v2p7.referenceToVideo",
      "POST wan.v2p7.textToVideo",
      "POST xai.grokImagineVideo.editVideo",
      "POST xai.grokImagineVideo.extendVideo",
      "POST xai.grokImagineVideo.imageToVideo",
      "POST xai.grokImagineVideo.referenceToVideo",
      "POST xai.grokImagineVideo.v1p5.imageToVideo",
      "POST xai.grokImagineVideo.v1p5.referenceToVideo",
      "POST xai.grokImagineVideo.v1p5.textToVideo",
    ]
  ),
  ...rows(
    "fal",
    {
      kind: "metered",
      unit: "1000 characters",
      source: {
        url: "https://api.fal.ai/v1/models/pricing",
        asOf: "2026-11-04",
      },
    },
    [
      "POST alibaba.qwenAudio3Tts",
      "POST bytedance.seedSpeech.tts.v2",
      "POST elevenlabs.tts.elevenV4",
      "POST elevenlabs.tts.elevenV4Turbo",
      "POST google.gemini3p8FlashLiteTts",
      "POST google.gemini3p8FlashTts",
      "POST heygen.heygenVoice",
      "POST heygen.heygenVoice.turbo",
    ]
  ),
  ...rows(
    "fal",
    {
      kind: "metered",
      unit: "units",
      reason:
        "fal dynamic list: priced after the call from x-fal-billable-units",
      source: {
        url: "https://api.fal.ai/v1/models/pricing",
        asOf: "2026-11-04",
      },
    },
    [
      "POST alibaba.qwenImage3.edit",
      "POST alibaba.qwenImage3.textToImage",
      "POST blackforestlabs.flux3.klein.base.trainer.edit",
      "POST bytedance.seedream.v5.pro.edit",
      "POST bytedance.seedream.v5.pro.textToImage",
      "POST geminiOmniFlash",
      "POST geminiOmniFlash.edit",
      "POST geminiOmniFlash.imageToVideo",
      "POST geminiOmniFlash.referenceToVideo",
      "POST kandinsky6Lite.imageToVideo",
      "POST kandinsky6Lite.textToVideo",
      "POST kandinsky6Pro.imageToVideo",
      "POST kandinsky6Pro.textToVideo",
      "POST kandinsky6Vsr",
      "POST kandinsky6Vsr.lite",
      "POST lightricks.ltx2p5.imageToVideo.fast",
      "POST lightricks.ltx2p5.imageToVideo.pro",
      "POST minimax.h3Max.reframeVideo",
      "POST minimax.h3Max.threeDToVideo",
      "POST mureka.api.generate.instrumental",
      "POST nanoBanana2Lite.edit",
      "POST nanoBanana2Lite.textToImage",
      "POST nanoBanana2p1.edit",
      "POST nanoBanana2p1.textToImage",
      "POST openai.gptImage2",
      "POST openai.gptImage2.edit",
      "POST openai.gptImage2p5.flare.edit",
      "POST openai.gptImage2p5.flare.textToImage",
      "POST openai.gptImage2p5.sunburst.edit",
      "POST openai.gptImage2p5.sunburst.textToImage",
      "POST openrouter.router.decisions",
      "POST topaz.upscale.image.precision",
      "POST topaz.upscale.video.precision",
      "POST xai.grokImagineImage.v2p0.edit",
      "POST xai.grokImagineImage.v2p0.textToImage",
    ]
  ),
  ...rows(
    "fal",
    {
      kind: "metered",
      unit: "megapixels",
      reason:
        "fal dynamic list: priced after the call from x-fal-billable-units",
      source: {
        url: "https://api.fal.ai/v1/models/pricing",
        asOf: "2026-11-04",
      },
    },
    [
      "POST blackforestlabs.flux3.editImage",
      "POST blackforestlabs.flux3.klein.base.editImage.lora",
      "POST blackforestlabs.flux3.klein.base.textToImage.lora",
      "POST blackforestlabs.flux3.klein.editImage",
      "POST blackforestlabs.flux3.klein.editImage.lora",
      "POST blackforestlabs.flux3.klein.textToImage",
      "POST blackforestlabs.flux3.klein.textToImage.lora",
      "POST blackforestlabs.flux3.textToImage",
    ]
  ),
  ...rows(
    "fal",
    {
      kind: "metered",
      unit: "seconds",
      reason:
        "fal dynamic list: priced after the call from x-fal-billable-units",
      source: {
        url: "https://api.fal.ai/v1/models/pricing",
        asOf: "2026-11-04",
      },
    },
    [
      "POST blackforestlabs.fluxVideoUpscale",
      "POST geminiOmniFlash.v1p1.edit",
      "POST geminiOmniFlash.v1p1.imageToVideo",
      "POST geminiOmniFlash.v1p1.referenceToVideo",
      "POST geminiOmniFlash.v1p1.textToVideo",
      "POST heygen.avatar3.digitalTwin",
      "POST heygen.avatar4.digitalTwin",
      "POST heygen.avatar4.imageToVideo",
      "POST heygen.avatar5.digitalTwin",
      "POST heygen.v2.translate.precision",
      "POST heygen.v2.translate.speed",
      "POST heygen.v2.videoAgent",
      "POST heygen.v3.fillerWordRemoval",
      "POST heygen.v3.lipsync.precision",
      "POST heygen.v3.lipsync.speed",
      "POST heygen.v3.videoAgent",
      "POST kling.v4.videoToVideo.edit",
      "POST luma.agent.ray.v3p2.reframe",
      "POST luma.agent.ray.v3p2.textToVideo",
      "POST minimax.h3Max.extendVideo",
      "POST minimax.h3Max.insertVideo",
      "POST minimax.h3Max.lipSync.imageToVideo",
      "POST minimax.h3Max.referenceToVideo",
      "POST minimax.h3MaxTurbo.referenceToVideo",
      "POST minimax.music3",
      "POST mireloAi.sfx2p0.textToAudio",
      "POST mireloAi.sfx2p0.videoToAudio",
      "POST mireloAi.sfx2p0.videoToVideo",
      "POST xai.grokVoice",
    ]
  ),
  ...rows(
    "fal",
    {
      kind: "metered",
      unit: "images",
      source: {
        url: "https://api.fal.ai/v1/models/pricing",
        asOf: "2026-11-04",
      },
    },
    [
      "POST bria.fibo2.edit",
      "POST bria.fibo2.generate",
      "POST bria.fiboEdit1p5.edit",
      "POST bria.fiboEdit1p5.expand",
      "POST bria.fiboEdit1p5.productHolding",
      "POST bria.fiboEdit1p5.virtualTryOn",
      "POST bria.fiboGen1p5.textToImage",
      "POST bria.guidedRemoveBackground",
      "POST bytedance.seedream.v5.flash.edit",
      "POST bytedance.seedream.v5.flash.layerize",
      "POST bytedance.seedream.v5.flash.textToImage",
      "POST bytedance.seedream.v5.lite.edit",
      "POST bytedance.seedream.v5.lite.textToImage",
      "POST marigoldV2",
      "POST meta.museImage.edit",
      "POST meta.museImage.textToImage",
      "POST nanoBanana.edit",
      "POST nanoBanana.textToImage",
      "POST nanoBanana2.edit",
      "POST nanoBanana2.textToImage",
      "POST nanoBananaPro.edit",
      "POST nanoBananaPro.textToImage",
      "POST nvidia.cosmos3Super.textToImage",
      "POST recraft.v4p1.flash.textToImage",
      "POST virtualTryOn",
      "POST wan.v2p7.edit",
      "POST wan.v2p7.pro.edit",
      "POST wan.v2p7.pro.textToImage",
      "POST wan.v2p7.textToImage",
      "POST xai.grokImagineImage",
      "POST xai.grokImagineImage.edit",
    ]
  ),
  ...rows(
    "fal",
    {
      kind: "metered",
      unit: "1000 tokens",
      source: {
        url: "https://api.fal.ai/v1/models/pricing",
        asOf: "2026-11-04",
      },
    },
    [
      "POST bytedance.seedance2p0.fast.imageToVideo",
      "POST bytedance.seedance2p0.fast.textToVideo",
      "POST bytedance.seedance2p0.imageToVideo",
      "POST bytedance.seedance2p0.textToVideo",
      "POST bytedance.seedance2p0.us.imageToVideo",
      "POST bytedance.seedance2p0.us.referenceToVideo",
      "POST bytedance.seedance2p0.us.textToVideo",
      "POST bytedance.seedance2p5.draft.complete",
      "POST bytedance.seedance2p5.referenceToVideo",
      "POST bytedance.seedance2p5.textToVideo",
      "POST bytedance.seedance2p5.us.draft.complete",
      "POST bytedance.seedance2p5.us.referenceToVideo",
      "POST bytedance.seedance2p5.us.textToVideo",
    ]
  ),
  ...rows(
    "fal",
    {
      kind: "metered",
      unit: "1000 tokens",
      reason:
        "fal dynamic list: priced after the call from x-fal-billable-units",
      source: {
        url: "https://api.fal.ai/v1/models/pricing",
        asOf: "2026-11-04",
      },
    },
    [
      "POST bytedance.seedance2p0.fast.referenceToVideo",
      "POST bytedance.seedance2p0.referenceToVideo",
      "POST bytedance.seedance2p5.imageToVideo",
      "POST bytedance.seedance2p5.us.imageToVideo",
    ]
  ),
  ...rows(
    "fal",
    {
      kind: "metered",
      unit: "images",
      reason:
        "fal dynamic list: priced after the call from x-fal-billable-units",
      source: {
        url: "https://api.fal.ai/v1/models/pricing",
        asOf: "2026-11-04",
      },
    },
    ["POST bytedance.seedream.v5.pro.layerize"]
  ),
  ...rows(
    "fal",
    {
      kind: "metered",
      unit: "minutes",
      source: {
        url: "https://api.fal.ai/v1/models/pricing",
        asOf: "2026-11-04",
      },
    },
    [
      "POST elevenlabs.music.v2p5",
      "POST falAi.elevenlabs.speechToText.scribeV2",
      "POST veed.cleanAudio",
    ]
  ),
  ...rows(
    "fal",
    {
      kind: "metered",
      unit: "processed megapixels",
      reason:
        "fal dynamic list: priced after the call from x-fal-billable-units",
      source: {
        url: "https://api.fal.ai/v1/models/pricing",
        asOf: "2026-11-04",
      },
    },
    ["POST flux2Flex"]
  ),
  ...rows(
    "fal",
    {
      kind: "metered",
      unit: "compute seconds",
      reason:
        "fal dynamic list: priced after the call from x-fal-billable-units",
      source: {
        url: "https://api.fal.ai/v1/models/pricing",
        asOf: "2026-11-04",
      },
    },
    ["POST flux3Action.so101"]
  ),
  ...rows(
    "fal",
    {
      kind: "metered",
      unit: "generations",
      source: {
        url: "https://api.fal.ai/v1/models/pricing",
        asOf: "2026-11-04",
      },
    },
    [
      "POST google.lyria3p5",
      "POST meshy.v6Lite.retexture",
      "POST meshy.v7p1.imageTo3d",
      "POST meshy.v7p1.multiImageTo3d",
      "POST meshy.v7p1.textTo3d",
    ]
  ),
  ...rows(
    "fal",
    {
      kind: "metered",
      unit: "megapixels",
      source: {
        url: "https://api.fal.ai/v1/models/pricing",
        asOf: "2026-11-04",
      },
    },
    [
      "POST hunyuan.v3.instructEdit",
      "POST krea.v3.edit",
      "POST krea.v3.textToImage",
      "POST qwenImage",
      "POST qwenImage.edit",
    ]
  ),
  ...rows(
    "fal",
    {
      kind: "metered",
      unit: "generations",
      reason:
        "fal dynamic list: priced after the call from x-fal-billable-units",
      source: {
        url: "https://api.fal.ai/v1/models/pricing",
        asOf: "2026-11-04",
      },
    },
    ["POST meshy.v7.imageTo3d"]
  ),
  ...rows(
    "fal",
    {
      kind: "metered",
      unit: "credits",
      reason:
        "fal dynamic list: priced after the call from x-fal-billable-units",
      source: {
        url: "https://api.fal.ai/v1/models/pricing",
        asOf: "2026-11-04",
      },
    },
    ["POST microsoft.maiImage2p5Pro", "POST microsoft.maiImage2p5Pro.edit"]
  ),
  ...rows(
    "fal",
    {
      kind: "metered",
      unit: "steps",
      source: {
        url: "https://api.fal.ai/v1/models/pricing",
        asOf: "2026-11-04",
      },
    },
    [
      "POST minimax.h3.flf2v.trainer",
      "POST minimax.h3.i2v.trainer",
      "POST minimax.h3.ref2va.trainer",
      "POST minimax.h3.t2v.trainer",
    ]
  ),
  ...rows(
    "fal",
    {
      kind: "metered",
      unit: "requests",
      source: {
        url: "https://api.fal.ai/v1/models/pricing",
        asOf: "2026-11-04",
      },
    },
    ["POST mureka.api.generate.lyrics"]
  ),
  ...rows(
    "fal",
    {
      kind: "metered",
      unit: "minutes",
      reason:
        "fal dynamic list: priced after the call from x-fal-billable-units",
      source: {
        url: "https://api.fal.ai/v1/models/pricing",
        asOf: "2026-11-04",
      },
    },
    ["POST mureka.api.generate.podcast"]
  ),
  ...rows(
    "fal",
    {
      kind: "free",
      reason:
        "Storage upload slot; fal's price list has no storage row, and the docs name no per-call charge",
      source: {
        url: "https://fal.ai/docs/api-reference/client-libraries/javascript/storage.md",
        asOf: "2026-11-04",
      },
    },
    [
      "POST storage.upload.completeMultipart",
      "POST storage.upload.initiate",
      "POST storage.upload.initiateMultipart",
    ]
  ),
  ...rows(
    "fal",
    {
      kind: "metered",
      unit: "credits",
      source: {
        url: "https://api.fal.ai/v1/models/pricing",
        asOf: "2026-11-04",
      },
    },
    ["POST tripo3d.p2.imageTo3d", "POST tripo3d.p2.textTo3d"]
  ),
  ...rows(
    "fal",
    {
      kind: "free",
      reason: "Admin, usage, analytics, serverless or workflow read; no charge",
      source: {
        url: "https://fal.ai/docs/api-reference/platform-apis/for-models.md",
        asOf: "2026-11-04",
      },
    },
    [
      "GET v1.models",
      "GET v1.models.analytics",
      "GET v1.models.pricing",
      "GET v1.models.requests.byEndpoint",
      "DELETE v1.models.requests.payloads",
      "GET v1.models.requests.payloads",
      "GET v1.models.usage",
      "GET v1.serverless.apps.queue",
      "POST v1.serverless.logs.stream",
      "GET v1.serverless.metrics",
      "GET v1.workflows",
      "GET v1.workflows.get",
    ]
  ),
  ...rows(
    "fal",
    {
      kind: "free",
      reason: "Free estimate read with the admin key",
      source: {
        url: "https://fal.ai/docs/platform-apis/v1/models/pricing/estimate.md",
        asOf: "2026-11-04",
      },
    },
    ["POST v1.models.pricing.estimate"]
  ),
  ...rows(
    "fal",
    {
      kind: "followup",
      reason:
        "Queue poll or result; the result GET carries x-fal-billable-units",
      source: {
        url: "https://fal.ai/docs/platform-apis/v1/models/pricing.md",
        asOf: "2026-11-04",
      },
    },
    ["GET v1.queue.result", "GET v1.queue.status"]
  ),
  ...rows(
    "fal",
    {
      kind: "metered",
      unit: "per-model",
      reason:
        "Endpoint id is an argument; dynamic ids price after the call. Settles on the result GET.",
      source: {
        url: "https://api.fal.ai/v1/models/pricing",
        asOf: "2026-11-04",
      },
    },
    ["POST v1.queue.submit"]
  ),
  ...rows(
    "fal",
    {
      kind: "free",
      reason:
        "Serverless file management; no price row, and compute bills on the app, not here",
      source: {
        url: "https://fal.ai/docs/api-reference/cli/files.md",
        asOf: "2026-11-04",
      },
    },
    [
      "GET v1.serverless.files.list",
      "POST v1.serverless.files.uploadLocal",
      "POST v1.serverless.files.uploadUrl",
    ]
  ),
  ...rows(
    "fireworks",
    {
      kind: "free",
      reason:
        "Account, model, secret, user or job management; the pricing page bills none of these",
      source: { url: "https://fireworks.ai/pricing", asOf: "2026-11-04" },
    },
    [
      "GET inference.v1.accounts",
      "DELETE inference.v1.accounts.apiKeys",
      "POST inference.v1.accounts.apiKeys.create",
      "GET inference.v1.accounts.apiKeys.list",
      "DELETE inference.v1.accounts.batchInferenceJobs",
      "GET inference.v1.accounts.batchInferenceJobs",
      "GET inference.v1.accounts.batchInferenceJobs.list",
      "DELETE inference.v1.accounts.deployedModels",
      "GET inference.v1.accounts.deployedModels",
      "POST inference.v1.accounts.deployedModels.create",
      "GET inference.v1.accounts.deployedModels.list",
      "PATCH inference.v1.accounts.deployedModels.update",
      "GET inference.v1.accounts.deploymentShapes",
      "GET inference.v1.accounts.deploymentShapes.versions",
      "GET inference.v1.accounts.deploymentShapes.versions.list",
      "DELETE inference.v1.accounts.deployments",
      "GET inference.v1.accounts.deployments",
      "GET inference.v1.accounts.deployments.list",
      "DELETE inference.v1.accounts.dpoJobs",
      "GET inference.v1.accounts.dpoJobs",
      "GET inference.v1.accounts.dpoJobs.getMetricsFileEndpoint",
      "GET inference.v1.accounts.dpoJobs.list",
      "DELETE inference.v1.accounts.evaluationJobs",
      "GET inference.v1.accounts.evaluationJobs",
      "GET inference.v1.accounts.evaluationJobs.getExecutionLogEndpoint",
      "GET inference.v1.accounts.evaluationJobs.list",
      "DELETE inference.v1.accounts.evaluators",
      "GET inference.v1.accounts.evaluators",
      "POST inference.v1.accounts.evaluators.create",
      "GET inference.v1.accounts.evaluators.getBuildLogEndpoint",
      "GET inference.v1.accounts.evaluators.getSourceCodeSignedUrl",
      "POST inference.v1.accounts.evaluators.getUploadEndpoint",
      "GET inference.v1.accounts.evaluators.list",
      "PATCH inference.v1.accounts.evaluators.update",
      "POST inference.v1.accounts.evaluators.validateUpload",
      "GET inference.v1.accounts.list",
      "DELETE inference.v1.accounts.models",
      "GET inference.v1.accounts.models",
      "POST inference.v1.accounts.models.create",
      "GET inference.v1.accounts.models.getDownloadEndpoint",
      "POST inference.v1.accounts.models.getUploadEndpoint",
      "GET inference.v1.accounts.models.list",
      "POST inference.v1.accounts.models.prepare",
      "PATCH inference.v1.accounts.models.update",
      "GET inference.v1.accounts.models.validateUpload",
      "DELETE inference.v1.accounts.reinforcementFineTuningJobs",
      "GET inference.v1.accounts.reinforcementFineTuningJobs",
      "GET inference.v1.accounts.reinforcementFineTuningJobs.list",
      "DELETE inference.v1.accounts.rlorTrainerJobs",
      "GET inference.v1.accounts.rlorTrainerJobs",
      "GET inference.v1.accounts.rlorTrainerJobs.list",
      "DELETE inference.v1.accounts.secrets",
      "GET inference.v1.accounts.secrets",
      "POST inference.v1.accounts.secrets.create",
      "GET inference.v1.accounts.secrets.list",
      "PATCH inference.v1.accounts.secrets.update",
      "DELETE inference.v1.accounts.supervisedFineTuningJobs",
      "GET inference.v1.accounts.supervisedFineTuningJobs",
      "GET inference.v1.accounts.supervisedFineTuningJobs.list",
      "GET inference.v1.accounts.users",
      "POST inference.v1.accounts.users.create",
      "GET inference.v1.accounts.users.list",
      "PATCH inference.v1.accounts.users.update",
      "POST inference.v1.accounts.users.update",
    ]
  ),
  ...rows(
    "fireworks",
    {
      kind: "accrual",
      unit: "tokens",
      reason:
        "Bills 50 percent of the token rate as the job runs; the body names a dataset, not a payload",
      source: { url: "https://fireworks.ai/pricing", asOf: "2026-11-04" },
    },
    ["POST inference.v1.accounts.batchInferenceJobs.create"]
  ),
  ...rows(
    "fireworks",
    {
      kind: "free",
      reason:
        "Neither the pricing page nor the dataset reference names a storage or call charge",
      source: {
        url: "https://docs.fireworks.ai/api-reference/create-dataset.md",
        asOf: "2026-11-04",
      },
    },
    [
      "DELETE inference.v1.accounts.datasets",
      "GET inference.v1.accounts.datasets",
      "POST inference.v1.accounts.datasets.create",
      "GET inference.v1.accounts.datasets.getDownloadEndpoint",
      "POST inference.v1.accounts.datasets.getUploadEndpoint",
      "GET inference.v1.accounts.datasets.list",
      "PATCH inference.v1.accounts.datasets.update",
      "POST inference.v1.accounts.datasets.validateUpload",
    ]
  ),
  ...rows(
    "fireworks",
    {
      kind: "accrual",
      unit: "gpu-seconds",
      reason:
        "A deployment bills per GPU-second while replicas run; this call starts or changes replicas, so it has no per-call amount",
      source: { url: "https://fireworks.ai/pricing", asOf: "2026-11-04" },
    },
    [
      "POST inference.v1.accounts.deployments.create",
      "PATCH inference.v1.accounts.deployments.scale",
      "POST inference.v1.accounts.deployments.undelete",
      "PATCH inference.v1.accounts.deployments.update",
    ]
  ),
  ...rows(
    "fireworks",
    {
      kind: "accrual",
      unit: "gpu-seconds",
      reason:
        "Runs on GPU or model time and accrues while it runs; no per-call amount",
      source: { url: "https://fireworks.ai/pricing", asOf: "2026-11-04" },
    },
    [
      "POST inference.v1.accounts.dpoJobs.create",
      "POST inference.v1.accounts.dpoJobs.resume",
      "POST inference.v1.accounts.evaluationJobs.create",
      "POST inference.v1.accounts.rlorTrainerJobs.create",
      "POST inference.v1.accounts.rlorTrainerJobs.executeTrainStep",
      "POST inference.v1.accounts.rlorTrainerJobs.resume",
    ]
  ),
  ...rows(
    "fireworks",
    {
      kind: "accrual",
      unit: "training-tokens",
      reason: "Bills per 1M training tokens as the job runs",
      source: { url: "https://fireworks.ai/pricing", asOf: "2026-11-04" },
    },
    [
      "POST inference.v1.accounts.reinforcementFineTuningJobs.create",
      "POST inference.v1.accounts.reinforcementFineTuningJobs.resume",
      "POST inference.v1.accounts.supervisedFineTuningJobs.create",
      "POST inference.v1.accounts.supervisedFineTuningJobs.resume",
    ]
  ),
  ...rows(
    "fireworks",
    {
      kind: "followup",
      reason: "Result poll; billed on the submit it follows",
      source: { url: "https://fireworks.ai/pricing", asOf: "2026-11-04" },
    },
    ["GET inference.v1.audio.batch"]
  ),
  ...rows(
    "fireworks",
    {
      kind: "unpriced",
      unit: "seconds",
      reason:
        "Fireworks withdrew its audio rates (last listed 2026-04-29, gone by 2026-05-06) and deprecated audio inference on 2026-06-10, so this fails closed; history, not a rate: the last card read 0.0015 USD per audio minute for Whisper-v3-large and 0.0009 for turbo, batch 40% less; ruling ac-8l1x3z, no follow-up",
      source: {
        url: "https://docs.fireworks.ai/updates/changelog",
        asOf: "2026-11-05",
      },
    },
    [
      "POST inference.v1.audio.batch.transcriptions",
      "POST inference.v1.audio.batch.translations",
    ]
  ),
  ...rows(
    "fireworks",
    {
      kind: "unpriced",
      unit: "seconds",
      reason:
        "Fireworks withdrew its audio rates (last listed 2026-04-29, gone by 2026-05-06) and deprecated audio inference on 2026-06-10, so this fails closed; history, not a rate: the last card read 0.0015 USD per audio minute for Whisper-v3-large and 0.0009 for turbo; ruling ac-8l1x3z, no follow-up",
      source: {
        url: "https://docs.fireworks.ai/updates/changelog",
        asOf: "2026-11-05",
      },
    },
    [
      "POST inference.v1.audio.transcriptions",
      "POST inference.v1.audio.translations",
    ]
  ),
  ...rows(
    "fireworks",
    {
      kind: "metered",
      unit: "tokens",
      reason:
        "Dated named-model and pinned size-band token rates; unknown model metadata fails closed",
      source: {
        url: "https://docs.fireworks.ai/serverless/pricing.md",
        asOf: "2026-11-04",
      },
    },
    [
      "POST inference.v1.chat.completions",
      "POST inference.v1.completions",
      "POST inference.v1.messages",
    ]
  ),
  ...rows(
    "fireworks",
    {
      kind: "metered",
      unit: "tokens",
      reason:
        "Published legacy embedding size bands and Qwen3 Embedding 8B input-token rates",
      source: {
        url: "https://docs.fireworks.ai/serverless/pricing.md",
        asOf: "2026-11-04",
      },
    },
    ["POST inference.v1.embeddings"]
  ),
  ...rows(
    "fireworks",
    {
      kind: "metered",
      unit: "tokens",
      reason:
        "Qwen3 Reranker 8B: 0.20 USD per million input tokens; Voyage uses dedicated capacity and has no per-call rate",
      source: {
        url: "https://docs.fireworks.ai/guides/querying-embeddings-models.md",
        asOf: "2026-11-04",
      },
    },
    ["POST inference.v1.rerank"]
  ),
  ...rows(
    "free-media-upload",
    {
      kind: "free",
      reason: "Free file host; no account, no price",
      source: { url: "https://catbox.moe/faq.php", asOf: "2026-11-04" },
    },
    [
      "POST catbox.upload",
      "POST filebin.upload",
      "POST gofile.upload",
      "POST litterbox.upload",
      "POST tempsh.upload",
      "POST tflink.upload",
      "POST tmpfiles.api.v1.upload",
      "POST uguu.upload",
    ]
  ),
  ...rows(
    "google",
    {
      kind: "free",
      reason: "Docs: no charge or quota restriction for CountTokens",
      source: {
        url: "https://docs.cloud.google.com/vertex-ai/generative-ai/docs/multimodal/get-token-count",
        asOf: "2026-11-04",
      },
    },
    ["POST v1.publishers.google.models.countTokens"]
  ),
  ...rows(
    "google",
    {
      kind: "metered",
      unit: "tokens",
      reason:
        "Standard global text rates; usageMetadata reports actual token counts",
      source: {
        url: "https://cloud.google.com/vertex-ai/generative-ai/pricing",
        asOf: "2026-11-04",
      },
    },
    ["POST v1.publishers.google.models.generateContent"]
  ),
  ...rows(
    "google",
    {
      kind: "free",
      reason: "Code Assist quota read; no charge",
      source: {
        url: "https://cloud.google.com/vertex-ai/generative-ai/pricing",
        asOf: "2026-11-04",
      },
    },
    [
      "POST v1internal.retrieveUserQuota",
      "POST v1internal.retrieveUserQuotaSummary",
    ]
  ),
  ...rows(
    "googleflow",
    {
      kind: "free",
      reason:
        "Account, asset, character or voice management; no credit cost published; a captcha provider bills its own solves",
      source: {
        url: "https://useapi.net/docs/api-google-flow-v1",
        asOf: "2026-11-04",
      },
    },
    [
      "DELETE v1.accounts",
      "GET v1.accounts",
      "POST v1.accounts",
      "GET v1.accounts.captchaProviders",
      "POST v1.accounts.captchaProviders",
      "GET v1.accounts.captchaStats",
      "GET v1.accounts.retrieve",
      "POST v1.assets",
      "GET v1.assets.retrieve",
      "DELETE v1.characters",
      "GET v1.characters",
      "POST v1.characters",
      "GET v1.characters.retrieve",
      "DELETE v1.voices",
      "GET v1.voices",
      "POST v1.voices",
      "GET v1.voices.retrieve",
    ]
  ),
  ...rows(
    "googleflow",
    {
      kind: "free",
      reason:
        "Image generation draws no credits on any plan (bundled rows are 0, read 2026-10-17 and again today); a configured captcha provider bills its own solves",
      source: {
        url: "https://useapi.net/docs/api-google-flow-v1/post-google-flow-images",
        asOf: "2026-11-04",
      },
    },
    ["POST v1.images"]
  ),
  ...rows(
    "googleflow",
    {
      kind: "free",
      reason: "Docs: both resolutions are free of Google Flow credits",
      source: {
        url: "https://useapi.net/docs/api-google-flow-v1/post-google-flow-images-upscale",
        asOf: "2026-11-04",
      },
    },
    ["POST v1.images.upscale"]
  ),
  ...rows(
    "googleflow",
    {
      kind: "followup",
      reason: "Job poll; billed on the submit it follows",
      source: {
        url: "https://useapi.net/docs/api-google-flow-v1/get-google-flow-jobs",
        asOf: "2026-11-04",
      },
    },
    ["GET v1.jobs", "GET v1.jobs.retrieve"]
  ),
  ...rows(
    "googleflow",
    {
      kind: "metered",
      unit: "credits",
      reason:
        "Credits times the plan's credit value; Lite low priority is 0 credits on Ultra 199",
      source: {
        url: "https://useapi.net/docs/api-google-flow-v1",
        asOf: "2026-11-04",
      },
    },
    ["POST v1.videos"]
  ),
  ...rows(
    "googleflow",
    {
      kind: "unpriced",
      reason:
        "Neither Google's credit table nor useapi's docs price concatenation on 2026-11-05, and no receipt exists; follow-up ac-3y6egd",
      source: {
        url: "https://useapi.net/docs/api-google-flow-v1/post-google-flow-videos-concatenate",
        asOf: "2026-11-05",
      },
    },
    ["POST v1.videos.concatenate"]
  ),
  ...rows(
    "googleflow",
    {
      kind: "metered",
      unit: "credits",
      reason:
        "Uses the same Veo models and credit table as a generation; model defaults to veo-3.1-fast",
      source: {
        url: "https://useapi.net/docs/api-google-flow-v1/post-google-flow-videos-extend",
        asOf: "2026-11-04",
      },
    },
    ["POST v1.videos.extend"]
  ),
  ...rows(
    "googleflow",
    {
      kind: "unpriced",
      reason:
        "Neither Google's credit table nor useapi's docs price GIF rendering on 2026-11-05, and no receipt exists; follow-up ac-3y6egd",
      source: {
        url: "https://useapi.net/docs/api-google-flow-v1/post-google-flow-videos-gif",
        asOf: "2026-11-05",
      },
    },
    ["POST v1.videos.gif"]
  ),
  ...rows(
    "googleflow",
    {
      kind: "metered",
      unit: "credits",
      reason: "720p and 1080p are free; 4K costs 50 credits on Ultra plans",
      source: {
        url: "https://useapi.net/docs/api-google-flow-v1/post-google-flow-videos-upscale",
        asOf: "2026-11-04",
      },
    },
    ["POST v1.videos.upscale"]
  ),
  ...rows(
    "kie",
    {
      kind: "metered",
      unit: "tokens",
      reason:
        "Published chat models have token rows; unknown models remain unpriced. credits_consumed states the reported charge.",
      source: {
        url: "https://api.kie.ai/client/v1/model-pricing/page",
        asOf: "2026-11-04",
      },
    },
    [
      "POST anthropic.v1.messages",
      "POST api.v1.responses",
      "POST claude.v1.messages",
      "POST codex.v1.responses",
      "POST openai.v1.responses",
    ]
  ),
  ...rows(
    "kie",
    {
      kind: "free",
      reason: "Balance or catalog read; no charge",
      source: {
        url: "https://api.kie.ai/client/v1/model-pricing/page",
        asOf: "2026-11-04",
      },
    },
    [
      "GET anthropic.v1.models",
      "GET api.v1.chat.credit",
      "GET api.v1.models",
      "GET api.v1.models.modelSchema",
      "GET api.v1.models.price",
      "GET api.v1.models.successRate",
      "GET openai.v1.models",
      "GET xai.v1.models",
    ]
  ),
  ...rows(
    "kie",
    {
      kind: "free",
      reason: "Docs: file uploads are free; files are deleted after 24 hours",
      source: {
        url: "https://docs.kie.ai/file-upload-api/quickstart.md",
        asOf: "2026-11-04",
      },
    },
    [
      "POST api.fileBase64Upload",
      "POST api.fileStreamUpload",
      "POST api.fileUrlUpload",
    ]
  ),
  ...rows(
    "kie",
    {
      kind: "free",
      reason:
        "Download link for an existing file; the docs name no credit charge",
      source: {
        url: "https://docs.kie.ai/common-api/download-url.md",
        asOf: "2026-11-04",
      },
    },
    ["POST api.v1.common.downloadUrl", "POST api.v1.gpt4oImage.downloadUrl"]
  ),
  ...rows(
    "kie",
    {
      kind: "metered",
      unit: "per-model",
      source: {
        url: "https://api.kie.ai/client/v1/model-pricing/page",
        asOf: "2026-11-04",
      },
    },
    [
      "POST api.v1.flux.kontext.generate",
      "POST api.v1.generate",
      "POST api.v1.generate.addInstrumental",
      "POST api.v1.generate.addVocals",
      "POST api.v1.generate.extend",
      "POST api.v1.generate.getTimestampedLyrics",
      "POST api.v1.generate.mashup",
      "POST api.v1.generate.replaceSection",
      "POST api.v1.generate.sounds",
      "POST api.v1.generate.uploadCover",
      "POST api.v1.generate.uploadExtend",
      "POST api.v1.gpt4oImage.generate",
      "POST api.v1.lyrics",
      "POST api.v1.mp4.generate",
      "POST api.v1.runway.extend",
      "POST api.v1.runway.generate",
      "POST api.v1.style.generate",
      "POST api.v1.veo.extend",
      "POST api.v1.veo.generate",
      "POST api.v1.veo.get4kVideo",
      "POST api.v1.vocalRemoval.generate",
      "POST api.v1.wav.generate",
    ]
  ),
  ...rows(
    "kie",
    {
      kind: "followup",
      reason: "Poll or result; data.creditsConsumed states the final bill",
      source: {
        url: "https://api.kie.ai/client/v1/model-pricing/page",
        asOf: "2026-11-04",
      },
    },
    [
      "GET api.v1.flux.kontext.recordInfo",
      "GET api.v1.generate.recordInfo",
      "GET api.v1.gpt4oImage.recordInfo",
      "GET api.v1.jobs.recordInfo",
      "GET api.v1.lyrics.recordInfo",
      "GET api.v1.midi.recordInfo",
      "GET api.v1.mj.recordInfo",
      "GET api.v1.mp4.recordInfo",
      "GET api.v1.runway.recordDetail",
      "GET api.v1.suno.cover.recordInfo",
      "GET api.v1.suno.recovery.recordInfo",
      "GET api.v1.veo.recordInfo",
      "GET api.v1.vocalRemoval.recordInfo",
      "GET api.v1.voice.recordInfo",
      "GET api.v1.voice.validateInfo",
      "GET api.v1.wav.recordInfo",
    ]
  ),
  ...rows(
    "kie",
    {
      kind: "metered",
      unit: "per-model",
      reason: "The feed lists 0 credits for this call today.",
      source: {
        url: "https://api.kie.ai/client/v1/model-pricing/page",
        asOf: "2026-11-04",
      },
    },
    [
      "POST api.v1.generate.generatePersona",
      "POST api.v1.midi.generate",
      "POST api.v1.suno.cover.generate",
    ]
  ),
  ...rows(
    "kie",
    {
      kind: "metered",
      unit: "per-model",
      reason:
        "Most media rows exist; the feed also lists models with no row (gaps-by-child.md section P4). Settles on recordInfo.",
      source: {
        url: "https://api.kie.ai/client/v1/model-pricing/page",
        asOf: "2026-11-04",
      },
    },
    ["POST api.v1.jobs.createTask"]
  ),
  ...rows(
    "kie",
    {
      kind: "metered",
      unit: "per-model",
      reason:
        "PAID_ENDPOINTS lists it, but the feed has no Midjourney row and no bundled row exists",
      source: {
        url: "https://api.kie.ai/client/v1/model-pricing/page",
        asOf: "2026-11-04",
      },
    },
    ["POST api.v1.mj.generate"]
  ),
  ...rows(
    "kie",
    {
      kind: "free",
      reason:
        "Docs: this endpoint is free. PAID_ENDPOINTS still lists it, so R1's guard needs a named exception (see gaps-by-child.md section R1).",
      source: {
        url: "https://docs.kie.ai/market/gemini-omni-audio.md",
        asOf: "2026-11-04",
      },
    },
    ["POST api.v1.omni.audio.create"]
  ),
  ...rows(
    "kie",
    {
      kind: "free",
      reason:
        "Docs: this endpoint is free. PAID_ENDPOINTS still lists it, so R1's guard needs a named exception (see gaps-by-child.md section R1).",
      source: {
        url: "https://docs.kie.ai/market/gemini-omni-character.md",
        asOf: "2026-11-04",
      },
    },
    ["POST api.v1.omni.character.create"]
  ),
  ...rows(
    "kie",
    {
      kind: "unpriced",
      unit: "per-model",
      reason:
        "KIE's catalog lists this model with a null price, and its docs and feed state neither a charge nor that it is free; follow-up ac-27hri6",
      source: {
        url: "https://docs.kie.ai/suno-api/recovery-audio.md",
        asOf: "2026-11-05",
      },
    },
    ["POST api.v1.suno.recovery"]
  ),
  ...rows(
    "kie",
    {
      kind: "metered",
      unit: "generations",
      reason: "A read that can start a paid render; PAID_ENDPOINTS lists it",
      source: {
        url: "https://docs.kie.ai/veo3-api/get-veo-3-1080-p-video.md",
        asOf: "2026-11-04",
      },
    },
    ["GET api.v1.veo.get1080pVideo"]
  ),
  ...rows(
    "kie",
    {
      kind: "free",
      reason: "Docs: this endpoint is free.",
      source: {
        url: "https://docs.kie.ai/suno-api/suno-voice-check-voice.md",
        asOf: "2026-11-04",
      },
    },
    ["POST api.v1.voice.checkVoice"]
  ),
  ...rows(
    "kie",
    {
      kind: "free",
      reason:
        "Docs: this endpoint is free. PAID_ENDPOINTS still lists it, so R1's guard needs a named exception (see gaps-by-child.md section R1).",
      source: {
        url: "https://docs.kie.ai/suno-api/suno-voice-generate.md",
        asOf: "2026-11-04",
      },
    },
    ["POST api.v1.voice.generate"]
  ),
  ...rows(
    "kie",
    {
      kind: "free",
      reason:
        "Docs: this endpoint is free. PAID_ENDPOINTS still lists it, so R1's guard needs a named exception (see gaps-by-child.md section R1).",
      source: {
        url: "https://docs.kie.ai/suno-api/suno-voice-regenerate.md",
        asOf: "2026-11-04",
      },
    },
    ["POST api.v1.voice.regenerate"]
  ),
  ...rows(
    "kie",
    {
      kind: "free",
      reason:
        "Docs: this endpoint is free. PAID_ENDPOINTS still lists it, so R1's guard needs a named exception (see gaps-by-child.md section R1).",
      source: {
        url: "https://docs.kie.ai/suno-api/suno-voice-validate.md",
        asOf: "2026-11-04",
      },
    },
    ["POST api.v1.voice.validate"]
  ),
  ...rows(
    "kie",
    {
      kind: "metered",
      unit: "tokens",
      reason:
        "credits_consumed states the charge in every response; the feed lists this model's rates",
      source: {
        url: "https://api.kie.ai/client/v1/model-pricing/page",
        asOf: "2026-11-04",
      },
    },
    [
      "POST gemini.v1.models.gemini36Flash.streamGenerateContent",
      "POST gemini.v1.models.gemini37Flash.streamGenerateContent",
      "POST gemini.v1.models.gemini38Flash.streamGenerateContent",
      "POST gemini31Pro.v1.chat.completions",
      "POST gemini36FlashOpenai.v1.chat.completions",
      "POST gemini37FlashOpenai.v1.chat.completions",
      "POST gemini38FlashOpenai.v1.chat.completions",
      "POST gemini3Pro.v1.chat.completions",
      "POST gemini4ArgonOpenai.v1.chat.completions",
    ]
  ),
  ...rows(
    "kie",
    {
      kind: "metered",
      unit: "tokens",
      reason:
        "Published chat models have token rows; unknown models remain unpriced. credits_consumed states the reported charge.",
      source: {
        url: "https://api.kie.ai/client/v1/model-pricing/page",
        asOf: "2026-11-04",
      },
    },
    [
      "POST gpt52.v1.chat.completions",
      "POST grok.v1.responses",
      "POST xai.v1.responses",
    ]
  ),
  ...rows(
    "kimicoding",
    {
      kind: "subscription",
      unit: "tokens",
      reason:
        "Kimi Code plan: flat and quota-limited, zero marginal USD. List rates are for comparison, and the plan's model ids (k3-256k, k2p5) do not match the platform's",
      source: { url: "https://www.kimi.com/code/docs/", asOf: "2026-11-04" },
    },
    ["POST coding.v1.chat.completions", "POST coding.v1.messages"]
  ),
  ...rows(
    "kimicoding",
    {
      kind: "free",
      reason: "Token count or model list; no charge",
      source: { url: "https://www.kimi.com/code/docs/", asOf: "2026-11-04" },
    },
    ["POST coding.v1.countTokens", "GET coding.v1.models"]
  ),
  ...rows(
    "kimicoding",
    {
      kind: "subscription",
      unit: "tokens",
      reason: "Kimi Code plan: flat and quota-limited, zero marginal USD",
      source: { url: "https://www.kimi.com/code/docs/", asOf: "2026-11-04" },
    },
    ["POST coding.v1.embeddings"]
  ),
  ...rows(
    "machgen",
    {
      kind: "unpriced",
      reason:
        "Multipart upload is documented, but no upstream upload price is stated. A balance observation is not a free-rate guarantee; ruling ac-2h3t3v, no follow-up",
      source: {
        url: "https://www.machgen.ai/docs/rest_api/models/h3#upscale-your-own-video-to-2k",
        asOf: "2026-11-07",
      },
    },
    ["POST api.v0.upload"]
  ),
  ...rows(
    "machgen",
    {
      kind: "followup",
      reason: "Task poll or asset read; billed on the generate call",
      source: {
        url: "https://api.machgen.ai/api/v0/billing/pricebook/public",
        asOf: "2026-11-04",
      },
    },
    ["GET api.v0.assets", "GET api.v0.tasks"]
  ),
  ...rows(
    "machgen",
    {
      kind: "metered",
      unit: "seconds",
      reason:
        "Per second or per image by model. Upscale models price through the free quote; audio and Topaz models in the pricebook have no row.",
      source: {
        url: "https://api.machgen.ai/api/v0/billing/pricebook/public",
        asOf: "2026-11-04",
      },
    },
    ["POST api.v0.generate"]
  ),
  ...rows(
    "machgen",
    {
      kind: "followup",
      reason:
        "Free receipt for a task: states generation_cost_micros and net_cost_micros",
      source: {
        url: "https://api.machgen.ai/api/v0/billing/pricebook/public",
        asOf: "2026-11-04",
      },
    },
    ["GET api.v0.tasks.billing"]
  ),
  ...rows(
    "machgen",
    {
      kind: "free",
      reason: "Free quote; bills nothing",
      source: { url: "https://machgen.ai/docs", asOf: "2026-11-04" },
    },
    ["POST api.v0.upscale.quote"]
  ),
  ...rows(
    "machgen",
    {
      kind: "free",
      reason:
        "Reserving a custom-LoRA upload bills nothing (wallet unchanged across the recorded reserve); generating with the LoRA bills on api.v0.generate",
      source: {
        url: "https://www.machgen.ai/docs/rest_api/custom-loras",
        asOf: "2026-11-11",
      },
    },
    ["POST api.v0.adapters.create"]
  ),
  ...rows(
    "machgen",
    {
      kind: "free",
      reason:
        "Committing an uploaded custom LoRA bills nothing (wallet unchanged across the recorded commit); generating with the LoRA bills on api.v0.generate",
      source: {
        url: "https://www.machgen.ai/docs/rest_api/custom-loras",
        asOf: "2026-11-11",
      },
    },
    ["POST api.v0.adapters.commit"]
  ),
  ...rows(
    "machgen",
    {
      kind: "free",
      reason:
        "Reading one custom LoRA bills nothing (wallet unchanged across the recorded read)",
      source: {
        url: "https://www.machgen.ai/docs/rest_api/custom-loras",
        asOf: "2026-11-11",
      },
    },
    ["GET api.v0.adapters.retrieve"]
  ),
  ...rows(
    "meta",
    {
      kind: "free",
      reason:
        "Instagram Graph API has rate limits and no per-call price. developers.facebook.com answered the plain fetch with 400, so the row rests on the repo's README.",
      source: {
        url: "https://developers.facebook.com/docs/instagram-platform/overview",
        asOf: "2026-11-04",
      },
    },
    ["GET v25.container", "POST v25.media", "POST v25.mediaPublish"]
  ),
  ...rows(
    "omkar",
    {
      kind: "subscription",
      unit: "calls",
      reason:
        "Calls draw a monthly plan quota: Basic is free for 1,000 a month; Pro 16 USD for 20,000, Ultra 48 for 100,000, Mega 148 for 400,000. Only HTTP 200 consumes quota, and the flat plan has zero marginal USD.",
      source: {
        url: "https://www.omkar.cloud/tools/tiktok-scraper",
        asOf: "2026-11-04",
      },
    },
    ["GET feed.explore", "GET feed.explore.categories", "GET feed.trending"]
  ),
  ...rows(
    "openai",
    {
      kind: "free",
      reason: "Reads the ChatGPT plan's usage windows; no charge",
      source: {
        url: "https://developers.openai.com/api/docs/pricing",
        asOf: "2026-11-04",
      },
    },
    ["GET codex.usage"]
  ),
  ...rows(
    "openai",
    {
      kind: "metered",
      unit: "characters",
      source: {
        url: "https://developers.openai.com/api/docs/pricing",
        asOf: "2026-11-04",
      },
    },
    ["POST v1.audio.speech"]
  ),
  ...rows(
    "openai",
    {
      kind: "metered",
      unit: "seconds",
      source: {
        url: "https://developers.openai.com/api/docs/pricing",
        asOf: "2026-11-04",
      },
    },
    ["POST v1.audio.transcriptions", "POST v1.audio.translations"]
  ),
  ...rows(
    "openai",
    {
      kind: "followup",
      reason: "Batch poll; the batch bills as its requests complete",
      source: {
        url: "https://developers.openai.com/api/docs/pricing",
        asOf: "2026-11-04",
      },
    },
    ["GET v1.batches"]
  ),
  ...rows(
    "openai",
    {
      kind: "accrual",
      unit: "tokens",
      reason:
        "Bills batch rates as requests complete; the create body names an input file, not a payload, so no per-call amount exists (record section 8)",
      source: {
        url: "https://developers.openai.com/api/docs/pricing",
        asOf: "2026-11-04",
      },
    },
    ["POST v1.batches"]
  ),
  ...rows(
    "openai",
    {
      kind: "free",
      reason:
        "Metadata, list, delete or cancel call; the pricing page bills none of these",
      source: {
        url: "https://developers.openai.com/api/docs/pricing",
        asOf: "2026-11-04",
      },
    },
    [
      "POST v1.batches.cancel",
      "DELETE v1.chat.completions",
      "GET v1.chat.completions",
      "GET v1.chat.completions.messages",
      "GET v1.conversations.retrieve",
      "DELETE v1.fineTuning.checkpoints.permissions",
      "GET v1.fineTuning.checkpoints.permissions",
      "POST v1.fineTuning.checkpoints.permissions",
      "GET v1.fineTuning.jobs",
      "POST v1.fineTuning.jobs.cancel",
      "GET v1.fineTuning.jobs.checkpoints",
      "GET v1.fineTuning.jobs.events",
      "POST v1.fineTuning.jobs.pause",
      "DELETE v1.models",
      "GET v1.models",
      "DELETE v1.responses",
      "POST v1.responses.cancel",
      "GET v1.responses.inputItems",
      "GET v1.vectorStores",
      "GET v1.vectorStores.files",
    ]
  ),
  ...rows(
    "openai",
    {
      kind: "metered",
      unit: "tokens",
      source: {
        url: "https://developers.openai.com/api/docs/pricing",
        asOf: "2026-11-04",
      },
    },
    [
      "POST v1.chat.completions",
      "POST v1.completions",
      "POST v1.responses.compact",
    ]
  ),
  ...rows(
    "openai",
    {
      kind: "accrual",
      unit: "sessions",
      reason:
        "1 GB container 0.03 USD per 20-minute session (4, 16 and 64 GB cost more); a live container keeps accruing, so a create has no final amount",
      source: {
        url: "https://developers.openai.com/api/docs/pricing",
        asOf: "2026-11-04",
      },
    },
    ["POST v1.containers"]
  ),
  ...rows(
    "openai",
    {
      kind: "free",
      reason:
        "Conversation storage has no pricing row; items bill when a response uses them",
      source: {
        url: "https://developers.openai.com/api/docs/pricing",
        asOf: "2026-11-04",
      },
    },
    ["POST v1.conversations"]
  ),
  ...rows(
    "openai",
    {
      kind: "metered",
      unit: "tokens",
      reason: "text-embedding-ada-002 has no bundled row",
      source: {
        url: "https://developers.openai.com/api/docs/pricing",
        asOf: "2026-11-04",
      },
    },
    ["POST v1.embeddings"]
  ),
  ...rows(
    "openai",
    {
      kind: "free",
      reason:
        "Creating an eval is free; its runs bill their model tokens at run time",
      source: {
        url: "https://developers.openai.com/api/docs/pricing",
        asOf: "2026-11-04",
      },
    },
    ["POST v1.evals"]
  ),
  ...rows(
    "openai",
    {
      kind: "free",
      reason:
        "The pricing page has no Files row; storage bills only once a file is indexed into a vector store or uploaded to ChatKit",
      source: {
        url: "https://developers.openai.com/api/docs/pricing",
        asOf: "2026-11-04",
      },
    },
    [
      "DELETE v1.files",
      "GET v1.files",
      "POST v1.files",
      "GET v1.files.content",
      "POST v1.uploads",
    ]
  ),
  ...rows(
    "openai",
    {
      kind: "accrual",
      unit: "tokens",
      reason:
        "Bills trained tokens as the job runs; closed to new users, existing users can still create jobs",
      source: {
        url: "https://developers.openai.com/api/docs/pricing",
        asOf: "2026-11-04",
      },
    },
    ["POST v1.fineTuning.jobs", "POST v1.fineTuning.jobs.resume"]
  ),
  ...rows(
    "openai",
    {
      kind: "metered",
      unit: "images",
      reason: "gpt-image-1-mini and chatgpt-image-latest have no bundled row",
      source: {
        url: "https://developers.openai.com/api/docs/pricing",
        asOf: "2026-11-04",
      },
    },
    ["POST v1.images.edits", "POST v1.images.generations"]
  ),
  ...rows(
    "openai",
    {
      kind: "unpriced",
      unit: "images",
      reason:
        "The page no longer lists the DALL-E models this endpoint serves, so P1 fails it closed; ruling ac-stu9mv, no follow-up",
      source: {
        url: "https://developers.openai.com/api/docs/pricing",
        asOf: "2026-11-04",
      },
    },
    ["POST v1.images.variations"]
  ),
  ...rows(
    "openai",
    {
      kind: "free",
      reason: "omni-moderation-latest is listed as Free on the pricing page",
      source: {
        url: "https://developers.openai.com/api/docs/pricing",
        asOf: "2026-11-04",
      },
    },
    ["POST v1.moderations"]
  ),
  ...rows(
    "openai",
    {
      kind: "free",
      reason:
        "Admin usage, cost or project read; no charge, and the source of org totals for RC1",
      source: {
        url: "https://developers.openai.com/api/docs/pricing",
        asOf: "2026-11-04",
      },
    },
    [
      "GET v1.organization.costs",
      "GET v1.organization.projects",
      "GET v1.organization.projects.rateLimits",
      "GET v1.organization.usage.audioSpeeches",
      "GET v1.organization.usage.audioTranscriptions",
      "GET v1.organization.usage.codeInterpreterSessions",
      "GET v1.organization.usage.completions",
      "GET v1.organization.usage.embeddings",
      "GET v1.organization.usage.images",
      "GET v1.organization.usage.moderations",
      "GET v1.organization.usage.vectorStores",
    ]
  ),
  ...rows(
    "openai",
    {
      kind: "accrual",
      unit: "tokens",
      reason:
        "Starts a voice session; tokens or minutes bill on the socket (response.done), so the POST has no per-call amount",
      source: {
        url: "https://developers.openai.com/api/docs/pricing",
        asOf: "2026-11-04",
      },
    },
    ["POST v1.realtime.calls"]
  ),
  ...rows(
    "openai",
    {
      kind: "free",
      reason: "Ends a session; no charge of its own",
      source: {
        url: "https://developers.openai.com/api/docs/pricing",
        asOf: "2026-11-04",
      },
    },
    ["POST v1.realtime.calls.hangup"]
  ),
  ...rows(
    "openai",
    {
      kind: "free",
      reason:
        "Mints an ephemeral token; the session it opens bills on the socket",
      source: {
        url: "https://developers.openai.com/api/docs/pricing",
        asOf: "2026-11-04",
      },
    },
    ["POST v1.realtime.clientSecrets"]
  ),
  ...rows(
    "openai",
    {
      kind: "followup",
      reason:
        "Reads a stored or background response; billed on the POST it follows, and usage is on the terminal read",
      source: {
        url: "https://developers.openai.com/api/docs/pricing",
        asOf: "2026-11-04",
      },
    },
    ["GET v1.responses"]
  ),
  ...rows(
    "openai",
    {
      kind: "metered",
      unit: "tokens",
      reason:
        "Tools the request names bill apart (web search 10 USD per 1k calls, file search 2.50 USD per 1k, containers per session).",
      source: {
        url: "https://developers.openai.com/api/docs/pricing",
        asOf: "2026-11-04",
      },
    },
    ["POST v1.responses"]
  ),
  ...rows(
    "openai",
    {
      kind: "free",
      reason:
        "Token count only; the guide and the pricing page name no per-call charge",
      source: {
        url: "https://developers.openai.com/api/docs/guides/token-counting.md",
        asOf: "2026-11-04",
      },
    },
    ["POST v1.responses.inputTokens"]
  ),
  ...rows(
    "openai",
    {
      kind: "accrual",
      unit: "gb-days",
      reason:
        "File search storage 0.10 USD per GB per day, first 1 GB free; storage accrues with no per-call amount",
      source: {
        url: "https://developers.openai.com/api/docs/pricing",
        asOf: "2026-11-04",
      },
    },
    ["POST v1.vectorStores", "POST v1.vectorStores.files"]
  ),
  ...rows(
    "openai",
    {
      kind: "unpriced",
      unit: "requests",
      reason:
        "No published per-call price for direct vector store search; file search tool call fees apply to the Responses API only; storage is billed separately per GB-day; ruling ac-4pxiai, no follow-up",
      source: {
        url: "https://developers.openai.com/api/docs/pricing",
        asOf: "2026-11-04",
      },
    },
    ["POST v1.vectorStores.search"]
  ),
  ...rows(
    "openf1",
    {
      kind: "free",
      reason: "Docs: OpenF1 is free for everyone for historical data",
      source: { url: "https://openf1.org/", asOf: "2026-11-04" },
    },
    [
      "POST token",
      "GET v1.carData",
      "GET v1.championshipDrivers",
      "GET v1.championshipTeams",
      "GET v1.drivers",
      "GET v1.intervals",
      "GET v1.laps",
      "GET v1.location",
      "GET v1.meetings",
      "GET v1.overtakes",
      "GET v1.pit",
      "GET v1.position",
      "GET v1.raceControl",
      "GET v1.sessionResult",
      "GET v1.sessions",
      "GET v1.startingGrid",
      "GET v1.stints",
      "GET v1.teamRadio",
      "GET v1.weather",
    ]
  ),
  ...rows(
    "openligadb",
    {
      kind: "free",
      reason: "Public community soccer data; no key and no price",
      source: { url: "https://www.openligadb.de/", asOf: "2026-11-04" },
    },
    [
      "GET getavailablegroups",
      "GET getavailableleagues",
      "GET getavailableleagues.bySeason",
      "GET getavailablesports",
      "GET getavailableteams",
      "GET getbltable",
      "GET getcurrentgroup",
      "GET getgoalgetters",
      "GET getgrouptable",
      "GET getlastchangedate",
      "GET getlastmatchbyleagueshortcut",
      "GET getlastmatchbyleagueteam",
      "GET getmatchdata.byId",
      "GET getmatchdata.byLeagueSeason",
      "GET getmatchdata.byLeagueSeasonGroup",
      "GET getmatchdata.byLeagueSeasonTeam",
      "GET getmatchdata.byTeams",
      "GET getmatchesbyteam",
      "GET getmatchesbyteamid",
      "GET getnextmatchbyleagueshortcut",
      "GET getnextmatchbyleagueteam",
      "GET getresultinfos",
      "GET swagger.v1.swaggerJson",
    ]
  ),
  ...rows(
    "polymarket",
    {
      kind: "free",
      reason: "Public market data or account read or write; no API charge",
      source: {
        url: "https://docs.polymarket.com/trading/fees",
        asOf: "2026-11-04",
      },
    },
    [
      "DELETE clob.auth.apiKey",
      "POST clob.auth.apiKey",
      "GET clob.auth.apiKeys",
      "GET clob.auth.banStatus.closedOnly",
      "DELETE clob.auth.builderApiKey",
      "GET clob.auth.builderApiKey",
      "POST clob.auth.builderApiKey",
      "GET clob.auth.deriveApiKey",
      "GET clob.balanceAllowance",
      "PUT clob.balanceAllowance",
      "GET clob.balanceAllowance.update",
      "POST clob.batchPricesHistory",
      "GET clob.book",
      "GET clob.books",
      "POST clob.books",
      "GET clob.builderTrades",
      "DELETE clob.cancelAll",
      "DELETE clob.cancelMarketOrders",
      "GET clob.clobMarkets",
      "GET clob.data.order",
      "GET clob.data.orders",
      "GET clob.data.trades",
      "GET clob.feeRate",
      "GET clob.feeRateByQuery",
      "POST clob.heartbeats",
      "GET clob.lastTradePrice",
      "GET clob.lastTradesPrices",
      "POST clob.lastTradesPrices",
      "GET clob.marketLiveActivity",
      "GET clob.markets",
      "GET clob.marketsByToken",
      "POST clob.marketsLiveActivity",
      "GET clob.midpoint",
      "GET clob.midpoints",
      "POST clob.midpoints",
      "GET clob.negRisk",
      "GET clob.negRiskByQuery",
      "DELETE clob.notifications",
      "GET clob.notifications",
      "DELETE clob.order",
      "GET clob.orderScoring",
      "DELETE clob.orders",
      "GET clob.ordersScoring",
      "POST clob.ordersScoring",
      "GET clob.price",
      "GET clob.prices",
      "POST clob.prices",
      "GET clob.pricesHistory",
      "GET clob.rebates.current",
      "GET clob.rewards.markets.byCondition",
      "GET clob.rewards.markets.current",
      "GET clob.rewards.markets.multi",
      "GET clob.rewards.user",
      "GET clob.rewards.userMarkets",
      "GET clob.rewards.userPercentages",
      "GET clob.rewards.userTotal",
      "GET clob.samplingMarkets",
      "GET clob.samplingSimplifiedMarkets",
      "GET clob.simplifiedMarkets",
      "GET clob.spread",
      "POST clob.spreads",
      "GET clob.tickSize",
      "GET clob.tickSizeByQuery",
      "GET clob.time",
      "POST clob.v1.heartbeats",
      "GET data.accounting.snapshot",
      "GET data.activity",
      "GET data.activity.combos",
      "GET data.builders.leaderboard",
      "GET data.builders.volume",
      "GET data.closedPositions",
      "GET data.health",
      "GET data.holders",
      "GET data.leaderboard",
      "GET data.liveVolume",
      "GET data.marketPositions",
      "GET data.oi",
      "GET data.positions",
      "GET data.positions.combos",
      "GET data.traded",
      "GET data.trades",
      "GET data.value",
      "GET gamma.comments",
      "GET gamma.comments.byUser",
      "GET gamma.events",
      "GET gamma.events.keyset",
      "GET gamma.events.slug",
      "GET gamma.events.tags",
      "GET gamma.markets",
      "GET gamma.markets.keyset",
      "GET gamma.markets.slug",
      "GET gamma.markets.tags",
      "GET gamma.publicProfile",
      "GET gamma.search",
      "GET gamma.series",
      "GET gamma.sports",
      "GET gamma.sports.marketTypes",
      "GET gamma.status",
      "GET gamma.tags",
      "GET gamma.tags.relatedTags",
      "GET gamma.tags.relatedTags.slug",
      "GET gamma.tags.relatedTags.tags",
      "GET gamma.tags.relatedTags.tags.slug",
      "GET gamma.tags.slug",
      "GET gamma.teams",
    ]
  ),
  ...rows(
    "polymarket",
    {
      kind: "free",
      reason:
        "No API charge. A matched order may pay the protocol's taker fee at match time; that is a trading cost, not an API call price.",
      source: {
        url: "https://docs.polymarket.com/trading/fees",
        asOf: "2026-11-04",
      },
    },
    ["POST clob.order", "POST clob.orders", "POST clob.placeOrder"]
  ),
  ...rows(
    "quo",
    {
      kind: "metered",
      unit: "segments",
      reason:
        "0.01 USD per outgoing US or Canada segment; international adds a country rate; 160 GSM-7 or 70 special characters per segment",
      source: { url: "https://www.quo.com/pricing", asOf: "2026-11-04" },
    },
    ["POST v1.messages"]
  ),
  ...rows(
    "s3",
    {
      kind: "metered",
      unit: "requests",
      reason: "S3 Standard us-east-1: 0.005 USD per 1k PUT, COPY, POST or LIST",
      source: {
        url: "https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonS3/current/us-east-1/index.json",
        asOf: "2026-11-04",
      },
    },
    [
      "PUT buckets.create",
      "GET buckets.list",
      "GET buckets.listAnalytics",
      "GET buckets.listDirectory",
      "GET buckets.listIntelligentTiering",
      "GET buckets.listInventory",
      "GET buckets.listMetrics",
      "PUT buckets.putAbac",
      "PUT buckets.putAccelerateConfiguration",
      "PUT buckets.putAcl",
      "PUT buckets.putAnalytics",
      "PUT buckets.putCors",
      "PUT buckets.putEncryption",
      "PUT buckets.putIntelligentTiering",
      "PUT buckets.putInventory",
      "PUT buckets.putLifecycle",
      "PUT buckets.putLifecycleLegacy",
      "PUT buckets.putLogging",
      "PUT buckets.putMetrics",
      "PUT buckets.putNotification",
      "PUT buckets.putNotificationLegacy",
      "PUT buckets.putObjectLockConfiguration",
      "PUT buckets.putOwnershipControls",
      "PUT buckets.putPolicy",
      "PUT buckets.putPublicAccessBlock",
      "PUT buckets.putReplication",
      "PUT buckets.putRequestPayment",
      "PUT buckets.putTagging",
      "PUT buckets.putVersioning",
      "PUT buckets.putWebsite",
      "POST objects.completeMultipartUpload",
      "PUT objects.copy",
      "POST objects.createMultipartUpload",
      "GET objects.list",
      "GET objects.listLegacy",
      "GET objects.listMultipartUploads",
      "GET objects.listParts",
      "GET objects.listVersions",
      "PUT objects.put",
      "PUT objects.putAcl",
      "PUT objects.putLegalHold",
      "PUT objects.putRetention",
      "PUT objects.putTagging",
      "PUT objects.updateEncryption",
      "PUT objects.uploadPart",
      "PUT objects.uploadPartCopy",
    ]
  ),
  ...rows(
    "s3",
    {
      kind: "metered",
      unit: "requests",
      reason: "S3 Standard us-east-1: 0.0004 USD per 1k GET and other requests",
      source: {
        url: "https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonS3/current/us-east-1/index.json",
        asOf: "2026-11-04",
      },
    },
    [
      "GET buckets.getAbac",
      "GET buckets.getAccelerateConfiguration",
      "GET buckets.getAcl",
      "GET buckets.getAnalytics",
      "GET buckets.getCors",
      "GET buckets.getEncryption",
      "GET buckets.getIntelligentTiering",
      "GET buckets.getInventory",
      "GET buckets.getLifecycle",
      "GET buckets.getLifecycleLegacy",
      "GET buckets.getLogging",
      "GET buckets.getMetadataConfiguration",
      "GET buckets.getMetadataTableConfiguration",
      "GET buckets.getMetrics",
      "GET buckets.getNotification",
      "GET buckets.getNotificationLegacy",
      "GET buckets.getObjectLockConfiguration",
      "GET buckets.getOwnershipControls",
      "GET buckets.getPolicy",
      "GET buckets.getPolicyStatus",
      "GET buckets.getPublicAccessBlock",
      "GET buckets.getReplication",
      "GET buckets.getRequestPayment",
      "GET buckets.getTagging",
      "GET buckets.getVersioning",
      "GET buckets.getWebsite",
      "HEAD buckets.head",
      "GET buckets.location",
      "GET objects.get",
      "GET objects.getAcl",
      "GET objects.getAttributes",
      "GET objects.getLegalHold",
      "GET objects.getRetention",
      "GET objects.getStream",
      "GET objects.getTagging",
      "GET objects.getTorrent",
      "HEAD objects.head",
    ]
  ),
  ...rows(
    "s3",
    {
      kind: "metered",
      unit: "requests",
      reason:
        "S3 Express One Zone us-east-1: 0.00113 USD per 1k rename requests",
      source: {
        url: "https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonS3/current/us-east-1/index.json",
        asOf: "2026-11-04",
      },
    },
    ["PUT objects.rename"]
  ),
  ...rows(
    "s3",
    {
      kind: "free",
      reason:
        "AWS S3 DELETE and CANCEL requests, including multi-object delete, are free; storage charges excluded",
      source: { url: "https://aws.amazon.com/s3/pricing/", asOf: "2026-11-04" },
    },
    [
      "DELETE buckets.del",
      "DELETE buckets.delAnalytics",
      "DELETE buckets.delCors",
      "DELETE buckets.delEncryption",
      "DELETE buckets.delIntelligentTiering",
      "DELETE buckets.delInventory",
      "DELETE buckets.delLifecycle",
      "DELETE buckets.delMetadataConfiguration",
      "DELETE buckets.delMetadataTableConfiguration",
      "DELETE buckets.delMetrics",
      "DELETE buckets.delOwnershipControls",
      "DELETE buckets.delPolicy",
      "DELETE buckets.delPublicAccessBlock",
      "DELETE buckets.delReplication",
      "DELETE buckets.delTagging",
      "DELETE buckets.delWebsite",
      "DELETE objects.abortMultipartUpload",
      "DELETE objects.del",
      "DELETE objects.delTagging",
      "POST objects.delMany",
    ]
  ),
  ...rows(
    "s3",
    {
      kind: "unpriced",
      unit: "requests",
      reason:
        "Archive storage class and retrieval tier are not modeled; ruling ac-5r6k06, no follow-up",
      source: { url: "https://aws.amazon.com/s3/pricing/", asOf: "2026-11-04" },
    },
    ["POST objects.restore"]
  ),
  ...rows(
    "s3",
    {
      kind: "unpriced",
      unit: "requests",
      reason:
        "SELECT scanned and returned bytes are not modeled; ruling ac-5r6k06, no follow-up",
      source: { url: "https://aws.amazon.com/s3/pricing/", asOf: "2026-11-04" },
    },
    ["POST objects.selectContent"]
  ),
  ...rows(
    "s3",
    {
      kind: "unpriced",
      unit: "requests",
      reason:
        "Object Lambda returned bytes and Lambda charges are not modeled; ruling ac-5r6k06, no follow-up",
      source: { url: "https://aws.amazon.com/s3/pricing/", asOf: "2026-11-04" },
    },
    ["POST objectLambda.writeGetObjectResponse"]
  ),
  ...rows(
    "s3",
    {
      kind: "unpriced",
      unit: "requests",
      reason:
        "Express session has no independently pinned per-call rate; ruling ac-5r6k06, no follow-up",
      source: { url: "https://aws.amazon.com/s3/pricing/", asOf: "2026-11-04" },
    },
    ["GET buckets.createSession"]
  ),
  ...rows(
    "s3",
    {
      kind: "unpriced",
      unit: "requests",
      reason:
        "S3 Metadata feature charges are not modeled; ruling ac-5r6k06, no follow-up",
      source: { url: "https://aws.amazon.com/s3/pricing/", asOf: "2026-11-04" },
    },
    ["POST buckets.createMetadataConfiguration"]
  ),
  ...rows(
    "s3",
    {
      kind: "unpriced",
      unit: "requests",
      reason:
        "S3 Metadata feature charges are not modeled; ruling ac-5r6k06, no follow-up",
      source: { url: "https://aws.amazon.com/s3/pricing/", asOf: "2026-11-04" },
    },
    ["POST buckets.createMetadataTableConfiguration"]
  ),
  ...rows(
    "s3",
    {
      kind: "unpriced",
      unit: "requests",
      reason:
        "S3 Metadata feature charges are not modeled; ruling ac-5r6k06, no follow-up",
      source: { url: "https://aws.amazon.com/s3/pricing/", asOf: "2026-11-04" },
    },
    ["PUT buckets.updateMetadataInventoryTable"]
  ),
  ...rows(
    "s3",
    {
      kind: "unpriced",
      unit: "requests",
      reason:
        "S3 Metadata feature charges are not modeled; ruling ac-5r6k06, no follow-up",
      source: { url: "https://aws.amazon.com/s3/pricing/", asOf: "2026-11-04" },
    },
    ["PUT buckets.updateMetadataJournalTable"]
  ),
  ...rows(
    "simplefunctions",
    {
      kind: "free",
      reason:
        "README: basic reads work without a key and a key only raises limits; no recording states a charge. simplefunctions.dev answered every plain fetch with 503, so this row is not verified upstream.",
      source: { url: "https://simplefunctions.dev/", asOf: "2026-11-04" },
    },
    [
      "GET api.agent.feed",
      "GET api.agent.inspect",
      "GET api.agent.world",
      "GET api.agent.world.delta",
      "GET api.agent.world.feed",
      "GET api.agent.world.path",
      "GET api.alertDeliveries",
      "DELETE api.alertRules",
      "GET api.alertRules",
      "POST api.alertRules.create",
      "GET api.alertRules.retrieve",
      "POST api.alertRules.test",
      "PATCH api.alertRules.update",
      "POST api.auth.cli",
      "POST api.auth.cli.complete",
      "GET api.auth.cli.poll",
      "GET api.calibration",
      "GET api.changes",
      "GET api.contracts.tools",
      "GET api.dashboard.usage",
      "DELETE api.dashboard2.marketWatch.panels",
      "POST api.dashboard2.marketWatch.panels.create",
      "POST api.dashboard2.marketWatch.panels.reorder",
      "POST api.dashboard2.marketWatch.panels.run",
      "PATCH api.dashboard2.marketWatch.panels.update",
      "GET api.dashboard2.marketWatchV2",
      "GET api.edges",
      "GET api.feed",
      "DELETE api.intents",
      "GET api.intents",
      "POST api.intents.create",
      "GET api.intents.retrieve",
      "PATCH api.intents.update",
      "DELETE api.keys",
      "GET api.keys",
      "POST api.keys.create",
      "GET api.mcp",
      "POST api.mcp.call",
      "GET api.portfolio.activity",
      "GET api.portfolio.attribution.daily",
      "GET api.portfolio.attribution.grouped",
      "GET api.portfolio.config",
      "PUT api.portfolio.config.update",
      "GET api.portfolio.fills",
      "GET api.portfolio.ledger",
      "POST api.portfolio.ledger.import.kalshi",
      "POST api.portfolio.ledger.import.kalshi.pull",
      "POST api.portfolio.ledger.import.polymarket",
      "GET api.portfolio.positions",
      "GET api.portfolio.risk",
      "DELETE api.portfolio.secrets",
      "POST api.portfolio.secrets.create",
      "GET api.portfolio.state",
      "PUT api.portfolio.state.update",
      "DELETE api.portfolio.strategy",
      "GET api.portfolio.strategy",
      "POST api.portfolio.strategy.create",
      "PUT api.portfolio.strategy.update",
      "GET api.portfolio.ticks",
      "POST api.portfolio.ticks.create",
      "GET api.portfolio.ticks.retrieve",
      "GET api.portfolio.trades",
      "POST api.portfolio.trades.create",
      "GET api.portfolio.trades.retrieve",
      "POST api.portfolio.trigger",
      "DELETE api.portfolio.views",
      "GET api.portfolio.views",
      "POST api.portfolio.views.create",
      "PUT api.portfolio.views.update",
      "GET api.prompt",
      "POST api.proxy.stt",
      "POST api.proxy.tts",
      "GET api.public.answer",
      "GET api.public.briefing",
      "GET api.public.calendar",
      "GET api.public.calibration",
      "GET api.public.congress.member",
      "GET api.public.congress.members",
      "GET api.public.contagion",
      "GET api.public.context",
      "GET api.public.crossVenue.pairs",
      "GET api.public.crossVenue.stats",
      "GET api.public.databento",
      "GET api.public.diff",
      "POST api.public.discuss",
      "GET api.public.fred",
      "GET api.public.glossary",
      "GET api.public.glossary.entry",
      "GET api.public.guide",
      "GET api.public.highlights",
      "GET api.public.ideas",
      "GET api.public.ideas.byId",
      "GET api.public.index",
      "GET api.public.index.history",
      "GET api.public.legislation",
      "GET api.public.legislation.byBillId",
      "GET api.public.liquidityByTheme",
      "GET api.public.liveTickers",
      "GET api.public.market",
      "GET api.public.market.candles",
      "GET api.public.market.history",
      "GET api.public.marketMicrostructureHistory",
      "GET api.public.markets",
      "GET api.public.newmarkets",
      "GET api.public.odds",
      "GET api.public.oddsMd",
      "GET api.public.opinions",
      "GET api.public.opinions.entry",
      "GET api.public.query",
      "GET api.public.queryEcon",
      "GET api.public.queryGov",
      "GET api.public.regime.scan",
      "GET api.public.scan",
      "GET api.public.screen",
      "GET api.public.screenByTickers",
      "GET api.public.search",
      "GET api.public.skill",
      "GET api.public.skills",
      "GET api.public.technicals",
      "GET api.public.technicals.entry",
      "GET api.public.theses",
      "GET api.public.thesis",
      "GET api.public.topic",
      "GET api.public.tradMarkets",
      "GET api.public.yieldCurves",
      "GET api.public.yieldCurves.event",
      "GET api.runtime.exec",
      "POST api.runtime.exec.trigger",
      "POST api.signup",
      "GET api.skills",
      "DELETE api.thesis",
      "GET api.thesis",
      "POST api.thesis.augment",
      "GET api.thesis.byTicker",
      "GET api.thesis.changes",
      "GET api.thesis.context",
      "POST api.thesis.create",
      "POST api.thesis.evaluate",
      "GET api.thesis.evaluations",
      "POST api.thesis.fork",
      "GET api.thesis.heartbeat",
      "PATCH api.thesis.heartbeat.update",
      "POST api.thesis.nodes",
      "DELETE api.thesis.positions",
      "POST api.thesis.positions.create",
      "GET api.thesis.positions.list",
      "PATCH api.thesis.positions.update",
      "GET api.thesis.prompt",
      "POST api.thesis.publish",
      "GET api.thesis.retrieve",
      "POST api.thesis.signal",
      "DELETE api.thesis.strategies",
      "POST api.thesis.strategies.create",
      "GET api.thesis.strategies.list",
      "PATCH api.thesis.strategies.update",
      "DELETE api.thesis.unpublish",
      "PATCH api.thesis.update",
      "GET api.thesis.videoData",
      "POST api.thesis.videos.create",
      "GET api.thesis.videos.list",
      "POST api.thesis.whatif",
      "GET api.tools",
      "DELETE api.watch",
      "GET api.watch",
      "POST api.watch.create",
      "POST api.watch.identify",
      "POST api.watch.refresh",
      "GET api.watch.retrieve",
      "PATCH api.watch.update",
      "DELETE api.webhookEndpoints",
      "GET api.webhookEndpoints",
      "POST api.webhookEndpoints.create",
      "POST api.webhookEndpoints.test",
      "PATCH api.webhookEndpoints.update",
      "GET api.x.account",
      "GET api.x.news",
      "GET api.x.search",
      "GET api.x.volume",
      "GET data.v1.candles",
      "GET data.v1.heartbeat",
      "GET data.v1.markets",
      "GET data.v1.markets.featured",
      "GET data.v1.markets.retrieve",
      "GET data.v1.movers",
      "GET data.v1.orderbook",
      "GET data.v1.search",
      "GET data.v1.snapshot",
      "GET data.v1.trades",
    ]
  ),
  ...rows(
    "telegram",
    {
      kind: "free",
      reason: "Docs: bots use the Bot API at no cost",
      source: { url: "https://core.telegram.org/bots/faq", asOf: "2026-11-04" },
    },
    [
      "POST addStickerToSet",
      "POST answerCallbackQuery",
      "POST answerChatJoinRequestQuery",
      "POST answerGuestQuery",
      "POST answerInlineQuery",
      "POST answerPreCheckoutQuery",
      "POST answerShippingQuery",
      "POST answerWebAppQuery",
      "POST approveChatJoinRequest",
      "POST approveSuggestedPost",
      "POST banChatMember",
      "POST banChatSenderChat",
      "POST close",
      "POST closeForumTopic",
      "POST closeGeneralForumTopic",
      "POST convertGiftToStars",
      "POST createChatInviteLink",
      "POST createChatSubscriptionInviteLink",
      "POST createForumTopic",
      "POST createInvoiceLink",
      "POST createNewStickerSet",
      "POST declineChatJoinRequest",
      "POST declineSuggestedPost",
      "POST deleteAllMessageReactions",
      "POST deleteBusinessMessages",
      "POST deleteChatPhoto",
      "POST deleteChatStickerSet",
      "POST deleteForumTopic",
      "POST deleteMessage",
      "POST deleteMessageReaction",
      "POST deleteMessages",
      "POST deleteMyCommands",
      "POST deleteStickerFromSet",
      "POST deleteStickerSet",
      "POST deleteStory",
      "POST deleteWebhook",
      "POST editChatInviteLink",
      "POST editChatSubscriptionInviteLink",
      "POST editForumTopic",
      "POST editGeneralForumTopic",
      "POST editMessageCaption",
      "POST editMessageChecklist",
      "POST editMessageLiveLocation",
      "POST editMessageMedia",
      "POST editMessageReplyMarkup",
      "POST editMessageText",
      "POST editStory",
      "POST editUserStarSubscription",
      "POST exportChatInviteLink",
      "POST getAvailableGifts",
      "POST getBusinessAccountGifts",
      "POST getBusinessAccountStarBalance",
      "POST getBusinessConnection",
      "POST getChat",
      "POST getChatAdministrators",
      "POST getChatGifts",
      "POST getChatMember",
      "POST getChatMemberCount",
      "POST getChatMenuButton",
      "POST getCustomEmojiStickers",
      "POST getFile",
      "POST getForumTopicIconStickers",
      "POST getGameHighScores",
      "POST getManagedBotAccessSettings",
      "POST getManagedBotToken",
      "POST getMe",
      "POST getMyCommands",
      "POST getMyDefaultAdministratorRights",
      "POST getMyDescription",
      "POST getMyName",
      "POST getMyShortDescription",
      "POST getMyStarBalance",
      "POST getStarTransactions",
      "POST getStickerSet",
      "POST getUpdates",
      "POST getUserChatBoosts",
      "POST getUserGifts",
      "POST getUserPersonalChatMessages",
      "POST getUserProfileAudios",
      "POST getUserProfilePhotos",
      "POST getWebhookInfo",
      "POST hideGeneralForumTopic",
      "POST leaveChat",
      "POST logOut",
      "POST pinChatMessage",
      "POST postStory",
      "POST promoteChatMember",
      "POST readBusinessMessage",
      "POST refundStarPayment",
      "POST removeBusinessAccountProfilePhoto",
      "POST removeChatVerification",
      "POST removeMyProfilePhoto",
      "POST removeUserVerification",
      "POST reopenForumTopic",
      "POST reopenGeneralForumTopic",
      "POST replaceManagedBotToken",
      "POST replaceStickerInSet",
      "POST repostStory",
      "POST restrictChatMember",
      "POST revokeChatInviteLink",
      "POST savePreparedInlineMessage",
      "POST savePreparedKeyboardButton",
      "POST setBusinessAccountBio",
      "POST setBusinessAccountGiftSettings",
      "POST setBusinessAccountName",
      "POST setBusinessAccountProfilePhoto",
      "POST setBusinessAccountUsername",
      "POST setChatAdministratorCustomTitle",
      "POST setChatDescription",
      "POST setChatMemberTag",
      "POST setChatMenuButton",
      "POST setChatPermissions",
      "POST setChatPhoto",
      "POST setChatStickerSet",
      "POST setChatTitle",
      "POST setCustomEmojiStickerSetThumbnail",
      "POST setGameScore",
      "POST setManagedBotAccessSettings",
      "POST setMessageReaction",
      "POST setMyCommands",
      "POST setMyDefaultAdministratorRights",
      "POST setMyDescription",
      "POST setMyName",
      "POST setMyProfilePhoto",
      "POST setMyShortDescription",
      "POST setPassportDataErrors",
      "POST setStickerEmojiList",
      "POST setStickerKeywords",
      "POST setStickerMaskPosition",
      "POST setStickerPositionInSet",
      "POST setStickerSetThumbnail",
      "POST setStickerSetTitle",
      "POST setUserEmojiStatus",
      "POST setWebhook",
      "POST stopMessageLiveLocation",
      "POST stopPoll",
      "POST unbanChatMember",
      "POST unbanChatSenderChat",
      "POST unhideGeneralForumTopic",
      "POST unpinAllChatMessages",
      "POST unpinAllForumTopicMessages",
      "POST unpinAllGeneralForumTopicMessages",
      "POST unpinChatMessage",
      "POST uploadStickerFile",
      "POST verifyChat",
      "POST verifyUser",
    ]
  ),
  ...rows(
    "telegram",
    {
      kind: "free",
      reason:
        "Docs: bots message users at no cost. Optional allow_paid_broadcast adds 0.1 Stars per message to the bot's balance.",
      source: { url: "https://core.telegram.org/bots/api", asOf: "2026-11-04" },
    },
    [
      "POST copyMessage",
      "POST copyMessages",
      "POST forwardMessage",
      "POST forwardMessages",
      "POST sendAnimation",
      "POST sendAudio",
      "POST sendChatAction",
      "POST sendChatJoinRequestWebApp",
      "POST sendChecklist",
      "POST sendContact",
      "POST sendDice",
      "POST sendDocument",
      "POST sendGame",
      "POST sendInvoice",
      "POST sendLivePhoto",
      "POST sendLocation",
      "POST sendMediaGroup",
      "POST sendMessage",
      "POST sendMessageDraft",
      "POST sendPaidMedia",
      "POST sendPhoto",
      "POST sendPoll",
      "POST sendRichMessage",
      "POST sendRichMessageDraft",
      "POST sendSticker",
      "POST sendVenue",
      "POST sendVideo",
      "POST sendVideoNote",
      "POST sendVoice",
    ]
  ),
  ...rows(
    "telegram",
    {
      kind: "unpriced",
      unit: "telegram-stars",
      reason:
        "Spends Telegram Stars from the bot's balance; Stars have no USD list rate in any table; ruling ac-stu9mv, no follow-up",
      source: { url: "https://core.telegram.org/bots/api", asOf: "2026-11-04" },
    },
    [
      "POST giftPremiumSubscription",
      "POST sendGift",
      "POST transferBusinessAccountStars",
      "POST transferGift",
      "POST upgradeGift",
    ]
  ),
  ...rows(
    "thesportsdb",
    {
      kind: "free",
      reason:
        "Free Sports API at 0 USD; premium tiers are flat and bill no per-call amount",
      source: {
        url: "https://www.thesportsdb.com/pricing",
        asOf: "2026-11-04",
      },
    },
    [
      "GET v1.allCountries",
      "GET v1.allLeagues",
      "GET v1.allSports",
      "GET v1.eventResults",
      "GET v1.eventsday",
      "GET v1.eventshighlights",
      "GET v1.eventslast",
      "GET v1.eventsnext",
      "GET v1.eventsnextleague",
      "GET v1.eventspastleague",
      "GET v1.eventsseason",
      "GET v1.eventstv",
      "GET v1.lookup.equipment",
      "GET v1.lookup.league",
      "GET v1.lookup.table",
      "GET v1.lookup.team",
      "GET v1.lookup.venue",
      "GET v1.lookupAllPlayers",
      "GET v1.lookupEvent",
      "GET v1.lookupEventStats",
      "GET v1.lookupLineup",
      "GET v1.lookupTimeline",
      "GET v1.lookupTv",
      "GET v1.lookupcontracts",
      "GET v1.lookupformerteams",
      "GET v1.lookuphonours",
      "GET v1.lookupmilestones",
      "GET v1.lookupplayer",
      "GET v1.lookupplayerstats",
      "GET v1.playerresults",
      "GET v1.searchAllLeagues",
      "GET v1.searchAllSeasons",
      "GET v1.searchAllTeams",
      "GET v1.searchEvents",
      "GET v1.searchFilename",
      "GET v1.searchPlayers",
      "GET v1.searchTeams",
      "GET v1.searchVenues",
      "GET v2.all.countries",
      "GET v2.all.leagues",
      "GET v2.all.sports",
      "GET v2.filter.tv.channel",
      "GET v2.filter.tv.channelid",
      "GET v2.filter.tv.country",
      "GET v2.filter.tv.day",
      "GET v2.filter.tv.sport",
      "GET v2.list.players",
      "GET v2.list.seasonposters",
      "GET v2.list.seasons",
      "GET v2.list.teams",
      "GET v2.livescore.all",
      "GET v2.livescore.byLeague",
      "GET v2.livescore.bySport",
      "GET v2.lookup.event",
      "GET v2.lookup.eventHighlights",
      "GET v2.lookup.eventLineup",
      "GET v2.lookup.eventResults",
      "GET v2.lookup.eventStats",
      "GET v2.lookup.eventTimeline",
      "GET v2.lookup.eventTv",
      "GET v2.lookup.league",
      "GET v2.lookup.player",
      "GET v2.lookup.playerContracts",
      "GET v2.lookup.playerHonours",
      "GET v2.lookup.playerMilestones",
      "GET v2.lookup.playerResults",
      "GET v2.lookup.playerStats",
      "GET v2.lookup.playerTeams",
      "GET v2.lookup.team",
      "GET v2.lookup.teamEquipment",
      "GET v2.lookup.venue",
      "GET v2.schedule.full.team",
      "GET v2.schedule.league",
      "GET v2.schedule.next.league",
      "GET v2.schedule.next.team",
      "GET v2.schedule.next.venue",
      "GET v2.schedule.previous.league",
      "GET v2.schedule.previous.team",
      "GET v2.schedule.previous.venue",
      "GET v2.search.event",
      "GET v2.search.league",
      "GET v2.search.player",
      "GET v2.search.team",
      "GET v2.search.venue",
    ]
  ),
  ...rows(
    "tiktok-creative-center",
    {
      kind: "free",
      reason: "Unofficial public page data with no key; no price",
      source: {
        url: "https://ads.tiktok.com/business/creativecenter/inspiration/popular/hashtag/pc/en",
        asOf: "2026-11-04",
      },
    },
    [
      "GET ads.creativeOne.report.creativeCenterGetTopContentsList",
      "GET ads.creativeOne.report.getTopContentsOverview",
    ]
  ),
  ...rows(
    "wavespeed",
    {
      kind: "metered",
      unit: "seconds",
      source: {
        url: "https://wavespeed.ai/models/alibaba/happyhorse-1.0/video-edit",
        asOf: "2026-11-06",
      },
    },
    ["POST api.v3.alibaba.happyhorse1p0.videoEdit"]
  ),
  ...rows(
    "wavespeed",
    {
      kind: "metered",
      unit: "seconds",
      source: {
        url: "https://wavespeed.ai/models/alibaba/happyhorse-1.1/image-to-video",
        asOf: "2026-11-04",
      },
    },
    ["POST api.v3.alibaba.happyhorse1p1.imageToVideo"]
  ),
  ...rows(
    "wavespeed",
    {
      kind: "metered",
      unit: "seconds",
      source: {
        url: "https://wavespeed.ai/models/alibaba/happyhorse-1.1/reference-to-video",
        asOf: "2026-11-06",
      },
    },
    ["POST api.v3.alibaba.happyhorse1p1.referenceToVideo"]
  ),
  ...rows(
    "wavespeed",
    {
      kind: "metered",
      unit: "seconds",
      source: {
        url: "https://wavespeed.ai/models/alibaba/wan-2.7/video-edit",
        asOf: "2026-11-06",
      },
    },
    ["POST api.v3.alibaba.wan2p7.videoEdit"]
  ),
  ...rows(
    "wavespeed",
    {
      kind: "metered",
      unit: "seconds",
      source: {
        url: "https://wavespeed.ai/models/alibaba/wan-3.0/image-to-video",
        asOf: "2026-11-04",
      },
    },
    ["POST api.v3.alibaba.wan3p0.imageToVideo"]
  ),
  ...rows(
    "wavespeed",
    {
      kind: "metered",
      unit: "seconds",
      source: {
        url: "https://wavespeed.ai/models/alibaba/wan-3.0/reference-to-video",
        asOf: "2026-11-04",
      },
    },
    ["POST api.v3.alibaba.wan3p0.referenceToVideo"]
  ),
  ...rows(
    "wavespeed",
    {
      kind: "metered",
      unit: "seconds",
      source: {
        url: "https://wavespeed.ai/models/alibaba/wan-3.0/text-to-video",
        asOf: "2026-11-04",
      },
    },
    ["POST api.v3.alibaba.wan3p0.textToVideo"]
  ),
  ...rows(
    "wavespeed",
    {
      kind: "metered",
      unit: "seconds",
      source: {
        url: "https://wavespeed.ai/models/alibaba/wan-3.0/video-edit",
        asOf: "2026-11-04",
      },
    },
    ["POST api.v3.alibaba.wan3p0.videoEdit"]
  ),
  ...rows(
    "wavespeed",
    {
      kind: "metered",
      unit: "seconds",
      source: {
        url: "https://wavespeed.ai/models/black-forest-labs/flux-3/image-to-video",
        asOf: "2026-11-04",
      },
    },
    ["POST api.v3.blackForestLabs.flux3.imageToVideo"]
  ),
  ...rows(
    "wavespeed",
    {
      kind: "metered",
      unit: "seconds",
      source: {
        url: "https://wavespeed.ai/models/black-forest-labs/flux-3/text-to-video",
        asOf: "2026-11-04",
      },
    },
    ["POST api.v3.blackForestLabs.flux3.textToVideo"]
  ),
  ...rows(
    "wavespeed",
    {
      kind: "metered",
      unit: "seconds",
      source: {
        url: "https://wavespeed.ai/models/bytedance/seedance-2.0/image-to-video",
        asOf: "2026-11-04",
      },
    },
    ["POST api.v3.bytedance.seedance2p0.imageToVideo"]
  ),
  ...rows(
    "wavespeed",
    {
      kind: "metered",
      unit: "seconds",
      source: {
        url: "https://wavespeed.ai/models/bytedance/seedance-2.0/reference-to-video",
        asOf: "2026-11-06",
      },
    },
    ["POST api.v3.bytedance.seedance2p0.referenceToVideo"]
  ),
  ...rows(
    "wavespeed",
    {
      kind: "metered",
      unit: "seconds",
      source: {
        url: "https://wavespeed.ai/models/bytedance/seedance-2.0/text-to-video",
        asOf: "2026-11-04",
      },
    },
    ["POST api.v3.bytedance.seedance2p0.textToVideo"]
  ),
  ...rows(
    "wavespeed",
    {
      kind: "metered",
      unit: "seconds",
      source: {
        url: "https://wavespeed.ai/models/bytedance/seedance-2.0/video-edit",
        asOf: "2026-11-06",
      },
    },
    ["POST api.v3.bytedance.seedance2p0.videoEdit"]
  ),
  ...rows(
    "wavespeed",
    {
      kind: "metered",
      unit: "seconds",
      source: {
        url: "https://wavespeed.ai/models/bytedance/seedance-2.5/image-to-video",
        asOf: "2026-11-04",
      },
    },
    ["POST api.v3.bytedance.seedance2p5.imageToVideo"]
  ),
  ...rows(
    "wavespeed",
    {
      kind: "metered",
      unit: "seconds",
      source: {
        url: "https://wavespeed.ai/models/bytedance/seedance-2.5/reference-to-video",
        asOf: "2026-11-04",
      },
    },
    ["POST api.v3.bytedance.seedance2p5.referenceToVideo"]
  ),
  ...rows(
    "wavespeed",
    {
      kind: "metered",
      unit: "seconds",
      source: {
        url: "https://wavespeed.ai/models/bytedance/seedance-2.5/text-to-video",
        asOf: "2026-11-04",
      },
    },
    ["POST api.v3.bytedance.seedance2p5.textToVideo"]
  ),
  ...rows(
    "wavespeed",
    {
      kind: "metered",
      unit: "seconds",
      source: {
        url: "https://wavespeed.ai/models/bytedance/seedance-2.5/video-edit",
        asOf: "2026-11-04",
      },
    },
    ["POST api.v3.bytedance.seedance2p5.videoEdit"]
  ),
  ...rows(
    "wavespeed",
    {
      kind: "metered",
      unit: "seconds",
      source: {
        url: "https://wavespeed.ai/models/google/gemini-omni-1.1-flash/image-to-video",
        asOf: "2026-11-04",
      },
    },
    ["POST api.v3.google.geminiOmni1p1Flash.imageToVideo"]
  ),
  ...rows(
    "wavespeed",
    {
      kind: "metered",
      unit: "seconds",
      source: {
        url: "https://wavespeed.ai/models/google/gemini-omni-1.1-flash/reference-to-video",
        asOf: "2026-11-06",
      },
    },
    ["POST api.v3.google.geminiOmni1p1Flash.referenceToVideo"]
  ),
  ...rows(
    "wavespeed",
    {
      kind: "metered",
      unit: "seconds",
      source: {
        url: "https://wavespeed.ai/models/google/gemini-omni-1.1-flash/text-to-video",
        asOf: "2026-11-04",
      },
    },
    ["POST api.v3.google.geminiOmni1p1Flash.textToVideo"]
  ),
  ...rows(
    "wavespeed",
    {
      kind: "metered",
      unit: "seconds",
      source: {
        url: "https://wavespeed.ai/models/google/gemini-omni-1.1-flash/video-edit",
        asOf: "2026-11-04",
      },
    },
    ["POST api.v3.google.geminiOmni1p1Flash.videoEdit"]
  ),
  ...rows(
    "wavespeed",
    {
      kind: "metered",
      unit: "seconds",
      source: {
        url: "https://wavespeed.ai/models/heygen/video-1.0/reference-to-video",
        asOf: "2026-11-04",
      },
    },
    ["POST api.v3.heygen.video1p0.referenceToVideo"]
  ),
  ...rows(
    "wavespeed",
    {
      kind: "metered",
      unit: "seconds",
      source: {
        url: "https://wavespeed.ai/models/heygen/video-1.0/text-to-video",
        asOf: "2026-11-04",
      },
    },
    ["POST api.v3.heygen.video1p0.textToVideo"]
  ),
  ...rows(
    "wavespeed",
    {
      kind: "metered",
      unit: "seconds",
      source: {
        url: "https://wavespeed.ai/models/kwaivgi/kling-video-o3-pro/video-edit",
        asOf: "2026-11-06",
      },
    },
    ["POST api.v3.kwaivgi.klingVideoO3Pro.videoEdit"]
  ),
  ...rows(
    "wavespeed",
    {
      kind: "metered",
      unit: "seconds",
      source: {
        url: "https://wavespeed.ai/models/minimax/h3/image-to-video",
        asOf: "2026-11-04",
      },
    },
    ["POST api.v3.minimax.h3.imageToVideo"]
  ),
  ...rows(
    "wavespeed",
    {
      kind: "metered",
      unit: "seconds",
      source: {
        url: "https://wavespeed.ai/models/minimax/h3/reference-to-video",
        asOf: "2026-11-04",
      },
    },
    ["POST api.v3.minimax.h3.referenceToVideo"]
  ),
  ...rows(
    "wavespeed",
    {
      kind: "metered",
      unit: "seconds",
      source: {
        url: "https://wavespeed.ai/models/minimax/h3/text-to-video",
        asOf: "2026-11-04",
      },
    },
    ["POST api.v3.minimax.h3.textToVideo"]
  ),
  ...rows(
    "wavespeed",
    {
      kind: "followup",
      reason:
        "Result poll; billed on the submit it follows. Free POST /api/v3/billings/search states the charge but has no apicity endpoint.",
      source: { url: "https://wavespeed.ai/pricing", asOf: "2026-11-04" },
    },
    ["GET api.v3.predictions.result"]
  ),
  ...rows(
    "wavespeed",
    {
      kind: "metered",
      unit: "seconds",
      source: {
        url: "https://wavespeed.ai/models/runwayml/aleph-2",
        asOf: "2026-11-06",
      },
    },
    ["POST api.v3.runwayml.aleph2"]
  ),
  ...rows(
    "wavespeed",
    {
      kind: "metered",
      unit: "seconds",
      source: {
        url: "https://wavespeed.ai/models/wavespeed-ai/minimax-h3/video-edit",
        asOf: "2026-11-04",
      },
    },
    ["POST api.v3.wavespeedAi.minimaxH3.videoEdit"]
  ),
  ...rows(
    "wavespeed",
    {
      kind: "metered",
      unit: "seconds",
      source: {
        url: "https://wavespeed.ai/models/x-ai/grok-imagine-video-v1.5/image-to-video",
        asOf: "2026-11-04",
      },
    },
    ["POST api.v3.xAi.grokImagineVideoV1p5.imageToVideo"]
  ),
  ...rows(
    "wavespeed",
    {
      kind: "metered",
      unit: "seconds",
      source: {
        url: "https://wavespeed.ai/models/x-ai/grok-imagine-video-v1.5/reference-to-video",
        asOf: "2026-11-06",
      },
    },
    ["POST api.v3.xAi.grokImagineVideoV1p5.referenceToVideo"]
  ),
  ...rows(
    "x",
    {
      kind: "unpriced",
      unit: "requests",
      reason:
        "Console rate needed: no public media-upload class is published; Media Metadata is a different endpoint; follow-up ac-h2808f",
      source: {
        url: "https://docs.x.com/x-api/getting-started/pricing.md",
        asOf: "2026-11-04",
      },
    },
    [
      "GET v2.media.upload",
      "POST v2.media.upload.append",
      "POST v2.media.upload.finalize",
      "POST v2.media.upload.initialize",
    ]
  ),
  ...rows(
    "x",
    {
      kind: "metered",
      unit: "resources",
      reason:
        "Posts: Read 0.005 USD per returned resource; same resource free again within a UTC day",
      source: {
        url: "https://docs.x.com/x-api/getting-started/pricing.md",
        asOf: "2026-11-04",
      },
    },
    ["GET v2.tweets"]
  ),
  ...rows(
    "x",
    {
      kind: "metered",
      unit: "requests",
      reason: "Post: Create 0.015 USD; 0.20 with a URL; 0.010 when summoned",
      source: {
        url: "https://docs.x.com/x-api/getting-started/pricing.md",
        asOf: "2026-11-04",
      },
    },
    ["POST v2.tweets"]
  ),
  ...rows(
    "x",
    {
      kind: "metered",
      unit: "resources",
      reason:
        "User: Read 0.010 USD per returned resource; /2/users/me is not on the Owned Reads list",
      source: {
        url: "https://docs.x.com/x-api/getting-started/pricing.md",
        asOf: "2026-11-04",
      },
    },
    ["GET v2.users.me"]
  ),
  ...rows(
    "xai",
    {
      kind: "free",
      reason:
        "Management API read or write; storage bills on documents, not on this call",
      source: {
        url: "https://docs.x.ai/developers/pricing.md",
        asOf: "2026-11-04",
      },
    },
    [
      "GET managementApi.auth.teams.apiKeys",
      "GET managementApi.v1.billing.teams.postpaid.invoice.preview",
      "GET managementApi.v1.billing.teams.postpaid.spendingLimits",
      "GET managementApi.v1.billing.teams.prepaid.balance",
      "POST managementApi.v1.billing.teams.usage",
      "DELETE managementApi.v1.collections",
      "GET managementApi.v1.collections",
      "POST managementApi.v1.collections",
      "PUT managementApi.v1.collections",
      "DELETE managementApi.v1.collections.documents",
      "GET managementApi.v1.collections.documents",
      "PATCH managementApi.v1.collections.documents",
      "GET managementApi.v1.collections.documents.batchGet",
    ]
  ),
  ...rows(
    "xai",
    {
      kind: "accrual",
      unit: "gib-days",
      reason:
        "Adding a document grows collection storage, 0.10 USD per GiB per day; accrues with no per-call amount",
      source: {
        url: "https://docs.x.ai/developers/pricing.md",
        asOf: "2026-11-04",
      },
    },
    ["POST managementApi.v1.collections.documents"]
  ),
  ...rows(
    "xai",
    {
      kind: "free",
      reason:
        "Metadata, tokenizer or management call; the pricing page bills none of these",
      source: {
        url: "https://docs.x.ai/developers/pricing.md",
        asOf: "2026-11-04",
      },
    },
    [
      "GET v1.apiKey",
      "POST v1.batches",
      "POST v1.batches.cancel",
      "DELETE v1.customVoices",
      "GET v1.customVoices",
      "PATCH v1.customVoices",
      "GET v1.customVoices.audio",
      "DELETE v1.files",
      "GET v1.files",
      "POST v1.files.publicUrl",
      "POST v1.files.publicUrl.revoke",
      "GET v1.imageGenerationModels",
      "GET v1.languageModels",
      "GET v1.models",
      "DELETE v1.responses",
      "POST v1.tokenizeText",
      "GET v1.videoGenerationModels",
    ]
  ),
  ...rows(
    "xai",
    {
      kind: "followup",
      reason: "Poll or result; billed on the submit it follows",
      source: {
        url: "https://docs.x.ai/developers/pricing.md",
        asOf: "2026-11-04",
      },
    },
    [
      "GET v1.batches",
      "GET v1.batches.requests",
      "GET v1.batches.results",
      "GET v1.chat.deferredCompletion",
      "GET v1.images",
      "GET v1.responses",
      "GET v1.videos",
    ]
  ),
  ...rows(
    "xai",
    {
      kind: "accrual",
      unit: "tokens",
      reason:
        "Queued requests bill at batch rates as they complete (20% off on the listed models); no per-call amount at enqueue",
      source: {
        url: "https://docs.x.ai/developers/pricing.md",
        asOf: "2026-11-04",
      },
    },
    ["POST v1.batches.requests"]
  ),
  ...rows(
    "xai",
    {
      kind: "metered",
      unit: "tokens",
      reason:
        "Token rates include cached input and the 200K long-context tier; server-side tools bill separately.",
      source: {
        url: "https://docs.x.ai/developers/pricing.md",
        asOf: "2026-11-04",
      },
    },
    [
      "POST v1.chat.completions",
      "POST v1.responses",
      "POST v1.responses.compact",
    ]
  ),
  ...rows(
    "xai",
    {
      kind: "free",
      reason:
        "Docs: up to 30 custom voices for free; a voice bills only as TTS or voice usage",
      source: { url: "https://docs.x.ai/llms-full.txt", asOf: "2026-11-04" },
    },
    ["POST v1.customVoices"]
  ),
  ...rows(
    "xai",
    {
      kind: "metered",
      unit: "requests",
      reason: "Collections search tool, 2.50 USD per 1k calls",
      source: {
        url: "https://docs.x.ai/developers/rest-api-reference/collections/search.md",
        asOf: "2026-11-04",
      },
    },
    ["POST v1.documents.search"]
  ),
  ...rows(
    "xai",
    {
      kind: "accrual",
      unit: "gib-days",
      reason:
        "File storage 0.025 USD per GiB per day; accrues with no per-call amount",
      source: {
        url: "https://docs.x.ai/developers/pricing.md",
        asOf: "2026-11-04",
      },
    },
    ["POST v1.files"]
  ),
  ...rows(
    "xai",
    {
      kind: "metered",
      unit: "gib-downloaded",
      reason: "File downloads bill 0.20 USD per GiB transferred",
      source: {
        url: "https://docs.x.ai/developers/pricing.md",
        asOf: "2026-11-04",
      },
    },
    ["GET v1.files.content"]
  ),
  ...rows(
    "xai",
    {
      kind: "metered",
      unit: "images",
      reason:
        "Edits also bill the input image; usage.cost_in_usd_ticks states the charge",
      source: {
        url: "https://docs.x.ai/developers/pricing.md",
        asOf: "2026-11-04",
      },
    },
    ["POST v1.images.edits", "POST v1.images.generations"]
  ),
  ...rows(
    "xai",
    {
      kind: "free",
      reason:
        "Mints an ephemeral token; the voice session bills 0.08 USD per minute on the socket, outside this call",
      source: {
        url: "https://docs.x.ai/developers/pricing.md",
        asOf: "2026-11-04",
      },
    },
    ["POST v1.realtime.clientSecrets"]
  ),
  ...rows(
    "xai",
    {
      kind: "metered",
      unit: "seconds",
      reason: "0.10 USD per hour on REST, 0.20 streaming",
      source: {
        url: "https://docs.x.ai/developers/pricing.md",
        asOf: "2026-11-04",
      },
    },
    ["POST v1.stt"]
  ),
  ...rows(
    "xai",
    {
      kind: "metered",
      unit: "characters",
      reason: "15 USD per 1M characters",
      source: {
        url: "https://docs.x.ai/developers/pricing.md",
        asOf: "2026-11-04",
      },
    },
    ["POST v1.tts"]
  ),
  ...rows(
    "xai",
    {
      kind: "metered",
      unit: "seconds",
      source: {
        url: "https://docs.x.ai/developers/pricing.md",
        asOf: "2026-11-04",
      },
    },
    [
      "POST v1.videos.edits",
      "POST v1.videos.extensions",
      "POST v1.videos.generations",
      "POST v1.videos.generations.imageToVideo",
    ]
  ),
  ...rows(
    "youtube",
    {
      kind: "free",
      reason: "Quota units against a daily allowance, not USD",
      source: {
        url: "https://developers.google.com/youtube/v3/determine_quota_cost",
        asOf: "2026-11-04",
      },
    },
    [
      "GET channels.list",
      "GET transcripts",
      "? videoMetadata",
      "POST videos.insert",
      "GET videos.list",
    ]
  ),
  ...rows(
    "zaicoding",
    {
      kind: "subscription",
      unit: "tokens",
      reason:
        "GLM Coding Plan: flat from 18 USD a month with 5-hour and weekly credit allowances, zero marginal USD. The list rate is for comparison.",
      source: { url: "https://docs.z.ai/devpack/overview", asOf: "2026-11-04" },
    },
    ["POST api.coding.paas.v4.chat.completions"]
  ),
  ...rows(
    "zaicoding",
    {
      kind: "free",
      reason: "Plan usage read; no charge",
      source: { url: "https://docs.z.ai/devpack/overview", asOf: "2026-11-04" },
    },
    [
      "GET api.monitor.usage.modelUsage",
      "GET api.monitor.usage.quota.limit",
      "GET api.monitor.usage.toolUsage",
    ]
  ),
];

/** Most specific policy wins; provider defaults remain unpriced. */
export function resolveEndpointBillingPolicy(
  provider: string,
  method: string,
  dotPath: string
): EndpointBillingPolicy | undefined {
  let best: EndpointBillingPolicy | undefined;
  let score = -1;
  for (const policy of ENDPOINT_BILLING) {
    const m = policy.match;
    if (
      m.provider !== provider ||
      (m.method !== undefined && m.method !== method) ||
      (m.dotPath !== undefined && m.dotPath !== dotPath)
    )
      continue;
    const next =
      (m.dotPath === undefined ? 0 : 2) + (m.method === undefined ? 0 : 1);
    if (next > score) {
      best = policy;
      score = next;
    }
  }
  return best;
}

/** Total, local and fail-closed, including unknown rows of known providers. */
export function endpointBilling(
  provider: string,
  method: string,
  dotPath: string
): EndpointBilling {
  const billing = resolveEndpointBillingPolicy(provider, method, dotPath)
    ?.billing ?? {
    kind: "unpriced" as const,
    reason: "No reviewed billing record for this endpoint",
  };
  return {
    provider,
    method,
    dotPath,
    ...billing,
    ...(billing.source ? { source: { ...billing.source } } : {}),
  };
}
