import { useState } from 'react';
import { ModernStunningSignIn } from '@/components/ui/modern-stunning-sign-in';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Lock, User as UserIcon, ArrowLeft } from 'lucide-react';

interface AuthPageProps {
  onBack?: () => void;
  onAuthSuccess?: (user: any) => void;
}

const AuthPage = ({ onBack, onAuthSuccess }: AuthPageProps) => {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [credentials, setCredentials] = useState({ email: '', password: '', name: '' });
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailAuth = async (email?: string, password?: string) => {
    setIsLoading(true);
    setAuthError('');
    
    const authEmail = email || credentials.email;
    const authPassword = password || credentials.password;
    
    try {
      // Simulate authentication
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (authEmail === 'demo@recruitix.com' && authPassword === 'demo123') {
        const user = {
          email: authEmail,
          displayName: credentials.name || 'Demo User',
          uid: 'demo_user_123'
        };
        onAuthSuccess?.(user);
      } else {
        setAuthError('Invalid credentials. Try demo@recruitix.com / demo123');
      }
    } catch (error) {
      setAuthError('Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setAuthError('');
    
    try {
      // Simulate Google authentication
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const user = {
        email: 'user@gmail.com',
        displayName: 'Google User',
        uid: 'google_user_123'
      };
      onAuthSuccess?.(user);
    } catch (error) {
      setAuthError('Google sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = () => {
    setAuthMode('signup');
  };

  if (authMode === 'signin') {
    return (
      <div className="relative">
        <ModernStunningSignIn
          onSignIn={handleEmailAuth}
          onGoogleSignIn={handleGoogleSignIn}
          onSignUp={handleSignUp}
          isLoading={isLoading}
          error={authError}
        />
        
        {/* Back button overlay */}
        {onBack && (
          <div className="absolute top-6 left-6 z-20">
            <Button 
              variant="outline" 
              onClick={onBack} 
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        )}
        
        {/* Demo credentials hint */}
        <div className="absolute bottom-6 right-6 z-20">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <p className="text-white text-sm font-medium mb-2">Demo Credentials:</p>
              <p className="text-gray-300 text-xs">Email: demo@recruitix.com</p>
              <p className="text-gray-300 text-xs">Password: demo123</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Sign up mode
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gray-400/20 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-gray-500/20 via-transparent to-transparent"></div>
      
      {/* Back button */}
      {onBack && (
        <div className="absolute top-6 left-6 z-20">
          <Button 
            variant="outline" 
            onClick={onBack} 
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      )}

      <Card className="w-full max-w-md mx-4 bg-white/10 backdrop-blur-sm border-white/10 rounded-3xl shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/20 mb-6 shadow-lg mx-auto">
            <img 
              src="/brain-logo.png" 
              alt="Recruitix Logo"
              className="w-8 h-8 object-contain"
            />
          </div>
          <CardTitle className="text-2xl text-white">Join Recruitix</CardTitle>
          <CardDescription className="text-gray-300">
            Create your account to get started
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <input
                type="text"
                value={credentials.name}
                onChange={(e) => setCredentials(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Full Name"
                className="w-full px-5 py-3 rounded-xl bg-white/10 text-white placeholder-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 border border-white/20"
              />
            </div>
            
            <div className="space-y-2">
              <input
                type="email"
                value={credentials.email}
                onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Email"
                className="w-full px-5 py-3 rounded-xl bg-white/10 text-white placeholder-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 border border-white/20"
              />
            </div>
            
            <div className="space-y-2">
              <input
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Password"
                className="w-full px-5 py-3 rounded-xl bg-white/10 text-white placeholder-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 border border-white/20"
              />
            </div>
          </div>

          {authError && (
            <div className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-md p-3">
              {authError}
            </div>
          )}

          <Button 
            onClick={() => handleEmailAuth()}
            disabled={isLoading || !credentials.email || !credentials.password || !credentials.name}
            className="w-full bg-white/10 text-white font-medium px-5 py-3 rounded-full shadow hover:bg-white/20 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>

          <hr className="opacity-10" />

          <Button 
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-b from-gray-700 to-gray-800 rounded-full px-5 py-3 font-medium text-white shadow hover:brightness-110 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="w-5 h-5"
            />
            Continue with Google
          </Button>

          <div className="text-center">
            <button
              onClick={() => setAuthMode('signin')}
              className="text-gray-400 hover:text-gray-300 text-sm"
            >
              Already have an account? Sign in
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;