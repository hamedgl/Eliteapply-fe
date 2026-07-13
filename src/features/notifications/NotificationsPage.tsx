import { useState } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { notificationsApi } from "../../lib/api/phase3";
import { queryKeys } from "../../lib/api/queryKeys";
import { safeNotificationPath } from "../../lib/navigation";

const knownCategories = new Set(["application", "reference", "writing", "import", "interview", "billing", "security"]);
const categoryLabel = (value: string) => knownCategories.has(value) ? value : "general";

export function NotificationsPage() {
  const [unreadOnly, setUnreadOnly] = useState(false); const qc = useQueryClient(); const navigate = useNavigate();
  const list = useInfiniteQuery({ queryKey: queryKeys.notifications(unreadOnly), queryFn: ({ pageParam }) => notificationsApi.list(unreadOnly, pageParam), initialPageParam: null as string | null, getNextPageParam: (page) => page.next_cursor ?? undefined });
  const refresh = () => { void qc.invalidateQueries({ queryKey: ["notifications"] }); };
  const read = useMutation({ mutationFn: notificationsApi.markRead, onSuccess: refresh });
  const readAll = useMutation({ mutationFn: notificationsApi.markAllRead, onSuccess: refresh });
  const preferences = useQuery({ queryKey: queryKeys.notificationPreferences, queryFn: notificationsApi.preferences });
  const savePreferences = useMutation({ mutationFn: notificationsApi.updatePreferences, onSuccess: (data) => qc.setQueryData(queryKeys.notificationPreferences, data) });
  const items = list.data?.pages.flatMap((page) => page.items) ?? [];
  async function open(item: (typeof items)[number]) { if (!item.is_read) await read.mutateAsync(item.id); const path = safeNotificationPath(item.data); if (path) navigate(path); }
  function save(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); const category_settings = Object.fromEntries(Object.keys(preferences.data?.category_settings ?? {}).map((category) => [category, { in_app: form.get(`${category}:in_app`) === "on", email: form.get(`${category}:email`) === "on" }])); savePreferences.mutate({ category_settings }); }
  return <div className="page"><header className="page-heading"><div><h1>Notifications</h1><p>Important activity across your application workspace.</p></div><button onClick={() => readAll.mutate()} disabled={readAll.isPending}>Mark all read</button></header>
    <label className="phase3-filter"><input type="checkbox" checked={unreadOnly} onChange={(event) => setUnreadOnly(event.target.checked)} /> Unread only</label>
    <div className="notification-list">{items.map((item) => <article key={item.id} className={item.is_read ? "notification-item" : "notification-item unread"}><div><span>{categoryLabel(item.category)}</span>{item.mandatory ? <strong>Required</strong> : null}<time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString()}</time></div><h2>{item.title}</h2><p>{item.body}</p><button onClick={() => open(item)}>{safeNotificationPath(item.data) ? "Open related item" : item.is_read ? "Read" : "Mark as read"}</button></article>)}</div>
    {!list.isPending && !items.length ? <div className="phase3-empty"><h2>You’re all caught up</h2><p>New application, reference, writing, and account updates will appear here.</p></div> : null}{list.hasNextPage ? <button className="load-more" onClick={() => list.fetchNextPage()}>Load more</button> : null}
    <section className="phase3-panel"><h2>Notification preferences</h2><p>Mandatory account and security messages may still be delivered.</p>{preferences.data ? <form onSubmit={save} className="preference-grid">{Object.entries(preferences.data.category_settings).map(([category, value]) => <fieldset key={category}><legend>{category.replaceAll("_", " ")}</legend><label><input name={`${category}:in_app`} type="checkbox" defaultChecked={value.in_app} /> In app</label><label><input name={`${category}:email`} type="checkbox" defaultChecked={value.email} /> Email</label></fieldset>)}<button className="primary" disabled={savePreferences.isPending}>Save preferences</button></form> : <p role="status">Loading preferences…</p>}</section>
  </div>;
}
