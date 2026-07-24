import { lazy, Suspense, useEffect, useRef } from "react";
import {
  Navigate,
  Link,
  RouterProvider,
  createBrowserRouter,
  isRouteErrorResponse,
  useLocation,
  useRouteError,
} from "react-router-dom";
import { useSession } from "../lib/auth/session";
import {
  LandingPage,
  ProductPreviewPage,
} from "../features/landing/LandingPage";
import {
  MarketingNotFoundPage,
  MarketingRoute as MarketingPage,
} from "../features/marketing/MarketingPages";

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
  );
function RouteLoading() {
  return (
    <div className="page route-loading" role="status" aria-busy="true">
      <span className="route-loading-label">Opening workspace</span>
      <div className="skeleton route-loading-title" />
      <div className="skeleton route-loading-copy" />
      <div className="route-loading-panels">
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
      <span className="sr-only">Loading workspace…</span>
    </div>
  );
}

const load = (node: React.ReactNode) => (
  <Suspense fallback={<RouteLoading />}>{node}</Suspense>
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
      <Link to="/app/dashboard">Return to dashboard</Link>
    </div>
  );
}

function AppRouteError() {
  const error = useRouteError();
  const status = isRouteErrorResponse(error) ? error.status : null;
  const sessionProblem = status === 401 || status === 403;

  return (
    <main className="app-route-error" role="alert">
      <Link className="app-brand" to="/app/dashboard">
        <span aria-hidden="true">E</span>
        EliteApply
      </Link>
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
          <Link to={sessionProblem ? "/login" : "/app/dashboard"}>
            {sessionProblem ? "Go to sign in" : "Return to dashboard"}
          </Link>
        </div>
      </section>
    </main>
  );
}

const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/product-preview", element: <ProductPreviewPage /> },
  { path: "/features/*", element: <MarketingPage /> },
  { path: "/how-it-works", element: <MarketingPage /> },
  { path: "/for-students", element: <MarketingPage /> },
  { path: "/pricing", element: <MarketingPage /> },
  { path: "/security", element: <MarketingPage /> },
  { path: "/about", element: <MarketingPage /> },
  { path: "/contact", element: <MarketingPage /> },
  { path: "/resources/*", element: <MarketingPage /> },
  {
    path: "/scholarship-application-tracker",
    element: <MarketingPage />,
  },
  {
    path: "/scholarship-application-organiser",
    element: <MarketingPage />,
  },
  { path: "/scholarship-deadline-tracker", element: <MarketingPage /> },
  {
    path: "/scholarship-application-checklist",
    element: <MarketingPage />,
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
  { path: "/terms", element: <MarketingPage /> },
  { path: "/privacy", element: <MarketingPage /> },
  { path: "/accessibility", element: <MarketingPage /> },
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
  { path: "*", element: <MarketingNotFoundPage /> },
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
