import { Link } from "react-router-dom";
import { productConfig } from "../../lib/config/product";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 18 18" aria-hidden="true" width="18" height="18">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.83.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.03l3-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .95 4.97l3 2.33C4.66 5.17 6.65 3.58 9 3.58Z"
      />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18">
      <rect width="24" height="24" rx="4" fill="#0A66C2" />
      <path
        fill="#fff"
        d="M7.12 9.4H4.4V19h2.72V9.4ZM5.76 5c-.93 0-1.6.63-1.6 1.46 0 .81.65 1.46 1.56 1.46h.02c.95 0 1.6-.65 1.6-1.46C7.32 5.63 6.69 5 5.76 5ZM19.6 13.5c0-2.62-1.4-3.84-3.27-3.84-1.5 0-2.18.83-2.55 1.41V9.4H11.06c.04.77 0 9.6 0 9.6h2.72v-5.36c0-.29.02-.57.11-.78.23-.57.76-1.17 1.65-1.17 1.17 0 1.63.89 1.63 2.19V19h2.72l.01-5.5Z"
      />
    </svg>
  );
}

/**
 * Redirect-based OAuth — clicking navigates the whole tab to the backend's `/init`
 * route, which 302s to Google/LinkedIn and eventually back to `/auth/callback`.
 * No client-side SDK/popup: matches the same pattern as email/password login, which
 * already runs through the httpOnly refresh-cookie + CSRF-cookie flow.
 */
function startOAuth(provider: "google" | "linkedin", returnTo: string | null) {
  const params = new URLSearchParams();
  if (returnTo?.startsWith("/app")) params.set("return_to", returnTo);
  params.set("accepted_terms_version", productConfig.legal.currentTermsVersion);
  window.location.href = `${productConfig.apiBaseUrl}/auth/oauth/${provider}/init?${params.toString()}`;
}

export function OAuthButtons({
  mode,
  returnTo,
}: {
  mode: "login" | "register";
  returnTo: string | null;
}) {
  const verb = mode === "login" ? "Sign in" : "Continue";
  return (
    <div className="oauth-block">
      <div className="oauth-buttons">
        <button
          type="button"
          className="oauth-button"
          onClick={() => startOAuth("google", returnTo)}
        >
          <GoogleIcon /> {verb} with Google
        </button>
        <button
          type="button"
          className="oauth-button"
          onClick={() => startOAuth("linkedin", returnTo)}
        >
          <LinkedInIcon /> {verb} with LinkedIn
        </button>
      </div>
      <div className="oauth-divider">
        <span>or {mode === "login" ? "sign in" : "continue"} with email</span>
      </div>
      {mode === "register" && (
        <p className="oauth-consent">
          By continuing with Google or LinkedIn, you agree to our{" "}
          <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>.
        </p>
      )}
    </div>
  );
}
