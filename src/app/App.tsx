import { lazy, Suspense } from "react";
import {
  Navigate,
  RouterProvider,
  createBrowserRouter,
  useLocation,
} from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { AuthPage } from "../features/auth/AuthPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { LandingPage } from "../features/landing/LandingPage";
import {
  PrivacySettings,
  ProfileSettings,
  SecuritySettings,
} from "../features/account/SettingsPages";
import { useSession } from "../lib/auth/session";
const Applications = lazy(() =>
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
  ), WritingLibrary=lazy(()=>import("../features/writing/WritingPages").then(x=>({default:x.WritingLibrary}))),NewWriting=lazy(()=>import("../features/writing/WritingPages").then(x=>({default:x.NewWriting}))),WritingEditor=lazy(()=>import("../features/writing/WritingPages").then(x=>({default:x.WritingEditor}))),Stories=lazy(()=>import("../features/stories/StoriesPage").then(x=>({default:x.StoriesPage}))),References=lazy(()=>import("../features/references/ReferencePages").then(x=>({default:x.ReferencesPage}))),NewReference=lazy(()=>import("../features/references/ReferencePages").then(x=>({default:x.NewReference}))),Referee=lazy(()=>import("../features/references/ReferencePages").then(x=>({default:x.RefereePage}))),VerifyReference=lazy(()=>import("../features/references/ReferencePages").then(x=>({default:x.VerifyReference}))),Interview=lazy(()=>import("../features/interviews/InterviewPage").then(x=>({default:x.InterviewPage}))),AdminLaunch=lazy(()=>import("../features/admin/AdminLaunchPage").then(x=>({default:x.AdminLaunchPage})));
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
function Legal({ privacy = false }: { privacy?: boolean }) {
  return (
    <main className="legal">
      <a className="brand" href="/">
        EliteApply
      </a>
      <h1>{privacy ? "Privacy Policy" : "Terms of Service"}</h1>
      <p>Approved production legal copy is still required before launch.</p>
    </main>
  );
}
const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
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
  { path: "/terms", element: <Legal /> },
  { path: "/privacy", element: <Legal privacy /> },
  { path: "/referee/academic-reference/:token", element: load(<Referee />) },
  { path: "/verify/academic-reference/:publicId", element: load(<VerifyReference />) },
  {
    path: "/app",
    element: <Protected />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "onboarding", element: <DashboardPage /> },
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
      { path: "settings/profile", element: <ProfileSettings /> },
      { path: "settings/security", element: <SecuritySettings /> },
      { path: "settings/privacy", element: <PrivacySettings /> },
      { path: "unavailable", element: <Unavailable /> },
    ],
  },
]);
export function App() {
  return <RouterProvider router={router} />;
}
