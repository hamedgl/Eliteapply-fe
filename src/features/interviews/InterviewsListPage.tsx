import { useEffect, useRef, useState } from "react";
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Mic, MessageSquare, Mic2, PenLine, Plus } from "lucide-react";
import type { components } from "../../generated/api/schema";
import { PageHeader } from "../../components/page/PageHeader";
import { StatusBadge } from "../../components/data-display/StatusBadge";
import { EmptyState } from "../../components/data-display/EmptyState";
import { ProgressBar } from "../../components/data-display/ProgressBar";
import { Select } from "../../components/ui/select";
import { applicationsApi } from "../../lib/api/phase2";
import { interviewsApi } from "../../lib/api/phase3";
import { queryKeys } from "../../lib/api/queryKeys";
import { track } from "../../lib/analytics/track";
import {
  answeredCount,
  interviewModeLabel,
  interviewModes,
  interviewTypeLabel,
  interviewTypes,
  progressPercent,
  questionTotal,
  relativeTime,
  statusLabel,
  statusTone,
  type InterviewMode,
  type InterviewType,
} from "./model";
import "../../styles/workspace.css";
import "./interviews.css";

type S = components["schemas"];

const modeIcons = { chat: MessageSquare, written: PenLine, voice: Mic2 } as const;
const modeIcon = (mode: string) =>
  modeIcons[mode as keyof typeof modeIcons] ?? MessageSquare;

export function InterviewsPage() {
  const navigate = useNavigate();
  const history = useInfiniteQuery({
    queryKey: queryKeys.interviews,
    queryFn: ({ pageParam }) => interviewsApi.list(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.next_cursor ?? undefined,
  });
  const items = history.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="page apps-page">
      <PageHeader
        title="Interview practice"
        description="Rehearse the interview, get structured feedback on every answer, and build confidence over time."
        meta={items.length ? `${items.length} session${items.length === 1 ? "" : "s"}` : undefined}
        actions={
          <Link className="primary" to="/app/interviews/new">
            <Plus aria-hidden="true" /> New session
          </Link>
        }
      />

      {history.isPending ? (
        <div className="apps-skeleton" aria-busy="true" aria-label="Loading practice history">
          <div className="apps-skeleton-table">
            {Array.from({ length: 3 }).map((_, index) => (
              <div className="skeleton apps-skeleton-row" key={index} />
            ))}
          </div>
        </div>
      ) : history.isError ? (
        <div className="apps-page-error" role="alert">
          <h2>We couldn’t load your practice history.</h2>
          <button className="primary" onClick={() => history.refetch()}>
            Try again
          </button>
        </div>
      ) : items.length ? (
        <>
          <ul className="iv-session-grid">
            {items.map((item) => {
              const ModeIcon = modeIcon(item.mode);
              const total = questionTotal(item);
              return (
                <li key={item.id}>
                  <Link className="apps-card iv-session-card" to={`/app/interviews/${item.id}`}>
                    <div className="iv-session-top">
                      <StatusBadge tone={statusTone(item.status)}>
                        {statusLabel(item.status)}
                      </StatusBadge>
                      <span className="iv-session-mode">
                        <ModeIcon aria-hidden="true" />
                        {interviewModeLabel(item.mode)}
                      </span>
                    </div>
                    <h2>{interviewTypeLabel(item.interview_type)}</h2>
                    <ProgressBar
                      percent={progressPercent(item)}
                      label={`${interviewTypeLabel(item.interview_type)} progress`}
                    />
                    <p className="iv-session-meta">
                      {total
                        ? `${answeredCount(item)} of ${total} questions answered`
                        : "No questions generated"}
                    </p>
                    <time dateTime={item.created_at}>{relativeTime(item.created_at)}</time>
                  </Link>
                </li>
              );
            })}
          </ul>
          {history.hasNextPage ? (
            <button
              className="iv-load-more"
              onClick={() => history.fetchNextPage()}
              disabled={history.isFetchingNextPage}
            >
              {history.isFetchingNextPage ? "Loading…" : "Load older sessions"}
            </button>
          ) : null}
        </>
      ) : (
        <EmptyState
          icon={Mic}
          heading="Your practice history starts here"
          description="Create a session and EliteApply keeps every question, answer and piece of feedback."
          primaryAction={{
            label: "Start practicing",
            onClick: () => navigate("/app/interviews/new"),
          }}
        />
      )}
    </div>
  );
}

