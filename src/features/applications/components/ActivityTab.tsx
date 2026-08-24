import {
  useInfiniteQuery,
} from "@tanstack/react-query";
import {
  Filter,
  History,
} from "lucide-react";
import {
  useSearchParams,
} from "react-router-dom";
import {
  applicationsApi,
} from "../../../lib/api/phase2";
import { queryKeys } from "../../../lib/api/queryKeys";
import { EmptyState } from "../../../components/data-display/EmptyState";
import { Select } from "../../../components/ui/select";
import {
  label,
} from "../model";
import type { components } from "../../../generated/api/schema";
import "../../../styles/workspace.css";
import {
  ResourceHeader,
  selectValue,
  ResourceRowsSkeleton,
  InlineError,
  formatTime,
} from "./applicationWorkspaceShared";


type S = components["schemas"];

export function ActivityTab({ applicationId }: { applicationId: string }) {
  const [params, setParams] = useSearchParams();
  const filter = params.get("activity") ?? "all";
  const activity = useInfiniteQuery({
    queryKey: queryKeys.applicationActivity(applicationId, filter),
    queryFn: ({ pageParam }) =>
      applicationsApi.activity(
        applicationId,
        filter === "all" ? undefined : filter,
        pageParam,
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.next_cursor ?? undefined,
  });
  const setFilter = (value: string) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        value === "all" ? next.delete("activity") : next.set("activity", value);
        return next;
      },
      { replace: true },
    );
  const events = activity.data?.pages.flatMap((page) => page.items) ?? [];
  const groups = groupActivity(events);
  return (
    <section className="detail-section detail-resource-section activity-workspace">
      <ResourceHeader
        title="Activity"
        description="A readable record of changes made to this application."
      />
      <div className="detail-filter-bar">
        <Filter aria-hidden="true" />
        <Select
          value={filter}
          onChange={(value) => setFilter(selectValue(value))}
          options={[
            "all",
            "application",
            "requirements",
            "tasks",
            "documents",
            "eligibility",
            "collaborators",
          ].map((value) => ({
            value,
            label:
              value === "all"
                ? "All activity"
                : value === "application"
                  ? "Application updates"
                  : label(value),
          }))}
        />
      </div>
      {activity.isPending ? (
        <ResourceRowsSkeleton />
      ) : activity.isError ? (
        <InlineError
          message="Activity could not be loaded."
          onRetry={() => void activity.refetch()}
        />
      ) : events.length ? (
        <div className="activity-groups">
          {groups.map(([date, items]) => (
            <section key={date}>
              <h3>{date}</h3>
              <ol className="activity-timeline">
                {items.map((event) => {
                  return (
                    <li key={event.id}>
                      <div className="activity-marker">
                        <History aria-hidden="true" />
                      </div>
                      <div>
                        <p>
                          <strong>{event.action}</strong>
                          {event.affected_item ? (
                            <span> · {event.affected_item}</span>
                          ) : null}
                        </p>
                        {event.change_summary ? (
                          <small>{event.change_summary}</small>
                        ) : null}
                        <footer>
                          <span>{event.actor.name}</span>
                          <time dateTime={event.occurred_at}>
                            {formatTime(event.occurred_at)}
                          </time>
                        </footer>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={History}
          heading="Activity will appear as the application changes"
          description="Updates to supported application resources are recorded here."
        />
      )}
      {activity.hasNextPage ? (
        <button
          type="button"
          className="detail-load-more"
          disabled={activity.isFetchingNextPage}
          onClick={() => void activity.fetchNextPage()}
        >
          {activity.isFetchingNextPage ? "Loading…" : "Load more"}
        </button>
      ) : null}
    </section>
  );
}


function groupActivity(events: S["ActivityEventResponse"][]) {
  const groups = new Map<string, S["ActivityEventResponse"][]>();
  events.forEach((event) => {
    const date = new Intl.DateTimeFormat(undefined, {
      dateStyle: "long",
    }).format(new Date(event.occurred_at));
    groups.set(date, [...(groups.get(date) ?? []), event]);
  });
  return [...groups.entries()];
}

