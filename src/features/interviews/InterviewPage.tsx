import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { components } from "../../generated/api/schema";
import { Select } from "../../components/ui/select";
import { applicationsApi } from "../../lib/api/phase2";
import { interviewsApi, uploadInterviewAudio } from "../../lib/api/phase3";
import { queryKeys } from "../../lib/api/queryKeys";
import { track } from "../../lib/analytics/track";

type S = components["schemas"];
type AudioType = S["InterviewAudioUploadRequest"]["content_type"];
const audioTypes: AudioType[] = ["audio/webm", "audio/mp4", "audio/mpeg", "audio/wav", "audio/x-m4a"];
export function selectInterviewAudioType(supports = (type: string) => MediaRecorder.isTypeSupported(type)) {
  return audioTypes.find(supports) ?? null;
}
const displayQuestion = (value: unknown) => typeof value === "string" ? value : value && typeof value === "object" ? String((value as Record<string, unknown>).question ?? (value as Record<string, unknown>).prompt ?? "Continue when you are ready.") : "Continue when you are ready.";

export function InterviewsPage() {
  const history = useInfiniteQuery({
    queryKey: queryKeys.interviews,
    queryFn: ({ pageParam }) => interviewsApi.list(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.next_cursor ?? undefined,
  });
  const items = history.data?.pages.flatMap((page) => page.items) ?? [];
  return <div className="page">
    <header className="page-heading"><div><h1>Interview practice</h1><p>Resume practice sessions, review feedback, and build confidence over time.</p></div><Link className="primary" to="/app/interviews/new">New session</Link></header>
    <div className="phase3-card-list">{items.map((item) => <Link className="phase3-card" key={item.id} to={`/app/interviews/${item.id}`}><span className="status-pill">{item.status.replaceAll("_", " ")}</span><h2>{item.interview_type.replaceAll("_", " ")}</h2><p>{item.mode} · Question {Math.min(item.current_question_index + 1, item.questions.length || 1)} of {item.questions.length || "—"}</p><time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString()}</time></Link>)}</div>
    {!history.isPending && !items.length ? <div className="phase3-empty"><h2>Your practice history starts here</h2><p>Create a session and EliteApply will preserve each turn and its feedback.</p><Link className="primary" to="/app/interviews/new">Start practicing</Link></div> : null}
    {history.hasNextPage ? <button className="load-more" onClick={() => history.fetchNextPage()} disabled={history.isFetchingNextPage}>Load older sessions</button> : null}
  </div>;
}

export function NewInterviewPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [applicationId, setApplicationId] = useState("");
  const applications = useQuery({ queryKey: queryKeys.applications, queryFn: () => applicationsApi.list() });
  const mutationId = useRef("");
  const create = useMutation({ mutationFn: interviewsApi.create, onSuccess: (session) => { mutationId.current = ""; void track("first_interview_session").catch(() => undefined); navigate(`/app/interviews/${session.id}`); }, onError: (caught) => setError(caught instanceof Error ? caught.message : "Could not start interview.") });
  useEffect(() => {
    if (!applicationId && applications.data?.items.length) setApplicationId(applications.data.items[0].id);
  }, [applications.data, applicationId]);
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!applicationId) { setError("Select an application first."); return; }
    const data = new FormData(event.currentTarget);
    create.mutate({ mutation_id: mutationId.current ||= crypto.randomUUID(), application_id: applicationId, interview_type: data.get("interview_type") as S["AcademicInterviewCreate"]["interview_type"], mode: data.get("mode") as S["AcademicInterviewCreate"]["mode"] });
  }
  return <div className="page"><Link to="/app/interviews">← Interview history</Link><h1>New practice session</h1><p>Choose the interview you want to rehearse. Questions and progression are owned by the service.</p><form className="settings-form" onSubmit={submit}>
    <label>Application
      {applications.data?.items.length ? (
        <Select
          value={applicationId}
          onChange={(val: any) => setApplicationId(typeof val === "string" ? val : (val?.target?.value ?? ""))}
          options={applications.data.items.map((application) => ({
            value: application.id,
            label: application.institution_name ? `${application.title} · ${application.institution_name}` : application.title,
          }))}
        />
      ) : (
        <p className="apps-dialog-subtext">{applications.isPending ? "Loading applications…" : "You don't have any applications yet."}</p>
      )}
    </label>
    <label>Interview type<Select name="interview_type" options={["undergraduate","graduate","mba","phd_supervisor","scholarship_panel","research_fellowship","visa_credibility","custom"].map((type) => ({ value: type, label: type.replaceAll("_", " ") }))} /></label>
    <label>Practice mode<Select name="mode" options={[{ value: "chat", label: "Chat" }, { value: "written", label: "Written" }, { value: "voice", label: "Voice with transcription" }]} /></label>
    <button className="primary" disabled={create.isPending || !applicationId}>{create.isPending ? "Preparing session…" : "Start session"}</button>{error ? <p role="alert">{error}</p> : null}
  </form></div>;
}

