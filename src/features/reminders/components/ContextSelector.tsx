import { useQuery } from "@tanstack/react-query";
import { applicationsApi } from "../../../lib/api/phase2";
import { referencesApi, interviewsApi } from "../../../lib/api/phase3";
import { queryKeys } from "../../../lib/api/queryKeys";
import { EntityCombobox } from "../../../components/filters/EntityCombobox";
import { Select } from "../../../components/ui/select";
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
        <Select
          value={value.aggregateType}
          onChange={(val: any) =>
            onChange({
              ...emptyContext,
              aggregateType: (typeof val === "string" ? val : val?.target?.value) as ContextValue["aggregateType"],
            })
          }
          options={aggregateTypes.map((type) => ({ value: type, label: aggregateLabel[type] }))}
        />
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
              <Select
                value={value.aggregateId}
                onChange={(val: any) =>
                  onChange({ ...value, aggregateId: typeof val === "string" ? val : (val?.target?.value ?? "") })
                }
                disabled={value.aggregateType === "requirement" ? requirements.isPending : tasks.isPending}
                placeholder="Not tied to a specific one"
                options={[
                  { value: "", label: "Not tied to a specific one" },
                  ...((value.aggregateType === "requirement" ? requirements.data : tasks.data)?.map((item) => ({
                    value: item.id,
                    label: item.title,
                  })) ?? []),
                ]}
              />
            </label>
          ) : null}
        </>
      ) : null}

      {value.aggregateType === "reference" ? (
        <label>
          Reference
          <Select
            value={value.aggregateId}
            onChange={(val: any) =>
              onChange({ ...value, aggregateId: typeof val === "string" ? val : (val?.target?.value ?? "") })
            }
            disabled={references.isPending}
            options={[
              { value: "", label: "Choose a reference" },
              ...(references.data?.items.map((ref) => ({
                value: ref.id,
                label: `${ref.referee_name} — ${ref.referee_role}`,
              })) ?? []),
            ]}
          />
        </label>
      ) : null}

      {value.aggregateType === "interview" ? (
        <label>
          Interview
          <Select
            value={value.aggregateId}
            onChange={(val: any) =>
              onChange({ ...value, aggregateId: typeof val === "string" ? val : (val?.target?.value ?? "") })
            }
            disabled={interviews.isPending}
            options={[
              { value: "", label: "Choose an interview" },
              ...(interviews.data?.items.map((interview) => ({
                value: interview.id,
                label: `${interview.interview_type} · ${interview.mode}`,
              })) ?? []),
            ]}
          />
        </label>
      ) : null}
    </>
  );
}
