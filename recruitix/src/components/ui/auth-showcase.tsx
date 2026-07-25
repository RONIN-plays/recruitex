import React, { useState } from "react";
import AuthPage from "../AuthPage";
import { ModernStunningSignIn } from "./modern-stunning-sign-in";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import { ArrowLeft, Shield, Users, Lock } from "lucide-react";

export function AuthShowcase() {
  const [currentView, setCurrentView] = useState<'showcase' | 'signin' | 'signup' | 'auth-page'>('showcase');
  const [user, setUser] = useState<any>(null);

  const handleAuthSuccess = (userData: any) => {
    setUser(userData);
    setCurrentView('showcase');
  };

  const handleSignOut = () => {
    setUser(null);
    setCurrentView('showcase');
  };

  if (currentView === 'signin') {
    return (
      <div className="relative">
        <ModernStunningSignIn
          onSignIn={(email, password) => {
            console.log("Sign in:", email, password);
            handleAuthSuccess({ email, displayName: "Demo User" });
          }}
          onGoogleSignIn={() => {
            console.log("Google sign in");
            handleAuthSuccess({ email: "user@gmail.com", displayName: "Google User" });
          }}
          onSignUp={() => setCurrentView('signup')}
        />
        <div className="absolute top-6 left-6 z-20">
          <Button 
            variant="outline" 
            onClick={() => setCurrentView('showcase')} 
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Showcase
          </Button>
        </div>
      </div>
    );
  }

  if (currentView === 'auth-page') {
    return (
      <AuthPage 
        onBack={() => setCurrentView('showcase')}
        onAuthSuccess={handleAuthSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black py-20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-black dark:text-white mb-4">
            Modern Authentication System
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Stunning glassmorphism design with secure authentication
          </p>
        </div>

        {user && (
          <div className="mb-8 text-center">
            <Card className="max-w-md mx-auto bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <CardContent className="p-4">
                <p className="text-green-800 dark:text-green-300">
                  Welcome back, {user.displayName}! ({user.email})
                </p>
                <Button 
                  onClick={handleSignOut}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <Card className="text-center p-6 hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-black dark:text-white mb-2">Secure Authentication</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Enterprise-grade security with email and Google OAuth integration
            </p>
          </Card>

          <Card className="text-center p-6 hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-black dark:text-white mb-2">User Management</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Comprehensive user profiles with role-based access control
            </p>
          </Card>

          <Card className="text-center p-6 hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-black dark:text-white mb-2">Glassmorphism UI</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Modern glass-like interface with backdrop blur and transparency effects
            </p>
          </Card>
        </div>

        {/* Demo Buttons */}
        <div className="text-center space-y-4">
          <h3 className="text-2xl font-bold text-black dark:text-white mb-6">
            Try the Authentication Components
          </h3>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              onClick={() => setCurrentView('signin')}
              className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100"
            >
              Modern Sign In Component
            </Button>
            
            <Button 
              onClick={() => setCurrentView('auth-page')}
              variant="outline"
              className="border-gray-300 dark:border-gray-700"
            >
              Complete Auth Page
            </Button>
          </div>

          {/* Demo Credentials */}
          <Card className="max-w-md mx-auto mt-8 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg">Demo Credentials</CardTitle>
              <CardDescription>Use these credentials to test the authentication</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Email:</span>
                  <span className="font-mono">demo@recruitix.com</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Password:</span>
                  <span className="font-mono">demo123</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}