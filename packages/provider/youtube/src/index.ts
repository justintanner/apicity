export { createYouTube } from "./youtube";

export { YouTubeError } from "./types";

export type {
  YouTubeProvider,
  YouTubeVideo,
  YouTubeVideoSnippet,
  YouTubeVideosListResponse,
  YouTubeVideosListMethod,
  YouTubeVideosNamespace,
  YouTubeVideoSnippetInput,
  YouTubeVideoStatusInput,
  YouTubeRecordingDetailsInput,
  YouTubeLocalizationsInput,
  YouTubeVideosInsertResponse,
  YouTubeVideosInsertMethod,
  YouTubeVideoStatusResponse,
  YouTubeVideoResource,
  YouTubeChannelsListResponse,
  YouTubeChannel,
  YouTubeChannelSnippet,
  YouTubePageInfo,
  YouTubeTranscriptSegment,
  YouTubeGetTranscriptResponse,
  YouTubeGetTranscriptMethod,
  YouTubeTranscriptsNamespace,
  YouTubeGetVideoMetadataResponse,
  YouTubeGetVideoMetadataMethod,
  // Promoted out of EXPORT_SURFACE_BASELINE (ac-9at9f2.7): a consumer that
  // holds `youtube.channels` must be able to name its type.
  YouTubeChannelsNamespace,
} from "./types";

export type {
  YouTubeOptions,
  YouTubeChannelsListRequest,
  YouTubeChannelsListRequestInput,
  YouTubeChannelsListParsedRequest,
  YouTubeVideosInsertRequest,
  YouTubeVideosInsertRequestInput,
  YouTubeVideosInsertParsedRequest,
  YouTubeGetTranscriptRequest,
  YouTubeGetTranscriptRequestInput,
  YouTubeGetTranscriptParsedRequest,
  YouTubeGetVideoMetadataRequest,
  YouTubeGetVideoMetadataRequestInput,
  YouTubeGetVideoMetadataParsedRequest,
} from "./zod";

export {
  YouTubeOptionsSchema,
  YouTubeChannelsListRequestSchema,
  YouTubeVideosInsertRequestSchema,
  YouTubeGetTranscriptRequestSchema,
  YouTubeGetVideoMetadataRequestSchema,
} from "./zod";
