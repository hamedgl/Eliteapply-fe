import { lazy, Suspense } from "react";
import {
  Navigate,
  RouterProvider,
  createBrowserRouter,
  useLocation,
} from "react-router-dom";
import { LandingPage } from "../features/landing/LandingPage";
import { useSession } from "../lib/auth/session";
const AppShell = lazy(() =>
    import("../components/AppShell").then((x) => ({ default: x.AppShell })),
  ),
  AuthPage = lazy(() =>
    import("../features/auth/AuthPage").then((x) => ({ default: x.AuthPage })),
  ),
  DashboardPage = lazy(() =>
    import("../features/dashboard/DashboardPage").then((x) => ({
      default: x.DashboardPage,
    })),
  ),
  ProfileSettings = lazy(() =>
    import("../features/account/SettingsPages").then((x) => ({
      default: x.ProfileSettings,
    })),
  ),
  SecuritySettings = lazy(() =>
    import("../features/account/SettingsPages").then((x) => ({
      default: x.SecuritySettings,
    })),
  ),
  PrivacySettings = lazy(() =>
    import("../features/account/SettingsPages").then((x) => ({
      default: x.PrivacySettings,
    })),
  ),
  Applications = lazy(() =>
    import("../features/applications/ApplicationsPage").then((x) => ({
      default: x.ApplicationsPage,
    })),
  ),
  Workspace = lazy(() =>
    import("../features/applications/ApplicationWorkspace").then((x) => ({
      default: x.ApplicationWorkspace,
    })),
  ),
  AcademicProfile = lazy(() =>
    import("../features/profile/AcademicProfilePage").then((x) => ({
      default: x.AcademicProfilePage,
    })),
  ),
  Documents = lazy(() =>
    import("../features/documents/DocumentsPage").then((x) => ({
      default: x.DocumentsPage,
    })),
  ),
  OpportunityImport = lazy(() =>
    import("../features/intelligence/ImportPage").then((x) => ({
      default: x.ImportPage,
    })),
  ),
  Catalogue = lazy(() =>
    import("../features/catalogue/CataloguePage").then((x) => ({
      default: x.CataloguePage,
    })),
  ),
  WritingLibrary = lazy(() =>
    import("../features/writing/WritingPages").then((x) => ({
      default: x.WritingLibrary,
    })),
  ),
  NewWriting = lazy(() =>
    import("../features/writing/WritingPages").then((x) => ({
      default: x.NewWriting,
    })),
  ),
  WritingEditor = lazy(() =>
    import("../features/writing/WritingPages").then((x) => ({
      default: x.WritingEditor,
    })),
  ),
  Stories = lazy(() =>
    import("../features/stories/StoriesPage").then((x) => ({
      default: x.StoriesPage,
    })),
  ),
  References = lazy(() =>
    import("../features/references/ReferencePages").then((x) => ({
      default: x.ReferencesPage,
    })),
  ),
  NewReference = lazy(() =>
    import("../features/references/ReferencePages").then((x) => ({
      default: x.NewReference,
    })),
  ),
  Referee = lazy(() =>
    import("../features/references/ReferencePages").then((x) => ({
      default: x.RefereePage,
    })),
  ),
  VerifyReference = lazy(() =>
    import("../features/references/ReferencePages").then((x) => ({
      default: x.VerifyReference,
    })),
  ),
  Interview = lazy(() =>
    import("../features/interviews/InterviewPage").then((x) => ({
      default: x.InterviewPage,
    })),
  ),
  AdminLaunch = lazy(() =>
    import("../features/admin/AdminLaunchPage").then((x) => ({
      default: x.AdminLaunchPage,
    })),
  ),
  MarketingPage = lazy(() =>
    import("../features/marketing/MarketingPages").then((x) => ({
      default: x.MarketingRoute,
    })),
  );
