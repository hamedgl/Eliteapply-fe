import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import "./styles/index.css";

const PrivateRoot = lazy(() =>
  import("./app/PrivateRoot").then((module) => ({
    default: module.PrivateRoot,
  })),
);
const standalonePublicPaths = new Set([
  "/",
  "/how-it-works",
  "/for-students",
  "/pricing",
  "/security",
  "/about",
  "/contact",
  "/scholarship-application-tracker",
  "/scholarship-application-organiser",
  "/scholarship-deadline-tracker",
  "/scholarship-application-checklist",
  "/terms",
  "/privacy",
  "/accessibility",
]);

const isStandalonePublicRoute = (pathname: string) =>
  standalonePublicPaths.has(pathname) ||
  pathname === "/features" ||
  pathname.startsWith("/features/") ||
  pathname === "/resources" ||
  pathname.startsWith("/resources/");

function Root() {
  if (isStandalonePublicRoute(window.location.pathname)) return <App />;
  return (
    <Suspense fallback={<main className="loading">Loading EliteApply…</main>}>
      <PrivateRoot />
    </Suspense>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
