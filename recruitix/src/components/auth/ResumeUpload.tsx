import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, CheckCircle, AlertCircle, Upload } from 'lucide-react';
import { uploadResume } from '@/lib/resume';

interface ResumeUploadProps {
  onDone: () => Promise<void> | void;
  /** Omit to render this as a mandatory gate (no skip button) — used right before the Live
   *  Interview / HR Simulation rounds, which require a resume on file. Pass it for the
   *  skippable one-time prompt shown right after face enrollment. */
  onSkip?: () => void;
  /** Swaps in copy explaining *why* this round specifically can't proceed without a resume,
   *  and shows a "Back" action instead of "Skip for now" (there's no skipping this gate). */
  mandatory?: boolean;
  onCancel?: () => void;
}

type Status = 'idle' | 'uploading' | 'complete' | 'error';

/** Resume upload, used in two modes: a skippable one-time prompt right after face enrollment,
 *  and a mandatory gate right before the Live Interview / HR Simulation rounds (which require a
 *  resume on file so questions can be grounded in the candidate's actual background). */
const ResumeUpload = ({ onDone, onSkip, mandatory = false, onCancel }: ResumeUploadProps) => {
  const [status, setStatus] = useState<Status>('idle');
  const [fileName, setFileName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage('Please choose a PDF file.');
      setStatus('error');
      return;
    }
    setFileName(file.name);
    setStatus('uploading');
    setErrorMessage('');

    try {
      await uploadResume(file);
      setStatus('complete');
      setTimeout(() => onDone(), 1200);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Upload failed. Please try again.');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-slate-900 border-slate-700">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl text-white">{mandatory ? 'Resume Required' : 'Upload Your Resume'}</CardTitle>
          <CardDescription className="text-slate-300">
            {mandatory
              ? 'This round asks questions grounded in your actual background, so a resume on file is required before it can start. PDF only.'
              : 'Optional, but recommended — your Live Interview and HR Simulation rounds will ask questions grounded in your actual projects and experience instead of purely generic ones. PDF only, one resume kept on file, updatable anytime.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />

          <button
            type="button"
            onClick={() => status !== 'uploading' && inputRef.current?.click()}
            disabled={status === 'uploading'}
            className="w-full border-2 border-dashed border-slate-600 hover:border-blue-500 rounded-lg p-10 flex flex-col items-center gap-3 text-center transition-colors disabled:cursor-not-allowed"
          >
            {status === 'complete' ? (
              <CheckCircle className="w-10 h-10 text-green-400" />
            ) : (
              <FileText className="w-10 h-10 text-slate-400" />
            )}
            <p className="text-white font-medium">
              {status === 'complete'
                ? `${fileName} uploaded`
                : status === 'uploading'
                  ? `Reading ${fileName}...`
                  : 'Click to choose a PDF resume'}
            </p>
            {status === 'idle' && <p className="text-slate-500 text-sm">Max 4MB</p>}
          </button>

          {errorMessage && (
            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-red-300 text-sm">{errorMessage}</p>
            </div>
          )}

          <div className="flex gap-3">
            {mandatory ? (
              onCancel && (
                <Button
                  variant="outline"
                  onClick={onCancel}
                  disabled={status === 'uploading'}
                  className="flex-1 bg-transparent border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  Back
                </Button>
              )
            ) : (
              <Button
                variant="outline"
                onClick={onSkip}
                disabled={status === 'uploading'}
                className="flex-1 bg-transparent border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                Skip for now
              </Button>
            )}
            <Button
              onClick={() => inputRef.current?.click()}
              disabled={status === 'uploading' || status === 'complete'}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Upload className="w-4 h-4 mr-2" />
              {status === 'uploading' ? 'Uploading...' : 'Choose PDF'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResumeUpload;