const load = (node: React.ReactNode) => (
  <Suspense
    fallback={
      <div className="page" role="status">
        Loading workspace…
      </div>
    }
  >
    {node}
  </Suspense>
);
function Protected() {
  const token = useSession((s) => s.accessToken),
    initializing = useSession((s) => s.initializing),
    location = useLocation();
  if (initializing)
    return (
      <main className="loading" role="status">
        Restoring your secure session…
      </main>
    );
  return token ? (
    <AppShell />
  ) : (
    <Navigate
      to={`/login?returnTo=${encodeURIComponent(location.pathname)}`}
      replace
    />
  );
}
function PublicOnly({ children }: { children: React.ReactNode }) {
  return useSession((s) => s.accessToken) ? (
    <Navigate to="/app/dashboard" replace />
  ) : (
    children
  );
}
function Unavailable() {
  return (
    <div className="page unavailable">
      <h1>This workspace is coming in Phase 3</h1>
      <p>
        We won’t pretend a feature is ready before its backend capability is
        verified.
      </p>
      <a href="/app/dashboard">Return to dashboard</a>
    </div>
  );
}
const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/features/*", element: load(<MarketingPage />) },
  { path: "/how-it-works", element: load(<MarketingPage />) },
  { path: "/for-students", element: load(<MarketingPage />) },
  { path: "/pricing", element: load(<MarketingPage />) },
  { path: "/security", element: load(<MarketingPage />) },
  { path: "/about", element: load(<MarketingPage />) },
  { path: "/contact", element: load(<MarketingPage />) },
  { path: "/resources/*", element: load(<MarketingPage />) },
  { path: "/scholarship-application-tracker", element: load(<MarketingPage />) },
  { path: "/scholarship-application-organiser", element: load(<MarketingPage />) },
  { path: "/scholarship-deadline-tracker", element: load(<MarketingPage />) },
  { path: "/scholarship-application-checklist", element: load(<MarketingPage />) },
  {
    path: "/login",
    element: (
      <PublicOnly>
        <AuthPage mode="login" />
      </PublicOnly>
    ),
  },
  {
    path: "/register",
    element: (
      <PublicOnly>
        <AuthPage mode="register" />
      </PublicOnly>
    ),
  },
  { path: "/confirm-email", element: <AuthPage mode="confirm" /> },
  { path: "/forgot-password", element: <AuthPage mode="forgot" /> },
  { path: "/reset-password", element: <AuthPage mode="reset" /> },
  { path: "/terms", element: load(<MarketingPage />) },
  { path: "/privacy", element: load(<MarketingPage />) },
  { path: "/accessibility", element: load(<MarketingPage />) },
  { path: "/referee/academic-reference/:token", element: load(<Referee />) },
  {
    path: "/verify/academic-reference/:publicId",
    element: load(<VerifyReference />),
  },
  {
    path: "/app",
    element: <Protected />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: "dashboard", element: load(<DashboardPage />) },
      { path: "onboarding", element: load(<DashboardPage />) },
      { path: "applications", element: load(<Applications />) },
      { path: "applications/:id", element: load(<Workspace />) },
      { path: "applications/import", element: load(<OpportunityImport />) },
      { path: "academic-profile", element: load(<AcademicProfile />) },
      { path: "documents", element: load(<Documents />) },
      { path: "catalogue", element: load(<Catalogue />) },
      { path: "writing", element: load(<WritingLibrary />) },
      { path: "writing/new", element: load(<NewWriting />) },
      { path: "writing/:id", element: load(<WritingEditor />) },
      { path: "stories", element: load(<Stories />) },
      { path: "references", element: load(<References />) },
      { path: "references/new", element: load(<NewReference />) },
      { path: "interviews/new", element: load(<Interview />) },
      { path: "admin/launch", element: load(<AdminLaunch />) },
      { path: "settings/profile", element: load(<ProfileSettings />) },
      { path: "settings/security", element: load(<SecuritySettings />) },
      { path: "settings/privacy", element: load(<PrivacySettings />) },
      { path: "unavailable", element: <Unavailable /> },
    ],
  },
]);
export function App() {
  return <RouterProvider router={router} />;
}
