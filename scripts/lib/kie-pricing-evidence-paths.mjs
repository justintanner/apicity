// When new evidence lands, the stamp is the only line to edit. The refresh
// entrypoint and guard test consume the evidence paths; the reconciliation
// library consumes only KIE_PRICING_REFRESH_COMMAND.
export const KIE_PRICING_EVIDENCE_DIR = "tests/fixtures/kie-pricing-evidence";
export const KIE_PRICING_EVIDENCE_STAMP = "2026-08-25T06-31-02-421Z";
export const KIE_PRICING_SNAPSHOT_PATH = `${KIE_PRICING_EVIDENCE_DIR}/kie-pricing-snapshot-${KIE_PRICING_EVIDENCE_STAMP}.json`;
export const KIE_PRICING_METADATA_PATH = `${KIE_PRICING_EVIDENCE_DIR}/kie-pricing-pull-${KIE_PRICING_EVIDENCE_STAMP}.json`;
export const KIE_PRICING_MANIFEST_PATH = `${KIE_PRICING_EVIDENCE_DIR}/kie-pricing-reconciliation-${KIE_PRICING_EVIDENCE_STAMP}.json`;
export const KIE_PRICING_REFRESH_COMMAND = "pnpm run gen:kie-pricing-manifest";
export const KIE_PRICING_CHECK_COMMAND =
  "pnpm run gen:kie-pricing-manifest:check";
