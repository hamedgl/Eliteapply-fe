import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Mic, Square, Upload } from "lucide-react";
import type { components } from "../../../generated/api/schema";
import { interviewsApi, uploadInterviewAudio } from "../../../lib/api/phase3";

type S = components["schemas"];
export type AudioType = S["InterviewAudioUploadRequest"]["content_type"];

const audioTypes: AudioType[] = [
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/x-m4a",
];

export function selectInterviewAudioType(
  supports = (type: string) => MediaRecorder.isTypeSupported(type),
) {
  return audioTypes.find(supports) ?? null;
}

const clock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

export function VoiceAnswer({
  interviewId,
  disabled,
  onComplete,
}: {
  interviewId: string;
  disabled: boolean;
  onComplete: () => void;
}) {
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [type, setType] = useState<AudioType | null>(null);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [audioId, setAudioId] = useState<string | null>(null);

  const status = useQuery({
    queryKey: ["interviews", interviewId, "audio", audioId],
    queryFn: ({ signal }) => interviewsApi.audio(interviewId, audioId!, signal),
    enabled: Boolean(audioId),
    refetchInterval: (query) =>
      document.hidden || ["completed", "failed"].includes(query.state.data?.status ?? "")
        ? false
        : 1800,
  });
  const previewUrl = useMemo(() => (blob ? URL.createObjectURL(blob) : ""), [blob]);

  useEffect(() => () => stream.current?.getTracks().forEach((track) => track.stop()), []);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);
  useEffect(() => {
    if (status.data?.turn_id) {
      setBlob(null);
      setAudioId(null);
      setConsent(false);
      onComplete();
    }
  }, [status.data?.turn_id, onComplete]);
  useEffect(() => {
    if (!recording) return;
    const timer = setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [recording]);

  async function start() {
    setError("");
    if (!("MediaRecorder" in window) || !navigator.mediaDevices?.getUserMedia)
      return setError("Voice recording is unavailable in this browser. Use the text answer instead.");
    const mime = selectInterviewAudioType();
    if (!mime)
      return setError("No supported audio format was found. Use the text answer instead.");
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunks.current = [];
      recorder.current = new MediaRecorder(stream.current, { mimeType: mime });
      recorder.current.ondataavailable = (event) => {
        if (event.data.size) chunks.current.push(event.data);
      };
      recorder.current.onstop = () => {
        setBlob(new Blob(chunks.current, { type: mime }));
        stream.current?.getTracks().forEach((track) => track.stop());
      };
      recorder.current.start();
      setType(mime);
      setElapsed(0);
      setRecording(true);
    } catch {
      setError("Microphone access was not granted. You can continue with the text answer.");
    }
  }

  function stop() {
    recorder.current?.stop();
    setRecording(false);
  }

  async function upload() {
    if (!blob || !type || !consent) return;
    setError("");
    setUploading(true);
    try {
      const result = await uploadInterviewAudio(interviewId, blob, type);
      setAudioId(result.id);
      if (result.turn_id) {
        setBlob(null);
        setConsent(false);
        onComplete();
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Audio could not be uploaded. Your recording is still here to retry.",
      );
    } finally {
      setUploading(false);
    }
  }

  const transcribing =
    Boolean(audioId) && !["completed", "failed"].includes(status.data?.status ?? "");

  return (
    <div className="iv-voice">
      <div className="iv-voice-head">
        <h3>Voice answer</h3>
        <p>Record in the browser, review it, then consent before it is uploaded and transcribed.</p>
      </div>

      <div className="iv-voice-controls">
        {!recording ? (
          <button type="button" className="iv-record" onClick={start} disabled={disabled || transcribing}>
            <Mic aria-hidden="true" /> Start recording
          </button>
        ) : (
          <button type="button" className="iv-record is-recording" onClick={stop}>
            <Square aria-hidden="true" /> Stop recording
            <span className="iv-record-time">{clock(elapsed)}</span>
          </button>
        )}
        {recording ? (
          <span className="iv-record-live" role="status">
            <span className="iv-record-dot" aria-hidden="true" />
            Recording
          </span>
        ) : null}
      </div>

      {blob ? (
        <div className="iv-voice-review">
          <audio controls src={previewUrl} />
          <label className="check">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
            />
            <span>
              I consent to this recording being uploaded and transcribed for interview feedback.
            </span>
          </label>
          <button
            className="primary"
            type="button"
            disabled={!consent || uploading || transcribing}
            onClick={upload}
          >
            <Upload aria-hidden="true" />
            {uploading ? "Uploading…" : "Upload for transcription"}
          </button>
        </div>
      ) : null}

      {transcribing ? (
        <p className="iv-voice-status" role="status">
          Transcribing your recording — feedback appears here when it finishes.
        </p>
      ) : null}
      {status.data?.status === "failed" ? (
        <p className="iv-voice-error" role="alert">
          That recording could not be transcribed. Record again or use the text answer.
        </p>
      ) : null}
      {error ? (
        <p className="iv-voice-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
