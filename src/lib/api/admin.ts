import { apiRequest } from "./client";

export type CursorPage<T> = {
  items: T[];
  next_cursor: string | null;
  has_more: boolean;
  total: number | null;
};

export type UserSearchResult = {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
  last_login_at: string | null;
};

export type FeatureFlagSummary = {
  key: string;
  enabled: boolean;
  rollout_percentage: number;
  cohorts: string[];
  kill_switch: boolean;
  updated_at: string;
};

export type OperationType =
  | "writing_generation"
  | "opportunity_import"
  | "interview";

export type OperationSummary = {
  id: string;
  type: OperationType;
  status: string;
  user_id: string;
  created_at: string;
};

export type OperationDetail = OperationSummary & {
  completed_at: string | null;
  failure_reason: string | null;
};

export type EntitlementResponse = {
  plan_key: string;
  plan_name: "free" | "pro" | "teams";
  plan_label: string;
  subscription_status: string;
  is_active: boolean;
  cancel_at_period_end: boolean;
  current_period_end: string | null;
  trial_end: string | null;
  ai_tokens_used: number;
  ai_tokens_limit: number;
  ai_tokens_reset_at: string;
  purchased_tokens_remaining: number;
};

export type UsageLog = {
  id: string;
  task_type: string;
  model_id: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  metered_tokens: number;
  cost_usd: number;
  created_at: string;
};

export type UsageResponse = {
  period: string;
  summary: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    metered_tokens: number;
    cost_usd: number;
    request_count: number;
  };
  logs: CursorPage<UsageLog>;
};

export type AdminAction = {
  id: string;
  admin_user_id: string;
  action: string;
  target_type: string;
  target_id: string;
  reason: string;
  metadata_safe: Record<string, unknown>;
  created_at: string;
};

export type CatalogueKind = "institution" | "programme" | "scholarship";

export type CatalogueModerationItem = {
  id: string;
  kind: CatalogueKind;
  name: string;
  created_by_user_id: string | null;
  source_url: string | null;
  last_verified_at: string | null;
  created_at: string | null;
};

export type ReferenceEvent = {
  id: string;
  event_type: string;
  event_metadata: Record<string, unknown>;
  created_at: string;
};

export type LaunchGate = {
  key: string;
  status: "pending" | "passed" | "failed" | "waived";
  evidence_reference: string | null;
  verified_by: string | null;
  verified_at: string | null;
  notes: string | null;
};

export type LaunchReadiness = {
  ready: boolean;
  passed: number;
  total: number;
  blocking_gates: string[];
};

type ListOptions = {
  cursor?: string | null;
  limit?: number;
  signal?: AbortSignal;
};

const query = (
  values: Record<string, string | number | boolean | null | undefined>,
) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(values))
    if (value !== undefined && value !== null && value !== "")
      search.set(key, String(value));
  const result = search.toString();
  return result ? `?${result}` : "";
};

const e = encodeURIComponent;

