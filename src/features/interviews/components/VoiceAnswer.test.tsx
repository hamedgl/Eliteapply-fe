import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  MAX_RECORDING_SECONDS,
  selectInterviewAudioType,
  VoiceAnswer,
} from "./VoiceAnswer";

describe("selectInterviewAudioType", () => {
  it("picks the first type the browser reports as supported", () => {
    const supports = (type: string) => type === "audio/mp4";
    expect(selectInterviewAudioType(supports)).toBe("audio/mp4");
  });

  it("returns null when the browser supports none of the candidate types", () => {
    expect(selectInterviewAudioType(() => false)).toBeNull();
  });

  it("prefers webm over later candidates when both are supported", () => {
    const supports = () => true;
    expect(selectInterviewAudioType(supports)).toBe("audio/webm");
  });
});

describe("MAX_RECORDING_SECONDS", () => {
  it("is a positive, sane ceiling for a single interview answer", () => {
    expect(MAX_RECORDING_SECONDS).toBeGreaterThan(0);
    expect(MAX_RECORDING_SECONDS).toBeLessThanOrEqual(1800);
  });
});

class FakeMediaRecorder {
  static isTypeSupported = () => true;
  static lastInstance: FakeMediaRecorder | null = null;
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: (() => void) | null = null;
  state: "recording" | "inactive" = "inactive";
  constructor() {
    FakeMediaRecorder.lastInstance = this;
  }
  start() {
    this.state = "recording";
  }
  stop() {
    this.state = "inactive";
    this.onstop?.();
  }
}

function renderVoiceAnswer() {
  (window as unknown as { MediaRecorder: unknown }).MediaRecorder = FakeMediaRecorder;
  const stopTrack = vi.fn();
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: {
      getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop: stopTrack }] }),
    },
  });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <VoiceAnswer interviewId="iv-1" disabled={false} onComplete={vi.fn()} />
    </QueryClientProvider>,
  );
}

describe("VoiceAnswer recording safety", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("discards the recording instead of publishing it for upload after a recorder error", async () => {
    renderVoiceAnswer();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /start recording/i }));
    });

    const recorder = FakeMediaRecorder.lastInstance!;
    await act(async () => {
      recorder.onerror?.();
      recorder.ondataavailable?.({ data: new Blob(["partial"]) });
      recorder.onstop?.();
    });

    expect(
      screen.getByText(/recording failed unexpectedly/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/upload for transcription/i)).not.toBeInTheDocument();
  });

  it("stops on the very first tick once wall-clock time has passed the cap, even if ticks were throttled", async () => {
    vi.useFakeTimers();
    renderVoiceAnswer();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /start recording/i }));
    });

    // Simulate a throttled/frozen background tab: wall-clock jumps far past
    // the cap before a single interval callback gets to run.
    vi.setSystemTime(Date.now() + (MAX_RECORDING_SECONDS + 120) * 1000);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(screen.getByText(/stopped automatically at the/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start recording/i })).toBeInTheDocument();
  });
});
