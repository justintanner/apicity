import { FreeError, type FreeProvider } from "./types";

export type FreeHost = "litterbox" | "uguu" | "tflink";

export interface UploadToAnyHostRequest {
  file: Blob;
  filename: string;
  hosts: FreeHost[];
  time?: "1h" | "12h" | "24h" | "72h";
}

export async function uploadToAnyHost(
  provider: FreeProvider,
  req: UploadToAnyHostRequest,
  signal?: AbortSignal
): Promise<string> {
  if (req.hosts.length === 0) {
    throw new FreeError("uploadToAnyHost requires at least one host", 400);
  }

  const order = shuffle(req.hosts);
  const failures: string[] = [];

  for (const host of order) {
    try {
      return await uploadToHost(provider, host, req, signal);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      failures.push(`${host}: ${message}`);
    }
  }

  throw new FreeError(
    `All upload hosts failed — ${failures.join(" | ")}`,
    500,
    { failures }
  );
}

async function uploadToHost(
  provider: FreeProvider,
  host: FreeHost,
  req: UploadToAnyHostRequest,
  signal?: AbortSignal
): Promise<string> {
  switch (host) {
    case "litterbox":
      return provider.litterbox.upload(
        { file: req.file, filename: req.filename, time: req.time ?? "1h" },
        signal
      );
    case "uguu": {
      const res = await provider.uguu.upload(
        { file: req.file, filename: req.filename },
        signal
      );
      const url = res.files[0]?.url;
      if (!url) throw new Error("uguu upload returned no URL");
      return url;
    }
    case "tflink": {
      const res = await provider.tflink.upload(
        { file: req.file, filename: req.filename },
        signal
      );
      return res.downloadLink;
    }
  }
}

function shuffle<T>(arr: T[]): T[] {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
