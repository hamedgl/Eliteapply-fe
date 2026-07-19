import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BellRing,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Database,
  FileClock,
  Flag,
  Gauge,
  ListChecks,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  Users,
  X,
  XCircle,
} from "lucide-react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  Navigate,
  NavLink,
  Route,
  Routes,
  Link,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  PromptDialogProvider,
  usePromptDialog,
} from "../../components/PromptDialog";
import {
  adminApi,
  type AdminAction,
  type CatalogueKind,
  type CatalogueModerationItem,
  type CursorPage,
  type EntitlementResponse,
  type FeatureFlagSummary,
  type LaunchGate,
  type OperationSummary,
  type OperationType,
  type UserSearchResult,
} from "../../lib/api/admin";
import { authApi } from "../../lib/api/auth";
import { ApiError } from "../../lib/api/errors";
import { catalogueApi } from "../../lib/api/phase2";
import { queryKeys } from "../../lib/api/queryKeys";
import { usersApi } from "../../lib/api/users";
import { useSession } from "../../lib/auth/session";
import { productConfig } from "../../lib/config/product";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ACTIVE_OPERATION_STATES = new Set([
  "queued",
  "processing",
  "ready",
  "in_progress",
]);
const TERMINAL_OPERATION_STATES = new Set([
  "succeeded",
  "completed",
  "failed",
  "cancelled",
  "canceled",
]);
const QUEUES = [
  "eliteapply-document-scan",
  "eliteapply-notifications",
  "eliteapply-writing-generation",
  "eliteapply-opportunity-import",
  "eliteapply-interview-audio",
  "eliteapply-notification-center",
] as const;
const ADMIN_QUERY = {
  staleTime: 5_000,
  retry: (failureCount: number, error: Error) => {
    const status = error instanceof ApiError ? error.status : 0;
    return failureCount < 2 && (status === 0 || status >= 500);
  },
};

const adminNavigation = [
  {
    label: "Operations",
    items: [
      ["/admin", "Overview", Gauge],
      ["/admin/operations", "Operations", RefreshCw],
      ["/admin/queues", "Queues and reminders", BellRing],
    ],
  },
  {
    label: "Access",
    items: [
      ["/admin/users", "Users", Users],
      ["/admin/audit-log", "Audit log", ClipboardList],
    ],
  },
  {
    label: "Configuration",
    items: [
      ["/admin/feature-flags", "Feature flags", Flag],
      ["/admin/catalogue", "Catalogue moderation", Database],
      ["/admin/launch", "Launch readiness", ListChecks],
    ],
  },
  {
    label: "References",
    items: [["/admin/references", "Reference event lookup", BookOpen]],
  },
] as const;

