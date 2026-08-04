import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';
import { loadFaceModels, getFaceDescriptor } from '@/lib/faceEngine';
import { loadFaceLandmarker, detectFrame } from '@/lib/faceMesh';
import { createStrikeTracker, createViolationPolicy, type ConfirmedViolation } from '@/utils/proctorEngine';
import {
  fetchRoundQuestions,
  startTechnicalRound,
  submitTechnicalRound,
  submitRoundResponses,
  recordRoundScore,
  scoreAnswer,
  EXAM_TYPE_LABELS,
  type QuestionBankRow,
  type RoundName,
} from '@/lib/examRounds';
import RoundView from './RoundView';
import LiveInterviewRound from './LiveInterviewRound';
import ExamResults from './ExamResults';

interface ExamRunnerProps {
  sessionId: string;
  screenStream: MediaStream;
  micStream: MediaStream;
  onExamComplete: () => void;
}

interface SessionInfo {
  companyId: string;
  currentRound: RoundName | null;
  status: string;
}

interface CompanyDurations {
  name: string;
  technicalDurationMin: number;
  personalDurationMin: number;
  hrDurationMin: number;
}

interface DisplayedViolation extends ConfirmedViolation {
  id: number;
}

interface TabSwitchNotice {
  remaining: number;
  exceeded: boolean;
}

const PRESENCE_CHECK_MS = 1000;
const IDENTITY_CHECK_MS = 8000;
const MAX_YAW_DEG = 30;
const MAX_PITCH_DEG = 25;
const NO_FACE_WARNINGS_BEFORE_CANCEL = 3;
const AUDIO_CHECK_MS = 1500;
// Tab switching gets its own chance-based limit rather than feeding the shared violationPolicy
// pool below — it's by far the most common candidate action, so mixing it into the same
// 10-strike counter as webcam-based warnings made that counter (and the alert stack) fire
// constantly. Every switch shows a dedicated "N chances left" notice; the (LIMIT+1)th ends it.
const TAB_SWITCH_LIMIT = 5;
const LIVE_VIOLATION_DISPLAY_MS = 6000;
const TAB_SWITCH_NOTICE_DISPLAY_MS = 8000;

const TAB_SWITCH_RULES = [
  'Do not switch tabs, minimize the browser, or open another application during the exam.',
  `You are allowed up to ${TAB_SWITCH_LIMIT} tab switches for this round.`,
  'Exceeding the limit automatically submits your exam and ends the session.',
  'The timer keeps running in the background — switching tabs does not pause it.',
];
// 0-255 scale from AnalyserNode.getByteFrequencyData's average — sustained speech/loud noise
// reliably sits well above ambient room/keyboard noise at this threshold.
const LOUD_AUDIO_THRESHOLD = 50;

function captureBase64Jpeg(video: HTMLVideoElement, canvas: HTMLCanvasElement): string | null {
  canvas.width = video.videoWidth || 320;
  canvas.height = video.videoHeight || 240;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  // dataURL is "data:image/jpeg;base64,<...>" — server only wants the payload after the comma.
  return canvas.toDataURL('image/jpeg', 0.7).split(',')[1] ?? null;
}

/**
 * Owns the camera + continuous proctoring for the exam session and renders the single exam
 * type (technical/personal/hr) the candidate chose, persisting every answer to examResponses.
 */
