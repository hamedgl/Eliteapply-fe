import { useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ArrowLeft,
  Circle,
  Copy,
  RefreshCw,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import {
  Link,
} from "react-router-dom";
import { collaborationApi } from "../../../lib/api/phase3";
import { queryKeys } from "../../../lib/api/queryKeys";
import { ConfirmationDialog } from "../../../components/actions/ConfirmationDialog";
import { OverflowMenu } from "../../../components/actions/OverflowMenu";
import { EmptyState } from "../../../components/data-display/EmptyState";
import { StatusBadge } from "../../../components/data-display/StatusBadge";
import { Select } from "../../../components/ui/select";
import { WorkspacePageGuideButton } from "../../../components/AppShell";
import {
  formatDate,
  label,
} from "../model";
import type { components } from "../../../generated/api/schema";
import "../../../styles/workspace.css";
import {
  ResourceHeader,
  ResourceRowsSkeleton,
  InlineError,
  readableError,
  WorkspaceDrawer,
  DrawerActions,
  optional,
  selectValue,
  SectionHeading,
} from "./applicationWorkspaceShared";
import { RequirementStateIcon } from "./RequirementsTab";


type S = components["schemas"];

export function CollaboratorsTab({
  applicationId,
  onToast,
}: {
  applicationId: string;
  onToast: (message: string) => void;
}) {
  const qc = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [revokeItem, setRevokeItem] = useState<
    S["CollaboratorResponse"] | null
  >(null);
  const collaborators = useQuery({
    queryKey: queryKeys.collaborators(applicationId),
    queryFn: () => collaborationApi.list(applicationId),
  });
  const capabilities = useQuery({
    queryKey: queryKeys.collaborationCapabilities(applicationId),
    queryFn: () => collaborationApi.capabilities(applicationId),
    retry: false,
  });
  const refresh = () =>
    qc.invalidateQueries({ queryKey: queryKeys.collaborators(applicationId) });
  const invite = useMutation({
    mutationFn: (body: S["CollaboratorInvite"]) =>
      collaborationApi.invite(applicationId, body),
    onSuccess: async () => {
      setInviteOpen(false);
      onToast("Collaborator invited.");
      await refresh();
    },
  });
  const update = useMutation({
    mutationFn: ({
      item,
      role,
    }: {
      item: S["CollaboratorResponse"];
      role: S["CollaboratorUpdate"]["role"];
    }) => collaborationApi.update(applicationId, item.id, { role }),
    onSuccess: async () => {
      onToast("Collaborator role updated.");
      await refresh();
    },
  });
  const revoke = useMutation({
    mutationFn: (item: S["CollaboratorResponse"]) =>
      collaborationApi.remove(applicationId, item.id),
    onSuccess: async () => {
      setRevokeItem(null);
      onToast("Collaborator access revoked.");
      await refresh();
    },
  });
  const resend = useMutation({
    mutationFn: (item: S["CollaboratorResponse"]) =>
      collaborationApi.resend(applicationId, item.id),
    onSuccess: async () => {
      onToast("Invitation resent.");
      await refresh();
    },
  });
  const copyInvitation = useMutation({
    mutationFn: (item: S["CollaboratorResponse"]) =>
      collaborationApi.invitationLink(applicationId, item.id),
    onSuccess: async (value) => {
      await navigator.clipboard.writeText(value.invitation_url);
      onToast("A refreshed invitation link was copied.");
      await refresh();
    },
  });
  const canManage = capabilities.data?.actions.invite_collaborators === true;
  const roleOptions = capabilities.data?.supported_roles ?? [];
  const collaboratorItems = Array.isArray(collaborators.data)
    ? collaborators.data
    : [];
  const active = collaboratorItems.filter((item) => item.status === "active");
  const pending = collaboratorItems.filter(
    (item) => item.status !== "active" && item.status !== "revoked",
  );
  const error =
    invite.error ||
    update.error ||
    revoke.error ||
    resend.error ||
    copyInvitation.error;
  return (
    <section className="detail-section detail-resource-section collaborators-workspace">
      <ResourceHeader
        title="Collaborators"
        description="Collaborators only receive the access permitted by their role."
        actions={
          <div className="detail-collaborator-actions">
            <StatusBadge tone="blue">
              Your role:{" "}
              {label(capabilities.data?.current_user_role || "owner")}
            </StatusBadge>
            {canManage ? (
              <button
                type="button"
                className="primary"
                onClick={() => setInviteOpen(true)}
              >
                <UserPlus aria-hidden="true" /> Invite collaborator
              </button>
            ) : null}
          </div>
        }
      />
      {collaborators.isPending ? (
        <ResourceRowsSkeleton />
      ) : collaborators.isError ? (
        <InlineError
          message="Collaborators could not be loaded."
          onRetry={() => void collaborators.refetch()}
        />
      ) : (
        <>
          <CollaboratorGroup
            title="Collaborators"
            items={active}
            empty="No active collaborators."
            canManage={canManage}
            capabilities={capabilities.data?.actions}
            roleOptions={roleOptions}
            updatePending={update.isPending}
            onRole={(item, role) => update.mutate({ item, role })}
            onResend={(item) => resend.mutate(item)}
            onCopyInvitation={(item) => copyInvitation.mutate(item)}
            onRevoke={setRevokeItem}
          />
          <CollaboratorGroup
            title="Pending invitations"
            items={pending}
            empty="No pending invitations."
            canManage={canManage}
            capabilities={capabilities.data?.actions}
            roleOptions={roleOptions}
            updatePending={update.isPending}
            onRole={(item, role) => update.mutate({ item, role })}
            onResend={(item) => resend.mutate(item)}
            onCopyInvitation={(item) => copyInvitation.mutate(item)}
            onRevoke={setRevokeItem}
          />
        </>
      )}
      {!collaborators.isPending && !collaboratorItems.length ? (
        <EmptyState
          icon={Users}
          heading="No collaborators have been invited"
          description="Invite a viewer, reviewer or editor when someone needs access to this application."
          primaryAction={
            canManage
              ? {
                  label: "Invite collaborator",
                  onClick: () => setInviteOpen(true),
                }
              : undefined
          }
        />
      ) : null}
      {error ? <InlineError message={readableError(error)} /> : null}
      {inviteOpen ? (
        <InviteCollaboratorDrawer
          roleOptions={roleOptions}
          pending={invite.isPending}
          error={invite.error}
          onClose={() => setInviteOpen(false)}
          onSubmit={(body) => invite.mutate(body)}
        />
      ) : null}
      {revokeItem ? (
        <ConfirmationDialog
          title="Revoke collaborator access?"
          confirmLabel="Revoke access"
          pending={revoke.isPending}
          onCancel={() => setRevokeItem(null)}
          onConfirm={() => revoke.mutate(revokeItem)}
        >
          <p>
            {revokeItem.invited_email} will no longer be able to access this
            application.
          </p>
        </ConfirmationDialog>
      ) : null}
    </section>
  );
}


function InviteCollaboratorDrawer({
  roleOptions,
  pending,
  error,
  onClose,
  onSubmit,
}: {
  roleOptions: S["CollaboratorRoleOption"][];
  pending: boolean;
  error: unknown;
  onClose: () => void;
  onSubmit: (body: S["CollaboratorInvite"]) => void;
}) {
  const [role, setRole] = useState<S["CollaboratorInvite"]["role"]>("viewer");
  return (
    <WorkspaceDrawer
      title="Invite collaborator"
      description="Choose the smallest role this person needs."
      onClose={onClose}
    >
      <form
        className="detail-drawer-form"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit({
            email: String(new FormData(event.currentTarget).get("email")),
            role,
            message: optional(new FormData(event.currentTarget).get("message")),
          });
        }}
      >
        <label>
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            autoFocus
          />
        </label>
        <label>
          Role
          <Select
            value={role}
            onChange={(value) =>
              setRole(selectValue(value) as S["CollaboratorInvite"]["role"])
            }
            options={roleOptions.map((item) => ({
              value: item.value,
              label: item.label,
            }))}
          />
        </label>
        <label>
          Message <span className="detail-optional">Optional</span>
          <textarea
            name="message"
            maxLength={1000}
            rows={4}
            placeholder="Add context for your collaborator"
          />
        </label>
        <div className="detail-access-summary">
          <strong>Access summary</strong>
          <p>
            {roleOptions.find((item) => item.value === role)?.description ||
              roleDescription(role)}
          </p>
        </div>
        {error ? <InlineError message={readableError(error)} /> : null}
        <DrawerActions
          pending={pending}
          submitLabel="Send invitation"
          onCancel={onClose}
        />
      </form>
    </WorkspaceDrawer>
  );
}


