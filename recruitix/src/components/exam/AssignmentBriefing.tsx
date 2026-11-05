import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ClipboardList,
  Building2,
  Clock,
  Target,
  ShieldAlert,
  Check,
  AlertCircle,
  ArrowRight,
  Volume2,
} from 'lucide-react';
import { EXAM_TYPE_LABELS, type RoundName } from '@/lib/examRounds';
import type { Company } from './CompanySelect';

interface AssignmentBriefingProps {
  company: Company;
  round: RoundName;
  onReady: (streams: { screenStream: MediaStream; micStream: MediaStream }) => void;
  onCancel: () => void;
}

const FORMAT_DETAILS: Record<RoundName, string[]> = {
  technical: [
    'A mix of multiple-choice and coding questions covering DSA, aptitude, and quantitative reasoning.',
    'Coding answers are graded automatically — write complete, working solutions.',
    'Once you submit this round, it cannot be reattempted.',
  ],
  personal: [
    'A live, conversational interview conducted by an AI interviewer, one question at a time.',
    'Speak your answers naturally — your microphone captures your responses.',
    'Follow-up questions adapt based on what you say, just like a real interview.',
  ],
  hr: [
    'A set of behavioral and situational questions evaluating communication and judgment.',
    'Answer in your own words — responses are evaluated for relevance and depth, not exact wording.',
  ],
};

const PROCTORING_RULES = [
  'Your screen, camera, and microphone must stay shared for the entire round.',
  'Stay visible in frame — leaving the camera view or multiple faces being detected is flagged.',
  'Switching tabs or minimizing the browser window is recorded as a violation.',
  'Repeated or severe violations can auto-submit your assessment early.',
  "The timer starts the moment you confirm access on the next screen and can't be paused.",
];

const durationForRound = (company: Company, round: RoundName): number =>
  round === 'technical' ? company.technicalDurationMin : round === 'personal' ? company.personalDurationMin : company.hrDurationMin;

type Phase = 'briefing' | 'permissions';

/**
 * White/light-themed replacement for the old dark device-setup gate. Shows the candidate a
 * formal note on this round's format and proctoring rules, then — once they choose to
 * proceed — walks them through granting screen, mic, and camera access before handing the
 * screen+mic streams up to start the exam. The camera grant is a pre-flight check only
 * (ExamRunner acquires its own camera stream for continuous proctoring), so it's released
 * again once confirmed rather than passed along.
 */
