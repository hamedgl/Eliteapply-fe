import { useEffect, useMemo, useRef, useState } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { BellOff, Check, CheckCheck, ChevronRight, Lock, Settings, X } from "lucide-react";
import type { components } from "../../generated/api/schema";
import { notificationsApi } from "../../lib/api/phase3";
import { queryKeys } from "../../lib/api/queryKeys";
import { safeNotificationPath } from "../../lib/navigation";
import { StatusBadge } from "../../components/data-display/StatusBadge";
import { autoReadPlan, categoryLabel, categoryTone, groupByDay, relativeTime } from "./model";
import "./notifications-dropdown.css";

type Notification = components["schemas"]["NotificationResponse"];
type ListResponse = components["schemas"]["NotificationListResponse"];
type UnreadCount = components["schemas"]["UnreadCountResponse"];

const PREVIEW_LIMIT = 8;
/** How long the panel stays open before what is on screen counts as seen. */
const AUTO_READ_DELAY_MS = 1200;

interface NotificationsDropdownProps {
  open: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

export function NotificationsDropdown({
  open: isOpen,
  onClose,
  triggerRef,
}: NotificationsDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [unreadOnly, setUnreadOnly] = useState(false);
  /**
   * Notifications that were unread when this panel opened. They keep their
   * unread styling for the rest of the session even after auto-read marks them
   * read on the server — otherwise the highlight would vanish under the reader
   * mid-glance and they would lose track of what was new.
   */
  const [wasUnread, setWasUnread] = useState<Set<string>>(() => new Set());
  const autoReadFired = useRef<Set<string>>(new Set());

  const list = useInfiniteQuery({
    queryKey: queryKeys.notifications(unreadOnly),
    queryFn: ({ pageParam }) => notificationsApi.list(unreadOnly, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.next_cursor ?? undefined,
    enabled: isOpen,
  });

  const unreadCount = useQuery({
    queryKey: queryKeys.unreadNotifications,
    queryFn: notificationsApi.unreadCount,
  });

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["notifications"] });