export function AdminPanel() {
  const token = useSession((state) => state.accessToken);
  const initializing = useSession((state) => state.initializing);
  const location = useLocation();

  if (initializing)
    return <AdminSkeleton label="Restoring your secure session…" />;
  if (!token)
    return (
      <Navigate
        to={`/login?returnTo=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );

  return <AdminGuard />;
}

function AdminGuard() {
  const cachedUser = useSession((state) => state.user);
  const setUser = useSession((state) => state.setUser);
  const queryClient = useQueryClient();
  const [forbidden, setForbidden] = useState(false);
  const me = useQuery({
    queryKey: queryKeys.user,
    queryFn: usersApi.me,
    ...ADMIN_QUERY,
  });

  useEffect(() => {
    if (me.data) setUser(me.data);
  }, [me.data, setUser]);

  useEffect(() => {
    const revoke = () => {
      queryClient.removeQueries({ queryKey: ["admin"] });
      setForbidden(true);
    };
    window.addEventListener("admin:forbidden", revoke);
    return () => window.removeEventListener("admin:forbidden", revoke);
  }, [queryClient]);

  useEffect(
    () => () => queryClient.removeQueries({ queryKey: ["admin"] }),
    [cachedUser?.id, queryClient],
  );

  if (me.isPending)
    return <AdminSkeleton label="Verifying administrator access…" />;
  if (forbidden || (me.data && !me.data.is_admin)) return <ForbiddenPage />;
  if (me.isError)
    return <AdminEntryError error={me.error} retry={me.refetch} />;

  return (
    <PromptDialogProvider>
      <AdminShell user={me.data ?? cachedUser!} />
    </PromptDialogProvider>
  );
}

function AdminShell({ user }: { user: UserSearchResult }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const clear = useSession((state) => state.clear);
  const sidebarRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  const isProduction =
    import.meta.env.PROD ||
    productConfig.apiBaseUrl.startsWith("https://api.eliteapply.net/");
  const searchMutation = useMutation({
    mutationFn: ({
      mode,
      value,
    }: {
      mode: "email" | "user_id";
      value: string;
    }) => adminApi.searchUser(mode, value),
    onSuccess: (result) => navigate(`/admin/users/${result.id}`),
  });

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sidebarRef.current?.querySelector<HTMLElement>("button, a")?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        requestAnimationFrame(() => menuRef.current?.focus());
        return;
      }
      if (event.key !== "Tab") return;
      const controls = sidebarRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])',
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
    document.addEventListener("keydown", keydown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", keydown);
    };
  }, [mobileOpen]);

  async function logout() {
    try {
      await authApi.logout();
    } finally {
      queryClient.removeQueries({ queryKey: ["admin"] });
      clear();
      navigate("/login");
    }
  }

  function lookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = String(
      new FormData(event.currentTarget).get("lookup") ?? "",
    ).trim();
    const mode = UUID_PATTERN.test(value)
      ? "user_id"
      : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        ? "email"
        : null;
    if (!mode) {
      setLookupError("Enter an exact email address or a valid UUID.");
      return;
    }
    setLookupError("");
    searchMutation.mutate({ mode, value });
  }

  return (
    <div className={`admin-shell${collapsed ? " is-collapsed" : ""}`}>
      <a className="app-skip-link" href="#admin-content">
        Skip to admin workspace
      </a>
      {mobileOpen ? (
        <button
          className="admin-scrim"
          type="button"
          aria-label="Close admin navigation"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}
      <aside
        ref={sidebarRef}
        className={`admin-sidebar${mobileOpen ? " is-open" : ""}`}
        role={mobileOpen ? "dialog" : undefined}
        aria-modal={mobileOpen ? true : undefined}
        aria-label="Admin navigation"
      >
        <header>
          <Link className="admin-brand" to="/admin">
            <ShieldCheck aria-hidden="true" />
            <span>EliteApply Admin</span>
          </Link>
          <button
            className="admin-collapse"
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={
              collapsed
                ? "Expand admin navigation"
                : "Collapse admin navigation"
            }
          >
            {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          </button>
          <button
            className="admin-mobile-close"
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close admin navigation"
          >
            <X />
          </button>
        </header>
        <AdminNavigation />
        <footer>
          <Link to="/app/dashboard">
            <ArrowLeft aria-hidden="true" />
            <span>Return to application</span>
          </Link>
          <button type="button" onClick={logout}>
            <LogOut aria-hidden="true" />
            <span>Log out</span>
          </button>
        </footer>
      </aside>
      <header className="admin-topbar">
        <button
          ref={menuRef}
          className="admin-mobile-menu"
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open admin navigation"
          aria-expanded={mobileOpen}
        >
          <Menu />
        </button>
        <form className="admin-global-search" onSubmit={lookup} role="search">
          <Search aria-hidden="true" />
          <label className="sr-only" htmlFor="admin-user-lookup">
            Find a user by exact email or UUID
          </label>
          <input
            id="admin-user-lookup"
            name="lookup"
            placeholder="Lookup user by exact email or UUID"
            aria-describedby={lookupError ? "admin-lookup-error" : undefined}
          />
          <button type="submit" disabled={searchMutation.isPending}>
            {searchMutation.isPending ? "Searching…" : "Find user"}
          </button>
        </form>
        {isProduction ? (
          <span className="admin-environment">
            <i aria-hidden="true" /> Production
          </span>
        ) : null}
        <div className="admin-identity">
          <UserRound aria-hidden="true" />
          <span>
            <strong>{user.full_name || user.email}</strong>
            <small>Administrator</small>
          </span>
        </div>
        {lookupError ? (
          <p
            id="admin-lookup-error"
            className="admin-search-error"
            role="alert"
          >
            {lookupError}
          </p>
        ) : searchMutation.isError ? (
          <InlineError compact error={searchMutation.error} />
        ) : null}
      </header>
      <main id="admin-content" className="admin-content" tabIndex={-1}>
        <Routes>
          <Route index element={<AdminOverviewPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="users/:userId" element={<UserDetailPage />} />
          <Route path="operations" element={<OperationsPage />} />
          <Route
            path="operations/:operationId"
            element={<OperationDetailPage />}
          />
          <Route path="feature-flags" element={<FeatureFlagsPage />} />
          <Route path="catalogue" element={<CatalogueModerationPage />} />
          <Route path="references" element={<ReferenceEventsPage />} />
          <Route path="launch" element={<LaunchReadinessPage />} />
          <Route path="queues" element={<QueuesPage />} />
          <Route path="audit-log" element={<AuditLogPage />} />
          <Route path="*" element={<AdminNotFound />} />
        </Routes>
      </main>
    </div>
  );
}

function AdminNavigation() {
  return (
    <nav aria-label="Admin sections">
      {adminNavigation.map((group) => (
        <section key={group.label}>
          <p>{group.label}</p>
          {group.items.map(([href, label, Icon]) => (
            <NavLink
              key={href}
              to={href}
              end={href === "/admin"}
              title={label}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <Icon aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </section>
      ))}
    </nav>
  );
}

function AdminOverviewPage() {
  const readiness = useQuery({
    queryKey: ["admin", "launch-readiness"],
    queryFn: ({ signal }) => adminApi.readiness(signal),
    ...ADMIN_QUERY,
  });
  const operations = useQuery({
    queryKey: ["admin", "operations", "recent"],
    queryFn: ({ signal }) => adminApi.operations({ limit: 10, signal }),
    ...ADMIN_QUERY,
  });
  const flags = useQuery({
    queryKey: ["admin", "feature-flags"],
    queryFn: ({ signal }) => adminApi.flags(signal),
    ...ADMIN_QUERY,
  });
  const audit = useQuery({
    queryKey: ["admin", "audit", "recent"],
    queryFn: ({ signal }) => adminApi.audit({ limit: 10, signal }),
    ...ADMIN_QUERY,
  });

  return (
    <>
      <AdminPageHeader
        title="Operations overview"
        purpose="Monitor launch readiness, lifecycle operations, access controls and recent administrative activity."
      />
      <OverviewReadiness query={readiness} />
      <div className="admin-overview-split">
        <OverviewOperations query={operations} />
        <OverviewFlags query={flags} />
      </div>
      <OverviewAudit query={audit} />
    </>
  );
}

function OverviewReadiness({
  query,
}: {
  query: UseQueryResult<Awaited<ReturnType<typeof adminApi.readiness>>, Error>;
}) {
  return (
    <AdminPanelSection
      title="Launch readiness"
      action={<Link to="/admin/launch">View launch workspace</Link>}
    >
      {query.isPending ? (
        <PanelSkeleton />
      ) : query.isError ? (
        <InlineError error={query.error} retry={query.refetch} />
      ) : (
        <div className="admin-readiness-overview">
          <div className="admin-readiness-ring">
            <svg viewBox="0 0 42 42" aria-hidden="true">
              <circle cx="21" cy="21" r="16" />
              <circle
                className="progress"
                cx="21"
                cy="21"
                r="16"
                pathLength="100"
                strokeDasharray={`${query.data.total ? (query.data.passed / query.data.total) * 100 : 0} 100`}
              />
            </svg>
            <div>
              <strong>
                {query.data.passed} <span>of</span> {query.data.total}
              </strong>
              <small>gates passed</small>
            </div>
          </div>
          <div>
            <StatusBadge
              status={query.data.ready ? "passed" : "failed"}
              label={
                query.data.ready ? "Ready for launch" : "Not ready for launch"
              }
            />
            <p>{query.data.blocking_gates.length} gates are blocking launch.</p>
          </div>
          <div>
            <strong>Blocking gates ({query.data.blocking_gates.length})</strong>
            {query.data.blocking_gates.length ? (
              <ul className="admin-compact-list">
                {query.data.blocking_gates.map((gate) => (
                  <li key={gate}>
                    <XCircle aria-hidden="true" />
                    {humanize(gate)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="admin-empty-copy">No blocking gates.</p>
            )}
          </div>
        </div>
      )}
    </AdminPanelSection>
  );
}

function OverviewOperations({
  query,
}: {
  query: UseQueryResult<CursorPage<OperationSummary>, Error>;
}) {
  return (
    <AdminPanelSection
      title="Recent operations"
      action={<Link to="/admin/operations">View all operations</Link>}
    >
      {query.isPending ? (
        <PanelSkeleton />
      ) : query.isError ? (
        <InlineError error={query.error} retry={query.refetch} />
      ) : query.data.items.length ? (
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Status</th>
                <th>User</th>
                <th>Created</th>
                <th>
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {query.data.items.slice(0, 5).map((item) => (
                <tr key={item.id}>
                  <td>{humanize(item.type)}</td>
                  <td>
                    <StatusBadge status={item.status} />
                  </td>
                  <td>
                    <CopyableId value={item.user_id} />
                  </td>
                  <td>
                    <Timestamp value={item.created_at} />
                  </td>
                  <td>
                    <Link
                      aria-label={`Open operation ${item.id}`}
                      to={`/admin/operations/${item.id}`}
                    >
                      <ChevronRight />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="No recent operations"
          detail="No lifecycle operations were returned."
        />
      )}
    </AdminPanelSection>
  );
}

function OverviewFlags({
  query,
}: {
  query: UseQueryResult<FeatureFlagSummary[], Error>;
}) {
  const notable =
    query.data?.filter(
      (flag) =>
        flag.kill_switch ||
        (flag.enabled &&
          flag.rollout_percentage > 0 &&
          flag.rollout_percentage < 100),
    ) ?? [];
  return (
    <AdminPanelSection
      title="Feature controls"
      action={<Link to="/admin/feature-flags">Manage feature flags</Link>}
    >
      {query.isPending ? (
        <PanelSkeleton />
      ) : query.isError ? (
        <InlineError error={query.error} retry={query.refetch} />
      ) : notable.length ? (
        <ul className="admin-control-list">
          {notable.map((flag) => (
            <li key={flag.key}>
              <div>
                <strong>{flag.key}</strong>
                <small>
                  {flag.cohorts.length
                    ? flag.cohorts.join(", ")
                    : "All cohorts"}
                </small>
              </div>
              <StatusBadge
                status={flag.kill_switch ? "failed" : "warning"}
                label={
                  flag.kill_switch
                    ? "Kill switch active"
                    : `${flag.rollout_percentage}% rollout`
                }
              />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="No exceptional controls"
          detail="No active kill switches or partial rollouts were returned."
        />
      )}
    </AdminPanelSection>
  );
}

function OverviewAudit({
  query,
}: {
  query: UseQueryResult<CursorPage<AdminAction>, Error>;
}) {
  return (
    <AdminPanelSection
      title="Recent admin actions"
      action={<Link to="/admin/audit-log">Open audit log</Link>}
    >
      {query.isPending ? (
        <PanelSkeleton />
      ) : query.isError ? (
        <InlineError error={query.error} retry={query.refetch} />
      ) : query.data.items.length ? (
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Administrator</th>
                <th>Action</th>
                <th>Target</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {query.data.items.slice(0, 5).map((item) => (
                <tr key={item.id}>
                  <td>
                    <Timestamp value={item.created_at} />
                  </td>
                  <td>
                    <CopyableId value={item.admin_user_id} />
                  </td>
                  <td>{humanize(item.action)}</td>
                  <td>
                    {item.target_type} · <CopyableId value={item.target_id} />
                  </td>
                  <td>{item.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="No recent admin actions"
          detail="The audit endpoint returned no entries."
        />
      )}
    </AdminPanelSection>
  );
}

function UsersPage() {
  const cursor = useAdminCursor();
  const account = cursor.params.get("account") ?? "all";
  const role = cursor.params.get("role") ?? "all";
  const limit = Number(cursor.params.get("limit") ?? 50);
  const query = useQuery({
    queryKey: ["admin", "users", account, role, limit, cursor.cursor],
    queryFn: ({ signal }) =>
      adminApi.users({
        isActive: account === "all" ? undefined : account === "active",
        isAdmin: role === "all" ? undefined : role === "admin",
        limit,
        cursor: cursor.cursor,
        signal,
      }),
    placeholderData: (previous) => previous,
    ...ADMIN_QUERY,
  });

  return (
    <>
      <AdminPageHeader
        title="Users"
        purpose="Manage account activation and administrator access without opening private application content."
      />
      <FilterBar>
        <label>
          Account
          <select
            value={account}
            onChange={(event) =>
              cursor.setFilter("account", event.target.value)
            }
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="deactivated">Deactivated</option>
          </select>
        </label>
        <label>
          Role
          <select
            value={role}
            onChange={(event) => cursor.setFilter("role", event.target.value)}
          >
            <option value="all">All</option>
            <option value="admin">Administrator</option>
            <option value="standard">Standard user</option>
          </select>
        </label>
        <label>
          Page size
          <select
            value={limit}
            onChange={(event) => cursor.setFilter("limit", event.target.value)}
          >
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </label>
      </FilterBar>
      <AdminPanelSection title="User accounts">
        {query.isPending ? (
          <PanelSkeleton rows={6} />
        ) : query.isError ? (
          <InlineError error={query.error} retry={query.refetch} />
        ) : query.data.items.length ? (
          <>
            <div className="admin-table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name and email</th>
                    <th>Account</th>
                    <th>Role</th>
                    <th>Created</th>
                    <th>Last login</th>
                    <th>
                      <span className="sr-only">Open</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.items.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <strong>{user.full_name || "Name not provided"}</strong>
                        <small>{user.email}</small>
                      </td>
                      <td>
                        <StatusBadge
                          status={user.is_active ? "active" : "inactive"}
                        />
                      </td>
                      <td>
                        {user.is_admin ? "Administrator" : "Standard user"}
                      </td>
                      <td>
                        <Timestamp value={user.created_at} />
                      </td>
                      <td>
                        {user.last_login_at ? (
                          <Timestamp value={user.last_login_at} />
                        ) : (
                          "Never"
                        )}
                      </td>
                      <td>
                        <Link
                          to={`/admin/users/${user.id}`}
                          aria-label={`Open ${user.email}`}
                        >
                          <ChevronRight />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <CursorPagination page={query.data} cursor={cursor} />
          </>
        ) : (
          <EmptyState
            title="No users match these filters"
            detail="Change the account or role filters."
          />
        )}
      </AdminPanelSection>
    </>
  );
}

function UserDetailPage() {
  const { userId = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") ?? "account";
  const query = useQuery({
    queryKey: ["admin", "user", userId],
    queryFn: ({ signal }) => adminApi.user(userId, signal),
    enabled: UUID_PATTERN.test(userId),
    ...ADMIN_QUERY,
  });

  if (!UUID_PATTERN.test(userId))
    return (
      <NotFoundState
        title="Invalid user ID"
        detail="The user route does not contain a valid UUID."
      />
    );
  if (query.isPending) return <AdminSkeleton label="Loading user account…" />;
  if (query.isError)
    return query.error instanceof ApiError && query.error.status === 404 ? (
      <NotFoundState
        title="User not found"
        detail="No user was found for this exact ID."
      />
    ) : (
      <InlineError error={query.error} retry={query.refetch} />
    );

  const user = query.data;
  return (
    <>
      <AdminPageHeader
        title={user.full_name || user.email}
        purpose={user.email}
        back={{ href: "/admin/users", label: "Users" }}
        actions={<CopyableId value={user.id} />}
      />
      <nav className="admin-tabs" aria-label="User details">
        {[
          ["account", "Account"],
          ["entitlement", "Entitlement"],
          ["usage", "AI usage"],
          ["audit", "Audit history"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={tab === key ? "active" : ""}
            aria-current={tab === key ? "page" : undefined}
            onClick={() => {
              const next = new URLSearchParams(params);
              next.set("tab", key);
              setParams(next, { replace: true });
            }}
          >
            {label}
          </button>
        ))}
      </nav>
      {tab === "account" ? (
        <UserAccountTab user={user} />
      ) : tab === "entitlement" ? (
        <EntitlementTab user={user} />
      ) : tab === "usage" ? (
        <UsageTab user={user} />
      ) : (
        <UserAuditTab user={user} />
      )}
    </>
  );
}

function UserAccountTab({ user }: { user: UserSearchResult }) {
  const currentUser = useSession((state) => state.user);
  const requestText = usePromptDialog();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const mutation = useMutation({
    mutationFn: (body: {
      is_active?: boolean;
      is_admin?: boolean;
      reason: string;
    }) => adminApi.updateUser(user.id, body),
    onSuccess: (updated) => {
      queryClient.setQueryData(["admin", "user", user.id], updated);
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "audit"] });
      setMessage("Account access was updated.");
    },
  });
  const self = user.id === currentUser?.id;

  async function change(field: "is_active" | "is_admin", value: boolean) {
    const label =
      field === "is_active"
        ? value
          ? "Activate account"
          : "Deactivate account"
        : value
          ? "Grant administrator access"
          : "Revoke administrator access";
    const reason = await requestText({
      title: label,
      label: "Reason",
      description:
        field === "is_active" && !value
          ? `Deactivating ${user.email} revokes usable session access.`
          : `This audited change affects ${user.email}.`,
      required: true,
      multiline: true,
      submitLabel: "Continue",
    });
    if (!reason || reason.trim().length < 3) return;
    if (!value || field === "is_admin") {
      const confirmation = await requestText({
        title: `Confirm ${label.toLowerCase()}`,
        label: `Type ${user.email}`,
        description:
          "This exact confirmation prevents changes to the wrong account.",
        required: true,
        submitLabel: label,
      });
      if (confirmation !== user.email) return;
    }
    mutation.mutate({ [field]: value, reason: reason.trim() });
  }

  return (
    <div className="admin-detail-grid">
      <AdminPanelSection title="Account state">
        <dl className="admin-definition-list">
          <Definition
            label="Account"
            value={
              <StatusBadge status={user.is_active ? "active" : "inactive"} />
            }
          />
          <Definition
            label="Role"
            value={user.is_admin ? "Administrator" : "Standard user"}
          />
          <Definition
            label="Created"
            value={<Timestamp value={user.created_at} />}
          />
          <Definition
            label="Last login"
            value={
              user.last_login_at ? (
                <Timestamp value={user.last_login_at} />
              ) : (
                "Never"
              )
            }
          />
        </dl>
      </AdminPanelSection>
      <AdminPanelSection title="Access actions">
        <p>
          Every change is server-authoritative and recorded in the immutable
          audit trail.
        </p>
        <div className="admin-action-stack">
          <button
            type="button"
            disabled={mutation.isPending || (self && user.is_active)}
            onClick={() => change("is_active", !user.is_active)}
            className={
              user.is_active ? "admin-danger-button" : "admin-primary-button"
            }
          >
            {user.is_active ? "Deactivate account" : "Activate account"}
          </button>
          <button
            type="button"
            disabled={mutation.isPending || (self && user.is_admin)}
            onClick={() => change("is_admin", !user.is_admin)}
            className={
              user.is_admin ? "admin-danger-button" : "admin-secondary-button"
            }
          >
            {user.is_admin
              ? "Revoke administrator access"
              : "Grant administrator access"}
          </button>
          {self ? (
            <small>
              You cannot deactivate or demote your own administrator account.
            </small>
          ) : null}
        </div>
        {message ? (
          <p className="admin-success" role="status">
            {message}
          </p>
        ) : null}
        {mutation.isError ? <InlineError error={mutation.error} /> : null}
      </AdminPanelSection>
    </div>
  );
}

function EntitlementTab({ user }: { user: UserSearchResult }) {
  const requestText = usePromptDialog();
  const queryClient = useQueryClient();
  const entitlement = useQuery({
    queryKey: ["admin", "user", user.id, "entitlement"],
    queryFn: ({ signal }) => adminApi.entitlement(user.id, signal),
    ...ADMIN_QUERY,
  });
  const update = useMutation({
    mutationFn: (body: Parameters<typeof adminApi.updateEntitlement>[1]) =>
      adminApi.updateEntitlement(user.id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["admin", "user", user.id, "entitlement"],
      });
      void queryClient.invalidateQueries({ queryKey: ["admin", "audit"] });
    },
  });
  const reset = useMutation({
    mutationFn: (reason: string) => adminApi.resetUsage(user.id, reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["admin", "user", user.id],
      });
      void queryClient.invalidateQueries({ queryKey: ["admin", "audit"] });
    },
  });

  async function change(kind: "plan" | "tokens", clear: boolean) {
    const value = clear
      ? null
      : await requestText({
          title:
            kind === "plan" ? "Set plan override" : "Set token-limit override",
          label:
            kind === "plan"
              ? "Plan key: free, pro_trial, pro_monthly, pro_annual, teams_monthly, or teams_annual"
              : "Included AI token limit",
          required: true,
          submitLabel: "Continue",
        });
    if (!clear && value === null) return;
    const plans = new Set([
      "free",
      "pro_trial",
      "pro_monthly",
      "pro_annual",
      "teams_monthly",
      "teams_annual",
    ]);
    if (kind === "plan" && value !== null && !plans.has(value)) return;
    const number = kind === "tokens" && value !== null ? Number(value) : null;
    if (
      kind === "tokens" &&
      value !== null &&
      (!Number.isInteger(number) || number! < 0)
    )
      return;
    const reason = await requestText({
      title: clear
        ? "Clear entitlement override"
        : "Confirm entitlement override",
      label: "Reason",
      required: true,
      multiline: true,
      submitLabel: clear ? "Clear override" : "Apply override",
    });
    if (!reason || reason.trim().length < 3) return;
    update.mutate(
      kind === "plan"
        ? { forced_plan_key: value, reason }
        : { ai_tokens_limit_override: number, reason },
    );
  }

  async function resetUsage() {
    if (!entitlement.data) return;
    const reason = await requestText({
      title: "Reset current token usage",
      label: "Reason",
      description: `${user.email} has used ${formatNumber(entitlement.data.ai_tokens_used)} included tokens. Historical logs will remain.`,
      required: true,
      multiline: true,
      submitLabel: "Continue",
    });
    if (!reason || reason.trim().length < 3) return;
    const confirmation = await requestText({
      title: "Confirm usage reset",
      label: `Type ${user.email}`,
      required: true,
      submitLabel: "Reset usage window",
    });
    if (confirmation === user.email) reset.mutate(reason);
  }

  return (
    <>
      <AdminPanelSection title="Resolved entitlement">
        {entitlement.isPending ? (
          <PanelSkeleton />
        ) : entitlement.isError ? (
          <InlineError error={entitlement.error} retry={entitlement.refetch} />
        ) : (
          <EntitlementSummary entitlement={entitlement.data} />
        )}
      </AdminPanelSection>
      <div className="admin-detail-grid">
        <AdminPanelSection title="Entitlement overrides">
          <p>
            The API returns resolved values only. This console does not infer
            whether a value came from billing, defaults, or an override.
          </p>
          <div className="admin-action-stack">
            <button onClick={() => change("plan", false)}>
              Set plan override
            </button>
            <button onClick={() => change("tokens", false)}>
              Set token-limit override
            </button>
            <button onClick={() => change("plan", true)}>
              Clear plan override
            </button>
            <button onClick={() => change("tokens", true)}>
              Clear token-limit override
            </button>
          </div>
          {update.isError ? <InlineError error={update.error} /> : null}
        </AdminPanelSection>
        <AdminPanelSection title="Usage window">
          <p>
            Resetting advances the effective usage-window start. It does not
            delete historical usage logs.
          </p>
          <button
            className="admin-danger-button"
            type="button"
            disabled={reset.isPending || !entitlement.data}
            onClick={resetUsage}
          >
            {reset.isPending ? "Resetting…" : "Reset current token usage"}
          </button>
          {reset.isSuccess ? (
            <p className="admin-success" role="status">
              Usage window reset.
            </p>
          ) : null}
          {reset.isError ? <InlineError error={reset.error} /> : null}
        </AdminPanelSection>
      </div>
    </>
  );
}

function EntitlementSummary({
  entitlement,
}: {
  entitlement: EntitlementResponse;
}) {
  const percent = entitlement.ai_tokens_limit
    ? Math.min(
        100,
        (entitlement.ai_tokens_used / entitlement.ai_tokens_limit) * 100,
      )
    : entitlement.ai_tokens_used
      ? 100
      : 0;
  return (
    <div className="admin-entitlement">
      <dl className="admin-definition-list">
        <Definition
          label="Plan"
          value={`${entitlement.plan_label} (${entitlement.plan_key})`}
        />
        <Definition
          label="Subscription"
          value={humanize(entitlement.subscription_status)}
        />
        <Definition
          label="Access"
          value={entitlement.is_active ? "Active" : "Inactive"}
        />
        <Definition
          label="Period end"
          value={
            entitlement.current_period_end ? (
              <Timestamp value={entitlement.current_period_end} />
            ) : (
              "Not provided"
            )
          }
        />
        <Definition
          label="Trial end"
          value={
            entitlement.trial_end ? (
              <Timestamp value={entitlement.trial_end} />
            ) : (
              "Not applicable"
            )
          }
        />
        <Definition
          label="Purchased tokens"
          value={formatNumber(entitlement.purchased_tokens_remaining)}
        />
      </dl>
      <div className="admin-token-usage">
        <div>
          <strong>{formatNumber(entitlement.ai_tokens_used)} used</strong>
          <span>{formatNumber(entitlement.ai_tokens_limit)} included</span>
        </div>
        <span
          role="progressbar"
          aria-label="Included token usage"
          aria-valuemin={0}
          aria-valuemax={entitlement.ai_tokens_limit}
          aria-valuenow={entitlement.ai_tokens_used}
        >
          <i style={{ transform: `scaleX(${percent / 100})` }} />
        </span>
        <small>
          Resets <Timestamp value={entitlement.ai_tokens_reset_at} />
        </small>
      </div>
    </div>
  );
}

function UsageTab({ user }: { user: UserSearchResult }) {
  const cursor = useAdminCursor();
  const query = useQuery({
    queryKey: ["admin", "user", user.id, "usage", cursor.cursor],
    queryFn: ({ signal }) =>
      adminApi.usage(user.id, { cursor: cursor.cursor, limit: 50, signal }),
    placeholderData: (previous) => previous,
    ...ADMIN_QUERY,
  });
  return (
    <AdminPanelSection title="AI usage ledger">
      {query.isPending ? (
        <PanelSkeleton rows={6} />
      ) : query.isError ? (
        <InlineError error={query.error} retry={query.refetch} />
      ) : (
        <>
          <div className="admin-usage-summary">
            <SummaryValue label="Period" value={query.data.period} />
            <SummaryValue
              label="Requests"
              value={formatNumber(query.data.summary.request_count)}
            />
            <SummaryValue
              label="Total tokens"
              value={formatNumber(query.data.summary.total_tokens)}
            />
            <SummaryValue
              label="Metered tokens"
              value={formatNumber(query.data.summary.metered_tokens)}
            />
            <SummaryValue
              label="Cost"
              value={formatUsd(query.data.summary.cost_usd)}
            />
          </div>
          {query.data.logs.items.length ? (
            <>
              <div className="admin-table-scroll">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Task</th>
                      <th>Model</th>
                      <th>Prompt</th>
                      <th>Completion</th>
                      <th>Metered</th>
                      <th>Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {query.data.logs.items.map((log) => (
                      <tr key={log.id}>
                        <td>
                          <Timestamp value={log.created_at} />
                        </td>
                        <td>{humanize(log.task_type)}</td>
                        <td>{log.model_id}</td>
                        <td>{formatNumber(log.prompt_tokens)}</td>
                        <td>{formatNumber(log.completion_tokens)}</td>
                        <td>{formatNumber(log.metered_tokens)}</td>
                        <td>{formatUsd(log.cost_usd)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <CursorPagination page={query.data.logs} cursor={cursor} />
            </>
          ) : (
            <EmptyState
              title="No usage in this period"
              detail="The usage ledger returned no rows."
            />
          )}
        </>
      )}
    </AdminPanelSection>
  );
}

function UserAuditTab({ user }: { user: UserSearchResult }) {
  const query = useQuery({
    queryKey: ["admin", "audit", { targetId: user.id }],
    queryFn: ({ signal }) =>
      adminApi.audit({ targetId: user.id, limit: 50, signal }),
    ...ADMIN_QUERY,
  });
  return (
    <AdminPanelSection title="User audit history">
      {query.isPending ? (
        <PanelSkeleton />
      ) : query.isError ? (
        <InlineError error={query.error} retry={query.refetch} />
      ) : query.data.items.length ? (
        <AuditTimeline items={query.data.items} />
      ) : (
        <EmptyState
          title="No audit history"
          detail="No administrative actions target this user."
        />
      )}
    </AdminPanelSection>
  );
}

function OperationsPage() {
  const cursor = useAdminCursor();
  const type = (cursor.params.get("type") ?? "") as OperationType | "";
  const status = cursor.params.get("status") ?? "";
  const limit = Number(cursor.params.get("limit") ?? 25);
  const query = useQuery({
    queryKey: ["admin", "operations", type, status, limit, cursor.cursor],
    queryFn: ({ signal }) =>
      adminApi.operations({
        type: type || undefined,
        status: status || undefined,
        cursor: cursor.cursor,
        limit,
        signal,
      }),
    placeholderData: (previous) => previous,
    refetchInterval: (current) => {
      const items = current.state.data?.items ?? [];
      return !document.hidden &&
        items.some((item) => ACTIVE_OPERATION_STATES.has(item.status))
        ? 5_000
        : false;
    },
    ...ADMIN_QUERY,
  });
  return (
    <>
      <AdminPageHeader
        title="Operations"
        purpose="Monitor lifecycle metadata and recover supported jobs without exposing application content."
      />
      <FilterBar>
        <label>
          Type
          <select
            value={type}
            onChange={(event) => cursor.setFilter("type", event.target.value)}
          >
            <option value="">All</option>
            <option value="writing_generation">Writing generation</option>
            <option value="opportunity_import">Opportunity import</option>
            <option value="interview">Interview</option>
          </select>
        </label>
        <label>
          Status
          <input
            value={status}
            onChange={(event) => cursor.setFilter("status", event.target.value)}
            placeholder="Exact status"
          />
        </label>
        <label>
          Page size
          <select
            value={limit}
            onChange={(event) => cursor.setFilter("limit", event.target.value)}
          >
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </label>
      </FilterBar>
      <AdminPanelSection title="Lifecycle operations">
        {query.isPending ? (
          <PanelSkeleton rows={6} />
        ) : query.isError ? (
          <InlineError error={query.error} retry={query.refetch} />
        ) : query.data.items.length ? (
          <>
            <div className="admin-table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Status</th>
                    <th>User ID</th>
                    <th>Created</th>
                    <th>Operation ID</th>
                    <th>
                      <span className="sr-only">Open</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.items.map((item) => (
                    <tr key={item.id}>
                      <td>{humanize(item.type)}</td>
                      <td>
                        <StatusBadge status={item.status} />
                      </td>
                      <td>
                        <Link to={`/admin/users/${item.user_id}`}>
                          <CopyableId value={item.user_id} />
                        </Link>
                      </td>
                      <td>
                        <Timestamp value={item.created_at} />
                      </td>
                      <td>
                        <CopyableId value={item.id} />
                      </td>
                      <td>
                        <Link
                          to={`/admin/operations/${item.id}`}
                          aria-label={`Open operation ${item.id}`}
                        >
                          <ChevronRight />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <CursorPagination page={query.data} cursor={cursor} />
          </>
        ) : (
          <EmptyState
            title="No operations match these filters"
            detail="Try a different type or exact status."
          />
        )}
      </AdminPanelSection>
    </>
  );
}

function OperationDetailPage() {
  const { operationId = "" } = useParams();
  const navigate = useNavigate();
  const requestText = usePromptDialog();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["admin", "operation", operationId],
    queryFn: ({ signal }) => adminApi.operation(operationId, signal),
    enabled: UUID_PATTERN.test(operationId),
    refetchInterval: (current) => {
      const status = current.state.data?.status;
      return status && !document.hidden && ACTIVE_OPERATION_STATES.has(status)
        ? 5_000
        : false;
    },
    ...ADMIN_QUERY,
  });
  const retry = useMutation({
    mutationFn: () => adminApi.retryOperation(operationId),
    onSuccess: (operation) => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "operations"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "audit"] });
      navigate(`/admin/operations/${operation.id}`, {
        replace: operation.id !== operationId,
      });
      queryClient.setQueryData(["admin", "operation", operation.id], operation);
    },
  });
  const cancel = useMutation({
    mutationFn: () => adminApi.cancelOperation(operationId),
    onSuccess: (operation) => {
      queryClient.setQueryData(["admin", "operation", operationId], operation);
      void queryClient.invalidateQueries({ queryKey: ["admin", "operations"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "audit"] });
    },
  });

  async function confirmAction(action: "retry" | "cancel") {
    const result = await requestText({
      title: action === "retry" ? "Retry operation" : "Cancel operation",
      label: `Type ${action.toUpperCase()} to confirm`,
      description:
        action === "retry"
          ? "The backend may return a new operation ID."
          : "Cancellation is best effort and may return the current terminal state.",
      required: true,
      submitLabel: action === "retry" ? "Retry operation" : "Cancel operation",
    });
    if (result !== action.toUpperCase()) return;
    action === "retry" ? retry.mutate() : cancel.mutate();
  }

  if (!UUID_PATTERN.test(operationId))
    return (
      <NotFoundState
        title="Invalid operation ID"
        detail="The route does not contain a valid UUID."
      />
    );
  if (query.isPending) return <AdminSkeleton label="Loading operation…" />;
  if (query.isError)
    return query.error instanceof ApiError && query.error.status === 404 ? (
      <NotFoundState
        title="Operation not found"
        detail="No operation was found for this exact ID."
      />
    ) : (
      <InlineError error={query.error} retry={query.refetch} />
    );
  const operation = query.data;
  const canRetry =
    operation.status === "failed" && operation.type !== "interview";
  const canCancel = !TERMINAL_OPERATION_STATES.has(operation.status);

  return (
    <>
      <AdminPageHeader
        title={humanize(operation.type)}
        purpose={`Operation ${operation.id}`}
        back={{ href: "/admin/operations", label: "Operations" }}
      />
      <div className="admin-detail-grid">
        <AdminPanelSection title="Lifecycle">
          <dl className="admin-definition-list">
            <Definition
              label="Status"
              value={<StatusBadge status={operation.status} />}
            />
            <Definition
              label="User"
              value={
                <Link to={`/admin/users/${operation.user_id}`}>
                  <CopyableId value={operation.user_id} />
                </Link>
              }
            />
            <Definition
              label="Created"
              value={<Timestamp value={operation.created_at} />}
            />
            <Definition
              label="Completed"
              value={
                operation.completed_at ? (
                  <Timestamp value={operation.completed_at} />
                ) : (
                  "Not completed"
                )
              }
            />
            <Definition
              label="Failure reason"
              value={operation.failure_reason || "None"}
            />
          </dl>
        </AdminPanelSection>
        <AdminPanelSection title="Recovery actions">
          <p>
            Only lifecycle metadata is available. Request payloads and private
            content are never exposed.
          </p>
          <div className="admin-action-stack">
            <button
              type="button"
              disabled={!canRetry || retry.isPending}
              onClick={() => confirmAction("retry")}
            >
              Retry operation
            </button>
            <button
              className="admin-danger-button"
              type="button"
              disabled={!canCancel || cancel.isPending}
              onClick={() => confirmAction("cancel")}
            >
              Cancel operation
            </button>
          </div>
          {!canRetry ? (
            <small>
              Retry is available only for failed writing-generation and
              opportunity-import operations.
            </small>
          ) : null}
          {retry.isError ? <InlineError error={retry.error} /> : null}
          {cancel.isError ? <InlineError error={cancel.error} /> : null}
        </AdminPanelSection>
      </div>
    </>
  );
}

function FeatureFlagsPage() {
  const requestText = usePromptDialog();
  const queryClient = useQueryClient();
  const flags = useQuery({
    queryKey: ["admin", "feature-flags"],
    queryFn: ({ signal }) => adminApi.flags(signal),
    ...ADMIN_QUERY,
  });
  const update = useMutation({
    mutationFn: ({
      key,
      body,
    }: {
      key: string;
      body: Parameters<typeof adminApi.updateFlag>[1];
    }) => adminApi.updateFlag(key, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["admin", "feature-flags"],
      });
      void queryClient.invalidateQueries({ queryKey: ["admin", "audit"] });
      void queryClient.invalidateQueries({
        queryKey: ["admin", "launch-readiness"],
      });
    },
  });

  async function save(
    flag: FeatureFlagSummary,
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const body = {
      enabled: data.get("enabled") === "on",
      rollout_percentage: Number(data.get("rollout")),
      cohorts: String(data.get("cohorts") ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
        .slice(0, 100),
      kill_switch: data.get("kill_switch") === "on",
      reason: String(data.get("reason") ?? "").trim(),
    };
    if (
      !Number.isInteger(body.rollout_percentage) ||
      body.rollout_percentage < 0 ||
      body.rollout_percentage > 100 ||
      body.reason.length < 3
    )
      return;
    if (body.kill_switch !== flag.kill_switch) {
      const typed = await requestText({
        title: body.kill_switch ? "Enable kill switch" : "Disable kill switch",
        label: `Type ${flag.key}`,
        description: `Before: ${flag.kill_switch ? "kill switch active" : "kill switch inactive"}. After: ${body.kill_switch ? "kill switch active; enabled and rollout settings will be overridden" : "kill switch inactive"}.`,
        required: true,
        submitLabel: "Confirm change",
      });
      if (typed !== flag.key) return;
    }
    update.mutate({ key: flag.key, body });
  }

  return (
    <>
      <AdminPageHeader
        title="Feature flags"
        purpose="Manage complete rollout configurations and emergency kill switches with audited reasons."
      />
      <p className="admin-notice">
        <ShieldAlert aria-hidden="true" /> A kill switch takes precedence over
        enabled and rollout settings.
      </p>
      <AdminPanelSection title="Runtime configuration">
        {flags.isPending ? (
          <PanelSkeleton rows={5} />
        ) : flags.isError ? (
          <InlineError error={flags.error} retry={flags.refetch} />
        ) : flags.data.length ? (
          <div className="admin-flag-rows">
            {flags.data.map((flag) => (
              <form
                key={`${flag.key}-${flag.updated_at}`}
                onSubmit={(event) => save(flag, event)}
              >
                <div className="admin-flag-title">
                  <strong>{flag.key}</strong>
                  <StatusBadge
                    status={
                      flag.kill_switch
                        ? "failed"
                        : flag.enabled
                          ? "active"
                          : "inactive"
                    }
                    label={
                      flag.kill_switch
                        ? "Kill switch active"
                        : flag.enabled
                          ? "Enabled"
                          : "Disabled"
                    }
                  />
                  <Timestamp value={flag.updated_at} />
                </div>
                <label>
                  <input
                    name="enabled"
                    type="checkbox"
                    defaultChecked={flag.enabled}
                  />{" "}
                  Enabled
                </label>
                <label>
                  Rollout percentage
                  <input
                    name="rollout"
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    defaultValue={flag.rollout_percentage}
                    required
                  />
                </label>
                <label>
                  Cohorts
                  <input
                    name="cohorts"
                    defaultValue={flag.cohorts.join(", ")}
                  />
                </label>
                <label>
                  <input
                    name="kill_switch"
                    type="checkbox"
                    defaultChecked={flag.kill_switch}
                  />{" "}
                  Kill switch
                </label>
                <label>
                  Reason
                  <input
                    name="reason"
                    minLength={3}
                    maxLength={1000}
                    required
                  />
                </label>
                <button type="submit" disabled={update.isPending}>
                  Review and save
                </button>
              </form>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No feature flags"
            detail="The backend returned no runtime flags."
          />
        )}
        {update.isError ? <InlineError error={update.error} /> : null}
      </AdminPanelSection>
    </>
  );
}

function CatalogueModerationPage() {
  const requestText = usePromptDialog();
  const queryClient = useQueryClient();
  const cursor = useAdminCursor();
  const kind = (cursor.params.get("kind") ?? "institution") as CatalogueKind;
  const query = useQuery({
    queryKey: ["admin", "catalogue", kind, cursor.cursor],
    queryFn: ({ signal }) =>
      adminApi.catalogue(kind, { cursor: cursor.cursor, limit: 25, signal }),
    placeholderData: (previous) => previous,
    ...ADMIN_QUERY,
  });
  const mutation = useMutation({
    mutationFn: async ({
      action,
      item,
      reason,
      targetId,
    }: {
      action: "approve" | "reject" | "merge";
      item: CatalogueModerationItem;
      reason?: string;
      targetId?: string;
    }) => {
      if (action === "approve") return adminApi.approveCatalogue(kind, item.id);
      if (action === "reject")
        return adminApi.rejectCatalogue(kind, item.id, reason!);
      return adminApi.mergeCatalogue(kind, item.id, {
        target_id: targetId!,
        reason: reason!,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["admin", "catalogue", kind],
      });
      void queryClient.invalidateQueries({ queryKey: ["admin", "audit"] });
    },
  });

  async function act(
    action: "approve" | "reject" | "merge",
    item: CatalogueModerationItem,
  ) {
    if (action === "approve") {
      const typed = await requestText({
        title: "Approve catalogue record",
        label: `Type ${item.name}`,
        description: `Approve ${item.id} and promote it to canonical state.`,
        required: true,
        submitLabel: "Approve record",
      });
      if (typed === item.name) mutation.mutate({ action, item });
      return;
    }
    let targetId: string | undefined;
    if (action === "merge") {
      targetId =
        (await requestText({
          title: "Choose canonical target",
          label: "Canonical target UUID",
          description:
            "Use the canonical catalogue search before entering a target. Source and target IDs must differ.",
          required: true,
          submitLabel: "Continue",
        })) ?? undefined;
      if (!targetId || !UUID_PATTERN.test(targetId) || targetId === item.id)
        return;
    }
    const reason = await requestText({
      title:
        action === "merge"
          ? "Merge catalogue record"
          : "Reject catalogue record",
      label: "Reason",
      description:
        action === "merge"
          ? `Source ${item.id} will be archived and dependants reassigned to ${targetId}.`
          : "The record will leave the pending queue only after server confirmation.",
      required: true,
      multiline: true,
      submitLabel: "Continue",
    });
    if (!reason || reason.trim().length < 3) return;
    const typed = await requestText({
      title: "Confirm high-risk moderation action",
      label: `Type ${item.name}`,
      required: true,
      submitLabel: action === "merge" ? "Merge record" : "Reject record",
    });
    if (typed === item.name)
      mutation.mutate({ action, item, reason, targetId });
  }

  return (
    <>
      <AdminPageHeader
        title="Catalogue moderation"
        purpose="Review community-submitted records without exposing unrelated private catalogue data."
        actions={<CanonicalLookup kind={kind} />}
      />
      <nav className="admin-tabs" aria-label="Catalogue kind">
        {(["institution", "programme", "scholarship"] as const).map((value) => (
          <button
            key={value}
            className={kind === value ? "active" : ""}
            onClick={() => cursor.setFilter("kind", value)}
          >
            {humanize(value)}
          </button>
        ))}
      </nav>
      <AdminPanelSection title={`Pending ${kind} records`}>
        {query.isPending ? (
          <PanelSkeleton rows={5} />
        ) : query.isError ? (
          <InlineError error={query.error} retry={query.refetch} />
        ) : query.data.items.length ? (
          <>
            <div className="admin-table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Submitted by</th>
                    <th>Source</th>
                    <th>Created</th>
                    <th>Verified</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.name}</strong>
                        <small>{item.id}</small>
                      </td>
                      <td>
                        {item.created_by_user_id ? (
                          <Link to={`/admin/users/${item.created_by_user_id}`}>
                            <CopyableId value={item.created_by_user_id} />
                          </Link>
                        ) : (
                          "System"
                        )}
                      </td>
                      <td>
                        {item.source_url ? (
                          <SafeExternalLink href={item.source_url} />
                        ) : (
                          "Not provided"
                        )}
                      </td>
                      <td>
                        {item.created_at ? (
                          <Timestamp value={item.created_at} />
                        ) : (
                          "Not provided"
                        )}
                      </td>
                      <td>
                        {item.last_verified_at ? (
                          <Timestamp value={item.last_verified_at} />
                        ) : (
                          "Not verified"
                        )}
                      </td>
                      <td>
                        <div className="admin-row-actions">
                          <button onClick={() => act("approve", item)}>
                            Approve
                          </button>
                          <button onClick={() => act("reject", item)}>
                            Reject
                          </button>
                          <button
                            className="admin-danger-button"
                            onClick={() => act("merge", item)}
                          >
                            Merge
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <CursorPagination page={query.data} cursor={cursor} />
          </>
        ) : (
          <EmptyState
            title="No pending records"
            detail={`No pending ${kind} records were returned.`}
          />
        )}
        {mutation.isError ? <InlineError error={mutation.error} /> : null}
      </AdminPanelSection>
    </>
  );
}

function CanonicalLookup({ kind }: { kind: CatalogueKind }) {
  const [search, setSearch] = useState("");
  const query = useQuery({
    queryKey: ["admin", "canonical-targets", kind, search],
    queryFn: async ({ signal }) => {
      const filters = {
        search,
        limit: 25,
        verified: kind === "programme" ? undefined : true,
      };
      const response =
        kind === "institution"
          ? await catalogueApi.institutions(filters, signal)
          : kind === "programme"
            ? await catalogueApi.programmes(filters, signal)
            : await catalogueApi.scholarships(filters, signal);
      return response.items.filter((item) => {
        const value = item as unknown as Record<string, unknown>;
        return (
          item.created_by_user_id === null && value.visibility === "canonical"
        );
      });
    },
    enabled: search.trim().length >= 2,
    ...ADMIN_QUERY,
  });
  return (
    <details className="admin-canonical-lookup">
      <summary>Find canonical target</summary>
      <label>
        Search canonical {kind}s
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>
      {query.data?.length ? (
        <ul>
          {query.data.map((item) => (
            <li key={item.id}>
              <strong>{item.name}</strong>
              <CopyableId value={item.id} />
            </li>
          ))}
        </ul>
      ) : search.length >= 2 && !query.isPending ? (
        <small>No canonical targets returned.</small>
      ) : null}
    </details>
  );
}

function ReferenceEventsPage() {
  const cursor = useAdminCursor();
  const requestId = cursor.params.get("requestId") ?? "";
  const [value, setValue] = useState(requestId);
  const valid = UUID_PATTERN.test(requestId);
  const query = useQuery({
    queryKey: ["admin", "reference-events", requestId, cursor.cursor],
    queryFn: ({ signal }) =>
      adminApi.referenceEvents(requestId, {
        cursor: cursor.cursor,
        limit: 50,
        signal,
      }),
    enabled: valid,
    placeholderData: (previous) => previous,
    ...ADMIN_QUERY,
  });
  return (
    <>
      <AdminPageHeader
        title="Reference event lookup"
        purpose="Inspect redacted lifecycle events by exact request ID. Confidential reference content is never requested."
      />
      <form
        className="admin-lookup-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (UUID_PATTERN.test(value)) cursor.setFilter("requestId", value);
        }}
      >
        <label>
          Exact reference request UUID
          <input
            value={value}
            onChange={(event) => setValue(event.target.value.trim())}
            required
          />
        </label>
        <button type="submit">Load event history</button>
      </form>
      {!requestId ? (
        <EmptyState
          title="Enter a request ID"
          detail="This lookup does not search by person or email."
        />
      ) : !valid ? (
        <InlineNotice tone="danger">
          Enter a valid reference request UUID.
        </InlineNotice>
      ) : (
        <AdminPanelSection title="Redacted event history">
          {query.isPending ? (
            <PanelSkeleton />
          ) : query.isError ? (
            query.error instanceof ApiError && query.error.status === 404 ? (
              <EmptyState
                title="No event history found"
                detail="This does not imply that a person or email exists."
              />
            ) : (
              <InlineError error={query.error} retry={query.refetch} />
            )
          ) : query.data.items.length ? (
            <>
              <ol className="admin-timeline">
                {query.data.items.map((event) => (
                  <li key={event.id}>
                    <span aria-hidden="true">
                      <FileClock />
                    </span>
                    <div>
                      <header>
                        <strong>{humanize(event.event_type)}</strong>
                        <Timestamp value={event.created_at} />
                      </header>
                      <CopyableId value={event.id} />
                      <SafeJsonViewer value={event.event_metadata} />
                    </div>
                  </li>
                ))}
              </ol>
              <CursorPagination page={query.data} cursor={cursor} />
            </>
          ) : (
            <EmptyState
              title="No event history"
              detail="The backend returned an empty redacted event history."
            />
          )}
        </AdminPanelSection>
      )}
    </>
  );
}

function QueuesPage() {
  const requestText = usePromptDialog();
  const queryClient = useQueryClient();
  const [queue, setQueue] = useState<(typeof QUEUES)[number]>(QUEUES[0]);
  const [maxMessages, setMaxMessages] = useState(10);
  const [reason, setReason] = useState("");
  const redrive = useMutation({
    mutationFn: () => adminApi.redrive(queue, maxMessages, reason.trim()),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ["admin", "audit"] }),
  });
  const reminders = useMutation({
    mutationFn: adminApi.runDueReminders,
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ["admin", "audit"] }),
  });

  async function submitRedrive(event: FormEvent) {
    event.preventDefault();
    if (
      !Number.isInteger(maxMessages) ||
      maxMessages < 1 ||
      maxMessages > 100 ||
      reason.trim().length < 3
    )
      return;
    const typed = await requestText({
      title: "Redrive dead-letter messages",
      label: `Type ${queue}`,
      description: `Move up to ${maxMessages} messages from this queue's DLQ back to its source queue. Message bodies remain hidden.`,
      required: true,
      submitLabel: "Redrive messages",
    });
    if (typed === queue) redrive.mutate();
  }

  async function runReminders() {
    const typed = await requestText({
      title: "Dispatch due reminders",
      label: "Type DISPATCH",
      description:
        "Only due, unsent reminders are dispatched. Already-sent reminders are not repeated.",
      required: true,
      submitLabel: "Dispatch due reminders",
    });
    if (typed === "DISPATCH") reminders.mutate();
  }

  return (
    <>
      <AdminPageHeader
        title="Queues and reminders"
        purpose="Run allowlisted operational recovery actions without browsing queue depth, raw messages or message bodies."
      />
      <div className="admin-detail-grid">
        <AdminPanelSection title="Dead-letter queue redrive">
          <form className="admin-form" onSubmit={submitRedrive}>
            <label>
              Allowlisted queue
              <select
                value={queue}
                onChange={(event) =>
                  setQueue(event.target.value as typeof queue)
                }
              >
                {QUEUES.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label>
              Maximum messages
              <input
                type="number"
                min="1"
                max="100"
                step="1"
                value={maxMessages}
                onChange={(event) => setMaxMessages(Number(event.target.value))}
              />
            </label>
            <label>
              Operational reason
              <textarea
                minLength={3}
                maxLength={1000}
                required
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
            </label>
            {maxMessages === 100 ? (
              <InlineNotice tone="warning">
                100 messages is the maximum and should be used only during a
                controlled recovery.
              </InlineNotice>
            ) : null}
            <button
              className="admin-danger-button"
              disabled={redrive.isPending}
            >
              Review redrive
            </button>
          </form>
          {redrive.data ? (
            <p className="admin-success" role="status">
              {redrive.data.redriven_count} messages were redriven for{" "}
              {redrive.data.queue}.
            </p>
          ) : null}
          {redrive.isError ? <InlineError error={redrive.error} /> : null}
        </AdminPanelSection>
        <AdminPanelSection title="Due reminder dispatch">
          <p>
            Manual fallback for the due-reminder worker. The browser never
            schedules or repeats this request automatically.
          </p>
          <button
            className="admin-danger-button"
            type="button"
            disabled={reminders.isPending}
            onClick={runReminders}
          >
            {reminders.isPending ? "Dispatching…" : "Run due reminders"}
          </button>
          {reminders.data ? (
            <p className="admin-success" role="status">
              {reminders.data.dispatched} due reminders were dispatched.
            </p>
          ) : null}
          {reminders.isError ? <InlineError error={reminders.error} /> : null}
        </AdminPanelSection>
      </div>
    </>
  );
}

