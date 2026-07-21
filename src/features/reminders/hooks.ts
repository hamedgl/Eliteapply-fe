import { useQuery } from "@tanstack/react-query";
import { applicationsApi } from "../../lib/api/phase2";
import { referencesApi, interviewsApi } from "../../lib/api/phase3";
import { queryKeys } from "../../lib/api/queryKeys";
import type { Reminder } from "./model";

/** Resolves a human label for a reminder's related item — never a raw id. */
export function useReminderContext(reminder: Reminder | undefined) {
  const type = reminder?.aggregate_type;
  const requirement = useQuery({
    queryKey: ["applications", "requirements", reminder?.aggregate_id ?? ""],
    queryFn: () => applicationsApi.requirement(reminder!.aggregate_id!),
    enabled: type === "requirement" && Boolean(reminder?.aggregate_id),
    staleTime: 60_000,
  });
  const task = useQuery({
    queryKey: ["applications", "tasks", reminder?.aggregate_id ?? ""],
    queryFn: () => applicationsApi.task(reminder!.aggregate_id!),
    enabled: type === "task" && Boolean(reminder?.aggregate_id),
    staleTime: 60_000,
  });
  const references = useQuery({
    queryKey: queryKeys.references(),
    queryFn: () => referencesApi.list(),
    enabled: type === "reference",
    staleTime: 60_000,
  });
  const interviews = useQuery({
    queryKey: queryKeys.interviews,
    queryFn: () => interviewsApi.list(),
    enabled: type === "interview",
    staleTime: 60_000,
  });

  if (!reminder) return { label: null, isLoading: false };
  if (type === "application")
    return { label: reminder.application_title ?? null, isLoading: false };
  if (type === "requirement")
    return {
      label: requirement.data ? `Requirement: ${requirement.data.title}` : null,
      isLoading: requirement.isPending,
    };
  if (type === "task")
    return { label: task.data ? `Task: ${task.data.title}` : null, isLoading: task.isPending };
  if (type === "reference") {
    const match = references.data?.items.find((r) => r.id === reminder.aggregate_id);
    return {
      label: match ? `Reference: ${match.referee_name}` : null,
      isLoading: references.isPending,
    };
  }
  if (type === "interview") {
    const match = interviews.data?.items.find((i) => i.id === reminder.aggregate_id);
    return {
      label: match ? `${match.interview_type} interview` : null,
      isLoading: interviews.isPending,
    };
  }
  return { label: null, isLoading: false };
}
