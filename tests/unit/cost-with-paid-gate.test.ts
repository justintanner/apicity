import { describe, it, expect } from "vitest";

import {
  PayGateError,
  type PayGateIo,
} from "../../packages/provider/cost/src/paygate";
import { withPaidGate } from "../../packages/provider/cost/src/with-paid-gate";
import { withPaidGate as withPaidGateFromIndex } from "@apicity/cost";

// Re-export sanity: the package index reaches the same symbol.
describe("withPaidGate — module wiring", () => {
  it("re-exports through the package index", () => {
    expect(withPaidGateFromIndex).toBe(withPaidGate);
  });
});

/**
 * An IO that pretends the pay gate is unconfigured. With this io, every
 * paid-leaf invocation throws `PayGateError("paygate-not-configured")` —
 * exactly what we need to assert "the leaf was routed through the gate"
 * without standing up a real key + ledger.
 */
const unconfiguredIo: PayGateIo = {
  now: () => 0,
  loadPublicKey: () => undefined,
  isJtiConsumed: () => false,
  consumeJti: () => {},
};

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
    const wrapped = withPaidGate("kie", tree, { io: unconfiguredIo });
    let caught: unknown;
    try {
      await wrapped.post.api.v1.jobs.createTask({ model: "x" });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(PayGateError);
    expect((caught as PayGateError).code).toBe("paygate-not-configured");
  });

  it("leaves free leaves untouched (no gate, no extra approval arg semantics)", async () => {
    const tree = buildKieLikeTree();
    const wrapped = withPaidGate("kie", tree, { io: unconfiguredIo });
    const out = await wrapped.post.api.v1.common.downloadUrl({ id: "x" });
    expect(out).toEqual({ data: { url: "stub" } });
    const info = await wrapped.get.api.v1.jobs.recordInfo("task-1");
    expect(info).toEqual({ data: { status: "ok" } });
  });

  it("preserves .schema on a paid leaf", () => {
    const tree = buildKieLikeTree();
    const wrapped = withPaidGate("kie", tree, { io: unconfiguredIo });
    expect(
      (wrapped.post.api.v1.jobs.createTask as unknown as { schema: unknown })
        .schema
    ).toBe(schema);
  });

  it("returns sub-providers and data fields by reference (not walked)", () => {
    const tree = buildKieLikeTree();
    const wrapped = withPaidGate("kie", tree, { io: unconfiguredIo });
    expect(wrapped.veo).toBe(tree.veo);
    expect(wrapped.modelInputSchemas).toBe(tree.modelInputSchemas);
  });

  it("respects an explicit roots allowlist", () => {
    const tree = buildKieLikeTree();
    const wrapped = withPaidGate("kie", tree, {
      roots: ["get"],
      io: unconfiguredIo,
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
    const wrapped = withPaidGate("openai", tree, { io: unconfiguredIo });
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
    const wrapped = withPaidGate("kie", tree, { io: unconfiguredIo });
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