function LaunchReadinessPage() {
  const queryClient = useQueryClient();
  const readiness = useQuery({
    queryKey: ["admin", "launch-readiness"],
    queryFn: ({ signal }) => adminApi.readiness(signal),
    ...ADMIN_QUERY,
  });
  const gates = useQuery({
    queryKey: ["admin", "launch-gates"],
    queryFn: ({ signal }) => adminApi.gates(signal),
    ...ADMIN_QUERY,
  });
  const update = useMutation({
    mutationFn: ({
      key,
      body,
    }: {
      key: string;
      body: Parameters<typeof adminApi.updateGate>[1];
    }) => adminApi.updateGate(key, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["admin", "launch-gates"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["admin", "launch-readiness"],
      });
      void queryClient.invalidateQueries({ queryKey: ["admin", "audit"] });
    },
  });

  function save(gate: LaunchGate, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const status = String(data.get("status")) as LaunchGate["status"];
    const evidence_reference =
      String(data.get("evidence") ?? "").trim() || null;
    const notes = String(data.get("notes") ?? "").trim() || null;
    if (status === "passed" && !evidence_reference) return;
    if ((status === "failed" || status === "waived") && !notes) return;
    if (
      (status === "passed" || status === "waived") &&
      !confirm(`Move ${humanize(gate.key)} to ${status}?`)
    )
      return;
    update.mutate({
      key: gate.key,
      body: { status, evidence_reference, notes },
    });
  }

  return (
    <>
      <AdminPageHeader
        title="Launch readiness"
        purpose="Manage server-owned launch gates and rely only on the backend readiness decision."
      />
      {readiness.isPending ? (
        <PanelSkeleton />
      ) : readiness.isError ? (
        <InlineError error={readiness.error} retry={readiness.refetch} />
      ) : (
        <section
          className={`admin-readiness-banner ${readiness.data.ready ? "ready" : "blocked"}`}
        >
          {readiness.data.ready ? <CheckCircle2 /> : <ShieldAlert />}
          <div>
            <h2>
              {readiness.data.ready
                ? "Ready for production launch"
                : "Not ready for production launch"}
            </h2>
            <p>
              {readiness.data.passed} of {readiness.data.total} gates passed.{" "}
              {readiness.data.blocking_gates.length} blocking.
            </p>
          </div>
        </section>
      )}
      <AdminPanelSection title="Launch gates">
        {gates.isPending ? (
          <PanelSkeleton rows={8} />
        ) : gates.isError ? (
          <InlineError error={gates.error} retry={gates.refetch} />
        ) : gates.data.length ? (
          <div className="admin-gate-list">
            {gates.data.map((gate) => (
              <form
                key={`${gate.key}-${gate.verified_at}`}
                onSubmit={(event) => save(gate, event)}
              >
                <header>
                  <div>
                    <strong>{humanize(gate.key)}</strong>
                    <small>{gate.key}</small>
                  </div>
                  <StatusBadge status={gate.status} />
                </header>
                <label>
                  Status
                  <select name="status" defaultValue={gate.status}>
                    <option value="pending">Pending</option>
                    <option value="passed">Passed</option>
                    <option value="failed">Failed</option>
                    <option value="waived">Waived</option>
                  </select>
                </label>
                <label>
                  Evidence reference
                  <input
                    name="evidence"
                    maxLength={1000}
                    defaultValue={gate.evidence_reference ?? ""}
                  />
                </label>
                <label>
                  Notes
                  <textarea
                    name="notes"
                    maxLength={5000}
                    defaultValue={gate.notes ?? ""}
                  />
                </label>
                <div>
                  <small>
                    {gate.verified_by ? (
                      <>
                        Verified by <CopyableId value={gate.verified_by} />{" "}
                        {gate.verified_at ? (
                          <Timestamp value={gate.verified_at} />
                        ) : null}
                      </>
                    ) : (
                      "Not verified"
                    )}
                  </small>
                  <button disabled={update.isPending}>Review and update</button>
                </div>
              </form>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No launch gates"
            detail="The backend returned no launch-gate definitions."
          />
        )}
        {update.isError ? <InlineError error={update.error} /> : null}
      </AdminPanelSection>
    </>
  );
}

function AuditLogPage() {
  const cursor = useAdminCursor();
  const filters = {
    adminUserId: cursor.params.get("admin_user_id") ?? "",
    action: cursor.params.get("action") ?? "",
    targetType: cursor.params.get("target_type") ?? "",
    targetId: cursor.params.get("target_id") ?? "",
  };
  const query = useQuery({
    queryKey: ["admin", "audit", filters, cursor.cursor],
    queryFn: ({ signal }) =>
      adminApi.audit({
        adminUserId: filters.adminUserId || undefined,
        action: filters.action || undefined,
        targetType: filters.targetType || undefined,
        targetId: filters.targetId || undefined,
        cursor: cursor.cursor,
        limit: 50,
        signal,
      }),
    placeholderData: (previous) => previous,
    ...ADMIN_QUERY,
  });
  return (
    <>
      <AdminPageHeader
        title="Audit log"
        purpose="Review the immutable administrative trail. Audit entries cannot be edited or deleted."
      />
      <FilterBar>
        <label>
          Administrator UUID
          <input
            value={filters.adminUserId}
            onChange={(event) =>
              cursor.setFilter("admin_user_id", event.target.value)
            }
          />
        </label>
        <label>
          Exact action
          <input
            value={filters.action}
            onChange={(event) => cursor.setFilter("action", event.target.value)}
          />
        </label>
        <label>
          Target type
          <input
            value={filters.targetType}
            onChange={(event) =>
              cursor.setFilter("target_type", event.target.value)
            }
          />
        </label>
        <label>
          Target ID
          <input
            value={filters.targetId}
            onChange={(event) =>
              cursor.setFilter("target_id", event.target.value)
            }
          />
        </label>
      </FilterBar>
      <AdminPanelSection title="Administrative actions">
        {query.isPending ? (
          <PanelSkeleton rows={7} />
        ) : query.isError ? (
          <InlineError error={query.error} retry={query.refetch} />
        ) : query.data.items.length ? (
          <>
            <div className="admin-table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Administrator</th>
                    <th>Action</th>
                    <th>Target</th>
                    <th>Reason</th>
                    <th>Metadata</th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <Timestamp value={item.created_at} />
                      </td>
                      <td>
                        <CopyableId value={item.admin_user_id} />
                      </td>
                      <td>{humanize(item.action)}</td>
                      <td>
                        {item.target_type}
                        <br />
                        {item.target_type === "user" ? (
                          <Link to={`/admin/users/${item.target_id}`}>
                            <CopyableId value={item.target_id} />
                          </Link>
                        ) : (
                          <CopyableId value={item.target_id} />
                        )}
                      </td>
                      <td>{item.reason}</td>
                      <td>
                        <details>
                          <summary>View safe metadata</summary>
                          <SafeJsonViewer value={item.metadata_safe} />
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <CursorPagination page={query.data} cursor={cursor} />
          </>
        ) : (
          <EmptyState
            title="No audit entries match"
            detail="Change the exact backend filters."
          />
        )}
      </AdminPanelSection>
    </>
  );
}

function AdminPageHeader({
  title,
  purpose,
  actions,
  back,
}: {
  title: string;
  purpose: string;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <header className="admin-page-header">
      <nav aria-label="Breadcrumb">
        <Link to="/admin">Admin</Link>
        <ChevronRight aria-hidden="true" />
        {back ? <Link to={back.href}>{back.label}</Link> : null}
        {back ? <ChevronRight aria-hidden="true" /> : null}
        <span>{title}</span>
      </nav>
      <div>
        <div>
          <h1>{title}</h1>
          <p>{purpose}</p>
        </div>
        {actions ? <div className="admin-page-actions">{actions}</div> : null}
      </div>
    </header>
  );
}

function AdminPanelSection({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="admin-panel">
      <header>
        <h2>{title}</h2>
        {action}
      </header>
      <div className="admin-panel-body">{children}</div>
    </section>
  );
}

function FilterBar({ children }: { children: ReactNode }) {
  return <div className="admin-filter-bar">{children}</div>;
}

function StatusBadge({ status, label }: { status: string; label?: string }) {
  const value = status.toLowerCase();
  const success = [
    "active",
    "passed",
    "succeeded",
    "completed",
    "ready",
  ].includes(value);
  const danger = [
    "failed",
    "inactive",
    "cancelled",
    "canceled",
    "blocked",
  ].includes(value);
  const warning = ["warning", "waived", "pending"].includes(value);
  const Icon = success
    ? CheckCircle2
    : danger
      ? XCircle
      : warning
        ? AlertTriangle
        : FileClock;
  return (
    <span
      className={`admin-status ${success ? "success" : danger ? "danger" : warning ? "warning" : "neutral"}`}
    >
      <Icon aria-hidden="true" /> {label ?? humanize(status)}
    </span>
  );
}

function Timestamp({ value }: { value: string }) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return <span>{value}</span>;
  return (
    <time dateTime={value} title={date.toISOString()}>
      {new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date)}
    </time>
  );
}