export function InterviewPage() {
  const { id = "" } = useParams(); const qc = useQueryClient();
  const session = useQuery({ queryKey: queryKeys.interview(id), queryFn: () => interviewsApi.get(id) });
  const turns = useQuery({ queryKey: queryKeys.interviewTurns(id), queryFn: () => interviewsApi.turns(id) });
  const report = useQuery({ queryKey: queryKeys.interviewReport(id), queryFn: () => interviewsApi.report(id), enabled: session.data?.status === "completed", retry: false });
  const [answer, setAnswer] = useState(""); const [error, setError] = useState("");
  const answerMutationId = useRef("");
  const refresh = useCallback(() => { void qc.invalidateQueries({ queryKey: queryKeys.interview(id) }); void qc.invalidateQueries({ queryKey: queryKeys.interviewTurns(id) }); }, [id, qc]);
  const submitAnswer = useMutation({ mutationFn: () => interviewsApi.answer(id, { mutation_id: answerMutationId.current ||= crypto.randomUUID(), answer }), onSuccess: () => { answerMutationId.current = ""; setAnswer(""); setError(""); refresh(); }, onError: (caught) => setError(caught instanceof Error ? caught.message : "Answer failed. Your text is still available to retry.") });
  const finish = useMutation({ mutationFn: interviewsApi.complete, onSuccess: refresh });
  const cancel = useMutation({ mutationFn: interviewsApi.cancel, onSuccess: refresh });
  if (session.isPending) return <div className="page" role="status">Restoring session…</div>;
  const current = session.data; if (!current) return <div className="page"><h1>Session unavailable</h1><Link to="/app/interviews">Return to history</Link></div>;
  const active = !["completed", "cancelled"].includes(current.status);
  const question = displayQuestion(current.current_question ?? current.questions[current.current_question_index]);
  return <div className="page interview-session">
    <header className="page-heading"><div><Link to="/app/interviews">← Practice history</Link><h1>{current.interview_type.replaceAll("_", " ")} practice</h1><p>{current.disclaimer}</p></div><span className="status-pill">{current.status.replaceAll("_", " ")}</span></header>
    {active ? <section><small>Question {current.current_question_index + 1} of {current.questions.length || "—"}</small><h2 className="interview-question">{question}</h2><form onSubmit={(event) => { event.preventDefault(); submitAnswer.mutate(); }}><label>Your answer<textarea value={answer} onChange={(event) => setAnswer(event.target.value)} minLength={2} required rows={9} /></label><button className="primary" disabled={submitAnswer.isPending}>{submitAnswer.isPending ? "Saving answer…" : "Submit answer"}</button></form>
      {current.mode === "voice" ? <VoiceAnswer interviewId={id} onComplete={refresh} /> : null}
      <div className="phase3-actions"><button onClick={() => confirm("Finish this session and generate its report?") && finish.mutate(id)}>Complete session</button><button className="danger" onClick={() => confirm("Cancel this practice session?") && cancel.mutate(id)}>Cancel session</button></div>{error ? <p role="alert">{error}</p> : null}</section> : null}
    {(turns.data ?? []).map((turn) => <article key={turn.id}><small>Question {turn.question_index + 1}</small><h2>{turn.question}</h2><p className="phase3-answer">{turn.answer}</p><h3>Feedback</h3><ObjectView value={turn.feedback} />{turn.contradiction_warnings.length ? <><h3>Warnings to review</h3><ObjectView value={turn.contradiction_warnings} /></> : null}</article>)}
    {current.status === "completed" ? <section className="phase3-panel"><h2>Practice report</h2>{report.isPending ? <p role="status">Preparing report…</p> : report.data ? <ObjectView value={report.data} /> : <p>The report is not available yet. Refresh shortly.</p>}</section> : null}
  </div>;
}

