import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  UserRound,
  X,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  Link,
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { authApi } from "../../lib/api/auth";
import { useSession } from "../../lib/auth/session";

const productLinks = [
  ["Interactive product preview", "/product-preview"],
  ["Application tracker", "/features/scholarship-application-tracker"],
  ["Writing workspace", "/features/personal-statement-workspace"],
  ["Documents and evidence", "/features/document-organiser"],
  ["Reference tracking", "/features/reference-tracking"],
  ["Readiness review", "/features/submission-readiness"],
] as const;

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="marketing phase-one-marketing phase-two-marketing">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <MarketingHeader />
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      <MarketingFooter />
    </div>
  );
}

export function MarketingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  const showPublicCta = useSession(
    (state) => !state.initializing && !state.accessToken,
  );

  useEffect(() => setMenuOpen(false), [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    menuRef.current?.querySelector<HTMLElement>("summary, a")?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        requestAnimationFrame(() => menuButtonRef.current?.focus());
        return;
      }
      if (event.key !== "Tab") return;
      const items = Array.from(
        menuRef.current?.querySelectorAll<HTMLElement>(
          'a, summary, button, [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
      const focusable = menuButtonRef.current
        ? [...items, menuButtonRef.current]
        : items;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
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
  }, [menuOpen]);

  return (
    <header className="marketing-header phase-one-header phase-two-header">
      <Link className="marketing-brand" to="/" aria-label="EliteApply home">
        <span className="brand-mark" aria-hidden="true">
          E
        </span>
        EliteApply
      </Link>
      <nav
        id="phase-two-navigation"
        ref={menuRef}
        className={menuOpen ? "marketing-nav open" : "marketing-nav"}
        aria-label="Main navigation"
      >
        <div className="marketing-nav-links">
          <details className="product-menu">
            <summary>
              Product <ChevronDown aria-hidden="true" />
            </summary>
            <div className="product-menu-panel">
              <Link to="/features">All features</Link>
              {productLinks.map(([label, to]) => (
                <Link key={to} to={to}>
                  {label}
                </Link>
              ))}
            </div>
          </details>
          <NavLink to="/how-it-works">How it works</NavLink>
          <NavLink to="/for-students">For students</NavLink>
          <NavLink to="/resources">Resources</NavLink>
          <NavLink to="/pricing">Pricing</NavLink>
        </div>
        <MarketingAccountMenu />
      </nav>
      {showPublicCta ? (
        <Link
          className="landing-button small header-mobile-cta"
          to="/register"
          reloadDocument
        >
          Start free
        </Link>
      ) : null}
      <button
        ref={menuButtonRef}
        className="nav-toggle"
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        aria-controls="phase-two-navigation"
        aria-expanded={menuOpen}
        aria-label={menuOpen ? "Close navigation" : "Open navigation"}
      >
        {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
      </button>
    </header>
  );
}

export function MarketingAccountMenu() {
  const { user, accessToken, initializing } = useSession();

  if (initializing || (accessToken && !user))
    return <span className="marketing-account-loading" aria-label="Checking account" />;

  if (!accessToken || !user)
    return (
      <div className="marketing-public-actions">
        <Link className="nav-signin" to="/login" reloadDocument>
          Sign in
        </Link>
        <Link className="landing-button small" to="/register" reloadDocument>
          Start free
        </Link>
      </div>
    );

  return <SignedMarketingAccountMenu />;
}

function SignedMarketingAccountMenu() {
  const { user, clear } = useSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape, true);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape, true);
    };
  }, [open]);

  if (!user) return null;

  const name = user.full_name?.trim() || user.email;
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await authApi.logout();
    } catch {
      // Local session removal remains authoritative when the server is unavailable.
    } finally {
      queryClient.clear();
      clear();
      navigate("/", { replace: true });
    }
  }

  return (
    <div ref={rootRef} className="marketing-account">
      <button
        ref={triggerRef}
        className="marketing-account-trigger"
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${open ? "Close" : "Open"} account menu for ${name}`}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="marketing-avatar" aria-hidden="true">
          {initials || <UserRound />}
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt=""
              referrerPolicy="no-referrer"
              onError={(event) => event.currentTarget.remove()}
            />
          ) : null}
        </span>
        <span className="marketing-account-name">{name}</span>
        <ChevronDown aria-hidden="true" />
      </button>
      {open ? (
        <div className="marketing-account-panel" role="menu">
          <header>
            <strong>{name}</strong>
            <span>{user.email}</span>
          </header>
          <Link to="/app/dashboard" role="menuitem">
            <LayoutDashboard aria-hidden="true" />
            Workspace
          </Link>
          <Link to="/app/settings/profile" role="menuitem">
            <Settings aria-hidden="true" />
            Account settings
          </Link>
          <button
            type="button"
            role="menuitem"
            disabled={loggingOut}
            onClick={() => void logout()}
          >
            <LogOut aria-hidden="true" />
            {loggingOut ? "Signing out…" : "Log out"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function MarketingFooter() {
  return (
    <footer className="phase-one-footer phase-two-footer">
      <div>
        <Link className="marketing-brand inverse-brand" to="/">
          EliteApply
        </Link>
        <p>A calm workspace for scholarship applications.</p>
      </div>
      <nav aria-label="Product">
        <strong>Product</strong>
        <Link to="/features/scholarship-application-tracker">Application tracker</Link>
        <Link to="/features/personal-statement-workspace">Writing workspace</Link>
        <Link to="/features/document-organiser">Documents and evidence</Link>
        <Link to="/features/reference-tracking">References</Link>
      </nav>
      <nav aria-label="Explore">
        <strong>Explore</strong>
        <Link to="/how-it-works">How it works</Link>
        <Link to="/for-students">For students</Link>
        <Link to="/pricing">Pricing</Link>
        <Link to="/resources">Resources</Link>
      </nav>
      <nav aria-label="Company and legal">
        <strong>Company</strong>
        <Link to="/about">About</Link>
        <Link to="/security">Security</Link>
        <Link to="/privacy">Privacy</Link>
        <Link to="/terms">Terms</Link>
        <Link to="/accessibility">Accessibility</Link>
        <Link to="/contact">Contact</Link>
      </nav>
      <div className="footer-bottom">
        <span>© 2026 EliteApply</span>
        <Link to="/login" reloadDocument>
          Sign in
        </Link>
      </div>
    </footer>
  );
}