function CopyableId({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="admin-copy-id"
      type="button"
      title={value}
      aria-label={`Copy ID ${value}`}
      onClick={() => {
        void navigator.clipboard.writeText(value);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      }}
    >
      <code>{shortId(value)}</code>
      <span className="sr-only" role="status">
        {copied ? "Copied" : ""}
      </span>
    </button>
  );
}

function SafeJsonViewer({ value }: { value: unknown }) {
  return (
    <pre className="admin-safe-json">
      {JSON.stringify(sanitizeMetadata(value), null, 2)}
    </pre>
  );
}

function InlineError({
  error,
  retry,
  compact = false,
}: {
  error: Error;
  retry?: () => unknown;
  compact?: boolean;
}) {
  const apiError = error instanceof ApiError ? error : null;
  return (
    <div className={`admin-error${compact ? " compact" : ""}`} role="alert">
      <AlertTriangle aria-hidden="true" />
      <div>
        <strong>
          {apiError?.status === 409
            ? "State changed on the server"
            : "Request could not be completed"}
        </strong>
        <p>{error.message}</p>
        {apiError?.fields.map((field) => (
          <small key={`${field.field}-${field.message}`}>
            {field.field}: {field.message}
          </small>
        ))}
        {apiError?.correlationId ? (
          <div>
            Support reference <CopyableId value={apiError.correlationId} />
          </div>
        ) : null}
      </div>
      {retry ? (
        <button type="button" onClick={() => retry()}>
          Try again
        </button>
      ) : null}
    </div>
  );
}