  /**
   * Marking read is optimistic: the row must settle instantly, because the very
   * next thing that happens is usually a navigation away from this dropdown.
   * Both list tabs and the badge count are patched, then reconciled on settle.
   */
  const read = useMutation({
    mutationFn: notificationsApi.markRead,
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ["notifications"] });
      const previous = qc.getQueriesData({ queryKey: ["notifications"] });
      for (const tab of [true, false]) {
        qc.setQueryData<InfiniteData<ListResponse>>(queryKeys.notifications(tab), (data) =>
          data
            ? {
                ...data,
                pages: data.pages.map((page) => ({
                  ...page,
                  items: tab
                    ? page.items.filter((item) => item.id !== id)
                    : page.items.map((item) =>
                        item.id === id ? { ...item, is_read: true } : item,
                      ),
                })),
              }
            : data,
        );
      }
      qc.setQueryData<UnreadCount>(queryKeys.unreadNotifications, (data) =>
        data ? { ...data, unread_count: Math.max(0, data.unread_count - 1) } : data,
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      for (const [key, data] of context?.previous ?? []) qc.setQueryData(key, data);
    },
    onSettled: invalidate,
  });

  const readAll = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["notifications"] });
      const previous = qc.getQueriesData({ queryKey: ["notifications"] });
      qc.setQueryData<UnreadCount>(queryKeys.unreadNotifications, (data) =>
        data ? { ...data, unread_count: 0 } : data,
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      for (const [key, data] of context?.previous ?? []) qc.setQueryData(key, data);
    },
    onSettled: invalidate,
  });

  const items = useMemo(
    () => (list.data?.pages.flatMap((page) => page.items) ?? []).slice(0, PREVIEW_LIMIT),
    [list.data],
  );
  const days = useMemo(() => groupByDay(items), [items]);
  const unread = unreadCount.data?.unread_count ?? 0;

  useEffect(() => {
    if (isOpen) return;
    // A fresh open starts a fresh "what is new" snapshot.
    setWasUnread(new Set());
    autoReadFired.current = new Set();
  }, [isOpen]);

  useEffect(() => {
    // Not on the Unread tab: clearing the very list the reader filtered to would
    // empty it under them.
    if (!isOpen || unreadOnly || !items.length) return;
    const pending = items.filter((item) => !item.is_read).map((item) => item.id);
    const fresh = pending.filter((id) => !autoReadFired.current.has(id));
    if (!fresh.length) return;

    setWasUnread((previous) => new Set([...previous, ...pending]));
    const timer = window.setTimeout(() => {
      for (const id of fresh) autoReadFired.current.add(id);
      const plan = autoReadPlan(pending, unread);
      if (plan.markAll) readAll.mutate();
      else for (const id of plan.ids.filter((id) => fresh.includes(id))) read.mutate(id);
    }, AUTO_READ_DELAY_MS);
    return () => window.clearTimeout(timer);
    // `read`/`readAll` are stable mutation objects; re-running on them would
    // restart the timer on every settle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, items, unread, unreadOnly]);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (dropdownRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      onClose();
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      onClose();
      triggerRef.current?.focus();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose, triggerRef]);

  /** Up/Down move between rows; the panel itself never traps Tab. */
  function handleListKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const rows = Array.from(
      dropdownRef.current?.querySelectorAll<HTMLElement>(".notif-dropdown-item") ?? [],
    );
    if (!rows.length) return;
    event.preventDefault();
    const current = rows.indexOf(document.activeElement as HTMLElement);
    const next =
      event.key === "ArrowDown"
        ? Math.min(current + 1, rows.length - 1)
        : Math.max(current - 1, 0);
    rows[current < 0 ? 0 : next]?.focus();
  }

  async function openItem(item: Notification) {
    const path = safeNotificationPath(item.data);
    if (!item.is_read) read.mutate(item.id);
    if (!path) return;
    onClose();
    navigate(path);
  }

  function goTo(path: string) {
    onClose();
    navigate(path);
  }

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="notif-dropdown"
      role="dialog"
      aria-label="Notifications"
      onKeyDown={handleListKeyDown}
    >
      <div className="notif-dropdown-head">
        <h3>
          Notifications
          {unread ? <span className="notif-dropdown-count">{unread > 99 ? "99+" : unread}</span> : null}
        </h3>
        <div className="notif-dropdown-head-actions">
          {unread ? (
            <button
              type="button"
              className="notif-dropdown-action"
              onClick={() => readAll.mutate()}
              disabled={readAll.isPending}
            >
              <CheckCheck aria-hidden="true" />
              Mark all read
            </button>
          ) : null}
          <button
            type="button"
            className="notif-dropdown-icon-button"
            onClick={() => goTo("/app/notifications")}
            aria-label="Notification settings"
            title="Notification settings"
          >
            <Settings aria-hidden="true" />
          </button>
          <button
            type="button"
            className="notif-dropdown-icon-button"
            aria-label="Close"
            onClick={() => {
              onClose();
              triggerRef.current?.focus();
            }}
          >
            <X aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="notif-dropdown-tabs" role="tablist" aria-label="Filter notifications">
        {[
          { key: false, label: "All" },
          { key: true, label: unread ? `Unread (${unread})` : "Unread" },
        ].map((tab) => (
          <button
            key={String(tab.key)}
            type="button"
            role="tab"
            aria-selected={unreadOnly === tab.key}
            className={unreadOnly === tab.key ? "is-active" : undefined}
            onClick={() => setUnreadOnly(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {list.isPending ? (
        <div className="notif-dropdown-skeleton" aria-busy="true" aria-label="Loading notifications">
          {[0, 1, 2].map((row) => (
            <span key={row} />
          ))}
        </div>
      ) : list.isError ? (
        <div className="notif-dropdown-status" role="alert">
          <p>We couldn't load your notifications.</p>
          <button type="button" onClick={() => list.refetch()}>
            Try again
          </button>
        </div>
      ) : items.length ? (
        <div className="notif-dropdown-list">
          {days.map((day) => (
            <section key={day.label} aria-label={day.label}>
              <p className="notif-dropdown-day">{day.label}</p>
              {day.items.map((item) => (
                <div
                  key={item.id}
                  className={`notif-dropdown-row${
                    item.is_read && !wasUnread.has(item.id) ? "" : " is-unread"
                  }`}
                >
                  <button
                    type="button"
                    className="notif-dropdown-item"
                    onClick={() => openItem(item)}
                  >
                    <span className="notif-dropdown-dot" aria-hidden="true" />
                    <span className="notif-dropdown-content">
                      <span className="notif-dropdown-meta">
                        <StatusBadge tone={categoryTone(item.category)}>
                          {categoryLabel(item.category)}
                        </StatusBadge>
                        {item.mandatory ? (
                          <StatusBadge tone="grey" icon={Lock}>
                            Required
                          </StatusBadge>
                        ) : null}
                        <time dateTime={item.created_at}>{relativeTime(item.created_at)}</time>
                      </span>
                      <span className="notif-dropdown-title">{item.title}</span>
                      <span className="notif-dropdown-body">{item.body}</span>
                    </span>
                    {safeNotificationPath(item.data) ? (
                      <ChevronRight aria-hidden="true" className="notif-dropdown-chevron" />
                    ) : null}
                  </button>
                  {item.is_read ? null : (
                    <button
                      type="button"
                      className="notif-dropdown-mark"
                      onClick={() => read.mutate(item.id)}
                      aria-label={`Mark "${item.title}" as read`}
                      title="Mark as read"
                    >
                      <Check aria-hidden="true" />
                    </button>
                  )}
                </div>
              ))}
            </section>
          ))}
        </div>
      ) : (
        <div className="notif-dropdown-status">
          <BellOff aria-hidden="true" />
          <p>{unreadOnly ? "Nothing unread." : "You're all caught up."}</p>
          {unreadOnly ? (
            <button type="button" onClick={() => setUnreadOnly(false)}>
              Show all notifications
            </button>
          ) : null}
        </div>
      )}

      <button
        type="button"
        className="notif-dropdown-footer"
        onClick={() => goTo("/app/notifications")}
      >
        View all notifications
        <ChevronRight aria-hidden="true" />
      </button>
    </div>
  );
}
