import { apiPost } from './api';

export interface InterviewTurn {
  reply: string;
  interviewComplete: boolean;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] ?? '');
    };
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read recorded audio.'));
    reader.readAsDataURL(blob);
  });
}

/** Transcribes a recorded answer clip via the server (Whisper), replacing the browser's own
 *  Web Speech API — which proved unreliable across browsers/networks/regions. */
export async function transcribeAnswer(sessionId: string, audioBlob: Blob): Promise<string> {
  const audioBase64 = await blobToBase64(audioBlob);
  const { text } = await apiPost<{ text: string }>(`/api/exam/sessions/${sessionId}/interview/transcribe`, {
    audioBase64,
    mimeType: audioBlob.type,
  });
  return text;
}

export function startInterview(sessionId: string): Promise<InterviewTurn> {
  return apiPost<InterviewTurn>(`/api/exam/sessions/${sessionId}/interview/start`);
}

export function respondToInterview(sessionId: string, answer: string): Promise<InterviewTurn> {
  return apiPost<InterviewTurn>(`/api/exam/sessions/${sessionId}/interview/respond`, { answer });
}

export interface InterviewEvaluation {
  score: number;
  pct: number;
  summary: string;
  strengths: string[];
  areasToImprove: string[];
}

export function finishInterview(sessionId: string): Promise<InterviewEvaluation> {
  return apiPost<InterviewEvaluation>(`/api/exam/sessions/${sessionId}/interview/finish`);
}
