import { useQuery } from "@tanstack/react-query";
import { applicationsApi } from "../../../lib/api/phase2";
import { referencesApi, interviewsApi } from "../../../lib/api/phase3";
import { queryKeys } from "../../../lib/api/queryKeys";
import { EntityCombobox } from "../../../components/filters/EntityCombobox";
import { aggregateLabel, aggregateTypes } from "../model";

export type ContextValue = {
  aggregateType: (typeof aggregateTypes)[number];
  aggregateId: string;
  aggregateName: string;
  applicationId: string; // parent app, only used for requirement/task lookups
  applicationName: string;
};

export const emptyContext: ContextValue = {
  aggregateType: "custom",
  aggregateId: "",
  aggregateName: "",
  applicationId: "",
  applicationName: "",
};

/** "Related to" picker: aggregate type + a human-readable, searchable entity — never a raw id. */
export function ContextSelector({
  value,
  onChange,
}: {
  value: ContextValue;
  onChange: (next: ContextValue) => void;
}) {
  const requirements = useQuery({
    queryKey: queryKeys.requirements(value.applicationId),
    queryFn: ({ signal }) => applicationsApi.requirements(value.applicationId, signal),
    enabled: value.aggregateType === "requirement" && Boolean(value.applicationId),
  });
  const tasks = useQuery({
    queryKey: queryKeys.tasks(value.applicationId),
    queryFn: ({ signal }) => applicationsApi.tasks(value.applicationId, signal),
    enabled: value.aggregateType === "task" && Boolean(value.applicationId),
  });
  const references = useQuery({
    queryKey: queryKeys.references(),
    queryFn: () => referencesApi.list(),
    enabled: value.aggregateType === "reference",
  });
  const interviews = useQuery({
    queryKey: queryKeys.interviews,
    queryFn: () => interviewsApi.list(),
    enabled: value.aggregateType === "interview",
  });

  return (
    <>
      <label>
        Related to
        <select
          value={value.aggregateType}
          onChange={(event) =>
            onChange({
              ...emptyContext,
              aggregateType: event.target.value as ContextValue["aggregateType"],
            })
          }
        >
          {aggregateTypes.map((type) => (
            <option value={type} key={type}>
              {aggregateLabel[type]}
            </option>
          ))}
        </select>
      </label>

      {value.aggregateType === "application" ? (
        <EntityCombobox
          queryKey={queryKeys.applications}
          search={async (search) => {
            const result = await applicationsApi.list({ search, limit: 10 });
            return result.items.map((app) => ({ id: app.id, name: app.title }));
          }}
          label="Application"
          placeholder="Search your applications…"
          value={value.aggregateId}
          valueLabel={value.aggregateName}
          onChange={(id, name) =>
            onChange({ ...value, aggregateId: id, aggregateName: name, applicationId: id, applicationName: name })
          }
        />
      ) : null}

      {value.aggregateType === "requirement" || value.aggregateType === "task" ? (
        <>
          <EntityCombobox
            queryKey={queryKeys.applications}
            search={async (search) => {
              const result = await applicationsApi.list({ search, limit: 10 });
              return result.items.map((app) => ({ id: app.id, name: app.title }));
            }}
            label="Application"
            placeholder="Search your applications…"
            value={value.applicationId}
            valueLabel={value.applicationName}
            onChange={(id, name) =>
              onChange({ ...value, applicationId: id, applicationName: name, aggregateId: "" })
            }
          />
          {value.applicationId ? (
            <label>
              {value.aggregateType === "requirement" ? "Requirement" : "Task"}
              <select
                value={value.aggregateId}
                onChange={(event) => onChange({ ...value, aggregateId: event.target.value })}
                disabled={value.aggregateType === "requirement" ? requirements.isPending : tasks.isPending}
              >
                <option value="">Not tied to a specific one</option>
                {(value.aggregateType === "requirement" ? requirements.data : tasks.data)?.map(
                  (item) => (
                    <option value={item.id} key={item.id}>
                      {item.title}
                    </option>
                  ),
                )}
              </select>
            </label>
          ) : null}
        </>
      ) : null}

      {value.aggregateType === "reference" ? (
        <label>
          Reference
          <select
            value={value.aggregateId}
            onChange={(event) => onChange({ ...value, aggregateId: event.target.value })}
            disabled={references.isPending}
          >
            <option value="">Choose a reference</option>
            {references.data?.items.map((ref) => (
              <option value={ref.id} key={ref.id}>
                {ref.referee_name} — {ref.referee_role}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {value.aggregateType === "interview" ? (
        <label>
          Interview
          <select
            value={value.aggregateId}
            onChange={(event) => onChange({ ...value, aggregateId: event.target.value })}
            disabled={interviews.isPending}
          >
            <option value="">Choose an interview</option>
            {interviews.data?.items.map((interview) => (
              <option value={interview.id} key={interview.id}>
                {interview.interview_type} · {interview.mode}
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </>
  );
}
