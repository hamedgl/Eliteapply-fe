import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../../lib/api/auth";
import { usersApi } from "../../lib/api/users";
import { productConfig } from "../../lib/config/product";
import { useSession } from "../../lib/auth/session";
import { ApiError } from "../../lib/api/errors";
import "../../styles/workspace.css";

/**
 * Google One Tap and the OAuth redirect buttons create accounts without the terms checkbox
 * the email register form has, so the acceptance is collected here on first arrival in /app.
 * It asks once: the answer is stored server-side as `consent_version`, so the dialog only
 * returns if the terms version itself changes.
 */
export function ConsentGate() {
  const user = useSession((state) => state.user);
  const setUser = useSession((state) => state.setUser);
  const clear = useSession((state) => state.clear);
  const navigate = useNavigate();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const needsConsent =
    !!user && user.consent_version !== productConfig.legal.currentTermsVersion;

  useEffect(() => {
    const node = dialogRef.current;
    if (!node) return;
    if (needsConsent && !node.open) node.showModal();
    if (!needsConsent && node.open) node.close();
  }, [needsConsent]);

  if (!needsConsent) return null;

  async function accept() {
    setPending(true);
    setError("");
    try {
      setUser(
        await usersApi.consent({
          accepted_terms_version: productConfig.legal.currentTermsVersion,
          marketing_opt_in: marketingOptIn,
        }),
      );
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "We couldn’t save that. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }

  // Consent has to be refusable: declining signs the user out rather than trapping them.
  async function declineAndSignOut() {
    setPending(true);
    try {
      await authApi.logout();
    } finally {
      clear();
      navigate("/login", { replace: true });
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="apps-dialog"
      aria-labelledby="consent-gate-title"
      // No close affordance and Escape is swallowed: continuing into the workspace requires
      // an answer. Signing out is the way back.
      onCancel={(event) => event.preventDefault()}
    >
      <header>
        <h2 id="consent-gate-title">One last step</h2>
      </header>
      <div className="apps-dialog-body">
        <p>
          Before you start, please accept our{" "}
          <Link to={productConfig.legal.terms} target="_blank" rel="noreferrer">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link to={productConfig.legal.privacy} target="_blank" rel="noreferrer">
            Privacy Policy
          </Link>
          . They explain how EliteApply handles your application data.
        </p>
        <label className="check">
          <input
            type="checkbox"
            checked={marketingOptIn}
            onChange={(event) => setMarketingOptIn(event.target.checked)}
          />
          Email me occasional product updates. Optional, and you can change it any time in
          Settings.
        </label>
        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
      <div className="dialog-actions">
        <button type="button" disabled={pending} onClick={declineAndSignOut}>
          Sign out
        </button>
        <button type="button" className="primary" disabled={pending} onClick={accept}>
          {pending ? "Saving…" : "Accept and continue"}
        </button>
      </div>
    </dialog>
  );
}
