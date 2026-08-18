import {
  BookOpen,
  ChevronDown,
  Compass,
  CreditCard,
  FileText,
  FolderKanban,
  GraduationCap,
  Info,
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
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useQuery } from "@tanstack/react-query";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
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
import { GlobalSearch } from "../features/search/GlobalSearch";
import { ConsentGate } from "../features/auth/ConsentGate";
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

export type WorkspacePageGuide = {
  title: string;
  intro: string;
  tips: readonly [string, string];
};

const WorkspacePageGuideContext = createContext<{
  guide: WorkspacePageGuide;
  open: () => void;
} | null>(null);

export function WorkspacePageGuideButton() {
  const context = useContext(WorkspacePageGuideContext);
  if (!context) return null;

  return (
    <button
      className="apps-icon-button workspace-page-guide-button"
      type="button"
      onClick={context.open}
      aria-label={`About this page: ${context.guide.title}`}
      title="About this page"
    >
      <Info aria-hidden="true" />
    </button>
  );
}

const pageGuide = (
  title: string,
  intro: string,
  first: string,
  second: string,
): WorkspacePageGuide => ({ title, intro, tips: [first, second] });

const workspacePageGuides: ReadonlyArray<{
  match: RegExp;
  guide: WorkspacePageGuide;
}> = [
  {
    match: /^\/app\/(?:dashboard|onboarding)$/,
    guide: pageGuide(
      "Dashboard",
      "This page gives you a quick read on your whole workspace.",
      "Check deadlines and application readiness before you plan your work.",
      "Use the recommended next step when you are unsure where to start.",
    ),
  },
  {
    match: /^\/app\/applications\/import$/,
    guide: pageGuide(
      "Import an opportunity",
      "Bring an opportunity into your workspace from a web page or file.",
      "Check the source and extracted details before you confirm the import.",
      "Fix anything that looks wrong before creating the application.",
    ),
  },
  {
    match: /^\/app\/applications\/[^/]+(?:\/.*)?$/,
    guide: pageGuide(
      "Application workspace",
      "Everything for one application lives on this page.",
      "Turn the requirements into tasks, then add due dates where they matter.",
      "Link the documents, writing and references you plan to submit.",
    ),
  },
  {
    match: /^\/app\/applications$/,
    guide: pageGuide(
      "Applications",
      "Keep every scholarship, programme, fellowship or grant you are considering in one list.",
      "Add the deadline as soon as you know it.",
      "Open an application to manage its requirements and supporting work.",
    ),
  },
  {
    match: /^\/app\/academic-profile$/,
    guide: pageGuide(
      "Academic profile",
      "Save your education, goals and achievements here so you can reuse them.",
      "Complete the core details first, then add evidence that strengthens your applications.",
      "Review the profile when your plans or academic record change.",
    ),
  },
  {
    match: /^\/app\/documents\/[^/]+$/,
    guide: pageGuide(
      "Document details",
      "Use this page to check one file and where it is used.",
      "Review the file details and linked applications before replacing it.",
      "Use versions and activity when you need to trace a change.",
    ),
  },
  {
    match: /^\/app\/documents$/,
    guide: pageGuide(
      "Documents",
      "Keep transcripts, certificates and other supporting files here.",
      "Use clear names so you can find the right file near a deadline.",
      "Link each document to the applications that need it.",
    ),
  },
  {
    match: /^\/app\/catalogue\/[^/]+\/[^/]+$/,
    guide: pageGuide(
      "Catalogue record",
      "This page shows the details saved for one institution, programme or scholarship.",
      "Check the source and eligibility details before you act on the record.",
      "Create an application when you decide to pursue the opportunity.",
    ),
  },
  {
    match: /^\/app\/catalogue$/,
    guide: pageGuide(
      "Academic catalogue",
      "Browse institutions, programmes and scholarships from one place.",
      "Use filters to narrow the list to what fits your plans.",
      "Open a record before adding it to your applications.",
    ),
  },
  {
    match: /^\/app\/discovery$/,
    guide: pageGuide(
      "Saved searches",
      "Keep useful catalogue searches here and return to their matches later.",
      "Name a search after the goal it serves so it is easy to recognise.",
      "Update the filters when your study plans change.",
    ),
  },
  {
    match: /^\/app\/writing\/new$/,
    guide: pageGuide(
      "New writing document",
      "Start a statement, essay, study plan or academic CV here.",
      "Choose the document type and application before you begin.",
      "Add the prompt and word limit when the application provides them.",
    ),
  },
  {
    match: /^\/app\/writing\/[^/]+$/,
    guide: pageGuide(
      "Writing document",
      "Write and revise one application document on this page.",
      "Keep the prompt and limit visible while you edit.",
      "Use comments and review tools before you mark the document final.",
    ),
  },
  {
    match: /^\/app\/writing$/,
    guide: pageGuide(
      "Writing Studio",
      "Keep your statements, essays, study plans and academic CVs here.",
      "Link each document to its application so the context stays clear.",
      "Open unfinished work from the library instead of creating another copy.",
    ),
  },
  {
    match: /^\/app\/stories$/,
    guide: pageGuide(
      "Story Bank",
      "Save examples from your experience so you can reuse them in writing and interviews.",
      "Record what happened, what you did and what changed.",
      "Link a story when it supports a document or application.",
    ),
  },
  {
    match: /^\/app\/references\/new$/,
    guide: pageGuide(
      "New reference request",
      "Set up a reference request and give the referee enough context to respond.",
      "Check the name, email and due date before you send anything.",
      "Attach the request to the application that needs it.",
    ),
  },
  {
    match: /^\/app\/references\/[^/]+$/,
    guide: pageGuide(
      "Reference details",
      "Check one reference request, its status and recent activity here.",
      "Send a reminder only when the referee still has time to respond.",
      "Confirm the right applications are attached before the deadline.",
    ),
  },
  {
    match: /^\/app\/references$/,
    guide: pageGuide(
      "References",
      "Track your reference requests and submitted letters here.",
      "Watch the due dates and status before you send a reminder.",
      "Attach each reference to the applications that will use it.",
    ),
  },
  {
    match: /^\/app\/interviews\/new$/,
    guide: pageGuide(
      "New practice session",
      "Choose an application and the kind of interview you want to practise.",
      "Pick a short session when you want a quick rehearsal.",
      "Use a clear focus if there is a topic you need to work on.",
    ),
  },
  {
    match: /^\/app\/interviews\/[^/]+$/,
    guide: pageGuide(
      "Practice session",
      "Answer each question here and review the feedback before moving on.",
      "Take a moment to improve the answer instead of rushing through the session.",
      "Finish the session when you are ready to review the full report.",
    ),
  },
  {
    match: /^\/app\/interviews$/,
    guide: pageGuide(
      "Interview practice",
      "Rehearse application interviews and return to earlier feedback here.",
      "Open an unfinished session if you want to keep going.",
      "Start a new session when you need a different focus or application.",
    ),
  },
  {
    match: /^\/app\/notifications$/,
    guide: pageGuide(
      "Notifications",
      "This page collects updates from across your workspace.",
      "Open an item to go to the work it refers to.",
      "Mark older items as read once you have dealt with them.",
    ),
  },
  {
    match: /^\/app\/reminders$/,
    guide: pageGuide(
      "Reminders",
      "Plan follow-ups and time-sensitive work without changing the original deadline.",
      "Use the calendar when dates are easier to compare visually.",
      "Snooze a reminder only when you have chosen a better time.",
    ),
  },
  {
    match: /^\/app\/settings\/profile$/,
    guide: pageGuide(
      "Profile settings",
      "Change the account details people see around your workspace.",
      "Use a name and photo you are comfortable showing in shared views.",
      "Save contact changes before leaving the page.",
    ),
  },
  {
    match: /^\/app\/settings\/security$/,
    guide: pageGuide(
      "Security settings",
      "Change your password here.",
      "Use a password you do not use on another account.",
      "Keep the current password nearby because you will need it to save the change.",
    ),
  },
  {
    match: /^\/app\/settings\/privacy$/,
    guide: pageGuide(
      "Privacy and data",
      "Download your data, choose email preferences or delete your account here.",
      "Download an export before deletion if you need a copy of your work.",
      "Read the confirmation carefully because account deletion cannot be undone.",
    ),
  },
  {
    match: /^\/app\/settings\/billing(?:\/.*)?$/,
    guide: pageGuide(
      "Billing and usage",
      "Check your plan, AI usage and purchase history here.",
      "Review your current allowance before starting a large generation task.",
      "Use the subscription controls when you need to change or cancel a paid plan.",
    ),
  },
];

