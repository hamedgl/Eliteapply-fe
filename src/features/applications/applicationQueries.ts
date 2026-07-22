import {
  useQuery,
  type QueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import type { components } from "../../generated/api/schema";
import { applicationsApi } from "../../lib/api/phase2";
import { queryKeys } from "../../lib/api/queryKeys";

type S = components["schemas"];
type QueryOptions = { enabled?: boolean };
export type ApplicationResource = "requirements" | "tasks";
export const applicationResourceStaleTime = 60_000;

export function getApplicationRequirements(
  applicationId: string,
  { signal }: { signal?: AbortSignal } = {},
) {
  return applicationsApi.requirements(applicationId, signal);
}

export function getApplicationTasks(
  applicationId: string,
  { signal }: { signal?: AbortSignal } = {},
) {
  return applicationsApi.tasks(applicationId, signal);
}

export function useApplicationRequirements(
  applicationId: string,
  options: QueryOptions = {},
) {
  return useQuery({
    queryKey: queryKeys.requirements(applicationId),
    queryFn: ({ signal }) =>
      getApplicationRequirements(applicationId, { signal }),
    enabled: Boolean(applicationId) && (options.enabled ?? true),
    staleTime: applicationResourceStaleTime,
  });
}

export function useApplicationTasks(
  applicationId: string,
  options: QueryOptions = {},
) {
  return useQuery({
    queryKey: queryKeys.tasks(applicationId),
    queryFn: ({ signal }) => getApplicationTasks(applicationId, { signal }),
    enabled: Boolean(applicationId) && (options.enabled ?? true),
    staleTime: applicationResourceStaleTime,
  });
}

export function seedApplicationWorkspace(
  client: QueryClient,
  applicationId: string,
  workspace: S["ApplicationWorkspaceResponse"],
) {
  client.setQueryData(
    queryKeys.application(applicationId),
    workspace.application,
  );
  client.setQueryData(
    queryKeys.requirements(applicationId),
    workspace.requirements,
  );
  client.setQueryData(queryKeys.tasks(applicationId), workspace.tasks);
  client.setQueryData(
    queryKeys.applicationDocuments(applicationId),
    workspace.document_links,
  );
}

export function cacheApplicationDocumentLink(
  client: QueryClient,
  applicationId: string,
  link: S["DocumentLinkResponse"],
) {
  client.setQueryData<S["DocumentLinkResponse"][]>(
    queryKeys.applicationDocuments(applicationId),
    (current) => [link, ...(current ?? []).filter((item) => item.id !== link.id)],
  );
}

export function invalidateApplicationResource(
  client: QueryClient,
  applicationId: string,
  resource: ApplicationResource,
) {
  const keys: QueryKey[] = [
    queryKeys.workspace(applicationId),
    resource === "requirements"
      ? queryKeys.requirements(applicationId)
      : queryKeys.tasks(applicationId),
    queryKeys.dashboard,
    queryKeys.applicationHistory(applicationId),
  ];
  if (resource === "requirements")
    keys.push(queryKeys.readiness(applicationId));
  return Promise.all(
    keys.map((queryKey) => client.invalidateQueries({ queryKey })),
  );
}
