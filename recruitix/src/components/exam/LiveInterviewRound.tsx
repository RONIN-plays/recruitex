import { useEffect, useRef, useState, type RefObject } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  PhoneOff,
  CheckCircle2,
  Bot,
  Lightbulb,
  ShieldCheck,
  AlertCircle,
  ClipboardList,
  Camera,
} from 'lucide-react';
import { startInterview, respondToInterview, finishInterview, transcribeAnswer } from '@/lib/interview';

interface LiveInterviewRoundProps {
  sessionId: string;
  title: string;
  durationMin: number;
  cameraVideoRef: RefObject<HTMLVideoElement>;
  micStream: MediaStream;
  onSubmit: (result: { score: number; pct: number; answers: Record<string, string> }) => void;
}

type Phase = 'connecting' | 'speaking' | 'ready' | 'recording' | 'processing' | 'finishing' | 'error';

// Recorded clips are transcribed server-side via Whisper (server/lib/transcription.js) rather than
// the browser's own Web Speech API — that API proved unreliable across browsers/networks/regions
// (silent failures with no error event at all in some setups), whereas a plain recording always
// either produces audio or fails loudly and immediately via getUserMedia/MediaRecorder.
const PREFERRED_MIME_TYPES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
function pickSupportedMimeType(): string {
  return PREFERRED_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type)) ?? '';
}