function VoiceAnswer({ interviewId, onComplete }: { interviewId: string; onComplete: () => void }) {
  const recorder = useRef<MediaRecorder | null>(null); const stream = useRef<MediaStream | null>(null); const chunks = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false); const [blob, setBlob] = useState<Blob | null>(null); const [type, setType] = useState<AudioType | null>(null); const [consent, setConsent] = useState(false); const [error, setError] = useState(""); const [audioId, setAudioId] = useState<string | null>(null);
  const status = useQuery({ queryKey: ["interviews", interviewId, "audio", audioId], queryFn: ({ signal }) => interviewsApi.audio(interviewId, audioId!, signal), enabled: Boolean(audioId), refetchInterval: (query) => document.hidden || ["completed", "failed"].includes(query.state.data?.status ?? "") ? false : 1800 });
  const previewUrl = useMemo(() => blob ? URL.createObjectURL(blob) : "", [blob]);
  useEffect(() => () => stream.current?.getTracks().forEach((track) => track.stop()), []);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);
  useEffect(() => { if (status.data?.turn_id) { setBlob(null); setAudioId(null); onComplete(); } }, [status.data?.turn_id, onComplete]);
  async function start() { setError(""); if (!("MediaRecorder" in window) || !navigator.mediaDevices?.getUserMedia) return setError("Voice recording is unavailable in this browser. Use the text answer instead."); const mime = selectInterviewAudioType(); if (!mime) return setError("No supported audio format was found. Use the text answer instead."); try { stream.current = await navigator.mediaDevices.getUserMedia({ audio: true }); chunks.current = []; recorder.current = new MediaRecorder(stream.current, { mimeType: mime }); recorder.current.ondataavailable = (event) => { if (event.data.size) chunks.current.push(event.data); }; recorder.current.onstop = () => { setBlob(new Blob(chunks.current, { type: mime })); stream.current?.getTracks().forEach((track) => track.stop()); }; recorder.current.start(); setType(mime); setRecording(true); } catch { setError("Microphone access was not granted. You can continue with the text answer."); } }
  function stop() { recorder.current?.stop(); setRecording(false); }
  async function upload() { if (!blob || !type || !consent) return; setError(""); try { const result = await uploadInterviewAudio(interviewId, blob, type); setAudioId(result.id); if (result.turn_id) { setBlob(null); onComplete(); } } catch (caught) { setError(caught instanceof Error ? caught.message : "Audio could not be uploaded. Your recording remains ready to retry."); } }
  return <div className="voice-recorder"><h3>Voice answer</h3><p>Record in your browser, then review and consent before upload. A text answer is always available above.</p>{!recording ? <button type="button" onClick={start}>Start recording</button> : <button type="button" onClick={stop}>Stop recording</button>}{blob ? <><audio controls src={previewUrl} /><label className="check"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />I consent to this recording being uploaded and transcribed for interview feedback.</label><button className="primary" type="button" disabled={!consent || status.isFetching} onClick={upload}>{status.isFetching ? "Processing…" : "Upload for transcription"}</button></> : null}{status.data ? <p role="status">Transcription status: {status.data.status}</p> : null}{error ? <p role="alert">{error}</p> : null}</div>;
}

function ObjectView({ value }: { value: unknown }) {
  if (Array.isArray(value)) return <ul>{value.map((item, index) => <li key={index}>{typeof item === "string" ? item : JSON.stringify(item)}</li>)}</ul>;
  if (value && typeof value === "object") return <dl className="phase3-object">{Object.entries(value as Record<string, unknown>).map(([key, item]) => <div key={key}><dt>{key.replaceAll("_", " ")}</dt><dd>{typeof item === "string" || typeof item === "number" ? String(item) : Array.isArray(item) ? item.join(", ") : JSON.stringify(item)}</dd></div>)}</dl>;
  return <p>{String(value ?? "Not available")}</p>;
}
