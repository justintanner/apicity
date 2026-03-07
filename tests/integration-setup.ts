// Polyfill FileReader for Node.js so Polly.js can serialize FormData blobs.
if (typeof globalThis.FileReader === "undefined") {
  class FileReaderPolyfill extends EventTarget {
    result: string | ArrayBuffer | null = null;
    error: Error | null = null;
    readyState = 0;
    EMPTY = 0;
    LOADING = 1;
    DONE = 2;
    onload: ((ev: Event) => void) | null = null;
    onerror: ((ev: Event) => void) | null = null;
    onloadend: ((ev: Event) => void) | null = null;
    onloadstart: ((ev: Event) => void) | null = null;
    onabort: ((ev: Event) => void) | null = null;
    onprogress: ((ev: Event) => void) | null = null;

    abort(): void {
      /* noop */
    }

    readAsArrayBuffer(blob: Blob): void {
      this.readyState = this.LOADING;
      blob
        .arrayBuffer()
        .then((buf) => {
          this.readyState = this.DONE;
          this.result = buf;
          const ev = new Event("load");
          this.onload?.(ev);
          this.dispatchEvent(ev);
        })
        .catch((err) => {
          this.error = err;
          const ev = new Event("error");
          this.onerror?.(ev);
          this.dispatchEvent(ev);
        });
    }

    readAsDataURL(blob: Blob): void {
      this.readyState = this.LOADING;
      blob
        .arrayBuffer()
        .then((buf) => {
          this.readyState = this.DONE;
          const base64 = Buffer.from(buf).toString("base64");
          this.result = `data:application/octet-stream;base64,${base64}`;
          const ev = new Event("load");
          this.onload?.(ev);
          this.dispatchEvent(ev);
        })
        .catch((err) => {
          this.error = err;
          const ev = new Event("error");
          this.onerror?.(ev);
          this.dispatchEvent(ev);
        });
    }

    readAsText(blob: Blob): void {
      this.readyState = this.LOADING;
      blob
        .text()
        .then((text) => {
          this.readyState = this.DONE;
          this.result = text;
          const ev = new Event("load");
          this.onload?.(ev);
          this.dispatchEvent(ev);
        })
        .catch((err) => {
          this.error = err;
          const ev = new Event("error");
          this.onerror?.(ev);
          this.dispatchEvent(ev);
        });
    }

    readAsBinaryString(_blob: Blob): void {
      throw new Error("readAsBinaryString not implemented");
    }
  }

  globalThis.FileReader =
    FileReaderPolyfill as unknown as typeof globalThis.FileReader;
}