const formatTime = (seconds: number) => {
  const m = Math.floor(Math.max(0, seconds) / 60);
  const s = Math.max(0, seconds) % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

// The interviewer system prompt (server/lib/interviewer.js) asks 5-7 questions, no fixed total —
// used only to size the progress grid; it grows if the real count ever exceeds this.
const ESTIMATED_QUESTIONS = 6;
const TALK_BAR_HEIGHTS = [6, 10, 14, 10, 6];

/** AI-conducted "Live Interview": Claude asks questions (spoken via TTS), candidate answers via mic (recorded and transcribed server-side). */
const LiveInterviewRound = ({ sessionId, title, durationMin, cameraVideoRef, micStream, onSubmit }: LiveInterviewRoundProps) => {
  const [phase, setPhase] = useState<Phase>('connecting');
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [questionNumber, setQuestionNumber] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [lastAnswer, setLastAnswer] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState(durationMin * 60);
  const [speakerMuted, setSpeakerMuted] = useState(false);
  const [activeTab, setActiveTab] = useState<'conversation' | 'notes'>('conversation');
  const [notes, setNotes] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const finishedRef = useRef(false);
  const speakerMutedRef = useRef(false);
  // Chrome/Edge populate the voice list asynchronously — grabbing it once on mount can come back
  // empty, so this is kept fresh via the voiceschanged listener and read at speak()-time.
  const preferredVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    speakerMutedRef.current = speakerMuted;
  }, [speakerMuted]);

  useEffect(() => {
    if (!window.speechSynthesis) return;
    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return;
      preferredVoiceRef.current =
        voices.find((v) => /Google US English/i.test(v.name)) ??
        voices.find((v) => /natural/i.test(v.name) && v.lang.startsWith('en')) ??
        voices.find((v) => v.lang === 'en-US' && !v.localService) ??
        voices.find((v) => v.lang.startsWith('en')) ??
        voices[0];
    };
    pickVoice();
    window.speechSynthesis.onvoiceschanged = pickVoice;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const speak = (text: string): Promise<void> =>
    new Promise((resolve) => {
      if (!window.speechSynthesis || speakerMutedRef.current) {
        resolve();
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;
      if (preferredVoiceRef.current) utterance.voice = preferredVoiceRef.current;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    });

  const finalize = async () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    window.speechSynthesis?.cancel();
    setPhase('finishing');
    try {
      const evaluation = await finishInterview(sessionId);
      onSubmit({ score: evaluation.score, pct: evaluation.pct, answers: {} });
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not finalize the interview.');
      setPhase('error');
    }
  };

  const askQuestion = async (text: string, complete: boolean) => {
    setCurrentQuestion(text);
    setLastAnswer('');
    setQuestionNumber((n) => n + 1);
    setPhase('speaking');
    await speak(text);

    if (complete) {
      await finalize();
      return;
    }
    setPhase('ready');
  };

  useEffect(() => {
    let cancelled = false;

    startInterview(sessionId)
      .then((turn) => {
        if (!cancelled) void askQuestion(turn.reply, turn.interviewComplete);
      })
      .catch((err) => {
        if (!cancelled) {
          setErrorMessage(err instanceof Error ? err.message : 'Could not start the interview.');
          setPhase('error');
        }
      });

    return () => {
      cancelled = true;
      window.speechSynthesis?.cancel();
      if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Round timer, same pattern as RoundView — runs out early? finalize with whatever's been said.
  useEffect(() => {
    if (finishedRef.current || phase === 'error') return;
    if (timeLeft <= 0) {
      void finalize();
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase]);

  const startRecording = () => {
    if (typeof MediaRecorder === 'undefined') {
      setErrorMessage('Audio recording is not supported in this browser. Please use a recent Chrome, Edge, or Firefox.');
      setPhase('error');
      return;
    }

    const mimeType = pickSupportedMimeType();
    const recorder = mimeType ? new MediaRecorder(micStream, { mimeType }) : new MediaRecorder(micStream);
    audioChunksRef.current = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) audioChunksRef.current.push(event.data);
    };

    mediaRecorderRef.current = recorder;
    recorder.start();
    setPhase('recording');
  };

  const stopRecording = async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== 'recording') {
      setPhase('ready');
      return;
    }

    setPhase('processing');
    const audioBlob = await new Promise<Blob>((resolve) => {
      recorder.onstop = () => resolve(new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' }));
      recorder.stop();
    });
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];

    if (audioBlob.size === 0) {
      setPhase('ready');
      return;
    }

    try {
      const answer = (await transcribeAnswer(sessionId, audioBlob)).trim();
      if (!answer) {
        setPhase('ready');
        return;
      }

      setLastAnswer(answer);
      setAnsweredCount((c) => c + 1);
      const turn = await respondToInterview(sessionId, answer);
      await askQuestion(turn.reply, turn.interviewComplete);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not process your answer.');
      setPhase('error');
    }
  };

  const currentQuestionNumber = Math.max(questionNumber, 1);
  const totalBoxes = Math.max(ESTIMATED_QUESTIONS, questionNumber);
  const connectionOk = phase !== 'error';
  const isSpeaking = phase === 'speaking';

  const statusForBox = (n: number): 'answered' | 'current' | 'not-visited' => {
    if (n <= answeredCount) return 'answered';
    if (n === currentQuestionNumber && !finishedRef.current) return 'current';
    return 'not-visited';
  };

  const micDisabled = phase !== 'ready' && phase !== 'recording';

  return (
    <div className="h-screen w-full bg-gray-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shrink-0">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-gray-900 text-sm">AI Interview</h1>
              <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded px-1 py-0.5">BETA</span>
            </div>
            <p className="text-[11px] text-gray-500 truncate max-w-[220px] leading-tight">{title}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-3 py-1">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
          </span>
          <span className="text-xs font-medium text-gray-700">Live Interview</span>
          <span className="text-xs font-semibold text-gray-900 tabular-nums">{formatTime(timeLeft)}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={finalize}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium transition-colors"
          >
            <PhoneOff className="w-3.5 h-3.5" /> End Interview
          </button>
          <button
            onClick={finalize}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Mark as Completed
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 max-w-7xl mx-auto w-full p-3 flex flex-col gap-3">
        {errorMessage && (
          <div className="shrink-0 bg-red-50 border border-red-200 rounded-xl p-2.5 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <p className="text-red-700 text-xs">{errorMessage}</p>
          </div>
        )}

        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[250px_1fr_290px] gap-3">
          {/* Left column */}
          <div className="min-h-0 overflow-y-auto flex flex-col gap-3">
            <div className="bg-slate-950 rounded-2xl overflow-hidden relative shrink-0 aspect-[4/3]">
              <video ref={cameraVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
              <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/50 backdrop-blur border border-white/10 rounded-md px-1.5 py-0.5 text-white text-[10px] font-semibold">
                <Camera className="w-3 h-3" /> You
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-2.5 shrink-0">
              <h2 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                <ClipboardList className="w-3.5 h-3.5 text-gray-500" /> Interview Details
              </h2>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-gray-500">Format</span>
                  <span className="font-semibold text-gray-900 text-right">Spoken interview</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-gray-500">Duration</span>
                  <span className="font-semibold text-gray-900">{durationMin} min</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-gray-500">Questions</span>
                  <span className="font-semibold text-gray-900">5 – 7</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-gray-500">Current</span>
                  <span className="font-semibold text-gray-900">{currentQuestionNumber} of ~{ESTIMATED_QUESTIONS}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-2 shrink-0">
              <h2 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Interview Tips
              </h2>
              <ul className="space-y-1">
                {[
                  'Answer out loud clearly',
                  'Take your time to think',
                  'Explain your approach',
                  'You can ask for clarification',
                  'Ensure a stable connection',
                ].map((tip) => (
                  <li key={tip} className="flex items-start gap-1.5 text-xs text-gray-600">
                    <span className="mt-1 w-1 h-1 rounded-full bg-gray-400 shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            <div
              className={`shrink-0 flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium ${
                connectionOk ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              {connectionOk ? 'Your connection is stable' : 'Connection issue detected'}
            </div>
          </div>

          {/* Center column */}
          <div className="min-h-0 flex flex-col gap-3">
            <div className="flex-1 min-h-0 bg-slate-950 rounded-2xl overflow-hidden relative flex flex-col">
              <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-white/10 backdrop-blur border border-white/20 rounded-lg px-2 py-1 text-white text-[11px] font-bold">
                <Bot className="w-3 h-3" /> AI
              </div>
              <div
                className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center border ${
                  isSpeaking ? 'bg-emerald-500/20 border-emerald-400/40' : 'bg-white/10 border-white/20'
                }`}
              >
                <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? 'text-emerald-300' : 'text-white/60'}`} />
              </div>

              <div className="flex-1 flex items-center justify-center min-h-0">
                <div className="relative">
                  <div
                    className={`w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center transition-transform ${
                      isSpeaking ? 'scale-105' : ''
                    }`}
                  >
                    <Bot className="w-11 h-11 md:w-12 md:h-12 text-white" />
                  </div>
                  {isSpeaking && <span className="absolute inset-0 rounded-full border-4 border-indigo-400/40 animate-ping" />}

                  {/* Talking indicator — an animated "voice waveform" standing in for lip-sync,
                      driven directly by whether TTS audio is actually playing right now. */}
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-end gap-1 bg-slate-900/90 backdrop-blur px-2.5 py-1.5 rounded-full border border-white/10">
                    {TALK_BAR_HEIGHTS.map((h, i) => (
                      <span
                        key={i}
                        className={`w-1 rounded-full transition-colors ${isSpeaking ? 'bg-emerald-400 animate-bounce' : 'bg-white/20'}`}
                        style={{ height: `${h}px`, animationDelay: isSpeaking ? `${i * 0.1}s` : undefined }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-black/50 backdrop-blur px-4 py-3 shrink-0">
                <p className="text-white text-sm leading-snug line-clamp-2">{currentQuestion || 'Connecting to your interviewer...'}</p>
              </div>
            </div>

            <div className="shrink-0 flex items-center justify-center gap-2.5 flex-wrap">
              <button
                onClick={phase === 'recording' ? stopRecording : startRecording}
                disabled={micDisabled}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  phase === 'recording' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {phase === 'recording' ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                {phase === 'recording' ? 'Listening...' : 'Mic'}
              </button>
              <button
                onClick={() => setSpeakerMuted((m) => !m)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-medium transition-colors ${
                  speakerMuted ? 'bg-gray-100 border-gray-200 text-gray-500' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {speakerMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />} Speaker
              </button>
              <button
                onClick={finalize}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium transition-colors"
              >
                <PhoneOff className="w-3.5 h-3.5" /> End Interview
              </button>
            </div>

            <div className="shrink-0 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-4 px-4 pt-2.5">
                <button
                  onClick={() => setActiveTab('conversation')}
                  className={`pb-2 text-xs font-semibold border-b-2 transition-colors ${
                    activeTab === 'conversation' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Conversation
                </button>
                <button
                  onClick={() => setActiveTab('notes')}
                  className={`pb-2 text-xs font-semibold border-b-2 transition-colors ${
                    activeTab === 'notes' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Notes
                </button>
              </div>
              <div className="border-b border-gray-100" />

              {activeTab === 'conversation' ? (
                <>
                  <div className="p-3.5 space-y-2.5">
                    <div className="flex gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                        <Bot className="w-3 h-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] font-semibold text-gray-900">AI Interviewer</span>
                        <div className="bg-indigo-50 rounded-xl rounded-tl-sm px-3 py-1.5 mt-0.5 text-xs text-gray-700">
                          {currentQuestion || 'Connecting...'}
                        </div>
                      </div>
                    </div>

                    {(phase === 'recording' || phase === 'processing' || lastAnswer) && (
                      <div className="flex gap-2.5 flex-row-reverse">
                        <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center shrink-0 text-[9px] font-semibold">
                          You
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[11px] font-semibold text-gray-900 block text-right">You</span>
                          <div className="bg-gray-100 rounded-xl rounded-tr-sm px-3 py-1.5 mt-0.5 text-xs text-gray-700 text-right">
                            {phase === 'recording' ? 'Recording — tap the mic again when done...' : phase === 'processing' ? 'Transcribing...' : lastAnswer}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mic control in place of a text box — the candidate speaks their answer,
                      they don't type it, matching how this round actually works. */}
                  <div className="flex items-center gap-2.5 border-t border-gray-100 px-3.5 py-2.5">
                    {phase === 'ready' && (
                      <button
                        onClick={startRecording}
                        className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shrink-0 transition-colors"
                      >
                        <Mic className="w-4 h-4" />
                      </button>
                    )}
                    {phase === 'recording' && (
                      <button
                        onClick={stopRecording}
                        className="w-9 h-9 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shrink-0 animate-pulse transition-colors"
                      >
                        <MicOff className="w-4 h-4" />
                      </button>
                    )}
                    {micDisabled && (
                      <div className="w-9 h-9 rounded-full bg-gray-100 text-gray-300 flex items-center justify-center shrink-0">
                        <Mic className="w-4 h-4" />
                      </div>
                    )}
                    <p className="flex-1 min-w-0 text-xs text-gray-500 truncate">
                      {phase === 'recording'
                        ? 'Recording — tap the mic again when you’re done answering...'
                        : phase === 'ready'
                          ? 'Tap the mic and speak your answer.'
                          : phase === 'speaking'
                            ? 'Listen to the question...'
                            : phase === 'processing'
                              ? 'Transcribing your answer...'
                              : phase === 'finishing'
                                ? 'Finalizing your evaluation...'
                                : phase === 'connecting'
                                  ? 'Connecting to your interviewer...'
                                  : ''}
                    </p>
                  </div>
                </>
              ) : (
                <div className="p-3.5">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Jot down your own notes during the interview — only visible to you, not submitted as an answer."
                    className="w-full min-h-[110px] text-xs border border-gray-200 rounded-xl p-2.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="min-h-0 overflow-y-auto flex flex-col gap-3">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3 shrink-0">
              <h2 className="font-bold text-gray-900 text-sm">Question Progress</h2>
              <div className="grid grid-cols-5 gap-1.5">
                {Array.from({ length: totalBoxes }, (_, i) => i + 1).map((n) => {
                  const status = statusForBox(n);
                  return (
                    <div
                      key={n}
                      className={`aspect-square rounded-md border-2 flex items-center justify-center text-xs font-semibold ${
                        status === 'answered'
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : status === 'current'
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'bg-white border-gray-200 text-gray-600'
                      }`}
                    >
                      {n}
                    </div>
                  );
                })}
              </div>
              <div className="pt-2 border-t border-gray-100 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-emerald-500 shrink-0" />
                  <span className="text-[11px] text-gray-600">Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-indigo-600 shrink-0" />
                  <span className="text-[11px] text-gray-600">Current</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-white border border-gray-300 shrink-0" />
                  <span className="text-[11px] text-gray-600">Not Visited</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-2 shrink-0">
              <h2 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-indigo-600" /> AI Interviewer
              </h2>
              <ul className="space-y-1">
                {[
                  'Asks around 5 – 7 questions',
                  'Evaluates clarity, logic, communication & correctness',
                  'Speak naturally and confidently',
                ].map((point) => (
                  <li key={point} className="flex items-start gap-1.5 text-xs text-gray-600">
                    <span className="mt-1 w-1 h-1 rounded-full bg-gray-400 shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-2.5 shrink-0">
              <h2 className="font-bold text-gray-900 text-sm">Live Evaluation</h2>
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full border-[6px] border-gray-100 flex items-center justify-center">
                  <span className="text-gray-300 text-sm font-bold">--</span>
                </div>
              </div>
              <div className="space-y-1">
                {['Problem Solving', 'Technical Knowledge', 'Communication', 'Confidence'].map((label) => (
                  <div key={label} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">{label}</span>
                    <span className="text-gray-400 font-medium">--/5</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 text-center pt-1.5 border-t border-gray-100">
                Shown once the interview is complete.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveInterviewRound;