function InlineNotice({
  tone,
  children,
}: {
  tone: "warning" | "danger";
  children: ReactNode;
}) {
  return (
    <p className={`admin-notice ${tone}`} role="status">
      <AlertTriangle aria-hidden="true" />
      {children}
    </p>
  );
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="admin-empty">
      <Database aria-hidden="true" />
      <div>
        <strong>{title}</strong>
        <p>{detail}</p>
      </div>
    </div>
  );
}

function Definition({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function SummaryValue({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function CursorPagination<T>({
  page,
  cursor,
}: {
  page: CursorPage<T>;
  cursor: ReturnType<typeof useAdminCursor>;
}) {
  return (
    <nav className="admin-pagination" aria-label="Cursor pagination">
      <button
        type="button"
        onClick={cursor.previous}
        disabled={!cursor.canPrevious}
      >
        <ArrowLeft aria-hidden="true" /> Previous
      </button>
      <span>
        {page.total === null
          ? "Server cursor page"
          : `${formatNumber(page.total)} total`}
      </span>
      <button
        type="button"
        onClick={() => page.next_cursor && cursor.next(page.next_cursor)}
        disabled={!page.has_more || !page.next_cursor}
      >
        Next <ArrowRight aria-hidden="true" />
      </button>
    </nav>
  );
}

function AuditTimeline({ items }: { items: AdminAction[] }) {
  return (
    <ol className="admin-timeline">
      {items.map((item) => (
        <li key={item.id}>
          <span aria-hidden="true">
            <FileClock />
          </span>
          <div>
            <header>
              <strong>{humanize(item.action)}</strong>
              <Timestamp value={item.created_at} />
            </header>
            <p>{item.reason}</p>
            <small>
              {item.target_type} · <CopyableId value={item.target_id} />
            </small>
            <SafeJsonViewer value={item.metadata_safe} />
          </div>
        </li>
      ))}
    </ol>
  );
}

function SafeExternalLink({ href }: { href: string }) {
  try {
    const url = new URL(href);
    if (!["http:", "https:"].includes(url.protocol))
      return <span>Unsupported URL</span>;
    return (
      <a href={url.href} target="_blank" rel="noopener noreferrer">
        {url.hostname}
      </a>
    );
  } catch {
    return <span>Invalid URL</span>;
  }
}

function PanelSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="admin-panel-skeleton" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, index) => (
        <i key={index} />
      ))}
    </div>
  );
}

