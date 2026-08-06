import { describe, it, expect } from "vitest";
import {
  RecraftCrispUpscaleRequestSchema,
  RecraftRemoveBackgroundRequestSchema,
  KieMediaModelSchema,
  CreateTaskRequestSchema,
} from "../../packages/provider/kie/src/zod";
import { CREATE_TASK_GUARDS } from "../../packages/provider/kie/src/kie";
import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";

describe("Recraft createTask models (ac-cq6zuy)", () => {
  const models = [
    "recraft/crisp-upscale",
    "recraft/remove-background",
  ] as const;

  it.each(models)("lists %s on KieMediaModelSchema", (model) => {
    expect(KieMediaModelSchema.safeParse(model).success).toBe(true);
  });

  it("validates crisp-upscale request via dedicated schema and guard", () => {
    const req = {
      model: "recraft/crisp-upscale" as const,
      input: {
        image:
          "https://file.aiquickdraw.com/custom-page/akr/section-images/x.jpg",
      },
    };
    expect(RecraftCrispUpscaleRequestSchema.safeParse(req).success).toBe(true);
    expect(CREATE_TASK_GUARDS[req.model].safeParse(req).success).toBe(true);
    expect(CreateTaskRequestSchema.safeParse(req).success).toBe(true);
  });

  it("validates remove-background request via dedicated schema and guard", () => {
    const req = {
      model: "recraft/remove-background" as const,
      callBackUrl: "https://example.com/cb",
      input: {
        image:
          "https://file.aiquickdraw.com/custom-page/akr/section-images/x.webp",
      },
    };
    expect(RecraftRemoveBackgroundRequestSchema.safeParse(req).success).toBe(
      true
    );
    expect(CREATE_TASK_GUARDS[req.model].safeParse(req).success).toBe(true);
    expect(CreateTaskRequestSchema.safeParse(req).success).toBe(true);
  });

  it("rejects missing image", () => {
    expect(
      RecraftCrispUpscaleRequestSchema.safeParse({
        model: "recraft/crisp-upscale",
        input: {},
      }).success
    ).toBe(false);
  });

  it("exposes modelInputSchemas for both models", () => {
    for (const model of models) {
      expect(modelInputSchemas[model]).toBeDefined();
      expect(modelInputSchemas[model].type).toBe("image");
      expect(modelInputSchemas[model].fields.image?.required).toBe(true);
    }
  });
});