const ExamRunner = ({ sessionId, screenStream, micStream, onExamComplete }: ExamRunnerProps) => {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [durations, setDurations] = useState<CompanyDurations | null>(null);
  const [questions, setQuestions] = useState<QuestionBankRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [ended, setEnded] = useState<'submitted' | 'auto_submitted' | null>(null);
  const [liveViolations, setLiveViolations] = useState<DisplayedViolation[]>([]);
  const [tabSwitchNotice, setTabSwitchNotice] = useState<TabSwitchNotice | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const strikeTracker = useRef(createStrikeTracker());
  // Dedicated, faster-confirming tracker for NO_FACE only (2 consecutive checks ≈ 2s instead of
  // the shared 3s debounce) — the 3-cancellation-warnings feature should feel responsive rather
  // than needing a full 3s stare-down before the very first warning even shows.
  const noFaceStrikeTracker = useRef(createStrikeTracker(2));
  // Own tracker for sustained loud audio, on its own 1.5s cadence rather than the 1s webcam loop.
  const audioStrikeTracker = useRef(createStrikeTracker());
  const violationPolicy = useRef(createViolationPolicy());
  const noFaceCount = useRef(0);
  const tabSwitchCount = useRef(0);
  const tabSwitchNoticeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const violationIdCounter = useRef(0);
  const presenceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const identityIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const endedRef = useRef(false);
  // The mount effect below (and the intervals it sets up) only ever sees the `session` value
  // from when it ran, so this ref is how the audio-check interval reads which round is *actually*
  // current without needing to tear down and recreate the interval on every round change.
  const currentRoundRef = useRef<RoundName | null>(null);

  useEffect(() => {
    currentRoundRef.current = session?.currentRound ?? null;
  }, [session?.currentRound]);

  const stopEverything = useCallback(() => {
    if (presenceIntervalRef.current) clearInterval(presenceIntervalRef.current);
    if (identityIntervalRef.current) clearInterval(identityIntervalRef.current);
    if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    if (tabSwitchNoticeTimeout.current) clearTimeout(tabSwitchNoticeTimeout.current);
    audioContextRef.current?.close().catch(() => {});
    streamRef.current?.getTracks().forEach((t) => t.stop());
    screenStream.getTracks().forEach((t) => t.stop());
    micStream.getTracks().forEach((t) => t.stop());
  }, [screenStream, micStream]);

  // Auto-dismissing rather than piling up forever — with continuous webcam-based checks running
  // every second, a permanent stack of alert boxes very quickly buries the actual exam content.
  const pushLiveViolation = useCallback((violation: ConfirmedViolation) => {
    const id = ++violationIdCounter.current;
    setLiveViolations((prev) => [...prev, { ...violation, id }]);
    setTimeout(() => {
      setLiveViolations((prev) => prev.filter((v) => v.id !== id));
    }, LIVE_VIOLATION_DISPLAY_MS);
  }, []);

  const recordViolation = useCallback(
    async (violation: ConfirmedViolation) => {
      if (endedRef.current) return;

      // Face-not-visible gets its own dedicated 3-strike cancellation, independent of the
      // general mixed-violation policy below (which still governs multiple-faces, looking-away,
      // and identity-mismatch at their existing warn/auto-submit thresholds). Tab-hidden has its
      // own separate chance-based flow entirely — see handleTabHidden.
      if (violation.type === 'NO_FACE') {
        noFaceCount.current += 1;
        const count = noFaceCount.current;
        const cancelling = count >= NO_FACE_WARNINGS_BEFORE_CANCEL;
        const displayed: ConfirmedViolation = {
          ...violation,
          message: cancelling
            ? `Face not visible (warning ${count} of ${NO_FACE_WARNINGS_BEFORE_CANCEL}) — exam cancelled.`
            : `Warning ${count} of ${NO_FACE_WARNINGS_BEFORE_CANCEL}: face not visible. The exam is cancelled after ${NO_FACE_WARNINGS_BEFORE_CANCEL} such warnings.`,
        };
        pushLiveViolation(displayed);

        if (!canvasRef.current) canvasRef.current = document.createElement('canvas');
        const snapshotBase64 = videoRef.current ? captureBase64Jpeg(videoRef.current, canvasRef.current) : null;
        // A transient failure here must not silently drop the strike count towards cancellation
        // below — log it and keep going rather than letting the throw skip the rest of this fn.
        await apiPost(`/api/exam/sessions/${sessionId}/violations`, {
          type: violation.type,
          severity: violation.severity,
          message: displayed.message,
          snapshotBase64,
        }).catch((err) => console.error('Failed to persist violation:', err));

        if (cancelling) {
          endedRef.current = true;
          stopEverything();
          await apiPost(`/api/exam/sessions/${sessionId}/auto-submit`);
          setEnded('auto_submitted');
        }
        return;
      }

      pushLiveViolation(violation);

      if (!canvasRef.current) canvasRef.current = document.createElement('canvas');
      const snapshotBase64 = videoRef.current ? captureBase64Jpeg(videoRef.current, canvasRef.current) : null;

      await apiPost(`/api/exam/sessions/${sessionId}/violations`, {
        type: violation.type,
        severity: violation.severity,
        message: violation.message,
        snapshotBase64,
      }).catch((err) => console.error('Failed to persist violation:', err));

      const policyResult = violationPolicy.current.record();
      if (policyResult.shouldAutoSubmit) {
        endedRef.current = true;
        stopEverything();
        await apiPost(`/api/exam/sessions/${sessionId}/auto-submit`);
        setEnded('auto_submitted');
      }
    },
    [sessionId, stopEverything, pushLiveViolation],
  );

  // Tab switching is by far the most common candidate action during a real exam, so it gets its
  // own chance-based limit and a dedicated, clear notice — separate from the generic (and much
  // noisier) webcam-based violation stack above — rather than silently eating into that pool.
  const handleTabHidden = useCallback(() => {
    if (!document.hidden || endedRef.current) return;

    tabSwitchCount.current += 1;
    const count = tabSwitchCount.current;
    const exceeded = count > TAB_SWITCH_LIMIT;

    (async () => {
      if (!canvasRef.current) canvasRef.current = document.createElement('canvas');
      const snapshotBase64 = videoRef.current ? captureBase64Jpeg(videoRef.current, canvasRef.current) : null;
      await apiPost(`/api/exam/sessions/${sessionId}/violations`, {
        type: 'TAB_HIDDEN',
        severity: exceeded ? 'critical' : 'warning',
        message: `Browser tab lost focus or was hidden (switch ${count} of ${TAB_SWITCH_LIMIT}).`,
        snapshotBase64,
      }).catch((err) => console.error('Failed to persist violation:', err));
    })();

    if (tabSwitchNoticeTimeout.current) clearTimeout(tabSwitchNoticeTimeout.current);

    if (exceeded) {
      setTabSwitchNotice({ remaining: 0, exceeded: true });
      endedRef.current = true;
      stopEverything();
      apiPost(`/api/exam/sessions/${sessionId}/auto-submit`).then(() => setEnded('auto_submitted'));
      return;
    }

    const remaining = TAB_SWITCH_LIMIT - count;
    setTabSwitchNotice({ remaining, exceeded: false });
    tabSwitchNoticeTimeout.current = setTimeout(() => setTabSwitchNotice(null), TAB_SWITCH_NOTICE_DISPLAY_MS);
  }, [sessionId, stopEverything]);

  // Load session + camera + models once.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { session: sessionRow } = await apiGet<{ session: SessionInfo }>(`/api/exam/sessions/${sessionId}`);
      if (cancelled || !sessionRow) return;
      setSession(sessionRow);

      const { company } = await apiGet<{ company: CompanyDurations }>(`/api/companies/${sessionRow.companyId}`);
      if (!cancelled && company) setDurations(company);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;

      const landmarker = await loadFaceLandmarker();
      await loadFaceModels();
      if (cancelled) return;

      presenceIntervalRef.current = setInterval(() => {
        if (!videoRef.current || endedRef.current) return;
        const frame = detectFrame(landmarker, videoRef.current, performance.now());
        // Not a real reading (video frame not decoded yet, or the detector hit a transient
        // error) — skip this tick's strike/clear bookkeeping entirely rather than letting it
        // count as either a pass or a fail.
        if (!frame.ok) return;

        if (frame.faceCount === 0) {
          strikeTracker.current.clear('MULTIPLE_FACES');
          strikeTracker.current.clear('LOOKING_AWAY');
          const confirmed = noFaceStrikeTracker.current.strike('NO_FACE');
          if (confirmed) recordViolation(confirmed);
          return;
        }
        noFaceStrikeTracker.current.clear('NO_FACE');

        if (frame.faceCount > 1) {
          const confirmed = strikeTracker.current.strike('MULTIPLE_FACES');
          if (confirmed) recordViolation(confirmed);
        } else {
          strikeTracker.current.clear('MULTIPLE_FACES');
        }

        const lookingAway =
          (frame.yawDeg !== null && Math.abs(frame.yawDeg) > MAX_YAW_DEG) ||
          (frame.pitchDeg !== null && Math.abs(frame.pitchDeg) > MAX_PITCH_DEG);
        if (lookingAway) {
          const confirmed = strikeTracker.current.strike('LOOKING_AWAY');
          if (confirmed) recordViolation(confirmed);
        } else {
          strikeTracker.current.clear('LOOKING_AWAY');
        }
      }, PRESENCE_CHECK_MS);

      identityIntervalRef.current = setInterval(async () => {
        if (!videoRef.current || endedRef.current) return;
        const descriptor = await getFaceDescriptor(videoRef.current);
        if (!descriptor) return;
        const data = await apiPost<{ match: boolean }>('/api/face/match', { embedding: Array.from(descriptor) }).catch(() => null);
        if (!data) return;
        if (data.match) {
          strikeTracker.current.clear('IDENTITY_MISMATCH');
        } else {
          const confirmed = strikeTracker.current.strike('IDENTITY_MISMATCH');
          if (confirmed) recordViolation(confirmed);
        }
      }, IDENTITY_CHECK_MS);

      // Screen-share/mic tracks only fire 'ended' when something external stops them (the
      // browser's own "Stop sharing" bar, OS permission revocation, unplugged device) — not when
      // our own stopEverything() calls .stop() on them at legitimate exam end, so no endedRef
      // guard is strictly required here, but it's added anyway as a defensive no-op.
      const screenTrack = screenStream.getVideoTracks()[0];
      if (screenTrack) {
        screenTrack.onended = () => {
          if (endedRef.current) return;
          recordViolation({ type: 'SCREEN_SHARE_STOPPED', severity: 'critical', message: 'Screen sharing was stopped.' });
        };
      }

      const micTrack = micStream.getAudioTracks()[0];
      if (micTrack) {
        micTrack.onended = () => {
          if (endedRef.current) return;
          recordViolation({ type: 'MIC_UNAVAILABLE', severity: 'warning', message: 'Microphone access was lost or revoked.' });
        };
      }

      if (micTrack) {
        const AudioContextCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const audioContext = new AudioContextCtor();
        audioContextRef.current = audioContext;
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        audioContext.createMediaStreamSource(micStream).connect(analyser);
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        audioIntervalRef.current = setInterval(() => {
          if (endedRef.current) return;
          // The live interview round expects the candidate to talk continuously — sustained
          // volume there is the whole point, not suspicious, so this check only applies to the
          // silent-by-default technical/HR rounds.
          if (currentRoundRef.current === 'personal') {
            audioStrikeTracker.current.clear('SUSPICIOUS_AUDIO');
            return;
          }
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const average = sum / dataArray.length;

          if (average > LOUD_AUDIO_THRESHOLD) {
            const confirmed = audioStrikeTracker.current.strike('SUSPICIOUS_AUDIO');
            if (confirmed) recordViolation(confirmed);
          } else {
            audioStrikeTracker.current.clear('SUSPICIOUS_AUDIO');
          }
        }, AUDIO_CHECK_MS);
      }

      document.addEventListener('visibilitychange', handleTabHidden);
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleTabHidden);
      stopEverything();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // The bottom-corner <video> only exists in the DOM once the loading screen is gone, so the
  // srcObject assignment above (while videoRef.current was still null) never actually took —
  // attach it here instead, once the element has mounted.
  useEffect(() => {
    if (!loading && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [loading]);

  // Fetch this round's questions whenever currentRound changes. The Live Interview round
  // ('personal') is Claude-driven conversation, not question-bank content — nothing to fetch.
  // Technical questions are LLM-generated fresh per session rather than pulled from the static
  // per-company seeded bank (HR still uses that static bank).
  useEffect(() => {
    if (!session?.companyId || !session.currentRound || session.currentRound === 'personal') return;
    if (session.currentRound === 'technical') {
      startTechnicalRound(sessionId).then(setQuestions);
      return;
    }
    fetchRoundQuestions(session.companyId, session.currentRound).then(setQuestions);
  }, [sessionId, session?.companyId, session?.currentRound]);

  const handleRoundSubmit = async (round: RoundName, result: { score: number; pct: number; answers: Record<string, string> }) => {
    if (round === 'technical') {
      // Grading (MCQ exact-match and LLM-judged coding answers) happens entirely server-side,
      // since correctAnswer/rubric was never sent to the client for this round.
      await submitTechnicalRound(sessionId, result.answers);
    } else {
      await submitRoundResponses(
        sessionId,
        questions.map((q) => ({
          questionId: q.id,
          round,
          answer: result.answers[q.id] ?? '',
          score: scoreAnswer(q, result.answers[q.id] ?? ''),
        })),
      );
      await recordRoundScore(sessionId, round, result.score, result.pct);
    }

    const { session: updated } = await apiGet<{ session: SessionInfo }>(`/api/exam/sessions/${sessionId}`);

    if (!updated || updated.status === 'submitted') {
      endedRef.current = true;
      stopEverything();
      setEnded('submitted');
      return;
    }
    setSession(updated);
  };

  if (ended) {
    return <ExamResults sessionId={sessionId} onContinue={onExamComplete} />;
  }

  if (loading || !session?.currentRound || !durations) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">Loading your exam...</p>
      </div>
    );
  }

  const durationMin =
    session.currentRound === 'technical'
      ? durations.technicalDurationMin
      : session.currentRound === 'personal'
        ? durations.personalDurationMin
        : durations.hrDurationMin;

  return (
    <div className="relative">
      {/* The live interview renders this same feed inline in its own left panel instead — a
          fixed corner overlay would sit on top of that layout's content. */}
      {session.currentRound !== 'personal' && (
        <video ref={videoRef} autoPlay muted playsInline className="fixed bottom-4 right-4 w-40 h-32 object-cover rounded-lg border border-slate-700 z-50" />
      )}

      {tabSwitchNotice && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="text-center space-y-3">
              <div
                className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center ${
                  tabSwitchNotice.exceeded ? 'bg-red-100' : 'bg-amber-100'
                }`}
              >
                <AlertTriangle className={`w-7 h-7 ${tabSwitchNotice.exceeded ? 'text-red-600' : 'text-amber-600'}`} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {tabSwitchNotice.exceeded ? 'Exam Ending' : 'Tab Switch Detected'}
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  {tabSwitchNotice.exceeded
                    ? 'You exceeded the allowed number of tab switches.'
                    : 'Leaving this tab during the assessment is tracked automatically.'}
                </p>
              </div>

              {tabSwitchNotice.exceeded ? (
                <div className="bg-red-50 border border-red-200 rounded-xl py-3 px-4">
                  <p className="text-sm font-semibold text-red-700">Your exam is being submitted automatically.</p>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl py-3">
                  <p className="text-3xl font-extrabold text-amber-700 leading-none">{tabSwitchNotice.remaining}</p>
                  <p className="text-xs font-semibold text-amber-700/80 uppercase tracking-wide mt-1">
                    {tabSwitchNotice.remaining === 1 ? 'chance left' : 'chances left'}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Rules</p>
              <ul className="space-y-1.5">
                {TAB_SWITCH_RULES.map((rule, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                    {rule}
                  </li>
                ))}
              </ul>
            </div>

            {!tabSwitchNotice.exceeded && (
              <button
                onClick={() => {
                  if (tabSwitchNoticeTimeout.current) clearTimeout(tabSwitchNoticeTimeout.current);
                  setTabSwitchNotice(null);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-colors"
              >
                Continue Exam
              </button>
            )}
          </div>
        </div>
      )}

      {liveViolations.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-1 max-w-xs">
          {liveViolations.slice(-3).map((v) => (
            <div key={v.id} className="bg-red-900/80 border border-red-500/50 rounded-lg p-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-red-200 text-xs">{v.message}</p>
            </div>
          ))}
        </div>
      )}

      {session.currentRound === 'personal' ? (
        <LiveInterviewRound
          sessionId={sessionId}
          title={`${durations.name} — ${EXAM_TYPE_LABELS[session.currentRound]}`}
          durationMin={durationMin}
          cameraVideoRef={videoRef}
          onSubmit={(result) => handleRoundSubmit(session.currentRound as RoundName, result)}
        />
      ) : (
        <RoundView
          title={`${durations.name} — ${EXAM_TYPE_LABELS[session.currentRound]}`}
          durationMin={durationMin}
          questions={questions}
          onSubmit={(result) => handleRoundSubmit(session.currentRound as RoundName, result)}
        />
      )}
    </div>
  );
};

export default ExamRunner;
