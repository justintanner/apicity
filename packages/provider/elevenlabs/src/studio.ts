import {
  ElevenLabsStudioAddChapterResponse,
  ElevenLabsStudioAddProjectResponse,
  ElevenLabsStudioChapterSnapshotExtended,
  ElevenLabsStudioChapterWithContent,
  ElevenLabsStudioConvertChapterResponse,
  ElevenLabsStudioConvertProjectResponse,
  ElevenLabsStudioCreateChapterRequest,
  ElevenLabsStudioCreatePodcastRequest,
  ElevenLabsStudioCreatePodcastResponse,
  ElevenLabsStudioCreateProjectRequest,
  ElevenLabsStudioCreatePronunciationDictionariesRequest,
  ElevenLabsStudioCreatePronunciationDictionariesResponse,
  ElevenLabsStudioDeleteChapterResponse,
  ElevenLabsStudioDeleteProjectResponse,
  ElevenLabsStudioEditChapterResponse,
  ElevenLabsStudioEditProjectResponse,
  ElevenLabsStudioGetProjectRequest,
  ElevenLabsStudioListChapterSnapshotsResponse,
  ElevenLabsStudioListChaptersResponse,
  ElevenLabsStudioListProjectSnapshotsResponse,
  ElevenLabsStudioListProjectsResponse,
  ElevenLabsStudioMutedTracksResponse,
  ElevenLabsStudioProjectExtended,
  ElevenLabsStudioProjectSnapshotExtended,
  ElevenLabsStudioStreamAudioRequest,
  ElevenLabsStudioUpdateChapterRequest,
  ElevenLabsStudioUpdateProjectContentRequest,
  ElevenLabsStudioUpdateProjectRequest,
} from "./types";
import {
  ElevenLabsStudioCreateChapterRequestSchema,
  ElevenLabsStudioCreatePodcastRequestSchema,
  ElevenLabsStudioCreateProjectRequestSchema,
  ElevenLabsStudioCreatePronunciationDictionariesRequestSchema,
  ElevenLabsStudioGetProjectRequestSchema,
  ElevenLabsStudioStreamAudioRequestSchema,
  ElevenLabsStudioUpdateChapterRequestSchema,
  ElevenLabsStudioUpdateProjectContentRequestSchema,
  ElevenLabsStudioUpdateProjectRequestSchema,
} from "./zod";
import type { ElevenLabsContext } from "./transport";

