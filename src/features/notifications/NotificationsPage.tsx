import { useState } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Bell, BellOff, CheckCheck, Lock, Mail, MonitorSmartphone } from "lucide-react";
import { notificationsApi } from "../../lib/api/phase3";
import { queryKeys } from "../../lib/api/queryKeys";
import { safeNotificationPath } from "../../lib/navigation";
import { PageHeader } from "../../components/page/PageHeader";
import { SummaryStrip } from "../../components/page/SummaryStrip";
import { EmptyState } from "../../components/data-display/EmptyState";
import { StatusBadge } from "../../components/data-display/StatusBadge";
import { categoryLabel, categoryTone, notificationCategories, relativeTime } from "./model";
import "../../styles/workspace.css";
import "./notifications.css";

export function NotificationsPage() {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const list = useInfiniteQuery({
    queryKey: queryKeys.notifications(unreadOnly),
    queryFn: ({ pageParam }) => notificationsApi.list(unreadOnly, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.next_cursor ?? undefined,
  });
  const unreadCount = useQuery({
    queryKey: queryKeys.unreadNotifications,
    queryFn: notificationsApi.unreadCount,
  });
  const preferences = useQuery({
    queryKey: queryKeys.notificationPreferences,
    queryFn: notificationsApi.preferences,
  });

  const refresh = () => void qc.invalidateQueries({ queryKey: ["notifications"] });
  const read = useMutation({ mutationFn: notificationsApi.markRead, onSuccess: refresh });
  const readAll = useMutation({ mutationFn: notificationsApi.markAllRead, onSuccess: refresh });
  const savePreferences = useMutation({
    mutationFn: notificationsApi.updatePreferences,
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.notificationPreferences, data);
      setJustSaved(true);
      window.setTimeout(() => setJustSaved(false), 3000);
    },
  });

  const items = list.data?.pages.flatMap((page) => page.items) ?? [];

  async function open(item: (typeof items)[number]) {
    if (!item.is_read) await read.mutateAsync(item.id);
    const path = safeNotificationPath(item.data);
    if (path) navigate(path);
  }

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const category_settings = Object.fromEntries(
      Object.keys(preferences.data?.category_settings ?? {}).map((category) => [
        category,
        {
          in_app: form.get(`${category}:in_app`) === "on",
          email: form.get(`${category}:email`) === "on",
        },
      ]),
    );
    savePreferences.mutate({ category_settings });
  }

  if (list.isPending)
    return (
      <div className="apps-skeleton" aria-busy="true" aria-label="Loading notifications">
        <div className="apps-skeleton-summary">
          {Array.from({ length: 2 }).map((_, i) => (
            <div className="skeleton apps-skeleton-summary-item" key={i} />
          ))}
        </div>
        <div className="skeleton apps-skeleton-toolbar" />
        <div className="apps-skeleton-table">
          {Array.from({ length: 4 }).map((_, i) => (
            <div className="skeleton apps-skeleton-row" key={i} />
          ))}
        </div>
      </div>
    );
  if (list.isError)
    return (
      <div className="apps-page-error" role="alert">
        <h1>We couldn’t load your notifications.</h1>
        <button className="primary" onClick={() => list.refetch()}>
          Try again
        </button>
      </div>
    );

  return (
    <div className="page">
      <PageHeader
        title="Notifications"
        description="Important activity across your application workspace."
        actions={
          <button
            type="button"
            onClick={() => readAll.mutate()}
            disabled={readAll.isPending || !unreadCount.data?.unread_count}
          >
            <CheckCheck aria-hidden="true" /> Mark all read
          </button>
        }
      />

      <SummaryStrip
        metrics={[
          {
            key: "unread",
            label: "Unread",
            value: unreadCount.data?.unread_count ?? 0,
            attention: Boolean(unreadCount.data?.unread_count),
            icon: Bell,
          },
          {
            key: "total",
            label: "Loaded",
            value: items.length,
            icon: MonitorSmartphone,
          },
        ]}
      />

      <div className="apps-card apps-toolbar">
        <label className="apps-quick-filter notif-unread-toggle">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(event) => setUnreadOnly(event.target.checked)}
          />
          Unread only
        </label>
      </div>

      {items.length ? (
        <div className="notif-list">
          {items.map((item) => {
            const path = safeNotificationPath(item.data);
            return (
              <article
                key={item.id}
                className={`apps-card notif-card${item.is_read ? "" : " is-unread"}`}
              >
                <span className="notif-unread-dot" aria-hidden="true" />
                <div className="notif-card-body">
                  <div className="notif-card-meta">
                    <StatusBadge tone={categoryTone(item.category)}>
                      {categoryLabel(item.category)}
                    </StatusBadge>
                    {item.mandatory ? (
                      <StatusBadge tone="grey" icon={Lock}>
                        Required
                      </StatusBadge>
                    ) : null}
                    <time dateTime={item.created_at} className="notif-card-time">
                      {relativeTime(item.created_at)}
                    </time>
                  </div>
                  <h2>{item.title}</h2>
                  <p>{item.body}</p>
                  <button type="button" className="notif-card-action" onClick={() => open(item)}>
                    {path ? "Open related item" : item.is_read ? "Read" : "Mark as read"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={BellOff}
          heading="You’re all caught up"
          description="New application, reference, writing, and account updates will appear here."
        />
      )}

      {list.hasNextPage ? (
        <button
          type="button"
          className="notif-load-more"
          onClick={() => list.fetchNextPage()}
          disabled={list.isFetchingNextPage}
        >
          {list.isFetchingNextPage ? "Loading…" : "Load more"}
        </button>
      ) : null}

      <section className="apps-card notif-prefs-card">
        <div className="notif-prefs-head">
          <h2>Notification preferences</h2>
          <p>Mandatory account and security messages may still be delivered.</p>
        </div>
        {preferences.data ? (
          <form onSubmit={save}>
            <div className="notif-prefs-table" role="table">
              <div className="notif-prefs-row notif-prefs-row-head" role="row">
                <span role="columnheader" />
                <span role="columnheader">
                  <MonitorSmartphone aria-hidden="true" /> In-app
                </span>
                <span role="columnheader">
                  <Mail aria-hidden="true" /> Email
                </span>
              </div>
              {notificationCategories.map((category) => {
                const value = preferences.data.category_settings[category];
                if (!value) return null;
                return (
                  <div className="notif-prefs-row" role="row" key={category}>
                    <span className="notif-prefs-row-label" role="cell">
                      {categoryLabel(category)}
                    </span>
                    <label className="check notif-prefs-check" role="cell">
                      <input
                        name={`${category}:in_app`}
                        type="checkbox"
                        defaultChecked={value.in_app}
                        aria-label={`${categoryLabel(category)} in-app notifications`}
                      />
                    </label>
                    <label className="check notif-prefs-check" role="cell">
                      <input
                        name={`${category}:email`}
                        type="checkbox"
                        defaultChecked={value.email}
                        aria-label={`${categoryLabel(category)} email notifications`}
                      />
                    </label>
                  </div>
                );
              })}
            </div>
            <div className="notif-prefs-actions">
              {justSaved ? (
                <p className="inline-success" role="status">
                  Preferences saved.
                </p>
              ) : null}
              <button className="primary" type="submit" disabled={savePreferences.isPending}>
                {savePreferences.isPending ? "Saving…" : "Save preferences"}
              </button>
            </div>
          </form>
        ) : (
          <p role="status">Loading preferences…</p>
        )}
      </section>
    </div>
  );
}
