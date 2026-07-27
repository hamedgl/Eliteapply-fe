import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AlertTriangle, Loader2 } from "lucide-react";
import { performTokenRefresh } from "../../lib/auth/refresh";
import "./auth-form.css";

/**
 * Lands here after the backend's `/auth/oauth/{provider}/callback` redirect. No token
 * ever appears in this URL — the backend already set the httpOnly refresh + CSRF
 * cookies (exactly like password login), so this page only needs to call the same
 * `performTokenRefresh()` every other page uses to pick up an access/id token pair.
 */
export function OAuthCallbackPage() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const [error, setError] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const oauthError = params.get("error");
    if (oauthError) {
      nav(`/login?error=${encodeURIComponent(oauthError)}`, { replace: true });
      return;
    }
    if (params.get("login") !== "success") {
      nav("/login?error=oauth_login_failed", { replace: true });
      return;
    }

    const returnTo = params.get("return_to");
    const destination = returnTo?.startsWith("/app") ? returnTo : "/app/dashboard";

    performTokenRefresh().then((result) => {
      if (result.kind === "success") {
        nav(destination, { replace: true });
      } else {
        setError("We couldn’t complete sign-in. Please try again.");
      }
    });
    // Runs once on mount — `started` guards React 18 StrictMode's double-invoke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <main className="auth-layout">
        <section className="auth-brand">
          <Link to="/" className="brand">
            EliteApply
          </Link>
        </section>
        <section className="auth-panel">
          <div className="auth-form">
            <div>
              <h1>Something went wrong</h1>
              <p>{error}</p>
            </div>
            <p className="form-error" role="alert">
              <AlertTriangle aria-hidden="true" /> Sign-in didn’t complete.
            </p>
            <Link className="primary" to="/login">
              Back to sign in
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-layout">
      <section className="auth-brand">
        <Link to="/" className="brand">
          EliteApply
        </Link>
      </section>
      <section className="auth-panel">
        <div className="auth-form" role="status" aria-live="polite">
          <div>
            <h1>Signing you in…</h1>
            <p>One moment while we finish connecting your account.</p>
          </div>
          <Loader2 aria-hidden="true" className="writing-preview-spinner oauth-callback-spinner" />
        </div>
      </section>
    </main>
  );
}
