import {
  Component,
  StrictMode,
  type ErrorInfo,
  type ReactNode,
} from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { PrivateRoot } from "./app/PrivateRoot";
import "./styles/index.css";

function Root() {
  return <PrivateRoot />;
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
