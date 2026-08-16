import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';

export interface CandidateQuestionResult {
  prompt: string;
  qtype: 'mcq' | 'coding' | 'behavioral';
  category: string | null;
  options: string[] | null;
  correctAnswer: string | null;
  points: number;
  answer: string;
  score: number;
}

export interface CandidateTranscriptMessage {
  role: 'user' | 'assistant';
  text: string;
  createdAt: string;
}

export interface CandidateInterviewFeedback {
  score: number;
  summary: string;
  strengths: string[];
  areasToImprove: string[];
}

interface CandidateRoundBase {
  status: 'completed' | 'in-progress' | 'abandoned' | string;
  pct: number | null;
  score: number | null;
  company: string | null;
  startedAt: string | null;
  endedAt: string | null;
}

export interface CandidateQuestionRound extends CandidateRoundBase {
  questions: CandidateQuestionResult[];
}

export interface CandidatePersonalRound extends CandidateRoundBase {
  feedback: CandidateInterviewFeedback | null;
  transcript: CandidateTranscriptMessage[];
}

export interface CandidateDetail {
  candidate: { id: string; name: string; email: string };
  rounds: {
    technical: CandidateQuestionRound | null;
    personal: CandidatePersonalRound | null;
    hr: CandidateQuestionRound | null;
  };
}

export function useCandidateDetail(candidateId: string | null) {
  const [data, setData] = useState<CandidateDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!candidateId) {
      setData(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiGet<CandidateDetail>(`/api/recruiter/candidates/${candidateId}`)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load candidate details');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [candidateId]);

  return { data, loading, error };
}
