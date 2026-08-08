import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../../lib/api/auth";
import { productConfig } from "../../lib/config/product";
import { initGoogleOneTap } from "../../lib/auth/google-one-tap";

/**
 * Renders nothing itself — Google's One Tap widget draws its own floating UI. Mounted only
 * on the login/register pages (already gated to anonymous visitors by `PublicOnly`), so it
 * never fights the visible Google/LinkedIn buttons in `OAuthButtons` for the same account.
 */
export function GoogleOneTapPrompt({
  mode,
  returnTo,
}: {
  mode: "login" | "register";
  returnTo: string | null;
}) {
  const nav = useNavigate();
  const busy = useRef(false);

  useEffect(() => {
    if (!productConfig.googleClientId) return;
    let cancelPrompt: (() => void) | undefined;
    let unmounted = false;

    initGoogleOneTap({
      clientId: productConfig.googleClientId,
      onCredential: async (credential) => {
        if (busy.current) return;
        busy.current = true;
        try {
          await authApi.googleOneTap({
            id_token: credential,
            accepted_terms_version:
              mode === "register" ? productConfig.legal.currentTermsVersion : undefined,
          });
          const destination = returnTo?.startsWith("/app") ? returnTo : "/app/dashboard";
          nav(destination, { replace: true });
        } catch {
          // Silent — the visible Google/LinkedIn/email options on this page still work.
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
  }, [mode, nav, returnTo]);

  return null;
}
