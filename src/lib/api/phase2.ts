import type { components, operations } from "../../generated/api/schema";
import { apiRequest } from "./client";
import { uploadToSignedUrl } from "./signedTransport";
type S = components["schemas"];
type ApplicationListQuery = NonNullable<
  operations["list_applications_api_v1_applications_get"]["parameters"]["query"]
>;
export type ApplicationSort = NonNullable<ApplicationListQuery["sort"]>;
const enc = encodeURIComponent;
const query = (
  values: Record<
    string,
    string | number | boolean | null | undefined | (string | number)[]
  >,
) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined && item !== null && item !== "") {
          params.append(key, String(item));
        }
      }
    } else {
      params.set(key, String(value));
    }
  }
  const result = params.toString();
  return result ? `?${result}` : "";
};
export type ApplicationFilters = {
  search?: string;
  stage?: string;
  applicationType?: string;
  priority?: string;
  institutionId?: string;
  programmeId?: string;
  scholarshipId?: string;
  deadlineFrom?: string;
  deadlineTo?: string;
  tag?: string;
  tags?: string[] | string;
  archived?: boolean;
  sort?: ApplicationSort;
  cursor?: string | null;
  limit?: number;
};
export const profileApi = {
  get: () =>
    apiRequest<S["AcademicProfileResponse"] | null>("/academic-profile"),
  save: (body: S["AcademicProfileUpsert"]) =>
    apiRequest<S["AcademicProfileResponse"]>("/academic-profile", {
      method: "PUT",
      body,
    }),
  versions: () =>
    apiRequest<S["AcademicProfileVersionResponse"][]>(
      "/academic-profile/versions",
    ),
  version: (id: string) =>
    apiRequest<S["AcademicProfileVersionResponse"]>(
      `/academic-profile/versions/${enc(id)}`,
    ),
  restore: (id: string, body: S["AcademicProfileRestoreRequest"]) =>
    apiRequest<S["AcademicProfileResponse"]>(
      `/academic-profile/versions/${enc(id)}/restore`,
      { method: "POST", body },
    ),
  import: (body: S["AcademicProfileImportRequest"]) =>
    apiRequest<S["AcademicProfileResponse"]>("/academic-profile/import", {
      method: "POST",
      body,
    }),
  remove: () => apiRequest<void>("/academic-profile", { method: "DELETE" }),
};
export const applicationsApi = {
  list: (filters: ApplicationFilters = {}) =>
    apiRequest<S["ApplicationListResponse"]>(
      `/applications${query({ limit: 25, ...filters })}`,
    ),
  board: (
    filters: Pick<
      ApplicationFilters,
      "applicationType" | "priority" | "institutionId"
    > & { deadlineBefore?: string } = {},
  ) =>
    apiRequest<S["ApplicationBoardResponse"]>(
      `/applications/board${query(filters)}`,
    ),
  create: (body: S["ApplicationCreate"]) =>
    apiRequest<S["ApplicationResponse"]>("/applications", {
      method: "POST",
      body,
    }),
  get: (id: string, signal?: AbortSignal) =>
    apiRequest<S["ApplicationResponse"]>(`/applications/${enc(id)}`, {
      signal,
    }),
  update: (id: string, body: S["ApplicationUpdate"]) =>
    apiRequest<S["ApplicationResponse"]>(`/applications/${enc(id)}`, {
      method: "PATCH",
      body,
    }),
  bulkUpdate: (body: S["ApplicationBulkUpdateRequest"]) =>
    apiRequest<S["ApplicationBulkUpdateResponse"]>(
      "/applications/bulk-update",
      {
        method: "POST",
        body,
      },
    ),
  duplicate: (id: string, body: S["ApplicationDuplicateRequest"]) =>
    apiRequest<S["ApplicationResponse"]>(`/applications/${enc(id)}/duplicate`, {
      method: "POST",
      body,
    }),
  archive: (id: string, body: S["ApplicationArchiveRequest"]) =>
    apiRequest<S["ApplicationResponse"]>(`/applications/${enc(id)}/archive`, {
      method: "POST",
      body,
    }),
  remove: (id: string) =>
    apiRequest<void>(`/applications/${enc(id)}`, { method: "DELETE" }),
  export: (id: string) =>
    apiRequest<S["ApplicationExportResponse"]>(
      `/applications/${enc(id)}/export`,
    ),
  readiness: (id: string) =>
    apiRequest<S["ApplicationReadinessResponse"]>(
      `/applications/${enc(id)}/readiness`,
    ),
  submit: (id: string, body: S["ApplicationSubmitRequest"]) =>
    apiRequest<S["ApplicationResponse"]>(`/applications/${enc(id)}/submit`, {
      method: "POST",
      body,
    }),
  workspace: (id: string, signal?: AbortSignal) =>
    apiRequest<S["ApplicationWorkspaceResponse"]>(
      `/applications/${enc(id)}/workspace`,
      { signal },
    ),
  history: (id: string) =>
    apiRequest<S["AuditEventResponse"][]>(`/applications/${enc(id)}/history`),
  activity: (id: string, category?: string, cursor?: string, limit = 25) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (category) params.set("category", category);
    if (cursor) params.set("cursor", cursor);
    return apiRequest<S["ActivityPageResponse"]>(
      `/applications/${enc(id)}/activity?${params}`,
    );
  },
  addRequirement: (id: string, body: S["RequirementCreate"]) =>
    apiRequest<S["RequirementResponse"]>(
      `/applications/${enc(id)}/requirements`,
      { method: "POST", body },
    ),
  requirements: (id: string, signal?: AbortSignal) =>
    apiRequest<S["RequirementResponse"][]>(
      `/applications/${enc(id)}/requirements`,
      { signal },
    ),
  requirement: (requirementId: string, signal?: AbortSignal) =>
    apiRequest<S["RequirementResponse"]>(
      `/applications/requirements/${enc(requirementId)}`,
      { signal },
    ),
  addRequirements: (id: string, body: S["RequirementBulkCreate"]) =>
    apiRequest<S["RequirementResponse"][]>(
      `/applications/${enc(id)}/requirements/bulk`,
      {
        method: "POST",
        body,
      },
    ),
  reorderRequirements: (id: string, body: S["RequirementReorderRequest"]) =>
    apiRequest<S["RequirementResponse"][]>(
      `/applications/${enc(id)}/requirements/reorder`,
      {
        method: "POST",
        body,
      },
    ),
  validateRequirement: (
    applicationId: string,
    requirementId: string,
    body: S["RequirementValidateRequest"],
  ) =>
    apiRequest<S["RequirementResponse"]>(
      `/applications/${enc(applicationId)}/requirements/${enc(requirementId)}/validate`,
      {
        method: "POST",
        body,
      },
    ),
  updateRequirement: (
    appId: string,
    id: string,
    body: S["RequirementUpdate"],
  ) =>
    apiRequest<S["RequirementResponse"]>(
      `/applications/${enc(appId)}/requirements/${enc(id)}`,
      { method: "PATCH", body },
    ),
  deleteRequirement: (appId: string, id: string) =>
    apiRequest<void>(`/applications/${enc(appId)}/requirements/${enc(id)}`, {
      method: "DELETE",
    }),
  addTask: (id: string, body: S["TaskCreate"]) =>
    apiRequest<S["TaskResponse"]>(`/applications/${enc(id)}/tasks`, {
      method: "POST",
      body,
    }),
  tasks: (id: string, signal?: AbortSignal) =>
    apiRequest<S["TaskResponse"][]>(`/applications/${enc(id)}/tasks`, {
      signal,
    }),
  task: (taskId: string, signal?: AbortSignal) =>
    apiRequest<S["TaskResponse"]>(`/applications/tasks/${enc(taskId)}`, {
      signal,
    }),
  addTasks: (id: string, body: S["TaskBulkCreate"]) =>
    apiRequest<S["TaskResponse"][]>(`/applications/${enc(id)}/tasks/bulk`, {
      method: "POST",
      body,
    }),
  reorderTasks: (id: string, body: S["TaskReorderRequest"]) =>
    apiRequest<S["TaskResponse"][]>(`/applications/${enc(id)}/tasks/reorder`, {
      method: "POST",
      body,
    }),
  updateTask: (appId: string, id: string, body: S["TaskUpdate"]) =>
    apiRequest<S["TaskResponse"]>(
      `/applications/${enc(appId)}/tasks/${enc(id)}`,
      { method: "PATCH", body },
    ),
  deleteTask: (appId: string, id: string) =>
    apiRequest<void>(`/applications/${enc(appId)}/tasks/${enc(id)}`, {
      method: "DELETE",
    }),
  linkDocument: (id: string, body: S["DocumentLinkCreate"]) =>
    apiRequest<S["DocumentLinkResponse"]>(
      `/applications/${enc(id)}/documents`,
      { method: "POST", body },
    ),
  updateDocumentLink: (
    applicationId: string,
    linkId: string,
    body: S["DocumentLinkUpdate"],
  ) =>
    apiRequest<S["DocumentLinkResponse"]>(
      `/applications/${enc(applicationId)}/documents/${enc(linkId)}`,
      { method: "PATCH", body },
    ),
  documentLinks: (id: string) =>
    apiRequest<S["DocumentLinkResponse"][]>(
      `/applications/${enc(id)}/documents`,
    ),
  unlinkDocument: (applicationId: string, linkId: string) =>
    apiRequest<void>(
      `/applications/${enc(applicationId)}/documents/${enc(linkId)}`,
      { method: "DELETE" },
    ),
};
export const documentsApi = {
  list: () => apiRequest<S["DocumentResponse"][]>("/academic-documents"),
  get: (id: string) =>
    apiRequest<S["DocumentResponse"]>(`/academic-documents/${enc(id)}`),
  update: (id: string, body: S["DocumentUpdate"]) =>
    apiRequest<S["DocumentResponse"]>(`/academic-documents/${enc(id)}`, {
      method: "PATCH",
      body,
    }),
  replace: (
    id: string,
    body: {
      storage_key: string;
      display_name: string;
      content_type: string;
      size_bytes: number;
      checksum_sha256?: string | null;
      reason?: string | null;
    },
  ) =>
    apiRequest<S["DocumentResponse"]>(
      `/academic-documents/${enc(id)}/replace`,
      { method: "POST", body },
    ),
  links: (id: string) =>
    apiRequest<{
      document_id: string;
      linked_application_ids: string[];
      link_count: number;
    }>(`/academic-documents/${enc(id)}/links`),
  activity: (id: string) =>
    apiRequest<S["DocumentAuditEventResponse"][]>(
      `/academic-documents/${enc(id)}/activity`,
    ),
  versions: (id: string) =>
    apiRequest<S["DocumentVersionResponse"][]>(
      `/academic-documents/${enc(id)}/versions`,
    ),
  scanStatus: (id: string) =>
    apiRequest<S["DocumentScanStatusResponse"]>(
      `/academic-documents/${enc(id)}/scan-status`,
    ),
  uploadUrl: (body: S["DocumentUploadRequest"]) =>
    apiRequest<S["DocumentUploadResponse"]>("/academic-documents/upload-url", {
      method: "POST",
      body,
    }),
  register: (body: S["DocumentCreate"]) =>
    apiRequest<S["DocumentResponse"]>("/academic-documents", {
      method: "POST",
      body,
    }),
  download: (id: string) =>
    apiRequest<S["DocumentDownloadResponse"]>(
      `/academic-documents/${enc(id)}/download`,
    ),
  remove: (id: string) =>
    apiRequest<void>(`/academic-documents/${enc(id)}`, { method: "DELETE" }),
};
export type CatalogueFilters = {
  search?: string;
  country?: string;
  verified?: boolean;
  institutionId?: string;
  degreeLevel?: string;
  fieldOfStudy?: string;
  cursor?: string | null;
  limit?: number;
};
export const catalogueApi = {
  reportIssue: (body: S["CatalogueReportIssueRequest"]) =>
    apiRequest<{ status: string }>("/catalogue/report-issue", {
      method: "POST",
      body,
    }),
  countries: () =>
    apiRequest<S["CatalogueCountryResponse"][]>("/catalogue/countries"),
  institutions: (filters: CatalogueFilters = {}, signal?: AbortSignal) =>
    apiRequest<S["InstitutionListResponse"]>(
      `/catalogue/institutions${query({ limit: 25, ...filters })}`,
      { signal },
    ),
  institution: (id: string) =>
    apiRequest<S["InstitutionResponse"]>(`/catalogue/institutions/${enc(id)}`),
  createInstitution: (body: S["InstitutionCreate"]) =>
    apiRequest<S["InstitutionResponse"]>("/catalogue/institutions", {
      method: "POST",
      body,
    }),
  updateInstitution: (id: string, body: S["InstitutionUpdate"]) =>
    apiRequest<S["InstitutionResponse"]>(`/catalogue/institutions/${enc(id)}`, {
      method: "PATCH",
      body,
    }),
  deleteInstitution: (id: string) =>
    apiRequest<void>(`/catalogue/institutions/${enc(id)}`, {
      method: "DELETE",
    }),
  programmes: (filters: CatalogueFilters = {}, signal?: AbortSignal) =>
    apiRequest<S["ProgrammeListResponse"]>(
      `/catalogue/programmes${query({ limit: 25, ...filters })}`,
      { signal },
    ),
  programme: (id: string) =>
    apiRequest<S["ProgrammeResponse"]>(`/catalogue/programmes/${enc(id)}`),
  createProgramme: (body: S["ProgrammeCreate"]) =>
    apiRequest<S["ProgrammeResponse"]>("/catalogue/programmes", {
      method: "POST",
      body,
    }),
  updateProgramme: (id: string, body: S["ProgrammeUpdate"]) =>
    apiRequest<S["ProgrammeResponse"]>(`/catalogue/programmes/${enc(id)}`, {
      method: "PATCH",
      body,
    }),
  deleteProgramme: (id: string) =>
    apiRequest<void>(`/catalogue/programmes/${enc(id)}`, { method: "DELETE" }),
  scholarships: (filters: CatalogueFilters = {}, signal?: AbortSignal) =>
    apiRequest<S["ScholarshipListResponse"]>(
      `/catalogue/scholarships${query({ limit: 25, ...filters })}`,
      { signal },
    ),
  scholarship: (id: string) =>
    apiRequest<S["ScholarshipResponse"]>(`/catalogue/scholarships/${enc(id)}`),
  createScholarship: (body: S["ScholarshipCreate"]) =>
    apiRequest<S["ScholarshipResponse"]>("/catalogue/scholarships", {
      method: "POST",
      body,
    }),
  updateScholarship: (id: string, body: S["ScholarshipUpdate"]) =>
    apiRequest<S["ScholarshipResponse"]>(`/catalogue/scholarships/${enc(id)}`, {
      method: "PATCH",
      body,
    }),
  deleteScholarship: (id: string) =>
    apiRequest<void>(`/catalogue/scholarships/${enc(id)}`, {
      method: "DELETE",
    }),
};
export const discoveryApi = {
  savedSearches: () =>
    apiRequest<S["SavedSearchResponse"][]>("/saved-searches"),
  savedSearch: (id: string) =>
    apiRequest<S["SavedSearchResponse"]>(`/saved-searches/${enc(id)}`),
  createSavedSearch: (body: S["SavedSearchCreate"]) =>
    apiRequest<S["SavedSearchResponse"]>("/saved-searches", {
      method: "POST",
      body,
    }),
  updateSavedSearch: (id: string, body: S["SavedSearchUpdate"]) =>
    apiRequest<S["SavedSearchResponse"]>(`/saved-searches/${enc(id)}`, {
      method: "PATCH",
      body,
    }),
  deleteSavedSearch: (id: string) =>
    apiRequest<void>(`/saved-searches/${enc(id)}`, { method: "DELETE" }),
  runSavedSearch: (id: string) =>
    apiRequest<S["SavedSearchRunResponse"]>(`/saved-searches/${enc(id)}/run`, {
      method: "POST",
    }),
  matches: (body: S["OpportunityMatchRequest"]) =>
    apiRequest<S["OpportunityMatchResponse"]>(
      "/application-intelligence/matches",
      {
        method: "POST",
        body,
      },
    ),
  recommendations: () =>
    apiRequest<S["RecommendationsResponse"]>(
      "/application-intelligence/recommendations",
    ),
};
export const intelligenceApi = {
  createImport: (body: S["OpportunityImportCreate"]) =>
    apiRequest<S["OpportunityImportResponse"]>(
      "/application-intelligence/imports",
      { method: "POST", body },
    ),
  getImport: (id: string, signal?: AbortSignal) =>
    apiRequest<S["OpportunityImportResponse"]>(
      `/application-intelligence/imports/${enc(id)}`,
      { signal },
    ),
  imports: (cursor?: string | null, signal?: AbortSignal) =>
    apiRequest<S["OpportunityImportListResponse"]>(
      `/application-intelligence/imports${query({ cursor, limit: 20 })}`,
      { signal },
    ),
  confirmImport: (id: string, body: S["ImportConfirmation"]) =>
    apiRequest<S["OpportunityImportResponse"]>(
      `/application-intelligence/imports/${enc(id)}/confirm`,
      { method: "POST", body },
    ),
  retryImport: (id: string) =>
    apiRequest<S["OpportunityImportResponse"]>(
      `/application-intelligence/imports/${enc(id)}/retry`,
      { method: "POST" },
    ),
  cancelImport: (id: string) =>
    apiRequest<S["OpportunityImportResponse"]>(
      `/application-intelligence/imports/${enc(id)}/cancel`,
      { method: "POST" },
    ),
  deleteImport: (id: string) =>
    apiRequest<void>(`/application-intelligence/imports/${enc(id)}`, {
      method: "DELETE",
    }),
  eligibility: (applicationId: string, body: S["EligibilityRequest"]) =>
    apiRequest<S["EligibilityResponse"]>(
      `/application-intelligence/applications/${enc(applicationId)}/eligibility`,
      { method: "POST", body },
    ),
  currentEligibility: (applicationId: string) =>
    apiRequest<S["EligibilityResponse"]>(
      `/application-intelligence/applications/${enc(applicationId)}/eligibility`,
    ),
  eligibilityHistory: (applicationId: string, cursor?: string | null) =>
    apiRequest<S["EligibilityHistoryResponse"]>(
      `/application-intelligence/applications/${enc(applicationId)}/eligibility/history${query({ cursor, limit: 20 })}`,
    ),
  recalculateEligibility: (
    applicationId: string,
    body: S["EligibilityRequest"],
  ) =>
    apiRequest<S["EligibilityResponse"]>(
      `/application-intelligence/applications/${enc(applicationId)}/eligibility/recalculate`,
      { method: "POST", body },
    ),
};
export async function uploadAcademicDocument(
  file: File,
  category: string,
  signal?: AbortSignal,
  options?: {
    displayName?: string;
    tags?: string[];
    expiresAt?: string | null;
  },
) {
  const allowed = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
  ];
  if (!allowed.includes(file.type))
    throw new Error("Use PDF, DOCX, JPG or PNG.");
  const signed = await documentsApi.uploadUrl({
    filename: file.name,
    content_type: file.type as S["DocumentUploadRequest"]["content_type"],
  });
  await uploadToSignedUrl({
    uploadUrl: signed.upload_url,
    method: signed.upload_method,
    fields: signed.upload_fields,
    file,
    contentType: file.type,
    maxSizeBytes: signed.max_size_bytes,
    signal,
  });
  return documentsApi.register({
    category,
    display_name: options?.displayName || file.name,
    storage_key: signed.storage_key,
    content_type: file.type,
    size_bytes: file.size,
    tags: options?.tags ?? [],
    expires_at: options?.expiresAt ?? null,
  });
}
