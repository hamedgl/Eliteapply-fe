import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { SetURLSearchParams } from "react-router-dom";
import { applicationsApi, catalogueApi } from "../../lib/api/phase2";
import { queryKeys } from "../../lib/api/queryKeys";
import type { Application } from "./model";

type View = "board" | "list";

/** Keeps free-text filter inputs responsive while delaying the URL/query update until typing pauses. */
export function useDebouncedFilter(
  key: string,
  params: URLSearchParams,
  setParams: SetURLSearchParams,
  view: View,
  delay = 350,
) {
  const urlValue = params.get(key) ?? "";
  const [draft, setDraft] = useState(urlValue);
  useEffect(() => setDraft(urlValue), [urlValue]);
  useEffect(() => {
    if (draft === urlValue) return;
    const timer = setTimeout(() => {
      setParams(
        (current) => {
          const copy = new URLSearchParams(current);
          if (draft) copy.set(key, draft);
          else copy.delete(key);
          copy.set("view", view);
          return copy;
        },
        { replace: true },
      );
    }, delay);
    return () => clearTimeout(timer);
  }, [draft, urlValue, key, setParams, view, delay]);
  return [draft, setDraft] as const;
}

/** Focuses `ref` when "/" is pressed outside of any text input, like Linear/GitHub search. */
export function useSlashFocus(ref: React.RefObject<HTMLInputElement | null>) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey)
        return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable)
        return;
      event.preventDefault();
      ref.current?.focus();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [ref]);
}

const CATALOGUE_STALE_TIME = 10 * 60 * 1000;

/**
 * Resolves the institution/provider name shown under an application's title.
 * The list/board endpoints only return catalogue IDs, so this fills in the
 * human-readable label by fetching the linked institution, programme, or
 * scholarship record (cached, deduped per id by React Query).
 */
export function useApplicationSubtitle(app: Application) {
  const embeddedName =
    app.institution_display_name ||
    app.programme_display_name ||
    app.scholarship_display_name;

  // Hooks are always called, in the same order, on every render — the
  // embedded-name fast path only skips the *query results*, never the
  // hook calls themselves (a real crash bug fixed here: this used to
  // `return` before these hooks when embeddedName was present).
  const institution = useQuery({
    queryKey: queryKeys.catalogueDetail("institutions", app.institution_id ?? ""),
    queryFn: () => catalogueApi.institution(app.institution_id!),
    enabled: !embeddedName && Boolean(app.institution_id),
    staleTime: CATALOGUE_STALE_TIME,
  });
  const programme = useQuery({
    queryKey: queryKeys.catalogueDetail("programmes", app.programme_id ?? ""),
    queryFn: () => catalogueApi.programme(app.programme_id!),
    enabled: !embeddedName && !app.institution_id && Boolean(app.programme_id),
    staleTime: CATALOGUE_STALE_TIME,
  });
  const scholarship = useQuery({
    queryKey: queryKeys.catalogueDetail("scholarships", app.scholarship_id ?? ""),
    queryFn: () => catalogueApi.scholarship(app.scholarship_id!),
    enabled: !embeddedName && !app.institution_id && Boolean(app.scholarship_id),
    staleTime: CATALOGUE_STALE_TIME,
  });
  const programmeInstitutionId = programme.data?.institution_id;
  const viaProgramme = useQuery({
    queryKey: queryKeys.catalogueDetail(
      "institutions",
      programmeInstitutionId ?? "",
    ),
    queryFn: () => catalogueApi.institution(programmeInstitutionId!),
    enabled: !embeddedName && Boolean(programmeInstitutionId),
    staleTime: CATALOGUE_STALE_TIME,
  });
  const scholarshipInstitutionId = scholarship.data?.institution_id;
  const viaScholarship = useQuery({
    queryKey: queryKeys.catalogueDetail(
      "institutions",
      scholarshipInstitutionId ?? "",
    ),
    queryFn: () => catalogueApi.institution(scholarshipInstitutionId!),
    enabled:
      !embeddedName && !scholarship.data?.provider_name && Boolean(scholarshipInstitutionId),
    staleTime: CATALOGUE_STALE_TIME,
  });

  if (embeddedName) return { name: embeddedName, isLoading: false };
  if (app.institution_id)
    return { name: institution.data?.name ?? null, isLoading: institution.isPending };
  if (app.programme_id) {
    if (programme.isPending) return { name: null, isLoading: true };
    return {
      name: programme.data?.name ?? viaProgramme.data?.name ?? null,
      isLoading: viaProgramme.isPending && Boolean(programmeInstitutionId),
    };
  }
  if (app.scholarship_id) {
    if (scholarship.isPending) return { name: null, isLoading: true };
    return {
      name:
        scholarship.data?.provider_name ??
        viaScholarship.data?.name ??
        scholarship.data?.name ??
        null,
      isLoading: viaScholarship.isPending && Boolean(scholarshipInstitutionId),
    };
  }
  return { name: null, isLoading: false };
}

/** Lazily fetches submission readiness for one application, only once requested. */
export function useApplicationReadiness(appId: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.readiness(appId),
    queryFn: () => applicationsApi.readiness(appId),
    enabled,
    staleTime: 60_000,
  });
}

export { useFocusTrap, useDismiss } from "../../lib/dom-hooks";