const AssignmentBriefing = ({ company, round, onReady, onCancel }: AssignmentBriefingProps) => {
  const [phase, setPhase] = useState<Phase>('briefing');
  const [screenGranted, setScreenGranted] = useState(false);
  const [micGranted, setMicGranted] = useState(false);
  const [cameraGranted, setCameraGranted] = useState(false);
  const [notFullScreen, setNotFullScreen] = useState(false);
  const [error, setError] = useState('');

  const [micDevices, setMicDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicId, setSelectedMicId] = useState<string>('');

  const screenStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  // Flips true right before onReady hands the streams off to the parent — after that, this
  // component must not stop them on unmount since ExamRunner becomes their owner.
  const handedOffRef = useRef(false);

  // Live mic level bars, purely a UI "audio test" — sampled from a few frequency bins so each
  // bar reacts a little differently instead of just repeating one flat level.
  const MIC_BAR_COUNT = 5;
  const [micBars, setMicBars] = useState<number[]>(new Array(MIC_BAR_COUNT).fill(0));
  const micAudioCtxRef = useRef<AudioContext | null>(null);
  const micLevelIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopMicLevelMeter = () => {
    if (micLevelIntervalRef.current) clearInterval(micLevelIntervalRef.current);
    micAudioCtxRef.current?.close().catch(() => {});
    micAudioCtxRef.current = null;
  };

  const startMicLevelMeter = (stream: MediaStream) => {
    const AudioContextCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const audioContext = new AudioContextCtor();
    micAudioCtxRef.current = audioContext;
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    audioContext.createMediaStreamSource(stream).connect(analyser);
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    micLevelIntervalRef.current = setInterval(() => {
      analyser.getByteFrequencyData(dataArray);
      const bars = Array.from({ length: MIC_BAR_COUNT }, (_, i) => {
        const idx = Math.floor((i + 1) * (dataArray.length / (MIC_BAR_COUNT + 1)));
        return Math.min(100, Math.round((dataArray[idx] / 255) * 100));
      });
      setMicBars(bars);
    }, 100);
  };

  useEffect(() => {
    return () => {
      stopMicLevelMeter();
      cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
      if (handedOffRef.current) return;
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const requestScreenShare = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      screenStreamRef.current = stream;
      const settings = stream.getVideoTracks()[0]?.getSettings();
      setNotFullScreen(settings?.displaySurface !== undefined && settings.displaySurface !== 'monitor');
      setScreenGranted(true);
    } catch {
      setError('Please share your screen to continue — this is required for the assessment.');
    }
  };

  const requestMic = async (deviceId?: string) => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: deviceId ? { deviceId: { exact: deviceId } } : true,
      });
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      micStreamRef.current = stream;
      setMicGranted(true);
      stopMicLevelMeter();
      startMicLevelMeter(stream);

      // Device labels are only populated once permission has been granted, so
      // the input list is (re)built here rather than on mount.
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter((d) => d.kind === 'audioinput');
      setMicDevices(audioInputs);
      const activeId = stream.getAudioTracks()[0]?.getSettings().deviceId;
      setSelectedMicId(activeId ?? deviceId ?? audioInputs[0]?.deviceId ?? '');
    } catch {
      setError('Please allow microphone access to continue — this is required for the assessment.');
    }
  };

  const handleMicDeviceChange = (deviceId: string) => {
    setSelectedMicId(deviceId);
    requestMic(deviceId);
  };

  const requestCamera = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      cameraStreamRef.current = stream;
      setCameraGranted(true);
    } catch {
      setError('Please allow camera access to continue — this is required for the assessment.');
    }
  };

  // The <video> preview only mounts once cameraGranted flips true, so the ref isn't attached yet
  // at the point requestCamera() resolves — attach the stream here instead, once it exists.
  useEffect(() => {
    if (cameraGranted && cameraVideoRef.current && cameraStreamRef.current) {
      cameraVideoRef.current.srcObject = cameraStreamRef.current;
    }
  }, [cameraGranted]);

  const handleConfirm = () => {
    if (!screenStreamRef.current || !micStreamRef.current) return;
    cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
    handedOffRef.current = true;
    onReady({ screenStream: screenStreamRef.current, micStream: micStreamRef.current });
  };

  const allReady = screenGranted && micGranted && cameraGranted;

  if (phase === 'briefing') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl border-gray-200 shadow-sm">
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-gray-100 text-gray-700 border-gray-200">
                <Building2 className="w-3 h-3 mr-1.5" />
                {company.name}
              </Badge>
              <Badge className="bg-gray-100 text-gray-700 border-gray-200">
                <Clock className="w-3 h-3 mr-1.5" />
                {durationForRound(company, round)} Minutes
              </Badge>
              <Badge className="bg-gray-100 text-gray-700 border-gray-200">
                <Target className="w-3 h-3 mr-1.5 text-emerald-600" />
                {company.passThresholdPct}% Pass Mark
              </Badge>
            </div>
            <CardTitle className="text-2xl text-gray-900 flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-blue-600" />
              {EXAM_TYPE_LABELS[round]} — Assignment Details
            </CardTitle>
            <CardDescription className="text-gray-500">
              Please read the format and rules below before you begin.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Format</h3>
              <ul className="space-y-2">
                {FORMAT_DETAILS[round].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-amber-900 mb-2 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                Proctoring & Integrity Rules
              </h3>
              <ul className="space-y-2">
                {PROCTORING_RULES.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => setPhase('permissions')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-base"
            >
              Start Assignment
              <ArrowRight className="w-5 h-5" />
            </button>

            <Button onClick={onCancel} variant="outline" className="w-full border-gray-300 text-gray-600 hover:bg-gray-50">
              Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-gray-900 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-blue-600" /> Grant Access to Continue
          </CardTitle>
          <CardDescription className="text-gray-500">
            Screen, camera, and microphone are monitored continuously throughout the assessment.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <button
            onClick={requestScreenShare}
            className={`w-full flex items-center gap-4 py-5 px-5 rounded-2xl border-2 transition-colors ${
              screenGranted ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-2xl shrink-0">
              🖥️
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-gray-900">{screenGranted ? 'Screen Share Active' : 'Share Your Screen'}</div>
              <div className="text-sm text-gray-500">We'll monitor your full screen throughout the assessment.</div>
            </div>
            {screenGranted ? (
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                <Check className="w-5 h-5 text-white" strokeWidth={3} />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full border-2 border-gray-300 shrink-0" />
            )}
          </button>

          <p className="text-xs text-gray-500 -mt-2 px-1">
            Please share your <span className="font-semibold text-gray-700">entire screen</span> (not a single tab or
            window) when prompted, so the full display can be monitored.
          </p>

          {notFullScreen && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <p className="text-amber-800 text-sm">
                It looks like you shared a tab or window rather than your entire screen. Please redo this and choose
                "Entire Screen".
              </p>
            </div>
          )}

          <div
            className={`w-full rounded-2xl border-2 transition-colors ${
              micGranted ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'
            }`}
          >
            <button onClick={() => requestMic()} className="w-full flex items-center gap-4 py-5 px-5">
              <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-2xl shrink-0">
                🎙️
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-gray-900">{micGranted ? 'Microphone Active' : 'Share Your Audio'}</div>
                <div className="text-sm text-gray-500">
                  {micGranted ? 'Say something to test your mic below.' : "We'll listen for background noise or talking."}
                </div>
              </div>
              {micGranted ? (
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                  <Check className="w-5 h-5 text-white" strokeWidth={3} />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full border-2 border-gray-300 shrink-0" />
              )}
            </button>

            {micGranted && (
              <div className="px-5 pb-5 space-y-3" onClick={(e) => e.stopPropagation()}>
                {micDevices.length > 0 && (
                  <label className="block">
                    <span className="text-xs font-medium text-gray-500 mb-1 block">Microphone / input device</span>
                    <select
                      value={selectedMicId}
                      onChange={(e) => handleMicDeviceChange(e.target.value)}
                      className="w-full text-sm bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800"
                    >
                      {micDevices.map((d, i) => (
                        <option key={d.deviceId || i} value={d.deviceId}>
                          {d.label || `Microphone ${i + 1}`}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <div className="flex items-center gap-2 text-xs font-medium text-green-700">
                  <Volume2 className="w-4 h-4" />
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                  Testing audio — speak now to confirm we can hear you
                </div>

                <div className="flex items-end justify-center gap-1.5 h-10">
                  {micBars.map((level, i) => (
                    <div
                      key={i}
                      className="w-2.5 rounded-full bg-green-500 transition-all duration-100"
                      style={{ height: `${Math.max(12, level)}%` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div
            className={`w-full rounded-2xl border-2 transition-colors ${
              cameraGranted ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'
            }`}
          >
            <button onClick={requestCamera} className="w-full flex items-center gap-4 py-5 px-5 hover:bg-gray-100/60 rounded-2xl transition-colors">
              <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-2xl shrink-0">
                📷
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-gray-900">{cameraGranted ? 'Camera Active' : 'Share Your Camera'}</div>
                <div className="text-sm text-gray-500">We'll keep an eye on your video feed for identity checks.</div>
              </div>
              {cameraGranted ? (
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                  <Check className="w-5 h-5 text-white" strokeWidth={3} />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full border-2 border-gray-300 shrink-0" />
              )}
            </button>

            {cameraGranted && (
              <div className="px-5 pb-5 space-y-3">
                <div className="relative w-full max-w-xs mx-auto aspect-video bg-black rounded-xl overflow-hidden border border-gray-300">
                  <video ref={cameraVideoRef} autoPlay playsInline muted className="w-full h-full object-cover -scale-x-100" />
                </div>
                <p className="text-xs text-gray-500 text-center px-2">
                  Face the camera directly, keep your entire face centered and well-lit, and remove sunglasses or
                  anything covering your face. Stay in frame for the whole assessment.
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleConfirm}
            disabled={!allReady}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-colors"
          >
            Confirm & Begin Assignment
          </button>
          {!allReady && <p className="text-xs text-center text-gray-400">Grant all three permissions above to continue.</p>}

          <Button onClick={onCancel} variant="outline" className="w-full border-gray-300 text-gray-600 hover:bg-gray-50">
            Cancel
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssignmentBriefing;
