import { describe, expect, expectTypeOf, it } from "vitest";
import type { TflinkUploadResponse } from "@apicity/free-media-upload";

// HAR learning pass 2 (ac-11lqw3) over the 2026-11-25 videobook capture
// corpus: all 4 tflink uploads returned storageBackend "r2", for example
// capture 2026-10-29T16-18-19.578Z-816c696d-903b-4b66-a6f7-b20f31d92866. The
// committed recordings predate the field, so it stays optional.
describe("free-media-upload tflink upload response", () => {
  it("types storageBackend as an optional string", () => {
    expectTypeOf<TflinkUploadResponse["storageBackend"]>().toEqualTypeOf<
      string | undefined
    >();
  });

  it("reads the captured storage backend", () => {
    const captured: TflinkUploadResponse = {
      fileName: "f.jpg",
      downloadLink: "https://d.tmpfile.link/public/f.jpg",
      downloadLinkEncoded: "https://d.tmpfile.link/public/f.jpg",
      size: 5,
      type: "image/jpeg",
      uploadedTo: "public",
      storageBackend: "r2",
    };
    expect(captured.storageBackend).toBe("r2");
  });
});
