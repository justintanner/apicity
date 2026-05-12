export class YouTubeError extends Error {
  readonly status: number;
  readonly body: unknown;
  readonly code?: string;

  constructor(message: string, status: number, body?: unknown, code?: string) {
    super(message);
    this.name = "YouTubeError";
    this.status = status;
    this.body = body ?? null;
    this.code = code;
  }
}

// Endpoints will be added by subsequent tasks.
// See parent epic for planned endpoints:
//   videos.insert (resumable upload)
//   commentThreads.insert
//   comments.insert
//   playlists.insert
//   playlistItems.insert
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface YouTubeProvider {}

export type { YouTubeOptions } from "./zod";
