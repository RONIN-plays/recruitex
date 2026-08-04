import { useCallback, useEffect, useRef, useState } from 'react';
import { apiGet } from '@/lib/api';

export interface RoundResult {
  status: 'completed' | 'in-progress' | 'abandoned';
  pct: number | null;
  durationMin: number | null;
  updatedAt: string | null;
}

export interface RecruiterCandidate {
  id: string;
  name: string;
  email: string;
  registeredAt: string;
  faceEnrolled: boolean;
  appliedFor: string | null;
  technical: RoundResult | null;
  personal: RoundResult | null;
  hr: RoundResult | null;
  overallPct: number | null;
  completedRounds: number;
  violationsCount: number;
}

export interface RecruiterStats {
  totalCandidates: number;
  completed: number;
  inProgress: number;
  passRate: number;
  distribution: { excellent: number; good: number; average: number; belowAverage: number };
}

export interface LiveSession {
  sessionId: string;
  userId: string;
  candidateName: string;
  round: string;
  company: string | null;
  startedAt: string | null;
  integrityScore: number;
}

export interface RecentViolation {
  id: string;
  userId: string;
  userName: string;
  sessionId: string;
  type: string;
  severity: string;
  message: string;
  createdAt: string;
}

export interface RecruiterOverview {
  candidates: RecruiterCandidate[];
  stats: RecruiterStats;
  liveSessions: LiveSession[];
  recentViolations: RecentViolation[];
}

const POLL_INTERVAL_MS = 5000;

// Polling stands in for a push channel here — the backend has no websocket/SSE infra, so this
// is the simplest way to keep the dashboard reflecting MongoDB without adding that infra.
export function useRecruiterOverview() {
  const [data, setData] = useState<RecruiterOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    try {
      const result = await apiGet<RecruiterOverview>('/api/recruiter/overview');
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recruiter data');
    } finally {
      setLoading(false);
    }
  }, []);

  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    fetchOverview();
    intervalRef.current = setInterval(fetchOverview, POLL_INTERVAL_MS);
    return () => clearInterval(intervalRef.current);
  }, [fetchOverview]);

  return { data, loading, error, refetch: fetchOverview };
}
