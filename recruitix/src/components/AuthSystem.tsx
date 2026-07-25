
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';

interface AuthSystemProps {
  onLogin: (userInfo: any) => void;
  onBack: () => void;
}

const AuthSystem = ({ onLogin, onBack }: AuthSystemProps) => {
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot' | 'otp'>('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    otp: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  const simulateOTP = async (email: string) => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
    setMessage(`OTP sent to ${email}`);
    setMessageType('success');
    setAuthMode('otp');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (authMode === 'signup') {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }
        await simulateOTP(formData.email);
      } else if (authMode === 'forgot') {
        await simulateOTP(formData.email);
      } else if (authMode === 'otp') {
        // Simulate OTP verification
        await new Promise(resolve => setTimeout(resolve, 1500));
        if (formData.otp === '123456') {
          onLogin({
            email: formData.email,
            name: formData.name || formData.email.split('@')[0],
            id: Date.now().toString(),
          });
        } else {
          throw new Error('Invalid OTP. Use 123456 for demo');
        }
      } else {
        // Login
        await new Promise(resolve => setTimeout(resolve, 1500));
        onLogin({
          email: formData.email,
          name: formData.email.split('@')[0],
          id: Date.now().toString(),
        });
      }
    } catch (error: any) {
      setMessage(error.message);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
      <Card className="w-full max-w-md mx-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            {authMode === 'otp' ? (
              <Mail className="w-8 h-8 text-white" />
            ) : authMode === 'signup' ? (
              <User className="w-8 h-8 text-white" />
            ) : (
              <Lock className="w-8 h-8 text-white" />
            )}
          </div>
          <CardTitle className="text-2xl dark:text-white">
            {authMode === 'login' && 'Welcome Back'}
            {authMode === 'signup' && 'Create Account'}
            {authMode === 'forgot' && 'Reset Password'}
            {authMode === 'otp' && 'Verify OTP'}
          </CardTitle>
          <CardDescription className="dark:text-slate-300">
            {authMode === 'login' && 'Sign in to your account'}
            {authMode === 'signup' && 'Create your Recruitix account'}
            {authMode === 'forgot' && 'Enter your email to reset password'}
            {authMode === 'otp' && 'Enter the 6-digit code sent to your email'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {authMode !== 'otp' && (
              <div className="space-y-2">
                <Label htmlFor="email" className="dark:text-white">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="dark:bg-slate-700 dark:text-white dark:border-slate-600"
                />
              </div>
            )}

            {authMode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="name" className="dark:text-white">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter your full name"
                  required
                  className="dark:bg-slate-700 dark:text-white dark:border-slate-600"
                />
              </div>
            )}

            {(authMode === 'login' || authMode === 'signup') && (
              <div className="space-y-2">
                <Label htmlFor="password" className="dark:text-white">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="dark:bg-slate-700 dark:text-white dark:border-slate-600"
                />
              </div>
            )}

            {authMode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="dark:text-white">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="Confirm your password"
                  required
                  className="dark:bg-slate-700 dark:text-white dark:border-slate-600"
                />
              </div>
            )}

            {authMode === 'otp' && (
              <div className="space-y-2">
                <Label htmlFor="otp" className="dark:text-white">OTP Code</Label>
                <Input
                  id="otp"
                  value={formData.otp}
                  onChange={(e) => handleInputChange('otp', e.target.value)}
                  placeholder="Enter 6-digit OTP (use 123456 for demo)"
                  required
                  maxLength={6}
                  className="dark:bg-slate-700 dark:text-white dark:border-slate-600 text-center text-lg tracking-widest"
                />
              </div>
            )}

            {message && (
              <div className={`flex items-center space-x-2 text-sm ${
                messageType === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {messageType === 'success' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                <span>{message}</span>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-blue-500 hover:bg-blue-600"
              disabled={loading}
            >
              {loading ? 'Processing...' : 
                authMode === 'login' ? 'Sign In' :
                authMode === 'signup' ? 'Create Account' :
                authMode === 'forgot' ? 'Send Reset Link' :
                'Verify OTP'
              }
            </Button>

            <div className="text-center space-y-2 text-sm">
              {authMode === 'login' && (
                <>
                  <button
                    type="button"
                    onClick={() => setAuthMode('forgot')}
                    className="text-blue-500 hover:text-blue-600 dark:text-blue-400"
                  >
                    Forgot your password?
                  </button>
                  <div>
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setAuthMode('signup')}
                      className="text-blue-500 hover:text-blue-600 dark:text-blue-400"
                    >
                      Sign up
                    </button>
                  </div>
                </>
              )}

              {authMode === 'signup' && (
                <div>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className="text-blue-500 hover:text-blue-600 dark:text-blue-400"
                  >
                    Sign in
                  </button>
                </div>
              )}

              {(authMode === 'forgot' || authMode === 'otp') && (
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="text-blue-500 hover:text-blue-600 dark:text-blue-400"
                >
                  Back to login
                </button>
              )}
            </div>

            <div className="flex justify-center">
              <Button variant="ghost" onClick={onBack} className="flex items-center space-x-2">
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Home</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthSystem;
