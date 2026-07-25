import { performTokenRefresh } from "./refresh";
import { useSession } from "./session";

let isReconciling = false;

export async function initializeAuthSession(): Promise<void> {
  if (isReconciling) return;
  isReconciling = true;

  const session = useSession.getState();
  session.setInitializing(true);

  let hasSessionHint = false;
  try {
    hasSessionHint = localStorage.getItem("ea_has_session") === "1";
  } catch {}

  const pathname = typeof window !== "undefined" ? window.location.pathname : "";
  const isProtectedRoute = pathname.startsWith("/app") || pathname.startsWith("/admin");

  if (!hasSessionHint && !isProtectedRoute) {
    session.setAnonymous();
    session.setInitializing(false);
    isReconciling = false;
    return;
  }

  try {
    const res = await performTokenRefresh();
    if (res.kind === "success") {
      session.setInitializing(false);
    } else if (res.kind === "invalid_session") {
      session.clearSession();
      session.setInitializing(false);
    } else if (res.kind === "transient_failure") {
      session.setDegraded(res.message);
      session.setInitializing(false);
    }
  } catch (error) {
    session.setDegraded("Initial auth reconciliation failed");
    session.setInitializing(false);
  } finally {
    isReconciling = false;
  }
}
