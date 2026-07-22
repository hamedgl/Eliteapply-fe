import type { components } from "../../generated/api/schema";
import { apiRequest } from "./client";
import { uploadToSignedUrl } from "./signedTransport";
type S = components["schemas"];
const e = encodeURIComponent;
const qs = (
  values: Record<string, string | number | boolean | null | undefined>,
) => {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "")
      params.set(key, String(value));
  });
  const value = params.toString();
  return value ? `?${value}` : "";
};
export const writingApi = {
  templates: (documentType?: string, applicationType?: string) =>
    apiRequest<S["WritingTemplateResponse"][]>(
      `/writing-studio/templates${qs({ documentType, applicationType })}`,
    ),
  template: (id: string) =>
    apiRequest<S["WritingTemplateResponse"]>(
      `/writing-studio/templates/${e(id)}`,
    ),
  list: (applicationId?: string, includeArchived = false) =>
    apiRequest<S["WritingDocumentResponse"][]>(
      `/writing-studio/documents?includeArchived=${includeArchived}${applicationId ? `&applicationId=${e(applicationId)}` : ""}`,
    ),
  create: (body: S["WritingDocumentCreate"]) =>
    apiRequest<S["WritingDocumentResponse"]>("/writing-studio/documents", {
      method: "POST",
      body,
    }),
  get: (id: string) =>
    apiRequest<S["WritingDocumentResponse"]>(
      `/writing-studio/documents/${e(id)}`,
    ),
  update: (id: string, body: S["WritingDocumentUpdate"]) =>
    apiRequest<S["WritingDocumentResponse"]>(
      `/writing-studio/documents/${e(id)}`,
      { method: "PATCH", body },
    ),
  remove: (id: string) =>
    apiRequest<void>(`/writing-studio/documents/${e(id)}`, {
      method: "DELETE",
    }),
  duplicate: (id: string, body: S["WritingDocumentDuplicateRequest"]) =>
    apiRequest<S["WritingDocumentResponse"]>(
      `/writing-studio/documents/${e(id)}/duplicate`,
      { method: "POST", body },
    ),
  attach: (id: string, app: string) =>
    apiRequest<S["WritingDocumentResponse"]>(
      `/writing-studio/documents/${e(id)}/attach/${e(app)}`,
      { method: "POST" },
    ),
  detach: (id: string, app: string) =>
    apiRequest<S["WritingDocumentResponse"]>(
      `/writing-studio/documents/${e(id)}/detach/${e(app)}`,
      { method: "POST" },
    ),
  preview: (id: string) =>
    apiRequest<S["WritingPreviewResponse"]>(
      `/writing-studio/documents/${e(id)}/preview`,
    ),
  revisions: (id: string) =>
    apiRequest<S["WritingRevisionResponse"][]>(
      `/writing-studio/documents/${e(id)}/revisions`,
    ),
  restore: (id: string, revision: string) =>
    apiRequest<S["WritingDocumentResponse"]>(
      `/writing-studio/documents/${e(id)}/revisions/${e(revision)}/restore`,
      { method: "POST" },
    ),
  generate: (id: string, body: S["GenerateWritingRequest"]) =>
    apiRequest<S["GenerationRunResponse"]>(
      `/writing-studio/documents/${e(id)}/generate`,
      { method: "POST", body },
    ),
  generationRuns: (id: string) =>
    apiRequest<S["GenerationRunResponse"][]>(
      `/writing-studio/documents/${e(id)}/generation-runs`,
    ),
  generationRun: (id: string, signal?: AbortSignal) =>
    apiRequest<S["GenerationRunResponse"]>(
      `/writing-studio/generation-runs/${e(id)}`,
      { signal },
    ),
  cancelGeneration: (id: string) =>
    apiRequest<S["GenerationRunResponse"]>(
      `/writing-studio/generation-runs/${e(id)}/cancel`,
      { method: "POST" },
    ),
  retryGeneration: (id: string) =>
    apiRequest<S["GenerationRunResponse"]>(
      `/writing-studio/generation-runs/${e(id)}/retry`,
      { method: "POST" },
    ),
  analyze: (id: string) =>
    apiRequest<S["QualityAnalysisResponse"]>(
      `/writing-studio/documents/${e(id)}/analyze`,
      { method: "POST" },
    ),
  analyses: (id: string, cursor?: string | null) =>
    apiRequest<S["QualityAnalysisListResponse"]>(
      `/writing-studio/documents/${e(id)}/analyses${qs({ cursor, limit: 25 })}`,
    ),
  export: (id: string, format: "txt" | "docx" | "pdf") =>
    apiRequest<Response>(
      `/writing-studio/documents/${e(id)}/export.${format}`,
      { raw: true },
    ),
  stories: (
    filters: {
      category?: string;
      sensitivity?: string;
      search?: string;
      includeArchived?: boolean;
      cursor?: string | null;
    } = {},
  ) =>
    apiRequest<S["StoryListResponse"]>(
      `/writing-studio/stories${qs({ ...filters, limit: 25 })}`,
    ),
  createStory: (body: S["StoryCreate"]) =>
    apiRequest<S["StoryResponse"]>("/writing-studio/stories", {
      method: "POST",
      body,
    }),
  story: (id: string) =>
    apiRequest<S["StoryResponse"]>(`/writing-studio/stories/${e(id)}`),
  updateStory: (id: string, body: S["StoryUpdate"]) =>
    apiRequest<S["StoryResponse"]>(`/writing-studio/stories/${e(id)}`, {
      method: "PATCH",
      body,
    }),
  deleteStory: (id: string) =>
    apiRequest<void>(`/writing-studio/stories/${e(id)}`, {
      method: "DELETE",
    }),
  archiveStory: (id: string) =>
    apiRequest<S["StoryResponse"]>(`/writing-studio/stories/${e(id)}/archive`, {
      method: "POST",
    }),
  unarchiveStory: (id: string) =>
    apiRequest<S["StoryResponse"]>(`/writing-studio/stories/${e(id)}/unarchive`, {
      method: "POST",
    }),
  linkApplication: (storyId: string, applicationId: string) =>
    apiRequest<S["StoryResponse"]>(
      `/writing-studio/stories/${e(storyId)}/applications/${e(applicationId)}`,
      { method: "POST" },
    ),
  unlinkApplication: (storyId: string, applicationId: string) =>
    apiRequest<S["StoryResponse"]>(
      `/writing-studio/stories/${e(storyId)}/applications/${e(applicationId)}`,
      { method: "DELETE" },
    ),
  linkDocument: (storyId: string, documentId: string) =>
    apiRequest<S["StoryResponse"]>(
      `/writing-studio/stories/${e(storyId)}/documents/${e(documentId)}`,
      { method: "POST" },
    ),
  unlinkDocument: (storyId: string, documentId: string) =>
    apiRequest<S["StoryResponse"]>(
      `/writing-studio/stories/${e(storyId)}/documents/${e(documentId)}`,
      { method: "DELETE" },
    ),
  aiAssist: (storyId: string, body: S["StoryAIAssistRequest"]) =>
    apiRequest<S["StoryAIAssistResponse"]>(
      `/writing-studio/stories/${e(storyId)}/ai-assist`,
      { method: "POST", body },
    ),
  comments: (documentId: string, cursor?: string | null) =>
    apiRequest<S["WritingCommentListResponse"]>(
      `/writing-studio/documents/${e(documentId)}/comments${qs({ cursor, limit: 50 })}`,
    ),
  createComment: (documentId: string, body: S["WritingCommentCreate"]) =>
    apiRequest<S["WritingCommentResponse"]>(
      `/writing-studio/documents/${e(documentId)}/comments`,
      { method: "POST", body },
    ),
  updateComment: (id: string, body: S["WritingCommentUpdate"]) =>
    apiRequest<S["WritingCommentResponse"]>(
      `/writing-studio/comments/${e(id)}`,
      { method: "PATCH", body },
    ),
  deleteComment: (id: string) =>
    apiRequest<void>(`/writing-studio/comments/${e(id)}`, {
      method: "DELETE",
    }),
  shareLinks: (documentId: string) =>
    apiRequest<S["ShareLinkResponse"][]>(
      `/writing-studio/documents/${e(documentId)}/share-links`,
    ),
  createShareLink: (documentId: string, body: S["ShareLinkCreate"]) =>
    apiRequest<S["ShareLinkCreateResponse"]>(
      `/writing-studio/documents/${e(documentId)}/share-links`,
      { method: "POST", body },
    ),
  revokeShareLink: (documentId: string, id: string) =>
    apiRequest<void>(
      `/writing-studio/documents/${e(documentId)}/share-links/${e(id)}`,
      { method: "DELETE" },
    ),
};
export const collaborationApi = {
  list: (applicationId: string) =>
    apiRequest<S["CollaboratorResponse"][]>(
      `/applications/${e(applicationId)}/collaborators`,
    ),
  invite: (applicationId: string, body: S["CollaboratorInvite"]) =>
    apiRequest<S["CollaboratorResponse"]>(
      `/applications/${e(applicationId)}/collaborators`,
      { method: "POST", body },
    ),
  update: (applicationId: string, id: string, body: S["CollaboratorUpdate"]) =>
    apiRequest<S["CollaboratorResponse"]>(
      `/applications/${e(applicationId)}/collaborators/${e(id)}`,
      { method: "PATCH", body },
    ),
  remove: (applicationId: string, id: string) =>
    apiRequest<void>(
      `/applications/${e(applicationId)}/collaborators/${e(id)}`,
      { method: "DELETE" },
    ),
  view: (applicationId: string) =>
    apiRequest<S["CollaboratorViewResponse"]>(
      `/applications/${e(applicationId)}/collaborator-view`,
    ),
  accept: (token: string) =>
    apiRequest<S["CollaboratorAcceptResponse"]>(
      `/collaborator-invitations/${e(token)}/accept`,
      { method: "POST" },
    ),
};
export const publicShareApi = {
  get: (token: string, passcode?: string) =>
    apiRequest<S["SharedDocumentResponse"]>(`/share/${e(token)}`, {
      public: true,
      headers: passcode ? { "X-Share-Passcode": passcode } : undefined,
    }),
  comment: (token: string, body: S["SharedCommentCreate"], passcode?: string) =>
    apiRequest<S["WritingCommentResponse"]>(`/share/${e(token)}/comments`, {
      method: "POST",
      body,
      public: true,
      headers: passcode ? { "X-Share-Passcode": passcode } : undefined,
    }),
};
export const referencesApi = {
  list: (status?: string, cursor?: string | null) =>
    apiRequest<S["AcademicReferenceListResponse"]>(
      `/academic-references?limit=50${status ? `&status=${e(status)}` : ""}${cursor ? `&cursor=${e(cursor)}` : ""}`,
    ),
  create: (body: S["AcademicReferenceCreate"]) =>
    apiRequest<S["AcademicReferenceResponse"]>("/academic-references", {
      method: "POST",
      body,
    }),
  get: (id: string) =>
    apiRequest<S["AcademicReferenceResponse"]>(`/academic-references/${e(id)}`),
  update: (id: string, body: S["AcademicReferenceUpdate"]) =>
    apiRequest<S["AcademicReferenceResponse"]>(`/academic-references/${e(id)}`, {
      method: "PATCH",
      body,
    }),
  resend: (id: string) =>
    apiRequest<S["AcademicReferenceResponse"]>(
      `/academic-references/${e(id)}/resend`,
      { method: "POST" },
    ),
  remind: (id: string) =>
    apiRequest<S["AcademicReferenceResponse"]>(
      `/academic-references/${e(id)}/remind`,
      { method: "POST" },
    ),
  cancel: (id: string) =>
    apiRequest<S["AcademicReferenceResponse"]>(
      `/academic-references/${e(id)}/cancel`,
      { method: "POST" },
    ),
  revoke: (id: string) =>
    apiRequest<S["AcademicReferenceResponse"]>(
      `/academic-references/${e(id)}/revoke`,
      { method: "POST" },
    ),
  attach: (id: string, applicationId: string) =>
    apiRequest<S["AcademicReferenceResponse"]>(
      `/academic-references/${e(id)}/attach`,
      { method: "POST", body: { application_id: applicationId } satisfies S["ReferenceAttachRequest"] },
    ),
  events: (id: string, cursor?: string | null) =>
    apiRequest<S["ReferenceEventListResponse"]>(
      `/academic-references/${e(id)}/events${qs({ cursor, limit: 50 })}`,
    ),
  certificate: (id: string) =>
    apiRequest<Response>(`/academic-references/${e(id)}/certificate`, {
      raw: true,
    }),
  download: (id: string) =>
    apiRequest<Response>(`/academic-references/${e(id)}/download`, {
      raw: true,
    }),
  refereeGet: (token: string, code: string) =>
    apiRequest<Record<string, unknown>>(
      `/referee/academic-reference/${e(token)}`,
      { public: true, headers: { "X-Reference-Code": code } },
    ),
  refereeSubmit: (token: string, code: string, body: S["RefereeSubmission"]) =>
    apiRequest<Record<string, unknown>>(
      `/referee/academic-reference/${e(token)}/submit`,
      {
        method: "POST",
        body,
        public: true,
        headers: { "X-Reference-Code": code },
      },
    ),
  verify: (id: string) =>
    apiRequest<S["ReferenceVerificationResponse"]>(
      `/verify/academic-reference/${e(id)}`,
      { public: true },
    ),
};
export const interviewsApi = {
  list: (cursor?: string | null) =>
    apiRequest<S["AcademicInterviewListResponse"]>(
      `/academic-interviews${qs({ cursor, limit: 25 })}`,
    ),
  create: (body: S["AcademicInterviewCreate"]) =>
    apiRequest<S["AcademicInterviewResponse"]>("/academic-interviews", {
      method: "POST",
      body,
    }),
  get: (id: string) =>
    apiRequest<S["AcademicInterviewResponse"]>(`/academic-interviews/${e(id)}`),
  turns: (id: string) =>
    apiRequest<S["InterviewTurnResponse"][]>(
      `/academic-interviews/${e(id)}/turns`,
    ),
  answer: (id: string, body: S["InterviewAnswer"]) =>
    apiRequest<S["InterviewTurnResponse"]>(
      `/academic-interviews/${e(id)}/answers`,
      { method: "POST", body },
    ),
  complete: (id: string) =>
    apiRequest<S["AcademicInterviewResponse"]>(
      `/academic-interviews/${e(id)}/complete`,
      { method: "POST" },
    ),
  cancel: (id: string) =>
    apiRequest<S["AcademicInterviewResponse"]>(
      `/academic-interviews/${e(id)}/cancel`,
      { method: "POST" },
    ),
  report: (id: string) =>
    apiRequest<S["InterviewReportResponse"]>(
      `/academic-interviews/${e(id)}/report`,
    ),
  audioUpload: (id: string, body: S["InterviewAudioUploadRequest"]) =>
    apiRequest<S["InterviewAudioUploadResponse"]>(
      `/academic-interviews/${e(id)}/audio/upload-url`,
      { method: "POST", body },
    ),
  audioComplete: (id: string, body: S["InterviewAudioCompleteRequest"]) =>
    apiRequest<S["InterviewAudioResponse"]>(
      `/academic-interviews/${e(id)}/audio/complete`,
      { method: "POST", body },
    ),
  audio: (id: string, audioId: string, signal?: AbortSignal) =>
    apiRequest<S["InterviewAudioResponse"]>(
      `/academic-interviews/${e(id)}/audio/${e(audioId)}`,
      { signal },
    ),
};
export const notificationsApi = {
  list: (unreadOnly = false, cursor?: string | null) =>
    apiRequest<S["NotificationListResponse"]>(
      `/notifications${qs({ unreadOnly, cursor, limit: 25 })}`,
    ),
  unreadCount: () =>
    apiRequest<S["UnreadCountResponse"]>("/notifications/unread-count"),
  markRead: (id: string) =>
    apiRequest<S["NotificationResponse"]>(`/notifications/${e(id)}/read`, {
      method: "POST",
    }),
  markAllRead: () =>
    apiRequest<void>("/notifications/read-all", { method: "POST" }),
  preferences: () =>
    apiRequest<S["NotificationPreferencesResponse"]>(
      "/notification-preferences",
    ),
  updatePreferences: (body: S["NotificationPreferencesUpdate"]) =>
    apiRequest<S["NotificationPreferencesResponse"]>(
      "/notification-preferences",
      { method: "PUT", body },
    ),
};
export const remindersApi = {
  list: (filters: {
    aggregateType?: string;
    status?: string;
    cursor?: string | null;
  } = {}) =>
    apiRequest<S["ReminderListResponse"]>(
      `/reminders${qs({ ...filters, limit: 25 })}`,
    ),
  get: (id: string) => apiRequest<S["ReminderResponse"]>(`/reminders/${e(id)}`),
  create: (body: S["ReminderCreate"]) =>
    apiRequest<S["ReminderResponse"]>("/reminders", { method: "POST", body }),
  update: (id: string, body: S["ReminderUpdate"]) =>
    apiRequest<S["ReminderResponse"]>(`/reminders/${e(id)}`, {
      method: "PATCH",
      body,
    }),
  remove: (id: string) =>
    apiRequest<void>(`/reminders/${e(id)}`, { method: "DELETE" }),
  snooze: (id: string, body: S["ReminderSnoozeRequest"]) =>
    apiRequest<S["ReminderResponse"]>(`/reminders/${e(id)}/snooze`, {
      method: "POST",
      body,
    }),
  createFeed: () =>
    apiRequest<S["CalendarFeedTokenResponse"]>("/calendar-feed/token", {
      method: "POST",
    }),
  revokeFeed: () =>
    apiRequest<void>("/calendar-feed/token", { method: "DELETE" }),
  feedStatus: () =>
    apiRequest<S["CalendarFeedStatusResponse"]>("/calendar-feed/status"),
};
export async function uploadInterviewAudio(
  interviewId: string,
  blob: Blob,
  contentType: S["InterviewAudioUploadRequest"]["content_type"],
) {
  const signed = await interviewsApi.audioUpload(interviewId, {
    content_type: contentType,
    consent: true,
  });
  await uploadToSignedUrl({
    uploadUrl: signed.upload_url,
    method: signed.upload_method,
    fields: signed.upload_fields,
    file: blob,
    contentType,
    maxSizeBytes: signed.max_size_bytes,
  });
  return interviewsApi.audioComplete(interviewId, {
    audio_id: signed.audio_id,
    size_bytes: blob.size,
  });
}
export function documentText(content: Record<string, unknown> | undefined) {
  if (!content) return "";
  if (typeof content.text === "string") return content.text;
  if (Array.isArray(content.blocks))
    return content.blocks
      .map((x) =>
        x &&
        typeof x === "object" &&
        typeof (x as Record<string, unknown>).text === "string"
          ? String((x as Record<string, unknown>).text)
          : "",
      )
      .join("\n\n");
  return "";
}
export const mergeText = (
  content: Record<string, unknown> | undefined,
  text: string,
) => ({ ...content, text });
export const usageApi = {
  get: (entityType: string, entityId: string) =>
    apiRequest<S["EntityUsageResponse"]>(
      `/usage${qs({ entityType, entityId })}`,
    ),
};
export const storiesApi = writingApi;
export type StoryAIAssistResponse = S["StoryAIAssistResponse"];

