import {
  Component,
  lazy,
  StrictMode,
  Suspense,
  type ErrorInfo,
  type ReactNode,
} from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { App } from "./app/App";
import "./styles/index.css";

const PrivateRoot = lazy(() =>
  import("./app/PrivateRoot").then((module) => ({
    default: module.PrivateRoot,
  })),
);
const sessionPaths = new Set([
  "/login",
  "/register",
  "/confirm-email",
  "/forgot-password",
  "/reset-password",
]);

const needsSessionBootstrap = (pathname: string) =>
  sessionPaths.has(pathname) ||
  pathname === "/admin" ||
  pathname.startsWith("/admin/") ||
  pathname === "/app" ||
  pathname.startsWith("/app/") ||
  pathname.startsWith("/share/") ||
  pathname.startsWith("/collaborator-invitations/") ||
  pathname.startsWith("/referee/") ||
  pathname.startsWith("/verify/");

function Root() {
  if (!needsSessionBootstrap(window.location.pathname)) return <App />;
  return (
    <Suspense fallback={<main className="loading">Loading EliteApply…</main>}>
      <PrivateRoot />
    </Suspense>
  );
}

class RootErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("EliteApply failed to render", error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="app-route-error" role="alert">
        <section>
          <h1>EliteApply could not finish loading.</h1>
          <p>Your saved work has not been changed. Reload the page to try again.</p>
          <div>
            <button type="button" onClick={() => location.reload()}>
              Reload page
            </button>
            <a href="/">Return to EliteApply</a>
          </div>
        </section>
      </main>
    );
  }
}

const container = document.getElementById("root")!;
const application = (
  <StrictMode>
    <RootErrorBoundary>
      <Root />
    </RootErrorBoundary>
  </StrictMode>
);

if (container.hasChildNodes()) hydrateRoot(container, application);
else createRoot(container).render(application);
