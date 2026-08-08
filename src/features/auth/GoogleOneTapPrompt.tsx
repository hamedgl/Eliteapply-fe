import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { authApi } from "../../lib/api/auth";
import { productConfig } from "../../lib/config/product";
import { initGoogleOneTap } from "../../lib/auth/google-one-tap";
import { useSession } from "../../lib/auth/session";

/**
 * Renders nothing itself — Google draws One Tap as native browser (FedCM) UI. Mounted once at
 * the router root so it greets anonymous visitors on the landing and marketing pages, not just
 * on /login. Self-gating: it never initialises while a session exists, and it prompts at most
 * once per page load so a sign-out doesn't immediately re-prompt.
 */
export function GoogleOneTapPrompt() {
  const nav = useNavigate();
  const location = useLocation();
  const accessToken = useSession((state) => state.accessToken);
  const initializing = useSession((state) => state.initializing);
  const busy = useRef(false);
  const started = useRef(false);
  // Read at credential time so the prompt isn't re-initialised on every navigation.
  const returnTo = useRef<string | null>(null);
  returnTo.current = new URLSearchParams(location.search).get("returnTo");

  useEffect(() => {
    if (initializing || accessToken || started.current) return;
    if (!productConfig.googleClientId) {
      if (import.meta.env.DEV) {
        console.warn("Google One Tap disabled: VITE_GOOGLE_CLIENT_ID is not set.");
      }
      return;
    }
    started.current = true;
    let cancelPrompt: (() => void) | undefined;
    let unmounted = false;

    initGoogleOneTap({
      clientId: productConfig.googleClientId,
      onCredential: async (credential) => {
        if (busy.current) return;
        busy.current = true;
        try {
          // No terms version here: Google's FedCM bubble can't show one, so a first-time
          // user's acceptance is collected by `ConsentGate` once they land in /app.
          await authApi.googleOneTap({ id_token: credential });
          const destination = returnTo.current?.startsWith("/app")
            ? returnTo.current
            : "/app/dashboard";
          nav(destination, { replace: true });
        } catch {
          // Silent — the visible Google/LinkedIn/email options still work.
        } finally {
          busy.current = false;
        }
      },
    })
      .then((cancel) => {
        if (unmounted) cancel();
        else cancelPrompt = cancel;
      })
      .catch(() => {});

    return () => {
      unmounted = true;
      cancelPrompt?.();
    };
  }, [accessToken, initializing, nav]);

  return null;
}
