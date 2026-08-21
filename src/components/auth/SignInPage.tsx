import React, { useState, useRef } from 'react';
import { Mail, Lock, ShieldCheck, AlertCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getAuthErrorMessage } from '../../utils/authErrors';

interface SignInPageProps {
  onNavigateToSignUp: () => void;
  onNavigateToHome: () => void;
}

export const SignInPage: React.FC<SignInPageProps> = ({ onNavigateToSignUp, onNavigateToHome }) => {
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Synchronous submission guard to prevent duplicate concurrent sign-in requests
  const isSubmittingRef = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    setError(null);

    const form = e.currentTarget as HTMLFormElement;
    const emailInput = form.elements.namedItem('email') as HTMLInputElement | null;
    const passwordInput = form.elements.namedItem('password') as HTMLInputElement | null;

    const actualEmail = (emailInput?.value && emailInput.value.trim() ? emailInput.value : email) || email;
    const actualPassword = (passwordInput?.value && passwordInput.value.length > 0 ? passwordInput.value : password);

    const normalizedEmail = actualEmail.trim().toLowerCase();

    if (!normalizedEmail) {
      setError('Please enter your email address.');
      isSubmittingRef.current = false;
      return;
    }
    if (!actualPassword) {
      setError('Please enter your password.');
      isSubmittingRef.current = false;
      return;
    }

    setLoading(true);
    try {
      await signIn(normalizedEmail, actualPassword);
    } catch (err: any) {
      console.error("Sign in error:", err?.code || err?.message || err);
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error("Google Sign In error:", err);
      setError(getAuthErrorMessage(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfcf8] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Top Navigation Back Link */}
      <div className="max-w-md w-full mx-auto mb-6">
        <button
          onClick={onNavigateToHome}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#2c3333] hover:text-olive transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>
      </div>

      <div className="max-w-md w-full mx-auto bg-clay rounded-3xl p-8 border border-warm card-shadow space-y-6">
        {/* Header */}
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#fdfcf8] text-olive border border-warm">
            <ShieldCheck className="w-3.5 h-3.5 text-olive" /> Nutri Guide Sign In
          </div>
          <h2 className="serif text-2xl font-bold text-[#2c3333] tracking-tight">
            Sign In to Your Account
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Welcome back! Enter your email and password to access your dashboard.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-[#faf6f0] border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <div className="font-medium">{error}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#2c3333] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                name="email"
                id="signin-email"
                autoComplete="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#fdfcf8] border border-warm rounded-full focus:ring-2 focus:ring-[#5a7d66]/20 focus:border-olive outline-none text-[#2c3333]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2c3333] mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                id="signin-password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
                className="w-full pl-10 pr-10 py-2.5 text-sm bg-[#fdfcf8] border border-warm rounded-full focus:ring-2 focus:ring-[#5a7d66]/20 focus:border-olive outline-none text-[#2c3333]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none focus:text-slate-600 p-0.5 rounded-full transition-colors cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full py-3 px-4 text-sm font-semibold text-white bg-olive hover:bg-[#4a6854] disabled:opacity-60 rounded-full shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Signing In...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-warm"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-clay px-2 text-slate-500 font-medium">Or continue with</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading || googleLoading}
          className="w-full py-2.5 px-4 text-sm font-semibold text-[#2c3333] bg-[#fdfcf8] hover:bg-white border border-warm rounded-full shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-60"
        >
          {googleLoading ? (
            <div className="w-4 h-4 border-2 border-slate-400 border-t-olive rounded-full animate-spin"></div>
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>Sign in with Google</span>
        </button>

        {/* Footer link to Sign Up */}
        <div className="text-center text-xs text-slate-600 border-t border-warm pt-4">
          Don't have an account yet?{' '}
          <button
            type="button"
            onClick={onNavigateToSignUp}
            className="text-olive font-bold hover:underline cursor-pointer"
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
};