export function createStudioEndpoints(ctx: ElevenLabsContext) {
  const {
    makeBinaryRequest,
    makeJsonRequest,
    makeMultipartJsonRequest,
    appendFormField,
    buildQueryString,
  } = ctx;

  // Append a multipart form body for the Studio project endpoints, expanding
  // array-valued fields (e.g. pronunciation_dictionary_locators, genres) into
  // one repeated form line per item as the upstream API expects.
  function appendStudioForm(form: FormData, req: object): void {
    for (const [key, value] of Object.entries(req)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          appendFormField(form, key, item);
        }
      } else {
        appendFormField(form, key, value);
      }
    }
  }

  // POST https://api.elevenlabs.io/v1/studio/podcasts
  // Docs: https://elevenlabs.io/docs/api-reference/studio/create-podcast
  const studioCreatePodcast = Object.assign(
    async (
      req: ElevenLabsStudioCreatePodcastRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsStudioCreatePodcastResponse> => {
      return makeJsonRequest<ElevenLabsStudioCreatePodcastResponse>(
        "POST",
        "/v1/studio/podcasts",
        req,
        signal
      );
    },
    { schema: ElevenLabsStudioCreatePodcastRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/studio/projects
  // Docs: https://elevenlabs.io/docs/api-reference/studio/get-projects
  const studioListProjects = Object.assign(
    async (
      signal?: AbortSignal
    ): Promise<ElevenLabsStudioListProjectsResponse> => {
      return makeJsonRequest<ElevenLabsStudioListProjectsResponse>(
        "GET",
        "/v1/studio/projects",
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/studio/projects
  // Docs: https://elevenlabs.io/docs/api-reference/studio/add-project
  const studioCreateProject = Object.assign(
    async (
      req: ElevenLabsStudioCreateProjectRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsStudioAddProjectResponse> => {
      const form = new FormData();
      appendStudioForm(form, req);
      return makeMultipartJsonRequest<ElevenLabsStudioAddProjectResponse>(
        "/v1/studio/projects",
        form,
        undefined,
        signal
      );
    },
    { schema: ElevenLabsStudioCreateProjectRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/studio/projects/{projectId}
  // Docs: https://elevenlabs.io/docs/api-reference/studio/get-project
  const studioGetProject = Object.assign(
    async (
      projectId: string,
      req: ElevenLabsStudioGetProjectRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsStudioProjectExtended> => {
      return makeJsonRequest<ElevenLabsStudioProjectExtended>(
        "GET",
        `/v1/studio/projects/${encodeURIComponent(projectId)}`,
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsStudioGetProjectRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/studio/projects/{projectId}
  // Docs: https://elevenlabs.io/docs/api-reference/studio/edit-project
  const studioUpdateProject = Object.assign(
    async (
      projectId: string,
      req: ElevenLabsStudioUpdateProjectRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsStudioEditProjectResponse> => {
      return makeJsonRequest<ElevenLabsStudioEditProjectResponse>(
        "POST",
        `/v1/studio/projects/${encodeURIComponent(projectId)}`,
        req,
        signal
      );
    },
    { schema: ElevenLabsStudioUpdateProjectRequestSchema }
  );

  // DELETE https://api.elevenlabs.io/v1/studio/projects/{projectId}
  // Docs: https://elevenlabs.io/docs/api-reference/studio/delete-project
  const studioDeleteProject = Object.assign(
    async (
      projectId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsStudioDeleteProjectResponse> => {
      return makeJsonRequest<ElevenLabsStudioDeleteProjectResponse>(
        "DELETE",
        `/v1/studio/projects/${encodeURIComponent(projectId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/studio/projects/{projectId}/convert
  // Docs: https://elevenlabs.io/docs/api-reference/studio/convert-project
  const studioConvertProject = Object.assign(
    async (
      projectId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsStudioConvertProjectResponse> => {
      return makeJsonRequest<ElevenLabsStudioConvertProjectResponse>(
        "POST",
        `/v1/studio/projects/${encodeURIComponent(projectId)}/convert`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/studio/projects/{projectId}/content
  // Docs: https://elevenlabs.io/docs/api-reference/studio/edit-project-content
  const studioUpdateProjectContent = Object.assign(
    async (
      projectId: string,
      req: ElevenLabsStudioUpdateProjectContentRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsStudioEditProjectResponse> => {
      const form = new FormData();
      appendStudioForm(form, req);
      return makeMultipartJsonRequest<ElevenLabsStudioEditProjectResponse>(
        `/v1/studio/projects/${encodeURIComponent(projectId)}/content`,
        form,
        undefined,
        signal
      );
    },
    { schema: ElevenLabsStudioUpdateProjectContentRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/studio/projects/{projectId}/muted-tracks
  // Docs: https://elevenlabs.io/docs/api-reference/studio/get-project-muted-tracks
  const studioGetMutedTracks = Object.assign(
    async (
      projectId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsStudioMutedTracksResponse> => {
      return makeJsonRequest<ElevenLabsStudioMutedTracksResponse>(
        "GET",
        `/v1/studio/projects/${encodeURIComponent(projectId)}/muted-tracks`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/studio/projects/{projectId}/pronunciation-dictionaries
  // Docs: https://elevenlabs.io/docs/api-reference/studio/create-pronunciation-dictionaries
  const studioCreatePronunciationDictionaries = Object.assign(
    async (
      projectId: string,
      req: ElevenLabsStudioCreatePronunciationDictionariesRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsStudioCreatePronunciationDictionariesResponse> => {
      return makeJsonRequest<ElevenLabsStudioCreatePronunciationDictionariesResponse>(
        "POST",
        `/v1/studio/projects/${encodeURIComponent(
          projectId
        )}/pronunciation-dictionaries`,
        req,
        signal
      );
    },
    { schema: ElevenLabsStudioCreatePronunciationDictionariesRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/studio/projects/{projectId}/snapshots
  // Docs: https://elevenlabs.io/docs/api-reference/studio/get-project-snapshots
  const studioListProjectSnapshots = Object.assign(
    async (
      projectId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsStudioListProjectSnapshotsResponse> => {
      return makeJsonRequest<ElevenLabsStudioListProjectSnapshotsResponse>(
        "GET",
        `/v1/studio/projects/${encodeURIComponent(projectId)}/snapshots`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/studio/projects/{projectId}/snapshots/{snapshotId}
  // Docs: https://elevenlabs.io/docs/api-reference/studio/get-project-snapshot
  const studioGetProjectSnapshot = Object.assign(
    async (
      projectId: string,
      snapshotId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsStudioProjectSnapshotExtended> => {
      return makeJsonRequest<ElevenLabsStudioProjectSnapshotExtended>(
        "GET",
        `/v1/studio/projects/${encodeURIComponent(
          projectId
        )}/snapshots/${encodeURIComponent(snapshotId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // sig-ok: intentional
  // POST https://api.elevenlabs.io/v1/studio/projects/{projectId}/snapshots/{snapshotId}/stream
  // Docs: https://elevenlabs.io/docs/api-reference/studio/stream-project-audio
  const studioStreamProjectSnapshot = Object.assign(
    async (
      projectId: string,
      snapshotId: string,
      req: ElevenLabsStudioStreamAudioRequest = {},
      signal?: AbortSignal
    ): Promise<ArrayBuffer> => {
      return makeBinaryRequest(
        `/v1/studio/projects/${encodeURIComponent(
          projectId
        )}/snapshots/${encodeURIComponent(snapshotId)}/stream`,
        req,
        undefined,
        signal
      );
    },
    { schema: ElevenLabsStudioStreamAudioRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/studio/projects/{projectId}/snapshots/{snapshotId}/archive
  // Docs: https://elevenlabs.io/docs/api-reference/studio/archive-project-snapshot
  const studioArchiveProjectSnapshot = Object.assign(
    async (
      projectId: string,
      snapshotId: string,
      signal?: AbortSignal
    ): Promise<ArrayBuffer> => {
      return makeBinaryRequest(
        `/v1/studio/projects/${encodeURIComponent(
          projectId
        )}/snapshots/${encodeURIComponent(snapshotId)}/archive`,
        undefined,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/studio/projects/{projectId}/chapters
  // Docs: https://elevenlabs.io/docs/api-reference/studio/get-chapters
  const studioListChapters = Object.assign(
    async (
      projectId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsStudioListChaptersResponse> => {
      return makeJsonRequest<ElevenLabsStudioListChaptersResponse>(
        "GET",
        `/v1/studio/projects/${encodeURIComponent(projectId)}/chapters`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/studio/projects/{projectId}/chapters
  // Docs: https://elevenlabs.io/docs/api-reference/studio/create-chapter
  const studioCreateChapter = Object.assign(
    async (
      projectId: string,
      req: ElevenLabsStudioCreateChapterRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsStudioAddChapterResponse> => {
      return makeJsonRequest<ElevenLabsStudioAddChapterResponse>(
        "POST",
        `/v1/studio/projects/${encodeURIComponent(projectId)}/chapters`,
        req,
        signal
      );
    },
    { schema: ElevenLabsStudioCreateChapterRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/studio/projects/{projectId}/chapters/{chapterId}
  // Docs: https://elevenlabs.io/docs/api-reference/studio/get-chapter
  const studioGetChapter = Object.assign(
    async (
      projectId: string,
      chapterId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsStudioChapterWithContent> => {
      return makeJsonRequest<ElevenLabsStudioChapterWithContent>(
        "GET",
        `/v1/studio/projects/${encodeURIComponent(
          projectId
        )}/chapters/${encodeURIComponent(chapterId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/studio/projects/{projectId}/chapters/{chapterId}
  // Docs: https://elevenlabs.io/docs/api-reference/studio/edit-chapter
  const studioUpdateChapter = Object.assign(
    async (
      projectId: string,
      chapterId: string,
      req: ElevenLabsStudioUpdateChapterRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsStudioEditChapterResponse> => {
      return makeJsonRequest<ElevenLabsStudioEditChapterResponse>(
        "POST",
        `/v1/studio/projects/${encodeURIComponent(
          projectId
        )}/chapters/${encodeURIComponent(chapterId)}`,
        req,
        signal
      );
    },
    { schema: ElevenLabsStudioUpdateChapterRequestSchema }
  );

  // DELETE https://api.elevenlabs.io/v1/studio/projects/{projectId}/chapters/{chapterId}
  // Docs: https://elevenlabs.io/docs/api-reference/studio/delete-chapter
  const studioDeleteChapter = Object.assign(
    async (
      projectId: string,
      chapterId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsStudioDeleteChapterResponse> => {
      return makeJsonRequest<ElevenLabsStudioDeleteChapterResponse>(
        "DELETE",
        `/v1/studio/projects/${encodeURIComponent(
          projectId
        )}/chapters/${encodeURIComponent(chapterId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/studio/projects/{projectId}/chapters/{chapterId}/convert
  // Docs: https://elevenlabs.io/docs/api-reference/studio/convert-chapter
  const studioConvertChapter = Object.assign(
    async (
      projectId: string,
      chapterId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsStudioConvertChapterResponse> => {
      return makeJsonRequest<ElevenLabsStudioConvertChapterResponse>(
        "POST",
        `/v1/studio/projects/${encodeURIComponent(
          projectId
        )}/chapters/${encodeURIComponent(chapterId)}/convert`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/studio/projects/{projectId}/chapters/{chapterId}/snapshots
  // Docs: https://elevenlabs.io/docs/api-reference/studio/get-chapter-snapshots
  const studioListChapterSnapshots = Object.assign(
    async (
      projectId: string,
      chapterId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsStudioListChapterSnapshotsResponse> => {
      return makeJsonRequest<ElevenLabsStudioListChapterSnapshotsResponse>(
        "GET",
        `/v1/studio/projects/${encodeURIComponent(
          projectId
        )}/chapters/${encodeURIComponent(chapterId)}/snapshots`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/studio/projects/{projectId}/chapters/{chapterId}/snapshots/{chapterSnapshotId}
  // Docs: https://elevenlabs.io/docs/api-reference/studio/get-chapter-snapshot
  const studioGetChapterSnapshot = Object.assign(
    async (
      projectId: string,
      chapterId: string,
      chapterSnapshotId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsStudioChapterSnapshotExtended> => {
      return makeJsonRequest<ElevenLabsStudioChapterSnapshotExtended>(
        "GET",
        `/v1/studio/projects/${encodeURIComponent(
          projectId
        )}/chapters/${encodeURIComponent(
          chapterId
        )}/snapshots/${encodeURIComponent(chapterSnapshotId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // sig-ok: intentional
  // POST https://api.elevenlabs.io/v1/studio/projects/{projectId}/chapters/{chapterId}/snapshots/{chapterSnapshotId}/stream
  // Docs: https://elevenlabs.io/docs/api-reference/studio/stream-chapter-audio
  const studioStreamChapterSnapshot = Object.assign(
    async (
      projectId: string,
      chapterId: string,
      chapterSnapshotId: string,
      req: ElevenLabsStudioStreamAudioRequest = {},
      signal?: AbortSignal
    ): Promise<ArrayBuffer> => {
      return makeBinaryRequest(
        `/v1/studio/projects/${encodeURIComponent(
          projectId
        )}/chapters/${encodeURIComponent(
          chapterId
        )}/snapshots/${encodeURIComponent(chapterSnapshotId)}/stream`,
        req,
        undefined,
        signal
      );
    },
    { schema: ElevenLabsStudioStreamAudioRequestSchema }
  );

  const studio = {
    podcasts: {
      create: studioCreatePodcast,
    },
    projects: {
      list: studioListProjects,
      create: studioCreateProject,
      get: studioGetProject,
      update: studioUpdateProject,
      delete: studioDeleteProject,
      convert: studioConvertProject,
      content: {
        update: studioUpdateProjectContent,
      },
      mutedTracks: {
        get: studioGetMutedTracks,
      },
      pronunciationDictionaries: {
        create: studioCreatePronunciationDictionaries,
      },
      snapshots: {
        list: studioListProjectSnapshots,
        get: studioGetProjectSnapshot,
        stream: studioStreamProjectSnapshot,
        archive: studioArchiveProjectSnapshot,
      },
      chapters: {
        list: studioListChapters,
        create: studioCreateChapter,
        get: studioGetChapter,
        update: studioUpdateChapter,
        delete: studioDeleteChapter,
        convert: studioConvertChapter,
        snapshots: {
          list: studioListChapterSnapshots,
          get: studioGetChapterSnapshot,
          stream: studioStreamChapterSnapshot,
        },
      },
    },
  };

  return {
    v1: { studio },
  };
}
