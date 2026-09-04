import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AlertCircle } from 'lucide-react';
import { FixMyCityLogo } from '../components/FixMyCityLogo';

export const LoginView: React.FC = () => {
  const { loginWithGoogle, navigate } = useApp();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const profile = await loginWithGoogle();
      if (profile) {
        // Redirect Citizens to the Citizen Dashboard and Administrators to the Issue Management page
        if (profile.role === 'admin') {
          navigate('issue-management');
        } else {
          navigate('dashboard');
        }
      } else {
        // Gracefully cancelled authentication
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Google Sign-In failed:", err);
      // Map Firebase auth errors or other errors to friendly, clear messages
      let friendlyMessage = 'Google Sign-In failed. Please try again.';
      if (err.code === 'auth/network-request-failed') {
        friendlyMessage = 'A network error occurred. Please check your connection and try again.';
      } else if (err.code === 'auth/internal-error') {
        friendlyMessage = 'An internal system error occurred. Please try again shortly.';
      } else if (err.code === 'auth/web-storage-unsupported') {
        friendlyMessage = 'Your browser cookie or local storage configuration is unsupported. Please enable cookies to sign in.';
      } else if (err.code === 'auth/popup-blocked') {
        friendlyMessage = 'The Google Sign-In popup was blocked by your browser. Please allow popups for this site.';
      } else if (err.message && err.message.toLowerCase().includes('firestore')) {
        friendlyMessage = 'We could not load or initialize your user profile. Please check back later.';
      } else if (err.message) {
        friendlyMessage = `Google Sign-In failed: ${err.message}`;
      }
      setError(friendlyMessage);
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans animate-fade-in" id="login-view">
      <div className="max-w-md w-full bg-white border border-gray-150 rounded-2xl p-8 shadow-sm">
        {/* Logo and Brand */}
        <div className="flex flex-col items-center text-center mb-8">
          <FixMyCityLogo size={48} showText={false} className="mb-4" />
          <h2 className="text-3xl font-display font-black text-gray-900 tracking-tight">
            FixMyCity
          </h2>
          <p className="mt-3 text-sm text-gray-600 leading-relaxed max-w-sm">
            The official portal for residents to report public maintenance issues and for municipal staff to manage, track, and dispatch resolutions.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 text-red-800 border border-red-150 p-4 rounded-xl flex items-start space-x-2 text-xs">
            <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Action Button */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-3 bg-white border border-gray-300 hover:border-gray-400 text-gray-700 hover:bg-gray-50 font-semibold py-3 px-4 rounded-xl shadow-xs transition-all cursor-pointer text-sm disabled:opacity-50"
            id="login-google-btn"
          >
            {loading ? (
              <span className="text-gray-500">Signing in...</span>
            ) : (
              <>
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>
        </div>

        {/* Info Footer */}
        <div className="mt-8 pt-6 border-t border-gray-100 text-center text-xs text-gray-400">
          Secure sign-in provided by Google. By continuing, you agree to the municipal terms of service and privacy policy.
        </div>
      </div>
    </div>
  );
};
