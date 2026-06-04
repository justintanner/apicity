import { describe, it, expect } from "vitest";

import {
  PayGateError,
  createReplayStore,
  mintOtp,
  type PayGateConfig,
} from "../../packages/provider/cost/src/paygate";
import { withPaidGate } from "../../packages/provider/cost/src/with-paid-gate";
import { withPaidGate as withPaidGateFromIndex } from "@apicity/cost";

// Re-export sanity: the package index reaches the same symbol.
describe("withPaidGate — module wiring", () => {
  it("re-exports through the package index", () => {
    expect(withPaidGateFromIndex).toBe(withPaidGate);
  });
});

const SECRET = "test-secret";

/**
 * A configured pay gate with its own replay store. With a valid secret, a
 * paid-leaf invocation that lacks an OTP throws `PayGateError("otp-missing")`,
 * and one with a valid OTP passes through to the underlying leaf — exactly
 * what we need to assert "the leaf was routed through the gate".
 */
function makeConfig(): PayGateConfig {
  return { secret: SECRET, replayStore: createReplayStore() };
}

const schema = { __schemaTag: "createTask" } as const;

function buildKieLikeTree() {
  const createTask = Object.assign(
    async (_req: unknown) => ({ data: { taskId: "stub" } }),
    { schema }
  );
  const downloadUrl = Object.assign(
    async (_req: unknown) => ({ data: { url: "stub" } }),
    { schema: { __schemaTag: "downloadUrl" } as const }
  );
  const recordInfo = async (_taskId: string) => ({ data: { status: "ok" } });
  return {
    veo: { generate: async () => ({}) },
    modelInputSchemas: { foo: { type: "image" } },
    post: {
      api: {
        v1: {
          jobs: { createTask },
          common: { downloadUrl },
        },
      },
    },
    get: {
      api: {
        v1: {
          jobs: { recordInfo },
        },
      },
    },
  };
}

describe("withPaidGate — walker", () => {
  it("routes a paid leaf through the gate (throws PayGateError without OTP)", async () => {
    const tree = buildKieLikeTree();
    const wrapped = withPaidGate("kie", tree, { config: makeConfig() });
    let caught: unknown;
    try {
      await wrapped.post.api.v1.jobs.createTask({ model: "x" });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(PayGateError);
    expect((caught as PayGateError).code).toBe("otp-missing");
  });

  it("passes a paid leaf through the gate with a valid OTP", async () => {
    const tree = buildKieLikeTree();
    const wrapped = withPaidGate("kie", tree, { config: makeConfig() });
    const request = { model: "x" };
    const otp = mintOtp(SECRET, {
      dotPath: "api.v1.jobs.createTask",
      request,
    });
    const out = await (
      wrapped.post.api.v1.jobs.createTask as unknown as (
        req: unknown,
        approval: { otp: string }
      ) => Promise<unknown>
    )(request, { otp });
    expect(out).toEqual({ data: { taskId: "stub" } });
  });

  it("leaves free leaves untouched (no gate, no extra approval arg semantics)", async () => {
    const tree = buildKieLikeTree();
    const wrapped = withPaidGate("kie", tree, { config: makeConfig() });
    const out = await wrapped.post.api.v1.common.downloadUrl({ id: "x" });
    expect(out).toEqual({ data: { url: "stub" } });
    const info = await wrapped.get.api.v1.jobs.recordInfo("task-1");
    expect(info).toEqual({ data: { status: "ok" } });
  });

  it("preserves .schema on a paid leaf", () => {
    const tree = buildKieLikeTree();
    const wrapped = withPaidGate("kie", tree, { config: makeConfig() });
    expect(
      (wrapped.post.api.v1.jobs.createTask as unknown as { schema: unknown })
        .schema
    ).toBe(schema);
  });

  it("returns sub-providers and data fields by reference (not walked)", () => {
    const tree = buildKieLikeTree();
    const wrapped = withPaidGate("kie", tree, { config: makeConfig() });
    expect(wrapped.veo).toBe(tree.veo);
    expect(wrapped.modelInputSchemas).toBe(tree.modelInputSchemas);
  });

  it("respects an explicit roots allowlist", () => {
    const tree = buildKieLikeTree();
    const wrapped = withPaidGate("kie", tree, {
      roots: ["get"],
      config: makeConfig(),
    });
    // post bucket was NOT descended; the paid leaf is identity-preserved
    expect(wrapped.post).toBe(tree.post);
    // get bucket WAS descended; recordInfo is the same behaviorally
    // (it's not paid, so the walker returns it as-is anyway).
    expect(typeof wrapped.get.api.v1.jobs.recordInfo).toBe("function");
  });

  it("preserves callable-namespace children (root callable + nested fns)", async () => {
    // Synthetic: a callable namespace where the function itself is the leaf
    // and its `.list` child is a separate callable.
    const list = Object.assign(async () => ["a", "b"], {
      schema: { __schemaTag: "list" } as const,
    });
    const root = Object.assign(async (_req: unknown) => ({ ok: true }), {
      schema: { __schemaTag: "root" } as const,
      list,
    });
    const tree = { post: { v1: { models: root } } };
    const wrapped = withPaidGate("openai", tree, { config: makeConfig() });
    // root is free → still callable and identity-equivalent in behavior
    const out = await wrapped.post.v1.models({});
    expect(out).toEqual({ ok: true });
    // child preserved and callable
    const items = await (
      wrapped.post.v1.models as unknown as { list: () => Promise<string[]> }
    ).list();
    expect(items).toEqual(["a", "b"]);
    // .schema preserved on both root and child
    expect(
      (wrapped.post.v1.models as unknown as { schema: unknown }).schema
    ).toBeDefined();
    expect(
      (
        wrapped.post.v1.models as unknown as {
          list: { schema: unknown };
        }
      ).list.schema
    ).toBeDefined();
  });

  it("produces a tree with the same key shape as the input", () => {
    const tree = buildKieLikeTree();
    const wrapped = withPaidGate("kie", tree, { config: makeConfig() });
    expect(deepKeys(wrapped)).toEqual(deepKeys(tree));
  });
});

function deepKeys(node: unknown, prefix: string[] = []): string[] {
  if (node === null || typeof node !== "object") return [];
  if (typeof node === "function") {
    // Walk own enumerable props of the function too (callable namespaces).
    return Object.entries(node as object).flatMap(([k, v]) =>
      deepKeys(v, [...prefix, k])
    );
  }
  const here = Object.keys(node as object).map((k) => [...prefix, k].join("."));
  const children = Object.entries(node as object).flatMap(([k, v]) =>
    deepKeys(v, [...prefix, k])
  );
  return [...here, ...children].sort();
}
