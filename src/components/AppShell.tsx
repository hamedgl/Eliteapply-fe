import {
  BookOpen,
  FileText,
  FolderKanban,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Mic2,
  Settings,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { authApi } from "../lib/api/auth";
import { useSession } from "../lib/auth/session";

const navigationGroups = [
  {
    label: "Workspace",
    items: [
      ["/app/dashboard", "Dashboard", LayoutDashboard],
      ["/app/applications", "Applications", FolderKanban],
    ],
  },
  {
    label: "Prepare",
    items: [
      ["/app/writing", "Writing Studio", BookOpen],
      ["/app/academic-profile", "Academic Profile", GraduationCap],
      ["/app/documents", "Documents", FileText],
      ["/app/references", "References", Users],
      ["/app/interviews/new", "Interview Practice", Mic2],
    ],
  },
  {
    label: "Account",
    items: [["/app/settings/profile", "Settings", Settings]],
  },
] as const;

export function AppShell() {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const user = useSession((state) => state.user);
  const clear = useSession((state) => state.clear);
  const navigate = useNavigate();
  const sidebarRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sidebarRef.current
      ?.querySelector<HTMLButtonElement>(".sidebar-close")
      ?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      requestAnimationFrame(() => menuButtonRef.current?.focus());
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await authApi.logout();
    } finally {
      clear();
      navigate("/login");
    }
  }

  const displayName = user?.full_name?.trim() || "Your account";
  const avatarLabel = (user?.full_name || user?.email || "EA")
    .slice(0, 1)
    .toUpperCase();

  return (
    <div className="app-shell">
      <a className="app-skip-link" href="#app-content">
        Skip to workspace
      </a>

      <header className="mobile-appbar">
        <NavLink to="/app/dashboard" className="app-brand">
          <span aria-hidden="true">E</span>
          EliteApply
        </NavLink>
        <button
          ref={menuButtonRef}
          className="mobile-menu"
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls="app-sidebar"
          aria-label="Open navigation"
        >
          <Menu aria-hidden="true" />
        </button>
      </header>

      {open ? (
        <button
          className="scrim"
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close navigation"
        />
      ) : null}

      <aside
        ref={sidebarRef}
        id="app-sidebar"
        className={open ? "sidebar open" : "sidebar"}
        aria-label="Application navigation"
      >
        <div className="sidebar-head">
          <NavLink to="/app/dashboard" className="app-brand">
            <span aria-hidden="true">E</span>
            EliteApply
          </NavLink>
          <button
            className="sidebar-close"
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          >
            <X aria-hidden="true" />
          </button>
        </div>

        <nav aria-label="Primary navigation">
          {navigationGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <p>{group.label}</p>
              {group.items.map(([href, label, Icon]) => (
                <NavLink
                  key={href}
                  to={href}
                  end={href === "/app/dashboard"}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  <Icon aria-hidden="true" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <footer className="sidebar-account">
          <span className="account-avatar" aria-hidden="true">
            {avatarLabel}
          </span>
          <div>
            <strong title={displayName}>{displayName}</strong>
            <small title={user?.email ?? undefined}>{user?.email}</small>
          </div>
          <button type="button" onClick={logout} disabled={loggingOut}>
            <LogOut aria-hidden="true" />
            {loggingOut ? "Signing out…" : "Log out"}
          </button>
        </footer>
      </aside>

      <main className="workspace" id="app-content" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
