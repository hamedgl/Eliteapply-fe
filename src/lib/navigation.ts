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

export function safeNotificationPath(data: Record<string, unknown>) {
  const candidate = [data.path, data.url, data.deep_link].find(
    (value): value is string => typeof value === "string",
  );
  if (!candidate) return null;
  try {
    const url = new URL(candidate, window.location.origin);
    const allowed = appDestinations.some(
      (path) => url.pathname === path || url.pathname.startsWith(`${path}/`),
    );
    return url.origin === window.location.origin && allowed
      ? `${url.pathname}${url.search}`
      : null;
  } catch {
    return null;
  }
}
