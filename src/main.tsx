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
  "/terms",
  "/privacy",
  "/accessibility",
]);

function Root() {
  if (standalonePublicPaths.has(window.location.pathname)) return <App />;
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