function CollaboratorGroup({
  title,
  items,
  empty,
  canManage,
  capabilities,
  roleOptions,
  updatePending,
  onRole,
  onResend,
  onCopyInvitation,
  onRevoke,
}: {
  title: string;
  items: S["CollaboratorResponse"][];
  empty: string;
  canManage: boolean;
  capabilities?: { [key: string]: boolean };
  roleOptions: S["CollaboratorRoleOption"][];
  updatePending: boolean;
  onRole: (
    item: S["CollaboratorResponse"],
    role: S["CollaboratorUpdate"]["role"],
  ) => void;
  onResend: (item: S["CollaboratorResponse"]) => void;
  onCopyInvitation: (item: S["CollaboratorResponse"]) => void;
  onRevoke: (item: S["CollaboratorResponse"]) => void;
}) {
  return (
    <section className="collaborator-group">
      <h3>
        {title} <span>{items.length}</span>
      </h3>
      {items.length ? (
        <div className="detail-data-list">
          {items.map((item) => (
            <article className="detail-data-row collaborator-row" key={item.id}>
              <div className="detail-avatar" aria-hidden="true">
                {(item.name || item.invited_email).slice(0, 1).toUpperCase()}
              </div>
              <div className="detail-row-main">
                <strong>{item.name || item.invited_email}</strong>
                {item.name ? <small>{item.invited_email}</small> : null}
                <div className="detail-row-meta">
                  <span>{label(item.status)}</span>
                  <span>
                    {item.last_activity_at
                      ? `Active ${formatDate(item.last_activity_at)}`
                      : `Invited ${formatDate(item.created_at)}`}
                  </span>
                  <span>
                    {item.access_scope?.join(" · ") || "Application workspace"}
                  </span>
                </div>
              </div>
              <div className="detail-row-actions">
                <Select
                  aria-label={`Role for ${item.invited_email}`}
                  value={item.role}
                  disabled={
                    !canManage ||
                    capabilities?.change_roles !== true ||
                    updatePending
                  }
                  onChange={(value) =>
                    onRole(
                      item,
                      selectValue(value) as S["CollaboratorUpdate"]["role"],
                    )
                  }
                  options={roleOptions.map((role) => ({
                    value: role.value,
                    label: role.label,
                  }))}
                />
                {canManage ? (
                  <OverflowMenu
                    label={`More actions for ${item.invited_email}`}
                    items={[
                      ...(item.status === "invited" &&
                      capabilities?.resend_invitations
                        ? [
                            {
                              key: "resend",
                              label: "Resend invite",
                              icon: RefreshCw,
                              onClick: () => onResend(item),
                            },
                          ]
                        : []),
                      ...(item.status === "invited" &&
                      capabilities?.copy_invitation_links
                        ? [
                            {
                              key: "copy",
                              label: "Copy invitation",
                              icon: Copy,
                              onClick: () => onCopyInvitation(item),
                            },
                          ]
                        : []),
                      {
                        key: "revoke",
                        label: "Revoke access",
                        icon: Trash2,
                        danger: true,
                        disabled: capabilities?.revoke_access !== true,
                        onClick: () => onRevoke(item),
                      },
                    ]}
                  />
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="detail-muted-copy">{empty}</p>
      )}
    </section>
  );
}


export function ReadOnlyCollaboratorWorkspace({
  view,
}: {
  view: S["CollaboratorViewResponse"];
}) {
  return (
    <div className="page apps-page detail-page">
      <header className="detail-application-header">
        <div className="detail-header-topline">
          <Link to="/app/applications" className="apps-back-link">
            <ArrowLeft aria-hidden="true" /> Back to applications
          </Link>
          <WorkspacePageGuideButton />
        </div>
        <div className="detail-title-line">
          <h1>{view.application.title}</h1>
          <StatusBadge tone="blue">{label(view.role)}</StatusBadge>
        </div>
        <p>
          {roleDescription(view.role)} Application content is read-only until
          backend-supported editor permissions are available.
        </p>
      </header>
      <div className="detail-overview-split">
        <section className="detail-section">
          <SectionHeading title="Requirements" />
          {view.requirements.length ? (
            <ul className="detail-compact-list">
              {view.requirements.map((item) => (
                <li key={item.id}>
                  <RequirementStateIcon item={item} />
                  <span>
                    {item.title}
                    <small>{label(item.status)}</small>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="detail-muted-copy">No requirements are available.</p>
          )}
        </section>
        <section className="detail-section">
          <SectionHeading title="Tasks" />
          {view.tasks.length ? (
            <ul className="detail-compact-list">
              {view.tasks.map((item) => (
                <li key={item.id}>
                  <Circle aria-hidden="true" />
                  <span>
                    {item.title}
                    <small>{label(item.status)}</small>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="detail-muted-copy">No tasks are available.</p>
          )}
        </section>
      </div>
    </div>
  );
}


function roleDescription(role: string) {
  return (
    (
      {
        viewer: "Can view allowed application content",
        commenter: "Can comment or review",
        advisor_editor: "Can edit permitted content",
        owner: "Full control",
      } as Record<string, string>
    )[role] || "Access is limited by role"
  );
}

