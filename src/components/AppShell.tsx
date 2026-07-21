import {
  BookOpen,
  Compass,
  CreditCard,
  FileText,
  FolderKanban,
  GraduationCap,
  LayoutDashboard,
  Library,
  LifeBuoy,
  LogOut,
  Menu,
  Mic2,
  PanelLeftClose,
  PanelLeftOpen,
  Bell,
  CalendarClock,
  Search,
  Settings,
  UserRound,
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
import { useDismiss } from "../lib/dom-hooks";
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
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLElement>(null);
  const user = useSession((state) => state.user);
  const clear = useSession((state) => state.clear);
  const navigate = useNavigate();
  const sidebarRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  useDismiss([accountMenuRef], () => setAccountMenuOpen(false), accountMenuOpen);
  const unread = useQuery({
    queryKey: queryKeys.unreadNotifications,
    queryFn: notificationsApi.unreadCount,
    refetchInterval: document.hidden ? false : 60_000,
  });

  function closeSidebar() {
    setOpen(false);
    requestAnimationFrame(() => menuButtonRef.current?.focus());
  }

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
      if (event.key === "Escape") return closeSidebar();
      if (event.key !== "Tab") return;
      const controls = sidebarRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
      );
      if (!controls?.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
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
          onClick={closeSidebar}
          aria-label="Close navigation"
          tabIndex={-1}
        />
      ) : null}

      <aside
        ref={sidebarRef}
        id="app-sidebar"
        className={open ? "sidebar open" : "sidebar"}
        role={open ? "dialog" : undefined}
        aria-modal={open ? true : undefined}
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
            onClick={closeSidebar}
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
            onClick={closeSidebar}
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
                  onClick={closeSidebar}
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  <Icon aria-hidden="true" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <footer className="sidebar-account" ref={accountMenuRef}>
          <button
            type="button"
            className="sidebar-account-trigger"
            onClick={() => setAccountMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={accountMenuOpen}
          >
            <span className="account-avatar" aria-hidden="true">
              {avatarLabel}
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt=""
                  referrerPolicy="no-referrer"
                  onError={(event) => event.currentTarget.remove()}
                />
              ) : null}
            </span>
            <div>
              <strong title={displayName}>{displayName}</strong>
              <small title={user?.email ?? undefined}>{user?.email}</small>
            </div>
          </button>
          {accountMenuOpen ? (
            <ul className="sidebar-account-menu" role="menu">
              <li role="none">
                <NavLink
                  to="/app/settings/profile"
                  role="menuitem"
                  onClick={() => setAccountMenuOpen(false)}
                >
                  <UserRound aria-hidden="true" /> Account
                </NavLink>
              </li>
              <li role="none">
                <NavLink
                  to="/app/settings/billing"
                  role="menuitem"
                  onClick={() => setAccountMenuOpen(false)}
                >
                  <CreditCard aria-hidden="true" /> Billing
                </NavLink>
              </li>
              <li role="none">
                <NavLink
                  to="/contact"
                  role="menuitem"
                  onClick={() => setAccountMenuOpen(false)}
                >
                  <LifeBuoy aria-hidden="true" /> Help
                </NavLink>
              </li>
              <li className="sidebar-account-menu-divider" role="separator" />
              <li role="none">
                <button
                  type="button"
                  role="menuitem"
                  onClick={logout}
                  disabled={loggingOut}
                >
                  <LogOut aria-hidden="true" />
                  {loggingOut ? "Signing out…" : "Log out"}
                </button>
              </li>
            </ul>
          ) : null}
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
