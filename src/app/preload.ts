const routeLoaders = {
  dashboard: () => import("../features/dashboard/DashboardPage"),
  applications: () => import("../features/applications/ApplicationsPage"),
  catalogue: () => import("../features/catalogue/CataloguePage"),
  discovery: () => import("../features/catalogue/DiscoveryPage"),
  writing: () => import("../features/writing/WritingPages"),
  stories: () => import("../features/stories/StoriesPage"),
  profile: () => import("../features/profile/AcademicProfilePage"),
  documents: () => import("../features/documents/DocumentsPage"),
  references: () => import("../features/references/ReferencePages"),
  interviews: () => import("../features/interviews/InterviewPage"),
  reminders: () => import("../features/reminders/RemindersPage"),
  notifications: () => import("../features/notifications/NotificationsPage"),
  settings: () => import("../features/account/SettingsPages"),
} as const;

/** Start fetching a route chunk while the user is about to navigate to it. */
export function preloadAppRoute(path: string) {
  const key =
    path === "/app/dashboard" ? "dashboard" :
    path === "/app/applications" ? "applications" :
    path === "/app/catalogue" ? "catalogue" :
    path === "/app/discovery" ? "discovery" :
    path === "/app/writing" ? "writing" :
    path === "/app/stories" ? "stories" :
    path === "/app/academic-profile" ? "profile" :
    path === "/app/documents" ? "documents" :
    path === "/app/references" ? "references" :
    path === "/app/interviews" ? "interviews" :
    path === "/app/reminders" ? "reminders" :
    path === "/app/notifications" ? "notifications" :
    path.startsWith("/app/settings/") ? "settings" :
    undefined;
  if (key) void routeLoaders[key]();
}
