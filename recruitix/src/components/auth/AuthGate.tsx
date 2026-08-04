import { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Lock, User as UserIcon, Calendar } from 'lucide-react';
import { apiPost, setToken } from '@/lib/api';
import { auth, googleProvider } from '@/lib/firebase';

interface AuthGateProps {
  onBack: () => void;
  onAuthenticated: () => Promise<void> | void;
}

const GoogleIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 48 48" aria-hidden="true">
    <path
      fill="#FFC107"
      d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
    />
    <path
      fill="#FF3D00"
      d="M6.3 14.7l6.6 4.8C14.7 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4c-7.7 0-14.3 4.4-17.7 10.7z"
    />
    <path
      fill="#4CAF50"
      d="M24 44c5.5 0 10.4-2.1 14.1-5.6l-6.5-5.5C29.5 34.7 26.9 36 24 36c-5.3 0-9.7-3.1-11.3-7.9l-6.5 5C9.6 39.5 16.2 44 24 44z"
    />
    <path
      fill="#1976D2"
      d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.9l6.5 5.5C41.4 36 44 30.5 44 24c0-1.3-.1-2.7-.4-3.5z"
    />
  </svg>
);

/** Email/password signup + sign-in against the Express API, plus Google via Firebase (verified server-side, issues the same app JWT). Face verification happens later, at the exam gate. */
const AuthGate = ({ onBack, onAuthenticated }: AuthGateProps) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const isSignupValid = name.trim() && email.trim() && dob && password.length >= 6;
  const isSigninValid = email.trim() && password.length > 0;

  const handleSubmit = async () => {
    setError('');
    setIsLoading(true);
    try {
      const path = mode === 'signup' ? '/api/auth/signup' : '/api/auth/login';
      const body = mode === 'signup' ? { name, email, dateOfBirth: dob, password } : { email, password };
      const { token } = await apiPost<{ token: string }>(path, body);
      setToken(token);
      await onAuthenticated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      const { token } = await apiPost<{ token: string }>('/api/auth/google', { idToken });
      setToken(token);
      await onAuthenticated();
    } catch (err) {
      // Not an error worth showing — the candidate just closed the Google popup themselves.
      const code = (err as { code?: string })?.code;
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return;
      setError(err instanceof Error ? err.message : 'Google sign-in failed. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="space-y-3 text-center">
            <CardTitle className="text-2xl text-gray-900">Recruitix Account</CardTitle>
            <CardDescription className="text-gray-500">
              {mode === 'signup' ? 'Create your candidate account' : 'Sign in to continue'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isLoading}
              className="w-full flex items-center justify-center gap-2.5 bg-white border border-gray-300 rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <GoogleIcon />
              {isGoogleLoading ? 'Connecting to Google...' : mode === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}
            </button>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">OR</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <div className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="text-gray-700 text-sm font-medium mb-2 block">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Your Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-gray-700 text-sm font-medium mb-2 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                  />
                </div>
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="text-gray-700 text-sm font-medium mb-2 block">Date of Birth</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-gray-700 text-sm font-medium mb-2 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                  />
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={isLoading || isGoogleLoading || (mode === 'signup' ? !isSignupValid : !isSigninValid)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg"
              >
                {isLoading ? 'Please wait...' : mode === 'signup' ? 'Sign Up' : 'Sign In'}
              </Button>

              <button
                onClick={() => {
                  setMode(mode === 'signin' ? 'signup' : 'signin');
                  setError('');
                }}
                className="w-full text-gray-500 hover:text-gray-800 text-sm py-2"
              >
                {mode === 'signin' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
              </button>
            </div>

            <Button
              onClick={onBack}
              variant="outline"
              className="w-full bg-transparent border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              Back
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthGate;
