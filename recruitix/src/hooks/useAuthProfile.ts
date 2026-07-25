import { useCallback, useEffect, useState } from 'react';
import { apiGet, getToken, clearToken, ApiError } from '@/lib/api';

export interface Profile {
  id: string;
  email: string;
  displayName: string | null;
  dateOfBirth: string | null;
  role: 'candidate' | 'recruiter';
  faceEnrolled: boolean;
  enrollmentStatus: 'pending' | 'in_progress' | 'completed';
}

interface AuthProfileState {
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

/**
 * Tracks the signed-in candidate's profile via the JWT stored in localStorage.
 * A non-null `profile` means "signed in" — there's no separate session concept like
 * Supabase's, since /api/auth/me returns identity + profile together in one call.
 */
export function useAuthProfile(): AuthProfileState {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!getToken()) {
      setProfile(null);
      setLoading(false);
      return;
    }
    try {
      const { user } = await apiGet<{ user: Profile }>('/api/auth/me');
      setProfile(user);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) clearToken();
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  return { profile, loading, refreshProfile };
}