export function NewInterviewPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [applicationId, setApplicationId] = useState("");
  const [interviewType, setInterviewType] = useState<InterviewType>("graduate");
  const [mode, setMode] = useState<InterviewMode>("chat");
  const applications = useQuery({
    queryKey: queryKeys.applications,
    queryFn: () => applicationsApi.list(),
  });
  const mutationId = useRef("");
  const create = useMutation({
    mutationFn: interviewsApi.create,
    onSuccess: (session) => {
      mutationId.current = "";
      void track("first_interview_session").catch(() => undefined);
      navigate(`/app/interviews/${session.id}`);
    },
    onError: (caught) =>
      setError(caught instanceof Error ? caught.message : "Could not start interview."),
  });

  // `?.items?.` deliberately: a malformed/empty list body used to crash the whole
  // page here rather than fall through to the "no applications yet" state.
  useEffect(() => {
    const first = applications.data?.items?.[0];
    if (!applicationId && first) setApplicationId(first.id);
  }, [applications.data, applicationId]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!applicationId) {
      setError("Select an application first.");
      return;
    }
    setError("");
    create.mutate({
      mutation_id: (mutationId.current ||= crypto.randomUUID()),
      application_id: applicationId,
      interview_type: interviewType,
      mode,
    } satisfies S["AcademicInterviewCreate"]);
  }

  const noApplications = !applications.isPending && !applications.data?.items?.length;

  return (
    <div className="page apps-page">
      <Link className="iv-back" to="/app/interviews">
        <ArrowLeft aria-hidden="true" /> Practice history
      </Link>
      <PageHeader
        title="New practice session"
        description="Pick the interview you want to rehearse. EliteApply generates the questions from this application and your academic profile."
      />

      <form className="apps-card iv-new-form" onSubmit={submit}>
        <fieldset>
          <legend>Application</legend>
          {noApplications ? (
            <p className="iv-new-empty">
              You need an application first — questions are generated from its details.{" "}
              <Link to="/app/applications">Add an application</Link>
            </p>
          ) : (
            <Select
              value={applicationId}
              ariaLabel="Application"
              placeholder={applications.isPending ? "Loading applications…" : "Select…"}
              onChange={(val: unknown) =>
                setApplicationId(typeof val === "string" ? val : "")
              }
              options={(applications.data?.items ?? []).map((application) => ({
                value: application.id,
                label: application.institution_name
                  ? `${application.title} · ${application.institution_name}`
                  : application.title,
              }))}
            />
          )}
        </fieldset>

        <fieldset>
          <legend>Interview type</legend>
          <div className="iv-choice-grid">
            {interviewTypes.map((option) => (
              <label
                className={`iv-choice${interviewType === option.value ? " is-selected" : ""}`}
                key={option.value}
              >
                <input
                  type="radio"
                  name="interview_type"
                  value={option.value}
                  checked={interviewType === option.value}
                  onChange={() => setInterviewType(option.value)}
                />
                <span className="iv-choice-label">{option.label}</span>
                <span className="iv-choice-hint">{option.hint}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>Practice mode</legend>
          <div className="iv-choice-grid is-modes">
            {interviewModes.map((option) => {
              const ModeIcon = modeIcon(option.value);
              return (
                <label
                  className={`iv-choice${mode === option.value ? " is-selected" : ""}`}
                  key={option.value}
                >
                  <input
                    type="radio"
                    name="mode"
                    value={option.value}
                    checked={mode === option.value}
                    onChange={() => setMode(option.value)}
                  />
                  <span className="iv-choice-label">
                    <ModeIcon aria-hidden="true" />
                    {option.label}
                  </span>
                  <span className="iv-choice-hint">{option.hint}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {error ? (
          <p className="iv-form-error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="iv-new-actions">
          <button className="primary" disabled={create.isPending || !applicationId}>
            {create.isPending ? "Preparing session…" : "Start session"}
          </button>
          <p>Practice feedback never predicts or guarantees an admissions outcome.</p>
        </div>
      </form>
    </div>
  );
}
