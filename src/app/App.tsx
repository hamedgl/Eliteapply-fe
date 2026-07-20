import { lazy, Suspense, useEffect, useRef } from "react";
import {
  Navigate,
  RouterProvider,
  createBrowserRouter,
  isRouteErrorResponse,
  useLocation,
  useRouteError,
} from "react-router-dom";
import {
  LandingPage,
  ProductPreviewPage,
} from "../features/landing/LandingPage";
import { useSession } from "../lib/auth/session";
const AppShell = lazy(() =>
    import("../components/AppShell").then((x) => ({ default: x.AppShell })),
  ),
  AuthPage = lazy(() =>
    import("../features/auth/AuthPage").then((x) => ({ default: x.AuthPage })),
  ),
  ResetPasswordPage = lazy(() =>
    import("../features/auth/ResetPasswordPage").then((x) => ({
      default: x.ResetPasswordPage,
    })),
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
  Billing = lazy(() =>
    import("../features/billing/BillingPage").then((x) => ({
      default: x.BillingPage,
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
  DocumentDetail = lazy(() =>
    import("../features/documents/DocumentsPage").then((x) => ({
      default: x.DocumentDetailPage,
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
  Discovery = lazy(() =>
    import("../features/catalogue/DiscoveryPage").then((x) => ({
      default: x.DiscoveryPage,
    })),
  ),
  AcceptInvitation = lazy(() =>
    import("../features/collaboration/CollaborationRoutes").then((x) => ({
      default: x.AcceptCollaboratorInvitation,
    })),
  ),
  SharedWriting = lazy(() =>
    import("../features/collaboration/CollaborationRoutes").then((x) => ({
      default: x.SharedWritingPage,
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
  ReferenceDetail = lazy(() =>
    import("../features/references/ReferencePages").then((x) => ({
      default: x.ReferenceDetail,
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
  Interviews = lazy(() =>
    import("../features/interviews/InterviewPage").then((x) => ({
      default: x.InterviewsPage,
    })),
  ),
  NewInterview = lazy(() =>
    import("../features/interviews/InterviewPage").then((x) => ({ default: x.NewInterviewPage })),
  ),
  Interview = lazy(() =>
    import("../features/interviews/InterviewPage").then((x) => ({ default: x.InterviewPage })),
  ),
  Notifications = lazy(() =>
    import("../features/notifications/NotificationsPage").then((x) => ({ default: x.NotificationsPage })),
  ),
  Reminders = lazy(() =>
    import("../features/reminders/RemindersPage").then((x) => ({ default: x.RemindersPage })),
  ),
  AdminPanel = lazy(() =>
    import("../features/admin/AdminPanel").then((x) => ({
      default: x.AdminPanel,
    })),
  ),
  MarketingPage = lazy(() =>
    import("../features/marketing/MarketingPages").then((x) => ({
      default: x.MarketingRoute,
    })),
  ),
  MarketingNotFoundPage = lazy(() =>
    import("../features/marketing/MarketingPages").then((x) => ({
      default: x.MarketingNotFoundPage,
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

function AppRouteError() {
  const error = useRouteError();
  const status = isRouteErrorResponse(error) ? error.status : null;
  const sessionProblem = status === 401 || status === 403;

  return (
    <main className="app-route-error" role="alert">
      <a className="app-brand" href="/app/dashboard">
        <span aria-hidden="true">E</span>
        EliteApply
      </a>
      <section>
        <span className="route-error-code" aria-hidden="true">
          {status ?? "!"}
        </span>
        <h1>
          {sessionProblem
            ? "Your session needs attention"
            : "We hit an unexpected problem"}
        </h1>
        <p>
          {sessionProblem
            ? "Sign in again to continue securely. Your saved application data has not been changed."
            : "This workspace could not finish loading. Your saved data is safe, and reloading usually resolves the problem."}
        </p>
        <div>
          <button
            className="primary"
            type="button"
            onClick={() => location.reload()}
          >
            Reload page
          </button>
          <a href={sessionProblem ? "/login" : "/app/dashboard"}>
            {sessionProblem ? "Go to sign in" : "Return to dashboard"}
          </a>
        </div>
      </section>
    </main>
  );
}

const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/product-preview", element: <ProductPreviewPage /> },
  { path: "/features/*", element: load(<MarketingPage />) },
  { path: "/how-it-works", element: load(<MarketingPage />) },
  { path: "/for-students", element: load(<MarketingPage />) },
  { path: "/pricing", element: load(<MarketingPage />) },
  { path: "/security", element: load(<MarketingPage />) },
  { path: "/about", element: load(<MarketingPage />) },
  { path: "/contact", element: load(<MarketingPage />) },
  { path: "/resources/*", element: load(<MarketingPage />) },
  {
    path: "/scholarship-application-tracker",
    element: load(<MarketingPage />),
  },
  {
    path: "/scholarship-application-organiser",
    element: load(<MarketingPage />),
  },
  { path: "/scholarship-deadline-tracker", element: load(<MarketingPage />) },
  {
    path: "/scholarship-application-checklist",
    element: load(<MarketingPage />),
  },
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
  { path: "/reset-password", element: <ResetPasswordPage /> },
  { path: "/terms", element: load(<MarketingPage />) },
  { path: "/privacy", element: load(<MarketingPage />) },
  { path: "/accessibility", element: load(<MarketingPage />) },
  { path: "/share/:token", element: load(<SharedWriting />) },
  {
    path: "/collaborator-invitations/:token/accept",
    element: load(<AcceptInvitation />),
  },
  {
    path: "/collaborator-invitations/accept",
    element: load(<AcceptInvitation />),
  },
  {
    path: "/admin/*",
    element: load(<AdminPanel />),
    errorElement: <AppRouteError />,
  },
  { path: "/referee/academic-reference/:token", element: load(<Referee />) },
  {
    path: "/verify/academic-reference/:publicId",
    element: load(<VerifyReference />),
  },
  {
    path: "/app",
    element: <Protected />,
    errorElement: <AppRouteError />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: "dashboard", element: load(<DashboardPage />) },
      { path: "onboarding", element: load(<DashboardPage />) },
      { path: "applications", element: load(<Applications />) },
      { path: "applications/:id", element: load(<Workspace />) },
      { path: "applications/:id/:resource", element: load(<Workspace />) },
      { path: "applications/import", element: load(<OpportunityImport />) },
      { path: "academic-profile", element: load(<AcademicProfile />) },
      { path: "documents", element: load(<Documents />) },
      { path: "documents/:id", element: load(<DocumentDetail />) },
      { path: "catalogue", element: load(<Catalogue />) },
      { path: "catalogue/:kind/:id", element: load(<Catalogue />) },
      { path: "discovery", element: load(<Discovery />) },
      { path: "writing", element: load(<WritingLibrary />) },
      { path: "writing/new", element: load(<NewWriting />) },
      { path: "writing/:id", element: load(<WritingEditor />) },
      { path: "stories", element: load(<Stories />) },
      { path: "references", element: load(<References />) },
      { path: "references/new", element: load(<NewReference />) },
      { path: "references/:id", element: load(<ReferenceDetail />) },
      { path: "interviews", element: load(<Interviews />) },
      { path: "interviews/new", element: load(<NewInterview />) },
      { path: "interviews/:id", element: load(<Interview />) },
      { path: "notifications", element: load(<Notifications />) },
      { path: "reminders", element: load(<Reminders />) },
      { path: "settings/profile", element: load(<ProfileSettings />) },
      { path: "settings/security", element: load(<SecuritySettings />) },
      { path: "settings/privacy", element: load(<PrivacySettings />) },
      { path: "settings/billing", element: load(<Billing />) },
      { path: "settings/billing/:result", element: load(<Billing />) },
      { path: "unavailable", element: <Unavailable /> },
    ],
  },
  { path: "*", element: load(<MarketingNotFoundPage />) },
]);
export function App() {
  const previousPath = useRef(router.state.location.pathname);
  useEffect(() => router.subscribe(({location}) => {
    if (location.pathname === previousPath.current) return;
    previousPath.current = location.pathname;
    window.scrollTo(0, 0);
  }), []);
  return <RouterProvider router={router} />;
}
