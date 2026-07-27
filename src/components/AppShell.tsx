import {
  BookOpen,
  ChevronDown,
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
  Sparkles,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { authApi } from "../lib/api/auth";
import { useSession } from "../lib/auth/session";
import { notificationsApi } from "../lib/api/phase3";
import { queryKeys } from "../lib/api/queryKeys";
import { useDismiss } from "../lib/dom-hooks";
import { useEntitlements } from "../lib/billing/provider";
import { PromptDialogProvider } from "./PromptDialog";
import { preloadAppRoute } from "../app/preload";
import { ProgressBar } from "./data-display/ProgressBar";
import { NotificationsDropdown } from "../features/notifications/NotificationsDropdown";
import "../styles/workspace.css";

const compactNumber = new Intl.NumberFormat(undefined, { notation: "compact" });

type NavItem = readonly [href: string, label: string, icon: LucideIcon];
type NavGroup = { label: string; items: NavItem[] };

const navigationGroups: NavGroup[] = [
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
];

const paletteDestinations: NavItem[] = navigationGroups.flatMap((group) => group.items);

/** Shared menu content for both the sidebar footer and the topbar profile dropdown. */
function AccountMenuItems({
  onNavigate,
  onLogout,
  loggingOut,
}: {
  onNavigate: () => void;
  onLogout: () => void;
  loggingOut: boolean;
}) {
  return (
    <ul className="sidebar-account-menu" role="menu">
      <li role="none">
        <NavLink to="/app/settings/profile" role="menuitem" onClick={onNavigate}>
          <UserRound aria-hidden="true" /> Account
        </NavLink>
      </li>
      <li role="none">
        <NavLink to="/app/settings/billing" role="menuitem" onClick={onNavigate}>
          <CreditCard aria-hidden="true" /> Billing
        </NavLink>
      </li>
      <li role="none">
        <NavLink to="/contact" role="menuitem" onClick={onNavigate}>
          <LifeBuoy aria-hidden="true" /> Help
        </NavLink>
      </li>
      <li className="sidebar-account-menu-divider" role="separator" />
      <li role="none">
        <button type="button" role="menuitem" onClick={onLogout} disabled={loggingOut}>
          <LogOut aria-hidden="true" />
          {loggingOut ? "Signing out…" : "Log out"}
        </button>
      </li>
    </ul>
  );
}

/** Cmd/Ctrl+K quick switcher over the app's own navigation destinations. */
function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return paletteDestinations;
    return paletteDestinations.filter(([, label]) => label.toLowerCase().includes(term));
  }, [query]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIndex(0);
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => setActiveIndex(0), [query]);

  if (!open) return null;

  function go(href: string) {
    navigate(href);
    onClose();
  }

  return (
    <div
      className="apps-dialog-backdrop command-palette-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="apps-dialog command-palette"
        role="dialog"
        aria-modal="true"
        aria-label="Search anything"
      >
        <div className="command-palette-input">
          <Search aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search anything…"
            aria-label="Search anything"
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveIndex((i) => Math.max(i - 1, 0));
              } else if (event.key === "Enter") {
                event.preventDefault();
                const item = filtered[activeIndex];
                if (item) go(item[0]);
              }
            }}
          />
          <button type="button" aria-label="Close" onClick={onClose}>
            <X aria-hidden="true" />
          </button>
        </div>
        <ul className="command-palette-list" role="listbox" aria-label="Destinations">
          {filtered.length ? (
            filtered.map(([href, label, Icon], index) => (
              <li key={href}>
                <button
                  type="button"
                  className={index === activeIndex ? "is-active" : undefined}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => go(href)}
                  role="option"
                  aria-selected={index === activeIndex}
                >
                  <Icon aria-hidden="true" /> {label}
                </button>
              </li>
            ))
          ) : (
            <li className="command-palette-empty" role="status">
              No matching pages.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

export function AppShell() {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("eliteapply-sidebar-collapsed") === "true",
  );
  const [loggingOut, setLoggingOut] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLElement>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const notifButtonRef = useRef<HTMLButtonElement>(null);
  const mobileNotifButtonRef = useRef<HTMLButtonElement>(null);
  const sidebarNotifButtonRef = useRef<HTMLAnchorElement>(null);
  const user = useSession((state) => state.user);
  const clear = useSession((state) => state.clear);
  const navigate = useNavigate();
  const sidebarRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  useDismiss([accountMenuRef], () => setAccountMenuOpen(false), accountMenuOpen);
  useDismiss([profileMenuRef], () => setProfileMenuOpen(false), profileMenuOpen);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((current) => !current);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);
  const unread = useQuery({
    queryKey: queryKeys.unreadNotifications,
    queryFn: notificationsApi.unreadCount,
    refetchInterval: document.hidden ? false : 60_000,
  });
  const entitlements = useEntitlements();
  const entitlement = entitlements.data;
  const tokensUsedPercent = entitlement?.ai_tokens_limit
    ? Math.min(
        100,
        Math.round(
          (entitlement.ai_tokens_used / entitlement.ai_tokens_limit) * 100,
        ),
      )
    : 0;
  const daysUntilReset = entitlement
    ? Math.max(
        0,
        Math.ceil(
          (new Date(entitlement.ai_tokens_reset_at).getTime() - Date.now()) /
            86_400_000,
        ),
      )
    : null;

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
    const closeTopModal = (event: KeyboardEvent) => {
      if (
        event.key !== "Escape" ||
        event.defaultPrevented ||
        (event.target as Element | null)?.closest('[aria-expanded="true"]')
      )
        return;
      const modal = Array.from(
        document.querySelectorAll<HTMLElement>('[role="dialog"]:not(dialog)'),
      )
        .filter((element) => element.getClientRects().length)
        .at(-1);
      const close = modal?.querySelector<HTMLButtonElement>(
        'button[aria-label="Close"]',
      );
      if (!close) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      close.click();
    };
    document.addEventListener("keydown", closeTopModal);
    return () => document.removeEventListener("keydown", closeTopModal);
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

  function prepareRoute(path: string) {
    preloadAppRoute(path);
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
        <div style={{ position: "relative" }}>
          <button
            ref={mobileNotifButtonRef}
            className="mobile-notifications"
            type="button"
            onClick={() => setNotifDropdownOpen((v) => !v)}
            aria-label={`${unread.data?.unread_count ?? 0} unread notifications`}
            aria-expanded={notifDropdownOpen}
          >
            <Bell aria-hidden="true" size={20} />
            {unread.data?.unread_count ? (
              <span>
                {unread.data.unread_count > 99 ? "99+" : unread.data.unread_count}
              </span>
            ) : null}
          </button>
          <NotificationsDropdown
            open={notifDropdownOpen}
            onClose={() => setNotifDropdownOpen(false)}
            triggerRef={mobileNotifButtonRef}
          />
        </div>
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
            ref={sidebarNotifButtonRef}
            className="notification-shortcut"
            to="/app/notifications"
            title="Notifications"
            onClick={closeSidebar}
            onPointerEnter={() => prepareRoute("/app/notifications")}
            onFocus={() => prepareRoute("/app/notifications")}
          >
            <Bell aria-hidden="true" size={20} />
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
                  onPointerEnter={() => prepareRoute(href)}
                  onFocus={() => prepareRoute(href)}
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  <Icon aria-hidden="true" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {entitlement ? (
          <div className="sidebar-plan">
            <p className="sidebar-plan-name">
              <Sparkles aria-hidden="true" />
              <strong>{entitlement.plan_label} Plan</strong>
            </p>
            <p className="sidebar-plan-limit">
              {compactNumber.format(entitlement.ai_tokens_limit)} tokens
            </p>
            <ProgressBar
              percent={tokensUsedPercent}
              label="AI tokens used"
            />
            <p className="sidebar-plan-meta">
              {compactNumber.format(entitlement.ai_tokens_used)} used
              {daysUntilReset !== null
                ? ` · renews in ${daysUntilReset} days`
                : null}
            </p>
            <NavLink
              className="sidebar-plan-manage"
              to="/app/settings/billing"
              onClick={closeSidebar}
              onPointerEnter={() => prepareRoute("/app/settings/billing")}
              onFocus={() => prepareRoute("/app/settings/billing")}
            >
              Manage plan
            </NavLink>
          </div>
        ) : null}

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
            <AccountMenuItems
              onNavigate={() => setAccountMenuOpen(false)}
              onLogout={logout}
              loggingOut={loggingOut}
            />
          ) : null}
        </footer>
      </aside>

      <main className="workspace" id="app-content" tabIndex={-1}>
        <header className="app-topbar">
          <button
            type="button"
            className="app-topbar-search"
            onClick={() => setPaletteOpen(true)}
          >
            <Search aria-hidden="true" />
            <span>Search anything…</span>
            <kbd>⌘K</kbd>
          </button>
          <div className="app-topbar-actions">
            <div style={{ position: "relative" }}>
              <button
                ref={notifButtonRef}
                className="app-topbar-bell"
                type="button"
                onClick={() => setNotifDropdownOpen((v) => !v)}
                aria-label={`${unread.data?.unread_count ?? 0} unread notifications`}
                aria-expanded={notifDropdownOpen}
              >
                <Bell aria-hidden="true" size={20} />
                {unread.data?.unread_count ? (
                  <span className="app-topbar-badge">
                    {unread.data.unread_count > 99 ? "99+" : unread.data.unread_count}
                  </span>
                ) : null}
              </button>
              <NotificationsDropdown
                open={notifDropdownOpen}
                onClose={() => setNotifDropdownOpen(false)}
                triggerRef={notifButtonRef}
              />
            </div>
            <div className="app-topbar-profile" ref={profileMenuRef}>
              <button
                type="button"
                className="app-topbar-profile-trigger"
                onClick={() => setProfileMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={profileMenuOpen}
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
                <ChevronDown
                  aria-hidden="true"
                  className={`app-topbar-chevron${profileMenuOpen ? " is-open" : ""}`}
                />
              </button>
              {profileMenuOpen ? (
                <AccountMenuItems
                  onNavigate={() => setProfileMenuOpen(false)}
                  onLogout={logout}
                  loggingOut={loggingOut}
                />
              ) : null}
            </div>
          </div>
        </header>
        <PromptDialogProvider>
          <Outlet />
        </PromptDialogProvider>
      </main>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
