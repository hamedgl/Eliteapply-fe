import type { components } from "../../generated/api/schema";
import { apiRequest } from "./client";
type S = components["schemas"];
const enc = encodeURIComponent;
export const profileApi = {
  get: () => apiRequest<S["AcademicProfileResponse"]>("/academic-profile"),
  save: (body: S["AcademicProfileUpsert"]) =>
    apiRequest<S["AcademicProfileResponse"]>("/academic-profile", {
      method: "PUT",
      body,
    }),
  versions: () =>
    apiRequest<S["AcademicProfileVersionResponse"][]>(
      "/academic-profile/versions",
    ),
};
export const applicationsApi = {
  list: () => apiRequest<S["ApplicationResponse"][]>("/applications"),
  board: () => apiRequest<S["ApplicationBoardResponse"]>("/applications/board"),
  create: (body: S["ApplicationCreate"]) =>
    apiRequest<S["ApplicationResponse"]>("/applications", {
      method: "POST",
      body,
    }),
  get: (id: string) =>
    apiRequest<S["ApplicationResponse"]>(`/applications/${enc(id)}`),
  update: (id: string, body: S["ApplicationUpdate"]) =>
    apiRequest<S["ApplicationResponse"]>(`/applications/${enc(id)}`, {
      method: "PATCH",
      body,
    }),
  workspace: (id: string) =>
    apiRequest<S["ApplicationWorkspaceResponse"]>(
      `/applications/${enc(id)}/workspace`,
    ),
  history: (id: string) =>
    apiRequest<S["AuditEventResponse"][]>(`/applications/${enc(id)}/history`),
  addRequirement: (id: string, body: S["RequirementCreate"]) =>
    apiRequest<S["RequirementResponse"]>(
      `/applications/${enc(id)}/requirements`,
      { method: "POST", body },
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
};
export const documentsApi = {
  list: () => apiRequest<S["DocumentResponse"][]>("/academic-documents"),
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
export const catalogueApi = {
  institutions: (search: string, signal?: AbortSignal) =>
    apiRequest<S["InstitutionResponse"][]>(
      `/catalogue/institutions?search=${enc(search)}`,
      { signal },
    ),
  createInstitution: (body: S["InstitutionCreate"]) =>
    apiRequest<S["InstitutionResponse"]>("/catalogue/institutions", {
      method: "POST",
      body,
    }),
  programmes: (institutionId: string, signal?: AbortSignal) =>
    apiRequest<S["ProgrammeResponse"][]>(
      `/catalogue/programmes?institutionId=${enc(institutionId)}`,
      { signal },
    ),
  createProgramme: (body: S["ProgrammeCreate"]) =>
    apiRequest<S["ProgrammeResponse"]>("/catalogue/programmes", {
      method: "POST",
      body,
    }),
  scholarships: () =>
    apiRequest<S["ScholarshipResponse"][]>("/catalogue/scholarships"),
  createScholarship: (body: S["ScholarshipCreate"]) =>
    apiRequest<S["ScholarshipResponse"]>("/catalogue/scholarships", {
      method: "POST",
      body,
    }),
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
  confirmImport: (id: string, body: S["ImportConfirmation"]) =>
    apiRequest<S["OpportunityImportResponse"]>(
      `/application-intelligence/imports/${enc(id)}/confirm`,
      { method: "POST", body },
    ),
  eligibility: (applicationId: string, body: S["EligibilityRequest"]) =>
    apiRequest<S["EligibilityResponse"]>(
      `/application-intelligence/applications/${enc(applicationId)}/eligibility`,
      { method: "POST", body },
    ),
};
export async function uploadAcademicDocument(
  file: File,
  category: string,
  signal?: AbortSignal,
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
  if (file.size > signed.max_size_bytes)
    throw new Error(
      `File exceeds ${Math.round(signed.max_size_bytes / 1048576)} MB.`,
    );
  if (signed.upload_method.toUpperCase() === "PUT") {
    const response = await fetch(signed.upload_url, {
      method: "PUT",
      body: file,
      headers: { "content-type": file.type },
      signal,
    });
    if (!response.ok) throw new Error("Storage upload failed.");
  } else {
    const body = new FormData();
    for (const [key, value] of Object.entries(signed.upload_fields))
      body.append(key, String(value));
    body.append("file", file);
    const response = await fetch(signed.upload_url, {
      method: signed.upload_method || "POST",
      body,
      signal,
    });
    if (!response.ok) throw new Error("Storage upload failed.");
  }
  return documentsApi.register({
    category,
    display_name: file.name,
    storage_key: signed.storage_key,
    content_type: file.type,
    size_bytes: file.size,
    tags: [],
  });
}
