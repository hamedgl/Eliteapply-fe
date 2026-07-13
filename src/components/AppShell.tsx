import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BookOpen,
  CalendarCheck,
  FileText,
  FolderKanban,
  GraduationCap,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  Mic2,
  Settings,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { useSession } from "../lib/auth/session";
import { authApi } from "../lib/api/auth";
const items = [
  ["/app/dashboard", "Dashboard", LayoutDashboard, true],
  ["/app/applications", "Applications", FolderKanban, true],
  ["/app/writing", "Writing Studio", BookOpen, true],
  ["/app/academic-profile", "Academic Profile", GraduationCap, true],
  ["/app/documents", "Documents", FileText, true],
  ["/app/references", "References", Users, true],
  ["/app/interviews/new", "Interview Practice", Mic2, true],
  ["/app/settings/profile", "Settings", Settings, true],
] as const;
export function AppShell() {
  const [open, setOpen] = useState(false),
    user = useSession((s) => s.user),
    clear = useSession((s) => s.clear),
    nav = useNavigate();
  async function logout() {
    try {
      await authApi.logout();
    } finally {
      clear();
      nav("/login");
    }
  }
  return (
    <div className="app-shell">
      <button
        className="mobile-menu"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
      >
        <Menu />
      </button>
      {open ? (
        <button
          className="scrim"
          onClick={() => setOpen(false)}
          aria-label="Close navigation"
        />
      ) : null}
      <aside className={open ? "sidebar open" : "sidebar"}>
        <div className="sidebar-head">
          <NavLink to="/app/dashboard" className="brand">
            EliteApply
          </NavLink>
          <button onClick={() => setOpen(false)} aria-label="Close navigation">
            <X />
          </button>
        </div>
        <nav aria-label="Primary">
          {items.map(([href, label, Icon, enabled]) => (
            <NavLink
              key={href}
              to={enabled ? href : "/app/unavailable"}
              onClick={() => setOpen(false)}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <Icon />
              <span>{label}</span>
              {!enabled ? (
                <LockKeyhole className="lock" aria-label="Unavailable" />
              ) : null}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-note">
          <CalendarCheck />
          <strong>Built around your deadlines</strong>
          <span>
            Applications, writing, references and interview practice are ready.
          </span>
        </div>
        <div className="account">
          <span>
            {(user?.full_name ?? user?.email ?? "EA").slice(0, 1).toUpperCase()}
          </span>
          <div>
            <strong>{user?.full_name ?? "Your account"}</strong>
            <small>{user?.email}</small>
          </div>
          <button onClick={logout}>Log out</button>
        </div>
      </aside>
      <main className="workspace">
        <Outlet />
      </main>
    </div>
  );
}
