import * as React from "react";
import { useState } from "react";
import { Brain } from "lucide-react";

interface SignInProps {
  onSignIn?: (email: string, password: string) => void;
  onGoogleSignIn?: () => void;
  onSignUp?: () => void;
  isLoading?: boolean;
  error?: string;
}

const ModernStunningSignIn = ({ 
  onSignIn, 
  onGoogleSignIn, 
  onSignUp, 
  isLoading = false, 
  error = "" 
}: SignInProps) => {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [localError, setLocalError] = React.useState("");

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSignIn = () => {
    if (!email || !password) {
      setLocalError("Please enter both email and password.");
      return;
    }
    if (!validateEmail(email)) {
      setLocalError("Please enter a valid email address.");
      return;
    }
    setLocalError("");
    onSignIn?.(email, password);
  };

  const displayError = error || localError;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800 relative overflow-hidden w-full">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gray-400/20 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-gray-500/20 via-transparent to-transparent"></div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-gray-400/20 to-gray-500/20 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-32 right-16 w-32 h-32 bg-gradient-to-r from-gray-600/20 to-gray-400/20 rounded-full blur-xl animate-pulse delay-1000"></div>

      {/* Centered glass card */}
      <div className="relative z-10 w-full max-w-sm rounded-3xl bg-gradient-to-r from-white/10 to-black/20 backdrop-blur-sm shadow-2xl p-8 flex flex-col items-center border border-white/10">
        {/* Logo */}
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/20 mb-6 shadow-lg">
          <img 
            src="/brain-logo.png" 
            alt="Recruitix Logo"
            className="w-8 h-8 object-contain"
            onError={(e) => {
              // Fallback to Brain icon if image fails to load
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <Brain className="w-6 h-6 text-white hidden" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-semibold text-white mb-6 text-center">Recruitix</h2>

        {/* Form */}
        <div className="flex flex-col w-full gap-4">
          <div className="w-full flex flex-col gap-3">
            <input
              placeholder="Email"
              type="email"
              value={email}
              className="w-full px-5 py-3 rounded-xl bg-white/10 text-white placeholder-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 border border-white/20"
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
            <input
              placeholder="Password"
              type="password"
              value={password}
              className="w-full px-5 py-3 rounded-xl bg-white/10 text-white placeholder-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 border border-white/20"
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
            {displayError && (
              <div className="text-sm text-red-400 text-left">{displayError}</div>
            )}
          </div>

          <hr className="opacity-10" />

          <div>
            <button
              onClick={handleSignIn}
              disabled={isLoading}
              className="w-full bg-white/10 text-white font-medium px-5 py-3 rounded-full shadow hover:bg-white/20 transition mb-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>

            {/* Google Sign In */}
            <button 
              onClick={onGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-b from-gray-700 to-gray-800 rounded-full px-5 py-3 font-medium text-white shadow hover:brightness-110 transition mb-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                alt="Google"
                className="w-5 h-5"
              />
              Continue with Google
            </button>

            <div className="w-full text-center mt-2">
              <span className="text-xs text-gray-400">
                Don&apos;t have an account?{" "}
                <button
                  onClick={onSignUp}
                  className="underline text-white/80 hover:text-white transition-colors"
                >
                  Sign up, it&apos;s free!
                </button>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* User count and avatars */}
      <div className="relative z-10 mt-12 flex flex-col items-center text-center">
        <p className="text-gray-400 text-sm mb-2">
          Join <span className="font-medium text-white">thousands</span> of
          companies who are already using Recruitix.
        </p>
        <div className="flex -space-x-2">
          <img
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face"
            alt="user"
            className="w-8 h-8 rounded-full border-2 border-gray-800 object-cover"
          />
          <img
            src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face"
            alt="user"
            className="w-8 h-8 rounded-full border-2 border-gray-800 object-cover"
          />
          <img
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face"
            alt="user"
            className="w-8 h-8 rounded-full border-2 border-gray-800 object-cover"
          />
          <img
            src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face"
            alt="user"
            className="w-8 h-8 rounded-full border-2 border-gray-800 object-cover"
          />
        </div>
      </div>
    </div>
  );
};

export { ModernStunningSignIn };