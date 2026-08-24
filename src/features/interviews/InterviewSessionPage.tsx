import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "../../components/page/PageHeader";
import { GeneratedPageSkeleton, SectionSkeleton } from "../../components/page/PageSkeleton";
import { StatusBadge } from "../../components/data-display/StatusBadge";
import { ProgressBar } from "../../components/data-display/ProgressBar";
import { ConfirmationDialog } from "../../components/actions/ConfirmationDialog";
import { AiNotice } from "../../components/common/AiNotice";
import { interviewsApi } from "../../lib/api/phase3";
import { queryKeys } from "../../lib/api/queryKeys";
import { InterviewFeedback } from "./components/InterviewFeedback";
import { InterviewReportPanel } from "./components/InterviewReport";
import { VoiceAnswer } from "./components/VoiceAnswer";
import {
  answeredCount,
  currentQuestion,
  customFocus,
  interviewModeLabel,
  interviewTypeLabel,
  isActive,
  progressPercent,
  questionCategory,
  questionTotal,
  relativeTime,
  statusLabel,
  statusTone,
} from "./model";
import "../../styles/workspace.css";
import "./interviews.css";
import "./interview-session.css";

/** Matches InterviewAnswer.answer in the API schema. */
const ANSWER_MAX = 20_000;

export function InterviewPage() {
  const { id = "" } = useParams();
  const qc = useQueryClient();
  const session = useQuery({ queryKey: queryKeys.interview(id), queryFn: () => interviewsApi.get(id) });
  const turns = useQuery({ queryKey: queryKeys.interviewTurns(id), queryFn: () => interviewsApi.turns(id) });
  const report = useQuery({
    queryKey: queryKeys.interviewReport(id),
    queryFn: () => interviewsApi.report(id),
    enabled: session.data?.status === "completed",
    retry: false,
  });

  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState<"complete" | "cancel" | null>(null);
  const answerMutationId = useRef("");
  const composerRef = useRef<HTMLDivElement>(null);
  const turnCount = turns.data?.length ?? 0;
  const seenTurns = useRef(turnCount);

  const refresh = useCallback(() => {
    void qc.invalidateQueries({ queryKey: queryKeys.interview(id) });
    void qc.invalidateQueries({ queryKey: queryKeys.interviewTurns(id) });
    void qc.invalidateQueries({ queryKey: queryKeys.interviews });
  }, [id, qc]);

  const submitAnswer = useMutation({
    mutationFn: (text: string) =>
      interviewsApi.answer(id, {
        mutation_id: (answerMutationId.current ||= crypto.randomUUID()),
        answer: text,
      }),
    onSuccess: () => {
      // Only clear the retry id once the turn is recorded: reusing it on retry is
      // what makes a failed-but-applied answer idempotent instead of double-scored.
      answerMutationId.current = "";
      setAnswer("");
      setError("");
      refresh();
    },
    onError: (caught) =>
      setError(
        caught instanceof Error
          ? caught.message
          : "That answer could not be saved. Your text is still here — try again.",
      ),
  });
  const finish = useMutation({
    mutationFn: () => interviewsApi.complete(id),
    onSuccess: () => {
      setConfirming(null);
      refresh();
    },
    onError: () => setConfirming(null),
  });
  const cancel = useMutation({
    mutationFn: () => interviewsApi.cancel(id),
    onSuccess: () => {
      setConfirming(null);
      refresh();
    },
    onError: () => setConfirming(null),
  });

  // Bring the newest exchange into view after a turn lands (text or transcribed voice).
  useEffect(() => {
    if (turnCount > seenTurns.current) composerRef.current?.scrollIntoView({ block: "nearest" });
    seenTurns.current = turnCount;
  }, [turnCount]);

  if (session.isPending)
    return <GeneratedPageSkeleton page="interviewDetail" />;

  if (session.isError || !session.data)
    return (
      <div className="page apps-page">
        <div className="apps-page-error" role="alert">
          <h1>We couldn’t open this practice session.</h1>
          <p>It may have been removed, or the connection dropped.</p>
          <div className="iv-error-actions">
            <button className="primary" onClick={() => session.refetch()}>
              Try again
            </button>
            <Link to="/app/interviews">Back to history</Link>
          </div>
        </div>
      </div>
    );

  const interview = session.data;
  const active = isActive(interview.status);
  const question = currentQuestion(interview);
  const category = questionCategory(
    interview.current_question ?? interview.questions[interview.current_question_index],
  );
  const total = questionTotal(interview);
  const answered = answeredCount(interview);
  // Active with nothing left to ask: the session finished but wasn't closed out.
  // Older sessions can be stuck here, so offer the one action that resolves it.
  const awaitingCompletion = active && !question;
  const scenario = customFocus(interview);
  const trimmed = answer.trim();
  const overLimit = trimmed.length > ANSWER_MAX;

  return (
    <div className="page apps-page">
      <Link className="apps-back-link" to="/app/interviews">
        <ArrowLeft aria-hidden="true" /> Practice history
      </Link>
      <PageHeader
        title={`${interviewTypeLabel(interview.interview_type)} practice`}
        description={`${interviewModeLabel(interview.mode)} · started ${relativeTime(interview.created_at)}`}
        onRefresh={() =>
          void Promise.all([
            session.refetch(),
            turns.refetch(),
            ...(interview.status === "completed" ? [report.refetch()] : []),
          ])
        }
        refreshing={
          session.isFetching || turns.isFetching || report.isFetching
        }
        actions={<StatusBadge tone={statusTone(interview.status)}>{statusLabel(interview.status)}</StatusBadge>}
      />

      <div className="iv-layout">
        <main className="iv-thread">
          {interview.status === "completed" ? (
            report.isPending ? (
              <SectionSkeleton label="Preparing interview report" variant="fields" rows={6} />
            ) : report.data ? (
              <InterviewReportPanel report={report.data} />
            ) : (
              <p className="iv-notice" role="status">
                The report isn’t available yet.{" "}
                <button type="button" className="apps-inline-link" onClick={() => report.refetch()}>
                  Refresh
                </button>
              </p>
            )
          ) : null}

          {interview.status === "cancelled" ? (
            <p className="iv-notice is-muted" role="status">
              <Ban aria-hidden="true" />
              This session was cancelled. Your answers and feedback below are kept for reference.
            </p>
          ) : null}

          <ol className="iv-transcript">
            {(turns.data ?? []).map((turn, index) => (
              <li key={turn.id}>
                <article className="iv-exchange">
                  <div className="iv-bubble is-question">
                    <span className="iv-bubble-role">
                      <MessageSquare aria-hidden="true" />
                      Interviewer · question {turn.question_index + 1}
                    </span>
                    <p>{turn.question}</p>
                  </div>
                  <div className="iv-bubble is-answer">
                    <span className="iv-bubble-role">Your answer</span>
                    <p>{turn.answer}</p>
                  </div>
                  <InterviewFeedback turn={turn} defaultOpen={index === turnCount - 1} />
                </article>
              </li>
            ))}
          </ol>

          {turns.isPending && !turnCount ? (
            <SectionSkeleton label="Loading interview answers" rows={3} />
          ) : null}

          <div ref={composerRef}>
            {awaitingCompletion ? (
              <section className="apps-card iv-finish-card">
                <CheckCircle2 aria-hidden="true" />
                <h2>You’ve answered every question</h2>
                <p>
                  Generate the report to see your scores across the session, the strengths worth
                  keeping, and what to work on next.
                </p>
                <button
                  className="primary"
                  onClick={() => finish.mutate()}
                  disabled={finish.isPending}
                >
                  {finish.isPending ? "Generating report…" : "Finish and see report"}
                </button>
                {finish.isError ? (
                  <p className="iv-form-error" role="alert">
                    The report could not be generated. Try again in a moment.
                  </p>
                ) : null}
              </section>
            ) : active && question ? (
              <section className="apps-card iv-composer">
                <div className="iv-composer-question">
                  <span className="iv-bubble-role">
                    <Sparkles aria-hidden="true" />
                    Question {answered + 1}
                    {total ? ` of ${total}` : ""}
                    {category ? ` · ${category}` : ""}
                  </span>
                  <h2>{question}</h2>
                </div>

                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (trimmed.length < 2 || overLimit) return;
                    submitAnswer.mutate(trimmed);
                  }}
                >
                  <label htmlFor="iv-answer">Your answer</label>
                  <textarea
                    id="iv-answer"
                    value={answer}
                    onChange={(event) => setAnswer(event.target.value)}
                    onKeyDown={(event) => {
                      if ((event.metaKey || event.ctrlKey) && event.key === "Enter")
                        event.currentTarget.form?.requestSubmit();
                    }}
                    rows={7}
                    placeholder="Answer as you would out loud — situation, what you did, the outcome, and what you took from it."
                    disabled={submitAnswer.isPending}
                  />
                  <div className="iv-composer-foot">
                    <span className={`iv-count${overLimit ? " is-over" : ""}`}>
                      {trimmed.length.toLocaleString()} / {ANSWER_MAX.toLocaleString()}
                    </span>
                    <span className="iv-composer-hint">⌘/Ctrl + Enter to submit</span>
                    <button
                      className="primary"
                      disabled={submitAnswer.isPending || trimmed.length < 2 || overLimit}
                    >
                      {submitAnswer.isPending ? (
                        <>
                          <Loader2 aria-hidden="true" className="iv-spin" /> Evaluating…
                        </>
                      ) : (
                        <>
                          <Send aria-hidden="true" /> Submit answer
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {overLimit ? (
                  <p className="iv-form-error" role="alert">
                    That answer is longer than {ANSWER_MAX.toLocaleString()} characters. Trim it
                    before submitting.
                  </p>
                ) : null}
                {error ? (
                  <p className="iv-form-error" role="alert">
                    {error}
                  </p>
                ) : null}

                {interview.mode === "voice" ? (
                  <VoiceAnswer
                    interviewId={id}
                    disabled={submitAnswer.isPending}
                    onComplete={refresh}
                  />
                ) : null}
              </section>
            ) : null}
          </div>
        </main>

        <aside className="iv-rail">
          <div className="apps-card iv-progress-card">
            <div className="iv-progress-head">
              <h2>Progress</h2>
              <span>
                {answered}
                <em> / {total || "—"}</em>
              </span>
            </div>
            <ProgressBar percent={progressPercent(interview)} label="Session progress" />
            <p className="iv-progress-meta">
              {interview.status === "completed"
                ? "Session complete — report generated."
                : interview.status === "cancelled"
                  ? "Session cancelled."
                  : awaitingCompletion
                    ? "All questions answered. Generate the report to finish."
                    : `${Math.max(total - answered, 0)} question${total - answered === 1 ? "" : "s"} left.`}
            </p>
          </div>

          {scenario ? (
            <div className="apps-card iv-scenario-card">
              <h2>Your scenario</h2>
              <p>{scenario}</p>
            </div>
          ) : null}

          {active ? (
            <div className="apps-card iv-actions-card">
              <h2>Session</h2>
              <button
                type="button"
                onClick={() => setConfirming("complete")}
                disabled={finish.isPending}
              >
                {finish.isPending ? "Finishing…" : "Finish and generate report"}
              </button>
              <button
                type="button"
                className="iv-danger-link"
                onClick={() => setConfirming("cancel")}
                disabled={cancel.isPending}
              >
                {cancel.isPending ? "Cancelling…" : "Cancel session"}
              </button>
            </div>
          ) : null}

          <AiNotice>
            Questions, scores and coaching feedback in this session are
            generated by an AI model. It is not a human interviewer, an
            admissions officer or a predictor of any decision.
          </AiNotice>
          <p className="iv-disclaimer">{interview.disclaimer}</p>
        </aside>
      </div>

      {confirming === "complete" ? (
        <ConfirmationDialog
          title="Finish this practice session?"
          confirmLabel="Finish and generate report"
          pendingLabel="Generating report…"
          pending={finish.isPending}
          danger={false}
          onCancel={() => setConfirming(null)}
          onConfirm={() => finish.mutate()}
        >
          <p>
            The report is generated from the {answered} answer{answered === 1 ? "" : "s"} recorded so
            far and cannot be changed afterwards. You won’t be able to answer the remaining
            questions in this session.
          </p>
        </ConfirmationDialog>
      ) : null}
      {confirming === "cancel" ? (
        <ConfirmationDialog
          title="Cancel this practice session?"
          confirmLabel="Cancel session"
          cancelLabel="Keep practicing"
          pendingLabel="Cancelling…"
          pending={cancel.isPending}
          onCancel={() => setConfirming(null)}
          onConfirm={() => cancel.mutate()}
        >
          <p>
            No report is generated for a cancelled session. Your answers and their feedback stay
            available to read.
          </p>
        </ConfirmationDialog>
      ) : null}
    </div>
  );
}
