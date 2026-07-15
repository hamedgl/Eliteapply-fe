import {
  BookOpen,
  Compass,
  FileText,
  FolderKanban,
  GraduationCap,
  LayoutDashboard,
  Library,
  LogOut,
  Menu,
  Mic2,
  PanelLeftClose,
  PanelLeftOpen,
  Bell,
  CalendarClock,
  Search,
  Settings,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { authApi } from "../lib/api/auth";
import { useSession } from "../lib/auth/session";
import { notificationsApi } from "../lib/api/phase3";
import { queryKeys } from "../lib/api/queryKeys";
import { PromptDialogProvider } from "./PromptDialog";

const navigationGroups = [
  {
    label: "Workspace",
    items: [
      ["/app/dashboard", "Dashboard", LayoutDashboard],
      ["/app/applications", "Applications", FolderKanban],
      ["/app/catalogue", "Catalogue", Compass],
      ["/app/discovery", "Saved searches", Search],
    ],
  },
  {
    label: "Prepare",
    items: [
      ["/app/writing", "Writing Studio", BookOpen],
      ["/app/stories", "Story Bank", Library],
      ["/app/academic-profile", "Academic Profile", GraduationCap],
      ["/app/documents", "Documents", FileText],
      ["/app/references", "References", Users],
      ["/app/interviews", "Interview Practice", Mic2],
      ["/app/reminders", "Reminders", CalendarClock],
    ],
  },
  {
    label: "Account",
    items: [["/app/settings/profile", "Settings", Settings]],
  },
] as const;

export function AppShell() {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("eliteapply-sidebar-collapsed") === "true",
  );
  const [loggingOut, setLoggingOut] = useState(false);
  const user = useSession((state) => state.user);
  const clear = useSession((state) => state.clear);
  const navigate = useNavigate();
  const sidebarRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const unread = useQuery({
    queryKey: queryKeys.unreadNotifications,
    queryFn: notificationsApi.unreadCount,
    refetchInterval: document.hidden ? false : 60_000,
  });

  useEffect(() => {
    const meta =
      document.querySelector<HTMLMetaElement>('meta[name="robots"]') ??
      document.head.appendChild(document.createElement("meta"));
    const previous = meta.content;
    meta.name = "robots";
    meta.content = "noindex,nofollow";
    return () => {
      meta.content = previous;
    };
  }, []);

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

  function toggleSidebar() {
    setCollapsed((current) => {
      localStorage.setItem("eliteapply-sidebar-collapsed", String(!current));
      return !current;
    });
  }

  const displayName = user?.full_name?.trim() || "Your account";
  const avatarLabel = (user?.full_name || user?.email || "EA")
    .slice(0, 1)
    .toUpperCase();

  return (
    <div className={`app-shell${collapsed ? " sidebar-collapsed" : ""}`}>
      <a className="app-skip-link" href="#app-content">
        Skip to workspace
      </a>

      <header className="mobile-appbar">
        <NavLink to="/app/dashboard" className="app-brand">
          <span aria-hidden="true">E</span>
          EliteApply
        </NavLink>
        <NavLink
          className="mobile-notifications"
          to="/app/notifications"
          aria-label={`${unread.data?.unread_count ?? 0} unread notifications`}
        >
          <Bell aria-hidden="true" />
          {unread.data?.unread_count ? (
            <span>
              {unread.data.unread_count > 99 ? "99+" : unread.data.unread_count}
            </span>
          ) : null}
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
            <span className="app-brand-name">EliteApply</span>
          </NavLink>
          <button
            className="sidebar-rail-toggle"
            type="button"
            onClick={toggleSidebar}
            aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
            aria-expanded={!collapsed}
            title={collapsed ? "Expand navigation" : "Collapse navigation"}
          >
            {collapsed ? (
              <PanelLeftOpen aria-hidden="true" />
            ) : (
              <PanelLeftClose aria-hidden="true" />
            )}
          </button>
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
          <NavLink
            className="notification-shortcut"
            to="/app/notifications"
            title="Notifications"
            onClick={() => setOpen(false)}
          >
            <Bell aria-hidden="true" />
            <span>Notifications</span>
            {unread.data?.unread_count ? (
              <strong>
                {unread.data.unread_count > 99
                  ? "99+"
                  : unread.data.unread_count}
              </strong>
            ) : null}
          </NavLink>
          {navigationGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <p>{group.label}</p>
              {group.items.map(([href, label, Icon]) => (
                <NavLink
                  key={href}
                  to={href}
                  end={href === "/app/dashboard"}
                  title={label}
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
            <span>{loggingOut ? "Signing out…" : "Log out"}</span>
          </button>
        </footer>
      </aside>

      <main className="workspace" id="app-content" tabIndex={-1}>
        <PromptDialogProvider>
          <Outlet />
        </PromptDialogProvider>
      </main>
    </div>
  );
}