export const adminApi = {
  users: ({
    isActive,
    isAdmin,
    cursor,
    limit = 50,
    signal,
  }: ListOptions & { isActive?: boolean; isAdmin?: boolean } = {}) =>
    apiRequest<CursorPage<UserSearchResult>>(
      `/admin/users${query({
        is_active: isActive,
        is_admin: isAdmin,
        cursor,
        limit,
      })}`,
      { signal },
    ),
  searchUser: (
    mode: "email" | "user_id",
    value: string,
    signal?: AbortSignal,
  ) =>
    apiRequest<UserSearchResult>(
      `/admin/users/search${query({ [mode]: value })}`,
      { signal },
    ),
  user: (id: string, signal?: AbortSignal) =>
    apiRequest<UserSearchResult>(`/admin/users/${e(id)}`, { signal }),
  updateUser: (
    id: string,
    body: { is_active?: boolean; is_admin?: boolean; reason: string },
  ) =>
    apiRequest<UserSearchResult>(`/admin/users/${e(id)}`, {
      method: "PATCH",
      body,
    }),
  entitlement: (id: string, signal?: AbortSignal) =>
    apiRequest<EntitlementResponse>(`/admin/users/${e(id)}/entitlement`, {
      signal,
    }),
  updateEntitlement: (
    id: string,
    body: {
      forced_plan_key?: string | null;
      ai_tokens_limit_override?: number | null;
      reason: string;
    },
  ) =>
    apiRequest<EntitlementResponse>(`/admin/users/${e(id)}/entitlement`, {
      method: "PATCH",
      body,
    }),
  resetUsage: (id: string, reason: string) =>
    apiRequest<void>(`/admin/users/${e(id)}/reset-token-usage`, {
      method: "POST",
      body: { reason },
    }),
  usage: (id: string, { cursor, limit = 50, signal }: ListOptions = {}) =>
    apiRequest<UsageResponse>(
      `/admin/users/${e(id)}/usage-ledger${query({ cursor, limit })}`,
      { signal },
    ),
  operations: ({
    type,
    status,
    cursor,
    limit = 25,
    signal,
  }: ListOptions & { type?: OperationType; status?: string } = {}) =>
    apiRequest<CursorPage<OperationSummary>>(
      `/admin/operations${query({ type, status, cursor, limit })}`,
      { signal },
    ),
  operation: (id: string, signal?: AbortSignal) =>
    apiRequest<OperationDetail>(`/admin/operations/${e(id)}`, { signal }),
  retryOperation: (id: string) =>
    apiRequest<OperationDetail>(`/admin/operations/${e(id)}/retry`, {
      method: "POST",
    }),
  cancelOperation: (id: string) =>
    apiRequest<OperationDetail>(`/admin/operations/${e(id)}/cancel`, {
      method: "POST",
    }),
  flags: (signal?: AbortSignal) =>
    apiRequest<FeatureFlagSummary[]>("/admin/feature-flags", { signal }),
  flag: (key: string, signal?: AbortSignal) =>
    apiRequest<FeatureFlagSummary>(`/admin/feature-flags/${e(key)}`, {
      signal,
    }),
  updateFlag: (
    key: string,
    body: Omit<FeatureFlagSummary, "key" | "updated_at"> & { reason: string },
  ) =>
    apiRequest<FeatureFlagSummary>(`/admin/feature-flags/${e(key)}`, {
      method: "PUT",
      body,
    }),
  catalogue: (
    kind: CatalogueKind,
    { cursor, limit = 25, signal }: ListOptions = {},
  ) =>
    apiRequest<CursorPage<CatalogueModerationItem>>(
      `/admin/catalogue/${kind}/pending${query({ cursor, limit })}`,
      { signal },
    ),
  approveCatalogue: (kind: CatalogueKind, id: string) =>
    apiRequest<CatalogueModerationItem>(
      `/admin/catalogue/${kind}/${e(id)}/approve`,
      { method: "POST" },
    ),
  rejectCatalogue: (kind: CatalogueKind, id: string, reason: string) =>
    apiRequest<void>(`/admin/catalogue/${kind}/${e(id)}/reject`, {
      method: "POST",
      body: { reason },
    }),
  mergeCatalogue: (
    kind: CatalogueKind,
    id: string,
    body: { target_id: string; reason: string },
  ) =>
    apiRequest<CatalogueModerationItem>(
      `/admin/catalogue/${kind}/${e(id)}/merge`,
      { method: "POST", body },
    ),
  referenceEvents: (
    id: string,
    { cursor, limit = 50, signal }: ListOptions = {},
  ) =>
    apiRequest<CursorPage<ReferenceEvent>>(
      `/admin/references/${e(id)}/events${query({ cursor, limit })}`,
      { signal },
    ),
  audit: ({
    adminUserId,
    action,
    targetType,
    targetId,
    cursor,
    limit = 50,
    signal,
  }: ListOptions & {
    adminUserId?: string;
    action?: string;
    targetType?: string;
    targetId?: string;
  } = {}) =>
    apiRequest<CursorPage<AdminAction>>(
      `/admin/audit-log${query({
        admin_user_id: adminUserId,
        action,
        target_type: targetType,
        target_id: targetId,
        cursor,
        limit,
      })}`,
      { signal },
    ),
  redrive: (queue: string, maxMessages: number, reason: string) =>
    apiRequest<{ queue: string; redriven_count: number }>(
      `/admin/queues/${e(queue)}/redrive`,
      {
        method: "POST",
        body: { max_messages: maxMessages, reason },
      },
    ),
  runDueReminders: () =>
    apiRequest<{ dispatched: number }>("/admin/reminders/run-due", {
      method: "POST",
    }),
  gates: (signal?: AbortSignal) =>
    apiRequest<LaunchGate[]>("/admin/launch-gates", { signal }),
  updateGate: (
    key: string,
    body: Pick<LaunchGate, "status" | "evidence_reference" | "notes">,
  ) =>
    apiRequest<LaunchGate>(`/admin/launch-gates/${e(key)}`, {
      method: "PUT",
      body,
    }),
  readiness: (signal?: AbortSignal) =>
    apiRequest<LaunchReadiness>("/admin/launch-readiness", { signal }),
};
