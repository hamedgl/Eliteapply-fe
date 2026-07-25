import { useSession } from "./session";
import { authChannel } from "./auth-channel";
import type { AuthClearReason } from "./auth-types";

type CleanupSubscriber = (reason: AuthClearReason) => void;
const subscribers: Set<CleanupSubscriber> = new Set();

export function onAuthCleanup(fn: CleanupSubscriber): () => void {
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
  };
}

export function clearAuthenticatedClientState(reason: AuthClearReason): void {
  const store = useSession.getState();
  store.incrementSessionEpoch();

  if (reason === "logout" || reason === "logout_all") {
    authChannel.postMessage({ type: "LOGOUT", at: Date.now() });
  } else if (reason === "session_expired" || reason === "unauthorized_error") {
    authChannel.postMessage({ type: "SESSION_EXPIRED", at: Date.now() });
  }

  store.clearSession();

  try {
    localStorage.removeItem("ea_has_session");
  } catch {}

  subscribers.forEach((fn) => {
    try {
      fn(reason);
    } catch {}
  });

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("auth:expired", { detail: { reason } }));
  }
}
