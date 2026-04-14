import { afterEach, describe, expect, it, vi } from "vitest";
import { fireworks } from "@apicity/fireworks";

import type { FireworksModel } from "../../../packages/provider/fireworks/src/types";

function createJsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

type PreparationStage = "pending" | "preparing" | "ready" | "failed";

function interpretPreparationState(
  model: Pick<FireworksModel, "state" | "status">
): PreparationStage {
  if (model.status?.code && model.status.code !== "OK") {
    return "failed";
  }

  if (model.state !== "READY") {
    return "pending";
  }

  if ((model.status?.message ?? "").toLowerCase().includes("prepar")) {
    return "preparing";
  }

  return "ready";
}

describe("fireworks model preparation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts prepare requests and surfaces a stable preparation-state progression", async () => {
    const snapshots: FireworksModel[] = [
      {
        state: "UPLOADING",
        status: { code: "OK", message: "Waiting for upload validation" },
      },
      {
        state: "READY",
        status: { code: "OK", message: "Preparing model weights" },
      },
      {
        state: "READY",
        status: { code: "OK", message: "" },
      },
      {
        state: "READY",
        status: {
          code: "FAILED_PRECONDITION",
          message: "Calibration failed for FP8",
        },
      },
    ];

    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(createJsonResponse({}))
      .mockResolvedValueOnce(createJsonResponse(snapshots[0]))
      .mockResolvedValueOnce(createJsonResponse(snapshots[1]))
      .mockResolvedValueOnce(createJsonResponse(snapshots[2]))
      .mockResolvedValueOnce(createJsonResponse(snapshots[3]));

    const provider = fireworks({ apiKey: "fw-test-key", fetch: mockFetch });

    await provider.inference.v1.accounts.models.prepare(
      "acct-123",
      "model-456",
      {
        precision: "FP8",
        readMask: "state,status",
      }
    );

    const stages: PreparationStage[] = [];

    for (let i = 0; i < snapshots.length; i++) {
      const model = await provider.inference.v1.accounts.models.get(
        "acct-123",
        "model-456",
        {
          readMask: "state,status",
        }
      );
      stages.push(interpretPreparationState(model));
    }

    expect(stages).toEqual(["pending", "preparing", "ready", "failed"]);
    expect(mockFetch).toHaveBeenCalledTimes(5);

    expect(mockFetch.mock.calls[0][0]).toBe(
      "https://api.fireworks.ai/v1/accounts/acct-123/models/model-456:prepare"
    );
    expect(mockFetch.mock.calls[0][1]).toMatchObject({
      method: "POST",
      headers: {
        Authorization: "Bearer fw-test-key",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        precision: "FP8",
        readMask: "state,status",
      }),
    });

    expect(mockFetch.mock.calls[1][0]).toBe(
      "https://api.fireworks.ai/v1/accounts/acct-123/models/model-456?readMask=state%2Cstatus"
    );
    expect(mockFetch.mock.calls[1][1]).toMatchObject({
      method: "GET",
      headers: {
        Authorization: "Bearer fw-test-key",
      },
    });
  });
});

describe("fireworks dataset upload validation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts validateUpload to the dataset-specific endpoint and defaults to an empty payload", async () => {
    const mockFetch = vi.fn().mockResolvedValue(createJsonResponse({}));
    const provider = fireworks({ apiKey: "fw-test-key", fetch: mockFetch });

    await provider.inference.v1.accounts.datasets.validateUpload(
      "acct-123",
      "dataset-456"
    );

    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url, init] = mockFetch.mock.calls[0];

    expect(url).toBe(
      "https://api.fireworks.ai/v1/accounts/acct-123/datasets/dataset-456:validateUpload"
    );
    expect(init).toMatchObject({
      method: "POST",
      headers: {
        Authorization: "Bearer fw-test-key",
        "Content-Type": "application/json",
      },
      body: "{}",
    });
  });

  it("enforces dataset field requirements and format enums around upload flows via Zod", () => {
    const provider = fireworks({ apiKey: "fw-test-key" });

    const missingCreateFields =
      provider.inference.v1.accounts.datasets.create.schema.safeParse({});
    const invalidFormat =
      provider.inference.v1.accounts.datasets.update.schema.safeParse({
        format: "CSV",
      });
    const missingUploadFiles =
      provider.inference.v1.accounts.datasets.getUploadEndpoint.schema.safeParse(
        {}
      );
    const emptyValidateUpload =
      provider.inference.v1.accounts.datasets.validateUpload.schema.safeParse(
        {}
      );

    expect(missingCreateFields.success).toBe(false);
    expect(
      missingCreateFields.error?.issues.some((i) => i.path.includes("dataset"))
    ).toBe(true);
    expect(
      missingCreateFields.error?.issues.some((i) =>
        i.path.includes("datasetId")
      )
    ).toBe(true);

    expect(invalidFormat.success).toBe(false);
    expect(
      invalidFormat.error?.issues.some((i) => i.path.includes("format"))
    ).toBe(true);

    expect(missingUploadFiles.success).toBe(false);
    expect(
      missingUploadFiles.error?.issues.some((i) =>
        i.path.includes("filenameToSize")
      )
    ).toBe(true);

    expect(emptyValidateUpload.success).toBe(true);
  });
});
