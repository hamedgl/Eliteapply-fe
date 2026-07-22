const appDestinations = [
  "/app/dashboard",
  "/app/applications",
  "/app/catalogue",
  "/app/discovery",
  "/app/writing",
  "/app/stories",
  "/app/academic-profile",
  "/app/documents",
  "/app/references",
  "/app/interviews",
  "/app/notifications",
  "/app/reminders",
  "/app/settings",
];

export type WritingGenerationNavigationDraft = {
  documentId: string;
  operation: string;
  instruction: string;
};

export type AcademicProfileNavigationState = {
  returnTo: string;
  missingFields: string[];
  writingGenerationDraft: WritingGenerationNavigationDraft;
};

export const academicProfileEducationPath = () =>
  "/app/academic-profile?section=education";

export function readAcademicProfileNavigationState(
  value: unknown,
): AcademicProfileNavigationState | null {
  if (!value || typeof value !== "object") return null;
  const state = value as Partial<AcademicProfileNavigationState>;
  const draft = state.writingGenerationDraft;
  if (
    typeof state.returnTo !== "string" ||
    !Array.isArray(state.missingFields) ||
    !state.missingFields.every((field) => typeof field === "string") ||
    !draft ||
    typeof draft.documentId !== "string" ||
    typeof draft.operation !== "string" ||
    typeof draft.instruction !== "string"
  )
    return null;
  return state as AcademicProfileNavigationState;
}

export function safeAppPath(candidate: unknown) {
  if (typeof candidate !== "string") return null;
  try {
    const url = new URL(candidate, window.location.origin);
    const allowed = appDestinations.some(
      (path) => url.pathname === path || url.pathname.startsWith(`${path}/`),
    );
    return url.origin === window.location.origin && allowed
      ? `${url.pathname}${url.search}${url.hash}`
      : null;
  } catch {
    return null;
  }
}

export function safeNotificationPath(data: Record<string, unknown>) {
  const candidate = [data.path, data.url, data.deep_link].find(
    (value): value is string => typeof value === "string",
  );
  if (!candidate) return null;
  return safeAppPath(candidate);
}
