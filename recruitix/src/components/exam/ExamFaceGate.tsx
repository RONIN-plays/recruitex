import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, ShieldAlert } from 'lucide-react';
import { apiPost } from '@/lib/api';
import { loadFaceModels, getFaceDescriptor } from '@/lib/faceEngine';
import { loadFaceLandmarker, detectFrame } from '@/lib/faceMesh';
import { createBlinkDetector } from '@/lib/liveness';

interface ExamFaceGateProps {
  sessionId: string;
  onUnlocked: () => void;
  onManualReview: () => void;
  onCancel: () => void;
}

type Status = 'loading' | 'ready' | 'verifying' | 'blink_wait' | 'failed';

const BLINKS_REQUIRED = 2;
const BLINK_TIMEOUT_MS = 8000;

const ExamFaceGate = ({ sessionId, onUnlocked, onManualReview, onCancel }: ExamFaceGateProps) => {
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('');
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;

        await Promise.all([loadFaceModels(), loadFaceLandmarker()]);
        if (!cancelled) setStatus('ready');
      } catch (err) {
        if (!cancelled) {
          setMessage(err instanceof Error ? err.message : 'Camera access failed.');
          setStatus('failed');
        }
      }
    })();

    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const runVerification = async () => {
    if (!videoRef.current) return;
    setStatus('blink_wait');
    setMessage('Please blink twice, clearly.');

    const landmarker = await loadFaceLandmarker();
    const blinkDetector = createBlinkDetector();
    const livenessPromise = blinkDetector.waitForBlinks(BLINKS_REQUIRED, BLINK_TIMEOUT_MS);

    pollRef.current = setInterval(() => {
      if (!videoRef.current) return;
      const frame = detectFrame(landmarker, videoRef.current, performance.now());
      blinkDetector.update(frame.blendshapes, performance.now());
    }, 100);

    const [livenessPassed] = await Promise.all([livenessPromise]);
    if (pollRef.current) clearInterval(pollRef.current);

    setStatus('verifying');
    setMessage('Verifying identity...');

    try {
      const descriptor = await getFaceDescriptor(videoRef.current);
      if (!descriptor) {
        setMessage('Could not see your face clearly. Please try again.');
        setStatus('ready');
        return;
      }

      const data = await apiPost<{ unlocked: boolean; reason?: string; attemptsRemaining?: number }>(
        `/api/exam/sessions/${sessionId}/unlock`,
        { embedding: Array.from(descriptor), livenessPassed },
      );

      if (data.unlocked) {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        onUnlocked();
        return;
      }

      if (data.reason === 'max_attempts') {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        onManualReview();
        return;
      }

      setAttemptsRemaining(data.attemptsRemaining ?? null);
      setMessage(
        data.reason === 'liveness'
          ? "We couldn't confirm liveness — please blink clearly when prompted."
          : "Your face didn't match your enrolled profile.",
      );
      setStatus('failed');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Verification failed. Please try again.');
      setStatus('failed');
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-2xl text-white flex items-center gap-2">
            <Eye className="w-6 h-6 text-blue-400" /> Identity Verification
          </CardTitle>
          <CardDescription className="text-slate-300">
            Confirm it's really you before the exam unlocks.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <video ref={videoRef} autoPlay muted playsInline className="w-full h-64 bg-slate-700 rounded-lg object-cover" />

          {message && (
            <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-3">
              <p className="text-blue-300 text-sm">{message}</p>
            </div>
          )}

          {status === 'failed' && attemptsRemaining !== null && (
            <div className="bg-amber-900/20 border border-amber-500/50 rounded-lg p-3 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <p className="text-amber-300 text-sm">{attemptsRemaining} attempt(s) remaining.</p>
            </div>
          )}

          <Button
            onClick={runVerification}
            disabled={status === 'loading' || status === 'verifying' || status === 'blink_wait'}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg"
          >
            {status === 'loading'
              ? 'Loading...'
              : status === 'blink_wait'
                ? 'Waiting for blinks...'
                : status === 'verifying'
                  ? 'Verifying...'
                  : status === 'failed'
                    ? 'Try Again'
                    : 'Start Verification'}
          </Button>

          <Button onClick={onCancel} variant="outline" className="w-full bg-transparent border-slate-600 text-slate-300 hover:bg-slate-800">
            Cancel
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExamFaceGate;
