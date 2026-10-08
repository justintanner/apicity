import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalMinimaxH3MaxCameraControlsParsedRequest,
  type FalMinimaxH3MaxCameraControlsRequest,
  type FalMinimaxH3MaxCameraControlsRequestInput,
  type FalMinimaxH3MaxCameraControlsResponse,
} from "@apicity/fal";
import {
  FalMinimaxH3MaxCameraControlsRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
import {
  fal as falPricing,
  FAL_DYNAMIC_PRICING_ENDPOINTS,
} from "../../packages/provider/cost/src/pricing/fal";
import {
  MODEL_DISPLAY,
  MODEL_SLUGS,
} from "../../packages/provider/cost/src/slugs";

// Pinned against the live queue OpenAPI read on 2026-10-07 (sha256
// 5f99c76b3ded884165dd8b937fd0b8424da53112aae3c26f34204941fa851407) and the
// unbilled 422 probes of the same day, which showed that upstream requires
// `image_url` alone, closes `prompt_expansion_mode`, bounds the keyframes as
// documented, and refuses non-increasing keyframe times and more than 32 turns
// of summed azimuth travel.
const endpoint = "minimax/h3-max/camera-controls";
const input = { image_url: "https://example.com/first.jpg" };
const defaultPrompt =
  "The same elements in the reference are rigid. Preserve every element exactly. The entire scene is frozen. Only the camera moves. no scene motion only camera motion";
// The schema's own example trajectory, which the recording also sends.
const exampleTrajectory = [
  { time: 0, azimuth: 0, elevation: 0, distance: 1 },
  { time: 0.3, azimuth: 45, elevation: 15, distance: 0.2 },
  { time: 0.8, azimuth: 90, elevation: -90, distance: 1 },
];

function keyframe(
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  return { time: 0, azimuth: 0, elevation: 0, distance: 1, ...overrides };
}

// Keyframes at evenly spaced times through the given azimuths.
function orbit(...azimuths: number[]) {
  return azimuths.map((azimuth, i) =>
    keyframe({ time: i / (azimuths.length - 1), azimuth })
  );
}

// Two keyframes, at times 0 and 1, with one field set on the end whose time
// order the value keeps, so that field's own bound alone decides.
function withField(key: string, value: unknown) {
  const trajectory = [keyframe({ time: 0 }), keyframe({ time: 1 })];
  const at = key === "time" && typeof value === "number" && value <= 0 ? 0 : 1;
  trajectory[at] = { ...trajectory[at], [key]: value };
  return trajectory;
}

function accepts(camera_trajectory: unknown): boolean {
  return schema.safeParse({ ...input, camera_trajectory }).success;
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("MiniMax H3 Max camera controls contract", () => {
  it("exposes the schema on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.minimax.h3Max.cameraControls;
    expect(leaf).toBe(provider.post.run.minimax.h3Max.cameraControls);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    // Compile-time only: the public request types and the three documented
    // Output members with the File shape, optionality included.
    expectTypeOf<FalMinimaxH3MaxCameraControlsRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalMinimaxH3MaxCameraControlsRequestInput>().toEqualTypeOf<FalMinimaxH3MaxCameraControlsRequest>();
    expectTypeOf<FalMinimaxH3MaxCameraControlsParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalMinimaxH3MaxCameraControlsResponse>().toEqualTypeOf<{
      video: {
        url: string;
        content_type?: string | null;
        file_name?: string | null;
        file_size?: number | null;
      };
      expanded_prompt?: string | null;
      timings?: Record<string, number> | null;
    }>();
  });

  it("posts the body unchanged to fal.run with the key header", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      jsonResponse({
        video: { url: "https://example.com/out.mp4" },
        expanded_prompt: null,
        timings: null,
      })
    );
    const provider = createFal({
      apiKey: "fal-test-key",
      fetch: mockFetch as unknown as typeof fetch,
    });
    const body = {
      ...input,
      prompt: "Orbit around the subject.",
      duration: 0.92,
      resolution: "480P" as const,
      prompt_expansion_mode: "disabled" as const,
      camera_trajectory: exampleTrajectory,
    };
    const result = await provider.run.minimax.h3Max.cameraControls(body);
    expect(result.video.url).toBe("https://example.com/out.mp4");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe("https://fal.run/minimax/h3-max/camera-controls");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Key fal-test-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual(body);
  });

  it("requires only the image URL and applies the documented defaults", () => {
    expect(schema.parse(input)).toStrictEqual({
      ...input,
      prompt: defaultPrompt,
      duration: 5,
      resolution: "480P",
      enable_safety_checker: true,
      sync_mode: false,
      prompt_expansion_mode: "balanced",
    });
    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.safeParse({ prompt: "Orbit." }).success).toBe(false);
    expect(schema.safeParse({ image_url: "" }).success).toBe(false);
  });

  it("takes a blank prompt and caps it at 50,000 characters", () => {
    expect(schema.safeParse({ ...input, prompt: "" }).success).toBe(true);
    expect(
      schema.safeParse({ ...input, prompt: "p".repeat(50000) }).success
    ).toBe(true);
    expect(
      schema.safeParse({ ...input, prompt: "p".repeat(50001) }).success
    ).toBe(false);
  });

  it.each([0.92, 1, 5.5, 15])("accepts duration %s", (duration) =>
    expect(schema.safeParse({ ...input, duration }).success).toBe(true)
  );

  it.each([0, 0.91, 15.1, "5"])("rejects duration %s", (duration) =>
    expect(schema.safeParse({ ...input, duration }).success).toBe(false)
  );

  it.each(["480P", "768P", "1080P"])("accepts resolution %s", (resolution) =>
    expect(schema.safeParse({ ...input, resolution }).success).toBe(true)
  );

  it.each(["2K", "4K", "720P", "480p"])("rejects resolution %s", (resolution) =>
    expect(schema.safeParse({ ...input, resolution }).success).toBe(false)
  );

  it("takes the four expansion modes upstream's validator accepts", () => {
    for (const mode of ["disabled", "fast", "balanced", "quality"]) {
      expect(
        schema.safeParse({ ...input, prompt_expansion_mode: mode }).success,
        mode
      ).toBe(true);
    }
    for (const mode of ["bogus", "", null]) {
      expect(
        schema.safeParse({ ...input, prompt_expansion_mode: mode }).success,
        String(mode)
      ).toBe(false);
    }
  });

  it.each([null, 0, 42])("accepts seed %s", (seed) =>
    expect(schema.safeParse({ ...input, seed }).success).toBe(true)
  );

  it("rejects a fractional seed", () =>
    expect(schema.safeParse({ ...input, seed: 1.5 }).success).toBe(false));

  it.each(["enable_safety_checker", "sync_mode"])(
    "takes a boolean %s only",
    (key) => {
      expect(schema.safeParse({ ...input, [key]: false }).success).toBe(true);
      expect(schema.safeParse({ ...input, [key]: "false" }).success).toBe(
        false
      );
    }
  );

  it("leaves the trajectory to upstream when it is omitted", () => {
    expect(schema.parse(input)).not.toHaveProperty("camera_trajectory");
    expect(accepts(exampleTrajectory)).toBe(true);
    expect(
      schema.parse({ ...input, camera_trajectory: exampleTrajectory })
    ).toHaveProperty("camera_trajectory", exampleTrajectory);
  });

  it("takes 2 to 12 keyframes", () => {
    expect(accepts([])).toBe(false);
    expect(accepts([keyframe()])).toBe(false);
    expect(accepts(orbit(0, 10))).toBe(true);
    expect(accepts(orbit(...Array.from({ length: 12 }, (_, i) => i)))).toBe(
      true
    );
    expect(accepts(orbit(...Array.from({ length: 13 }, (_, i) => i)))).toBe(
      false
    );
  });

  it.each(["time", "azimuth", "elevation", "distance"])(
    "requires %s on every keyframe",
    (key) => {
      const partial: Record<string, unknown> = keyframe({ time: 1 });
      delete partial[key];
      expect(accepts([keyframe(), partial])).toBe(false);
    }
  );

  it.each([
    ["time", 0],
    ["time", 1],
    ["elevation", -90],
    ["elevation", 90],
    ["distance", 0.001],
    ["azimuth", -720],
  ] as const)("accepts %s %s on a keyframe", (key, value) =>
    expect(accepts(withField(key, value))).toBe(true)
  );

  it.each([
    ["time", -0.1],
    ["time", 1.1],
    ["elevation", -91],
    ["elevation", 91],
    ["distance", 0],
    ["distance", -1],
    ["azimuth", "left"],
  ] as const)("rejects %s %s on a keyframe", (key, value) =>
    expect(accepts(withField(key, value))).toBe(false)
  );

  it("needs strictly increasing keyframe times", () => {
    expect(
      accepts([keyframe({ time: 0.5 }), keyframe({ time: 0.5, azimuth: 10 })])
    ).toBe(false);
    expect(
      accepts([keyframe({ time: 0.8 }), keyframe({ time: 0.2, azimuth: 10 })])
    ).toBe(false);
    expect(
      accepts([keyframe({ time: 0.2 }), keyframe({ time: 0.8, azimuth: 10 })])
    ).toBe(true);
  });

  it("caps the summed azimuth travel at 32 turns, as upstream does", () => {
    // Each leg counts by its absolute change, so an out-and-back trajectory
    // spends its travel twice although it ends where it started.
    expect(accepts(orbit(0, 11520))).toBe(true);
    expect(accepts(orbit(0, 11521))).toBe(false);
    expect(accepts(orbit(0, -11521))).toBe(false);
    expect(accepts(orbit(0, 5760, 0))).toBe(true);
    expect(accepts(orbit(0, 5761, 0))).toBe(false);
  });

  it("strips the siblings' fields, which it does not document", () => {
    const parsed = schema.parse({
      ...input,
      end_image_url: "https://example.com/last.jpg",
      target_audio_url: "https://example.com/a.wav",
      aspect_ratio: "16:9",
    });
    expect(parsed).not.toHaveProperty("end_image_url");
    expect(parsed).not.toHaveProperty("target_audio_url");
    expect(parsed).not.toHaveProperty("aspect_ratio");
  });

  it("describes every documented field without billing claims", () => {
    expect(Object.keys(schema.shape)).toEqual([
      "prompt",
      "duration",
      "resolution",
      "seed",
      "enable_safety_checker",
      "sync_mode",
      "prompt_expansion_mode",
      "image_url",
      "camera_trajectory",
    ]);
    const pose = schema.shape.camera_trajectory.unwrap().element;
    expect(Object.keys(pose.shape)).toEqual([
      "time",
      "azimuth",
      "elevation",
      "distance",
    ]);
    const fields = [
      ...Object.entries(schema.shape),
      ...Object.entries(pose.shape),
      ["camera_trajectory item", pose] as const,
    ];
    for (const [key, field] of fields) {
      expect(field.description, key).toBeTruthy();
      expect(field.description ?? "", key).not.toMatch(/bill|price|\$|USD/i);
    }
  });

  // Static branch (P-7): the recorded 480P call asked for 0.92 s and fal
  // billed x-fal-billable-units 0.92, which its usage API priced at the
  // card's promotional $0.03/s. The entry carries the post-promotion list
  // rates (OQ-3), so the recorded payload estimates at 0.92 x $0.05.
  it.each([
    ["480P", 0.05],
    ["768P", 0.08],
    ["1080P", 0.16],
  ] as const)(
    "prices %s at its list rate per requested second",
    (tier, rate) => {
      const estimate = computeEstimate({
        provider: "fal",
        endpoint,
        payload: { ...input, resolution: tier, duration: 2 },
      });
      expect(estimate.usd).toBeCloseTo(rate * 2);
      expect(estimate.warnings).toEqual([]);
    }
  );

  it("prices the recorded fractional duration exactly", () =>
    expect(
      computeEstimate({
        provider: "fal",
        endpoint,
        payload: { ...input, resolution: "480P", duration: 0.92 },
      }).usd
    ).toBeCloseTo(0.046));

  it("prices the default five seconds at 480P", () =>
    expect(
      computeEstimate({ provider: "fal", endpoint, payload: input }).usd
    ).toBeCloseTo(0.25));

  it("does not price by camera trajectory", () =>
    expect(
      computeEstimate({
        provider: "fal",
        endpoint,
        payload: { ...input, camera_trajectory: orbit(0, 11520) },
      }).usd
    ).toBeCloseTo(0.25));

  it("is statically priced, with a slug and a display name", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).not.toContain(endpoint);
    expect(falPricing[endpoint]?.source).toEqual({
      url: "https://fal.ai/models/minimax/h3-max/camera-controls",
      asOf: "2026-10-07",
    });
    expect((MODEL_SLUGS.fal as Record<string, string>)[endpoint]).toBe("h3mcc");
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "H3 Max Camera Controls"
    );
  });
});