const defaultWorkspacePageGuide = pageGuide(
  "Workspace",
  "Use this page for the work shown in its heading.",
  "Check the page actions before opening another section.",
  "Use the main navigation when you need to switch tasks.",
);

export function getWorkspacePageGuide(pathname: string) {
  const path = pathname.replace(/\/+$/, "") || "/";
  return (
    workspacePageGuides.find(({ match }) => match.test(path))?.guide ??
    defaultWorkspacePageGuide
  );
}

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

function WorkspacePageGuideDialog({
  guide,
  onClose,
}: {
  guide: WorkspacePageGuide;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="apps-dialog workspace-page-guide-dialog"
      aria-labelledby="workspace-page-guide-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <header className="apps-dialog-header">
        <h2 id="workspace-page-guide-title">About {guide.title}</h2>
        <button type="button" onClick={onClose} aria-label="Close guide">
          <X aria-hidden="true" />
        </button>
      </header>
      <p className="workspace-page-guide-intro">{guide.intro}</p>
      <ol className="workspace-page-guide-steps">
        {guide.tips.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ol>
    </dialog>
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
  // Separate state per trigger: the mobile app bar and the topbar each mount
  // their own dropdown. Sharing one flag mounted both at once, and the hidden
  // one's outside-click handler closed the panel on pointerdown — unmounting
  // the visible button before its click could fire.
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [mobileNotifDropdownOpen, setMobileNotifDropdownOpen] = useState(false);
  const [pageGuideOpen, setPageGuideOpen] = useState(false);
  const notifButtonRef = useRef<HTMLButtonElement>(null);
  const mobileNotifButtonRef = useRef<HTMLButtonElement>(null);
  const sidebarNotifButtonRef = useRef<HTMLAnchorElement>(null);
  const user = useSession((state) => state.user);
  const clear = useSession((state) => state.clear);
  const location = useLocation();
  const navigate = useNavigate();
  const sidebarRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  useDismiss([accountMenuRef], () => setAccountMenuOpen(false), accountMenuOpen);
  useDismiss([profileMenuRef], () => setProfileMenuOpen(false), profileMenuOpen);
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
  // A truncated or failed entitlement payload must never surface as "NaN
  // tokens" in the sidebar; fall back to hiding the figure instead.
  const tokenResetAt = entitlement
    ? new Date(entitlement.ai_tokens_reset_at).getTime()
    : Number.NaN;
  const daysUntilReset = Number.isFinite(tokenResetAt)
    ? Math.max(0, Math.ceil((tokenResetAt - Date.now()) / 86_400_000))
    : null;
  const tokensLimit = Number(entitlement?.ai_tokens_limit);
  const tokensUsed = Number(entitlement?.ai_tokens_used);
  const hasTokenAllowance =
    Number.isFinite(tokensLimit) && Number.isFinite(tokensUsed);

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
        (event.target as Element | null)?.closest('[aria-expanded="true"]') ||
        // A native <dialog> on top handles its own Escape; closing the panel
        // underneath it at the same time would dismiss two layers at once.
        document.querySelector("dialog[open]")
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
  const pageGuide = getWorkspacePageGuide(location.pathname);

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
            onClick={() => setMobileNotifDropdownOpen((v) => !v)}
            aria-label={`${unread.data?.unread_count ?? 0} unread notifications`}
            aria-haspopup="dialog"
            aria-expanded={mobileNotifDropdownOpen}
          >
            <Bell aria-hidden="true" size={20} />
            {unread.data?.unread_count ? (
              <span>
                {unread.data.unread_count > 99 ? "99+" : unread.data.unread_count}
              </span>
            ) : null}
          </button>
          <NotificationsDropdown
            open={mobileNotifDropdownOpen}
            onClose={() => setMobileNotifDropdownOpen(false)}
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
        <GlobalSearch destinations={paletteDestinations} placeholder="Search…" />
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
            {hasTokenAllowance ? (
              <>
                <p className="sidebar-plan-limit">
                  {compactNumber.format(tokensLimit)} tokens
                </p>
                <ProgressBar percent={tokensUsedPercent} label="AI tokens used" />
                <p className="sidebar-plan-meta">
                  {compactNumber.format(tokensUsed)} used
                  {daysUntilReset !== null
                    ? ` · renews in ${daysUntilReset} days`
                    : null}
                </p>
              </>
            ) : null}
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
          <GlobalSearch destinations={paletteDestinations} />
          <div className="app-topbar-actions">
            <div style={{ position: "relative" }}>
              <button
                ref={notifButtonRef}
                className="app-topbar-bell"
                type="button"
                onClick={() => setNotifDropdownOpen((v) => !v)}
                aria-label={`${unread.data?.unread_count ?? 0} unread notifications`}
                aria-haspopup="dialog"
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
        <WorkspacePageGuideContext.Provider
          value={{ guide: pageGuide, open: () => setPageGuideOpen(true) }}
        >
          <PromptDialogProvider>
            <Outlet />
          </PromptDialogProvider>
        </WorkspacePageGuideContext.Provider>
      </main>
      {pageGuideOpen ? (
        <WorkspacePageGuideDialog
          guide={pageGuide}
          onClose={() => setPageGuideOpen(false)}
        />
      ) : null}
      <ConsentGate />
    </div>
  );
}
