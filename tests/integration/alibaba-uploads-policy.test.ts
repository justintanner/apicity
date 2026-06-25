import { describe, it, expect, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { createAlibaba } from "@apicity/alibaba";

describe("alibaba native uploads (OSS policy) integration", () => {
  let ctx: PollyContext | undefined;

  afterEach(async () => {
    if (ctx) {
      await teardownPolly(ctx);
      ctx = undefined;
    }
  });

  it("should fetch an upload policy, POST a file to OSS, and receive a success response", async () => {
    ctx = setupPollyIgnoringBody("alibaba/uploads-policy");

    const provider = createAlibaba({
      apiKey: process.env.DASHSCOPE_API_KEY ?? "test-key",
      timeout: 120000,
    });

    const policyResponse = await provider.get.api.v1.uploads({
      action: "getPolicy",
      model: "qwen-image-edit",
    });

    expect(policyResponse.request_id).toEqual(expect.any(String));
    const data = policyResponse.data;
    expect(data.upload_host.startsWith("https://")).toBe(true);
    expect(typeof data.policy).toBe("string");
    expect(typeof data.signature).toBe("string");
    expect(typeof data.oss_access_key_id).toBe("string");
    expect(typeof data.upload_dir).toBe("string");
    expect(data.policy.length).toBeGreaterThan(0);
    expect(data.signature.length).toBeGreaterThan(0);

    const fixturePath = path.resolve(
      import.meta.dirname,
      "..",
      "fixtures",
      "cat1.jpg"
    );
    const bytes = fs.readFileSync(fixturePath);
    const key = `${data.upload_dir}/cat1.jpg`;

    const form = new FormData();
    form.set("OSSAccessKeyId", data.oss_access_key_id);
    form.set("Signature", data.signature);
    form.set("policy", data.policy);
    form.set("key", key);
    form.set("x-oss-object-acl", data.x_oss_object_acl);
    form.set("x-oss-forbid-overwrite", data.x_oss_forbid_overwrite);
    form.set("success_action_status", "200");
    form.set("x-oss-content-type", "image/jpeg");
    form.set(
      "file",
      new Blob([new Uint8Array(bytes)], { type: "image/jpeg" }),
      "cat1.jpg"
    );

    const putRes = await fetch(data.upload_host, {
      method: "POST",
      body: form,
    });

    expect(putRes.status).toBe(200);
    const ossUrl = `oss://${key}`;
    expect(ossUrl.startsWith("oss://")).toBe(true);
  }, 120000);
});
