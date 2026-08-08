import { onAuthCleanup } from "./auth-cleanup";

type GoogleCredentialResponse = { credential: string; select_by: string };

type GoogleIdConfiguration = {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  itp_support?: boolean;
  use_fedcm_for_prompt?: boolean;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleIdConfiguration) => void;
          prompt: () => void;
          cancel: () => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

const SCRIPT_SRC = "https://accounts.google.com/gsi/client";
let scriptPromise: Promise<void> | null = null;

function loadGoogleIdentityScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Failed to load Google Identity Services")),
        { once: true }
      );
      return;
    }
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

// Registered once: whenever any tab logs out (or the session is otherwise cleared), tell
// Google to stop auto-signing this browser back in — otherwise One Tap's `auto_select`
// would silently re-authenticate the user right after they explicitly signed out.
let autoSelectResetRegistered = false;
function ensureAutoSelectResetOnSignOut() {
  if (autoSelectResetRegistered) return;
  autoSelectResetRegistered = true;
  onAuthCleanup(() => {
    window.google?.accounts.id.disableAutoSelect();
  });
}

/**
 * Loads the Google Identity Services script (if needed), initializes One Tap, and shows the
 * prompt. `auto_select: true` is what gives returning users the "no click needed" automatic
 * sign-in: if the browser holds a single Google session the user has previously consented
 * with, Google skips the UI entirely and invokes `onCredential` straight away.
 *
 * Returns a cancel function to call on unmount (e.g. route change away from the login page).
 */
export async function initGoogleOneTap(opts: {
  clientId: string;
  onCredential: (credential: string) => void;
}): Promise<() => void> {
  await loadGoogleIdentityScript();
  ensureAutoSelectResetOnSignOut();

  const google = window.google;
  if (!google) throw new Error("Google Identity Services unavailable");

  google.accounts.id.initialize({
    client_id: opts.clientId,
    callback: (response) => opts.onCredential(response.credential),
    auto_select: true,
    cancel_on_tap_outside: false,
    itp_support: true,
    use_fedcm_for_prompt: true,
  });

  // No moment listener: with FedCM enabled Google throws on isNotDisplayed()/isSkippedMoment().
  google.accounts.id.prompt();

  return () => google.accounts.id.cancel();
}
