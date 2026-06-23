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
} from "./types";

export type {
  YouTubeOptions,
  YouTubeChannelsListRequest,
  YouTubeChannelsListParsedRequest,
  YouTubeVideosInsertRequest,
  YouTubeVideosInsertParsedRequest,
  YouTubeGetTranscriptRequest,
  YouTubeGetTranscriptParsedRequest,
  YouTubeGetVideoMetadataRequest,
  YouTubeGetVideoMetadataParsedRequest,
} from "./zod";

export {
  YouTubeOptionsSchema,
  YouTubeChannelsListRequestSchema,
  YouTubeVideosInsertRequestSchema,
  YouTubeGetTranscriptRequestSchema,
  YouTubeGetVideoMetadataRequestSchema,
} from "./zod";