function AdminSkeleton({ label }: { label: string }) {
  return (
    <main className="admin-entry-skeleton" aria-busy="true">
      <p role="status">{label}</p>
      <div />
      <div />
      <div />
    </main>
  );
}

function ForbiddenPage() {
  return (
    <main className="admin-state-page">
      <ShieldAlert aria-hidden="true" />
      <h1>Administrator access required</h1>
      <p>
        Your account is authenticated but is not authorized to open this
        operational console.
      </p>
      <Link to="/app/dashboard">Return to application workspace</Link>
    </main>
  );
}

function AdminEntryError({
  error,
  retry,
}: {
  error: Error;
  retry: () => unknown;
}) {
  return (
    <main className="admin-state-page">
      <ShieldAlert aria-hidden="true" />
      <h1>Unable to verify administrator access</h1>
      <InlineError error={error} retry={retry} />
    </main>
  );
}

function NotFoundState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="admin-state-inline">
      <Search aria-hidden="true" />
      <h1>{title}</h1>
      <p>{detail}</p>
      <Link to="/admin">Return to admin overview</Link>
    </div>
  );
}

function AdminNotFound() {
  return (
    <NotFoundState
      title="Admin page not found"
      detail="This operational route does not exist."
    />
  );
}

function useAdminCursor() {
  const [params, setParams] = useSearchParams();
  const [history, setHistory] = useState<(string | null)[]>([]);
  const cursor = params.get("cursor");
  const setCursor = (value: string | null) => {
    const next = new URLSearchParams(params);
    value ? next.set("cursor", value) : next.delete("cursor");
    setParams(next, { replace: true });
  };
  return {
    params,
    cursor,
    canPrevious: history.length > 0,
    next(value: string) {
      setHistory((current) => [...current, cursor]);
      setCursor(value);
    },
    previous() {
      const value = history.at(-1) ?? null;
      setHistory((current) => current.slice(0, -1));
      setCursor(value);
    },
    setFilter(key: string, value: string) {
      const next = new URLSearchParams(params);
      value ? next.set(key, value) : next.delete(key);
      next.delete("cursor");
      setHistory([]);
      setParams(next, { replace: true });
    },
  };
}

function sanitizeMetadata(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeMetadata);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(
        ([key]) =>
          !/(token|secret|password|storage_key|signed_url|payload|content|prompt|essay|transcript|access_code)/i.test(
            key,
          ),
      )
      .map(([key, item]) => [key, sanitizeMetadata(item)]),
  );
}

function humanize(value: string) {
  return value
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function shortId(value: string) {
  return value.length > 18 ? `${value.slice(0, 8)}…${value.slice(-6)}` : value;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat().format(value);
}

function formatUsd(value: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(value);
}
