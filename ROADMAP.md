# Apicity Roadmap

## Active Initiatives

### Cost Control: API Endpoint Gates

A major priority is adding **gates for expensive API endpoints** to prevent LLM-driven agents from incurring unexpected costs.

**Context:**  Apicity exposes many third-party API integrations. Some of these APIs are free or low-cost, but several are metered and can become expensive if hit repeatedly (e.g., LLM inference, image generation, financial market data).  When a polecat or refinery is running autonomously, there is no human in the loop to approve each request.  We need a hard gate that defaults to "safe".

**Goals:**
- Identify every integration endpoint that has non-zero marginal cost.
- Assign a **cost tier** to each: `free`, `cheap`, `expensive`, `prohibitive`.
- Implement a **gate system** that checks the cost tier before dispatching a request.
- For `expensive` and `prohibitive` tiers, require explicit **human or budget-token approval** before execution.
- Make the gate system **configurable per-rig** so that different deployments can have different cost policies.
- Ensure that **test suites** (especially integration tests) can still run against real endpoints when explicitly authorized, but default to mock/replay mode otherwise.

**Proposed Gate Types:**
1. **Static Deny List** — hard block on known expensive endpoints.
2. **Budget Token** — each expensive call consumes a token; when tokens are exhausted, requests are blocked.
3. **Replay-only Mode** — for integration tests, if no recording exists, the test is skipped instead of making a live call.
4. **Rate Limit** — per-API, per-hour, per-deployment limits.

**Affected Areas:**
- `src/api/integrations/` — all API integration layers.
- `tests/integration/` — integration tests that hit live APIs.
- `tests/harness.ts` — Polly recording setup and `recordingExists()` guards.
- `.github/workflows/ci.yml` — CI configuration that controls which tests run live.

**Related Work:**
- The `recordingExists()` guards recently added in `b67780a` are a step toward replay-only mode.  We need to extend this pattern to cover all expensive integrations.
- The Polly-based recording system already provides the infrastructure for replay vs. record.  The gate system should plug into this.

**Status:**
- Design phase.  No implementation yet.
- Needs a decision on whether to enforce at the integration layer (in `src/api/integrations/`) or at the test layer (in `tests/harness.ts`).
- Probably needs both: a runtime gate for the application and a test gate for the test suite.
