import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { components } from "../generated/api/schema";
import {
  cacheApplicationDocumentLink,
  getApplicationRequirements,
  getApplicationTasks,
  invalidateApplicationResource,
  seedApplicationWorkspace,
  useApplicationRequirements,
  useApplicationTasks,
} from "../features/applications/applicationQueries";
import { queryKeys } from "../lib/api/queryKeys";

type S = components["schemas"];
const applicationId = "00000000-0000-4000-8000-000000000010";
const requirement = {
  id: "00000000-0000-4000-8000-000000000011",
  application_id: applicationId,
  requirement_type: "transcript",
  title: "Upload transcript",
  status: "not_started",
  required: true,
  owner: "student",
  validation_state: "unverified",
  validation_source: null,
  position: 0,
  version: 1,
  created_at: "2026-07-01T00:00:00Z",
} as S["RequirementResponse"];
const task = {
  id: "00000000-0000-4000-8000-000000000012",
  application_id: applicationId,
  title: "Request transcript",
  due_at: null,
  status: "open",
  position: 0,
  version: 1,
  created_at: "2026-07-01T00:00:00Z",
} as S["TaskResponse"];
const workspace = {
  application: {
    id: applicationId,
    title: "MSc AI",
    application_type: "programme",
    institution_id: null,
    programme_id: null,
    scholarship_id: null,
    stage: "preparing",
    priority: "normal",
    intake: null,
    primary_deadline_at: null,
    source_url: null,
    notes: null,
    tags: [],
    submitted_at: null,
    pre_archive_stage: null,
    version: 1,
    created_at: "2026-07-01T00:00:00Z",
    updated_at: "2026-07-01T00:00:00Z",
  },
  requirements: [requirement],
  tasks: [task],
  document_links: [],
  history: [],
  readiness: {
    application_id: applicationId,
    overall_state: "in_progress",
    readiness_percent: 0,
    blocking_issues: [],
    warnings: [],
    missing_required_documents: [],
    incomplete_requirements: [requirement.id],
    unresolved_eligibility_issues: [],
    deadline_state: "none",
    recommended_next_actions: [],
  },
} satisfies S["ApplicationWorkspaceResponse"];

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("application resource queries", () => {
  it("calls the dedicated generated-contract paths and forwards cancellation", async () => {
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        Response.json([]),
    );
    vi.stubGlobal("fetch", fetchMock);
    const controller = new AbortController();

    await getApplicationRequirements(applicationId, {
      signal: controller.signal,
    });
    await getApplicationTasks(applicationId, { signal: controller.signal });

    expect(String(fetchMock.mock.calls[0][0])).toMatch(
      new RegExp(`/applications/${applicationId}/requirements$`),
    );
    expect(String(fetchMock.mock.calls[1][0])).toMatch(
      new RegExp(`/applications/${applicationId}/tasks$`),
    );
    expect(fetchMock.mock.calls[0][1]?.signal).toBe(controller.signal);
    expect(fetchMock.mock.calls[1][1]?.signal).toBe(controller.signal);
  });

  it("seeds fresh granular caches without issuing redundant list requests", () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        Response.json([]),
    );
    vi.stubGlobal("fetch", fetchMock);
    seedApplicationWorkspace(client, applicationId, workspace);
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    const requirements = renderHook(
      () => useApplicationRequirements(applicationId),
      { wrapper },
    );
    const tasks = renderHook(() => useApplicationTasks(applicationId), {
      wrapper,
    });

    expect(requirements.result.current.data).toEqual([requirement]);
    expect(tasks.result.current.data).toEqual([task]);
    expect(fetchMock).not.toHaveBeenCalled();
    requirements.unmount();
    tasks.unmount();
    client.clear();
  });

  it("caches a successful document attachment for the application Documents tab", () => {
    const client = new QueryClient();
    const link = {
      id: "00000000-0000-4000-8000-000000000013",
      application_id: applicationId,
      document_id: "00000000-0000-4000-8000-000000000014",
      requirement_id: null,
      version: 1,
      created_at: "2026-07-22T00:00:00Z",
    } satisfies S["DocumentLinkResponse"];

    cacheApplicationDocumentLink(client, applicationId, link);
    cacheApplicationDocumentLink(client, applicationId, link);

    expect(
      client.getQueryData(queryKeys.applicationDocuments(applicationId)),
    ).toEqual([link]);
    client.clear();
  });

  it("loads a deep-linked resource independently", async () => {
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        Response.json([task]),
    );
    vi.stubGlobal("fetch", fetchMock);
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    const query = renderHook(() => useApplicationTasks(applicationId), {
      wrapper,
    });
    await waitFor(() => expect(query.result.current.isSuccess).toBe(true));

    expect(query.result.current.data).toEqual([task]);
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/tasks$/);
    query.unmount();
    client.clear();
  });

  it("invalidates every dependent cache for each resource", async () => {
    const client = new QueryClient();
    const keys = [
      queryKeys.workspace(applicationId),
      queryKeys.requirements(applicationId),
      queryKeys.tasks(applicationId),
      queryKeys.readiness(applicationId),
      queryKeys.dashboard,
      queryKeys.applicationHistory(applicationId),
    ];
    for (const key of keys) client.setQueryData(key, {});

    await invalidateApplicationResource(client, applicationId, "requirements");
    expect(
      client.getQueryState(queryKeys.requirements(applicationId))
        ?.isInvalidated,
    ).toBe(true);
    expect(
      client.getQueryState(queryKeys.readiness(applicationId))?.isInvalidated,
    ).toBe(true);

    for (const key of keys) client.setQueryData(key, {});
    await invalidateApplicationResource(client, applicationId, "tasks");
    expect(
      client.getQueryState(queryKeys.tasks(applicationId))?.isInvalidated,
    ).toBe(true);
    expect(
      client.getQueryState(queryKeys.workspace(applicationId))?.isInvalidated,
    ).toBe(true);
    expect(client.getQueryState(queryKeys.dashboard)?.isInvalidated).toBe(true);
    expect(
      client.getQueryState(queryKeys.applicationHistory(applicationId))
        ?.isInvalidated,
    ).toBe(true);
    expect(
      client.getQueryState(queryKeys.readiness(applicationId))?.isInvalidated,
    ).toBe(false);
    client.clear();
  });
});
