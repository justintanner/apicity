import { describe, it, expect } from "vitest";
import {
  Omnihuman15HumanIdentificationRequestSchema,
  Omnihuman15SubjectDetectionRequestSchema,
  KieMediaModelSchema,
  CreateTaskRequestSchema,
} from "../../packages/provider/kie/src/zod";
import { CREATE_TASK_GUARDS } from "../../packages/provider/kie/src/kie";
import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";

describe("Omnihuman 1.5 sub-tasks createTask models (ac-v921wc)", () => {
  const models = [
    "omnihuman-1-5/human-identification",
    "omnihuman-1-5/subject-detection",
  ] as const;

  it.each(models)("lists %s on KieMediaModelSchema", (model) => {
    expect(KieMediaModelSchema.safeParse(model).success).toBe(true);
  });

  it("validates human-identification via dedicated schema and guard", () => {
    const req = {
      model: "omnihuman-1-5/human-identification" as const,
      callBackUrl: "https://example.com/api/callback",
      input: {
        image_url: "https://your-domain.com/image/portrait.png",
      },
    };
    expect(
      Omnihuman15HumanIdentificationRequestSchema.safeParse(req).success
    ).toBe(true);
    expect(CREATE_TASK_GUARDS[req.model].safeParse(req).success).toBe(true);
    expect(CreateTaskRequestSchema.safeParse(req).success).toBe(true);
  });

  it("validates subject-detection via dedicated schema and guard", () => {
    const req = {
      model: "omnihuman-1-5/subject-detection" as const,
      input: {
        image_url: "https://your-domain.com/image/portrait.png",
      },
    };
    expect(
      Omnihuman15SubjectDetectionRequestSchema.safeParse(req).success
    ).toBe(true);
    expect(CREATE_TASK_GUARDS[req.model].safeParse(req).success).toBe(true);
    expect(CreateTaskRequestSchema.safeParse(req).success).toBe(true);
  });

  it("rejects human-identification without image_url", () => {
    expect(
      Omnihuman15HumanIdentificationRequestSchema.safeParse({
        model: "omnihuman-1-5/human-identification",
        input: {},
      }).success
    ).toBe(false);
  });

  it("rejects subject-detection with a non-URL image_url", () => {
    expect(
      Omnihuman15SubjectDetectionRequestSchema.safeParse({
        model: "omnihuman-1-5/subject-detection",
        input: {
          image_url: "not-a-url",
        },
      }).success
    ).toBe(false);
  });

  it("rejects bad callBackUrl on human-identification", () => {
    expect(
      Omnihuman15HumanIdentificationRequestSchema.safeParse({
        model: "omnihuman-1-5/human-identification",
        callBackUrl: "not-a-url",
        input: {
          image_url: "https://example.com/portrait.png",
        },
      }).success
    ).toBe(false);
  });

  it("exposes modelInputSchemas for both sub-task models", () => {
    expect(modelInputSchemas["omnihuman-1-5/human-identification"].type).toBe(
      "image"
    );
    expect(
      modelInputSchemas["omnihuman-1-5/human-identification"].fields.image_url
        ?.required
    ).toBe(true);
    expect(modelInputSchemas["omnihuman-1-5/subject-detection"].type).toBe(
      "image"
    );
    expect(
      modelInputSchemas["omnihuman-1-5/subject-detection"].fields.image_url
        ?.required
    ).toBe(true);
  });
});
