import { useEffect, useRef, useState } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Bell, BellOff, CheckCheck, Lock } from "lucide-react";
import { notificationsApi } from "../../lib/api/phase3";
import { queryKeys } from "../../lib/api/queryKeys";
import { safeNotificationPath } from "../../lib/navigation";
import { StatusBadge } from "../../components/data-display/StatusBadge";
import { categoryLabel, categoryTone, relativeTime } from "./model";
import "./notifications-dropdown.css";

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

  const list = useInfiniteQuery({
    queryKey: queryKeys.notifications(false),
    queryFn: ({ pageParam }) => notificationsApi.list(false, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.next_cursor ?? undefined,
  });

  const unreadCount = useQuery({
    queryKey: queryKeys.unreadNotifications,
    queryFn: notificationsApi.unreadCount,
  });

  const refresh = () => void qc.invalidateQueries({ queryKey: ["notifications"] });
  const read = useMutation({ mutationFn: notificationsApi.markRead, onSuccess: refresh });
  const readAll = useMutation({ mutationFn: notificationsApi.markAllRead, onSuccess: refresh });

  const items = list.data?.pages.flatMap((page) => page.items) ?? [];

  async function openItem(item: (typeof items)[number]) {
    if (!item.is_read) await read.mutateAsync(item.id);
    const path = safeNotificationPath(item.data);
    if (path) {
      navigate(path);
      onClose();
    }
  }

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  return (
    <div ref={dropdownRef} className="notif-dropdown">
      <div className="notif-dropdown-head">
        <h3>Notifications</h3>
        {unreadCount.data?.unread_count ? (
          <button
            type="button"
            className="notif-dropdown-mark-all"
            onClick={() => readAll.mutate()}
            disabled={readAll.isPending}
            title="Mark all as read"
          >
            <CheckCheck aria-hidden="true" size={16} />
            <span className="sr-only">Mark all as read</span>
          </button>
        ) : null}
      </div>

      {list.isPending ? (
        <div className="notif-dropdown-loading">
          <p>Loading…</p>
        </div>
      ) : list.isError ? (
        <div className="notif-dropdown-error">
          <p>Failed to load notifications</p>
          <button type="button" onClick={() => list.refetch()}>
            Retry
          </button>
        </div>
      ) : items.length ? (
        <div className="notif-dropdown-list">
          {items.slice(0, 5).map((item) => (
            <button
              key={item.id}
              type="button"
              className={`notif-dropdown-item${item.is_read ? "" : " is-unread"}`}
              onClick={() => openItem(item)}
            >
              <span className="notif-dropdown-dot" aria-hidden="true" />
              <div className="notif-dropdown-content">
                <div className="notif-dropdown-meta">
                  <StatusBadge tone={categoryTone(item.category)}>
                    {categoryLabel(item.category)}
                  </StatusBadge>
                  {item.mandatory ? (
                    <StatusBadge tone="grey" icon={Lock}>
                      Required
                    </StatusBadge>
                  ) : null}
                </div>
                <h4>{item.title}</h4>
                <p>{item.body}</p>
                <time className="notif-dropdown-time">{relativeTime(item.created_at)}</time>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="notif-dropdown-empty">
          <BellOff size={20} aria-hidden="true" />
          <p>You're all caught up</p>
        </div>
      )}

      <button
        type="button"
        className="notif-dropdown-footer"
        onClick={() => {
          navigate("/app/notifications");
          onClose();
        }}
      >
        View all notifications
      </button>
    </div>
  );
}
