import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalFlux3ActionSo101Request,
  type FalFlux3ActionSo101RequestInput,
  type FalFlux3ActionSo101ParsedRequest,
  type FalFlux3ActionSo101Response,
  type FalRunFlux3ActionNamespace,
} from "@apicity/fal";
import {
  FalFlux3ActionSo101RequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
import {
  FAL_DYNAMIC_PRICING_ENDPOINTS,
  fal as pricing,
} from "../../packages/provider/cost/src/pricing/fal";
const endpoint = "fal-ai/flux-3-action/so101";
const row = [0, 90, 90, 0, 0, 50];
const rows = (n: number) => Array.from({ length: n }, () => [...row]);
const payload = {
  prompt: "A red panda waves once, then holds still.",
  scene_image_url: "data:image/jpeg;base64,c2NlbmU=",
  wrist_image_url: "data:image/jpeg;base64,d3Jpc3Q=",
  state: row,
} satisfies FalFlux3ActionSo101Request;
const histories = { state_history: rows(7), command_history: rows(8) };
const frames = {
  history_scene_image_url: "https://example.com/scene-old.jpg",
  history_wrist_image_url: "https://example.com/wrist-old.jpg",
};
const issue = (body: unknown) => {
  const result = schema.safeParse(body);
  expect(result.success).toBe(false);
  return result.error?.issues.map((i) => [i.path.join("."), i.message]);
};
describe("FLUX 3 Action SO-101", () => {
  it("exports the owned flux3Action namespace, request types, aliases and registry", () => {
    const p = createFal({ apiKey: "test-key" });
    expect(Object.keys(p.run.flux3Action)).toEqual(["so101"]);
    expect(p.run.flux3Action.so101).toBe(p.post.run.flux3Action.so101);
    expect(p.run.flux3Action.so101.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(p.run.flux3Action).toEqualTypeOf<FalRunFlux3ActionNamespace>();
    expectTypeOf(p.run.flux3Action.so101)
      .parameter(0)
      .toEqualTypeOf<FalFlux3ActionSo101Request>();
    expectTypeOf(
      p.run.flux3Action.so101
    ).returns.resolves.toEqualTypeOf<FalFlux3ActionSo101Response>();
    expectTypeOf<FalFlux3ActionSo101RequestInput>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalFlux3ActionSo101ParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
  });
  it("posts the exact request body to fal.run and returns the action chunk", async () => {
    const response: FalFlux3ActionSo101Response = {
      actions: rows(42),
      action_labels: [
        "shoulder_pan",
        "shoulder_lift",
        "elbow_flex",
        "wrist_flex",
        "wrist_roll",
        "gripper",
      ],
      action_hz: 30,
      execute_steps: 30,
      seed: 42,
      timings: { inference: 0.5 },
    };
    const fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify(response), { status: 200 })
      );
    const p = createFal({
      apiKey: "test-key",
      fetch: fetch as unknown as typeof globalThis.fetch,
    });
    expect(await p.run.flux3Action.so101(payload)).toEqual(response);
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
    expect(String(url)).toBe("https://fal.run/fal-ai/flux-3-action/so101");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual(payload);
  });
  it("requires prompt, both camera frames and state, and applies the defaults", () => {
    expect(schema.parse(payload)).toEqual({
      ...payload,
      num_inference_steps: 4,
      guidance_scale: 3,
    });
    for (const key of [
      "prompt",
      "scene_image_url",
      "wrist_image_url",
      "state",
    ] as const) {
      const body: Record<string, unknown> = { ...payload };
      delete body[key];
      expect(schema.safeParse(body).success).toBe(false);
    }
    // The Input is not closed: a free probe showed fal ignores extra fields.
    expect(schema.safeParse({ ...payload, extra: 1 }).success).toBe(true);
  });
  it("bounds the prompt from 1 to 2000 characters", () => {
    for (const prompt of ["x", "x".repeat(2000)])
      expect(schema.safeParse({ ...payload, prompt }).success).toBe(true);
    for (const prompt of ["", "x".repeat(2001), 1])
      expect(schema.safeParse({ ...payload, prompt }).success).toBe(false);
  });
  it("takes exactly six numbers per joint row", () => {
    for (const state of [
      [],
      row.slice(0, 5),
      [...row, 0],
      ["0", 90, 90, 0, 0, 50],
    ])
      expect(schema.safeParse({ ...payload, state }).success).toBe(false);
    expect(
      schema.safeParse({
        ...payload,
        state: [-18.94, 134.52, 120.15, 28.3, -32.17, 27.02],
      }).success
    ).toBe(true);
  });
  it("takes 7 state rows and 8 command rows, both nullable", () => {
    expect(schema.safeParse({ ...payload, ...histories }).success).toBe(true);
    expect(
      schema.safeParse({
        ...payload,
        state_history: null,
        command_history: null,
      }).success
    ).toBe(true);
    for (const body of [
      { ...histories, state_history: rows(6) },
      { ...histories, state_history: rows(8) },
      { ...histories, command_history: rows(7) },
      { ...histories, command_history: rows(9) },
      { ...histories, state_history: [...rows(6), row.slice(0, 5)] },
      { ...histories, command_history: [...rows(7), [...row, 0]] },
    ])
      expect(schema.safeParse({ ...payload, ...body }).success).toBe(false);
  });
  it("bounds num_inference_steps 1 to 8 and guidance_scale 1 to 10", () => {
    for (const num_inference_steps of [1, 8])
      expect(
        schema.safeParse({ ...payload, num_inference_steps }).success
      ).toBe(true);
    for (const num_inference_steps of [0, 9, 4.5])
      expect(
        schema.safeParse({ ...payload, num_inference_steps }).success
      ).toBe(false);
    for (const guidance_scale of [1, 10, 2.5])
      expect(schema.safeParse({ ...payload, guidance_scale }).success).toBe(
        true
      );
    for (const guidance_scale of [0.5, 11])
      expect(schema.safeParse({ ...payload, guidance_scale }).success).toBe(
        false
      );
  });
  it("takes a nullable integer seed", () => {
    for (const seed of [null, 0, 42])
      expect(schema.safeParse({ ...payload, seed }).success).toBe(true);
    for (const seed of [1.5, "42"])
      expect(schema.safeParse({ ...payload, seed }).success).toBe(false);
  });
  it("restates the pairing rules fal's validator returned in the free probes", () => {
    // Probe cases B and C: one history without the other.
    expect(issue({ ...payload, command_history: rows(8) })).toEqual([
      [
        "command_history",
        "state_history and command_history must be provided together",
      ],
    ]);
    expect(issue({ ...payload, state_history: rows(7) })).toEqual([
      [
        "command_history",
        "state_history and command_history must be provided together",
      ],
    ]);
    // Probe case F: one history frame without the other.
    expect(
      issue({
        ...payload,
        ...histories,
        history_scene_image_url: frames.history_scene_image_url,
      })
    ).toEqual([
      [
        "history_wrist_image_url",
        "history_scene_image_url and history_wrist_image_url must be provided together",
      ],
    ]);
    // Probe case D: both frames without the histories.
    expect(issue({ ...payload, ...frames })).toEqual([
      [
        "history_wrist_image_url",
        "history images require state_history and command_history",
      ],
    ]);
    // Probe cases E and G: the full history set, and histories alone.
    expect(
      schema.safeParse({ ...payload, ...histories, ...frames }).success
    ).toBe(true);
    expect(schema.safeParse({ ...payload, ...histories }).success).toBe(true);
    expect(
      schema.safeParse({
        ...payload,
        ...histories,
        history_scene_image_url: null,
        history_wrist_image_url: null,
      }).success
    ).toBe(true);
  });
  it("keeps the compute-second-billed endpoint dynamically priced", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS as readonly string[]).toContain(
      endpoint
    );
    expect(pricing[endpoint]).toBeUndefined();
    expect(computeEstimate({ provider: "fal", endpoint, payload }).usd).toBe(0);
  });
});
